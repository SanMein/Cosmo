// ======= UTILS =======

function notify(txt, type = "info", timeout = 3400) {
    const el = document.createElement("div");
    el.className = `notify ${type}`;
    el.innerHTML = txt;
    notifications.prepend(el); // Новые уведомления сверху
    setTimeout(() => el.remove(), timeout + Math.random() * 800);
}

function formatDate(dt) {
    return new Date(dt).toLocaleString("ru-RU", { hour12: false });
}

function getRandomWeighted(min, max) {
    let r = Math.pow(Math.random(), 2.5);
    return Math.floor(min + (max - min) * (1 - r));
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function rocketStatusLabel(st) {
    if (st === "ready") return "Готова";
    if (st === "preparing") return "Подготовка";
    if (st === "launched") return "В полёте";
    if (st === "exploring") return "Выполняет миссию";
    if (st === "failed") return "Провал";
    return st;
}