export default class PegView {
    constructor(canvas, uiSelectors = {}){
        this.canvas = canvas;
    // Estilos defensivos del canvas para evitar causar overflow en la página
        if (this.canvas && this.canvas.style){
            this.canvas.style.display = 'block';
            this.canvas.style.width = '100%';
            this.canvas.style.maxWidth = '100%';
            this.canvas.style.boxSizing = 'border-box';
        }
        this.ctx = canvas.getContext('2d');
    // fondo: imagen (se carga una vez y se vuelve a renderizar cuando carga)
    this._bgImage = new Image();
    this._bgImage.src = '../TP2/assets/img/background_simpson.jpg';
    this._bgImage.onload = () => { if (this._renderOnUpdate) this._renderOnUpdate(); };
    this.ui = uiSelectors; // { pegsLeftEl, moveCountEl, timerEl, messageEl } elementos DOM opcionales
        this.rows = 7; this.cols = 7;
        this.cellSize = 64; // tamaño por defecto, se ajustará en resize
        this.padding = 12;
    this._originX = this.padding;
    this._originY = this.padding;
        this._highlightedCells = [];
        this._dragging = false;
        this._dragOrigin = null; // {row,col}
    this._dragPos = null; // {x,y} en pixels locales (CSS)
        this._dragPointerId = null;
        this._dragPointerOffset = {x:0,y:0};
        this._hudRegions = {
            reset: null,
            undo: null,
            hint: null
        };
        this._onResetCallback = null;
        this._onUndoCallback = null;
        this._onHintCallback = null;
    // estado de animación de flechas
        this._arrowSource = null;
        this._arrowTargets = null;
        this._arrowAnimating = false;
        this._animStart = 0;
        this._rafId = null;
    this._animDuration = 900; // ms por ciclo

        this.canvas.addEventListener('click', (e)=> this._onClick(e));
        this.canvas.addEventListener('pointerdown', (e)=> this._onPointerDownEvent(e));
        this.canvas.addEventListener('pointermove', (e)=> this._onPointerMoveEvent(e));
        this.canvas.addEventListener('pointerup', (e)=> this._onPointerUpEvent(e));
        this.canvas.addEventListener('pointercancel', (e)=> this._onPointerCancelEvent(e));
        window.addEventListener('resize', ()=> this._onResize());
        this._onResize();

        
        this._ensureControlsInsideBoard();
    }

    _ensureControlsInsideBoard(){

        let boardContainer = this.canvas.closest('#game-area') || this.canvas.parentElement;
        if (!boardContainer) boardContainer = document.body;

        document.querySelectorAll('.game-controls').forEach(el => { if (!boardContainer.contains(el)) el.remove(); });

        const existing = boardContainer.querySelector('.game-controls');
        if (existing){
            this.ui.pegsLeftEl = document.getElementById('pegsLeft') || existing.querySelector('#pegsLeft');
            this.ui.moveCountEl = document.getElementById('moveCount') || existing.querySelector('#moveCount');
            this.ui.timerEl = document.getElementById('timer') || existing.querySelector('#timer');
            this.ui.messageEl = document.getElementById('gameMessage') || existing.querySelector('#gameMessage');
            this.ui.resetBtn = document.getElementById('resetBtn') || existing.querySelector('#resetBtn');
            this.ui.undoBtn = document.getElementById('undoBtn') || existing.querySelector('#undoBtn');
            this.ui.hintBtn = document.getElementById('hintBtn') || existing.querySelector('#hintBtn');
            return;
        }

    }

    _onResize(){
        const rect = this.canvas.getBoundingClientRect();
        // calcular cellSize en función del ancho disponible
        const avail = Math.min(rect.width, rect.height) - this.padding*2;
        this.cellSize = Math.floor(avail / Math.max(this.rows, this.cols));
        this.canvas.width = rect.width * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * (window.devicePixelRatio || 1);
        this.ctx.setTransform(window.devicePixelRatio || 1,0,0,window.devicePixelRatio || 1,0,0);

        const totalGridW = this.cellSize * this.cols;
        const totalGridH = this.cellSize * this.rows;
        this._originX = Math.max(this.padding, Math.floor((rect.width - totalGridW) / 2));
        this._originY = Math.max(this.padding, Math.floor((rect.height - totalGridH) / 2));
    }

    onClick(handler){ this._clickHandler = handler; }


    onPointerDown(handler){ this._pointerDownHandler = handler; }
    onPointerMove(handler){ this._pointerMoveHandler = handler; }
    onPointerUp(handler){ this._pointerUpHandler = handler; }


