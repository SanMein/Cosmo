// Missions Management Module
class MissionsModule {
    constructor() {
        this.missionListEl = document.getElementById('mission-list');
    }

    render() {
        if (!this.missionListEl) return;

        const availableMissions = state.missions.filter(mission => mission.unlocked);
        const lockedMissions = state.missions.filter(mission => !mission.unlocked);

        this.missionListEl.innerHTML = `
            ${availableMissions.length > 0 ? `
                <div class="missions-section">
                    <h3 style="margin-bottom: 1rem; color: var(--success);">
                        <i class="fas fa-check-circle"></i> Доступные миссии
                    </h3>
                    <div class="mission-grid">
                        ${availableMissions.map(mission => this.renderMissionCard(mission)).join('')}
                    </div>
                </div>
            ` : ''}

            ${lockedMissions.length > 0 ? `
                <div class="missions-section" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--muted);">
                        <i class="fas fa-lock"></i> Заблокированные миссии
                    </h3>
                    <div class="mission-grid">
                        ${lockedMissions.map(mission => this.renderLockedMissionCard(mission)).join('')}
                    </div>
                </div>
            ` : ''}

            ${state.missions.length === 0 ? `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-map" style="font-size: 3rem; color: var(--muted); margin-bottom: 1rem;"></i>
                    <h3>Миссии не найдены</h3>
                    <p>Исследуйте технологии, чтобы открыть новые миссии!</p>
                </div>
            ` : ''}
        `;
    }

    renderMissionCard(mission) {
        const availableRockets = state.rockets.filter(rocket =>
            rocket.status === 'ready' &&
            !rocket.damaged &&
            rocket.level >= mission.requirements.rocketLevel
        );

        const isMissionActive = state.rockets.some(rocket => rocket.currentMission === mission.id);

        return `
            <div class="mission-card ${isMissionActive ? 'active-mission' : ''}">
                <div class="card-header">
                    <div class="mission-title">
                        <i class="fas ${this.getMissionIcon(mission.type)}"></i>
                        ${mission.name}
                    </div>
                    <span class="mission-difficulty ${mission.difficulty.toLowerCase()}">
                        ${mission.difficulty}
                    </span>
                </div>

                <div class="mission-description">
                    <p>${mission.desc || this.generateMissionDescription(mission)}</p>
                </div>

                <div class="mission-details">
                    <div class="mission-detail">
                        <i class="fas fa-clock"></i>
                        <span>${gameUtils.formatTime(mission.duration)}</span>
                    </div>
                    <div class="mission-detail">
                        <i class="fas fa-rocket"></i>
                        <span>Ур. ${mission.requirements.rocketLevel}+</span>
                    </div>
                    <div class="mission-detail">
                        <i class="fas ${availableRockets.length > 0 ? 'fa-check text-success' : 'fa-times text-danger'}"></i>
                        <span>${availableRockets.length} ракет доступно</span>
                    </div>
                </div>

                <div class="mission-rewards">
                    <div class="rewards-title">Награда:</div>
                    <div class="rewards-list">
                        ${mission.reward.money ? `
                            <div class="reward-item">
                                <i class="fas fa-coins"></i>
                                <span>+${gameUtils.formatNumber(mission.reward.money)}</span>
                            </div>
                        ` : ''}
                        ${mission.reward.science ? `
                            <div class="reward-item">
                                <i class="fas fa-atom"></i>
                                <span>+${mission.reward.science}</span>
                            </div>
                        ` : ''}
                        ${mission.reward.reputation ? `
                            <div class="reward-item">
                                <i class="fas fa-star"></i>
                                <span>+${mission.reward.reputation}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="mission-cost">
                    <div class="cost-title">Стоимость:</div>
                    <div class="cost-list">
                        ${mission.cost.fuel ? `
                            <div class="cost-item">
                                <i class="fas fa-gas-pump"></i>
                                <span>${mission.cost.fuel}</span>
                            </div>
                        ` : ''}
                        ${mission.cost.parts ? `
                            <div class="cost-item">
                                <i class="fas fa-cog"></i>
                                <span>${mission.cost.parts}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="mission-actions">
                    ${isMissionActive ? `
                        <button class="btn btn-muted" disabled>
                            <i class="fas fa-satellite-dish"></i> Миссия выполняется
                        </button>
                    ` : availableRockets.length > 0 ? `
                        <button class="btn btn-primary" onclick="missionsModule.showRocketSelection(${mission.id})">
                            <i class="fas fa-play"></i> Выбрать ракету
                        </button>
                    ` : `
                        <button class="btn btn-muted" disabled>
                            <i class="fas fa-times"></i> Нет доступных ракет
                        </button>
                    `}

                    <button class="btn btn-info" onclick="missionsModule.showMissionDetails(${mission.id})">
                        <i class="fas fa-info-circle"></i> Подробнее
                    </button>
                </div>
            </div>
        `;
    }

    renderLockedMissionCard(mission) {
        const requirements = this.getMissionRequirements(mission);

        return `
            <div class="mission-card locked">
                <div class="card-header">
                    <div class="mission-title" style="opacity: 0.6;">
                        <i class="fas fa-lock"></i>
                        ${mission.name}
                    </div>
                    <span class="mission-difficulty ${mission.difficulty.toLowerCase()}">
                        ${mission.difficulty}
                    </span>
                </div>

                <div class="mission-description">
                    <p style="opacity: 0.6;">${mission.desc || this.generateMissionDescription(mission)}</p>
                </div>

                <div class="mission-requirements">
                    <div class="requirements-title">Требования для разблокировки:</div>
                    <div class="requirements-list">
                        ${requirements.map(req => `
                            <div class="requirement-item ${req.met ? 'met' : 'not-met'}">
                                <i class="fas fa-${req.met ? 'check' : 'times'}"></i>
                                <span>${req.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mission-rewards" style="opacity: 0.6;">
                    <div class="rewards-title">Награда:</div>
                    <div class="rewards-list">
                        ${mission.reward.money ? `
                            <div class="reward-item">
                                <i class="fas fa-coins"></i>
                                <span>+${gameUtils.formatNumber(mission.reward.money)}</span>
                            </div>
                        ` : ''}
                        ${mission.reward.science ? `
                            <div class="reward-item">
                                <i class="fas fa-atom"></i>
                                <span>+${mission.reward.science}</span>
                            </div>
                        ` : ''}
                        ${mission.reward.reputation ? `
                            <div class="reward-item">
                                <i class="fas fa-star"></i>
                                <span>+${mission.reward.reputation}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="mission-actions">
                    <button class="btn btn-muted" disabled>
                        <i class="fas fa-lock"></i> Заблокировано
                    </button>
                </div>
            </div>
        `;
    }

    getMissionIcon(missionType) {
        const icons = {
            'orbital': 'satellite',
            'satellite': 'broadcast-tower',
            'lunar': 'moon',
            'interplanetary': 'globe-americas',
            'crewed': 'user-astronaut'
        };
        return icons[missionType] || 'map-marker-alt';
    }

    generateMissionDescription(mission) {
        const descriptions = {
            'orbital': 'Вывод полезной нагрузки на околоземную орбиту. Базовая миссия для начала космической программы.',
            'satellite': 'Запуск спутника связи для улучшения глобальных коммуникаций.',
            'lunar': 'Исследование Луны и сбор научных данных о спутнике Земли.',
            'interplanetary': 'Межпланетная экспедиция к далёким мирам Солнечной системы.',
            'crewed': 'Пилотируемый полёт с экипажем астронавтов.'
        };
        return descriptions[mission.type] || 'Космическая исследовательская миссия.';
    }

    getMissionRequirements(mission) {
        const requirements = [];

        // Rocket level requirement
        const maxRocketLevel = Math.max(...state.rockets.map(r => r.level));
        const rocketReqMet = maxRocketLevel >= mission.requirements.rocketLevel;

        requirements.push({
            text: `Ракета уровня ${mission.requirements.rocketLevel}`,
            met: rocketReqMet
        });

        // Technology requirement
        if (mission.requirements.tech) {
            const tech = state.research.find(r => r.id === mission.requirements.tech);
            requirements.push({
                text: `Исследование: ${tech ? tech.name : 'Требуемая технология'}`,
                met: tech ? tech.unlocked : false
            });
        }

        return requirements;
    }

    showRocketSelection(missionId) {
        const mission = state.missions.find(m => m.id === missionId);
        if (!mission) return;

        const availableRockets = state.rockets.filter(rocket =>
            rocket.status === 'ready' &&
            !rocket.damaged &&
            rocket.level >= mission.requirements.rocketLevel
        );

        if (availableRockets.length === 0) {
            gameUtils.notify('Нет доступных ракет для этой миссии!', 'bad');
            return;
        }

        const rocketOptions = availableRockets.map(rocket => {
            const successChance = gameFunctions.getMissionSuccessChance(rocket, mission);
            const damageChance = gameFunctions.getDamageChance(mission);

            return `
                <div class="rocket-option" onclick="missionsModule.selectRocketForMission(${mission.id}, ${rocket.id})">
                    <div class="rocket-option-header">
                        <strong>${rocket.name}</strong>
                        <span class="rocket-level">Ур. ${rocket.level}</span>
                    </div>
                    <div class="rocket-option-details">
                        <div>Шанс успеха: <strong>${(successChance * 100).toFixed(1)}%</strong></div>
                        <div>Риск повреждения: ${(damageChance * 100).toFixed(1)}%</div>
                        <div>Состояние: ${rocket.condition}%</div>
                        <div>Модули: ${rocket.modules.length}</div>
                    </div>
                    <div class="rocket-option-stats">
                        <div class="stat">
                            <i class="fas fa-chart-line"></i>
                            <span>${rocket.success * 100}%</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-wrench"></i>
                            <span>${rocket.launches}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = `
            <div class="rocket-selection">
                <h4>Выберите ракету для миссии "${mission.name}"</h4>
                <div class="mission-preview">
                    <div class="preview-duration">
                        <i class="fas fa-clock"></i>
                        Длительность: ${gameUtils.formatTime(mission.duration)}
                    </div>
                    <div class="preview-cost">
                        <i class="fas fa-gas-pump"></i>
                        Топливо: ${mission.cost.fuel}
                    </div>
                    <div class="preview-cost">
                        <i class="fas fa-cog"></i>
                        Детали: ${mission.cost.parts}
                    </div>
                </div>
                <div class="rocket-options">
                    ${rocketOptions}
                </div>
            </div>
        `;

        gameUtils.showModal('Выбор ракеты', modalContent);
    }

    selectRocketForMission(missionId, rocketId) {
        const mission = state.missions.find(m => m.id === missionId);
        const rocket = state.rockets.find(r => r.id === rocketId);

        if (!mission || !rocket) return;

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
        gameFunctions.addHistoryEntry('launch', 'Запуск миссии', `${rocket.name} → ${mission.name}`, true);

        gameUtils.closeModal();

        // Update displays
        if (typeof renderRockets === 'function') renderRockets();
        this.render();

        // Trigger animation
        if (window.spaceBackground) {
            window.spaceBackground.triggerLaunch(mission.type);
        }
    }

    showMissionDetails(missionId) {
        const mission = state.missions.find(m => m.id === missionId);
        if (!mission) return;

        const successStats = this.calculateMissionStats(mission);

        const modalContent = `
            <div class="mission-details">
                <div class="detail-section">
                    <h5>Описание миссии</h5>
                    <p>${mission.desc || this.generateMissionDescription(mission)}</p>
                </div>

                <div class="detail-section">
                    <h5>Статистика успеха</h5>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${successStats.averageSuccess}%</div>
                            <div class="stat-label">Средний шанс успеха</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${successStats.bestSuccess}%</div>
                            <div class="stat-label">Лучший шанс</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${successStats.completionTime}</div>
                            <div class="stat-label">Время выполнения</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5>Требования</h5>
                    <ul class="requirements-list">
                        <li><i class="fas fa-rocket"></i> Ракета уровня ${mission.requirements.rocketLevel}+</li>
                        ${mission.requirements.tech ? `
                            <li>
                                <i class="fas fa-flask"></i>
                                ${state.research.find(r => r.id === mission.requirements.tech)?.name || 'Требуемая технология'}
                            </li>
                        ` : ''}
                    </ul>
                </div>

                <div class="detail-section">
                    <h5>Риски</h5>
                    <div class="risks-list">
                        <div class="risk-item">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>Вероятность повреждения: ${(gameFunctions.getDamageChance(mission) * 100).toFixed(1)}%</span>
                        </div>
                        <div class="risk-item">
                            <i class="fas fa-chart-line"></i>
                            <span>Снижение состояния: 10-30%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        gameUtils.showModal(`Детали миссии: ${mission.name}`, modalContent);
    }

    calculateMissionStats(mission) {
        const availableRockets = state.rockets.filter(rocket =>
            rocket.level >= mission.requirements.rocketLevel
        );

        let totalSuccess = 0;
        let bestSuccess = 0;

        availableRockets.forEach(rocket => {
            const success = gameFunctions.getMissionSuccessChance(rocket, mission);
            totalSuccess += success;
            bestSuccess = Math.max(bestSuccess, success);
        });

        const averageSuccess = availableRockets.length > 0 ?
            (totalSuccess / availableRockets.length) * 100 : 0;

        return {
            averageSuccess: averageSuccess.toFixed(1),
            bestSuccess: (bestSuccess * 100).toFixed(1),
            completionTime: gameUtils.formatTime(mission.duration)
        };
    }

    getMissionProgress() {
        const totalMissions = state.missions.length;
        const completedMissions = state.stats.successfulMissions;
        const unlockedMissions = state.missions.filter(m => m.unlocked).length;

        return {
            total: totalMissions,
            completed: completedMissions,
            unlocked: unlockedMissions,
            progress: Math.round((completedMissions / totalMissions) * 100)
        };
    }
}

// Initialize missions module
const missionsModule = new MissionsModule();

// Global functions for HTML onclick handlers
window.missionsModule = missionsModule;

// Render function for game core
function renderMissions() {
    missionsModule.render();
}

// Export for game core
window.renderMissions = renderMissions;