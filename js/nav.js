import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

let lenis = null;
try {
  const lenisModule = await import("/js/lenis-scroll.js");
  lenis = lenisModule.default || lenisModule.lenis || null;
} catch (e) {}

const menuItems = [
  { label: "Inicio", route: "/" },
  { label: "Estudio", route: "/studio" },
  { label: "Proyectos", route: "/work" },
  { label: "Blog", route: "/blog" },
  { label: "Contacto", route: "/contact" },
];

const normalizePath = (path) => path.replace(/\.html$/, "").replace(/\/index$/, "/").replace(/(.)\/$/, "$1") || "/";
const isCurrentRoute = (route) => normalizePath(window.location.pathname) === route;

function buildNav() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  // Prevent duplicate overlays if any script re-runs.
  const existingOverlay = document.querySelector(".menu-overlay");
  if (existingOverlay) existingOverlay.remove();

  const toggler = nav.querySelector(".nav-toggler");
  if (toggler) {
    toggler.setAttribute("role", "button");
    toggler.setAttribute("tabindex", "0");
    toggler.setAttribute("aria-label", "Abrir menú");
    toggler.setAttribute("aria-expanded", "false");
    toggler.setAttribute("aria-controls", "site-menu");
    toggler.innerHTML = `
      <div class="nav-toggle-wrapper">
        <span class="nav-toggle-icon nav-toggle-icon--open" aria-hidden="true">
          <svg viewBox="0 0 640 640" fill="currentColor"><path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"/></svg>
        </span>
        <span class="nav-toggle-icon nav-toggle-icon--close" aria-hidden="true">
          <svg viewBox="0 0 640 640" fill="currentColor"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>
        </span>
      </div>
    `;
    nav.classList.add("nav-is-ready");
  }

  const overlay = document.createElement("div");
  overlay.className = "menu-overlay";
  overlay.id = "site-menu";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Menú principal");
  // Closed menu content must not be reachable by keyboard or screen readers.
  overlay.inert = true;
  overlay.innerHTML = `
    <div class="menu-content">
      <div class="menu-col" data-col="0">
        <div class="menu-content-group">
          <p>&copy; DvckStudio</p>
          <p>Estudio creativo digital</p>
          <p>España · 2026</p>
        </div>
        <div class="menu-content-group">
          <p>Desarrollo web</p>
          <p>Diseño UX/UI</p>
        </div>
        <div class="menu-content-group">
          <p>Email:</p>
          <a href="mailto:contact@dvckstudio.com">contact@dvckstudio.com</a>
        </div>
        <div class="menu-content-group">
          <p>Directo</p>
          <a href="tel:+34636318713">+34 636 31 87 13</a>
        </div>
      </div>
      <div class="menu-col" data-col="1">
        <div class="menu-content-group">
          <a href="https://www.instagram.com/dvckstudio" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.youtube.com/@dvckstudio" target="_blank" rel="noopener noreferrer">YouTube</a>
          <a href="https://x.com/dvckstudio" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
          <a href="https://www.tiktok.com/@dvckstudio" target="_blank" rel="noopener noreferrer">TikTok</a>
          <a href="https://www.linkedin.com/company/dvckstudio" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
        <div class="menu-content-group">
          <p>Idioma</p>
          <p>Español</p>
        </div>
        <div class="menu-content-group">
          <p>&copy; DvckStudio</p>
          <p>Estudio creativo digital</p>
          <p>España · 2026</p>
        </div>
      </div>
    </div>

    <div class="menu-img"></div>

    <div class="menu-links-wrapper">
      ${menuItems
        .map(
          (item) => `
        <div class="menu-link" data-route="${item.route}">
          <a href="${item.route}" aria-label="${item.label}"${isCurrentRoute(item.route) ? ' aria-current="page"' : ""}>
            <span aria-hidden="true">${item.label}</span>
            <span aria-hidden="true">${item.label}</span>
            <svg class="menu-link-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      `,
        )
        .join("")}
      <div class="link-highlighter"></div>
      <div class="link-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="M12 4v15M6 13l6 6 6-6" /></svg>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const navLogo = nav.querySelector(".nav-logo");
  if (navLogo && !document.querySelector(".nav-logo--placeholder")) {
    document.body.insertBefore(navLogo, nav);
    navLogo.classList.add("nav-logo--detached");

    const placeholder = document.createElement("div");
    placeholder.className = "nav-logo nav-logo--placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    nav.insertBefore(placeholder, nav.firstChild);
  }
}

