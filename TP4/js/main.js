import PegView from './views/PegView.js';
import PegController from './controllers/PegController.js';

window.addEventListener('DOMContentLoaded', ()=>{
    // Usar canvas estático si existe en el HTML, sino crear uno como fallback
    let canvas = document.getElementById('pegCanvas');
    const boardContainer = document.getElementById('game-area');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'pegCanvas';
        canvas.style.width = '100%';
        canvas.style.height = '520px';
        // limpiar antiguo tablero DOM si existe
        const oldBoard = document.getElementById('game-board');
        if (oldBoard) oldBoard.remove();
        if (boardContainer) boardContainer.insertBefore(canvas, boardContainer.firstChild);
    }

    const uiSelectors = {
        pegsLeftEl: document.getElementById('pegsLeft'),
        moveCountEl: document.getElementById('moveCount'),
        timerEl: document.getElementById('timer'),
        messageEl: document.getElementById('gameMessage'),
        resetBtn: document.getElementById('resetBtn'),
        undoBtn: document.getElementById('undoBtn'),
        hintBtn: document.getElementById('hintBtn'),
        initialTime: 300
    };

    const view = new PegView(canvas, uiSelectors);
    const controller = new PegController(canvas, uiSelectors);
    controller.init(view);
    window.pegController = controller;
});
