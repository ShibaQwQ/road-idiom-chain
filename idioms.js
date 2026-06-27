import { MOE_IDIOM_ROWS } from "./moe-idioms.js";
import { MOE_PHRASE_ROWS } from "./moe-phrases.js";
import { MOE_MINI_PHRASE_ROWS } from "./moe-mini-phrases.js";

const CORE_IDIOMS = [
  { text: "一心一意", sounds: "yi4 xin1 yi2 yi4" },
  { text: "意氣風發", sounds: "yi4 qi4 feng1 fa1" },
  { text: "義正詞嚴", sounds: "yi4 zheng4 ci2 yan2" },
  { text: "易如反掌", sounds: "yi4 ru2 fan3 zhang3" },
  { text: "發揚光大", sounds: "fa1 yang2 guang1 da4" },
  { text: "大公無私", sounds: "da4 gong1 wu2 si1" },
  { text: "私心雜念", sounds: "si1 xin1 za2 nian4" },
  { text: "念念不忘", sounds: "nian4 nian4 bu4 wang4" },
  { text: "忘恩負義", sounds: "wang4 en1 fu4 yi4" },
  { text: "義不容辭", sounds: "yi4 bu4 rong2 ci2" },
  { text: "辭舊迎新", sounds: "ci2 jiu4 ying2 xin1" },
  { text: "新陳代謝", sounds: "xin1 chen2 dai4 xie4" },
  { text: "欣喜若狂", sounds: "xin1 xi3 ruo4 kuang2" },
  { text: "謝天謝地", sounds: "xie4 tian1 xie4 di4" },
  { text: "地久天長", sounds: "di4 jiu3 tian1 chang2" },
  { text: "長話短說", sounds: "chang2 hua4 duan3 shuo1" },
  { text: "常勝將軍", sounds: "chang2 sheng4 jiang1 jun1" },
  { text: "說三道四", sounds: "shuo1 san1 dao4 si4" },
  { text: "四通八達", sounds: "si4 tong1 ba1 da2" },
  { text: "達官貴人", sounds: "da2 guan1 gui4 ren2" },
  { text: "人山人海", sounds: "ren2 shan1 ren2 hai3" },
  { text: "海闊天空", sounds: "hai3 kuo4 tian1 kong1" },
  { text: "空前絕後", sounds: "kong1 qian2 jue2 hou4" },
  { text: "前所未有", sounds: "qian2 suo3 wei4 you3" },
  { text: "錢可通神", sounds: "qian2 ke3 tong1 shen2" },
  { text: "後來居上", sounds: "hou4 lai2 ju1 shang4" },
  { text: "厚德載物", sounds: "hou4 de2 zai4 wu4" },
  { text: "上行下效", sounds: "shang4 xing2 xia4 xiao4" },
  { text: "力不從心", sounds: "li4 bu4 cong2 xin1" },
  { text: "心想事成", sounds: "xin1 xiang3 shi4 cheng2" },
  { text: "成千上萬", sounds: "cheng2 qian1 shang4 wan4" },
  { text: "誠心誠意", sounds: "cheng2 xin1 cheng2 yi4" },
  { text: "萬事如意", sounds: "wan4 shi4 ru2 yi4" },
  { text: "意味深長", sounds: "yi4 wei4 shen1 chang2" },
  { text: "長驅直入", sounds: "chang2 qu1 zhi2 ru4" },
  { text: "入木三分", sounds: "ru4 mu4 san1 fen1" },
  { text: "分秒必爭", sounds: "fen1 miao3 bi4 zheng1" },
  { text: "爭先恐後", sounds: "zheng1 xian1 kong3 hou4" },
  { text: "後生可畏", sounds: "hou4 sheng1 ke3 wei4" },
  { text: "畏首畏尾", sounds: "wei4 shou3 wei4 wei3" },
  { text: "尾大不掉", sounds: "wei3 da4 bu4 diao4" },
  { text: "掉以輕心", sounds: "diao4 yi3 qing1 xin1" },
  { text: "心花怒放", sounds: "xin1 hua1 nu4 fang4" },
  { text: "放虎歸山", sounds: "fang4 hu3 gui1 shan1" },
  { text: "山明水秀", sounds: "shan1 ming2 shui3 xiu4" },
  { text: "秀外慧中", sounds: "xiu4 wai4 hui4 zhong1" },
  { text: "中流砥柱", sounds: "zhong1 liu2 di3 zhu4" },
  { text: "堅持不懈", sounds: "jian1 chi2 bu4 xie4" },
  { text: "水到渠成", sounds: "shui3 dao4 qu2 cheng2" },
  { text: "成竹在胸", sounds: "cheng2 zhu2 zai4 xiong1" },
  { text: "胸有成竹", sounds: "xiong1 you3 cheng2 zhu2" },
  { text: "竹報平安", sounds: "zhu2 bao4 ping2 an1" },
  { text: "安居樂業", sounds: "an1 ju1 le4 ye4" },
  { text: "業精於勤", sounds: "ye4 jing1 yu2 qin2" },
  { text: "勤能補拙", sounds: "qin2 neng2 bu3 zhuo1" },
  { text: "五湖四海", sounds: "wu3 hu2 si4 hai3" },
  { text: "海枯石爛", sounds: "hai3 ku1 shi2 lan4" },
  { text: "爛醉如泥", sounds: "lan4 zui4 ru2 ni2" },
  { text: "泥牛入海", sounds: "ni2 niu2 ru4 hai3" },
  { text: "海底撈針", sounds: "hai3 di3 lao1 zhen1" },
  { text: "針鋒相對", sounds: "zhen1 feng1 xiang1 dui4" },
  { text: "對答如流", sounds: "dui4 da2 ru2 liu2" },
  { text: "流芳百世", sounds: "liu2 fang1 bai3 shi4" },
  { text: "世外桃源", sounds: "shi4 wai4 tao2 yuan2" },
  { text: "源遠流長", sounds: "yuan2 yuan3 liu2 chang2" },
  { text: "長年累月", sounds: "chang2 nian2 lei4 yue4" },
  { text: "月明星稀", sounds: "yue4 ming2 xing1 xi1" },
  { text: "稀世之寶", sounds: "xi1 shi4 zhi1 bao3" },
  { text: "寶刀未老", sounds: "bao3 dao1 wei4 lao3" },
  { text: "老馬識途", sounds: "lao3 ma3 shi2 tu2" },
  { text: "途窮日暮", sounds: "tu2 qiong2 ri4 mu4" },
  { text: "暮鼓晨鐘", sounds: "mu4 gu3 chen2 zhong1" },
  { text: "鐘鳴鼎食", sounds: "zhong1 ming2 ding3 shi2" },
  { text: "食指大動", sounds: "shi2 zhi3 da4 dong4" },
  { text: "動人心弦", sounds: "dong4 ren2 xin1 xian2" },
  { text: "弦外之音", sounds: "xian2 wai4 zhi1 yin1" },
  { text: "音容笑貌", sounds: "yin1 rong2 xiao4 mao4" },
  { text: "貌合神離", sounds: "mao4 he2 shen2 li2" },
  { text: "離鄉背井", sounds: "li2 xiang1 bei4 jing3" },
  { text: "井井有條", sounds: "jing3 jing3 you3 tiao2" },
  { text: "條條大路", sounds: "tiao2 tiao2 da4 lu4" },
  { text: "路不拾遺", sounds: "lu4 bu4 shi2 yi2" },
  { text: "遺臭萬年", sounds: "yi2 chou4 wan4 nian2" },
  { text: "年富力強", sounds: "nian2 fu4 li4 qiang2" },
  { text: "強詞奪理", sounds: "qiang3 ci2 duo2 li3" },
  { text: "理直氣壯", sounds: "li3 zhi2 qi4 zhuang4" },
  { text: "里應外合", sounds: "li3 ying4 wai4 he2" },
  { text: "壯志凌雲", sounds: "zhuang4 zhi4 ling2 yun2" },
  { text: "雲開見日", sounds: "yun2 kai1 jian4 ri4" },
  { text: "日新月異", sounds: "ri4 xin1 yue4 yi4" },
  { text: "異想天開", sounds: "yi4 xiang3 tian1 kai1" },
  { text: "開門見山", sounds: "kai1 men2 jian4 shan1" },
  { text: "山高水長", sounds: "shan1 gao1 shui3 chang2" },
  { text: "長袖善舞", sounds: "chang2 xiu4 shan4 wu3" },
  { text: "舞文弄墨", sounds: "wu3 wen2 nong4 mo4" },
  { text: "墨守成規", sounds: "mo4 shou3 cheng2 gui1" },
  { text: "規行矩步", sounds: "gui1 xing2 ju3 bu4" },
  { text: "步步高升", sounds: "bu4 bu4 gao1 sheng1" },
  { text: "氣宇軒昂", sounds: "qi4 yu3 xuan1 ang2" },
  { text: "昂首闊步", sounds: "ang2 shou3 kuo4 bu4" },
  { text: "步調一致", sounds: "bu4 diao4 yi2 zhi4" },
  { text: "物換星移", sounds: "wu4 huan4 xing1 yi2" },
  { text: "移花接木", sounds: "yi2 hua1 jie1 mu4" },
  { text: "木已成舟", sounds: "mu4 yi3 cheng2 zhou1" },
  { text: "舟車勞頓", sounds: "zhou1 che1 lao2 dun4" },
  { text: "頓開茅塞", sounds: "dun4 kai1 mao2 se4" },
  { text: "塞翁失馬", sounds: "sai4 weng1 shi1 ma3" },
  { text: "馬到成功", sounds: "ma3 dao4 cheng2 gong1" },
  { text: "功成名就", sounds: "gong1 cheng2 ming2 jiu4" },
  { text: "公正無私", sounds: "gong1 zheng4 wu2 si1" },
  { text: "就事論事", sounds: "jiu4 shi4 lun4 shi4" },
  { text: "事半功倍", sounds: "shi4 ban4 gong1 bei4" },
  { text: "世代書香", sounds: "shi4 dai4 shu1 xiang1" },
  { text: "倍道而進", sounds: "bei4 dao4 er2 jin4" },
  { text: "進退兩難", sounds: "jin4 tui4 liang3 nan2" },
  { text: "難能可貴", sounds: "nan2 neng2 ke3 gui4" },
  { text: "貴人多忘", sounds: "gui4 ren2 duo1 wang4" },
  { text: "忘乎所以", sounds: "wang4 hu1 suo3 yi3" },
  { text: "以身作則", sounds: "yi3 shen1 zuo4 ze2" },
  { text: "別出心裁", sounds: "bie2 chu1 xin1 cai2" },
  { text: "裁長補短", sounds: "cai2 chang2 bu3 duan3" },
  { text: "短兵相接", sounds: "duan3 bing1 xiang1 jie1" },
  { text: "接二連三", sounds: "jie1 er4 lian2 san1" },
  { text: "三思而行", sounds: "san1 si1 er2 xing2" },
  { text: "行雲流水", sounds: "xing2 yun2 liu2 shui3" },
  { text: "水落石出", sounds: "shui3 luo4 shi2 chu1" },
  { text: "出人頭地", sounds: "chu1 ren2 tou2 di4" },
  { text: "地利人和", sounds: "di4 li4 ren2 he2" },
  { text: "和氣生財", sounds: "he2 qi4 sheng1 cai2" },
  { text: "財源廣進", sounds: "cai2 yuan2 guang3 jin4" },
  { text: "全力以赴", sounds: "quan2 li4 yi3 fu4" },
  { text: "赴湯蹈火", sounds: "fu4 tang1 dao3 huo3" },
  { text: "火樹銀花", sounds: "huo3 shu4 yin2 hua1" },
  { text: "花好月圓", sounds: "hua1 hao3 yue4 yuan2" },
  { text: "功德無量", sounds: "gong1 de2 wu2 liang4" },
  { text: "量力而行", sounds: "liang4 li4 er2 xing2" },
  { text: "名正言順", sounds: "ming2 zheng4 yan2 shun4" },
  { text: "明察秋毫", sounds: "ming2 cha2 qiu1 hao2" },
  { text: "順水推舟", sounds: "shun4 shui3 tui1 zhou1" },
  { text: "毫不猶豫", sounds: "hao2 bu4 you2 yu4" },
  { text: "心曠神怡", sounds: "xin1 kuang4 shen2 yi2" },
  { text: "怡然自得", sounds: "yi2 ran2 zi4 de2" },
  { text: "得心應手", sounds: "de2 xin1 ying1 shou3" },
  { text: "手到擒來", sounds: "shou3 dao4 qin2 lai2" },
  { text: "來日方長", sounds: "lai2 ri4 fang1 chang2" },
  { text: "千言萬語", sounds: "qian1 yan2 wan4 yu3" },
  { text: "言而有信", sounds: "yan2 er2 you3 xin4" },
  { text: "顏面掃地", sounds: "yan2 mian4 sao3 di4" },
  { text: "語重心長", sounds: "yu3 zhong4 xin1 chang2" },
  { text: "長治久安", sounds: "chang2 zhi4 jiu3 an1" },
  { text: "安然無恙", sounds: "an1 ran2 wu2 yang4" },
  { text: "風和日麗", sounds: "feng1 he2 ri4 li4" },
  { text: "天長地久", sounds: "tian1 chang2 di4 jiu3" },
  { text: "久別重逢", sounds: "jiu3 bie2 chong2 feng2" },
  { text: "逢凶化吉", sounds: "feng2 xiong1 hua4 ji2" },
  { text: "吉祥如意", sounds: "ji2 xiang2 ru2 yi4" },
  { text: "意猶未盡", sounds: "yi4 you2 wei4 jin4" },
  { text: "盡善盡美", sounds: "jin4 shan4 jin4 mei3" },
  { text: "美中不足", sounds: "mei3 zhong1 bu4 zu2" },
  { text: "足智多謀", sounds: "zu2 zhi4 duo1 mou2" },
  { text: "謀事在人", sounds: "mou2 shi4 zai4 ren2" },
  { text: "人定勝天", sounds: "ren2 ding4 sheng4 tian1" },
  { text: "天倫之樂", sounds: "tian1 lun2 zhi1 le4" },
  { text: "樂極生悲", sounds: "le4 ji2 sheng1 bei1" },
  { text: "悲歡離合", sounds: "bei1 huan1 li2 he2" },
  { text: "合情合理", sounds: "he2 qing2 he2 li3" },
  { text: "有始有終", sounds: "you3 shi3 you3 zhong1" },
  { text: "終身大事", sounds: "zhong1 shen1 da4 shi4" },
  { text: "事與願違", sounds: "shi4 yu3 yuan4 wei2" },
  { text: "違心之論", sounds: "wei2 xin1 zhi1 lun4" },
  { text: "論功行賞", sounds: "lun4 gong1 xing2 shang3" },
  { text: "賞心悅目", sounds: "shang3 xin1 yue4 mu4" },
  { text: "目不轉睛", sounds: "mu4 bu4 zhuan3 jing1" },
  { text: "道聽塗說", sounds: "dao4 ting1 tu2 shuo1" },
  { text: "到此為止", sounds: "dao4 ci3 wei4 zhi3" },
  { text: "生龍活虎", sounds: "sheng1 long2 huo2 hu3" },
  { text: "聲東擊西", sounds: "sheng1 dong1 ji1 xi1" }
].map((idiom) => ({ ...idiom, sounds: idiom.sounds.split(" ") }));