    onReset(handler){ this._onResetCallback = handler; }
    onUndo(handler){ this._onUndoCallback = handler; }
    onHint(handler){ this._onHintCallback = handler; }

    _onPointerDownEvent(e){

        // calcular posición del evento y evitar iniciar drag si está fuera del área del tablero
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // si clickea sobre el HUD, delegar al manejador de botones y no iniciar drag
        if (this._hitHudButton(x,y)) return;

        const {row,col,localX,localY} = this._getCellFromEvent(e);
        // si está fuera de los límites de la cuadrícula no iniciamos arrastre
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

        // Preguntar al manejador (controlador) si está permitido iniciar arrastre
        // El controlador debe devolver true si hay una ficha para arrastrar.
        if (this._pointerDownHandler){
            try{
                const allow = this._pointerDownHandler(row,col,e);
                if (!allow) return; // no iniciar arrastre si el controlador lo prohíbe
            } catch(err){
                // si el handler lanza, abortar iniciar drag
                return;
            }
        }

        try{ this.canvas.setPointerCapture(e.pointerId); } catch(err){}
        this._dragging = true;
        this._dragOrigin = {row,col};

        const centerX = col * this.cellSize + this.cellSize/2;
        const centerY = row * this.cellSize + this.cellSize/2;
        this._dragPos = {x: centerX, y: centerY};
       
        this._dragPointerOffset = { x: localX - centerX, y: localY - centerY };
        this._dragPointerId = e.pointerId;
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    _onPointerMoveEvent(e){
        if (!this._dragging || e.pointerId !== this._dragPointerId) return;
        const {localX, localY, row, col} = this._getCellFromEvent(e);
      
        this._dragPos = { x: localX - this._dragPointerOffset.x, y: localY - this._dragPointerOffset.y };
        if (this._pointerMoveHandler) this._pointerMoveHandler(row,col,e);
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    _onPointerUpEvent(e){
        if (this._dragging){
            try{ this.canvas.releasePointerCapture(e.pointerId); } catch(err){}
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this._hitHudButton(x,y)){
                this._dragging = false;
                this._dragOrigin = null;
                this._dragPos = null;
                this._dragPointerId = null;
                if (this._renderOnUpdate) this._renderOnUpdate();
                return;
            }
            const {row,col} = this._getCellFromEvent(e);
            if (this._pointerUpHandler) this._pointerUpHandler(row,col,e);
            this._dragging = false;
            this._dragOrigin = null;
            this._dragPos = null;
            this._dragPointerId = null;
            if (this._renderOnUpdate) this._renderOnUpdate();
        }
    }

    _onPointerCancelEvent(e){
 
        if (this._dragging && e.pointerId === this._dragPointerId){
            try{ this.canvas.releasePointerCapture(e.pointerId); } catch(err){}
            this._dragging = false;
            this._dragOrigin = null;
            this._dragPos = null;
            this._dragPointerId = null;
            if (this._renderOnUpdate) this._renderOnUpdate();
        }
    }

    _onClick(e){
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this._hitHudButton(x,y)) return;

        if (!this._clickHandler) return;
        const localX = x - this._originX;
        const localY = y - this._originY;
        const col = Math.floor(localX / this.cellSize);
        const row = Math.floor(localY / this.cellSize);
        this._clickHandler(row, col);
    }

    _getCellFromEvent(e){
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left - this._originX;
        const y = e.clientY - r.top - this._originY;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return { row, col, localX: x, localY: y };
    }

