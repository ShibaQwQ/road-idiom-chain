import { IDIOMS, STARTERS } from "./idioms.js";
import { RULES, chooseAiReply, createPlayers, findIdiom, getSkipConfirmation, isSkipRequest, scoreAnswer } from "./game.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  setupScreen: $("#setupScreen"),
  gameScreen: $("#gameScreen"),
  setupForm: $("#setupForm"),
  difficultyField: $("#difficultyField"),
  playerCountField: $("#playerCountField"),
  playerCount: $("#playerCount"),
  networkBadge: $("#networkBadge"),
  scoreboard: $("#scoreboard"),
  turnName: $("#turnName"),
  targetCharacter: $("#targetCharacter"),
  targetSound: $("#targetSound"),
  listenButton: $("#listenButton"),
  listenLabel: $("#listenLabel"),
  voiceZone: $(".voice-zone"),
  gameStatus: $("#gameStatus"),
  manualForm: $("#manualForm"),
  manualInput: $("#manualInput"),
  historyList: $("#historyList"),
  endGame: $("#endGame"),
  resultDialog: $("#resultDialog"),
  resultTitle: $("#resultTitle"),
  finalScores: $("#finalScores"),
  playAgain: $("#playAgain")
};

const state = {
  config: null,
  players: [],
  turnIndex: 0,
  current: null,
  used: new Set(),
  history: [],
  recognition: null,
  listening: false,
  gameActive: false,
  online: null,
  pendingSkipConfirmation: false
};

function currentPlayer() {
  return state.players[state.turnIndex];
}

function setStatus(message, type = "") {
  elements.gameStatus.textContent = message;
  elements.gameStatus.className = `game-status ${type}`.trim();
}

function updateSetupFields() {
  const solo = new FormData(elements.setupForm).get("playMode") === "solo";
  elements.difficultyField.hidden = !solo;
  elements.playerCountField.hidden = solo;
}

function updateNetworkBadge() {
  elements.networkBadge.classList.toggle("online", state.online === true);
  elements.networkBadge.classList.toggle("offline", state.online === false);
  elements.networkBadge.textContent = state.online === true ? "已上網 · 語音待命" : state.online === false ? "離線遊戲" : "檢查連線";
}

