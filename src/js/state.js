// ======= GAME DATA & STATE =======
const STORAGE_KEY = "cosmo_save_v3";
const defaultState = {
    money: 1000000,
    fuel: 1000,
    parts: 1000,
    science: 5,
    rocketParts: 5,
    reputation: 5,
    storageLimits: { fuel: 10000, parts: 10000, rocketParts: 500 },
    launchPadLevel: 1,
    shopLocked: false,
    rockets: [
        { id: 1, name: "R-0", level: 1, success: 0.5, status: "ready",
          launches: 0, lastMission: null, modules: [], damaged: false,
          condition: 100, prepStart: null }
    ],
    nextRocketId: 2,
    research: [
        { id: 1, name: "Базовый спутник", cost: 20, desc: "Позволяет строить спутники", unlocked: true, req: [], effect: "unlock:satellite" },
        { id: 2, name: "Улучшенный двигатель", cost: 50, desc: "Увеличивает шанс успеха всех ракет", unlocked: false, req: [1], effect: "success:+0.04" },
        { id: 3, name: "Дальний радар", cost: 80, desc: "Открывает дальние миссии", unlocked: false, req: [2], effect: "unlock:luna" },
        { id: 4, name: "Лёгкие материалы", cost: 100, desc: "Ракеты становятся дешевле", unlocked: false, req: [2], effect: "buildcost:-0.25" },
        { id: 5, name: "Астронавигация", cost: 150, desc: "Увеличивает шанс успеха, открывает пилотируемые миссии", unlocked: false, req: [3], effect: "success:+0.04;unlock:crewed" },
        { id: 6, name: "Ядерные двигатели", cost: 300, desc: "Открывает межпланетные миссии", unlocked: false, req: [5], effect: "unlock:interplanet" },
        { id: 7, name: "Автоматизация запусков", cost: 250, desc: "Возможность автозапуска миссий", unlocked: false, req: [4], effect: "auto:enabled" },
        { id: 8, name: "Контрактный центр", cost: 120, desc: "Открывает коммерческие миссии", unlocked: false, req: [2], effect: "unlock:contract" },
        { id: 9, name: "Сканер астероидов", cost: 90, desc: "Открывает миссии по исследованию астероидов", unlocked: false, req: [3], effect: "unlock:asteroid" },
        { id: 10, name: "Новые материалы", cost: 400, desc: "Возможность находить новые элементы", unlocked: false, req: [6], effect: "unlock:newchem" },
        { id: 11, name: "Криогенные системы", cost: 150, desc: "Снижает утечку топлива на складе", unlocked: false, req: [4], effect: "fuelLeak:-0.5" },
        { id: 12, name: "Прочные сплавы", cost: 200, desc: "Снижает износ ракет", unlocked: false, req: [4], effect: "wear:-0.5" },
        { id: 13, name: "Модульная архитектура", cost: 100, desc: "Увеличивает лимит модулей на ракете", unlocked: false, req: [2], effect: "moduleLimit:+2" }
    ],
    missions: [
        { id: 1, name: "Запустить спутник", reward: 300000, science: 3, fuel: 30, parts: 20, unlocked: true, done: 0, desc: "Обычная орбитальная миссия.", type: "local", prepTime: 30000, launchWindow: 0, prepStart: null, reqReputation: 0 },
        { id: 2, name: "Доставка грузов", reward: 900000, science: 6, fuel: 60, parts: 40, unlocked: false, done: 0, desc: "Доставьте груз на МКС.", type: "local", prepTime: 30000, launchWindow: 0, prepStart: null, reqReputation: 0 },
        { id: 3, name: "Исследование Луны", reward: 2000000, science: 16, fuel: 150, parts: 100, unlocked: false, done: 0, desc: "Отправьте аппарат на Луну.", type: "longrange", prepTime: 60000, launchWindow: 300000, prepStart: null, reqReputation: 10 },
        { id: 4, name: "Пилотируемый полёт", reward: 5000000, science: 40, fuel: 300, parts: 200, unlocked: false, done: 0, desc: "Орбитальный полёт с экипажем.", type: "longrange", prepTime: 60000, launchWindow: 300000, prepStart: null, reqReputation: 25 },
        { id: 5, name: "Миссия на Марс", reward: 5000000, science: 40, fuel: 500, parts: 300, unlocked: false, done: 0, desc: "Отправьте аппарат на Марс.", type: "longrange", prepTime: 120000, launchWindow: 600000, prepStart: null, reqReputation: 35 },
        { id: 6, name: "Исследование астероида", reward: 3000000, science: 30, fuel: 200, parts: 150, unlocked: false, done: 0, desc: "Собрать образцы с астероида.", type: "asteroid", prepTime: 60000, launchWindow: 300000, prepStart: null, reqReputation: 20 },
        { id: 7, name: "Коммерческий спутник", reward: 1500000, science: 4, fuel: 40, parts: 30, unlocked: false, done: 0, desc: "Запуск спутника по контракту.", type: "contract", prepTime: 30000, launchWindow: 0, prepStart: null, reqReputation: 5 },
        { id: 8, name: "Экспедиция к Проксима Центавра", reward: 10000000, science: 100, fuel: 1000, parts: 800, unlocked: false, done: 0, desc: "Межзвёздная экспедиция.", type: "longrange", prepTime: 180000, launchWindow: 900000, prepStart: null, reqReputation: 50 },
        { id: 9, name: "Экспедиция с поиском материалов", reward: 5000000, science: 50, fuel: 500, parts: 300, unlocked: false, done: 0, desc: "Поиск новых химических элементов.", type: "longrange", prepTime: 120000, launchWindow: 600000, prepStart: null, reqReputation: 40 }
    ],
    achievements: [
        { id: 1, name: "Первый запуск", desc: "Выполните первую миссию.", unlocked: false, date: null },
        { id: 2, name: "10 запусков", desc: "Совершите 10 запусков ракет.", unlocked: false, date: null },
        { id: 3, name: "Исследователь", desc: "Откройте 3 технологии.", unlocked: false, date: null },
        { id: 4, name: "Покоритель Луны", desc: "Выполните миссию на Луну.", unlocked: false, date: null },
        { id: 5, name: "Марсианин", desc: "Выполните миссию на Марс.", unlocked: false, date: null },
        { id: 6, name: "Миллиардер", desc: "Иметь более 1 000 000 000 денег.", unlocked: false, date: null },
        { id: 7, name: "Открытие нового элемента", desc: "Открыт новый химический элемент.", unlocked: false, date: null }
    ],
    history: [],
    activeModules: [],
    version: 4
};

