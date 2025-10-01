document.addEventListener('DOMContentLoaded', () => {
      const loadingOverlay = document.getElementById('loadingOverlay');
      const mainContent = document.getElementById('mainContent');
      const pct = document.getElementById('pct');
      const progress = document.querySelector('.progress');

      const duration = 5000; // 5 segundos
      let startTime = null;

      function animateLoader(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const percentage = Math.min(Math.floor((elapsed / duration) * 100), 100);

        if (pct) pct.textContent = percentage + '%';
        if (progress) progress.style.width = percentage + '%';

        if (elapsed < duration) {
          requestAnimationFrame(animateLoader);
        } else {
          // Simulación terminada: Oculta el loader y muestra el contenido principal
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          if (mainContent) mainContent.style.display = 'block';
        }
      }

      // Iniciar la animación del loader
      requestAnimationFrame(animateLoader);
    });

