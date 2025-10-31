// Configuración del juego
const GAME_CONFIG = { // objeto con la configuración global
     images: [ // lista de rutas de imágenes
        '../TP2/assets/img/images-4.jpeg', // imagen 1
        '../TP2/assets/img/images-5.jpeg', // imagen 2
        '../TP2/assets/img/images-6.jpeg', // imagen 3
        '../TP2/assets/img/images-7.jpeg', // imagen 4
        '../TP2/assets/img/images-8.jpeg', // imagen 5
        '../TP2/assets/img/simp.jpg', // imagen 6
        '../TP2/assets/img/simps.jpg' // imagen 7
    ],
    levels: { // definición de niveles y filtros/tiempo
        1: { filterTypes: ['none'], name: 'Nivel 1' }, // nivel 1 sin filtros
        2: { filterTypes: ['grayscale'], name: 'Nivel 2' }, // nivel 2 escala de grises
        3: { filterTypes: ['brightness', 'grayscale'], name: 'Nivel 3', maxTime: 20 }, // nivel 3 con tiempo
        4: { filterTypes: ['invert', 'brightness'], name: 'Nivel 4', maxTime: 15 } // nivel 4 más difícil
    },
    blockConfigs: { // configuraciones según cantidad de piezas
        4: { rows: 2, cols: 2 }, // 4 piezas = 2x2
        6: { rows: 2, cols: 3 }, // 6 piezas = 2x3
        8: { rows: 2, cols: 4 } // 8 piezas = 2x4
    }
};

/* =====================
     Menú principal dentro del Canvas
     ===================== */

