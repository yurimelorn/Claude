'use strict';

// ---------- Estado do jogo ----------
const state = {
  players: [],        // [{ name }]
  totalRounds: 3,
  currentRound: 0,    // índice a partir de 0
  currentPlayer: 0,   // índice do jogador da vez
  target: 0,          // tempo alvo da rodada (todos os jogadores tentam o mesmo alvo)
  attempts: [],       // tentativas da rodada atual: [{ player, actual, diff }]
  wins: {},           // vitórias por rodada: { nome: quantidade }
  totalDiff: {},      // soma das diferenças (desempate): { nome: total }
  timerStart: null,   // performance.now() quando o cronômetro iniciou
};

// ---------- Utilidades ----------
const $ = (id) => document.getElementById(id);

function fmt(seconds) {
  return seconds.toFixed(2).replace('.', ',');
}

function randomTarget() {
  // Alvo entre 0,50 e 20,00 s (evita alvos impossíveis de quase zero)
  const value = 0.5 + Math.random() * 19.5;
  return Math.round(value * 100) / 100;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ---------- Tela inicial ----------
const playerListEl = $('player-list');
const nameInput = $('player-name-input');

function renderPlayers() {
  playerListEl.innerHTML = '';
  state.players.forEach((p, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = p.name;
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.setAttribute('aria-label', `Remover ${p.name}`);
    btn.addEventListener('click', () => {
      state.players.splice(i, 1);
      renderPlayers();
    });
    li.append(span, btn);
    playerListEl.appendChild(li);
  });
  $('btn-start-game').disabled = state.players.length === 0;
}

function addPlayer() {
  const name = nameInput.value.trim();
  if (!name) return;
  if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    nameInput.value = '';
    return;
  }
  state.players.push({ name });
  nameInput.value = '';
  nameInput.focus();
  renderPlayers();
}

$('btn-add-player').addEventListener('click', addPlayer);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addPlayer();
});

document.querySelectorAll('.round-opt').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.round-opt').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.totalRounds = parseInt(btn.dataset.rounds, 10);
  });
});

$('btn-start-game').addEventListener('click', () => {
  state.currentRound = 0;
  state.wins = {};
  state.totalDiff = {};
  state.players.forEach((p) => {
    state.wins[p.name] = 0;
    state.totalDiff[p.name] = 0;
  });
  startRound();
});

// ---------- Fluxo da rodada ----------
function startRound() {
  state.currentPlayer = 0;
  state.attempts = [];
  state.target = randomTarget();
  showTargetScreen();
}

function roundLabel() {
  return `Rodada ${state.currentRound + 1} de ${state.totalRounds}`;
}

function showTargetScreen() {
  const player = state.players[state.currentPlayer];
  $('target-round-label').textContent = roundLabel();
  $('target-player-name').textContent = player.name;
  $('target-time-display').textContent = fmt(state.target);
  showScreen('screen-target');
}

$('btn-ready').addEventListener('click', () => {
  $('timer-round-label').textContent = roundLabel();
  $('timer-target-reminder').textContent = `Alvo: ${fmt(state.target)} s`;
  resetTimerScreen();
  showScreen('screen-timer');
});

// ---------- Cronômetro cego ----------
const btnTimer = $('btn-timer');
const blindDisplay = $('blind-display');

function resetTimerScreen() {
  state.timerStart = null;
  btnTimer.textContent = '▶ Iniciar';
  btnTimer.classList.remove('running');
  blindDisplay.classList.remove('running');
  $('blind-text').textContent = 'Toque para iniciar';
  blindDisplay.querySelector('.blind-icon').textContent = '🙈';
}

btnTimer.addEventListener('click', () => {
  if (state.timerStart === null) {
    // Iniciar
    state.timerStart = performance.now();
    btnTimer.textContent = '⏹ Parar';
    btnTimer.classList.add('running');
    blindDisplay.classList.add('running');
    $('blind-text').textContent = 'Contando... confie no seu instinto!';
    blindDisplay.querySelector('.blind-icon').textContent = '⏱️';
    vibrate(50);
  } else {
    // Parar
    const elapsed = (performance.now() - state.timerStart) / 1000;
    state.timerStart = null;
    vibrate([50, 50, 50]);
    finishAttempt(Math.round(elapsed * 100) / 100);
  }
});

