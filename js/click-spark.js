// Vanilla port of React Bits "ClickSpark": short lines burst out from each click.
const SPARK_COLOR = "#ffffff";
const SPARK_SIZE = 10;
const SPARK_RADIUS = 15;
const SPARK_COUNT = 8;
const DURATION = 400;
const EXTRA_SCALE = 1;

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const canvas = Object.assign(document.createElement("canvas"), {
    id: "click-spark",
  });
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // A modal <dialog> sits in the top layer, above any z-index. As a manual
  // popover the canvas joins the top layer too, and showing it again puts it
  // back on top of whatever dialog opened after it.
  const canRaise = typeof canvas.showPopover === "function";
  if (canRaise) canvas.popover = "manual";
  const raise = () => {
    if (!canRaise) return;
    if (canvas.matches(":popover-open")) canvas.hidePopover();
    canvas.showPopover();
  };
  raise();
  new MutationObserver(() => {
    if (document.querySelector("dialog:modal")) raise();
  }).observe(document.body, { subtree: true, attributeFilter: ["open"] });

  let sparks = [],
    raf = null;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  const easeOut = (t) => t * (2 - t);

  // The loop only runs while sparks are alive.
  const tick = (now) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter((s) => {
      const elapsed = now - s.start;
      if (elapsed >= DURATION) return false;

      const eased = easeOut(elapsed / DURATION);
      const distance = eased * SPARK_RADIUS * EXTRA_SCALE;
      const length = SPARK_SIZE * (1 - eased);
      const cos = Math.cos(s.angle),
        sin = Math.sin(s.angle);

      ctx.strokeStyle = SPARK_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + distance * cos, s.y + distance * sin);
      ctx.lineTo(s.x + (distance + length) * cos, s.y + (distance + length) * sin);
      ctx.stroke();
      return true;
    });
    raf = sparks.length ? requestAnimationFrame(tick) : null;
  };

  addEventListener(
    "pointerdown",
    (e) => {
      const start = performance.now();
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / SPARK_COUNT, start });
      }
      raf ??= requestAnimationFrame(tick);
    },
    { passive: true },
  );
}
