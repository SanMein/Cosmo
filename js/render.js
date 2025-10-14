// ======= RENDER FUNCTIONS =======

function renderResources() {
    if (!resources) return;
    resources.innerHTML = `
         <span title="Деньги">💵 ${(state.money || 0).toLocaleString()}</span>
         <span title="Топливо">⛽ ${(state.fuel || 0)}/${(state.storageLimits?.fuel || 0)}
           <div class="resource-bar fuel-bar"> <div style="width: ${(state.fuel/state.storageLimits.fuel)*100}%"></div> </div>
         </span>
         <span title="Детали">🔧 ${(state.parts || 0)}/${(state.storageLimits?.parts || 0)}
           <div class="resource-bar parts-bar"> <div style="width: ${(state.parts/state.storageLimits.parts)*100}%"></div> </div>
         </span>
         <span title="Наука">🔬 ${(state.science || 0)}</span>
         <span title="Части ракеты">🛰️ ${(state.rocketParts || 0)}/${(state.storageLimits?.rocketParts || 0)}
           <div class="resource-bar rocket-parts-bar"> <div style="width: ${(state.rocketParts/state.storageLimits.rocketParts)*100}%"></div> </div>
         </span>
         <span title="Репутация">⭐ ${(state.reputation || 0)}</span>
    `;
}

function renderRockets() {
    if (!rockets) return;
    rockets.innerHTML = `
         <h2><i class="fas fa-rocket"></i> Ракеты</h2>
         <form class="add-rocket-form" onsubmit="return addRocket(event)">
           <input type="text" id="rocketName" placeholder="Название ракеты" maxlength="18"/>
           <button type="submit"> <i class="fas fa-plus"></i> Построить (-1,200,000₽ -350🔧 -50🛰️)</button>
         </form>
         <div class="rocket-list">
          ${state.rockets?.map(r => {
            let prepTimer = '';
            if (r.status === "preparing" && r.prepStart) {
              const elapsed = Date.now() - r.prepStart;
              const prepTime = state.missions.find(m => m.name === r.lastMission)?.prepTime || 0;
              const remaining = Math.max(0, prepTime - elapsed);
              prepTimer = remaining > 0 ? ` <div class="timer">Подготовка: ${formatTime(remaining)}</div>` : '';
            }
            return `
               <div class="rocket-card">
                 <div> <b>🚀 ${r.name}</b>  <span class="rocket-id">#${r.id}</span> </div>
                 <div>Ур.${r.level} | Шанс успеха: ${(r.success * 100).toFixed(0)}% | Запусков: ${r.launches}</div>
                 <div>Состояние: ${r.condition || 100}%${r.damaged ? "  <i class='fas fa-exclamation-triangle' style='color: var(--danger);'></i> " : " "}</div>
                 <div>Статус:  <span class="status-${r.status}">${rocketStatusLabel(r.status)}</span> </div>
                ${prepTimer}
                ${r.modules && r.modules.length ? ` <div>Модули: ${r.modules.join(", ")}</div>` : " "}
                ${r.lastMission ? ` <div style="font-size:0.95em;color:var(--muted);">Последняя миссия: ${r.lastMission}</div>` : " "}
                 <div class="actions">
                   <button onclick="launchRocket(${r.id})" ${r.status !== "ready" || r.damaged ? "disabled" : " "}> <i class="fas fa-play"></i> Запуск</button>
                   <button onclick="upgradeRocket(${r.id})" ${(state.money < 300000 || state.parts < 1200 || state.science < 10) ? "disabled" : " "}> <i class="fas fa-wrench"></i> Улучшить (-300,000₽, -1200🔧, -10🔬)</button>
                   <button onclick="disassembleRocket(${r.id})" ${r.status !== "ready" || state.rockets.length <= 1 ? "disabled" : " "}> <i class="fas fa-hammer"></i> Разобрать</button>
                   <button onclick="editRocket(${r.id})"> <i class="fas fa-edit"></i> Редактировать</button>
                   <button onclick="techInspectRocket(${r.id})"> <i class="fas fa-search"></i> Тех. осмотр</button>
                   <button onclick="repairRocket(${r.id})" ${!r.damaged ? "disabled" : " "}> <i class="fas fa-tools"></i> Ремонт (-100,000₽, -500🔧, -250🛰️)</button>
                 </div>
               </div>
            `;
          }).join(" ") || " "}
         </div>
    `;
}

