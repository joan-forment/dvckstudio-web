// Loads blog posts from content/blog, validates their front matter and turns
// the Markdown body into HTML. Pure data: templates.mjs decides how it looks.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Marked } from "marked";
import YAML from "yaml";
import { ICONS, renderComponent } from "./components.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "../..");
export const POSTS_DIR = path.join(ROOT, "content/blog/posts");
export const DRAFTS_DIR = path.join(ROOT, "content/blog/drafts");
export const SITE = "https://dvckstudio.com";
export const IMAGES_DIR = path.join(ROOT, "public/blog-images");

// Cover images live in public/blog-images, named after the post slug:
//   <slug>.webp      1600x900, post hero and JSON-LD
//   <slug>-800.webp  800x450, cards (optional, falls back to the big one)
//   <slug>-og.jpg    1200x630, social previews (optional, falls back to the site image)
// Found by file name so a new image shows up without touching the Markdown.
function findCover(slug) {
  const has = (name) => fs.existsSync(path.join(IMAGES_DIR, name));
  const url = (name) => `/blog-images/${name}`;
  if (!has(`${slug}.webp`)) return placeholderCover(slug);
  return {
    src: url(`${slug}.webp`),
    small: has(`${slug}-800.webp`) ? url(`${slug}-800.webp`) : null,
    og: has(`${slug}-og.jpg`) ? url(`${slug}-og.jpg`) : null,
  };
}

// Until a post gets its own cover, one of three house low-poly scenes stands in
// (same one for the same slug, so it does not change between builds). It is
// decorative (empty alt) and never used as the social or JSON-LD image.
const PLACEHOLDERS = 3;
function placeholderCover(slug) {
  const n = ([...slug].reduce((sum, c) => sum + c.charCodeAt(0), 0) % PLACEHOLDERS) + 1;
  return { src: `/blog-images/placeholder-${n}.webp`, small: `/blog-images/placeholder-${n}-800.webp`, og: null, placeholder: true };
}

// Fixed list so category URLs never change when a new post invents a label.
export const CATEGORIES = [
  { slug: "ia", name: "IA", description: "Inteligencia artificial aplicada al diseño, al código y al negocio: herramientas, flujos de trabajo y límites reales." },
  { slug: "desarrollo", name: "Desarrollo", description: "Desarrollo web moderno: HTML, CSS, JavaScript, rendimiento y buenas prácticas que se notan en producción." },
  { slug: "diseno", name: "Diseño", description: "Diseño web, UX/UI, tipografía y sistemas de diseño con criterio y ejemplos aplicables." },
  { slug: "seo", name: "SEO", description: "SEO técnico y de contenidos para que tu web aparezca en Google y en los buscadores con IA." },
  { slug: "negocio", name: "Negocio", description: "Estrategia digital, conversión y decisiones de producto para marcas y empresas." },
];

const WORDS_PER_MINUTE = 200;
// Placeholder for the number of numbered sections, filled after parsing.
const TOTAL_MARK = "%%H2TOTAL%%";

// Local calendar date (the studio works on Spanish time, not UTC).
export const localToday = () => new Date().toLocaleDateString("sv-SE");

export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// "Diseño Web: ¿qué?" -> "diseno-web-que". Used for heading ids.
export const slugify = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isExternal = (href) => /^https?:\/\//.test(href) && !href.startsWith(SITE);

// Callout boxes break the wall of text into things you can spot at a glance.
// Markdown: "> [!TRUCO] Optional title" (GitHub alert syntax, English names
// work too), or a paragraph that starts with a known bold label such as
// "**La trampa**: ...", which older drafts already use.
export const CALLOUTS = {
  truco: { icon: ICONS.bulb, label: "Truco" },
  ojo: { icon: ICONS.alert, label: "Ojo" },
  ventaja: { icon: ICONS.check, label: "Lo que ganas" },
  dato: { icon: ICONS.chart, label: "Dato" },
  ejemplo: { icon: ICONS.flask, label: "Ejemplo" },
};
const CALLOUT_ALIASES = { tip: "truco", note: "dato", important: "ojo", warning: "ojo", caution: "ojo" };
const LABEL_CALLOUTS = {
  "la trampa": "ojo",
  ojo: "ojo",
  cuidado: "ojo",
  importante: "ojo",
  truco: "truco",
  consejo: "truco",
  "lo que ganas": "ventaja",
  ventaja: "ventaja",
  dato: "dato",
  ejemplo: "ejemplo",
};

const callout = (type, title, body) => {
  const { icon, label } = CALLOUTS[type];
  return `<div class="post-callout post-callout--${type}" role="note">
<p class="post-callout-label"><span class="post-callout-icon">${icon}</span>${title || label}</p>
${body}</div>\n`;
};

// "dejas de leer" -> "Dejas de leer", skipping a leading tag.
const capitalize = (html) => html.replace(/^(\s*(?:<[^>]+>)*\s*)(\p{Ll})/u, (_, lead, c) => lead + c.toUpperCase());

