/**
 * SoundManager.js
 * Gestiona efectos de sonido y mute global.
 */
class SoundManager {
    constructor() {
        this.muted = false;
        this.sounds = {};
        this.volume = 0.6;
        this.musicVolume = 0.3;
        this.music = null;
        this.musicPlaying = false;
        this.init();
    }

    init() {
        // Base64 WAV sencillos (beeps placeholder). Reemplazar por assets reales.
        const beepJump = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; // silencioso placeholder
        const beepCollect = beepJump;
        const beepDamage = beepJump;
        const beepExplosion = beepJump;
        const beepPause = beepJump;

        this.register('jump', beepJump);
        this.register('collect', beepCollect);
        this.register('damage', beepDamage);
        this.register('explosion', beepExplosion);
        this.register('pause', beepPause);
        
        // Música de fondo (placeholder silencioso, reemplazar con assets/sounds/background.mp3)
        this.music = new Audio(beepJump);
        this.music.loop = true;
        this.music.volume = this.musicVolume;
    }

    register(name, src) {
        const audio = new Audio(src);
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }

    play(name) {
        if (this.muted) return;
        const s = this.sounds[name];
        if (!s) return;
        // Clonar para reproducción simultánea
        const clone = s.cloneNode();
        clone.volume = this.volume;
        clone.play().catch(()=>{});
    }

    setMuted(val) {
        this.muted = val;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted && this.music) {
            this.music.pause();
        } else if (!this.muted && this.musicPlaying && this.music) {
            this.music.play().catch(()=>{});
        }
        return this.muted;
    }

    startMusic() {
        if (!this.music || this.muted) return;
        this.musicPlaying = true;
        this.music.currentTime = 0;
        this.music.play().catch(()=>{});
    }

    stopMusic() {
        if (!this.music) return;
        this.musicPlaying = false;
        this.music.pause();
        this.music.currentTime = 0;
    }

    fadeMusic(targetVolume, duration = 1000) {
        if (!this.music) return;
        const startVolume = this.music.volume;
        const volumeDiff = targetVolume - startVolume;
        const steps = 20;
        const stepTime = duration / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                this.music.volume = targetVolume;
                clearInterval(interval);
            } else {
                this.music.volume = startVolume + (volumeDiff * currentStep / steps);
            }
        }, stepTime);
    }
}

// Instancia global
window.SoundManager = new SoundManager();
