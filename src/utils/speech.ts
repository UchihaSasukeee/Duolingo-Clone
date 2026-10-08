import { isJapanese } from "./romaji";

/**
 * Strict map of the 4 supported learning languages for speech synthesis.
 * English is explicitly excluded.
 */
const SUPPORTED_LANG_TAGS: Record<string, string> = {
  ja: "ja-JP",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

/**
 * Checks if the given course code is one of the 4 supported voice languages:
 * Spanish (es), German (de), Japanese (ja), French (fr).
 */
export function isVoiceSupported(courseCode?: string): boolean {
  if (!courseCode) return false;
  const clean = courseCode.toLowerCase().trim();
  return clean in SUPPORTED_LANG_TAGS;
}

/**
 * Cleans text for speech synthesis (strips quotes, furigana artifacts, underscores).
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/^Translate:\s*["']?|["']$/gi, "")
    .replace(/___+/g, "")
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Determines appropriate speech language tag for text and course code.
 * Returns null if not one of the 4 supported foreign languages.
 */
export function resolveSpeechLanguage(text: string, courseCode?: string): string | null {
  if (isJapanese(text)) {
    return "ja-JP";
  }
  const cleanCode = (courseCode || "").toLowerCase().trim();
  if (SUPPORTED_LANG_TAGS[cleanCode]) {
    return SUPPORTED_LANG_TAGS[cleanCode];
  }
  return null;
}

/**
 * Extracts a foreign target phrase enclosed in quotes inside an English prompt.
 * e.g. 'What does "la femme" mean?' -> 'la femme'
 * e.g. 'What does "Tú bebes leche" mean?' -> 'Tú bebes leche'
 * e.g. 'What does "C\'est délicieux" mean?' -> 'C\'est délicieux'
 * e.g. 'What does "またね" mean?' -> 'またね'
 * e.g. 'What is the polite reply to "Merci" in French?' -> 'Merci'
 */
export function extractForeignTargetPhrase(text: string): string | null {
  if (!text) return null;

  // 1. "What does ... mean?"
  // Matches "..." or '...' or “...” or «...» without truncating internal apostrophes (e.g. C'est)
  const whatDoesMatch = text.match(
    /what does\s+(?:"([^"]+)"|'([^']+)'|[“«]([^”»]+)[”»])/i
  );
  if (whatDoesMatch) {
    const captured = (whatDoesMatch[1] || whatDoesMatch[2] || whatDoesMatch[3] || "").trim();
    if (captured) return captured;
  }

  // 2. "...reply/response to ... in [language]?"
  const replyMatch = text.match(
    /(?:reply|response)\s+to\s+(?:"([^"]+)"|'([^']+)'|[“«]([^”»]+)[”»])/i
  );
  if (replyMatch) {
    const captured = (replyMatch[1] || replyMatch[2] || replyMatch[3] || "").trim();
    if (captured) return captured;
  }

  return null;
}

/**
 * Checks whether text is an English instruction or prompt
 * that must NEVER be read aloud.
 */
export function isEnglishPrompt(text: string): boolean {
  if (!text) return true;
  if (isJapanese(text)) return false;
  const lower = text.toLowerCase().trim();
  return (
    lower.startsWith("what is") ||
    lower.startsWith("what does") ||
    lower.startsWith("which ") ||
    lower.startsWith("how do you say") ||
    lower.startsWith("how do you ask") ||
    lower.startsWith("translate:") ||
    lower.startsWith("tap the") ||
    lower.startsWith("select the") ||
    lower.startsWith("write in") ||
    lower.startsWith("complete the")
  );
}

/**
 * Gets the clean foreign speech text for a challenge question.
 * Returns null if the question has no foreign text to speak (e.g. English prompts like 'How do you say "Goodbye"?').
 * For 'What does "la femme" mean?', extracts and returns ONLY 'la femme'.
 */
export function getSpeechTextForQuestion(question: string, courseCode?: string): string | null {
  if (!question || !isVoiceSupported(courseCode)) return null;

  // 1. If there's an embedded foreign phrase inside quotes (e.g. What does "la femme" mean?):
  const foreignPhrase = extractForeignTargetPhrase(question);
  if (foreignPhrase) {
    return cleanTextForSpeech(foreignPhrase);
  }

  // 2. If it's an English instructional prompt (e.g. How do you say "Goodbye"?, Which of these is "apple"?, Translate: "...")
  if (isEnglishPrompt(question)) {
    return null;
  }

  // 3. Otherwise, it's a target foreign sentence (e.g. "El niño", "Ella ___ manzanas", "Bonjour, je suis un garçon")
  const cleaned = cleanTextForSpeech(question);
  return cleaned || null;
}

/**
 * Speaks text using Web Speech API with language detection, custom voice matching, and speed control.
 * Strictly limited to Spanish, German, Japanese, and French.
 */
export function speakText(
  text: string,
  courseCode?: string,
  slow: boolean = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve(false);
      return;
    }

    if (!isVoiceSupported(courseCode) && !isJapanese(text)) {
      resolve(false);
      return;
    }

    // If text contains an embedded foreign target phrase (e.g. 'What does "la femme" mean?'),
    // extract and speak ONLY the foreign phrase!
    const targetText = extractForeignTargetPhrase(text) || text;
    const clean = cleanTextForSpeech(targetText);

    // Never speak English prompts
    if (!clean || isEnglishPrompt(clean)) {
      resolve(false);
      return;
    }

    const langTag = resolveSpeechLanguage(clean, courseCode);
    if (!langTag) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = langTag;
      utterance.rate = slow ? 0.6 : 0.88;
      utterance.pitch = 1.0;

      // Select highest quality available voice for the target language
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = langTag.split("-")[0].toLowerCase();
        const matchingVoice =
          voices.find((v) => v.lang.toLowerCase() === langTag.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("SpeechSynthesis error:", err);
      resolve(false);
    }
  });
}

/**
 * Cancels any ongoing speech.
 */
export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
