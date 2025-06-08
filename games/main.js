import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- SCENE SETUP ---
let camera, scene, renderer, controls, css2dRenderer;
const clock = new THREE.Clock();
const enemies = [];
const sounds = {};

// --- GAME STATE ---
const player = {
    health: 100,
    maxHealth: 100,
    coins: 0,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    currentGunIndex: 0,
    guns: [],
};

const ability = {
    isActive: false,
    duration: 30, // seconds
    cooldown: 180, // seconds (3 minutes)
    lastUsedTime: 0
};

const GUNS = [
    { name: 'Pistol', damage: 15, fireRate: 0.5, ammo: 15, maxAmmo: 15, price: 0, owned: true, reloadTime: 1.5 },
    { name: 'Rifle', damage: 30, fireRate: 0.2, ammo: 30, maxAmmo: 30, price: 100, owned: false, reloadTime: 2.0 },
    { name: 'Shotgun', damage: 60, fireRate: 1.0, ammo: 8, maxAmmo: 8, price: 250, owned: false, reloadTime: 2.5 },
    { name: 'SMG', damage: 10, fireRate: 0.1, ammo: 50, maxAmmo: 50, price: 500, owned: false, reloadTime: 2.2 },
    { name: 'Sniper', damage: 150, fireRate: 1.5, ammo: 5, maxAmmo: 5, price: 750, owned: false, reloadTime: 3.0 }
];

let canShoot = true;
let isReloading = false;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isGameOver = false;

// --- HOUSE & HEAL ---
let houseGroup, doorPivot, medkitMesh;
let isDoorOpen = false;
let isHealUsed = false;
const houseBounds = new THREE.Box3();

// --- UI ELEMENTS ---
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const healthBarInner = document.getElementById('health-bar-inner');
const healthText = document.getElementById('health-text');
const ammoText = document.getElementById('ammo-text');
const coinsText = document.getElementById('coins-text');
const storeUI = document.getElementById('store');
const gunListUI = document.getElementById('gun-list');
const abilityContainer = document.getElementById('ability-container');
const abilityText = document.getElementById('ability-text');

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0); // Player height

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // CSS2D Renderer
    css2dRenderer = new CSS2DRenderer();
    css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    css2dRenderer.domElement.style.position = 'absolute';
    css2dRenderer.domElement.style.top = '0px';
    css2dRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(css2dRenderer.domElement);

    // Controls
    controls = new PointerLockControls(camera, document.body);
    blocker.addEventListener('click', () => {
        if (!isGameOver) controls.lock();
    });
    controls.addEventListener('lock', () => {
        blocker.style.display = 'none';
        if (storeUI.style.display === 'block') toggleStore(false);
        if (sounds.music && !sounds.music.isPlaying) sounds.music.play();
    });
    controls.addEventListener('unlock', () => {
        if (!isGameOver) {
            blocker.style.display = 'flex';
            if (storeUI.style.display !== 'block') {
                 instructions.style.display = 'block';
            }
        }
    });
    scene.add(controls.getObject());

    // Lighting
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(-10, 20, 10);
    scene.add(dirLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x669933 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create the house
    createHouse();

    // Player Guns
    player.guns = GUNS.filter(g => g.owned);

    // Event Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
    abilityContainer.addEventListener('click', activateAbility);

    // Load saved data
    const savedCoins = localStorage.getItem('playerCoins');
    if (savedCoins !== null) {
        player.coins = parseInt(savedCoins, 10);
    }

    // Ability setup
    ability.lastUsedTime = -ability.cooldown; // Ready to use at start

    // Initial UI Update
    updateHUD();
    populateStore();
    
    loadSounds();
    
    setInterval(spawnEnemy, 3000);
}

