import * as THREE from "three";
import { createPigModel } from "./pigs.js"; // Import createPigModel

// Simple seeded random number generator
class MathRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

export function createBarriers(scene) {
  // Use a deterministic random number generator based on a fixed seed
  const barrierSeed = 12345; // Fixed seed for deterministic generation
  let rng = new MathRandom(barrierSeed);
  
  // Create houses and village buildings instead of barriers
  createVillageHouses(scene, rng);
  
  // Add decorative pillars throughout the scene as lamp posts or signposts
  createVillageDecoration(scene, rng);
}

function createVillageHouses(scene, rng) {
  const houseCount = 15;
  
  // Materials for houses
  const wallMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xD9C3A9, roughness: 0.8, metalness: 0.1 }), // Beige
    new THREE.MeshStandardMaterial({ color: 0xE5DCC7, roughness: 0.8, metalness: 0.1 }), // Light beige
    new THREE.MeshStandardMaterial({ color: 0xC8B99E, roughness: 0.8, metalness: 0.1 })  // Tan
  ];
  
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 }); // Brown
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.2, metalness: 0.8 }); // Light blue
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8, metalness: 0.1 }); // Dark brown
  
  // Create houses in a circular village arrangement
  for (let i = 0; i < houseCount; i++) {
    // House group
    const house = new THREE.Group();
    
    // Determine house position in village circle
    const angle = (i / houseCount) * Math.PI * 2 + rng.random() * 0.5;
    const distance = 20 + rng.random() * 15;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // House dimensions with some variation
    const width = 4 + rng.random() * 2;
    const height = 3 + rng.random() * 1.5;
    const depth = 4 + rng.random() * 2;
    
    // Randomly select wall material
    const wallMaterial = wallMaterials[Math.floor(rng.random() * wallMaterials.length)];
    
    // Create house base
    const houseGeometry = new THREE.BoxGeometry(width, height, depth);
    const houseBase = new THREE.Mesh(houseGeometry, wallMaterial);
    houseBase.position.y = height / 2;
    houseBase.castShadow = true;
    houseBase.receiveShadow = true;
    house.add(houseBase);
    
    // Add a pitched roof
    const roofHeight = 1.5 + rng.random();
    const roofOverhang = 0.3;
    const roofGeometry = new THREE.ConeGeometry(
      Math.sqrt((width + roofOverhang*2)*(width + roofOverhang*2) + (depth + roofOverhang*2)*(depth + roofOverhang*2))/2, 
      roofHeight, 
      4
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height + roofHeight / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    
    // Add windows
    const windowSize = 0.8;
    const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
    
    // Front windows
    for (let w = 0; w < 2; w++) {
      const windowX = (width / 3) * (w === 0 ? -1 : 1);
      const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(windowX, height / 2 + 0.2, depth / 2 + 0.01);
      window1.castShadow = false;
      house.add(window1);
    }
    
    // Side windows
    for (let w = 0; w < 2; w++) {
      const windowZ = (depth / 3) * (w === 0 ? -1 : 1);
      const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(width / 2 + 0.01, height / 2 + 0.2, windowZ);
      window2.rotation.y = Math.PI / 2;
      window2.castShadow = false;
      house.add(window2);
    }
    
    // Add door
    const doorWidth = 1.2;
    const doorHeight = 2;
    const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, doorHeight / 2, depth / 2 + 0.01);
    door.castShadow = false;
    house.add(door);
    
    // Sometimes add a chimney
    if (rng.random() > 0.5) {
      const chimneyWidth = 0.6;
      const chimneyHeight = 1 + roofHeight;
      const chimneyGeometry = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyWidth);
      const chimney = new THREE.Mesh(chimneyGeometry, new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 1.0 }));
      chimney.position.set(width / 3, height + chimneyHeight / 2, depth / 3);
      house.add(chimney);
    }
    
    // Position the house
    house.position.set(x, 0, z);
    house.rotation.y = rng.random() * Math.PI * 2;
    
    // Add custom property for collision detection
    house.userData.isBarrier = true;
    
    scene.add(house);
  }
  
  // Create a central plaza or town square
  const plazaRadius = 8;
  const plazaGeometry = new THREE.CircleGeometry(plazaRadius, 32);
  const plazaMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xA9A9A9, // Dark gray for stone plaza
    roughness: 0.9,
    metalness: 0.1
  });
  const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.05; // Slightly above ground to prevent z-fighting
  plaza.receiveShadow = true;
  scene.add(plaza);
  
  // Add a central well or fountain
  const wellBaseGeometry = new THREE.CylinderGeometry(2, 2.2, 0.8, 16); // Increased base height
  const wellBase = new THREE.Mesh(wellBaseGeometry, new THREE.MeshStandardMaterial({ color: 0x808080 }));
  wellBase.position.y = 0.4; // Adjust position based on new height
  wellBase.castShadow = true;
  wellBase.receiveShadow = true;
  scene.add(wellBase);
  
  const wellWallGeometry = new THREE.CylinderGeometry(1.8, 1.8, 1.2, 16); // Increased wall height
  const wellWall = new THREE.Mesh(wellWallGeometry, new THREE.MeshStandardMaterial({ color: 0x696969 }));
  wellWall.position.y = 1.0; // Adjust position based on new height
  wellWall.castShadow = true;
  wellWall.receiveShadow = true;
  scene.add(wellWall);
  
  // Create water inside well
  const waterGeometry = new THREE.CircleGeometry(1.7, 16);
  const waterMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4B9CD3, 
    roughness: 0.2, 
    metalness: 0.8,
    transparent: true,
    opacity: 0.8
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 1.61; // Position water above the wall base
  scene.add(water);
  
  // Add fountain pigs (formerly particles)
  const fountainCenter = new THREE.Vector3(0, 1.7, 0); // Position above the water surface
  createFountainPigs(scene, fountainCenter); // Renamed function and passed fountainCenter
  
  // Create roads connecting houses to central plaza
  createVillageRoads(scene, rng);
}

