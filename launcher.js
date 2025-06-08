// Define your game codes and their game URLs
const gameCodes = {
  "CUBER": "https://coderha1.github.io/Hani-s-Game-Launcher/games/cube-clicker.html",
  "KREKO": "https://coderha1.github.io/Hani-s-Game-Launcher/games/3D-FPS-GAME.html",
   "GARSGOR": "https://coderha1.github.io/Hani-s-Game-Launcher/games/watching_grass_grow_by_Hani_Marji/index.html",
  // add more codes here if needed
};

function loadGame() {
  const codeInput = document.getElementById("codeInput");
  const message = document.getElementById("message");
  const gameFrame = document.getElementById("gameFrame");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  if (!codeInput || !message || !gameFrame) {
    console.error("Required elements missing: codeInput, message, or gameFrame");
    return;
  }

  const code = codeInput.value.trim().toUpperCase();
  const gameURL = gameCodes[code];

  if (gameURL) {
    message.style.color = "yellow";
    message.innerText = "Loading game...";
    gameFrame.src = gameURL;
    gameFrame.style.display = "block";
    fullscreenBtn.style.display = "inline-block"; // Show fullscreen button when game loaded
  } else {
    message.style.color = "red";
    message.innerText = "❌ Invalid game code!";
    gameFrame.style.display = "none";
    gameFrame.src = "";
    fullscreenBtn.style.display = "none"; // Hide fullscreen button if no game
  }
}

// Fullscreen toggle for iframe
function toggleFullscreen() {
  const gameFrame = document.getElementById("gameFrame");
  if (!gameFrame) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    if (gameFrame.requestFullscreen) {
      gameFrame.requestFullscreen();
    } else if (gameFrame.webkitRequestFullscreen) { /* Safari */
      gameFrame.webkitRequestFullscreen();
    } else if (gameFrame.msRequestFullscreen) { /* IE11 */
      gameFrame.msRequestFullscreen();
    }
  }
}
