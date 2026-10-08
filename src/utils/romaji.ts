// Maps Hiragana and Katakana characters and combinations to spaced Romaji syllables
const KANA_MAP: Record<string, string> = {
  // Hiragana vowels & gojuon
  "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
  "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
  "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
  "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
  "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
  "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
  "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
  "や": "ya", "ゆ": "yu", "よ": "yo",
  "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
  "わ": "wa", "を": "wo", "ん": "n",

  // Hiragana dakuon & handakuon
  "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
  "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
  "だ": "da", "ぢ": "ji", "づ": "zu", "で": "de", "ど": "do",
  "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
  "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",

  // Katakana equivalents
  "ア": "a", "イ": "i", "ウ": "u", "エ": "e", "オ": "o",
  "カ": "ka", "キ": "ki", "ク": "ku", "ケ": "ke", "コ": "ko",
  "サ": "sa", "シ": "shi", "ス": "su", "セ": "se", "ソ": "so",
  "タ": "ta", "チ": "chi", "ツ": "tsu", "テ": "te", "ト": "to",
  "ナ": "na", "ニ": "ni", "ヌ": "nu", "ネ": "ne", "ノ": "no",
  "ハ": "ha", "ヒ": "hi", "フ": "fu", "\u30D8": "he", "ホ": "ho",
  "マ": "ma", "ミ": "mi", "ム": "mu", "メ": "me", "モ": "mo",
  "ヤ": "ya", "ユ": "yu", "ヨ": "yo",
  "ラ": "ra", "リ": "ri", "ル": "ru", "レ": "re", "ロ": "ro",
  "ワ": "wa", "ヲ": "wo", "ン": "n",

  "ガ": "ga", "ギ": "gi", "グ": "gu", "ゲ": "ge", "ゴ": "go",
  "ザ": "za", "ジ": "ji", "ズ": "zu", "ゼ": "ze", "ゾ": "zo",
  "ダ": "da", "ヂ": "ji", "ヅ": "zu", "デ": "de", "ド": "do",
  "バ": "ba", "ビ": "bi", "ブ": "bu", "ベ": "be", "ボ": "bo",
  "パ": "pa", "ピ": "pi", "プ": "pu", "ペ": "pe", "ポ": "po",
};

// Digraph combinations (youon)
const DIGRAPHS: Record<string, string> = {
  // Hiragana digraphs
  "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
  "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
  "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
  "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
  "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
  "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
  "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
  "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
  "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
  "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
  "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",

  // Katakana digraphs
  "キャ": "kya", "キュ": "kyu", "キョ": "kyo",
  "シャ": "sha", "シュ": "shu", "ショ": "sho",
  "チャ": "cha", "チュ": "chu", "チョ": "cho",
  "ニャ": "nya", "ニュ": "nyu", "ニョ": "nyo",
  "ヒャ": "hya", "ヒュ": "hyu", "ヒョ": "hyo",
  "ミャ": "mya", "ミュ": "myu", "ミョ": "myo",
  "リャ": "rya", "リュ": "ryu", "リョ": "ryo",
  "ギャ": "gya", "ギュ": "gyu", "ギョ": "gyo",
  "ジャ": "ja", "ジュ": "ju", "ジョ": "jo",
  "ビャ": "bya", "ビュ": "byu", "ビョ": "byo",
  "ピャ": "pya", "ピュ": "pyu", "ピョ": "pyo",
};

/**
 * Checks whether text contains Japanese characters (Hiragana, Katakana, or Kanji).
 */
