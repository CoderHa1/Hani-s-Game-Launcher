import * as THREE from 'three';

export class PedestrianSystem {
    constructor(scene, buildingSystem) {
        this.scene = scene;
        this.buildingSystem = buildingSystem;
        this.pedestrians = [];
        this.pedestrianMeshes = [];
        this.pedestrianSpeed = 0.5; // Units per second - slower than cars
        
        // Create pedestrian models with different colors
        this.createPedestrianModels();
    }
    
    createPedestrianModels() {
        // Pedestrian colors for clothing
        this.pedestrianColors = [
            0xff0000, // Red
            0x0000ff, // Blue
            0x00ff00, // Green
            0xff8800, // Orange
            0x8800ff, // Purple
            0xffff00  // Yellow
        ];
        
        // Skin tones
        this.skinTones = [
            0xffe0bd, // Light
            0xffcd94, // Medium light
            0xe5b887, // Medium
            0xc68642, // Medium dark
            0x8d5524  // Dark
        ];
    }
    
    spawnPedestrians(count = 20) {
        // Get all road positions
        const roads = this.buildingSystem.getBuildingsByType('road');
        if (roads.length < 3) return; // Need at least some roads for pedestrians
        
        // Clear existing pedestrians if we're initializing the system
        if (count >= 15) {
            this.clearPedestrians();
        }
        
        // Create pedestrians
        for (let i = 0; i < count; i++) {
            // Pick a random road as starting point
            const startingRoad = roads[Math.floor(Math.random() * roads.length)];
            
            // Create pedestrian mesh
            const pedestrianGroup = new THREE.Group();
            
            // Body color (clothing)
            const bodyColor = this.pedestrianColors[Math.floor(Math.random() * this.pedestrianColors.length)];
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
            
            // Skin tone
            const skinTone = this.skinTones[Math.floor(Math.random() * this.skinTones.length)];
            const skinMaterial = new THREE.MeshStandardMaterial({ color: skinTone });
            
            // Body - small box
            const bodyGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.1);
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            pedestrianGroup.add(body);
            
            // Head - small sphere
            const headGeometry = new THREE.SphereGeometry(0.07, 8, 8);
            const head = new THREE.Mesh(headGeometry, skinMaterial);
            head.position.y = 0.2;
            pedestrianGroup.add(head);
            
            // Arms
            const armGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.05);
            
            const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
            leftArm.position.set(-0.1, 0.05, 0);
            pedestrianGroup.add(leftArm);
            
            const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
            rightArm.position.set(0.1, 0.05, 0);
            pedestrianGroup.add(rightArm);
            
