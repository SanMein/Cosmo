// Utility Functions and DOM Management
class GameUtils {
    constructor() {
        this.resourcesEl = document.getElementById('resources');
        this.rocketListEl = document.getElementById('rocket-list');
        this.missionListEl = document.getElementById('mission-list');
        this.techTreeEl = document.getElementById('tech-tree');
        this.shopListEl = document.getElementById('shop-list');
        this.statsGridEl = document.getElementById('stats-grid');
        this.historyListEl = document.getElementById('history-list');
        this.notificationsEl = document.getElementById('notifications');

        this.initializeDOM();
    }

    initializeDOM() {
        // Check if all required DOM elements are present
        const requiredElements = [
            this.resourcesEl, this.rocketListEl, this.missionListEl,
            this.techTreeEl, this.shopListEl, this.statsGridEl,
            this.historyListEl, this.notificationsEl
        ];

        const missingElements = requiredElements.filter(el => !el);
        if (missingElements.length > 0) {
            console.error('Missing DOM elements:', missingElements);
            throw new Error('DOM initialization failed');
        }
    }

    // Notification System
    notify(message, type = 'info', duration = 3000) {
        if (!state.settings.notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icons = {
            good: 'check-circle',
            bad: 'exclamation-triangle',
            info: 'info-circle',
            warning: 'exclamation-circle'
        };

        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        `;

        this.notificationsEl.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);

        return notification;
    }

    // Modal System
    showModal(title, content, actions = []) {
        const modalHTML = `
            <div class="modal-bg">
                <div class="modal">
                    <h3>${title}</h3>
                    <div class="modal-content">${content}</div>
                    <div class="modal-actions">
                        ${actions.map(action => `
                            <button class="btn ${action.class || 'btn-primary'}"
                                    onclick="${action.onclick}">
                                <i class="fas fa-${action.icon || 'check'}"></i>
                                ${action.text}
                            </button>
                        `).join('')}
                        <button class="btn btn-danger closebtn" onclick="closeModal()">
                            <i class="fas fa-times"></i> Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal-bg');
        modals.forEach(modal => {
            modal.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => modal.remove(), 300);
        });
    }

