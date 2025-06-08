import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { loadAllSounds, playSound } from './sound.js';

// --- DOM ELEMENTS ---
const loadingScreen = document.getElementById('loading-screen');
const missionSelectScreen = document.getElementById('mission-select-screen');
const missionGrid = document.getElementById('mission-grid');
const gameContainer = document.getElementById('game-container');
const instructions = document.getElementById('instructions');
const missionTitle = document.getElementById('mission-title');
const hintBox = document.getElementById('hint-box');
const scopeOverlay = document.getElementById('scope-overlay');
const ammoCount = document.getElementById('ammo-count');
const resultOverlay = document.getElementById('mission-result-overlay');
const resultMessage = document.getElementById('mission-result-message');
const nextMissionButton = document.getElementById('next-mission-button');
const retryMissionButton = document.getElementById('retry-mission-button');
const mainMenuButton = document.getElementById('main-menu-button');

// --- GAME STATE ---
const TOTAL_MISSIONS = 30;
let scene, camera, renderer, controls, raycaster;
let characters = [];
let targetCharacter = null;
let isZoomed = false;
let gameState = {
    currentMission: 1,
    unlockedLevel: 1,
    isPaused: true,
    ammo: 5,
    isPanicMode: false,
    missionEnding: false,
};
const zoomLevels = { normal: 60, zoomed: 15 };
let targetFov = zoomLevels.normal;

// --- MISSION DEFINITIONS ---
const missions = [
    { id: 1, hint: "Target is wearing RED. Eliminate them.", setup: { npcCount: 4, targetColor: 0xff0000, otherColor: 0x0000ff } },
    { id: 2, hint: "The target is carrying a package.", setup: { npcCount: 5, targetColor: 0x00ff00, otherColor: 0xcccccc, targetCarriesBox: true } },
    { id: 3, hint: "The VIP in YELLOW must be protected. Take out the single hostile in PURPLE.", setup: { npcCount: 6, targetColor: 0x800080, otherColor: 0xffff00 } },
    { id: 4, hint: "Target is moving erratically. They are wearing GREEN.", setup: { npcCount: 8, targetColor: 0x00ff00, otherColor: 0xffa500, erratic: true } },
    { id: 5, hint: "Find the agent in a crowd of civilians. They wear CYAN.", setup: { npcCount: 15, targetColor: 0x00ffff, otherColor: 0x888888 } },
];

// --- INITIALIZATION ---
async function init() {
    loadProgress();
    await loadAllSounds();
    setupMissionSelect();

    loadingScreen.classList.add('hidden');
    missionSelectScreen.classList.remove('hidden');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, 300);

    // Camera
    camera = new THREE.PerspectiveCamera(zoomLevels.normal, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 50);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Controls
    controls = new PointerLockControls(camera, renderer.domElement);
    controls.addEventListener('lock', () => {
        instructions.classList.add('hidden');
        gameState.isPaused = false;
    });
    controls.addEventListener('unlock', () => {
        if (!resultOverlay.classList.contains('hidden') || gameState.missionEnding) return;
        instructions.classList.remove('hidden');
        gameState.isPaused = true;
        toggleZoom(false);
    });
    gameContainer.addEventListener('click', () => {
        if(gameState.isPaused && resultOverlay.classList.contains('hidden')) {
            renderer.domElement.requestPointerLock().catch(() => {
                // This can happen if the user presses ESC before the lock is acquired.
                // It's safe to ignore this error.
            });
        }
    });

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Environment
    createEnvironment();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousedown', onMouseDown, false);

    animate();
}

