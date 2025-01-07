import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setupLeadForm } from "./lead-form.js";
import { setupLeadModal } from "./lead-modal.js";
import { initLiquidGlass } from "./liquid-glass.js";

gsap.registerPlugin(ScrollTrigger);

// Shared state read every frame by home-model.js. The 3D scene never queries
// the DOM for scroll positions: it only reads the ScrollTrigger progress of
// each beat, so camera, duck and overlay stay locked to the same triggers.
export const journeyState = {
  // [{ id, side, el, trigger }] in document order.
  beats: [],
  // Case study pins projected from 3D anchors ([{ el, id }]).
  pins: [],
  pinsActive: false,
  // Normalised pointer position (-1..1) for the camera parallax.
  pointer: { x: 0, y: 0 },
  reducedMotion: false,
  // True when the layout is the stacked mobile narrative.
  compact: false,
  // Scroll-long day cycle: 0 at the hero (day), 1 at the contact finale
  // (night). home-model.js smooths its progress and drives sky and lights.
  dayTrigger: null,
};

const smoothstep = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Day cycle curves shared by the CSS sky and the 3D grade, so both always
// agree on what time it is.
export const dayCycle = (t) => ({
  // Wide, overlapping ranges: something changes on every scroll step.
  golden: smoothstep(0, 0.45, t),
  dusk: smoothstep(0.05, 0.5, t),
  night: smoothstep(0.35, 0.82, t),
  lamps: smoothstep(0.3, 0.72, t),
  stars: smoothstep(0.45, 0.88, t),
});

// Sky layers (dusk gradient, night gradient, moon) read these custom
// properties. Writes are skipped while the value is unchanged.
const skyState = { el: null, dusk: -1, night: -1 };
export const applySky = (cycle) => {
  skyState.el ||= document.querySelector(".experience-stage");
  if (!skyState.el) return;
  let changed = false;
  if (Math.abs(cycle.dusk - skyState.dusk) > 1e-4) {
    skyState.dusk = cycle.dusk;
    skyState.el.style.setProperty("--dusk", cycle.dusk.toFixed(4));
    changed = true;
  }
  if (Math.abs(cycle.night - skyState.night) > 1e-4) {
    skyState.night = cycle.night;
    skyState.el.style.setProperty("--night", cycle.night.toFixed(4));
    changed = true;
  }
  if (changed) paintRootSky(cycle.dusk, cycle.night);
};

