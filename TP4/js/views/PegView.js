export default class PegView {
    constructor(canvas, uiSelectors = {}){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiSelectors; // { pegsLeftEl, moveCountEl, timerEl, messageEl }
        this.rows = 7; this.cols = 7;
        this.cellSize = 64; // tamaño por defecto, se ajustará en resize
        this.padding = 12;
        this._highlightedCells = [];

        // Click event (simple selection)
        this.canvas.addEventListener('click', (e)=> this._onClick(e));
        window.addEventListener('resize', ()=> this._onResize());
        this._onResize();
    }

    _onResize(){
        const rect = this.canvas.getBoundingClientRect();
        // calcular cellSize en función del ancho disponible
        const avail = Math.min(rect.width, rect.height) - this.padding*2;
        this.cellSize = Math.floor(avail / Math.max(this.rows, this.cols));
        this.canvas.width = rect.width * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * (window.devicePixelRatio || 1);
        this.ctx.setTransform(window.devicePixelRatio || 1,0,0,window.devicePixelRatio || 1,0,0);
    }

    onClick(handler){ this._clickHandler = handler; }

    _onClick(e){
        if (!this._clickHandler) return;
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left - this.padding;
        const y = e.clientY - r.top - this.padding;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        this._clickHandler(row, col);
    }

    _getCellFromEvent(e){
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left - this.padding;
        const y = e.clientY - r.top - this.padding;
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
        ctx.fillStyle = '#0b1720';
        ctx.fillRect(0,0,w,h);

        // grid origin
        const originX = this.padding;
        const originY = this.padding;

        // draw cells
        for (let r=0;r<this.rows;r++){
            for (let c=0;c<this.cols;c++){
                const x = originX + c*this.cellSize;
                const y = originY + r*this.cellSize;
                // background box
                ctx.fillStyle = model.isValidPosition(r,c) ? 'rgba(255,255,255,0.03)' : 'transparent';
                ctx.fillRect(x+2,y+2,this.cellSize-4,this.cellSize-4);

                if (model.board[r][c] === 1){
                    // draw peg circle
                    ctx.beginPath();
                    ctx.fillStyle = '#FFD54F';
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.32, 0, Math.PI*2);
                    ctx.fill();
                } else if (model.board[r][c] === 0 && model.isValidPosition(r,c)){
                    // hole indicator
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                    ctx.lineWidth = 2;
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.12, 0, Math.PI*2);
                    ctx.stroke();
                }
                // highlight overlay
                if (this._highlightedCells.some(hc => hc.r === r && hc.c === c)){
                    ctx.fillStyle = 'rgba(100, 181, 246, 0.22)';
                    ctx.fillRect(x+2,y+2,this.cellSize-4,this.cellSize-4);
                    // draw small indicator circle
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(2,35,45,0.9)';
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.08, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }

        // HUD extra
        if (this.ui.pegsLeftEl) this.ui.pegsLeftEl.textContent = model.pegCount;
        if (this.ui.moveCountEl) this.ui.moveCountEl.textContent = model.moveCount;
    }

    showMessage(text){ if (this.ui.messageEl) this.ui.messageEl.textContent = text; }

    highlightCells(cells){
        // cells: array of {r,c} or [r,c]
        this._highlightedCells = Array.isArray(cells) ? cells.map(c=>({r:(c.r!==undefined?c.r:c[0]), c:(c.c!==undefined?c.c:c[1])})) : [];
        // re-render to show highlights
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    clearHighlights(){ this._highlightedCells = []; if (this._renderOnUpdate) this._renderOnUpdate(); }

    // allow controller to hook into re-render call
    setRenderCallback(cb){ this._renderOnUpdate = cb; }

}