function createVillageRoads(scene, rng) {
  // Create dirt paths connecting houses to the center
  const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xAF8F6A, // Dirt brown
    roughness: 0.9,
    metalness: 0.0
  });
  
  // Create 4 main roads extending from the center
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const roadLength = 25;
    const roadWidth = 3;
    
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    
    road.rotation.x = -Math.PI / 2;
    road.position.set(
      Math.cos(angle) * roadLength / 2,
      0.03, // Slightly above ground to prevent z-fighting
      Math.sin(angle) * roadLength / 2
    );
    road.rotation.y = angle + Math.PI / 2;
    road.receiveShadow = true;
    
    scene.add(road);
    
    // Add smaller branching paths
    const branchCount = 1 + Math.floor(rng.random() * 2);
    for (let j = 0; j < branchCount; j++) {
      const branchDistance = 10 + rng.random() * 15;
      const branchAngle = angle + (rng.random() * 0.5 - 0.25);
      const branchLength = 8 + rng.random() * 10;
      const branchWidth = 2;
      
      const branchGeometry = new THREE.PlaneGeometry(branchWidth, branchLength);
      const branch = new THREE.Mesh(branchGeometry, roadMaterial);
      
      branch.rotation.x = -Math.PI / 2;
      branch.position.set(
        Math.cos(branchAngle) * branchDistance,
        0.03,
        Math.sin(branchAngle) * branchDistance
      );
      branch.rotation.y = branchAngle + Math.PI / 2 + (rng.random() * 0.5 - 0.25);
      branch.receiveShadow = true;
      
      scene.add(branch);
    }
  }
}