async function checkConnection() {
  if (!navigator.onLine) {
    state.online = false;
    updateNetworkBadge();
    return false;
  }

  if (location.protocol === "file:") {
    state.online = navigator.onLine;
    updateNetworkBadge();
    return state.online;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`online-check.txt?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    state.online = response.ok && (await response.text()).trim() === "road-idiom-chain-online";
  } catch {
    state.online = false;
  } finally {
    clearTimeout(timeout);
    updateNetworkBadge();
  }
  return state.online;
}

function setupRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-TW";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  recognition.addEventListener("start", () => {
    state.listening = true;
    elements.voiceZone.classList.add("listening");
    elements.listenLabel.textContent = "正在聽";
    setStatus(state.pendingSkipConfirmation ? "請說確定或取消" : "請說出四字成語");
  });

  recognition.addEventListener("result", (event) => {
    const alternatives = Array.from(event.results[0], (result) => result.transcript);
    if (state.pendingSkipConfirmation) {
      handleSkipConfirmation(alternatives);
      return;
    }

    const skipRequest = alternatives.find(isSkipRequest);
    if (skipRequest && state.config.mode === "multi") {
      requestSkipTurn();
      return;
    }

    const command = alternatives.find((value) => /再說一次|重複題目|結束遊戲|提示/.test(value));
    if (command) {
      handleVoiceCommand(command);
      return;
    }

    const answer = alternatives.map((value) => findIdiom(value)).find(Boolean);
    if (answer) submitAnswer(answer.text);
    else rejectAnswer(`聽到「${alternatives[0]}」，但成語庫裡找不到`);
  });

  recognition.addEventListener("error", (event) => {
    if (event.error === "aborted") return;
    const networkError = event.error === "network";
    if (networkError) {
      state.online = false;
      updateNetworkBadge();
    }
    const message = networkError ? "目前無法連線辨識，請改用下方輸入" : event.error === "not-allowed" ? "請允許 Safari 使用麥克風" : "語音沒有聽清楚，請再試一次";
    setStatus(message, "error");
  });

  recognition.addEventListener("end", () => {
    state.listening = false;
    elements.voiceZone.classList.remove("listening");
    elements.listenLabel.textContent = "說出成語";
  });

  state.recognition = recognition;
}

function startListening() {
  if (!state.gameActive || currentPlayer()?.ai) return;
  if (!state.recognition) {
    setStatus("這個瀏覽器不支援語音辨識，請使用下方輸入", "error");
    return;
  }
  if (state.listening) return;
  window.speechSynthesis?.cancel();
  try {
    state.recognition.start();
  } catch {
    setStatus("語音正在重新準備，請再按一次", "error");
  }
}

function stopListening() {
  if (!state.listening || !state.recognition) return;
  state.recognition.abort();
}

function speak(message, onEnd) {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  stopListening();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "zh-TW";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.addEventListener("end", () => onEnd?.(), { once: true });
  utterance.addEventListener("error", () => onEnd?.(), { once: true });
  window.speechSynthesis.speak(utterance);
}

function promptCurrentPlayer(autoListen = true) {
  const target = state.current.text.at(-1);
  const player = currentPlayer();
  const instruction = state.config.rule === "exact" ? `請用「${target}」字開頭` : state.config.rule === "sound" ? `請用「${target}」或同音字開頭` : `請找含有「${target}」或同音字的成語`;
  setStatus(`${player.name}，${instruction}`);
  speak(`${player.name}，${instruction}`, () => autoListen && startListening());
}

function handleVoiceCommand(command) {
  if (/結束遊戲/.test(command)) {
    finishGame("語音結束本局");
    return;
  }
  if (/提示/.test(command)) {
    const hint = chooseAiReply(state.current, state.config.rule, "easy", state.used);
    if (!hint) {
      speak("這一題沒有提示，可以結束本局");
      return;
    }
    speak(`提示，答案的第一個字是，${hint.text[0]}`, startListening);
    return;
  }
  promptCurrentPlayer(true);
}

function requestSkipTurn() {
  state.pendingSkipConfirmation = true;
  const message = `${currentPlayer().name}，確定要放棄嗎？請說確定或取消`;
  setStatus(message);
  speak(message, startListening);
}

function handleSkipConfirmation(alternatives) {
  const confirmation = getSkipConfirmation(alternatives);
  if (confirmation === "confirm") {
    confirmSkipTurn();
    return;
  }
  if (confirmation === "cancel") {
    state.pendingSkipConfirmation = false;
    setStatus("已取消放棄，請繼續回答", "success");
    speak("已取消放棄，請繼續回答", startListening);
    return;
  }
  const message = "沒有確認放棄，請說確定或取消";
  setStatus(message, "error");
  speak(message, startListening);
}

function confirmSkipTurn() {
  const player = currentPlayer();
  state.pendingSkipConfirmation = false;
  state.history.push({ text: "放棄", player: player.name, points: 0, reason: "放棄本回合" });
  state.turnIndex = (state.turnIndex + 1) % state.players.length;
  renderGame();
  const report = `${player.name}放棄本回合，得到零分，換${currentPlayer().name}`;
  setStatus(report);
  speak(report, () => promptCurrentPlayer(true));
}

function rejectAnswer(message) {
  setStatus(message, "error");
  speak(`${message}，請再試一次`, startListening);
}

function submitAnswer(value) {
  if (!state.gameActive || currentPlayer()?.ai) return;
  stopListening();
  const idiom = typeof value === "string" ? findIdiom(value) : value;
  if (!idiom) {
    rejectAnswer("成語庫裡找不到這個答案");
    return;
  }
  if (state.used.has(idiom.text)) {
    rejectAnswer(`${idiom.text}已經用過了`);
    return;
  }

  const result = scoreAnswer(state.current, idiom, state.config.rule);
  if (!result.valid) {
    rejectAnswer(`${idiom.text}沒有接到目標字`);
    return;
  }
  acceptAnswer(idiom, result);
}

function acceptAnswer(idiom, result) {
  const player = currentPlayer();
  player.score += result.points;
  state.used.add(idiom.text);
  state.current = idiom;
  state.history.push({ text: idiom.text, player: player.name, points: result.points, reason: result.reason });
  state.turnIndex = (state.turnIndex + 1) % state.players.length;
  renderGame();

  const report = `${player.name}回答${idiom.text}，${result.reason}，得到${result.points}分`;
  setStatus(report, result.points ? "success" : "");
  speak(report, () => {
    if (currentPlayer().ai) runAiTurn();
    else promptCurrentPlayer(true);
  });
}

function runAiTurn() {
  setStatus("AI 正在想成語");
  window.setTimeout(() => {
    if (!state.gameActive) return;
    const reply = chooseAiReply(state.current, state.config.rule, state.config.difficulty, state.used);
    if (!reply) {
      finishGame("AI 找不到可接的成語");
      return;
    }
    const result = scoreAnswer(state.current, reply, state.config.rule);
    acceptAnswer(reply, result);
  }, 700);
}

function renderGame() {
  const player = currentPlayer();
  elements.turnName.textContent = player.name;
  elements.targetCharacter.textContent = state.current.text.at(-1);
  elements.targetSound.textContent = state.config.rule === "exact" ? "同一字放在字首" : state.config.rule === "sound" ? "同音同調也可以" : "字首最高 3 分";
  elements.listenButton.disabled = player.ai;

  elements.scoreboard.replaceChildren(...state.players.map((item, index) => {
    const chip = document.createElement("div");
    chip.className = `score-chip${index === state.turnIndex ? " active" : ""}`;
    const name = document.createElement("span");
    name.textContent = item.name;
    const score = document.createElement("strong");
    score.textContent = `${item.score} 分`;
    chip.append(name, score);
    return chip;
  }));

  elements.historyList.replaceChildren(...state.history.map((item) => {
    const row = document.createElement("li");
    const idiom = document.createElement("strong");
    idiom.textContent = item.text;
    row.append(idiom, document.createTextNode(` · ${item.player}${item.points === null ? "" : ` +${item.points}`}`));
    return row;
  }));
}

function startGame(event) {
  event.preventDefault();
  const form = new FormData(elements.setupForm);
  const mode = form.get("playMode");
  state.config = {
    mode,
    rule: form.get("rule"),
    difficulty: form.get("difficulty"),
    playerCount: Number(elements.playerCount.value)
  };
  state.players = createPlayers(mode, state.config.playerCount);
  state.turnIndex = 0;
  state.used = new Set();
  state.history = [];
  state.gameActive = true;
  state.pendingSkipConfirmation = false;

  const starterText = STARTERS[Math.floor(Math.random() * STARTERS.length)];
  state.current = IDIOMS.find((idiom) => idiom.text === starterText);
  state.used.add(state.current.text);
  state.history.push({ text: state.current.text, player: "起點", points: null, reason: "起點" });

  elements.setupScreen.hidden = true;
  elements.gameScreen.hidden = false;
  renderGame();
  promptCurrentPlayer(true);
}

function finishGame(reason = "本局結束") {
  if (!state.gameActive) return;
  state.gameActive = false;
  state.pendingSkipConfirmation = false;
  stopListening();
  window.speechSynthesis?.cancel();
  const highest = Math.max(...state.players.map((player) => player.score));
  const winners = state.players.filter((player) => player.score === highest).map((player) => player.name);
  elements.resultTitle.textContent = `${winners.join("、")}領先 · ${reason}`;
  elements.finalScores.replaceChildren(...[...state.players].sort((a, b) => b.score - a.score).map((player) => {
    const row = document.createElement("div");
    const name = document.createElement("span");
    const score = document.createElement("strong");
    name.textContent = player.name;
    score.textContent = `${player.score} 分`;
    row.append(name, score);
    return row;
  }));
  elements.resultDialog.showModal();
}

function returnToSetup() {
  state.gameActive = false;
  state.pendingSkipConfirmation = false;
  stopListening();
  window.speechSynthesis?.cancel();
  if (elements.resultDialog.open) elements.resultDialog.close();
  elements.gameScreen.hidden = true;
  elements.setupScreen.hidden = false;
}

elements.setupForm.addEventListener("change", updateSetupFields);
elements.setupForm.addEventListener("submit", startGame);
elements.listenButton.addEventListener("click", startListening);
elements.manualForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.manualInput.value;
  elements.manualInput.value = "";
  if (state.pendingSkipConfirmation) {
    handleSkipConfirmation([value]);
  } else if (state.config.mode === "multi" && isSkipRequest(value)) {
    requestSkipTurn();
  } else {
    submitAnswer(value);
  }
});
elements.endGame.addEventListener("click", () => finishGame());
elements.playAgain.addEventListener("click", returnToSetup);
$(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  returnToSetup();
});
$("#decreasePlayers").addEventListener("click", () => {
  elements.playerCount.value = Math.max(2, Number(elements.playerCount.value) - 1);
});
$("#increasePlayers").addEventListener("click", () => {
  elements.playerCount.value = Math.min(6, Number(elements.playerCount.value) + 1);
});

window.addEventListener("online", checkConnection);
window.addEventListener("offline", checkConnection);
window.setInterval(checkConnection, 30000);

updateSetupFields();
updateNetworkBadge();
setupRecognition();
checkConnection();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
