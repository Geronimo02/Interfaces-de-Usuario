// Carrusel con dots y autoplay
export function initCarousel(root) {
  const track = root.querySelector('.carousel__track');
  const dots = root.querySelector('.carousel__dots');
  const slides = track.children;
  let current = 0;

  function go(i) {
    current = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    [...dots.children].forEach((d, idx) =>
      d.classList.toggle('carousel__dot--active', idx === current)
    );
  }

  // Crear dots
  for (let i = 0; i < slides.length; i++) {
    const d = document.createElement('button');
    d.className = 'carousel__dot' + (i === 0 ? ' carousel__dot--active' : '');
    d.addEventListener('click', () => go(i));
    dots.appendChild(d);
  }

  // Autoplay cada 4s
  setInterval(() => go(current + 1), 4000);
}
