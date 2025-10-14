// ======= SHOP & UPGRADES =======
window.buyResource = function(type, qty) {
    qty = qty || 1;
    if (state.shopLocked) {
        notify("Магазин временно недоступен из-за задержки поставок!", "bad");
        return;
    }
    if (type === 'fuel') {
        let price = 30 * qty;
        if (state.fuel + qty > state.storageLimits.fuel) {
            notify("Склад топлива полон!", "bad");
            return;
        }
        if (state.money >= price) {
            state.money -= price;
            state.fuel += qty;
            notify(`Куплено топлива x${qty}!`, "good");
            renderAll();
            updateMissionModalIfOpen();
        } else notify("Не хватает денег!", "bad");
    } else if (type === 'parts') {
        let price = 40 * qty;
        if (state.parts + qty > state.storageLimits.parts) {
            notify("Склад деталей полон!", "bad");
            return;
        }
        if (state.money >= price) {
            state.money -= price;
            state.parts += qty;
            notify(`Куплены детали x${qty}!`, "good");
            renderAll();
            updateMissionModalIfOpen();
        } else notify("Не хватает денег!", "bad");
    } else if (type === 'rocketParts') {
        let price = 50 * qty;
        if (state.rocketParts + qty > state.storageLimits.rocketParts) {
            notify("Склад частей ракет полон!", "bad");
            return;
        }
        if (state.money >= price) {
            state.money -= price;
            state.rocketParts += qty;
            notify(`Куплены части ракеты x${qty}!`, "good");
            renderAll();
        } else notify("Не хватает денег!", "bad");
    }
};

window.upgradeLaunchPad = function() {
    if (state.launchPadLevel >= 5) return;
    if (state.money >= 5000000 && state.parts >= 200 && state.rocketParts >= 50) {
        state.money -= 5000000;
        state.parts -= 200;
        state.rocketParts -= 50;
        state.launchPadLevel += 1;
        notify(`Космодром улучшен до уровня ${state.launchPadLevel}!`, "good");
        renderAll();
    } else {
        notify("Не хватает ресурсов для улучшения космодрома!", "bad");
    }
};

// Технологии
window.researchTech = function(id) {
    const t = state.research.find(t => t.id === id);
    if (!t || t.unlocked || state.science < t.cost) return;
    state.science -= t.cost;
    t.unlocked = true;
    notify(`Технология <b>${t.name}</b> исследована!`, "good");
    checkUnlocks();
    checkAchievements();
    renderAll();
};

window.activateModule = function() {
    if (state.research.find(t => t.effect && t.effect.includes("auto:enabled") && t.unlocked)) {
        if (!state.activeModules.includes("Автозапуск") && state.money >= 100000 && state.science >= 50) {
            state.money -= 100000;
            state.science -= 50;
            state.activeModules.push("Автозапуск");
            notify("Активирован модуль автозапуска!", "good");
            renderAll();
        } else if (state.activeModules.includes("Автозапуск")) {
            notify("Автозапуск уже активирован!", "bad");
        } else {
            notify("Не хватает ресурсов для активации!", "bad");
        }
    } else {
        notify("Нет доступных модулей для активации!", "bad");
    }
};

window.deactivateModule = function(idx) {
    state.activeModules.splice(idx, 1);
    notify("Модуль деактивирован.", "bad");
    renderAll();
};