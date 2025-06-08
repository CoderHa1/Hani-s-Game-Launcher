import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';

import { GameState } from './gameState.js';
import { TerrainGenerator } from './terrainGenerator.js';
import { BuildingSystem } from './buildingSystem.js';
import { TimeSystem } from './timeSystem.js';
import { EconomySystem } from './economySystem.js';
import { EventSystem } from './eventSystem.js';
import { UIManager } from './uiManager.js';
import { TownGenerator } from './townGenerator.js';
import { CarSystem } from './carSystem.js';
import { WeatherSystem } from './weatherSystem.js';
import { ShipSystem } from './shipSystem.js';
import { AirCargoSystem } from './airCargoSystem.js';
import { PedestrianSystem } from './pedestrianSystem.js';
import { BoatSystem } from './boatSystem.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Systems
        this.gameState = null;
        this.terrainGenerator = null;
        this.buildingSystem = null;
        this.timeSystem = null;
        this.economySystem = null;
        this.eventSystem = null;
        this.uiManager = null;
        this.townGenerator = null;
        this.carSystem = null;
        this.weatherSystem = null;
        this.audioManager = null;
        this.pendingMusicPlay = false;
        this.shipSystem = null;
        this.airCargoSystem = null;
        this.pedestrianSystem = null;
        this.boatSystem = null;
        
        // Game settings
        this.settings = {
            graphicsQuality: 'medium',
            soundVolume: 50
        };
        
        // Input
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.selectedTile = null;
        this.buildMode = null;
        this.buildingType = null;
        this.moveMode = false;         // Add move mode flag
        this.selectedBuilding = null;  // Track the currently selected building for moving
        
        // Progress tracking for loading screen
        this.loadingProgress = 0;
        this.loadingSteps = 5; // Total number of initialization steps
        
        this.init();
    }
    
    init() {
        this.updateLoadingProgress('Initializing game', 0);
        
        // Initialize Three.js
        this.initThreeJS();
        this.updateLoadingProgress('Setting up 3D environment', 1);
        
        // Initialize game systems
        this.initGameSystems();
        this.updateLoadingProgress('Creating game systems', 2);
        
        // Set up event listeners
        this.setupEventListeners();
        this.updateLoadingProgress('Setting up controls', 3);
        
        // Generate initial town
        this.generateNewTown();
        this.updateLoadingProgress('Generating town', 4);
        
        // Start the game loop
        this.animate();
        this.updateLoadingProgress('Ready to play!', 5);
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 1000);
        
        // Set initial camera position after initialization
        this.resetCamera();
    }
    
    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.userData.game = this;
        
        // Fog for distance culling and atmosphere
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            1, 
            1000
        );
        this.camera.position.set(20, 20, 20); 
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5; 
        this.controls.maxDistance = 150;
        this.controls.maxPolarAngle = Math.PI / 2.2; // Limit camera angle
        
        // Lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    setupLighting() {
        // Ambient light - will be controlled by time system
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 50, 50);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties for the light
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        
        const d = 100;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        
        this.scene.add(this.sunLight);
        
        // Hemisphere light - will be controlled by time system
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.scene.add(hemisphereLight);
    }
    
    initGameSystems() {
        // Game state
        this.gameState = new GameState();
        
        // Terrain generator
        this.terrainGenerator = new TerrainGenerator(this.scene);
        
        // Building system
        this.buildingSystem = new BuildingSystem(this.scene, this.gameState);
        this.buildingSystem.game = this; // Add reference to game for highlight logic
        
        // Store building system in scene userData for access by terrain generator
        this.scene.userData.buildingSystem = this.buildingSystem;
        this.scene.userData.game = this; // Add reference to game for other systems
        
        // Make buildingSystem globally accessible for tax calculations
        window.buildingSystem = this.buildingSystem;
        
        // Time system
        this.timeSystem = new TimeSystem(this.scene, this.sunLight);
        
        // Economy system
        this.economySystem = new EconomySystem(this.gameState);
        
        // Event system
        this.eventSystem = new EventSystem(this.gameState);
        
        // UI manager
        this.uiManager = new UIManager(this.gameState, this);
        
        // Town generator
        this.townGenerator = new TownGenerator(
            this.scene, 
            this.terrainGenerator, 
            this.buildingSystem, 
            this.gameState
        );
        
        // Car system
        this.carSystem = new CarSystem(this.scene, this.buildingSystem);
        
        // Ship system - initialize after building system and economy system
        this.shipSystem = new ShipSystem(this.scene, this.buildingSystem, this.economySystem);
        
        // Air cargo system for airports
        this.airCargoSystem = new AirCargoSystem(this.scene, this.buildingSystem, this.economySystem);
        
        // Pedestrian system for people walking on sidewalks
        this.pedestrianSystem = new PedestrianSystem(this.scene, this.buildingSystem);
        
        // Boat system for patrolling boats in water channels
        this.boatSystem = new BoatSystem(this.scene, this.buildingSystem);
        
        // Initialize audio
        this.initAudio();
        
        // Weather system - initialize after terrain is generated
    }
    
    initAudio() {
        // Create audio element for background music
        this.backgroundMusic = new Audio('muzak.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.settings.soundVolume / 100;
        
        // Start playing (will be silent until faded in)
        this.fadeInMusic();
    }
    
    fadeInMusic() {
        if (!this.backgroundMusic) return;
        
        // Start playback with user interaction
        const playPromise = this.backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn("Couldn't autoplay music:", e);
                // Store that we need to play when interaction happens
                this.pendingMusicPlay = true;
            });
        }
        
        // Gradually increase volume
        const targetVolume = this.settings.soundVolume / 100;
        const fadeTime = 2.0; // Fade in over 2 seconds
        const fadeSteps = 20;
        const volumeIncrement = targetVolume / fadeSteps;
        let currentStep = 0;
        
        this.backgroundMusic.volume = 0; // Start silent
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.min(targetVolume, volumeIncrement * currentStep);
            this.backgroundMusic.volume = newVolume;
            
            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
            }
        }, fadeTime * 1000 / fadeSteps);
    }
    
    fadeOutMusic(callback) {
        if (!this.backgroundMusic) return;
        
        const currentVolume = this.backgroundMusic.volume;
        const fadeTime = 2.0; // Fade out over 2 seconds
        const fadeSteps = 20;
        const volumeDecrement = currentVolume / fadeSteps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.max(0, currentVolume - volumeDecrement * currentStep);
            this.backgroundMusic.volume = newVolume;
            
            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
                this.backgroundMusic.pause();
                if (callback) callback();
            }
        }, fadeTime * 1000 / fadeSteps);
    }
    
    setMusicVolume(volume) {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = volume;
        }
    }
    
    setupEventListeners() {
        // Mouse movement for raycasting
        document.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        
        // Mouse click for selection and building placement
        document.addEventListener('click', (event) => this.onMouseClick(event), false);
        
        // UI button event listeners
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                // Handle move building button separately
                if (event.target.id === 'move-building-btn') {
                    this.toggleMoveMode();
                } else {
                    this.onBuildButtonClick(event);
                }
            }, false);
        });
        
        // Add toggle button for info panel
        document.getElementById('toggle-info-panel').addEventListener('click', () => {
            document.getElementById('info-panel').classList.toggle('collapsed-info-panel');
            const toggleBtn = document.getElementById('toggle-info-panel');
            toggleBtn.textContent = document.getElementById('info-panel').classList.contains('collapsed-info-panel') ? '▲' : '▼';
        });
        
        // Other existing event listeners
        document.getElementById('toggle-menu-btn').addEventListener('click', () => this.toggleSettingsPanel(), false);
        document.getElementById('resume-btn').addEventListener('click', () => this.toggleGameMenu(), false);
        document.getElementById('new-town-btn').addEventListener('click', () => this.generateNewTown(), false);
        document.getElementById('settings-btn').addEventListener('click', () => this.toggleSettingsPanel(), false);
        document.getElementById('close-settings-btn').addEventListener('click', () => this.toggleSettingsPanel(), false);
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp(), false);
        document.getElementById('speed-btn').addEventListener('click', () => this.cycleGameSpeed(), false);
        
        // Add sandbox mode toggle button
        document.getElementById('sandbox-mode-btn').addEventListener('click', () => this.toggleSandboxMode(), false);
        
        // Add music toggle button
        document.getElementById('toggle-music-btn').addEventListener('click', () => this.toggleMusic(), false);
        
        // Add fullscreen toggle button
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullScreen(), false);
        
        // Listen for first user interaction to start music
        document.addEventListener('click', () => {
            if (this.pendingMusicPlay) {
                this.backgroundMusic.play().catch(e => console.warn("Still couldn't play music:", e));
                this.pendingMusicPlay = false;
            }
        }, { once: true });
        
        // Settings panel
        document.getElementById('graphics-quality').addEventListener('change', (event) => {
            this.settings.graphicsQuality = event.target.value;
            this.applyGraphicsSettings();
        });
        
        document.getElementById('sound-volume').addEventListener('input', (event) => {
            this.settings.soundVolume = event.target.value;
            // Apply volume changes to audio
            this.setMusicVolume(this.settings.soundVolume / 100);
        });
    }
    
    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the hover effect on terrain tiles
        this.updateHoverHighlight();
    }
    
    onMouseClick(event) {
        // Ignore clicks on UI elements
        if (event.target.closest('#ui-container')) {
            return;
        }
        
        // Handle clicks based on current mode
        if (this.selectedTile) {
            if (this.moveMode) {
                this.handleMoveBuildingClick();
            } else if (this.buildMode && this.buildingType) {
                this.placeBuilding();
            } else {
                this.selectTile(this.selectedTile);
            }
        }
    }
    
    handleMoveBuildingClick() {
        const position = this.selectedTile.position;
        const buildingInfo = this.buildingSystem.getBuildingAtPosition(position.x, position.z);
        
        if (!this.selectedBuilding && buildingInfo) {
            // First click - select a building to move
            this.selectedBuilding = buildingInfo;
            this.buildingSystem.highlightBuildingForMove(this.selectedBuilding);
            this.uiManager.showNotification(`Selected ${buildingInfo.type}. Click where to move it.`, "info");
        } else if (this.selectedBuilding) {
            // Second click - place the building at new location
            if (buildingInfo) {
                this.uiManager.showNotification("Cannot place building on top of another building", "error");
                return;
            }
            
            // Check if new position is valid for building
            if (!this.buildingSystem.canPlaceBuilding(position.x, position.z, this.selectedBuilding.type)) {
                this.uiManager.showNotification("Cannot move building here!", "error");
                return;
            }
            
            // Remove highlight before moving
            this.buildingSystem.clearBuildingMoveHighlight(this.selectedBuilding);
            
            // Move the building
            const success = this.buildingSystem.moveBuilding(
                this.selectedBuilding.x, 
                this.selectedBuilding.z, 
                position.x, 
                position.z
            );
            
            if (success) {
                this.uiManager.showNotification(`${this.selectedBuilding.type} moved`, "success");
                this.selectedBuilding = null;
                
                // Reset highlighting after successful move
                this.terrainGenerator.clearHighlights();
                this.updateHoverHighlight();
            }
        }
    }
    
    updateHoverHighlight() {
        // Cast a ray from the camera to the mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all terrain tiles
        const terrainObjects = this.terrainGenerator.getTileObjects();
        
        // Calculate intersections
        const intersects = this.raycaster.intersectObjects(terrainObjects);
        
        // Clear previous highlight
        this.terrainGenerator.clearHighlights();
        
        if (intersects.length > 0) {
            // Store the selected tile
            this.selectedTile = intersects[0].object;
            
            // Always use normal highlighting, even in move mode
            this.terrainGenerator.highlightTile(this.selectedTile);
        } else {
            this.selectedTile = null;
        }
    }
    
    selectTile(tile) {
        // Show info about the selected tile or building
        const tilePosition = tile.position;
        const buildingInfo = this.buildingSystem.getBuildingAtPosition(tilePosition.x, tilePosition.z);
        
        if (buildingInfo) {
            this.uiManager.showBuildingInfo(buildingInfo);
        } else {
            this.uiManager.showTileInfo({
                x: tilePosition.x,
                z: tilePosition.z,
                type: this.terrainGenerator.getTileType(tilePosition.x, tilePosition.z),
                elevation: tilePosition.y
            });
        }
    }
    
    onBuildButtonClick(event) {
        const buildType = event.target.getAttribute('data-type');
        
        // Toggle build mode
        if (this.buildMode === buildType) {
            this.buildMode = null;
            this.buildingType = null;
            document.querySelectorAll('.build-btn').forEach(btn => btn.classList.remove('selected'));
            this.uiManager.clearBuildingOptions();
        } else {
            this.buildMode = buildType;
            document.querySelectorAll('.build-btn').forEach(btn => btn.classList.remove('selected'));
            event.target.classList.add('selected');
            this.uiManager.showBuildingOptions(buildType);
        }
        
        // Update hover effect to show valid/invalid placement
        this.updateHoverHighlight();
    }
    
    setBuildingType(type) {
        this.buildingType = type;
        // Update hover effect to show valid/invalid placement
        this.updateHoverHighlight();
    }
    
    placeBuilding() {
        if (!this.buildMode || !this.buildingType || !this.selectedTile) return;
        
        const position = this.selectedTile.position.clone();
        
        // Check if position is valid for building
        if (!this.buildingSystem.canPlaceBuilding(position.x, position.z, this.buildingType)) {
            this.uiManager.showNotification("Cannot place building here!", "error");
            return;
        }
        
        // Check if we can afford it (except in sandbox mode)
        const buildingCost = this.buildingSystem.getBuildingCost(this.buildingType);
        if (!this.gameState.sandboxMode && this.gameState.money < buildingCost) {
            this.uiManager.showNotification(`Not enough money! Need $${buildingCost}`, "error");
            return;
        }
        
        // Deduct cost (except in sandbox mode)
        if (!this.gameState.sandboxMode) {
            this.gameState.money -= buildingCost;
        }
        
        // Place the building
        const success = this.buildingSystem.placeBuilding(
            position.x, 
            position.z, 
            this.buildMode, 
            this.buildingType
        );
        
        if (success) {
            this.uiManager.showNotification(`${this.buildingType} built`, "success");
            this.uiManager.updateResourceDisplay();
        }
    }
    
    toggleMoveMode() {
        this.moveMode = !this.moveMode;
        
        // Exit build mode when entering move mode
        if (this.moveMode) {
            this.buildMode = null;
            this.buildingType = null;
            document.querySelectorAll('.build-btn').forEach(btn => {
                if (btn.id !== 'move-building-btn') {
                    btn.classList.remove('selected');
                }
            });
            this.uiManager.clearBuildingOptions();
            document.getElementById('move-building-btn').classList.add('selected');
            this.uiManager.showNotification("Select a building to move", "info");
        } else {
            document.getElementById('move-building-btn').classList.remove('selected');
            
            // Clear highlight from previously selected building if exists
            if (this.selectedBuilding) {
                this.buildingSystem.clearBuildingMoveHighlight(this.selectedBuilding);
                this.selectedBuilding = null;
            }
            
            // Reset highlighting when exiting move mode
            this.terrainGenerator.clearHighlights();
            this.updateHoverHighlight();
        }
        
        // Update hover highlighting to show valid/invalid placement
        this.updateHoverHighlight();
    }
    
    toggleMusic() {
        const musicBtn = document.getElementById('toggle-music-btn');
        
        if (!this.backgroundMusic) return;
        
        if (this.backgroundMusic.paused || this.backgroundMusic.volume === 0) {
            // Music is off, turn it on
            if (this.backgroundMusic.paused) {
                this.backgroundMusic.play().catch(e => console.warn("Couldn't play music:", e));
            }
            this.fadeInMusic();
            musicBtn.textContent = '🔊';
        } else {
            // Music is on, turn it off
            this.fadeOutMusic();
            musicBtn.textContent = '🔈';
        }
    }
    
    toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log(`Error attempting to enable fullscreen: ${e.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    generateNewTown() {
        // Show loading screen
        document.getElementById('loading-screen').style.display = 'flex';
        this.updateLoadingProgress('Generating new town', 0);
        
        // Fade out music
        this.fadeOutMusic(() => {
            // Clear existing objects
            while(this.scene.children.length > 0){ 
                this.scene.remove(this.scene.children[0]); 
            }
            
            // Reset game state
            this.gameState.reset();
            this.updateLoadingProgress('Resetting game state', 1);
            
            // Setup lighting again
            this.setupLighting();
            this.updateLoadingProgress('Setting up environment', 2);
            
            // Generate terrain
            this.terrainGenerator.generate();
            // Store terrain generator in scene userData for access by building system
            this.scene.userData.terrainGenerator = this.terrainGenerator;
            this.updateLoadingProgress('Generating terrain', 3);
            
            // Initialize weather system after terrain is created
            this.weatherSystem = new WeatherSystem(this.scene, this.terrainGenerator);
            
            // Generate initial town layout
            this.townGenerator.generateInitialTown();
            this.updateLoadingProgress('Building town infrastructure', 4);
            
            // Spawn cars on roads
            this.carSystem.spawnCars(10);
            
            // Spawn pedestrians on sidewalks
            this.pedestrianSystem.spawnPedestrians(20);
            
            // Clear ships and planes
            if (this.shipSystem) {
                this.shipSystem.clearShips();
            }
            
            if (this.airCargoSystem) {
                this.airCargoSystem.clearPlanes();
            }
            
            if (this.boatSystem) {
                this.boatSystem.clearBoats();
            }
            
            // Reset camera position to closer zoom
            this.resetCamera();
            
            // Update UI
            this.uiManager.updateResourceDisplay();
            this.updateLoadingProgress('Finishing touches', 5);
            
            // Fade in music again
            this.fadeInMusic();
            
            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                this.uiManager.showNotification("New town generated!", "success");
            }, 1000);
            
            // Reset game speed
            this.gameState.gameSpeed = 1;
            this.uiManager.updateSpeedDisplay();
            
            // Close any open menus
            document.getElementById('game-menu').classList.add('hidden');
        });
    }
    
    resetCamera() {
        // Set camera to close zoom position looking at town center with a broader overview
        this.camera.position.set(30, 30, 30); 
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }
    
    updateLoadingProgress(text, step) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        const progressPercent = (step / this.loadingSteps) * 100;
        progressBar.style.width = `${progressPercent}%`;
        loadingText.textContent = text;
    }
    
    toggleGameMenu() {
        const gameMenu = document.getElementById('game-menu');
        gameMenu.classList.toggle('hidden');
        
        // Pause game when menu is open
        if (!gameMenu.classList.contains('hidden')) {
            this.gameState.previousSpeed = this.gameState.gameSpeed;
            this.gameState.gameSpeed = 0;
        } else {
            this.gameState.gameSpeed = this.gameState.previousSpeed || 1;
        }
        
        this.uiManager.updateSpeedDisplay();
    }
    
    toggleSettingsPanel() {
        const settingsPanel = document.getElementById('settings-panel');
        const gameMenu = document.getElementById('game-menu');
        
        settingsPanel.classList.toggle('hidden');
        
        // Hide game menu when settings are shown
        if (!settingsPanel.classList.contains('hidden')) {
            gameMenu.classList.add('hidden');
        }
    }
    
    showHelp() {
        // Implement help system later
        alert("Help functionality coming soon!");
    }
    
    cycleGameSpeed() {
        const speeds = [0, 1, 2, 3]; // Paused, Normal, Fast, Very Fast
        const currentIndex = speeds.indexOf(this.gameState.gameSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        this.gameState.gameSpeed = speeds[nextIndex];
        
        this.uiManager.updateSpeedDisplay();
    }
    
    applyGraphicsSettings() {
        // Apply graphics settings based on quality level
        // Check if we're on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // If on mobile, reduce quality automatically regardless of settings
        if (isMobile) {
            this.renderer.setPixelRatio(1);
            this.renderer.shadowMap.enabled = false;
            this.scene.fog = null;
            
            // Reduce shadow quality for all lights
            if (this.sunLight) {
                this.sunLight.shadow.mapSize.width = 512;
                this.sunLight.shadow.mapSize.height = 512;
            }
            
            // Limit animation frame rate on mobile
            this.targetFPS = 30;
        } else {
            switch (this.settings.graphicsQuality) {
                case 'low':
                    this.renderer.setPixelRatio(1);
                    this.renderer.shadowMap.enabled = false;
                    this.scene.fog = null;
                    break;
                case 'medium':
                    this.renderer.setPixelRatio(window.devicePixelRatio);
                    this.renderer.shadowMap.enabled = true;
                    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);
                    break;
                case 'high':
                    this.renderer.setPixelRatio(window.devicePixelRatio);
                    this.renderer.shadowMap.enabled = true;
                    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);
                    break;
            }
            
            // No frame rate limit on desktop
            this.targetFPS = 60;
        }
        
        // Apply sound settings
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.settings.soundVolume / 100;
        }
    }
    
    animate() {
        // Use requestAnimationFrame with FPS throttling for smooth, consistent animations
        const currentTime = performance.now();
        const targetFrameTime = 1000 / (this.targetFPS || 60);
        
        if (!this.lastFrameTime || (currentTime - this.lastFrameTime) >= targetFrameTime) {
            this.lastFrameTime = currentTime;
            
            const deltaTime = this.clock.getDelta();
            this.update(deltaTime);
            
            this.renderer.render(this.scene, this.camera);
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    update(deltaTime) {
        // Only update game systems if the game is not paused
        if (this.gameState.gameSpeed > 0) {
            // Update time and day/night cycle
            this.timeSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update weather
            if (this.weatherSystem) {
                this.weatherSystem.update(deltaTime * this.gameState.gameSpeed, this.timeSystem);
            }
            
            // Update economy
            this.economySystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update events
            this.eventSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update buildings
            this.buildingSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update cars
            this.carSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update pedestrians
            this.pedestrianSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update ships
            this.shipSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update air cargo
            this.airCargoSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update boats in water channels
            this.boatSystem.update(deltaTime * this.gameState.gameSpeed);
            
            // Update UI
            this.uiManager.update();
        }
        
        // Always update controls for camera movement
        this.controls.update();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    toggleSandboxMode() {
        this.gameState.sandboxMode = !this.gameState.sandboxMode;
        
        // Update button appearance
        const sandboxBtn = document.getElementById('sandbox-mode-btn');
        sandboxBtn.classList.toggle('active', this.gameState.sandboxMode);
        sandboxBtn.title = this.gameState.sandboxMode ? "Sandbox Mode: On" : "Sandbox Mode: Off";
        
        // Apply sandbox mode effects
        if (this.gameState.sandboxMode) {
            // Store original money for reverting later
            this.gameState.originalMoney = this.gameState.money;
            // Give unlimited money in sandbox mode
            this.gameState.money = 9999999;
            this.uiManager.showNotification("Sandbox Mode activated: Unlimited money!", "success");
        } else {
            // Restore original money when exiting sandbox mode
            this.gameState.money = this.gameState.originalMoney || 50000;
            this.uiManager.showNotification("Sandbox Mode deactivated", "info");
        }
        
        // Update UI
        this.uiManager.updateResourceDisplay();
    }
}

// Initialize the game when the window is loaded
window.addEventListener('load', () => {
    const game = new Game();
});