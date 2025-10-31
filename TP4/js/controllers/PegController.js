import PegModel from '../models/PegModel.js';

export default class PegController {
    constructor(canvas, uiSelectors = {}){
        this.model = new PegModel();
        this.view = null; // inyectada en init
        this.canvas = canvas;
        this.ui = uiSelectors;
        this.timer = null;
        this.remainingTime = uiSelectors.initialTime || 300;
        this.gameOver = false;
    }

    init(view){
        this.view = view;
        this.view.onClick((r,c)=> this.handleClick(r,c));
        // render callback so view can request a re-render
        if (this.view.setRenderCallback) this.view.setRenderCallback(()=> this.view.render(this.model));
        // pointer (drag/drop) handlers
        if (this.view.onPointerDown) this.view.onPointerDown((r,c,e)=> this._onPointerDown(r,c,e));
        if (this.view.onPointerUp) this.view.onPointerUp((r,c,e)=> this._onPointerUp(r,c,e));
        // wire buttons
        if (this.ui.resetBtn) this.ui.resetBtn.addEventListener('click', ()=> this.reset());
        if (this.ui.undoBtn) this.ui.undoBtn.addEventListener('click', ()=> this.undo());
        if (this.ui.hintBtn) this.ui.hintBtn.addEventListener('click', ()=> this.showHint());
        this.startTimer();
        this.view.render(this.model);
    }

    handleClick(row,col){
        if (!this.model.isValidPosition(row,col)) return;
        if (!this.selected){
            if (this.model.board[row][col] === 1){
                this.selected = {row,col};
                // highlight valid destinations
                const moves = [];
                const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
                dirs.forEach(([dr,dc])=>{
                    const nr = row+dr, nc = col+dc;
                    if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
                });
                if (moves.length) this.view.highlightCells(moves);
                this.view.showMessage('Ficha seleccionada');
            }
        } else {
            const from = this.selected;
            if (this.model.canMove(from.row,from.col,row,col)){
                this.model.makeMove(from.row,from.col,row,col);
                this.selected = null;
                this.view.clearHighlights && this.view.clearHighlights();
                this.view.render(this.model);
                this.view.showMessage('Movimiento realizado');
                this.checkStatus();
            } else {
                // si clickeo otra ficha seleccionable, cambiar selección
                if (this.model.board[row][col] === 1){
                    this.selected = {row,col};
                    const moves = [];
                    const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
                    dirs.forEach(([dr,dc])=>{
                        const nr = row+dr, nc = col+dc;
                        if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
                    });
                    this.view.highlightCells(moves);
                    this.view.showMessage('Ficha seleccionada');
                } else {
                    this.view.showMessage('Movimiento inválido');
                }
            }
        }
    }

    _onPointerDown(row,col,e){
        // begin selection/drag if peg exists
        if (!this.model.isValidPosition(row,col)) return;
        if (this.model.board[row][col] === 1){
            this.selected = {row,col};
            // compute valid destinations and highlight
            const moves = [];
            const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
            dirs.forEach(([dr,dc])=>{
                const nr = row+dr, nc = col+dc;
                if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
            });
            this._possibleMoves = moves;
            this.view.highlightCells(moves);
            this.view.showMessage('Arrastrando ficha...');
        }
    }

    _onPointerUp(row,col,e){
        // drop: if target in possibleMoves, perform move
        if (this.selected && Array.isArray(this._possibleMoves)){
            const match = this._possibleMoves.find(m => m[0] === row && m[1] === col);
            if (match){
                const from = this.selected;
                this.model.makeMove(from.row, from.col, row, col);
                this.view.clearHighlights && this.view.clearHighlights();
                this.view.render(this.model);
                this.view.showMessage('Movimiento realizado');
                this.selected = null;
                this._possibleMoves = null;
                this.checkStatus();
                return;
            }
        }
        // otherwise clear selection/highlights
        this.selected = null;
        this._possibleMoves = null;
        this.view.clearHighlights && this.view.clearHighlights();
    }

    reset(){
        this.model.initializeBoard();
        this.model.moveHistory = [];
        this.model.moveCount = 0;
        this.remainingTime = this.ui.initialTime || 300;
        this.gameOver = false;
        this.view.render(this.model);
        this.view.showMessage('Juego reiniciado');
    }

    undo(){
        if (this.model.undo()){
            this.view.render(this.model);
            this.view.showMessage('Movimiento deshecho');
        } else {
            this.view.showMessage('No hay movimientos para deshacer');
        }
    }

    showHint(){
        const moves = this.model.getAllPossibleMoves();
        if (moves.length === 0) { this.view.showMessage('No hay movimientos'); return; }
        const mv = moves[Math.floor(Math.random()*moves.length)];
        this.view.showMessage(`Pista: ${mv.from} → ${mv.to}`);
    }

    startTimer(){
        this.stopTimer();
        const timerEl = this.ui.timerEl;
        this.timer = setInterval(()=>{
            if (this.gameOver) { this.stopTimer(); return; }
            this.remainingTime--;
            if (timerEl) timerEl.textContent = `${String(Math.floor(this.remainingTime/60)).padStart(2,'0')}:${String(this.remainingTime%60).padStart(2,'0')}`;
            if (this.remainingTime <= 0){
                this.gameOver = true;
                this.view.showMessage('Tiempo agotado');
                this.stopTimer();
            }
        },1000);
    }

    stopTimer(){ if (this.timer) clearInterval(this.timer); this.timer = null; }

    checkStatus(){
        const moves = this.model.getAllPossibleMoves();
        if (moves.length === 0){
            this.gameOver = true;
            if (this.model.pegCount === 1) this.view.showMessage('¡Ganaste!');
            else this.view.showMessage(`Juego terminado. Quedaron ${this.model.pegCount} fichas.`);
            this.stopTimer();
        }
    }
}
