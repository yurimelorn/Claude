/* ===== Cronômetro às Cegas — lógica do jogo ===== */

(() => {
  "use strict";

  const MIN_PLAYERS = 1;
  const MAX_PLAYERS = 8;
  const TARGET_MIN = 0.5;   // evita alvos impossíveis tipo 0,03s
  const TARGET_MAX = 20;
  const BEST_KEY = "cronometro-cegas-recorde";

  // ----- Estado -----
  const state = {
    players: [],        // [{ name, score }]
    playerCount: 2,
    round: 0,
    target: 0,          // em segundos, 2 casas decimais
    currentPlayer: 0,
    attempts: [],       // tempos da rodada atual (segundos)
    timerRunning: false,
    timerStart: 0,
  };

  // ----- Elementos -----
  const $ = (id) => document.getElementById(id);

  const screens = {
    home: $("screen-home"),
    game: $("screen-game"),
    pass: $("screen-pass"),
    result: $("screen-result"),
    final: $("screen-final"),
  };

  const el = {
    playerCount: $("player-count"),
    playerNames: $("player-names"),
    roundLabel: $("round-label"),
    turnLabel: $("turn-label"),
    targetTime: $("target-time"),
    timerVisual: $("timer-visual"),
    timerEmoji: $("timer-emoji"),
    timerStatus: $("timer-status"),
    btnTimer: $("btn-timer"),
    nextPlayerName: $("next-player-name"),
    resultTitle: $("result-title"),
    resultTarget: $("result-target"),
    resultList: $("result-list"),
    soloFeedback: $("solo-feedback"),
    finalSubtitle: $("final-subtitle"),
    finalList: $("final-list"),
  };

  // ----- Utilidades -----
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function fmt(seconds) {
    return seconds.toFixed(2).replace(".", ",");
  }

  function randomTarget() {
    const raw = TARGET_MIN + Math.random() * (TARGET_MAX - TARGET_MIN);
    return Math.round(raw * 100) / 100;
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function playerName(i) {
    return state.players[i].name;
  }

  // ----- Tela inicial -----
  function renderNameInputs() {
    el.playerCount.textContent = state.playerCount;
    const existing = [...el.playerNames.querySelectorAll("input")].map((i) => i.value);
    el.playerNames.innerHTML = "";
    for (let i = 0; i < state.playerCount; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 20;
      input.placeholder = `Jogador ${i + 1}`;
      input.value = existing[i] || "";
      input.setAttribute("aria-label", `Nome do jogador ${i + 1}`);
      el.playerNames.appendChild(input);
    }
  }

  $("btn-minus").addEventListener("click", () => {
    if (state.playerCount > MIN_PLAYERS) {
      state.playerCount--;
      renderNameInputs();
    }
  });

  $("btn-plus").addEventListener("click", () => {
    if (state.playerCount < MAX_PLAYERS) {
      state.playerCount++;
      renderNameInputs();
    }
  });

  $("btn-start-game").addEventListener("click", () => {
    const inputs = [...el.playerNames.querySelectorAll("input")];
    state.players = inputs.map((input, i) => ({
      name: input.value.trim() || `Jogador ${i + 1}`,
      score: 0,
    }));
    state.round = 0;
    startRound();
  });

  // ----- Rodada -----
  function startRound() {
    state.round++;
    state.target = randomTarget();
    state.currentPlayer = 0;
    state.attempts = [];
    showTurn();
  }

  function showTurn() {
    el.roundLabel.textContent = `Rodada ${state.round}`;
    el.turnLabel.textContent =
      state.players.length === 1 ? "Modo solo" : `Vez de ${playerName(state.currentPlayer)}`;
    el.targetTime.innerHTML = `${fmt(state.target)}<small>s</small>`;
    resetTimerUI();
    showScreen("game");
  }

  function resetTimerUI() {
    state.timerRunning = false;
    el.btnTimer.textContent = "INICIAR ▶";
    el.btnTimer.classList.add("btn-go");
    el.btnTimer.classList.remove("btn-stop");
    el.btnTimer.disabled = false;
    el.timerVisual.classList.remove("running");
    el.timerEmoji.textContent = "🙈";
    el.timerStatus.innerHTML =
      "Toque no botão para iniciar o cronômetro.<br>Ele ficará <strong>escondido</strong>!";
  }

  // ----- Cronômetro -----
  function startTimer() {
    state.timerRunning = true;
    state.timerStart = performance.now();
    el.btnTimer.textContent = "PARAR ⏹";
    el.btnTimer.classList.remove("btn-go");
    el.btnTimer.classList.add("btn-stop");
    el.timerVisual.classList.add("running");
    el.timerEmoji.textContent = "🤐";
    el.timerStatus.innerHTML =
      `Cronômetro rodando… conte até <strong>${fmt(state.target)}s</strong> na sua cabeça!`;
    vibrate(30);
  }

  function stopTimer() {
    const elapsed = (performance.now() - state.timerStart) / 1000;
    state.timerRunning = false;
    state.attempts.push(Math.round(elapsed * 100) / 100);
    el.btnTimer.disabled = true;
    el.timerVisual.classList.remove("running");
    el.timerEmoji.textContent = "✅";
    vibrate([30, 40, 30]);

    setTimeout(() => {
      const isLast = state.currentPlayer >= state.players.length - 1;
      if (isLast) {
        showRoundResult();
      } else {
        state.currentPlayer++;
        el.nextPlayerName.textContent = playerName(state.currentPlayer);
        showScreen("pass");
      }
    }, 600);
  }

  function toggleTimer() {
    if (el.btnTimer.disabled) return;
    if (state.timerRunning) stopTimer();
    else startTimer();
  }

  el.btnTimer.addEventListener("click", toggleTimer);

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    if (!screens.game.classList.contains("active")) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") e.preventDefault();
    e.preventDefault();
    toggleTimer();
  });

  $("btn-next-player").addEventListener("click", showTurn);

  // ----- Resultado da rodada -----
  function diffClass(diff) {
    if (diff <= 0.15) return "good";
    if (diff <= 0.6) return "ok";
    return "bad";
  }

  function showRoundResult() {
    el.resultTitle.textContent = `Resultado — Rodada ${state.round}`;
    el.resultTarget.textContent = `${fmt(state.target)}s`;

    const results = state.players.map((p, i) => ({
      index: i,
      name: p.name,
      time: state.attempts[i],
      diff: Math.abs(state.attempts[i] - state.target),
    }));
    results.sort((a, b) => a.diff - b.diff);

    // pontuação: 1º lugar ganha 1 ponto (empate: todos os empatados ganham)
    const bestDiff = results[0].diff;
    results.forEach((r) => {
      if (Math.abs(r.diff - bestDiff) < 0.005) state.players[r.index].score++;
    });

    el.resultList.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉"];
    results.forEach((r, pos) => {
      const row = document.createElement("div");
      row.className = "result-row" + (pos === 0 ? " winner" : "");
      const medal = medals[pos] || "🎖️";
      row.innerHTML = `
        <span class="result-medal">${medal}</span>
        <div class="result-info">
          <div class="result-name"></div>
          <div class="result-detail">Parou em ${fmt(r.time)}s</div>
        </div>
        <div>
          <div class="result-diff ${diffClass(r.diff)}">±${fmt(r.diff)}s</div>
          <div class="result-points">${state.players[r.index].score} pt${state.players[r.index].score === 1 ? "" : "s"}</div>
        </div>`;
      row.querySelector(".result-name").textContent = r.name;
      el.resultList.appendChild(row);
    });

    renderSoloFeedback(results);
    showScreen("result");
  }

  function renderSoloFeedback(results) {
    if (state.players.length !== 1) {
      el.soloFeedback.classList.add("hidden");
      return;
    }
    const diff = results[0].diff;
    let msg;
    if (diff <= 0.05) msg = "🤯 <strong>PERFEITO!</strong> Você tem um relógio na cabeça!";
    else if (diff <= 0.15) msg = "🔥 <strong>Incrível!</strong> Quase cravado!";
    else if (diff <= 0.4) msg = "😎 <strong>Muito bom!</strong> Reflexos afiados.";
    else if (diff <= 1) msg = "🙂 <strong>Bom!</strong> Dá pra melhorar.";
    else msg = "😅 <strong>Ops!</strong> O tempo voou (ou se arrastou)…";

    let recordHtml = "";
    try {
      const best = parseFloat(localStorage.getItem(BEST_KEY));
      if (isNaN(best) || diff < best) {
        localStorage.setItem(BEST_KEY, String(diff));
        recordHtml = `<br><span class="record">🏅 Novo recorde pessoal: ±${fmt(diff)}s</span>`;
      } else {
        recordHtml = `<br>Recorde pessoal: ±${fmt(best)}s`;
      }
    } catch (_) { /* localStorage indisponível */ }

    el.soloFeedback.innerHTML = msg + recordHtml;
    el.soloFeedback.classList.remove("hidden");
  }

  $("btn-next-round").addEventListener("click", startRound);
  $("btn-finish").addEventListener("click", showFinal);

  // ----- Placar final -----
  function showFinal() {
    if (state.players.length === 1) {
      // modo solo não tem placar acumulado — volta ao início
      showScreen("home");
      return;
    }

    const ranking = [...state.players].sort((a, b) => b.score - a.score);
    const topScore = ranking[0].score;
    const champs = ranking.filter((p) => p.score === topScore);

    el.finalSubtitle.textContent =
      champs.length > 1
        ? `Empate entre ${champs.map((c) => c.name).join(" e ")}!`
        : `${champs[0].name} venceu com ${topScore} ponto${topScore === 1 ? "" : "s"}!`;

    el.finalList.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉"];
    ranking.forEach((p, pos) => {
      const row = document.createElement("div");
      row.className = "result-row" + (p.score === topScore ? " winner" : "");
      row.innerHTML = `
        <span class="result-medal">${medals[pos] || "🎖️"}</span>
        <div class="result-info"><div class="result-name"></div></div>
        <div class="result-diff">${p.score} pt${p.score === 1 ? "" : "s"}</div>`;
      row.querySelector(".result-name").textContent = p.name;
      el.finalList.appendChild(row);
    });

    showScreen("final");
  }

  $("btn-play-again").addEventListener("click", () => {
    showScreen("home");
  });

  // ----- PWA -----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  // ----- Inicialização -----
  renderNameInputs();
})();
