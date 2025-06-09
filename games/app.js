import * as THREE from "three";
import { PlayerControls } from "./controls.js";
import { createPlayerModel } from "./player.js";
import { createBarriers, createTrees, createCloudPigs } from "./worldGeneration.js";
import { createPigs, animatePigs, updatePigDialoguePositions, checkPigInteraction, pigTalk } from "./pigs.js";

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

async function main() {
  // Initialize WebsimSocket for multiplayer functionality
  const room = new WebsimSocket();
  await room.initialize();
  
  // Generate a random player name if not available
  const playerInfo = room.peers[room.clientId] || {};
  const playerName = playerInfo.username || `Player${Math.floor(Math.random() * 1000)}`;
  
  // Safe initial position values
  const playerX = (Math.random() * 10) - 5;
  const playerZ = (Math.random() * 10) - 5;

  // Setup Three.js scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Light sky blue background
  
  // Create barriers, trees, cloud pigs and platforms
  createBarriers(scene); // This now also creates the fountain pigs
  createTrees(scene);
  createCloudPigs(scene, THREE, MathRandom);
  
  // Create pigs (the 100 villagers)
  const pigs = createPigs(scene, THREE, MathRandom);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('game-container').appendChild(renderer.domElement);
  
  // Object to store other players
  const otherPlayers = {};
  const playerLabels = {};
  const chatMessages = {};
  
  // Create player model
  const playerModel = createPlayerModel(THREE, playerName);
  scene.add(playerModel);
  
  // Initialize player controls
  const playerControls = new PlayerControls(scene, room, {
    renderer: renderer,
    initialPosition: {
      x: playerX,
      y: 0.5,
      z: playerZ
    },
    playerModel: playerModel
  });
  const camera = playerControls.getCamera();
  
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increased ambient light for village
  scene.add(ambientLight);
  
  // Directional light (sun)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  scene.add(dirLight);
  
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(150, 150);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7CFC00, // Brighter green for village grass
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper for better spatial awareness
  const gridHelper = new THREE.GridHelper(150, 150);
  scene.add(gridHelper);
  
  // Create DOM element for player name label
  function createPlayerLabel(playerId, username) {
    const label = document.createElement('div');
    label.className = 'player-name';
    label.textContent = username;
    document.getElementById('game-container').appendChild(label);
    return label;
  }
  
  // Create DOM element for chat message
  function createChatMessage(playerId) {
    const message = document.createElement('div');
    message.className = 'chat-message';
    message.style.display = 'none';
    document.getElementById('game-container').appendChild(message);
    return message;
  }
  
  // Create chat input container
  const chatInputContainer = document.createElement('div');
  chatInputContainer.id = 'chat-input-container';
  const chatInput = document.createElement('input');
  chatInput.id = 'chat-input';
  chatInput.type = 'text';
  chatInput.maxLength = 100;
  chatInput.placeholder = 'Type a message...';
  chatInputContainer.appendChild(chatInput);
  
  // Add close button for chat input
  const closeChat = document.createElement('div');
  closeChat.id = 'close-chat';
  closeChat.innerHTML = '✕';
  chatInputContainer.appendChild(closeChat);
  
  document.getElementById('game-container').appendChild(chatInputContainer);
  
  // Create chat button for all devices
  const chatButton = document.createElement('div');
  chatButton.id = 'chat-button';
  chatButton.innerText = 'CHAT';
  document.getElementById('game-container').appendChild(chatButton);
  
  // Chat event listeners
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && chatInputContainer.style.display !== 'block') {
      e.preventDefault();
      openChatInput();
    } else if (e.key === 'Escape' && chatInputContainer.style.display === 'block') {
      closeChatInput();
    } else if (e.key === 'Enter' && chatInputContainer.style.display === 'block') {
      sendChatMessage();
    }
  });
  
  closeChat.addEventListener('click', () => {
    closeChatInput();
  });
  
  chatButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (chatInputContainer.style.display === 'block') {
      closeChatInput();
    } else {
      openChatInput();
    }
  });
  
  function openChatInput() {
    chatInputContainer.style.display = 'block';
    chatInput.focus();
    
    // Disable player controls while chatting
    if (playerControls) {
      playerControls.enabled = false;
    }
  }
  
  function closeChatInput() {
    chatInputContainer.style.display = 'none';
    chatInput.value = '';
    
    // Re-enable player controls
    if (playerControls) {
      playerControls.enabled = true;
    }
  }
  
  function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message) {
      // Send chat message to all players
      room.updatePresence({
        chat: {
          message: message,
          timestamp: Date.now()
        }
      });
      
      // Show message for local player too
      chatMessages[room.clientId].textContent = message;
      chatMessages[room.clientId].style.display = 'block';
      
      // Hide message after 5 seconds
      setTimeout(() => {
        if (chatMessages[room.clientId]) {
          chatMessages[room.clientId].style.display = 'none';
        }
      }, 5000);
      
      // Clear and close input
      chatInput.value = '';
      closeChatInput();
    }
  }
  
  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation(); // Prevent movement keys from triggering while typing
    if (e.key === 'Enter') {
      sendChatMessage();
    } else if (e.key === 'Escape') {
      closeChatInput();
    }
  });
  
  // Subscribe to presence updates - handle player joining/leaving and position updates
  room.subscribePresence((presence) => {
    for (const clientId in presence) {
      if (clientId === room.clientId) continue; // Skip self
      
      const playerData = presence[clientId];
      if (!playerData) continue;
      
      // Create new player if needed
      if (!otherPlayers[clientId] && playerData.x !== undefined && playerData.z !== undefined) {
        const peerInfo = room.peers[clientId] || {};
        const peerName = peerInfo.username || `Player${clientId.substring(0, 4)}`;
        
        const playerModel = createPlayerModel(THREE, peerName);
        playerModel.position.set(playerData.x, playerData.y || 0.5, playerData.z);
        if (playerData.rotation !== undefined) {
          playerModel.rotation.y = playerData.rotation;
        }
        scene.add(playerModel);
        otherPlayers[clientId] = playerModel;
        
        // Create name label
        playerLabels[clientId] = createPlayerLabel(clientId, peerName);
        
        // Create chat message element
        chatMessages[clientId] = createChatMessage(clientId);
      }
      
      // Update existing player
      else if (otherPlayers[clientId] && playerData.x !== undefined && playerData.z !== undefined) {
        otherPlayers[clientId].position.set(playerData.x, playerData.y || 0, playerData.z);
        if (playerData.rotation !== undefined) {
          otherPlayers[clientId].rotation.y = playerData.rotation;
        }
        
        // Animate legs if moving
        if (playerData.moving) {
          const leftLeg = otherPlayers[clientId].getObjectByName("leftLeg");
          const rightLeg = otherPlayers[clientId].getObjectByName("rightLeg");
          
          if (leftLeg && rightLeg) {
            const walkSpeed = 5;
            const walkAmplitude = 0.3;
            const animationPhase = performance.now() * 0.01 * walkSpeed; // Use performance.now() for consistent timing
            leftLeg.rotation.x = Math.sin(animationPhase) * walkAmplitude;
            rightLeg.rotation.x = Math.sin(animationPhase + Math.PI) * walkAmplitude;
          }
        } else {
          // Reset legs when standing still
          const leftLeg = otherPlayers[clientId].getObjectByName("leftLeg");
          const rightLeg = otherPlayers[clientId].getObjectByName("rightLeg");
          
          if (leftLeg && rightLeg) {
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;
          }
        }
        
        // Update chat message if present
        if (playerData.chat && playerData.chat.message) {
          chatMessages[clientId].textContent = playerData.chat.message;
          chatMessages[clientId].style.display = 'block';
          
          // Hide message after 5 seconds
          setTimeout(() => {
            if (chatMessages[clientId]) {
              chatMessages[clientId].style.display = 'none';
            }
          }, 5000);
        }
      }
    }
    
    // Remove disconnected players
    for (const clientId in otherPlayers) {
      if (!presence[clientId]) {
        scene.remove(otherPlayers[clientId]);
        delete otherPlayers[clientId];
        
        if (playerLabels[clientId]) {
          document.getElementById('game-container').removeChild(playerLabels[clientId]);
          delete playerLabels[clientId];
        }
        
        if (chatMessages[clientId]) {
          document.getElementById('game-container').removeChild(chatMessages[clientId]);
          delete chatMessages[clientId];
        }
      }
    }
  });

  // Create a chat message element for local player
  chatMessages[room.clientId] = createChatMessage(room.clientId);

  // Add keyboard listener for pig interaction
  let nearestPig = null;
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && nearestPig) {
      pigTalk(nearestPig);
    }
  });

  // Animation loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    
    playerControls.update();
    
    // Animate village pigs
    animatePigs(pigs, deltaTime);
    
    // Animate fountain pigs
    updateFountainPigs(deltaTime);
    
    // Check for pig interaction
    if (playerModel) {
      nearestPig = checkPigInteraction(pigs, playerModel.position, camera);
    }
    
    // Update pig dialogue positions
    updatePigDialoguePositions(pigs, camera, renderer);
    
    // Update name labels and chat messages for all players
    for (const clientId in otherPlayers) {
      if (playerLabels[clientId] && otherPlayers[clientId]) {
        const screenPosition = getScreenPosition(otherPlayers[clientId].position, camera, renderer);
        if (screenPosition) {
          playerLabels[clientId].style.left = `${screenPosition.x}px`;
          playerLabels[clientId].style.top = `${screenPosition.y - 20}px`;
          playerLabels[clientId].style.display = screenPosition.visible ? 'block' : 'none';
          
          // Position chat message above name label
          if (chatMessages[clientId]) {
            chatMessages[clientId].style.left = `${screenPosition.x}px`;
            chatMessages[clientId].style.top = `${screenPosition.y - 45}px`;
            // Only show if visible and has content
            if (chatMessages[clientId].textContent && screenPosition.visible) {
              chatMessages[clientId].style.display = 'block';
            }
          }
        } else {
          playerLabels[clientId].style.display = 'none';
          if (chatMessages[clientId]) {
            chatMessages[clientId].style.display = 'none';
          }
        }
      }
    }
    
    // Update local player's chat message position
    if (chatMessages[room.clientId] && playerModel) {
      const screenPosition = getScreenPosition(playerModel.position, camera, renderer);
      if (screenPosition && chatMessages[room.clientId].textContent) {
        chatMessages[room.clientId].style.left = `${screenPosition.x}px`;
        chatMessages[room.clientId].style.top = `${screenPosition.y - 45}px`;
        chatMessages[room.clientId].style.display = screenPosition.visible ? 'block' : 'none';
      } else {
        chatMessages[room.clientId].style.display = 'none';
      }
    }
    
    renderer.render(scene, camera);
  }
  
  // Helper function to convert 3D position to screen coordinates (kept consistent for players/fountain pigs)
  function getScreenPosition(position, camera, renderer) {
    const vector = new THREE.Vector3();
    const widthHalf = renderer.domElement.width / 2;
    const heightHalf = renderer.domElement.height / 2;
    
    // Get the position adjusted to account for object height (adjust for pigs)
    vector.copy(position);
    if (vector.userData && vector.userData.isFountainPig) {
        vector.y += 0.5; // Adjust height for smaller fountain pigs
    } else {
        vector.y += 1.5; // Adjust height for regular players/pigs
    }
    
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

  // Function to update fountain pigs
  function updateFountainPigs(deltaTime) {
    const fountainBaseY = 1.7; // Y position of the water surface in the well
    const maxBounceHeight = fountainBaseY + 2.0; // Max height pigs bounce to
    const gravity = 0.005; // Weaker gravity for lighter pigs?

    scene.children.forEach(child => {
      if (child.userData.isFountainPig) {
        const pig = child;
        const velocity = pig.userData.velocity;
        const startTime = pig.userData.startTime;

        // Track elapsed time for each pig
        pig.userData.elapsedTime = (pig.userData.elapsedTime || 0) + deltaTime;
        const time = pig.userData.elapsedTime;


        // Only animate after their staggered start time
        if (time >= startTime) {
             // Update position based on velocity
            pig.position.x += velocity.x;
            pig.position.y += velocity.y;
            pig.position.z += velocity.z;

            // Apply gravity
            velocity.y -= gravity;

            // Bounce/Reset particle if it falls below fountain base or reaches maximum height
            // Check if pig's base is below the water surface or it went too high
            if (pig.position.y <= fountainBaseY || pig.position.y > maxBounceHeight) {
              // Reset position to fountain center with slight randomness
              const angle = Math.random() * Math.PI * 2;
              const radius = Math.random() * 0.5; // Reset within a small radius
              pig.position.set(
                Math.cos(angle) * radius,
                fountainBaseY + 0.1, // Reset just above water surface
                Math.sin(angle) * radius
              );

              // Reset velocity (upward force)
              velocity.x = (Math.random() - 0.5) * 0.08;
              velocity.y = 0.08 + Math.random() * 0.1; // Give it a new upward push
              velocity.z = (Math.random() - 0.5) * 0.08;

              // Reset elapsed time and assign a new staggered start time (optional, but could make flow more dynamic)
              // pig.userData.elapsedTime = 0;
              // pig.userData.startTime = Math.random() * 3.0;

            }
        } else {
            // Pigs not yet started, keep them at the base
             pig.position.set(0, fountainBaseY + 0.1, 0); // Ensure they start correctly positioned
             velocity.set(0,0,0); // Ensure they aren't moving before start time
        }
         // Rotate the pig randomly while it's airborne
        if (pig.userData.isFountainPig && time >= startTime) {
             pig.rotation.x += velocity.x * 5;
             pig.rotation.y += velocity.y * 5;
             pig.rotation.z += velocity.z * 5;
        }


      }
    });
  }

  animate();
}

main();