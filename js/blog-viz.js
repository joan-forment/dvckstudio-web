// Blog visual components (```@name blocks rendered by scripts/blog/components.mjs).
// The HTML is complete without JavaScript; this module adds the entrance
// animations (only when motion is allowed) and the interactive parts:
// checklist, quiz, tabs, toggle, calculator, chat playback and the quote
// that lights up word by word. Exported so the blog studio preview can run it.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const numberFormat = (decimals) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Storage can throw (private mode, blocked site data): everything still works,
// it just is not remembered.
const store = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const easeOut = (t) => 1 - Math.pow(1 - t, 4);

// Tweens a number shown in el from `from` to `to`; format turns it into text.
function tween(el, from, to, format, duration = 1400) {
  cancelAnimationFrame(el._vizFrame);
  if (reducedMotion.matches || from === to) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format(from + (to - from) * easeOut(t));
    if (t < 1) el._vizFrame = requestAnimationFrame(step);
  };
  el._vizFrame = requestAnimationFrame(step);
}

function countUp(viz) {
  viz.querySelectorAll(".viz-count").forEach((el) => {
    const decimals = Number(el.dataset.decimals) || 0;
    const format = numberFormat(decimals);
    tween(el, 0, Number(el.dataset.count), (n) => format.format(n));
  });
}

// Chat: messages appear in order; the assistant "types" first. Hidden
// messages keep their space (visibility), so nothing below jumps.
function playChat(viz) {
  const messages = Array.from(viz.querySelectorAll(".viz-chat-msg"));
  let delay = 250;
  messages.forEach((msg) => {
    const isAi = msg.dataset.from === "ai";
    if (isAi) {
      const typing = document.createElement("span");
      typing.className = "viz-chat-typing";
      typing.setAttribute("aria-hidden", "true");
      typing.innerHTML = "<i></i><i></i><i></i>";
      msg.append(typing);
      setTimeout(() => msg.classList.add("is-typing"), delay);
      delay += 1100;
    }
    setTimeout(() => {
      msg.classList.remove("is-typing");
      msg.classList.add("is-shown");
    }, delay);
    delay += isAi ? 700 : 850;
  });
}

const ON_ENTER = { stats: countUp, bars: countUp, chat: playChat };

function initReveal(root) {
  const blocks = Array.from(root.querySelectorAll(".viz:not([data-viz-ready])"));
  const headings = Array.from(root.querySelectorAll(".post-body > h2:not([data-viz-ready])"));
  [...blocks, ...headings].forEach((el) => (el.dataset.vizReady = ""));
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        entry.target.classList.add("is-in");
        ON_ENTER[entry.target.dataset.viz]?.(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.2 },
  );

  blocks.forEach((viz) => {
    viz.classList.add("is-armed");
    // Counters start at zero while the block is still hidden.
    viz.querySelectorAll(".viz-count").forEach((el) => {
      el.textContent = numberFormat(Number(el.dataset.decimals) || 0).format(0);
    });
    observer.observe(viz);
  });
  headings.forEach((h2) => {
    h2.classList.add("is-armed");
    observer.observe(h2);
  });
}

function initChecklists(root) {
  root.querySelectorAll(".viz-checklist").forEach((viz, index) => {
    const boxes = Array.from(viz.querySelectorAll('input[type="checkbox"]'));
    const progress = viz.querySelector(".viz-check-progress");
    const count = viz.querySelector(".viz-check-count");
    const key = `viz-check:${location.pathname}:${index}`;
    const saved = store.get(key);
    if (Array.isArray(saved)) boxes.forEach((box, i) => (box.checked = Boolean(saved[i])));
    progress.hidden = false;

    const update = () => {
      const done = boxes.filter((b) => b.checked).length;
      viz.style.setProperty("--done", String(done / boxes.length));
      count.textContent = done === boxes.length ? "Hecho. Ni tan mal." : `${done} de ${boxes.length}`;
      viz.classList.toggle("is-complete", done === boxes.length);
    };
    boxes.forEach((box) =>
      box.addEventListener("change", () => {
        store.set(key, boxes.map((b) => b.checked));
        update();
      }),
    );
    update();
  });
}

