// Lead form modal: links marked [data-lead-modal] open the form in a native
// <dialog> over a dimmed page instead of scrolling to #contacto. Whatever the
// link sits in clears out of the way while it is open and comes back when it
// closes: the hero copy, or the journey card (it drops, shrinks and fades).
// Without JS (or without <dialog> support) the links keep their anchor.
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { setupLeadForm } from "./lead-form.js";
import { initLiquidGlass } from "./liquid-glass.js";

gsap.registerPlugin(SplitText);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// How long a journey card takes to fade out (--j-modal in
// css/home-journey.css). The modal waits for it: one thing moves at a time.
const CARD_EXIT_MS = 200;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

// One reversible timeline for the hero title, description and CTA: play()
// on open, reverse() on close, so an interrupted close or reopen just turns
// around from wherever it is. Built on first open and kept: reverting the
// split when the hero is back would re-kern the letters in one visible jump.
//
// The CTA moves by transform only. Opacity below 1 on it (or on a parent)
// turns it into a backdrop root, which blanks the glass until the fade ends
// and then pops it back in.
function createHeroExit() {
  const hero = document.querySelector(".hero .newsletter-cta-overlay");
  const title = hero?.querySelector("h2");
  const copy = hero?.querySelector(".newsletter-description");
  const actions = hero?.querySelector(".hero-cta-actions");
  if (!title || !copy || !actions) return null;

  if (reducedMotion.matches) {
    return gsap
      .timeline({ paused: true })
      .to([title, copy], { autoAlpha: 0, duration: 0.25, ease: "none" })
      .set(actions, { visibility: "hidden" }, 0);
  }

  // Words, not lines: words keep wrapping naturally if the viewport changes
  // after the split.
  const titleSplit = SplitText.create(title, {
    type: "words,chars",
    mask: "words",
    wordsClass: "hero-exit-word",
    charsClass: "hero-exit-char",
  });
  const copySplit = SplitText.create(copy, {
    type: "words",
    mask: "words",
    wordsClass: "hero-exit-word",
    // aria-label is not allowed on <p>; the split words still read in order.
    aria: "none",
  });

  return gsap
    .timeline({ paused: true, defaults: { ease: "expo.inOut" } })
    .to(titleSplit.chars, {
      yPercent: -115,
      rotate: -8,
      duration: 0.8,
      stagger: { each: 0.025, from: "start" },
    })
    .to(copySplit.words, { yPercent: -110, duration: 0.7, stagger: 0.012 }, 0.08)
    // Shrinks to nothing into its own centre; reversed, back.in becomes a
    // small overshoot as it pops back.
    .to(actions, { scale: 0, rotate: -6, duration: 0.6, ease: "back.in(1.6)" }, 0.1)
    .set(actions, { visibility: "hidden" });
}

