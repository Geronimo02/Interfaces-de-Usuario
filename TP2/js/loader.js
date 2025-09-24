 // Loader con % (~5s) usando tus IDs/clases del CSS
    (function () {
      const overlay = document.getElementById('loadingOverlay');
      if (!overlay) return;

      const progress = overlay.querySelector('.progress');
      const pct = overlay.querySelector('#pct');
      if (!progress || !pct) return;

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

    