    // Resource Display
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else if (minutes > 0) {
            return `${minutes}м ${secs}с`;
        } else {
            return `${secs}с`;
        }
    }

    updateResourcesDisplay() {
        const resources = [
            { icon: 'coins', value: state.money, max: null, color: '#f39c12' },
            { icon: 'gas-pump', value: state.fuel, max: state.storageLimits.fuel, color: '#3498db' },
            { icon: 'cog', value: state.parts, max: state.storageLimits.parts, color: '#95a5a6' },
            { icon: 'atom', value: state.science, max: null, color: '#9b59b6' },
            { icon: 'rocket', value: state.rocketParts, max: state.storageLimits.rocketParts, color: '#e74c3c' },
            { icon: 'star', value: state.reputation, max: null, color: '#f1c40f' }
        ];

        this.resourcesEl.innerHTML = resources.map(resource => `
            <div class="resource-item" style="border-left-color: ${resource.color}">
                <i class="fas fa-${resource.icon}"></i>
                <span class="resource-label">${this.getResourceLabel(resource.icon)}:</span>
                <span class="resource-value">${this.formatNumber(resource.value)}</span>
                ${resource.max ? `<span class="resource-max">/ ${this.formatNumber(resource.max)}</span>` : ''}
            </div>
        `).join('');
    }

    getResourceLabel(icon) {
        const labels = {
            'coins': 'Деньги',
            'gas-pump': 'Топливо',
            'cog': 'Детали',
            'atom': 'Наука',
            'rocket': 'Ракетные части',
            'star': 'Репутация'
        };
        return labels[icon] || icon;
    }

    // Tab Management
    switchTab(tabName) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Trigger tab-specific rendering
        this.onTabSwitch(tabName);
    }

    onTabSwitch(tabName) {
        switch (tabName) {
            case 'rockets':
                if (typeof renderRockets === 'function') renderRockets();
                break;
            case 'missions':
                if (typeof renderMissions === 'function') renderMissions();
                break;
            case 'tech':
                if (typeof renderTechTree === 'function') renderTechTree();
                break;
            case 'shop':
                if (typeof renderShop === 'function') renderShop();
                break;
            case 'stats':
                if (typeof renderStats === 'function') renderStats();
                break;
        }
    }

    // Progress Bar
    createProgressBar(percentage, color = 'primary') {
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%; background: var(--${color})"></div>
            </div>
        `;
    }

    // Status Badge
    createStatusBadge(status, text = null) {
        const statusMap = {
            'ready': { class: 'status-ready', text: 'Готова' },
            'preparing': { class: 'status-preparing', text: 'Подготовка' },
            'launched': { class: 'status-launched', text: 'В полёте' },
            'exploring': { class: 'status-exploring', text: 'На миссии' },
            'failed': { class: 'status-failed', text: 'Провал' },
            'unlocked': { class: 'status-unlocked', text: 'Изучено' },
            'locked': { class: 'status-locked', text: 'Заблокировано' },
            'researching': { class: 'status-researching', text: 'Изучается' }
        };

        const statusInfo = statusMap[status] || { class: 'status-locked', text: status };
        return `<span class="status-badge ${statusInfo.class}">${text || statusInfo.text}</span>`;
    }

    // Confirmation Dialog
    confirm(message, onConfirm, onCancel = null) {
        this.showModal(
            'Подтверждение',
            `<p>${message}</p>`,
            [
                {
                    text: 'Подтвердить',
                    class: 'btn-danger',
                    icon: 'check',
                    onclick: `(() => { ${onConfirm}; closeModal(); })()`
                },
                {
                    text: 'Отмена',
                    class: 'btn-muted',
                    icon: 'times',
                    onclick: onCancel ? `(() => { ${onCancel}; closeModal(); })()` : 'closeModal()'
                }
            ]
        );
    }

    // Resource Check
    hasResources(cost) {
        return (
            state.money >= (cost.money || 0) &&
            state.fuel >= (cost.fuel || 0) &&
            state.parts >= (cost.parts || 0) &&
            state.science >= (cost.science || 0) &&
            state.rocketParts >= (cost.rocketParts || 0)
        );
    }

    spendResources(cost) {
        if (!this.hasResources(cost)) {
            return false;
        }

        state.money -= cost.money || 0;
        state.fuel -= cost.fuel || 0;
        state.parts -= cost.parts || 0;
        state.science -= cost.science || 0;
        state.rocketParts -= cost.rocketParts || 0;

        return true;
    }

    // Local Storage Utilities
    getStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    setStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            this.notify('Ошибка сохранения!', 'bad');
            return false;
        }
    }

    // Animation Helpers
    animateElement(element, animationClass, removeAfter = true) {
        element.classList.add(animationClass);

        if (removeAfter) {
            const onAnimationEnd = () => {
                element.classList.remove(animationClass);
                element.removeEventListener('animationend', onAnimationEnd);
            };
            element.addEventListener('animationend', onAnimationEnd);
        }
    }

    // Random Utilities
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Time Utilities
    getCurrentTimestamp() {
        return Date.now();
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Validation
    validateRocketName(name) {
        if (!name || name.trim().length === 0) {
            return { valid: false, message: 'Название ракеты не может быть пустым' };
        }

        if (name.length > 20) {
            return { valid: false, message: 'Название не может быть длиннее 20 символов' };
        }

        if (state.rockets.some(rocket => rocket.name === name.trim())) {
            return { valid: false, message: 'Ракета с таким названием уже существует' };
        }

        return { valid: true };
    }
}

// Initialize utilities
const utils = new GameUtils();

// Global functions for HTML onclick handlers
window.notify = (message, type, duration) => utils.notify(message, type, duration);
window.closeModal = () => utils.closeModal();
window.switchTab = (tabName) => utils.switchTab(tabName);

// Export for modules
window.gameUtils = utils;