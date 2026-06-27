import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { IDIOMS, STARTERS, STARTER_GROUPS, chooseRandomStarter } from "../idioms.js";
import { chooseAiReply, createFreePhrase, createPlayers, findIdiom, findPhoneticMatches, getAnswerConfirmation, getSkipConfirmation, isSkipRequest, normalizeSpeech, scoreAnswer } from "../game.js";

const idiom = (text) => IDIOMS.find((item) => item.text === text);

test("位置積分賽依字首、同音與其他位置計算 3／2／1／0 分", () => {
  const previous = idiom("一心一意");
  assert.deepEqual(scoreAnswer(previous, idiom("意氣風發"), "score").points, 3);
  assert.deepEqual(scoreAnswer(previous, idiom("義正詞嚴"), "score").points, 2);
  assert.deepEqual(scoreAnswer(previous, idiom("萬事如意"), "score").points, 1);
  assert.deepEqual(scoreAnswer(previous, idiom("人山人海"), "score").points, 0);
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
  assert.ok(IDIOMS.length > 37000);
  assert.deepEqual(idiom("美輪美奐").sounds, ["mei3", "lun2", "mei3", "huan4"]);
  assert.deepEqual(idiom("美不勝收").sounds, ["mei3", "bu4", "sheng1", "shou1"]);
});

test("教育部一般辭典補充四字詞，位置積分最高一分", () => {
  const examples = ["食髓知味", "說文解字", "共體時艱", "烈日當空", "索盡枯腸"];
  for (const text of examples) assert.ok(idiom(text), `${text} 應存在`);
  assert.equal(idiom("說文解字").kind, "phrase");
  assert.equal(scoreAnswer(idiom("道聽塗說"), idiom("說文解字"), "score").points, 1);
});

test("詞庫外的任意四個中文字也能接龍且最高一分", () => {
  const freePhrase = createFreePhrase("說話真好");
  assert.equal(freePhrase.text, "說話真好");
  assert.equal(freePhrase.source, "free");
  assert.equal(scoreAnswer(idiom("道聽塗說"), freePhrase, "score").points, 1);
  assert.equal(scoreAnswer(idiom("道聽塗說"), freePhrase, "exact").valid, true);
  assert.equal(createFreePhrase("三個字"), null);
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
  assert.match(serviceWorker, /fetch\(event\.request\)[\s\S]*?\.catch/);
  assert.doesNotMatch(serviceWorker.match(/APP_FILES = \[[\s\S]*?\];/)?.[0] ?? "", /online-check\.txt/);
});