            // Legs
            const legGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.05);
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 }); // Dark blue for pants
            
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
            leftLeg.position.set(-0.05, -0.2, 0);
            pedestrianGroup.add(leftLeg);
            
            const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
            rightLeg.position.set(0.05, -0.2, 0);
            pedestrianGroup.add(rightLeg);
            
            // Position pedestrian on the sidewalk with a consistent offset
            const roadOffset = 0.35; // Offset from center of road to sidewalk
            
            // Pick a side of the road randomly
            const side = Math.random() > 0.5 ? 1 : -1;
            
            // Determine offset direction (X or Z) based on nearest roads
            const nearbyRoads = this.getAdjacentRoads(startingRoad.x, startingRoad.z);
            let offsetX = 0, offsetZ = 0;
            
            if (nearbyRoads.length > 0) {
                // Determine if road is more horizontal or vertical
                let horizontalRoads = 0, verticalRoads = 0;
                
                for (const road of nearbyRoads) {
                    if (road.x !== startingRoad.x) horizontalRoads++;
                    if (road.z !== startingRoad.z) verticalRoads++;
                }
                
                if (horizontalRoads >= verticalRoads) {
                    // Road is more horizontal, offset in Z
                    offsetZ = roadOffset * side;
                } else {
                    // Road is more vertical, offset in X
                    offsetX = roadOffset * side;
                }
            } else {
                // No adjacent roads, choose random offset direction but ensure we're on a sidewalk
                offsetX = Math.random() > 0.5 ? roadOffset * side : 0;
                offsetZ = offsetX === 0 ? roadOffset * side : 0;
            }
            
            // Make sure pedestrian is not in the middle of the road
            if (offsetX === 0 && offsetZ === 0) {
                offsetX = roadOffset * side;
            }
            
            // Increased height positioning for pedestrians to be on the road surface (+0.5 instead of +0.3)
            const posY = this.buildingSystem.getTerrainHeightAt(startingRoad.x, startingRoad.z) + 0.5;
            pedestrianGroup.position.set(
                startingRoad.x + offsetX, 
                posY, 
                startingRoad.z + offsetZ
            );
            
            pedestrianGroup.scale.set(0.7, 0.7, 0.7); // Scale down to fit on sidewalk
            pedestrianGroup.userData.animationOffset = Math.random() * Math.PI * 2; // Random walk cycle
            
            this.scene.add(pedestrianGroup);
            this.pedestrianMeshes.push(pedestrianGroup);
            
            // Create pedestrian data object
            const pedestrian = {
                mesh: pedestrianGroup,
                currentRoad: startingRoad,
                nextRoad: null,
                targetPosition: new THREE.Vector3(),
                progress: 0,
                moving: false,
                offsetX: offsetX,
                offsetZ: offsetZ,
                side: side,
                speed: 0.3 + Math.random() * 0.4 // Varied walking speeds
            };
            
            // Find next road to move to
            this.findNextRoad(pedestrian);
            
            this.pedestrians.push(pedestrian);
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
    
    findNextRoad(pedestrian) {
        // Get adjacent roads to the current road
        const adjacentRoads = this.getAdjacentRoads(pedestrian.currentRoad.x, pedestrian.currentRoad.z);
        
        // If no adjacent roads, pick a random road
        if (adjacentRoads.length === 0) {
            const roads = this.buildingSystem.getBuildingsByType('road');
            if (roads.length > 1) {
                // Filter out current road
                const otherRoads = roads.filter(r => r !== pedestrian.currentRoad);
                pedestrian.nextRoad = otherRoads[Math.floor(Math.random() * otherRoads.length)];
                
                // Teleport to new position (pedestrian jumped to an unconnected road)
                const posY = this.buildingSystem.getTerrainHeightAt(pedestrian.nextRoad.x, pedestrian.nextRoad.z) + 0.5;
                
                // Maintain sidewalk positioning when teleporting
                const randomSide = Math.random() > 0.5 ? 1 : -1;
                const roadOffset = 0.35;
                
                // Ensure pedestrian is positioned on the sidewalk by setting either X or Z offset, but not both to zero
                pedestrian.offsetX = Math.random() > 0.5 ? roadOffset * randomSide : 0;
                pedestrian.offsetZ = pedestrian.offsetX === 0 ? roadOffset * randomSide : 0;
                
                // Double-check we're not in the middle of the road
                if (pedestrian.offsetX === 0 && pedestrian.offsetZ === 0) {
                    pedestrian.offsetX = roadOffset * randomSide;
                }
                
                pedestrian.side = randomSide;
                
                pedestrian.mesh.position.set(
                    pedestrian.nextRoad.x + pedestrian.offsetX, 
                    posY, 
                    pedestrian.nextRoad.z + pedestrian.offsetZ
                );
                
                pedestrian.currentRoad = pedestrian.nextRoad;
                pedestrian.nextRoad = null;
                
                // Find a connected next road
                this.findNextRoad(pedestrian);
                return;
            }
        } else {
            // Pick a random adjacent road, preferring not to backtrack
            let filteredRoads = adjacentRoads;
            
            // If we have a previous road, try not to go back to it
            if (pedestrian.previousRoad) {
                filteredRoads = adjacentRoads.filter(r => 
                    !(r.x === pedestrian.previousRoad.x && r.z === pedestrian.previousRoad.z)
                );
                
                // If all roads would lead back, allow backtracking
                if (filteredRoads.length === 0) {
                    filteredRoads = adjacentRoads;
                }
            }
            
            // Pick a random road from the filtered list
            pedestrian.nextRoad = filteredRoads[Math.floor(Math.random() * filteredRoads.length)];
            
            // Determine if we need to adjust the sidewalk side when turning
            this.adjustSidewalkPosition(pedestrian);
            
            // Set target position with sidewalk offset and increased height (+0.5 instead of +0.3)
            pedestrian.targetPosition.set(
                pedestrian.nextRoad.x + pedestrian.offsetX, 
                this.buildingSystem.getTerrainHeightAt(pedestrian.nextRoad.x, pedestrian.nextRoad.z) + 0.5, 
                pedestrian.nextRoad.z + pedestrian.offsetZ
            );
            
            // Calculate rotation to face target
            this.updatePedestrianRotation(pedestrian);
            
            pedestrian.progress = 0;
            pedestrian.moving = true;
        }
    }
    
    adjustSidewalkPosition(pedestrian) {
        // Check if we're moving in a different direction and need to adjust sidewalk positioning
        const currentX = pedestrian.currentRoad.x;
        const currentZ = pedestrian.currentRoad.z;
        const nextX = pedestrian.nextRoad.x;
        const nextZ = pedestrian.nextRoad.z;
        
        // Determine if we're turning
        const turningX = currentX !== nextX;
        const turningZ = currentZ !== nextZ;
        
        // Always maintain sidewalk positioning by ensuring offset is never zero
        const roadOffset = 0.35;
        
        if (turningX && turningZ) {
            // Diagonal movement - adjust to maintain sidewalk positioning
            // Choose which axis to offset on based on movement direction
            if (Math.abs(nextX - currentX) > Math.abs(nextZ - currentZ)) {
                // Primarily moving in X direction
                pedestrian.offsetX = 0;
                pedestrian.offsetZ = roadOffset * pedestrian.side;
            } else {
                // Primarily moving in Z direction
                pedestrian.offsetX = roadOffset * pedestrian.side;
                pedestrian.offsetZ = 0;
            }
            return;
        }
        
        // If we were offset in X and now moving in X direction, or offset in Z and moving in Z direction,
        // maintain the same side. Otherwise, adjust our offset.
        if ((pedestrian.offsetX !== 0 && turningX) || (pedestrian.offsetZ !== 0 && turningZ)) {
            // Keep the same side but ensure offset is never zero
            if (pedestrian.offsetX === 0) pedestrian.offsetX = roadOffset * pedestrian.side;
            if (pedestrian.offsetZ === 0) pedestrian.offsetZ = roadOffset * pedestrian.side;
            return;
        }
        
        // We need to adjust our sidewalk position
        if (turningX) {
            // Moving in X, adjust offset to Z
            pedestrian.offsetZ = roadOffset * pedestrian.side;
            pedestrian.offsetX = 0;
        } else if (turningZ) {
            // Moving in Z, adjust offset to X
            pedestrian.offsetX = roadOffset * pedestrian.side;
            pedestrian.offsetZ = 0;
        }
        
        // Final safety check - ensure at least one offset is non-zero
        if (pedestrian.offsetX === 0 && pedestrian.offsetZ === 0) {
            pedestrian.offsetX = roadOffset * pedestrian.side;
        }
    }
    
    updatePedestrianRotation(pedestrian) {
        // Calculate direction vector
        const dir = new THREE.Vector3();
        dir.subVectors(pedestrian.targetPosition, pedestrian.mesh.position);
        dir.y = 0; // Keep pedestrian level by ignoring height differences
        
        // Skip rotation if the direction vector is too small
        if (dir.length() < 0.1) return;
        
        // Look at target using a temporary position that's at the same height as the pedestrian
        const targetAtSameHeight = pedestrian.targetPosition.clone();
        targetAtSameHeight.y = pedestrian.mesh.position.y;
        
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(pedestrian.mesh.position, targetAtSameHeight, new THREE.Vector3(0, 1, 0));
        pedestrian.mesh.quaternion.setFromRotationMatrix(lookAtMatrix);
    }
    
    update(deltaTime) {
        // On mobile, only animate pedestrians that are visible to the camera
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const camera = this.scene.userData.game ? this.scene.userData.game.camera : null;
        
        // Update all pedestrians
        for (const pedestrian of this.pedestrians) {
            // Skip pedestrians that are far from camera on mobile
            if (isMobile && camera) {
                const distance = camera.position.distanceTo(pedestrian.mesh.position);
                if (distance > 40) continue; // Skip distant pedestrians on mobile
            }
            
            if (pedestrian.moving && pedestrian.nextRoad) {
                // Update progress more efficiently
                pedestrian.progress += deltaTime * pedestrian.speed;
                
                // Interpolate position - use direct assignment for better performance
                const startX = pedestrian.currentRoad.x + pedestrian.offsetX;
                const startZ = pedestrian.currentRoad.z + pedestrian.offsetZ;
                const startY = this.buildingSystem.getTerrainHeightAt(pedestrian.currentRoad.x, pedestrian.currentRoad.z) + 0.5;
                
                const targetX = pedestrian.nextRoad.x + pedestrian.offsetX;
                const targetZ = pedestrian.nextRoad.z + pedestrian.offsetZ;
                const targetY = this.buildingSystem.getTerrainHeightAt(pedestrian.nextRoad.x, pedestrian.nextRoad.z) + 0.5;
                
                // Calculate interpolated position efficiently
                const progress = pedestrian.progress;
                pedestrian.mesh.position.x = startX + (targetX - startX) * progress;
                pedestrian.mesh.position.z = startZ + (targetZ - startZ) * progress;
                
                // Ensure pedestrian follows terrain height precisely for stair-like movement
                pedestrian.mesh.position.y = this.buildingSystem.getTerrainHeightAt(
                    pedestrian.mesh.position.x, 
                    pedestrian.mesh.position.z
                ) + 0.5;
                
                // Ensure pedestrian stands upright (maintains y-axis alignment) even on slopes
                const upVector = new THREE.Vector3(0, 1, 0);
                pedestrian.mesh.up.copy(upVector);
                
                // Animate walking
                this.animateWalking(pedestrian, deltaTime);
                
                // If we reached the target position
                if (pedestrian.progress >= 1) {
                    pedestrian.previousRoad = pedestrian.currentRoad;
                    pedestrian.currentRoad = pedestrian.nextRoad;
                    pedestrian.nextRoad = null;
                    pedestrian.moving = false;
                    
                    // Find the next road
                    this.findNextRoad(pedestrian);
                }
            }
        }
    }
    
    animateWalking(pedestrian, deltaTime) {
        // Simple walking animation by moving arms and legs
        const time = Date.now() * 0.005 + pedestrian.mesh.userData.animationOffset;
        const walkCycle = Math.sin(time * pedestrian.speed * 2);
        
        // Get limbs
        if (pedestrian.mesh.children.length >= 6) {
            // Arms (children 2 and 3 in our setup)
            const leftArm = pedestrian.mesh.children[2];
            const rightArm = pedestrian.mesh.children[3];
            
            // Legs (children 4 and 5 in our setup)
            const leftLeg = pedestrian.mesh.children[4];
            const rightLeg = pedestrian.mesh.children[5];
            
            // Arm swing
            leftArm.rotation.x = walkCycle * 0.5;
            rightArm.rotation.x = -walkCycle * 0.5;
            
            // Leg movement
            leftLeg.rotation.x = -walkCycle * 0.5;
            rightLeg.rotation.x = walkCycle * 0.5;
        }
    }
    
    clearPedestrians() {
        // Remove all pedestrian meshes from the scene
        for (const mesh of this.pedestrianMeshes) {
            this.scene.remove(mesh);
        }
        
        // Clear arrays
        this.pedestrians = [];
        this.pedestrianMeshes = [];
    }
}