function createVillageDecoration(scene, rng) {
  // Create lamp posts, benches, fences, etc.
  
  // Lamp posts
  const lampCount = 12;
  for (let i = 0; i < lampCount; i++) {
    const angle = (i / lampCount) * Math.PI * 2 + rng.random() * 0.2;
    const distance = 12 + rng.random() * 5;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // Lamp post group
    const lamp = new THREE.Group();
    
    // Post
    const postHeight = 3 + rng.random() * 1; // Varied height
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, postHeight, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = postHeight / 2;
    post.castShadow = true;
    lamp.add(post);
    
    // Lamp head
    const lampHeadGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.6, 8);
    const lampHeadMaterial = new THREE.MeshStandardMaterial({ color: 0x2F2F2F });
    const lampHead = new THREE.Mesh(lampHeadGeometry, lampHeadMaterial);
    lampHead.position.y = postHeight + 0.3;
    lampHead.castShadow = true;
    lamp.add(lampHead);
    
    // Light (emissive material)
    const lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFAA0,
      emissive: 0xFFFAA0,
      emissiveIntensity: 1
    });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = postHeight;
    lamp.add(light);
    
    // Add point light
    const pointLight = new THREE.PointLight(0xFFFFAA, 0.8, 8);
    pointLight.position.y = postHeight;
    lamp.add(pointLight);
    
    lamp.position.set(x, 0, z);
    lamp.userData.isBarrier = true;
    
    scene.add(lamp);
  }
  
  // Fences around some houses
  const fenceCount = 8;
  for (let i = 0; i < fenceCount; i++) {
    const angle = (i / fenceCount) * Math.PI * 2 + rng.random() * 0.5;
    const distance = 25 + rng.random() * 15;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // Create a fence enclosure
    const fenceWidth = 5 + rng.random() * 3;
    const fenceDepth = 5 + rng.random() * 3;
    const fenceHeight = 1;
    
    createFenceSection(scene, x - fenceWidth/2, x + fenceWidth/2, z - fenceDepth/2, z - fenceDepth/2, fenceHeight);
    createFenceSection(scene, x - fenceWidth/2, x + fenceWidth/2, z + fenceDepth/2, z + fenceDepth/2, fenceHeight);
    createFenceSection(scene, x - fenceWidth/2, x - fenceWidth/2, z - fenceDepth/2, z + fenceDepth/2, fenceHeight);
    createFenceSection(scene, x + fenceWidth/2, x + fenceWidth/2, z - fenceDepth/2, z + fenceDepth/2, fenceHeight);
  }
  
  // Add some garden plots
  const gardenCount = 6;
  for (let i = 0; i < gardenCount; i++) {
    const angle = (i / gardenCount) * Math.PI * 2 + rng.random() * 0.3;
    const distance = 22 + rng.random() * 18;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    const gardenWidth = 3 + rng.random() * 2;
    const gardenDepth = 3 + rng.random() * 2;
    
    // Garden soil
    const gardenGeometry = new THREE.BoxGeometry(gardenWidth, 0.2, gardenDepth);
    const gardenMaterial = new THREE.MeshStandardMaterial({ color: 0x592D1D });
    const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
    garden.position.set(x, 0.1, z);
    garden.receiveShadow = true;
    scene.add(garden);
    
    // Add plants
    const plantCount = 5 + Math.floor(rng.random() * 10);
    for (let p = 0; p < plantCount; p++) {
      const plantX = x + (rng.random() * gardenWidth - gardenWidth/2) * 0.8;
      const plantZ = z + (rng.random() * gardenDepth - gardenDepth/2) * 0.8;
      
      // Plant stem
      const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4);
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(plantX, 0.15, plantZ);
      scene.add(stem);
      
      // Plant leaves
      const leafGeometry = new THREE.SphereGeometry(0.1 + rng.random() * 0.1, 4, 4);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: rng.random() > 0.5 ? 0x228B22 : 0x32CD32, 
        roughness: 0.8 
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.scale.y = 0.5;
      leaf.position.set(plantX, 0.3, plantZ);
      scene.add(leaf);
    }
  }
}

function createFenceSection(scene, x1, x2, z1, z2, height) {
  const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  
  // Calculate length and position
  const length = Math.sqrt((x2-x1)*(x2-x1) + (z2-z1)*(z2-z1));
  const centerX = (x1 + x2) / 2;
  const centerZ = (z1 + z2) / 2;
  const angle = Math.atan2(z2 - z1, x2 - x1);
  
  // Create posts
  const postCount = Math.ceil(length) + 1;
  for (let i = 0; i < postCount; i++) {
    const ratio = i / (postCount - 1);
    const postX = x1 + (x2 - x1) * ratio;
    const postZ = z1 + (z2 - z1) * ratio;
    
    const postGeometry = new THREE.BoxGeometry(0.15, height * 1.3, 0.15);
    const post = new THREE.Mesh(postGeometry, fenceMaterial);
    post.position.set(postX, height * 0.65, postZ);
    post.castShadow = true;
    scene.add(post);
  }
  
  // Create horizontal beams
  const beamGeometry = new THREE.BoxGeometry(length, 0.1, 0.05);
  const upperBeam = new THREE.Mesh(beamGeometry, fenceMaterial);
  upperBeam.position.set(centerX, height * 0.9, centerZ);
  upperBeam.rotation.y = angle;
  upperBeam.castShadow = true;
  scene.add(upperBeam);
  
  const lowerBeam = new THREE.Mesh(beamGeometry, fenceMaterial);
  lowerBeam.position.set(centerX, height * 0.4, centerZ);
  lowerBeam.rotation.y = angle;
  lowerBeam.castShadow = true;
  scene.add(lowerBeam);
}