export function isJapanese(text?: string | null): boolean {
  if (!text) return false;
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

// Curated readings for common words, particles, and greetings (e.g. こんばんは -> ko n ba n wa)
const SPECIAL_WORD_READINGS: Record<string, string> = {
  "こんにちは": "ko n ni chi wa",
  "こんばんは": "ko n ba n wa",
  "さようなら": "sa yo u na ra",
  "おやすみなさい": "o ya su mi na sa i",
  "おやすみ": "o ya su mi",
  "ありがとう": "a ri ga to u",
  "ありがとうございます": "a ri ga to u go za i ma su",
  "どういたしまして": "do u i ta shi ma shi te",
  "いただきます": "i ta da ki ma su",
  "ごちそうさま": "go chi so u sa ma",
  "すみません": "su mi ma se n",
  "おいしい": "o i shi i",
  "これ": "ko re",
  "ください": "ku da sa i",
  "おねがいします": "o ne ga i shi ma su",
  "おかいけい": "o ka i ke i",
  "ふたり": "fu ta ri",
  "とても": "to te mo",
  "です": "de su",
  "そうです": "so u de su",
  "ちがいます": "chi ga i ma su",
  "ねこ": "ne ko",
  "いぬ": "i nu",
  "とり": "to ri",
  "みず": "mi zu",
  "おみず": "o mi zu",
  "りんご": "ri n go",
  "ごはん": "go ha n",
  "おちゃ": "o cha",
  "さかな": "sa ka na",
  "にく": "ni ku",
  "やさい": "ya sa i",
  "あかい": "a ka i",
  "コーヒー": "ko o hi i",
  "ミルク": "mi ru ku",
};

const SPECIAL_CONTINUOUS_ROMAJI: Record<string, string> = {
  "こんにちは": "konnichiwa",
  "こんばんは": "konbanwa",
  "さようなら": "sayounara",
  "おやすみなさい": "oyasuminasai",
  "おやすみ": "oyasumi",
  "ありがとう": "arigatou",
  "ありがとうございます": "arigatou gozaimasu",
  "どういたしまして": "douitashimashite",
  "いただきます": "itadakimasu",
  "ごちそうさま": "gochisousama",
  "すみません": "sumimasen",
};

/**
 * Generates spaced Romaji reading matching Duolingo's furigana style:
 * E.g.:
 * "がくせい" -> "ga ku se i"
 * "ください" -> "ku da sa i"
 * "ひと" -> "hi to"
 * "せんせい" -> "se n se i"
 * "いしゃ" -> "i sha"
 */
export function getRomajiReading(text?: string | null): string | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) return null;

  // Direct special dictionary lookup
  if (SPECIAL_WORD_READINGS[trimmed]) {
    return SPECIAL_WORD_READINGS[trimmed];
  }

  // Handle multi-word strings separated by spaces
  if (trimmed.includes(" ") || trimmed.includes("　")) {
    const parts = trimmed.split(/[\s　]+/);
    const mapped = parts.map((p) => getRomajiReading(p) || p);
    return mapped.join(" ");
  }

  const syllables: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    // 1. Check 2-character digraphs first (e.g. しゃ -> sha)
    if (i + 1 < trimmed.length) {
      const two = trimmed.slice(i, i + 2);
      if (DIGRAPHS[two]) {
        syllables.push(DIGRAPHS[two]);
        i += 2;
        continue;
      }
    }

    const ch = trimmed[i];

    // 2. Sokuon っ / ッ (geminated double consonant)
    if ((ch === "っ" || ch === "ッ") && i + 1 < trimmed.length) {
      const nextOne = trimmed[i + 1];
      const nextRomaji = KANA_MAP[nextOne] || DIGRAPHS[trimmed.slice(i + 1, i + 3)] || "";
      if (nextRomaji) {
        syllables.push(nextRomaji[0]);
      }
      i++;
      continue;
    }

    // 3. Long vowel prolongation mark ー (e.g. コーヒー -> ko o hi i)
    if (ch === "ー" && syllables.length > 0) {
      const last = syllables[syllables.length - 1];
      const lastVowel = last[last.length - 1];
      syllables.push(lastVowel);
      i++;
      continue;
    }

    // 4. Single kana character
    if (KANA_MAP[ch]) {
      syllables.push(KANA_MAP[ch]);
    } else if (!/\s/.test(ch)) {
      // Ignore punctuation or non-kana
    }
    i++;
  }

  return syllables.length > 0 ? syllables.join(" ") : null;
}

/**
 * Converts Japanese text (Hiragana/Katakana) into clean, natural continuous Romaji words:
 * E.g. "あかい りんご" -> "akai ringo"
 * "おはよう" -> "ohayou"
 */
export function toRomaji(text?: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (SPECIAL_CONTINUOUS_ROMAJI[trimmed]) {
    return SPECIAL_CONTINUOUS_ROMAJI[trimmed];
  }
  let res = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === " " || text[i] === "　") {
      res += " ";
      i++;
      continue;
    }
    // Check 2-char digraphs
    if (i + 1 < text.length) {
      const two = text.slice(i, i + 2);
      if (DIGRAPHS[two]) {
        res += DIGRAPHS[two];
        i += 2;
        continue;
      }
    }
    const ch = text[i];
    // Sokuon っ / ッ
    if ((ch === "っ" || ch === "ッ") && i + 1 < text.length) {
      const nextOne = text[i + 1];
      const nextRomaji = KANA_MAP[nextOne] || DIGRAPHS[text.slice(i + 1, i + 3)] || "";
      if (nextRomaji) {
        res += nextRomaji[0];
      }
      i++;
      continue;
    }
    // Prolongation mark ー
    if (ch === "ー" && res.length > 0) {
      const last = res[res.length - 1];
      res += last;
      i++;
      continue;
    }
    // Single kana
    if (KANA_MAP[ch]) {
      res += KANA_MAP[ch];
    } else {
      res += ch;
    }
    i++;
  }
  return res.replace(/\s+/g, " ").trim();
}

const ROMAJI_TO_HIRAGANA_TABLE: Record<string, string> = {
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "myu: みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "gyu: ぎゅ", gyo: "ぎょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  tsu: "つ", shi: "し", chi: "ち",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", si: "し", su: "す", se: "せ", so: "そ",
  ta: "た", ti: "ち", tu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "mo",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "pi: ぴ", pu: "ぷ", pe: "ぺ", po: "po",
  ja: "じゃ", ju: "じゅ", jo: "じょ",
  nn: "ん",
  a: "あ", i: "い", u: "う", e: "え", o: "お"
};

/**
 * Converts Romaji string into Hiragana characters:
 * E.g. "akai ringo" -> "あかい りんご"
 * "akai ingo" -> "あかい いんご"
 * "sumimasen" -> "すみません"
 */
export function toHiragana(romaji?: string | null): string {
  if (!romaji) return "";
  const s = romaji.toLowerCase();
  const res: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === " ") {
      res.push(" ");
      i++;
      continue;
    }
    // Double consonant for sokuon っ (except 'n')
    if (i + 1 < s.length && s[i] === s[i + 1] && !"aeioun".includes(s[i])) {
      res.push("っ");
      i++;
      continue;
    }
    let matched = false;
    for (const len of [3, 2, 1]) {
      const sub = s.slice(i, i + len);
      if (ROMAJI_TO_HIRAGANA_TABLE[sub]) {
        res.push(ROMAJI_TO_HIRAGANA_TABLE[sub]);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (s[i] === "n") {
        res.push("ん");
        i++;
      } else {
        res.push(s[i]);
        i++;
      }
    }
  }
  return res.join("");
}

