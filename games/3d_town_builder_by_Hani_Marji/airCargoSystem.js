import * as THREE from 'three';

export class AirCargoSystem {
    constructor(scene, buildingSystem, economySystem) {
        this.scene = scene;
        this.buildingSystem = buildingSystem;
        this.economySystem = economySystem;
        this.planes = [];
        this.planeMeshes = [];
        this.planeSpeed = 2.5; 
        this.tradeCooldown = 8; 
        this.lastTradeTime = 0;
        this.tradeProducts = [
            { name: 'Electronics', value: 150, color: 0x3498db },
            { name: 'Precision Instruments', value: 220, color: 0x2980b9 },
            { name: 'Pharmaceuticals', value: 250, color: 0x9b59b6 },
            { name: 'Luxury Goods', value: 300, color: 0xf39c12 },
            { name: 'Medical Supplies', value: 180, color: 0xe74c3c },
            { name: 'Perishables', value: 120, color: 0x2ecc71 }
        ];
        
        this.tradeStats = {
            totalShipments: 0,
            totalValue: 0,
            productStats: {}
        };
        
        this.createPlaneModels();
    }
    
    createPlaneModels() {
        this.planeColors = [
            0x3498db, 
            0xe74c3c, 
            0xf1c40f, 
            0x2ecc71  
        ];
    }
    