// Function to create pigs "fountaining" out of the well
function createFountainPigs(scene, position) {
  const pigCount = 50; // Use 50 pigs for the fountain
  const fountainPigs = [];
  const fountainPigSeed = 99999;
  const rng = new MathRandom(fountainPigSeed);

  for (let i = 0; i < pigCount; i++) {
    const pig = createPigModel(THREE); // Create a pig model
    pig.scale.set(0.25, 0.25, 0.25); // Make fountain pigs smaller

    // Initialize position slightly above the water surface
    const angle = rng.random() * Math.PI * 2;
    const radius = rng.random() * 0.5; // Start within a smaller radius
    pig.position.set(
      position.x + Math.cos(angle) * radius,
      position.y + rng.random() * 0.2, // Start just above water
      position.z + Math.sin(angle) * radius
    );

    // Initialize random upward velocity with slight outward spread
    pig.userData.velocity = new THREE.Vector3(
      (rng.random() - 0.5) * 0.08, // X velocity
      0.08 + rng.random() * 0.1,   // Y velocity (upward)
      (rng.random() - 0.5) * 0.08  // Z velocity
    );

    // Stagger start times to make it look like a continuous flow
    pig.userData.startTime = rng.random() * 3.0; // Stagger over 3 seconds
    pig.userData.elapsedTime = 0; // Track individual pig elapsed time

    pig.userData.isFountainPig = true; // Mark this as a fountain pig
    scene.add(pig);
    fountainPigs.push(pig);
  }
}

export function createTrees(scene) {
  // Use a deterministic random number generator for consistent tree placement
  const treeSeed = 54321; // Different seed than barriers
  let rng = new MathRandom(treeSeed);
  
  // Tree trunk materials (varying browns)
  const trunkMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.9, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8, metalness: 0.1 })
  ];
  
  // Tree leaves materials (varying greens)
  const leavesMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x006400, roughness: 0.7, metalness: 0.0 })
  ];
  
  // Create fewer trees, mostly around the village perimeter
  for (let i = 0; i < 20; i++) {  
    // Select random materials
    const trunkMaterial = trunkMaterials[Math.floor(rng.random() * trunkMaterials.length)];
    const leavesMaterial = leavesMaterials[Math.floor(rng.random() * leavesMaterials.length)];
    
    // Create tree group
    const tree = new THREE.Group();
    
    // Create tree trunk
    const trunkHeight = 5 + rng.random() * 7;
    const trunkRadius = 0.3 + rng.random() * 0.3;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius * 1.2, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Determine tree type (pine or broad-leaf)
    const isPine = rng.random() > 0.5;
    
    if (isPine) {
      // Pine tree (multiple cones stacked)
      const layers = 2 + Math.floor(rng.random() * 3);
      const baseRadius = trunkRadius * 6;
      const layerHeight = trunkHeight * 0.4;
      
      for (let j = 0; j < layers; j++) {
        const layerRadius = baseRadius * (1 - j * 0.2);
        const coneGeometry = new THREE.ConeGeometry(layerRadius, layerHeight, 8);
        const cone = new THREE.Mesh(coneGeometry, leavesMaterial);
        cone.position.y = trunkHeight * 0.5 + j * (layerHeight * 0.6);
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      }
    } else {
      // Broad-leaf tree
      const leafShape = rng.random() > 0.5 ? 'ellipsoid' : 'sphere';
      const leavesRadius = trunkRadius * (4 + rng.random() * 2);
      
      if (leafShape === 'ellipsoid') {
        // Create ellipsoid using scaled sphere
        const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 8, 8);
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = trunkHeight * 0.7;
        leaves.scale.set(1, 1.2 + rng.random() * 0.5, 1);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
      } else {
        // Create multiple spheres for a more natural canopy
        const sphereCount = 2 + Math.floor(rng.random() * 3);
        for (let j = 0; j < sphereCount; j++) {
          const sphereSize = leavesRadius * (0.7 + rng.random() * 0.5);
          const leavesGeometry = new THREE.SphereGeometry(sphereSize, 8, 8);
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.y = trunkHeight * 0.7;
          leaves.position.x = (rng.random() - 0.5) * trunkRadius * 2;
          leaves.position.z = (rng.random() - 0.5) * trunkRadius * 2;
          leaves.castShadow = true;
          leaves.receiveShadow = true;
          tree.add(leaves);
        }
      }
    }
    
    // Random position, avoiding center area and existing barriers
    const angle = rng.random() * Math.PI * 2;
    const distance = 35 + rng.random() * 25;  // Place trees further out to make space for village
    tree.position.x = Math.cos(angle) * distance;
    tree.position.z = Math.sin(angle) * distance;
    
    // Add some random rotation and scale variation
    tree.rotation.y = rng.random() * Math.PI * 2;
    const treeScale = 0.8 + rng.random() * 0.5;
    tree.scale.set(treeScale, treeScale, treeScale);
    
    // Add custom property for collision detection
    tree.userData.isTree = true;
    tree.userData.isBarrier = true;
    
    scene.add(tree);
  }
  
  // Add some fruit trees in the village
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + rng.random() * 0.5;
    const distance = 18 + rng.random() * 15;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // Create fruit tree
    const tree = new THREE.Group();
    
    // Trunk
    const trunkHeight = 3 + rng.random() * 2;
    const trunkRadius = 0.25 + rng.random() * 0.15;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius * 1.2, trunkHeight, 8);
    const trunkMaterial = trunkMaterials[Math.floor(rng.random() * trunkMaterials.length)];
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Leaves
    const leavesRadius = 1.5 + rng.random() * 0.5;
    const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 8, 8);
    const leavesMaterial = leavesMaterials[Math.floor(rng.random() * leavesMaterials.length)];
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = trunkHeight + 0.3;
    leaves.castShadow = true;
    tree.add(leaves);
    
    // Add fruits (apples, oranges, etc.)
    const fruitCount = 4 + Math.floor(rng.random() * 8);
    const fruitColors = [0xFF0000, 0xFF8C00, 0xFFFF00]; // Red, orange, yellow
    const fruitColor = fruitColors[Math.floor(rng.random() * fruitColors.length)];
    const fruitMaterial = new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.8 });
    
    for (let j = 0; j < fruitCount; j++) {
      const fruitSize = 0.15 + rng.random() * 0.1;
      const fruitGeometry = new THREE.SphereGeometry(fruitSize, 8, 8);
      const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
      
      // Position fruit randomly within the foliage
      const fruitAngle = rng.random() * Math.PI * 2;
      const fruitRadius = (leavesRadius - 0.3) * rng.random();
      fruit.position.x = Math.cos(fruitAngle) * fruitRadius;
      fruit.position.z = Math.sin(fruitAngle) * fruitRadius;
      fruit.position.y = trunkHeight + 0.3 + (rng.random() * leavesRadius * 1.6 - leavesRadius * 0.8);
      
      tree.add(fruit);
    }
    
    tree.position.set(x, 0, z);
    tree.userData.isTree = true;
    tree.userData.isBarrier = true;
    
    scene.add(tree);
  }
}

