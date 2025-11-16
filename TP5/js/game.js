// game.js

// Elimina estas dos líneas
// const canvas = document.getElementById('gameCanvas');
// const ctx = canvas.getContext('2d');

const gameContainer = document.getElementById('game-container');
const birdElement = document.getElementById('bird');
const scoreElement = document.getElementById('score');

let score = 0;
let gameRunning = true;
let gamePaused = false;  // ← NUEVO: Variable de pausa
const gameSpeed = 3;
const pipeGap = 200;
const pipeSpawnInterval = 1800;

// Propiedades del jugador (pájaro)
const bird = {
    y: 250,
    velocityY: 0,
    gravity: 0.4,
    jumpStrength: -8,
    element: birdElement,
    width: 26, 
    height: 29,
    // --- NUEVO: Dimensiones del hitbox para una colisión más justa ---
    hitbox: {
        width: 18,
        height: 13
    }
};

// Posición inicial del pájaro
bird.element.style.top = `${bird.y}px`;
bird.element.style.left = `150px`;

// Control del jugador
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameRunning) {
        bird.velocityY = bird.jumpStrength;
    }
});

// También permite saltar con un clic/toque
document.addEventListener('pointerdown', () => {
    if (gameRunning) {
        bird.velocityY = bird.jumpStrength;
    }
});


const pipe = {
    spawnInterval: 2000,
    lastSpawnTime: 0,
    gap: 250,
    width: 54,      // ← CAMBIO: Ancho visual de la pipe
    height: 324,    // ← NUEVO: Altura de la pipe
    speed: 3
};

function createPipe() {
    // Altura visible de la tubería superior
    const topPipeVisibleHeight = Math.floor(
        Math.random() * (gameContainer.clientHeight - pipe.gap - 250)
    ) + 100;
    
    const topPipe = document.createElement('div');
    const bottomPipe = document.createElement('div');

    topPipe.classList.add('pipe', 'pipe-top');
    bottomPipe.classList.add('pipe', 'pipe-bottom');

    // ← CORRECCIÓN: Posiciona la PARTE INFERIOR de la tubería superior
    topPipe.style.left = `${gameContainer.clientWidth}px`;
    topPipe.style.top = `${topPipeVisibleHeight - pipe.height}px`;  // ← CAMBIO: pipe.height en lugar de pipe.width
    topPipe.style.bottom = 'auto';

    // Tubería inferior comienza después del gap
    bottomPipe.style.left = `${gameContainer.clientWidth}px`;
    bottomPipe.style.top = `${topPipeVisibleHeight + pipe.gap}px`;
    bottomPipe.style.bottom = 'auto';

    gameContainer.appendChild(topPipe);
    gameContainer.appendChild(bottomPipe);

    console.log('=== NUEVA TUBERÍA CREADA ===');
    console.log('Tubería Superior (TOP PIPE):');
    console.log('  - left:', topPipe.style.left);
    console.log('  - top:', topPipe.style.top);
    console.log('  - Tamaño: ', topPipe.offsetWidth + 'px × ' + topPipe.offsetHeight + 'px');
    
    console.log('Tubería Inferior (BOTTOM PIPE):');
    console.log('  - left:', bottomPipe.style.left);
    console.log('  - top:', bottomPipe.style.top);
    console.log('  - Tamaño:', bottomPipe.offsetWidth + 'px × ' + bottomPipe.offsetHeight + 'px');
    console.log('----------------------------\n');
}

// --- ELIMINAR TODA ESTA FUNCIÓN ---
/*
function movePipes() {
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach(pipe => {
        let pipeX = parseFloat(pipe.style.left);
        pipeX -= gameSpeed;
        pipe.style.left = `${pipeX}px`;

        if (pipeX + pipe.clientWidth < 0) {
            pipe.remove();
        }

        if (!pipe.passed && pipeX + pipe.clientWidth < (bird.element.offsetLeft)) {
            if (pipe.classList.contains('pipe-top')) {
                score++;
                scoreElement.textContent = `Puntaje: ${score}`;
                pipe.passed = true;
            }
        }
    });
}
*/
// --- FIN DE LA ELIMINACIÓN ---

