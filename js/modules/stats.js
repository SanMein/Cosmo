// Statistics and History Module
class StatsModule {
    constructor() {
        this.statsGridEl = document.getElementById('stats-grid');
        this.historyListEl = document.getElementById('history-list');
    }

    render() {
        this.renderStats();
        this.renderHistory();
    }

    renderStats() {
        if (!this.statsGridEl) return;

        const stats = this.calculateAllStats();

        this.statsGridEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalLaunches}</div>
                <div class="stat-label">Всего запусков</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.successRate}%</div>
                <div class="stat-label">Успешных миссий</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.rocketsBuilt}</div>
                <div class="stat-label">Построено ракет</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.rocketsLost}</div>
                <div class="stat-label">Потеряно ракет</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalScience}</div>
                <div class="stat-label">Всего науки</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.researchCompleted}</div>
                <div class="stat-label">Исследований</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.missionsCompleted}</div>
                <div class="stat-label">Завершено миссий</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.playTime}</div>
                <div class="stat-label">Время игры</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.averageRocketLevel.toFixed(1)}</div>
                <div class="stat-label">Ср. уровень ракет</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalEarnings}</div>
                <div class="stat-label">Всего заработано</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.upgradesPurchased}</div>
                <div class="stat-label">Улучшений куплено</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.reputation}</div>
                <div class="stat-label">Репутация</div>
            </div>
        `;
    }

    renderHistory() {
        if (!this.historyListEl) return;

        const recentHistory = state.history.slice(0, 20); // Show last 20 entries

        this.historyListEl.innerHTML = recentHistory.map(entry => `
            <div class="history-item">
                <div class="history-icon ${this.getHistoryIconClass(entry)}">
                    <i class="fas ${this.getHistoryIcon(entry)}"></i>
                </div>
                <div class="history-content">
                    <div class="history-title">${entry.title}</div>
                    <div class="history-description">${entry.description}</div>
                </div>
                <div class="history-time">
                    ${this.formatHistoryTime(entry.timestamp)}
                </div>
            </div>
        `).join('') || `
            <div class="history-empty">
                <i class="fas fa-history" style="font-size: 2rem; color: var(--muted); margin-bottom: 1rem;"></i>
                <p>История пуста</p>
                <p style="font-size: 0.9rem; color: var(--text-dark);">Здесь будут отображаться ваши достижения и события</p>
            </div>
        `;
    }

    calculateAllStats() {
        const totalMissions = state.stats.successfulMissions + state.stats.failedMissions;
        const successRate = totalMissions > 0 ?
            Math.round((state.stats.successfulMissions / totalMissions) * 100) : 0;

        const researchCompleted = state.research.filter(tech => tech.unlocked).length;
        const upgradesPurchased = state.shopItems.reduce((total, item) =>
            total + (item.currentLevel - 1), 0
        );

        const averageRocketLevel = state.rockets.length > 0 ?
            state.rockets.reduce((sum, rocket) => sum + rocket.level, 0) / state.rockets.length : 0;

        return {
            totalLaunches: state.stats.totalLaunches,
            successRate: successRate,
            rocketsBuilt: state.stats.rocketsBuilt,
            rocketsLost: state.stats.rocketsLost,
            totalScience: state.stats.totalScience,
            researchCompleted: researchCompleted,
            missionsCompleted: state.stats.successfulMissions,
            playTime: this.formatPlayTime(state.stats.daysPlayed),
            averageRocketLevel: averageRocketLevel,
            totalEarnings: gameUtils.formatNumber(state.stats.totalMoney),
            upgradesPurchased: upgradesPurchased,
            reputation: state.reputation
        };
    }

    getHistoryIcon(entry) {
        const icons = {
            'launch': 'rocket',
            'mission': 'satellite',
            'research': 'flask',
            'rocket': 'space-shuttle',
            'repair': 'tools',
            'scrap': 'trash',
            'upgrade': 'arrow-up'
        };
        return icons[entry.type] || 'info-circle';
    }

    getHistoryIconClass(entry) {
        return entry.success ? 'history-success' : 'history-failure';
    }

    formatHistoryTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}д назад`;
        if (hours > 0) return `${hours}ч назад`;
        if (minutes > 0) return `${minutes}м назад`;
        return 'Только что';
    }

    formatPlayTime(days) {
        if (days === 0) return 'Меньше дня';
        if (days === 1) return '1 день';
        if (days < 30) return `${days} дней`;

        const months = Math.floor(days / 30);
        const remainingDays = days % 30;

        if (remainingDays === 0) return `${months}мес`;
        return `${months}мес ${remainingDays}д`;
    }

    showDetailedStats() {
        const stats = this.calculateAllStats();
        const achievements = this.calculateAchievements();

        const modalContent = `
            <div class="detailed-stats">
                <div class="stats-section">
                    <h5>Общая статистика</h5>
                    <div class="stats-grid detailed">
                        <div class="stat-row">
                            <span class="stat-label">Общее время игры:</span>
                            <span class="stat-value">${stats.playTime}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Всего заработано:</span>
                            <span class="stat-value">${stats.totalEarnings} денег</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Накоплено науки:</span>
                            <span class="stat-value">${stats.totalScience}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Текущая репутация:</span>
                            <span class="stat-value">${stats.reputation}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h5>Космическая программа</h5>
                    <div class="stats-grid detailed">
                        <div class="stat-row">
                            <span class="stat-label">Всего запусков:</span>
                            <span class="stat-value">${stats.totalLaunches}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Успешных миссий:</span>
                            <span class="stat-value">${stats.successRate}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Построено ракет:</span>
                            <span class="stat-value">${stats.rocketsBuilt}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Потеряно ракет:</span>
                            <span class="stat-value">${stats.rocketsLost}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Средний уровень ракет:</span>
                            <span class="stat-value">${stats.averageRocketLevel.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h5>Развитие технологий</h5>
                    <div class="stats-grid detailed">
                        <div class="stat-row">
                            <span class="stat-label">Исследований завершено:</span>
                            <span class="stat-value">${stats.researchCompleted}/${state.research.length}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Улучшений куплено:</span>
                            <span class="stat-value">${stats.upgradesPurchased}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Уровень лаборатории:</span>
                            <span class="stat-value">${state.researchLabLevel}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Уровень мастерской:</span>
                            <span class="stat-value">${state.workshopLevel}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h5>Достижения</h5>
                    <div class="achievements-list">
                        ${achievements.map(achievement => `
                            <div class="achievement-item ${achievement.earned ? 'earned' : 'locked'}">
                                <div class="achievement-icon">
                                    <i class="fas ${achievement.earned ? 'fa-trophy' : 'fa-lock'}"></i>
                                </div>
                                <div class="achievement-info">
                                    <div class="achievement-name">${achievement.name}</div>
                                    <div class="achievement-description">${achievement.description}</div>
                                    ${!achievement.earned ? `
                                        <div class="achievement-progress">
                                            <div class="progress-text">${achievement.progress}</div>
                                            ${gameUtils.createProgressBar(achievement.progressPercent)}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        gameUtils.showModal('Подробная статистика', modalContent);
    }

    calculateAchievements() {
        const achievements = [
            {
                id: 1,
                name: 'Первый запуск',
                description: 'Выполнить первый успешный запуск ракеты',
                condition: () => state.stats.totalLaunches >= 1,
                progress: () => state.stats.totalLaunches >= 1 ? 'Получено' : 'Запустите первую ракету'
            },
            {
                id: 2,
                name: 'Ветеран космоса',
                description: 'Выполнить 50 успешных миссий',
                condition: () => state.stats.successfulMissions >= 50,
                progress: () => `${state.stats.successfulMissions}/50 миссий`
            },
            {
                id: 3,
                name: 'Научный гений',
                description: 'Накопить 1000 науки',
                condition: () => state.stats.totalScience >= 1000,
                progress: () => `${state.stats.totalScience}/1000 науки`
            },
            {
                id: 4,
                name: 'Мастер технологий',
                description: 'Изучить все технологии',
                condition: () => state.research.filter(t => t.unlocked).length === state.research.length,
                progress: () => `${state.research.filter(t => t.unlocked).length}/${state.research.length} технологий`
            },
            {
                id: 5,
                name: 'Космический магнат',
                description: 'Заработать 10,000,000 денег',
                condition: () => state.stats.totalMoney >= 10000000,
                progress: () => `${gameUtils.formatNumber(state.stats.totalMoney)}/10M денег`
            },
            {
                id: 6,
                name: 'Непобедимый',
                description: 'Иметь 10 успешных миссий подряд',
                condition: () => this.getCurrentStreak() >= 10,
                progress: () => `Текущая серия: ${this.getCurrentStreak()}/10`
            },
            {
                id: 7,
                name: 'Флот мечты',
                description: 'Иметь 5 ракет одновременно',
                condition: () => state.rockets.length >= 5,
                progress: () => `${state.rockets.length}/5 ракет`
            },
            {
                id: 8,
                name: 'Легендарная репутация',
                description: 'Достичь 50 репутации',
                condition: () => state.reputation >= 50,
                progress: () => `${state.reputation}/50 репутации`
            }
        ];

        return achievements.map(achievement => {
            const earned = achievement.condition();
            const progress = achievement.progress();
            const progressPercent = this.calculateAchievementProgress(achievement);

            return {
                ...achievement,
                earned: earned,
                progress: progress,
                progressPercent: progressPercent
            };
        });
    }

    calculateAchievementProgress(achievement) {
        // This is a simplified progress calculation
        // In a real implementation, you'd track progress for each achievement
        return achievement.condition() ? 100 : 0;
    }

    getCurrentStreak() {
        // Simplified streak calculation
        // In real implementation, track consecutive successful missions
        const recentMissions = state.history
            .filter(entry => entry.type === 'mission')
            .slice(0, 10);

        let streak = 0;
        for (const mission of recentMissions) {
            if (mission.success) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    exportStats() {
        const stats = this.calculateAllStats();
        const data = {
            timestamp: new Date().toISOString(),
            gameVersion: '2.0',
            statistics: stats,
            achievements: this.calculateAchievements().filter(a => a.earned).map(a => a.name),
            gameState: {
                rockets: state.rockets.length,
                research: state.research.filter(t => t.unlocked).length,
                upgrades: state.shopItems.reduce((sum, item) => sum + (item.currentLevel - 1), 0),
                resources: {
                    money: state.money,
                    science: state.science,
                    reputation: state.reputation
                }
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cosmo-sim-stats-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        gameUtils.notify('Статистика экспортирована!', 'good');
    }

    resetStatistics() {
        gameUtils.confirm(
            'Вы уверены, что хотите сбросить всю статистику? Это действие нельзя отменить.',
            'statsModule.confirmResetStats()'
        );
    }

    confirmResetStats() {
        // Reset only statistics, not the game state
        state.stats = JSON.parse(JSON.stringify(defaultState.stats));
        state.history = [];

        gameUtils.notify('Статистика сброшена!', 'info');
        this.render();
    }
}

// Initialize stats module
const statsModule = new StatsModule();

// Global functions for HTML onclick handlers
window.statsModule = statsModule;

// Render function for game core
function renderStats() {
    statsModule.render();
}

// Export for game core
window.renderStats = renderStats;