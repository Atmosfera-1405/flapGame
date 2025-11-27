<<<<<<< HEAD:javascript.js
// script.js - versão corrigida (suporte mouse/touch/pointer + autoplay tratado)

// Canvas e contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elementos UI
const menu = document.getElementById("menu");
const difficultyScreen = document.getElementById("difficultyScreen");
const welcomeMessage = document.getElementById("welcomeMessage");
const countdown = document.getElementById("countdown");
const gameOverScreen = document.getElementById("gameOverScreen");
const rankingScreen = document.getElementById("rankingScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const rankingList = document.getElementById("rankingList");

const playerNameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const rankingBtn = document.getElementById("rankingBtn");
const backToMenuFromRanking = document.getElementById("backToMenuFromRanking");
const clearRankingBtn = document.getElementById("clearRankingBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const backToMenuFromInstructions = document.getElementById("backToMenuFromInstructions");
const backToMenuFromDifficulty = document.getElementById("backToMenuFromDifficulty");

// Sons (coloque os arquivos na pasta Sons/)
const jumpSound = new Audio("Sons/Pulo.wav");
const menuSound = new Audio("Sons/Menu&Ranking.mp3");
const gameplaySound = new Audio("Sons/GamePlay.mp3");
const gameOverSound = new Audio("Sons/GameOver.mp3");
const pontoSound = new Audio("Sons/Ponto.mp3");

// Imagens
const roboPulo = new Image(); roboPulo.src = "Imagens/pulo.png";
const roboQueda = new Image(); roboQueda.src = "Imagens/queda.png";

const BIRD_SIZE = 20;

// Dificuldade
const pipeSpeedMap = { facil: 2, medio: 3, dificil: 4.3 };
let selectedDifficulty = "medio";

// Estado do jogo
let bird, pipes, score, gameInterval;
let frameCount = 0;
let ultimoEstadoPulo = false;
let tempoUltimoPulo = 0;
let playerName = "";
let gameRunning = false;
let userInteracted = false; // marca se o usuário já interagiu (para desbloquear áudio)

// Carrega último nome salvo no localStorage
const last = localStorage.getItem("flappyLastPlayer");
if (last) playerNameInput.value = last;

// Toca som com tratamento de promise (rejeição silenciosa)
function safePlay(sound, loop = false) {
  if (!sound) return;
  sound.loop = loop;
  // só tenta tocar se o usuário já interagiu (política de autoplay)
  if (!userInteracted) return;
  const p = sound.play();
  if (p && p.catch) p.catch(() => {});
}

// Não tente tocar sons automaticamente aqui.
// Ao invés disso, iremos habilitar o áudio após a primeira interação do usuário.

// Inicializa visibilidade das telas
function showMenu() {
  menu.style.display = "block";
  difficultyScreen.style.display = "none";
  welcomeMessage.style.display = "none";
  countdown.style.display = "none";
  canvas.style.display = "none";
  gameOverScreen.style.display = "none";
  rankingScreen.style.display = "none";
  instructionsScreen.style.display = "none";
}
showMenu();

// --- Detecta a primeira interação do usuário para desbloquear áudio ---
// Captura interações simples: click, pointerdown, keydown, touchstart.
function onFirstUserInteraction(e) {
  userInteracted = true;
  // tenta tocar som de menu (silencioso se falhar)
  try {
    menuSound.currentTime = 0;
    menuSound.play().catch(() => {});
  } catch (err) {}
  // remove esse listener (só precisa da primeira interação)
  window.removeEventListener("pointerdown", onFirstUserInteraction);
  window.removeEventListener("keydown", onFirstUserInteraction);
  window.removeEventListener("touchstart", onFirstUserInteraction);
}
window.addEventListener("pointerdown", onFirstUserInteraction);
window.addEventListener("keydown", onFirstUserInteraction);
window.addEventListener("touchstart", onFirstUserInteraction, { passive: true });

// -------------------- Fluxo: iniciar → dificuldade → contagem → jogo
startBtn.onclick = () => {
  const name = playerNameInput.value.trim();
  if (!name || name.length < 2) {
    alert("Digite um nome com pelo menos 2 caracteres!");
    return;
  }
  playerName = name;
  localStorage.setItem("flappyLastPlayer", playerName);
  menu.style.display = "none";
  difficultyScreen.style.display = "block";
};

backToMenuFromDifficulty.onclick = () => {
  difficultyScreen.style.display = "none";
  menu.style.display = "block";
};

document.querySelectorAll(".difficultyBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedDifficulty = btn.dataset.diff || "medio";
    difficultyScreen.style.display = "none";
    startCountdown();
  });
});

