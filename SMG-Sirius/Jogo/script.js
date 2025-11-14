const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Telas
const menu = document.getElementById("menu");
const difficultyScreen = document.getElementById("difficultyScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const rankingScreen = document.getElementById("rankingScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const welcomeMessage = document.getElementById("welcomeMessage");

// Botões
const startBtn = document.getElementById("startBtn");
const rankingBtn = document.getElementById("rankingBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const backToMenuFromRanking = document.getElementById("backToMenuFromRanking");
const backToMenuFromInstructions = document.getElementById("backToMenuFromInstructions");
const clearRankingBtn = document.getElementById("clearRankingBtn");

// Campos e listas
const playerNameInput = document.getElementById("playerNameInput");
const finalScore = document.getElementById("finalScore");
const rankingList = document.getElementById("rankingList");

// Estado
let playerName = "";
let difficulty = "medio";
let score = 0;
let isGameOver = false;
let lastPlayerName = localStorage.getItem("lastPlayerName") || "";

// Preenche nome salvo
if (lastPlayerName) playerNameInput.value = lastPlayerName;

// -------------------
// TELA DE DIFICULDADE
// -------------------
document.querySelectorAll(".diffBtn").forEach(btn => {
  btn.addEventListener("click", e => {
    difficulty = e.target.dataset.diff;
    difficultyScreen.classList.remove("active");
    startCountdown();
  });
});

// -------------------
// BOTÕES DO MENU
// -------------------
startBtn.addEventListener("click", () => {
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert("Digite seu nome antes de começar!");
    return;
  }
  localStorage.setItem("lastPlayerName", playerName);
  menu.classList.remove("active");
  difficultyScreen.classList.add("active");
});

rankingBtn.addEventListener("click", () => {
  menu.classList.remove("active");
  rankingScreen.classList.add("active");
  loadRanking();
});

instructionsBtn.addEventListener("click", () => {
  menu.classList.remove("active");
  instructionsScreen.classList.add("active");
});

backToMenuFromInstructions.addEventListener("click", () => {
  instructionsScreen.classList.remove("active");
  menu.classList.add("active");
});

backToMenuFromRanking.addEventListener("click", () => {
  rankingScreen.classList.remove("active");
  menu.classList.add("active");
});

clearRankingBtn.addEventListener("click", () => {
  localStorage.removeItem("ranking");
  loadRanking();
});

// -------------------
// GAME OVER
// -------------------
restartBtn.addEventListener("click", () => {
  gameOverScreen.classList.remove("active");
  startCountdown();
});

backToMenuBtn.addEventListener("click", () => {
  gameOverScreen.classList.remove("active");
  menu.classList.add("active");
});

// -------------------
// FUNÇÕES PRINCIPAIS
// -------------------
function startCountdown() {
  let messages = [`Boa sorte, ${playerName}!`, "3", "2", "1"];
  let i = 0;

  welcomeMessage.classList.remove("hidden");
  welcomeMessage.textContent = messages[i];

  const countdown = setInterval(() => {
    i++;
    if (i < messages.length) {
      welcomeMessage.textContent = messages[i];
    } else {
      clearInterval(countdown);
      welcomeMessage.classList.add("hidden");
      startGame();
    }
  }, 1000);
}

function startGame() {
  canvas.style.display = "block";
  score = 0;
  isGameOver = false;
  const speed = difficulty === "facil" ? 2 : difficulty === "medio" ? 4 : 6;

  const loop = setInterval(() => {
    if (isGameOver) {
      clearInterval(loop);
      endGame();
    } else {
      score++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Pontuação: ${score}`, 10, 30);

      // Exemplo de fim de jogo
      if (score >= 100 * speed) isGameOver = true;
    }
  }, 50);
}

function endGame() {
  canvas.style.display = "none";
  finalScore.textContent = `Sua pontuação: ${score}`;
  saveToRanking(playerName, score);
  gameOverScreen.classList.add("active");
}

// -------------------
// RANKING
// -------------------
function saveToRanking(name, points) {
  let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push({ name, points });
  ranking.sort((a, b) => b.points - a.points);
  ranking = ranking.slice(0, 10);
  localStorage.setItem("ranking", JSON.stringify(ranking));
}

function loadRanking() {
  let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  rankingList.innerHTML = "";
  ranking.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${p.name} - ${p.points}`;
    rankingList.appendChild(li);
  });
}

// Inicia menu
menu.classList.add("active");
