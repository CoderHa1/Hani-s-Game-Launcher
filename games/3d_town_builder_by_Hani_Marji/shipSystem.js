import * as THREE from 'three';

export class ShipSystem {
    constructor(scene, buildingSystem, economySystem) {
        this.scene = scene;
        this.buildingSystem = buildingSystem;
        this.economySystem = economySystem;
        this.ships = [];
        this.shipMeshes = [];
        this.shipSpeed = 1.5; // Units per second
        this.tradeCooldown = 10; // Seconds between trade operations
        this.lastTradeTime = 0;
        this.tradeProducts = [
            { name: 'Electronics', value: 120, color: 0x3498db },
            { name: 'Machinery', value: 150, color: 0x2c3e50 },
            { name: 'Textiles', value: 80, color: 0xe74c3c },
            { name: 'Food', value: 100, color: 0xf1c40f },
            { name: 'Pharmaceuticals', value: 200, color: 0x9b59b6 },
            { name: 'Automotive', value: 180, color: 0x34495e },
            { name: 'Construction', value: 140, color: 0xd35400 }
        ];
        
        // Trade stats
        this.tradeStats = {
            totalShipments: 0,
            totalValue: 0,
            productStats: {}
        };
        
        // Create ship models
        this.createShipModels();
    }
    
