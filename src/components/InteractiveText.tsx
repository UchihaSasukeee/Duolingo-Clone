import { useState } from "react";
import { Sparkles } from "lucide-react";
import { getRomajiReading } from "@/utils/romaji";
import { GLOBAL_VOCAB_HINTS, getHintForWord } from "@/utils/vocabHints";

interface InteractiveTextProps {
  text?: string;
  hintsJson?: string | null;
  className?: string;
  seenWords?: Set<string>;
}

export function InteractiveText({ text = "", hintsJson, className = "", seenWords }: InteractiveTextProps) {
  if (!text || typeof text !== "string") {
    return null;
  }

  // Parse challenge specific hints if present
  let customHints: Record<string, string> = {};
  if (hintsJson) {
    try {
      customHints = JSON.parse(hintsJson);
    } catch {
      // ignore JSON parse errors
    }
  }

  const getHintInfo = (raw: string) => getHintForWord(raw, hintsJson, seenWords);
  const seenInSentence = new Set<string>();

  // Build dynamic regex:
  // 1. All explicit customHint keys (so Japanese particles like 'と', nouns like 'みず', etc. are cleanly segmented)
  // 2. Multi-word phrases with spaces from GLOBAL_VOCAB_HINTS
  const specificTokens = Object.keys(customHints)
    .concat(Object.keys(GLOBAL_VOCAB_HINTS).filter((k) => k.includes(" ")))
    .filter((k) => k.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const phrasePattern = specificTokens.length > 0 ? `(?:${specificTokens.join("|")})|` : "";
  const tokenRegex = new RegExp(
    `(${phrasePattern}"[^"]+"|[¿?¡!.,:;()!]|(?:[\\p{L}\\p{N}]+(?:['’][\\p{L}\\p{N}]+)?)|\\s+)`,
    "giu"
  );
  const tokens = text.match(tokenRegex) || [text];

  return (
    <span className={`inline leading-relaxed ${className}`}>
      {tokens.map((token, index) => {
        // If it's whitespace
        if (/^\s+$/.test(token)) {
          return <span key={index}> </span>;
        }

        // If it's punctuation (comma, period, etc.) - attach directly without space
        if (/^[¿?¡!.,:;]$/.test(token)) {
          return <span key={index}>{token}</span>;
        }

        const isQuoted = token.startsWith('"') && token.endsWith('"');
        const content = isQuoted ? token.slice(1, -1) : token;
        const hintInfo = getHintInfo(content) || (isQuoted ? getHintInfo(token) : null);

        if (hintInfo) {
          let isNew = hintInfo.isNew;
          const cleanToken = content.replace(/[¿?¡!.,":;()]/g, "").trim().toLowerCase();
          if (isNew) {
            if (seenInSentence.has(cleanToken)) {
              isNew = false;
            } else {
              seenInSentence.add(cleanToken);
            }
          }

          return (
            <WordWithHint
              key={index}
              word={token}
              hint={hintInfo.hint}
              isNew={isNew}
            />
          );
        }

        // Japanese reading fallback: ensure phonetic guide is always displayed for Japanese words
        const fallbackRomaji = getRomajiReading(token);
        if (fallbackRomaji) {
          return (
            <span key={index} className="inline-flex flex-col items-center align-middle mx-0.5">
              <span className="leading-tight font-extrabold">{token}</span>
              <span className="text-[10px] md:text-[11px] font-bold text-neutral-400 tracking-[0.16em] uppercase leading-none mt-0.5 select-none">
                {fallbackRomaji}
              </span>
            </span>
          );
        }

        return <span key={index}>{token}</span>;
      })}
    </span>
  );
}

function WordWithHint({ word, hint, isNew }: { word: string; hint: string; isNew: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const romaji = getRomajiReading(word);

  // If hint has "romaji (meaning)", extract the clean English meaning (e.g. "neko (cat)" -> "cat")
  const cleanHint = hint.replace(/^[a-zA-Z\s]+\(([^\)]+)\)$/, "$1").trim();

  return (
    <span
      className="relative inline-flex flex-col items-center group cursor-help select-none align-middle mx-0.5"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* The Word: Highlighted with amber pill if new word, dotted underline if standard hint */}
      {isNew ? (
        <span className="inline-flex flex-col items-center px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border-b-2 border-dashed border-amber-500 text-amber-900 rounded-xl font-black transition-all shadow-xs text-center">
          <span className="leading-tight">{word}</span>
          {romaji && (
            <span className="text-[10px] md:text-[11px] font-bold text-amber-800/75 tracking-[0.16em] uppercase leading-none mt-0.5 select-none">
              {romaji}
            </span>
          )}
        </span>
      ) : (
        <span className="inline-flex flex-col items-center border-b-2 border-dotted border-neutral-400 group-hover:border-emerald-500 group-hover:text-emerald-700 transition-colors font-extrabold pb-0.5 px-1 text-center">
          <span className="leading-tight">{word}</span>
          {romaji && (
            <span className="text-[10px] md:text-[11px] font-bold text-neutral-400 tracking-[0.16em] uppercase leading-none mt-0.5 select-none">
              {romaji}
            </span>
          )}
        </span>
      )}

      {/* Floating Tooltip */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none transition-all duration-150 ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"
        }`}
      >
        <div className="bg-neutral-900 text-white px-3.5 py-2 rounded-2xl shadow-2xl whitespace-nowrap flex flex-col gap-y-0.5 border border-neutral-700">
          {isNew && (
            <div className="flex items-center gap-x-1 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-amber-400" />
              <span>NEW WORD</span>
            </div>
          )}
          <div className="text-white font-extrabold text-sm md:text-base flex items-center gap-x-1.5">
            {!isNew && <span className="text-amber-400 text-xs">💡</span>}
            <span>{cleanHint}</span>
          </div>
        </div>
        <div className="w-2.5 h-2.5 bg-neutral-900 rotate-45 mx-auto -mt-1 border-r border-b border-neutral-700" />
      </div>
    </span>
  );
}
