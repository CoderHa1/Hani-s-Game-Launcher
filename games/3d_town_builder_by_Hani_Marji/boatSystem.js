import * as THREE from 'three';

export class BoatSystem {
    constructor(scene, buildingSystem) {
        this.scene = scene;
        this.buildingSystem = buildingSystem;
        this.boats = [];
        this.boatMeshes = [];
        this.boatSpeed = 0.8; // Units per second
        this.spawnCooldown = 15; // Seconds between boat spawns
        this.lastSpawnTime = 0;
        
        // Create boat models
        this.createBoatModels();
    }
    
    createBoatModels() {
        // Boat colors
        this.boatColors = [
            0xffffff, // White
            0x3498db, // Blue
            0xe74c3c, // Red
            0xf1c40f  // Yellow
        ];
    }
    
    createBoat(channel) {
        // Create boat group
        const boatGroup = new THREE.Group();
        
        // Create hull
        const boatColor = this.boatColors[Math.floor(Math.random() * this.boatColors.length)];
        const hullMaterial = new THREE.MeshStandardMaterial({ color: boatColor });
        const hullGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.2);
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        boatGroup.add(hull);
        
        // Create cabin
        const cabinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            metalness: 0.2,
            roughness: 0.8
        });
        const cabinGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.15);
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 0.1;
        cabin.position.z = -0.02;
        boatGroup.add(cabin);
        
        // Add person in the boat
        const personGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8);
        const personMaterial = new THREE.MeshStandardMaterial({ color: 0x8d5524 });
        const person = new THREE.Mesh(personGeometry, personMaterial);
        person.position.set(0, 0.15, 0);
        boatGroup.add(person);
        
        // Add head
        const headGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const head = new THREE.Mesh(headGeometry, personMaterial);
        head.position.set(0, 0.22, 0);
        boatGroup.add(head);
        
        // Position boat
        const posY = this.buildingSystem.getTerrainHeightAt(channel.x, channel.z) + 0.4;
        boatGroup.position.set(channel.x, posY, channel.z);
        boatGroup.userData.originalY = posY;
        boatGroup.castShadow = true;
        
        // Scale up the boat to make it larger
        boatGroup.scale.set(1.5, 1.5, 1.5);
        
        this.scene.add(boatGroup);
        this.boatMeshes.push(boatGroup);
        
        // Create boat data object
        const boat = {
            mesh: boatGroup,
            currentChannel: channel,
            nextChannel: null,
            targetPosition: new THREE.Vector3(),
            progress: 0,
            moving: false,
            speed: 0.5 + Math.random() * 0.5, // Random speed variation
            previousChannel: null,
        };
        
        // Find next channel
        this.findNextChannel(boat);
        
        this.boats.push(boat);
        
        return boat;
    }
    
    findNextChannel(boat) {
        // Get adjacent water channels
        const adjacentChannels = this.getAdjacentChannels(boat.currentChannel.x, boat.currentChannel.z);
        
        // If no adjacent channels, pick a random channel
        if (adjacentChannels.length === 0) {
            const channels = this.buildingSystem.getBuildingsByType('water_channel');
            if (channels.length > 1) {
                // Filter out current channel
                const otherChannels = channels.filter(c => c !== boat.currentChannel);
                boat.nextChannel = otherChannels[Math.floor(Math.random() * otherChannels.length)];
                
                // Teleport to new position (boat jumped to an unconnected channel)
                const posY = this.buildingSystem.getTerrainHeightAt(boat.nextChannel.x, boat.nextChannel.z) + 0.4;
                boat.mesh.position.set(boat.nextChannel.x, posY, boat.nextChannel.z);
                boat.mesh.userData.originalY = posY;
                boat.currentChannel = boat.nextChannel;
                boat.nextChannel = null;
                
                // Find a connected next channel
                this.findNextChannel(boat);
                return;
            }
        } else {
            // Pick a random adjacent channel, preferring not to backtrack
            let filteredChannels = adjacentChannels;
            
            // If we have a previous channel, try not to go back to it
            if (boat.previousChannel) {
                filteredChannels = adjacentChannels.filter(c => 
                    !(c.x === boat.previousChannel.x && c.z === boat.previousChannel.z)
                );
                
                // If all channels would lead back, allow backtracking
                if (filteredChannels.length === 0) {
                    filteredChannels = adjacentChannels;
                }
            }
            
            // Pick a random channel from the filtered list
            boat.nextChannel = filteredChannels[Math.floor(Math.random() * filteredChannels.length)];
            
            const posY = this.buildingSystem.getTerrainHeightAt(boat.nextChannel.x, boat.nextChannel.z) + 0.4;
            boat.targetPosition.set(
                boat.nextChannel.x, 
                posY, 
                boat.nextChannel.z
            );
            
            // Calculate rotation to face target
            this.updateBoatRotation(boat);
            
            boat.progress = 0;
            boat.moving = true;
        }
    }
    
    getAdjacentChannels(x, z) {
        // Check adjacent tiles for water channels
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 }  // South
        ];
        
        const adjacentChannels = [];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            const key = `${nx},${nz}`;
            
            if (this.buildingSystem.buildings.has(key)) {
                const building = this.buildingSystem.buildings.get(key);
                if (building.category === 'road' && building.type === 'water_channel') {
                    adjacentChannels.push(building);
                }
            }
        }
        
        return adjacentChannels;
    }
    
    updateBoatRotation(boat) {
        // Calculate direction vector
        const dir = new THREE.Vector3();
        dir.subVectors(boat.targetPosition, boat.mesh.position);
        dir.y = 0; // Keep boat level
        
        // Skip rotation if the direction vector is too small
        if (dir.length() < 0.1) return;
        
        // Calculate angle in XZ plane
        const angle = Math.atan2(dir.x, dir.z);
        
        // Only rotate around Y axis to maintain upright position
        boat.mesh.rotation.y = angle + Math.PI/2; 
    }
    
    spawnBoatsForChannels() {
        // Get all water channels
        const channels = this.buildingSystem.getBuildingsByType('water_channel');
        if (channels.length === 0) return;
        
        // If we have fewer boats than a reasonable limit (1 boat per 3 channels)
        const maxBoats = Math.max(1, Math.floor(channels.length / 3));
        if (this.boats.length < maxBoats) {
            // Select a random channel that doesn't already have a boat starting on it
            const availableChannels = channels.filter(channel => {
                return !this.boats.some(boat => 
                    boat.currentChannel.x === channel.x && 
                    boat.currentChannel.z === channel.z
                );
            });
            
            if (availableChannels.length > 0) {
                const channel = availableChannels[Math.floor(Math.random() * availableChannels.length)];
                this.createBoat(channel);
            } else if (channels.length > 0) {
                // If all channels have boats, just pick a random one
                const channel = channels[Math.floor(Math.random() * channels.length)];
                this.createBoat(channel);
            }
        }
    }
    
    update(deltaTime) {
        // Update spawn timer
        this.lastSpawnTime += deltaTime;
        
        // Try to spawn new boats periodically
        if (this.lastSpawnTime > this.spawnCooldown) {
            this.spawnBoatsForChannels();
            this.lastSpawnTime = 0;
        }
        
        // Update all boats
        for (const boat of this.boats) {
            if (boat.moving && boat.nextChannel) {
                // Update progress
                boat.progress += deltaTime * boat.speed;
                
                // Interpolate position
                const startPos = new THREE.Vector3(
                    boat.currentChannel.x,
                    boat.mesh.userData.originalY,
                    boat.currentChannel.z
                );
                
                // Linear interpolation between current and next channel
                boat.mesh.position.lerpVectors(startPos, boat.targetPosition, boat.progress);
                
                // Add a gentle bobbing motion - only vertical movement and slight roll
                const time = Date.now() * 0.001;
                boat.mesh.position.y += Math.sin(time * 2) * 0.05;
                boat.mesh.rotation.z = Math.sin(time * 1.5) * 0.05;
                
                // If we reached the target position
                if (boat.progress >= 1) {
                    boat.previousChannel = boat.currentChannel;
                    boat.currentChannel = boat.nextChannel;
                    boat.nextChannel = null;
                    boat.moving = false;
                    
                    // Update the original Y position for the new channel
                    boat.mesh.userData.originalY = this.buildingSystem.getTerrainHeightAt(boat.currentChannel.x, boat.currentChannel.z) + 0.4;
                    
                    // Find the next channel
                    this.findNextChannel(boat);
                }
            } else {
                // Add bobbing motion even when stationary - only vertical movement and roll
                const time = Date.now() * 0.001;
                boat.mesh.position.y = boat.mesh.userData.originalY + Math.sin(time * 2) * 0.05;
                boat.mesh.rotation.z = Math.sin(time * 1.5) * 0.05;
            }
        }
    }
    
    clearBoats() {
        // Remove all boat meshes from the scene
        for (const mesh of this.boatMeshes) {
            this.scene.remove(mesh);
        }
        
        // Clear arrays
        this.boats = [];
        this.boatMeshes = [];
    }
}