// ====== MISSION SELECTION MODAL ======
function renderMissionSelectList(rocket) {
    const missions = state.missions.filter(m => m.unlocked && (!m.launchWindow || Date.now() >= (m.lastLaunch || 0) + m.launchWindow) && state.reputation >= (m.reqReputation || 0));
    return missions.map(m => {
        let launchWindowTimer = '';
        if (m.launchWindow) {
            const lastLaunch = m.lastLaunch || 0;
            const nextWindow = lastLaunch + m.launchWindow;
            const remaining = Math.max(0, nextWindow - Date.now());
            launchWindowTimer = remaining > 0 ? ` <div class="timer">Окно запуска через: ${formatTime(remaining)}</div>` : ' <div>Окно запуска открыто</div>';
        }
        return `
           <div class="mission-card">
             <div> <b>${m.name}</b> </div>
             <div class="desc">${m.desc}</div>
             <div>Награда:  <span class="reward">${Math.floor(m.reward * (0.8 + Math.random() * 0.4))}₽, ${m.science}🔬</span> </div>
             <div>Требует: ${m.fuel}⛽, ${m.parts}🔧, ${m.reqReputation || 0}🏅</div>
            ${launchWindowTimer}
             <button onclick="startMission(${rocket.id},${m.id})" ${(state.fuel < m.fuel || state.parts < m.parts || state.rockets.filter(r => r.status !== "ready").length >= state.launchPadLevel) ? "disabled" : " "}>
               <i class="fas fa-rocket"></i> Запуск
             </button>
           </div>
        `;
    }).join(" ");
}

function showMissionSelectModal(rocket) {
    lastMissionModalRocketId = rocket.id;
    let html = ` <div class="modal-bg"> <div class="modal">
         <h3>Выберите миссию для <span style="color:var(--accent)">${rocket.name}</span></h3>
         <div class="mission-list" id="missionListModal"> </div>
         <button class="closebtn" onclick="closeModal()"> <i class="fas fa-times"></i> Отмена</button>
       </div> </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("missionListModal").innerHTML = renderMissionSelectList(rocket);
}

window.closeModal = function() {
    const m = document.querySelector('.modal-bg');
    if (m) m.remove();
    lastMissionModalRocketId = null;
};

// ====== ROCKET ACTIONS ======
window.addRocket = function(e) {
    e.preventDefault();
    const nm = document.getElementById('rocketName').value.trim() || "Ракета-" + state.nextRocketId;
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
    let html = ` <div class="modal-bg"> <div class="modal">
         <h3>Редактирование:  <input id="rocketRename" style="width:120px" value="${r.name}"> </h3>
         <div>Модули (макс. ${maxModules}): <br>
          ${modulesList.map(m => `
             <label> <input type="checkbox" class="editModule" value="${m}" ${r.modules && r.modules.includes(m) ? "checked" : " "} ${r.modules.length >= maxModules && !r.modules.includes(m) ? "disabled" : " "}/> ${m} (-50,000₽, -100🔧)</label> <br>
          `).join(" ")}
         </div>
         <button onclick="saveRocketEdit(${r.id})"> <i class="fas fa-save"></i> Сохранить</button>
         <button class="closebtn" onclick="closeModal()"> <i class="fas fa-times"></i> Отмена</button>
       </div> </div>`;
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
    let html = ` <div class="modal-bg"> <div class="modal">
         <h3>Технический осмотр: ${r.name}</h3>
         <div>Уровень: ${r.level}</div>
         <div>Состояние: ${r.condition}%${r.damaged ? "  <i class='fas fa-exclamation-triangle' style='color: var(--danger);'></i> " : " "}</div>
         <div>Статус: ${rocketStatusLabel(r.status)}</div>
         <div>Шанс успеха: ${(r.success * 100).toFixed(1)}%</div>
         <div>Запусков: ${r.launches}</div>
         <div>Модули: ${r.modules && r.modules.length ? r.modules.join(", ") : "нет"}</div>
         <div>Последняя миссия: ${r.lastMission || "-"}</div>
         <button class="closebtn" onclick="closeModal()"> <i class="fas fa-times"></i> Закрыть</button>
       </div> </div>`;
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

window.launchRocket = function(id) {
    const r = state.rockets.find(r => r.id === id);
    if (!r || r.status !== "ready" || r.damaged) return;
    showMissionSelectModal(r);
};