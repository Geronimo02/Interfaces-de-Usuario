// Configuración del juego
const GAME_CONFIG = {
    images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
        'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368',
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c'
    ],
    filters: {
        1: 'none',            // Nivel 1: SIN filtros
        2: 'brightness(30%)', // Brillo 30%
        3: 'invert(1)'        // Negativo
    },
    blockConfigs: {
        4: { rows: 2, cols: 2 },
        6: { rows: 2, cols: 3 },
        8: { rows: 2, cols: 4 }
    }
};

// Estado del juego
let gameState = {
    currentLevel: 1,
    selectedBlocks: 4,
    currentImage: null,
    blocks: [],
    timer: null,
    startTime: null,
    moveCount: 0,
    isPlaying: false,
    isPaused: false,
    helpUsed: false,
    selectedPiece: null
};

// Elementos del DOM
let elements = {};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    bindEvents();
    initializeGame();
});

// Inicializar referencias a elementos del DOM
function initializeElements() {
    elements = {
        // Menús
        startMenu: document.getElementById('startMenu'),
        instructionsPanel: document.getElementById('instructionsPanel'),
        gameArea: document.getElementById('gameArea'),
        victoryScreen: document.getElementById('victoryScreen'),
        
        // Botones
        startGameBtn: document.getElementById('startGameBtn'),
        instructionsBtn: document.getElementById('instructionsBtn'),
        backToMenuBtn: document.getElementById('backToMenuBtn'),
        helpBtn: document.getElementById('helpBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        quitBtn: document.getElementById('quitBtn'),
        nextLevelBtn: document.getElementById('nextLevelBtn'),
        restartBtn: document.getElementById('restartBtn'),
        menuBtn: document.getElementById('menuBtn'),
        
        // Selectores
        difficultySelect: document.getElementById('difficultySelect'),
        blocksSelect: document.getElementById('blocksSelect'),
        
        // Elementos de juego
        blockaBoard: document.getElementById('blockaBoard'),
        currentLevel: document.getElementById('currentLevel'),
        gameTimer: document.getElementById('gameTimer'),
        moveCounter: document.getElementById('moveCounter'),
        previewImage: document.getElementById('previewImage'),
        referenceImg: document.getElementById('referenceImg'),
        imagePreview: document.getElementById('imagePreview'),
        
        // Victory screen
        victoryLevel: document.getElementById('victoryLevel'),
        victoryTime: document.getElementById('victoryTime'),
        victoryMoves: document.getElementById('victoryMoves'),
        
        // Botones de rotación (nuevos)
        rotateLeftBtn: document.getElementById('rotateLeftBtn'),
        rotateRightBtn: document.getElementById('rotateRightBtn')
    };
}

// Vincular eventos
function bindEvents() {
    // Botones de navegación
    elements.startGameBtn.addEventListener('click', startNewGame);
    elements.instructionsBtn.addEventListener('click', showInstructions);
    elements.backToMenuBtn.addEventListener('click', showMainMenu);
    
    // Botones de juego
    elements.helpBtn.addEventListener('click', useHelp);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.quitBtn.addEventListener('click', quitGame);
    
    // Botones de victoria
    elements.nextLevelBtn.addEventListener('click', nextLevel);
    elements.restartBtn.addEventListener('click', restartLevel);
    elements.menuBtn.addEventListener('click', showMainMenu);
    
    // Selectores de configuración
    elements.difficultySelect.addEventListener('change', updatePreview);
    elements.blocksSelect.addEventListener('change', updateGameConfig);
    
    // Eventos de teclado
    document.addEventListener('keydown', handleKeyboard);
    
    // Prevenir menú contextual en el área de juego
    elements.blockaBoard.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Eventos para botones de rotación
    if (elements.rotateLeftBtn && elements.rotateRightBtn) {
        elements.rotateLeftBtn.addEventListener('click', () => rotateSelected('left'));
        elements.rotateRightBtn.addEventListener('click', () => rotateSelected('right'));
    }
}

// Manejar eventos de teclado
function handleKeyboard(e) {
    if (!gameState.isPlaying) return;
    
    switch(e.key.toLowerCase()) {
        case 'h':
            useHelp();
            break;
        case 'p':
            togglePause();
            break;
        case 'r':
            restartLevel();
            break;
        case 'escape':
            quitGame();
            break;
    }
}

// Inicializar el juego
function initializeGame() {
    updatePreview();
    showMainMenu();
}

// Actualizar vista previa de imagen
function updatePreview() {
    const level = parseInt(elements.difficultySelect.value);
    const randomIndex = Math.floor(Math.random() * GAME_CONFIG.images.length);
    const imagePath = GAME_CONFIG.images[randomIndex];
    
    gameState.currentImage = imagePath;
    elements.previewImage.src = imagePath;
    elements.referenceImg.src = imagePath;
    
    // Aplicar filtro de vista previa
    const filter = GAME_CONFIG.filters[level];
    elements.previewImage.style.filter = filter;
    
    // Animación de preview (extra)
    elements.imagePreview.classList.add('preview-animation');
    setTimeout(() => {
        elements.imagePreview.classList.remove('preview-animation');
    }, 1000);
}

// Actualizar configuración del juego
function updateGameConfig() {
    gameState.selectedBlocks = parseInt(elements.blocksSelect.value);
}

// Mostrar menú principal
function showMainMenu() {
    hideAllScreens();
    elements.startMenu.classList.remove('hidden');
    stopTimer();
    resetGameState();
}

// Mostrar instrucciones
function showInstructions() {
    hideAllScreens();
    elements.instructionsPanel.classList.remove('hidden');
}

// Ocultar todas las pantallas
function hideAllScreens() {
    elements.startMenu.classList.add('hidden');
    elements.instructionsPanel.classList.add('hidden');
    elements.gameArea.classList.add('hidden');
    elements.victoryScreen.classList.add('hidden');
}

// Iniciar nuevo juego
function startNewGame() {
    resetGameState();
    gameState.currentLevel = parseInt(elements.difficultySelect.value);
    gameState.selectedBlocks = parseInt(elements.blocksSelect.value);
    
    setupGameBoard();
    hideAllScreens();
    elements.gameArea.classList.remove('hidden');
    
    gameState.isPlaying = true;
    startTimer();
    updateUI();
}

// Configurar tablero de juego
function setupGameBoard() {
    const config = GAME_CONFIG.blockConfigs[gameState.selectedBlocks];
    const filter = GAME_CONFIG.filters[gameState.currentLevel];
    
    // Limpiar tablero
    elements.blockaBoard.innerHTML = '';
    elements.blockaBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    elements.blockaBoard.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;
    
    // Crear bloques
    gameState.blocks = [];
    
    for (let i = 0; i < gameState.selectedBlocks; i++) {
        const block = createBlock(i, config, filter);
        gameState.blocks.push(block);
        elements.blockaBoard.appendChild(block.element);
    }
}

// Crear un bloque individual
function createBlock(index, config, filter) {
    const element = document.createElement('div');
    element.className = 'blocka-piece';
    element.style.backgroundImage = `url(${gameState.currentImage})`;
    element.style.filter = filter;
    
    // Calcular posición y tamaño del background
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;

    const bgSizeX = config.cols * 100;
    const bgSizeY = config.rows * 100;

    // Posición en porcentaje (0% .. 100%). Evita división por cero si cols/rows === 1.
    const bgPosX = config.cols > 1 ? (col / (config.cols - 1)) * 100 : 0;
    const bgPosY = config.rows > 1 ? (row / (config.rows - 1)) * 100 : 0;

    element.style.backgroundSize = `${bgSizeX}% ${bgSizeY}%`;
    element.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
    
    // Rotación inicial aleatoria
    const initialRotation = (Math.floor(Math.random() * 4) * 90) % 360;
    const correctRotation = 0; // La rotación correcta siempre es 0
    
    element.style.transform = `rotate(${initialRotation}deg)`;
    
    // Eventos de clic
    element.addEventListener('click', (e) => rotateBlock(block, 'left'));
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        rotateBlock(block, 'right');
    });
    
    // Detectar touch para seleccionar (evitar rotar inmediatamente en móvil)
    element.addEventListener('pointerdown', (e) => {
        // si es touch, seleccionamos y prevenimos que el click (rotar) se dispare
        if (e.pointerType === 'touch') {
            e.preventDefault();
            selectBlock(blockData);
        }
    });

    // Mantener click para rotar en desktop
    element.addEventListener('click', (e) => {
        // si fue touch, ya lo manejó pointerdown -> ignorar
        if (e.pointerType === 'touch') return;
        rotateBlock(blockData, 'left');
    });

    // Mantener menú contextual (clic derecho) para rotar a la derecha
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        rotateBlock(blockData, 'right');
    });
    
    // Datos del bloque
    const blockData = {
        element,
        index,
        currentRotation: initialRotation,
        correctRotation,
        isCorrect: initialRotation === correctRotation,
        isFixed: false
    };
    
    return blockData;
}

