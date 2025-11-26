/**
 * MAIN.JS - INICIALIZACIÓN Y GAME LOOP
 * Punto de entrada del juego
 * Coordina el patrón MVC y el game loop principal
 */

// Instancias MVC
let gameModel;
let gameView;
let gameController;

// Game Loop
let animationFrameId;
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let currentFPS = 0;

/**
 * Inicializa el juego
 */
function initGame() {

    
    // Crear instancias MVC
    gameModel = new GameModel();
    gameView = new GameView('game-canvas');
    gameController = new GameController(gameModel, gameView);
    

    
    // Iniciar game loop
    startGameLoop();
    

}

/**
 * Inicia el game loop principal
 */
function startGameLoop() {
    lastFrameTime = performance.now();
    gameLoop(lastFrameTime);
}

/**
 * Game loop principal
 */
function gameLoop(currentTime) {
    // Solicitar siguiente frame
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Calcular delta time
    const deltaTime = currentTime - lastFrameTime;
    
    // Limitar a targetFPS
    if (deltaTime < frameInterval) {
        return;
    }
    
    // Actualizar timestamp
    lastFrameTime = currentTime - (deltaTime % frameInterval);
    currentFPS = Math.round(1000 / deltaTime);
    
    // Actualizar lógica del juego
    update();
    
    // Renderizar
    render();
    // Parallax dinámico
   /* if (window.ParallaxManager && gameModel) {
        window.ParallaxManager.update(gameModel.gameSpeed * (gameModel.slowFactor || 1));
    }*/
    // Debug overlay
    updateDebugOverlay();
}

/**
 * Actualiza la lógica del juego
 */
function update() {
    // Actualizar modelo
    gameModel.update();
    
    // Actualizar UI
    gameController.updateUI();
}

/**
 * Renderiza el juego
 */
function render() {
    // Renderizar vista
    gameView.render(gameModel);
}

function updateDebugOverlay() {
    const el = document.getElementById('debug-overlay');
    if (!el || el.style.display === 'none') return;
    el.style.position = 'absolute';
    el.style.top = '5px';
    el.style.left = '5px';
    el.style.padding = '8px 12px';
    el.style.fontSize = '12px';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = '#fff';
    el.style.border = '1px solid #4a90e2';
    el.style.borderRadius = '6px';
    const m = gameModel;
    el.innerHTML = `FPS: ${currentFPS}<br>` +
        `Score: ${m.score} Lives: ${m.lives}<br>` +
        `Obstacles: ${m.obstacles.length} Enemies: ${m.enemies.length}<br>` +
        `Stars: ${m.stars.length} Gems: ${m.gems.length} PowerUps: ${m.powerUps.length}<br>` +
        `Speed: ${(m.gameSpeed * (m.slowFactor||1)).toFixed(2)} SlowFx: ${m.activeEffects.slow} ShieldFx: ${m.activeEffects.shield}`;
}

/**
 * Detiene el game loop (útil para debugging)
 */
function stopGameLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Reinicia el game loop
 */
function restartGameLoop() {
    stopGameLoop();
    startGameLoop();
}

// Event listeners para cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM ya está listo
    initGame();
}

// Manejar visibilidad de la página (pausar cuando no está visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pausar automáticamente si el juego está activo
        if (gameModel && gameModel.gameState === 'playing') {
            gameController.togglePause();
        }
    }
});

// Exponer funciones globales para debugging (opcional)
window.debugGame = {
    model: () => gameModel,
    view: () => gameView,
    controller: () => gameController,
    stop: stopGameLoop,
    restart: restartGameLoop,
    setSpeed: (speed) => { 
        if (gameModel) {
            gameModel.gameSpeed = speed;

        }
    },
    addScore: (points) => {
        if (gameModel) {
            gameModel.score += points;

        }
    },
    godMode: () => {
        if (gameModel) {
            gameModel.lives = 999;
            gameModel.player.invulnerable = true;
        }
    }
};

