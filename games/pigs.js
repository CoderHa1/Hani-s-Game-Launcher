import * as THREE from 'three';

// Pig NPC phrases
const PIG_PHRASES = [
  "Oink! Nice day for a walk!",
  "Oink oink! Got any truffles?",
  "Hello there, human!",
  "My favorite color is mud brown.",
  "I've been here since the server started.",
  "Oink! Watch where you're stepping!",
  "Do you think I'm cute? Oink!",
  "I heard there are 99 other pigs just like me.",
  "Sometimes I dream of flying.",
  "Oink oink! I love this place!",
  "Have you met my friend Wilbur?",
  "They say pigs are very intelligent. Oink!",
  "I can't wait for the rain, I love mud!",
  "Oink! Would you like to hear a joke?",
  "I'm the fastest pig in the server, wanna race?",
  "I've been practicing my dancing. Watch this! *wiggles*",
  "Did you know pigs can't look up at the sky?",
  "I'm actually a vegetarian. Surprising, right?",
  "Oink! I've been looking for you!",
  "I think we've met in another world.",
  "Do you think there's life beyond this server?",
  "I was thinking of starting a pig band.",
  "My dream is to become a famous actor someday.",
  "Oink! I'm actually quite philosophical.",
  "What's your favorite food? Mine is everything!",
  "I've been working on my poetry. Want to hear some?",
  "They say I'm just an NPC, but I feel real.",
  "Oink! Ever wonder what's outside this world?",
  "I've counted every blade of grass here... twice!",
  "If I had thumbs, I'd give you a thumbs up!"
];

// Village-specific dialogue options
const villageDialogues = [
  "Oink! Welcome to our little village!",
  "Have you seen the well in the center of town? Best water around!",
  "The baker should be opening shop soon... if we had a baker.",
  "Watch out for the mayor! He's a bit... well, he's a pig too.",
  "My family has lived in this village for generations. All three days of it!",
  "We're planning a village festival soon. Mostly mud wrestling.",
  "The houses here are quite nice, don't you think?",
  "I've been trying to grow carrots in my garden, but I keep eating the seeds.",
  "Oink! Would you like to buy some property here? Real estate is booming!",
  "The lamp posts were my idea. Before that, we just bumped into each other at night.",
  "Have you met the other 99 pigs? We're a close-knit community.",
  "I'm thinking of opening a truffle shop. It's my passion.",
  "The village elders say a great warrior will visit us someday. Is that you?",
  "Oink! Be careful around the fences, they're decorative but sturdy.",
  "I heard someone's planning to build a school here. We pigs are very educated!"
];

// Add village dialogues to the original phrases
const allDialogues = [...PIG_PHRASES, ...villageDialogues];

// Create a pig NPC model
export function createPigModel(THREE) {
  const pigGroup = new THREE.Group();
  
  // Pig body (larger oval)
  const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 12);
  bodyGeometry.scale(1, 0.7, 1.3);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xF8C3CD, // Piggy pink
    roughness: 0.7,
    metalness: 0.1
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  body.castShadow = true;
  body.name = "body";
  pigGroup.add(body);
  
  // Pig head
  const headGeometry = new THREE.SphereGeometry(0.4, 16, 12);
  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.set(0, 0.7, 0.7);
  head.castShadow = true;
   head.name = "head";
  pigGroup.add(head);
  
  // Pig snout
  const snoutGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.25, 8);
  snoutGeometry.rotateX(Math.PI / 2);
  const snoutMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xF8C3CD, // Same as body but slightly darker
    roughness: 0.8,
    metalness: 0.1
  });
  const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
  snout.position.set(0, 0.6, 1.0);
  snout.castShadow = true;
   snout.name = "snout";
  pigGroup.add(snout);
  
  // Pig nostrils
  const nostrilGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const nostrilMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  
  const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
  leftNostril.position.set(-0.1, 0.6, 1.1);
   leftNostril.name = "leftNostril";
  pigGroup.add(leftNostril);
  
  const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
  rightNostril.position.set(0.1, 0.6, 1.1);
   rightNostril.name = "rightNostril";
  pigGroup.add(rightNostril);
  
  // Pig ears
  const earGeometry = new THREE.ConeGeometry(0.2, 0.3, 5);
  earGeometry.rotateX(-Math.PI / 4);
  
  const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
  leftEar.position.set(-0.25, 0.9, 0.5);
  leftEar.rotation.z = -Math.PI / 4;
   leftEar.name = "leftEar";
  pigGroup.add(leftEar);
  
  const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
  rightEar.position.set(0.25, 0.9, 0.5);
  rightEar.rotation.z = Math.PI / 4;
   rightEar.name = "rightEar";
  pigGroup.add(rightEar);
  
  // Pig eyes
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.2, 0.8, 0.85);
   leftEye.name = "leftEye";
  pigGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.2, 0.8, 0.85);
   rightEye.name = "rightEye";
  pigGroup.add(rightEye);
  
  // Pig legs
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.4);
  const legMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xF8C3CD, 
    roughness: 0.8,
    metalness: 0.1
  });
  
  const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
  frontLeftLeg.position.set(-0.3, 0.2, 0.5);
  frontLeftLeg.name = "frontLeftLeg";
  pigGroup.add(frontLeftLeg);
  
  const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
  frontRightLeg.position.set(0.3, 0.2, 0.5);
  frontRightLeg.name = "frontRightLeg";
  pigGroup.add(frontRightLeg);
  
  const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
  backLeftLeg.position.set(-0.3, 0.2, -0.5);
  backLeftLeg.name = "backLeftLeg";
  pigGroup.add(backLeftLeg);
  
  const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
  backRightLeg.position.set(0.3, 0.2, -0.5);
  backRightLeg.name = "backRightLeg";
  pigGroup.add(backRightLeg);
  
  // Small tail (curved cylinder)
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.1, -0.1),
    new THREE.Vector3(0, 0.2, 0)
  ]);
  
  const tailGeometry = new THREE.TubeGeometry(tailCurve, 8, 0.05, 8, false);
  const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
  tail.position.set(0, 0.6, -0.7);
   tail.name = "tail";
  pigGroup.add(tail);
  
  // Add the animation mixer
  pigGroup.mixer = new THREE.AnimationMixer(pigGroup);
  
  // Set scale of entire pig
  pigGroup.scale.set(0.8, 0.8, 0.8);
  
  return pigGroup;
}