// Quiz: each card asks "¿Verdad o mito?" with two buttons; the answer (the
// same one <details> shows without JS) opens after the guess.
function initQuizzes(root) {
  root.querySelectorAll(".viz-quiz").forEach((viz) => {
    const cards = Array.from(viz.querySelectorAll(".viz-quiz-card"));
    const score = viz.querySelector(".viz-quiz-score");
    let answered = 0;
    let right = 0;

    cards.forEach((card) => {
      const summary = card.querySelector("summary");
      const answer = card.querySelector(".viz-quiz-answer");
      const truth = card.dataset.answer === "true";

      // Rebuild as a plain card: buttons cannot live inside <summary>.
      const box = document.createElement("div");
      box.className = "viz-quiz-card has-guess";
      const head = document.createElement("div");
      head.className = "viz-quiz-head";
      head.append(...Array.from(summary.childNodes).filter((n) => !n.classList?.contains("viz-quiz-hint")));
      const guess = document.createElement("div");
      guess.className = "viz-quiz-guess";
      guess.setAttribute("role", "group");
      guess.setAttribute("aria-label", "¿Verdad o mito?");
      for (const [label, value] of [
        ["Verdad", true],
        ["Mito", false],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => {
          const ok = value === truth;
          answered += 1;
          if (ok) right += 1;
          box.classList.add(ok ? "is-right" : "is-wrong");
          const result = document.createElement("span");
          result.className = "viz-quiz-result";
          result.textContent = ok ? "Has acertado" : "Pues no";
          answer.querySelector(".viz-quiz-verdict").append(result);
          guess.remove();
          answer.hidden = false;
          answer.setAttribute("tabindex", "-1");
          answer.focus({ preventScroll: true });
          if (answered === cards.length) {
            score.hidden = false;
            score.textContent =
              right === cards.length
                ? `${right} de ${cards.length}. Sabes más que el gurú de turno.`
                : right >= cards.length / 2
                  ? `${right} de ${cards.length}. Nada mal, pero ojo con las que has fallado.`
                  : `${right} de ${cards.length}. Tranquilo, para eso estás leyendo esto.`;
          }
          window.lenis?.resize();
        });
        guess.append(button);
      }
      head.append(guess);
      answer.hidden = true;
      box.append(head, answer);
      card.replaceWith(box);
    });
  });
}

let uid = 0;
function initTabs(root) {
  root.querySelectorAll(".viz-tabs:not(.is-tabbed)").forEach((viz) => {
    const panels = Array.from(viz.querySelectorAll(".viz-tab-panel"));
    const list = document.createElement("div");
    list.className = "viz-tablist";
    list.setAttribute("role", "tablist");
    const indicator = document.createElement("span");
    indicator.className = "viz-tab-indicator";
    indicator.setAttribute("aria-hidden", "true");
    list.append(indicator);

    const tabs = panels.map((panel, i) => {
      const id = `viz-tab-${++uid}`;
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "viz-tab";
      tab.id = `${id}-tab`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", id);
      tab.innerHTML = panel.querySelector(".viz-tab-label").innerHTML;
      panel.id = id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (event) => {
        const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!move) return;
        event.preventDefault();
        const next = (i + move + panels.length) % panels.length;
        select(next);
        tabs[next].focus();
      });
      list.append(tab);
      return tab;
    });

    const place = () => {
      const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
      if (!current) return;
      // Width, not scaleX: scaling would squash the rounded ends.
      indicator.style.width = `${current.offsetWidth}px`;
      indicator.style.transform = `translateX(${current.offsetLeft}px)`;
    };
    function select(index) {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle("is-active", on);
      });
      place();
      window.lenis?.resize();
    }

    viz.querySelector(".viz-tabs-panels").before(list);
    viz.classList.add("is-tabbed");
    select(0);
    window.addEventListener("resize", place);
  });
}

