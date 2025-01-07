import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis = null;

gsap.registerPlugin(ScrollTrigger);

// initialization
// In production builds, this module can execute after DOMContentLoaded has
// already fired (depending on bundling/loading), so we must handle both cases.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initLenisScroll());
} else {
  initLenisScroll();
}

// smooth scroll setup with responsive config
function initLenisScroll() {
  if (lenis) return;

  const isMobile = window.matchMedia(
    "(max-width: 1000px), (pointer: coarse)",
  ).matches;

  // Keep native scrolling on phones and touch devices. Lenis is reserved for
  // desktop pointers so touch momentum and browser UI remain predictable.
  if (isMobile) {
    window.lenis = null;
    return;
  }

  lenis = new Lenis({
    duration: 1.2,
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 2,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  window.lenis = lenis;

  // Ensure any existing ScrollTriggers (including pinned ones) measure using
  // the final layout + active Lenis loop.
  requestAnimationFrame(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

export { lenis };
