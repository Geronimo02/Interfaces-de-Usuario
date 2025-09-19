// Loader (5 segundos con %)
export function initLoading() {
  const loading = document.querySelector('.loading');
  if (!loading) return;

  const bar = loading.querySelector('.progress__bar');
  const txt = loading.querySelector('.progress__text');

  let p = 0;
  const total = 5000; // ms
  const tick = 50;
  const step = 100 / (total / tick);

  const timer = setInterval(() => {
    p = Math.min(100, p + step);
    bar.style.width = p + '%';
    txt.textContent = 'Cargando ' + Math.floor(p) + '%';
    if (p >= 100) {
      clearInterval(timer);
      loading.classList.add('hide');
    }
  }, tick);
}
