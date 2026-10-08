import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { X, Sparkles, Dumbbell, Zap, CheckCircle2, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { InteractiveText } from "@/components/InteractiveText";
import { getHintForWord } from "@/utils/vocabHints";
import { evaluateAnswer } from "@/utils/textUtils";
import { speakText, isEnglishPrompt, getSpeechTextForQuestion, extractForeignTargetPhrase } from "@/utils/speech";
import { isJapanese, toRomaji, toHiragana, getRomajiReading } from "@/utils/romaji";
import { API_BASE } from "@/utils/api";

export default function PracticePage() {
  const navigate = useNavigate();
  const { completePractice, token, activeCourse } = useUserStore();
  const { playCorrect, playWrong, playFinished } = useSoundEffects();

  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [status, setStatus] = useState<"none" | "correct" | "wrong">("none");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [selectedWords, setSelectedWords] = useState<{ id: string; text: string }[]>([]);
  const [accentTip, setAccentTip] = useState<string | null>(null);
  const [feedbackTip, setFeedbackTip] = useState<string | null>(null);

  const [practiceSaved, setPracticeSaved] = useState(false);
  const [rewardStats, setRewardStats] = useState<{ hearts_added: number; xp_added: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/practice`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [token]);

  const isFinished = !isLoading && challenges.length > 0 && currentIdx >= challenges.length;
  const challenge = challenges[currentIdx];
  const isTyping = challenge?.type === "typing";
  const isTranslate = challenge?.type === "translate";
  const isFillInBlank = challenge?.type === "fill_in_blank";

  // Auto-play foreign speech when challenge loads
  useEffect(() => {
    if (!challenge || status !== "none") return;
    const timer = setTimeout(() => {
      const speechText = getSpeechTextForQuestion(challenge.question, activeCourse?.code);
      if (speechText) {
        speakText(speechText, activeCourse?.code);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIdx, challenge?.id, activeCourse?.code]);

  useEffect(() => {
    if (isFinished && !practiceSaved) {
      setPracticeSaved(true);
      playFinished();
      completePractice().then((res) => {
        if (res) {
          setRewardStats({ hearts_added: res.hearts_added, xp_added: res.xp_added });
        } else {
          setRewardStats({ hearts_added: 1, xp_added: 10 });
        }
      });
    }
  }, [isFinished, practiceSaved, completePractice, playFinished]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center mb-6 shadow-md">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 stroke-[2.5]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-emerald-600 mb-2">
            Practice Complete!
          </h1>
          <p className="text-neutral-500 font-bold mb-8">
            You recharged your mind and earned vitality!
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-rose-50 flex flex-col items-center">
              <span className="text-2xl mb-1">❤️</span>
              <span className="text-xs font-black text-neutral-400 uppercase">Hearts Restored</span>
              <span className="text-2xl font-black text-rose-600">
                +{rewardStats?.hearts_added ?? 1} ❤️
              </span>
            </div>

            <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-amber-50 flex flex-col items-center">
              <Zap className="w-6 h-6 text-amber-500 mb-1 fill-amber-500" />
              <span className="text-xs font-black text-neutral-400 uppercase">Practice XP</span>
              <span className="text-2xl font-black text-amber-600">
                +{rewardStats?.xp_added ?? 10} XP
              </span>
            </div>
          </div>

          <Button onClick={() => navigate("/")} variant="secondary" size="lg" className="w-full">
            RETURN TO LEARNING PATH
          </Button>
        </div>
      </div>
    );
  }

  const progress = (currentIdx / challenges.length) * 100;

  const handleNext = () => {
    setCurrentIdx((prev) => prev + 1);
    setStatus("none");
    setSelectedOption(null);
    setTypedAnswer("");
    setSelectedWords([]);
    setAccentTip(null);
    setFeedbackTip(null);
  };

  const handleFail = () => {
    setStatus("wrong");
    playWrong();
    if (challenge) {
      setChallenges((prev) => [...prev, { ...challenge, id: Math.random() }]);
    }
  };

  const handlePass = () => {
    setStatus("correct");
    playCorrect();
  };

  const handleCheckTranslate = () => {
    if (status !== "none" || !challenge) return;
    const userText = selectedWords.map((w) => w.text).join(" ");
    const res = evaluateAnswer(userText, challenge.answer || "", activeCourse?.code);
    if (res.isCorrect) {
      setFeedbackTip(res.feedbackTip || null);
      handlePass();
    } else {
      setFeedbackTip(null);
      handleFail();
    }
  };

  const handleCheckTyping = () => {
    if (!isTyping || status !== "none" || !challenge) return;
    const res = evaluateAnswer(typedAnswer, challenge.answer || "", activeCourse?.code);
    if (res.isCorrect) {
      setFeedbackTip(res.feedbackTip || null);
      handlePass();
    } else {
      setFeedbackTip(null);
      handleFail();
    }
  };

  const handleCheckFillInBlank = () => {
    if (!isFillInBlank || status !== "none" || !challenge || selectedOption === null) return;
    const opt = challenge.options?.find((o: any) => o.id === selectedOption);
    if (opt?.is_correct) {
      handlePass();
    } else {
      handleFail();
    }
  };

  const canCheck =
    isTranslate
      ? selectedWords.length > 0
      : isTyping
      ? typedAnswer.trim().length > 0
      : isFillInBlank
      ? selectedOption !== null
      : false;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="pt-6 px-4 md:px-10 flex items-center justify-between gap-x-4 max-w-[1024px] mx-auto w-full">
        <button onClick={() => navigate("/")} className="text-neutral-400 hover:text-neutral-600 transition">
          <X className="w-8 h-8 stroke-[3]" />
        </button>
        <div className="flex-1 bg-neutral-200 h-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-x-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider">
          <Dumbbell className="w-4 h-4" />
          <span>Practice</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 overflow-y-auto py-8">
        <div className="w-full max-w-[620px] flex flex-col gap-y-6">
          {/* Main Content Header */}
          {challenge?.type === "matching" ? (
            <h1 className="text-2xl md:text-3xl font-black text-neutral-800 tracking-tight text-center md:text-left mb-2">
              Tap the matching pairs
            </h1>
          ) : challenge?.type === "fill_in_blank" ? null : (() => {
            const spokenQuestion = getSpeechTextForQuestion(challenge?.question, activeCourse?.code);
            return (
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                {spokenQuestion ? (
                  <button
                    type="button"
                    onClick={() => speakText(spokenQuestion, activeCourse?.code)}
                    className="relative group transition-transform active:scale-95"
                    title="Click mascot to listen"
                  >
                    <img
                      src="/mascot.jpeg"
                      alt="Mascot"
                      width={100}
                      height={100}
                      className="rounded-2xl border-2 border-neutral-200 object-contain shadow-sm group-hover:border-blue-300 transition"
                    />
                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                      <Volume2 className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ) : (
                  <img
                    src="/mascot.jpeg"
                    alt="Mascot"
                    width={100}
                    height={100}
                    className="rounded-2xl border-2 border-neutral-200 object-contain shadow-sm"
                  />
                )}
                <div className="flex-1 bg-white border-2 border-neutral-200 rounded-2xl p-4 md:p-6 relative shadow-sm flex items-center justify-between gap-x-4">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-neutral-200 rotate-45 hidden md:block"></div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-blue-500 uppercase tracking-wider mb-1">
                      {isTranslate
                        ? "Translate this sentence"
                        : `Refill Practice (${activeCourse?.title || "Language"})`}
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-neutral-800 leading-snug">
                      <InteractiveText text={challenge?.question} hintsJson={challenge?.hints} />
                    </h1>
                  </div>

                  {/* Duolingo Speaker Controls (Only for Spanish, German, Japanese, French) */}
                  {spokenQuestion && (
                    <div className="flex items-center gap-1.5 self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => speakText(spokenQuestion, activeCourse?.code, false)}
                        className="w-10 h-10 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-md transition-all group"
                        title="Listen (Normal speed)"
                      >
                        <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        type="button"
                        onClick={() => speakText(spokenQuestion, activeCourse?.code, true)}
                        className="w-8 h-8 rounded-xl bg-blue-100 hover:bg-blue-200 active:scale-95 text-blue-700 flex items-center justify-center transition-all shadow-sm"
                        title="Listen slowly (Turtle mode)"
                      >
                        <span className="text-base select-none">🐢</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 1. Multiple Choice */}
          {challenge?.type === "multiple_choice" && (
            <div className="grid grid-cols-1 gap-3.5">
              {challenge.options.map((option: any) => {
                const isSelected = selectedOption === option.id;
                const romaji = getRomajiReading(option.text);
                let borderClass = "border-neutral-200";
                let bgClass = "bg-white hover:bg-neutral-50";
                let textClass = "text-neutral-700";

                if (isSelected) {
                  if (status === "correct") {
                    borderClass = "border-emerald-500";
                    bgClass = "bg-emerald-50";
                    textClass = "text-emerald-700";
                  } else if (status === "wrong") {
                    borderClass = "border-rose-500";
                    bgClass = "bg-rose-50";
                    textClass = "text-rose-700";
                  }
                } else if (status !== "none") {
                  bgClass = "bg-white opacity-70";
                }

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (status !== "none") return;
                      const foreignPromptPhrase = extractForeignTargetPhrase(challenge?.question);
                      if (!foreignPromptPhrase && isEnglishPrompt(challenge?.question)) {
                        speakText(option.text, activeCourse?.code);
                      }
                      setSelectedOption(option.id);
                      if (option.is_correct) handlePass();
                      else handleFail();
                    }}
                    className={`border-2 border-b-4 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-start ${borderClass} ${bgClass} ${textClass} ${
                      status !== "none" ? "pointer-events-none" : ""
                    }`}
                  >
                    {romaji && (
                      <span className="text-[11px] md:text-xs font-bold text-neutral-400 tracking-[0.2em] uppercase mb-0.5 select-none leading-none">
                        {romaji}
                      </span>
                    )}
                    <span className="font-black text-lg md:text-xl leading-tight">{option.text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Translate with Word Bank */}
          {isTranslate && (
            <div className="w-full flex flex-col gap-y-6">
              <div className="w-full min-h-[68px] border-b-2 border-neutral-300 pb-3 flex flex-wrap items-center gap-2">
                {selectedWords.map((wordObj, idx) => {
                  const romaji = getRomajiReading(wordObj.text);
                  return (
                    <button
                      key={`${wordObj.id}-${idx}`}
                      disabled={status !== "none"}
                      onClick={() => setSelectedWords((prev) => prev.filter((_, i) => i !== idx))}
                      className="px-4 py-2 bg-white border-2 border-b-4 border-neutral-200 rounded-2xl font-black text-base text-neutral-800 shadow-sm hover:border-neutral-300 active:scale-95 transition-all flex flex-col items-center"
                    >
                      {romaji && (
                        <span className="text-[10px] md:text-[11px] font-bold text-neutral-400 tracking-[0.16em] uppercase leading-none mb-0.5 select-none">
                          {romaji}
                        </span>
                      )}
                      <span>{wordObj.text}</span>
                    </button>
                  );
                })}
                {selectedWords.length === 0 && (
                  <span className="text-neutral-400 font-bold text-sm select-none">
                    Tap words below to assemble the translation
                  </span>
                )}
              </div>

              <div className="w-full flex flex-wrap gap-2.5 justify-center pt-2">
                {challenge.options.map((opt: any) => {
                  const isUsed = selectedWords.some((w) => w.id === String(opt.id));
                  const romaji = getRomajiReading(opt.text);
                  return (
                    <button
                      key={opt.id}
                      disabled={isUsed || status !== "none"}
                      onClick={() => setSelectedWords((prev) => [...prev, { id: String(opt.id), text: opt.text }])}
                      className={`px-4 py-2.5 rounded-2xl font-black text-base transition-all border-2 border-b-4 flex flex-col items-center ${
                        isUsed
                          ? "opacity-25 bg-neutral-200 border-neutral-300 pointer-events-none"
                          : "bg-white border-neutral-200 text-neutral-800 hover:border-neutral-300 active:translate-y-1 shadow-sm"
                      }`}
                    >
                      {romaji && (
                        <span className="text-[10px] md:text-[11px] font-bold text-neutral-400 tracking-[0.16em] uppercase leading-none mb-0.5 select-none">
                          {romaji}
                        </span>
                      )}
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Matching */}
          {challenge?.type === "matching" && (
            <PracticeMatching
              challenge={challenge}
              status={status}
              onPass={handlePass}
              onFail={() => {
                playWrong();
              }}
              courseCode={activeCourse?.code}
            />
          )}

          {/* 4. Typing */}
          {isTyping && (
            <div className="w-full flex flex-col gap-y-2">
              <textarea
                className={`w-full p-4 border-2 rounded-2xl text-lg font-bold resize-none h-32 focus:outline-none transition-all ${
                  status === "none"
                    ? "border-neutral-200 focus:border-blue-500"
                    : status === "correct"
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                    : "border-rose-500 text-rose-700 bg-rose-50"
                }`}
                placeholder={
                  isJapanese(challenge?.answer)
                    ? "Type in Romaji (e.g. 'akai ringo') or Japanese..."
                    : "Type your translation here (Press Enter to check)..."
                }
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (status === "none" && canCheck) {
                      handleCheckTyping();
                    } else if (status !== "none") {
                      handleNext();
                    }
                  }
                }}
                disabled={status !== "none"}
                autoFocus
              />

              {/* Japanese Typing Helper & Live Hiragana Preview */}
              {isJapanese(challenge?.answer) && (
                <div className="flex items-center justify-between text-xs font-bold text-neutral-500 px-1">
                  <span>💡 You can type in Romaji (e.g. <em>akai ringo</em>) or Japanese</span>
                  {typedAnswer.trim().length > 0 && (
                    <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-200 shadow-xs flex items-center gap-1">
                      Kana: <strong className="font-black text-sm text-sky-900">{toHiragana(typedAnswer)}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {/* 5. Fill In The Blank */}
          {isFillInBlank && (
            <PracticeFillInBlank
              challenge={challenge}
              status={status}
              selectedOption={selectedOption ? challenge.options?.find((o: any) => o.id === selectedOption) : null}
              onSelectOption={(opt: any) => setSelectedOption(opt ? opt.id : null)}
              courseCode={activeCourse?.code}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`w-full border-t-2 p-6 md:p-8 transition-colors ${
          status === "correct"
            ? "bg-emerald-100 border-emerald-300"
            : status === "wrong"
            ? "bg-rose-100 border-rose-300"
            : "bg-white border-neutral-200"
        }`}
      >
        <div className="max-w-[1024px] mx-auto flex items-center justify-between w-full">
          {status === "correct" && (
            <div className="flex flex-col">
              <div className="text-emerald-700 font-black text-xl md:text-2xl flex items-center gap-x-2">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                <span>Great practice!</span>
              </div>
              {feedbackTip && (
                <span className="text-xs md:text-sm font-bold text-emerald-800 mt-1">
                  {feedbackTip}
                </span>
              )}
              {!feedbackTip && accentTip && (
                <span className="text-xs md:text-sm font-bold text-emerald-800 mt-1">
                  💡 Pay attention to accents: <span className="font-black underline">{accentTip}</span>
                </span>
              )}
            </div>
          )}
          {status === "wrong" && (
            <div className="text-rose-700 font-bold text-lg md:text-xl flex flex-col">
              <div className="flex items-center gap-x-2 font-black text-rose-800">
                <AlertCircle className="w-6 h-6 stroke-[3]" />
                <span>Correct solution:</span>
              </div>
              <div className="text-base font-black text-neutral-800 mt-1 flex items-center gap-2">
                <span>
                  {challenge?.answer || challenge?.options?.find((o: any) => o.is_correct)?.text}
                </span>
                {(() => {
                  const ans = challenge?.answer || challenge?.options?.find((o: any) => o.is_correct)?.text;
                  if (isJapanese(ans)) {
                    return (
                      <span className="text-xs font-semibold text-rose-600 bg-rose-200/60 px-2 py-0.5 rounded-md ml-1">
                        ({toRomaji(ans)})
                      </span>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  const ans = challenge?.answer || challenge?.options?.find((o: any) => o.is_correct)?.text;
                  const foreignPromptPhrase = extractForeignTargetPhrase(challenge?.question);
                  const isForeignAnswer = challenge?.type === "typing" || (isEnglishPrompt(challenge?.question) && !foreignPromptPhrase);
                  if (!isForeignAnswer || !ans) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => speakText(ans, activeCourse?.code)}
                      className="p-1 hover:bg-rose-200/50 rounded-lg text-rose-600 transition"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
          {status === "none" && (
            <div className="text-neutral-400 font-bold text-sm">Practice sessions replenish daily hearts (+1 ❤️)</div>
          )}

          {(isTranslate || isTyping || isFillInBlank) && status === "none" ? (
            <Button
              disabled={!canCheck}
              onClick={isTranslate ? handleCheckTranslate : isTyping ? handleCheckTyping : handleCheckFillInBlank}
              variant={canCheck ? "primary" : "ghost"}
              className="w-full md:w-[160px]"
            >
              CHECK
            </Button>
          ) : (
            <Button
              disabled={status === "none"}
              onClick={handleNext}
              variant={status === "correct" ? "secondary" : status === "wrong" ? "danger" : "primary"}
              className="w-full md:w-[160px]"
            >
              CONTINUE
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PracticeMatching({ challenge, status, onPass, onFail, courseCode }: any) {
  const [completedPairs, setCompletedPairs] = useState<Set<number>>(new Set());
  const [selectedTile, setSelectedTile] = useState<{ id: string; type: "left" | "right"; text: string; pairId: number } | null>(null);
  const [matchedTiles, setMatchedTiles] = useState<string[]>([]);
  const [mismatchTiles, setMismatchTiles] = useState<string[]>([]);

  const { leftTiles, rightTiles } = useMemo(() => {
    const left: any[] = [];
    const right: any[] = [];
    challenge.options.forEach((p: any) => {
      left.push({ id: `L-${p.id}`, type: "left", text: p.match_text, pairId: p.id });
      right.push({ id: `R-${p.id}`, type: "right", text: p.text, pairId: p.id });
    });
    return {
      leftTiles: left.sort(() => Math.random() - 0.5),
      rightTiles: right.sort(() => Math.random() - 0.5),
    };
  }, [challenge]);

  const onTileClick = (tile: any) => {
    if (status !== "none" || completedPairs.has(tile.pairId) || mismatchTiles.length > 0) return;

    // Only speak foreign target tiles (rightTiles), never English matches (leftTiles)
    if (tile.type === "right") {
      speakText(tile.text, courseCode);
    }

    if (!selectedTile) {
      setSelectedTile(tile);
    } else {
      if (selectedTile.id === tile.id) {
        setSelectedTile(null);
      } else if (selectedTile.type === tile.type) {
        // Same column -> switch selection
        setSelectedTile(tile);
      } else if (selectedTile.pairId === tile.pairId) {
        // MATCH!
        const pairId = tile.pairId;
        const t1 = selectedTile.id;
        const t2 = tile.id;
        setMatchedTiles([t1, t2]);

        setTimeout(() => {
          const newCompleted = new Set(completedPairs).add(pairId);
          setCompletedPairs(newCompleted);
          setSelectedTile(null);
          setMatchedTiles([]);
          if (newCompleted.size === challenge.options.length) {
            onPass();
          }
        }, 300);
      } else {
        // MISMATCH!
        const t1 = selectedTile.id;
        const t2 = tile.id;
        setMismatchTiles([t1, t2]);
        onFail();

        setTimeout(() => {
          setSelectedTile(null);
          setMismatchTiles([]);
        }, 500);
      }
    }
  };

  const renderTile = (tile: any) => {
    const isSelected = selectedTile?.id === tile.id;
    const isCompleted = completedPairs.has(tile.pairId);
    const isMatched = matchedTiles.includes(tile.id);
    const isMismatch = mismatchTiles.includes(tile.id);
    const romaji = getRomajiReading(tile.text);

    let borderClass = "border-neutral-200 border-b-4 bg-white hover:border-neutral-300 hover:bg-neutral-50/80 text-neutral-800 shadow-sm";
    let animClass = "";

    if (isCompleted) {
      borderClass = "border-neutral-200 border-b-4 bg-neutral-100 text-neutral-400 opacity-30 pointer-events-none";
    } else if (isMatched) {
      borderClass = "border-emerald-500 border-b-4 bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20 scale-[1.02]";
    } else if (isMismatch) {
      borderClass = "border-rose-400 border-b-4 bg-rose-50 text-rose-500 ring-2 ring-rose-400/20";
      animClass = "animate-shake";
    } else if (isSelected) {
      borderClass = "border-sky-400 border-b-4 bg-sky-50 text-sky-600 ring-2 ring-sky-400/20";
    }

    return (
      <button
        key={tile.id}
        type="button"
        disabled={isCompleted || status !== "none"}
        onClick={() => onTileClick(tile)}
        className={`w-full h-full min-h-[76px] md:min-h-[82px] px-3 py-2.5 md:px-4 md:py-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all active:translate-y-0.5 active:border-b-2 select-none border-2 ${borderClass} ${animClass}`}
      >
        {romaji && (
          <span className="text-[11px] md:text-xs font-bold text-neutral-400 tracking-[0.2em] uppercase mb-0.5 select-none leading-none">
            {romaji}
          </span>
        )}
        <span className={`font-black tracking-tight leading-tight ${romaji ? "text-lg md:text-xl" : "text-base md:text-lg"}`}>
          {tile.text}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-[580px] mx-auto grid grid-cols-2 gap-3 md:gap-4 my-2 items-stretch">
      {leftTiles.map((leftTile: any, i: number) => {
        const rightTile = rightTiles[i];
        return (
          <Fragment key={`pair-row-${leftTile.id}-${rightTile?.id || i}`}>
            {renderTile(leftTile)}
            {rightTile ? renderTile(rightTile) : <div />}
          </Fragment>
        );
      })}
    </div>
  );
}

function PracticeFillInBlank({ challenge, status, selectedOption, onSelectOption, courseCode }: any) {
  const parts = challenge.question.split("___");
  const before = parts[0] || "";
  const after = parts[1] || "";
  const spokenQuestion = getSpeechTextForQuestion(challenge?.question, courseCode) || "";

  return (
    <div className="w-full flex flex-col gap-y-8 items-center">
      {/* Speech Bubble with Mascot & Speaker Button */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-2 w-full">
        <button
          type="button"
          onClick={() => speakText(spokenQuestion, courseCode)}
          className="relative group transition-transform active:scale-95"
          title="Click mascot to listen"
        >
          <img
            src="/mascot.jpeg"
            alt="Mascot"
            width={100}
            height={100}
            className="rounded-2xl border-2 border-neutral-200 object-contain shadow-sm"
          />
          <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
            <Volume2 className="w-3.5 h-3.5" />
          </span>
        </button>
        <div className="flex-1 bg-white border-2 border-neutral-200 rounded-2xl p-6 relative shadow-sm text-center md:text-left flex items-center justify-between gap-x-4">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-neutral-200 rotate-45 hidden md:block"></div>
          <div className="text-xl md:text-2xl font-black text-neutral-800 leading-snug flex items-center flex-wrap justify-center md:justify-start gap-2 flex-1">
            <InteractiveText text={before} hintsJson={challenge?.hints} />
            <span
              onClick={() => status === "none" && onSelectOption(null)}
              className={`inline-flex flex-col items-center justify-center min-w-[120px] px-4 py-1.5 rounded-2xl border-2 border-b-4 text-center cursor-pointer transition-all ${
                selectedOption
                  ? status === "correct"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                    : status === "wrong"
                    ? "bg-rose-100 border-rose-400 text-rose-800"
                    : "bg-blue-100 border-blue-400 text-blue-800 shadow-sm"
                  : "border-dashed border-neutral-400 bg-neutral-50 text-neutral-400"
              }`}
            >
              {selectedOption ? (
                <>
                  {getRomajiReading(selectedOption.text) && (
                    <span className="text-[10px] md:text-[11px] font-bold text-neutral-400 tracking-[0.16em] uppercase leading-none mb-0.5 select-none">
                      {getRomajiReading(selectedOption.text)}
                    </span>
                  )}
                  <InteractiveText text={selectedOption.text} hintsJson={challenge?.hints} />
                </>
              ) : (
                "______"
              )}
            </span>
            <InteractiveText text={after} hintsJson={challenge?.hints} />
          </div>

          <button
            type="button"
            onClick={() => speakText(spokenQuestion, courseCode, false)}
            className="w-10 h-10 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-md transition-all shrink-0"
            title="Listen to sentence"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Option Tiles (Tactile 3D Buttons with hover hints) */}
      <div className="flex flex-wrap justify-center gap-3.5 w-full mt-4">
        {challenge.options?.map((opt: any) => {
          const isSelected = selectedOption?.id === opt.id;
          return (
            <PracticeOptionTileWithHint
              key={opt.id}
              opt={opt}
              isSelected={isSelected}
              disabled={status !== "none"}
              hintsJson={challenge?.hints}
              onSelect={() => {
                speakText(opt.text, courseCode);
                onSelectOption(isSelected ? null : opt);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PracticeOptionTileWithHint({
  opt,
  isSelected,
  disabled,
  hintsJson,
  onSelect,
}: {
  opt: any;
  isSelected: boolean;
  disabled: boolean;
  hintsJson?: string | null;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hintInfo = getHintForWord(opt.text, hintsJson);
  const romaji = getRomajiReading(opt.text);
  const cleanHint = hintInfo?.hint?.replace(/^[a-zA-Z\s]+\(([^\)]+)\)$/, "$1").trim();

  return (
    <div
      className="relative inline-flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Tooltip */}
      {hintInfo && (
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none transition-all duration-150 ${
            isHovered
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-1 pointer-events-none"
          }`}
        >
          <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap flex flex-col gap-y-0.5 border border-neutral-700 text-center">
            <div className="text-white font-extrabold text-sm flex items-center justify-center gap-x-1.5">
              <span className="text-amber-400 text-xs">💡</span>
              <span>{cleanHint}</span>
            </div>
          </div>
          <div className="w-2.5 h-2.5 bg-neutral-900 rotate-45 mx-auto -mt-1 border-r border-b border-neutral-700" />
        </div>
      )}

      {/* Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={`px-6 py-3 rounded-2xl font-black text-lg border-2 border-b-4 transition-all active:translate-y-1 active:border-b-2 flex flex-col items-center min-w-[110px] ${
          isSelected
            ? "bg-blue-500 border-blue-600 text-white shadow-inner"
            : "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm"
        }`}
      >
        <span className="leading-tight flex items-center">
          {opt.text}
        </span>
        {romaji && (
          <span
            className={`text-[10px] md:text-[11px] font-bold tracking-[0.16em] uppercase leading-none mt-0.5 select-none ${
              isSelected ? "text-blue-100" : "text-neutral-400"
            }`}
          >
            {romaji}
          </span>
        )}
      </button>
    </div>
  );
}

