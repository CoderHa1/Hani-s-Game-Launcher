import * as THREE from 'three';

export class CarSystem {
    constructor(scene, buildingSystem) {
        this.scene = scene;
        this.buildingSystem = buildingSystem;
        this.cars = [];
        this.carMeshes = [];
        this.carSpeed = 2; // Units per second
        
        // Create some car models with different colors
        this.createCarModels();
    }
    
    createCarModels() {
        // Car colors
        this.carColors = [
            0xff0000, // Red
            0x0000ff, // Blue
            0xffff00, // Yellow
            0x00ff00, // Green
            0xff00ff, // Purple
            0xffffff, // White
            0x000000, // Black
            0xff8800  // Orange
        ];
        
        // Car geometry - improved with more detailed shapes
        this.carGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.2);
        
        // Create wheel geometry
        this.wheelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8);
        
        // Create headlight geometry
        this.headlightGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        
        // Create window geometry
        this.windowGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.18);
    }
    
    spawnCars(count = 5) {
        // Get all road positions
        const roads = this.buildingSystem.getBuildingsByType('road');
        if (roads.length < 2) return; // Need at least 2 roads to create a path
        
        // Only clear existing cars if we're initializing the system
        // If count is large (e.g. 5 or more), we're likely doing initial spawn
        // If count is small (1-2), we're likely adding cars due to new roads
        if (count >= 5) {
            this.clearCars();
        }
        
        // Create cars
        for (let i = 0; i < count; i++) {
            // Pick a random road as starting point
            const startingRoad = roads[Math.floor(Math.random() * roads.length)];
            
            // Create car group to hold all car parts
            const carGroup = new THREE.Group();
            
            // Create car body mesh with random color
            const carColor = this.carColors[Math.floor(Math.random() * this.carColors.length)];
            const carMaterial = new THREE.MeshStandardMaterial({ color: carColor });
            const carBody = new THREE.Mesh(this.carGeometry, carMaterial);
            carGroup.add(carBody);
            
            // Add car roof (slightly smaller box on top)
            const roofGeometry = new THREE.BoxGeometry(0.25, 0.1, 0.19);
            const roofMaterial = new THREE.MeshStandardMaterial({ color: carColor });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = 0.1;
            carGroup.add(roof);
            
            // Add windows with glass-like material
            const windowMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x88ccff, 
                transparent: true, 
                opacity: 0.7,
                metalness: 0.8,
                roughness: 0.2
            });
            
            // Front, back and side windows
            const frontWindow = new THREE.Mesh(this.windowGeometry, windowMaterial);
            frontWindow.scale.set(0.5, 1, 0.9);
            frontWindow.position.set(0.05, 0.1, 0);
            carGroup.add(frontWindow);
            
            // Add wheels
            const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const wheelPositions = [
                { x: -0.15, y: -0.08, z: 0.1 },  // Front left
                { x: 0.15, y: -0.08, z: 0.1 },   // Front right
                { x: -0.15, y: -0.08, z: -0.1 }, // Back left
                { x: 0.15, y: -0.08, z: -0.1 }   // Back right
            ];
            
            for (const pos of wheelPositions) {
                const wheel = new THREE.Mesh(this.wheelGeometry, wheelMaterial);
                wheel.position.set(pos.x, pos.y, pos.z);
                wheel.rotation.x = Math.PI / 2; // Rotate to align with car
                carGroup.add(wheel);
            }
            
            // Add headlights
            const headlightMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffcc, 
                emissive: 0xffffcc,
                emissiveIntensity: 0.5
            });
            
            const headlightPositions = [
                { x: 0.2, y: 0, z: 0.08 },  // Right headlight
                { x: 0.2, y: 0, z: -0.08 }  // Left headlight
            ];
            
            for (const pos of headlightPositions) {
                const headlight = new THREE.Mesh(this.headlightGeometry, headlightMaterial);
                headlight.position.set(pos.x, pos.y, pos.z);
                carGroup.add(headlight);
            }
            
            // Add taillights
            const taillightMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, 
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            
            const taillightPositions = [
                { x: -0.2, y: 0, z: 0.08 },  // Right taillight
                { x: -0.2, y: 0, z: -0.08 }  // Left taillight
            ];
            
            for (const pos of taillightPositions) {
                const taillight = new THREE.Mesh(this.headlightGeometry, taillightMaterial);
                taillight.position.set(pos.x, pos.y, pos.z);
                carGroup.add(taillight);
            }
            
            // Position car slightly above the road
            const posY = this.buildingSystem.getTerrainHeightAt(startingRoad.x, startingRoad.z) + 0.4;
            carGroup.position.set(startingRoad.x, posY, startingRoad.z);
            carGroup.castShadow = true;
            
            this.scene.add(carGroup);
            this.carMeshes.push(carGroup);
            
            // Create car data object
            const car = {
                mesh: carGroup,
                currentRoad: startingRoad,
                nextRoad: null,
                targetPosition: new THREE.Vector3(),
                progress: 0,
                moving: false,
                wheels: wheelPositions.map((pos, idx) => carGroup.children[idx + 2]) // Reference to wheel meshes for animation
            };
            
            // Find next road to move to
            this.findNextRoad(car);
            
            this.cars.push(car);
        }
    }
    
    findNextRoad(car) {
        // Get adjacent roads to the current road
        const adjacentRoads = this.getAdjacentRoads(car.currentRoad.x, car.currentRoad.z);
        
        // If no adjacent roads, pick a random road
        if (adjacentRoads.length === 0) {
            const roads = this.buildingSystem.getBuildingsByType('road');
            if (roads.length > 1) {
                // Filter out current road
                const otherRoads = roads.filter(r => r !== car.currentRoad);
                car.nextRoad = otherRoads[Math.floor(Math.random() * otherRoads.length)];
                
                // Teleport to new position (car jumped to an unconnected road)
                const posY = this.buildingSystem.getTerrainHeightAt(car.nextRoad.x, car.nextRoad.z) + 0.4;
                car.mesh.position.set(car.nextRoad.x, posY, car.nextRoad.z);
                car.currentRoad = car.nextRoad;
                car.nextRoad = null;
                
                // Find a connected next road
                this.findNextRoad(car);
                return;
            }
        } else {
            // Pick a random adjacent road, preferring not to backtrack
            let filteredRoads = adjacentRoads;
            
            // If we have a previous road, try not to go back to it
            if (car.previousRoad) {
                filteredRoads = adjacentRoads.filter(r => 
                    !(r.x === car.previousRoad.x && r.z === car.previousRoad.z)
                );
                
                // If all roads would lead back, allow backtracking
                if (filteredRoads.length === 0) {
                    filteredRoads = adjacentRoads;
                }
            }
            
            // Pick a random road from the filtered list
            car.nextRoad = filteredRoads[Math.floor(Math.random() * filteredRoads.length)];
            car.targetPosition.set(
                car.nextRoad.x, 
                this.buildingSystem.getTerrainHeightAt(car.nextRoad.x, car.nextRoad.z) + 0.4, 
                car.nextRoad.z
            );
            
            // Calculate rotation to face target
            this.updateCarRotation(car);
            
            car.progress = 0;
            car.moving = true;
        }
    }
    
    getAdjacentRoads(x, z) {
        // Check adjacent tiles for roads
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 }  // South
        ];
        
        const adjacentRoads = [];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            const key = `${nx},${nz}`;
            
            if (this.buildingSystem.buildings.has(key)) {
                const building = this.buildingSystem.buildings.get(key);
                if (building.category === 'road' && building.type !== 'water_channel') {
                    adjacentRoads.push(building);
                }
            }
        }
        
        return adjacentRoads;
    }
    
    updateCarRotation(car) {
        // Calculate direction vector
        const dir = new THREE.Vector3();
        dir.subVectors(car.targetPosition, car.mesh.position);
        dir.y = 0; // Keep car level
        
        // Skip rotation if the direction vector is too small
        if (dir.length() < 0.1) return;
        
        // Look at target
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(car.mesh.position, car.targetPosition, new THREE.Vector3(0, 1, 0));
        car.mesh.quaternion.setFromRotationMatrix(lookAtMatrix);
        
        // Add 90 degrees (π/2 radians) rotation around Y axis to turn cars sideways
        car.mesh.rotateY(Math.PI / 2);
    }
    
    update(deltaTime) {
        // On mobile, only animate cars that are visible to the camera
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const camera = this.scene.userData.game ? this.scene.userData.game.camera : null;
        
        // Update all cars
        for (const car of this.cars) {
            // Skip cars that are far from camera on mobile
            if (isMobile && camera) {
                const distance = camera.position.distanceTo(car.mesh.position);
                if (distance > 50) continue; // Skip distant cars on mobile
            }
            
            if (car.moving && car.nextRoad) {
                // Update progress
                car.progress += deltaTime * this.carSpeed;
                
                // Interpolate position - use direct assignment to component properties
                // for better performance instead of vector methods
                const startX = car.currentRoad.x;
                const startZ = car.currentRoad.z;
                const startY = this.buildingSystem.getTerrainHeightAt(startX, startZ) + 0.4;
                
                const targetX = car.nextRoad.x;
                const targetZ = car.nextRoad.z;
                const targetY = this.buildingSystem.getTerrainHeightAt(targetX, targetZ) + 0.4;
                
                // Calculate interpolated position efficiently
                const progress = car.progress;
                car.mesh.position.x = startX + (targetX - startX) * progress;
                car.mesh.position.z = startZ + (targetZ - startZ) * progress;
                
                // Snap the y-position to the correct height at the current x,z position for stair-like movement
                car.mesh.position.y = this.buildingSystem.getTerrainHeightAt(car.mesh.position.x, car.mesh.position.z) + 0.4;
                
                // Add a small bouncing effect using pre-calculated values for better performance
                car.mesh.position.y += Math.sin(Date.now() * 0.01) * 0.02;
                
                // Ensure car maintains upright position even on slopes
                const upVector = new THREE.Vector3(0, 1, 0);
                car.mesh.up.copy(upVector);
                
                // Reset car rotation to be horizontal and then set direction
                car.mesh.rotation.x = 0;
                car.mesh.rotation.z = 0;
                
                // Rotate wheels
                if (car.wheels && car.wheels.length > 0) {
                    car.wheels.forEach(wheel => {
                        wheel.rotation.y += deltaTime * 5; // Rotate wheels based on speed
                    });
                }
                
                // If we reached the target position
                if (car.progress >= 1) {
                    car.previousRoad = car.currentRoad;
                    car.currentRoad = car.nextRoad;
                    car.nextRoad = null;
                    car.moving = false;
                    
                    // Find the next road
                    this.findNextRoad(car);
                }
            }
        }
    }
    
    clearCars() {
        // Remove all car meshes from the scene
        for (const mesh of this.carMeshes) {
            this.scene.remove(mesh);
        }
        
        // Clear arrays
        this.cars = [];
        this.carMeshes = [];
    }
}