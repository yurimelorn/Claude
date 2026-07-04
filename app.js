"use strict";

/* ================== Estado ================== */

const state = {
  players: [],        // nomes dos jogadores
  target: 0,          // tempo alvo em segundos (2 casas decimais)
  results: [],        // { name, elapsed, diff }
  currentIndex: 0,    // índice do jogador da vez
  startTimestamp: 0,  // performance.now() do início da contagem
  running: false,
};

const BEST_KEY = "cronometro-cego-recorde";
const PLAYERS_KEY = "cronometro-cego-jogadores";

/* ================== Elementos ================== */

const $ = (id) => document.getElementById(id);

const screens = {
  setup: $("screen-setup"),
  play: $("screen-play"),
  recorded: $("screen-recorded"),
  results: $("screen-results"),
};

const els = {
  playerList: $("player-list"),
  playerNameInput: $("player-name-input"),
  btnAddPlayer: $("btn-add-player"),
  btnStartGame: $("btn-start-game"),
  targetDisplay: $("target-display"),
  currentPlayerBox: $("current-player-box"),
  currentPlayerName: $("current-player-name"),
  btnTimer: $("btn-timer"),
  timerButtonLabel: $("timer-button-label"),
  btnAbort: $("btn-abort"),
  recordedPlayerName: $("recorded-player-name"),
  nextPlayerName: $("next-player-name"),
  btnNextPlayer: $("btn-next-player"),
  resultsTitle: $("results-title"),
  resultsTarget: $("results-target"),
  resultsList: $("results-list"),
  soloBest: $("solo-best"),
  soloBestValue: $("solo-best-value"),
  btnPlayAgain: $("btn-play-again"),
  btnChangePlayers: $("btn-change-players"),
};

/* ================== Utilidades ================== */

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// Formata segundos no padrão brasileiro: 1,57 s
function formatSeconds(value) {
  return value.toFixed(2).replace(".", ",") + " s";
}

// Sorteia um alvo entre 0,50 e 20,00 s (evita alvos impossíveis de ~0s)
function drawTarget() {
  const min = 0.5;
  const max = 20;
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 100) / 100;
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/* ================== Jogadores (setup) ================== */

function renderPlayerList() {
  els.playerList.innerHTML = "";
  state.players.forEach((name, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-player";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", `Remover ${name}`);
    remove.addEventListener("click", () => {
      state.players.splice(i, 1);
      renderPlayerList();
    });
    li.append(span, remove);
    els.playerList.appendChild(li);
  });
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(state.players));
  } catch (_) { /* armazenamento indisponível (modo privado etc.) */ }
}

function addPlayer() {
  const name = els.playerNameInput.value.trim();
  if (!name) return;
  if (state.players.length >= 8) {
    alert("Máximo de 8 jogadores!");
    return;
  }
  state.players.push(name);
  els.playerNameInput.value = "";
  els.playerNameInput.focus();
  renderPlayerList();
}

/* ================== Fluxo do jogo ================== */

function startGame() {
  if (state.players.length === 0) {
    state.players.push("Jogador 1");
    renderPlayerList();
  }
  state.target = drawTarget();
  state.results = [];
  state.currentIndex = 0;
  els.targetDisplay.textContent = formatSeconds(state.target);
  beginTurn();
}

function beginTurn() {
  state.running = false;
  els.currentPlayerName.textContent = state.players[state.currentIndex];
  els.currentPlayerBox.style.visibility = state.players.length > 1 ? "visible" : "hidden";
  els.btnTimer.classList.remove("state-running");
  els.btnTimer.classList.add("state-ready");
  els.timerButtonLabel.innerHTML = "TOCAR PARA<br>INICIAR";
  showScreen("play");
}

function handleTimerTap() {
  if (!state.running) {
    // Início da contagem
    state.running = true;
    state.startTimestamp = performance.now();
    els.btnTimer.classList.remove("state-ready");
    els.btnTimer.classList.add("state-running");
    els.timerButtonLabel.innerHTML = "CORRENDO...<br>TOQUE PARA PARAR";
    vibrate(30);
    return;
  }

  // Parada da contagem
  const elapsed = Math.round(((performance.now() - state.startTimestamp) / 1000) * 100) / 100;
  state.running = false;
  vibrate([30, 40, 30]);

  const name = state.players[state.currentIndex];
  state.results.push({
    name,
    elapsed,
    diff: Math.round(Math.abs(elapsed - state.target) * 100) / 100,
  });

  const isLast = state.currentIndex >= state.players.length - 1;
  if (isLast) {
    showResults();
  } else {
    els.recordedPlayerName.textContent = name;
    els.nextPlayerName.textContent = state.players[state.currentIndex + 1];
    showScreen("recorded");
  }
}

function nextPlayer() {
  state.currentIndex += 1;
  beginTurn();
}

/* ================== Resultados ================== */

function showResults() {
  const ranked = [...state.results].sort((a, b) => a.diff - b.diff);
  const bestDiff = ranked[0].diff;
  const solo = state.players.length === 1;

  els.resultsTarget.textContent = formatSeconds(state.target);
  els.resultsTitle.textContent = solo
    ? (bestDiff <= 0.1 ? "Incrível! 🎯" : "Seu resultado")
    : `${ranked[0].name} venceu!`;

  els.resultsList.innerHTML = "";
  ranked.forEach((r, i) => {
    const li = document.createElement("li");
    if (r.diff === bestDiff) li.classList.add("winner");

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = r.diff === bestDiff ? "🏅" : `${i + 1}º`;

    const who = document.createElement("div");
    who.className = "who";
    const nameEl = document.createElement("span");
    nameEl.className = "name";
    nameEl.textContent = r.name;
    const timeEl = document.createElement("span");
    timeEl.className = "time";
    timeEl.textContent = `parou em ${formatSeconds(r.elapsed)}`;
    who.append(nameEl, timeEl);

    const diff = document.createElement("span");
    diff.className = "diff";
    diff.textContent = `±${formatSeconds(r.diff)}`;

    li.append(rank, who, diff);
    els.resultsList.appendChild(li);
  });

  // Recorde pessoal no modo solo
  els.soloBest.classList.toggle("hidden", !solo);
  if (solo) {
    let best = null;
    try {
      const stored = localStorage.getItem(BEST_KEY);
      best = stored === null ? null : parseFloat(stored);
      if (best === null || bestDiff < best) {
        best = bestDiff;
        localStorage.setItem(BEST_KEY, String(best));
      }
    } catch (_) {
      best = bestDiff;
    }
    els.soloBestValue.textContent = formatSeconds(best);
  }

  showScreen("results");
}

/* ================== Eventos ================== */

els.btnAddPlayer.addEventListener("click", addPlayer);
els.playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPlayer();
});
els.btnStartGame.addEventListener("click", startGame);
els.btnTimer.addEventListener("click", handleTimerTap);
els.btnAbort.addEventListener("click", () => {
  state.running = false;
  showScreen("setup");
});
els.btnNextPlayer.addEventListener("click", nextPlayer);
els.btnPlayAgain.addEventListener("click", startGame);
els.btnChangePlayers.addEventListener("click", () => showScreen("setup"));

/* ================== Inicialização ================== */

try {
  const saved = JSON.parse(localStorage.getItem(PLAYERS_KEY) || "[]");
  if (Array.isArray(saved)) {
    state.players = saved.filter((n) => typeof n === "string").slice(0, 8);
  }
} catch (_) { /* ignora dados corrompidos */ }
renderPlayerList();

// Service worker para funcionar offline / instalar como app
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Sem service worker (ex.: file://) o jogo continua funcionando online
    });
  });
}