function updatePipes() {
    const pipes = document.querySelectorAll('.pipe');
    const birdRect = bird.element.getBoundingClientRect();

    pipes.forEach((pipe, index) => {
        // ← CAMBIO: Obtener la posición actual desde style.left (coordenadas del contenedor)
        let pipeLeft = parseFloat(pipe.style.left);
        
        // Mover la pipe hacia la IZQUIERDA
        pipeLeft -= gameSpeed;
        pipe.style.left = `${pipeLeft}px`;

        // Obtener el rect DESPUÉS de actualizar la posición
        const pipeRect = pipe.getBoundingClientRect();
        
        // --- LOG DE MOVIMIENTO (cada 30 frames) ---
        if (Math.random() < 0.05) {
            console.log(`Pipe #${index}: left=${pipeLeft.toFixed(0)}px`);
        }

        // --- LÓGICA PARA INCREMENTAR EL PUNTAJE ---
        if (!pipe.classList.contains('pipe-top') && !pipe.dataset.passed) {
            if (pipeRect.right < (birdRect.left + birdRect.width / 2)) {
                pipe.dataset.passed = 'true';
                score++;
                updateScoreDisplay();
            }
        }

        // Eliminar pipes que salen de pantalla
        if (pipeLeft + pipe.offsetWidth < 0) {
            pipe.remove();
        }
    });
}

function updateScoreDisplay() {
    scoreElement.textContent = `Puntaje: ${score}`;
}

