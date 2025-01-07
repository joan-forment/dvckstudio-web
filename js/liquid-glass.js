// Liquid glass: React Bits' FluidGlass "bar" (clear glass, ior 1.15, thick
// rounded rim, chromatic aberration) rebuilt for DOM elements. Each element
// gets its own SVG filter whose displacement map bends the backdrop inward
// across a round fillet, with an RGB split for chromatic aberration.
//
// Only Chromium renders url() filters inside backdrop-filter, and SVG filters
// on a moving backdrop cost too much on phones, so refraction is limited to
// Chromium with a fine pointer. Safari and Firefox on desktop cannot filter
// the backdrop, so a WebGL scene behind the glass (js/liquid-glass-webgl.js)
// bends its own pixels under each panel instead. Everything else keeps the
// CSS blur fallback.

const SVG_NS = "http://www.w3.org/2000/svg";
// Map resolution relative to the element. The map is smooth, so half is plenty.
const MAP_SCALE = 0.5;
// Softens the fillet's slope at the very rim so it stays finite.
const RIM_SOFTNESS = 0.15;

const refracts =
  typeof window !== "undefined" &&
  !!navigator.userAgentData?.brands?.some((b) => b.brand === "Chromium") &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (refracts) document.documentElement.classList.add("lg-refract");

// Panels a WebGL backdrop can refract for browsers without backdrop filters.
export const canvasRefracts =
  typeof window !== "undefined" &&
  !refracts &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;
export const glassPanels = new Set();

let defs = null;
let nextId = 0;

function getDefs() {
  if (defs) return defs;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  defs = document.createElementNS(SVG_NS, "defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}

function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// Signed distance to a rounded rectangle centred on the origin.
function sdRoundRect(x, y, hw, hh, r) {
  const qx = Math.abs(x) - hw + r;
  const qy = Math.abs(y) - hh + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

// R/G encode the x/y displacement (0.5 = none). Inside the bevel the vector
// points inward and follows the slope of a quarter-circle fillet: steep at
// the rim, flat towards the centre, like light through a thick glass bar.
function buildMap(w, h, radius, bevel) {
  const cw = Math.max(2, Math.round(w * MAP_SCALE));
  const ch = Math.max(2, Math.round(h * MAP_SCALE));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(cw, ch);
  const data = img.data;
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(radius, hw, hh);
  const e = 0.5;
  const slopeMax = 1 / Math.sqrt(RIM_SOFTNESS);

  for (let j = 0; j < ch; j++) {
    const y = (j + 0.5) / MAP_SCALE - hh;
    for (let i = 0; i < cw; i++) {
      const x = (i + 0.5) / MAP_SCALE - hw;
      const d = sdRoundRect(x, y, hw, hh, r);
      const t = Math.min(Math.max(-d / bevel, 0), 1);
      const k = (i + j * cw) * 4;
      let dx = 0;
      let dy = 0;
      if (t < 1) {
        // Outward normal from the SDF gradient.
        const gx = sdRoundRect(x + e, y, hw, hh, r) - sdRoundRect(x - e, y, hw, hh, r);
        const gy = sdRoundRect(x, y + e, hw, hh, r) - sdRoundRect(x, y - e, hw, hh, r);
        const len = Math.hypot(gx, gy) || 1;
        const u = 1 - t;
        const m = u / Math.sqrt(1 - u * u + RIM_SOFTNESS) / slopeMax;
        dx = (-gx / len) * m;
        dy = (-gy / len) * m;
      }
      data[k] = Math.round(127.5 + dx * 127.5);
      data[k + 1] = Math.round(127.5 + dy * 127.5);
      data[k + 2] = 128;
      data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

const CHANNELS = [
  ["r", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
  ["g", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
  ["b", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"],
];

function createFilter(id) {
  const filter = el("filter", {
    id,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const image = el("feImage", { preserveAspectRatio: "none", result: "map" });
  filter.appendChild(image);
  const maps = CHANNELS.map(([c, matrix]) => {
    const map = el("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "map",
      xChannelSelector: "R",
      yChannelSelector: "G",
      result: `d${c}`,
    });
    filter.append(map, el("feColorMatrix", { in: `d${c}`, type: "matrix", values: matrix, result: c }));
    return map;
  });
  filter.append(
    el("feComposite", { in: "r", in2: "g", operator: "arithmetic", k2: 1, k3: 1, result: "rg" }),
    el("feComposite", { in: "rg", in2: "b", operator: "arithmetic", k2: 1, k3: 1 }),
  );
  getDefs().appendChild(filter);
  return { filter, image, maps };
}

/**
 * Turn `node` into a liquid glass panel. Styling lives in the `.liquid-glass`
 * rules; this adds the refraction filter and, with `track`, a pointer glare.
 *
 * @param {HTMLElement} node
 * @param {{ strength?: number, bevel?: number, aberration?: number, track?: boolean }} [options]
 *   strength: max refraction in px. bevel: rim width in px.
 *   aberration: extra displacement per colour channel (0.06 = 6%).
 *   track: write --mx/--my from the pointer for the glare.
 */
export function initLiquidGlass(node, options = {}) {
  const { strength = 60, bevel = 70, aberration = 0.12, track = false } = options;
  node.classList.add("liquid-glass");

  if (track && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let frame = 0;
    node.addEventListener("pointermove", (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        node.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      });
    });
  }

  if (canvasRefracts) glassPanels.add({ node, strength, bevel, aberration });
  if (!refracts) return;

  const id = `lg-${nextId++}`;
  const { filter, image, maps } = createFilter(id);
  let lastKey = "";

  const update = () => {
    // Layout size, not the transformed box: the filter works in local space.
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    if (!w || !h) return;
    // Re-applied every time: gsap clearProps can wipe the inline style.
    node.style.setProperty("--lg-url", `url(#${id})`);
    const radius = parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0;
    const key = `${w}x${h}r${radius}`;
    if (key === lastKey) return;
    lastKey = key;

    const rim = Math.min(bevel, w / 2, h / 2);
    for (const target of [filter, image]) {
      target.setAttribute("x", 0);
      target.setAttribute("y", 0);
      target.setAttribute("width", w);
      target.setAttribute("height", h);
    }
    image.setAttribute("href", buildMap(w, h, radius, rim));
    // feDisplacementMap shifts by scale * (value - 0.5), so scale = 2 * max px.
    maps.forEach((map, i) => map.setAttribute("scale", (strength * 2 * (1 + aberration * i)).toFixed(2)));
  };

  update();
  let pending = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(update);
  }).observe(node);
}