// linkable: slugs that will exist on the site. A link to any other post is
// rendered as plain text, so a post published before the one it links to
// never ships a 404; the link appears on the first build after both exist.
function createMarkdown(headings, linkable, missing) {
  const marked = new Marked({ gfm: true });
  const usedIds = new Set();

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(html) || `seccion-${usedIds.size + 1}`;
        while (usedIds.has(id)) id += "-2";
        usedIds.add(id);
        // "## 3. Title" gets an "03 / 07" counter above the title: lists of N
        // things become something you can count while scrolling. The total
        // is only known at the end (see renderMarkdown).
        const numbered = depth === 2 && html.match(/^(\d{1,2})\.\s+(.+)$/s);
        if (depth === 2) headings.push({ id, html: numbered ? numbered[2] : html });
        if (numbered)
          return `<h2 id="${id}" class="post-h2-numbered"><span class="post-h2-num">${numbered[1].padStart(2, "0")}<span class="post-h2-of" aria-hidden="true"> / ${TOTAL_MARK}</span></span><span class="post-h2-text">${numbered[2]}</span></h2>\n`;
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      blockquote({ tokens, text }) {
        const alert = text.match(/^\[!([A-Za-z]+)\][^\S\n]*(.*)(?:\n|$)/);
        const type = alert && (CALLOUT_ALIASES[alert[1].toLowerCase()] || alert[1].toLowerCase());
        if (!CALLOUTS[type]) return `<blockquote>\n${this.parser.parse(tokens)}</blockquote>\n`;
        const body = this.parser.parse(marked.lexer(text.slice(alert[0].length)));
        return callout(type, alert[2] ? marked.parseInline(alert[2]) : "", body);
      },
      paragraph({ tokens }) {
        const html = this.parser.parseInline(tokens);
        const [first, next] = tokens;
        if (first?.type === "strong") {
          const label = first.text.replace(/:$/, "").trim();
          const type = LABEL_CALLOUTS[label.toLowerCase()];
          const hasColon = first.text.endsWith(":") || (next?.type === "text" && next.raw.startsWith(":"));
          if (type && hasColon) {
            const rest = html.replace(/^<strong>[\s\S]*?<\/strong>\s*:?\s*/, "");
            return callout(type, escapeHtml(label), `<p>${capitalize(rest)}</p>\n`);
          }
        }
        return `<p>${html}</p>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const target = href.match(/^\/blog\/([a-z0-9-]+)(?:[?#].*)?$/)?.[1];
        if (target && !target.startsWith("categoria") && !linkable.has(target)) {
          missing.add(target);
          return text;
        }
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        const external = isExternal(href) ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${escapeHtml(href)}"${titleAttr}${external}>${text}</a>`;
      },
      image({ href, title, text }) {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" decoding="async" />`;
      },
      code({ text, lang }) {
        const language = (lang || "").trim().split(/\s+/)[0];
        // ```@bars and friends: visual components (see components.md).
        if (language.startsWith("@"))
          return renderComponent(language.slice(1), text, {
            inline: (md) => marked.parseInline(String(md)),
            block: (md) => this.parser.parse(marked.lexer(String(md))),
          });
        const label = language ? ` data-lang="${escapeHtml(language)}"` : "";
        return `<div class="post-code"${label}><pre><code>${escapeHtml(text)}</code></pre></div>\n`;
      },
      table(token) {
        const cell = (c) => this.parser.parseInline(c.tokens);
        const align = (c) => (c.align ? ` style="text-align:${c.align}"` : "");
        const head = token.header.map((c) => `<th${align(c)}>${cell(c)}</th>`).join("");
        const rows = token.rows
          .map((row) => `<tr>${row.map((c) => `<td${align(c)}>${cell(c)}</td>`).join("")}</tr>`)
          .join("\n");
        return `<div class="post-table"><table>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${rows}\n</tbody></table></div>\n`;
      },
      // Posts can be machine-written: raw HTML is shown as text, never run.
      html({ text }) {
        return escapeHtml(text);
      },
    },
  });

  return marked;
}

export function renderMarkdown(markdown, linkable = new Set()) {
  const headings = [];
  const missing = new Set();
  let html = createMarkdown(headings, linkable, missing).parse(markdown);
  const total = (html.match(/class="post-h2-numbered"/g) || []).length;
  html = html.replaceAll(TOTAL_MARK, String(total).padStart(2, "0"));
  return { html, headings, missing: [...missing] };
}

// For short front matter strings (TL;DR, FAQ answers): **bold**, `code`, links.
// Marked already escapes text and code spans; escaping the input first would
// double-escape code (`loading="lazy"` showed as &quot;), so only raw HTML
// is escaped here.
const inline = new Marked({ gfm: true, renderer: { html: ({ text }) => escapeHtml(text) } });
export const renderInline = (text) => inline.parseInline(text);

