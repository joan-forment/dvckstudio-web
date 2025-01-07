// Blog posts: table of contents (active section + smooth jumps with Lenis),
// copy buttons for code blocks and for the post link, the progress pill and
// the visual components (blog-viz.js).
import { initViz } from "./blog-viz.js";

const phoneQuery = window.matchMedia("(max-width: 1000px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Short confirmation on a button, then back to its label.
function flash(button, text) {
  const label = button.dataset.label || button.textContent;
  button.dataset.label = label;
  button.textContent = text;
  clearTimeout(button._flashTimer);
  button._flashTimer = setTimeout(() => (button.textContent = label), 1800);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function initToc() {
  const toc = document.querySelector(".post-toc");
  if (!toc) return;

  // Open by default in the HTML (works without JS); folded on phones so the
  // article starts right away.
  if (phoneQuery.matches) toc.open = false;

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      if (phoneQuery.matches) toc.open = false;
      // Lenis owns the scroll on desktop; a native jump would be undone.
      if (window.lenis) {
        event.preventDefault();
        window.lenis.scrollTo(target, { offset: -110, immediate: reducedMotion.matches });
        history.replaceState(null, "", link.hash);
      }
    });
  });

  if (!targets.length) return;

  // The active entry is the last heading that has crossed the top third.
  // One read per frame at most: a handful of headings, no layout writes.
  let queued = false;
  const setActive = () => {
    queued = false;
    let current = null;
    for (const target of targets) {
      if (target.getBoundingClientRect().top < window.innerHeight * 0.35) current = target;
    }
    links.forEach((link) => link.classList.toggle("is-active", Boolean(current) && link.hash === `#${current.id}`));
  };
  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(setActive);
    },
    { passive: true },
  );
  setActive();
}

function initCodeCopy() {
  document.querySelectorAll(".post-code").forEach((block) => {
    const code = block.querySelector("code");
    if (!code) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "post-code-copy";
    button.textContent = "Copiar";
    button.addEventListener("click", async () => {
      flash(button, (await copyText(code.textContent)) ? "¡Copiado!" : "No se pudo copiar");
    });
    block.appendChild(button);
  });
}

function initLinkCopy() {
  document.querySelectorAll(".post-copy-link").forEach((button) => {
    button.addEventListener("click", async () => {
      flash(button, (await copyText(button.dataset.url)) ? "¡Enlace copiado!" : "No se pudo copiar");
    });
  });
}

// Floating pill: "3/9 · quedan 2 min". Knowing how much is left makes a long
// read feel finite.
function initProgress() {
  const body = document.querySelector(".post-body");
  const pill = document.querySelector(".post-progress");
  if (!body || !pill) return;
  const text = pill.querySelector(".post-progress-text");
  const end = document.querySelector(".post-sources, .post-share--end") || body;
  const minutes = Number(body.dataset.minutes) || 1;
  const headings = Array.from(body.querySelectorAll(":scope > h2, .post-faq > h2"));
  pill.hidden = false;

  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    const rect = body.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (vh * 0.5 - rect.top) / rect.height));
    // Out of the way once the article is over (sources and share buttons).
    pill.classList.toggle("is-visible", rect.top < vh * 0.4 && end.getBoundingClientRect().top > vh * 0.6);
    pill.style.setProperty("--p", String(Math.round(progress * 100)));

    const current = headings.filter((h) => h.offsetParent && h.getBoundingClientRect().top < vh * 0.35).length;
    const visible = headings.filter((h) => h.offsetParent).length;
    const left = Math.ceil(minutes * (1 - progress));
    const section = visible && current ? `${current}/${visible} · ` : "";
    text.textContent = left > 0 ? `${section}quedan ${left} min` : `${section}menos de 1 min`;
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
}

function init() {
  initToc();
  initCodeCopy();
  initLinkCopy();
  initProgress();
  initViz();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
