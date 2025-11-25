// Main game logic and initialization

// Game controller instance
const gameController = new GameController();

// Wait for the window to load before starting the game
window.addEventListener('load', () => {
    // Remove the loading screen after a short delay
    setTimeout(removeLoadingScreen, 500);

    // Preload assets and resources
    preloadAssets().then(() => {
        // Start the game
        gameController.startGame();
    }).catch(error => {
        console.error('Error preloading assets:', error);
        showGameError('Error loading game assets. Please refresh the page to try again.');
    });
});

// FPS monitoring and display
let lastFrameTime = performance.now();
let currentFPS = 60;

function updateFPS() {
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    lastFrameTime = now;

    currentFPS = Math.round(1000 / deltaTime);

    // Log performance warnings
    if (currentFPS < 30) {
        console.warn(`⚠️ Low FPS detected: ${currentFPS} FPS`);
    }
    
    // Update FPS display if debug mode is enabled
    updateFPSDisplay(currentFPS);
}

requestAnimationFrame(updateFPS);

function updateFPSDisplay(fps) {
    // Create FPS counter if in debug mode
    if (window.location.search.includes('debug=true')) {
        let fpsCounter = document.getElementById('fpsCounter');
        if (!fpsCounter) {
            fpsCounter = document.createElement('div');
            fpsCounter.id = 'fpsCounter';
            fpsCounter.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: #00ffff;
                padding: 5px 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
            `;
            document.body.appendChild(fpsCounter);
        }
        fpsCounter.textContent = `FPS: ${fps}`;
    }
}

function removeLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

function showGameError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-family: 'Orbitron', monospace;
    `;
    errorDiv.innerHTML = `
        <h3>⚠️ Error</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.remove()" style="
            padding: 5px 10px;
            background: white;
            color: black;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin-top: 10px;
        ">OK</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Development utilities
if (window.location.search.includes('debug=true')) {
    // Add debug commands to window
    window.gameDebug = {
        getGameState: () => gameController?.getGameState(),
        addEnemy: (type = 'drone') => {
            if (gameController?.gameModel) {
                gameController.gameModel.spawnEnemy();
            }
        },
        addCollectible: (type = 'crystal') => {
            if (gameController?.gameModel) {
                gameController.gameModel.spawnCollectible();
            }
        },
        setHealth: (health) => {
            if (gameController?.gameModel?.player) {
                gameController.gameModel.player.health = health;
            }
        },
        setEnergy: (energy) => {
            if (gameController?.gameModel?.player) {
                gameController.gameModel.player.energy = energy;
            }
        },
        toggleGodMode: () => {
            if (gameController?.gameModel?.player) {
                gameController.gameModel.player.invulnerable = !gameController.gameModel.player.invulnerable;
                console.log('God mode:', gameController.gameModel.player.invulnerable);
            }
        }
    };
    
    console.log('🛠️ Debug mode enabled. Use window.gameDebug for development commands.');
}

// Preload assets and resources
function preloadAssets() {
    // This could be expanded to preload images, sounds, etc.
    return Promise.resolve();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause game when tab is hidden
        if (gameController?.gameModel?.gameState === 'playing') {
            gameController.pauseGame();
        }
    }
});

// Handle window beforeunload
window.addEventListener('beforeunload', (event) => {
    // Save game state if needed
    if (gameController?.gameModel?.gameState === 'playing') {
        // Could save progress here
        event.returnValue = '¿Estás seguro de que quieres salir del juego?';
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameController };
}