function createHouse() {
    houseGroup = new THREE.Group();
    scene.add(houseGroup);
    
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xac8e70 }); // Brownish wood
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x7a3e3e }); // Dark red
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 }); // Grey concrete
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x6e4a2e }); // Darker wood

    const houseX = 0, houseY = 0, houseZ = -25;
    const houseWidth = 15, houseDepth = 20, houseHeight = 6;
    const doorWidth = 3, doorHeight = 5;

    // Floor
    const floorGeo = new THREE.BoxGeometry(houseWidth, 0.5, houseDepth);
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.position.set(houseX, houseY, houseZ);
    houseGroup.add(floor);

    // Walls
    // Back Wall
    const backWallGeo = new THREE.BoxGeometry(houseWidth, houseHeight, 0.5);
    const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
    backWall.position.set(houseX, houseY + houseHeight / 2, houseZ - houseDepth / 2);
    houseGroup.add(backWall);

    // Front Wall (with doorway)
    const frontWallSideWidth = (houseWidth - doorWidth) / 2;
    const frontWallGeo = new THREE.BoxGeometry(frontWallSideWidth, houseHeight, 0.5);
    
    const frontWallLeft = new THREE.Mesh(frontWallGeo, wallMaterial);
    frontWallLeft.position.set(houseX - doorWidth / 2 - frontWallSideWidth / 2, houseY + houseHeight / 2, houseZ + houseDepth / 2);
    houseGroup.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(frontWallGeo, wallMaterial);
    frontWallRight.position.set(houseX + doorWidth / 2 + frontWallSideWidth / 2, houseY + houseHeight / 2, houseZ + houseDepth / 2);
    houseGroup.add(frontWallRight);

    // Lintel (above door)
    const lintelGeo = new THREE.BoxGeometry(doorWidth, houseHeight - doorHeight, 0.5);
    const lintel = new THREE.Mesh(lintelGeo, wallMaterial);
    lintel.position.set(houseX, houseY + doorHeight + (houseHeight - doorHeight) / 2, houseZ + houseDepth / 2);
    houseGroup.add(lintel);

    // Side Walls
    const sideWallGeo = new THREE.BoxGeometry(houseDepth, houseHeight, 0.5);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
    leftWall.position.set(houseX - houseWidth / 2, houseY + houseHeight / 2, houseZ);
    leftWall.rotation.y = Math.PI / 2;
    houseGroup.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial);
    rightWall.position.set(houseX + houseWidth / 2, houseY + houseHeight / 2, houseZ);
    rightWall.rotation.y = Math.PI / 2;
    houseGroup.add(rightWall);

    // Roof
    const roofGeo = new THREE.BoxGeometry(houseWidth, 0.5, houseDepth);
    const roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.set(houseX, houseY + houseHeight, houseZ);
    houseGroup.add(roof);

    // Door
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.2);
    const door = new THREE.Mesh(doorGeo, doorMaterial);
    door.position.x = doorWidth / 2; // offset from pivot
    
    doorPivot = new THREE.Group();
    doorPivot.position.set(houseX - doorWidth / 2, houseY + doorHeight / 2, houseZ + houseDepth / 2);
    doorPivot.add(door);
    houseGroup.add(doorPivot);

    // Medkit
    const medkitGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const medkitMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    medkitMesh = new THREE.Mesh(medkitGeo, medkitMat);
    medkitMesh.position.set(houseX + 5, houseY + 0.85, houseZ - 5);
    scene.add(medkitMesh); // Add to scene directly so it can be removed easily

    // Set safe bounds
    houseBounds.set(
        new THREE.Vector3(houseX - houseWidth / 2, houseY, houseZ - houseDepth / 2),
        new THREE.Vector3(houseX + houseWidth / 2, houseY + houseHeight, houseZ + houseDepth / 2)
    );
}

function loadSounds() {
    const audioLoader = new THREE.AudioLoader();
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const soundFiles = {
        shot: 'gun_shot.mp3',
        hit: 'enemy_hit.mp3',
        die: 'enemy_die.mp3',
        buy: 'buy_gun.mp3',
        music: 'background_music.mp3',
        reload: 'reload.mp3',
        powerup: 'powerup.mp3'
    };

    Object.keys(soundFiles).forEach(key => {
        audioLoader.load(soundFiles[key], (buffer) => {
            sounds[key] = new THREE.Audio(listener);
            sounds[key].setBuffer(buffer);
            if (key === 'music') {
                sounds[key].setLoop(true);
                sounds[key].setVolume(0.3);
            } else {
                sounds[key].setLoop(false);
                sounds[key].setVolume(0.5);
            }
        });
    });
}

function playSound(name) {
    if (sounds[name]) {
        if(sounds[name].isPlaying) sounds[name].stop();
        sounds[name].play();
    }
}

class Enemy {
    constructor() {
        const geometry = new THREE.BoxGeometry(2, 4, 2);
        const textureLoader = new THREE.TextureLoader();
        const material = new THREE.MeshLambertMaterial({ map: textureLoader.load('enemy.png') });
        this.mesh = new THREE.Mesh(geometry, material);

        const spawnRadius = 100;
        const angle = Math.random() * Math.PI * 2;
        this.mesh.position.set(
            Math.cos(angle) * spawnRadius,
            2,
            Math.sin(angle) * spawnRadius
        );
        
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 4 + Math.random() * 2; // a little variation
        this.damage = 10;
        this.attackCooldown = 1.5;
        this.lastAttackTime = 0;

        // Health Bar
        const healthBarDiv = document.createElement('div');
        healthBarDiv.className = 'enemy-health-bar-container';
        const healthBarInnerDiv = document.createElement('div');
        healthBarInnerDiv.className = 'enemy-health-bar';
        healthBarDiv.appendChild(healthBarInnerDiv);
        this.healthBar = new CSS2DObject(healthBarDiv);
        this.healthBar.position.set(0, 3, 0);
        this.mesh.add(this.healthBar);

        scene.add(this.mesh);
        enemies.push(this);
    }

