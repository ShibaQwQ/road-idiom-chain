import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { IDIOMS } from "../idioms.js";
import { chooseAiReply, createPlayers, findIdiom, normalizeSpeech, scoreAnswer } from "../game.js";

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
  assert.doesNotMatch(serviceWorker.match(/APP_FILES = \[[\s\S]*?\];/)?.[0] ?? "", /online-check\.txt/);
});
