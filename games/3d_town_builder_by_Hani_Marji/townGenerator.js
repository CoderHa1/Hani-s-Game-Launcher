import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class TownGenerator {
    constructor(scene, terrainGenerator, buildingSystem, gameState) {
        this.scene = scene;
        this.terrainGenerator = terrainGenerator;
        this.buildingSystem = buildingSystem;
        this.gameState = gameState;
        this.noise2D = createNoise2D();
    }
    
    generateInitialTown() {
        // Create town center (free placement to avoid deducting starting funds)
        this.createTownCenter();
        
        // Generate main road network with free placement
        this.generateRoadNetwork();
        
        // Place initial buildings along roads without costing money
        this.placeInitialBuildings();
        
        // Place exactly one church and one airport
        this.placeSpecialBuildings();
        
        // Generate AI description of the town (unchanged)
        this.gameState.townDescription = this.generateTownDescription();
    }
    
    createTownCenter() {
        const mapCenter = { x: 0, z: 0 };
        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                if (Math.abs(x) === 2 || Math.abs(z) === 2) {
                    // Place surrounding roads with freePlacement flag
                    this.buildingSystem.placeBuilding(mapCenter.x + x, mapCenter.z + z, 'road', 'road', true);
                }
            }
        }
        // Place town hall (park) without deducting money
        this.buildingSystem.placeBuilding(mapCenter.x, mapCenter.z, 'civic', 'park', true);
    }
    
    generateRoadNetwork() {
        const directions = [
            { dx: 1, dz: 0 },
            { dx: -1, dz: 0 },
            { dx: 0, dz: 1 },
            { dx: 0, dz: -1 }
        ];
        
        // Use free placement for initial road generation
        for (const direction of directions) {
            this.createRoadInDirection(0, 0, direction.dx, direction.dz, 10, true);
        }
        
        // Add connecting roads with free placement
        this.createConnectingRoads();
    }
    
    createRoadInDirection(startX, startZ, dirX, dirZ, length, freePlacement = true) {
        for (let i = 1; i <= length; i++) {
            const x = startX + (i * dirX);
            const z = startZ + (i * dirZ);
            
            if (this.terrainGenerator.isBuildableTile(x, z)) {
                this.buildingSystem.placeBuilding(x, z, 'road', 'road', freePlacement);
                
                // Occasionally add branch roads
                if (i > 3 && Math.random() < 0.3) {
                    const branchDir = dirX !== 0 
                        ? { dx: 0, dz: Math.random() < 0.5 ? 1 : -1 } 
                        : { dx: Math.random() < 0.5 ? 1 : -1, dz: 0 };
                    this.createRoadInDirection(x, z, branchDir.dx, branchDir.dz, 3 + Math.floor(Math.random() * 3), freePlacement);
                }
            }
        }
    }
    
    createConnectingRoads() {
        for (let i = 0; i < 5; i++) {
            const startX = -5 + Math.floor(Math.random() * 10);
            const startZ = -5 + Math.floor(Math.random() * 10);
            
            const dirX = Math.random() < 0.5 ? 1 : -1;
            const dirZ = Math.random() < 0.5 ? 1 : -1;
            
            this.createRoadInDirection(startX, startZ, dirX, 0, 3 + Math.floor(Math.random() * 3), true);
            this.createRoadInDirection(startX, startZ, 0, dirZ, 3 + Math.floor(Math.random() * 3), true);
        }
    }
    
    placeInitialBuildings() {
        const roads = this.buildingSystem.getBuildingsByType('road');
        // Place a random set of buildings totaling 30 (excluding special buildings)
        const totalBuildingsToPlace = 28; // 30 total minus church and airport
        
        // Track how many buildings we've placed
        let buildingsPlaced = 0;
        
        // Keep placing buildings until we reach the desired number
        while (buildingsPlaced < totalBuildingsToPlace) {
            // Pick a random road
            const randomRoad = roads[Math.floor(Math.random() * roads.length)];
            
            // Try to place a building near this road
            if (this.placeBuildingsNearRoad(randomRoad.x, randomRoad.z)) {
                buildingsPlaced++;
            }
        }
    }
    
    placeBuildingsNearRoad(roadX, roadZ) {
        const directions = [
            { dx: 1, dz: 0 },
            { dx: -1, dz: 0 },
            { dx: 0, dz: 1 },
            { dx: 0, dz: -1 }
        ];
        
        // Shuffle directions for more randomness
        directions.sort(() => Math.random() - 0.5);
        
        for (const dir of directions) {
            const x = roadX + dir.dx;
            const z = roadZ + dir.dz;
            if (this.buildingSystem.getBuildingAtPosition(x, z)) {
                continue;
            }
            if (!this.terrainGenerator.isBuildableTile(x, z)) {
                continue;
            }
            const buildingType = this.chooseBuildingType(x, z);
            if (buildingType) {
                // Place building for free during initial generation
                this.buildingSystem.placeBuilding(x, z, buildingType.category, buildingType.type, true);
                return true;
            }
        }
        return false;
    }
    
    chooseBuildingType(x, z) {
        const noise = this.noise2D(x * 0.1, z * 0.1);
        const distFromCenter = Math.sqrt(x * x + z * z);
        let category;
        
        // Exclude church and airport from random building selection - they're placed separately
        // Include the new categories with appropriate probabilities
        if (distFromCenter < 5) {
            // Town center - mix of civic, commercial, and recreational buildings
            const rand = Math.random();
            if (rand < 0.4) {
                category = 'civic';
            } else if (rand < 0.7) {
                category = 'commercial';
            } else if (rand < 0.9) {
                category = 'recreational';
            } else {
                category = 'civic';
            }
        } else if (distFromCenter < 10) {
            // Mid-distance - ensure mix of all building types for diversity
            const rand = Math.random();
            if (rand < 0.25) {
                category = 'residential';
            } else if (rand < 0.5) {
                category = 'commercial';
            } else if (rand < 0.7) {
                category = 'industrial';
            } else if (rand < 0.85) {
                category = 'civic';
            } else {
                category = 'recreational';
            }
        } else {
            // Outer areas - industrial, residential, and some recreational
            const rand = Math.random();
            if (rand < 0.3) {
                category = 'industrial';
            } else if (rand < 0.6) {
                category = 'residential';
            } else if (rand < 0.8) {
                category = 'commercial';
            } else {
                category = noise < 0.7 ? 'transportation' : 'recreational';
            }
        }
        
        // Make sure the category exists in building types
        if (!this.buildingSystem.buildingTypes[category]) {
            category = 'residential'; // Default fallback
        }
        
        // Skip religious and airport types - they're handled separately
        if (category === 'religious' || 
            (category === 'transportation' && this.buildingSystem.buildingTypes[category]['airport'])) {
            category = 'residential';
        }
        
        // Always select the first building type from the category
        const types = Object.keys(this.buildingSystem.buildingTypes[category]);
        const type = types[0]; // Always use the first building type
        return { category, type };
    }
    
    placeSpecialBuildings() {
        const roads = this.buildingSystem.getBuildingsByType('road');
        if (roads.length === 0) return;
        
        // Place church
        let placed = false;
        while (!placed) {
            const road = roads[Math.floor(Math.random() * roads.length)];
            const directions = [
                { dx: 1, dz: 0 },
                { dx: -1, dz: 0 },
                { dx: 0, dz: 1 },
                { dx: 0, dz: -1 }
            ];
            
            for (const dir of directions) {
                const x = road.x + dir.dx;
                const z = road.z + dir.dz;
                if (this.buildingSystem.getBuildingAtPosition(x, z)) {
                    continue;
                }
                if (!this.terrainGenerator.isBuildableTile(x, z)) {
                    continue;
                }
                
                // Place church
                this.buildingSystem.placeBuilding(x, z, 'religious', 'church', true);
                placed = true;
                break;
            }
        }
        
        // Place airport on flat grass area at least 5 terrain elements away from mountains
        placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            attempts++;
            
            // Find a suitable flat grass area
            const x = Math.floor(Math.random() * 20) - 10;
            const z = Math.floor(Math.random() * 20) - 10;
            
            if (this.buildingSystem.getBuildingAtPosition(x, z)) {
                continue;
            }
            
            // Check if area is grass and flat
            const tileType = this.terrainGenerator.getTileType(x, z);
            if (tileType !== 'grass') {
                continue;
            }
            
            // Check flatness
            const height = this.terrainGenerator.getTileHeight(x, z);
            let isFlat = true;
            
            const directions = [
                { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, 
                { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
            ];
            
            for (const dir of directions) {
                const neighborHeight = this.terrainGenerator.getTileHeight(x + dir.dx, z + dir.dz);
                if (Math.abs(neighborHeight - height) > 0.3) {
                    isFlat = false;
                    break;
                }
            }
            
            // Check if there are any existing buildings in the area (airport needs more space)
            let hasOverlap = false;
            for (let rx = -1; rx <= 1; rx++) {
                for (let rz = -1; rz <= 1; rz++) {
                    if (this.buildingSystem.getBuildingAtPosition(x + rx, z + rz)) {
                        hasOverlap = true;
                        break;
                    }
                }
                if (hasOverlap) break;
            }
            
            // Check distance from mountains
            let isFarFromMountain = true;
            const checkDistance = 5; // 5 terrain elements away from mountains
            
            for (let rx = -checkDistance; rx <= checkDistance; rx++) {
                for (let rz = -checkDistance; rz <= checkDistance; rz++) {
                    const checkX = x + rx;
                    const checkZ = z + rz;
                    const checkTileType = this.terrainGenerator.getTileType(checkX, checkZ);
                    if (checkTileType === 'mountain' || checkTileType === 'dirt') {
                        isFarFromMountain = false;
                        break;
                    }
                }
                if (!isFarFromMountain) break;
            }
            
            if (isFlat && !hasOverlap && isFarFromMountain) {
                // Ensure there's a road connection to the airport
                let roadAdded = false;
                for (let rx = -2; rx <= 2 && !roadAdded; rx++) {
                    for (let rz = -2; rz <= 2 && !roadAdded; rz++) {
                        if (Math.abs(rx) + Math.abs(rz) <= 3 && !(rx === 0 && rz === 0)) {
                            // Check that road placement won't overlap with existing buildings
                            if (!this.buildingSystem.getBuildingAtPosition(x + rx, z + rz)) {
                                this.buildingSystem.placeBuilding(x + rx, z + rz, 'road', 'road', true);
                                roadAdded = true;
                            }
                        }
                    }
                }
                
                // Place airport
                this.buildingSystem.placeBuilding(x, z, 'transportation', 'airport', true);
                placed = true;
            }
        }
    }
    
    generateTownDescription() {
        // Count building types
        const buildings = this.buildingSystem.getAllBuildings();
        
        const counts = {
            residential: 0,
            commercial: 0,
            industrial: 0,
            civic: 0,
            road: 0
        };
        
        for (const building of buildings) {
            counts[building.category]++;
        }
        
        // Generate description based on building composition
        let description = "Welcome to your new town! ";
        
        if (counts.residential > counts.commercial && counts.residential > counts.industrial) {
            description += "It's a primarily residential area with quiet neighborhoods. ";
        } else if (counts.commercial > counts.residential && counts.commercial > counts.industrial) {
            description += "It's a bustling commercial center with many shops and businesses. ";
        } else if (counts.industrial > counts.residential && counts.industrial > counts.commercial) {
            description += "It's an industrial town centered around production and manufacturing. ";
        } else {
            description += "It's a well-balanced community with diverse buildings and functions. ";
        }
        
        if (counts.civic > 3) {
            description += "The town has excellent civic amenities to serve its citizens. ";
        } else {
            description += "There's room to expand civic services as the town grows. ";
        }
        
        description += "Expand the road network and add new buildings to help your town flourish!";
        
        return description;
    }
}