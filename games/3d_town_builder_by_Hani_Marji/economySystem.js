export class EconomySystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.lastUpdateDay = 1;
        this.lastTaxDay = gameState.dayCount;  
        this.dailyUpdateTime = 0.99; 
        // Economic indicators
        this.economicGrowth = 0.01; 
        this.inflation = 0.005; 
        this.unemployment = 0.05; 
        // Job market
        this.jobDemand = 1.0; 
        
        // Market prices
        this.marketPrices = {
            residential: 1.0,
            commercial: 1.0,
            industrial: 1.0
        };
    }
    
    update(deltaTime) {
        // Check for day change - only process tax collection once per day at the start of the day
        if (this.gameState.dayCount > this.lastTaxDay) {
            const taxRevenue = Math.floor(this.gameState.calculateTaxRevenue());
            this.gameState.money += taxRevenue;
            this.lastTaxDay = this.gameState.dayCount;
            
            // Dispatch event about tax collection with the actual amount
            document.dispatchEvent(new CustomEvent('game:taxCollected', { 
                detail: { amount: taxRevenue } 
            }));
        }
        
        if (this.gameState.dayCount > this.lastUpdateDay) {
            this.processDailyUpdate();
            this.lastUpdateDay = this.gameState.dayCount;
        }
    }
    
    processDailyUpdate() {
        const finances = this.gameState.processDailyFinances();
        
        this.gameState.updatePopulation();
        
        this.gameState.updateHappiness();
        
        this.updateEconomicIndicators();
        
        this.gameState.recordDailyStats();
        
        return finances;
    }
    
    updateEconomicIndicators() {
        const jobs = this.gameState.calculateJobAvailability();
        const population = this.gameState.population;
        
        if (population > 0) {
            this.unemployment = Math.max(0, 1 - (jobs / population));
        } else {
            this.unemployment = 0;
        }
        
        const baseGrowth = 0.01; 
        const unemploymentFactor = 1 - (this.unemployment * 2); 
        const happinessFactor = this.gameState.happiness / 50; 
        
        this.economicGrowth = baseGrowth * unemploymentFactor * happinessFactor;
        
        this.economicGrowth = Math.max(-0.05, Math.min(0.05, this.economicGrowth));
        
        this.updateMarketPrices();
        
        this.applyMarketFluctuations();
    }
    
    updateMarketPrices() {
        const housingCapacity = this.gameState.calculatePopulationCapacity();
        const housingOccupancy = this.gameState.population / housingCapacity;
        
        if (housingOccupancy > 0.9) {
            this.marketPrices.residential *= 1.01;
        } else if (housingOccupancy < 0.7) {
            this.marketPrices.residential *= 0.99;
        }
        
        const commercialRatio = this.gameState.buildings.commercial / (this.gameState.population / 20 + 1);
        
        if (commercialRatio < 0.8) {
            this.marketPrices.commercial *= 1.01;
        } else if (commercialRatio > 1.2) {
            this.marketPrices.commercial *= 0.99;
        }
        
        const industrialRatio = this.gameState.buildings.industrial / (this.gameState.buildings.commercial / 2 + 1);
        
        if (industrialRatio < 0.8) {
            this.marketPrices.industrial *= 1.01;
        } else if (industrialRatio > 1.2) {
            this.marketPrices.industrial *= 0.99;
        }
        
        for (const key in this.marketPrices) {
            this.marketPrices[key] *= (1 + this.inflation);
        }
        
        for (const key in this.marketPrices) {
            this.marketPrices[key] = Math.max(0.5, Math.min(2.0, this.marketPrices[key]));
        }
    }
    
    applyMarketFluctuations() {
        for (const key in this.marketPrices) {
            const fluctuation = 1 + (Math.random() * 0.04 - 0.02); 
            this.marketPrices[key] *= fluctuation;
        }
    }
    
    calculateBuildingValue(building) {
        const baseValue = building.cost;
        const age = this.gameState.dayCount - building.constructed;
        const depreciation = Math.max(0.5, 1 - (age * 0.001)); 
        
        let marketMultiplier = 1;
        if (building.category in this.marketPrices) {
            marketMultiplier = this.marketPrices[building.category];
        }
        
        return Math.round(baseValue * depreciation * marketMultiplier);
    }
    
    calculateROI(building) {
        if (!building) return 0;
        
        const cost = building.cost;
        const dailyIncome = building.income || 0;
        const dailyMaintenance = building.maintenance || 0;
        
        const dailyProfit = dailyIncome - dailyMaintenance;
        
        if (cost === 0) return 0;
        
        return (dailyProfit / cost) * 100;
    }
    
    calculateTaxIncome() {
        return this.gameState.population * this.gameState.taxRate * 0.1 * (this.gameState.happiness / 100);
    }
    
    calculateProjections() {
        return {
            population: this.gameState.population * (1 + Math.min(0.05, Math.max(-0.05, 
                0.01 * (this.gameState.happiness / 100 - 0.5) + 0.01 * (1 - this.unemployment)
            ))),
            money: this.gameState.money + (this.gameState.income - this.gameState.expenses) * 7, 
            happiness: Math.min(100, Math.max(0, 
                this.gameState.happiness + (50 - this.unemployment * 100 + this.economicGrowth * 100) * 0.01
            ))
        };
    }
}