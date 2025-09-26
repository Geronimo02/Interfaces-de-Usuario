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
