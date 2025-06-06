// Define your game codes and their game URLs
const gameCodes = {
  "CUBE123": "games/cube-clicker.html",
  // Add more game codes and URLs here
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
