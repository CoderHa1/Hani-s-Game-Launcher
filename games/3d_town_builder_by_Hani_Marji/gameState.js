export class GameState {
    constructor() {
        // Game progress
        this.dayCount = 1;
        this.timeOfDay = 0; // 0 to 1 representing a full day cycle

        // Resources – starting money is now 50000 dollars
        this.money = 50000; 
        this.population = 10; // Starting with some population
        this.happiness = 100; // 0-100

        // Taxation and economy
        this.taxRate = 10; // percent
        this.taxPerCitizen = 5; // Increased base tax amount per citizen per day for visible tax revenue

        // Income and expenses initialization
        this.income = 0;
        this.expenses = 0;

        // Building counts
        this.buildings = {
            residential: 0,
            commercial: 0,
            industrial: 0,
            civic: 0
        };

        // Zone allocations
        this.zones = {
            residential: 0,
            commercial: 0,
            industrial: 0
        };

        // Game speed (0 = paused, 1 = normal, 2 = fast, 3 = very fast)
        this.gameSpeed = 1;
        this.previousSpeed = 1;

        // Track events
        this.activeEvents = [];
        this.eventHistory = [];

        // Stats tracking
        this.stats = {
            moneyHistory: [50000],
            populationHistory: [10],
            happinessHistory: [100],
            buildingsConstructed: 0
        };
        
        // Sandbox mode
        this.sandboxMode = false;
        this.originalMoney = 50000;
    }

    reset() {
        this.dayCount = 1;
        this.timeOfDay = 0; // 0 to 1 representing a full day cycle
        this.money = 50000; 
        this.population = 10;
        this.happiness = 100;
        this.taxRate = 10;
        this.taxPerCitizen = 5; // Increased tax per citizen for visible tax revenue
        this.income = 0;
        this.expenses = 0;
        this.buildings = {
            residential: 0,
            commercial: 0,
            industrial: 0,
            civic: 0
        };
        this.zones = {
            residential: 0,
            commercial: 0,
            industrial: 0
        };
        this.gameSpeed = 1;
        this.previousSpeed = 1;
        this.activeEvents = [];
        this.eventHistory = [];
        this.stats = {
            moneyHistory: [50000],
            populationHistory: [10],
            happinessHistory: [100],
            buildingsConstructed: 0
        };
        
        // Reset sandbox mode
        this.sandboxMode = false;
        this.originalMoney = 50000;
    }

    recordDailyStats() {
        this.stats.moneyHistory.push(this.money);
        this.stats.populationHistory.push(this.population);
        this.stats.happinessHistory.push(this.happiness);

        // Keep only the last 30 days of history
        if (this.stats.moneyHistory.length > 30) {
            this.stats.moneyHistory.shift();
            this.stats.populationHistory.shift();
            this.stats.happinessHistory.shift();
        }
    }

    addEvent(event) {
        this.activeEvents.push(event);
    }

    completeEvent(eventId, outcome) {
        const eventIndex = this.activeEvents.findIndex(e => e.id === eventId);
        if (eventIndex >= 0) {
            const event = this.activeEvents[eventIndex];
            event.outcome = outcome;
            event.completed = true;
            event.completionDay = this.dayCount;

            this.eventHistory.push(event);
            this.activeEvents.splice(eventIndex, 1);
        }
    }

    calculatePopulationCapacity() {
        return this.buildings.residential * 10;
    }

    calculateJobAvailability() {
        return (this.buildings.commercial * 5) + (this.buildings.industrial * 15);
    }

    calculateHappinessModifiers() {
        const modifiers = {
            taxRate: this.taxRate > 15 ? (15 - this.taxRate) * 1.5 : (15 - this.taxRate) * 0.5, 
            jobRatio: 0,
            civicBuildings: Math.min(15, this.buildings.civic * 1.5), 
            pollutionEffect: 0,
            buildingBalanceEffect: 0,
            eventEffects: 0 
        };

        // Calculate job effects with better scaling
        const jobs = this.calculateJobAvailability();
        const population = this.population;

        if (population > 0) {
            const jobRatio = jobs / population;
            if (jobRatio < 0.5) {
                modifiers.jobRatio = -15 * (1 - jobRatio); // Stronger penalty for unemployment
            } else if (jobRatio >= 0.5 && jobRatio <= 1.2) {
                modifiers.jobRatio = 5 * (jobRatio - 0.5); // Positive effect for balanced job market
            } else if (jobRatio > 1.2) {
                modifiers.jobRatio = 8; // Maximum bonus for abundant jobs
            }
        }
        
        // Add pollution effect
        const buildingSystem = window.buildingSystem;
        if (buildingSystem) {
            const buildingImpacts = buildingSystem.calculateBuildingImpacts();
            const pollutionLevel = buildingImpacts.pollution;
            modifiers.pollutionEffect = -Math.min(20, pollutionLevel * 0.5);
            
            // Add building balance effect - reward balanced city development
            const totalBuildings = this.buildings.residential + this.buildings.commercial + this.buildings.industrial;
            if (totalBuildings > 10) {
                const residentialRatio = this.buildings.residential / totalBuildings;
                const commercialRatio = this.buildings.commercial / totalBuildings;
                const industrialRatio = this.buildings.industrial / totalBuildings;
                
                // Ideal ratios: 50% residential, 30% commercial, 20% industrial
                const balanceScore = 10 - (
                    Math.abs(residentialRatio - 0.5) * 20 +
                    Math.abs(commercialRatio - 0.3) * 15 +
                    Math.abs(industrialRatio - 0.2) * 10
                );
                
                modifiers.buildingBalanceEffect = Math.max(0, balanceScore);
            }
        }

        // Event effects remain unchanged
        for (const event of this.activeEvents) {
            if (event.effects && event.effects.happiness) {
                modifiers.eventEffects += event.effects.happiness;
            }
        }

        return modifiers;
    }

    updateHappiness() {
        const modifiers = this.calculateHappinessModifiers();

        // Base happiness scaled by city size
        let baseHappiness = Math.max(40, 70 - (this.population / 1000) * 5);
        
        // Apply all modifiers
        let newHappiness = baseHappiness;
        newHappiness += modifiers.taxRate;
        newHappiness += modifiers.jobRatio;
        newHappiness += modifiers.civicBuildings;
        newHappiness += modifiers.pollutionEffect;
        newHappiness += modifiers.buildingBalanceEffect;
        newHappiness += modifiers.eventEffects;
        
        // Apply scaling based on city size - larger cities have more happiness challenges
        const sizeFactor = Math.min(1, Math.max(0.7, 1 - (this.population / 5000) * 0.3));
        newHappiness *= sizeFactor;

        // Ensure happiness stays in valid range
        this.happiness = Math.max(0, Math.min(100, newHappiness));
    }

    calculateIncome() {
        const commercialIncome = this.buildings.commercial * 50;
        const industrialIncome = this.buildings.industrial * 100;
        const happinessMultiplier = this.happiness / 100;
        this.income = (commercialIncome + industrialIncome) * happinessMultiplier;
        return this.income;
    }

    calculateTaxRevenue() {
        const baseRevenue = this.population * this.taxPerCitizen * (this.taxRate / 10);
        const happinessMultiplier = this.happiness / 100;
        
        // Add property taxes from residential and commercial buildings
        const buildingSystem = window.buildingSystem;
        let buildingTaxes = 0;
        
        if (buildingSystem) {
            // Collect taxes from residential buildings
            const residentialBuildings = buildingSystem.getBuildingsByType('residential');
            for (const building of residentialBuildings) {
                const occupancyRate = Math.min(1, this.population / buildingSystem.calculateBuildingImpacts().populationCapacity);
                buildingTaxes += building.cost * 0.001 * occupancyRate * (this.taxRate / 10);
            }
            
            // Collect taxes from commercial buildings
            const commercialBuildings = buildingSystem.getBuildingsByType('commercial');
            for (const building of commercialBuildings) {
                buildingTaxes += building.income * 0.05 * (this.taxRate / 10);
            }
        }
        
        return baseRevenue * happinessMultiplier + buildingTaxes;
    }

    calculateExpenses() {
        const buildingMaintenance = (
            this.buildings.residential * 5 +
            this.buildings.commercial * 10 +
            this.buildings.industrial * 20 +
            this.buildings.civic * 30
        );

        const otherExpenses = this.population * 0.5;

        this.expenses = buildingMaintenance + otherExpenses;
        return this.expenses;
    }

    processDailyFinances() {
        const income = this.calculateIncome();
        const expenses = this.calculateExpenses();
        const netChange = income - expenses;
        this.money += netChange;
        return { income, expenses, netChange };
    }

    updatePopulation() {
        const capacity = this.calculatePopulationCapacity();

        if (this.population < capacity) {
            const growthRate = 0.05 * (this.happiness / 100);
            const newResidents = Math.min(
                Math.ceil(this.population * growthRate) + 1,
                capacity - this.population
            );
            this.population += newResidents;

            if (newResidents > 1) {
                document.dispatchEvent(new CustomEvent('game:populationGrowth', { 
                    detail: { amount: newResidents } 
                }));
            }
        } else if (this.population > capacity) {
            const leavingResidents = Math.ceil((this.population - capacity) * 0.2);
            this.population -= leavingResidents;

            if (leavingResidents > 0) {
                document.dispatchEvent(new CustomEvent('game:populationLoss', { 
                    detail: { amount: leavingResidents, reason: 'housing shortage' } 
                }));
            }
        }
    }
}