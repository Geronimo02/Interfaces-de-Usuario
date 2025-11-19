/**
 * GAMECONTROLLER.JS - CONTROLADOR DEL JUEGO
 * Maneja inputs del usuario y coordina Model-View
 * Patrón MVC - Controlador
 */

class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        // Referencias a elementos del DOM
        this.elements = {
            // Pantallas
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            
            // Botones
            startButton: document.getElementById('start-button'),
            pauseToggle: document.getElementById('pause-toggle'),
            muteToggle: document.getElementById('mute-toggle'),
            resumeButton: document.getElementById('resume-button'),
            restartButton: document.getElementById('restart-button'),
            restartButtonPause: document.getElementById('restart-button-pause'),
            menuButton: document.getElementById('menu-button'),
            
            // UI en juego
            scoreDisplay: document.getElementById('score'),
            timerDisplay: document.getElementById('timer'),
            livesDisplay: document.getElementById('lives'),
            
            // Estadísticas game over
            finalScore: document.getElementById('final-score'),
            finalTime: document.getElementById('final-time'),
            bestScore: document.getElementById('best-score')
        };
        this.debugOverlay = document.getElementById('debug-overlay');
        
        // Estado del input
        this.inputActive = false;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa el controlador
     */
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botones de pantallas
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.pauseToggle.addEventListener('click', () => this.togglePause());
    this.elements.muteToggle.addEventListener('click', () => this.toggleMute());
        this.elements.resumeButton.addEventListener('click', () => this.togglePause());
        this.elements.restartButton.addEventListener('click', () => this.restartGame());
        this.elements.restartButtonPause.addEventListener('click', () => this.restartGame());
        this.elements.menuButton.addEventListener('click', () => this.goToMenu());
        
        // Inputs de juego - Click
        this.view.canvas.addEventListener('click', () => this.handleJump());
        
        // Inputs de juego - Teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Redimensionar
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevenir menú contextual en canvas
        this.view.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Maneja el inicio del juego
     */
    startGame() {
        this.model.startGame();
        this.hideAllScreens();
        this.elements.pauseToggle.style.display = 'block';
        this.inputActive = true;
        if (window.SoundManager) window.SoundManager.startMusic();
    }
    
    /**
     * Maneja el reinicio del juego
     */
    restartGame() {
        this.model.reset();
        this.hideAllScreens();
        this.elements.pauseToggle.style.display = 'block';
        this.inputActive = true;
    }
    
    /**
     * Alterna pausa
     */
    togglePause() {
        if (this.model.gameState === 'playing' || this.model.gameState === 'paused') {
            this.model.togglePause();
            
            if (this.model.gameState === 'paused') {
                this.showScreen('pause');
            } else {
                this.hideAllScreens();
            }
        }
    }
    
    /**
     * Vuelve al menú
     */
    goToMenu() {
        this.model.gameState = 'start';
        this.hideAllScreens();
        this.showScreen('start');
        this.elements.pauseToggle.style.display = 'none';
        this.inputActive = false;
        if (window.SoundManager) window.SoundManager.stopMusic();
    }
    
    /**
     * Maneja el salto/impulso
     */
    handleJump() {
        if (this.model.gameState === 'playing' && this.inputActive) {
            this.model.applyJump();
        }
    }
    
    /**
     * Maneja eventos de teclado
     */
    handleKeyDown(e) {
        // Espacio para saltar
        if (e.code === 'Space') {
            e.preventDefault();
            this.handleJump();
        }
        
        // P para pausar
        if (e.code === 'KeyP' || e.code === 'Escape') {
            e.preventDefault();
            if (this.model.gameState === 'playing' || this.model.gameState === 'paused') {
                this.togglePause();
            }
        }
        // F para debug overlay
        if (e.code === 'KeyF') {
            if (this.debugOverlay) {
                const visible = this.debugOverlay.style.display !== 'none';
                this.debugOverlay.style.display = visible ? 'none' : 'block';
            }
        }
        
        // Enter para comenzar
        if (e.code === 'Enter') {
            if (this.model.gameState === 'start') {
                this.startGame();
            } else if (this.model.gameState === 'gameover') {
                this.restartGame();
            }
        }
    }
    
    /**
     * Maneja redimensionamiento
     */
    handleResize() {
        this.view.resize();
    }
    
    /**
     * Actualiza la UI
     */
    updateUI() {
        // Actualizar puntuación
        this.elements.scoreDisplay.textContent = this.model.score;
        
        // Actualizar timer
        this.elements.timerDisplay.textContent = this.model.getFormattedTime();
        
        // Actualizar vidas
        this.updateLivesDisplay();
        
        // Verificar game over
        if (this.model.gameState === 'gameover') {
            this.showGameOver();
        }
    }
    
    /**
     * Actualiza el display de vidas
     */
    updateLivesDisplay() {
        const lifeIcons = this.elements.livesDisplay.querySelectorAll('.life-icon');
        
        for (let i = 0; i < lifeIcons.length; i++) {
            if (i < this.model.lives) {
                lifeIcons[i].classList.remove('lost');
            } else {
                lifeIcons[i].classList.add('lost');
            }
        }
    }
    
    /**
     * Muestra pantalla de game over
     */
    showGameOver() {
        this.inputActive = false;
        this.elements.pauseToggle.style.display = 'none';
        if (window.SoundManager) window.SoundManager.fadeMusic(0, 500);
        
        // Actualizar estadísticas
        this.elements.finalScore.textContent = this.model.score;
        this.elements.finalTime.textContent = this.model.getFormattedTime();
        this.elements.bestScore.textContent = this.model.bestScore;
        
        // Mostrar pantalla después de un pequeño delay
        setTimeout(() => {
            this.showScreen('gameover');
        }, 600);
    }
    
    /**
     * Muestra una pantalla específica
     */
    showScreen(screenName) {
        this.hideAllScreens();
        
        switch(screenName) {
            case 'start':
                this.elements.startScreen.classList.add('active');
                break;
            case 'pause':
                this.elements.pauseScreen.classList.add('active');
                break;
            case 'gameover':
                this.elements.gameoverScreen.classList.add('active');
                break;
        }
    }
    
    /**
     * Oculta todas las pantallas
     */
    hideAllScreens() {
        this.elements.startScreen.classList.remove('active');
        this.elements.pauseScreen.classList.remove('active');
        this.elements.gameoverScreen.classList.remove('active');
    }

    /**
     * Toggle mute sounds
     */
    toggleMute() {
        if (!window.SoundManager) return;
        const muted = window.SoundManager.toggleMute();
        this.elements.muteToggle.textContent = muted ? '🔇' : '🔊';
    }
}
