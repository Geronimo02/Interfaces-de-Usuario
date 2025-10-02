// Galería 3D: navegación con botones
// Asume que hay un solo slider en la página

document.addEventListener('DOMContentLoaded', function () {
  const slider = document.querySelector('.banner .slider');
  const btnPrev = document.querySelector('.gallery-nav-left');
  const btnNext = document.querySelector('.gallery-nav-right');
  if (!slider || !btnPrev || !btnNext) return;

  const items = slider.querySelectorAll('.item');
  const quantity = items.length;
  let current = 0; // índice del item activo

  function updateSlider() {
    items.forEach((item, idx) => {
      // Calcular el ángulo relativo al activo (mínima rotación)
      let rel = (idx - current + quantity) % quantity;
      if (rel > quantity / 2) rel -= quantity; // el camino más corto
      const angle = rel * (360 / quantity);
      item.style.transform = `rotateY(${angle}deg) translateZ(200px)`;
      item.classList.toggle('active', idx === current);
    });
  }

  btnPrev.addEventListener('click', () => {
    current = (current - 1 + quantity) % quantity;
    updateSlider();
  });

  btnNext.addEventListener('click', () => {
    current = (current + 1) % quantity;
    updateSlider();
  });

  updateSlider();
});