// Contagem regressiva
function startCountdown() {
  welcomeMessage.textContent = `Boa sorte, ${playerName}!`;
  welcomeMessage.style.display = "block";
  safePlay(menuSound, false);

  setTimeout(() => {
    welcomeMessage.style.display = "none";
    let n = 3;
    countdown.textContent = n;
    countdown.style.display = "block";

    const timer = setInterval(() => {
      n--;
      if (n >= 1) countdown.textContent = n;
      else if (n === 0) countdown.textContent = "GO!";
      else {
        clearInterval(timer);
        countdown.style.display = "none";
        startGame();
      }
    }, 1000);
  }, 1400);
}

// -------------------- Jogo --------------------
function startGame() {
  canvas.style.display = "block";
  gameRunning = true;
  bird = { x: 50, y: 150, width: BIRD_SIZE, height: BIRD_SIZE, gravity: 0.5, lift: -8, velocity: 0 };
  pipes = [];
  score = 0;
  frameCount = 0;

  // toca som de gameplay somente se o usuário já interagiu
  safePlay(gameplaySound, true);

  if (gameInterval) clearInterval(gameInterval);
  document.addEventListener("keydown", fly);
  // atualiza com intervalo
  gameInterval = setInterval(() => updateGame(pipeSpeedMap[selectedDifficulty]), 20);
}

// Função de pulo unificada
function doJump() {
  if (!gameRunning || !bird) return;
  bird.velocity = bird.lift;
  safePlay(jumpSound, false);
}

// Fly para teclado
function fly(e) {
  if (!e) return;
  if (e.code === "Space" || e.code === "ArrowUp") doJump();
}

// Função que responde a ponteiros (mouse/touch)
function onCanvasPointer(e) {
  // só pular se o jogo estiver rodando
  if (!gameRunning) return;
  // impedir comportamento padrão em alguns dispositivos (zoom/scroll)
  if (e.cancelable) e.preventDefault();
  doJump();
}

// Adiciona os listeners no canvas (pointer cobre mouse/touch/stylus)
canvas.addEventListener("pointerdown", onCanvasPointer, { passive: false });
/* fallbacks opcionais — não causam problemas:
canvas.addEventListener("touchstart", onCanvasPointer, { passive: false });
canvas.addEventListener("mousedown", onCanvasPointer);
*/

// Atualização do jogo
function updateGame(currentPipeSpeed) {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  frameCount++;
  if (frameCount % 90 === 0) {
    const topHeight = Math.random() * 200 + 50;
    pipes.push({ x: canvas.width, topHeight: topHeight, bottomY: topHeight + 120, width: 40, passed: false });
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= currentPipeSpeed;

    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
    ) {
      endGame();
      return;
    }

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
      safePlay(pontoSound, false);
    }

    if (pipe.x + pipe.width < 0) pipes.splice(i, 1);
  }

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
    return;
  }

  drawGame();
}

// Desenho
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bird.velocity < -2) {
    ultimoEstadoPulo = true;
    tempoUltimoPulo = Date.now();
  } else if (Date.now() - tempoUltimoPulo > 200) {
    ultimoEstadoPulo = false;
  }

  const roboAtual = ultimoEstadoPulo ? roboPulo : roboQueda;
  ctx.drawImage(roboAtual, bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);

  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY);
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 25);
}