    createShipModels() {
        // Ship colors
        this.shipColors = [
            0x3498db, // Blue
            0x2c3e50, // Dark Blue
            0xe74c3c, // Red
            0x7f8c8d  // Gray
        ];
        
        // Ship hull geometry
        this.shipHullGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.3);
        // Ship cabin geometry
        this.shipCabinGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
    }
    
    createShip(port, destination) {
        // Create ship meshes
        const shipColor = this.shipColors[Math.floor(Math.random() * this.shipColors.length)];
        const hullMaterial = new THREE.MeshStandardMaterial({ color: shipColor });
        const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        
        // Create ship group
        const shipGroup = new THREE.Group();
        
        // Create hull
        const hull = new THREE.Mesh(this.shipHullGeometry, hullMaterial);
        shipGroup.add(hull);
        
        // Create cabin
        const cabin = new THREE.Mesh(this.shipCabinGeometry, cabinMaterial);
        cabin.position.set(-0.2, 0.15, 0);
        shipGroup.add(cabin);
        
        // Add smokestacks
        const stackGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.2, 8);
        const stackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const stack1 = new THREE.Mesh(stackGeometry, stackMaterial);
        stack1.position.set(0.1, 0.2, 0);
        shipGroup.add(stack1);
        
        const stack2 = new THREE.Mesh(stackGeometry, stackMaterial);
        stack2.position.set(0.25, 0.2, 0);
        shipGroup.add(stack2);
        
        // Create cargo containers
        this.addCargoToShip(shipGroup);
        
        // Position ship near port but outside the visible map
        const portPosition = new THREE.Vector3(port.x, 0, port.z);
        const spawnOffset = new THREE.Vector3(
            -20 + Math.random() * 5, 
            0.5, // Height above water
            -20 + Math.random() * 5
        );
        
        shipGroup.position.copy(portPosition.clone().add(spawnOffset));
        shipGroup.lookAt(portPosition);
        shipGroup.castShadow = true;
        
        this.scene.add(shipGroup);
        this.shipMeshes.push(shipGroup);
        
        // Generate random products for this ship
        const productCount = 1 + Math.floor(Math.random() * 2); // 1-2 products
        const products = [];
        
        for (let i = 0; i < productCount; i++) {
            const product = this.tradeProducts[Math.floor(Math.random() * this.tradeProducts.length)];
            const quantity = 10 + Math.floor(Math.random() * 40); // 10-50 units
            products.push({
                ...product,
                quantity
            });
        }
        
        // Create ship data object
        const ship = {
            mesh: shipGroup,
            port: port,
            products: products,
            state: 'arriving', // arriving, docked, loading, departing
            targetPosition: new THREE.Vector3(port.x, 0.5, port.z),
            progress: 0,
            timer: 0,
            tradeDuration: 5 + Math.random() * 10, // 5-15 seconds for trading operation
            value: products.reduce((total, p) => total + (p.value * p.quantity), 0)
        };
        
        this.ships.push(ship);
        
        return ship;
    }
    
    addCargoToShip(shipGroup) {
        // Create cargo containers of different colors
        const containerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const containerColors = [0xe74c3c, 0xf1c40f, 0x3498db, 0x2ecc71];
        
        // Create 2x2 grid of containers
        for (let x = 0; x < 2; x++) {
            for (let z = 0; z < 2; z++) {
                const containerMaterial = new THREE.MeshStandardMaterial({ 
                    color: containerColors[Math.floor(Math.random() * containerColors.length)] 
                });
                const container = new THREE.Mesh(containerGeometry, containerMaterial);
                container.position.set(0.1 + x * 0.15, 0.15, -0.05 + z * 0.15);
                shipGroup.add(container);
            }
        }
    }
    
    spawnShipsForPorts() {
        // Get all ports
        const ports = this.buildingSystem.getBuildingsByType('port');
        if (ports.length === 0) return;
        
        // If we have fewer than 1 ship per port, spawn more ships
        if (this.ships.length < ports.length) {
            // Select a random port
            const port = ports[Math.floor(Math.random() * ports.length)];
            this.createShip(port);
        }
    }
    
    update(deltaTime) {
        // Update trade cooldown
        this.lastTradeTime += deltaTime;
        
        // Spawn ships periodically for ports
        if (this.lastTradeTime > this.tradeCooldown) {
            this.spawnShipsForPorts();
            this.lastTradeTime = 0;
        }
        
        // Update all ships
        for (let i = this.ships.length - 1; i >= 0; i--) {
            const ship = this.ships[i];
            
            switch (ship.state) {
                case 'arriving':
                    this.updateShipArriving(ship, deltaTime);
                    break;
                    
                case 'docked':
                    this.updateShipDocked(ship, deltaTime);
                    break;
                    
                case 'loading':
                    this.updateShipLoading(ship, deltaTime);
                    break;
                    
                case 'departing':
                    this.updateShipDeparting(ship, deltaTime, i);
                    break;
            }
            
            // Add a gentle rocking motion to ships
            if (ship.mesh) {
                const time = Date.now() * 0.001;
                ship.mesh.rotation.z = Math.sin(time * 0.5) * 0.05;
                ship.mesh.position.y = 0.5 + Math.sin(time * 0.8) * 0.05;
            }
        }
    }
    
    updateShipArriving(ship, deltaTime) {
        // Update progress
        ship.progress += deltaTime * this.shipSpeed * 0.3;
        
        // Move ship toward port
        const startPos = ship.mesh.position.clone();
        ship.mesh.position.lerp(ship.targetPosition, deltaTime * this.shipSpeed * 0.3);
        
        // Calculate distance to port
        const distanceToPort = ship.mesh.position.distanceTo(ship.targetPosition);
        
        // If close enough to port, switch to docked state
        if (distanceToPort < 1.0) {
            ship.state = 'docked';
            ship.timer = 0;
            
            // Announce ship arrival
            this.announceShipArrival(ship);
        }
    }
    
    updateShipDocked(ship, deltaTime) {
        // Wait at port for a while
        ship.timer += deltaTime;
        
        // After a short wait, start loading/unloading
        if (ship.timer > 2) {
            ship.state = 'loading';
            ship.timer = 0;
            this.startTrading(ship);
        }
    }
    
    updateShipLoading(ship, deltaTime) {
        // Update timer for loading duration
        ship.timer += deltaTime;
        
        // Animate loading process - make containers move up and down
        if (ship.mesh) {
            const containers = ship.mesh.children.filter(c => 
                c.geometry && c.geometry.type === 'BoxGeometry' && 
                c.geometry.parameters.width === 0.1);
                
            for (const container of containers) {
                // Make containers "bounce" during loading
                const bounceHeight = Math.sin(ship.timer * 3) * 0.1;
                // Only apply to containers above a certain height threshold
                if (container.position.y > 0.1) {
                    container.position.y = 0.15 + bounceHeight;
                }
            }
        }
        
        // After loading duration, depart
        if (ship.timer > ship.tradeDuration) {
            ship.state = 'departing';
            ship.timer = 0;
            ship.targetPosition = ship.mesh.position.clone().add(new THREE.Vector3(-20, 0, -20));
            
            // Complete trade
            this.completeTrade(ship);
        }
    }
    
    updateShipDeparting(ship, deltaTime, shipIndex) {
        // Move ship away from port
        ship.mesh.position.lerp(ship.targetPosition, deltaTime * this.shipSpeed * 0.5);
        
        // Calculate distance from starting point
        const distanceFromPort = ship.mesh.position.distanceTo(new THREE.Vector3(ship.port.x, 0.5, ship.port.z));
        
        // If ship has moved far enough away, remove it
        if (distanceFromPort > 25) {
            // Remove ship
            this.scene.remove(ship.mesh);
            this.ships.splice(shipIndex, 1);
            
            // Clean up mesh from meshes array
            const meshIndex = this.shipMeshes.indexOf(ship.mesh);
            if (meshIndex !== -1) {
                this.shipMeshes.splice(meshIndex, 1);
            }
        }
    }
    
    announceShipArrival(ship) {
        // Calculate total value of goods
        const totalValue = ship.products.reduce((sum, product) => sum + (product.value * product.quantity), 0);
        
        const productList = ship.products.map(p => `${p.quantity} units of ${p.name}`).join(', ');
        
        if (document.dispatchEvent) {
            document.dispatchEvent(new CustomEvent('game:shipArrival', { 
                detail: { 
                    products: productList,
                    value: totalValue,
                    port: ship.port
                } 
            }));
        }
    }
    
    startTrading(ship) {
        // Visual effects or animations for trading can be added here
        
        // Create floating text showing what's being traded
        this.createFloatingTradeText(ship);
    }
    
    createFloatingTradeText(ship) {
        // This would typically be done with HTML/CSS or a sprite
        // For simplicity, we'll just log to console
        console.log(`Trading at port: ${ship.products.map(p => `${p.quantity} ${p.name}`).join(', ')}`);
    }
    
    completeTrade(ship) {
        // Apply economic benefits from trade
        if (this.economySystem) {
            // Calculate trade value
            const tradeValue = ship.products.reduce((sum, product) => {
                return sum + (product.value * product.quantity);
            }, 0);
            
            // Add trade income
            const income = Math.floor(tradeValue * 0.1); // 10% of trade value as income
            
            // Update trade statistics
            this.tradeStats.totalShipments++;
            this.tradeStats.totalValue += tradeValue;
            
            // Update product-specific stats
            for (const product of ship.products) {
                if (!this.tradeStats.productStats[product.name]) {
                    this.tradeStats.productStats[product.name] = {
                        quantity: 0,
                        value: 0
                    };
                }
                this.tradeStats.productStats[product.name].quantity += product.quantity;
                this.tradeStats.productStats[product.name].value += product.value * product.quantity;
            }
            
            if (document.dispatchEvent) {
                document.dispatchEvent(new CustomEvent('game:tradeCompleted', { 
                    detail: { 
                        income: income,
                        products: ship.products,
                        port: ship.port,
                        tradeType: 'sea'
                    } 
                }));
            }
            
            // Apply market effects based on traded goods
            this.applyMarketEffects(ship.products);
        }
    }
    
    getTradeStats() {
        return this.tradeStats;
    }
    
    applyMarketEffects(products) {
        if (!this.economySystem) return;
        
        // Different products affect different parts of the economy
        for (const product of products) {
            switch(product.name) {
                case 'Electronics':
                case 'Machinery':
                    // Boost industrial sector
                    this.economySystem.marketPrices.industrial *= (1 + 0.01 * product.quantity / 100);
                    break;
                    
                case 'Textiles':
                case 'Food':
                case 'Automotive':
                    // Boost commercial sector
                    this.economySystem.marketPrices.commercial *= (1 + 0.01 * product.quantity / 100);
                    break;
                    
                case 'Construction':
                    // Reduce construction costs slightly
                    for (const category in this.economySystem.marketPrices) {
                        this.economySystem.marketPrices[category] *= (1 - 0.005 * product.quantity / 100);
                    }
                    break;
                    
                case 'Pharmaceuticals':
                    // Small happiness boost
                    const gameState = this.scene.userData.game && this.scene.userData.game.gameState;
                    if (gameState) {
                        gameState.happiness = Math.min(100, gameState.happiness + product.quantity / 100);
                    }
                    break;
            }
        }
    }
    
    clearShips() {
        // Remove all ship meshes from the scene
        for (const mesh of this.shipMeshes) {
            this.scene.remove(mesh);
        }
        
        // Clear arrays
        this.ships = [];
        this.shipMeshes = [];
    }
}