export function createCloudPigs(scene, THREE, MathRandom) {
  const cloudPigSeed = 67890; // Same seed as old clouds
  let rng = new MathRandom(cloudPigSeed);
  
  // White, semi-transparent material for cloud pigs
  const cloudPigMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Pure white
    opacity: 0.95, // Slightly increased opacity
    transparent: true,
    roughness: 0.9, // Increased roughness
    metalness: 0.0,
    emissive: 0xcccccc, // Add slight emissive color
    emissiveIntensity: 0.2 // Subtle emission
  });
  
  // Create pig models instead of sphere puffs
  for (let i = 0; i < 20; i++) {
    const pig = createPigModel(THREE); // Create a pig model

    // Set the cloud material to the pig's meshes (except eyes/nostrils)
    pig.traverse((child) => {
      if (child.isMesh && child.material && child.name !== 'leftEye' && child.name !== 'rightEye' && child.name !== 'leftNostril' && child.name !== 'rightNostril') {
         // Clone the material to avoid affecting other pigs
        const newMaterial = cloudPigMaterial.clone();
        child.material = newMaterial;
      }
    });

    // Random scale for each cloud pig (slightly larger than fountain pigs)
    const pigScale = 0.8 + rng.random() * 0.4; // Scale between 0.8 and 1.2
    pig.scale.set(pigScale, pigScale, pigScale);
    
    // Position the pig high up like a cloud
    const angle = rng.random() * Math.PI * 2;
    const distance = 20 + rng.random() * 60;
    pig.position.x = Math.cos(angle) * distance;
    pig.position.z = Math.sin(angle) * distance;
    pig.position.y = 20 + rng.random() * 15; // High in the sky
    
    // Random rotation
    pig.rotation.y = rng.random() * Math.PI * 2;
    
    // Add to scene
    scene.add(pig);
  }
}