function initToggles(root) {
  root.querySelectorAll(".viz-toggle:not(.is-toggled)").forEach((viz) => {
    const panels = Array.from(viz.querySelectorAll(".viz-toggle-panel"));
    const labels = panels.map((p) => p.querySelector(".viz-toggle-label").innerHTML);
    const bar = document.createElement("div");
    bar.className = "viz-toggle-bar";
    const sideA = document.createElement("button");
    const sideB = document.createElement("button");
    const toggle = document.createElement("button");
    [sideA, sideB].forEach((b, i) => {
      b.type = "button";
      b.className = "viz-toggle-side";
      b.innerHTML = labels[i];
      b.addEventListener("click", () => set(i === 1));
    });
    toggle.type = "button";
    toggle.className = "viz-toggle-switch";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-label", `Ver «${panels[1].querySelector(".viz-toggle-label").textContent}»`);
    toggle.addEventListener("click", () => set(toggle.getAttribute("aria-checked") !== "true"));
    bar.append(sideA, toggle, sideB);

    function set(second) {
      toggle.setAttribute("aria-checked", String(second));
      sideA.classList.toggle("is-active", !second);
      sideB.classList.toggle("is-active", second);
      panels[0].classList.toggle("is-active", !second);
      panels[1].classList.toggle("is-active", second);
      window.lenis?.resize();
    }

    viz.querySelector(".viz-toggle-panels").before(bar);
    viz.classList.add("is-toggled");
    set(false);
  });
}

function initCalculators(root) {
  root.querySelectorAll(".viz-calculator").forEach((viz) => {
    const grid = viz.querySelector(".viz-calc-grid");
    const factor = Number(grid.dataset.factor) || 1;
    const fields = Array.from(viz.querySelectorAll(".viz-calc-field")).map((field) => ({
      input: field.querySelector("input"),
      output: field.querySelector("output"),
    }));
    const total = viz.querySelector(".viz-calc-total output");
    const unit = total.dataset.unit || "";
    const whole = numberFormat(0);
    const exact = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
    let shown = fields.reduce((acc, f) => acc * Number(f.input.value), factor);

    const update = () => {
      const result = fields.reduce((acc, f) => {
        const { input, output } = f;
        const min = Number(input.min);
        const max = Number(input.max);
        const value = Number(input.value);
        input.style.setProperty("--fill", `${((value - min) / (max - min || 1)) * 100}%`);
        output.textContent = `${exact.format(value)}${output.dataset.unit || ""}`;
        return acc * value;
      }, factor);
      tween(total, shown, result, (n) => `${whole.format(Math.round(n))}${unit}`, 600);
      shown = result;
    };
    fields.forEach((f) => f.input.addEventListener("input", update));
  });
}

// Quote: words light up as the quote travels up the viewport. One rect read
// per quote per frame, and only while the page scrolls.
function initQuotes(root) {
  if (reducedMotion.matches) return;
  const quotes = Array.from(root.querySelectorAll(".viz-quote:not(.is-armed)")).map((viz) => {
    viz.classList.add("is-armed");
    return { viz, words: Array.from(viz.querySelectorAll(".viz-word")), lit: -1 };
  });
  if (!quotes.length) return;

  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    quotes.forEach((q) => {
      const rect = q.viz.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (vh * 0.5)));
      const lit = Math.round(progress * q.words.length);
      if (lit === q.lit) return;
      q.lit = lit;
      q.words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    });
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  // Capture: also catches scrolling inside a container (the studio preview).
  document.addEventListener("scroll", queue, { capture: true, passive: true });
  window.addEventListener("resize", queue);
  update();
}

export function initViz(root = document) {
  initQuizzes(root);
  initTabs(root);
  initToggles(root);
  initChecklists(root);
  initCalculators(root);
  initQuotes(root);
  initReveal(root);
}