// Rotar bloque
function rotateBlock(block, direction) {
    if (!gameState.isPlaying || gameState.isPaused || block.isFixed) return;
    
    const rotationAmount = direction === 'left' ? -90 : 90;
    block.currentRotation = (block.currentRotation + rotationAmount) % 360;
    if (block.currentRotation < 0) block.currentRotation += 360;
    
    block.element.style.transform = `rotate(${block.currentRotation}deg)`;
    block.isCorrect = block.currentRotation === block.correctRotation;
    
    gameState.moveCount++;
    updateUI();
    
    // Verificar victoria
    if (checkVictory()) {
        setTimeout(showVictory, 500);
    }
}

// Verificar si se completó el rompecabezas
function checkVictory() {
    return gameState.blocks.every(block => block.isCorrect);
}

// Mostrar pantalla de victoria
function showVictory() {
    stopTimer();
    gameState.isPlaying = false;
    
    // Quitar filtros de todos los bloques
    gameState.blocks.forEach(block => {
        block.element.style.filter = 'none';
    });
    
    // Actualizar datos de victoria
    elements.victoryLevel.textContent = gameState.currentLevel;
    elements.victoryTime.textContent = formatTime(getElapsedTime());
    elements.victoryMoves.textContent = gameState.moveCount;
    
    // Mostrar pantalla de victoria
    setTimeout(() => {
        hideAllScreens();
        elements.victoryScreen.classList.remove('hidden');
    }, 1000);
}

