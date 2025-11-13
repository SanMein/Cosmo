// Game State Management - Fixed Version
const STORAGE_KEY = "cosmo_sim_save_v2";

// Default state template
const defaultState = {
    // Resources
    money: 1000000,
    fuel: 1000,
    parts: 1000,
    science: 5,
    rocketParts: 5,
    reputation: 5,

    // Storage Limits
    storageLimits: {
        fuel: 10000,
        parts: 10000,
        rocketParts: 500
    },

    // Infrastructure
    launchPadLevel: 1,
    researchLabLevel: 1,
    workshopLevel: 1,

    // Game State
    shopLocked: false,
    gameTime: 0,
    lastUpdate: Date.now(),

    // Rockets
    rockets: [
        {
            id: 1,
            name: "R-0",
            level: 1,
            success: 0.5,
            status: "ready",
            launches: 0,
            lastMission: null,
            modules: [],
            damaged: false,
            condition: 100,
            prepStart: null,
            missionEnd: null,
            currentMission: null
        }
    ],
    nextRocketId: 2,

    // Technologies
    research: [
        { id: 1, name: "Базовый спутник", cost: 20, desc: "Позволяет строить спутники", unlocked: true, req: [], effect: "unlock:satellite", researchTime: 60 },
        { id: 2, name: "Улучшенный двигатель", cost: 50, desc: "Увеличивает шанс успеха всех ракет на +4%", unlocked: false, req: [1], effect: "success:+0.04", researchTime: 120 },
        { id: 3, name: "Дальний радар", cost: 80, desc: "Открывает лунные миссии", unlocked: false, req: [2], effect: "unlock:luna", researchTime: 180 },
        { id: 4, name: "Лёгкие материалы", cost: 100, desc: "Снижает стоимость постройки ракет на 25%", unlocked: false, req: [2], effect: "buildcost:-0.25", researchTime: 240 },
        { id: 5, name: "Астронавигация", cost: 150, desc: "Увеличивает шанс успеха на +4%, открывает пилотируемые миссии", unlocked: false, req: [3], effect: "success:+0.04;unlock:crewed", researchTime: 300 },
        { id: 6, name: "Ядерные двигатели", cost: 300, desc: "Открывает межпланетные миссии", unlocked: false, req: [5], effect: "unlock:interplanet", researchTime: 360 },
        { id: 7, name: "Солнечные панели", cost: 75, desc: "Увеличивает доход от научных миссий", unlocked: false, req: [1], effect: "science:+0.25", researchTime: 150 },
        { id: 8, name: "Термостойкая обшивка", cost: 120, desc: "Снижает вероятность повреждения ракет", unlocked: false, req: [3], effect: "damage:-0.1", researchTime: 200 }
    ],
    researching: null,
    researchProgress: 0,
    researchStart: null,

    // Missions
    missions: [
        {
            id: 1,
            name: "Орбитальный полёт",
            difficulty: "Легкая",
            reward: { money: 50000, science: 2, reputation: 0 },
            cost: { fuel: 100, parts: 50 },
            duration: 30,
            requirements: { rocketLevel: 1 },
            unlocked: true,
            type: "orbital"
        },
        {
            id: 2,
            name: "Спутник связи",
            difficulty: "Легкая",
            reward: { money: 75000, science: 3, reputation: 1 },
            cost: { fuel: 150, parts: 100 },
            duration: 45,
            requirements: { rocketLevel: 1, tech: 1 },
            unlocked: false,
            type: "satellite"
        },
        {
            id: 3,
            name: "Лунная миссия",
            difficulty: "Средняя",
            reward: { money: 150000, science: 5, reputation: 2 },
            cost: { fuel: 300, parts: 200 },
            duration: 120,
            requirements: { rocketLevel: 2, tech: 3 },
            unlocked: false,
            type: "lunar"
        },
        {
            id: 4,
            name: "Марсианская экспедиция",
            difficulty: "Сложная",
            reward: { money: 500000, science: 15, reputation: 5 },
            cost: { fuel: 800, parts: 500 },
            duration: 300,
            requirements: { rocketLevel: 3, tech: 6 },
            unlocked: false,
            type: "interplanetary"
        },
        {
            id: 5,
            name: "Пилотируемый полёт",
            difficulty: "Средняя",
            reward: { money: 200000, science: 8, reputation: 3 },
            cost: { fuel: 400, parts: 300 },
            duration: 180,
            requirements: { rocketLevel: 2, tech: 5 },
            unlocked: false,
            type: "crewed"
        }
    ],

    // Shop Items
    shopItems: [
        {
            id: 1,
            name: "Улучшение стартовой площадки",
            cost: 50000,
            effect: "Увеличивает лимит ракет на 1",
            type: "upgrade",
            maxLevel: 5,
            currentLevel: 1
        },
        {
            id: 2,
            name: "Топливный бак",
            cost: 25000,
            effect: "+1000 к лимиту топлива",
            type: "upgrade",
            maxLevel: 10,
            currentLevel: 1
        },
        {
            id: 3,
            name: "Склад деталей",
            cost: 30000,
            effect: "+1000 к лимиту деталей",
            type: "upgrade",
            maxLevel: 10,
            currentLevel: 1
        },
        {
            id: 4,
            name: "Научная лаборатория",
            cost: 75000,
            effect: "Ускоряет исследования на 10%",
            type: "upgrade",
            maxLevel: 5,
            currentLevel: 1
        },
        {
            id: 5,
            name: "Мастерская",
            cost: 40000,
            effect: "Снижает стоимость ремонта на 10%",
            type: "upgrade",
            maxLevel: 5,
            currentLevel: 1
        }
    ],

    // Statistics
    stats: {
        totalLaunches: 0,
        successfulMissions: 0,
        failedMissions: 0,
        totalScience: 5,
        totalMoney: 1000000,
        daysPlayed: 0,
        totalResearch: 0,
        rocketsBuilt: 1,
        rocketsLost: 0
    },

    // History
    history: [],

    // Settings
    settings: {
        autoSave: true,
        notifications: true,
        sound: true,
        difficulty: "normal"
    }
};

