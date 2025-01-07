// Visual blocks for blog posts. A fenced code block whose language is
// "@name" (```@bars) holds YAML data; this module turns it into HTML that
// reads complete without JavaScript. css/blog-viz.css styles it and
// js/blog-viz.js animates it once armed. Catalog for writers:
// scripts/blog/components.md.
import YAML from "yaml";

const esc = (value = "") =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const numberFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const fmt = (n) => numberFormat.format(n);
const decimalsOf = (n) => (String(n).split(".")[1] || "").length;
const pad = (n) => String(n).padStart(2, "0");
const clamp01 = (n) => Math.min(1, Math.max(0, n));

// Stroke icons (never emoji): decorative, the text next to them carries the meaning.
const svg = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
export const ICONS = {
  check: svg('<path d="M4.5 12.5l5 5 10-11" />'),
  cross: svg('<path d="M6 6l12 12M18 6L6 18" />'),
  dash: svg('<path d="M6 12h12" />'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6" />'),
  bulb: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />'),
  alert: svg('<path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.5v.01" />'),
  plus: svg('<path d="M12 5v14M5 12h14" />'),
  chart: svg('<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />'),
  flask: svg('<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7.5 15h9" />'),
  search: svg('<circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />'),
};

class VizError extends Error {}
const fail = (name, message) => {
  throw new VizError(`bloque @${name}: ${message}`);
};

const list = (name, value, field, min = 1) => {
  if (!Array.isArray(value) || value.length < min) fail(name, `\`${field}\` debe ser una lista con al menos ${min} elemento(s)`);
  return value;
};
const num = (name, value, field) => {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) fail(name, `\`${field}\` debe ser un número (con punto decimal en el YAML)`);
  return n;
};
const text = (name, value, field) => {
  if (value === undefined || value === null || String(value).trim() === "") fail(name, `falta \`${field}\``);
  return String(value);
};

// Animated number: the final value is in the HTML, blog-viz.js counts up to it.
const counter = (value) =>
  `<span class="viz-count" data-count="${value}" data-decimals="${decimalsOf(value)}">${fmt(value)}</span>`;

const figure = (name, data, inner, h, extraClass = "") => {
  const title = data.title ? `\n  <figcaption class="viz-title">${h.inline(data.title)}</figcaption>` : "";
  const note = data.note ? `\n  <p class="viz-note">${h.inline(data.note)}</p>` : "";
  return `<figure class="viz viz-${name}${extraClass}" data-viz="${name}">${title}\n  ${inner}${note}\n</figure>\n`;
};