function checkCollisions() {
    const birdVisualRect = bird.element.getBoundingClientRect();
    const groundHeight = 112;

    // --- LÓGICA DE HITBOX MEJORADA ---
    // 1. Calculamos el centro del pájaro visual.
    const birdCenterX = birdVisualRect.left + birdVisualRect.width / 2;
    const birdCenterY = birdVisualRect.top + birdVisualRect.height / 2;

    // 2. Creamos un nuevo rectángulo de colisión (hitbox) más pequeño y centrado.
    const birdHitbox = {
        left: birdCenterX - bird.hitbox.width / 2,
        right: birdCenterX + bird.hitbox.width / 2,
        top: birdCenterY - bird.hitbox.height / 2,
        bottom: birdCenterY + bird.hitbox.height / 2
    };
    // --- FIN DE LA LÓGICA MEJORADA ---

    // Colisión con el suelo (usamos el hitbox)
    if (birdHitbox.bottom > (gameContainer.getBoundingClientRect().bottom - groundHeight)) {
        gameOver();
        return;
    }
    // Colisión con el techo (usamos el hitbox)
    if (birdHitbox.top < gameContainer.getBoundingClientRect().top) {
        bird.y = 0;
        bird.velocityY = 0;
    }

    const pipes = document.querySelectorAll('.pipe');
    for (let pipe of pipes) {
        const pipeRect = pipe.getBoundingClientRect();
        // Comparamos el hitbox del pájaro con el rectángulo de la tubería.
        if (birdHitbox.left < pipeRect.right &&
            birdHitbox.right > pipeRect.left &&
            birdHitbox.top < pipeRect.bottom &&
            birdHitbox.bottom > pipeRect.top) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    if (!gameRunning) return;
    gameRunning = false;
    // Detener las animaciones de parallax
    const layers = document.querySelectorAll('.layer');
    layers.forEach(layer => layer.style.animationPlayState = 'paused');
    
    // Mostramos un alert y reiniciamos el juego al cerrar.
    setTimeout(() => {
        alert(`Game Over! Tu puntaje: ${score}`);
        window.location.reload();
    }, 100);
}

// NUEVO: Referencias a los botones
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');

// NUEVO: Funciones de pausa/play
function pauseGame() {
    if (!gameRunning || gamePaused) return;
    
    gamePaused = true;
    playBtn.classList.remove('disabled');
    pauseBtn.classList.add('disabled');
    
    // Pausar animaciones
    const layers = document.querySelectorAll('.layer');
    layers.forEach(layer => layer.style.animationPlayState = 'paused');
    
    console.log('⏸ Juego pausado');
}

function playGame() {
    if (!gameRunning || !gamePaused) return;
    
    gamePaused = false;
    playBtn.classList.add('disabled');
    pauseBtn.classList.remove('disabled');
    
    // Reanudar animaciones
    const layers = document.querySelectorAll('.layer');
    layers.forEach(layer => layer.style.animationPlayState = 'running');
    
    console.log('▶ Juego reanudado');
}

// NUEVO: Event listeners de botones
playBtn.addEventListener('click', playGame);
pauseBtn.addEventListener('click', pauseGame);

// Establecer estado inicial (juego en pausa)
pauseBtn.classList.add('disabled');

function gameLoop() {
    if (!gameRunning || gamePaused) return;  // ← CAMBIO: Agregar gamePaused

    bird.velocityY += bird.gravity;
    bird.y += bird.velocityY;
    bird.element.style.top = `${bird.y}px`;

    // Rotar el pájaro según su velocidad vertical para dar efecto de caída/subida
    const rotation = Math.min(Math.max(-25, bird.velocityY * 6), 90);
    bird.element.style.transform = `rotate(${rotation}deg)`;

    updatePipes();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

// Iniciar la generación de tuberías
const pipeInterval = setInterval(createPipe, pipeSpawnInterval);

// --- NUEVA: Crear una pipe hardcodeada para pruebas ---
function createHardcodedPipe() {
    const topPipe = document.createElement('div');
    const bottomPipe = document.createElement('div');

    topPipe.classList.add('pipe', 'pipe-top');
    bottomPipe.classList.add('pipe', 'pipe-bottom');

    // Posición fija para debug: arriba y abajo con espacio en el medio
    topPipe.style.left = `400px`;
    topPipe.style.top = `50px`;
    topPipe.style.bottom = 'auto';

    bottomPipe.style.left = `400px`;
    bottomPipe.style.top = `350px`;  // 50 + 300 (gap) = 350
    bottomPipe.style.bottom = 'auto';

    gameContainer.appendChild(topPipe);
    gameContainer.appendChild(bottomPipe);

    console.log('✅ PIPE HARDCODEADA CREADA');
    console.log('  - Top Pipe: left=400px, top=50px');
    console.log('  - Bottom Pipe: left=400px, top=350px');
}

// --- NUEVA: Crear pipes hardcodeadas para pruebas (del test_posicion.html) ---
function createHardcodedPipes() {
    // Valores tomados de test_posicion.html - CORRECTO
    const pipesData = [
        // Espacio grande
        { topLeft: 200, topTop: -150, bottomLeft: 200, bottomBottom: -150 },
        // Espacio medio
        { topLeft: 400, topTop: -100, bottomLeft: 400, bottomBottom: -100 },
        // Espacio chico
        { topLeft: 600, topTop: -80, bottomLeft: 600, bottomBottom: -80 }
    ];

    pipesData.forEach((pipeData, index) => {
        // Crear pipe superior (top: negativo, se sale hacia ARRIBA)
        const topPipe = document.createElement('div');
        topPipe.classList.add('pipe', 'pipe-top');
        topPipe.style.left = `${pipeData.topLeft}px`;
        topPipe.style.top = `${pipeData.topTop}px`;  // NEGATIVO
        topPipe.style.bottom = 'auto';
        gameContainer.appendChild(topPipe);

        // Crear pipe inferior (bottom: negativo, se sale hacia ABAJO)
        const bottomPipe = document.createElement('div');
        bottomPipe.classList.add('pipe', 'pipe-bottom');
        bottomPipe.style.left = `${pipeData.bottomLeft}px`;
        bottomPipe.style.bottom = `${pipeData.bottomBottom}px`;  // ← CAMBIO: bottom en lugar de top
        bottomPipe.style.top = 'auto';  // ← CAMBIO: top a 'auto'
        gameContainer.appendChild(bottomPipe);

        console.log(`✅ PIPE HARDCODEADA #${index + 1} CREADA`);
        console.log(`  - Top Pipe: left=${pipeData.topLeft}px, top=${pipeData.topTop}px`);
        console.log(`  - Bottom Pipe: left=${pipeData.bottomLeft}px, bottom=${pipeData.bottomBottom}px`);
    });
}

// Llamar a la función al cargar la página
createHardcodedPipes();

// Iniciar el juego
gameLoop();