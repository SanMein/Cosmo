// =========== MAIN RENDER & INIT ===========
// Объединённый рендер с интервалом 5 секунд, только если вкладка активна
setInterval(() => {
    if (document.hidden) return;
    renderAll();
}, 5000);

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
