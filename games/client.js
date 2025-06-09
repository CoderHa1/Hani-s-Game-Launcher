import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import io from 'socket.io-client';

const socket = io();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Player model creation
function createPlayerModel(color = 0xff0000) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color }));
  body.position.y = 1;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xffff00 }));
  head.position.y = 2.2;
  group.add(head);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
  leftLeg.position.set(-0.25, 0.5, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
  rightLeg.position.set(0.25, 0.5, 0);
  group.add(rightLeg);

  group.userData = {
    body,
    head,
    leftLeg,
    rightLeg,
    isWalking: false,
  };

  return group;
}

// Players
const players = {};
const playerLabels = {};

const localPlayer = createPlayerModel(0xff0000);
scene.add(localPlayer);
players[socket.id] = localPlayer;

function updatePlayerPosition(id, data) {
  const player = players[id];
  if (!player) return;
  player.position.set(data.x, data.y, data.z);
  player.rotation.y = data.rotationY;

  player.userData.isWalking = data.isWalking;
}

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('playerData', (playersData) => {
  for (const id in playersData) {
    if (id === socket.id) continue;
    if (!players[id]) {
      const newPlayer = createPlayerModel(0x00ff00);
      scene.add(newPlayer);
      players[id] = newPlayer;
    }
    updatePlayerPosition(id, playersData[id]);
  }
});

socket.on('playerDisconnected', (id) => {
  if (players[id]) {
    scene.remove(players[id]);
    delete players[id];
  }
});

// Movement logic
const keysPressed = {};
window.addEventListener('keydown', (e) => keysPressed[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keysPressed[e.key.toLowerCase()] = false);

function handleMovement(delta) {
  const speed = 5;
  const moveDistance = speed * delta;

  let moved = false;
  const dir = new THREE.Vector3();

  if (keysPressed['w']) {
    dir.z -= 1;
    moved = true;
  }
  if (keysPressed['s']) {
    dir.z += 1;
    moved = true;
  }
  if (keysPressed['a']) {
    dir.x -= 1;
    moved = true;
  }
  if (keysPressed['d']) {
    dir.x += 1;
    moved = true;
  }

  dir.normalize();
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
  localPlayer.position.addScaledVector(dir, moveDistance);

  if (dir.length() > 0) {
    localPlayer.rotation.y = Math.atan2(dir.x, dir.z);
  }

  localPlayer.userData.isWalking = moved;

  socket.emit('move', {
    x: localPlayer.position.x,
    y: localPlayer.position.y,
    z: localPlayer.position.z,
    rotationY: localPlayer.rotation.y,
    isWalking: moved,
  });
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  handleMovement(delta);

  for (const id in players) {
    const player = players[id];
    const { leftLeg, rightLeg, isWalking } = player.userData;

    if (leftLeg && rightLeg) {
      const time = performance.now() / 1000;
      const amplitude = 0.4;
      const frequency = 5;

      if (isWalking) {
        leftLeg.rotation.x = Math.sin(time * frequency) * amplitude;
        rightLeg.rotation.x = Math.sin(time * frequency + Math.PI) * amplitude;
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
