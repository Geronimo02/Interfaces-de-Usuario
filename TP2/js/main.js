(function () {
  const btnMenu = document.getElementById('btnMenu');
  const btnCloseMenu = document.getElementById('btnCloseMenu');
  const drawer = document.getElementById('sidebarNav');
  const scrimMenu = document.getElementById('scrimMenu');

  const btnProfile = document.getElementById('btnProfile');
  const dropdown = document.getElementById('profileDropdown');
  const scrimProfile = document.getElementById('scrimProfile');

  // Drawer
  function openDrawer() {
    drawer.classList.add('open');
    scrimMenu.hidden = false;
    btnMenu.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    scrimMenu.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  }

  // Perfil
  function toggleDropdown() {
    const open = dropdown.classList.toggle('open');
    scrimProfile.hidden = !open;
    btnProfile.setAttribute('aria-expanded', open ? 'true' : 'false');
    dropdown.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  function closeDropdown() {
    dropdown.classList.remove('open');
    scrimProfile.hidden = true;
    btnProfile.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
  }

  // Listeners
  btnMenu && btnMenu.addEventListener('click', openDrawer);
  btnCloseMenu && btnCloseMenu.addEventListener('click', closeDrawer);
  scrimMenu && scrimMenu.addEventListener('click', closeDrawer);

  btnProfile && btnProfile.addEventListener('click', toggleDropdown);
  scrimProfile && scrimProfile.addEventListener('click', closeDropdown);

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeDropdown();
    }
  });
})();




// Mejora progresiva: sincroniza meta leyendo del DOM (no de data-*) -->

document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.section.destacados .carousel');
  if (!carousel) return;

  const titleEl = document.querySelector('.destacados-title');
  const descEl  = document.querySelector('.destacados-desc');
  const banners = Array.from(carousel.querySelectorAll('.carousel-banner'));

  const getActive = () => carousel.querySelector('.carousel-banner.active') || banners[0];

  function applyMetaFrom(banner) {
    const t = banner.querySelector('.banner-title')?.textContent?.trim() || '';
    const d = banner.querySelector('.banner-desc')?.innerHTML?.trim() || '';
    if (titleEl) titleEl.textContent = t;
    if (descEl)  descEl.innerHTML   = d;
  }

  // Inicial (por si el HTML precargado fuera distinto)
  applyMetaFrom(getActive());

  // Botones del carrusel
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  function updateSoon(){ setTimeout(() => applyMetaFrom(getActive()), 0); }
  prev && prev.addEventListener('click', updateSoon);
  next && next.addEventListener('click', updateSoon);

  // Por si el cambio de slide lo hace otro script/auto-rotación
  const obs = new MutationObserver(updateSoon);
  banners.forEach(b => obs.observe(b, { attributes: true, attributeFilter: ['class'] }));
});

  
=======
// API Fetch y renderizado dinámico
/*document.addEventListener("DOMContentLoaded", async () => {
  // === 1. Cargar destacados ===
  try {
    const res = await fetch('/Interfaces-de-Usuario/api-vj-interfaces/games.json');
    const juegos = await res.json();

    // Puedes cambiar el criterio de destacados aquí:
    const destacados = juegos.slice(0, 5); // Ejemplo: primeros 5
    const carousel = document.querySelector('.section.destacados .carousel');
    if (carousel && Array.isArray(destacados)) {
      carousel.innerHTML = destacados.map((item, idx) => `
        <div class="carousel-banner${idx === 0 ? ' active' : ''}"
             data-title="${item.name}"
             data-desc="<span class='tach'>$3.99</span> GRATIS con suscripcion"
             data-progress="45">
          <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
          <img src="${item.background_image}" alt="${item.name}">
        </div>
      `).join('') + `
        <button class="carousel-prev" aria-label="Anterior">&#9664;</button>
        <button class="carousel-next" aria-label="Siguiente">&#9654;</button>
      `;
    }
  } catch (e) {
    console.error('Error cargando destacados:', e);
  }

  // === 2. Cargar categorías ===
  try {
    const res = await fetch('/Interfaces-de-Usuario/api-vj-interfaces/games.json');
    const juegos = await res.json();
    // Obtener géneros únicos del campo genre
    const categorias = [...new Set(juegos.map(j => j.genre).filter(Boolean))];
    for (const cat of categorias) {
      const res = await fetch(`https://api.example.com/categorias/${cat}`);
      const juegos = await res.json();

      const track = document.querySelector(`.hcarousel[data-carousel="${cat}"] .hc-track`);
      if (track && Array.isArray(juegos)) {
        track.innerHTML = '';
        juegos.forEach(juego => {
          track.innerHTML += `
            <div class="game-card ${juego.badgeClass}">
              <span class="badge ${juego.badgeClass}">${juego.badgeText}</span>
              <div class="card-media">
                <img src="${juego.img}" alt="${juego.title}">
              </div>
              <div class="card-content">
                <div class="game-title">${juego.title}</div>
                <div class="game-desc">${juego.desc}</div>
                <div class="btn-row">
                  <button class="btn btn-play">Jugar</button>
                  <button class="btn btn-cart">Al Carrito</button>
                </div>
              </div>
            </div>
          `;
        });
      }
    } 
  }catch (e) {
      console.error(`Error cargando categoría ${cat}:`, e);
    }
})()*/;

