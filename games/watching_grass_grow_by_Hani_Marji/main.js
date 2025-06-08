import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let clock;
let rendererDomElement;

// Game objects
let grass;
const grassInstances = 100000;
const initialGrassScales = []; // To store initial random scales

// Game logic
let gameState = 'intro'; // 'intro', 'menu', 'playing', 'paused', 'won'
const GAME_DURATION = 6 * 60 * 60; // 6 hours in seconds
let totalElapsedTime = 0;
let lastGrassUpdateTime = 0;

// Useless UI state
let grassCoins = 0;
let health = 100;
let mana = 100;

// Achievements
const achievements = {
    settingsChampion: { name: "Settings World Champion", description: "You've explored every single setting. A true connoisseur.", unlocked: false },
    journeyBegins: { name: "The Journey Begins", description: "Start your first game of watching grass grow.", unlocked: false },
    rookiePatience: { name: "The Patience of a Rookie", description: "Last for 1 hour.", unlocked: false, time: 3600 },
    middleJourney: { name: "The Middle of Journey", description: "Last for 3 hours.", unlocked: false, time: 10800 },
    journeysEnd: { name: "The Journey's End", description: "Finish the game by watching grass grow for 6 hours.", unlocked: false, time: GAME_DURATION }
};
let toastTimeout;

// --- SETTINGS ---
const fakeSettings = [
    { name: "Graphics", options: ["LOW", "MEDIUM", "HIGH", "ULTRA"], defaultIndex: 3 }, // Real
    { name: "Shadows", options: ["OFF", "ON"], defaultIndex: 1, action: updateShadows }, // Real
    { name: "Unicorn Sparkle Intensity", options: ["Off", "Subtle", "Dazzling", "Blinding"], defaultIndex: 1 },
    { name: "Gravitational Constant", options: ["Earth", "Moon", "Cheese"], defaultIndex: 0 },
    { name: "Sky Color Gamut", options: ["sRGB", "Rec. 2020", "Slightly Mauve"], defaultIndex: 0 },
    { name: "Audio Backend", options: ["DirectSound", "WASAPI", "Two Cans & A String"], defaultIndex: 1 },
    { name: "NPC Sarcasm Level", options: ["0%", "75%", "110%"], defaultIndex: 1 },
    { name: "Thermodynamic Inversion", options: ["Disabled", "Enabled", "Mostly Tuesday"], defaultIndex: 0 },
    { name: "Quantum Entanglement Sync", options: ["Off", "On", "Maybe"], defaultIndex: 0 },
    { name: "Goblin Market Haggling AI", options: ["Fair", "Cutthroat", "Your-Problem-Now"], defaultIndex: 0 },
    { name: "Dragon's Breath Mintiness", options: ["Winterfresh", "Peppermint", "Inferno"], defaultIndex: 1 },
    { name: "Anti-Aliasing (Aardvark)", options: ["None", "2x", "4x", "8x MSAA"], defaultIndex: 2 },
    { name: "Sub-pixel Morphology", options: ["Disabled", "Enabled"], defaultIndex: 0 },
    { name: "Anisotropic Filtering", options: ["1x", "4x", "16x", "Ask Me Later"], defaultIndex: 2 },
    { name: "Z-Buffer Precision", options: ["16-bit", "24-bit", "32-bit", "Does it matter?"], defaultIndex: 1 },
    { name: "Haptic Feedback For Feelings", options: ["On", "Off"], defaultIndex: 1 },
    { name: "Olfactory Rendering", options: ["New-Game Smell", "Victory", "Defeat"], defaultIndex: 0 },
    { name: "Metaphysical Shaders", options: ["Realistic", "Abstract", "Confusing"], defaultIndex: 2 },
    { name: "Procedural Quest Boredom", options: ["Low", "Medium", "High", "Authentic MMO"], defaultIndex: 2 },
    { name: "Time Dilation Factor", options: ["1.0", "0.5", "2.0", "When you're having fun"], defaultIndex: 0 },
    { name: "Pre-computed Existential Dread", options: ["Low", "Medium", "High"], defaultIndex: 1 },
    { name: "Squirrel Aggressiveness", options: ["Passive", "Territorial", "Ready for War"], defaultIndex: 1 },
    { name: "Dynamic Cloud Sheepiness", options: ["None", "Fluffy", "Extra Fluffy"], defaultIndex: 1 },
    { name: "Water Wetness Simulation", options: ["On", "Off", "Moist"], defaultIndex: 2 },
    { name: "Inverse Kinematics For Noodles", options: ["On", "Off"], defaultIndex: 1 },
    { name: "Ambient Occlusion Obscurity", options: ["Low", "High", "Wait, what's that?"], defaultIndex: 0 },
    { name: "Tessellation Detail", options: ["Low", "Medium", "Ludicrous"], defaultIndex: 1 },
    { name: "Sentient Item Chatter", options: ["Off", "Occasional", "Incessant"], defaultIndex: 1 },
    { name: "Historical Accuracy", options: ["High", "Low", "Completely Fabricated"], defaultIndex: 2 },
    { name: "Bard Song Off-key-ness", options: ["0%", "15%", "90%"], defaultIndex: 1 },
    { name: "Fourth Wall Transparency", options: ["Opaque", "Translucent", "Non-Existent"], defaultIndex: 1 },
    { name: "Inter-dimensional Cable", options: ["Basic", "Premium", "All Realities"], defaultIndex: 0 },
    { name: "Philosophical Query Rate", options: ["Low", "Medium", "High"], defaultIndex: 0 },
    { name: "Potion Flavor Profile", options: ["Berry", "Bitter", "Regret"], defaultIndex: 2 },
    { name: "Cheese-to-Wheel Ratio", options: ["Standard", "Extra Cheesy"], defaultIndex: 0 },
    { name: "Font Kerning Ligatures", options: ["On", "Off"], defaultIndex: 0 },
    { name: "UI Bevel & Emboss", options: ["Subtle", "Pronounced", "90s Website"], defaultIndex: 0 },
    { name: "Nostalgia Filter Strength", options: ["Low", "High", "The Good Old Days"], defaultIndex: 0 },
    { name: "Unnecessary Lens Flare", options: ["On", "Off", "J.J. Abrams Mode"], defaultIndex: 2 },
    { name: "Chromatic Aberration", options: ["Low", "Medium", "My Eyes Hurt"], defaultIndex: 0 },
    { name: "Film Grain Emulation", options: ["Subtle", "Heavy", "Vintage"], defaultIndex: 0 },
    { name: "Scanline Simulation", options: ["On", "Off"], defaultIndex: 1 },
    { name: "Glitch Art Frequency", options: ["Rare", "Common", "Constant"], defaultIndex: 0 },
    { name: "Pixel Perfect Mode", options: ["On", "Off"], defaultIndex: 1 },
    { name: "Texture Streaming (VRAM)", options: ["Low", "High", "Unlimited"], defaultIndex: 1 },
    { name: "Texture Streaming (RAMEN)", options: ["1 Packet", "2 Packets", "Family Size"], defaultIndex: 0 },
    { name: "Grass Blade Polygon Count", options: ["12", "64", "As many as we can"], defaultIndex: 2 },
    { name: "Player Character Smell", options: ["Fresh Linen", "Old Spice", "Wet Dog"], defaultIndex: 0 },
    { name: "Mouse Cursor Trail", options: ["On", "Off", "Comet"], defaultIndex: 1 },
    { name: "Blinking Speed", options: ["Normal", "Slow", "Synchronized"], defaultIndex: 0 },
    { name: "Audio Channel Config", options: ["Stereo", "5.1", "7.1", "Theater"], defaultIndex: 0 },
    { name: "Reverb Quality", options: ["Hall", "Cave", "Bathroom"], defaultIndex: 0 },
    { name: "Virtual Surround Sound", options: ["On", "Off"], defaultIndex: 0 },
    { name: "Equalizer Preset", options: ["Flat", "Rock", "Podcast Voice"], defaultIndex: 2 },
    { name: "Dynamic Range Compression", options: ["Light", "Heavy", "Crushed"], defaultIndex: 0 },
    { name: "NPC Eye Contact", options: ["Normal", "Shifty", "Unwavering"], defaultIndex: 2 },
    { name: "Cloud Save Provider", options: ["Steam", "Local", "A passing cloud"], defaultIndex: 2 },
    { name: "Automatic Bug Reporter", options: ["On", "Off"], defaultIndex: 0 },
    { name: "EULA Pop-up Frequency", options: ["Once", "Daily", "Every Click"], defaultIndex: 1 },
    { name: "GDPR Consent Options", options: ["Accept All", "Reject All", "Malicious Compliance"], defaultIndex: 2 },
];
let settingsState = {};
const touchedSettings = new Set();
fakeSettings.forEach(setting => {
    settingsState[setting.name] = setting.defaultIndex || 0;
});

