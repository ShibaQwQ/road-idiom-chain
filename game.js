import { IDIOMS } from "./idioms.js";

export const RULES = {
  exact: "同字接龍",
  sound: "同音接龍",
  score: "位置積分賽"
};

export function normalizeSpeech(value) {
  return value.replace(/[，。！？、,.!?\s]/g, "").replace(/^(我接|答案是|成語是)/, "");
}

export function findIdiom(value, idioms = IDIOMS) {
  const normalized = normalizeSpeech(value);
  return idioms.find((idiom) => idiom.text === normalized)
    || idioms.find((idiom) => normalized.includes(idiom.text));
}

export function scoreAnswer(previous, candidate, rule) {
  const targetIndex = previous.text.length - 1;
  const targetCharacter = previous.text[targetIndex];
  const targetSound = previous.sounds[targetIndex];
  const firstCharacterMatches = candidate.text[0] === targetCharacter;
  const firstSoundMatches = candidate.sounds[0] === targetSound;

  if (rule === "exact") {
    return { valid: firstCharacterMatches, points: firstCharacterMatches ? 1 : 0, reason: firstCharacterMatches ? "同字接龍" : "字首不同" };
  }

  if (rule === "sound") {
    const valid = firstCharacterMatches || firstSoundMatches;
    return { valid, points: valid ? 1 : 0, reason: firstCharacterMatches ? "同字接龍" : firstSoundMatches ? "同音接龍" : "字首不同音" };
  }

  if (firstCharacterMatches) return { valid: true, points: 3, reason: "同字在字首" };
  if (firstSoundMatches) return { valid: true, points: 2, reason: "同音字在字首" };

  const laterMatch = [...candidate.text].some((character, index) =>
    index > 0 && (character === targetCharacter || candidate.sounds[index] === targetSound)
  );
  return { valid: true, points: laterMatch ? 1 : 0, reason: laterMatch ? "同字或同音字在其他位置" : "沒有接到目標音" };
}

export function availableReplies(previous, rule, used, idioms = IDIOMS) {
  return idioms.filter((idiom) => !used.has(idiom.text) && (rule === "score" || scoreAnswer(previous, idiom, rule).valid));
}

function replyCount(candidate, rule, used, idioms) {
  const nextUsed = new Set(used);
  nextUsed.add(candidate.text);
  return availableReplies(candidate, rule, nextUsed, idioms)
    .filter((idiom) => rule !== "score" || scoreAnswer(candidate, idiom, rule).points > 0)
    .length;
}

export function chooseAiReply(previous, rule, difficulty, used, idioms = IDIOMS, random = Math.random) {
  const candidates = availableReplies(previous, rule, used, idioms);
  if (!candidates.length) return null;

  const ranked = candidates.map((idiom) => ({
    idiom,
    points: scoreAnswer(previous, idiom, rule).points,
    exits: replyCount(idiom, rule, used, idioms)
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
