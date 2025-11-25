// import PegView from './views/PegView.js';
import PegController from './controllers/PegController.js';

window.addEventListener('DOMContentLoaded', ()=>{
    // prevent small horizontal scrollbar caused by accidental overflow
    try{ document.documentElement.style.overflowX = 'hidden'; } catch(e){}
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

    // Let the view create or wire UI controls; pass only initial config here
    const uiSelectors = { initialTime: 300 };

    const view = new PegView(canvas, uiSelectors);
    // use the UI that the view provides (it creates controls if they were missing)
    const controller = new PegController(canvas, view.ui);
    controller.init(view);
    window.pegController = controller;
});
