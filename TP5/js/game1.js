// ==========================================================================
// 1. CONSTANTES Y CONFIGURACIÓN INICIAL
// ==========================================================================

import { Pajaro } from './Pajaro.js';
import { Enemigo } from './Enemigo.js';
import { Cano, ParCano } from './Cano.js';
import { bird_sprite, ENEMY_SPRITE_1, PIPE_GREEN } from './constantes.js';

document.addEventListener('DOMContentLoaded', () => {
const gameContainer = document.getElementById('game-container');
// Almacenes para nuestros objetos de juego
let enemigos = [];
let paresCanos = [];
let pajaro;
let gameLoopId;
let isGameOver = false;

function startGame() {
        enemigos.forEach(e => e.destruir());
        paresCanos.forEach(pc => pc.destruir());
        enemigos = [];
        paresCanos = [];
        pajaro = new Pajaro(100, window.innerHeight / 2, gameContainer, gameOver);
        isGameOver = false;
        document.getElementById('game-over-screen').style.display = 'none';
        gameLoop();
    }

// Función para manejar el fin del juego
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoopId);
    // Aquí puedes agregar lógica para mostrar la pantalla de Game Over
}

// Al crear instancias:
pajaro = new Pajaro(100, window.innerHeight / 2, gameContainer, gameOver);
// enemigos.push(new Enemigo(gameRect.width, y, gameContainer));
// paresCanos.push(new ParCano(gameRect.width, gameContainer));

// Inicializa el primer enemigo y caño (asegúrate de definir gameRect y y)
const gameRect = gameContainer.getBoundingClientRect();
const y = Math.random() * (gameRect.height - 70);
enemigos.push(new Enemigo(gameRect.width, y, gameContainer));
paresCanos.push(new ParCano(gameRect.width, gameContainer));



// Variables de estado del juego


// ==========================================================================
// 2. CLASES DE LOS PERSONAJES
// ==========================================================================









// ==========================================================================
// 3. LÓGICA PRINCIPAL DEL JUEGO
// ==========================================================================

function updateGameObjects() {
    // Actualizar y eliminar enemigos que salen de pantalla
    for (let i = enemigos.length - 1; i >= 0; i--) {
        enemigos[i].update();
        if (enemigos[i].getRect().right < 0) {
            enemigos[i].destruir();
            enemigos.splice(i, 1);
        }
    }
    // Actualizar y eliminar pares de caños que salen de pantalla
    for (let i = paresCanos.length - 1; i >= 0; i--) {
        paresCanos[i].update();
        if (paresCanos[i].x < -100) { // Usa la 'x' compartida del par
            paresCanos[i].destruir();
            paresCanos.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (pajaro.estado === 'invencible' || pajaro.estado === 'muerto') return;

    const pajaroRect = pajaro.getRect();
    
    // Colisión con enemigos
    for (const enemigo of enemigos) {
        const enemigoRect = enemigo.getRect();
        if (
            pajaroRect.left < enemigoRect.right &&
            pajaroRect.right > enemigoRect.left &&
            pajaroRect.top < enemigoRect.bottom &&
            pajaroRect.bottom > enemigoRect.top
        ) {
            pajaro.recibirDanio();
            return; // Salimos para procesar solo una colisión por frame
        }
    }
    
    // Colisión con caños
    for (const parCano of paresCanos) {
        for (const cano of parCano.canos) {
            const canoRect = cano.getRect();
            if (
                pajaroRect.left < canoRect.right &&
                pajaroRect.right > canoRect.left &&
                pajaroRect.top < canoRect.bottom &&
                pajaroRect.bottom > canoRect.top
            ) {
                pajaro.recibirDanio();
                return;
            }
        }
    }
}

function gameLoop() {
    if (isGameOver) return;
    
    // 1. Actualizar la posición de todos los objetos
    pajaro.update();
    updateGameObjects();
    
    // 2. Comprobar colisiones
    checkCollisions();
    
    // 3. Solicitar el siguiente frame
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoopId); // Detiene el bucle del juego
    document.getElementById('game-over-screen').style.display = 'flex';
}

function startGame() {
    // Limpiar objetos de partidas anteriores
    enemigos.forEach(e => e.destruir());
    paresCanos.forEach(pc => pc.destruir());
    enemigos = [];
    paresCanos = [];
    
    // Crear el pájaro
    pajaro = new Pajaro(100, window.innerHeight / 2, gameContainer, gameOver);
    
    // Reiniciar estado
    isGameOver = false;
    document.getElementById('game-over-screen').style.display = 'none';

    // Iniciar el bucle de juego
    gameLoop();
}


// ==========================================================================
// 4. INICIO DEL JUEGO Y MANEJADORES DE EVENTOS
// ==========================================================================

// Spawners de enemigos y caños
setInterval(() => {
    if (!isGameOver) {
        const gameRect = gameContainer.getBoundingClientRect();
        const y = Math.random() * (gameRect.height - 70);
        enemigos.push(new Enemigo(gameRect.width, y, gameContainer));
    }
}, 4000); // Un enemigo nuevo cada 4 segundos

setInterval(() => {
    if (!isGameOver) {
        const gameRect = gameContainer.getBoundingClientRect();
        paresCanos.push(new ParCano(gameRect.width, gameContainer));
    }
}, 3000); // Un par de caños nuevo cada 3 segundos

// Evento para volar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        pajaro.volar();
    }
});

// Evento para el botón de reiniciar
document.getElementById('restart-button').addEventListener('click', () => {
    startGame();
});

// Iniciar el juego por primera vez
startGame();

});