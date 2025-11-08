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


function createPipe() {
    if (!gameRunning) return;

    const topHeight = Math.random() * (gameContainer.clientHeight - pipeGap - 150) + 50;
    const bottomHeight = gameContainer.clientHeight - topHeight - pipeGap;

    const pipeTop = document.createElement('div');
    pipeTop.classList.add('pipe', 'pipe-top');
    pipeTop.style.height = `${topHeight}px`;
    pipeTop.style.left = `${gameContainer.clientWidth}px`;
    pipeTop.style.top = '0px';

    const pipeBottom = document.createElement('div');
    pipeBottom.classList.add('pipe');
    pipeBottom.style.height = `${bottomHeight}px`;
    pipeBottom.style.left = `${gameContainer.clientWidth}px`;
    pipeBottom.style.bottom = '0px';

    gameContainer.appendChild(pipeTop);
    gameContainer.appendChild(pipeBottom);
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
    // Detiene la animación de aleteo
    bird.element.style.animationPlayState = 'paused';
    clearInterval(pipeInterval);
    
    setTimeout(() => {
        alert(`Game Over! Tu puntaje: ${score}`);
        location.reload();
    }, 500);
}

// Bucle principal del juego
function gameLoop() {
    if (!gameRunning) return;

    bird.velocityY += bird.gravity;
    bird.y += bird.velocityY;
    bird.element.style.top = `${bird.y}px`;

    // Rotar el pájaro según su velocidad vertical para dar efecto de caída/subida
    const rotation = Math.min(Math.max(-25, bird.velocityY * 6), 90);
    bird.element.style.transform = `rotate(${rotation}deg)`;

    movePipes();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

// Iniciar la generación de tuberías
const pipeInterval = setInterval(createPipe, pipeSpawnInterval);

// Iniciar el juego
gameLoop();