    render(model){
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;
        ctx.clearRect(0,0,w,h);
        // dibujar imagen de fondo si está cargada, si no usar color de fallback
        if (this._bgImage && this._bgImage.complete && this._bgImage.naturalWidth){
            try{
                ctx.drawImage(this._bgImage, 0, 0, w, h);
            } catch(err){
                ctx.fillStyle = '#0b1720';
                ctx.fillRect(0,0,w,h);
            }
        } else {
            ctx.fillStyle = '#0b1720';
            ctx.fillRect(0,0,w,h);
        }


    const originX = this._originX;
    const originY = this._originY;

        // Dibujar un panel detrás del tablero para separarlo del fondo y hacerlo más nítido
        try{
            const panelPad = Math.max(6, Math.floor(this.cellSize * 0.12));
            const totalGridW = this.cellSize * this.cols;
            const totalGridH = this.cellSize * this.rows;
            const panelX = originX - panelPad;
            const panelY = originY - panelPad;
            const panelW = totalGridW + panelPad*2;
            const panelH = totalGridH + panelPad*2;
            const radius = Math.max(12, Math.floor(this.cellSize * 0.12));

            ctx.save();
            // rounded rect path for center panel
            ctx.beginPath();
            ctx.moveTo(panelX + radius, panelY);
            ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelH, radius);
            ctx.arcTo(panelX + panelW, panelY + panelH, panelX, panelY + panelH, radius);
            ctx.arcTo(panelX, panelY + panelH, panelX, panelY, radius);
            ctx.arcTo(panelX, panelY, panelX + panelW, panelY, radius);
            ctx.closePath();
            // fill panel (slightly darker / semi-opaque to contrast with background)
            ctx.fillStyle = 'rgba(6,10,14,0.82)';
            ctx.fill();
            // subtle border
            ctx.lineWidth = Math.max(1, Math.floor(this.cellSize * 0.015));
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.stroke();
            ctx.restore();

            // side panels (left and right) anchored to the canvas extremes
            // We'll make them full-height bars at the edges so the board contrasts
            // aumentar el ancho para dar más espacio a botones y estadísticas
            const sideW = Math.max(180, Math.floor(this.cellSize * 2.4));
            // anchor flush to edges (left at x=0, right at x = canvasWidth - sideW)
            const leftX = 0;
            const rightX = Math.max(0, Math.floor(w - sideW));
            const sideY = 0; // full canvas height
            const sideH = h;

            // store for HUD drawing
            this._sidePanelLeft = { x: leftX, y: sideY, w: sideW, h: sideH };
            this._sidePanelRight = { x: rightX, y: sideY, w: sideW, h: sideH };

            // draw left panel (solid background)
            ctx.save();
            ctx.beginPath();
            ctx.rect(leftX, sideY, sideW, sideH);
            ctx.fillStyle = '#060a0e'; // sólido para contraste con fondo
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.stroke();
            ctx.restore();

            // draw right panel (solid background)
            ctx.save();
            ctx.beginPath();
            ctx.rect(rightX, sideY, sideW, sideH);
            ctx.fillStyle = '#060a0e'; // sólido para contraste con fondo
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.stroke();
            ctx.restore();

        } catch(err){ /* ignore drawing panel if anything fails */ }


        let _selectedPos = null;
        for (let r=0;r<this.rows;r++){
            for (let c=0;c<this.cols;c++){
                const x = originX + c*this.cellSize;
                const y = originY + r*this.cellSize;

                ctx.fillStyle = model.isValidPosition(r,c) ? 'rgba(255,255,255,0.03)' : 'transparent';
                ctx.fillRect(x+2,y+2,this.cellSize-4,this.cellSize-4);
                const isDragSource = this._dragging && this._dragOrigin && this._dragOrigin.row === r && this._dragOrigin.col === c;
                const isSelectedSource = this._arrowSource && this._arrowSource.r === r && this._arrowSource.c === c;

                // Dibujamos la ficha. Si es la fuente del arrastre la ocultamos (la dibujamos al final),
                // pero mostramos un 'ghost' en su lugar cuando está seleccionada o en arrastre.
                if (model.board[r][c] === 1){
                    if (isDragSource){
                        // si estamos arrastrando, no dibujar la ficha fija en la celda origen (seguirá al pointer)
                        if (!this._dragging){
                            // si no estamos activamente arrastrando (solo seleccionada), mostrarla elevada
                            _selectedPos = { r, c };
                        }
                    } else if (isSelectedSource){
                        // guardar la posición para dibujar la ficha seleccionada al final (sobre otras)
                        _selectedPos = { r, c };
                    } else {
                        ctx.beginPath();
                        ctx.fillStyle = '#FFD54F';
                        ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.32, 0, Math.PI*2);
                        ctx.fill();
                    }
                } else if (model.board[r][c] === 0 && model.isValidPosition(r,c)){
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                    ctx.lineWidth = 2;
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.12, 0, Math.PI*2);
                    ctx.stroke();
                }
                if (this._highlightedCells.some(hc => hc.r === r && hc.c === c)){
                    ctx.fillStyle = 'rgba(100, 181, 246, 0.22)';
                    ctx.fillRect(x+2,y+2,this.cellSize-4,this.cellSize-4);
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(2,35,45,0.9)';
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.08, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }

