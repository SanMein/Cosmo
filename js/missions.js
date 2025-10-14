// ====== MISSION EXECUTION ======
window.startMission = function(rocketId, missionId) {
    closeModal();
    const r = state.rockets.find(r => r.id === rocketId);
    const m = state.missions.find(m => m.id === missionId);
    if (m.reqTech && !state.research.find(t => t.effect && t.effect.includes(m.reqTech.split(":")[1]) && t.unlocked)) {
        notify("Для этой миссии нужно изучить соответствующую технологию!", "bad");
        return;
    }
    if (state.fuel < m.fuel || state.parts < m.parts) {
        notify("Недостаточно топлива или деталей!", "bad");
        return;
    }
    if (state.reputation < (m.reqReputation || 0)) {
        notify("Недостаточно репутации!", "bad");
        return;
    }
    if (state.rockets.filter(r => r.status !== "ready").length >= state.launchPadLevel) {
        notify("Недостаточно стартовых площадок!", "bad");
        return;
    }
    if (m.launchWindow && Date.now() < (m.lastLaunch || 0) + m.launchWindow) {
        notify("Окно запуска закрыто!", "bad");
        return;
    }
    state.fuel -= m.fuel;
    state.parts -= m.parts;
    r.status = "preparing";
    r.prepStart = Date.now();
    r.lastMission = m.name;
    missionProgress[`${rocketId}-${missionId}`] = 0;
    notify(`🚀 <b>${r.name}</b> готовится к миссии "<b>${m.name}</b>"...`, "good");
    renderAll();
    setTimeout(() => {
        r.status = "exploring";
        let progress = 0;
        notify(`🚀 <b>${r.name}</b> выполняет миссию "<b>${m.name}</b>"...`, "good");
        rocket.visible = true;
        rocket.y = window.innerHeight * 0.5 - 100 - (Math.random() * 200);
        renderAll();
        const intervalId = setInterval(() => {
            progress += 8 + Math.random() * 15;
            missionProgress[`${rocketId}-${missionId}`] = Math.min(progress, 100);
            if (progress >= 100) clearInterval(intervalId);
            renderRockets();
        }, 300);
        setTimeout(() => {
            clearInterval(intervalId);
            const mods = techMissionModifiers();
            let successChance = r.success + mods.successMod;
            if (r.modules.includes("Теплозащита") && m.type === "longrange") successChance += 0.05;
            if (r.modules.includes("Связь")) mods.wearMod *= 0.9;
            if (r.modules.includes("Датчик радиации")) m.science *= 1.1;
            let ok = Math.random() < successChance;
            r.condition = Math.max(0, r.condition - 10 * mods.wearMod);
            if (r.condition < 20) r.damaged = true;
            if (ok && m.type === "longrange" && Math.random() < 0.1) {
                ok = false;
                r.damaged = true;
                r.status = "failed";
                state.reputation = Math.max(0, state.reputation - 10);
                state.history.unshift(`[${formatDate(Date.now())}] <b>${r.name}</b> потеряла сигнал во время миссии "<b>${m.name}</b>" и получила повреждения.`);
                notify(`❌ Потеря сигнала! "<b>${m.name}</b>": ракета повреждена, требуется ремонт.`, "bad");
            } else if (ok) {
                state.money += Math.floor(m.reward * (0.8 + Math.random() * 0.4));
                state.science += m.science;
                state.reputation = Math.min(100, state.reputation + 5);
                m.done++;
                r.launches++;
                m.lastLaunch = Date.now();
                state.history.unshift(`[${formatDate(Date.now())}] <b>${r.name}</b> успешно выполнила миссию "<b>${m.name}</b>"`);
                if (m.id === 9 && !state.achievements[6].unlocked) {
                    notify(`🎉 Открыт новый химический элемент!`, "good");
                    state.achievements[6].unlocked = true;
                    state.achievements[6].date = Date.now();
                }
                notify(`✅ Миссия "<b>${m.name}</b>" выполнена!`, "good");
                checkUnlocks();
                checkAchievements();
            } else {
                r.status = "failed";
                state.reputation = Math.max(0, state.reputation - 10);
                if (Math.random() < 0.1) {
                    state.rockets = state.rockets.filter(rocket => rocket.id !== r.id);
                    state.history.unshift(`[${formatDate(Date.now())}] <b>${r.name}</b> уничтожена при провале миссии "<b>${m.name}</b>"`);
                    notify(`💥 Миссия "<b>${m.name}</b>" провалена. Ракета уничтожена!`, "bad");
                } else {
                    state.history.unshift(`[${formatDate(Date.now())}] <b>${r.name}</b> провалила миссию "<b>${m.name}</b>"`);
                    notify(`❌ Миссия "<b>${m.name}</b>" провалена. Ракета вернулась.`, "bad");
                    setTimeout(() => { r.status = r.damaged ? "failed" : "ready"; renderAll(); }, 2400);
                }
            }
            r.status = r.damaged ? "failed" : "ready";
            r.prepStart = null;
            delete missionProgress[`${rocketId}-${missionId}`];
            rocket.visible = false;
            renderAll();
        }, 1600 + Math.random() * 1100);
    }, m.prepTime);
};