// Global state object
let state = {};

// Deep clone function
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Initialize state with defaults
function initializeState() {
    Object.assign(state, deepClone(defaultState));
    state.lastUpdate = Date.now();
    console.log('State initialized:', state);
}

// Ensure all arrays and objects exist
function ensureArrays() {
    if (!state.rockets || !Array.isArray(state.rockets)) {
        state.rockets = deepClone(defaultState.rockets);
    }
    if (!state.research || !Array.isArray(state.research)) {
        state.research = deepClone(defaultState.research);
    }
    if (!state.missions || !Array.isArray(state.missions)) {
        state.missions = deepClone(defaultState.missions);
    }
    if (!state.shopItems || !Array.isArray(state.shopItems)) {
        state.shopItems = deepClone(defaultState.shopItems);
    }
    if (!state.history || !Array.isArray(state.history)) {
        state.history = deepClone(defaultState.history);
    }
    if (!state.stats || typeof state.stats !== 'object') {
        state.stats = deepClone(defaultState.stats);
    }
    if (!state.storageLimits || typeof state.storageLimits !== 'object') {
        state.storageLimits = deepClone(defaultState.storageLimits);
    }
    if (!state.settings || typeof state.settings !== 'object') {
        state.settings = deepClone(defaultState.settings);
    }

    // Ensure numeric values
    state.money = Number(state.money) || defaultState.money;
    state.fuel = Number(state.fuel) || defaultState.fuel;
    state.parts = Number(state.parts) || defaultState.parts;
    state.science = Number(state.science) || defaultState.science;
    state.rocketParts = Number(state.rocketParts) || defaultState.rocketParts;
    state.reputation = Number(state.reputation) || defaultState.reputation;
    state.launchPadLevel = Number(state.launchPadLevel) || defaultState.launchPadLevel;
    state.researchLabLevel = Number(state.researchLabLevel) || defaultState.researchLabLevel;
    state.workshopLevel = Number(state.workshopLevel) || defaultState.workshopLevel;
    state.nextRocketId = Number(state.nextRocketId) || defaultState.nextRocketId;
    state.gameTime = Number(state.gameTime) || defaultState.gameTime;
}

