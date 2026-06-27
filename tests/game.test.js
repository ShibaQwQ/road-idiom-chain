import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { IDIOMS, STARTERS, STARTER_GROUPS, chooseRandomStarter } from "../idioms.js";
import { MOE_IDIOM_ROWS } from "../moe-idioms.js";
import { MOE_MINI_PHRASE_ROWS } from "../moe-mini-phrases.js";
import { chooseAiReply, createPlayers, findIdiom, findPhoneticMatches, getAnswerConfirmation, getSkipConfirmation, isSkipRequest, normalizeSpeech, scoreAnswer } from "../game.js";

const idiom = (text) => IDIOMS.find((item) => item.text === text);

test("位置積分賽依字首、同音與其他位置計算 3／2／1 分，拒絕無關答案", () => {
  const previous = idiom("一心一意");
  assert.deepEqual(scoreAnswer(previous, idiom("意氣風發"), "score").points, 3);
  assert.deepEqual(scoreAnswer(previous, idiom("義正詞嚴"), "score").points, 2);
  assert.deepEqual(scoreAnswer(previous, idiom("萬事如意"), "score").points, 1);
  assert.deepEqual(scoreAnswer(previous, idiom("人山人海"), "score"), { valid: false, points: 0, reason: "沒有接到目標音" });
});

test("同字與同音模式使用不同驗證規則", () => {
  const previous = idiom("一心一意");
  assert.equal(scoreAnswer(previous, idiom("義正詞嚴"), "exact").valid, false);
  assert.equal(scoreAnswer(previous, idiom("義正詞嚴"), "sound").valid, true);
  assert.equal(scoreAnswer(previous, idiom("意氣風發"), "exact").valid, true);
});

test("語音答案可移除引導詞與標點", () => {
  assert.equal(normalizeSpeech("答案是，馬到成功。"), "馬到成功");
  assert.equal(findIdiom("我接：馬到成功")?.text, "馬到成功");
});

test("完整成語庫包含指定條目與正確讀音", () => {
  assert.equal(IDIOMS.length, 39788);
  assert.deepEqual(idiom("美輪美奐").sounds, ["mei3", "lun2", "mei3", "huan4"]);
  assert.deepEqual(idiom("美不勝收").sounds, ["mei3", "bu4", "sheng1", "shou1"]);
});

test("國語小字典補充兒童常用四字例詞，仍依一般四字詞計一分", () => {
  assert.equal(MOE_MINI_PHRASE_ROWS.length, 5088);
  assert.equal(new Set(MOE_MINI_PHRASE_ROWS.map(([text]) => text)).size, 5088);
  assert.ok(MOE_MINI_PHRASE_ROWS.every(([text, sounds]) => text.length === 4 && sounds.length === 4 && sounds.every(Boolean)));
  for (const text of ["漂洋過海", "雀躍不已", "年過半百", "萬眾歸心"]) {
    assert.equal(idiom(text)?.source, "mini", `${text} 應由國語小字典補入`);
  }
  const phrase = idiom("漂洋過海");
  const previous = { text: "水漂", sounds: ["shui3", phrase.sounds[0]], kind: "idiom" };
  assert.equal(scoreAnswer(previous, phrase, "score").points, 1);
  assert.equal(findIdiom("太油膩一"), undefined);
});

test("成語典全部條目皆分類為成語，字首同字固定得三分", () => {
  const byText = new Map(IDIOMS.map((entry) => [entry.text, entry]));
  for (const [text] of MOE_IDIOM_ROWS) {
    const entry = byText.get(text);
    assert.equal(entry?.kind, "idiom", `${text} 應分類為成語`);
    const previous = { text: `接${text[0]}`, sounds: ["jie1", entry.sounds[0]], kind: "idiom" };
    assert.equal(scoreAnswer(previous, entry, "score").points, 3, `${text} 字首同字應得三分`);
  }
  assert.equal(byText.get("難兄難弟")?.kind, "idiom");
});

