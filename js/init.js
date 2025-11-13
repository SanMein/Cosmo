// Game Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Cosmo Sim...');

    try {
        // Initialize all modules
        if (typeof game !== 'undefined') {
            console.log('Game core initialized');
        }

        if (typeof gameUtils !== 'undefined') {
            console.log('Game utilities initialized');
        }

        if (typeof rocketsModule !== 'undefined') {
            console.log('Rockets module initialized');
        }

        if (typeof missionsModule !== 'undefined') {
            console.log('Missions module initialized');
        }

        if (typeof techModule !== 'undefined') {
            console.log('Tech module initialized');
        }

        if (typeof shopModule !== 'undefined') {
            console.log('Shop module initialized');
        }

        if (typeof statsModule !== 'undefined') {
            console.log('Stats module initialized');
        }

        if (typeof saveModule !== 'undefined') {
            console.log('Save module initialized');
        }

        // Ensure state is properly initialized
        gameFunctions.ensureArrays();

        // Load saved game or initialize new game
        const loaded = loadGame();
        console.log('Game loaded:', loaded);

        // Initial render
        if (typeof game !== 'undefined' && game.renderAll) {
            game.renderAll();
        }

        // Show welcome message
        setTimeout(() => {
            if (loaded) {
                gameUtils.notify('Добро пожаловать обратно в Cosmo Sim!', 'info', 3000);
            } else {
                gameUtils.notify('Добро пожаловать в Cosmo Sim! Начните свою космическую программу!', 'info', 5000);
            }
        }, 500);

        console.log('Cosmo Sim initialized successfully!');

    } catch (error) {
        console.error('Initialization error:', error);
        // Try to show error notification if utils are available
        if (typeof gameUtils !== 'undefined') {
            gameUtils.notify('Ошибка инициализации игры!', 'bad');
        } else {
            alert('Ошибка инициализации игры! Проверьте консоль для деталей.');
        }
    }

    // Add some debug helpers
    window.debug = {
        state: () => state,
        addResources: (money = 0, fuel = 0, parts = 0, science = 0, rocketParts = 0) => {
            state.money += money;
            state.fuel += fuel;
            state.parts += parts;
            state.science += science;
            state.rocketParts += rocketParts;
            if (window.game && window.game.renderAll) {
                window.game.renderAll();
            }
            if (window.gameUtils) {
                gameUtils.notify('Ресурсы добавлены (debug)', 'info');
            }
        },
        completeResearch: (techId) => {
            const tech = state.research.find(t => t.id === techId);
            if (tech) {
                tech.unlocked = true;
                if (window.techModule && window.techModule.render) {
                    window.techModule.render();
                }
                if (window.gameUtils) {
                    gameUtils.notify(`Исследование ${tech.name} завершено (debug)`, 'info');
                }
            }
        },
        unlockAll: () => {
            if (state.research) state.research.forEach(tech => tech.unlocked = true);
            if (state.missions) state.missions.forEach(mission => mission.unlocked = true);
            if (window.game && window.game.renderAll) {
                window.game.renderAll();
            }
            if (window.gameUtils) {
                gameUtils.notify('Все исследования и миссии разблокированы (debug)', 'info');
            }
        },
        fixState: () => {
            gameFunctions.ensureArrays();
            console.log('State fixed:', state);
            if (window.gameUtils) {
                gameUtils.notify('Состояние игры исправлено (debug)', 'info');
            }
        }
    };
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    if (typeof gameUtils !== 'undefined') {
        gameUtils.notify('Произошла ошибка в игре. Проверьте консоль для деталей.', 'bad');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    if (typeof gameUtils !== 'undefined') {
        gameUtils.notify('Ошибка в игре. Проверьте консоль.', 'bad');
    }
});

// Export for global access
window.CosmoSim = {
    version: '2.0',
    modules: {
        game: window.game,
        utils: window.gameUtils,
        rockets: window.rocketsModule,
        missions: window.missionsModule,
        tech: window.techModule,
        shop: window.shopModule,
        stats: window.statsModule,
        save: window.saveModule
    }
};