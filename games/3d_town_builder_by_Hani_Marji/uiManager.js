export class UIManager {
    constructor(gameState, game) {
        this.gameState = gameState;
        this.game = game;
        
        // UI elements
        this.populationDisplay = document.getElementById('population');
        this.moneyDisplay = document.getElementById('money');
        this.happinessDisplay = document.getElementById('happiness');
        this.dayCounter = document.getElementById('day-counter');
        this.timeOfDay = document.getElementById('time-of-day');
        this.buildingOptions = document.getElementById('building-options');
        this.infoContent = document.getElementById('info-content');
        this.speedBtn = document.getElementById('speed-btn');
        this.weatherDisplay = document.getElementById('weather-display');
        this.taxIncomeDisplay = null; // Will be created in updateResourceDisplay
        
        // Initialize UI
        this.updateResourceDisplay();
        this.setupBuildingOptionListeners();
        this.setupBuildMenuToggle();
        this.setupEventListeners();
        
    }
    
    update() {
        // Update time display
        this.updateTimeDisplay();
        
        // Update resource display every few frames
        if (Math.random() < 0.1) {
            this.updateResourceDisplay();
        }
    }
    
    updateResourceDisplay() {
        // Convert values to numbers to ensure we're using integers
        const population = parseInt(this.gameState.population);
        const money = Math.floor(parseFloat(this.gameState.money));
        const happiness = Math.floor(parseFloat(this.gameState.happiness));
        
        this.populationDisplay.textContent = population;
        this.moneyDisplay.textContent = money;
        this.happinessDisplay.textContent = `${happiness}%`;
        
        // Display tax income
        const taxIncome = Math.floor(this.gameState.calculateTaxRevenue());
        const taxElement = document.getElementById('tax-income-container');
        
        if (taxElement) {
            document.getElementById('tax-income').textContent = taxIncome;
        } else {
            // Create tax income display if it doesn't exist
            const newTaxElement = document.createElement('div');
            newTaxElement.className = 'resource';
            newTaxElement.id = 'tax-income-container';
            newTaxElement.innerHTML = `<span class="icon">💸</span> Tax: <span id="tax-income">${taxIncome}</span>`;
            document.getElementById('top-bar').appendChild(newTaxElement);
        }
        
        // Update stats panel
        this.updateStatsPanel();
    }
    
    updateStatsPanel() {
        // Get stats panel element
        const statsPanel = document.getElementById('stats-panel');
        if (!statsPanel) return;
        
        // Get building impact statistics
        const buildingImpacts = this.game.buildingSystem.calculateBuildingImpacts();
        const buildings = this.gameState.buildings;
        
        // Get happiness modifiers for display
        const happinessModifiers = this.gameState.calculateHappinessModifiers();
        const happinessFactors = Object.entries(happinessModifiers)
            .map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
                const sign = value >= 0 ? '+' : '';
                return `${formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)}: ${sign}${value.toFixed(1)}`;
            })
            .join(', ');
        
        // Update stats content
        statsPanel.innerHTML = `
            <h4>Town Statistics</h4>
            <div class="stat-row"><span>Population:</span> <span>${this.gameState.population}/${buildingImpacts.populationCapacity}</span></div>
            <div class="stat-row"><span>Daily Tax Income:</span> <span>$${Math.floor(this.gameState.calculateTaxRevenue())}</span></div>
            <div class="stat-row"><span>Daily Commercial Income:</span> <span>$${buildingImpacts.income}</span></div>
            <div class="stat-row"><span>Daily Maintenance:</span> <span>$${buildingImpacts.maintenance}</span></div>
            <div class="stat-row"><span>Available Jobs:</span> <span>${buildingImpacts.jobs}</span></div>
            <div class="stat-row"><span>Happiness Factors:</span> <span title="${happinessFactors}">${this.gameState.happiness.toFixed(1)}%</span></div>
            <div class="stat-divider"></div>
            <div class="stat-row"><span>Residential Buildings:</span> <span>${buildings.residential}</span></div>
            <div class="stat-row"><span>Commercial Buildings:</span> <span>${buildings.commercial}</span></div>
            <div class="stat-row"><span>Industrial Buildings:</span> <span>${buildings.industrial}</span></div>
            <div class="stat-row"><span>Civic Buildings:</span> <span>${buildings.civic}</span></div>
            <div class="stat-row"><span>Pollution Level:</span> <span>${buildingImpacts.pollution}</span></div>
        `;
    }
    
    updateTimeDisplay() {
        // Update day number:
        this.dayCounter.textContent = `Day ${this.gameState.dayCount}`;
        
        // Update weekday by retrieving it from the time system:
        const weekdayElement = document.getElementById('weekday-display');
        if (weekdayElement) {
            weekdayElement.textContent = this.game.timeSystem.getWeekday();
        }
        
        // Update digital clock display using the already defined getTimeString() in TimeSystem:
        const timeStringElement = document.getElementById('time-string');
        if (timeStringElement) {
            timeStringElement.textContent = this.game.timeSystem.getTimeString();
        }
        
        // Update descriptive time-of-day (e.g. "Morning", "Day", "Night")
        this.timeOfDay.textContent = this.game.timeSystem.getTimeDescription();
        
        // Update weather display if available:
        if (this.game.weatherSystem && this.weatherDisplay) {
            this.weatherDisplay.textContent = this.game.weatherSystem.getWeatherName();
        }
    }
    
    updateSpeedDisplay() {
        const speedTexts = ['Paused', 'Normal', 'Fast', 'Very Fast'];
        this.speedBtn.textContent = `Speed: ${speedTexts[this.gameState.gameSpeed]}`;
    }
    
    setupBuildingOptionListeners() {
        // This will be called when build mode is activated
    }
    
    setupBuildMenuToggle() {
        const toggleBtn = document.getElementById('toggle-build-panel');
        const buildMenu = document.getElementById('build-menu');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                buildMenu.classList.toggle('collapsed');
                toggleBtn.textContent = buildMenu.classList.contains('collapsed') ? '▲' : '▼';
            });
        }
    }
    
    setupEventListeners() {
        document.addEventListener('game:populationGrowth', e => this.showPopulationNotification(e.detail.amount, true));
        document.addEventListener('game:populationLoss', e => this.showPopulationNotification(e.detail.amount, false, e.detail.reason));
        document.addEventListener('game:newResidential', e => this.showNewResidentialNotification(e.detail));
        document.addEventListener('game:taxCollected', e => this.showTaxCollectionNotification(e.detail));
        document.addEventListener('game:shipArrival', e => this.showShipArrivalNotification(e.detail));
        document.addEventListener('game:planeArrival', e => this.showPlaneArrivalNotification(e.detail));
        document.addEventListener('game:tradeCompleted', e => this.showTradeCompletedNotification(e.detail));
    }
    
    showBuildingOptions(category) {
        // Clear previous options
        this.buildingOptions.innerHTML = '';
        
        if (!category || !this.game.buildingSystem.buildingTypes[category]) {
            return;
        }
        
        // Add buttons for each building type in the category
        for (const type in this.game.buildingSystem.buildingTypes[category]) {
            const buildingConfig = this.game.buildingSystem.buildingTypes[category][type];
            
            const button = document.createElement('button');
            button.className = 'building-option';
            
            // If this is the currently selected building type, add selected class
            if (this.game.buildingType === type) {
                button.classList.add('selected');
            }
            
            // Format name from snake_case to Title Case
            const formattedName = type
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            // Add cost and affordability indicator
            const canAfford = this.gameState.money >= buildingConfig.cost;
            const costColor = 'white';
            
            button.innerHTML = `
                <div class="building-option-icon" style="background-color: #${buildingConfig.color.toString(16)}"></div>
                <span>${formattedName}</span>
                <small style="color:${costColor}">$${buildingConfig.cost}</small>
            `;
            
            if (!canAfford) {
                button.classList.add('cant-afford');
                button.title = "Not enough money";
            }
            
            button.addEventListener('click', () => {
                if (canAfford) {
                    this.game.setBuildingType(type);
                    
                    // Highlight selected building option
                    document.querySelectorAll('.building-option').forEach(btn => btn.classList.remove('selected'));
                    button.classList.add('selected');
                } else {
                    this.showNotification("Not enough money to build " + formattedName, "error");
                }
            });
            
            this.buildingOptions.appendChild(button);
        }
    }
    
    clearBuildingOptions() {
        this.buildingOptions.innerHTML = '';
    }
    
    showBuildingInfo(building) {
        if (!building) return;
        
        // Format name from snake_case to Title Case
        const formattedName = building.type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        let infoHTML = `
            <h4>${formattedName}</h4>
            <p>Type: ${building.category.charAt(0).toUpperCase() + building.category.slice(1)}</p>
            <p>Constructed: Day ${building.constructed}</p>
        `;
        
        // Add building-specific stats
        if (building.capacity) {
            infoHTML += `<p>Capacity: ${building.capacity} residents</p>`;
        }
        
        if (building.jobs) {
            infoHTML += `<p>Jobs: ${building.jobs}</p>`;
        }
        
        if (building.income) {
            infoHTML += `<p>Income: $${building.income}/day</p>`;
        }
        
        if (building.maintenance) {
            infoHTML += `<p>Maintenance: $${building.maintenance}/day</p>`;
        }
        
        if (building.happiness) {
            const sign = building.happiness > 0 ? '+' : '';
            infoHTML += `<p>Happiness: ${sign}${building.happiness}%</p>`;
        }
        
        if (building.pollution) {
            infoHTML += `<p>Pollution: ${building.pollution}</p>`;
        }
        
        // Add trade stats for ports and airports
        if (building.type === 'port' && this.game.shipSystem) {
            const tradeStats = this.game.shipSystem.getTradeStats();
            infoHTML += `
                <div class="stat-divider"></div>
                <h5>Sea Trade Statistics</h5>
                <p>Total Shipments: ${tradeStats.totalShipments}</p>
                <p>Total Value: $${tradeStats.totalValue.toLocaleString()}</p>
                <p>Top Products: ${this.getTopProducts(tradeStats.productStats)}</p>
            `;
        }
        
        if (building.type === 'airport' && this.game.airCargoSystem) {
            const tradeStats = this.game.airCargoSystem.getTradeStats();
            infoHTML += `
                <div class="stat-divider"></div>
                <h5>Air Cargo Statistics</h5>
                <p>Total Shipments: ${tradeStats.totalShipments}</p>
                <p>Total Value: $${tradeStats.totalValue.toLocaleString()}</p>
                <p>Top Products: ${this.getTopProducts(tradeStats.productStats)}</p>
            `;
        }
        
        // Add demolish button
        infoHTML += `
            <button id="demolish-btn" class="danger-btn">Demolish ($${Math.floor(building.cost * 0.2)})</button>
        `;
        
        this.infoContent.innerHTML = infoHTML;
        
        // Add event listener for demolish button
        document.getElementById('demolish-btn').addEventListener('click', () => {
            this.demolishBuilding(building);
        });
    }
    
    getTopProducts(productStats) {
        if (!productStats || Object.keys(productStats).length === 0) {
            return "None yet";
        }
        
        // Sort products by value
        const sortedProducts = Object.entries(productStats)
            .sort((a, b) => b[1].value - a[1].value)
            .slice(0, 2); // Top 2 products
            
        return sortedProducts.map(([name, stats]) => `${name} (${stats.quantity})`).join(', ');
    }
    
    showTileInfo(tile) {
        if (!tile) return;
        
        let infoHTML = `
            <h4>Terrain</h4>
            <p>Type: ${tile.type ? (tile.type.charAt(0).toUpperCase() + tile.type.slice(1)) : 'Unknown'}</p>
            <p>Position: (${tile.x.toFixed(1)}, ${tile.z.toFixed(1)})</p>
            <p>Elevation: ${tile.elevation.toFixed(2)}</p>
        `;
        
        this.infoContent.innerHTML = infoHTML;
    }
    
    demolishBuilding(building) {
        if (confirm(`Are you sure you want to demolish this ${building.type}?`)) {
            // Remove building
            const success = this.game.buildingSystem.removeBuilding(building.x, building.z);
            
            if (success) {
                // Refund partial cost
                this.gameState.money += building.cost * 0.2;
                
                this.showNotification(`Building demolished`, "info");
                this.infoContent.innerHTML = '<p>Select a building or area to see details.</p>';
                this.updateResourceDisplay();
            }
        }
    }
    
    showNotification(message, type = "info") {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = 1;
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = 0;
            notification.style.transform = 'translateY(-20px)';
            
            // Remove from DOM after fade out
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    showPopulationNotification(amount, isGrowth, reason = '') {
        const message = isGrowth 
            ? `${amount} new residents moved into your town!` 
            : `${amount} residents left your town${reason ? ' due to ' + reason : ''}`;
            
        this.showNotification(message, isGrowth ? "success" : "warning");
    }
    
    showNewResidentialNotification(details) {
        const formattedType = details.type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
        this.showNotification(`Built new ${formattedType} with capacity for ${details.capacity} residents. ${details.populationIncrease} people moved in!`, "success");
    }
    
    showWeatherChangeNotification(detail) {
        // This function is intentionally not being used anymore
        const fromWeather = detail.from.charAt(0).toUpperCase() + detail.from.slice(1);
        const toWeather = detail.to.charAt(0).toUpperCase() + detail.to.slice(1);
        
        // Don't show notification anymore
        // this.showNotification(`Weather changing from ${fromWeather} to ${toWeather}`, "info");
    }
    
    showTaxCollectionNotification(detail) {
        const amount = detail.amount;
        this.showNotification(`Collected $${amount} in taxes`, "info");
        // Force immediate update of UI after tax collection
        this.updateResourceDisplay();
    }
    
    showShipArrivalNotification(detail) {
        this.showNotification(`Ship arrived at port with ${detail.products}`, "info");
    }

    showPlaneArrivalNotification(detail) {
        this.showNotification(`Cargo plane arrived at airport with ${detail.products}`, "info");
    }

    showTradeCompletedNotification(detail) {
        this.gameState.money += detail.income;
        const tradeType = detail.tradeType === 'air' ? 'Air cargo' : 'Ship';
        this.showNotification(`${tradeType} trade completed: $${detail.income} added to treasury`, "success");
        // Force immediate update of UI after transaction
        this.updateResourceDisplay();
    }
}