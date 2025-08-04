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

// ======= CANVAS SETUP =======
let animationRunning = true;
const MAX_STARS = 30;
backgroundCanvas.width = window.innerWidth * 0.5;
backgroundCanvas.height = window.innerHeight * 0.5;
rocketCanvas.width = window.innerWidth * 0.5;
rocketCanvas.height = window.innerHeight * 0.5;

backgroundCanvas.style.width = '100%';
backgroundCanvas.style.height = '100%';
rocketCanvas.style.width = '100%';
rocketCanvas.style.height = '100%';

const bgCtx = backgroundCanvas.getContext('2d');
const rocketCtx = rocketCanvas.getContext('2d');

let stars = [];
for (let i = 0; i < MAX_STARS; i++) {
  stars.push({
    x: Math.random() * backgroundCanvas.width,
    y: Math.random() * backgroundCanvas.height,
    radius: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    speed: 0.05 + Math.random() * 0.1
  });
}

let rocket = {
  x: -50,
  y: window.innerHeight * 0.5 - 100,
  speed: 2,
  visible: false
};

let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

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
  nextRocketId: 1,
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
    { id: 1, name: "Запустить спутник", reward: 300000, science: 3, fuel: 30, parts: 20, unlocked: true, done: 0, desc: "Обычная орбитальная миссия.", type: "local", prepTime: 30000, launchWindow: 0, prepStart: null },
    { id: 2, name: "Доставка грузов", reward: 900000, science: 6, fuel: 60, parts: 40, unlocked: false, done: 0, desc: "Доставьте груз на МКС.", type: "local", prepTime: 30000, launchWindow: 0, prepStart: null },
    { id: 3, name: "Исследование Луны", reward: 2000000, science: 16, fuel: 150, parts: 100, unlocked: false, done: 0, desc: "Отправьте аппарат на Луну.", type: "longrange", prepTime: 60000, launchWindow: 300000, prepStart: null },
    { id: 4, name: "Пилотируемый полёт", reward: 5000000, science: 40, fuel: 300, parts: 200, unlocked: false, done: 0, desc: "Орбитальный полёт с экипажем.", type: "longrange", prepTime: 60000, launchWindow: 300000, prepStart: null },
    { id: 5, name: "Миссия на Марс", reward: 5000000, science: 40, fuel: 500, parts: 300, unlocked: false, done: 0, desc: "Отправьте аппарат на Марс.", type: "longrange", prepTime: 120000, launchWindow: 600000, prepStart: null },
    { id: 6, name: "Исследование астероида", reward: 3000000, science: 30, fuel: 200, parts: 150, unlocked: false, done: 0, desc: "Собрать образцы с астероида.", type: "asteroid", prepTime: 60000, launchWindow: 300000, prepStart: null },
    { id: 7, name: "Коммерческий спутник", reward: 1500000, science: 4, fuel: 40, parts: 30, unlocked: false, done: 0, desc: "Запуск спутника по контракту.", type: "contract", prepTime: 30000, launchWindow: 0, prepStart: null },
    { id: 8, name: "Экспедиция к Проксима Центавра", reward: 10000000, science: 100, fuel: 1000, parts: 800, unlocked: false, done: 0, desc: "Межзвёздная экспедиция.", type: "longrange", prepTime: 180000, launchWindow: 900000, prepStart: null },
    { id: 9, name: "Экспедиция с поиском материалов", reward: 5000000, science: 50, fuel: 500, parts: 300, unlocked: false, done: 0, desc: "Поиск новых химических элементов.", type: "longrange", prepTime: 120000, launchWindow: 600000, prepStart: null }
  ],
  achievements: [
    { id: 1, name: "Первый запуск", desc: "Выполните первую миссию.", unlocked: false, date: null },
    { id: 2, name: "10 запусков", desc: "Совершите 10 запусков ракет.", unlocked: false, date: null },
    { id: 3, name: "Исследователь", desc: "Откройте 3 технологии.", unlocked: false, date: null },
    { id: 4, name: "Покоритель Луны", desc: "Выполните миссию на Луну.", unlocked: false, date: null },
    { id: 5, name: "Марсианин", desc: "Выполните миссию на Марс.", unlocked: false, date: null },
    { id: 6, name: "Миллиордер", desc: "Иметь более 1 000 000 000 денег.", unlocked: false, date: null },
    { id: 7, name: "Открытие нового элемента", desc: "Открыт новый химический элемент.", unlocked: false, date: null }
  ],
  history: [],
  activeModules: [],
  version: 4
};