    update(delta, time) {
        const playerPosition = controls.getObject().position;

        // Check if player is safe in the house
        if (houseBounds.containsPoint(playerPosition)) {
            // Player is inside, enemy should stop or do something else
            return; // For now, they just stop pursuing.
        }
        
        // Move towards player
        const direction = playerPosition.clone().sub(this.mesh.position).normalize();
        this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
        this.mesh.lookAt(playerPosition.x, 2, playerPosition.z);

        // Check for player collision and attack
        if (this.mesh.position.distanceTo(playerPosition) < 3 && time > this.lastAttackTime + this.attackCooldown) {
            this.lastAttackTime = time;
            this.attackPlayer();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        playSound('hit');
        const healthBar = this.healthBar.element.firstChild;
        healthBar.style.width = `${Math.max(0, (this.health / this.maxHealth) * 100)}%`;

        if (this.health <= 0) {
            this.die();
        }
    }

    attackPlayer() {
        if(isGameOver) return;
        player.health = Math.max(0, player.health - this.damage);
        updateHUD();
        if (player.health <= 0) {
            gameOver();
        }
    }
    
    die() {
        playSound('die');
        player.coins += 2;
        updateHUD();
        scene.remove(this.mesh);
        const index = enemies.indexOf(this);
        if (index > -1) {
            enemies.splice(index, 1);
        }
    }
}

function gameOver() {
    isGameOver = true;
    controls.unlock();
    blocker.style.display = 'flex';
    instructions.innerHTML = "<h1>GAME OVER</h1><p>Click to restart</p>";
    blocker.addEventListener('click', () => window.location.reload(), { once: true });
}

function spawnEnemy() {
    if(controls.isLocked && !isGameOver) {
        new Enemy();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    css2dRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (isGameOver) return;
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'KeyB': toggleStore(); break;
        case 'KeyR': reload(); break;
        case 'KeyF': activateAbility(); break;
        case 'KeyI': toggleDoor(); break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

function onMouseClick() {
    if (!controls.isLocked || !canShoot || isGameOver || isReloading) return;

    const currentGun = player.guns[player.currentGunIndex];
    if (currentGun.ammo <= 0) return;
    
    playSound('shot');
    canShoot = false;
    currentGun.ammo--;
    updateHUD();

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({x: 0, y: 0}, camera);
    const intersects = raycaster.intersectObjects(enemies.map(e => e.mesh));

    if (intersects.length > 0) {
        const enemyMesh = intersects[0].object;
        const enemy = enemies.find(e => e.mesh === enemyMesh);
        if (enemy) {
            enemy.takeDamage(currentGun.damage);
        }
    }

    let fireRate = currentGun.fireRate;
    if (ability.isActive) {
        fireRate *= 0.5; // 50% faster shooting (half the delay)
    }

    setTimeout(() => { canShoot = true; }, fireRate * 1000);
}

function reload() {
    if (isReloading || !controls.isLocked || isGameOver) return;

    const currentGun = player.guns[player.currentGunIndex];
    if (!currentGun || currentGun.ammo >= currentGun.maxAmmo) return;

    isReloading = true;
    playSound('reload');
    
    const gunName = currentGun.name;
    ammoText.textContent = `${gunName}: Reloading...`;

    setTimeout(() => {
        currentGun.ammo = currentGun.maxAmmo;
        isReloading = false;
        if (!isGameOver) {
             updateHUD();
        }
    }, currentGun.reloadTime * 1000);
}

function toggleStore(forceState) {
    const isVisible = storeUI.style.display === 'block';
    const show = forceState !== undefined ? forceState : !isVisible;

    if (show && !isGameOver) {
        storeUI.style.display = 'block';
        controls.unlock();
        populateStore();
    } else {
        storeUI.style.display = 'none';
        if (!controls.isLocked && !isGameOver) {
            controls.lock();
        }
    }
}

function populateStore() {
    gunListUI.innerHTML = '';
    GUNS.forEach((gun, index) => {
        if (index === 0) return; // Skip default pistol
        const gunDiv = document.createElement('div');
        gunDiv.className = 'gun-item';
        
        const isOwned = player.guns.some(g => g.name === gun.name);
        const canAfford = player.coins >= gun.price;
        
        gunDiv.innerHTML = `
            <div>
                <strong>${gun.name}</strong><br>
                <span>Dmg: ${gun.damage}, Rate: ${gun.fireRate}s, Ammo: ${gun.maxAmmo}</span><br>
                <span>Reload Time: ${gun.reloadTime}s</span>
            </div>
            <button id="buy-gun-${index}" ${isOwned || !canAfford ? 'disabled' : ''}>
                ${isOwned ? 'Owned' : `Buy (${gun.price} Coins)`}
            </button>
        `;
        gunListUI.appendChild(gunDiv);

        if (!isOwned) {
            document.getElementById(`buy-gun-${index}`).addEventListener('click', () => buyGun(index));
        }
    });
}

function buyGun(gunIndex) {
    const gun = GUNS[gunIndex];
    if (player.coins >= gun.price) {
        player.coins -= gun.price;
        gun.owned = true; // Mark as owned in the main list
        const newGunInstance = { ...gun }; // Create a copy for the player
        player.guns.push(newGunInstance);
        player.currentGunIndex = player.guns.length - 1; 
        playSound('buy');
        updateHUD();
        populateStore();
        toggleStore(false);
    } else {
        // Button should be disabled, but as a fallback
        console.log("Not enough coins. This should not be triggerable.");
    }
}

function useHeal() {
    if (isHealUsed) return;
    isHealUsed = true;

    player.health = player.maxHealth;
    updateHUD();
    playSound('powerup');
    
    if (medkitMesh) {
        scene.remove(medkitMesh);
        medkitMesh = null;
    }
}

function updateHUD() {
    // Player Health
    const healthPercentage = (player.health / player.maxHealth) * 100;
    healthBarInner.style.width = `${healthPercentage}%`;
    healthText.textContent = `${player.health}/${player.maxHealth}`;
    
    // Coins
    coinsText.textContent = player.coins;
    localStorage.setItem('playerCoins', player.coins.toString());
    
    // Ammo
    const currentGun = player.guns[player.currentGunIndex];
    if (currentGun) {
        ammoText.textContent = `${currentGun.name}: ${currentGun.ammo} / ${currentGun.maxAmmo}`;
    } else {
        ammoText.textContent = 'N/A';
    }
}

function activateAbility() {
    const time = clock.getElapsedTime();
    if (ability.isActive || time < ability.lastUsedTime + ability.cooldown) {
        return; // Not ready or already active
    }

    playSound('powerup');
    ability.isActive = true;
    ability.lastUsedTime = time;

    setTimeout(() => {
        ability.isActive = false;
    }, ability.duration * 1000);
}

function updateAbilityUI(time) {
    if (ability.isActive) {
        abilityContainer.className = 'active';
        const remaining = ability.duration - (time - ability.lastUsedTime);
        abilityText.textContent = `Active: ${Math.ceil(remaining)}s`;
    } else {
        const cooldownRemaining = ability.cooldown - (time - ability.lastUsedTime);
        if (cooldownRemaining > 0) {
            abilityContainer.className = '';
            abilityText.textContent = `CD: ${Math.ceil(cooldownRemaining)}s`;
        } else {
            abilityContainer.className = 'ready';
            abilityText.textContent = 'READY (F)';
        }
    }
}

function toggleDoor() {
    if (!doorPivot || !controls.isLocked) return;
    const playerPosition = controls.getObject().position;
    const doorPosition = new THREE.Vector3();
    doorPivot.getWorldPosition(doorPosition);

    if (playerPosition.distanceTo(doorPosition) < 6) {
        isDoorOpen = !isDoorOpen;
        doorPivot.rotation.y = isDoorOpen ? Math.PI / 2 : 0;
        // Could add a door sound here later
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (controls.isLocked === true) {
        player.velocity.x -= player.velocity.x * 10.0 * delta;
        player.velocity.z -= player.velocity.z * 10.0 * delta;
        
        player.direction.z = Number(moveForward) - Number(moveBackward);
        player.direction.x = Number(moveRight) - Number(moveLeft);
        player.direction.normalize();

        const speed = 200.0;
        if (moveForward || moveBackward) player.velocity.z -= player.direction.z * speed * delta;
        if (moveLeft || moveRight) player.velocity.x -= player.direction.x * speed * delta;
        
        controls.moveRight(-player.velocity.x * delta);
        controls.moveForward(-player.velocity.z * delta);

        // Check for heal pickup
        if (!isHealUsed && medkitMesh) {
            const playerPos = controls.getObject().position;
            if (playerPos.distanceTo(medkitMesh.position) < 1.5) {
                useHeal();
            }
        }
    }
    
    // Update enemies
    if(!isGameOver) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(delta, time);
        }
    }

    updateAbilityUI(time);

    renderer.render(scene, camera);
    css2dRenderer.render(scene, camera);
}