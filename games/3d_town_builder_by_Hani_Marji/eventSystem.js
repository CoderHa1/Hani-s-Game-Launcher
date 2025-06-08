export class EventSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.events = [];
        this.activeEvent = null;
        this.eventProbability = 0.05; // 5% chance of event per day
        this.lastEventDay = 0;
        this.cooldownDays = 3; // Minimum days between events
        
        // Define possible events
        this.possibleEvents = [
            {
                id: 'economic_boom',
                title: 'Economic Boom',
                description: 'The region is experiencing unexpected economic growth. This could benefit your town!',
                probability: 0.15,
                minDay: 10,
                options: [
                    {
                        text: 'Invest in infrastructure',
                        effect: () => {
                            this.gameState.money -= 500;
                            this.gameState.happiness += 10;
                            return 'You invested in infrastructure, boosting citizen happiness.';
                        },
                        condition: () => this.gameState.money >= 500
                    },
                    {
                        text: 'Attract new businesses',
                        effect: () => {
                            const marketPriceBoost = 0.15; // 15% boost
                            // Apply to the economy system's market prices
                            return 'You launched a business incentive program, increasing commercial growth.';
                        }
                    },
                    {
                        text: 'Do nothing',
                        effect: () => {
                            return 'You decided to let the boom take its natural course.';
                        }
                    }
                ]
            },
            {
                id: 'natural_disaster',
                title: 'Natural Disaster Warning',
                description: 'Meteorologists predict severe weather that could damage buildings in your town.',
                probability: 0.1,
                minDay: 5,
                options: [
                    {
                        text: 'Evacuate the town',
                        effect: () => {
                            this.gameState.happiness -= 5;
                            return 'You evacuated the town. Citizens are inconvenienced but safe.';
                        }
                    },
                    {
                        text: 'Reinforce buildings',
                        effect: () => {
                            this.gameState.money -= 1000;
                            return 'You spent money to reinforce buildings, minimizing potential damage.';
                        },
                        condition: () => this.gameState.money >= 1000
                    },
                    {
                        text: 'Ignore the warning',
                        effect: () => {
                            // 50% chance of disaster actually happening
                            if (Math.random() < 0.5) {
                                this.gameState.money -= 2000;
                                this.gameState.happiness -= 15;
                                return 'Disaster struck! Buildings are damaged and citizens are unhappy.';
                            } else {
                                this.gameState.happiness += 5;
                                return 'The disaster never materialized. Citizens are relieved and trust in your leadership increased.';
                            }
                        }
                    }
                ]
            },
            {
                id: 'population_surge',
                title: 'Population Surge',
                description: 'A neighboring city is experiencing issues, causing many to look for a new place to live.',
                probability: 0.2,
                minDay: 8,
                options: [
                    {
                        text: 'Welcome newcomers',
                        effect: () => {
                            const populationIncrease = Math.round(this.gameState.population * 0.2);
                            this.gameState.population += populationIncrease;
                            this.gameState.happiness -= 5;
                            return `You welcomed ${populationIncrease} new citizens. Housing is tight, but your town is growing.`;
                        }
                    },
                    {
                        text: 'Build emergency housing',
                        effect: () => {
                            this.gameState.money -= 1500;
                            const populationIncrease = Math.round(this.gameState.population * 0.3);
                            this.gameState.population += populationIncrease;
                            return `You built emergency housing and welcomed ${populationIncrease} new citizens.`;
                        },
                        condition: () => this.gameState.money >= 1500
                    },
                    {
                        text: 'Restrict immigration',
                        effect: () => {
                            this.gameState.happiness += 5;
                            return 'You restricted immigration to maintain quality of life for current residents.';
                        }
                    }
                ]
            },
            {
                id: 'industrial_accident',
                title: 'Industrial Accident',
                description: 'There has been an accident at one of your industrial facilities.',
                probability: 0.1,
                minDay: 12,
                condition: () => this.gameState.buildings.industrial > 0,
                options: [
                    {
                        text: 'Implement safety measures',
                        effect: () => {
                            this.gameState.money -= 800;
                            this.gameState.happiness += 5;
                            return 'You implemented new safety measures, reassuring citizens and workers.';
                        },
                        condition: () => this.gameState.money >= 800
                    },
                    {
                        text: 'Cover up the incident',
                        effect: () => {
                            // High risk option
                            if (Math.random() < 0.7) {
                                this.gameState.happiness -= 15;
                                return 'The cover-up was discovered! Citizens are outraged at your deception.';
                            } else {
                                return 'You successfully downplayed the incident, avoiding panic.';
                            }
                        }
                    },
                    {
                        text: 'Address the issue publicly',
                        effect: () => {
                            this.gameState.money -= 500;
                            return 'You addressed the issue publicly and promised reforms.';
                        },
                        condition: () => this.gameState.money >= 500
                    }
                ]
            },
            {
                id: 'tourism_opportunity',
                title: 'Tourism Opportunity',
                description: 'Your town has been mentioned in a popular travel blog, creating an opportunity to boost tourism.',
                probability: 0.15,
                minDay: 15,
                options: [
                    {
                        text: 'Launch marketing campaign',
                        effect: () => {
                            this.gameState.money -= 700;
                            // Apply to the economy system's commercial market prices
                            return 'Your marketing campaign attracted tourists, boosting local businesses.';
                        },
                        condition: () => this.gameState.money >= 700
                    },
                    {
                        text: 'Build tourist attractions',
                        effect: () => {
                            this.gameState.money -= 1200;
                            this.gameState.happiness += 8;
                            return 'You built new attractions that both tourists and locals enjoy.';
                        },
                        condition: () => this.gameState.money >= 1200
                    },
                    {
                        text: 'Ignore the opportunity',
                        effect: () => {
                            return 'You decided to focus on other priorities instead of tourism.';
                        }
                    }
                ]
            }
        ];
    }
    
    update(deltaTime) {
        // Check if we should trigger a new event
        if (this.activeEvent) {
            return; // Already have an active event
        }
        
        // Only check for new events once per day, near the start of the day
        if (this.gameState.timeOfDay >= 0.1 && this.gameState.timeOfDay <= 0.11 && 
            this.gameState.dayCount > this.lastEventDay + this.cooldownDays) {
            
            this.checkForNewEvent();
        }
    }
    
    checkForNewEvent() {
        // Determine if an event should happen
        if (Math.random() < this.eventProbability) {
            // Filter events that can currently happen based on conditions
            const eligibleEvents = this.possibleEvents.filter(event => {
                // Check minimum day requirement
                if (event.minDay && this.gameState.dayCount < event.minDay) {
                    return false;
                }
                
                // Check custom condition if it exists
                if (event.condition && !event.condition()) {
                    return false;
                }
                
                return true;
            });
            
            if (eligibleEvents.length > 0) {
                // Weight events by probability
                const totalProbability = eligibleEvents.reduce((sum, event) => sum + (event.probability || 1), 0);
                let random = Math.random() * totalProbability;
                
                for (const event of eligibleEvents) {
                    random -= (event.probability || 1);
                    if (random <= 0) {
                        this.triggerEvent(event);
                        break;
                    }
                }
            }
        }
    }
    
    triggerEvent(eventTemplate) {
        // Create a copy of the event with a unique ID
        const event = {
            ...eventTemplate,
            id: eventTemplate.id + '_' + Date.now(),
            triggered: this.gameState.dayCount,
            options: eventTemplate.options.filter(option => {
                // Filter out options with unmet conditions
                return !option.condition || option.condition();
            })
        };
        
        // Set as active event
        this.activeEvent = event;
        this.lastEventDay = this.gameState.dayCount;
        
        // Trigger UI notification
        this.notifyEvent(event);
    }
    
    notifyEvent(event) {
        // Get UI elements
        const eventNotification = document.getElementById('event-notification');
        const eventTitle = document.getElementById('event-title');
        const eventDescription = document.getElementById('event-description');
        const eventOptions = document.getElementById('event-options');
        
        // Update content
        eventTitle.textContent = event.title;
        eventDescription.textContent = event.description;
        
        // Clear previous options
        eventOptions.innerHTML = '';
        
        // Add option buttons
        event.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.addEventListener('click', () => this.handleEventOption(option));
            eventOptions.appendChild(button);
        });
        
        // Show the notification
        eventNotification.classList.remove('hidden');
    }
    
    handleEventOption(option) {
        if (!this.activeEvent) return;
        
        // Execute the effect of the option
        const result = option.effect();
        
        // Hide the event notification
        document.getElementById('event-notification').classList.add('hidden');
        
        // Add event to history with chosen outcome
        this.gameState.completeEvent(this.activeEvent.id, {
            option: option.text,
            result: result
        });
        
        // Clear active event
        this.activeEvent = null;
        
        // Show the result to the player
        alert(result);
    }
    
    getActiveEvent() {
        return this.activeEvent;
    }
}