export function setupLeadModal() {
  const dialog = document.querySelector(".lead-modal");
  const triggers = document.querySelectorAll("[data-lead-modal]");
  if (!dialog || !triggers.length || typeof dialog.showModal !== "function") return;

  const panel = dialog.querySelector(".j-card-inner");
  const email = dialog.querySelector("input[type='email']");
  const title = dialog.querySelector("#lead-modal-title");
  initLiquidGlass(panel, { track: true });
  setupLeadForm(dialog.querySelector(".lead-form"), { source: "home_hero_modal" });

  let closing = false;
  let heroExit;
  // The journey card whose CTA opened the modal, moved away meanwhile, and
  // that CTA: the card hides it, so focus goes back to it by hand.
  let awayCard = null;
  let awayTrigger = null;
  let openTimer = 0;

  // Phones: focusing a field raises the keyboard, and the browser scrolls
  // the page (the overflow lock does not stop that) or pans the view to
  // reveal it. The journey behind reads the scroll, so the page is held
  // where it was; the card is fitted to the visible area above the keyboard
  // and scrolls inside itself instead.
  const viewport = window.visualViewport;
  let heldScrollY = 0;
  const holdScroll = () => {
    if (window.scrollY !== heldScrollY) window.scrollTo(0, heldScrollY);
  };

  const fitKeyboard = () => {
    const visibleHeight = viewport.height * viewport.scale;
    const keyboard = document.documentElement.clientHeight - visibleHeight > 150;
    dialog.classList.toggle("is-keyboard", keyboard);
    dialog.style.setProperty("--lead-vv-top", `${viewport.offsetTop}px`);
    dialog.style.setProperty("--lead-vv-height", `${viewport.height}px`);
    if (!keyboard) return;
    // Scroll the card, not the page, to the focused field.
    const field = document.activeElement;
    if (!panel.contains(field) || field === title) return;
    const fieldBox = field.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const gap = 16;
    if (fieldBox.bottom > panelBox.bottom - gap) panel.scrollTop += fieldBox.bottom - panelBox.bottom + gap;
    else if (fieldBox.top < panelBox.top + gap) panel.scrollTop -= panelBox.top + gap - fieldBox.top;
  };

  const watchKeyboard = (on) => {
    const method = on ? "addEventListener" : "removeEventListener";
    window[method]("scroll", holdScroll);
    viewport?.[method]("resize", fitKeyboard);
    viewport?.[method]("scroll", fitKeyboard);
    if (!on) dialog.classList.remove("is-keyboard");
  };

  const bringCardBack = () => {
    if (!awayCard) return;
    awayCard.classList.remove("is-modal-away");
    awayTrigger?.focus({ preventScroll: true });
    awayCard = null;
    awayTrigger = null;
  };

  const open = (trigger) => {
    if (dialog.open || openTimer) return;
    // The page behind must not scroll (Lenis ignores the overflow lock).
    document.documentElement.classList.add("lead-modal-open");
    window.lenis?.stop();
    heldScrollY = window.scrollY;
    watchKeyboard(true);

    awayCard = trigger.closest(".j-card");
    if (!awayCard) {
      heroExit ??= createHeroExit();
      heroExit?.timeScale(1).play();
      showDialog();
      return;
    }
    // The CSS drops, shrinks and fades the card; the modal comes in after.
    awayTrigger = trigger;
    awayCard.classList.add("is-modal-away");
    openTimer = setTimeout(
      () => {
        openTimer = 0;
        showDialog();
      },
      reducedMotion.matches ? 0 : CARD_EXIT_MS,
    );
  };

  const showDialog = () => {
    dialog.classList.remove("is-closing");
    dialog.showModal();
    // The card's content follows the card in, a beat behind it.
    if (!reducedMotion.matches) {
      // Not the close button: its CSS transform transition would fight gsap.
      // Opacity, not autoAlpha: visibility: hidden would block the focus below.
      gsap.fromTo(
        panel.querySelectorAll(":scope > :not(.lead-modal-close)"),
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, delay: 0.15, stagger: 0.05, ease: "expo.out", overwrite: true },
      );
    }
    // Desktop: straight to the only required field. On phones this would
    // pop the keyboard over the form before it is even read, so focus the
    // title instead: showModal() alone would ring the close button.
    if (finePointer.matches) email?.focus({ preventScroll: true });
    else title?.focus({ preventScroll: true });
  };

  let closeTimer = 0;
  const finishClose = () => {
    if (!closing) return;
    clearTimeout(closeTimer);
    closing = false;
    dialog.classList.remove("is-closing");
    dialog.close();
  };

  const close = () => {
    if (!dialog.open || closing) return;
    closing = true;
    // Start the hero's return with the modal's exit, not after it, and a
    // touch faster: the page should feel back as soon as the card drops. A
    // journey card waits for the modal to be gone (the close event below).
    heroExit?.timeScale(1.25).reverse();
    if (reducedMotion.matches) {
      finishClose();
      return;
    }
    dialog.classList.add("is-closing");
    dialog.addEventListener("animationend", finishClose, { once: true });
    // animationend never fires in a background tab or on a busy main thread.
    closeTimer = setTimeout(finishClose, 650);
  };

  // Runs for every way out (the button, a forced Escape, form method=dialog).
  dialog.addEventListener("close", () => {
    // Closed without close() (form method=dialog): bring the hero back too.
    // The journey card only comes back now, once the modal has left.
    if (heroExit && !heroExit.reversed()) heroExit.timeScale(1.25).reverse();
    watchKeyboard(false);
    bringCardBack();
    document.documentElement.classList.remove("lead-modal-open");
    window.lenis?.start();
  });

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(trigger);
    });
  });

  // Only the close button closes the modal: a stray click on the backdrop or
  // Escape would throw away a half-written form. (Chrome may still force a
  // close on repeated Escape presses; the close listener above handles it.)
  dialog.querySelector(".lead-modal-close")?.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => event.preventDefault());
}