// Game state management functions
function getRocketLimit() {
    return 3 + (state.launchPadLevel || 1);
}

function canBuildRocket() {
    return (state.rockets?.length || 0) < getRocketLimit();
}

function getRocketCost() {
    const baseCost = { money: 100000, parts: 200, rocketParts: 5 };
    const costReduction = state.research?.find(t => t.id === 4 && t.unlocked) ? 0.25 : 0;

    return {
        money: Math.floor(baseCost.money * (1 - costReduction)),
        parts: Math.floor(baseCost.parts * (1 - costReduction)),
        rocketParts: baseCost.rocketParts
    };
}

function getMissionSuccessChance(rocket, mission) {
    if (!rocket || !mission) return 0.5;

    let baseChance = rocket.success || 0.5;

    // Apply technology bonuses
    const engineTech = state.research?.find(t => t.id === 2 && t.unlocked);
    if (engineTech) baseChance += 0.04;

    const navTech = state.research?.find(t => t.id === 5 && t.unlocked);
    if (navTech) baseChance += 0.04;

    // Apply mission difficulty modifiers
    if (mission.difficulty === "Средняя") baseChance -= 0.15;
    if (mission.difficulty === "Сложная") baseChance -= 0.3;

    // Apply rocket condition modifier
    const conditionModifier = ((rocket.condition || 100) - 50) / 100;
    baseChance += conditionModifier * 0.2;

    // Apply modules bonuses
    if (rocket.modules?.includes("navigation")) baseChance += 0.1;
    if (rocket.modules?.includes("ai")) baseChance += 0.15;

    return Math.max(0.1, Math.min(0.95, baseChance));
}

function getDamageChance(mission) {
    if (!mission) return 0.1;

    let baseChance = 0.1;

    // Apply technology bonuses
    const heatShieldTech = state.research?.find(t => t.id === 8 && t.unlocked);
    if (heatShieldTech) baseChance -= 0.1;

    // Apply mission difficulty modifiers
    if (mission.difficulty === "Средняя") baseChance += 0.1;
    if (mission.difficulty === "Сложная") baseChance += 0.2;

    return Math.max(0.05, baseChance);
}

function addHistoryEntry(type, title, description, success = true) {
    if (!state.history) state.history = [];

    const entry = {
        id: Date.now(),
        type,
        title,
        description,
        success,
        timestamp: Date.now()
    };

    state.history.unshift(entry);

    // Keep only last 50 entries
    if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
    }
}

function updateGameTime() {
    const now = Date.now();
    const elapsed = now - (state.lastUpdate || now);
    state.gameTime = (state.gameTime || 0) + elapsed;
    state.lastUpdate = now;

    // Update days played (every 5 minutes of real time = 1 game day)
    const newDays = Math.floor(state.gameTime / (5 * 60 * 1000));
    if (newDays > (state.stats?.daysPlayed || 0)) {
        state.stats.daysPlayed = newDays;
    }
}

// Initialize state immediately
initializeState();
ensureArrays();

// Export for use in other modules
window.gameState = state;
window.gameFunctions = {
    getRocketLimit,
    canBuildRocket,
    getRocketCost,
    getMissionSuccessChance,
    getDamageChance,
    addHistoryEntry,
    updateGameTime,
    ensureArrays,
    initializeState,
    deepClone
};

console.log('Game state module loaded');