function onSettingArrowClick(e) {
    playSound(menuClickBuffer);
    const index = parseInt(e.target.dataset.settingIndex, 10);
    const setting = fakeSettings[index];
    const direction = e.target.classList.contains('left-arrow') ? -1 : 1;

    let currentIndex = settingsState[setting.name];
    currentIndex = (currentIndex + direction + setting.options.length) % setting.options.length;
    settingsState[setting.name] = currentIndex;

    const valueSpan = document.getElementById(`setting-value-${index}`);
    if (valueSpan) {
        valueSpan.textContent = setting.options[currentIndex];
    }

    // Handle real settings
    if (setting.action) {
        setting.action(setting.options[currentIndex]);
    }

    // Achievement logic
    touchedSettings.add(setting.name);
    if (touchedSettings.size === fakeSettings.length) {
        unlockAchievement('settingsChampion');
    }
}

function populateSettings() {
    const settingsListContainer = document.getElementById('settings-list-container');
    if (!settingsListContainer) return;

    settingsListContainer.innerHTML = '';
    
    // Create categories for better organization
    const categories = {
        "Graphics": [],
        "Audio": [],
        "Gameplay": [],
        "Advanced": []
    };
    
    // Assign settings to categories
    fakeSettings.forEach((setting, index) => {
        if (setting.name.includes("Audio") || setting.name.includes("Sound") || 
            setting.name.includes("Volume") || setting.name.includes("Reverb")) {
            categories["Audio"].push({setting, index});
        } else if (setting.name.includes("Shadow") || setting.name.includes("Texture") || 
                  setting.name.includes("Graphics") || setting.name.includes("Light")) {
            categories["Graphics"].push({setting, index});
        } else if (setting.name.includes("Physics") || setting.name.includes("NPC") || 
                  setting.name.includes("Grass") || setting.name.includes("Character")) {
            categories["Gameplay"].push({setting, index});
        } else {
            categories["Advanced"].push({setting, index});
        }
    });
    
    // Create settings UI with category headers
    for (const [category, settings] of Object.entries(categories)) {
        if (settings.length === 0) continue;
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'settings-category';
        categoryHeader.innerHTML = `<h3>${category}</h3>`;
        settingsListContainer.appendChild(categoryHeader);
        
        settings.forEach(({setting, index}) => {
            const settingDiv = document.createElement('div');
            settingDiv.className = 'setting';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = setting.name;

            const controlDiv = document.createElement('div');
            controlDiv.className = 'setting-control';

            const leftArrow = document.createElement('span');
            leftArrow.className = 'arrow left-arrow';
            leftArrow.textContent = '<';
            leftArrow.dataset.settingIndex = index;

            const valueSpan = document.createElement('span');
            valueSpan.id = `setting-value-${index}`;
            valueSpan.textContent = setting.options[settingsState[setting.name]];
            valueSpan.style.minWidth = '150px'; // Give more space for longer options

            const rightArrow = document.createElement('span');
            rightArrow.className = 'arrow right-arrow';
            rightArrow.textContent = '>';
            rightArrow.dataset.settingIndex = index;

            leftArrow.addEventListener('click', onSettingArrowClick);
            rightArrow.addEventListener('click', onSettingArrowClick);
            leftArrow.addEventListener('mouseenter', () => playSound(menuHoverBuffer));
            rightArrow.addEventListener('mouseenter', () => playSound(menuHoverBuffer));

            controlDiv.appendChild(leftArrow);
            controlDiv.appendChild(valueSpan);
            controlDiv.appendChild(rightArrow);

            settingDiv.appendChild(nameSpan);
            settingDiv.appendChild(controlDiv);

            settingsListContainer.appendChild(settingDiv);
        });
    }
    
    // Smooth scroll to top when menu opens
    settingsListContainer.scrollTop = 0;
}

