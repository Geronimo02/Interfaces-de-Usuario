//constantes par las rutas de sprites de los enemigos
const bird_sprite = 'assets/images/bird_sprite.png';
const bird_herido = 'assets/images/bird_herido.png';
const bird_malherido = 'assets/images/bird_malherido.png';
const ENEMY_SPRITE_1 = 'assets/images/enemy_sprite_1.png';
const ENEMY_SPRITE_2 = 'assets/images/enemy_sprite_2.png';
const ENEMY_SPRITE_3 = 'assets/images/enemy_sprite_3.png';
const PIPE_GREEN = 'assets/images/pipe-green.png';



//Clase base para personaje
class Personaje {
    #nombre; // propiedad privada
    #rutaSprite; // propiedad privada
    #salud; // propiedad privada
    #puntaje; // propiedad privada
    
    constructor(nombre, rutaSprite, salud, puntaje, x, y) {
        this.#nombre = nombre;
        this.#rutaSprite = rutaSprite;
        this.#salud = salud;
        this.#puntaje = puntaje;
        this.x = x;
        this.y = y;
    }
    getNombre() {
        return this.#nombre;
    }
    getRutaSprite() {
        return this.#rutaSprite;
    }
    getSalud() {
        return this.#salud;
    }
    setSalud(nuevaSalud) {
        this.#salud = nuevaSalud;
    }
    getPuntaje() {
        return this.#puntaje;
    }
    setPuntaje(nuevoPuntaje) {
        this.#puntaje = nuevoPuntaje;
    }
    setRutaSprite(nuevaRuta) {
        this.#rutaSprite = nuevaRuta;
    }
    setPosicion(x, y) {
        this.x = x;
        this.y = y;
    }
    getPosicion() {
        return {x: this.x, y: this.y};
    }
}

//Pajaro que hereda de Personaje
class Pajaro extends Personaje {
    #estado // normal invencible o muerto
    velocidad = 0   ; // velocidad de movimiento
    gravedad = 3; // fuerza de gravedad


    constructor(nombre, rutaSprite, salud, puntaje, x, y) {
        super(nombre, rutaSprite, salud, puntaje, x, y);
        this.#estado = "normal";
        this.elemento = document.getElementById('bird');
        this.setRutaSprite('assets/bird_sprite.png');
        this.setPosicion(x, y);
        this.actualizarSprite();
        setInterval(() => this.caer(), 30); // actualizar posición cada 30 ms

    }
    setEstado(nuevoEstado) {
        this.#estado = nuevoEstado;
        this.actualizarSprite();
    }
    getEestado() {
        return this.#estado;
    }
    //volar
    volar(){
        this.velocidad = -20;
    }

    caer() {
        this.velocidad += this.gravedad;
        this.y += this.velocidad;
        //limitar que no se salga de la pantalla
        if(this.y > 400) this.y = 400;
        if(this.y < -330) this.y = -300;
        this.setPosicion(this.x, this.y);
        this.elemento.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
    //aplicarPowerUp(tipo) {

    // recibirDanio() {

// Cambia el sprite según el estado y la salud
    actualizarSprite() {
        let sprite = bird_sprite; // sprite por defecto para salud maxima
        if(this.getSalud() === 2) {
            sprite = 'assets/images/bird_herido.png';
        }
        if(this.getSalud() === 1) {
            sprite = 'assets/images/bird_malherido.png';
        }
        if(this.getSalud() === 0) {
            console.log("El pájaro ha muerto");
            alert("El pájaro ha muerto");
            
        }
        this.elemento.style.backgroundImage = `url(${sprite})`;
        this.elemento.style.backgroundSize = 'cover';
    }
}

// Crear instancia del pájaro
const pajaro = new Pajaro("Pajaro", bird_sprite, 3, 0, 50, 200);
//actuliza  estado cada 3 segundos de prueba
// setInterval(() => {
//     if(pajaro.getSalud() === 3) {
//         pajaro.setSalud(2);
//     } else if(pajaro.getSalud() === 2) {
//         pajaro.setSalud(1);
//     } else {
//         pajaro.setEstado("normal");
//     }
// }, 3000);


// Evento para hacer volar el pajaro con  barra espaciadora
// Evento para barra espaciadora
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        pajaro.volar();
    }
});