        // aplicar un sombreado suave (vignette) alrededor del tablero para que destaque sobre el fondo
        try{
            const totalGridW = this.cellSize * this.cols;
            const totalGridH = this.cellSize * this.rows;
            const boardCx = originX + totalGridW * 0.5;
            const boardCy = originY + totalGridH * 0.5;
            const outerR = Math.max(w, h) * 0.9;
            const innerR = Math.min(totalGridW, totalGridH) * 0.45;
            const vignette = ctx.createRadialGradient(boardCx, boardCy, innerR, boardCx, boardCy, outerR);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(0.6, 'rgba(0,0,0,0.12)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0,0,w,h);
        } catch(err){ /* ignore if gradient fails */ }

        // draw arrow animations (if any)
        if (this._arrowAnimating && this._arrowSource && Array.isArray(this._arrowTargets) && this._arrowTargets.length){
            this._drawArrows(ctx, originX, originY, model);
        }

        // Si hay una ficha seleccionada, dibujarla ahora por encima de las demás
        if (_selectedPos){
            // si la ficha seleccionada corresponde al origen del arrastre activo, no la dibujamos aquí
            const isActiveDragOrigin = this._dragging && this._dragOrigin && this._dragOrigin.row === _selectedPos.r && this._dragOrigin.col === _selectedPos.c;
            if (!isActiveDragOrigin){
                const sx = originX + _selectedPos.c * this.cellSize + this.cellSize/2;
                const sy = originY + _selectedPos.r * this.cellSize + this.cellSize/2;
                this._drawSelectedPeg(ctx, sx, sy, this.cellSize*0.34);
            }
        }

        this._drawHud(ctx, originX, originY, w, h, model);

        // si hay una pieza siendo arrastrada, dibujarla en la posición del pointer
        // usando el mismo efecto de la ficha seleccionada (scale + shadow) para que parezca
        // levantada mientras se arrastra.
        if (this._dragging && this._dragOrigin && this._dragPos){
            const dx = this._dragPos.x;
            const dy = this._dragPos.y;
            // dibujar la pieza arrastrada con el estilo "selected/elevated"
            this._drawSelectedPeg(ctx, originX + dx, originY + dy, this.cellSize*0.34);
        }
        // Actualizar HUD en el DOM si existen los elementos
        if (this.ui.pegsLeftEl) this.ui.pegsLeftEl.textContent = model.pegCount;
        if (this.ui.moveCountEl) this.ui.moveCountEl.textContent = model.moveCount;
        if (this.ui.timerEl && window.pegController && typeof window.pegController.remainingTime === 'number') {
            const t = window.pegController.remainingTime;
            this.ui.timerEl.textContent = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
            // Forzar estilos visibles
            this.ui.timerEl.style.color = '#FFD54F';
            this.ui.timerEl.style.fontWeight = 'bold';
            this.ui.timerEl.style.fontSize = '1.5rem';
            this.ui.timerEl.style.background = 'transparent';
            this.ui.timerEl.style.display = 'inline';
            this.ui.timerEl.style.visibility = 'visible';
        }
    }

    showMessage(text){ if (this.ui.messageEl) this.ui.messageEl.textContent = text; }