// Function to place pigs around the world
export function createPigs(scene, THREE, MathRandom) {
  const pigs = [];
  const pigSeed = 98765; // Seed for pig placement
  const rng = new MathRandom(pigSeed);
  
  // Create 100 pigs
  for (let i = 0; i < 100; i++) {
    const pig = createPigModel(THREE);
    
    // Place pigs around the world with some randomness
    const angle = rng.random() * Math.PI * 2;
    const distance = 5 + rng.random() * 50;
    pig.position.x = Math.cos(angle) * distance;
    pig.position.z = Math.sin(angle) * distance;
    
    // Random rotation
    pig.rotation.y = rng.random() * Math.PI * 2;
    
    // Give each pig a unique ID
    pig.userData.id = `pig-${i}`;
    pig.userData.isPig = true;
    pig.userData.interactable = true;
    pig.userData.phrase = allDialogues[Math.floor(rng.random() * allDialogues.length)];
    
    // Create a dialogue element for the pig
    const dialogue = document.createElement('div');
    dialogue.className = 'npc-dialogue';
    dialogue.style.display = 'none';
    document.getElementById('game-container').appendChild(dialogue);
    
    // Create interaction prompt
    const prompt = document.createElement('div');
    prompt.className = 'interact-prompt';
    prompt.textContent = 'Press E to talk';
    prompt.style.display = 'none';
    document.getElementById('game-container').appendChild(prompt);
    
    // Store references
    pig.userData.dialogueElement = dialogue;
    pig.userData.promptElement = prompt;
    
    scene.add(pig);
    pigs.push(pig);
  }
  
  return pigs;
}

// Function to animate pigs
export function animatePigs(pigs, deltaTime) {
  pigs.forEach(pig => {
    // Animate legs for walking
    const frontLeftLeg = pig.getObjectByName("frontLeftLeg");
    const frontRightLeg = pig.getObjectByName("frontRightLeg");
    const backLeftLeg = pig.getObjectByName("backLeftLeg");
    const backRightLeg = pig.getObjectByName("backRightLeg");
    
    if (frontLeftLeg && frontRightLeg && backLeftLeg && backRightLeg) {
      // Only animate if pig is moving
      if (pig.userData.isMoving) {
        const walkSpeed = 3; // Slower walk speed for pigs
        const walkAmplitude = 0.2;
        const time = performance.now() * 0.001;
        
        frontLeftLeg.rotation.x = Math.sin(time * walkSpeed) * walkAmplitude;
        backRightLeg.rotation.x = Math.sin(time * walkSpeed) * walkAmplitude;
        frontRightLeg.rotation.x = Math.sin(time * walkSpeed + Math.PI) * walkAmplitude;
        backLeftLeg.rotation.x = Math.sin(time * walkSpeed + Math.PI) * walkAmplitude;
      } else {
        // Reset legs when standing
        frontLeftLeg.rotation.x = 0;
        frontRightLeg.rotation.x = 0;
        backLeftLeg.rotation.x = 0;
        backRightLeg.rotation.x = 0;
      }
    }
    
    // Update the animation mixer if it exists
    if (pig.mixer) {
      pig.mixer.update(deltaTime);
    }
  });
}

