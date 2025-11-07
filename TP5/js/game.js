// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let bird;
let pipes = [];
let score = 0;
let gameOver = false;

function initGame() {
    bird = new Bird();
    pipes.push(new Pipe());
    document.addEventListener('keydown', handleInput);
    requestAnimationFrame(updateGame);
}

function updateGame() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bird.update();
    bird.draw();

    if (pipes.length > 0) {
        pipes.forEach(pipe => {
            pipe.update();
            pipe.draw();
            if (checkCollision(bird, pipe)) {
                gameOver = true;
                bird.explode();
            }
        });
    }

    if (pipes.length > 0 && pipes[0].x < -pipes[0].width) {
        pipes.shift();
        score++;
        pipes.push(new Pipe());
    }

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(updateGame);
}

function handleInput(event) {
    if (event.code === 'Space') {
        bird.flap();
    }
}

function checkCollision(bird, pipe) {
    return bird.x < pipe.x + pipe.width &&
           bird.x + bird.width > pipe.x &&
           bird.y < pipe.height &&
           bird.y + bird.height > pipe.y;
}

class Bird {
    constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.width = 34;
        this.height = 24;
        this.gravity = 0.6;
        this.lift = -15;
        this.velocity = 0;
        this.image = new Image();
        this.image.src = 'assets/images/bird.png';
    }

    flap() {
        this.velocity += this.lift;
        this.animateFlap();
    }

    animateFlap() {
        // Implement keyframe animation for flapping
    }

    explode() {
        // Implement explosion animation
    }

    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
            gameOver = true;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Pipe {
    constructor() {
        this.width = 50;
        this.height = Math.random() * (canvas.height - 100) + 20;
        this.x = canvas.width;
        this.y = 0;
        this.speed = 2;
        this.image = new Image();
        this.image.src = 'assets/images/pipe.png';
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x, this.height + 100, this.width, canvas.height - this.height - 100);
    }
}

window.onload = initGame;