let state = JSON.parse(JSON.stringify(defaultState));
let missionProgress = {};
let lastMissionModalRocketId = null;

// ======= UTILS =======
function setState(newState) {
  state = { ...state, ...newState };
  renderAll();
}

function notify(txt, type = "info", timeout = 3400) {
  const el = document.createElement("div");
  el.className = `notify ${type}`;
  el.innerHTML = txt;
  notifications.prepend(el); // Новые уведомления сверху
  setTimeout(() => el.remove(), timeout + Math.random() * 800);
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

function renderResources() {
  if (!resources) return;
  resources.innerHTML = `
    <span title="Деньги">💵 ${(state.money || 0).toLocaleString()}</span>
    <span title="Топливо">⛽ ${(state.fuel || 0)}/${(state.storageLimits?.fuel || 0)}
      <div class="resource-bar fuel-bar"><div style="width: ${(state.fuel/state.storageLimits.fuel)*100}%"></div></div>
    </span>
    <span title="Детали">🔧 ${(state.parts || 0)}/${(state.storageLimits?.parts || 0)}
      <div class="resource-bar parts-bar"><div style="width: ${(state.parts/state.storageLimits.parts)*100}%"></div></div>
    </span>
    <span title="Наука">🔬 ${(state.science || 0)}</span>
    <span title="Части ракеты">🛰️ ${(state.rocketParts || 0)}/${(state.storageLimits?.rocketParts || 0)}
      <div class="resource-bar rocket-parts-bar"><div style="width: ${(state.rocketParts/state.storageLimits.rocketParts)*100}%"></div></div>
    </span>
    <span title="Репутация">⭐ ${(state.reputation || 0)}</span>
  `;
}

// ======= ANIMATION FUNCTIONS =======
function animateBackground(timestamp) {
  if (!animationRunning || timestamp - lastFrameTime < frameInterval) {
    requestAnimationFrame(animateBackground);
    return;
  }
  lastFrameTime = timestamp;

  bgCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

  stars.forEach(star => {
    bgCtx.beginPath();
    bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    bgCtx.fill();
    star.x -= star.speed;
    if (star.x < 0) star.x = backgroundCanvas.width;
  });

  requestAnimationFrame(animateBackground);
}

function animateRocket(timestamp) {
  if (!animationRunning || timestamp - lastFrameTime < frameInterval) {
    requestAnimationFrame(animateRocket);
    return;
  }

  rocketCtx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);

  if (rocket.visible) {
    rocket.x += rocket.speed;
    if (rocket.x > rocketCanvas.width + 50) {
      rocket.x = -50;
      rocket.visible = false;
    }

    // Корпус ракеты
    rocketCtx.beginPath();
    rocketCtx.moveTo(rocket.x, rocket.y);
    rocketCtx.lineTo(rocket.x - 10, rocket.y + 20);
    rocketCtx.lineTo(rocket.x + 10, rocket.y + 20);
    rocketCtx.closePath();
    rocketCtx.fillStyle = '#ff4500';
    rocketCtx.fill();
    rocketCtx.strokeStyle = '#ffffff';
    rocketCtx.lineWidth = 2;
    rocketCtx.stroke();

    // Пламя с частицами
    for (let i = 0; i < 3; i++) {
      rocketCtx.beginPath();
      rocketCtx.arc(
        rocket.x - 12 + Math.random() * 8,
        rocket.y + 25 + Math.random() * 5,
        1 + Math.random() * 2,
        0, Math.PI * 2
      );
      rocketCtx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${0.5 + Math.random() * 0.5})`;
      rocketCtx.fill();
    }
  }

  requestAnimationFrame(animateRocket);
}

// ======= ROCKETS PANEL =======
function renderRockets() {
  if (!rockets) return;
  rockets.innerHTML = `
    <h2><i class="fas fa-rocket"></i> Ракеты</h2>
    <form class="add-rocket-form" onsubmit="return addRocket(event)">
      <input type="text" id="rocketName" placeholder="Название ракеты" maxlength="18"/>
      <button type="submit"><i class="fas fa-plus"></i> Построить (-1,200,000💵 -350🔩 -50🛰️)</button>
    </form>
    <div class="rocket-list">
      ${state.rockets?.map(r => {
        let prepTimer = '';
        if (r.status === "preparing" && r.prepStart) {
          const elapsed = Date.now() - r.prepStart;
          const prepTime = state.missions.find(m => m.name === r.lastMission)?.prepTime || 0;
          const remaining = Math.max(0, prepTime - elapsed);
          prepTimer = remaining > 0 ? `<div class="timer">Подготовка: ${formatTime(remaining)}</div>` : '';
        }
        return `
          <div class="rocket-card">
            <div><b>🚀 ${r.name}</b> <span class="rocket-id">#${r.id}</span></div>
            <div>Ур.${r.level} | Шанс успеха: ${(r.success * 100).toFixed(0)}% | Запусков: ${r.launches}</div>
            <div>Состояние: ${r.condition || 100}%${r.damaged ? " <i class='fas fa-exclamation-triangle' style='color: var(--danger);'></i>" : ""}</div>
            <div>Статус: <span class="status-${r.status}">${rocketStatusLabel(r.status)}</span></div>
            ${prepTimer}
            ${r.modules && r.modules.length ? `<div>Модули: ${r.modules.join(", ")}</div>` : ""}
            ${r.lastMission ? `<div style="font-size:0.95em;color:var(--muted);">Последняя миссия: ${r.lastMission}</div>` : ""}
            <div class="actions">
              <button onclick="launchRocket(${r.id})" ${r.status !== "ready" || r.damaged ? "disabled" : ""}><i class="fas fa-play"></i> Запуск</button>
              <button onclick="upgradeRocket(${r.id})" ${(state.money < 300000 || state.parts < 1200 || state.science < 10) ? "disabled" : ""}><i class="fas fa-wrench"></i> Улучшить (-300,000💵, -1200🔩, -10🔬)</button>
              <button onclick="disassembleRocket(${r.id})" ${r.status !== "ready" || state.rockets.length <= 1 ? "disabled" : ""}><i class="fas fa-hammer"></i> Разобрать</button>
              <button onclick="editRocket(${r.id})"><i class="fas fa-edit"></i> Редактировать</button>
              <button onclick="techInspectRocket(${r.id})"><i class="fas fa-search"></i> Тех. осмотр</button>
              <button onclick="repairRocket(${r.id})" ${!r.damaged ? "disabled" : ""}><i class="fas fa-tools"></i> Ремонт (-100,000💵, -500🔩, -250🛰️)</button>
            </div>
          </div>
        `;
      }).join("") || ""}
    </div>
  `;
}

// ====== MISSION SELECTION MODAL ======
function renderMissionSelectList(rocket) {
  const missions = state.missions.filter(m => m.unlocked && (!m.launchWindow || Date.now() >= (m.lastLaunch || 0) + m.launchWindow) && state.reputation >= (m.reqReputation || 0));
  return missions.map(m => {
    let launchWindowTimer = '';
    if (m.launchWindow) {
      const lastLaunch = m.lastLaunch || 0;
      const nextWindow = lastLaunch + m.launchWindow;
      const remaining = Math.max(0, nextWindow - Date.now());
      launchWindowTimer = remaining > 0 ? `<div class="timer">Окно запуска через: ${formatTime(remaining)}</div>` : '<div>Окно запуска открыто</div>';
    }
    return `
      <div class="mission-card">
        <div><b>${m.name}</b></div>
        <div class="desc">${m.desc}</div>
        <div>Награда: <span class="reward">${Math.floor(m.reward * (0.8 + Math.random() * 0.4))}💵, ${m.science}🔬</span></div>
        <div>Требует: ${m.fuel}⛽, ${m.parts}🔩, ${m.reqReputation || 0}🏅</div>
        ${launchWindowTimer}
        <button onclick="startMission(${rocket.id},${m.id})" ${(state.fuel < m.fuel || state.parts < m.parts || state.rockets.filter(r => r.status !== "ready").length >= state.launchPadLevel) ? "disabled" : ""}>
          <i class="fas fa-rocket"></i> Запуск
        </button>
      </div>
    `;
  }).join("");
}
function showMissionSelectModal(rocket) {
  lastMissionModalRocketId = rocket.id;
  let html = `<div class="modal-bg"><div class="modal">
    <h3>Выберите миссию для <span style="color:var(--accent)">${rocket.name}</span></h3>
    <div class="mission-list" id="missionListModal"></div>
    <button class="closebtn" onclick="closeModal()"><i class="fas fa-times"></i> Отмена</button>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("missionListModal").innerHTML = renderMissionSelectList(rocket);
}
window.closeModal = function() {
  const m = document.querySelector('.modal-bg');
  if (m) m.remove();
  lastMissionModalRocketId = null;
};
function updateMissionModalIfOpen() {
  if (lastMissionModalRocketId !== null && document.getElementById("missionListModal")) {
    const rocket = state.rockets.find(r => r.id === lastMissionModalRocketId);
    if (rocket) {
      document.getElementById("missionListModal").innerHTML = renderMissionSelectList(rocket);
    }
  }
}

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

// ====== HISTORY ======
function renderHistory() {
  if (!history) return;
  history.innerHTML = `<h3><i class="fas fa-history"></i> История запусков</h3>
    <ul>
      ${state.history.slice(0, 7).map(h => `<li>${h}</li>`).join("")}
    </ul>
  `;
}

// ======= MISSIONS TAB =======
function renderMissionsTab() {
  if (!panelMissions) return;
  panelMissions.innerHTML = `
    <h2><i class="fas fa-map-marked-alt"></i> Миссии</h2>
    <div class="mission-list">
      ${state.missions.filter(m => m.unlocked).map(m => {
        let launchWindowTimer = '';
        if (m.launchWindow) {
          const lastLaunch = m.lastLaunch || 0;
          const nextWindow = lastLaunch + m.launchWindow;
          const remaining = Math.max(0, nextWindow - Date.now());
          launchWindowTimer = remaining > 0 ? `<div class="timer">До окна запуска: ${formatTime(remaining)}</div>` : '<div>Окно запуска открыто</div>';
        }
        return `
          <div class="mission-card">
            <b>${m.name}</b>
            <div class="desc">${m.desc}</div>
            <div>Награда: <span class="reward">${m.reward}💵, ${m.science}🔬</span></div>
            <div>Требует: ${m.fuel}⛽, ${m.parts}🔩, ${m.reqReputation || 0}🏅</div>
            <div>Время подготовки: ${m.prepTime / 1000} сек</div>
            ${m.launchWindow ? launchWindowTimer : ""}
            <div class="done">Выполнено: <span class="good">${m.done}</span></div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// ======= TECHNOLOGY TAB =======
function renderTechTab() {
  if (!panelTech) return;
  panelTech.innerHTML = `
    <h2><i class="fas fa-tree"></i> Дерево технологий</h2>
    <div class="tech-tree">
      ${state.research.map(t => {
        let deps = t.req.length > 0 ?
          `Требует: ${t.req.map(id => state.research.find(tt => tt.id === id).name).join(', ')}` : '';
        let effects = t.effect ? `<div class="desc"><b>Эффект:</b> ${
          t.effect.split(";").map(eff => {
            if (eff.startsWith("unlock:")) {
              let tag = eff.split(":")[1];
              if (tag === "asteroid") return "Открывает миссии на астероиды";
              if (tag === "contract") return "Открывает коммерческие миссии";
              if (tag === "luna") return "Открывает лунные миссии";
              if (tag === "crewed") return "Открывает пилотируемые миссии";
              if (tag === "interplanet") return "Открывает межпланетные миссии";
              if (tag === "satellite") return "Открывает спутники";
              if (tag === "newchem") return "Возможность искать новые химические элементы";
              return "Открывает новые миссии";
            }
            if (eff.startsWith("success:")) return "Шанс успеха +" + (+eff.split(":")[1] * 100).toFixed(0) + "%";
            if (eff.startsWith("buildcost:")) return "Ракеты дешевле на " + (Math.abs(+eff.split(":")[1]) * 100).toFixed(0) + "%";
            if (eff.startsWith("auto:")) return "Автоматизация запусков";
            if (eff.startsWith("fuelLeak:")) return "Утечка топлива -" + (Math.abs(+eff.split(":")[1]) * 100).toFixed(0) + "%";
            if (eff.startsWith("wear:")) return "Износ ракет -" + (Math.abs(+eff.split(":")[1]) * 100).toFixed(0) + "%";
            if (eff.startsWith("moduleLimit:")) return "Лимит модулей +" + eff.split(":")[1];
            return eff;
          }).join("; ")
        }</div>` : "";
        return `
          <div class="tech-card ${t.unlocked ? "unlocked" : "locked"}">
            <b>${t.name}</b>
            <div class="desc">${t.desc}</div>
            <div class="deps">${deps}</div>
            ${effects}
            <div class="cost">${t.unlocked ? "Открыто" : `Стоимость: ${t.cost}🔬`}</div>
            ${!t.unlocked && t.req.every(id => state.research.find(t2 => t2.id === id && t2.unlocked)) ?
              `<button onclick="researchTech(${t.id})" ${state.science < t.cost ? "disabled" : ""}><i class="fas fa-book"></i> Исследовать</button>`
              : ""}
          </div>
        `;
      }).join("")}
    </div>
    <h3>Активные модули</h3>
    <div>
      ${state.activeModules.length === 0 ? "Нет активных модулей." :
        state.activeModules.map((m, i) =>
          `<span class="module">${m} <button onclick="deactivateModule(${i})" style="font-size:0.8em;"><i class="fas fa-times"></i></button></span>`
        ).join(" ")
      }
    </div>
    <button onclick="activateModule()"><i class="fas fa-power-off"></i> Активировать модуль (-100,000💵, -50🔬)</button>
  `;
}
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

// ======= SHOP =======
function renderShopTab() {
  if (!panelShop) return;
  panelShop.innerHTML = `
    <h2><i class="fas fa-store"></i> Магазин ресурсов</h2>
    <div class="shop-list">
      ${[1, 5, 10, 25, 50, 100].map(qty => `
        <div class="shop-card">
          <span class="icon"><i class="fas fa-gas-pump"></i> ⛽</span>
          <b>Топливо x${qty}</b>
          <div class="price">${qty * 30}💵</div>
          <button onclick="buyResource('fuel',${qty})" ${state.shopLocked ? "disabled" : ""}><i class="fas fa-cart-plus"></i> Купить</button>
        </div>
        <div class="shop-card">
          <span class="icon"><i class="fas fa-cogs"></i> 🔩</span>
          <b>Детали x${qty}</b>
          <div class="price">${qty * 40}💵</div>
          <button onclick="buyResource('parts',${qty})" ${state.shopLocked ? "disabled" : ""}><i class="fas fa-cart-plus"></i> Купить</button>
        </div>
        <div class="shop-card">
          <span class="icon"><i class="fas fa-satellite"></i> 🛰️</span>
          <b>Части ракеты x${qty}</b>
          <div class="price">${qty * 50}💵</div>
          <button onclick="buyResource('rocketParts',${qty})" ${state.shopLocked ? "disabled" : ""}><i class="fas fa-cart-plus"></i> Купить</button>
        </div>
      `).join("")}
    </div>
  `;
}
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

// ======= ACHIEVEMENTS =======
function renderStatsTab() {
  if (!panelStats) return;
  panelStats.innerHTML = `
    <h2><i class="fas fa-award"></i> Достижения</h2>
    <div class="achievements-list">
      ${state.achievements.map(a => `
        <div class="achiev-card ${a.unlocked ? 'unlocked' : ''}">
          <b>${a.name}</b>
          <div class="desc">${a.desc}</div>
          ${a.unlocked ? `<div class="date">Открыто: ${formatDate(a.date)}</div>` : ""}
        </div>
      `).join("")}
    </div>
    <h2><i class="fas fa-space-shuttle"></i> Космодром</h2>
    <div>Уровень: ${state.launchPadLevel} (макс. ${state.launchPadLevel} одновременных запусков)</div>
    ${state.launchPadLevel < 5 ? `<button onclick="upgradeLaunchPad()"><i class="fas fa-level-up-alt"></i> Улучшить (-5,000,000💵, -200🔩, -50🛰️)</button>` : ""}
  `;
}
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
  if (!state.achievements[6].unlocked && state.achievements[6].unlocked) {
    state.achievements[6].unlocked = true; state.achievements[6].date = now; changed = true;
    notify("🏆 Открыто достижение: Новый элемент!", "good");
  }
  if (changed) saveGame();
}

// ======= TECHNOLOGY MODIFIERS =======
function techMissionModifiers() {
  let mod = { successMod: 0, wearMod: 1, fuelLeakMod: 1 };
  if (state.research.find(x => x.id === 2 && x.unlocked)) mod.successMod += 0.04;
  if (state.research.find(x => x.id === 5 && x.unlocked)) mod.successMod += 0.04;
  if (state.research.find(x => x.id === 12 && x.unlocked)) mod.wearMod *= 0.5;
  if (state.research.find(x => x.id === 11 && x.unlocked)) mod.fuelLeakMod *= 0.5;
  return mod;
}

// ======= EVENTS =========
function randomEvent() {
  const events = [
    () => {
      const amt = getRandomWeighted(100000, 1000000);
      state.money += amt;
      notify(`<i class="fas fa-gavel"></i> Государство выделило грант +${amt.toLocaleString()}💵!`, "good");
    },
    () => {
      const loss = getRandomWeighted(1, 50);
      state.fuel = Math.max(0, state.fuel - loss);
      notify(`<i class="fas fa-exclamation-circle"></i> Утечка топлива! -${loss}⛽`, "bad");
    },
    () => {
      const add = getRandomWeighted(5, 20);
      state.science += add;
      notify(`<i class="fas fa-lightbulb"></i> Учёные сделали открытие! +${add}🔬`, "good");
    },
    () => {
      const r = state.rockets.find(r => r.status === "ready" && !r.damaged);
      if (r) {
        r.damaged = true;
        notify(`<i class="fas fa-tools"></i> Технический сбой! Ракета "${r.name}" требует ремонта.`, "bad");
      }
    },
    () => {
      const amt = getRandomWeighted(50000, 500000);
      state.money += amt;
      notify(`<i class="fas fa-hand-holding-usd"></i> Частная компания инвестировала +${amt.toLocaleString()}💵!`, "good");
    },
    () => {
      const amt = getRandomWeighted(10, 50);
      if (state.parts + amt <= state.storageLimits.parts) {
        state.parts += amt;
        notify(`<i class="fas fa-truck"></i> Поставщик прислал бесплатные детали! +${amt}🔩`, "good");
      }
    },
    () => {
      state.shopLocked = true;
      notify(`<i class="fas fa-exclamation-triangle"></i> Задержка поставок! Магазин недоступен 2 минуты.`, "bad");
      setTimeout(() => {
        state.shopLocked = false;
        notify(`<i class="fas fa-check"></i> Магазин снова доступен!`, "good");
        renderAll();
      }, 120000);
    }
  ];
  if (Math.random() < 0.2) events[Math.floor(Math.random() * events.length)]();
  renderAll();
}
setInterval(randomEvent, 300000);

// ====== TABS & RENDER =========
function showTab(tab) {
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("visible"));
  document.getElementById("tab-" + tab).classList.add("active");
  document.getElementById("panel-" + tab).classList.add("visible");
}
document.getElementById("tab-main").onclick = () => showTab("main");
document.getElementById("tab-missions").onclick = () => showTab("missions");
document.getElementById("tab-tech").onclick = () => showTab("tech");
document.getElementById("tab-shop").onclick = () => showTab("shop");
document.getElementById("tab-stats").onclick = () => showTab("stats");
document.getElementById("savebtn").onclick = (e) => { e.preventDefault(); saveGame(); };
document.getElementById("loadbtn").onclick = (e) => { e.preventDefault(); loadGame(); };
document.getElementById("resetbtn").onclick = (e) => { e.preventDefault(); resetGame(); };

