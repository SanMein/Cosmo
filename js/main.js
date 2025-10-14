// =========== MAIN RENDER & INIT ===========
setInterval(renderAll, 5000);

// Инициализация игры
window.onload = function() {
    if (localStorage.getItem(STORAGE_KEY)) {
        loadGame();
    } else {
        renderAll();
    }
    // Запуск анимаций
    animateBackground();
    animateRocket();
};