;(function(){ // IIFE para encerrar el módulo
    const canvas = document.getElementById('canvasblocka') || document.getElementById('canvasBlocka'); // obtener canvas
    if (!canvas) { // si no existe canvas
        console.warn('Canvas de Blocka no encontrado (busqué ids canvasblocka/canvasBlocka). No se inicializa el menú.'); // advertencia
        return; // salir
    }

    const ctx = canvas.getContext('2d'); // contexto 2D
    const dpr = window.devicePixelRatio || 1; // pixel ratio para pantallas HiDPI

    // Estado del menú
    const menuState = { // objeto con estado del menú
        selectedBlocks: 4, // opción por defecto
        hovered: null, // elemento bajo el cursor
        rects: {}, // rectángulos interactivos
        enabled: true, // menú activo
        isLoading: true, // indicador de carga de imágenes
        loadingError: null // mensaje de error de carga
    };

    const styles = { // paleta y estilos simples
        bg: '#0f1220', // fondo
        panel: 'rgba(255,255,255,0.04)', // panel translucido
        title: '#ffffff', // color título
        subtitle: '#aab7d6', // color subtítulo
        buttonBg: '#5a9fd4', // color botón
        buttonBgHover: '#7ab8e8', // hover botón
        optionBg: 'rgba(255,255,255,0.06)', // fondo opción
        optionBgSel: '#4caf50' // opción seleccionada
    };
    function fitCanvas() { // ajustar tamaño del canvas a CSS y DPR
        const cssW = Math.max(1, canvas.clientWidth || canvas.getBoundingClientRect().width); // ancho CSS
        const cssH = Math.max(1, canvas.clientHeight || canvas.getBoundingClientRect().height); // alto CSS
        canvas.width = Math.max(1, Math.floor(cssW * dpr)); // ancho en píxeles reales
        canvas.height = Math.max(1, Math.floor(cssH * dpr)); // alto en píxeles reales
        canvas.style.width = cssW + 'px'; // asegurar estilo
        canvas.style.height = cssH + 'px'; // asegurar estilo
        if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0); // escalar contexto por DPR
        if (gameState.phase !== 'menu') calculateGameLayout(); // recalcular layout juego si no está en menú
        else layoutRects(); // si está en menú, calcular rects
        render(); // redibujar
    }
    function layoutRects(){ // calcular posiciones de botones del menú
        const w = canvas.getBoundingClientRect().width; // ancho visible
        const h = canvas.getBoundingClientRect().height; // alto visible
        const centerX = w/2; // centro X
        const topY = Math.max(40, h*0.18); // Y superior para encabezado
        const optW = 88; // ancho opción
        const optH = 46; // alto opción
        const gap = 18; // separación entre opciones
        const totalW = optW*3 + gap*2; // ancho total opciones
        const startX = centerX - totalW/2; // X de inicio opciones
        const optsYOffset = 100; // offset vertical para opciones
        const startYOffset = 180; // offset vertical para botón comenzar
        menuState.rects = { // guardar rects calculados
            title: { x: centerX, y: topY-20 },
            opts: [
                { id: 'opt-4', x: startX, y: topY + optsYOffset, w: optW, h: optH }, // opción 4
                { id: 'opt-6', x: startX + (optW+gap), y: topY + optsYOffset, w: optW, h: optH }, // opción 6
                { id: 'opt-8', x: startX + 2*(optW+gap), y: topY + optsYOffset, w: optW, h: optH } // opción 8
            ],
            start: { x: centerX - 120/2, y: topY + startYOffset, w: 120, h: 52 } // botón comenzar
        };
    }
    function clear() { // limpiar canvas en coordenadas CSS
        if (!ctx) return; // si no hay contexto
        const w = canvas.width / dpr; // ancho CSS
        const h = canvas.height / dpr; // alto CSS
        ctx.clearRect(0,0,w,h); // limpiar
    }
    function renderMenuOriginal(){ // dibujar menú principal
        if (!ctx) return; // seguridad
        const w = canvas.width / dpr; // ancho CSS
        const h = canvas.height / dpr; // alto CSS
        clear(); // limpiar antes de dibujar
        ctx.fillStyle = styles.bg; // establecer fondo
        ctx.fillRect(0,0,w,h); // dibujar fondo
        const topY = Math.max(40, h*0.18); // posición top usada

    ctx.fillStyle = styles.title; // color título
    ctx.textAlign = 'center'; // texto centrado
    ctx.font = 'bold 34px Inter, system-ui, sans-serif'; // fuente título
    ctx.fillText('BLOCKA', w/2, topY + 18); // dibujar título

    ctx.fillStyle = styles.subtitle; // subtítulo color
    ctx.font = '16px Inter, system-ui, sans-serif'; // fuente subtítulo
    ctx.fillText('Gira las piezas y reconstruye la imagen', w/2, topY + 48); // texto subtítulo

    // Texto explicativo sobre los botones de cantidad de piezas
    ctx.font = '15px Inter, system-ui, sans-serif'; // fuente explicativa
    ctx.fillStyle = '#b6c6e2'; // color texto
    ctx.fillText('Elegí la cantidad de piezas:', w/2, topY + 78); // instrucción

        if (menuState.isLoading) {  // si aún cargan imágenes
            ctx.fillStyle = '#fff'; // color texto
            ctx.font = '16px Inter, system-ui, sans-serif'; // fuente
            ctx.fillText('Cargando imágenes...', w/2, h/2 + 40); // mensaje de carga
            return; // no dibujar más
        }

        // AÑADIR ESTE BLOQUE PARA MOSTRAR EL ERROR
        if (menuState.loadingError) { // si hubo error de carga
            ctx.fillStyle = '#ff8a80'; // color error
            ctx.font = '14px Inter, system-ui, sans-serif'; // fuente
            ctx.fillText(menuState.loadingError, w/2, h - 50); // mostrar mensaje
        }

        for (const opt of menuState.rects.opts){ // dibujar opciones
            const isSel = menuState.selectedBlocks === parseInt(opt.id.split('-')[1]); // si está seleccionada
            const isHover = menuState.hovered === opt.id; // si está hover
            drawOption(opt.x, opt.y, opt.w, opt.h, opt.id.split('-')[1], isSel, isHover); // dibujar opción
        }
        const st = menuState.rects.start; // rect del botón iniciar
        const hoverStart = menuState.hovered === 'start'; // hover en iniciar
        drawStart(st.x, st.y, st.w, st.h, hoverStart); // dibujar botón iniciar
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; // estilo texto final
        ctx.font = '12px Inter, system-ui, sans-serif'; // fuente pequeña
        ctx.fillText('', w/2, h - 28); // espacio (vacío)
    }
    function drawOption(x,y,w,h,label,selected,hover){ // dibuja una opción
        ctx.save(); // guardar estado
        if (selected) ctx.fillStyle = styles.optionBgSel; else ctx.fillStyle = (hover? 'rgba(255,255,255,0.09)': styles.optionBg); // elegir color
        roundRectFill(ctx, x, y, w, h, 10); // rect redondeado relleno
        ctx.fillStyle = selected ? '#fff' : '#e6eef9'; // color texto según selección
        ctx.font = '600 18px Inter, sans-serif'; // fuente
        ctx.textAlign = 'center'; // centrar texto
        ctx.textBaseline = 'middle'; // base centrada
        ctx.fillText(label, x + w/2, y + h/2 + 1); // dibujar etiqueta
        ctx.restore(); // restaurar estado
    }
    function drawStart(x,y,w,h,hover){ // dibuja botón iniciar
        ctx.save(); // guardar estado
        ctx.fillStyle = hover ? styles.buttonBgHover : styles.buttonBg; // color hover o normal
        roundRectFill(ctx, x, y, w, h, 12); // rect redondeado
        ctx.fillStyle = '#06202a'; // color texto
        ctx.font = '600 16px Inter, sans-serif'; // fuente
        ctx.textAlign = 'center'; // centrar texto
        ctx.textBaseline = 'middle'; // baseline
        ctx.fillText('Comenzar', x + w/2, y + h/2 + 1); // texto botón
        ctx.restore(); // restaurar estado
    }
    function roundRectFill(ctx,x,y,w,h,r){ // dibuja rect redondeado relleno
        ctx.beginPath(); // iniciar path
        ctx.moveTo(x+r,y); // mover a esquina superior
        ctx.arcTo(x+w,y,x+w,y+h,r); // arco esquina derecha superior
        ctx.arcTo(x+w,y+h,x,y+h,r); // arco esquina derecha inferior
        ctx.arcTo(x,y+h,x,y,r); // arco esquina izquierda inferior
        ctx.arcTo(x,y,x+w,y,r); // arco esquina izquierda superior
        ctx.closePath(); // cerrar path
        ctx.fill(); // rellenar
    }
    function getPointerPos(evt){ // calcular posición relativa del pointer
        const r = canvas.getBoundingClientRect(); // bounding rect
        return { x: evt.clientX - r.left, y: evt.clientY - r.top }; // coordenadas CSS
    }
    function hitTest(x,y){ // detectar hit en menú
        if (menuState.isLoading) return null; // si cargando no hay hits
        for (const opt of menuState.rects.opts){ // revisar opciones
            if (x >= opt.x && x <= opt.x + opt.w && y >= opt.y && y <= opt.y + opt.h) return opt.id; // si cae dentro
        }
        const s = menuState.rects.start; // rect iniciar
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return 'start'; // dentro iniciar
        return null; // ningún hit
    }
    canvas.addEventListener('pointermove', e => { // mover mouse en canvas
        if (!menuState.enabled) return; // si menú deshabilitado
        const p = getPointerPos(e); // posición pointer
        const hit = hitTest(p.x, p.y); // probar hit
        if (hit !== menuState.hovered){ // si cambió hover
            menuState.hovered = hit; // actualizar
            render(); // redibujar
            canvas.style.cursor = hit ? 'pointer' : 'default'; // cambiar cursor
        }
    });
    canvas.addEventListener('pointerdown', e => { // pointerdown para menú
        if (!menuState.enabled) return; // si menú desactivado
        const p = getPointerPos(e); // obtener pos
        const hit = hitTest(p.x, p.y); // test hit
        if (!hit) return; // nada
        if (hit.startsWith('opt-')){ // si es opción
            menuState.selectedBlocks = parseInt(hit.split('-')[1]); // seleccionar cantidad
            render(); // redibujar
            return; // fin
        }
        if (hit === 'start'){ // si es iniciar
            menuState.enabled = false; // deshabilitar menú
            render(); // redibujar
            const detail = { blocks: menuState.selectedBlocks }; // detalles evento
            window.dispatchEvent(new CustomEvent('blocka:start', { detail })); // disparar evento
            console.info('blocka:start', detail); // log
        }
    });
    canvas.addEventListener('pointerleave', () => { // salir del canvas
        if (menuState.hovered){ menuState.hovered = null; render(); canvas.style.cursor = 'default'; } // limpiar hover
    });
    window.addEventListener('keydown', (e) => { // navegación por teclado en menú
        if (!menuState.enabled) return; // si menú inactivo
        if (e.key === 'ArrowLeft' || e.key === 'a'){ // izquierda
            menuState.selectedBlocks = menuState.selectedBlocks === 4 ? 8 : (menuState.selectedBlocks === 6 ? 4 : 6); // ciclar opciones
            render(); // redibujar
        }
        if (e.key === 'ArrowRight' || e.key === 'd'){ // derecha
            menuState.selectedBlocks = menuState.selectedBlocks === 4 ? 6 : (menuState.selectedBlocks === 6 ? 8 : 4); // ciclar
            render(); // redibujar
        }
        if (e.key === 'Enter'){ // enter inicia juego
            window.dispatchEvent(new CustomEvent('blocka:start', { detail: { blocks: menuState.selectedBlocks } })); // evento inicio
            menuState.enabled = false; // deshabilitar menú
            render(); // redibujar
        }
    });
    
    /* =====================
       Lógica del juego
       ===================== */
    const gameState = { // estado principal del juego
        phase: 'menu', // fase actual
        allImages: [], // imágenes precargadas
        level: 1, // nivel actual
        blocks: 4, // cantidad de piezas
        rows: 0, // filas
        cols: 0, // columnas
        pieces: [], // array de piezas
        image: null, // imagen seleccionada
        unfilteredOffCanvas: null, // canvas con imagen sin filtros
        moves: 0, // contador de movimientos
        showWinScreen: false, // bandera para mostrar pantalla de victoria
        startTime: null, // tiempo de inicio
        elapsed: 0, // tiempo transcurrido
        timeLeft: 0, // tiempo restante (si aplica)
        timerId: null, // id del intervalo del timer
        isPaused: false, // pausa
        hud: { height: 56, pauseRect: null, ayudaRect: null, helpUsed: false }, // HUD y rects
        selectionAnimation: { running: false, startTime: 0, duration: 3000, finalIndex: 0 } // anim selección imagen
    };

    const touchState = { // estado para gestos táctiles
        lastTap: 0, // timestamp último tap
        tapTimeout: null, // timeout para distinguir taps
        longPressTimeout: null, // timeout press largo
        longPressFired: false // si se disparó long press
    };

    function loadImage(src){ // cargar una imagen como Promise
        return new Promise((resolve,reject)=>{
            const img = new Image(); // crear imagen
            img.crossOrigin = 'anonymous'; // evitar bloqueos CORS en canvas
            img.onload = () => resolve(img); // resolver al cargar
            img.onerror = reject; // rechazar en error
            img.src = src; // asignar src
        });
    }

    function preloadAllImages() { // precargar todas las imágenes configuradas
        const imagePromises = GAME_CONFIG.images.map(src => loadImage(src)); // array de promesas
        Promise.all(imagePromises).then(loadedImages => { // cuando todas cargan
            gameState.allImages = loadedImages; // guardar imágenes
            menuState.isLoading = false; // marcar carga completa
            render(); // redibujar menú
            console.log('Todas las imágenes han sido precargadas.'); // log
        }).catch(err => { // si alguna falla
            console.error("Error precargando una o más imágenes:", err); // log error
            menuState.isLoading = false; // quitar estado de carga
            menuState.loadingError = "Error al cargar imágenes. Revisa las rutas."; // mensaje de error
            render(); // redibujar para mostrar error
        });
    }

    // --- FUNCIONES DE FILTROS CON IMAGEDATA ---
    function applyGrayscaleFilter(imageData) { // aplicar escala de grises
        const pixels = imageData.data; // array RGBA
        for (let i = 0; i < pixels.length; i += 4) { // recorrer píxeles
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]; // componentes
            const gray = 0.299 * r + 0.587 * g + 0.114 * b; // luminancia
            pixels[i] = pixels[i + 1] = pixels[i + 2] = gray; // asignar gris
        }
    }
    function applyBrightnessFilter(imageData) { // reducir brillo
        const pixels = imageData.data; // array RGBA
        const adjustment = 255 * 0.3; // cantidad a restar
        for (let i = 0; i < pixels.length; i += 4) { // recorrer píxeles
            pixels[i] = Math.max(0, Math.min(255, pixels[i] - adjustment)); // rojo ajustado
            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] - adjustment)); // verde ajustado
            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] - adjustment)); // azul ajustado
        }
    }
    function applyInvertFilter(imageData) { // invertir colores
        const pixels = imageData.data; // array RGBA
        for (let i = 0; i < pixels.length; i += 4) { // recorrer píxeles
            pixels[i] = 255 - pixels[i]; // invertir rojo
            pixels[i + 1] = 255 - pixels[i + 1]; // invertir verde
            pixels[i + 2] = 255 - pixels[i + 2]; // invertir azul
        }
    }
    
    // --- GESTIÓN DE RÉCORDS ---
    function getBestTime(level, blocks) { // obtener mejor tiempo desde localStorage
        const key = `blocka_best_time_${level}_${blocks}`; // clave
        return localStorage.getItem(key) ? parseInt(localStorage.getItem(key), 10) : null; // retornar o null
    }

    function saveBestTime(level, blocks, time) { // guardar mejor tiempo si es mejor
        const key = `blocka_best_time_${level}_${blocks}`; // clave
        const existingBest = getBestTime(level, blocks); // leer existente
        if (!existingBest || time < existingBest) { // si no existe o es mejor
            localStorage.setItem(key, time); // guardar
        }
    }

    function startGame(blocks, level = 1){ // iniciar partida con blocks y nivel
        menuState.enabled = false; // desactivar menú
        Object.assign(gameState, { // reiniciar partes del estado
            level, blocks, moves: 0, showWinScreen: false,
            elapsed: 0, timeLeft: 0, isPaused: false, pieces: [], image: null, unfilteredOffCanvas: null
        });
        gameState.hud.helpUsed = false; // reset ayuda
        
        // Iniciar la animación de selección
        gameState.phase = 'image-selection'; // cambiar fase
        gameState.selectionAnimation.running = true; // marcar animación
        gameState.selectionAnimation.startTime = Date.now(); // tiempo inicio anim
        gameState.selectionAnimation.finalIndex = Math.floor(Math.random() * gameState.allImages.length); // imagen elegida aleatoria
        
        requestAnimationFrame(render); // arrancar ciclo de render
    }

    function initializeLevel() { // preparar nivel tras selección de imagen
        const img = gameState.allImages[gameState.selectionAnimation.finalIndex]; // imagen seleccionada
        const square = Math.min(img.naturalWidth, img.naturalHeight); // usar lado menor para cuadrado
        const sx = (img.naturalWidth - square) / 2; // offset x del recorte
        const sy = (img.naturalHeight - square) / 2; // offset y del recorte

        const unfilteredCanvas = document.createElement('canvas'); // canvas offscreen
        unfilteredCanvas.width = square; // ancho
        unfilteredCanvas.height = square; // alto
        unfilteredCanvas.getContext('2d').drawImage(img, sx, sy, square, square, 0, 0, square, square); // dibujar recorte
        gameState.unfilteredOffCanvas = unfilteredCanvas; // guardar canvas sin filtros
        gameState.image = img; // guardar referencia imagen

        const cfg = GAME_CONFIG.blockConfigs[gameState.blocks]; // config según piezas
        gameState.rows = cfg.rows; // filas
        gameState.cols = cfg.cols; // columnas
        
        setupPieces(); // crear las piezas
        
        gameState.phase = 'playing'; // entrar a jugar
        startTimer(); // iniciar temporizador
        render(); // render inicial
    }

    function setupPieces(){ // cortar la imagen en piezas y aplicar filtros/rotación
        gameState.pieces = []; // limpiar piezas
        const levelConfig = GAME_CONFIG.levels[gameState.level]; // config nivel
        const pieceWidth = gameState.unfilteredOffCanvas.width / gameState.cols; // ancho pieza original
        const pieceHeight = gameState.unfilteredOffCanvas.height / gameState.rows; // alto pieza original

        for (let r = 0; r < gameState.rows; r++) { // filas
            for (let c = 0; c < gameState.cols; c++) { // columnas
                const pieceCanvas = document.createElement('canvas'); // canvas para la pieza
                pieceCanvas.width = pieceWidth; // ancho pieza canvas
                pieceCanvas.height = pieceHeight; // alto pieza canvas
                const pieceCtx = pieceCanvas.getContext('2d'); // contexto pieza

                pieceCtx.drawImage(
                    gameState.unfilteredOffCanvas,
                    c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight,
                    0, 0, pieceWidth, pieceHeight
                ); // copiar región

                if (levelConfig.filterTypes[0] !== 'none') { // si hay filtros en este nivel
                    const filterType = levelConfig.filterTypes[Math.floor(Math.random() * levelConfig.filterTypes.length)]; // elegir filtro aleatorio
                    const imageData = pieceCtx.getImageData(0, 0, pieceWidth, pieceHeight); // obtener ImageData
                    switch (filterType) { // aplicar filtro
                        case 'grayscale': applyGrayscaleFilter(imageData); break; // gris
                        case 'brightness': applyBrightnessFilter(imageData); break; // brillo
                        case 'invert': applyInvertFilter(imageData); break; // invert
                    }
                    pieceCtx.putImageData(imageData, 0, 0); // poner ImageData modificado
                }

                gameState.pieces.push({ // añadir pieza al array
                    r, c, // posición lógica
                    rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)], // rotación aleatoria
                    isFixed: false, // fija o no
                    pieceCanvas: pieceCanvas // canvas de la pieza
                });
            }
        }
        calculateGameLayout(); // recalcular layout del juego
    }

    function calculateGameLayout(){ // calcular posiciones y tamaño de la rejilla
        const cssW = canvas.width / dpr; // ancho CSS
        const cssH = canvas.height / dpr; // alto CSS
        const hudH = gameState.hud.height; // alto HUD
        const padding = 12; // padding general
        const areaW = cssW - padding*2; // área disponible ancho
        const areaH = cssH - hudH - padding*2; // área disponible alto
        const pieceSize = Math.floor(Math.min(areaW / gameState.cols, areaH / gameState.rows)); // tamaño cuadrado por pieza
        const gridW = pieceSize * gameState.cols; // ancho rejilla
        const gridH = pieceSize * gameState.rows; // alto rejilla
        const areaX = padding + Math.floor((areaW - gridW) / 2); // X de la rejilla centrada
        const areaY = hudH + padding + Math.floor((areaH - gridH) / 2); // Y de la rejilla centrada

        gameState.layout = { // guardar layout
            cssW, cssH,
            hudX: 12, hudY: 8, hudW: cssW-24, hudH,
            areaX: padding, areaY: hudH + padding, areaW, areaH,
            gridX: areaX, gridY: areaY, gridW, gridH,
            pieceSize // tamaño de pieza a dibujar
        };
    }
    
    function startTimer(){ // iniciar/actualizar temporizador
        const levelConfig = GAME_CONFIG.levels[gameState.level]; // config nivel
        const initialTime = levelConfig.maxTime ? 0 : gameState.elapsed; // decidir offset inicial
        gameState.startTime = Date.now() - initialTime; // marcar tiempo inicio
        
        if (gameState.timerId) clearInterval(gameState.timerId); // limpiar timer previo
        
        gameState.timerId = setInterval(() => { // crear intervalo
            if (!gameState.isPaused && gameState.phase === 'playing') { // si jugando y no pausado
                if (levelConfig.maxTime) { // si hay tiempo límite
                    const elapsed = Date.now() - gameState.startTime; // tiempo pasado
                    gameState.timeLeft = (levelConfig.maxTime * 1000) - elapsed; // tiempo restante
                    if (gameState.timeLeft <= 0) { // si se acabó
                        gameState.timeLeft = 0; // asegurar 0
                        gameState.phase = 'lost'; // marcar perdido
                        stopTimer(); // parar timer
                    }
                } else {
                    gameState.elapsed = Date.now() - gameState.startTime; // actualizar elapsed
                }
                render(); // redibujar HUD
            }
        }, 100); // actualizar cada 100ms
    }

    function stopTimer(){ if (gameState.timerId){ clearInterval(gameState.timerId); gameState.timerId = null; } } // detener timer
    function formatTime(ms){ const s = Math.floor(ms/1000); const m = Math.floor(s/60); const sec = s%60; return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`; } // formatear tiempo MM:SS
    
    function useHelp() { // ayuda que fija una pieza correcta
        if (gameState.hud.helpUsed || gameState.phase !== 'playing') return; // no permitir si ya usada o no jugando
        
        const incorrectPiece = gameState.pieces.find(p => p.rotation % 360 !== 0 && !p.isFixed); // buscar pieza incorrecta
        
        if (incorrectPiece) { // si existe
            incorrectPiece.rotation = 0; // rotarla correcta
            incorrectPiece.isFixed = true; // marcar fija
            gameState.hud.helpUsed = true; // marcar uso
            gameState.moves = (gameState.moves || 0) + 1; // contar movimiento
            
            const penalty = 5000; // penalidad ms
            gameState.startTime -= penalty; // aplicar penalidad al tiempo
            
            const won = gameState.pieces.every(p => (p.rotation % 360) === 0); // chequear victoria
            if (won) {
                triggerWinSequence(); // disparar secuencia de victoria
            } else {
                render(); // redibujar
            }
        }
    }

    function renderGame(){ // dibujar escena de juego
        clear(); // limpiar canvas
        const w = canvas.width / dpr; // ancho CSS
        const h = canvas.height / dpr; // alto CSS
        ctx.fillStyle = '#08111a'; ctx.fillRect(0,0,w,h); // fondo oscuro
        if (!gameState.image || !gameState.layout) { // si aún no hay imagen/layout
            ctx.fillStyle = '#fff'; ctx.font = '600 18px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('Cargando...', w/2, h/2); // texto carga
            return; // salir
        }
        
        const hud = gameState.layout; // atajo al layout
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRectFill(ctx, hud.hudX, hud.hudY, hud.hudW, hud.hudH, 8); // dibujar HUD
        ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; // estilos HUD
        
        const levelConfig = GAME_CONFIG.levels[gameState.level]; // config nivel
        ctx.fillText(`Nivel: ${gameState.level} (${gameState.blocks} piezas)`, hud.hudX + 16, hud.hudY + hud.hudH/2); // texto nivel
        
        let timeToDisplay = levelConfig.maxTime ? formatTime(gameState.timeLeft) : formatTime(gameState.elapsed); // formatear tiempo
        ctx.textAlign = 'center'; ctx.fillText(timeToDisplay, hud.hudX + hud.hudW/2, hud.hudY + hud.hudH/2); // dibujar tiempo
        
        const movesX = hud.hudX + hud.hudW/2 + 80; // posición movimientos
        ctx.textAlign = 'left';
        ctx.fillText('Mov: ' + (gameState.moves || 0), movesX, hud.hudY + hud.hudH/2); // dibujar movimientos

        const pauseW = 80, pauseH = 32; // tamaño botón pausa
        const px = hud.hudX + hud.hudW - pauseW - 12; // x pausa
        const py = hud.hudY + (hud.hudH - pauseH)/2; // y pausa
        ctx.fillStyle = gameState.isPaused ? 'rgba(255,100,100,0.9)' : styles.buttonBg; // color según estado
        roundRectFill(ctx, px, py, pauseW, pauseH, 8); // dibujar botón
        ctx.fillStyle = '#06202a'; ctx.textAlign='center'; ctx.fillText(gameState.isPaused ? 'Reanudar' : 'Pausa', px + pauseW/2, py + pauseH/2 + 1); // texto botón
        gameState.hud.pauseRect = { x: px, y: py, w: pauseW, h: pauseH }; // guardar rect pausa

        if (!gameState.hud.helpUsed && gameState.phase === 'playing') { // si ayuda disponible
            const ayudaW = 80, ayudaH = 32; // tamaño ayuda
            const ax = px - ayudaW - 12; // x ayuda
            const ay = py; // y ayuda
            ctx.fillStyle = 'rgba(100, 181, 246, 0.8)'; // color ayuda
            roundRectFill(ctx, ax, ay, ayudaW, ayudaH, 8); // dibujar
            ctx.fillStyle = '#06202a'; ctx.textAlign='center'; ctx.fillText('Ayudita', ax + ayudaW/2, ay + ayudaH/2 + 1); // texto
            gameState.hud.ayudaRect = { x: ax, y: ay, w: ayudaW, h: ayudaH }; // guardar rect ayuda
        } else {
            gameState.hud.ayudaRect = null; // no hay ayuda
        }

        const area = gameState.layout; // área de juego
        const sW = gameState.unfilteredOffCanvas.width / gameState.cols; // ancho pieza original en offcanvas
        const sH = gameState.unfilteredOffCanvas.height / gameState.rows; // alto pieza original
        const ps = area.pieceSize; // tamaño a dibujar por pieza

        for (const p of gameState.pieces) { // dibujar cada pieza
            const dx = area.gridX + p.c * ps; // posición destino X
            const dy = area.gridY + p.r * ps; // posición destino Y
            const dw = ps, dh = ps; // dimensiones dibujadas
            
            ctx.save(); // guardar contexto
            ctx.translate(dx + dw/2, dy + dh/2); // trasladar al centro de la pieza
            ctx.rotate((p.rotation * Math.PI) / 180); // rotar según rotación

            if (gameState.phase === 'win') { // si se ganó, mostrar imagen original
                const sx = p.c * sW, sy = p.r * sH; // origen en offcanvas
                ctx.drawImage(gameState.unfilteredOffCanvas, sx, sy, sW, sH, -dw/2, -dh/2, dw, dh); // dibujar porción original
            } else {
                ctx.drawImage(p.pieceCanvas, -dw/2, -dh/2, dw, dh); // dibujar pieza con filtro
            }
            
            if (p.isFixed) { // si pieza está fija, dibujar marco
                ctx.globalAlpha = 0.6; // transparencia
                ctx.strokeStyle = '#4caf50'; // color marco
                ctx.lineWidth = 4; // grosor
                ctx.strokeRect(-dw/2, -dh/2, dw, dh); // dibujar rect
                ctx.globalAlpha = 1.0; // restaurar alpha
            }
            ctx.restore(); // restaurar contexto
        }
        

        if (gameState.isPaused){ // si juego pausado
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; // overlay oscuro
            ctx.fillRect(0,0,w,h); // dibujar overlay

            // Dibujar el botón "Reanudar" encima con opacidad normal
            if (gameState.hud && gameState.hud.pauseRect) {
                const pr = gameState.hud.pauseRect; // rect pausa
                ctx.save(); // guardar
                ctx.fillStyle = styles.buttonBg; // color botón
                roundRectFill(ctx, pr.x, pr.y, pr.w, pr.h, 8); // dibujar botón
                ctx.fillStyle = '#06202a';
                ctx.font = '600 13px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Reanudar', pr.x + pr.w/2, pr.y + pr.h/2 + 1); // texto reanudar
                ctx.restore(); // restaurar
            }

            // Texto de pausa
            ctx.fillStyle = '#fff';
            ctx.font = '600 22px Inter, sans-serif';
            ctx.textAlign='center';
            ctx.fillText('PAUSADO', w/2, h/2); // dibujar texto PAUSADO
        }

        if ((gameState.phase === 'win' && gameState.showWinScreen) || gameState.phase === 'lost') { // pantalla final
            ctx.fillStyle = gameState.phase === 'lost' ? 'rgba(40,0,0,0.66)' : 'rgba(0,0,0,0.66)'; // overlay según estado
            ctx.fillRect(0,0,w,h); // dibujar overlay
            const boxW = Math.min(520, w - 80), boxH = 280, bx = (w - boxW)/2, by = (h - boxH)/2; // caja central
            ctx.fillStyle = gameState.phase === 'lost' ? 'rgba(255,80,80,0.08)' : 'rgba(255,255,255,0.06)'; // color caja
            roundRectFill(ctx, bx, by, boxW, boxH, 14); // dibujar caja
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
            
            if (gameState.phase === 'lost') { // mensaje perdido
                ctx.font = '700 28px Inter, sans-serif';
                ctx.fillText('¡Tiempo Agotado!', w/2, by + 60); // título perdido
                ctx.font = '600 16px Inter, sans-serif';
                ctx.fillText('No has completado el nivel a tiempo.', w/2, by + 100); // subtítulo
            } else {
                const hasNextLevel = !!GAME_CONFIG.levels[gameState.level + 1]; // existencia de siguiente nivel
                ctx.font = '700 28px Inter, sans-serif';
                ctx.fillText(hasNextLevel ? `¡Nivel ${gameState.level} Completado!` : '¡Has Ganado!', w/2, by + 56); // título victoria
                
                const finalTime = levelConfig.maxTime ? (levelConfig.maxTime * 1000 - gameState.timeLeft) : gameState.elapsed; // calcular tiempo final
                const bestTime = getBestTime(gameState.level, gameState.blocks); // mejor tiempo guardado
                
                ctx.font = '600 16px Inter, sans-serif';
                ctx.fillText(`Tiempo: ${formatTime(finalTime)} · Movimientos: ${gameState.moves||0}`, w/2, by + 96); // mostrar tiempo y movimientos
                ctx.font = '14px Inter, sans-serif';
                ctx.fillStyle = '#aab7d6';
                ctx.fillText(`Mejor tiempo: ${bestTime ? formatTime(bestTime) : 'N/A'}`, w/2, by + 126); // mostrar mejor tiempo
            }

            const btnW = 160, btnH = 44, gap = 24; // botones finales
            const bx1 = w/2 - btnW - gap/2; // x botón reintentar
            const bx2 = w/2 + gap/2; // x botón siguiente/menú
            const byBtn = by + boxH - 82; // y botones

            ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRectFill(ctx, bx1, byBtn, btnW, btnH, 10); // dibujar reintentar
            ctx.fillStyle = '#fff'; ctx.font = '600 16px Inter, sans-serif'; ctx.fillText('Reintentar', bx1 + btnW/2, byBtn + btnH/2 + 1); // texto reintentar

            ctx.fillStyle = styles.buttonBg; roundRectFill(ctx, bx2, byBtn, btnW, btnH, 10); // dibujar botón principal
            ctx.fillStyle = '#06202a';
            const nextText = gameState.phase === 'lost' ? 'Volver al Menú' : (!!GAME_CONFIG.levels[gameState.level + 1] ? 'Siguiente Nivel' : 'Volver al Menú'); // texto botón
            ctx.fillText(nextText, bx2 + btnW/2, byBtn + btnH/2 + 1); // dibujar texto

            gameState.hud.winRect = { x: bx, y: by, w: boxW, h: boxH }; // guardar rect caja
            gameState.hud.winBtns = { // guardar rects botones
                retry: { id: 'retry', x: bx1, y: byBtn, w: btnW, h: btnH },
                next: { id: gameState.phase === 'lost' ? 'menu' : (!!GAME_CONFIG.levels[gameState.level + 1] ? 'next' : 'menu'), x: bx2, y: byBtn, w: btnW, h: btnH }
            };
        } else {
            gameState.hud.winRect = null; gameState.hud.winBtns = null; // limpiar rects finales
        }
    }

    function renderImageSelection() { // animación y selección de imagen
        const anim = gameState.selectionAnimation; // atajo anim
        const now = Date.now(); // tiempo actual
        const elapsed = now - anim.startTime; // tiempo transcurrido anim
        const progress = Math.min(elapsed / anim.duration, 1); // progreso 0..1

        // Función de easing (desaceleración cúbica)
        const easeOut = t => 1 - Math.pow(1 - t, 3); // easing
        const easedProgress = easeOut(progress); // progreso suavizado

        clear(); // limpiar canvas
        const w = canvas.width / dpr; // ancho CSS
        const h = canvas.height / dpr; // alto CSS
        ctx.fillStyle = styles.bg; // fondo
        ctx.fillRect(0, 0, w, h); // dibujar fondo

        const thumbHeight = 100; // altura miniatura
        const thumbWidth = thumbHeight * 1.6; // ancho miniatura
        const thumbGap = 20; // separación
        const totalStripHeight = gameState.allImages.length * (thumbHeight + thumbGap); // altura total tira
        
        // Duplicamos las imágenes para un bucle infinito
        const extendedImages = [...gameState.allImages, ...gameState.allImages]; // duplicado

        const finalY = -(totalStripHeight + anim.finalIndex * (thumbHeight + thumbGap)); // posición final
        const currentY = finalY * easedProgress; // posición actual basada en progreso

        ctx.save(); // guardar contexto
        ctx.translate(w / 2 - thumbWidth / 2, h / 2 - thumbHeight / 2); // mover origen al centro del marco

        for (let i = 0; i < extendedImages.length; i++) { // dibujar miniaturas visibles
            const yPos = i * (thumbHeight + thumbGap) + (currentY % totalStripHeight); // calcular y
            if (yPos > -h/2 && yPos < h/2 + thumbHeight) { // condición de visibilidad
                ctx.drawImage(extendedImages[i], 0, yPos, thumbWidth, thumbHeight); // dibujar miniatura
            }
        }
        
        ctx.restore(); // restaurar contexto

        // Dibujar un marco de selección (esta parte ya era correcta)
        ctx.strokeStyle = styles.buttonBg; // color marco
        ctx.lineWidth = 4; // grosor marco
        ctx.strokeRect(w / 2 - thumbWidth / 2, h / 2 - thumbHeight / 2, thumbWidth, thumbHeight); // dibujar marco
        
        ctx.fillStyle = 'rgba(15, 18, 32, 0.7)'; // sombreado superior/inferior
        ctx.fillRect(0, 0, w, h / 2 - thumbHeight / 2); // cubrir arriba
        ctx.fillRect(0, h / 2 + thumbHeight / 2, w, h / 2 - thumbHeight / 2); // cubrir abajo

        if (progress >= 1) { // si anim terminó
            anim.running = false; // marcar no running
            setTimeout(initializeLevel, 400); // pequeña pausa y crear nivel
        } else {
            requestAnimationFrame(render); // continuar animación
        }
    }

    function render(){ // función única de render según fase
        switch(gameState.phase) {
            case 'menu':
                renderMenuOriginal(); // dibujar menú
                break;
            case 'image-selection':
                renderImageSelection(); // anim selección
                break;
            case 'playing':
            case 'win':
            case 'lost':
                renderGame(); // dibujar juego
                break;
        }
    }

    // AÑADIR ESTA NUEVA FUNCIÓN
    function triggerWinSequence() { // secuencia al ganar
        stopTimer(); // detener timer
        const levelConfig = GAME_CONFIG.levels[gameState.level]; // config nivel
        const finalTime = levelConfig.maxTime ? (levelConfig.maxTime * 1000 - gameState.timeLeft) : gameState.elapsed; // calcular tiempo final
        saveBestTime(gameState.level, gameState.blocks, finalTime); // guardar mejor tiempo si aplica
        gameState.phase = 'win'; // marcar fase win
        render(); // renderizar imagen sin filtros inmediatamente
        setTimeout(() => {
            gameState.showWinScreen = true; // mostrar pantalla de estadísticas tras delay
            render(); // redibujar
        }, 1500); // 1.5s
    }

    function processPieceInteraction(col, row, isRightClick){ // manejar interacción en una pieza
        const idx = row * gameState.cols + col; // índice en array piezas
        const piece = gameState.pieces[idx]; // obtener pieza
        if (!piece || piece.isFixed) return false; // si no existe o ya fija, no hacer nada
        
        if (isRightClick){ piece.rotation = (piece.rotation + 90) % 360; } // rotar derecha
        else { piece.rotation = (piece.rotation + 270) % 360; } // rotar izquierda (equivalente -90)
        gameState.moves = (gameState.moves || 0) + 1; // incrementar movimientos
        
        const won = gameState.pieces.every(p => (p.rotation % 360) === 0); // comprobar si todas están correctas
        if (won){
            triggerWinSequence(); // disparar victoria
            return true; // interacción procesada
        }
        render(); // redibujar
        return true; // interacción procesada
    }

    function handleGamePointerDown(p, button){ // handler general de pointerdown en modo juego
        if (gameState.phase === 'image-selection') return; // ignorar durante selección

        const pr = gameState.hud.pauseRect; // rect pausa
        if (pr && p.x >= pr.x && p.x <= pr.x+pr.w && p.y >= pr.y && p.y <= pr.y+pr.h){ // click en pausa
            gameState.isPaused = !gameState.isPaused; // togglear pausa
            if (!gameState.isPaused) { startTimer(); } else { stopTimer(); } // iniciar o parar timer
            render(); // redibujar
            return; // terminar
        }

        const ar = gameState.hud.ayudaRect; // rect ayuda
        if (ar && !gameState.hud.helpUsed && p.x >= ar.x && p.x <= ar.x + ar.w && p.y >= ar.y && p.y <= ar.y + ar.h) { // click en ayuda
            useHelp(); // usar ayuda
            return; // terminar
        }

        if (gameState.isPaused) return; // no interactuar si pausado

        if ((gameState.phase === 'win' || gameState.phase === 'lost') && gameState.hud && gameState.hud.winBtns){ // botones de fin
            const btns = gameState.hud.winBtns; // atajo botones
            if (p.x >= btns.retry.x && p.x <= btns.retry.x + btns.retry.w && p.y >= btns.retry.y && p.y <= btns.retry.y + btns.retry.h){
                startGame(gameState.blocks, gameState.level); // reintentar mismo nivel
                return; // terminar
            }
            if (p.x >= btns.next.x && p.x <= btns.next.x + btns.next.w && p.y >= btns.next.y && p.y <= btns.next.y + btns.next.h){
                if (btns.next.id === 'next') {
                    startGame(gameState.blocks, gameState.level + 1); // iniciar siguiente nivel
                } else {
                    gameState.phase = 'menu'; // volver al menú
                    menuState.enabled = true; // habilitar menú
                    render(); // redibujar
                }
                return; // terminar
            }
            return; // no hacer más
        }

        const area = gameState.layout; // layout de juego
        if (!area || gameState.phase !== 'playing') return; // no válido para interacción
        const localX = p.x - area.gridX; // coordenada local X en la rejilla
        const localY = p.y - area.gridY; // coordenada local Y en la rejilla
        if (localX < 0 || localY < 0) return; // fuera de la rejilla
        const col = Math.floor(localX / area.pieceSize); // columna tocada
        const row = Math.floor(localY / area.pieceSize); // fila tocada
        if (col < 0 || col >= gameState.cols || row < 0 || row >= gameState.rows) return; // fuera de rango
        processPieceInteraction(col, row, button === 2); // procesar interacción con pieza
    }

    canvas.addEventListener('pointerdown', e => { // pointerdown para mouse (no touch)
        if (e.pointerType === 'touch' || e.pointerType === 'pen') return; // ignorar touch aquí
        if (gameState.phase === 'menu' && !menuState.enabled) return; // ignorar si menú inactivo
        const p = getPointerPos(e); // obtener pos
        handleGamePointerDown(p, e.button); // delegar al handler
    });
    canvas.addEventListener('pointerup', e => { // pointerup para touch/pen y mouse
        if (e.pointerType === 'touch' || e.pointerType === 'pen'){
            if (gameState.isPaused || touchState.longPressFired) { // si pausado o long press ya disparado
                if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; } // limpiar timeout
                touchState.longPressFired = false; // reset bandera
                return; // no procesar tap
            }
            const now = Date.now(); // tiempo actual
            const dt = now - (touchState.lastTap || 0); // diff desde último tap
            const p = getPointerPos(e); // posición
            if (dt < 300){ // doble tap detectado
                clearTimeout(touchState.tapTimeout); // limpiar timeout single tap
                touchState.lastTap = 0; // reset lastTap
                handleGamePointerDown(p, 2); // tratar como clic derecho (rotar derecha)
            } else {
                touchState.lastTap = now; // marcar último tap
                touchState.tapTimeout = setTimeout(()=>{ // timeout para single tap
                    if (!touchState.longPressFired) handleGamePointerDown(p, 0); // si no hubo long press, rotar izquierda
                    touchState.lastTap = 0; // reset
                }, 260);
            }
        }
        if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; } // limpiar long press timeout
        touchState.longPressFired = false; // reset bandera
    });
    canvas.addEventListener('pointercancel', e => { // cancelar pointer (touch abort)
        if (touchState.tapTimeout){ clearTimeout(touchState.tapTimeout); touchState.tapTimeout = null; } // limpiar timeouts
        if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; }
        touchState.longPressFired = false; // reset bandera
    });
    canvas.addEventListener('pointerdown', e => { // pointerdown para touch/pen long press
        if (e.pointerType === 'touch' || e.pointerType === 'pen'){
            const p = getPointerPos(e); // posición
            if (touchState.longPressTimeout) clearTimeout(touchState.longPressTimeout); // limpiar si existía
            touchState.longPressFired = false; // reset bandera
            touchState.longPressTimeout = setTimeout(()=>{ // programar long press
                touchState.longPressFired = true; // marcar long press ejecutado
                handleGamePointerDown(p, 2); // tratar como clic derecho (rotar derecha)
            }, 600); // 600ms para considerar long press
        }
    });

    canvas.addEventListener('contextmenu', e => { if (gameState.active || gameState.win || gameState.lost) e.preventDefault(); }); // bloquear menú contextual si está el juego

    window.addEventListener('blocka:start', (ev) => { // escuchar evento inicio juego
        const blocks = ev.detail && ev.detail.blocks ? ev.detail.blocks : menuState.selectedBlocks; // extraer blocks
        startGame(blocks, 1); // iniciar juego en nivel 1
    });

    // AÑADIR ESTA FUNCIÓN
    function init() { // inicializar módulo
        fitCanvas(); // ajustar canvas
        preloadAllImages(); // iniciar precarga de imágenes
        const r = canvas.getBoundingClientRect(); // rect canvas
        if (r.height < 120){ // si muy pequeño en UI
            canvas.style.height = '450px'; // forzar altura
            fitCanvas(); // reajustar
        }
    }

    new ResizeObserver(fitCanvas).observe(canvas); // observar cambios de tamaño
    init(); // llamar init

})(); // fin IIFE