// Safari 26 fills the area under its toolbars with the root background, so
// keep it matching the bottom of the sky. Set directly (not via inherited
// custom properties) so only <html> restyles.
const SKY_DAY = [0x9b, 0xcf, 0xea];
const SKY_DUSK = [0xff, 0xa2, 0x5a];
const SKY_NIGHT = [0x29, 0x28, 0x5a];
const paintRootSky = (dusk, night) => {
  const rgb = SKY_DAY.map((day, i) => {
    const withDusk = day + (SKY_DUSK[i] - day) * dusk;
    return Math.round(withDusk + (SKY_NIGHT[i] - withDusk) * night);
  });
  document.documentElement.style.backgroundColor = `rgb(${rgb.join(",")})`;
};

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactQuery = window.matchMedia("(max-width: 900px), (max-aspect-ratio: 4/5)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
// Touch screens scroll on the compositor, so anything JS moves against the
// scroll lands a frame late and jitters. There cards ride the native scroll.
const touchQuery = window.matchMedia("(hover: none), (pointer: coarse)");

journeyState.reducedMotion = reducedMotionQuery.matches;
journeyState.compact = compactQuery.matches;

// On their own, sticky cards rise at scroll speed and stop dead the moment
// position: sticky catches them. setupStickyLanding() adds an offset so their
// on-screen travel follows an ease-out curve that reaches zero speed exactly
// where sticky takes over, and an ease-in curve when the beat pushes them
// away. Exponents of those curves (1 = no easing). The stacked mobile layout
// uses gentler curves: its cards share the bottom edge, and the incoming card
// must not catch up with the one that is leaving.
const LANDING_EASE = { wide: 1.8, compact: 1.5 };
const LEAVING_EASE = { wide: 1.6, compact: 1.4 };

const experience = document.querySelector(".experience");
const journey = document.querySelector(".journey");

if (experience && journey) {
  // Mobile browsers resize the viewport when their toolbars collapse. Those
  // resizes must not re-measure every trigger mid-scroll.
  ScrollTrigger.config({ ignoreMobileResize: true });
  initJourney();
}

function initJourney() {
  const beats = Array.from(journey.querySelectorAll("[data-beat]"));
  const stages = Array.from(journey.querySelectorAll("[data-stage]"));
  const rail = document.querySelector(".journey-rail");
  const railLinks = rail ? Array.from(rail.querySelectorAll("[data-rail]")) : [];

  // Camera transitions: each beat owns the scroll window in which the camera
  // (and the duck) travel from the previous beat's pose to its own pose.
  journeyState.beats = beats.map((el) => ({
    id: el.dataset.beat,
    side: el.dataset.side || "left",
    el,
    trigger: ScrollTrigger.create({
      trigger: el,
      start: () => (journeyState.compact ? "top bottom" : "top 90%"),
      end: () => (journeyState.compact ? "top 12%" : "top 18%"),
      onToggle: (self) => {
        if (self.isActive) experience.dataset.side = el.dataset.side || "left";
      },
    }),
  }));

  ScrollTrigger.create({
    trigger: journey,
    start: "top 75%",
    end: "bottom top",
    onToggle: (self) => {
      experience.classList.toggle("is-journey", self.isActive);
      rail?.classList.toggle("is-visible", self.isActive);
    },
  });

  // Day to night across the whole journey: day at the hero, golden hour
  // through the services, night once the contact beat settles.
  const contactBeat = journey.querySelector('[data-beat="contact"]');
  journeyState.dayTrigger = ScrollTrigger.create({
    trigger: experience,
    start: "top top",
    endTrigger: contactBeat || journey,
    end: () => (journeyState.compact ? "top 12%" : "top 18%"),
    // Without WebGL the render loop never runs, so the sky follows scroll here.
    onUpdate: (self) => {
      if (document.documentElement.classList.contains("no-webgl")) applySky(dayCycle(self.progress));
    },
  });

  // Active chapter for the progress rail.
  stages.forEach((stage) => {
    ScrollTrigger.create({
      trigger: stage,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (!self.isActive) return;
        railLinks.forEach((link) => {
          const isCurrent = link.dataset.rail === stage.id;
          link.classList.toggle("is-active", isCurrent);
          if (isCurrent) link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        });
      },
    });
  });

  // Case study pins only live while the proof beat is on screen.
  const proofBeat = journey.querySelector('[data-beat="proof"]');
  const pinLayer = experience.querySelector(".case-pins");
  journeyState.pins = pinLayer
    ? Array.from(pinLayer.querySelectorAll("[data-pin]")).map((el) => ({ el, id: el.dataset.pin }))
    : [];
  if (proofBeat && pinLayer) {
    ScrollTrigger.create({
      trigger: proofBeat,
      start: "top 45%",
      end: "bottom 55%",
      onToggle: (self) => {
        journeyState.pinsActive = self.isActive;
        pinLayer.classList.toggle("is-active", self.isActive);
        // Pins are only reachable by keyboard while they are on screen.
        journeyState.pins.forEach(({ el }) => (el.tabIndex = self.isActive ? 0 : -1));
      },
    });
    linkCaseHighlights(proofBeat, pinLayer);
  }

  document
    .querySelectorAll(".journey .j-card-inner")
    .forEach((inner) => initLiquidGlass(inner));
  const heroCta = document.querySelector(".hero-cta-glass");
  if (heroCta) initLiquidGlass(heroCta, { strength: 22, bevel: 26, track: true });
  setupCardReveals();
  setupStatCounters();
  setupCardHover();
  setupPointer();
  setupAnchors();
  setupLeadForm(document.querySelector(".journey .lead-form"), { source: "home_journey" });
  setupLeadModal();

  const refresh = () => ScrollTrigger.refresh();
  compactQuery.addEventListener("change", (event) => {
    journeyState.compact = event.matches;
    refresh();
  });
  reducedMotionQuery.addEventListener("change", (event) => {
    journeyState.reducedMotion = event.matches;
  });
  // Web fonts change card heights; measure again once they are in.
  document.fonts?.ready.then(refresh);
}