function finishAttempt(actual) {
  const player = state.players[state.currentPlayer];
  const diff = Math.round(Math.abs(actual - state.target) * 100) / 100;
  state.attempts.push({ player: player.name, actual, diff });
  state.totalDiff[player.name] += diff;

  $('result-round-label').textContent = roundLabel();
  $('result-player-name').textContent = player.name;
  $('result-target').textContent = `${fmt(state.target)} s`;
  $('result-actual').textContent = `${fmt(actual)} s`;
  $('result-diff').textContent = `${fmt(diff)} s`;

  const [ratingClass, ratingText] = rateDiff(diff);
  const diffBox = $('diff-box');
  diffBox.className = `diff-box ${ratingClass}`;
  $('result-rating').textContent = ratingText;

  const isLastPlayer = state.currentPlayer === state.players.length - 1;
  $('btn-next').textContent = isLastPlayer
    ? (state.players.length > 1 ? 'Ver resultado da rodada' : 'Continuar')
    : `Passar para ${state.players[state.currentPlayer + 1].name}`;

  showScreen('screen-result');
}

function rateDiff(diff) {
  if (diff <= 0.1) return ['diff-perfect', '🎯 Perfeito!'];
  if (diff <= 0.3) return ['diff-good', '🔥 Excelente!'];
  if (diff <= 0.8) return ['diff-ok', '👍 Bom!'];
  if (diff <= 2) return ['diff-bad', '😅 Quase...'];
  return ['diff-bad', '🐢 Treina mais!'];
}

$('btn-next').addEventListener('click', () => {
  state.currentPlayer++;
  if (state.currentPlayer < state.players.length) {
    showTargetScreen();
  } else {
    endRound();
  }
});

// ---------- Fim da rodada ----------
function endRound() {
  const sorted = [...state.attempts].sort((a, b) => a.diff - b.diff);
  const best = sorted[0];
  state.wins[best.player]++;

  const isLastRound = state.currentRound === state.totalRounds - 1;

  if (state.players.length === 1 && !isLastRound) {
    // Jogo solo: sem tela de "vencedor da rodada", segue direto
    state.currentRound++;
    startRound();
    return;
  }

  if (state.players.length > 1) {
    $('round-summary-label').textContent = `Resultado da rodada ${state.currentRound + 1}`;
    $('round-winner').textContent = `🏆 ${best.player} venceu a rodada!`;
    renderTable($('round-table'), sorted.map((a) => ({
      name: a.player,
      cols: [`${fmt(a.actual)} s`, `${fmt(a.diff)} s`],
      winner: a.player === best.player,
    })), ['Jogador', 'Tempo', 'Diferença']);
    $('btn-next-round').textContent = isLastRound ? 'Ver placar final' : 'Próxima rodada';
    showScreen('screen-round');
  } else {
    showFinal();
  }
}

$('btn-next-round').addEventListener('click', () => {
  state.currentRound++;
  if (state.currentRound < state.totalRounds) {
    startRound();
  } else {
    showFinal();
  }
});

// ---------- Placar final ----------
function showFinal() {
  // Classificação: mais vitórias primeiro; empate decidido pela menor soma de diferenças
  const ranking = state.players
    .map((p) => ({
      name: p.name,
      wins: state.wins[p.name],
      totalDiff: Math.round(state.totalDiff[p.name] * 100) / 100,
    }))
    .sort((a, b) => b.wins - a.wins || a.totalDiff - b.totalDiff);

  const champion = ranking[0];
  $('final-winner').textContent = state.players.length > 1
    ? `${champion.name} é o campeão!`
    : `Diferença total: ${fmt(champion.totalDiff)} s`;

  renderTable($('final-table'), ranking.map((r) => ({
    name: r.name,
    cols: [String(r.wins), `${fmt(r.totalDiff)} s`],
    winner: r.name === champion.name && state.players.length > 1,
  })), ['Jogador', 'Vitórias', 'Diferença total']);

  showScreen('screen-final');
}

function renderTable(tableEl, rows, headers) {
  tableEl.innerHTML = '';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    if (row.winner) tr.classList.add('winner');
    const tdName = document.createElement('td');
    tdName.textContent = row.name;
    tr.appendChild(tdName);
    row.cols.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tableEl.append(thead, tbody);
}

$('btn-play-again').addEventListener('click', () => {
  $('btn-start-game').click();
});

$('btn-new-players').addEventListener('click', () => {
  showScreen('screen-setup');
});

// ---------- PWA: service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Sem service worker (ex.: abrindo via file://) o jogo funciona normalmente
    });
  });
}
