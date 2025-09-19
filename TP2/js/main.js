/* ==============================
   GAMEBIT · JS PRINCIPAL (Home)
   ============================== */

// Loader con % (~5s)
(function () {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  const progress = overlay.querySelector('.progress');
  const pct = overlay.querySelector('#pct');
  let n = 0;

  const t = setInterval(() => {
    n = Math.min(100, n + Math.floor(Math.random() * 10) + 6);
    progress.style.width = n + '%';
    pct.textContent = n + '%';
    if (n >= 100) {
      clearInterval(t);
      setTimeout(() => overlay.remove(), 300);
    }
  }, 320);
})();

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
