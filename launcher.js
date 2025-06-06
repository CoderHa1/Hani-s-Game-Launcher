// Define your game codes and their game URLs
const gameCodes = {
  "CUBER": "https://coderha1.github.io/Hani-s-Game-Launcher/games/cube-clicker.html",
  "KREKO": "https://coderha1.github.io/Hani-s-Game-Launcher/games/3D-FPS-GAME.html",
};
function loadGame() {
  const codeInput = document.getElementById("codeInput");
  const message = document.getElementById("message");
  const gameFrame = document.getElementById("gameFrame");

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
  } else {
    message.style.color = "red";
    message.innerText = "❌ Invalid game code!";
    gameFrame.style.display = "none";
    gameFrame.src = "";
  }
}
