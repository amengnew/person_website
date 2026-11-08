/* ============================================================
   Neko hero — CC0 cat portrait with a subtle pointer parallax
   - small JS: tilt the portrait toward the cursor (max ~7°)
   - click / Enter / tap emits "catmeow" (bubble is handled in script.js)
   - disabled automatically for prefers-reduced-motion
   - degrades to an emoji silhouette if the image fails to load
   ============================================================ */
(() => {
  "use strict";

  const figure = document.getElementById("catPortrait");
  if (!figure) return;

  const img = figure.querySelector("img");
  const fallback = figure.parentElement
    ? figure.parentElement.querySelector(".cat-portrait-fallback")
    : null;

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => reducedQuery.matches;

  /* ---------- image failure -> emoji fallback ---------- */
  function showFallback() {
    if (fallback) fallback.classList.add("show");
    figure.classList.add("cat-portrait--failed");
  }
  if (img) {
    if (img.complete && img.naturalWidth === 0) showFallback();
    img.addEventListener("error", showFallback);
  }

  /* ---------- meow ---------- */
  function meow() {
    window.dispatchEvent(new CustomEvent("catmeow"));
  }

  figure.addEventListener("click", meow);
  figure.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      meow();
    }
  });
  figure.tabIndex = 0;
  figure.setAttribute("role", "img");

  /* ---------- pointer parallax ---------- */
  const MAX_TILT = 7; // degrees
  const MAX_SHIFT = 10; // px
  let raf = 0;
  let target = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };

  function apply() {
    raf = 0;
    const tx = current.x;
    const ty = current.y;
    figure.style.transform =
      `perspective(900px) rotateY(${tx * MAX_TILT}deg) rotateX(${-ty * MAX_TILT}deg) ` +
      `translate3d(${tx * MAX_SHIFT}px, ${ty * MAX_SHIFT}px, 0)`;
  }

  function animate() {
    current.x += (target.x - current.x) * 0.16;
    current.y += (target.y - current.y) * 0.16;
    apply();
    if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
      raf = requestAnimationFrame(animate);
    }
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(animate);
  }

  function setFromPointer(clientX, clientY) {
    const rect = figure.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width; // 0..1
    const ny = (clientY - rect.top) / rect.height;
    target.x = Math.max(-1, Math.min(1, (nx - 0.5) * 2));
    target.y = Math.max(-1, Math.min(1, (ny - 0.5) * 2));
    kick();
  }

  function reset() {
    target.x = 0;
    target.y = 0;
    kick();
  }

  if (!isReduced()) {
    const stage = figure.closest(".hero-stage") || figure;
    stage.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      setFromPointer(e.clientX, e.clientY);
    }, { passive: true });
    stage.addEventListener("pointerleave", reset, { passive: true });
    figure.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") setFromPointer(e.clientX, e.clientY);
    }, { passive: true });
    figure.addEventListener("pointerup", () => {
      if (!isReduced()) reset();
    }, { passive: true });
  }

  // reset the tilt when the pointer leaves the window entirely
  window.addEventListener("blur", reset);

  window.catHero = {
    reset,
    stage: figure,
    element: figure,
  };
})();
