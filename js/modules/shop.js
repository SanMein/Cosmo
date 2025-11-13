// Shop Module
class ShopModule {
    constructor() {
        this.shopListEl = document.getElementById('shop-list');
    }

    render() {
        if (!this.shopListEl) return;

        const availableItems = state.shopItems.filter(item =>
            item.currentLevel < item.maxLevel
        );
        const maxedItems = state.shopItems.filter(item =>
            item.currentLevel >= item.maxLevel
        );

        this.shopListEl.innerHTML = `
            ${availableItems.length > 0 ? `
                <div class="shop-section">
                    <h3 style="margin-bottom: 1rem; color: var(--info);">
                        <i class="fas fa-shopping-cart"></i> Доступные улучшения
                    </h3>
                    <div class="shop-grid">
                        ${availableItems.map(item => this.renderShopItem(item)).join('')}
                    </div>
                </div>
            ` : ''}

            ${maxedItems.length > 0 ? `
                <div class="shop-section" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--success);">
                        <i class="fas fa-trophy"></i> Максимально улучшено
                    </h3>
                    <div class="shop-grid">
                        ${maxedItems.map(item => this.renderShopItem(item, true)).join('')}
                    </div>
                </div>
            ` : ''}

            ${state.shopItems.length === 0 ? `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--muted); margin-bottom: 1rem;"></i>
                    <h3>Магазин пуст</h3>
                    <p>Улучшения появятся по мере развития вашей космической программы!</p>
                </div>
            ` : ''}
        `;
    }

    renderShopItem(item, isMaxed = false) {
        const nextLevel = item.currentLevel + 1;
        const currentCost = this.calculateCurrentCost(item);
        const nextEffect = this.getNextLevelEffect(item);

        return `
            <div class="shop-item ${isMaxed ? 'maxed' : ''}">
                <div class="card-header">
                    <div class="shop-title">
                        <i class="fas ${this.getShopItemIcon(item.id)}"></i>
                        ${item.name}
                    </div>
                    <span class="shop-level">
                        Ур. ${item.currentLevel}/${item.maxLevel}
                    </span>
                </div>

                <div class="shop-description">
                    <p>${item.effect}</p>
                </div>

                ${!isMaxed ? `
                    <div class="shop-next-level">
                        <div class="next-level-title">Следующий уровень (${nextLevel}):</div>
                        <div class="next-level-effect">${nextEffect}</div>
                    </div>
                ` : `
                    <div class="shop-max-level">
                        <i class="fas fa-trophy"></i>
                        <span>Максимальный уровень достигнут!</span>
                    </div>
                `}

                <div class="shop-cost">
                    <div class="cost-title">${isMaxed ? 'Финальная стоимость' : 'Стоимость улучшения'}:</div>
                    <div class="cost-items">
                        <div class="cost-item ${state.money >= currentCost ? 'can-afford' : 'cannot-afford'}">
                            <i class="fas fa-coins"></i>
                            <span>${gameUtils.formatNumber(currentCost)}</span>
                        </div>
                    </div>
                </div>

                <div class="shop-actions">
                    ${isMaxed ? `
                        <button class="btn btn-success" disabled>
                            <i class="fas fa-trophy"></i> Максимум
                        </button>
                    ` : `
                        <button class="btn btn-primary"
                                onclick="shopModule.purchaseUpgrade(${item.id})"
                                ${state.money < currentCost ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> Улучшить
                        </button>
                    `}

                    <button class="btn btn-info" onclick="shopModule.showUpgradeDetails(${item.id})">
                        <i class="fas fa-chart-line"></i> Прогресс
                    </button>
                </div>
            </div>
        `;
    }

    getShopItemIcon(itemId) {
        const icons = {
            1: 'rocket',
            2: 'gas-pump',
            3: 'warehouse',
            4: 'flask',
            5: 'tools'
        };
        return icons[itemId] || 'shopping-cart';
    }

    calculateCurrentCost(item) {
        const baseCost = item.cost;
        return Math.floor(baseCost * Math.pow(1.5, item.currentLevel - 1));
    }

    getNextLevelEffect(item) {
        const effects = {
            1: `Лимит ракет: ${3 + item.currentLevel} → ${3 + item.currentLevel + 1}`,
            2: `Лимит топлива: ${state.storageLimits.fuel} → ${state.storageLimits.fuel + 1000}`,
            3: `Лимит деталей: ${state.storageLimits.parts} → ${state.storageLimits.parts + 1000}`,
            4: `Скорость исследований: +${(item.currentLevel - 1) * 10}% → +${item.currentLevel * 10}%`,
            5: `Скидка на ремонт: +${(item.currentLevel - 1) * 10}% → +${item.currentLevel * 10}%`
        };
        return effects[item.id] || 'Улучшение характеристик';
    }

    purchaseUpgrade(itemId) {
        const item = state.shopItems.find(i => i.id === itemId);
        if (!item || item.currentLevel >= item.maxLevel) return;

        const cost = this.calculateCurrentCost(item);

        if (state.money < cost) {
            gameUtils.notify('Недостаточно денег для улучшения!', 'bad');
            return;
        }

        // Confirm purchase for expensive upgrades
        if (cost > 100000) {
            gameUtils.confirm(
                `Вы уверены, что хотите улучшить "${item.name}" до уровня ${item.currentLevel + 1} за ${gameUtils.formatNumber(cost)} денег?`,
                `shopModule.confirmPurchase(${itemId})`
            );
        } else {
            this.confirmPurchase(itemId);
        }
    }

    confirmPurchase(itemId) {
        const item = state.shopItems.find(i => i.id === itemId);
        if (!item) return;

        const cost = this.calculateCurrentCost(item);

        // Spend money
        state.money -= cost;

        // Apply upgrade
        item.currentLevel++;
        this.applyUpgradeEffect(item);

        gameUtils.notify(
            `"${item.name}" улучшено до уровня ${item.currentLevel}!`,
            'good'
        );

        gameFunctions.addHistoryEntry(
            'upgrade',
            'Улучшение построено',
            `${item.name} → Ур. ${item.currentLevel}`,
            true
        );

        this.render();

        // Update other displays if needed
        if (typeof renderRockets === 'function') renderRockets();
        if (typeof renderTechTree === 'function') renderTechTree();
    }

    applyUpgradeEffect(item) {
        switch (item.id) {
            case 1: // Launch Pad
                state.launchPadLevel = item.currentLevel;
                break;

            case 2: // Fuel Tank
                state.storageLimits.fuel += 1000;
                break;

            case 3: // Parts Storage
                state.storageLimits.parts += 1000;
                break;

            case 4: // Research Lab
                state.researchLabLevel = item.currentLevel;
                break;

            case 5: // Workshop
                state.workshopLevel = item.currentLevel;
                break;
        }
    }

    showUpgradeDetails(itemId) {
        const item = state.shopItems.find(i => i.id === itemId);
        if (!item) return;

        const upgradePath = this.generateUpgradePath(item);
        const totalCost = this.calculateTotalCost(item);

        const modalContent = `
            <div class="upgrade-details">
                <div class="detail-section">
                    <h5>Прогресс улучшения</h5>
                    <div class="upgrade-progress">
                        ${gameUtils.createProgressBar((item.currentLevel / item.maxLevel) * 100, 'primary')}
                        <div class="progress-text">
                            Уровень ${item.currentLevel} из ${item.maxLevel}
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5>Путь улучшений</h5>
                    <div class="upgrade-path">
                        ${upgradePath.map(level => `
                            <div class="upgrade-level ${level.level <= item.currentLevel ? 'completed' : ''} ${level.level === item.currentLevel + 1 ? 'next' : ''}">
                                <div class="level-indicator">
                                    ${level.level <= item.currentLevel ?
                                        '<i class="fas fa-check"></i>' :
                                        level.level === item.currentLevel + 1 ?
                                        '<i class="fas fa-arrow-right"></i>' :
                                        level.level
                                    }
                                </div>
                                <div class="level-info">
                                    <div class="level-effect">${level.effect}</div>
                                    <div class="level-cost">${gameUtils.formatNumber(level.cost)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="detail-section">
                    <h5>Экономика улучшения</h5>
                    <div class="upgrade-economics">
                        <div class="economic-item">
                            <i class="fas fa-coins"></i>
                            <div>
                                <div class="economic-label">Уже потрачено:</div>
                                <div class="economic-value">${gameUtils.formatNumber(totalCost.spent)}</div>
                            </div>
                        </div>
                        <div class="economic-item">
                            <i class="fas fa-calculator"></i>
                            <div>
                                <div class="economic-label">Осталось до максимума:</div>
                                <div class="economic-value">${gameUtils.formatNumber(totalCost.remaining)}</div>
                            </div>
                        </div>
                        <div class="economic-item">
                            <i class="fas fa-chart-line"></i>
                            <div>
                                <div class="economic-label">Общая стоимость:</div>
                                <div class="economic-value">${gameUtils.formatNumber(totalCost.total)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5>Стратегическая ценность</h5>
                    <p>${this.getStrategicValue(item)}</p>
                </div>
            </div>
        `;

        gameUtils.showModal(`Детали улучшения: ${item.name}`, modalContent);
    }

    generateUpgradePath(item) {
        const path = [];

        for (let level = 1; level <= item.maxLevel; level++) {
            const cost = Math.floor(item.cost * Math.pow(1.5, level - 1));
            const effect = this.getLevelEffect(item, level);

            path.push({
                level: level,
                cost: cost,
                effect: effect
            });
        }

        return path;
    }

    getLevelEffect(item, level) {
        const effects = {
            1: level === 1 ?
                'Лимит ракет: 4' :
                `Лимит ракет: ${3 + level}`,

            2: level === 1 ?
                'Лимит топлива: 11,000' :
                `Лимит топлива: ${10000 + level * 1000}`,

            3: level === 1 ?
                'Лимит деталей: 11,000' :
                `Лимит деталей: ${10000 + level * 1000}`,

            4: `Скорость исследований: +${(level - 1) * 10}%`,
            5: `Скидка на ремонт: +${(level - 1) * 10}%`
        };

        return effects[item.id] || `Уровень ${level}`;
    }

    calculateTotalCost(item) {
        let spent = 0;
        let remaining = 0;
        let total = 0;

        for (let level = 1; level <= item.maxLevel; level++) {
            const cost = Math.floor(item.cost * Math.pow(1.5, level - 1));
            total += cost;

            if (level <= item.currentLevel) {
                spent += cost;
            } else {
                remaining += cost;
            }
        }

        return { spent, remaining, total };
    }

    getStrategicValue(item) {
        const values = {
            1: 'Увеличение лимита ракет позволяет одновременно содержать больше космических аппаратов, что значительно ускоряет выполнение миссий и увеличивает доход.',
            2: 'Больший запас топлива обеспечивает гибкость в планировании миссий и позволяет выполнять более длительные экспедиции.',
            3: 'Увеличенный склад деталей обеспечивает стабильность программы, позволяя переживать периоды нехватки ресурсов.',
            4: 'Ускорение исследований критически важно для быстрого технологического развития и получения конкурентного преимущества.',
            5: 'Снижение стоимости ремонта значительно экономит ресурсы в долгосрочной перспективе, особенно при частых миссиях.'
        };
        return values[item.id] || 'Это улучшение оказывает значительное влияние на эффективность вашей космической программы.';
    }

    canPurchase(item) {
        if (item.currentLevel >= item.maxLevel) return false;

        const cost = this.calculateCurrentCost(item);
        return state.money >= cost;
    }

    getAvailableUpgrades() {
        return state.shopItems.filter(item => this.canPurchase(item));
    }

    getUpgradeBonus(itemId) {
        const item = state.shopItems.find(i => i.id === itemId);
        if (!item) return 0;

        switch (item.id) {
            case 4: // Research Lab
                return (item.currentLevel - 1) * 0.1;
            case 5: // Workshop
                return (item.currentLevel - 1) * 0.1;
            default:
                return 0;
        }
    }
}

// Initialize shop module
const shopModule = new ShopModule();

// Global functions for HTML onclick handlers
window.shopModule = shopModule;

// Render function for game core
function renderShop() {
    shopModule.render();
}

// Export for game core
window.renderShop = renderShop;