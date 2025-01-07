import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const hero = document.querySelector(".studio-hero");
if (hero) {
  const heroCopy = hero.querySelector(".studio-hero-copy");

  // pin + animate hero on scroll
  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: () => `+=${window.innerHeight * 3}px`,
    id: "studio-hero-pin",
    pin: true,
    pinSpacing: true,
    scrub: true,
    invalidateOnRefresh: true,
    refreshPriority: 10,
    onUpdate: (self) => {
      const p = self.progress;

      // Scale the complete word from the viewport centre for the original zoom choreography.
      if (heroCopy) {
        gsap.set(heroCopy, {
          scale: 1 + 12 * p,
          x: 0,
          y: 0,
          transformOrigin: "50% 50%",
          force3D: false,
        });
      }

      // Keep the initial opening square in pixels, then expand it to the full hero.
      const maskSize = innerWidth * 0.25;
      const maskLeft = (innerWidth - maskSize) / 2;
      const maskTop = (innerHeight - maskSize) / 2;
      const lerp = (a, b) => a + (b - a) * p;
      const points = {
        tl: [lerp(maskLeft, 0), lerp(maskTop, 0)],
        tr: [lerp(maskLeft + maskSize, innerWidth), lerp(maskTop, 0)],
        br: [lerp(maskLeft + maskSize, innerWidth), lerp(maskTop + maskSize, innerHeight)],
        bl: [lerp(maskLeft, 0), lerp(maskTop + maskSize, innerHeight)],
      };

      gsap.set(".studio-hero-img", {
        rotation: 45 * (1 - p),
        clipPath: `polygon(
          ${points.tl[0]}px ${points.tl[1]}px,
          ${points.tr[0]}px ${points.tr[1]}px,
          ${points.br[0]}px ${points.br[1]}px,
          ${points.bl[0]}px ${points.bl[1]}px
        )`,
      });

      gsap.set(".studio-hero-img video", {
        scale: 2 - p,
      });
    },
  });

  // refresh scrolltrigger after assets settle
  const video = hero.querySelector(".studio-hero-img video");
  const refreshSoon = () =>
    requestAnimationFrame(() => ScrollTrigger.refresh());

  refreshSoon();
  window.addEventListener("load", refreshSoon, { once: true });

  if (video) {
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    if (video.readyState >= 1) {
      refreshSoon();
      tryPlay();
    } else {
      video.addEventListener("loadedmetadata", refreshSoon, { once: true });
      video.addEventListener("error", refreshSoon, { once: true });
    }
    video.addEventListener("canplay", tryPlay, { once: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });
  }

  document.fonts?.ready?.then(refreshSoon).catch(() => {});
}