// --- GAME LOGIC ---
function startMission(missionId) {
    gameState.currentMission = missionId;
    const mission = missions.find(m => m.id === missionId) || missions[0];

    // Reset scene
    characters.forEach(c => scene.remove(c));
    characters = [];
    targetCharacter = null;

    // Reset state
    gameState.ammo = 5;
    gameState.isPanicMode = false;
    gameState.missionEnding = false;
    updateAmmoUI();

    // Setup characters
    const { npcCount, targetColor, otherColor, targetCarriesBox, erratic } = mission.setup;
    for (let i = 0; i < npcCount; i++) {
        const isTarget = i === 0;
        const color = isTarget ? targetColor : otherColor;
        const character = createCharacter({ color, carriesBox: isTarget && targetCarriesBox, erratic: isTarget && erratic });
        characters.push(character);
        scene.add(character);
        if (isTarget) {
            targetCharacter = character;
        }
    }

    // UI
    missionSelectScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    resultOverlay.classList.add('hidden');
    instructions.classList.remove('hidden');
    missionTitle.textContent = `Mission ${mission.id}`;
    hintBox.textContent = mission.hint;

    gameState.isPaused = true;
}

function endMission(isSuccess, failReason = '') {
    gameState.missionEnding = false;
    controls.unlock();
    gameState.isPaused = true;
    resultOverlay.classList.remove('hidden');
    ammoCount.classList.add('hidden');

    if (isSuccess) {
        playSound('success');
        resultMessage.textContent = 'Mission Passed';
        retryMissionButton.classList.add('hidden');
        nextMissionButton.classList.remove('hidden');
        if (gameState.currentMission >= TOTAL_MISSIONS) {
            nextMissionButton.classList.add('hidden');
        }
        if (gameState.currentMission === gameState.unlockedLevel) {
            gameState.unlockedLevel++;
            saveProgress();
        }
    } else {
        playSound('fail');
        resultMessage.textContent = failReason || 'Mission Failed';
        retryMissionButton.classList.remove('hidden');
        nextMissionButton.classList.add('hidden');
    }
}

function shoot() {
    if (gameState.isPaused || !controls.isLocked || gameState.missionEnding) return;
    
    if (gameState.ammo <= 0) return;

    playSound('gunshot');
    gameState.ammo--;
    updateAmmoUI();

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.intersectObjects(characters.map(c => c.collider), false);

    const hitObject = intersects.length > 0 ? intersects[0].object.parent : null;

    if (hitObject === targetCharacter) {
        endMission(true);
    } else {
        // Missed or hit a civilian
        gameState.missionEnding = true;
        toggleZoom(false); // Force unzoom
        controls.unlock(); // Player loses control
        triggerPanic();
        
        let failReason = "Target Lost";
        if (hitObject) { // Hit a civilian
            failReason = "Wrong Target!";
        } else if (gameState.ammo === 0) { // Missed with last bullet
            failReason = "Out of Ammo!";
        }
        
        // Fail after a short delay to show the panic
        setTimeout(() => endMission(false, failReason), 2500);
    }
}

function toggleZoom(forceState) {
    isZoomed = typeof forceState === 'boolean' ? forceState : !isZoomed;
    targetFov = isZoomed ? zoomLevels.zoomed : zoomLevels.normal;
    scopeOverlay.classList.toggle('hidden', !isZoomed);
    ammoCount.classList.toggle('hidden', isZoomed);
    if (isZoomed) {
        instructions.classList.add('hidden');
    }
}

function triggerPanic() {
    if (gameState.isPanicMode) return; // a single trigger is enough
    gameState.isPanicMode = true;
    hintBox.textContent = "They're getting away!";
    characters.forEach(c => {
        // Make them run faster
        c.userData.movement.speed *= 5;
    });
}

function updateAmmoUI() {
    ammoCount.classList.remove('hidden');
    ammoCount.textContent = `AMMO: ${gameState.ammo}`;
}

// --- SETUP & CREATION ---
function createEnvironment() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Buildings
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 50; i++) {
        const buildingMat = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        const building = new THREE.Mesh(boxGeo, buildingMat);
        building.position.set(
            (Math.random() - 0.5) * 400,
            (Math.random() * 20) + 5,
            (Math.random() - 0.5) * 400
        );
        building.scale.set(
            Math.random() * 15 + 5,
            Math.random() * 40 + 10,
            Math.random() * 15 + 5
        );
        building.castShadow = true;
        scene.add(building);
    }
}