test("教育部一般辭典補充四字詞，位置積分最高一分", () => {
  const examples = ["食髓知味", "說文解字", "共體時艱", "烈日當空", "索盡枯腸"];
  for (const text of examples) assert.ok(idiom(text), `${text} 應存在`);
  assert.equal(idiom("說文解字").kind, "phrase");
  assert.equal(scoreAnswer(idiom("道聽塗說"), idiom("說文解字"), "score").points, 1);
});

test("擴充詞庫接受常用四字詞，拒絕隨意拼湊的四個字", () => {
  for (const text of ["說文解字", "四海一家", "天下為公"]) assert.ok(findIdiom(text));
  for (const text of ["打開刪除", "除二畢竟", "義工畢竟", "竟敢如此", "此地無名"]) assert.equal(findIdiom(text), undefined);
});

test("語音同音錯字能找到正確四字詞候選", () => {
  assert.ok(findPhoneticMatches("十指大動").some((item) => item.text === "食指大動"));
  assert.ok(findPhoneticMatches("供體時艱").some((item) => item.text === "共體時艱"));
  assert.equal(getAnswerConfirmation(["確定"]), "confirm");
  assert.equal(getAnswerConfirmation(["不是"]), "reject");
});

test("隨機開局候選不再固定為少數幾個詞", () => {
  assert.ok(STARTERS.length > 1000);
  assert.ok(STARTER_GROUPS.length > 100);
  assert.equal(new Set(STARTER_GROUPS.map((group) => group[0].at(-1))).size, STARTER_GROUPS.length);
  assert.ok(chooseRandomStarter(() => 0));
});

test("多人放棄必須二次確認，也可以取消", () => {
  assert.equal(isSkipRequest("放棄"), true);
  assert.equal(getSkipConfirmation(["旁邊有人說話"]), null);
  assert.equal(getSkipConfirmation(["確定"]), "confirm");
  assert.equal(getSkipConfirmation(["取消"]), "cancel");
});

test("三種 AI 難度都只會選未使用且符合規則的成語", () => {
  const previous = idiom("一心一意");
  const used = new Set([previous.text]);
  for (const difficulty of ["easy", "normal", "hard"]) {
    const reply = chooseAiReply(previous, "sound", difficulty, used, IDIOMS, () => 0);
    assert.ok(reply);
    assert.equal(used.has(reply.text), false);
    assert.equal(scoreAnswer(previous, reply, "sound").valid, true);
  }
  const scoreReply = chooseAiReply(previous, "score", "easy", used, [idiom("意氣風發"), idiom("人山人海")], () => 0);
  assert.equal(scoreReply.text, "意氣風發");
  assert.equal(scoreAnswer(previous, scoreReply, "score").valid, true);
});

test("單人建立玩家與 AI，多人依指定數量建立乘客", () => {
  assert.deepEqual(createPlayers("solo", 2).map((player) => player.ai), [false, true]);
  assert.equal(createPlayers("multi", 6).length, 6);
});

test("PWA 圖示與離線快取設定完整，連線檢查檔不進快取", async () => {
  const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["192x192", "512x512"]);
  await Promise.all([
    access(new URL("../icons/app-icon-192.png", import.meta.url)),
    access(new URL("../icons/app-icon-512.png", import.meta.url)),
    access(new URL("../icons/apple-touch-icon.png", import.meta.url))
  ]);
  assert.match(serviceWorker, /icons\/apple-touch-icon\.png/);
  assert.match(serviceWorker, /moe-idioms\.js/);
  assert.match(serviceWorker, /moe-phrases\.js/);
  assert.match(serviceWorker, /moe-mini-phrases\.js/);
  await access(new URL("../licenses/MOE-mini-usage.pdf", import.meta.url));
  assert.match(serviceWorker, /fetch\(event\.request\)[\s\S]*?\.catch/);
  assert.doesNotMatch(serviceWorker.match(/APP_FILES = \[[\s\S]*?\];/)?.[0] ?? "", /online-check\.txt/);
});

test("語音提示採短句朗讀完再收音，避免系統聽到自己", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /function speakThenListen\(message\)\s*{\s*speak\(message, startListening\);/);
  assert.match(app, /請出題/);
  assert.doesNotMatch(app, /preserveSpeech|createFreePhrase/);
});
