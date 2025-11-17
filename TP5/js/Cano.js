import { Personaje } from './Personaje.js';
import { PIPE_GREEN } from './constantes.js';

export class Cano extends Personaje {

    constructor(x, y, esSuperior, gameContainer) {
        super("Cano", PIPE_GREEN, 1, x, y);
        this.velocidadX = -4;
        
        this.elemento = document.createElement('div');
        this.elemento.className = 'cano';
        this.elemento.style.backgroundImage = `url(${this.rutaSprite})`;
        if (esSuperior) {
            this.elemento.classList.add('cano-superior');
        }
        gameContainer.appendChild(this.elemento);
    }
    
    update() {
        this.x += this.velocidadX;
        this.elemento.style.left = `${this.x}px`;
        this.elemento.style.top = `${this.y}px`;
    }
}

export class ParCano {
    constructor(x, gameContainer) {
        const gameHeight = gameContainer.getBoundingClientRect().height;
        // --- Definimos nuestras variables clave sin números mágicos ---
        const canoAlto = 900;      // La altura REAL del caño desde tu CSS.
        const altoHueco = 300;     // El espacio vertical para que pase el pájaro.
        const margenVertical = 80; // Mínimo de espacio visible del caño en los bordes.

        // --- Calculamos el rango donde puede aparecer el hueco ---
        // El rango total disponible es la altura del juego menos los márgenes superior e inferior.
        const rangoVerticalTotal = gameHeight - (margenVertical * 2);
        // El rango para el punto de inicio del hueco es el rango total menos el tamaño del propio hueco.
        const rangoAleatorio = rangoVerticalTotal - altoHueco;

        // --- Calculamos las posiciones Y ---
        // 1. Posición del caño INFERIOR (más fácil de calcular primero)
        // Su 'top' será el margen superior + una porción aleatoria del rango disponible.
        const yCanoInferior = margenVertical + Math.random() * rangoAleatorio;

        // 2. Posición del caño SUPERIOR
        // Su 'top' debe ser tal que su borde inferior quede justo arriba del hueco.
        // Borde inferior del caño superior = yCanoSuperior + canoAlto
        // Queremos que ese borde esté en: yCanoInferior - altoHueco
        // Por lo tanto: yCanoSuperior + canoAlto = yCanoInferior - altoHueco
        // Despejando:
        const yCanoSuperior = yCanoInferior - altoHueco - canoAlto;

        // --- Creamos las instancias con las posiciones correctas ---
        this.canoSuperior = new Cano(x, yCanoSuperior, true, gameContainer);
        this.canoInferior = new Cano(x, yCanoInferior, false, gameContainer);
        this.canos = [this.canoSuperior, this.canoInferior];
        this.x = x;
    }
    
    update() {
        this.canos.forEach(cano => cano.update());
        this.x = this.canos[0].x;
    }

    destruir() {
        this.canos.forEach(cano => cano.destruir());
    }
}
