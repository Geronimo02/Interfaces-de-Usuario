// carrusel.js
document.addEventListener("DOMContentLoaded", () => {
  const scope = document.querySelector(".section.destacados");
  if (!scope) return;

  const banners = scope.querySelectorAll(".carousel .carousel-banner");
  const prevBtn = scope.querySelector(".carousel .carousel-prev");
  const nextBtn = scope.querySelector(".carousel .carousel-next");

  // Elementos de meta que están debajo del banner
  const titleEl = scope.querySelector(".destacados-title");
  const descEl = scope.querySelector(".destacados-desc");

  let current = 0;
  let timer = null;
  const INTERVAL = 5000;

  function applyMeta(i) {
    const b = banners[i];
    const titleNode = b.querySelector(".banner-title");
    const descNode = b.querySelector(".banner-desc");
    const title = titleNode?.textContent?.trim() || b.querySelector("img")?.alt || "";
    const descHtml = descNode ? descNode.innerHTML : "";
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.innerHTML = descHtml;
  }
  function showSlide(i) {
    banners.forEach((ban, idx) => ban.classList.toggle("active", idx === i));
    applyMeta(i);
  }

  function next() {
    current = (current + 1) % banners.length;
    showSlide(current);
  }

  function prev() {
    current = (current - 1 + banners.length) % banners.length;
    showSlide(current);
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, INTERVAL);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // Eventos
  nextBtn?.addEventListener("click", () => {
    next();
    startAutoplay();
  });
  prevBtn?.addEventListener("click", () => {
    prev();
    startAutoplay();
  });

  // Accesibilidad – teclado
  scope.querySelector(".carousel")?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { next(); startAutoplay(); }
    if (e.key === "ArrowLeft")  { prev(); startAutoplay(); }
  });

  // Pausa al pasar el mouse
  const carouselEl = scope.querySelector(".carousel");
  carouselEl?.addEventListener("mouseenter", stopAutoplay);
  carouselEl?.addEventListener("mouseleave", startAutoplay);

  // Init
  showSlide(current);
  startAutoplay();
});
// Carrusel horizontal para secciones
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".hcarousel").forEach((wrap) => {
    const track = wrap.querySelector(".hc-track");
    const prev = wrap.querySelector(".hc-prev");
    const next = wrap.querySelector(".hc-next");
    if (!track) return;

    const page = () => track.clientWidth * 0.95;
    const doScroll = (delta) => track.scrollBy({ left: delta, behavior: "smooth" });

    prev?.addEventListener("click", () => doScroll(-page()));
    next?.addEventListener("click", () => doScroll(page()));

    let isDragging = false;
    let startX = 0;
    let startScroll = 0;

    track.addEventListener("pointerdown", (evt) => {
      isDragging = true;
      startX = evt.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(evt.pointerId);
    });

    track.addEventListener("pointermove", (evt) => {
      if (!isDragging) return;
      const dx = evt.clientX - startX;
      track.scrollLeft = startScroll - dx;
    });

    ["pointerup", "pointercancel", "mouseleave"].forEach((type) => {
      track.addEventListener(type, () => {
        isDragging = false;
      });
    });

    track.addEventListener("keydown", (evt) => {
      if (evt.key === "ArrowRight") doScroll(page());
      if (evt.key === "ArrowLeft") doScroll(-page());
    });

    const toggleArrows = () => {
      const hasOverflow = track.scrollWidth > track.clientWidth + 1;
      [prev, next].forEach((btn) => {
        if (!btn) return;
        btn.hidden = !hasOverflow;
      });
    };

    toggleArrows();
    window.addEventListener("resize", toggleArrows);
  });
});







