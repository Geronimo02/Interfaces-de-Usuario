import { Personaje } from './Personaje.js';
import { bird_sprite, bird_herido, bird_malherido } from './constantes.js';

export class Pajaro extends Personaje {
    
    constructor(x, y, gameContainer, gameOverCallback) {
        super("Pajaro", bird_sprite, 3, x, y);
        this.estado = "normal"; // normal, invencible, muerto
        this.velocidadY = 0;
        this.gravedad = 0.8;
        this.fuerzaVuelo = -12;
        this.gameContainer = gameContainer; // Dependencia inyectada
        this.gameOverCallback = gameOverCallback; // Callback inyectado

        this.elemento = document.getElementById('bird');
        this.actualizarSprite();
    }

    volar() {
        if (this.estado !== "muerto") {
            this.velocidadY = this.fuerzaVuelo;
        }
    }
    
    recibirDanio() {
        if (this.estado === "invencible" || this.estado === "muerto") return;

        this.salud--;
        this.actualizarSprite();
        
        if (this.salud <= 0) {
            this.estado = "muerto";
            this.gameOverCallback();
        } else {
            this.estado = "invencible";
            this.elemento.classList.add('invencible-blink');
            setTimeout(() => {
                this.estado = "normal";
                this.elemento.classList.remove('invencible-blink');
            }, 2000); // 2 segundos de invencibilidad
        }
    }
    
    actualizarSprite() {
        let sprite = bird_sprite;
        if (this.salud === 2) sprite = bird_herido;
        if (this.salud === 1) sprite = bird_malherido;
        this.elemento.style.backgroundImage = `url(${sprite})`;
    }

    update() {
        this.velocidadY += this.gravedad;
        this.y += this.velocidadY;

        // Limita al pájaro a no salirse de la pantalla
        const gameRect = this.gameContainer.getBoundingClientRect();
        if (this.y < 0) {
            this.y = 0;
            this.velocidadY = 0;
        }
        if (this.y > gameRect.height - this.getRect().height) {
            this.y = gameRect.height - this.getRect().height;
            this.velocidadY = 0;
            if(this.estado !== "muerto") this.recibirDanio(); // Pierde vida si toca el suelo
        }

        // Aplicamos la posición al elemento del DOM usando top y left
        this.elemento.style.top = `${this.y}px`;
        this.elemento.style.left = `${this.x}px`;
    }
}
