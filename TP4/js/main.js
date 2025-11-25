// import PegView from './views/PegView.js';
import PegController from './controllers/PegController.js';

window.addEventListener('DOMContentLoaded', ()=>{
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

    // Dejar que la vista cree o conecte los controles de la interfaz; pasar solo la configuración inicial aquí
    const uiSelectors = { initialTime: 120 };

    const view = new PegView(canvas, uiSelectors);
    // usar la UI que proporciona la vista (crea controles si no existen)
    const controller = new PegController(canvas, view.ui);
    controller.init(view);
    window.pegController = controller;
});
