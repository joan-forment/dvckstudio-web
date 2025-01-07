import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

function domReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

function getSplitTypeFromElement(element) {
  // Supported:
  // - data-animate-variant="slide" + data-animate-split="lines|words"
  // - data-animate-variant="slide-lines|slide-words"
  const variant = (element.getAttribute("data-animate-variant") || "").trim();
  if (variant === "slide-words") return "words";
  if (variant === "slide-lines") return "lines";

  const split = (element.getAttribute("data-animate-split") || "").trim();
  if (split === "words") return "words";
  return "lines";
}

function initSlideMaskAnimation(element) {
  const animateOnScroll =
    element.getAttribute("data-animate-on-scroll") === "true";

  const delay = parseFloat(element.getAttribute("data-animate-delay")) || 0;

  const duration =
    parseFloat(element.getAttribute("data-animate-duration")) || 0.75;
  const stagger =
    parseFloat(element.getAttribute("data-animate-stagger")) || 0.1;
  const start = (
    element.getAttribute("data-animate-start") || "top 70%"
  ).trim();

  const splitType = getSplitTypeFromElement(element);

  SplitText.create(element, {
    type: splitType,
    mask: splitType,
    autoSplit: true,
    // Keep the real text readable by assistive tech. The default ("auto")
    // puts aria-label on <p>/<div>, which is not allowed on those roles.
    aria: "none",
    linesClass: "line",
    wordsClass: "word",
    onSplit(self) {
      const targets = splitType === "words" ? self.words : self.lines;

      gsap.set(targets, { yPercent: 100 });

      const animation = gsap.to(targets, {
        yPercent: 0,
        duration,
        ease: "power3.out",
        delay,
        stagger,
        paused: animateOnScroll,
      });

      if (animateOnScroll) {
        ScrollTrigger.create({
          trigger: element,
          start,
          animation,
          toggleActions: "play none none none",
        });
      }
    },
  });
}

export function initAnimatedCopy() {
  const animatedElements = document.querySelectorAll("[data-animate-variant]");

  animatedElements.forEach((element) => {
    const variant = element.getAttribute("data-animate-variant");
    const isSlide =
      variant === "slide" ||
      variant === "slide-lines" ||
      variant === "slide-words";
    if (!isSlide) return;

    initSlideMaskAnimation(element);
  });
}

domReady(() => {
  // Wait for layout-stable text metrics if possible.
  const fontsReady = document.fonts?.ready;
  if (fontsReady && typeof fontsReady.then === "function") {
    fontsReady.then(() => initAnimatedCopy());
  } else {
    initAnimatedCopy();
  }
});