let state = JSON.parse(JSON.stringify(defaultState));
let missionProgress = {};
let lastMissionModalRocketId = null;

// ======= STATE MANAGEMENT FUNCTIONS =======
function setState(newState) {
    state = { ...state, ...newState };
    renderAll();
}

function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify("Прогресс сохранён!", "good", 2500);
}

function loadGame() {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
        let loadedState = JSON.parse(d);
        state = { ...defaultState, ...loadedState, shopLocked: loadedState.shopLocked || false };
        state.rockets.forEach(r => { if (!r.prepStart) r.prepStart = null; });
        state.missions.forEach(m => { if (!m.prepStart) m.prepStart = null; });
        renderAll();
        notify("Прогресс загружен!", "good", 2500);
    } else {
        state = JSON.parse(JSON.stringify(defaultState));
        renderAll();
        notify("Нет сохранения!", "bad", 2500);
    }
}

function resetGame() {
    if (confirm("Точно сбросить весь прогресс?")) {
        state = JSON.parse(JSON.stringify(defaultState));
        saveGame();
        renderAll();
        notify("Прогресс сброшен!", "bad", 2500);
    }
}

function checkUnlocks() {
    if (state.research.find(t => t.id === 2 && t.unlocked)) state.missions.find(m => m.id === 2).unlocked = true;
    if (state.research.find(t => t.id === 3 && t.unlocked)) state.missions.find(m => m.id === 3).unlocked = true;
    if (state.research.find(t => t.id === 5 && t.unlocked)) state.missions.find(m => m.id === 4).unlocked = true;
    if (state.research.find(t => t.id === 6 && t.unlocked)) state.missions.find(m => m.id === 5).unlocked = true;
    state.missions.forEach(m => {
        if (!m.unlocked && m.reqTech) {
            const tag = m.reqTech.split(":")[1];
            const tech = state.research.find(t => t.effect && t.effect.includes(tag) && t.unlocked);
            if (tech) m.unlocked = true;
        }
    });
}

function checkAchievements() {
    const now = Date.now();
    let changed = false;
    if (!state.achievements[0].unlocked && state.missions[0].done > 0) {
        state.achievements[0].unlocked = true; state.achievements[0].date = now; changed = true;
        notify("🏆 Открыто достижение: Первый запуск!", "good");
    }
    if (!state.achievements[1].unlocked && state.rockets.reduce((s, r) => s + r.launches, 0) >= 10) {
        state.achievements[1].unlocked = true; state.achievements[1].date = now; changed = true;
        notify("🏆 Открыто достижение: 10 запусков!", "good");
    }
    if (!state.achievements[2].unlocked && state.research.filter(x => x.unlocked).length >= 3) {
        state.achievements[2].unlocked = true; state.achievements[2].date = now; changed = true;
        notify("🏆 Открыто достижение: Исследователь!", "good");
    }
    if (!state.achievements[3].unlocked && state.missions[2].done > 0) {
        state.achievements[3].unlocked = true; state.achievements[3].date = now; changed = true;
        notify("🏆 Открыто достижение: Покоритель Луны!", "good");
    }
    if (!state.achievements[4].unlocked && state.missions[4].done > 0) {
        state.achievements[4].unlocked = true; state.achievements[4].date = now; changed = true;
        notify("🏆 Открыто достижение: Марсианин!", "good");
    }
    if (!state.achievements[5].unlocked && state.money >= 1000000000) {
        state.achievements[5].unlocked = true; state.achievements[5].date = now; changed = true;
        notify("🏆 Открыто достижение: Миллиардер!", "good");
    }
    if (!state.achievements[6].unlocked && state.missions[8].done > 0) {
        state.achievements[6].unlocked = true; state.achievements[6].date = now; changed = true;
        notify("🏆 Открыто достижение: Новый элемент!", "good");
    }
    if (changed) saveGame();
}

// Функция для модификаторов, используемая в missions.js
function techMissionModifiers() {
    let mod = { successMod: 0, wearMod: 1, fuelLeakMod: 1 };
    if (state.research.find(x => x.id === 2 && x.unlocked)) mod.successMod += 0.04;
    if (state.research.find(x => x.id === 5 && x.unlocked)) mod.successMod += 0.04;
    if (state.research.find(x => x.id === 12 && x.unlocked)) mod.wearMod *= 0.5;
    if (state.research.find(x => x.id === 11 && x.unlocked)) mod.fuelLeakMod *= 0.5;
    return mod;
}