// Fim do jogo
function endGame() {
  gameRunning = false;
  clearInterval(gameInterval);
  document.removeEventListener("keydown", fly);
  try { gameplaySound.pause(); } catch (e) {}
  safePlay(gameOverSound, false);

  canvas.style.display = "none";
  gameOverScreen.style.display = "block";
  document.getElementById("finalScore").innerText = `Pontuação: ${score}`;

  saveScore(playerName, score);
}

// Ranking
function saveScore(name, points) {
  const key = "flappyRanking";
  let ranking = JSON.parse(localStorage.getItem(key)) || [];
  ranking.push({ name, points });
  ranking.sort((a,b) => b.points - a.points);
  localStorage.setItem(key, JSON.stringify(ranking.slice(0,10)));
}

function showRanking() {
  menu.style.display = "none";
  gameOverScreen.style.display = "none";
  canvas.style.display = "none";
  instructionsScreen.style.display = "none";
  rankingScreen.style.display = "block";
  safePlay(menuSound, false);

  const ranking = JSON.parse(localStorage.getItem("flappyRanking")) || [];
  rankingList.innerHTML = ranking.length === 0
    ? "<li>Nenhum ponto registrado ainda.</li>"
    : ranking.map((r,i) => `<li>${i+1}. ${r.name} - ${r.points} pts</li>`).join("");
}

function clearRanking() {
  if (confirm("Tem certeza que deseja limpar o ranking?")) {
    localStorage.removeItem("flappyRanking");
    rankingList.innerHTML = "";
  }
}

// Handlers UI
restartBtn.onclick = () => {
  playerNameInput.value = playerName;
  gameOverScreen.style.display = "none";
  difficultyScreen.style.display = "block";
  safePlay(menuSound, false);
};

backToMenuBtn.onclick = () => {
  gameOverScreen.style.display = "none";
  menu.style.display = "block";
  playerNameInput.value = playerName;
  safePlay(menuSound, false);
};

rankingBtn.onclick = showRanking;

backToMenuFromRanking.onclick = () => {
  rankingScreen.style.display = "none";
  menu.style.display = "block";
  safePlay(menuSound, false);
};

clearRankingBtn.onclick = clearRanking;

instructionsBtn.onclick = () => {
  menu.style.display = "none";
  instructionsScreen.style.display = "block";
  safePlay(menuSound, false);
};