// ---------------------------------------------------------------------------
// Overlay motion

function setupCardReveals() {
  if (journeyState.reducedMotion) return;

  gsap.utils.toArray(".journey [data-beat]").forEach((beat) => {
    const card = beat.querySelector(".j-card");
    const inner = card?.querySelector(".j-card-inner");
    if (!card || !inner) return;

    // The fade lives on the glass itself: opacity below 1 on .j-card would
    // make it the backdrop root and blank the glass until the fade ends.
    // Fades write --j-in / --j-out, which the CSS multiplies, so they never
    // fight.
    if (getComputedStyle(card).position === "sticky") {
      setupStickyLanding(beat, card, inner);
    } else {
      // The finale (and short screens) scroll normally: a plain rise.
      const entryTrigger = () => ({
        trigger: beat,
        start: "top bottom",
        end: () => (journeyState.compact ? "top 35%" : "top 30%"),
        scrub: 0.6,
      });
      // No tilt on touch: a 3D transform over the glass re-filters its
      // backdrop every frame.
      const tilt = touchQuery.matches ? 0 : -8;
      gsap.fromTo(
        card,
        { y: 90, rotateX: tilt, transformPerspective: 1000 },
        { y: 0, rotateX: 0, ease: "power2.out", scrollTrigger: entryTrigger() },
      );
      gsap.fromTo(
        inner,
        { "--j-in": 0 },
        { "--j-in": 1, ease: "power2.out", scrollTrigger: entryTrigger() },
      );
    }

    // Exit: fade once the beat's end pushes the sticky card away, so cards
    // never pile up under the navigation. The finale never leaves.
    if (beat.dataset.beat === "contact") return;
    gsap.fromTo(
      inner,
      { "--j-out": 1 },
      {
        "--j-out": 0,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: beat,
          start: () => (journeyState.compact ? "bottom bottom" : "bottom 98%"),
          end: "bottom 62%",
          scrub: 0.6,
        },
      },
    );
  });
}

function setupStickyLanding(beat, card, inner) {
  // Touch: plain sticky plus the fade. The eased offset and the tilt would
  // fight the native momentum scroll (see touchQuery).
  const eased = !touchQuery.matches;
  const offset = { landing: 0, leaving: 0 };
  const setY = gsap.quickSetter(card, "y", "px");
  const setTilt = gsap.quickSetter(card, "rotationX", "deg");
  if (eased) gsap.set(card, { transformPerspective: 1000 });
  const apply = () => setY(offset.landing + offset.leaving);

  // Viewport offsets (px from the top) of the beat edges at which the card
  // sticks and is released, measured on every refresh.
  const edges = { stick: 0, release: 0, sticky: true };
  const measure = () => {
    const cardStyle = getComputedStyle(card);
    const beatStyle = getComputedStyle(beat);
    const padTop = parseFloat(beatStyle.paddingTop) || 0;
    const padBottom = parseFloat(beatStyle.paddingBottom) || 0;
    const viewport = window.innerHeight;
    edges.sticky = cardStyle.position === "sticky";
    if (journeyState.compact) {
      const bottom = parseFloat(cardStyle.bottom) || 0;
      edges.stick = viewport - bottom - card.offsetHeight - padTop;
      edges.release = viewport - bottom + padBottom;
    } else {
      const top = parseFloat(cardStyle.top) || 0;
      edges.stick = top - padTop;
      edges.release = top + card.offsetHeight + padBottom;
    }
    edges.stick = Math.min(edges.stick, viewport - 1);
  };

  const landing = (self) => {
    const remaining = edges.sticky ? 1 - self.progress : 0;
    inner.style.setProperty("--j-in", smoothstep(0, 0.75, 1 - remaining).toFixed(3));
    if (!eased) return;
    const ease = journeyState.compact ? LANDING_EASE.compact : LANDING_EASE.wide;
    offset.landing = (self.end - self.start) * (Math.pow(remaining, ease) - remaining);
    setTilt(-6 * remaining * remaining);
    apply();
  };
  ScrollTrigger.create({
    trigger: beat,
    start: "top bottom",
    end: () => {
      measure();
      return `top ${edges.stick}px`;
    },
    onRefresh: landing,
    onUpdate: landing,
  });

  if (!eased) return;
  const leaving = (self) => {
    const p = edges.sticky ? self.progress : 0;
    const ease = journeyState.compact ? LEAVING_EASE.compact : LEAVING_EASE.wide;
    offset.leaving = (self.end - self.start) * (p - Math.pow(p, ease));
    apply();
  };
  ScrollTrigger.create({
    trigger: beat,
    start: () => `bottom ${edges.release}px`,
    end: () => `bottom ${edges.release - window.innerHeight * 0.35}px`,
    onRefresh: leaving,
    onUpdate: leaving,
  });
}