// NEW walking effect variables
let lastFootstepTime = 0;
const footstepInterval = 0.4; // seconds
let bobbingTime = 0;

// Character Preview
let charScene, charCamera, charRenderer, charModel, charContainer;
let charPreviewInitialized = false;
let currentRace = 'HUMAN', currentSkill = "DRAGON'S BREATH";

// Movement
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const areaSize = new THREE.Vector3(50, 20, 50);

// UI Elements
const pauseMenuElement = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');
const quitButton = document.getElementById('quit-button');
const uiElement = document.getElementById('ui');
const timerElement = document.getElementById('timer');
const winMessageElement = document.getElementById('win-message');
const blocker = document.getElementById('blocker');
const menuElement = document.getElementById('menu');
const menuButton = document.getElementById('menu-button');
const achievementsButton = document.getElementById('achievements-button');
const settingsButton = document.getElementById('settings-button');
const settingsMenu = document.getElementById('settings-menu');
const backButton = document.getElementById('back-button');
const achievementsScreen = document.getElementById('achievements-screen');
const achievementsList = document.getElementById('achievements-list');
const achievementsBackButton = document.getElementById('achievements-back-button');
const characterCreationScreen = document.getElementById('character-creation-screen');
const startGameButton = document.getElementById('start-game-button');
const creationBackButton = document.getElementById('creation-back-button');
const toastContainer = document.getElementById('toast-container');
const grassCoinsValueElement = document.getElementById('grass-coins-value');
let healthBarFill, manaBarFill, healthText, manaText;

// Audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let winSoundBuffer, ambientSoundBuffer, menuMusicBuffer, menuHoverBuffer, menuClickBuffer, footstepSoundBuffer;
let mainGainNode;
let currentMenuMusicSource, currentAmbientSource;
let minimapCanvas, minimapCtx;

// --- NEW HELPER FUNCTIONS ---

function getTerrainHeight(x, z) {
    let y = 0;
    // A combination of sine waves for rolling hills
    y += Math.sin(x * 0.08) * Math.cos(z * 0.06) * 1.5;
    y += Math.cos(x * 0.04 + 1) * Math.sin(z * 0.05 + 2) * 1.5;
    return y * 0.6; // Overall amplitude
}

function updateShadows(setting) {
    const enabled = setting === 'ON';
    renderer.shadowMap.enabled = enabled;
    
    scene.traverse(child => {
        if (child.isLight && child.castShadow !== undefined) {
            child.castShadow = enabled;
        }
        // This is the most reliable way to make the engine recompile shaders
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.needsUpdate = true);
            } else {
                child.material.needsUpdate = true;
            }
        }
    });
}

function initUselessUI() {
    minimapCanvas = document.getElementById('minimap');
    if (!minimapCanvas) return;
    minimapCtx = minimapCanvas.getContext('2d');
    drawUselessMinimap();
}

function drawUselessMinimap() {
    if (!minimapCtx) return;
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;

    minimapCtx.fillStyle = '#3a4a34'; // Dark green
    minimapCtx.fillRect(0, 0, w, h);
    
    minimapCtx.strokeStyle = 'rgba(120, 150, 110, 0.5)';
    minimapCtx.lineWidth = 1;

    // Draw some random lines that look like contours
    for (let i = 0; i < 15; i++) {
        minimapCtx.beginPath();
        minimapCtx.moveTo(Math.random() * w, Math.random() * h);
        minimapCtx.bezierCurveTo(
            Math.random() * w, Math.random() * h,
            Math.random() * w, Math.random() * h,
            Math.random() * w, Math.random() * h
        );
        minimapCtx.stroke();
    }

    // Draw some random "features"
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const radius = Math.random() * 5 + 2;
        minimapCtx.fillStyle = `rgba(85, 107, 47, ${Math.random() * 0.5 + 0.5})`; // Shades of darkolivegreen
        minimapCtx.beginPath();
        minimapCtx.arc(x, y, radius, 0, Math.PI * 2);
        minimapCtx.fill();
    }
}

