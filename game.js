import { IDIOMS } from "./idioms.js";

export const RULES = {
  exact: "同字接龍",
  sound: "同音接龍",
  score: "位置積分賽"
};

export function normalizeSpeech(value) {
  return value.replace(/[，。！？、：,.!?:\s]/g, "").replace(/^(我接|答案是|成語是|我說|我要接|我講)/, "");
}

function extractFourCharacters(value) {
  const characters = normalizeSpeech(value).match(/[\u3400-\u9fff]/g) ?? [];
  return characters.length === 4 ? characters.join("") : null;
}

export function isSkipRequest(value) {
  return /^(放棄|放弃)$/.test(normalizeSpeech(value));
}

export function getSkipConfirmation(values) {
  const normalized = values.map(normalizeSpeech);
  if (normalized.some((value) => /^(確定|确定|確認|确认|是|是的)$/.test(value))) return "confirm";
  if (normalized.some((value) => /^(取消|不要|繼續|继续)$/.test(value))) return "cancel";
  return null;
}

export function getAnswerConfirmation(values) {
  const normalized = values.map(normalizeSpeech);
  if (normalized.some((value) => /^(確定|确定|是|是的|對|没錯|沒錯)$/.test(value))) return "confirm";
  if (normalized.some((value) => /^(不是|不對|不对|下一個|下一个|取消)$/.test(value))) return "reject";
  return null;
}

export function findIdiom(value, idioms = IDIOMS) {
  const normalized = normalizeSpeech(value);
  return idioms.find((idiom) => idiom.text === normalized);
}

const characterSounds = new Map();
for (const idiom of IDIOMS) {
  [...idiom.text].forEach((character, index) => {
    if (!characterSounds.has(character)) characterSounds.set(character, new Set());
    characterSounds.get(character).add(idiom.sounds[index]);
  });
}

export function findPhoneticMatches(value, idioms = IDIOMS) {
  const text = extractFourCharacters(value);
  if (!text) return [];
  const characters = [...text];
  const soundOptions = characters.map((character) => characterSounds.get(character) ?? new Set());
  const evaluated = idioms.map((idiom) => {
    const soundMismatches = idiom.sounds.reduce((count, sound, index) => count + (soundOptions[index].has(sound) ? 0 : 1), 0);
    const characterMatches = [...idiom.text].reduce((count, character, index) => count + (characters[index] === character ? 1 : 0), 0);
    return { idiom, soundMismatches, characterMatches };
  });
  const exactSound = evaluated
    .filter((item) => item.soundMismatches === 0 && item.characterMatches >= 2)
    .map((item) => item.idiom);
  if (exactSound.length) return exactSound;
  return evaluated
    .filter((item) => item.soundMismatches <= 1 && item.characterMatches >= 3)
    .map((item) => item.idiom);
}

function soundsAt(entry, index) {
  const options = entry.soundOptions?.[index] ?? [];
  const primary = entry.sounds?.[index];
  return new Set(primary ? [...options, primary] : options);
}

function soundsMatch(first, firstIndex, second, secondIndex) {
  const firstSounds = soundsAt(first, firstIndex);
  return [...soundsAt(second, secondIndex)].some((sound) => firstSounds.has(sound));
}

export function scoreAnswer(previous, candidate, rule) {
  const targetIndex = previous.text.length - 1;
  const targetCharacter = previous.text[targetIndex];
  const firstCharacterMatches = candidate.text[0] === targetCharacter;
  const firstSoundMatches = soundsMatch(previous, targetIndex, candidate, 0);

  if (rule === "exact") {
    return { valid: firstCharacterMatches, points: firstCharacterMatches ? 1 : 0, reason: firstCharacterMatches ? "同字接龍" : "字首不同" };
  }

  if (rule === "sound") {
    const valid = firstCharacterMatches || firstSoundMatches;
    return { valid, points: valid ? 1 : 0, reason: firstCharacterMatches ? "同字接龍" : firstSoundMatches ? "同音接龍" : "字首不同音" };
  }

  if (candidate.kind === "phrase") {
    const matched = [...candidate.text].some((character, index) => character === targetCharacter || soundsMatch(previous, targetIndex, candidate, index));
    return { valid: matched, points: matched ? 1 : 0, reason: matched ? "四字詞語接到目標字音" : "沒有接到目標音" };
  }

  if (firstCharacterMatches) return { valid: true, points: 3, reason: "同字在字首" };
  if (firstSoundMatches) return { valid: true, points: 2, reason: "同音字在字首" };

  const laterMatch = [...candidate.text].some((character, index) =>
    index > 0 && (character === targetCharacter || soundsMatch(previous, targetIndex, candidate, index))
  );
  return { valid: laterMatch, points: laterMatch ? 1 : 0, reason: laterMatch ? "同字或同音字在其他位置" : "沒有接到目標音" };
}

export function availableReplies(previous, rule, used, idioms = IDIOMS) {
  return idioms.filter((idiom) => !used.has(idiom.text) && scoreAnswer(previous, idiom, rule).valid);
}

function replyCount(candidate, rule, used, idioms) {
  const nextUsed = new Set(used);
  nextUsed.add(candidate.text);
  return availableReplies(candidate, rule, nextUsed, idioms)
    .filter((idiom) => rule !== "score" || scoreAnswer(candidate, idiom, rule).points > 0)
    .length;
}

export function chooseAiReply(previous, rule, difficulty, used, idioms = IDIOMS, random = Math.random) {
  const aiIdioms = idioms.filter((idiom) => idiom.kind !== "phrase");
  const candidates = availableReplies(previous, rule, used, aiIdioms);
  if (!candidates.length) return null;

  const scoredCandidates = candidates.map((idiom) => ({ idiom, points: scoreAnswer(previous, idiom, rule).points }));
  const positiveCandidates = scoredCandidates.filter((item) => item.points > 0);
  const strategicCandidates = positiveCandidates.length ? positiveCandidates : scoredCandidates;
  const ranked = strategicCandidates.map(({ idiom, points }) => ({
    idiom,
    points,
    exits: replyCount(idiom, rule, used, aiIdioms)
  }));

  if (difficulty === "easy") {
    const useful = ranked.filter((item) => item.points > 0);
    const pool = (useful.length ? useful : ranked).sort((a, b) => b.exits - a.exits);
    return pool[Math.floor(random() * Math.max(1, Math.ceil(pool.length / 2)))].idiom;
  }

  const bestScore = Math.max(...ranked.map((item) => item.points));
  const scoring = ranked.filter((item) => item.points === bestScore);
  if (difficulty === "normal") return scoring[Math.floor(random() * scoring.length)].idiom;

  const fewestExits = Math.min(...scoring.map((item) => item.exits));
  const strongest = scoring.filter((item) => item.exits === fewestExits);
  return strongest[Math.floor(random() * strongest.length)].idiom;
}

export function createPlayers(mode, count) {
  if (mode === "solo") return [{ name: "你", score: 0, ai: false }, { name: "AI", score: 0, ai: true }];
  return Array.from({ length: count }, (_, index) => ({ name: `玩家 ${index + 1}`, score: 0, ai: false }));
}