    _drawHud(ctx, originX, originY, w, h, model){
        // Dibujar HUD dentro de los paneles laterales (si existen), con medidas relativas
        ctx.save();
        const pad = Math.max(10, Math.floor(this.cellSize * 0.12));
        const labelFont = `${Math.max(12, Math.floor(this.cellSize * 0.18))}px Arial`;
        const valueFont = `${Math.max(16, Math.floor(this.cellSize * 0.22))}px Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';

        // Texto / estadísticas en el panel izquierdo
        if (this._sidePanelLeft){
            const p = this._sidePanelLeft;
            const sx = p.x + pad;
            let sy = p.y + pad + Math.floor(this.cellSize * 0.2);

            ctx.font = labelFont;
            ctx.fillText('Fichas', sx, sy);
            ctx.font = valueFont;
            ctx.fillText(String(model.pegCount), sx, sy + Math.floor(this.cellSize * 0.9));

            sy += Math.floor(this.cellSize * 1.6);
            ctx.font = labelFont;
            ctx.fillText('Movimientos', sx, sy);
            ctx.font = valueFont;
            ctx.fillText(String(model.moveCount), sx, sy + Math.floor(this.cellSize * 0.9));

            // Tiempo
            sy += Math.floor(this.cellSize * 1.6);
            ctx.font = labelFont;
            ctx.fillText('Tiempo', sx, sy);
            ctx.font = valueFont;
            let timerText = '00:00';
            if (window.pegController && typeof window.pegController.remainingTime === 'number') {
                const t = window.pegController.remainingTime;
                timerText = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
            }
            ctx.fillText(timerText, sx, sy + Math.floor(this.cellSize * 0.9));
        }

        // Botones apilados en el panel derecho
        if (this._sidePanelRight){
            const p = this._sidePanelRight;
            const btnW = Math.max(96, Math.floor(p.w - pad*2));
            const btnH = Math.max(36, Math.floor(this.cellSize * 0.32));
            const spacing = Math.max(10, Math.floor(this.cellSize * 0.18));
            let bx = p.x + (p.w - btnW)/2;
            let by = p.y + pad + Math.floor(this.cellSize * 0.2);

            this._hudRegions.reset = { x: bx, y: by, w: btnW, h: btnH };
            this._drawButton(ctx, bx, by, btnW, btnH, '🔁 Reiniciar');

            by += btnH + spacing;
            this._hudRegions.undo = { x: bx, y: by, w: btnW, h: btnH };
            this._drawButton(ctx, bx, by, btnW, btnH, '↶ Deshacer');

            by += btnH + spacing;
            this._hudRegions.hint = { x: bx, y: by, w: btnW, h: btnH };
            this._drawButton(ctx, bx, by, btnW, btnH, '💡 Pista');
        }

        ctx.restore();
    }

    _drawArrows(ctx, originX, originY, model){
        const now = performance.now();
        const elapsed = now - this._animStart;
        const p = ((elapsed % this._animDuration) / this._animDuration);
        // Nuevo: para cada celda objetivo dibujar un 'rotador' compuesto por 3 barras amarillas
        // que giren alrededor del centro de la celda. Las barras se dibujan como trazos con
        // extremos redondeados (lineCap='round') y con un contorno negro para contraste.
        const baseAngle = elapsed / this._animDuration * Math.PI * 2;
        this._arrowTargets.forEach(target => {
            const cx = originX + (target.c * this.cellSize) + this.cellSize/2;
            const cy = originY + (target.r * this.cellSize) + this.cellSize/2;

            // radios y grosores relativos a cellSize
            const outerR = this.cellSize * 0.36;
            const innerR = this.cellSize * 0.12;
            const barW = Math.max(4, this.cellSize * 0.07);

            // ángulo rotación actual
            const angle = baseAngle;

            // dibujar 3 segmentos de arco alrededor del centro, formando el borde de un círculo
            const ringR = (innerR + outerR) * 0.5;
            // longitud angular de cada segmento (fracción del tercio de círculo)
            const segFraction = 0.72; // 72% del tercio => deja pequeño espacio entre segmentos
            const segAngle = (Math.PI * 2 / 3) * segFraction;
            for (let i = 0; i < 3; i++){
                const start = angle + i * (Math.PI * 2 / 3) - segAngle/2;
                const end = start + segAngle;

                // contorno negro grueso
                ctx.beginPath();
                ctx.lineWidth = Math.max(6, barW + 2);
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000';
                ctx.arc(cx, cy, ringR, start, end);
                ctx.stroke();

                // arco amarillo encima
                ctx.beginPath();
                ctx.lineWidth = barW;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#FFD54F';
                ctx.arc(cx, cy, ringR, start, end);
                ctx.stroke();

                // (Quitar highlight blanco interior para un diseño más limpio)
            }
        });
    }

    _drawGhostPeg(ctx, cx, cy, radius){
        // ghost: círculo translúcido con halo y borde sutil
        ctx.save();
        // sombra/halo
        ctx.beginPath();
        // halo más sutil
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.arc(cx + this.cellSize*0.04, cy + this.cellSize*0.04, radius + this.cellSize*0.03, 0, Math.PI*2);
        ctx.fill();

        // cuerpo ghost (más translúcido)
        ctx.beginPath();
        // aumentar opacidad para que la ficha seleccionada se vea más (efecto atenuado)
        ctx.fillStyle = 'rgba(255,213,79,0.58)';
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.fill();

        // borde suave
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, this.cellSize * 0.02);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }

    _drawSelectedPeg(ctx, cx, cy, radius){
        // Dibuja la ficha seleccionada con leve escala y una sombra manual (elipse) para "elevarla"
        ctx.save();
        const scale = 1.08;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

    // Sombra circular plana: misma forma y tamaño que la ficha, desplazada hacia abajo
    ctx.save();
    // sombra principal (mismo radio que la ficha)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.arc(0, radius * 0.9, radius, 0, Math.PI * 2);
    ctx.fill();
    // borde exterior más suave (ligeramente mayor)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.arc(0, radius * 0.9, radius * 1.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

        // cuerpo de la ficha
        ctx.beginPath();
        ctx.fillStyle = '#FFD54F';
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.fill();

        // borde sutil
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, this.cellSize * 0.02);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }

    _drawButton(ctx, x, y, w, h, label){
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = '13px Arial';
        const textW = ctx.measureText(label).width;
        ctx.fillText(label, x + (w - textW)/2, y + h/2 + 5);
        ctx.restore();
    }

    _hitHudButton(x,y){
        const r = this._hudRegions;
        if (r.reset && this._pointInRect(x,y,r.reset)){
            if (this._onResetCallback) this._onResetCallback();
            else if (this.ui.resetBtn) this.ui.resetBtn.click();
            return true;
        }
        if (r.undo && this._pointInRect(x,y,r.undo)){
            if (this._onUndoCallback) this._onUndoCallback();
            else if (this.ui.undoBtn) this.ui.undoBtn.click();
            return true;
        }
        if (r.hint && this._pointInRect(x,y,r.hint)){
            if (this._onHintCallback) this._onHintCallback();
            else if (this.ui.hintBtn) this.ui.hintBtn.click();
            return true;
        }
        return false;
    }

    _pointInRect(x,y,rect){
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    _startArrowAnim(){
        if (this._arrowAnimating) return;
        this._arrowAnimating = true;
        this._animStart = performance.now();
        const tick = (t)=>{
            if (!this._arrowAnimating) return;
            // solicitar a la vista que renderice el frame actual
            if (this._renderOnUpdate) this._renderOnUpdate();
            this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
    }

    _stopArrowAnim(){
        this._arrowAnimating = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
    }

    highlightCells(cells){
        // Acepta: un array de destinos O un objeto { source: {r,c}, targets: [...] }
        if (!cells) return;
        if (Array.isArray(cells)){
            this._highlightedCells = cells.map(c=>({r:(c.r!==undefined?c.r:c[0]), c:(c.c!==undefined?c.c:c[1])}));
            // no arrow animation without a source
            this._arrowSource = null;
            this._arrowTargets = null;
            this._stopArrowAnim && this._stopArrowAnim();
        } else if (cells && cells.source && Array.isArray(cells.targets)){
            this._highlightedCells = cells.targets.map(c=>({r:(c.r!==undefined?c.r:c[0]), c:(c.c!==undefined?c.c:c[1])}));
            this._arrowSource = { r: cells.source.r, c: cells.source.c };
            this._arrowTargets = this._highlightedCells.slice();
            this._startArrowAnim && this._startArrowAnim();
        } else {
            this._highlightedCells = [];
            this._arrowSource = null;
            this._arrowTargets = null;
            this._stopArrowAnim && this._stopArrowAnim();
        }
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    clearHighlights(){ this._highlightedCells = []; this._arrowSource = null; this._arrowTargets = null; this._stopArrowAnim && this._stopArrowAnim(); if (this._renderOnUpdate) this._renderOnUpdate(); }

    setRenderCallback(cb){ this._renderOnUpdate = cb; }

    showBanner(text, type='info'){
        // Elimina cualquier banner anterior
        if (this._bannerEl && this._bannerEl.parentNode) {
            this._bannerEl.parentNode.removeChild(this._bannerEl);
            this._bannerEl = null;
        }
        const banner = document.createElement('div');
        banner.className = `peg-banner peg-banner-${type}`;
        banner.textContent = text;
        // Estilos básicos inline para asegurar visibili    dad
        banner.style.position = 'absolute';
        banner.style.top = '24px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.padding = '16px 32px';
        banner.style.background = type === 'warning' ? '#ff9800' :  '#1976d2';
        banner.style.color = '#fff';
        banner.style.fontSize = '1.2rem';
        banner.style.fontWeight = 'bold';
        banner.style.borderRadius = '8px';
        banner.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
        banner.style.zIndex = '1000';
        banner.style.pointerEvents = 'none';
        // Insertar sobre el canvas
        const parent = this.canvas.parentElement || document.body;
        parent.appendChild(banner);
        this._bannerEl = banner;
        setTimeout(()=> {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
            if (this._bannerEl === banner) this._bannerEl = null;
        }, 2200);
    }

}