// Usar ayuda (extra)
function useHelp() {
    if (!gameState.isPlaying || gameState.isPaused || gameState.helpUsed) return;
    
    // Buscar primera pieza incorrecta y corregirla
    const incorrectBlock = gameState.blocks.find(block => !block.isCorrect && !block.isFixed);
    
    if (incorrectBlock) {
        incorrectBlock.currentRotation = incorrectBlock.correctRotation;
        incorrectBlock.element.style.transform = `rotate(${incorrectBlock.currentRotation}deg)`;
        incorrectBlock.isCorrect = true;
        incorrectBlock.isFixed = true;
        incorrectBlock.element.classList.add('fixed-piece');
        
        // Añadir 5 segundos al tiempo
        gameState.startTime -= 5000;
        gameState.helpUsed = true;
        elements.helpBtn.disabled = true;
        elements.helpBtn.textContent = '💡 Ayuda usada';
        
        updateUI();
        
        // Verificar victoria
        if (checkVictory()) {
            setTimeout(showVictory, 500);
        }
    }
}

// Pausar/reanudar juego
function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        stopTimer();
        elements.pauseBtn.textContent = '▶️ Reanudar';
        elements.blockaBoard.style.pointerEvents = 'none';
    } else {
        startTimer();
        elements.pauseBtn.textContent = '⏸️ Pausa';
        elements.blockaBoard.style.pointerEvents = 'auto';
    }
}

// Salir del juego
function quitGame() {
    if (confirm('¿Estás seguro de que quieres salir del juego?')) {
        showMainMenu();
    }
}

// Siguiente nivel
function nextLevel() {
    if (gameState.currentLevel < 3) {
        gameState.currentLevel++;
        elements.difficultySelect.value = gameState.currentLevel;
        updatePreview();
        startNewGame();
    } else {
        alert('¡Felicitaciones! Has completado todos los niveles.');
        showMainMenu();
    }
}

// Reiniciar nivel
function restartLevel() {
    startNewGame();
}

// Resetear estado del juego
function resetGameState() {
    gameState.moveCount = 0;
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.helpUsed = false;
    gameState.startTime = null;
    gameState.selectedPiece = null;
    elements.helpBtn.disabled = false;
    elements.helpBtn.textContent = '💡 Ayudita (+5s)';
    elements.pauseBtn.textContent = '⏸️ Pausa';
    elements.blockaBoard.style.pointerEvents = 'auto';
    
    // quitar clase selected de cualquier pieza existente
    document.querySelectorAll('.blocka-piece.selected').forEach(el => el.classList.remove('selected'));
}

// Manejo del temporizador
function startTimer() {
    if (!gameState.startTime) {
        gameState.startTime = Date.now();
    } else {
        // Reanudar - ajustar tiempo de inicio
        gameState.startTime = Date.now() - getElapsedTime();
    }
    
    gameState.timer = setInterval(updateTimer, 100);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

function updateTimer() {
    const elapsed = getElapsedTime();
    elements.gameTimer.textContent = formatTime(elapsed);
}

function getElapsedTime() {
    return gameState.startTime ? Date.now() - gameState.startTime : 0;
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Actualizar interfaz de usuario
function updateUI() {
    elements.currentLevel.textContent = gameState.currentLevel;
    elements.moveCounter.textContent = gameState.moveCount;
    
    if (gameState.startTime) {
        updateTimer();
    }
}

// Funciones adicionales para extras

// Mostrar thumbnails de imágenes con animación (extra)
function showImageThumbnails() {
    // Esta función se puede expandir para mostrar todas las imágenes
    // y animar cuál se seleccionará para el nivel
    console.log('Mostrando thumbnails de imágenes...');
}

// Sistema de tiempo límite para niveles avanzados (extra)
function startTimeLimit(maxTime) {
    // Implementar temporizador de tiempo máximo
    console.log(`Iniciando límite de tiempo: ${maxTime}ms`);
}

// Configuración dinámica de filtros por pieza (extra)
function applyRandomFiltersToBlocks() {
    // Aplicar filtros diferentes a cada bloque para mayor dificultad
    const filters = Object.values(GAME_CONFIG.filters);
    gameState.blocks.forEach(block => {
        const randomFilter = filters[Math.floor(Math.random() * filters.length)];
        block.element.style.filter = randomFilter;
    });
}

console.log('🧩 BLOCKA Game initialized!');