function createCharacter(config) {
    const group = new THREE.Group();
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xffdbac })
    );
    head.position.y = 1.5;

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.3, 1.5, 16),
        new THREE.MeshLambertMaterial({ color: config.color })
    );
    body.position.y = 0.75;
    
    // Collider
    const colliderGeo = new THREE.CapsuleGeometry(0.6, 1.5);
    const colliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const collider = new THREE.Mesh(colliderGeo, colliderMat);
    collider.position.y = 1.25;

    group.add(head, body, collider);
    group.collider = collider; // easy access
    group.castShadow = true;

    if (config.carriesBox) {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        box.position.set(0, 0.8, 0.8);
        group.add(box);
    }

    // Movement
    group.position.set(
        (Math.random() - 0.5) * 150,
        0,
        (Math.random() - 0.5) * 150
    );
    group.userData.movement = {
        path: [new THREE.Vector3().copy(group.position), new THREE.Vector3((Math.random() - 0.5) * 150, 0, (Math.random() - 0.5) * 150)],
        targetPoint: 1,
        speed: config.erratic ? 0.08 : (Math.random() * 0.02 + 0.02)
    };
    
    return group;
}

function updateCharacter(character, delta) {
    if (gameState.isPaused && !gameState.isPanicMode) return;

    const { path, targetPoint, speed } = character.userData.movement;
    const targetPosition = path[targetPoint];
    
    const direction = new THREE.Vector3().subVectors(targetPosition, character.position);
    if (direction.lengthSq() > 1) {
        direction.normalize();
        character.position.add(direction.multiplyScalar(speed * (60 * delta)));
        character.lookAt(targetPosition);
    } else if (character.userData.movement.path.length < 2 || gameState.isPanicMode) {
        // Add new random point, more frequently if panicked
        character.userData.movement.path.push(new THREE.Vector3((Math.random() - 0.5) * 150, 0, (Math.random() - 0.5) * 150));
        character.userData.movement.targetPoint = character.userData.movement.path.length - 1;
        if (character.userData.movement.path.length > 5) {
            character.userData.movement.path.shift();
            character.userData.movement.targetPoint--;
        }
    } else {
        character.userData.movement.targetPoint = (targetPoint + 1) % path.length;
    }
}

function setupMissionSelect() {
    missionGrid.innerHTML = '';
    for (let i = 1; i <= TOTAL_MISSIONS; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('mission-button');
        if (i <= gameState.unlockedLevel) {
            button.classList.add('unlocked');
            button.onclick = () => startMission(i);
        } else {
            button.classList.add('locked');
            button.disabled = true;
        }
        missionGrid.appendChild(button);
    }
}

// --- PERSISTENCE ---
function saveProgress() {
    localStorage.setItem('sniper_game_progress', JSON.stringify(gameState.unlockedLevel));
}

function loadProgress() {
    const savedLevel = localStorage.getItem('sniper_game_progress');
    if (savedLevel) {
        gameState.unlockedLevel = Math.max(1, parseInt(JSON.parse(savedLevel)));
    }
}

// --- EVENT HANDLERS & ANIMATION LOOP ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    if (gameState.isPaused || !controls.isLocked || gameState.missionEnding) return;
    if (event.button === 0) { // Left click
        shoot();
    }
}

document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('mousedown', (event) => {
    if (controls.isLocked && event.button === 2) {
        toggleZoom(true);
    }
});
document.addEventListener('mouseup', (event) => {
    if (controls.isLocked && event.button === 2) {
        toggleZoom(false);
    }
});


const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Smooth zoom
    const fovChange = (targetFov - camera.fov) * 0.2;
    camera.fov += fovChange;
    camera.updateProjectionMatrix();

    // Update characters
    if (!gameState.isPaused || gameState.missionEnding) {
        characters.forEach(c => updateCharacter(c, delta));
    }

    renderer.render(scene, camera);
}

// --- BUTTON ACTIONS ---
nextMissionButton.onclick = () => {
    startMission(gameState.currentMission + 1);
};
retryMissionButton.onclick = () => {
    startMission(gameState.currentMission);
};
mainMenuButton.onclick = () => {
    resultOverlay.classList.add('hidden');
    gameContainer.classList.add('hidden');
    missionSelectScreen.classList.remove('hidden');
    setupMissionSelect();
};


// Start the game
init();