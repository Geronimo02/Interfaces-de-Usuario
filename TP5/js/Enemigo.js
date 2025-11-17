import { Personaje } from './Personaje.js';
import { ENEMY_SPRITE_1 } from './constantes.js';

export class Enemigo extends Personaje {
    
    constructor(x, y, gameContainer) {
        super("Enemigo", ENEMY_SPRITE_1, 1, x, y);
        this.velocidadX = -5;

        this.elemento = document.createElement('div');
        this.elemento.className = 'enemigo';
        this.elemento.style.backgroundImage = `url(${this.rutaSprite})`;
        gameContainer.appendChild(this.elemento);
    }
    
    update() {
        this.x += this.velocidadX;
        this.elemento.style.left = `${this.x}px`;
        this.elemento.style.top = `${this.y}px`;
    }
}
