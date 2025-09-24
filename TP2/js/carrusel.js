// carrusel.js
document.addEventListener("DOMContentLoaded", () => {
  const scope = document.querySelector(".section.destacados");
  if (!scope) return;

  const banners = scope.querySelectorAll(".carousel .carousel-banner");
  const prevBtn = scope.querySelector(".carousel .carousel-prev");
  const nextBtn = scope.querySelector(".carousel .carousel-next");

  // Elementos de meta que están debajo del banner
  const titleEl = scope.querySelector(".game-title");
  const descEl = scope.querySelector(".game-desc");
  const progressEl = scope.querySelector(".progress");

  let current = 0;
  let timer = null;
  const INTERVAL = 5000;

  function applyMeta(i) {
    const b = banners[i];
    const title = b.dataset.title || (b.querySelector("img")?.alt ?? "");
    const desc = b.dataset.desc || "";
    const progress = parseInt(b.dataset.progress || "0", 10);

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.innerHTML = desc;
    if (progressEl) progressEl.style.width = Math.max(0, Math.min(progress, 100)) + "%";
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


// ===== Carrusel horizontal de cards (secciones) =====
document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".hcarousel");

  carousels.forEach((wrap) => {
    const track = wrap.querySelector(".hc-track");
    const prev  = wrap.querySelector(".hc-prev");
    const next  = wrap.querySelector(".hc-next");

    if (!track) return;

    const scrollAmount = () => Math.round(track.clientWidth * 0.9);

    function doScroll(delta) {
      track.scrollBy({ left: delta, behavior: "smooth" });
    }

    prev?.addEventListener("click", () => doScroll(-scrollAmount()));
    next?.addEventListener("click", () => doScroll(scrollAmount()));

    // Drag/Swipe básico
    let isDown = false, startX = 0, startScroll = 0;

    track.addEventListener("pointerdown", (e) => {
      isDown = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      track.scrollLeft = startScroll - dx;
    });

    ["pointerup", "pointercancel", "mouseleave"].forEach(evt =>
      track.addEventListener(evt, () => (isDown = false))
    );

    // Teclado (cuando el foco está en el track)
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") doScroll(scrollAmount());
      if (e.key === "ArrowLeft")  doScroll(-scrollAmount());
    });
  });
});
