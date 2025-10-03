class GameLoader {
    constructor() {
        this.loadingTexts = [
            "Inicializando juego...",
            "Cargando assets de Los Simpson...",
            "Preparando tablero...",
            "Configurando fichas...",
            "Aplicando lógica del juego...",
            "Optimizando rendimiento...",
            "Casi listo..."
        ];
        
        this.currentTextIndex = 0;
        this.progress = 0;
        this.isLoading = true;
        
        this.progressFill = document.getElementById('progress-fill');
        this.progressPercentage = document.getElementById('loading-percentage');
        this.loadingText = document.getElementById('loading-text');
        this.loadingScreen = document.getElementById('game-loading');
        this.readyScreen = document.getElementById('game-ready');
        
        this.startLoading();
    }

    startLoading() {
        // Simular carga progresiva
        this.loadingInterval = setInterval(() => {
            this.updateProgress();
        }, 150);
        
        // Cambiar texto cada 1.5 segundos
        this.textInterval = setInterval(() => {
            this.updateLoadingText();
        }, 1500);
    }

    updateProgress() {
        if (this.progress < 100) {
            // Incremento variable para hacer más realista
            const increment = Math.random() * 3 + 1;
            this.progress = Math.min(100, this.progress + increment);
            
            // Actualizar UI
            this.progressFill.style.width = `${this.progress}%`;
            this.progressPercentage.textContent = `${Math.floor(this.progress)}%`;
            
            // Efectos visuales según progreso
            if (this.progress > 25) {
                this.progressFill.style.boxShadow = '0 0 15px rgba(90, 159, 212, 0.6)';
            }
            
            if (this.progress > 75) {
                this.progressFill.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
                this.progressFill.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.7)';
            }
            
            // Completar carga
            if (this.progress >= 100) {
                this.completeLoading();
            }
        }
    }

    updateLoadingText() {
        if (this.currentTextIndex < this.loadingTexts.length - 1) {
            this.currentTextIndex++;
            this.loadingText.textContent = this.loadingTexts[this.currentTextIndex];
            
            // Efecto de fade para el cambio de texto
            this.loadingText.style.animation = 'none';
            setTimeout(() => {
                this.loadingText.style.animation = 'fadeInUp 0.5s ease-out';
            }, 10);
        }
    }

    completeLoading() {
        clearInterval(this.loadingInterval);
        clearInterval(this.textInterval);
        
        this.loadingText.textContent = "¡Carga completada!";
        this.progressPercentage.textContent = "100%";
        
        // Esperar un momento antes de mostrar la pantalla de listo
        setTimeout(() => {
            this.showReadyScreen();
        }, 1000);
    }

    showReadyScreen() {
        // Ocultar pantalla de carga con animación
        this.loadingScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.readyScreen.style.display = 'block';
            this.readyScreen.style.animation = 'scaleIn 0.8s ease-out both';
            
            // Bind play button
            const playButton = document.getElementById('play-button');
            playButton.addEventListener('click', () => {
                this.startGame();
            });
        }, 500);
    }

    startGame() {
        const playButton = document.getElementById('play-button');
        
        // Animación del botón
        playButton.style.transform = 'scale(0.95)';
        playButton.textContent = '🎮 Iniciando...';
        
        setTimeout(() => {
            this.showGameMessage();
        }, 1000);
    }

    showGameMessage() {
        const readyContent = document.querySelector('.game-ready-content');
        
        // Crear mensaje de juego iniciado
        const gameMessage = document.createElement('div');
        gameMessage.className = 'game-started-message';
        gameMessage.innerHTML = `
            <h2>🎉 ¡Juego Iniciado!</h2>
            <p>El Peg Solitaire de Los Simpson está listo para jugar.</p>
            <div class="simpson-quote">
                <p>"¡D'oh! ¡Hora de jugar!" - Homer Simpson</p>
            </div>
        `;
        
        // Estilos inline para el mensaje
        gameMessage.style.cssText = `
            text-align: center;
            padding: 2rem;
            background: rgba(76, 175, 80, 0.1);
            border: 2px solid #4caf50;
            border-radius: 1rem;
            margin-top: 2rem;
            animation: fadeInUp 0.6s ease-out;
        `;
        
        readyContent.appendChild(gameMessage);
        
        // Ocultar botón de play
        document.getElementById('play-button').style.display = 'none';
    }
}

// Animación adicional para fadeOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
    
    .game-started-message h2 {
        color: #4caf50;
        margin-bottom: 1rem;
        font-size: 1.8rem;
    }
    
    .game-started-message p {
        color: #fff;
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    
    .simpson-quote {
        background: rgba(255, 215, 0, 0.1);
        border-left: 4px solid #ffd700;
        padding: 1rem;
        border-radius: 0.5rem;
        font-style: italic;
    }
    
    .simpson-quote p {
        color: #ffd700;
        margin: 0;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para que se vean las animaciones iniciales
    setTimeout(() => {
        new GameLoader();
    }, 2000);
});
