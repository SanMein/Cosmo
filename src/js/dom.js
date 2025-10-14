// ======= DOM ELEMENTS =======
const resources = document.getElementById('resources');
const rockets = document.getElementById('rockets');
const history = document.getElementById('history');
const panelMissions = document.getElementById('panel-missions');
const panelTech = document.getElementById('panel-tech');
const panelShop = document.getElementById('panel-shop');
const panelStats = document.getElementById('panel-stats');
const notifications = document.getElementById('notifications');
const backgroundCanvas = document.getElementById('background-canvas');
const rocketCanvas = document.getElementById('rocket-canvas');

if (!resources || !rockets || !history || !panelMissions || !panelTech ||
    !panelShop || !panelStats || !notifications || !backgroundCanvas || !rocketCanvas) {
    console.error('Ошибка: один или несколько DOM-элементов не найдены');
    throw new Error('DOM initialization failed');
}

// ======= TABS =======
function showTab(tab) {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("visible"));
    document.getElementById("tab-" + tab).classList.add("active");
    document.getElementById("panel-" + tab).classList.add("visible");
}

// Назначение обработчиков событий
document.getElementById("tab-main").onclick = () => showTab("main");
document.getElementById("tab-missions").onclick = () => showTab("missions");
document.getElementById("tab-tech").onclick = () => showTab("tech");
document.getElementById("tab-shop").onclick = () => showTab("shop");
document.getElementById("tab-stats").onclick = () => showTab("stats");
document.getElementById("savebtn").onclick = (e) => { e.preventDefault(); saveGame(); };
document.getElementById("loadbtn").onclick = (e) => { e.preventDefault(); loadGame(); };
document.getElementById("resetbtn").onclick = (e) => { e.preventDefault(); resetGame(); };