// =========== MAIN RENDER ===========
setInterval(renderAll, 5000);

function renderAll() {
  renderResources();
  renderRockets();
  renderHistory();
  renderMissionsTab();
  renderTechTab();
  renderShopTab();
  renderStatsTab();
  updateMissionModalIfOpen();
}
window.onload = function() {
  if (localStorage.getItem(STORAGE_KEY)) {
    loadGame();
  } else {
    renderAll();
  }
};

// ====== ROCKET ACTIONS ======
window.addRocket = function(e) {
  e.preventDefault();
  const nm = rocketName.value.trim() || "Ракета-" + state.nextRocketId;
  const buildCost = { money: 1200000, parts: 350, rocketParts: 50 };
  if (state.research.find(t => t.id === 4 && t.unlocked)) {
    buildCost.money *= 0.75;
    buildCost.parts *= 0.75;
    buildCost.rocketParts *= 0.75;
  }
  if (state.money >= buildCost.money && state.parts >= buildCost.parts && state.rocketParts >= buildCost.rocketParts) {
    state.money -= buildCost.money;
    state.parts -= buildCost.parts;
    state.rocketParts -= buildCost.rocketParts;
    state.rockets.push({ id: state.nextRocketId++, name: nm, level: 1, success: 0.5, status: "ready", launches: 0, lastMission: null, modules: [], damaged: false, condition: 100, prepStart: null });
    notify(`Построена новая ракета: <b>${nm}</b>!`, "good");
    renderAll();
  } else {
    notify("Не хватает ресурсов для постройки!", "bad");
  };
};
window.upgradeRocket = function(id) {
  const r = state.rockets.find(r => r.id === id);
  if (state.money >= 300000 && state.parts >= 1200 && state.science >= 10) {
    state.money -= 300000;
    state.parts -= 1200;
    state.science -= 10;
    r.level += 1;
    r.success = +(Math.min(r.success + 0.04, 0.9)).toFixed(3);
    notify(`Ракета <b>${r.name}</b> улучшена!`, "good");
    renderAll();
  } else {
    notify("Не хватает ресурсов для улучшения!", "bad");
  }
};
window.disassembleRocket = function(id) {
  const idx = state.rockets.findIndex(r => r.id === id);
  if (idx < 0) return;
  if (!confirm("Разобрать ракету? Вернёте около половины ресурсов.")) return;
  const buildCost = { money: 1200000, parts: 350, rocketParts: 50 };
  if (state.research.find(t => t.id === 4 && t.unlocked)) {
    buildCost.money *= 0.75;
    buildCost.parts *= 0.75;
    buildCost.rocketParts *= 0.75;
  }
  state.money += Math.floor(buildCost.money * 0.5);
  state.parts += Math.floor(buildCost.parts * 0.5);
  state.rocketParts += Math.floor(buildCost.rocketParts * 0.5);
  state.rockets.splice(idx, 1);
  notify("Ракета разобрана, часть ресурсов возвращена!", "good");
  renderAll();
};
window.editRocket = function(id) {
  const r = state.rockets.find(r => r.id === id);
  const maxModules = state.research.find(t => t.id === 13 && t.unlocked) ? 4 : 2;
  let modulesList = ["Улучшенный компьютер", "Теплозащита", "Связь", "Маневровый модуль", "Датчик радиации"];
  let html = `<div class="modal-bg"><div class="modal">
    <h3>Редактирование: <input id="rocketRename" style="width:120px" value="${r.name}"></h3>
    <div>Модули (макс. ${maxModules}):<br>
      ${modulesList.map(m => `
        <label><input type="checkbox" class="editModule" value="${m}" ${r.modules && r.modules.includes(m) ? "checked" : ""} ${r.modules.length >= maxModules && !r.modules.includes(m) ? "disabled" : ""}/> ${m} (-50,000💵, -100🔩)</label><br>
      `).join("")}
    </div>
    <button onclick="saveRocketEdit(${r.id})"><i class="fas fa-save"></i> Сохранить</button>
    <button class="closebtn" onclick="closeModal()"><i class="fas fa-times"></i> Отмена</button>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
};
window.saveRocketEdit = function(id) {
  const r = state.rockets.find(r => r.id === id);
  const newModules = Array.from(document.querySelectorAll(".editModule:checked")).map(x => x.value);
  const maxModules = state.research.find(t => t.id === 13 && t.unlocked) ? 4 : 2;
  if (newModules.length > maxModules) {
    notify(`Максимум ${maxModules} модуля!`, "bad");
    return;
  }
  const costPerModule = { money: 50000, parts: 100 };
  const totalCost = { money: costPerModule.money * newModules.length, parts: costPerModule.parts * newModules.length };
  if (state.money >= totalCost.money && state.parts >= totalCost.parts) {
    state.money -= totalCost.money;
    state.parts -= totalCost.parts;
    r.name = document.getElementById("rocketRename").value.trim() || r.name;
    r.modules = newModules;
    closeModal();
    notify("Изменения сохранены!", "good");
    renderAll();
  } else {
    notify("Не хватает ресурсов для установки модулей!", "bad");
  }
};
window.techInspectRocket = function(id) {
  const r = state.rockets.find(r => r.id === id);
  let html = `<div class="modal-bg"><div class="modal">
    <h3>Технический осмотр: ${r.name}</h3>
    <div>Уровень: ${r.level}</div>
    <div>Состояние: ${r.condition}%${r.damaged ? " <i class='fas fa-exclamation-triangle' style='color: var(--danger);'></i>" : ""}</div>
    <div>Статус: ${rocketStatusLabel(r.status)}</div>
    <div>Шанс успеха: ${(r.success * 100).toFixed(1)}%</div>
    <div>Запусков: ${r.launches}</div>
    <div>Модули: ${r.modules && r.modules.length ? r.modules.join(", ") : "нет"}</div>
    <div>Последняя миссия: ${r.lastMission || "-"}</div>
    <button class="closebtn" onclick="closeModal()"><i class="fas fa-times"></i> Закрыть</button>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
};
window.repairRocket = function(id) {
  const r = state.rockets.find(r => r.id === id);
  if (r.damaged && state.parts >= 500 && state.rocketParts >= 250 && state.money >= 100000) {
    state.parts -= 500;
    state.rocketParts -= 250;
    state.money -= 100000;
    r.damaged = false;
    r.condition = 50;
    notify("Ракета отремонтирована!", "good");
    renderAll();
  } else if (r.damaged) {
    notify("Не хватает ресурсов для ремонта!", "bad");
  }
};
function rocketStatusLabel(st) {
  if (st === "ready") return "Готова";
  if (st === "preparing") return "Подготовка";
  if (st === "launched") return "В полёте";
  if (st === "exploring") return "Выполняет миссию";
  if (st === "failed") return "Провал";
  return st;
}
window.launchRocket = function(id) {
  const r = state.rockets.find(r => r.id === id);
  if (!r || r.status !== "ready" || r.damaged) return;
  showMissionSelectModal(r);
};

// ======= ANIMATION CONTROL =======
document.addEventListener('visibilitychange', () => {
  animationRunning = !document.hidden;
  if (animationRunning) {
    lastFrameTime = performance.now();
    animateBackground();
    animateRocket();
  }
});

window.addEventListener('beforeunload', () => {
  animationRunning = false;
  bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  rocketCtx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);
});

// Запуск анимаций
animateBackground();
animateRocket();

// Инициализация игры
window.onload = function() {
  if (localStorage.getItem(STORAGE_KEY)) {
    loadGame();
  } else {
    renderAll();
  }
};