class Enemigo extends Personaje {
    constructor(nombre, rutaSprite, salud, puntaje, x, y) {
        super(nombre, rutaSprite, salud, puntaje, x, y)
        this.elemento = document.createElement('div');
        this.elemento.className = 'enemigo';
        document.getElementById('game-container').appendChild(this.elemento);
        this.setPosicion(x, y);
        this.actualizarSprite();
}
mover(){
    this.x -= 5; // velocidad de movimiento hacia la izquierda
    if(this.x < -100) {
        this.x = 800; // reiniciar posición al salir de la pantalla
        this.y = Math.random() * 400; // nueva posición Y aleatoria
    }
    this.setPosicion(this.x, this.y);
    this.elemento.style.transform = `translate(${this.x}px, ${this.y}px)`;
}
actualizarSprite() {
        this.elemento.style.backgroundImage = `url(${this.getRutaSprite()})`;
        this.elemento.style.backgroundSize = 'cover';
    }
        }
        

// Crear instancia del enemigo
const enemigo = new Enemigo("Enemigo1",ENEMY_SPRITE_1, 1, 100, 800, Math.random() * 400);
// Mover enemigo cada 30 ms
let colisionando = false;
setInterval(() => {
    enemigo.mover();

    const pajaroPos = pajaro.getPosicion();
    const enemigoPos = enemigo.getPosicion();

    const hayColision =
        pajaroPos.x < enemigoPos.x + 80 &&
        pajaroPos.x + 130 > enemigoPos.x &&
        pajaroPos.y < enemigoPos.y + 80 &&
        pajaroPos.y + 130 > enemigoPos.y;

    if (hayColision) {
        pajaro.elemento.style.border = "2px solid red";
        enemigo.elemento.style.border = "2px solid red";
        pajaro.actualizarSprite();
        if (!colisionando) {
            // Solo baja la salud una vez por colisión
            pajaro.setSalud(pajaro.getSalud() - 1);
            console.log("Colisión detectada");
            console.log("Salud del pájaro: " + pajaro.getSalud());
            colisionando = true;
        }
    } else {
        pajaro.elemento.style.border = "";
        enemigo.elemento.style.border = "";
        colisionando = false;
    }
}, 30);

//crear mas enemigos cada cierto tiempo
setInterval(() => {
    const nuevoEnemigo = new Enemigo("Enemigo" + Date.now(),ENEMY_SPRITE_1, 1, 100, 800, Math.random() * 400);
    setInterval(() => {
        nuevoEnemigo.mover();
    }, 30);
}, 5000);


class Cano extends Personaje {
    constructor(nombre, rutaSprite, salud, puntaje, x, y) {
        super(nombre, rutaSprite, salud, puntaje, x, y);
        this.elemento = document.createElement('div');
        this.elemento.className = 'cano';
        document.getElementById('game-container').appendChild(this.elemento);
        this.setPosicion(x, y);
        this.actualizarSprite();
    }
    mover() {
        this.x -= 6;
        if (this.x < -30) {
            this.x = 800;
            this.y = Math.random() * 300;
        }
        this.setPosicion(this.x, this.y);
        this.elemento.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
    actualizarSprite() {
        this.elemento.style.backgroundImage = `url('${PIPE_GREEN}')`;
        this.elemento.style.backgroundSize = '26px 160px';
    }
}

// Crear caños cada cierto tiempo
setInterval(() => {
    const nuevoCano = new Cano("Cano" + Date.now(), PIPE_GREEN, 1, 0, 800, Math.random() * 300);
    setInterval(() => {
        nuevoCano.mover();
    }, 30);
}, 4000);