function initUselessElements() {
    healthBarFill = document.getElementById('health-bar-fill');
    manaBarFill = document.getElementById('mana-bar-fill');
    healthText = document.getElementById('health-text');
    manaText = document.getElementById('mana-text');
}

function resetUselessUI() {
    grassCoins = 0;
    health = 100;
    mana = 100;

    if (grassCoinsValueElement) grassCoinsValueElement.textContent = '0';
    
    if(healthBarFill) healthBarFill.style.width = '100%';
    if(healthText) healthText.textContent = '100 / 100';
    if(manaBarFill) manaBarFill.style.width = '100%';
    if(manaText) manaText.textContent = '100 / 100';
}

// --- AUDIO FUNCTIONS ---

async function setupAudio() {
    const winSoundPromise = loadSound('win.mp3').then(buffer => winSoundBuffer = buffer);
    const ambientSoundPromise = loadSound('ambience.mp3').then(buffer => ambientSoundBuffer = buffer);
    const menuMusicPromise = loadSound('menu-music.mp3').then(buffer => menuMusicBuffer = buffer);
    const menuHoverPromise = loadSound('menu-hover.mp3').then(buffer => menuHoverBuffer = buffer);
    const menuClickPromise = loadSound('menu-click.mp3').then(buffer => menuClickBuffer = buffer);
    const footstepPromise = loadSound('footstep-grass.mp3').then(buffer => footstepSoundBuffer = buffer);

    await Promise.all([winSoundPromise, ambientSoundPromise, menuMusicPromise, menuHoverPromise, menuClickPromise, footstepPromise]);

    const startAudio = () => {
        audioContext.resume().then(() => {
            // Don't automatically play menu music here, wait for loading sequence to complete
        });
        // These listeners should only run once.
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('keydown', startAudio, { once: true });
}

async function loadSound(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error(`Failed to load sound: ${url}`, error);
    }
}

function playSound(buffer) {
    if (!buffer || !audioContext || audioContext.state === 'suspended') return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(mainGainNode);
    source.start(0);
}

function playMenuMusic() {
    if (!menuMusicBuffer || currentMenuMusicSource || audioContext.state === 'suspended') return;
    if (currentAmbientSource) {
        currentAmbientSource.stop();
        currentAmbientSource.disconnect();
        currentAmbientSource = null;
    }
    currentMenuMusicSource = audioContext.createBufferSource();
    currentMenuMusicSource.buffer = menuMusicBuffer;
    currentMenuMusicSource.loop = true;
    currentMenuMusicSource.connect(mainGainNode);
    currentMenuMusicSource.start(0);
}

function playAmbientSound() {
    if (!ambientSoundBuffer || currentAmbientSource || audioContext.state === 'suspended') return;
    if (currentMenuMusicSource) {
        currentMenuMusicSource.stop();
        currentMenuMusicSource.disconnect();
        currentMenuMusicSource = null;
    }
    currentAmbientSource = audioContext.createBufferSource();
    currentAmbientSource.buffer = ambientSoundBuffer;
    currentAmbientSource.loop = true;
    currentAmbientSource.connect(mainGainNode);
    currentAmbientSource.start(0);
}

// --- INITIALIZATION ---

function init() {
    // Start the loading sequence first
    startLoadingSequence();
    
    clock = new THREE.Clock();

    scene = new THREE.Scene();

    // Skybox and Environment Lighting
    const loader = new THREE.TextureLoader();
    loader.load('sky.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
        scene.environment = texture; // For PBR material reflections
    });

    scene.fog = new THREE.Fog(0x87ceeb, 0, 150);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    document.body.appendChild(renderer.domElement);
    rendererDomElement = renderer.domElement;

    mainGainNode = audioContext.createGain();
    mainGainNode.connect(audioContext.destination);
    const volumeSlider = document.querySelector('.slider');
    mainGainNode.gain.value = volumeSlider.value / 100;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Reduced intensity
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5); // Increased intensity
    
    directionalLight.shadow.mapSize.width = 2048; // Higher resolution shadows
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -areaSize.x / 2;
    directionalLight.shadow.camera.right = areaSize.x / 2;
    directionalLight.shadow.camera.top = areaSize.z / 2;
    directionalLight.shadow.camera.bottom = -areaSize.z / 2;

    scene.add(directionalLight);
    
    createFloor();
    createGrass();
    initUselessElements();
    setupControls();
    setupMenuListeners();
    setupPauseMenuListeners();
    setupCharacterCreationListeners();
    setupAchievementsListeners();
    loadAchievements();
    
    // Initialize shadows based on UI setting
    const initialShadows = fakeSettings.find(s => s.name === 'Shadows').options[settingsState['Shadows']];
    updateShadows(initialShadows);

    setupAudio().then(() => {
        // Resume audio on first user interaction; menu music will start only after intro or when actually in menu
        const resumeAudio = () => {
            audioContext.resume();
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
        };
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
    });

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (event) => onKeyEvent(event, true));
    document.addEventListener('keyup', (event) => onKeyEvent(event, false));
}

// --- CHARACTER PREVIEW ---

