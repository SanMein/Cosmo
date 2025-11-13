// Rockets Management Module
class RocketsModule {
    constructor() {
        this.rocketListEl = document.getElementById('rocket-list');
        this.modules = [
            { id: 'navigation', name: 'Навигационная система', cost: { money: 50000, parts: 100 }, effect: '+10% к успеху' },
            { id: 'ai', name: 'Искусственный интеллект', cost: { money: 75000, science: 5 }, effect: '+15% к успеху' },
            { id: 'solar', name: 'Солнечные панели', cost: { money: 30000, parts: 50 }, effect: '+25% к науке' },
            { id: 'comm', name: 'Система связи', cost: { money: 40000, parts: 80 }, effect: '+1 к репутации' },
            { id: 'repair', name: 'Ремонтный дрон', cost: { money: 60000, parts: 120 }, effect: 'Самовосстановление' }
        ];
    }

    render() {
        if (!this.rocketListEl) return;

        const rocketLimit = gameFunctions.getRocketLimit();
        const maxModules = state.research.find(t => t.id === 13 && t.unlocked) ? 4 : 2;

        this.rocketListEl.innerHTML = state.rockets.map(rocket => `
            <div class="rocket-card" data-rocket-id="${rocket.id}">
                <div class="card-header">
                    <div class="rocket-name">
                        <i class="fas fa-rocket"></i>
                        ${rocket.name}
                        ${rocket.damaged ? '<i class="fas fa-exclamation-triangle" style="color: var(--danger); margin-left: 0.5rem;"></i>' : ''}
                    </div>
                    ${gameUtils.createStatusBadge(rocket.status)}
                </div>

                <div class="rocket-details">
                    <div class="rocket-detail">
                        <span class="rocket-detail-label">Уровень:</span>
                        <span class="rocket-detail-value">${rocket.level}</span>
                    </div>
                    <div class="rocket-detail">
                        <span class="rocket-detail-label">Запусков:</span>
                        <span class="rocket-detail-value">${rocket.launches}</span>
                    </div>
                    <div class="rocket-detail">
                        <span class="rocket-detail-label">Шанс успеха:</span>
                        <span class="rocket-detail-value">${(rocket.success * 100).toFixed(1)}%</span>
                    </div>
                    <div class="rocket-detail">
                        <span class="rocket-detail-label">Состояние:</span>
                        <span class="rocket-detail-value">
                            ${rocket.condition}%
                            ${rocket.condition < 30 ? '<i class="fas fa-exclamation-circle" style="color: var(--warning);"></i>' : ''}
                        </span>
                    </div>
                    ${rocket.modules.length > 0 ? `
                        <div class="rocket-detail">
                            <span class="rocket-detail-label">Модули:</span>
                            <span class="rocket-detail-value">${rocket.modules.map(m => this.getModuleName(m)).join(', ')}</span>
                        </div>
                    ` : ''}
                    ${rocket.currentMission ? `
                        <div class="rocket-detail">
                            <span class="rocket-detail-label">Текущая миссия:</span>
                            <span class="rocket-detail-value">${rocket.currentMission}</span>
                        </div>
                        ${rocket.missionEnd ? `
                            <div class="rocket-detail">
                                <span class="rocket-detail-label">Завершение:</span>
                                <span class="rocket-detail-value">${this.formatTimeRemaining(rocket.missionEnd)}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>

                <div class="rocket-actions">
                    ${rocket.status === 'ready' && !rocket.damaged ? `
                        <button class="btn btn-primary" onclick="rocketsModule.launchRocket(${rocket.id})">
                            <i class="fas fa-play"></i> Запуск
                        </button>
                    ` : ''}

                    ${rocket.status === 'preparing' ? `
                        <button class="btn btn-muted" disabled>
                            <i class="fas fa-hourglass-half"></i> Подготовка...
                        </button>
                    ` : ''}

                    ${rocket.status === 'launched' || rocket.status === 'exploring' ? `
                        <button class="btn btn-muted" disabled>
                            <i class="fas fa-satellite"></i> В полёте...
                        </button>
                    ` : ''}

                    <button class="btn btn-info" onclick="rocketsModule.techInspectRocket(${rocket.id})">
                        <i class="fas fa-search"></i> Осмотр
                    </button>

                    <button class="btn btn-warning" onclick="rocketsModule.editRocket(${rocket.id})"
                            ${rocket.status !== 'ready' ? 'disabled' : ''}>
                        <i class="fas fa-edit"></i> Модули
                    </button>

                    ${rocket.damaged ? `
                        <button class="btn btn-danger" onclick="rocketsModule.repairRocket(${rocket.id})">
                            <i class="fas fa-tools"></i> Ремонт
                        </button>
                    ` : ''}

                    ${rocket.status === 'ready' && !rocket.damaged ? `
                        <button class="btn btn-muted" onclick="rocketsModule.scrapRocket(${rocket.id})">
                            <i class="fas fa-trash"></i> Утилизировать
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('') || `
            <div class="card" style="text-align: center; padding: 2rem;">
                <i class="fas fa-rocket" style="font-size: 3rem; color: var(--muted); margin-bottom: 1rem;"></i>
                <h3>Нет ракет</h3>
                <p>Создайте свою первую ракету, чтобы начать космическую программу!</p>
            </div>
        `;
    }

    getModuleName(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        return module ? module.name : moduleId;
    }

    formatTimeRemaining(endTime) {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return 'Завершено';

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    launchRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket || rocket.status !== 'ready' || rocket.damaged) return;

        // Show mission selection modal
        this.showMissionSelectModal(rocket);
    }

    showMissionSelectModal(rocket) {
        const availableMissions = state.missions.filter(mission =>
            mission.unlocked &&
            rocket.level >= mission.requirements.rocketLevel &&
            !state.rockets.some(r => r.currentMission === mission.id)
        );

        if (availableMissions.length === 0) {
            gameUtils.notify('Нет доступных миссий для этой ракеты!', 'bad');
            return;
        }

        const missionOptions = availableMissions.map(mission => {
            const successChance = gameFunctions.getMissionSuccessChance(rocket, mission);
            const damageChance = gameFunctions.getDamageChance(mission);

            return `
                <div class="mission-option" onclick="rocketsModule.selectMission(${rocket.id}, ${mission.id})">
                    <div class="mission-option-header">
                        <strong>${mission.name}</strong>
                        <span class="mission-difficulty ${mission.difficulty.toLowerCase()}">${mission.difficulty}</span>
                    </div>
                    <div class="mission-option-details">
                        <div>Длительность: ${gameUtils.formatTime(mission.duration)}</div>
                        <div>Шанс успеха: ${(successChance * 100).toFixed(1)}%</div>
                        <div>Риск повреждения: ${(damageChance * 100).toFixed(1)}%</div>
                    </div>
                    <div class="mission-option-rewards">
                        ${mission.reward.money ? `<span><i class="fas fa-coins"></i> +${gameUtils.formatNumber(mission.reward.money)}</span>` : ''}
                        ${mission.reward.science ? `<span><i class="fas fa-atom"></i> +${mission.reward.science}</span>` : ''}
                        ${mission.reward.reputation ? `<span><i class="fas fa-star"></i> +${mission.reward.reputation}</span>` : ''}
                    </div>
                    <div class="mission-option-cost">
                        <span>Стоимость: </span>
                        ${mission.cost.fuel ? `<span><i class="fas fa-gas-pump"></i> ${mission.cost.fuel}</span>` : ''}
                        ${mission.cost.parts ? `<span><i class="fas fa-cog"></i> ${mission.cost.parts}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = `
            <div class="mission-selection">
                <h4>Выберите миссию для ракеты "${rocket.name}"</h4>
                <div class="mission-options">
                    ${missionOptions}
                </div>
            </div>
        `;

        gameUtils.showModal('Выбор миссии', modalContent);
    }

    selectMission(rocketId, missionId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        const mission = state.missions.find(m => m.id === missionId);

        if (!rocket || !mission) return;

        // Check resources
        if (!gameUtils.hasResources(mission.cost)) {
            gameUtils.notify('Недостаточно ресурсов для этой миссии!', 'bad');
            return;
        }

        // Spend resources
        gameUtils.spendResources(mission.cost);

        // Start mission
        rocket.status = 'launched';
        rocket.currentMission = mission.id;
        rocket.missionEnd = Date.now() + mission.duration * 1000;

        gameUtils.notify(`Ракета "${rocket.name}" запущена на миссию "${mission.name}"!`, 'good');
        gameFunctions.addHistoryEntry('launch', 'Запуск ракеты', `${rocket.name} → ${mission.name}`, true);

        gameUtils.closeModal();
        this.render();

        // Trigger animation
        if (window.spaceBackground) {
            window.spaceBackground.triggerLaunch(mission.type);
        }
    }

    techInspectRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket) return;

        const modulesList = rocket.modules.length > 0 ?
            rocket.modules.map(m => this.getModuleName(m)).join(', ') : 'нет';

        const modalContent = `
            <div class="tech-inspect">
                <div class="inspect-detail">
                    <label>Уровень:</label>
                    <span>${rocket.level}</span>
                </div>
                <div class="inspect-detail">
                    <label>Состояние:</label>
                    <span>${rocket.condition}% ${rocket.damaged ? '<i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>' : ''}</span>
                </div>
                <div class="inspect-detail">
                    <label>Статус:</label>
                    <span>${gameUtils.createStatusBadge(rocket.status)}</span>
                </div>
                <div class="inspect-detail">
                    <label>Шанс успеха:</label>
                    <span>${(rocket.success * 100).toFixed(1)}%</span>
                </div>
                <div class="inspect-detail">
                    <label>Запусков:</label>
                    <span>${rocket.launches}</span>
                </div>
                <div class="inspect-detail">
                    <label>Модули:</label>
                    <span>${modulesList}</span>
                </div>
                <div class="inspect-detail">
                    <label>Последняя миссия:</label>
                    <span>${rocket.lastMission || '-'}</span>
                </div>
                ${rocket.currentMission ? `
                    <div class="inspect-detail">
                        <label>Текущая миссия:</label>
                        <span>${rocket.currentMission}</span>
                    </div>
                ` : ''}
            </div>
        `;

        gameUtils.showModal(`Технический осмотр: ${rocket.name}`, modalContent);
    }

    editRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket || rocket.status !== 'ready') return;

