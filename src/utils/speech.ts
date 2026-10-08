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

let currentAudio: HTMLAudioElement | null = null;

function speakWithWebSpeech(clean: string, lang: string, slow: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const langTag = SUPPORTED_LANG_TAGS[lang] || "es-ES";
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = langTag;
      utterance.rate = slow ? 0.65 : 0.88;
      // Higher pitch ensures pleasant female voice tone
      utterance.pitch = 1.15;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = langTag.split("-")[0].toLowerCase();
        
        // Find matching voices for the foreign language
        const langVoices = voices.filter(
          (v) =>
            v.lang.toLowerCase() === langTag.toLowerCase() ||
            v.lang.toLowerCase().startsWith(langPrefix)
        );

        // Strictly prioritize native female voices and reject male voices (David, Mark, etc.)
        const femaleVoice =
          langVoices.find((v) =>
            /google|female|zira|helena|laura|monica|paulina|sabina|hortense|julie|kyoko|nanami|elsa/i.test(
              v.name
            )
          ) ||
          langVoices.find(
            (v) => !/david|mark|george|raul|ravi|male|stefan|pablo/i.test(v.name)
          ) ||
          langVoices[0];

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Speaks text with authentic native female pronunciation.
 * Primary engine: high-fidelity native female Google TTS audio stream.
 * Secondary engine: Web Speech API with strict female voice filtering.
 */
export function speakText(
  text: string,
  courseCode?: string,
  slow: boolean = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (!isVoiceSupported(courseCode) && !isJapanese(text)) {
      resolve(false);
      return;
    }

    const targetText = extractForeignTargetPhrase(text) || text;
    const clean = cleanTextForSpeech(targetText);

    // Never speak English prompts
    if (!clean || isEnglishPrompt(clean)) {
      resolve(false);
      return;
    }

    stopSpeaking();

    // Determine target language code (es, de, fr, ja)
    let lang = (courseCode || "es").toLowerCase().trim();
    if (isJapanese(clean)) lang = "ja";

    let hasResolved = false;
    const safeResolve = (val: boolean) => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(val);
      }
    };

    // 1. Primary Engine: High-fidelity native female Google TTS audio
    const encoded = encodeURIComponent(clean);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;

    try {
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      audio.playbackRate = slow ? 0.7 : 1.0;

      audio.onended = () => {
        currentAudio = null;
        safeResolve(true);
      };

      audio.onerror = () => {
        currentAudio = null;
        speakWithWebSpeech(clean, lang, slow).then(safeResolve);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy blocks unprompted audio autoplay, fallback gracefully
          speakWithWebSpeech(clean, lang, slow).then(safeResolve);
        });
      }
    } catch {
      speakWithWebSpeech(clean, lang, slow).then(safeResolve);
    }
  });
}

/**
 * Cancels any ongoing speech or audio.
 */
export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