function parseFile(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: falta el bloque de front matter (--- ... ---)`);
  return { data: YAML.parse(match[1]) || {}, body: match[2].trim(), raw };
}

// Front matter dates may come back as Date objects or strings.
const toISODate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
};

function validate(post, file, isDraft) {
  const errors = [];
  const d = post.data;
  if (!d.title || typeof d.title !== "string") errors.push("title es obligatorio");
  if (!d.description || typeof d.description !== "string") errors.push("description es obligatoria");
  if (!CATEGORIES.some((c) => c.slug === d.category))
    errors.push(`category debe ser una de: ${CATEGORIES.map((c) => c.slug).join(", ")}`);
  if (!isDraft && !toISODate(d.date)) errors.push("date (AAAA-MM-DD) es obligatoria en un post publicado");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug))
    errors.push("el nombre del archivo debe ser un slug: minúsculas, números y guiones");
  // SEO rule from AGENTS.md: the secondary brand spelling never goes in titles.
  if (/duck\s*studio/i.test(`${d.title} ${d.seoTitle || ""}`))
    errors.push('"Duck Studio" no puede ir en el título');
  // Ignore fenced code: a Markdown or shell example may start lines with "#".
  if (/^#\s/m.test(post.body.replace(/^```[\s\S]*?^```/gm, ""))) errors.push("el cuerpo no puede tener un # (h1): el título ya es el h1; empieza en ##");
  if (errors.length) throw new Error(`${path.relative(ROOT, file)}:\n  - ${errors.join("\n  - ")}`);

  const warnings = [];
  if (d.description.length < 110 || d.description.length > 165)
    warnings.push(`description tiene ${d.description.length} caracteres (ideal 120-160)`);
  const fullTitle = `${d.seoTitle || d.title} — DvckStudio`;
  if (fullTitle.length > 70) warnings.push(`el <title> tiene ${fullTitle.length} caracteres (ideal ≤ 70): añade seoTitle`);
  return warnings;
}

function loadDir(dir, isDraft) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name) => {
      const file = path.join(dir, name);
      const { data, body } = parseFile(file);
      const post = { slug: name.replace(/\.md$/, ""), file, data, body, isDraft };
      const warnings = validate(post, file, isDraft);
      const words = body.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
      const category = CATEGORIES.find((c) => c.slug === data.category);
      const cover = findCover(post.slug);
      const imageAlt = typeof data.imageAlt === "string" ? data.imageAlt.trim() : "";
      if (cover.placeholder) warnings.push(`sin portada propia (sale una provisional): genérala en el estudio del blog`);
      else if (!imageAlt) warnings.push("tiene imagen pero no imageAlt: describe la imagen en el front matter");
      return {
        slug: post.slug,
        file,
        isDraft,
        warnings,
        title: data.title.trim(),
        seoTitle: (data.seoTitle || data.title).trim(),
        description: data.description.trim(),
        date: toISODate(data.date),
        updated: toISODate(data.updated),
        created: toISODate(data.created),
        // Note left by the automated reviewer (npm run blog:draft); never rendered.
        revision: typeof data.revision === "string" ? data.revision.trim() : "",
        category,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        tldr: Array.isArray(data.tldr) ? data.tldr.map(String) : [],
        faq: Array.isArray(data.faq) ? data.faq.filter((f) => f && f.q && f.a) : [],
        sources: Array.isArray(data.sources) ? data.sources.filter((s) => s && s.url) : [],
        cover: { ...cover, alt: cover.placeholder ? "" : imageAlt },
        body,
        words,
        minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
        url: `/blog/${post.slug}`,
      };
    });
}

// Markdown is rendered once the full set of posts is known (see linkable).
function render(posts, linkable) {
  return posts.map((post) => {
    let rendered;
    try {
      rendered = renderMarkdown(post.body, linkable);
    } catch (error) {
      throw new Error(`${path.relative(ROOT, post.file)}: ${error.message}`);
    }
    const { html, headings, missing } = rendered;
    const warnings = [
      ...post.warnings,
      ...missing.map((slug) => `enlaza a /blog/${slug}, que no está publicado: sale como texto hasta que lo esté`),
    ];
    return { ...post, html, headings, warnings };
  });
}

// Drafts get today's date so they sort and render like the post they will be.
export function loadPosts({ includeDrafts = false } = {}) {
  const today = localToday();
  const published = loadDir(POSTS_DIR, false);
  const drafts = includeDrafts ? loadDir(DRAFTS_DIR, true).map((p) => ({ ...p, date: today })) : [];
  const linkable = new Set([...published, ...drafts].map((p) => p.slug));
  const posts = render([...published, ...drafts], linkable);

  const seen = new Set();
  for (const post of posts) {
    if (seen.has(post.slug)) throw new Error(`Slug duplicado entre posts y borradores: ${post.slug}`);
    seen.add(post.slug);
  }

  // Newest first; same-day posts keep a stable order by slug.
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

// Drafts may link to each other: warnings only flag links to missing files.
export function loadDrafts() {
  const drafts = loadDir(DRAFTS_DIR, true);
  const linkable = new Set([...loadDir(POSTS_DIR, false), ...drafts].map((p) => p.slug));
  return render(drafts, linkable).sort(
    (a, b) => (a.created || "9999").localeCompare(b.created || "9999") || a.slug.localeCompare(b.slug),
  );
}

const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDate = (iso) => dateFormat.format(new Date(`${iso}T00:00:00Z`));