function initMenu() {
  buildNav();

  const navToggler = document.querySelector(".nav-toggler");
  const menuOverlay = document.querySelector(".menu-overlay");
  const menuImage = document.querySelector(".menu-overlay .menu-img");
  const detachedLogo = document.querySelector(".nav-logo--detached");
  const menuLinksWrapper = document.querySelector(".menu-links-wrapper");
  const linkHighlighter = document.querySelector(".link-highlighter");
  const linkArrow = document.querySelector(".link-arrow");
  const menuLinks = Array.from(document.querySelectorAll(".menu-link a"));
  const menuLinkContainers = Array.from(
    document.querySelectorAll(".menu-link"),
  );
  // Highlighter and arrow rest on the current page, so the open menu says
  // where you are before you hover anything.
  // Blog posts (/blog/…) rest on "Blog", although only /blog itself is the
  // current page for aria-current.
  const isInSection = (route) => route !== "/" && normalizePath(window.location.pathname).startsWith(`${route}/`);
  const restContainer =
    menuLinkContainers.find((c) => isCurrentRoute(c.dataset.route)) ||
    menuLinkContainers.find((c) => isInSection(c.dataset.route)) ||
    menuLinkContainers[0];
  const iconOpen = document.querySelector(".nav-toggle-icon--open");
  const iconClose = document.querySelector(".nav-toggle-icon--close");
  const menuCols = Array.from(document.querySelectorAll(".menu-col"));

  let isMenuOpen = false;
  let isMenuAnimating = false;

  const splitTextInstances = [];

  function setupLinkSplits() {
    splitTextInstances.forEach((s) => s.revert && s.revert());
    splitTextInstances.length = 0;

    menuLinks.forEach((link) => {
      const spans = link.querySelectorAll("span");
      spans.forEach((span, i) => {
        const split = new SplitText(span, { type: "chars", aria: "none" });
        splitTextInstances.push(split);
        split.chars.forEach((c) => c.classList.add("char"));
        if (i === 1) {
          gsap.set(split.chars, { y: "110%" });
        }
      });
    });
  }

  const menuColSplitInstances = [];

  function setupColSplits() {
    if (isMenuOpen) return;

    menuColSplitInstances.forEach((s) => s.revert && s.revert());
    menuColSplitInstances.length = 0;

    menuCols.forEach((col) => {
      col.querySelectorAll("p, a").forEach((el) => {
        const split = SplitText.create(el, {
          type: "lines",
          aria: "none",
          mask: "lines",
          linesClass: "split-line",
        });
        menuColSplitInstances.push(split);
        gsap.set(split.lines, { y: "100%" });
      });
    });
  }

  function setInitialStates() {
    gsap.set(menuImage, { y: 0, scale: 0.5, opacity: 0.25 });
    gsap.set(menuLinks, { y: "150%" });
    gsap.set(linkHighlighter, { y: "150%" });
    gsap.set(linkArrow, { autoAlpha: 0, y: -24 });

    const firstLinkContainer = restContainer;
    const firstLinkSpan = firstLinkContainer
      ? firstLinkContainer.querySelector("a span")
      : null;

    if (firstLinkSpan) {
      const linkWidth = firstLinkSpan.offsetWidth;
      linkHighlighter.style.width = linkWidth + "px";
      currentHighlighterWidth = linkWidth;
      targetHighlighterWidth = linkWidth;

      const linkRect = firstLinkContainer.getBoundingClientRect();
      const wrapperRect = menuLinksWrapper.getBoundingClientRect();
      const initialX = linkRect.left - wrapperRect.left;
      currentHighlighterX = initialX;
      targetHighlighterX = initialX;
    }
  }

  let currentX = 0;
  let targetX = 0;
  let currentImageX = 0;
  let targetImageX = 0;
  const lerpFactor = 0.05;

  let currentHighlighterX = 0;
  let targetHighlighterX = 0;
  let currentHighlighterWidth = 0;
  let targetHighlighterWidth = 0;

  let rafId = null;

  function animateLoop() {
    currentX += (targetX - currentX) * lerpFactor;
    currentImageX += (targetImageX - currentImageX) * lerpFactor;
    currentHighlighterX +=
      (targetHighlighterX - currentHighlighterX) * lerpFactor;
    currentHighlighterWidth +=
      (targetHighlighterWidth - currentHighlighterWidth) * lerpFactor;

    gsap.set(menuLinksWrapper, { x: currentX });
    gsap.set(menuImage, { x: currentImageX });
    gsap.set(linkHighlighter, {
      x: currentHighlighterX,
      width: currentHighlighterWidth,
    });
    // The arrow rides above the centre of the highlighted link.
    gsap.set(linkArrow, {
      x: currentHighlighterX + currentHighlighterWidth / 2,
    });

    rafId = requestAnimationFrame(animateLoop);
  }

  function startDesktopTracking() {
    if (window.innerWidth < 1000) return;
    if (rafId) return;
    menuOverlay.addEventListener("mousemove", onMouseMove);
    menuLinksWrapper.addEventListener("mouseleave", onLinksWrapperLeave);
    rafId = requestAnimationFrame(animateLoop);
  }

  function stopDesktopTracking() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    menuOverlay.removeEventListener("mousemove", onMouseMove);
    menuLinksWrapper.removeEventListener("mouseleave", onLinksWrapperLeave);
  }

  function onMouseMove(e) {
    if (window.innerWidth < 1000) return;

    const mouseX = e.clientX;
    const viewportWidth = window.innerWidth;
    const wrapperWidth = menuLinksWrapper.offsetWidth;

    const maxMoveLeft = 0;
    const maxMoveRight = viewportWidth - wrapperWidth;

    const sensitivityRange = viewportWidth * 0.5;
    const startX = (viewportWidth - sensitivityRange) / 2;
    const endX = startX + sensitivityRange;

    let pct;
    if (mouseX <= startX) pct = 0;
    else if (mouseX >= endX) pct = 1;
    else pct = (mouseX - startX) / sensitivityRange;

    targetX = maxMoveLeft + pct * (maxMoveRight - maxMoveLeft);

    const imageMoveRange = Math.min(viewportWidth * 0.45, 620);
    targetImageX = (pct - 0.5) * 2 * imageMoveRange;
  }

  function onLinkEnter(container) {
    if (window.innerWidth < 1000) return;

    const spans = container.querySelectorAll("a span");
    if (!spans || spans.length < 2) return;

    const visibleChars = spans[0].querySelectorAll(".char");
    const animatedChars = spans[1].querySelectorAll(".char");

    gsap.to(visibleChars, {
      y: "-110%",
      stagger: 0.05,
      duration: 0.5,
      ease: "expo.inOut",
    });
    gsap.to(animatedChars, {
      y: "0%",
      stagger: 0.05,
      duration: 0.5,
      ease: "expo.inOut",
    });

    const linkRect = container.getBoundingClientRect();
    const wrapperRect = menuLinksWrapper.getBoundingClientRect();
    targetHighlighterX = linkRect.left - wrapperRect.left;

    const firstSpan = container.querySelector("a span");
    targetHighlighterWidth = firstSpan
      ? firstSpan.offsetWidth
      : container.offsetWidth;
  }

  function onLinkLeave(container) {
    if (window.innerWidth < 1000) return;

    const spans = container.querySelectorAll("a span");
    if (!spans || spans.length < 2) return;

    const visibleChars = spans[0].querySelectorAll(".char");
    const animatedChars = spans[1].querySelectorAll(".char");

    gsap.to(animatedChars, {
      y: "110%",
      stagger: 0.05,
      duration: 0.5,
      ease: "expo.inOut",
    });
    gsap.to(visibleChars, {
      y: "0%",
      stagger: 0.05,
      duration: 0.5,
      ease: "expo.inOut",
    });
  }

  function onLinksWrapperLeave() {
    const firstContainer = restContainer;
    if (!firstContainer) return;
    const firstSpan = firstContainer.querySelector("a span");
    if (!firstSpan) return;

    const linkRect = firstContainer.getBoundingClientRect();
    const wrapperRect = menuLinksWrapper.getBoundingClientRect();
    targetHighlighterX = linkRect.left - wrapperRect.left;
    targetHighlighterWidth = firstSpan.offsetWidth;
  }

  menuLinkContainers.forEach((container) => {
    container.addEventListener("mouseenter", () => onLinkEnter(container));
    container.addEventListener("mouseleave", () => onLinkLeave(container));

    // Let the browser perform a normal anchor navigation.
    // This keeps cross-document view transitions eligible and reliable.
    const a = container.querySelector("a");
    if (a) {
      // Keyboard focus: slide the oversized link row so the focused link is
      // on screen (the mouse does this through onMouseMove).
      a.addEventListener("focus", () => {
        if (window.innerWidth < 1000) return;
        const viewportWidth = window.innerWidth;
        const wrapperWidth = menuLinksWrapper.offsetWidth;
        const center = container.offsetLeft + container.offsetWidth / 2;
        targetX = Math.min(0, Math.max(viewportWidth - wrapperWidth, viewportWidth / 2 - center));
        onLinkEnter(container);
      });
      a.addEventListener("blur", () => onLinkLeave(container));
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (href && isCurrentRoute(href)) {
          e.preventDefault();
          if (isMenuOpen) toggleMenu();
        }
      });
    }
  });

  function toggleMenu() {
    if (isMenuAnimating) return;
    isMenuAnimating = true;

    if (!isMenuOpen) {
      menuOverlay.inert = false;
      menuOverlay.classList.add("is-open");
      document.body.classList.add("menu-is-open");
      if (lenis) lenis.stop();
      startDesktopTracking();
      detachedLogo?.classList.add("is-menu-open");
      gsap.to(detachedLogo, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });

      navToggler.setAttribute("aria-expanded", "true");
      navToggler.setAttribute("aria-label", "Cerrar menú");
      gsap.to(iconOpen, {
        rotate: 90,
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: "expo.inOut",
      });
      gsap.fromTo(
        iconClose,
        { rotate: -90, scale: 0, opacity: 0 },
        {
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 0.4,
          delay: 0.1,
          ease: "expo.out",
        },
      );

      gsap.to(menuOverlay, {
        clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
        duration: 1.25,
        ease: "expo.out",
        onComplete: () => {
          menuLinkContainers.forEach((c) => (c.style.overflow = "visible"));
          isMenuOpen = true;
          isMenuAnimating = false;
          // Start on the current page, where the highlighter already rests.
          restContainer?.querySelector("a")?.focus({ preventScroll: true });
        },
      });

      gsap.to(menuImage, {
        scale: 1,
        opacity: 1,
        duration: 1.5,
        ease: "expo.out",
      });

      gsap.to(menuLinks, {
        y: "0%",
        duration: 1.25,
        stagger: 0.1,
        delay: 0.25,
        ease: "expo.out",
      });

      gsap.to(linkHighlighter, {
        y: "0%",
        duration: 1,
        delay: 1,
        ease: "expo.out",
      });

      gsap.to(linkArrow, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        delay: 1.1,
        ease: "expo.out",
      });

      menuCols.forEach((col) => {
        const splitLines = col.querySelectorAll(".split-line");
        gsap.to(splitLines, {
          y: "0%",
          duration: 1,
          stagger: 0.05,
          delay: 0.5,
          ease: "expo.out",
        });
      });
    } else {
      menuOverlay.inert = true;
      document.body.classList.remove("menu-is-open");
      if (menuOverlay.contains(document.activeElement)) navToggler.focus({ preventScroll: true });
      detachedLogo?.classList.remove("is-menu-open");
      gsap.to(detachedLogo, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
      navToggler.setAttribute("aria-expanded", "false");
      navToggler.setAttribute("aria-label", "Abrir menú");
      gsap.to(iconClose, {
        rotate: -90,
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: "expo.inOut",
      });
      gsap.fromTo(
        iconOpen,
        { rotate: 90, scale: 0, opacity: 0 },
        {
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 0.4,
          delay: 0.1,
          ease: "expo.out",
        },
      );

      gsap.to(linkArrow, { autoAlpha: 0, duration: 0.3, ease: "power2.out" });

      gsap.to(menuImage, {
        y: "-25svh",
        opacity: 0.5,
        duration: 1.25,
        ease: "expo.out",
      });

      menuCols.forEach((col) => {
        const splitLines = col.querySelectorAll(".split-line");
        gsap.to(splitLines, {
          y: "-100%",
          duration: 1,
          stagger: 0,
          ease: "expo.out",
        });
      });

      gsap.to(menuOverlay, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        duration: 1.25,
        ease: "expo.out",
        onComplete: () => {
          stopDesktopTracking();
          menuOverlay.classList.remove("is-open");
          gsap.set(menuOverlay, {
            clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
          });
          gsap.set(menuLinks, { y: "150%" });
          gsap.set(linkHighlighter, { y: "150%" });
          gsap.set(linkArrow, { autoAlpha: 0, y: -24 });
          gsap.set(menuImage, { y: "0", scale: 0.5, opacity: 0.25 });
          menuLinkContainers.forEach((c) => (c.style.overflow = "hidden"));

          menuCols.forEach((col) => {
            const splitLines = col.querySelectorAll(".split-line");
            gsap.set(splitLines, { y: "100%" });
          });

          gsap.set(menuLinksWrapper, { x: 0 });
          gsap.set(menuImage, { x: 0 });
          currentX = 0;
          targetX = 0;
          currentImageX = 0;
          targetImageX = 0;

          setupColSplits();
          gsap.set(detachedLogo, { autoAlpha: 1 });

          isMenuOpen = false;
          isMenuAnimating = false;

          if (lenis) lenis.start();
        },
      });
    }
  }

  navToggler.addEventListener("click", toggleMenu);
  navToggler.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen && !isMenuAnimating) toggleMenu();
  });

  // On the home page, the logo and the centre icon glide back to the top
  // instead of reloading the page (and the 3D scene) from scratch.
  function setupHomeLinks() {
    if (!isCurrentRoute("/")) return;
    document.querySelectorAll('.nav-logo a[href="/"], .nav-icon a[href="/"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (isMenuOpen) toggleMenu();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // force: Lenis stays stopped until the closing menu finishes.
        if (window.lenis) window.lenis.scrollTo(0, { duration: 1.6, immediate: reduced, force: true });
        else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  setupNavTheme();
  setupHomeLinks();

  setupLinkSplits();
  setupColSplits();
  setInitialStates();
  // Desktop tracking loop starts only when menu is open.
}

// The logo and toggler are white. Over light sections (marked with
// data-nav-theme="light", plus every page footer) they switch to dark so
// they never disappear against a white background.
function setupNavTheme() {
  if (!("IntersectionObserver" in window)) return;
  const lightSections = document.querySelectorAll('[data-nav-theme="light"], body > footer');
  if (!lightSections.length) return;

  const overlapping = new Set();
  const update = () => {
    const isLight = overlapping.size > 0;
    document.body.classList.toggle("nav-on-light", isLight);
  };
  // Only the band behind the nav bar (top ~7rem) matters.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) overlapping.add(entry.target);
        else overlapping.delete(entry.target);
      });
      update();
    },
    { rootMargin: "0px 0px -88% 0px", threshold: 0 },
  );
  lightSections.forEach((section) => observer.observe(section));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMenu);
} else {
  initMenu();
}
