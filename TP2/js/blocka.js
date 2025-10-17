// Blocka Game - Canvas-based puzzle game
(function() {
    'use strict';

    // Game configuration
    const CONFIG = {
        canvas: {
            width: 700,
            height: 400
        },
        piece: {
            cols: 2,
            rows: 2
        },
        filters: [
            { name: 'Escala de Grises', type: 'grayscale' },
            { name: 'Brillo 30%', type: 'brightness' },
            { name: 'Negativo', type: 'negative' }
        ],
        images: [
            '/Interfaces-de-Usuario/TP2/assets/img/17073_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/252578_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/254334_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/251922_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/250888_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/254590_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/254564_3.jpg',
            '/Interfaces-de-Usuario/TP2/assets/img/254518_3.jpg'
        ]
    };

    // Game state
    const gameState = {
        canvas: null,
        ctx: null,
        currentLevel: 0,
        pieces: [],
        originalImage: null,
        filteredImage: null,
        timer: 0,
        timerInterval: null,
        isPlaying: false,
        isGameStarted: false,
        isWon: false,
        currentImageIndex: -1
    };

    // Piece class
    class Piece {
        constructor(image, x, y, width, height, col, row, rotation = 0) {
            this.image = image;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.col = col;
            this.row = row;
            this.rotation = rotation;
            this.correctRotation = 0;
        }

        draw(ctx, filtered = false) {
            ctx.save();
            
            // Calculate center position
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // Move to center, rotate, then move back
            ctx.translate(centerX, centerY);
            ctx.rotate((this.rotation * Math.PI) / 2);
            ctx.translate(-centerX, -centerY);
            
            // Draw the piece
            const img = filtered ? this.image.filtered : this.image.original;
            ctx.drawImage(
                img,
                this.col * this.width, this.row * this.height,
                this.width, this.height,
                this.x, this.y,
                this.width, this.height
            );
            
            // Draw border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            ctx.restore();
        }

        contains(mouseX, mouseY) {
            return mouseX >= this.x && mouseX <= this.x + this.width &&
                   mouseY >= this.y && mouseY <= this.y + this.height;
        }

        rotate(direction) {
            // direction: 1 for right, -1 for left
            this.rotation = (this.rotation + direction + 4) % 4;
        }

        isCorrect() {
            return this.rotation === this.correctRotation;
        }
    }

    // Initialize game
    function init() {
        gameState.canvas = document.getElementById('canvasBlocka');
        if (!gameState.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        gameState.ctx = gameState.canvas.getContext('2d');
        
        // Set canvas size
        gameState.canvas.width = CONFIG.canvas.width;
        gameState.canvas.height = CONFIG.canvas.height;
        
        // Setup event listeners
        setupEventListeners();
        
        // Draw initial screen
        drawStartScreen();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Mouse clicks for rotating pieces and buttons
        gameState.canvas.addEventListener('click', handleCanvasClick);
        gameState.canvas.addEventListener('contextmenu', handleRightClick);
        
        // Prevent context menu
        gameState.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Handle canvas click (for both buttons and pieces)
    function handleCanvasClick(e) {
        const rect = gameState.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on a button
        if (gameState.buttons && gameState.buttons.length > 0) {
            for (const button of gameState.buttons) {
                if (x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height) {
                    button.onClick();
                    return;
                }
            }
        }
        
        // If not on a button, handle as piece rotation
        handleLeftClick(e);
    }

    // Handle left click (rotate left)
    function handleLeftClick(e) {
        if (!gameState.isPlaying || gameState.isWon) return;
        
        const rect = gameState.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const piece = getPieceAtPosition(x, y);
        if (piece) {
            piece.rotate(-1);
            render();
            checkWinCondition();
        }
    }

    // Handle right click (rotate right)
    function handleRightClick(e) {
        e.preventDefault();
        if (!gameState.isPlaying || gameState.isWon) return;
        
        const rect = gameState.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const piece = getPieceAtPosition(x, y);
        if (piece) {
            piece.rotate(1);
            render();
            checkWinCondition();
        }
    }

    // Get piece at mouse position
    function getPieceAtPosition(x, y) {
        for (let i = gameState.pieces.length - 1; i >= 0; i--) {
            if (gameState.pieces[i].contains(x, y)) {
                return gameState.pieces[i];
            }
        }
        return null;
    }

    // Draw start screen
    function drawStartScreen() {
        const ctx = gameState.ctx;
        const canvas = gameState.canvas;
        
        // Reset buttons array
        gameState.buttons = [];
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLOCKA', canvas.width / 2, canvas.height / 2 - 80);
        
        // Draw subtitle
        ctx.font = '24px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Puzzle de Imágenes', canvas.width / 2, canvas.height / 2 - 40);
        
        // Draw start button
        drawButton(canvas.width / 2 - 100, canvas.height / 2 + 20, 200, 50, 'COMENZAR', () => {
            startGame();
        });
        
        // Draw instructions button
        drawButton(canvas.width / 2 - 100, canvas.height / 2 + 90, 200, 50, 'INSTRUCCIONES', () => {
            drawInstructionsScreen();
        });
    }

    // Draw instructions screen
    function drawInstructionsScreen() {
        const ctx = gameState.ctx;
        const canvas = gameState.canvas;
        
        // Reset buttons array
        gameState.buttons = [];
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('INSTRUCCIONES', canvas.width / 2, 50);
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#cccccc';
        
        const instructions = [
            '• La imagen está dividida en 4 partes rotadas',
            '• Click IZQUIERDO: rotar pieza a la izquierda',
            '• Click DERECHO: rotar pieza a la derecha',
            '• Completa el puzzle en el menor tiempo posible',
            '• Cada nivel tiene un filtro diferente',
            '• Al terminar, el filtro desaparece mostrando la imagen original'
        ];
        
        instructions.forEach((instruction, i) => {
            ctx.fillText(instruction, 50, 120 + i * 30);
        });
        
        drawButton(canvas.width / 2 - 100, canvas.height - 80, 200, 50, 'VOLVER', () => {
            drawStartScreen();
        });
    }

    // Draw button helper
    function drawButton(x, y, width, height, text, onClick) {
        const ctx = gameState.ctx;
        
        // Store click handler
        if (!gameState.buttons) gameState.buttons = [];
        gameState.buttons.push({ x, y, width, height, onClick });
        
        // Draw button
        ctx.fillStyle = '#4a4a8a';
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = '#6a6aaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + width / 2, y + height / 2 + 7);
    }

    // Start game
    function startGame() {
        gameState.currentLevel = 0;
        gameState.isGameStarted = true;
        loadLevel();
    }

    // Load level
    function loadLevel() {
        // Select random image
        gameState.currentImageIndex = Math.floor(Math.random() * CONFIG.images.length);
        const imageSrc = CONFIG.images[gameState.currentImageIndex];
        
        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setupLevel(img);
        };
        img.onerror = () => {
            console.error('Error loading image:', imageSrc);
            // Try with next image
            CONFIG.images.splice(gameState.currentImageIndex, 1);
            if (CONFIG.images.length > 0) {
                loadLevel();
            }
        };
        img.src = imageSrc;
    }

    // Setup level
    function setupLevel(img) {
        // Create original and filtered canvases
        const originalCanvas = document.createElement('canvas');
        originalCanvas.width = CONFIG.canvas.width;
        originalCanvas.height = CONFIG.canvas.height;
        const originalCtx = originalCanvas.getContext('2d');
        originalCtx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);
        
        // Apply filter based on level
        const filteredCanvas = document.createElement('canvas');
        filteredCanvas.width = CONFIG.canvas.width;
        filteredCanvas.height = CONFIG.canvas.height;
        const filteredCtx = filteredCanvas.getContext('2d');
        filteredCtx.drawImage(img, 0, 0, filteredCanvas.width, filteredCanvas.height);
        
        const filter = CONFIG.filters[gameState.currentLevel % CONFIG.filters.length];
        applyFilter(filteredCtx, filter.type);
        
        // Store images
        gameState.originalImage = originalCanvas;
        gameState.filteredImage = filteredCanvas;
        
        // Create pieces
        createPieces();
        
        // Start timer
        startTimer();
        
        // Start playing
        gameState.isPlaying = true;
        gameState.isWon = false;
        
        // Render
        render();
    }

    // Apply filter to canvas context
    function applyFilter(ctx, filterType) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        
        switch (filterType) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
                break;
            case 'brightness':
                const brightnessFactor = 1.3;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * brightnessFactor);
                    data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
                    data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
                }
                break;
            case 'negative':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Create pieces
    function createPieces() {
        gameState.pieces = [];
        
        const pieceWidth = CONFIG.canvas.width / CONFIG.piece.cols;
        const pieceHeight = CONFIG.canvas.height / CONFIG.piece.rows;
        
        const imageObj = {
            original: gameState.originalImage,
            filtered: gameState.filteredImage
        };
        
        for (let row = 0; row < CONFIG.piece.rows; row++) {
            for (let col = 0; col < CONFIG.piece.cols; col++) {
                const x = col * pieceWidth;
                const y = row * pieceHeight;
                
                // Random rotation (0, 1, 2, or 3 representing 0°, 90°, 180°, 270°)
                const rotation = Math.floor(Math.random() * 4);
                
                const piece = new Piece(
                    imageObj,
                    x, y,
                    pieceWidth, pieceHeight,
                    col, row,
                    rotation
                );
                
                gameState.pieces.push(piece);
            }
        }
    }

    // Start timer
    function startTimer() {
        gameState.timer = 0;
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        gameState.timerInterval = setInterval(() => {
            gameState.timer++;
            render();
        }, 1000);
    }

    // Stop timer
    function stopTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    // Check win condition
    function checkWinCondition() {
        const allCorrect = gameState.pieces.every(piece => piece.isCorrect());
        
        if (allCorrect) {
            gameState.isWon = true;
            gameState.isPlaying = false;
            stopTimer();
            setTimeout(() => {
                drawWinScreen();
            }, 500);
        }
    }

    // Draw win screen
    function drawWinScreen() {
        const ctx = gameState.ctx;
        const canvas = gameState.canvas;
        
        // Clear canvas and show original image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(gameState.originalImage, 0, 0);
        
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw win message
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡COMPLETADO!', canvas.width / 2, canvas.height / 2 - 80);
        
        ctx.font = '24px Arial';
        const minutes = Math.floor(gameState.timer / 60);
        const seconds = gameState.timer % 60;
        ctx.fillText(`Tiempo: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, canvas.height / 2 - 30);
        
        const filter = CONFIG.filters[gameState.currentLevel % CONFIG.filters.length];
        ctx.font = '20px Arial';
        ctx.fillText(`Nivel ${gameState.currentLevel + 1} - ${filter.name}`, canvas.width / 2, canvas.height / 2 + 10);
        
        // Clear buttons
        gameState.buttons = [];
        
        // Show buttons
        if (gameState.currentLevel < 2) {
            drawButton(canvas.width / 2 - 230, canvas.height / 2 + 60, 200, 50, 'SIGUIENTE NIVEL', () => {
                gameState.currentLevel++;
                loadLevel();
            });
        } else {
            drawButton(canvas.width / 2 - 230, canvas.height / 2 + 60, 200, 50, 'JUGAR DE NUEVO', () => {
                startGame();
            });
        }
        
        drawButton(canvas.width / 2 + 30, canvas.height / 2 + 60, 200, 50, 'MENÚ PRINCIPAL', () => {
            drawStartScreen();
        });
    }

    // Render game
    function render() {
        const ctx = gameState.ctx;
        const canvas = gameState.canvas;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw pieces
        const showFiltered = !gameState.isWon;
        gameState.pieces.forEach(piece => {
            piece.draw(ctx, showFiltered);
        });
        
        // Draw HUD
        drawHUD();
    }

    // Draw HUD
    function drawHUD() {
        const ctx = gameState.ctx;
        const canvas = gameState.canvas;
        
        // Draw timer
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 150, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Tiempo:', 20, 30);
        
        ctx.font = 'bold 24px Arial';
        const minutes = Math.floor(gameState.timer / 60);
        const seconds = gameState.timer % 60;
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 55);
        
        // Draw level
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(canvas.width - 160, 10, 150, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Nivel:', canvas.width - 20, 30);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${gameState.currentLevel + 1}`, canvas.width - 20, 55);
        
        // Draw filter name
        const filter = CONFIG.filters[gameState.currentLevel % CONFIG.filters.length];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, canvas.height - 50, 200, 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Filtro: ${filter.name}`, 20, canvas.height - 25);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
