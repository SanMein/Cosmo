// Main Game Loop and Core Logic
class CosmoSimGame {
    constructor() {
        this.isRunning = false;
        this.lastTick = Date.now();
        this.tickInterval = 1000; // 1 second game ticks
        this.autoSaveInterval = 30000; // 30 seconds
        this.lastAutoSave = Date.now();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadGame();
        this.startGameLoop();
        this.renderAll();

        console.log('Cosmo Sim Game initialized');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                gameUtils.switchTab(tab);
            });
        });

        // Rocket creation
        document.getElementById('add-rocket-btn').addEventListener('click', () => {
            this.addRocket();
        });

        document.getElementById('rocket-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addRocket();
            }
        });

        // Game controls
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveGame();
        });

        document.getElementById('load-btn').addEventListener('click', () => {
            this.loadGame();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            if (state.settings.autoSave) {
                this.saveGame();
            }
        });

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateOfflineProgress();
            }
        });
    }

    startGameLoop() {
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const now = Date.now();
        const deltaTime = now - this.lastTick;

        // Process game tick if enough time has passed
        if (deltaTime >= this.tickInterval) {
            this.processGameTick();
            this.lastTick = now;
        }

        // Auto-save
        if (state.settings.autoSave && now - this.lastAutoSave >= this.autoSaveInterval) {
            this.autoSave();
            this.lastAutoSave = now;
        }

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    processGameTick() {
        // Update game time
        gameFunctions.updateGameTime();

        // Process ongoing missions
        this.processMissions();

        // Process research
        this.processResearch();

        // Update UI
        this.updateUI();

        // Random events
        if (Math.random() < 0.01) {
            this.triggerRandomEvent();
        }
    }

    processMissions() {
        const now = Date.now();

        state.rockets.forEach(rocket => {
            if (rocket.status === 'launched' && rocket.missionEnd && now >= rocket.missionEnd) {
                this.completeMission(rocket);
            } else if (rocket.status === 'preparing' && rocket.prepStart && now >= rocket.prepStart) {
                rocket.status = 'ready';
                gameUtils.notify(`Ракета "${rocket.name}" готова к запуску!`, 'good');
                this.renderRockets();
            }
        });
    }

    processResearch() {
        if (state.researching && state.researchStart) {
            const now = Date.now();
            const research = state.research.find(r => r.id === state.researching);

            if (research) {
                const elapsed = (now - state.researchStart) / 1000; // Convert to seconds
                const researchTime = research.researchTime / (1 + (state.researchLabLevel - 1) * 0.1); // Apply lab bonus

                state.researchProgress = Math.min(elapsed / researchTime, 1);

                if (state.researchProgress >= 1) {
                    this.completeResearch(research);
                }
            }
        }
    }

    completeResearch(research) {
        research.unlocked = true;
        state.researching = null;
        state.researchProgress = 0;
        state.researchStart = null;

        // Apply research effects
        this.applyResearchEffect(research);

        gameUtils.notify(`Исследование "${research.name}" завершено!`, 'good');
        gameFunctions.addHistoryEntry('research', 'Исследование завершено', research.name, true);

        // Unlock dependent missions
        this.unlockMissions();

        this.renderTechTree();
        this.renderMissions();
    }

    applyResearchEffect(research) {
        const effects = research.effect.split(';');

        effects.forEach(effect => {
            const [type, value] = effect.split(':');

            switch (type) {
                case 'success':
                    // Global success chance increase
                    const bonus = parseFloat(value);
                    state.rockets.forEach(rocket => {
                        rocket.success = Math.min(rocket.success + bonus, 0.95);
                    });
                    break;

                case 'unlock':
                    // Mission type unlock handled in unlockMissions
                    break;

                case 'buildcost':
                    // Build cost reduction applied when getting rocket cost
                    break;

                case 'science':
                    // Science bonus applied in mission rewards
                    break;

                case 'damage':
                    // Damage reduction applied in damage calculation
                    break;
            }
        });
    }

    unlockMissions() {
        state.missions.forEach(mission => {
            if (!mission.unlocked && mission.requirements.tech) {
                const requiredTech = state.research.find(r => r.id === mission.requirements.tech);
                if (requiredTech && requiredTech.unlocked) {
                    mission.unlocked = true;
                    gameUtils.notify(`Доступна новая миссия: "${mission.name}"`, 'info');
                }
            }
        });
    }

    completeMission(rocket) {
        const mission = state.missions.find(m => m.id === rocket.currentMission);

        if (!mission) {
            rocket.status = 'failed';
            rocket.currentMission = null;
            rocket.missionEnd = null;
            return;
        }

        const successChance = gameFunctions.getMissionSuccessChance(rocket, mission);
        const isSuccess = Math.random() < successChance;
        const isDamaged = Math.random() < gameFunctions.getDamageChance(mission);

        rocket.status = isSuccess ? 'ready' : 'failed';
        rocket.launches++;
        rocket.lastMission = mission.name;
        rocket.currentMission = null;
        rocket.missionEnd = null;

        if (isDamaged) {
            rocket.damaged = true;
            rocket.condition = Math.max(rocket.condition - 30, 0);
        } else {
            rocket.condition = Math.max(rocket.condition - 10, 0);
        }

        // Update statistics
        state.stats.totalLaunches++;
        if (isSuccess) {
            state.stats.successfulMissions++;

            // Apply rewards
            const reward = { ...mission.reward };

            // Apply science bonus from research
            const scienceTech = state.research.find(r => r.id === 7 && r.unlocked);
            if (scienceTech) {
                reward.science = Math.floor(reward.science * 1.25);
            }

            state.money += reward.money;
            state.science += reward.science;
            state.reputation += reward.reputation;
            state.stats.totalScience += reward.science;
            state.stats.totalMoney += reward.money;

            gameUtils.notify(
                `Миссия "${mission.name}" успешно завершена! +${gameUtils.formatNumber(reward.money)} денег, +${reward.science} науки, +${reward.reputation} репутации`,
                'good'
            );

            gameFunctions.addHistoryEntry(
                'mission',
                'Миссия успешна',
                `${rocket.name}: ${mission.name} (+${gameUtils.formatNumber(reward.money)}💰 +${reward.science}🔬 +${reward.reputation}⭐)`,
                true
            );

            // Trigger animation
            if (window.spaceBackground) {
                window.spaceBackground.triggerLaunch(mission.type);
            }
        } else {
            state.stats.failedMissions++;
            gameUtils.notify(`Миссия "${mission.name}" провалилась!`, 'bad');

            gameFunctions.addHistoryEntry(
                'mission',
                'Миссия провалена',
                `${rocket.name}: ${mission.name}`,
                false
            );
        }

        this.renderAll();
    }

    triggerRandomEvent() {
        const events = [
            {
                name: 'Научный прорыв',
                probability: 0.3,
                effect: () => {
                    const scienceGain = Math.floor(Math.random() * 5) + 1;
                    state.science += scienceGain;
                    state.stats.totalScience += scienceGain;
                    gameUtils.notify(`Научный прорыв! +${scienceGain} науки`, 'info');
                }
            },
            {
                name: 'Спонсорская поддержка',
                probability: 0.2,
                effect: () => {
                    const moneyGain = Math.floor(Math.random() * 50000) + 25000;
                    state.money += moneyGain;
                    state.stats.totalMoney += moneyGain;
                    gameUtils.notify(`Спонсорская поддержка! +${gameUtils.formatNumber(moneyGain)} денег`, 'good');
                }
            },
            {
                name: 'Авария на складе',
                probability: 0.1,
                effect: () => {
                    const partsLoss = Math.floor(state.parts * 0.1);
                    state.parts -= partsLoss;
                    gameUtils.notify(`Авария на складе! Потеряно ${partsLoss} деталей`, 'bad');
                }
            }
        ];

        const event = events.find(e => Math.random() < e.probability);
        if (event) {
            event.effect();
            this.renderAll();
        }
    }

    updateOfflineProgress() {
        // This would calculate progress made while the game was closed
        // For now, we'll just update the time
        gameFunctions.updateGameTime();
    }

    updateUI() {
        // Update resource displays
        gameUtils.updateResourcesDisplay();

        // Update counters in panel headers
        this.updatePanelCounters();
    }

    updatePanelCounters() {
        // Rocket count
        const rocketCount = document.getElementById('rocket-count');
        if (rocketCount) {
            rocketCount.textContent = `${state.rockets.length}/${gameFunctions.getRocketLimit()}`;
        }

        // Completed missions
        const completedMissions = document.getElementById('completed-missions');
        if (completedMissions) {
            completedMissions.textContent = state.stats.successfulMissions;
        }

        // Science count
        const scienceCount = document.getElementById('science-count');
        if (scienceCount) {
            scienceCount.textContent = state.science;
        }

        // Money count
        const moneyCount = document.getElementById('money-count');
        if (moneyCount) {
            moneyCount.textContent = gameUtils.formatNumber(state.money);
        }

        // Play time
        const playTime = document.getElementById('play-time');
        if (playTime) {
            const days = state.stats.daysPlayed;
            const hours = Math.floor((state.gameTime % (5 * 60 * 1000)) / (60 * 1000));
            playTime.textContent = `${days}д ${hours}ч`;
        }
    }

    addRocket() {
        const nameInput = document.getElementById('rocket-name');
        const name = nameInput.value.trim();

        const validation = gameUtils.validateRocketName(name);
        if (!validation.valid) {
            gameUtils.notify(validation.message, 'bad');
            return;
        }

        if (!gameFunctions.canBuildRocket()) {
            gameUtils.notify('Достигнут лимит ракет! Улучшите стартовую площадку.', 'bad');
            return;
        }

        const cost = gameFunctions.getRocketCost();
        if (!gameUtils.hasResources(cost)) {
            gameUtils.notify('Недостаточно ресурсов для создания ракеты!', 'bad');
            return;
        }

        // Spend resources
        gameUtils.spendResources(cost);

        // Create new rocket
        const newRocket = {
            id: state.nextRocketId++,
            name: name,
            level: 1,
            success: 0.5,
            status: 'ready',
            launches: 0,
            lastMission: null,
            modules: [],
            damaged: false,
            condition: 100,
            prepStart: null,
            missionEnd: null,
            currentMission: null
        };

        state.rockets.push(newRocket);
        state.stats.rocketsBuilt++;

        gameUtils.notify(`Ракета "${name}" создана!`, 'good');
        gameFunctions.addHistoryEntry('rocket', 'Ракета построена', name, true);

        // Clear input and update UI
        nameInput.value = '';
        this.renderAll();
    }

    // Render methods (delegated to modules)
    renderAll() {
        gameUtils.updateResourcesDisplay();
        this.updatePanelCounters();

        if (typeof renderRockets === 'function') renderRockets();
        if (typeof renderMissions === 'function') renderMissions();
        if (typeof renderTechTree === 'function') renderTechTree();
        if (typeof renderShop === 'function') renderShop();
        if (typeof renderStats === 'function') renderStats();
    }

    renderRockets() {
        // This will be implemented in rockets.js module
        console.log('Rendering rockets...');
    }

    renderMissions() {
        // This will be implemented in missions.js module
        console.log('Rendering missions...');
    }

    renderTechTree() {
        // This will be implemented in tech.js module
        console.log('Rendering tech tree...');
    }

    renderShop() {
        // This will be implemented in shop.js module
        console.log('Rendering shop...');
    }

    renderStats() {
        // This will be implemented in stats.js module
        console.log('Rendering stats...');
    }

    // Save/Load functionality will be implemented in save.js module
    saveGame() {
        if (typeof saveGame === 'function') saveGame();
    }

    loadGame() {
        if (typeof loadGame === 'function') loadGame();
    }

    resetGame() {
        if (typeof resetGame === 'function') resetGame();
    }

    autoSave() {
        if (state.settings.autoSave) {
            this.saveGame();

            // Show auto-save indicator
            const indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = '<i class="fas fa-save"></i> Авто-сохранение';
            document.body.appendChild(indicator);

            setTimeout(() => {
                indicator.remove();
            }, 2000);
        }
    }

    // Game control
    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
        this.lastTick = Date.now();
        this.gameLoop();
    }

    // Cleanup
    destroy() {
        this.isRunning = false;
        if (state.settings.autoSave) {
            this.saveGame();
        }
    }
}

// Initialize game when DOM is loaded
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new CosmoSimGame();
});

// Export for global access
window.game = game;