function renderHistory() {
    if (!history) return;
    history.innerHTML = ` <h3><i class="fas fa-history"></i> История запусков</h3>
         <ul>
          ${state.history.slice(0, 7).map(h => ` <li>${h}</li>`).join(" ")}
         </ul>
    `;
}

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
              launchWindowTimer = remaining > 0 ? ` <div class="timer">До окна запуска: ${formatTime(remaining)}</div>` : ' <div>Окно запуска открыто</div>';
            }
            return `
               <div class="mission-card">
                 <b>${m.name}</b>
                 <div class="desc">${m.desc}</div>
                 <div>Награда:  <span class="reward">${m.reward}₽, ${m.science}🔬</span> </div>
                 <div>Требует: ${m.fuel}⛽, ${m.parts}🔧, ${m.reqReputation || 0}🏅</div>
                 <div>Время подготовки: ${m.prepTime / 1000} сек</div>
                ${m.launchWindow ? launchWindowTimer : " "}
                 <div class="done">Выполнено:  <span class="good">${m.done}</span> </div>
               </div>
            `;
          }).join(" ")}
         </div>
    `;
}

function renderTechTab() {
    if (!panelTech) return;
    panelTech.innerHTML = `
         <h2><i class="fas fa-tree"></i> Дерево технологий</h2>
         <div class="tech-tree">
          ${state.research.map(t => {
            let deps = t.req.length > 0 ?
              `Требует: ${t.req.map(id => state.research.find(tt => tt.id === id).name).join(', ')}` : '';
            let effects = t.effect ? ` <div class="desc"> <b>Эффект:</b> ${
              t.effect.split(";").map(eff => {
                if(eff.startsWith("unlock:")) {
                  let tag = eff.split(":")[1];
                  if(tag === "asteroid") return "Открывает миссии на астероиды";
                  if(tag === "contract") return "Открывает коммерческие миссии";
                  if(tag === "luna") return "Открывает лунные миссии";
                  if(tag === "crewed") return "Открывает пилотируемые миссии";
                  if(tag === "interplanet") return "Открывает межпланетные миссии";
                  if(tag === "satellite") return "Открывает спутники";
                  if(tag === "newchem") return "Возможность искать новые химические элементы";
                  return "Открывает новые миссии";
                }
                if(eff.startsWith("success:")) return "Шанс успеха +" + (+eff.split(":")[1] * 100).toFixed(0) + "%";
                if(eff.startsWith("buildcost:")) return "Ракеты дешевле на " + (Math.abs(+eff.split(":")[1]) * 100).toFixed(0) + "%";
                if(eff.startsWith("auto:")) return "Автоматизация запусков";
                if(eff.startsWith("fuelLeak:")) return "Утечка топлива -" + (Math.abs(+eff.split(":")[1]) * 100).toFixed(0) + "%";
                if(eff.startsWith("wear:")) return "Износ ракет -" + (Math.abs(+eff.split(":")[1]) * 100).toFixed(0) + "%";
                if(eff.startsWith("moduleLimit:")) return "Лимит модулей +" + eff.split(":")[1];
                return eff;
              }).join("; ")
            } </div>` : " ";
            return `
               <div class="tech-card ${t.unlocked ? "unlocked" : "locked"}">
                 <b>${t.name}</b>
                 <div class="desc">${t.desc}</div>
                 <div class="deps">${deps}</div>
                ${effects}
                 <div class="cost">${t.unlocked ? "Открыто" : `Стоимость: ${t.cost}🔬`}</div>
                ${!t.unlocked && t.req.every(id => state.research.find(t2 => t2.id === id && t2.unlocked)) ?
                  ` <button onclick="researchTech(${t.id})" ${state.science < t.cost ? "disabled" : " "}> <i class="fas fa-book"></i> Исследовать</button>`
                  : " "}
               </div>
            `;
          }).join(" ")}
         </div>
         <h3>Активные модули</h3>
         <div>
          ${state.activeModules.length === 0 ? "Нет активных модулей." :
            state.activeModules.map((m, i) =>
              ` <span class="module">${m} <button onclick="deactivateModule(${i})" style="font-size:0.8em;"> <i class="fas fa-times"></i> </button></span>`
            ).join("  ")
          }
         </div>
         <button onclick="activateModule()"> <i class="fas fa-power-off"></i> Активировать модуль (-100,000₽, -50🔬)</button>
    `;
}

function renderShopTab() {
    if (!panelShop) return;
    panelShop.innerHTML = `
         <h2><i class="fas fa-store"></i> Магазин ресурсов</h2>
         <div class="shop-list">
          ${[1, 5, 10, 25, 50, 100].map(qty => `
             <div class="shop-card">
               <span class="icon"> <i class="fas fa-gas-pump"></i> ⛽</span>
               <b>Топливо x${qty}</b>
               <div class="price">${qty * 30}₽</div>
               <button onclick="buyResource('fuel',${qty})" ${state.shopLocked ? "disabled" : " "}> <i class="fas fa-cart-plus"></i> Купить</button>
             </div>
             <div class="shop-card">
               <span class="icon"> <i class="fas fa-cogs"></i> 🔩</span>
               <b>Детали x${qty}</b>
               <div class="price">${qty * 40}₽</div>
               <button onclick="buyResource('parts',${qty})" ${state.shopLocked ? "disabled" : " "}> <i class="fas fa-cart-plus"></i> Купить</button>
             </div>
             <div class="shop-card">
               <span class="icon"> <i class="fas fa-satellite"></i> 🛰️</span>
               <b>Части ракеты x${qty}</b>
               <div class="price">${qty * 50}₽</div>
               <button onclick="buyResource('rocketParts',${qty})" ${state.shopLocked ? "disabled" : " "}> <i class="fas fa-cart-plus"></i> Купить</button>
             </div>
          `).join(" ")}
         </div>
    `;
}

function renderStatsTab() {
    if (!panelStats) return;
    panelStats.innerHTML = `
         <h2><i class="fas fa-award"></i> Достижения</h2>
         <div class="achievements-list">
          ${state.achievements.map(a => `
             <div class="achiev-card ${a.unlocked ? 'unlocked' : ''}">
               <b>${a.name}</b>
               <div class="desc">${a.desc}</div>
              ${a.unlocked ? ` <div class="date">Открыто: ${formatDate(a.date)}</div>` : " "}
             </div>
          `).join(" ")}
         </div>
         <h2><i class="fas fa-space-shuttle"></i> Космодром</h2>
         <div>Уровень: ${state.launchPadLevel} (макс. ${state.launchPadLevel} одновременных запусков)</div>
        ${state.launchPadLevel < 5 ? ` <button onclick="upgradeLaunchPad()"> <i class="fas fa-level-up-alt"></i> Улучшить (-5,000,000₽, -200🔧, -50🛰️)</button>` : " "}
    `;
}

function updateMissionModalIfOpen() {
    if (lastMissionModalRocketId !== null && document.getElementById("missionListModal")) {
        const rocket = state.rockets.find(r => r.id === lastMissionModalRocketId);
        if (rocket) {
            document.getElementById("missionListModal").innerHTML = renderMissionSelectList(rocket);
        }
    }
}

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