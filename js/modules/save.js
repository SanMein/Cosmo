// Save/Load System Module
class SaveModule {
    constructor() {
        this.storageKey = 'cosmo_sim_save_v2';
        this.backupKey = 'cosmo_sim_backup_v2';
        this.autoSaveInterval = 30000; // 30 seconds
        this.lastSave = Date.now();
    }

    saveGame() {
        try {
            // Update last save timestamp
            state.lastUpdate = Date.now();

            // Ensure all arrays exist
            gameFunctions.ensureArrays();

            // Create save data
            const saveData = {
                state: state,
                version: '2.0',
                timestamp: Date.now(),
                checksum: this.generateChecksum(state)
            };

            // Create backup first
            this.createBackup();

            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));

            this.lastSave = Date.now();
            gameUtils.notify('Игра сохранена!', 'good');

            return true;
        } catch (error) {
            console.error('Save error:', error);
            gameUtils.notify('Ошибка сохранения!', 'bad');
            return false;
        }
    }

    loadGame() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                console.log('No save found, starting new game');
                return false;
            }

            const saveData = JSON.parse(saved);

            // Verify version compatibility
            if (!this.isVersionCompatible(saveData.version)) {
                gameUtils.notify('Сохранение устаревшей версии!', 'bad');
                return false;
            }

            // Verify checksum
            if (!this.verifyChecksum(saveData.state, saveData.checksum)) {
                gameUtils.notify('Сохранение повреждено!', 'bad');
                return false;
            }

            // Migrate save data if needed
            const migratedState = this.migrateSaveData(saveData.state, saveData.version);

            // Clear current state and load new one
            gameFunctions.initializeState();
            Object.assign(state, migratedState);

            // Ensure all arrays exist
            gameFunctions.ensureArrays();

            // Update game time
            const timeDiff = Date.now() - state.lastUpdate;
            state.gameTime += Math.min(timeDiff, 24 * 60 * 60 * 1000); // Max 1 day offline progress

            gameUtils.notify('Игра загружена!', 'good');

            return true;
        } catch (error) {
            console.error('Load error:', error);
            gameUtils.notify('Ошибка загрузки!', 'bad');

            // Try to load backup
            if (this.loadBackup()) {
                gameUtils.notify('Загружена резервная копия!', 'info');
                return true;
            }

            return false;
        }
    }

    resetGame() {
        gameUtils.confirm(
            'Вы уверены, что хотите сбросить игру? Все прогресс будет потерян!',
            'saveModule.confirmReset()',
            'gameUtils.notify("Сброс отменен", "info")'
        );
    }

    confirmReset() {
        try {
            // Clear save data
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.backupKey);

            // Reset state
            gameFunctions.initializeState();

            gameUtils.notify('Игра сброшена!', 'good');

            return true;
        } catch (error) {
            console.error('Reset error:', error);
            gameUtils.notify('Ошибка сброса!', 'bad');
            return false;
        }
    }

    createBackup() {
        try {
            const currentSave = localStorage.getItem(this.storageKey);
            if (currentSave) {
                localStorage.setItem(this.backupKey, currentSave);
            }
        } catch (error) {
            console.error('Backup creation error:', error);
        }
    }

    loadBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (!backup) return false;

            const saveData = JSON.parse(backup);

            if (!this.isVersionCompatible(saveData.version) ||
                !this.verifyChecksum(saveData.state, saveData.checksum)) {
                return false;
            }

            gameFunctions.initializeState();
            Object.assign(state, saveData.state);
            gameFunctions.ensureArrays();
            return true;
        } catch (error) {
            console.error('Backup load error:', error);
            return false;
        }
    }

    generateChecksum(obj) {
        // Simple checksum for data integrity verification
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    verifyChecksum(obj, checksum) {
        return this.generateChecksum(obj) === checksum;
    }

    isVersionCompatible(version) {
        // Simple version compatibility check
        const currentMajor = parseInt('2.0'.split('.')[0]);
        const saveMajor = parseInt(version.split('.')[0]);
        return saveMajor === currentMajor;
    }

    migrateSaveData(oldState, oldVersion) {
        // Handle save data migration between versions
        let migratedState = gameFunctions.deepClone(oldState);

        // Migration from version 1.x to 2.0
        if (oldVersion.startsWith('1.')) {
            migratedState = this.migrateFromV1(oldState);
        }

        // Ensure all new fields exist
        migratedState = this.ensureDefaultFields(migratedState);

        return migratedState;
    }

    migrateFromV1(oldState) {
        const newState = gameFunctions.deepClone(defaultState);

        // Migrate basic resources
        if (oldState.money !== undefined) newState.money = oldState.money;
        if (oldState.fuel !== undefined) newState.fuel = oldState.fuel;
        if (oldState.parts !== undefined) newState.parts = oldState.parts;
        if (oldState.science !== undefined) newState.science = oldState.science;
        if (oldState.rocketParts !== undefined) newState.rocketParts = oldState.rocketParts;
        if (oldState.reputation !== undefined) newState.reputation = oldState.reputation;

        // Migrate rockets
        if (oldState.rockets && Array.isArray(oldState.rockets)) {
            newState.rockets = oldState.rockets.map(rocket => ({
                ...rocket,
                // Ensure new rocket fields exist
                condition: rocket.condition || 100,
                damaged: rocket.damaged || false,
                modules: rocket.modules || [],
                currentMission: rocket.currentMission || null,
                missionEnd: rocket.missionEnd || null
            }));
        }

        // Migrate research
        if (oldState.research && Array.isArray(oldState.research)) {
            newState.research = newState.research.map(newTech => {
                const oldTech = oldState.research.find(t => t.id === newTech.id);
                return oldTech ? { ...newTech, unlocked: oldTech.unlocked } : newTech;
            });
        }

        return newState;
    }

    ensureDefaultFields(currentState) {
        const defaultCopy = gameFunctions.deepClone(defaultState);

        // Recursively merge objects, preserving current values but adding missing defaults
        function mergeObjects(current, defaults) {
            const result = { ...defaults };

            for (const key in current) {
                if (current.hasOwnProperty(key)) {
                    if (typeof current[key] === 'object' && current[key] !== null &&
                        !Array.isArray(current[key]) &&
                        typeof defaults[key] === 'object' && defaults[key] !== null) {
                        result[key] = mergeObjects(current[key], defaults[key]);
                    } else {
                        result[key] = current[key];
                    }
                }
            }

            return result;
        }

        return mergeObjects(currentState, defaultCopy);
    }

    exportSave() {
        try {
            // Ensure arrays exist before export
            gameFunctions.ensureArrays();

            const saveData = {
                state: state,
                version: '2.0',
                timestamp: Date.now(),
                checksum: this.generateChecksum(state)
            };

            const dataStr = JSON.stringify(saveData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cosmo-sim-save-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            gameUtils.notify('Сохранение экспортировано!', 'good');
            return true;
        } catch (error) {
            console.error('Export error:', error);
            gameUtils.notify('Ошибка экспорта!', 'bad');
            return false;
        }
    }

    importSave(file) {
        if (!file) return false;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);

                if (!this.isVersionCompatible(saveData.version)) {
                    gameUtils.notify('Несовместимая версия сохранения!', 'bad');
                    return;
                }

                if (!this.verifyChecksum(saveData.state, saveData.checksum)) {
                    gameUtils.notify('Сохранение повреждено!', 'bad');
                    return;
                }

                gameUtils.confirm(
                    'Вы уверены, что хотите загрузить это сохранение? Текущий прогресс будет потерян.',
                    `saveModule.confirmImport(${JSON.stringify(saveData.state)})`
                );
            } catch (error) {
                console.error('Import error:', error);
                gameUtils.notify('Ошибка импорта! Файл поврежден.', 'bad');
            }
        };

        reader.readAsText(file);
    }

    confirmImport(importedState) {
        try {
            gameFunctions.initializeState();
            Object.assign(state, importedState);
            gameFunctions.ensureArrays();
            this.saveGame();
            gameUtils.notify('Сохранение импортировано!', 'good');

            // Reload the game
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Import confirmation error:', error);
            gameUtils.notify('Ошибка импорта!', 'bad');
        }
    }

    getSaveInfo() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return null;

            const saveData = JSON.parse(saved);
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                playTime: Math.floor(saveData.state.gameTime / 60000), // minutes
                rockets: saveData.state.rockets ? saveData.state.rockets.length : 0,
                money: saveData.state.money || 0,
                science: saveData.state.science || 0
            };
        } catch (error) {
            return null;
        }
    }

    autoSave() {
        const now = Date.now();
        if (now - this.lastSave >= this.autoSaveInterval && state.settings.autoSave) {
            this.saveGame();
        }
    }

    // Initialize auto-save loop
    initAutoSave() {
        setInterval(() => this.autoSave(), 5000); // Check every 5 seconds
    }
}

// Initialize save module
const saveModule = new SaveModule();

// Global functions for HTML onclick handlers
window.saveModule = saveModule;

// Core save/load functions for game
function saveGame() {
    return saveModule.saveGame();
}

function loadGame() {
    return saveModule.loadGame();
}

function resetGame() {
    return saveModule.resetGame();
}

// Export for game core
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;

// Initialize auto-save when module loads
document.addEventListener('DOMContentLoaded', () => {
    saveModule.initAutoSave();
});