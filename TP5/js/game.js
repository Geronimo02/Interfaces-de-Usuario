// game.js

// Elimina estas dos líneas
// const canvas = document.getElementById('gameCanvas');
// const ctx = canvas.getContext('2d');

const gameContainer = document.getElementById('game-container');
const birdElement = document.getElementById('bird');
const scoreElement = document.getElementById('score');

let score = 0;
let gameRunning = true;
const gameSpeed = 3; // Aumentamos un poco la velocidad
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
    gap: 150,
    width: 27, // Coincide con el CSS
    speed: 3
};

function createPipe() {
    const pipeHeight = Math.floor(Math.random() * (gameContainer.clientHeight - pipe.gap - 200)) + 100;
    
    const topPipe = document.createElement('div');
    const bottomPipe = document.createElement('div');

    // Esta lógica ya es correcta para los nuevos estilos CSS
    const pipeColors = ['green', 'copper'];
    const randomColor = pipeColors[Math.floor(Math.random() * pipeColors.length)];

    // Aplica las clases correctas (ej: pipe-green-top y pipe-green-bottom)
    topPipe.classList.add('pipe', `pipe-${randomColor}-top`);
    bottomPipe.classList.add('pipe', `pipe-${randomColor}-bottom`);

    topPipe.style.height = `${pipeHeight}px`;
    topPipe.style.left = `${gameContainer.clientWidth}px`;
    topPipe.style.top = '0px';

    bottomPipe.style.height = `${gameContainer.clientHeight - pipeHeight - pipe.gap}px`;
    bottomPipe.style.left = `${gameContainer.clientWidth}px`;
    bottomPipe.style.bottom = '0px';

    gameContainer.appendChild(topPipe);
    gameContainer.appendChild(bottomPipe);
}

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

function updatePipes() {
    const pipes = document.querySelectorAll('.pipe');
    const birdRect = bird.element.getBoundingClientRect();

    pipes.forEach(pipe => {
        const pipeRect = pipe.getBoundingClientRect();
        pipe.style.left = `${pipeRect.left - pipe.speed}px`;

        // --- LÓGICA PARA INCREMENTAR EL PUNTAJE (NUEVO) ---
        // Solo nos interesa la tubería de abajo para no contar doble.
        // 'dataset.passed' es una forma de marcar la tubería como "ya puntuada".
        if (!pipe.classList.contains('pipe-top') && !pipe.dataset.passed) {
            // Si el borde derecho de la tubería ha cruzado el centro del pájaro...
            if (pipeRect.right < (birdRect.left + birdRect.width / 2)) {
                pipe.dataset.passed = 'true'; // Marcar como puntuada.
                score++;
                updateScoreDisplay();
            }
        }
        // --- FIN DE LA LÓGICA DE PUNTAJE ---

        if (pipeRect.right < 0) {
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

function gameLoop() {
    if (!gameRunning) return;

    bird.velocityY += bird.gravity;
    bird.y += bird.velocityY;
    bird.element.style.top = `${bird.y}px`;

    // Rotar el pájaro según su velocidad vertical para dar efecto de caída/subida
    const rotation = Math.min(Math.max(-25, bird.velocityY * 6), 90);
    bird.element.style.transform = `rotate(${rotation}deg)`;

    movePipes();
    updatePipes();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

// Iniciar la generación de tuberías
const pipeInterval = setInterval(createPipe, pipeSpawnInterval);

// Iniciar el juego
gameLoop();