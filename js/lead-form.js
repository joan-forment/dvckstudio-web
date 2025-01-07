// Lead form: client-side validation plus an AJAX submit to FormSubmit, with
// the regular POST as the no-JS fallback. Shared by the home journey and the
// contact page.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// Drawn by css/home-journey.css when the success message appears. pathLength
// lets the CSS draw both strokes with the same dash values.
const TICK_SVG = `<svg class="lead-tick" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
  <circle cx="26" cy="26" r="24" pathLength="1" />
  <path d="M15 27.5l7.5 7.5L38 19" pathLength="1" />
</svg>`;

export function setupLeadForm(form, { source = "lead_form" } = {}) {
  if (!form || form.dataset.leadReady) return;
  form.dataset.leadReady = "true";

  const email = form.querySelector("input[type='email']");
  const error = form.querySelector(".lead-error");
  const status = form.querySelector(".lead-status");
  const submit = form.querySelector("button[type='submit']");
  const submitLabel = submit?.querySelector(".lead-submit-label");
  const success = form.parentElement.querySelector(".lead-success");
  const endpoint = form.dataset.ajaxEndpoint;
  const idleLabel = submitLabel?.textContent;

  const showError = (message) => {
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
    email.setAttribute("aria-invalid", message ? "true" : "false");
  };

  if (success && !success.querySelector(".lead-tick")) success.insertAdjacentHTML("afterbegin", TICK_SVG);

  const showSuccess = async ({ animate = false } = {}) => {
    // The form fades up and out first; the tick draws in once it is gone.
    if (animate && !reducedMotion.matches && form.animate) {
      const exit = form.animate(
        [{ opacity: 1 }, { opacity: 0, transform: "translateY(-0.75rem)" }],
        { duration: 260, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" },
      );
      await exit.finished.catch(() => {});
      form.hidden = true;
      exit.cancel();
    } else {
      form.hidden = true;
    }
    if (success) {
      success.hidden = false;
      success.focus({ preventScroll: true });
    }
  };

  // Returning from the no-JS fallback redirect (or the hero form).
  const params = new URLSearchParams(window.location.search);
  if (params.has("enviado") || params.get("newsletter") === "sent") {
    showSuccess();
    params.delete("enviado");
    params.delete("newsletter");
    const query = params.toString();
    history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }

  email.addEventListener("input", () => {
    if (email.getAttribute("aria-invalid") === "true" && EMAIL_PATTERN.test(email.value.trim())) {
      showError("");
    }
  });

  form.addEventListener("submit", async (event) => {
    const value = email.value.trim();
    if (!EMAIL_PATTERN.test(value)) {
      event.preventDefault();
      showError("Escribe un email válido para poder responderte.");
      email.focus();
      return;
    }
    showError("");

    // Without fetch the form falls back to the regular POST.
    if (!endpoint || !window.fetch) return;
    event.preventDefault();

    const data = new FormData(form);
    const payload = {};
    data.forEach((fieldValue, key) => {
      payload[key] = payload[key] ? `${payload[key]}, ${fieldValue}` : fieldValue;
    });
    payload.email = value;

    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    if (submitLabel) submitLabel.textContent = "Enviando…";
    if (status) status.textContent = "";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      // FormSubmit only answers for domains activated from the inbox, and
      // localhost is not one. In dev, show the success state anyway so it
      // can be reviewed; the warning says the email did not go out.
      if (import.meta.env.DEV && /activation/i.test(result.message || "")) {
        console.warn(`FormSubmit (solo en dev, no se ha enviado): ${result.message}`);
        showSuccess({ animate: true });
        return;
      }
      if (!response.ok || String(result.success) !== "true") {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      window.dataLayer?.push({ event: "generate_lead", form: source });
      showSuccess({ animate: true });
    } catch (requestError) {
      console.error("No se pudo enviar el formulario", requestError);
      if (status) {
        status.textContent =
          "No hemos podido enviarlo. Inténtalo de nuevo o escríbenos a contact@dvckstudio.com.";
      }
    } finally {
      submit.disabled = false;
      form.removeAttribute("aria-busy");
      if (submitLabel) submitLabel.textContent = idleLabel;
    }
  });
}
