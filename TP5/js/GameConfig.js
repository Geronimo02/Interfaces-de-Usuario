/**
 * GAMECONFIG.JS - CONFIGURACIÓN DEL JUEGO
 * Todas las constantes y configuraciones centralizadas
 * Separación total de configuración del código
 */

const GameConfig = {
    // ===== CANVAS =====
    CANVAS: {
        WIDTH: 1200,
        HEIGHT: 480,      // Altura reducida para mostrar completo en pantalla
        MAX_WIDTH: 1200,
        MAX_HEIGHT: 480
    },

    // ===== JUGADOR =====
    PLAYER: {
        X: 150,
        WIDTH: 90, // Ligeramente reducido para mejor maniobra
        HEIGHT: 90,
        GRAVITY: 0.5,
        JUMP_FORCE: -10,
        ROTATION_SPEED: 2,
        MAX_ROTATION: 30,
        INVULNERABLE_DURATION: 60, // frames
        COLLISION_RADIUS: 18 // Radio efectivo de colisión más justo
    },

    // ===== OBSTÁCULOS (TUBOS) =====
    OBSTACLES: {
        WIDTH: 100,
        // Gap progresivo - empieza grande y se reduce
        INITIAL_GAP: 350,        // Gap inicial muy amplio
        MIN_GAP: 120,           // Gap mínimo cuando está muy avanzado  
        GAP_DECREASE_RATE: 3,   // Cuánto disminuye el gap por cada obstáculo pasado
        MAX_DIFFICULTY_OBSTACLES: 6, // Después de cuántos obstáculos alcanza dificultad máxima
        SPAWN_INTERVAL: 120, // frames
        COLOR_TOP: '#292b2eff',
        COLOR_BOTTOM: '#47b0d6ff',
        COLOR_BORDER: '#343a3bff',
        COLOR_HIGHLIGHT: '#24e1f3ff',
        PIPE_CAP_HEIGHT: 30,
        PIPE_CAP_WIDTH: 110
    },

    // ===== COLLECTIBLES =====
    STARS: {
        SIZE: 18, // Reducido para mejor precisión de colisión
        POINTS: 5,
        COLOR_START: '#ffffff',
        COLOR_MID: '#ffd700',
        COLOR_END: '#ffaa00',
        SPAWN_CHANCE: 0.7 // 70%
    },

    GEMS: {
        SIZE: 22, // Reducido pero más grande que estrellas (más valiosas)
        POINTS: 20,
        COLOR_START: '#e83e8c',
        COLOR_MID: '#ba55d3',
        COLOR_END: '#6b2d5c',
        SPAWN_CHANCE: 0.3, // 30%
        FLOAT_AMPLITUDE: 8,
        FLOAT_SPEED: 0.1
    },

    COLLECTIBLE_SPAWN_INTERVAL: 60, // frames
    COLLECTIBLE_IN_PIPES: true, // Aparecen dentro de los tubos

    // ===== ENEMIGOS =====
    ENEMIES: {
        // Drone (rápido, débil)
        DRONE_SIZE: 32, // Más pequeño y ágil
        DRONE_SPEED: 4,
        DRONE_POINTS: 25,
        DRONE_COLOR_PRIMARY: '#ff0000',
        DRONE_COLOR_SECONDARY: '#cc0000',
        DRONE_SPAWN_CHANCE: 0.4, // 40%

        // Meteoro (fuerte, daño alto)
        METEOR_SIZE: 42, // Grande pero más balanceado
        METEOR_SPEED: 5,
        METEOR_POINTS: 50,
        METEOR_COLOR_PRIMARY: '#8b4513',
        METEOR_COLOR_SECONDARY: '#5c2e0a',
        METEOR_SPAWN_CHANCE: 0.3, // 30%

        // Alien (patrón de onda)
        ALIEN_SIZE: 38, // Tamaño medio equilibrado
        ALIEN_SPEED: 3,
        ALIEN_POINTS: 40,
        ALIEN_COLOR_PRIMARY: '#9b59b6',
        ALIEN_COLOR_SECONDARY: '#6c3483',
        ALIEN_SPAWN_CHANCE: 0.3, // 30%

        SPAWN_INTERVAL: 180, // frames entre spawns
        MIN_Y: 50,
        MAX_Y: 380
    },

    // ===== POWER UPS =====
    POWERUPS: {
        shield: { // Invulnerabilidad temporal
            SIZE: 26, // Más visible que collectibles pero no invasivo
            COLOR: '#00ffff',
            DURATION: 180, // frames de efecto
            SPAWN_CHANCE: 0.9
        },
        slow: { // Ralentiza el juego
            SIZE: 26, // Consistente con shield
            COLOR: '#ffd700',
            DURATION: 240, // frames de efecto
            SPAWN_CHANCE: 0.9
        },
        GLOBAL: {
            SPAWN_INTERVAL: 200, // cada X frames intenta spawn
            EFFECT_SLOW_FACTOR: 0.5 // velocidad multiplicada
        }
    },

    // ===== SISTEMA DE JUEGO =====
    GAME: {
        INITIAL_SPEED: 3,
        MAX_SPEED: 8,
        SPEED_INCREMENT: 0.0005,
        TARGET_FPS: 60,
        INITIAL_LIVES: 3,
        MAX_LIVES: 5
    },

    // ===== PUNTUACIÓN =====
    SCORE: {
        PASS_OBSTACLE: 10,
        COLLECT_STAR: 5,
        COLLECT_GEM: 20,
        DESTROY_DRONE: 25,
        DESTROY_METEOR: 50,
        DESTROY_ALIEN: 40
    },

    // ===== PARTÍCULAS =====
    PARTICLES: {
        // Limites para evitar creación excesiva de partículas
        MAX_PARTICLES: 50,

        THRUST_COUNT: 3,
        THRUST_LIFE: 20,
        THRUST_SPEED_MIN: -3,
        THRUST_SPEED_MAX: -5,
        THRUST_COLORS: ['#00ffff', '#ffffff'],

        EXPLOSION_COUNT: 12,
        EXPLOSION_LIFE: 30,
        EXPLOSION_SPEED: 3,
        EXPLOSION_COLORS: ['#ff6b00', '#ff0000', '#ffff00', '#ffffff'],

        COLLECT_COUNT: 6,
        COLLECT_LIFE: 20,
        COLLECT_SPEED: 2
    },

    // ===== COLORES DEL JUEGO =====
    COLORS: {
        SPACE_DARK: '#0a0e27',
        SPACE_DEEP: '#1a1a3e',
        NEBULA_PURPLE: '#6b2d5c',
        NEBULA_PINK: '#e83e8c',
        STAR_YELLOW: '#ffd700',
        STAR_WHITE: '#ffffff',
        CYAN_GLOW: '#00ffff',
        SHIP_PRIMARY: '#4a90e2',
        SHIP_SECONDARY: '#357abd',
        SHIP_BORDER: '#2d5a8a'
    },

    // ===== PARALLAX =====
    PARALLAX: {
        SPEED_FAR: 0.3,
        SPEED_MID: 0.6,
        SPEED_NEBULA: 0.8,
        SPEED_NEAR: 1.2
    },

    // ===== STORAGE =====
    STORAGE: {
        BEST_SCORE_KEY: 'spaceFlyer_bestScore'
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
}
