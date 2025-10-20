const GAME_CONFIG = {
    images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
        'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368',
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c'
    ],
    filters: {
        1: 'none',            // Nivel 1: SIN filtros
        2: 'brightness(30%)', // Brillo 30%
        3: 'invert(1)'        // Negativo
    },
    blockConfigs: {
        4: { rows: 2, cols: 2 },
        6: { rows: 2, cols: 3 },
        8: { rows: 2, cols: 4 }
    }
};

// Tiempos límite por configuración (milisegundos). 0 = sin límite.
// Asumí tiempos razonables: 4 piezas = sin límite, 6 piezas = 3 minutos, 8 piezas = 90 segundos.
GAME_CONFIG.timeLimits = {
    4: 0,
    6: 3 * 60 * 1000,
    8: 90 * 1000
};

// Duración (ms) de la previsualización de miniaturas antes de iniciar automáticamente.
// Puedes ajustar esto para dar más tiempo al jugador.
GAME_CONFIG.previewDuration = 4000; // 4 segundos por defecto

/* =====================
     Menú principal dentro del Canvas
     - Dibuja título, selector (4/6/8) y botón Comenzar
     - Emite evento 'blocka:start' con { blocks }
     - Funciona con id 'canvasblocka' o 'canvasBlocka'
     ===================== */