    createPlane(airport) {
        const planeGroup = new THREE.Group();
        
        const planeColor = this.planeColors[Math.floor(Math.random() * this.planeColors.length)];
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: planeColor });
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2; 
        planeGroup.add(body);
        
        const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const wingGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.2);
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        planeGroup.add(wings);
        
        const tailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
        const tail = new THREE.Mesh(tailGeometry, wingMaterial);
        tail.position.set(-0.4, 0.1, 0);
        planeGroup.add(tail);
        
        const cockpitMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.7
        });
        const cockpitGeometry = new THREE.SphereGeometry(0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.rotation.x = Math.PI;
        cockpit.position.set(0.3, 0, 0);
        planeGroup.add(cockpit);
        
        const spawnHeight = 30; 
        const spawnOffset = new THREE.Vector3(
            -50 + Math.random() * 10, 
            spawnHeight,
            -50 + Math.random() * 10
        );
        
        planeGroup.position.copy(new THREE.Vector3(airport.x, 0, airport.z).add(spawnOffset));
        planeGroup.lookAt(new THREE.Vector3(airport.x, spawnHeight, airport.z));
        planeGroup.castShadow = true;
        
        this.scene.add(planeGroup);
        this.planeMeshes.push(planeGroup);
        
        const productCount = 1 + Math.floor(Math.random() * 2); 
        const products = [];
        
        for (let i = 0; i < productCount; i++) {
            const product = this.tradeProducts[Math.floor(Math.random() * this.tradeProducts.length)];
            const quantity = 5 + Math.floor(Math.random() * 25); 
            products.push({
                ...product,
                quantity
            });
        }
        
        const plane = {
            mesh: planeGroup,
            airport: airport,
            products: products,
            state: 'arriving', 
            targetPosition: new THREE.Vector3(airport.x, 3, airport.z), 
            progress: 0,
            timer: 0,
            tradeDuration: 3 + Math.random() * 5, 
            value: products.reduce((total, p) => total + (p.value * p.quantity), 0)
        };
        
        this.planes.push(plane);
        
        return plane;
    }
    
    spawnPlanesForAirports() {
        const airports = this.buildingSystem.getBuildingsByType('airport');
        if (airports.length === 0) return;
        
        if (this.planes.length < airports.length) {
            const airport = airports[Math.floor(Math.random() * airports.length)];
            this.createPlane(airport);
        }
    }
    
    update(deltaTime) {
        this.lastTradeTime += deltaTime;
        
        if (this.lastTradeTime > this.tradeCooldown) {
            this.spawnPlanesForAirports();
            this.lastTradeTime = 0;
        }
        
        for (let i = this.planes.length - 1; i >= 0; i--) {
            const plane = this.planes[i];
            
            switch (plane.state) {
                case 'arriving':
                    this.updatePlaneArriving(plane, deltaTime);
                    break;
                    
                case 'landed':
                    this.updatePlaneLanded(plane, deltaTime);
                    break;
                    
                case 'loading':
                    this.updatePlaneLoading(plane, deltaTime);
                    break;
                    
                case 'departing':
                    this.updatePlaneDeparting(plane, deltaTime, i);
                    break;
            }
        }
    }
    
    updatePlaneArriving(plane, deltaTime) {
        plane.progress += deltaTime * this.planeSpeed * 0.3;
        
        const startPos = plane.mesh.position.clone();
        plane.mesh.position.lerp(plane.targetPosition, deltaTime * this.planeSpeed * 0.3);
        
        const distanceToAirport = plane.mesh.position.distanceTo(plane.targetPosition);
        
        const direction = new THREE.Vector3();
        direction.subVectors(plane.targetPosition, startPos).normalize();
        plane.mesh.lookAt(plane.mesh.position.clone().add(direction));
        
        if (distanceToAirport < 1.0) {
            plane.state = 'landed';
            plane.timer = 0;
            
            this.announcePlaneArrival(plane);
        }
    }
    
    updatePlaneLanded(plane, deltaTime) {
        plane.timer += deltaTime;
        
        plane.mesh.position.y = plane.targetPosition.y + Math.sin(plane.timer * 2) * 0.1;
        
        if (plane.timer > 1) {
            plane.state = 'loading';
            plane.timer = 0;
            this.startTrading(plane);
        }
    }
    
    updatePlaneLoading(plane, deltaTime) {
        plane.timer += deltaTime;
        
        if (plane.mesh) {
            plane.mesh.position.y = plane.targetPosition.y + Math.sin(plane.timer * 2) * 0.1;
        }
        
        if (plane.timer > plane.tradeDuration) {
            plane.state = 'departing';
            plane.timer = 0;
            
            plane.targetPosition = new THREE.Vector3(
                plane.airport.x + 50 + Math.random() * 20,
                30, 
                plane.airport.z + 50 + Math.random() * 20
            );
            
            this.completeTrade(plane);
        }
    }
    
    updatePlaneDeparting(plane, deltaTime, planeIndex) {
        const direction = new THREE.Vector3();
        direction.subVectors(plane.targetPosition, plane.mesh.position).normalize();
        plane.mesh.lookAt(plane.mesh.position.clone().add(direction));
        
        plane.mesh.position.lerp(plane.targetPosition, deltaTime * this.planeSpeed * 0.5);
        
        const distanceFromAirport = plane.mesh.position.distanceTo(new THREE.Vector3(plane.airport.x, plane.targetPosition.y, plane.airport.z));
        
        if (distanceFromAirport > 60) {
            this.scene.remove(plane.mesh);
            this.planes.splice(planeIndex, 1);
            
            const meshIndex = this.planeMeshes.indexOf(plane.mesh);
            if (meshIndex !== -1) {
                this.planeMeshes.splice(meshIndex, 1);
            }
        }
    }
    
    announcePlaneArrival(plane) {
        const totalValue = plane.products.reduce((sum, product) => sum + (product.value * product.quantity), 0);
        
        const productList = plane.products.map(p => `${p.quantity} units of ${p.name}`).join(', ');
        
        if (document.dispatchEvent) {
            document.dispatchEvent(new CustomEvent('game:planeArrival', { 
                detail: { 
                    products: productList,
                    value: totalValue,
                    airport: plane.airport
                } 
            }));
        }
    }
    
    startTrading(plane) {
        this.createFloatingTradeText(plane);
    }
    
    createFloatingTradeText(plane) {
        console.log(`Trading at airport: ${plane.products.map(p => `${p.quantity} ${p.name}`).join(', ')}`);
    }
    
    completeTrade(plane) {
        if (this.economySystem) {
            const tradeValue = plane.products.reduce((sum, product) => {
                return sum + (product.value * product.quantity);
            }, 0);
            
            const income = Math.floor(tradeValue * 0.15); 
            
            this.tradeStats.totalShipments++;
            this.tradeStats.totalValue += tradeValue;
            
            for (const product of plane.products) {
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
                        products: plane.products,
                        airport: plane.airport,
                        tradeType: 'air'
                    } 
                }));
            }
            
            this.applyMarketEffects(plane.products);
        }
    }
    
    applyMarketEffects(products) {
        if (!this.economySystem) return;
        
        for (const product of products) {
            switch(product.name) {
                case 'Electronics':
                case 'Precision Instruments':
                    this.economySystem.marketPrices.industrial *= (1 + 0.015 * product.quantity / 100);
                    break;
                    
                case 'Luxury Goods':
                case 'Medical Supplies':
                    this.economySystem.marketPrices.commercial *= (1 + 0.015 * product.quantity / 100);
                    break;
                    
                case 'Perishables':
                    const gameState = this.scene.userData.game && this.scene.userData.game.gameState;
                    if (gameState) {
                        gameState.happiness = Math.min(100, gameState.happiness + product.quantity / 80);
                    }
                    break;
                    
                case 'Pharmaceuticals':
                    this.economySystem.marketPrices.commercial *= (1 + 0.01 * product.quantity / 100);
                    const gameState2 = this.scene.userData.game && this.scene.userData.game.gameState;
                    if (gameState2) {
                        gameState2.happiness = Math.min(100, gameState2.happiness + product.quantity / 90);
                    }
                    break;
            }
        }
    }
    
    clearPlanes() {
        for (const mesh of this.planeMeshes) {
            this.scene.remove(mesh);
        }
        
        this.planes = [];
        this.planeMeshes = [];
    }
    
    getTradeStats() {
        return this.tradeStats;
    }
}