const RENDER = {
  stats(d, h) {
    const items = list("stats", d.items, "items").slice(0, 4);
    const lis = items
      .map((it, i) => {
        const value = num("stats", it.value, `items[${i}].value`);
        return `<li class="viz-stat" style="--i:${i}">
      <p class="viz-stat-value">${it.prefix ? esc(it.prefix) : ""}${counter(value)}${it.suffix ? `<span class="viz-stat-suffix">${esc(it.suffix)}</span>` : ""}</p>
      <p class="viz-stat-label">${h.inline(text("stats", it.label, `items[${i}].label`))}</p>${
        it.source ? `\n      <p class="viz-stat-source">${h.inline(it.source)}</p>` : ""
      }
    </li>`;
      })
      .join("\n    ");
    return figure("stats", d, `<ul class="viz-stats-list" style="--n:${items.length}">\n    ${lis}\n  </ul>`, h);
  },

  bars(d, h) {
    const items = list("bars", d.items, "items", 2);
    const values = items.map((it, i) => num("bars", it.value, `items[${i}].value`));
    const max = d.max !== undefined ? num("bars", d.max, "max") : Math.max(...values);
    const unit = d.unit ? esc(d.unit) : "";
    const lis = items
      .map(
        (it, i) => `<li class="viz-bar${it.highlight ? " is-highlight" : ""}" style="--v:${clamp01(values[i] / (max || 1)).toFixed(4)};--i:${i}">
      <span class="viz-bar-label">${h.inline(text("bars", it.label, `items[${i}].label`))}</span>
      <span class="viz-bar-track" aria-hidden="true"><span class="viz-bar-fill"></span></span>
      <span class="viz-bar-value">${counter(values[i])}${unit}</span>
    </li>`,
      )
      .join("\n    ");
    return figure("bars", d, `<ul class="viz-bars-list">\n    ${lis}\n  </ul>`, h);
  },

  split(d, h) {
    const items = list("split", d.items, "items", 2).slice(0, 6);
    const values = items.map((it, i) => num("split", it.value, `items[${i}].value`));
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const unit = d.unit ? esc(d.unit) : "";
    const segs = items
      .map((_, i) => {
        const share = (values[i] / total) * 100;
        return `<span class="viz-split-seg" data-tone="${i}" style="--w:${share.toFixed(3)}%;--i:${i}">${
          share >= 12 ? `<span class="viz-split-in">${fmt(values[i])}${unit}</span>` : ""
        }</span>`;
      })
      .join("");
    const legend = items
      .map(
        (it, i) =>
          `<li data-tone="${i}"><span class="viz-split-key" aria-hidden="true"></span><span class="viz-split-label">${h.inline(
            text("split", it.label, `items[${i}].label`),
          )}</span><strong>${fmt(values[i])}${unit}</strong></li>`,
      )
      .join("\n    ");
    return figure(
      "split",
      d,
      `<div class="viz-split-bar" aria-hidden="true">${segs}</div>\n  <ul class="viz-split-legend">\n    ${legend}\n  </ul>`,
      h,
    );
  },

  scale(d, h) {
    const min = num("scale", d.min ?? 0, "min");
    const zones = list("scale", d.zones, "zones", 2);
    const ends = zones.map((z, i) => num("scale", z.to, `zones[${i}].to`));
    const max = d.max !== undefined ? num("scale", d.max, "max") : ends[ends.length - 1];
    const unit = d.unit ? esc(d.unit) : "";
    const span = max - min || 1;
    let from = min;
    const zoneHtml = zones
      .map((z, i) => {
        const width = ((Math.min(ends[i], max) - from) / span) * 100;
        const html = `<li class="viz-scale-zone" data-zone="${Math.min(i, 3)}" style="--w:${width.toFixed(3)}%;--i:${i}">
      <span class="viz-scale-band" aria-hidden="true"></span>
      <span class="viz-scale-zone-label">${h.inline(text("scale", z.label, `zones[${i}].label`))}</span>
      <span class="viz-scale-range">${
        z.range ? esc(z.range) : i === 0 ? `≤ ${fmt(ends[i])}` : i === zones.length - 1 ? `&gt; ${fmt(from)}` : `${fmt(from)}–${fmt(ends[i])}`
      }${z.range ? "" : unit}</span>
    </li>`;
        from = ends[i];
        return html;
      })
      .join("\n    ");
    let marker = "";
    if (d.marker) {
      const value = num("scale", d.marker.value, "marker.value");
      const pos = clamp01((value - min) / span);
      const side = pos > 0.66 ? " is-right" : pos < 0.2 ? " is-left" : "";
      marker = `\n  <p class="viz-scale-marker${side}" style="--pos:${(pos * 100).toFixed(3)}%"><span class="viz-scale-pin" aria-hidden="true"></span><span class="viz-scale-marker-text"><strong>${fmt(value)}${unit}</strong>${
        d.marker.label ? ` ${h.inline(d.marker.label)}` : ""
      }</span></p>`;
    }
    return figure("scale", d, `<div class="viz-scale-body">${marker}\n  <ol class="viz-scale-zones">\n    ${zoneHtml}\n  </ol></div>`, h);
  },

  compare(d, h) {
    const side = (key) => {
      const s = d[key];
      if (!s || typeof s !== "object") fail("compare", `falta \`${key}\``);
      const tone = ["bad", "good", "neutral"].includes(s.tone) ? s.tone : key === "left" ? "bad" : "good";
      const icon = tone === "bad" ? ICONS.cross : tone === "good" ? ICONS.check : ICONS.dash;
      const items = list("compare", s.items, `${key}.items`)
        .map((it, i) => `<li style="--i:${i}"><span class="viz-compare-icon">${icon}</span><span>${h.inline(it)}</span></li>`)
        .join("\n        ");
      return `<div class="viz-compare-col" data-tone="${tone}">
      <p class="viz-compare-label">${h.inline(text("compare", s.label, `${key}.label`))}</p>
      <ul>
        ${items}
      </ul>
    </div>`;
    };
    return figure("compare", d, `<div class="viz-compare-grid">\n    ${side("left")}\n    ${side("right")}\n  </div>`, h);
  },

  flow(d, h) {
    const steps = list("flow", d.steps, "steps", 2).slice(0, 7);
    const lis = steps
      .map(
        (s, i) => `<li class="viz-flow-step" style="--i:${i}">
      <span class="viz-flow-index">${pad(i + 1)}</span>
      <p class="viz-flow-title">${h.inline(text("flow", s.title, `steps[${i}].title`))}</p>${
        s.text ? `\n      <p class="viz-flow-text">${h.inline(s.text)}</p>` : ""
      }${i < steps.length - 1 ? `\n      <span class="viz-flow-link" aria-hidden="true"><span></span>${ICONS.arrow}</span>` : ""}
    </li>`,
      )
      .join("\n    ");
    return figure("flow", d, `<ol class="viz-flow-list" style="--n:${steps.length}">\n    ${lis}\n  </ol>`, h, steps.length > 4 ? " viz-flow--long" : "");
  },

  timeline(d, h) {
    const items = list("timeline", d.items, "items", 2);
    const lis = items
      .map(
        (it, i) => `<li class="viz-timeline-item" style="--i:${i}">
      <p class="viz-timeline-date">${h.inline(text("timeline", it.date, `items[${i}].date`))}</p>
      <p class="viz-timeline-title">${h.inline(text("timeline", it.title, `items[${i}].title`))}</p>${
        it.text ? `\n      <p class="viz-timeline-text">${h.inline(it.text)}</p>` : ""
      }
    </li>`,
      )
      .join("\n    ");
    return figure("timeline", d, `<ol class="viz-timeline-list">\n    ${lis}\n  </ol>`, h);
  },

  checklist(d, h) {
    const items = list("checklist", d.items, "items", 2);
    const lis = items
      .map(
        (it, i) => `<li style="--i:${i}"><label class="viz-check-item"><input type="checkbox" /><span class="viz-check-box" aria-hidden="true">${ICONS.check}</span><span class="viz-check-text">${h.inline(
          typeof it === "object" ? text("checklist", it.text, `items[${i}].text`) : String(it),
        )}</span></label></li>`,
      )
      .join("\n    ");
    return figure(
      "checklist",
      d,
      `<ul class="viz-check-list">\n    ${lis}\n  </ul>\n  <div class="viz-check-progress" hidden><span class="viz-check-track" aria-hidden="true"><span class="viz-check-fill"></span></span><span class="viz-check-count" aria-live="polite">0 de ${items.length}</span></div>`,
      h,
    );
  },

  quiz(d, h) {
    const items = list("quiz", d.items, "items");
    const lis = items
      .map((it, i) => {
        if (typeof it.answer !== "boolean") fail("quiz", `\`items[${i}].answer\` debe ser true (verdad) o false (mito)`);
        return `<li class="viz-quiz-item" style="--i:${i}">
      <details class="viz-quiz-card" data-answer="${it.answer}">
        <summary><span class="viz-quiz-num">${pad(i + 1)}</span><span class="viz-quiz-claim">${h.inline(text("quiz", it.claim, `items[${i}].claim`))}</span><span class="viz-quiz-hint">Ver respuesta</span></summary>
        <div class="viz-quiz-answer">
          <p class="viz-quiz-verdict">${it.answer ? "Verdad" : "Mito"}</p>
          <p>${h.inline(text("quiz", it.explain, `items[${i}].explain`))}</p>
        </div>
      </details>
    </li>`;
      })
      .join("\n    ");
    return figure("quiz", d, `<ol class="viz-quiz-list">\n    ${lis}\n  </ol>\n  <p class="viz-quiz-score" hidden aria-live="polite"></p>`, h);
  },

  matrix(d, h) {
    const q = Array.isArray(d.quadrants) ? d.quadrants : [];
    const items = list("matrix", d.items, "items");
    const dots = items
      .map((it, i) => {
        const x = clamp01(num("matrix", it.x, `items[${i}].x`) / 100);
        const y = clamp01(num("matrix", it.y, `items[${i}].y`) / 100);
        const side = x > 0.6 ? " is-left" : "";
        return `<li class="viz-matrix-dot${side}" style="--x:${(x * 100).toFixed(2)}%;--y:${(y * 100).toFixed(2)}%;--i:${i}"><span class="viz-matrix-pin" aria-hidden="true"></span><span class="viz-matrix-label">${h.inline(
          text("matrix", it.label, `items[${i}].label`),
        )}</span></li>`;
      })
      .join("\n      ");
    const quad = (i) => (q[i] ? `<span class="viz-matrix-q" data-q="${i}">${h.inline(q[i])}</span>` : "");
    const axis = (key) => d[key] || {};
    const axisLine = (key, name) =>
      axis(key).low || axis(key).high
        ? `<li><span class="viz-matrix-axis-name">${name}</span>${h.inline(axis(key).low || "")} <span aria-hidden="true">→</span><span class="viz-sr"> a </span> ${h.inline(axis(key).high || "")}</li>`
        : "";
    return figure(
      "matrix",
      d,
      `<ul class="viz-matrix-legend">${axisLine("y", "Vertical")}${axisLine("x", "Horizontal")}</ul>
  <div class="viz-matrix-plot">
    <div class="viz-matrix-quads">${quad(0)}${quad(1)}${quad(2)}${quad(3)}</div>
    <ul class="viz-matrix-dots">
      ${dots}
    </ul>
  </div>`,
      h,
    );
  },

  tier(d, h) {
    const tiers = list("tier", d.tiers, "tiers", 2);
    const rows = tiers
      .map(
        (t, i) => `<li class="viz-tier-row" data-rank="${Math.min(i, 3)}" style="--i:${i}">
      <p class="viz-tier-badge"><span class="viz-tier-letter">${esc(text("tier", t.tier, `tiers[${i}].tier`))}</span>${
        t.label ? `<span class="viz-tier-label">${h.inline(t.label)}</span>` : ""
      }</p>
      <ul class="viz-tier-items">${list("tier", t.items, `tiers[${i}].items`)
        .map((it, j) => `<li style="--j:${j}">${h.inline(it)}</li>`)
        .join("")}</ul>
    </li>`,
      )
      .join("\n    ");
    return figure("tier", d, `<ol class="viz-tier-list">\n    ${rows}\n  </ol>`, h);
  },

  tabs(d, h) {
    const tabs = list("tabs", d.tabs, "tabs", 2).slice(0, 5);
    const panels = tabs
      .map(
        (t, i) => `<section class="viz-tab-panel" data-tab="${i}">
      <p class="viz-tab-label">${h.inline(text("tabs", t.label, `tabs[${i}].label`))}</p>
      <div class="viz-tab-body">${h.block(text("tabs", t.text, `tabs[${i}].text`))}</div>
    </section>`,
      )
      .join("\n    ");
    return figure("tabs", d, `<div class="viz-tabs-panels">\n    ${panels}\n  </div>`, h);
  },

  toggle(d, h) {
    const side = (key, i) => {
      const s = d[key];
      if (!s || typeof s !== "object") fail("toggle", `falta \`${key}\``);
      return `<section class="viz-toggle-panel" data-side="${i}">
      <p class="viz-toggle-label">${h.inline(text("toggle", s.label, `${key}.label`))}</p>
      <div class="viz-toggle-body">${h.block(text("toggle", s.text, `${key}.text`))}</div>
    </section>`;
    };
    return figure("toggle", d, `<div class="viz-toggle-panels">\n    ${side("a", 0)}\n    ${side("b", 1)}\n  </div>`, h);
  },

  calculator(d, h) {
    const inputs = list("calculator", d.inputs, "inputs").slice(0, 4);
    const factor = d.factor !== undefined ? num("calculator", d.factor, "factor") : 1;
    let result = factor;
    const fields = inputs
      .map((it, i) => {
        const value = num("calculator", it.value, `inputs[${i}].value`);
        const min = num("calculator", it.min ?? 0, `inputs[${i}].min`);
        const max = num("calculator", it.max ?? value * 4, `inputs[${i}].max`);
        const step = num("calculator", it.step ?? 1, `inputs[${i}].step`);
        result *= value;
        const unit = it.unit ? esc(it.unit) : "";
        return `<label class="viz-calc-field">
      <span class="viz-calc-row"><span class="viz-calc-label">${h.inline(text("calculator", it.label, `inputs[${i}].label`))}</span><output class="viz-calc-value" data-unit="${unit}">${fmt(value)}${unit}</output></span>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" style="--fill:${(clamp01((value - min) / (max - min || 1)) * 100).toFixed(2)}%" />
    </label>`;
      })
      .join("\n    ");
    const r = d.result || {};
    const unit = r.unit ? esc(r.unit) : "";
    return figure(
      "calculator",
      d,
      `<div class="viz-calc-grid" data-factor="${factor}">
    <div class="viz-calc-fields">
    ${fields}
    </div>
    <div class="viz-calc-result">
      <p class="viz-calc-result-label">${h.inline(r.label || "Resultado")}</p>
      <p class="viz-calc-total"><output data-unit="${unit}">${fmt(Math.round(result))}${unit}</output></p>
    </div>
  </div>`,
      h,
    );
  },

  chat(d, h) {
    const messages = list("chat", d.messages, "messages", 2);
    const lis = messages
      .map((m, i) => {
        const from = m.from === "ai" ? "ai" : "user";
        return `<li class="viz-chat-msg" data-from="${from}" style="--i:${i}"><span class="viz-chat-who">${from === "ai" ? "IA" : "Tú"}</span><div class="viz-chat-bubble">${h.block(
          text("chat", m.text, `messages[${i}].text`),
        )}</div></li>`;
      })
      .join("\n    ");
    return figure("chat", d, `<ol class="viz-chat-list">\n    ${lis}\n  </ol>`, h);
  },

  serp(d, h) {
    const results = list("serp", d.results, "results");
    const items = results
      .map(
        (r, i) => `<li class="viz-serp-result${r.highlight ? " is-highlight" : ""}" style="--i:${i}">
      <p class="viz-serp-site"><span class="viz-serp-favicon" aria-hidden="true">${esc(String(r.site || "w").charAt(0))}</span><span>${esc(text("serp", r.site, `results[${i}].site`))}${
        r.path ? ` <span class="viz-serp-path">› ${esc(r.path)}</span>` : ""
      }</span></p>
      <p class="viz-serp-title">${h.inline(text("serp", r.title, `results[${i}].title`))}</p>
      <p class="viz-serp-text">${h.inline(text("serp", r.text, `results[${i}].text`))}</p>
    </li>`,
      )
      .join("\n    ");
    const query = d.query ? `<p class="viz-serp-query"><span class="viz-serp-lens">${ICONS.search}</span>${esc(d.query)}</p>\n  ` : "";
    return figure("serp", d, `${query}<ol class="viz-serp-list">\n    ${items}\n  </ol>`, h);
  },

  terms(d, h) {
    const items = list("terms", d.items, "items");
    const rows = items
      .map(
        (it, i) =>
          `<div class="viz-term" style="--i:${i}"><dt>${h.inline(text("terms", it.term, `items[${i}].term`))}</dt><dd>${h.inline(
            text("terms", it.text, `items[${i}].text`),
          )}</dd></div>`,
      )
      .join("\n    ");
    return figure("terms", d, `<dl class="viz-terms-list">\n    ${rows}\n  </dl>`, h);
  },

  quote(d, h) {
    const words = text("quote", d.text, "text")
      .trim()
      .split(/\s+/)
      .map((w, i) => `<span class="viz-word" style="--w:${i}">${esc(w)}</span>`)
      .join(" ");
    if (d.author && !d.source) fail("quote", "una cita con `author` necesita `source` (la URL donde se dijo)");
    const cite = d.author
      ? `\n  <figcaption class="viz-quote-cite">${h.inline(d.author)}${
          d.source ? ` · <a href="${esc(d.source)}" target="_blank" rel="noopener">fuente</a>` : ""
        }</figcaption>`
      : "";
    return `<figure class="viz viz-quote" data-viz="quote">\n  <blockquote><p>${words}</p></blockquote>${cite}\n</figure>\n`;
  },

  marquee(d, h) {
    const items = list("marquee", d.items, "items", 3).slice(0, 10);
    const run = items.map((it) => `<span class="viz-marquee-item">${h.inline(it)}</span>`).join("");
    return `<figure class="viz viz-marquee" data-viz="marquee">
  <p class="viz-marquee-a11y">${items.map((it) => h.inline(it)).join(" · ")}</p>
  <div class="viz-marquee-track" aria-hidden="true"><div class="viz-marquee-run">${run}</div><div class="viz-marquee-run">${run}</div></div>
</figure>\n`;
  },
};

export const COMPONENT_NAMES = Object.keys(RENDER);

// helpers: { inline(md) -> html, block(md) -> html }, both from the post's
// Markdown instance so links follow the same rules as the body.
export function renderComponent(name, source, helpers) {
  const render = RENDER[name];
  if (!render) fail(name, `no existe. Componentes: ${COMPONENT_NAMES.map((n) => "@" + n).join(", ")}`);
  let data;
  try {
    data = YAML.parse(source);
  } catch (error) {
    fail(name, `YAML no válido: ${error.message.split("\n")[0]}`);
  }
  if (!data || typeof data !== "object") fail(name, "el bloque está vacío");
  return render(data, helpers);
}