backToMenuFromInstructions.onclick = () => {
  instructionsScreen.style.display = "none";
  menu.style.display = "block";
  safePlay(menuSound, false);
};
=======
// script.js - versão corrigida (visibilidade controlada por style.display)

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elementos UI
const menu = document.getElementById("menu");
const difficultyScreen = document.getElementById("difficultyScreen");
const welcomeMessage = document.getElementById("welcomeMessage");
const countdown = document.getElementById("countdown");
const gameOverScreen = document.getElementById("gameOverScreen");
const rankingScreen = document.getElementById("rankingScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const rankingList = document.getElementById("rankingList");

const playerNameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const rankingBtn = document.getElementById("rankingBtn");
const backToMenuFromRanking = document.getElementById("backToMenuFromRanking");
const clearRankingBtn = document.getElementById("clearRankingBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const backToMenuFromInstructions = document.getElementById("backToMenuFromInstructions");
const backToMenuFromDifficulty = document.getElementById("backToMenuFromDifficulty");

// Sons (coloque os arquivos na pasta Sons/)
const jumpSound = new Audio("Sons/Pulo.wav");
const menuSound = new Audio("Sons/Menu&Ranking.mp3");
const gameplaySound = new Audio("Sons/GamePlay.mp3");
const gameOverSound = new Audio("Sons/GameOver.mp3");
const pontoSound = new Audio("Sons/Ponto.mp3");

// Imagens
const roboPulo = new Image(); roboPulo.src = "Imagens/pulo.png";
const roboQueda = new Image(); roboQueda.src = "Imagens/queda.png";

const BIRD_SIZE = 20;

// Dificuldade - Opção A: muda apenas velocidade dos canos
const pipeSpeedMap = { facil: 2, medio: 3, dificil: 4.3 };
let selectedDifficulty = "medio";

// Estado do jogo
let bird, pipes, score, gameInterval;
let frameCount = 0;
let ultimoEstadoPulo = false;
let tempoUltimoPulo = 0;
let playerName = "";

// Carrega último nome salvo no localStorage
const last = localStorage.getItem("flappyLastPlayer");
if (last) playerNameInput.value = last;

// Função para tocar som (com proteção para erro de autoplay)
function playSound(sound, loop = false) {
  if (!sound) return;
  sound.loop = loop;
  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
}

// Inicializa visibilidade (garante estado consistente)
function showMenu() {
  menu.style.display = "block";
  difficultyScreen.style.display = "none";
  welcomeMessage.style.display = "none";
  countdown.style.display = "none";
  canvas.style.display = "none";
  gameOverScreen.style.display = "none";
  rankingScreen.style.display = "none";
  instructionsScreen.style.display = "none";
}
showMenu();
playSound(menuSound);

// -------------------- Fluxo: iniciar → escolher dificuldade → contagem → jogo
startBtn.onclick = () => {
  const name = playerNameInput.value.trim();
  if (!name || name.length < 2) {
    alert("Digite um nome com pelo menos 2 caracteres!");
    return;
  }
  playerName = name;
  localStorage.setItem("flappyLastPlayer", playerName); // salva último nome
  // mostra tela de dificuldade
  menu.style.display = "none";
  difficultyScreen.style.display = "block";
};

// voltar da difficulty para menu
backToMenuFromDifficulty.onclick = () => {
  difficultyScreen.style.display = "none";
  menu.style.display = "block";
};

// botões de dificuldade
document.querySelectorAll(".difficultyBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const diff = btn.dataset.diff || "medio";
    selectedDifficulty = diff;
    difficultyScreen.style.display = "none";
    startCountdown(); // inicia "Boa sorte" + contador
  });
});

// Contagem regressiva (3s) com mensagem "Boa sorte, [nome]!"
function startCountdown() {
  welcomeMessage.textContent = `Boa sorte, ${playerName}!`;
  welcomeMessage.style.display = "block";
  playSound(menuSound);

  setTimeout(() => {
    welcomeMessage.style.display = "none";
    let n = 3;
    countdown.textContent = n;
    countdown.style.display = "block";

    const timer = setInterval(() => {
      n--;
      if (n >= 1) {
        countdown.textContent = n;
      } else if (n === 0) {
        countdown.textContent = "GO!";
      } else {
        clearInterval(timer);
        countdown.style.display = "none";
        startGame();
      }
    }, 1000);
  }, 1400);
}

// Inicia o jogo propriamente dito
function startGame() {
  canvas.style.display = "block";

  bird = { x: 50, y: 150, width: BIRD_SIZE, height: BIRD_SIZE, gravity: 0.5, lift: -8, velocity: 0 };
  pipes = [];
  score = 0;
  frameCount = 0;

  // som de gameplay
  try { menuSound.pause(); } catch {}
  playSound(gameplaySound, true);

  if (gameInterval) clearInterval(gameInterval);
  document.addEventListener("keydown", fly);
  document.addEventListener("click", fly);
  document.addEventListener("touchstart", fly, { passive: false });
  gameInterval = setInterval(() => updateGame(pipeSpeedMap[selectedDifficulty]), 20);
}

// Função de pulo
function fly(e) {
  // Evita bug no mobile em que o touch scrolla a tela
  e.preventDefault();
  // Se for teclado
  if (e.type === "keydown") {
    if (e.code === "Space" || e.code === "ArrowUp") {
      doJump();
    }
  }
  // Para mouse ou toque, basta chamar pulo diretamente
  if (e.type === "click" || e.type === "touchstart") {
    doJump();
  }
}
// Pulo real (separado para clareza)
function doJump() {
  bird.velocity = bird.lift;
  try { jumpSound.currentTime = 0; jumpSound.play(); } catch {}
}

