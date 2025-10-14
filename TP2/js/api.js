document.addEventListener('DOMContentLoaded', () => {
  cargarJuegosEnSecciones();
});

async function cargarJuegosEnSecciones() {
  try {
    const response = await fetch('https://vj.interfaces.jima.com.ar/api/v2');
    if (!response.ok) {
      throw new Error('Error al obtener los juegos de la API');
    }
    const juegos = await response.json();

    // 1. Clasificar juegos por género
    const juegosPorGenero = {};
    juegos.forEach(juego => {
      juego.genres.forEach(genre => {
        if (!juegosPorGenero[genre.name]) {
          juegosPorGenero[genre.name] = [];
        }
        juegosPorGenero[genre.name].push(juego);
      });
    });

    // 2. Llenar cada sección del carrusel
    const contenedores = document.querySelectorAll('.games-row.hc-track[data-carousel]');
    contenedores.forEach(contenedor => {
      const genero = contenedor.dataset.carousel;
      const juegosDeEsteGenero = juegosPorGenero[genero];
      
      if (juegosDeEsteGenero) {
        // Limpiamos el contenedor por si tenía contenido harcodeado
        contenedor.innerHTML = ''; 
        // Llenamos con las cards de la API
        juegosDeEsteGenero.forEach(juego => {
          contenedor.innerHTML += crearCardHTML(juego);
        });
      }
    });

  } catch (error) {
    console.error('Fallo al cargar las secciones de juegos:', error);
  }
}

/**
 * Crea el string HTML para una tarjeta de juego, simulando precios y estados.
 * @param {object} juego - El objeto del juego de la API.
 * @returns {string} - El HTML de la card.
 */
function crearCardHTML(juego) {
  let tipoBadge = 'standard';
  let textoBadge = 'STANDARD';
  let gameDescHTML = '';
  
  // Generamos un precio falso basado en el rating para simular la lógica
  const precioSimulado = (juego.rating * 1.75).toFixed(2);

  // Lógica para definir el estado de la card
  if (juego.rating >= 4.5) {
    // Estado: SUSCRIPCIÓN (precio tachado)
    tipoBadge = 'suscripcion';
    textoBadge = 'SUSCRIPCIÓN';
    gameDescHTML = `<span class="tach">$${precioSimulado}</span> GRATIS con suscripción`;
  } else if (juego.rating >= 3.5) {
    // Estado: STANDARD (precio normal)
    tipoBadge = 'standard';
    textoBadge = 'STANDARD';
    gameDescHTML = `$${precioSimulado} GRATIS con suscripción`;
  } else {
    // Estado: GRATIS
    tipoBadge = 'gratis';
    textoBadge = 'GRATIS';
    gameDescHTML = 'GRATIS';
  }

  return `
    <div class="game-card ${tipoBadge}">
      <span class="badge ${tipoBadge}">${textoBadge}</span>
      <div class="card-media">
        <img src="${juego.background_image_low_res}" alt="${juego.name}">
      </div>
      <div class="card-content">
        <div class="game-title">${juego.name}</div>
        <div class="game-desc">${gameDescHTML}</div>
        <div class="btn-row">
          <button class="btn btn-play">Jugar</button>
          ${tipoBadge !== 'gratis' ? '<button class="btn btn-cart">Al Carrito</button>' : ''}
        </div>
      </div>
    </div>
  `;
}


// obtenerJuegos()
//   .then(juegos => mostrarJuegos(juegos))
//   .catch(error => {
//     const contenedor = document.getElementById('cards-container');
//     if (contenedor) contenedor.innerHTML = `<p>Error al cargar los juegos</p>`;
//     console.error('Error al obtener los juegos:', error);
//   });