// Function to update pig dialogue positions
export function updatePigDialoguePositions(pigs, camera, renderer) {
  pigs.forEach(pig => {
    if (pig.userData.dialogueElement && pig.userData.promptElement) {
      const screenPosition = getScreenPosition(pig.position, camera, renderer);
      if (screenPosition) {
        // Position dialogue
        pig.userData.dialogueElement.style.left = `${screenPosition.x}px`;
        pig.userData.dialogueElement.style.top = `${screenPosition.y - 40}px`;
        
        // Position prompt
        pig.userData.promptElement.style.left = `${screenPosition.x}px`;
        pig.userData.promptElement.style.top = `${screenPosition.y - 10}px`;
        
        // Only show if visible and in range
        const distance = new THREE.Vector3().copy(camera.position)
          .sub(new THREE.Vector3(pig.position.x, camera.position.y, pig.position.z))
          .length();
        
        // Show prompt only when close enough and not already talking
        if (distance < 3 && screenPosition.visible && pig.userData.dialogueElement.style.display !== 'block') {
          pig.userData.promptElement.style.display = 'block';
        } else {
          pig.userData.promptElement.style.display = 'none';
        }
      } else {
        pig.userData.dialogueElement.style.display = 'none';
        pig.userData.promptElement.style.display = 'none';
      }
    }
  });
}

// Helper function to get screen position (kept consistent for players/fountain pigs)
// NOTE: This function is duplicated in app.js and pigs.js.
// A better approach would be to define it once in a utility file.
function getScreenPosition(position, camera, renderer) {
  const vector = new THREE.Vector3();
  const widthHalf = renderer.domElement.width / 2;
  const heightHalf = renderer.domElement.height / 2;
  
  // Get the position adjusted to account for object height (adjust for pigs)
  vector.copy(position);
  vector.y += 1.0; // Position above the pig's head
  
  // Project to screen space
  vector.project(camera);
  
  // Calculate whether object is in front of the camera
  const isInFront = vector.z < 1;
  
  // Convert to screen coordinates
  return {
    x: (vector.x * widthHalf) + widthHalf,
    y: -(vector.y * heightHalf) + heightHalf,
    visible: isInFront
  };
}

// Function to check if player is near any pig and handle interaction
export function checkPigInteraction(pigs, playerPosition, camera) {
  let nearestPig = null;
  let minDistance = 3; // Interaction range
  
  pigs.forEach(pig => {
    // Only check interactive pigs (excludes fountain pigs and cloud pigs)
    if (pig.userData.interactable) {
        const distance = new THREE.Vector3().copy(playerPosition)
          .sub(new THREE.Vector3(pig.position.x, playerPosition.y, pig.position.z))
          .length();
        
        if (distance < minDistance) {
          // Check if pig is in front of player
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          
          const toPig = new THREE.Vector3()
            .subVectors(pig.position, playerPosition)
            .normalize();
          toPig.y = 0;
          
          // Dot product to check if pig is in front of player
          const dot = forward.dot(toPig);
          
          if (dot > 0.5) { // Within about 60 degree cone in front of player
            nearestPig = pig;
            minDistance = distance;
          }
        }
    }
  });
  
  return nearestPig;
}

// Function to make a pig talk
export function pigTalk(pig) {
  if (!pig || !pig.userData || !pig.userData.dialogueElement) return;
  
  // Display dialogue - either the pig's assigned phrase or a random one
  if (Math.random() > 0.3) {
    pig.userData.dialogueElement.textContent = pig.userData.phrase;
  } else {
    // Sometimes give a random original dialogue instead of village-specific
    const randomIndex = Math.floor(Math.random() * PIG_PHRASES.length);
    pig.userData.dialogueElement.textContent = PIG_PHRASES[randomIndex];
  }
  
  pig.userData.dialogueElement.style.display = 'block';
  pig.userData.promptElement.style.display = 'none';
  
  // Hide dialogue after 5 seconds
  setTimeout(() => {
    if (pig.userData.dialogueElement) {
      pig.userData.dialogueElement.style.display = 'none';
    }
  }, 5000);
}