// Atualiza o jogo (recebe pipeSpeed conforme dificuldade)
function updateGame(currentPipeSpeed) {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  frameCount++;
  if (frameCount % 90 === 0) {
    const topHeight = Math.random() * 200 + 50;
    pipes.push({ x: canvas.width, topHeight: topHeight, bottomY: topHeight + 120, width: 40, passed: false });
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= currentPipeSpeed;

    // colisão
    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
    ) {
      endGame();
      return;
    }

    // pontuação
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
      try { pontoSound.currentTime = 0; pontoSound.play(); } catch (e) {}
    }

    if (pipe.x + pipe.width < 0) pipes.splice(i, 1);
  }

  // colisão com chão/ceiling
  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
    return;
  }

  drawGame();
}

// Desenha o jogo
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bird.velocity < -2) {
    ultimoEstadoPulo = true;
    tempoUltimoPulo = Date.now();
  } else if (Date.now() - tempoUltimoPulo > 200) {
    ultimoEstadoPulo = false;
  }

  const roboAtual = ultimoEstadoPulo ? roboPulo : roboQueda;
  ctx.drawImage(roboAtual, bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);

  // canos
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY);
  });

  // pontuação
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 25);
}

// Fim do jogo
function endGame() {
  clearInterval(gameInterval);
  document.removeEventListener("keydown", fly);
  try { gameplaySound.pause(); } catch (e) {}
  playSound(gameOverSound);

  canvas.style.display = "none";
  gameOverScreen.style.display = "block";
  document.getElementById("finalScore").innerText = `Pontuação: ${score}`;

  saveScore(playerName, score);
}

// Ranking (localStorage)
function saveScore(name, points) {
  if (!name || typeof points !== "number") return;
  const key = "flappyRanking";
  let ranking = JSON.parse(localStorage.getItem(key)) || [];
  ranking.push({ name, points });
  ranking.sort((a,b) => b.points - a.points);
  localStorage.setItem(key, JSON.stringify(ranking.slice(0,10)));
}

function showRanking() {
  menu.style.display = "none";
  gameOverScreen.style.display = "none";
  canvas.style.display = "none";
  instructionsScreen.style.display = "none";
  rankingScreen.style.display = "block";
  playSound(menuSound);

  const ranking = JSON.parse(localStorage.getItem("flappyRanking")) || [];
  if (ranking.length === 0) {
    rankingList.innerHTML = "<li>Nenhum ponto registrado ainda.</li>";
    return;
  }

  rankingList.innerHTML = ranking
    .map((r,i) => `<li>${i+1}. ${r.name} - ${r.points} pts</li>`)
    .join("");
}

function clearRanking() {
  if (confirm("Tem certeza que deseja limpar o ranking?")) {
    localStorage.removeItem("flappyRanking");
    rankingList.innerHTML = "";
  }
}

// Handlers UI
restartBtn.onclick = () => {
  // mantém o nome no campo
  playerNameInput.value = playerName || localStorage.getItem("flappyLastPlayer") || "";
  gameOverScreen.style.display = "none";
  difficultyScreen.style.display = "block"; // volta para escolher dificuldade
  playSound(menuSound);
};

backToMenuBtn.onclick = () => {
  gameOverScreen.style.display = "none";
  menu.style.display = "block";
  playerNameInput.value = playerName || localStorage.getItem("flappyLastPlayer") || "";
  playSound(menuSound);
};

rankingBtn.onclick = showRanking;
backToMenuFromRanking.onclick = () => {
  rankingScreen.style.display = "none";
  menu.style.display = "block";
  playSound(menuSound);
};
clearRankingBtn.onclick = clearRanking;

instructionsBtn.onclick = () => {
  menu.style.display = "none";
  instructionsScreen.style.display = "block";
  playSound(menuSound);
};
backToMenuFromInstructions.onclick = () => {
  instructionsScreen.style.display = "none";
  menu.style.display = "block";
  playSound(menuSound);
};
>>>>>>> 69bcbc0 (Corrigindo movimento com touch):FlapJump/Jogo/script.js