function setupStatCounters() {
  gsap.utils.toArray(".journey [data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (!Number.isFinite(target) || journeyState.reducedMotion) return;
    const pad = el.textContent.trim().length;
    const counter = { value: 0 };
    const write = () => {
      el.textContent = String(Math.round(counter.value)).padStart(pad, "0");
    };
    write();
    gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: "power3.out",
      onUpdate: write,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
}

function setupCardHover() {
  if (!finePointerQuery.matches) return;
  document.querySelectorAll(".journey .j-card-inner").forEach((inner) => {
    let frame = 0;
    inner.addEventListener("pointermove", (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = inner.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        inner.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        inner.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        if (!journeyState.reducedMotion) {
          inner.style.setProperty("--ry", `${((x - 0.5) * 5).toFixed(2)}deg`);
          inner.style.setProperty("--rx", `${((0.5 - y) * 5).toFixed(2)}deg`);
        }
      });
    });
    inner.addEventListener("pointerleave", () => {
      inner.style.setProperty("--rx", "0deg");
      inner.style.setProperty("--ry", "0deg");
    });
  });
}

function setupPointer() {
  if (!finePointerQuery.matches) return;
  window.addEventListener(
    "pointermove",
    (event) => {
      journeyState.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      journeyState.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}

function linkCaseHighlights(proofBeat, pinLayer) {
  proofBeat.querySelectorAll("[data-case]").forEach((link) => {
    const pin = pinLayer.querySelector(`[data-pin="${link.dataset.case}"]`);
    if (!pin) return;
    const on = () => pin.classList.add("is-highlighted");
    const off = () => pin.classList.remove("is-highlighted");
    link.addEventListener("pointerenter", on);
    link.addEventListener("pointerleave", off);
    link.addEventListener("focus", on);
    link.addEventListener("blur", off);
  });
}

// ---------------------------------------------------------------------------
// Navigation inside the journey

// Service CTAs pre-select the matching project types in the lead form.
const SERVICE_CHOICES = {
  web: ["Desarrollo web"],
  product: ["UX/UI"],
  brand: ["Branding", "Audiovisual"],
  growth: ["SEO", "IA"],
};

function scrollToTarget(target) {
  if (window.lenis) {
    window.lenis.scrollTo(target, { duration: 1.6 });
  } else {
    target.scrollIntoView({
      behavior: journeyState.reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }
}

// Checks the service's project types in both lead forms (page and modal).
function preselectServices(service) {
  const choices = SERVICE_CHOICES[service];
  if (!choices) return;
  document.querySelectorAll(".lead-form input[name='servicios']").forEach((input) => {
    if (choices.includes(input.value)) input.checked = true;
  });
}

function setupAnchors() {
  // Modal triggers (js/lead-modal.js) open the form instead of scrolling,
  // but still pre-select their service.
  document.querySelectorAll(".journey [data-lead-modal][data-service]").forEach((link) => {
    link.addEventListener("click", () => preselectServices(link.dataset.service));
  });

  document.querySelectorAll('.hero a[href^="#"], .journey a[href^="#"], .journey-rail a[href^="#"]').forEach((link) => {
    if (link.hasAttribute("data-lead-modal")) return;
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();

      preselectServices(link.dataset.service);
      scrollToTarget(target);
      history.replaceState(null, "", link.getAttribute("href"));
    });
  });
}