;(function(){
    const canvas = document.getElementById('canvasblocka') || document.getElementById('canvasBlocka');
    if (!canvas) {
        console.warn('Canvas de Blocka no encontrado (busqué ids canvasblocka/canvasBlocka). No se inicializa el menú.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Estado del menú
    const menuState = {
        selectedBlocks: 4,
        hovered: null, // 'opt-4' | 'opt-6' | 'opt-8' | 'start' | null
        rects: {},
        enabled: true
    };

    // Texto / estilos
    const styles = {
        bg: '#0f1220',
        panel: 'rgba(255,255,255,0.04)',
        title: '#ffffff',
        subtitle: '#aab7d6',
        buttonBg: '#5a9fd4',
        buttonBgHover: '#7ab8e8',
        optionBg: 'rgba(255,255,255,0.06)',
        optionBgSel: '#4caf50'
    };

    // Escucha resize para ajustar canvas
    function fitCanvas() {
        // Usar clientWidth/clientHeight para obtener tamaños CSS ya aplicados
        const cssW = Math.max(1, canvas.clientWidth || canvas.getBoundingClientRect().width);
        const cssH = Math.max(1, canvas.clientHeight || canvas.getBoundingClientRect().height);
        // establecer tamaño real en device pixels
        canvas.width = Math.max(1, Math.floor(cssW * dpr));
        canvas.height = Math.max(1, Math.floor(cssH * dpr));
        // mantener el tamaño CSS explícito (evita que el canvas colapse)
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
        layoutRects();
        render();
    }

    // Calcula rectángulos interactivos en coordenadas CSS (no *device* pixels)
    function layoutRects(){
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        const centerX = w/2;
        const topY = Math.max(40, h*0.18);

        // Opciones: ancho total 360, cada opción 80x44 con gap
        const optW = 88;
        const optH = 46;
        const gap = 18;
        const totalW = optW*3 + gap*2;
        const startX = centerX - totalW/2;

        menuState.rects = {
            title: { x: centerX, y: topY-20 },
            opts: [
                { id: 'opt-4', x: startX, y: topY + 60, w: optW, h: optH },
                { id: 'opt-6', x: startX + (optW+gap), y: topY + 60, w: optW, h: optH },
                { id: 'opt-8', x: startX + 2*(optW+gap), y: topY + 60, w: optW, h: optH }
            ],
            start: { x: centerX - 120/2, y: topY + 140, w: 120, h: 52 }
        };
    }

    function clear() {
        if (!ctx) return;
        // clear en coordenadas CSS (ya que ctx está escalado por dpr)
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0,0,w,h);
    }

    function renderMenuOriginal(){
        if (!ctx) return;
        // usar dimensiones basadas en canvas.width/height y dpr para cubrir todo el área
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        clear();

        // Fondo
        ctx.fillStyle = styles.bg;
        ctx.fillRect(0,0,w,h);

    // Usar todo el canvas: título y subtítulo en la parte superior (sin panel)
    const topY = Math.max(40, h*0.18);
    // Título
    ctx.fillStyle = styles.title;
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px Inter, system-ui, sans-serif';
    ctx.fillText('BLOCKA', w/2, topY + 28);

    // Subtítulo
    ctx.fillStyle = styles.subtitle;
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('Gira las piezas y reconstruye la imagen', w/2, topY + 58);

        // Opciones (4/6/8)
        for (const opt of menuState.rects.opts){
            const isSel = menuState.selectedBlocks === parseInt(opt.id.split('-')[1]);
            const isHover = menuState.hovered === opt.id;
            drawOption(opt.x, opt.y, opt.w, opt.h, opt.id.split('-')[1], isSel, isHover);
        }

        // Botón Comenzar
        const st = menuState.rects.start;
        const hoverStart = menuState.hovered === 'start';
        drawStart(st.x, st.y, st.w, st.h, hoverStart);

    // Pie pequeño al final del canvas
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Selecciona número de piezas y pulsa Comenzar', w/2, h - 28);
    }

    function drawOption(x,y,w,h,label,selected,hover){
        ctx.save();
        // fondo
        if (selected) ctx.fillStyle = styles.optionBgSel; else ctx.fillStyle = (hover? 'rgba(255,255,255,0.09)': styles.optionBg);
        roundRectFill(ctx, x, y, w, h, 10);
        // texto
        ctx.fillStyle = selected ? '#fff' : '#e6eef9';
        ctx.font = '600 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w/2, y + h/2 + 1);
        ctx.restore();
    }

    function drawStart(x,y,w,h,hover){
        ctx.save();
        ctx.fillStyle = hover ? styles.buttonBgHover : styles.buttonBg;
        roundRectFill(ctx, x, y, w, h, 12);
        ctx.fillStyle = '#06202a';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Comenzar', x + w/2, y + h/2 + 1);
        ctx.restore();
    }

    function roundRectFill(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
        ctx.fill();
    }

    function roundRectStroke(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
        ctx.stroke();
    }

    // Mapeo de coordenadas pointer a CSS pixels
    function getPointerPos(evt){
        const r = canvas.getBoundingClientRect();
        return { x: evt.clientX - r.left, y: evt.clientY - r.top };
    }

    function hitTest(x,y){
        // opciones
        for (const opt of menuState.rects.opts){
            if (x >= opt.x && x <= opt.x + opt.w && y >= opt.y && y <= opt.y + opt.h) return opt.id;
        }
        const s = menuState.rects.start;
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return 'start';
        return null;
    }

    // Eventos pointer
    canvas.addEventListener('pointermove', e => {
        if (!menuState.enabled) return;
        const p = getPointerPos(e);
        const hit = hitTest(p.x, p.y);
        if (hit !== menuState.hovered){
            menuState.hovered = hit;
            render();
            canvas.style.cursor = hit ? 'pointer' : 'default';
        }
    });

    canvas.addEventListener('pointerdown', e => {
        if (!menuState.enabled) return;
        const p = getPointerPos(e);
        const hit = hitTest(p.x, p.y);
        if (!hit) return;
        if (hit.startsWith('opt-')){
            menuState.selectedBlocks = parseInt(hit.split('-')[1]);
            render();
            return;
        }
        if (hit === 'start'){
            // Deshabilitar menú y emitir evento
            menuState.enabled = false;
            render();
            const detail = { blocks: menuState.selectedBlocks };
            // emitimos evento global para que el resto del juego lo capture
            window.dispatchEvent(new CustomEvent('blocka:start', { detail }));
            console.info('blocka:start', detail);
        }
    });

    // Si el usuario mueve el puntero fuera del canvas
    canvas.addEventListener('pointerleave', () => {
        if (menuState.hovered){ menuState.hovered = null; render(); canvas.style.cursor = 'default'; }
    });

    // Soporte teclado: Tab para cambiar opciones y Enter para comenzar
    window.addEventListener('keydown', (e) => {
        // Si el juego está activo, algunas teclas afectan al juego
        if (gameState.active){
            if (e.key === 'h' || e.key === 'H') { applyHelp(); }
            if (e.key === 'p' || e.key === 'P') { gameState.isPaused = !gameState.isPaused; if (!gameState.isPaused) gameState.startTime = Date.now() - gameState.elapsed; render(); }
            if (e.key === 'r' || e.key === 'R') { startGame(gameState.blocks); }
            return;
        }

        if (!menuState.enabled) return;
        if (e.key === 'ArrowLeft' || e.key === 'a'){
            menuState.selectedBlocks = menuState.selectedBlocks === 4 ? 8 : (menuState.selectedBlocks === 6 ? 4 : 6);
            render();
        }
        if (e.key === 'ArrowRight' || e.key === 'd'){
            menuState.selectedBlocks = menuState.selectedBlocks === 4 ? 6 : (menuState.selectedBlocks === 6 ? 8 : 4);
            render();
        }
        if (e.key === 'Enter'){
            window.dispatchEvent(new CustomEvent('blocka:start', { detail: { blocks: menuState.selectedBlocks } }));
            menuState.enabled = false;
            render();
        }
    });

    // Inicialización
    function init(){
        fitCanvas();
        // si el canvas no tiene altura en CSS, le damos una proporción razonable
        const r = canvas.getBoundingClientRect();
        if (r.height < 120){
            canvas.style.height = '450px';
            fitCanvas();
        }
    }

    // Exponer helper para iniciar menú desde código
    window.blockaCanvasMenu = {
        setBlocks(n){ menuState.selectedBlocks = n; render(); },
        enable(){ menuState.enabled = true; render(); },
        disable(){ menuState.enabled = false; render(); }
    };

    /* =====================
       Lógica del juego 
       ===================== */
    const gameState = {
        active: false,
        blocks: 4,
        rows: 0,
        cols: 0,
        pieces: [],
        image: null,
        offCanvas: null,
        cropSize: 0,
        moves: 0,
        win: false,
        startTime: null,
        elapsed: 0,
        timerId: null,
        isPaused: false,
        selectedIndex: null,
        hud: { height: 56, pauseRect: null, level: 1 }
    };

    // Estado y utilidades para interacción táctil
    const touchState = {
        lastTap: 0,
        tapTimeout: null,
        longPressTimeout: null,
        longPressFired: false
    };

    function loadImage(src){
        return new Promise((resolve,reject)=>{
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function startGame(blocks){
        menuState.enabled = false; // ocultar menú
        gameState.active = false; // se activará tras cargar la imagen
        gameState.blocks = blocks || 4;
        gameState.moves = 0;
        gameState.win = false;
        const imgSrc = GAME_CONFIG.images[Math.floor(Math.random()*GAME_CONFIG.images.length)];
        // Antes de comenzar, mostrar preview de thumbnails y permitir seleccionar la imagen
        showThumbnailsAnimation(imgSrc, (selectedSrc) => {
            const finalSrc = selectedSrc || imgSrc;
            loadImage(finalSrc).then(img=>{
            // Crear una versión recortada cuadrada (centrada) en un canvas offscreen
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            const square = Math.min(nw, nh);
            const sx = Math.floor((nw - square) / 2);
            const sy = Math.floor((nh - square) / 2);
            const off = document.createElement('canvas');
            off.width = square;
            off.height = square;
            const offCtx = off.getContext('2d');
            // Dibujar el crop centrado en el offscreen canvas
            offCtx.drawImage(img, sx, sy, square, square, 0, 0, square, square);
            gameState.offCanvas = off;
            gameState.cropSize = square;
            gameState.active = true;
            gameState.image = img; // aún mantenemos la imagen original por si acaso
            gameState.moves = 0;
            gameState.win = false;
            const cfg = GAME_CONFIG.blockConfigs[gameState.blocks];
            gameState.rows = cfg.rows; gameState.cols = cfg.cols;
            setupPieces();
            startTimer();
            render();
            }).catch(err=>{
                console.error('Error cargando imagen', err);
                // reactivar menú
                menuState.enabled = true; render();
            });
        });
    }

    function setupPieces(){
        gameState.pieces = [];
        const total = gameState.rows * gameState.cols;
        for (let r=0;r<gameState.rows;r++){
            for (let c=0;c<gameState.cols;c++){
                const idx = r*gameState.cols + c;
                const rot = [0,90,180,270][Math.floor(Math.random()*4)];
                gameState.pieces.push({ index: idx, r, c, rotation: rot, correctRotation: 0 });
            }
        }
        calculateGameLayout();
    }

    function calculateGameLayout(){
        // dimensiones en CSS pixels
        const cssW = canvas.width / dpr;
        const cssH = canvas.height / dpr;
        const hudH = gameState.hud.height;
        const padding = 12;
        const areaW = cssW - padding*2;
        const areaH = cssH - hudH - padding*2;
        // Para mantener las piezas cuadradas, elegimos el tamaño de pieza como el mínimo
        // entre el ancho disponible por columna y la altura disponible por fila.
        const pieceSize = Math.floor(Math.min(areaW / gameState.cols, areaH / gameState.rows));
        // Centrar el grid dentro del área disponible
        const gridW = pieceSize * gameState.cols;
        const gridH = pieceSize * gameState.rows;
        const areaX = padding + Math.floor((areaW - gridW) / 2);
        const areaY = hudH + padding + Math.floor((areaH - gridH) / 2);

        gameState.layout = {
            cssW, cssH,
            hudX: 12, hudY: 8, hudW: cssW-24, hudH,
            areaX: padding, areaY: hudH + padding, areaW, areaH,
            gridX: areaX, gridY: areaY, gridW, gridH,
            pieceSize
        };
    }

    function startTimer(){
        gameState.startTime = Date.now() - gameState.elapsed;
        if (gameState.timerId) clearInterval(gameState.timerId);
        // Si hay un time limit para esta configuración, calcular el deadline
        const limit = GAME_CONFIG.timeLimits[gameState.blocks] || 0;
        gameState.timeLimit = limit; // ms
        if (limit > 0){
            gameState.deadline = gameState.startTime + limit;
        } else { gameState.deadline = null; }

        gameState.timerId = setInterval(()=>{
            if (!gameState.isPaused) {
                gameState.elapsed = Date.now() - gameState.startTime;
                // comprobar límite
                if (gameState.deadline && Date.now() >= gameState.deadline){
                    clearInterval(gameState.timerId);
                    gameState.timerId = null;
                    onTimeLimitReached();
                    return;
                }
                render();
            }
        }, 200);
    }

    function stopTimer(){ if (gameState.timerId){ clearInterval(gameState.timerId); gameState.timerId = null; } }

    function formatTime(ms){ const s = Math.floor(ms/1000); const m = Math.floor(s/60); const sec = s%60; return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`; }

    function renderGame(){
        // se reutiliza render() del menú para limpiar antes
        clear();
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        // fondo
        ctx.fillStyle = '#08111a'; ctx.fillRect(0,0,w,h);
        if (!gameState.image) {
            ctx.fillStyle = '#fff'; ctx.font = '600 18px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('Cargando imagen...', w/2, h/2);
            return;
        }
        // HUD
        const hud = gameState.layout;
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRectFill(ctx, hud.hudX, hud.hudY, hud.hudW, hud.hudH, 8);
        ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('Nivel: '+gameState.hud.level, hud.hudX + 12, hud.hudY + hud.hudH/2);
        ctx.textAlign = 'center'; ctx.fillText(formatTime(gameState.elapsed), hud.hudX + hud.hudW/2, hud.hudY + hud.hudH/2);
        // Mostrar tiempo restante si hay límite
        if (gameState.deadline){
            const remaining = Math.max(0, gameState.deadline - Date.now());
            ctx.fillStyle = '#ffd700'; ctx.textAlign = 'right'; ctx.fillText(formatTime(remaining), hud.hudX + hud.hudW - 12, hud.hudY + hud.hudH/2);
        }
        // pausa (derecha)
        const pauseW = 80; const pauseH = 32; const px = hud.hudX + hud.hudW - pauseW - 12; const py = hud.hudY + (hud.hudH - pauseH)/2;
        ctx.fillStyle = gameState.isPaused ? 'rgba(255,100,100,0.9)' : styles.buttonBg;
        roundRectFill(ctx, px, py, pauseW, pauseH, 8);
        ctx.fillStyle = '#06202a'; ctx.textAlign='center'; ctx.fillText(gameState.isPaused ? 'Reanudar' : 'Pausa', px + pauseW/2, py + pauseH/2 + 1);
        gameState.hud.pauseRect = { x: px, y: py, w: pauseW, h: pauseH };

    // Contador de movimientos (lado izquierdo del HUD)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText('Movimientos: ' + (gameState.moves || 0), hud.hudX + 140, hud.hudY + hud.hudH/2);

        // piezas: usar el offscreen canvas cuadrado como fuente y dibujar piezas cuadradas
        const area = gameState.layout;
        const off = gameState.offCanvas;
        const cropSize = gameState.cropSize || (off ? off.width : 0);
        if (!off || !cropSize) {
            // en caso improbable de no tener offscreen, mostrar mensaje
            ctx.fillStyle = '#fff'; ctx.font = '600 16px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('Error: imagen no disponible', w/2, h/2);
            return;
        }
        const sW = cropSize / gameState.cols;
        const sH = cropSize / gameState.rows;
        const ps = area.pieceSize;
        for (const p of gameState.pieces){
            const dx = area.gridX + p.c * ps;
            const dy = area.gridY + p.r * ps;
            const dw = ps;
            const dh = ps; // forzamos cuadrado
            // source (sub-rect dentro del offscreen cuadrado)
            const sx = Math.floor(p.c * sW);
            const sy = Math.floor(p.r * sH);
            ctx.save();
            ctx.translate(dx + dw/2, dy + dh/2);
            ctx.rotate((p.rotation * Math.PI)/180);
            // Dibujar escalando la porción fuente al cuadrado destino
            ctx.drawImage(off, sx, sy, sW, sH, -dw/2, -dh/2, dw, dh);
            ctx.restore();
        }

        // Dibujar resaltado para la pieza seleccionada
        if (typeof gameState.selectedIndex === 'number' && gameState.selectedIndex !== null){
            const sp = gameState.pieces[gameState.selectedIndex];
            if (sp){
                const dx = area.gridX + sp.c * ps;
                const dy = area.gridY + sp.r * ps;
                const pad = 6;
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(90,159,212,0.6)';
                ctx.shadowBlur = 18;
                roundRectStroke(ctx, dx - pad/2, dy - pad/2, ps + pad, ps + pad, 10);
                ctx.restore();
            }
        }

        // overlay cuando juego pausado
        if (gameState.isPaused){
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = '#fff'; ctx.font = '600 22px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('PAUSADO', w/2, h/2);
        }

        // Si ganó, dibujar overlay de victoria con botones
        if (gameState.win){
            ctx.fillStyle = 'rgba(0,0,0,0.66)'; ctx.fillRect(0,0,w,h);
            const boxW = Math.min(520, w - 80);
            const boxH = 260;
            const bx = (w - boxW)/2;
            const by = (h - boxH)/2;
            ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRectFill(ctx, bx, by, boxW, boxH, 14);
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '700 28px Inter, sans-serif';
            ctx.fillText('¡Victoria!', w/2, by + 56);
            ctx.font = '600 16px Inter, sans-serif'; ctx.fillText('Tiempo: ' + formatTime(gameState.elapsed) + ' · Movimientos: ' + (gameState.moves||0), w/2, by + 96);

            // Botones: Reintentar y Volver al menú
            const btnW = 160, btnH = 44, gap = 24;
            const bx1 = w/2 - btnW - gap/2;
            const bx2 = w/2 + gap/2;
            const byBtn = by + boxH - 72;
            // Reintentar
            ctx.fillStyle = styles.buttonBg; roundRectFill(ctx, bx1, byBtn, btnW, btnH, 10);
            ctx.fillStyle = '#06202a'; ctx.font = '600 16px Inter, sans-serif'; ctx.fillText('Reintentar', bx1 + btnW/2, byBtn + btnH/2 + 1);
            // Volver al menú
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRectFill(ctx, bx2, byBtn, btnW, btnH, 10);
            ctx.fillStyle = '#fff'; ctx.fillText('Volver al menú', bx2 + btnW/2, byBtn + btnH/2 + 1);

            // Guardar rects para interacción
            gameState.hud.winRect = { x: bx, y: by, w: boxW, h: boxH };
            gameState.hud.winBtns = {
                retry: { x: bx1, y: byBtn, w: btnW, h: btnH },
                menu: { x: bx2, y: byBtn, w: btnW, h: btnH }
            };
        } else {
            gameState.hud.winRect = null; gameState.hud.winBtns = null;
        }

            // Si tiempo agotado, mostrar overlay de derrota
            if (gameState.timedOut){
                ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,w,h);
                ctx.fillStyle = '#fff'; ctx.font = '700 28px Inter, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('Tiempo agotado', w/2, h/2 - 20);
                ctx.font = '600 16px Inter, sans-serif'; ctx.fillText('Has perdido el nivel. Intenta de nuevo o vuelve al menú.', w/2, h/2 + 12);
                const btnW = 160, btnH = 44, gap = 24;
                const bx1 = w/2 - btnW - gap/2;
                const bx2 = w/2 + gap/2;
                const byBtn = h/2 + 56;
                ctx.fillStyle = styles.buttonBg; roundRectFill(ctx, bx1, byBtn, btnW, btnH, 10);
                ctx.fillStyle = '#06202a'; ctx.font = '600 16px Inter, sans-serif'; ctx.fillText('Reintentar', bx1 + btnW/2, byBtn + btnH/2 + 1);
                ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRectFill(ctx, bx2, byBtn, btnW, btnH, 10);
                ctx.fillStyle = '#fff'; ctx.fillText('Volver al menú', bx2 + btnW/2, byBtn + btnH/2 + 1);
                gameState.hud.winBtns = {
                    retry: { x: bx1, y: byBtn, w: btnW, h: btnH },
                    menu: { x: bx2, y: byBtn, w: btnW, h: btnH }
                };
            }
    }

    // Muestra una animación previa con thumbnails y resalta la imagen que se usará.
    // callback se invoca cuando termina la animación.
    function showThumbnailsAnimation(chosenSrc, callback){
        try {
            // Crear overlay simple usando DOM para mostrar miniaturas centradas
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.left = '0'; overlay.style.top = '0'; overlay.style.right = '0'; overlay.style.bottom = '0';
            overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = 9999; overlay.setAttribute('role','dialog');

            const container = document.createElement('div');
            container.style.display = 'flex'; container.style.gap = '12px'; container.style.padding = '18px';
            container.style.borderRadius = '12px'; container.style.backdropFilter = 'blur(4px)';

            // Añadir thumbnails (usar GAME_CONFIG.images)
            // timeouts handles so we can cancel if user selects
            let t1 = null, t2 = null, t3 = null;
            let done = false;
            for (const src of GAME_CONFIG.images){
                const img = document.createElement('img');
                img.src = src;
                img.style.width = '120px'; img.style.height = '120px'; img.style.objectFit = 'cover';
                img.style.borderRadius = '8px'; img.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease';
                img.style.opacity = '0.9';
                img.style.cursor = 'pointer';
                img.tabIndex = 0; // accesible
                if (src === chosenSrc){
                    img.style.transform = 'scale(1.06)'; img.style.boxShadow = '0 10px 30px rgba(255,255,255,0.2)';
                }
                // click handler: user selects this image
                const onSelect = () => {
                    if (done) return; done = true;
                    // clear pending timeouts
                    if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); if (t3) clearTimeout(t3);
                    try { document.body.removeChild(overlay); } catch(e){}
                    if (typeof callback === 'function') callback(src);
                };
                img.addEventListener('click', onSelect);
                img.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(); } });
                container.appendChild(img);
            }

            overlay.appendChild(container);
            document.body.appendChild(overlay);

            // Animación sencilla: pulse y luego fade out. Guardar timeouts para cancelarlos si el usuario selecciona.
            const previewMs = (GAME_CONFIG.previewDuration && Number(GAME_CONFIG.previewDuration)) || 4000;
            const step1 = Math.min(400, Math.floor(previewMs * 0.08));
            const step2 = Math.min(900, Math.floor(previewMs * 0.22));

            t1 = setTimeout(()=>{
                container.querySelectorAll('img').forEach(i=> i.style.transform = 'scale(0.98)');
            }, step1);
            t2 = setTimeout(()=>{
                container.querySelectorAll('img').forEach(i=> i.style.opacity = '0.3');
                // resaltar la elegida
                const imgs = container.querySelectorAll('img');
                for (const im of imgs){ if (im.src.indexOf(chosenSrc) !== -1 || im.src === chosenSrc){ im.style.opacity = '1'; im.style.transform = 'scale(1.12)'; im.style.boxShadow = '0 18px 48px rgba(255,255,255,0.25)'; } }
            }, step2);

            t3 = setTimeout(()=>{
                if (done) return; done = true;
                overlay.style.transition = 'opacity 0.35s ease'; overlay.style.opacity = '0';
                setTimeout(()=>{ try { document.body.removeChild(overlay); } catch(e){}; if (typeof callback === 'function') callback(); }, 360);
            }, previewMs);
        } catch (e){ console.warn('Preview thumbnails failed', e); if (typeof callback === 'function') callback(); }
    }

    // Ayudita: fija correctamente una pieza aleatoria que no esté ya correcta.
    // Suma 5 segundos al temporizador como penalización por ayuda.
    function pickAndFixOnePiece(){
        const candidates = gameState.pieces.filter(p => (p.rotation % 360) !== 0 && !p.fixed);
        if (!candidates.length) return false;
        const pick = candidates[Math.floor(Math.random()*candidates.length)];
        // establecer rotacion correcta
        pick.rotation = 0; pick.fixed = true;
        // sumar 5 segundos (5000ms) al deadline si existe, o a elapsed si no hay límite
        const penalty = 5000;
        if (gameState.deadline){ gameState.deadline += penalty; }
        else { gameState.startTime -= penalty; /* reducir startTime hace que elapsed aumente 5s */ }
        return true;
    }

    // Handler invocado cuando el usuario pide ayuda
    function applyHelp(){
        if (!gameState.active || gameState.win) return false;
        const ok = pickAndFixOnePiece();
        if (ok){ gameState.moves = (gameState.moves||0) + 1; render(); }
        return ok;
    }

    function onTimeLimitReached(){
        // Mostrar pantalla de derrota y permitir reintentar o volver al menu
        gameState.active = false;
        gameState.win = false;
        // simple overlay usando renderGame: marcamos un estado
        gameState.timedOut = true;
        render();
        // crear un overlay interactivo breve: reintentar o volver al menu fa se manejan en handleGamePointerDown
    }

    function render(){
        // Si el juego está activo o acabó y hay victoria, seguimos dibujando la vista de juego
        if (gameState.active || gameState.win) renderGame(); else renderMenuOriginal();
    }

    // Interacción durante el juego - unified pointer + touch handling
    function processPieceInteraction(col, row, isRightClick){
        const idx = row * gameState.cols + col;
        const piece = gameState.pieces[idx];
        if (!piece) return false;
        // Selección: si no hay seleccion, seleccionar la pieza
        if (gameState.selectedIndex === null || gameState.selectedIndex !== idx){
            gameState.selectedIndex = idx;
            return true; // solo seleccionar, no rotar
        }
        // Si la pieza ya estaba seleccionada, la segunda interacción rota
        if (isRightClick){ piece.rotation = (piece.rotation + 90) % 360; }
        else { piece.rotation = (piece.rotation + 270) % 360; }
        gameState.moves = (gameState.moves || 0) + 1;
        // limpiar selección después de rotar
        gameState.selectedIndex = null;
        // comprobar victoria
        const won = gameState.pieces.every(p => (p.rotation % 360) === 0);
    if (won){ stopTimer(); gameState.win = true; /* keep active true so renderGame draws overlay */ console.info('Blocka: WIN detected'); render(); }
        return true;
    }

    function handleGamePointerDown(p, button){
        // comprobar pausa
        const pr = gameState.hud.pauseRect;
        if (pr && p.x >= pr.x && p.x <= pr.x+pr.w && p.y >= pr.y && p.y <= pr.y+pr.h){
            // toggle pausa
            gameState.isPaused = !gameState.isPaused;
            if (gameState.isPaused) { /* paused */ }
            else { gameState.startTime = Date.now() - gameState.elapsed; }
            render();
            return;
        }
        if (gameState.isPaused) return;

        // if win overlay active, check buttons
        if (gameState.win && gameState.hud && gameState.hud.winBtns){
            const rb = gameState.hud.winBtns;
            if (p.x >= rb.retry.x && p.x <= rb.retry.x + rb.retry.w && p.y >= rb.retry.y && p.y <= rb.retry.y + rb.retry.h){
                // Reintentar
                startGame(gameState.blocks);
                return;
            }
            if (p.x >= rb.menu.x && p.x <= rb.menu.x + rb.menu.w && p.y >= rb.menu.y && p.y <= rb.menu.y + rb.menu.h){
                // Volver al menú
                gameState.win = false; gameState.active = false; gameState.offCanvas = null; menuState.enabled = true; render();
                return;
            }
            return;
        }

        // Si hay pantalla de tiempo agotado, sus botones se manejan aquí tambien
        if (gameState.timedOut && gameState.hud && gameState.hud.winBtns){
            const rb = gameState.hud.winBtns;
            if (p.x >= rb.retry.x && p.x <= rb.retry.x + rb.retry.w && p.y >= rb.retry.y && p.y <= rb.retry.y + rb.retry.h){
                // Reintentar
                gameState.timedOut = false; startGame(gameState.blocks); return;
            }
            if (p.x >= rb.menu.x && p.x <= rb.menu.x + rb.menu.w && p.y >= rb.menu.y && p.y <= rb.menu.y + rb.menu.h){
                // Volver al menú
                gameState.timedOut = false; gameState.win = false; gameState.active = false; gameState.offCanvas = null; menuState.enabled = true; render(); return;
            }
            return;
        }

        // calcular si clic en pieza (usando grid centrado y pieceSize cuadrado)
        const area = gameState.layout;
        const localX = p.x - area.gridX;
        const localY = p.y - area.gridY;
        if (localX < 0 || localY < 0) return;
        const col = Math.floor(localX / area.pieceSize);
        const row = Math.floor(localY / area.pieceSize);
        if (col < 0 || col >= gameState.cols || row < 0 || row >= gameState.rows) return;
        processPieceInteraction(col, row, button === 2);
        render();
    }

    // pointerdown (mouse/pen only) - touch is handled by pointerup/long-press logic
    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
        if (!gameState.active && !gameState.win) return; // allow clicks on win overlay even if not active
        const p = getPointerPos(e);
        handleGamePointerDown(p, e.button);
    });

    // Touch handling: tap = left rotate, double-tap = right rotate, long-press = right rotate
    canvas.addEventListener('pointerup', e => {
        // only care about touch pointers (pointerType may be 'touch' or 'mouse')
        const p = getPointerPos(e);
        if (e.pointerType === 'touch' || e.pointerType === 'pen'){
            const now = Date.now();
            const dt = now - (touchState.lastTap || 0);
            // double-tap
            if (dt < 300){
                // treat as double tap -> rotate right
                clearTimeout(touchState.tapTimeout);
                touchState.lastTap = 0;
                handleGamePointerDown(p, 2);
            } else {
                // single tap: wait briefly to detect double-tap
                touchState.lastTap = now;
                touchState.tapTimeout = setTimeout(()=>{
                    handleGamePointerDown(p, 0); // single tap -> left rotate
                    touchState.lastTap = 0;
                }, 260);
            }
        }
        // cancel long press state
        if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; }
        touchState.longPressFired = false;
    });

    canvas.addEventListener('pointercancel', e => {
        if (touchState.tapTimeout){ clearTimeout(touchState.tapTimeout); touchState.tapTimeout = null; }
        if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; }
        touchState.longPressFired = false;
    });

    // start long-press detection on pointerdown for touch
    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen'){
            const p = getPointerPos(e);
            if (touchState.longPressTimeout) clearTimeout(touchState.longPressTimeout);
            touchState.longPressFired = false;
            touchState.longPressTimeout = setTimeout(()=>{
                // long press -> rotate right on the touched piece
                touchState.longPressFired = true;
                handleGamePointerDown(p, 2);
            }, 600);
        }
    });

    // evitar menú contextual en canvas durante el juego o cuando se muestra la pantalla de victoria
    canvas.addEventListener('contextmenu', e => { if (gameState.active || gameState.win) e.preventDefault(); });

    // Escuchar evento global 'blocka:start'
    window.addEventListener('blocka:start', (ev) => { startGame(ev.detail && ev.detail.blocks ? ev.detail.blocks : menuState.selectedBlocks); });


    // Listener para cuando se recargue layout (p. ej. cambios de CSS)
    new ResizeObserver(fitCanvas).observe(canvas);
    init();

})();