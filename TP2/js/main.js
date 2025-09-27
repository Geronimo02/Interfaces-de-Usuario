
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

  