function initCharPreview() {
    charContainer = document.getElementById('character-preview-container');
    if (!charContainer) return;

    // Scene
    charScene = new THREE.Scene();

    // Camera
    const aspect = charContainer.clientWidth / charContainer.clientHeight;
    charCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    charCamera.position.set(0, 1.5, 4);
    charCamera.lookAt(0, 1, 0);

    // Renderer
    charRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    charRenderer.setPixelRatio(window.devicePixelRatio);
    charRenderer.setSize(charContainer.clientWidth, charContainer.clientHeight);
    charContainer.appendChild(charRenderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    charScene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(1, 1, 2);
    charScene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(-1, 0.5, -2);
    charScene.add(rimLight);

    // Character Model
    charModel = createCharacterModel();
    charScene.add(charModel);
    updateCharacterModel(currentRace, currentSkill);
}

function createCharacterModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.1,
    });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), material);
    torso.position.y = 0.75;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), material);
    head.position.y = 1.85;
    group.add(head);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1.3, 0.25);
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.7, 0.8, 0);
    group.add(leftArm);
    group.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.7, 0.8, 0);
    group.add(rightArm);
    group.rightArm = rightArm;

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.35, 1.4, 0.35);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.25, -0.7, 0);
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.25, -0.7, 0);
    group.add(rightLeg);

    // Special Skill effects (initially hidden)
    const haloGeometry = new THREE.TorusGeometry(0.5, 0.03, 8, 32);
    const haloMaterial = new THREE.MeshStandardMaterial({ color: 0xf1c40f, emissive: 0xf1c40f, emissiveIntensity: 2 });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.y = 2.4;
    halo.rotation.x = Math.PI / 2;
    halo.visible = false;
    group.add(halo);
    group.halo = halo;

    const breathGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const breathMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x880000, transparent: true, opacity: 0.5 });
    const breath = new THREE.Mesh(breathGeometry, breathMaterial);
    breath.position.y = 1.2;
    breath.visible = false;
    group.add(breath);
    group.breath = breath;

    // Set initial position
    group.position.y = 0.3;

    return group;
}

function updateCharacterModel(race, skill) {
    if (!charModel) return;
    
    // Reset everything first
    const defaultColor = new THREE.Color(0xcccccc);
    charModel.traverse(child => {
        if (child.isMesh) {
            child.material.color.set(defaultColor);
            if (child.material.emissive) child.material.emissive.set(0x000000);
            child.material.opacity = 1.0;
            child.material.transparent = false;
        }
    });
    charModel.halo.visible = false;
    charModel.breath.visible = false;
    charModel.leftArm.scale.set(1, 1, 1);
    charModel.rightArm.scale.set(1, 1, 1);

    // Apply Race changes
    switch(race) {
        case 'HUMAN':
            charModel.scale.set(1, 1, 1);
            break;
        case 'ELF':
            charModel.scale.set(0.85, 1.15, 0.85);
            charModel.traverse(c => { if(c.isMesh) c.material.color.set(0xb8c9a6) });
            break;
        case 'DWARF':
            charModel.scale.set(1.2, 0.8, 1.2);
            charModel.traverse(c => { if(c.isMesh) c.material.color.set(0xd1a38a) });
            break;
        case 'ORC':
            charModel.scale.set(1.2, 1.0, 1.2);
            charModel.traverse(c => { if(c.isMesh) c.material.color.set(0x7e8b61) });
            break;
        case 'HALFLING':
            charModel.scale.set(0.8, 0.7, 0.8);
            break;
    }

    // Apply Skill changes
    switch(skill) {
        case "DRAGON'S BREATH":
            charModel.breath.visible = true;
            break;
        case "SHADOWMELD":
             charModel.traverse(child => {
                if (child.isMesh && child !== charModel.halo && child !== charModel.breath) child.material.color.set(0x222222);
            });
            break;
        case "TITAN'S STRENGTH":
            charModel.leftArm.scale.set(1.3, 1.1, 1.3);
            charModel.rightArm.scale.set(1.3, 1.1, 1.3);
            break;
        case "CELESTIAL WISDOM":
            charModel.halo.visible = true;
            break;
        case "SWIFTNESS OF THE WIND":
            charModel.traverse(child => {
                if (child.isMesh && child !== charModel.halo && child !== charModel.breath) {
                    child.material.transparent = true;
                    child.material.opacity = 0.8;
                }
            });
            break;
    }
}

// --- SCENE SETUP ---

