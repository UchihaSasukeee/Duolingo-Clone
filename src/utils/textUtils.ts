import { isJapanese, toRomaji, toHiragana } from "./romaji";

/**
 * Calculates Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Normalizes user answer and target text for fair, robust comparison:
 * - Accents / Diacritics: ñ -> n, é -> e, ü -> u, etc.
 * - German eszett: ß -> ss
 * - Common punctuation: ¡!¿?.,'"~`:;() - etc.
 * - Whitespace: trimmed and collapsed
 */
export function normalizeAnswer(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .replace(/ß/g, "ss")
    .replace(/[¿?¡!.,'"`~;:()\-«»、。！？]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects if the answer is correct but missing accents/diacritics
 * (e.g. user typed "el nino" when target is "el niño").
 */
export function hasAccentDifference(userInput: string, targetAnswer: string): boolean {
  const cleanUser = (userInput || "").toLowerCase().replace(/[¿?¡!.,'"`~;:()\-«»、。！？]/g, "").replace(/\s+/g, " ").trim();
  const cleanTarget = (targetAnswer || "").toLowerCase().replace(/[¿?¡!.,'"`~;:()\-«»、。！？]/g, "").replace(/\s+/g, " ").trim();
  return cleanUser !== cleanTarget && normalizeAnswer(userInput) === normalizeAnswer(targetAnswer);
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  isExact: boolean;
  isTypo: boolean;
  isAccentOnly: boolean;
  correctAnswer: string;
  romajiCorrection?: string;
  feedbackTip?: string;
}

/**
 * Comprehensive answer evaluator supporting:
 * 1. Normalized exact matches
 * 2. Accent-insensitive matches (with helpful feedback)
 * 3. Japanese Romaji <-> Kana bidirectional matching (e.g. 'akai ringo' <-> 'あかい りんご')
 * 4. Duolingo-style typo tolerance (e.g. 'akai ingo' accepted as a 1-letter typo of 'akai ringo')
 */
export function evaluateAnswer(
  userInput: string,
  targetAnswer: string,
  courseCode?: string
): AnswerEvaluation {
  if (!targetAnswer) {
    return {
      isCorrect: false,
      isExact: false,
      isTypo: false,
      isAccentOnly: false,
      correctAnswer: "",
    };
  }

  const normUser = normalizeAnswer(userInput);
  const normTarget = normalizeAnswer(targetAnswer);

  // 1. Direct normalized match
  if (normUser === normTarget) {
    const isAccentOnly = hasAccentDifference(userInput, targetAnswer);
    return {
      isCorrect: true,
      isExact: !isAccentOnly,
      isTypo: false,
      isAccentOnly,
      correctAnswer: targetAnswer,
      feedbackTip: isAccentOnly ? `💡 Pay attention to accents: ${targetAnswer}` : undefined,
    };
  }

  // 2. Japanese Language Support (Romaji & Hiragana & Katakana)
  const isJap = isJapanese(targetAnswer) || isJapanese(userInput) || courseCode === "ja";
  if (isJap) {
    const targetRomaji = toRomaji(targetAnswer);
    const normTargetRomaji = normalizeAnswer(targetRomaji);
    const userAsHiragana = normalizeAnswer(toHiragana(userInput));

    // A. User typed Romaji matching target Romaji
    if (
      normUser === normTargetRomaji ||
      normUser.replace(/\s+/g, "") === normTargetRomaji.replace(/\s+/g, "")
    ) {
      return {
        isCorrect: true,
        isExact: true,
        isTypo: false,
        isAccentOnly: false,
        correctAnswer: targetAnswer,
        romajiCorrection: targetRomaji,
      };
    }

    // B. User typed Romaji converted to Hiragana matching target Hiragana
    if (userAsHiragana === normTarget || userAsHiragana.replace(/\s+/g, "") === normTarget.replace(/\s+/g, "")) {
      return {
        isCorrect: true,
        isExact: true,
        isTypo: false,
        isAccentOnly: false,
        correctAnswer: targetAnswer,
        romajiCorrection: targetRomaji,
      };
    }

    // C. Typo tolerance on Romaji (e.g. 'akai ingo' vs 'akai ringo')
    const userNoSpaces = normUser.replace(/\s+/g, "");
    const romajiNoSpaces = normTargetRomaji.replace(/\s+/g, "");
    const romajiDist = levenshteinDistance(userNoSpaces, romajiNoSpaces);

    const allowDist = romajiNoSpaces.length >= 8 ? 2 : romajiNoSpaces.length >= 4 ? 1 : 0;
    if (romajiDist > 0 && romajiDist <= allowDist) {
      return {
        isCorrect: true,
        isExact: false,
        isTypo: true,
        isAccentOnly: false,
        correctAnswer: targetAnswer,
        romajiCorrection: targetRomaji,
        feedbackTip: `💡 You have a small typo: "${targetRomaji}" (${targetAnswer})`,
      };
    }

    // D. Typo tolerance on Hiragana
    const hiraganaDist = levenshteinDistance(userAsHiragana.replace(/\s+/g, ""), normTarget.replace(/\s+/g, ""));
    const allowKanaDist = normTarget.replace(/\s+/g, "").length >= 5 ? 1 : 0;
    if (hiraganaDist > 0 && hiraganaDist <= allowKanaDist) {
      return {
        isCorrect: true,
        isExact: false,
        isTypo: true,
        isAccentOnly: false,
        correctAnswer: targetAnswer,
        romajiCorrection: targetRomaji,
        feedbackTip: `💡 You have a small typo: "${targetRomaji}" (${targetAnswer})`,
      };
    }
  }

  // 3. Typo tolerance for Latin alphabet languages (Spanish, German, French)
  const dist = levenshteinDistance(normUser, normTarget);
  const allowDist = normTarget.length >= 10 ? 2 : normTarget.length >= 5 ? 1 : 0;
  if (dist > 0 && dist <= allowDist) {
    return {
      isCorrect: true,
      isExact: false,
      isTypo: true,
      isAccentOnly: false,
      correctAnswer: targetAnswer,
      feedbackTip: `💡 You have a small typo: "${targetAnswer}"`,
    };
  }

  // Not a match
  return {
    isCorrect: false,
    isExact: false,
    isTypo: false,
    isAccentOnly: false,
    correctAnswer: targetAnswer,
    romajiCorrection: isJap ? toRomaji(targetAnswer) : undefined,
  };
}

/**
 * Checks if user answer matches target answer, ignoring accents, punctuation and case,
 * and tolerating Romaji in Japanese and 1-character typos.
 */
export function isAnswerMatch(userInput: string, targetAnswer: string, courseCode?: string): boolean {
  return evaluateAnswer(userInput, targetAnswer, courseCode).isCorrect;
}