const TONE_MARKS = new Map([
  ["\u0304", 1],
  ["\u0301", 2],
  ["\u030c", 3],
  ["\u0300", 4]
]);

function toToneKey(syllable) {
  let base = "";
  let tone = 5;
  for (const character of syllable.toLowerCase().normalize("NFD")) {
    if (TONE_MARKS.has(character)) {
      tone = TONE_MARKS.get(character);
    } else if (character === "\u0308" && base.endsWith("u")) {
      base = `${base.slice(0, -1)}v`;
    } else if (/^[a-z]$/.test(character)) {
      base += character;
    }
  }
  return base ? `${base}${tone}` : null;
}

function fromMoeRow([text, pinyin], kind, source) {
  const sounds = pinyin
    .split(/（[^）]+）/)
    .map((variant) => variant.trim().split(/\s+/).map(toToneKey).filter(Boolean))
    .find((variant) => variant.length === 4);
  return sounds ? { text, sounds, kind, source } : null;
}

const idiomsByText = new Map();
for (const row of MOE_IDIOM_ROWS) {
  const idiom = fromMoeRow(row, "idiom", "idioms");
  if (idiom) idiomsByText.set(idiom.text, idiom);
}
for (const idiom of CORE_IDIOMS) {
  if (!idiomsByText.has(idiom.text)) idiomsByText.set(idiom.text, { ...idiom, kind: "idiom", source: "core" });
}
for (const row of MOE_PHRASE_ROWS) {
  if (idiomsByText.has(row[0])) continue;
  const phrase = fromMoeRow(row, "phrase", row[2]);
  if (phrase) idiomsByText.set(phrase.text, phrase);
}
for (const [text, sounds] of MOE_MINI_PHRASE_ROWS) {
  if (!idiomsByText.has(text)) idiomsByText.set(text, { text, sounds, kind: "phrase", source: "mini" });
}

const manualPhrases = [
  { text: "搜盡枯腸", sounds: ["sou1", "jin4", "ku1", "chang2"], kind: "phrase", source: "core" }
];
for (const phrase of manualPhrases) {
  if (!idiomsByText.has(phrase.text)) idiomsByText.set(phrase.text, phrase);
}

export const IDIOMS = [...idiomsByText.values()];

const starterCounts = new Map();
for (const idiom of IDIOMS) {
  if (idiom.kind !== "idiom") continue;
  starterCounts.set(idiom.text[0], (starterCounts.get(idiom.text[0]) ?? 0) + 1);
}

const starterGroups = new Map();
for (const idiom of IDIOMS) {
  const target = idiom.text.at(-1);
  if (idiom.kind !== "idiom" || (starterCounts.get(target) ?? 0) < 3) continue;
  if (!starterGroups.has(target)) starterGroups.set(target, []);
  starterGroups.get(target).push(idiom.text);
}

export const STARTER_GROUPS = [...starterGroups.values()];
export const STARTERS = STARTER_GROUPS.flat();

export function chooseRandomStarter(random = Math.random) {
  const group = STARTER_GROUPS[Math.floor(random() * STARTER_GROUPS.length)];
  return group[Math.floor(random() * group.length)];
}