        const maxModules = state.research.find(t => t.id === 13 && t.unlocked) ? 4 : 2;
        const availableModules = this.modules.filter(module =>
            gameUtils.hasResources(module.cost)
        );

        const moduleOptions = availableModules.map(module => {
            const isSelected = rocket.modules.includes(module.id);
            const canAfford = gameUtils.hasResources(module.cost);

            return `
                <div class="module-option ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}"
                     onclick="rocketsModule.toggleModule(${rocketId}, '${module.id}', ${canAfford})">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} ${!canAfford ? 'disabled' : ''}>
                    <div class="module-info">
                        <div class="module-name">${module.name}</div>
                        <div class="module-effect">${module.effect}</div>
                        <div class="module-cost">
                            ${module.cost.money ? `<span><i class="fas fa-coins"></i> ${gameUtils.formatNumber(module.cost.money)}</span>` : ''}
                            ${module.cost.parts ? `<span><i class="fas fa-cog"></i> ${module.cost.parts}</span>` : ''}
                            ${module.cost.science ? `<span><i class="fas fa-atom"></i> ${module.cost.science}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = `
            <div class="rocket-edit">
                <div class="form-group">
                    <label class="form-label">Название ракеты:</label>
                    <input type="text" id="rocket-rename-${rocketId}" class="form-input" value="${rocket.name}" maxlength="20">
                </div>

                <div class="form-group">
                    <label class="form-label">Установка модулей (${rocket.modules.length}/${maxModules}):</label>
                    <div class="module-options">
                        ${moduleOptions}
                    </div>
                    <div class="module-info">
                        <i class="fas fa-info-circle"></i>
                        Модули улучшают характеристики ракеты. Можно установить до ${maxModules} модулей.
                    </div>
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Сохранить',
                class: 'btn-success',
                icon: 'save',
                onclick: `rocketsModule.saveRocketEdit(${rocketId})`
            }
        ];

        gameUtils.showModal(`Редактирование: ${rocket.name}`, modalContent, actions);
    }

    toggleModule(rocketId, moduleId, canAfford) {
        if (!canAfford) return;

        const rocket = state.rockets.find(r => r.id === rocketId);
        const maxModules = state.research.find(t => t.id === 13 && t.unlocked) ? 4 : 2;

        const checkbox = document.querySelector(`input[type="checkbox"][value="${moduleId}"]`);
        if (!checkbox) return;

        if (checkbox.checked) {
            // Remove module
            rocket.modules = rocket.modules.filter(m => m !== moduleId);
            checkbox.checked = false;
        } else {
            // Add module if limit not reached
            if (rocket.modules.length >= maxModules) {
                gameUtils.notify(`Максимум ${maxModules} модуля!`, 'bad');
                return;
            }
            rocket.modules.push(moduleId);
            checkbox.checked = true;
        }

        // Update UI
        const moduleOption = checkbox.closest('.module-option');
        moduleOption.classList.toggle('selected');
    }

    saveRocketEdit(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket) return;

        const nameInput = document.getElementById(`rocket-rename-${rocketId}`);
        const newName = nameInput.value.trim();

        const validation = gameUtils.validateRocketName(newName);
        if (!validation.valid && newName !== rocket.name) {
            gameUtils.notify(validation.message, 'bad');
            return;
        }

        // Calculate module costs
        const moduleCosts = rocket.modules.reduce((total, moduleId) => {
            const module = this.modules.find(m => m.id === moduleId);
            if (module) {
                Object.keys(module.cost).forEach(resource => {
                    total[resource] = (total[resource] || 0) + module.cost[resource];
                });
            }
            return total;
        }, {});

        // Check if we can afford the modules
        if (!gameUtils.hasResources(moduleCosts)) {
            gameUtils.notify('Недостаточно ресурсов для установки модулей!', 'bad');
            return;
        }

        // Spend resources for modules
        gameUtils.spendResources(moduleCosts);

        // Update rocket
        rocket.name = newName || rocket.name;

        gameUtils.notify('Изменения сохранены!', 'good');
        gameUtils.closeModal();
        this.render();
    }

    repairRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket || !rocket.damaged) return;

        const repairCost = {
            money: 100000,
            parts: 500,
            rocketParts: 250
        };

        // Apply workshop discount
        const workshopDiscount = (state.workshopLevel - 1) * 0.1;
        Object.keys(repairCost).forEach(resource => {
            repairCost[resource] = Math.floor(repairCost[resource] * (1 - workshopDiscount));
        });

        if (!gameUtils.hasResources(repairCost)) {
            gameUtils.notify('Недостаточно ресурсов для ремонта!', 'bad');
            return;
        }

        gameUtils.spendResources(repairCost);

        rocket.damaged = false;
        rocket.condition = 50;

        gameUtils.notify(`Ракета "${rocket.name}" отремонтирована!`, 'good');
        gameFunctions.addHistoryEntry('repair', 'Ракета отремонтирована', rocket.name, true);

        this.render();
    }

    scrapRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket) return;

        gameUtils.confirm(
            `Вы уверены, что хотите утилизировать ракету "${rocket.name}"? Вы получите часть ресурсов обратно.`,
            `rocketsModule.confirmScrapRocket(${rocketId})`
        );
    }

    confirmScrapRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket) return;

        // Calculate refund (50% of build cost)
        const buildCost = gameFunctions.getRocketCost();
        const refund = {
            money: Math.floor(buildCost.money * 0.5),
            parts: Math.floor(buildCost.parts * 0.5),
            rocketParts: Math.floor(buildCost.rocketParts * 0.5)
        };

        // Add refund to resources
        state.money += refund.money;
        state.parts += refund.parts;
        state.rocketParts += refund.rocketParts;

        // Remove rocket
        state.rockets = state.rockets.filter(r => r.id !== rocketId);
        state.stats.rocketsLost++;

        gameUtils.notify(
            `Ракета "${rocket.name}" утилизирована! Возвращено: ${gameUtils.formatNumber(refund.money)} денег, ${refund.parts} деталей, ${refund.rocketParts} ракетных частей`,
            'info'
        );

        gameFunctions.addHistoryEntry('scrap', 'Ракета утилизирована', rocket.name, true);

        this.render();
    }

    upgradeRocket(rocketId) {
        const rocket = state.rockets.find(r => r.id === rocketId);
        if (!rocket) return;

        const upgradeCost = {
            money: rocket.level * 200000,
            science: rocket.level * 10,
            rocketParts: rocket.level * 20
        };

        if (!gameUtils.hasResources(upgradeCost)) {
            gameUtils.notify('Недостаточно ресурсов для улучшения!', 'bad');
            return;
        }

        gameUtils.spendResources(upgradeCost);

        rocket.level++;
        rocket.success = Math.min(rocket.success + 0.05, 0.95);
        rocket.condition = Math.min(rocket.condition + 10, 100);

        gameUtils.notify(
            `Ракета "${rocket.name}" улучшена до уровня ${rocket.level}! Шанс успеха увеличен.`,
            'good'
        );

        gameFunctions.addHistoryEntry('upgrade', 'Ракета улучшена', `${rocket.name} → Ур. ${rocket.level}`, true);

        this.render();
    }
}

// Initialize rockets module
const rocketsModule = new RocketsModule();

// Global functions for HTML onclick handlers
window.rocketsModule = rocketsModule;

// Render function for game core
function renderRockets() {
    rocketsModule.render();
}

// Export for game core
window.renderRockets = renderRockets;