// ====== AUTOMATION ======
setInterval(function autoLaunch() {
    if (state.activeModules.includes("Автозапуск")) {
        const rocket = state.rockets.find(r => r.status === "ready" && !r.damaged);
        const mission = state.missions.find(m => m.unlocked && state.fuel >= m.fuel && state.parts >= m.parts && (!m.launchWindow || Date.now() >= (m.lastLaunch || 0) + m.launchWindow) && state.reputation >= (m.reqReputation || 0));
        if (rocket && mission && state.rockets.filter(r => r.status !== "ready").length < state.launchPadLevel) {
            if (Math.random() < 0.1) {
                notify(`Автозапуск для <b>${rocket.name}</b> сбойнул!`, "bad");
                rocket.status = "failed";
                setTimeout(() => { rocket.status = rocket.damaged ? "failed" : "ready"; renderAll(); }, 30000);
            } else {
                window.startMission(rocket.id, mission.id);
            }
        }
    }
}, 60000);

// ======= EVENTS =========
function randomEvent() {
    const events = [
        () => {
            const amt = getRandomWeighted(100000, 1000000);
            state.money += amt;
            notify(` <i class="fas fa-gavel"></i> Государство выделило грант +${amt.toLocaleString()}₽!`, "good");
        },
        () => {
            const loss = getRandomWeighted(1, 50);
            state.fuel = Math.max(0, state.fuel - loss);
            notify(` <i class="fas fa-exclamation-circle"></i> Утечка топлива! -${loss}⛽`, "bad");
        },
        () => {
            const add = getRandomWeighted(5, 20);
            state.science += add;
            notify(` <i class="fas fa-lightbulb"></i> Учёные сделали открытие! +${add}🔬`, "good");
        },
        () => {
            const r = state.rockets.find(r => r.status === "ready" && !r.damaged);
            if (r) {
                r.damaged = true;
                notify(` <i class="fas fa-tools"></i> Технический сбой! Ракета "${r.name}" требует ремонта.`, "bad");
            }
        },
        () => {
            const amt = getRandomWeighted(50000, 500000);
            state.money += amt;
            notify(` <i class="fas fa-hand-holding-usd"></i> Частная компания инвестировала +${amt.toLocaleString()}₽!`, "good");
        },
        () => {
            const amt = getRandomWeighted(10, 50);
            if (state.parts + amt <= state.storageLimits.parts) {
                state.parts += amt;
                notify(` <i class="fas fa-truck"></i> Поставщик прислал бесплатные детали! +${amt}🔧`, "good");
            }
        },
        () => {
            state.shopLocked = true;
            notify(` <i class="fas fa-exclamation-triangle"></i> Задержка поставок! Магазин недоступен 2 минуты.`, "bad");
            setTimeout(() => {
                state.shopLocked = false;
                notify(` <i class="fas fa-check"></i> Магазин снова доступен!`, "good");
                renderAll();
            }, 120000);
        }
    ];
    if (Math.random() < 0.2) events[Math.floor(Math.random() * events.length)]();
    renderAll();
}
setInterval(randomEvent, 300000);