function createFloor() {
    // Plane is in X-Y plane, we rotate it to be in X-Z.
    const floorGeometry = new THREE.PlaneGeometry(areaSize.x, areaSize.z, 150, 150); // More segments for detail
    const positions = floorGeometry.attributes.position;

    // Displace vertices along their Z axis (which becomes world Y after rotation)
    for (let i = 0; i < positions.count; i++) {
        const x_plane = positions.getX(i);
        const y_plane = positions.getY(i);
        const z_world_equiv = -y_plane; // After rotation, plane's Y is along -Z world
        positions.setZ(i, getTerrainHeight(x_plane, z_world_equiv));
    }
    floorGeometry.computeVertexNormals();

    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x556B2F,
        roughness: 0.9,
        metalness: 0.0,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

function createGrass() {
    const grassBladeGeometry = new THREE.PlaneGeometry(0.1, 1, 1, 4);
    grassBladeGeometry.translate(0, 0.5, 0); // Pivot at bottom

    const grassTexture = new THREE.TextureLoader().load('grass.png');
    const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
        transparent: true,
        // color is now handled per-instance
    });

    grassMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            // Wind effect
            vec3 instancePos = vec3(instanceMatrix[3]);
            float windStrength = 0.1;
            float windSpeed = 0.5;
            float heightFactor = position.y;
    
            float windX = sin(time * windSpeed + instancePos.z * 0.2) * windStrength * heightFactor;
            float windZ = cos(time * windSpeed + instancePos.x * 0.2) * windStrength * heightFactor;
            
            transformed.x += windX;
            transformed.z += windZ;
            
            #include <project_vertex>
            `
        );
        grassMaterial.userData.shader = shader;
    };

    grass = new THREE.InstancedMesh(grassBladeGeometry, grassMaterial, grassInstances);
    grass.castShadow = true;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < grassInstances; i++) {
        position.x = Math.random() * areaSize.x - areaSize.x / 2;
        position.z = Math.random() * areaSize.z - areaSize.z / 2;
        position.y = getTerrainHeight(position.x, position.z);
        
        rotation.y = Math.random() * Math.PI;
        quaternion.setFromEuler(rotation);

        const initialScale = 0.01;
        scale.set(1, initialScale, 1);
        initialGrassScales.push(Math.random() * 0.5 + 0.75); // Store random final height multiplier

        matrix.compose(position, quaternion, scale);
        grass.setMatrixAt(i, matrix);
        
        // Add color variation
        color.setHSL(0.25, Math.random() * 0.2 + 0.4, Math.random() * 0.3 + 0.4);
        grass.setColorAt(i, color);
    }
    
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    scene.add(grass);
}

// --- CONTROLS & EVENTS ---

function setupControls() {
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    menuButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        menuElement.style.display = 'none';
        characterCreationScreen.style.display = 'flex';
        if (!charPreviewInitialized) {
            initCharPreview();
            charPreviewInitialized = true;
        }
    });

    controls.addEventListener('lock', () => {
        blocker.style.display = 'none';
        pauseMenuElement.style.display = 'none';
        rendererDomElement.style.filter = 'none';
        uiElement.style.display = 'block';

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Stop menu music and play ambient sound when game starts
        playAmbientSound();
        
        unlockAchievement('journeyBegins');
        gameState = 'playing';
    });

    controls.addEventListener('unlock', () => {
        // This is called when ESC is pressed or game is won
        if (gameState === 'won') return;
        
        // Any unlock not from winning is a pause.
        gameState = 'paused';
        pauseMenuElement.style.display = 'block';
        rendererDomElement.style.filter = 'blur(5px)';
        uiElement.style.display = 'none';

        // Play menu music when paused
        playMenuMusic();
    });
}

function setupMenuListeners() {
    settingsButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        menuElement.style.display = 'none';
        settingsMenu.style.display = 'block';
        populateSettings();
        backButton.dataset.from = 'main';
    });

    backButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        settingsMenu.style.display = 'none';
        if (backButton.dataset.from === 'pause') {
            pauseMenuElement.style.display = 'block';
        } else {
            menuElement.style.display = 'block';
        }
    });

    achievementsButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        menuElement.style.display = 'none';
        populateAchievements();
        achievementsScreen.style.display = 'block';
    });

    achievementsBackButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        achievementsScreen.style.display = 'none';
        menuElement.style.display = 'block';
    });

    document.querySelectorAll('.menu-item, .arrow').forEach(item => {
        item.addEventListener('mouseenter', () => playSound(menuHoverBuffer));
    });

    // Fake settings logic removed from here

    const volumeSlider = document.querySelector('.slider');
    volumeSlider.addEventListener('input', e => {
        if (mainGainNode) {
            mainGainNode.gain.value = e.target.value / 100;
        }
    });
}

function setupCharacterCreationListeners() {
    startGameButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        if (gameState === 'menu') {
            controls.lock();
        }
    });

    creationBackButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        characterCreationScreen.style.display = 'none';
        menuElement.style.display = 'block';
    });
    
    // --- New selection logic ---
    const raceOptions = ['HUMAN', 'ELF', 'DWARF', 'ORC', 'HALFLING'];
    const skillOptions = ["DRAGON'S BREATH", "SHADOWMELD", "TITAN'S STRENGTH", "CELESTIAL WISDOM", "SWIFTNESS OF THE WIND"];

    let currentRaceIndex = 0;
    let currentSkillIndex = 0;

    const raceValue = document.getElementById('race-value');
    const skillValue = document.getElementById('skill-value');
    
    document.querySelectorAll('#character-creation-screen .arrow').forEach(arrow => {
        arrow.addEventListener('click', (e) => {
            playSound(menuClickBuffer);
            const selection = e.target.dataset.selection;
            const direction = e.target.classList.contains('left-arrow') ? -1 : 1;

            if (selection === 'race') {
                currentRaceIndex = (currentRaceIndex + direction + raceOptions.length) % raceOptions.length;
                currentRace = raceOptions[currentRaceIndex];
                raceValue.textContent = currentRace;
            } else if (selection === 'skill') {
                currentSkillIndex = (currentSkillIndex + direction + skillOptions.length) % skillOptions.length;
                currentSkill = skillOptions[currentSkillIndex];
                skillValue.textContent = currentSkill;
            }
            updateCharacterModel(currentRace, currentSkill);
        });
    });

    document.querySelectorAll('#character-creation-screen .menu-item, #character-creation-screen .arrow').forEach(item => {
        item.addEventListener('mouseenter', () => playSound(menuHoverBuffer));
    });
}

function setupPauseMenuListeners() {
    resumeButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        controls.lock();
    });

    quitButton.addEventListener('click', () => {
        playSound(menuClickBuffer);

        // Soft reset to main menu
        gameState = 'menu';
        
        // UI
        pauseMenuElement.style.display = 'none';
        rendererDomElement.style.filter = 'none';
        blocker.style.display = 'block';
        menuElement.style.display = 'block';
        settingsMenu.style.display = 'none';
        menuButton.textContent = 'BEGIN';
        
        // Game state
        totalElapsedTime = 0;
        updateTimer();
        updateGrassGrowth();
        resetUselessUI();
        
        // Player position
        controls.getObject().position.set(0, 1.7, 0);
        
        // Audio
        playMenuMusic();
    });

    document.querySelectorAll('.pause-menu-item').forEach(item => {
        item.addEventListener('mouseenter', () => playSound(menuHoverBuffer));
    });
}

function setupAchievementsListeners() {
    achievementsButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        menuElement.style.display = 'none';
        populateAchievements();
        achievementsScreen.style.display = 'block';
    });

    achievementsBackButton.addEventListener('click', () => {
        playSound(menuClickBuffer);
        achievementsScreen.style.display = 'none';
        menuElement.style.display = 'block';
    });
}

function populateAchievements() {
    achievementsList.innerHTML = ''; // Clear existing
    for (const id in achievements) {
        const ach = achievements[id];
        const item = document.createElement('div');
        item.classList.add('achievement-item');
        if (ach.unlocked) {
            item.classList.add('unlocked');
        } else {
            item.classList.add('locked');
        }

        const title = document.createElement('h3');
        title.textContent = ach.unlocked ? ach.name : '???';
        
        const desc = document.createElement('p');
        desc.textContent = ach.unlocked ? ach.description : 'Keep playing to unlock.';

        item.appendChild(title);
        item.appendChild(desc);
        achievementsList.appendChild(item);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (charRenderer && charContainer) {
        charCamera.aspect = charContainer.clientWidth / charContainer.clientHeight;
        charCamera.updateProjectionMatrix();
        charRenderer.setSize(charContainer.clientWidth, charContainer.clientHeight);
    }
}

function onKeyEvent(event, isDown) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveState.forward = isDown; break;
        case 'ArrowLeft': case 'KeyA': moveState.left = isDown; break;
        case 'ArrowDown': case 'KeyS': moveState.backward = isDown; break;
        case 'ArrowRight': case 'KeyD': moveState.right = isDown; break;
    }
}

// --- GAME LOOP ---

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    
    if (grass && grass.material.userData.shader) {
        grass.material.userData.shader.uniforms.time.value = clock.getElapsedTime();
    }
    
    if (gameState === 'playing') {
        totalElapsedTime += deltaTime;
        updateTimer();
        updateUselessUI(deltaTime);
        if (clock.getElapsedTime() - lastGrassUpdateTime > 1) {
            updateGrassGrowth();
            lastGrassUpdateTime = clock.getElapsedTime();
        }
        updatePlayer(deltaTime);
    }
    
    // Render character preview if visible
    if (charRenderer && characterCreationScreen.style.display !== 'none') {
        if (charModel) {
            charModel.rotation.y += deltaTime * 0.5; // slow rotation
        }
        charRenderer.render(charScene, charCamera);
    }
    
    renderer.render(scene, camera);
}

// --- UPDATE FUNCTIONS ---

function updateUselessUI(deltaTime) {
    // Increment grass coins
    grassCoins += deltaTime * 0.1; // 1 coin per 10 seconds
    grassCoinsValueElement.textContent = Math.floor(grassCoins).toString();

    // Keep Health/Mana at 100 without fluctuations
    health = 100;
    if (healthBarFill) healthBarFill.style.width = `${health}%`;
    if (healthText) healthText.textContent = `${Math.floor(health)} / 100`;
    
    mana = 100;
    if (manaBarFill) manaBarFill.style.width = `${mana}%`;
    if (manaText) manaText.textContent = `${Math.floor(mana)} / 100`;
}

function updateTimer() {
    const elapsedTime = totalElapsedTime;
    
    // Check for time-based achievements
    for (const id in achievements) {
        if (achievements[id].time && elapsedTime >= achievements[id].time) {
            unlockAchievement(id);
        }
    }
    
    if (elapsedTime >= GAME_DURATION) {
        winGame();
        return;
    }
    
    const elapsedHours = Math.floor(elapsedTime / 3600);
    const elapsedMinutes = Math.floor((elapsedTime % 3600) / 60);
    const elapsedSeconds = Math.floor(elapsedTime % 60);

    const format = (t) => t.toString().padStart(2, '0');
    timerElement.textContent = `${format(elapsedHours)}:${format(elapsedMinutes)}:${format(elapsedSeconds)} / 06:00:00`;
}

function winGame() {
    gameState = 'won';
    unlockAchievement('journeysEnd');
    timerElement.textContent = "06:00:00 / 06:00:00";
    if (uiElement) uiElement.style.display = 'none';
    winMessageElement.style.display = 'block';

    blocker.classList.add('game-won');
    blocker.style.display = 'block';
    
    if (currentAmbientSource) {
        currentAmbientSource.stop();
        currentAmbientSource = null;
    }
    if (currentMenuMusicSource) {
        currentMenuMusicSource.stop();
        currentMenuMusicSource = null;
    }

    playSound(winSoundBuffer);
    controls.unlock();
}

function updateGrassGrowth() {
    if (!grass) return;

    const elapsedTime = totalElapsedTime;
    const growthFactor = Math.min(elapsedTime / GAME_DURATION, 1.0);

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < grassInstances; i++) {
        grass.getMatrixAt(i, matrix);
        matrix.decompose(position, quaternion, scale);

        const baseScale = 0.01;
        const maxScale = initialGrassScales[i]; // Use stored random max scale
        const currentScaleY = baseScale + (maxScale - baseScale) * growthFactor;

        scale.set(1, currentScaleY, 1);
        matrix.compose(position, quaternion, scale);
        grass.setMatrixAt(i, matrix);
    }
    grass.instanceMatrix.needsUpdate = true;
}

function updatePlayer(deltaTime) {
    const speed = 40.0;
    const damping = 8.0;

    // Apply damping
    velocity.x -= velocity.x * damping * deltaTime;
    velocity.z -= velocity.z * damping * deltaTime;

    direction.z = Number(moveState.forward) - Number(moveState.backward);
    direction.x = Number(moveState.right) - Number(moveState.left);
    direction.normalize(); // this ensures consistent speed in all directions

    const isMoving = moveState.forward || moveState.backward || moveState.left || moveState.right;

    // Apply acceleration
    if (moveState.forward || moveState.backward) velocity.z -= direction.z * speed * deltaTime;
    if (moveState.left || moveState.right) velocity.x -= direction.x * speed * deltaTime;
    
    controls.moveRight(-velocity.x * deltaTime);
    controls.moveForward(-velocity.z * deltaTime);
    
    const playerPos = controls.getObject().position;

    // Ground collision and bobbing
    const baseCameraHeight = 1.7;
    const groundY = getTerrainHeight(playerPos.x, playerPos.z);
    let finalY = groundY + baseCameraHeight;

    if (isMoving) {
        bobbingTime += deltaTime;
        const bobbingSpeed = 8;
        const bobbingAmount = 0.05;
        const bobbingOffset = Math.sin(bobbingTime * bobbingSpeed) * bobbingAmount;
        finalY += bobbingOffset;

        // Footstep sounds
        const now = clock.getElapsedTime();
        if (now - lastFootstepTime > footstepInterval) {
            playSound(footstepSoundBuffer);
            lastFootstepTime = now;
        }
    } else {
        bobbingTime = 0;
    }
    playerPos.y = finalY;

    // Boundary collision
    const halfAreaX = areaSize.x / 2 - 0.5;
    const halfAreaZ = areaSize.z / 2 - 0.5;

    playerPos.x = Math.max(-halfAreaX, Math.min(halfAreaX, playerPos.x));
    playerPos.z = Math.max(-halfAreaZ, Math.min(halfAreaZ, playerPos.z));
}

function loadAchievements() {
    const saved = localStorage.getItem('grassGameAchievements');
    if (saved) {
        const savedAchievements = JSON.parse(saved);
        for (const id in achievements) {
            if (savedAchievements[id] && savedAchievements[id].unlocked) {
                achievements[id].unlocked = true;
            }
        }
    }
}

function saveAchievements() {
    localStorage.setItem('grassGameAchievements', JSON.stringify(achievements));
}

function unlockAchievement(id) {
    if (!achievements[id] || achievements[id].unlocked) return;
    
    achievements[id].unlocked = true;
    saveAchievements();
    showToast("Achievement Unlocked", achievements[id].name);
}

function showToast(title, text) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    
    const toastTitle = document.createElement('h4');
    toastTitle.textContent = title;
    
    const toastText = document.createElement('p');
    toastText.textContent = text;
    
    toast.appendChild(toastTitle);
    toast.appendChild(toastText);
    
    toastContainer.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Clear previous toast timeout if one exists
    clearTimeout(toastTimeout);

    // Animate out and remove
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, { once: true });
    }, 4000); // Display for 4 seconds
}

function startLoadingSequence() {
    // Simulate loading anti-cheat
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const antiCheatContainer = document.getElementById('anti-cheat-container');
    const ageRatingContainer = document.getElementById('age-rating-container');
    const studioLogoContainer = document.getElementById('studio-logo-container');
    const loadingScreen = document.getElementById('loading-screen');
    const blocker = document.getElementById('blocker');
    const startButton = document.getElementById('start-button');
    
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // Update loading text messages
            loadingText.textContent = 'Anti-Cheat Initialized';
            
            // Show the start button
            setTimeout(() => {
                startButton.style.display = 'block';
            }, 500);
        }
        
        // Update fake loading messages
        if (progress > 75) {
            loadingText.textContent = 'Validating game integrity...';
        } else if (progress > 50) {
            loadingText.textContent = 'Initializing anti-cheat drivers...';
        } else if (progress > 25) {
            loadingText.textContent = 'Scanning memory...';
        }
        
        loadingBar.style.width = `${progress}%`;
    }, 150);
    
    // Continue sequence after button press
    startButton.addEventListener('click', () => {
        // Play menu click sound if available
        if (menuClickBuffer) {
            playSound(menuClickBuffer);
        }
        
        // Abruptly hide anti-cheat container
        antiCheatContainer.style.display = 'none';
        
        // Show age ratings immediately
        ageRatingContainer.style.display = 'flex';
        
        // Fade in age ratings
        setTimeout(() => {
            ageRatingContainer.style.opacity = '1';
            
            // Start fading out age ratings after 3 seconds
            setTimeout(() => {
                ageRatingContainer.style.opacity = '0';
                
                // Wait for fade-out animation to complete before showing studio logo
                setTimeout(() => {
                    ageRatingContainer.style.display = 'none';
                    studioLogoContainer.style.display = 'block';
                    
                    // Fade in studio logo
                    setTimeout(() => {
                        studioLogoContainer.style.opacity = '1';
                        
                        // Fade out studio logo after 3 seconds
                        setTimeout(() => {
                            studioLogoContainer.style.opacity = '0';
                            
                            // Hide loading screen and show game menu
                            setTimeout(() => {
                                loadingScreen.style.display = 'none';
                                blocker.style.display = 'block';
                                
                                // Now entering main menu
                                gameState = 'menu';
                                if (audioContext && audioContext.state === 'running') {
                                    playMenuMusic();
                                }
                            }, 1000);
                        }, 3000);
                    }, 50);
                }, 1000); // Wait for fade-out animation to complete
            }, 3000);
        }, 50);
    });
}

init();
animate();