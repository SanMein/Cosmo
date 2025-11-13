// Technology Tree Module
class TechModule {
    constructor() {
        this.techTreeEl = document.getElementById('tech-tree');
    }

    render() {
        if (!this.techTreeEl) return;

        const researchedTech = state.research.filter(tech => tech.unlocked);
        const availableTech = state.research.filter(tech =>
            !tech.unlocked &&
            tech.id !== state.researching &&
            this.canResearch(tech)
        );
        const lockedTech = state.research.filter(tech =>
            !tech.unlocked &&
            tech.id !== state.researching &&
            !this.canResearch(tech)
        );
        const researchingTech = state.researching ?
            state.research.find(tech => tech.id === state.researching) : null;

        this.techTreeEl.innerHTML = `
            ${researchingTech ? `
                <div class="researching-section">
                    <h3 style="margin-bottom: 1rem; color: var(--warning);">
                        <i class="fas fa-spinner fa-spin"></i> Исследуется сейчас
                    </h3>
                    ${this.renderTechCard(researchingTech, true)}
                </div>
            ` : ''}

            ${researchedTech.length > 0 ? `
                <div class="tech-section" style="margin-top: ${researchingTech ? '2rem' : '0'};">
                    <h3 style="margin-bottom: 1rem; color: var(--success);">
                        <i class="fas fa-check-circle"></i> Изученные технологии
                    </h3>
                    <div class="tech-grid">
                        ${researchedTech.map(tech => this.renderTechCard(tech, false, true)).join('')}
                    </div>
                </div>
            ` : ''}

            ${availableTech.length > 0 ? `
                <div class="tech-section" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--info);">
                        <i class="fas fa-lock-open"></i> Доступные для исследования
                    </h3>
                    <div class="tech-grid">
                        ${availableTech.map(tech => this.renderTechCard(tech)).join('')}
                    </div>
                </div>
            ` : ''}

            ${lockedTech.length > 0 ? `
                <div class="tech-section" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--muted);">
                        <i class="fas fa-lock"></i> Заблокированные технологии
                    </h3>
                    <div class="tech-grid">
                        ${lockedTech.map(tech => this.renderTechCard(tech, false, false, true)).join('')}
                    </div>
                </div>
            ` : ''}

            ${state.research.length === 0 ? `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-flask" style="font-size: 3rem; color: var(--muted); margin-bottom: 1rem;"></i>
                    <h3>Технологии не найдены</h3>
                    <p>Начните исследование, чтобы развивать вашу космическую программу!</p>
                </div>
            ` : ''}
        `;
    }

    renderTechCard(tech, isResearching = false, isResearched = false, isLocked = false) {
        const requirements = this.getTechRequirements(tech);
        const researchTime = tech.researchTime / (1 + (state.researchLabLevel - 1) * 0.1);

        return `
            <div class="tech-card ${isResearching ? 'researching' : ''} ${isResearched ? 'researched' : ''} ${isLocked ? 'locked' : ''}">
                <div class="card-header">
                    <div class="tech-title">
                        <i class="fas ${this.getTechIcon(tech.id)}"></i>
                        ${tech.name}
                    </div>
                    ${isResearching ? gameUtils.createStatusBadge('researching') :
                      isResearched ? gameUtils.createStatusBadge('unlocked') :
                      isLocked ? gameUtils.createStatusBadge('locked') :
                      gameUtils.createStatusBadge('locked', 'Доступно')}
                </div>

                <div class="tech-description">
                    <p>${tech.desc}</p>
                </div>

                ${isResearching ? `
                    <div class="research-progress">
                        <div class="progress-info">
                            <span>Прогресс исследования:</span>
                            <span>${Math.round(state.researchProgress * 100)}%</span>
                        </div>
                        ${gameUtils.createProgressBar(state.researchProgress * 100, 'warning')}
                        <div class="time-remaining">
                            <i class="fas fa-clock"></i>
                            Осталось: ${this.formatResearchTime((1 - state.researchProgress) * researchTime)}
                        </div>
                    </div>
                ` : ''}

                <div class="tech-cost">
                    <div class="cost-title">Стоимость исследования:</div>
                    <div class="cost-items">
                        <div class="cost-item ${state.science >= tech.cost ? 'can-afford' : 'cannot-afford'}">
                            <i class="fas fa-atom"></i>
                            <span>${tech.cost} науки</span>
                        </div>
                        <div class="cost-item">
                            <i class="fas fa-clock"></i>
                            <span>${gameUtils.formatTime(researchTime)}</span>
                        </div>
                    </div>
                </div>

                ${!isResearched && !isResearching ? `
                    <div class="tech-requirements">
                        <div class="requirements-title">Требования:</div>
                        <div class="requirements-list">
                            ${requirements.length > 0 ?
                                requirements.map(req => `
                                    <div class="requirement-item ${req.met ? 'met' : 'not-met'}">
                                        <i class="fas fa-${req.met ? 'check' : 'times'}"></i>
                                        <span>${req.text}</span>
                                    </div>
                                `).join('') :
                                '<div class="requirement-item met"><i class="fas fa-check"></i> Нет требований</div>'
                            }
                        </div>
                    </div>
                ` : ''}

                ${isResearched ? `
                    <div class="tech-effects">
                        <div class="effects-title">Эффект:</div>
                        <div class="effects-list">
                            ${this.renderTechEffects(tech)}
                        </div>
                    </div>
                ` : ''}

                <div class="tech-actions">
                    ${isResearching ? `
                        <button class="btn btn-warning" onclick="techModule.cancelResearch()">
                            <i class="fas fa-times"></i> Отменить
                        </button>
                    ` : isResearched ? `
                        <button class="btn btn-success" disabled>
                            <i class="fas fa-check"></i> Изучено
                        </button>
                    ` : isLocked ? `
                        <button class="btn btn-muted" disabled>
                            <i class="fas fa-lock"></i> Заблокировано
                        </button>
                    ` : `
                        <button class="btn btn-primary"
                                onclick="techModule.startResearch(${tech.id})"
                                ${state.science < tech.cost || state.researching ? 'disabled' : ''}>
                            <i class="fas fa-play"></i> Исследовать
                        </button>
                    `}

                    <button class="btn btn-info" onclick="techModule.showTechDetails(${tech.id})">
                        <i class="fas fa-info-circle"></i> Подробнее
                    </button>
                </div>
            </div>
        `;
    }

    getTechIcon(techId) {
        const icons = {
            1: 'satellite',
            2: 'tachometer-alt',
            3: 'radar',
            4: 'weight',
            5: 'compass',
            6: 'atom',
            7: 'solar-panel',
            8: 'shield-alt'
        };
        return icons[techId] || 'flask';
    }

    getTechRequirements(tech) {
        const requirements = [];

        tech.req.forEach(reqId => {
            const requiredTech = state.research.find(t => t.id === reqId);
            if (requiredTech) {
                requirements.push({
                    text: requiredTech.name,
                    met: requiredTech.unlocked
                });
            }
        });

        return requirements;
    }

    renderTechEffects(tech) {
        const effects = tech.effect.split(';');
        return effects.map(effect => {
            const [type, value] = effect.split(':');
            return `
                <div class="effect-item">
                    <i class="fas fa-arrow-right"></i>
                    <span>${this.getEffectDescription(type, value)}</span>
                </div>
            `;
        }).join('');
    }

    getEffectDescription(type, value) {
        const descriptions = {
            'unlock': `Открывает ${this.getUnlockDescription(value)}`,
            'success': `+${parseFloat(value) * 100}% к шансу успеха ракет`,
            'buildcost': `-${parseFloat(value) * 100}% к стоимости постройки ракет`,
            'science': `+${parseFloat(value) * 100}% к научным наградам`,
            'damage': `-${parseFloat(value) * 100}% к вероятности повреждения`
        };

        return descriptions[type] || `${type}: ${value}`;
    }

    getUnlockDescription(value) {
        const unlocks = {
            'satellite': 'миссии со спутниками',
            'luna': 'лунные миссии',
            'crewed': 'пилотируемые миссии',
            'interplanet': 'межпланетные миссии'
        };
        return unlocks[value] || value;
    }

    formatResearchTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else {
            return `${minutes}м`;
        }
    }

    canResearch(tech) {
        // Check science cost
        if (state.science < tech.cost) return false;

        // Check requirements
        return tech.req.every(reqId => {
            const requiredTech = state.research.find(t => t.id === reqId);
            return requiredTech && requiredTech.unlocked;
        });
    }

    startResearch(techId) {
        const tech = state.research.find(t => t.id === techId);
        if (!tech || state.researching) return;

        if (!this.canResearch(tech)) {
            gameUtils.notify('Требования для исследования не выполнены!', 'bad');
            return;
        }

        if (state.science < tech.cost) {
            gameUtils.notify('Недостаточно науки для исследования!', 'bad');
            return;
        }

        // Start research
        state.researching = techId;
        state.researchProgress = 0;
        state.researchStart = Date.now();
        state.science -= tech.cost;

        gameUtils.notify(`Начато исследование: "${tech.name}"!`, 'good');
        gameFunctions.addHistoryEntry('research', 'Начато исследование', tech.name, true);

        this.render();
    }

    cancelResearch() {
        if (!state.researching) return;

        const tech = state.research.find(t => t.id === state.researching);
        if (!tech) return;

        // Calculate refund (50% of science cost)
        const refund = Math.floor(tech.cost * 0.5);
        state.science += refund;

        // Reset research
        state.researching = null;
        state.researchProgress = 0;
        state.researchStart = null;

        gameUtils.notify(`Исследование отменено. Возвращено ${refund} науки.`, 'info');
        gameFunctions.addHistoryEntry('research', 'Исследование отменено', tech.name, false);

        this.render();
    }

    showTechDetails(techId) {
        const tech = state.research.find(t => t.id === techId);
        if (!tech) return;

        const requirements = this.getTechRequirements(tech);
        const effects = tech.effect.split(';').map(effect => {
            const [type, value] = effect.split(':');
            return { type, value };
        });

        const researchTime = tech.researchTime / (1 + (state.researchLabLevel - 1) * 0.1);

        const modalContent = `
            <div class="tech-details">
                <div class="detail-section">
                    <h5>Описание технологии</h5>
                    <p>${tech.desc}</p>
                </div>

                <div class="detail-section">
                    <h5>Эффекты</h5>
                    <div class="effects-list">
                        ${effects.map(effect => `
                            <div class="effect-detail">
                                <i class="fas fa-${this.getEffectIcon(effect.type)}"></i>
                                <div>
                                    <strong>${this.getEffectName(effect.type)}</strong>
                                    <div class="effect-description">${this.getEffectDescription(effect.type, effect.value)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="detail-section">
                    <h5>Детали исследования</h5>
                    <div class="research-details">
                        <div class="research-detail">
                            <i class="fas fa-atom"></i>
                            <span>Стоимость: ${tech.cost} науки</span>
                        </div>
                        <div class="research-detail">
                            <i class="fas fa-clock"></i>
                            <span>Время: ${gameUtils.formatTime(researchTime)}</span>
                        </div>
                        <div class="research-detail">
                            <i class="fas fa-flask"></i>
                            <span>Ускорение от лаборатории: +${(state.researchLabLevel - 1) * 10}%</span>
                        </div>
                    </div>
                </div>

                ${requirements.length > 0 ? `
                    <div class="detail-section">
                        <h5>Требования</h5>
                        <div class="requirements-details">
                            ${requirements.map(req => `
                                <div class="requirement-detail ${req.met ? 'met' : 'not-met'}">
                                    <i class="fas fa-${req.met ? 'check' : 'times'}"></i>
                                    <span>${req.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="detail-section">
                    <h5>Стратегическое значение</h5>
                    <p>${this.getStrategicImportance(tech)}</p>
                </div>
            </div>
        `;

        gameUtils.showModal(`Детали технологии: ${tech.name}`, modalContent);
    }

    getEffectIcon(effectType) {
        const icons = {
            'unlock': 'lock-open',
            'success': 'chart-line',
            'buildcost': 'money-bill-wave',
            'science': 'atom',
            'damage': 'shield-alt'
        };
        return icons[effectType] || 'magic';
    }

    getEffectName(effectType) {
        const names = {
            'unlock': 'Разблокировка',
            'success': 'Улучшение эффективности',
            'buildcost': 'Экономия ресурсов',
            'science': 'Научный прогресс',
            'damage': 'Повышение надёжности'
        };
        return names[effectType] || effectType;
    }

    getStrategicImportance(tech) {
        const importance = {
            1: 'Фундаментальная технология, открывающая путь к созданию спутников и дальнейшим исследованиям.',
            2: 'Критическое улучшение для повышения надёжности всех космических миссий.',
            3: 'Ключевая технология для расширения присутствия за пределами земной орбиты.',
            4: 'Важное экономическое улучшение, снижающее затраты на космическую программу.',
            5: 'Прорывная технология, позволяющая осуществлять пилотируемые полёты.',
            6: 'Высокоуровневая технология для межпланетных исследований.',
            7: 'Эффективное улучшение для увеличения научной отдачи от миссий.',
            8: 'Важная технология безопасности для защиты дорогостоящего оборудования.'
        };
        return importance[tech.id] || 'Эта технология играет важную роль в развитии вашей космической программы.';
    }

    getResearchProgress() {
        if (!state.researching) return null;

        const tech = state.research.find(t => t.id === state.researching);
        if (!tech) return null;

        const researchTime = tech.researchTime / (1 + (state.researchLabLevel - 1) * 0.1);
        const elapsed = (Date.now() - state.researchStart) / 1000;
        const progress = Math.min(elapsed / researchTime, 1);

        return {
            tech: tech,
            progress: progress,
            timeRemaining: Math.max(0, researchTime - elapsed)
        };
    }

    completeResearch(tech) {
        // This is called from the game core when research is complete
        tech.unlocked = true;

        // Apply effects immediately
        this.applyTechEffects(tech);

        gameUtils.notify(`Исследование "${tech.name}" завершено!`, 'good');
        this.render();
    }

    applyTechEffects(tech) {
        const effects = tech.effect.split(';');

        effects.forEach(effect => {
            const [type, value] = effect.split(':');

            switch (type) {
                case 'success':
                    // Apply to all existing rockets
                    state.rockets.forEach(rocket => {
                        rocket.success = Math.min(rocket.success + parseFloat(value), 0.95);
                    });
                    break;

                case 'unlock':
                    // Unlock missions (handled in missions module)
                    break;

                // Other effects are applied when relevant
            }
        });
    }
}

// Initialize tech module
const techModule = new TechModule();

// Global functions for HTML onclick handlers
window.techModule = techModule;

// Render function for game core
function renderTechTree() {
    techModule.render();
}

// Export for game core
window.renderTechTree = renderTechTree;