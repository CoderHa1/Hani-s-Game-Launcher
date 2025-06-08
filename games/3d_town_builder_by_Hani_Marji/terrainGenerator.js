import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class TerrainGenerator {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 1;
        this.mapSize = 128; 
        this.heightMap = [];
        this.tiles = [];
        this.tileTypes = [];
        this.noise2D = createNoise2D();
        
        // Materials for different terrain types
        this.materials = {
            grass: new THREE.MeshStandardMaterial({ color: 0x7cca46 }),
            dirt: new THREE.MeshStandardMaterial({ color: 0xa97d4c }),
            sand: new THREE.MeshStandardMaterial({ color: 0xdbd291 }),
            water: new THREE.MeshStandardMaterial({ 
                color: 0x4a95cf, 
                transparent: true, 
                opacity: 0.8,
                envMap: null, // Add environment map later for reflections
                roughness: 0.1
            }),
            mountain: new THREE.MeshStandardMaterial({ color: 0x8a8a8a }),
            highlight: new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.5
            }),
            validBuild: new THREE.MeshStandardMaterial({ 
                color: 0x4caf50, // Green
                transparent: true, 
                opacity: 0.7
            }),
            invalidBuild: new THREE.MeshStandardMaterial({ 
                color: 0xf44336, // Red
                transparent: true, 
                opacity: 0.7
            })
        };
        
        // Geometry for tiles
        this.tileGeometry = new THREE.BoxGeometry(this.tileSize, 0.5, this.tileSize);
    }
    
    generate() {
        // Clear existing terrain if any
        this.clear();
        
        // Generate height map using Perlin noise
        this.generateHeightMap();
        
        // Create terrain mesh based on height map
        this.createTerrain();
        
        // Add water plane
        this.addWater();
    }
    
    clear() {
        // Remove existing terrain tiles from scene
        for (const tile of this.tiles) {
            this.scene.remove(tile);
        }
        
        // Reset arrays
        this.tiles = [];
        this.tileTypes = [];
        this.heightMap = [];
    }
    
    generateHeightMap() {
        // Create a new 2D array for the height map
        this.heightMap = new Array(this.mapSize);
        this.tileTypes = new Array(this.mapSize);
        
        for (let x = 0; x < this.mapSize; x++) {
            this.heightMap[x] = new Array(this.mapSize);
            this.tileTypes[x] = new Array(this.mapSize);
            
            for (let z = 0; z < this.mapSize; z++) {
                // Generate multiple octaves of noise for more interesting terrain
                const nx = x / this.mapSize - 0.5;
                const nz = z / this.mapSize - 0.5;
                
                let height = 0;
                
                // Large features
                height += this.noise2D(nx * 1.5, nz * 1.5) * 5;
                
                // Medium features
                height += this.noise2D(nx * 3, nz * 3) * 2.5;
                
                // Small features
                height += this.noise2D(nx * 6, nz * 6) * 1.25;
                
                // Center bias for a valley effect
                const distFromCenter = Math.sqrt(
                    Math.pow((x - this.mapSize/2) / this.mapSize, 2) + 
                    Math.pow((z - this.mapSize/2) / this.mapSize, 2)
                );
                height -= distFromCenter * 10; // Higher values create a deeper valley
                
                // Ensure height is at least slightly above water level at center
                if (distFromCenter < 0.2) {
                    height = Math.max(height, 0.5);
                }
                
                // Store the height
                this.heightMap[x][z] = height;
                
                // Determine terrain type
                if (height < 0) {
                    this.tileTypes[x][z] = 'water';
                } else if (height < 0.5) {
                    this.tileTypes[x][z] = 'sand';
                } else if (height < 2.5) {
                    this.tileTypes[x][z] = 'grass';
                } else if (height < 5) {
                    this.tileTypes[x][z] = 'dirt';
                } else {
                    this.tileTypes[x][z] = 'mountain';
                }
            }
        }
    }
    
    createTerrain() {
        // Create terrain tiles based on the height map
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const height = this.heightMap[x][z];
                const type = this.tileTypes[x][z];
                
                // Skip water tiles as they will be represented by a water plane
                if (type === 'water') continue;
                
                // Create mesh with appropriate material
                const tileMesh = new THREE.Mesh(
                    this.tileGeometry,
                    this.materials[type]
                );
                
                // Position the tile
                const worldX = (x - this.mapSize/2) * this.tileSize;
                const worldZ = (z - this.mapSize/2) * this.tileSize;
                
                tileMesh.position.set(worldX, height, worldZ);
                tileMesh.userData = { tileX: x, tileZ: z, tileType: type };
                
                // Enable shadows
                tileMesh.castShadow = true;
                tileMesh.receiveShadow = true;
                
                // Add to scene and store in tiles array
                this.scene.add(tileMesh);
                this.tiles.push(tileMesh);
            }
        }
    }
    
    addWater() {
        // Create a water plane at y=0
        const waterGeometry = new THREE.PlaneGeometry(this.mapSize * this.tileSize, this.mapSize * this.tileSize);
        const water = new THREE.Mesh(waterGeometry, this.materials.water);
        
        // Rotate and position the water plane
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0;
        
        // Add to scene
        this.scene.add(water);
    }
    
    getTileObjects() {
        return this.tiles;
    }
    
    getTileType(x, z) {
        // Convert world coordinates to tile coordinates
        const tileX = Math.round(x / this.tileSize + this.mapSize/2);
        const tileZ = Math.round(z / this.tileSize + this.mapSize/2);
        
        // Check bounds
        if (tileX < 0 || tileX >= this.mapSize || tileZ < 0 || tileZ >= this.mapSize) {
            return null;
        }
        
        return this.tileTypes[tileX][tileZ];
    }
    
    getTileHeight(x, z) {
        // Convert world coordinates to tile coordinates
        const tileX = Math.round(x / this.tileSize + this.mapSize/2);
        const tileZ = Math.round(z / this.tileSize + this.mapSize/2);
        
        // Check bounds
        if (tileX < 0 || tileX >= this.mapSize || tileZ < 0 || tileZ >= this.mapSize) {
            return 0;
        }
        
        return this.heightMap[tileX][tileZ];
    }
    
    highlightTile(tile) {
        if (!tile) return;
        
        // Store original material
        if (!tile.userData.originalMaterial) {
            tile.userData.originalMaterial = tile.material;
        }
        
        // Get the building system from scene userData
        const buildingSystem = this.scene.userData.buildingSystem;
        const game = this.scene.userData.game;
        
        // Check if we're in build mode or move mode
        if ((game && game.buildMode && game.buildingType) || game.moveMode) {
            // Check if building placement is valid at this position
            const isValid = game.moveMode ? 
                !buildingSystem.getBuildingAtPosition(tile.position.x, tile.position.z) && 
                buildingSystem.canPlaceBuilding(tile.position.x, tile.position.z, 
                    game.selectedBuilding ? game.selectedBuilding.type : null) :
                buildingSystem.canPlaceBuilding(tile.position.x, tile.position.z, game.buildingType);
            
            // Apply appropriate highlight color
            tile.material = isValid ? this.materials.validBuild : this.materials.invalidBuild;
        } else {
            // Standard highlight for selection
            tile.material = this.materials.highlight;
        }
    }
    
    clearHighlights() {
        for (const tile of this.tiles) {
            if (tile.userData.originalMaterial) {
                tile.material = tile.userData.originalMaterial;
                delete tile.userData.originalMaterial;
            }
        }
    }
    
    // Get neighbor tiles for road connectivity checks
    getNeighborTiles(x, z) {
        const neighbors = [];
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 }  // South
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            
            // Check bounds
            if (nx >= 0 && nx < this.mapSize && nz >= 0 && nz < this.mapSize) {
                neighbors.push({
                    x: nx,
                    z: nz,
                    type: this.tileTypes[nx][nz],
                    height: this.heightMap[nx][nz]
                });
            }
        }
        
        return neighbors;
    }
    
    // Check if a tile is suitable for building
    isBuildableTile(x, z) {
        // Convert world coordinates to tile coordinates
        const tileX = Math.round(x / this.tileSize + this.mapSize/2);
        const tileZ = Math.round(z / this.tileSize + this.mapSize/2);
        
        // Check bounds
        if (tileX < 0 || tileX >= this.mapSize || tileZ < 0 || tileZ >= this.mapSize) {
            return false;
        }
        
        const tileType = this.tileTypes[tileX][tileZ];
        const height = this.heightMap[tileX][tileZ];
        
        // Only allow building on grass or dirt tiles that are above water level
        // Port is a special case handled in buildingSystem's canPlaceBuilding method
        return (tileType === 'grass' || tileType === 'dirt') && height > 0;
    }
}