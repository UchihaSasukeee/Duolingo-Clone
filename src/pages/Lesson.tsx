import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { useUser } from "@clerk/react";
import { Heart, X, Sparkles, Award, Zap, AlertCircle, Keyboard, LayoutGrid, Gem, Volume2 } from "lucide-react";
import { Button } from "@/components/Button";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { InteractiveText } from "@/components/InteractiveText";
import { getHintForWord, extractWordsFromChallenge } from "@/utils/vocabHints";
import { evaluateAnswer } from "@/utils/textUtils";
import { getRomajiReading, isJapanese, toRomaji, toHiragana } from "@/utils/romaji";
import { speakText, isEnglishPrompt, getSpeechTextForQuestion, extractForeignTargetPhrase } from "@/utils/speech";
import confetti from "canvas-confetti";
import { API_BASE } from "@/utils/api";

export default function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hearts = useUserStore((state) => state.hearts);
  const gems = useUserStore((state) => state.gems);
  const reduceHearts = useUserStore((state) => state.reduceHearts);
  const spendGems = useUserStore((state) => state.spendGems);
  const refillHearts = useUserStore((state) => state.refillHearts);
  const completeLesson = useUserStore((state) => state.completeLesson);
  const token = useUserStore((state) => state.token);
  const activeCourse = useUserStore((state) => state.activeCourse);
  const { playCorrect, playWrong, playFinished } = useSoundEffects();
  const { user } = useUser();
  const userId = user?.id || "guest";
  const courseId = activeCourse?.id || 1;

  const getSeenWordsKey = (uId: string, cId: number | string) =>
    `duolingo_seen_words_${uId}_${cId}`;

  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Track words seen in previous completed lessons & previous challenges
  const [seenWords, setSeenWords] = useState<Set<string>>(() => {
    // Clean up any legacy non-namespaced keys from prior versions
    try {
      const legacyKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && /^duolingo_seen_words_\d+$/.test(k)) {
          legacyKeys.push(k);
        }
      }
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    } catch {}

    if (userId && userId !== "guest") {
      try {
        const cached = localStorage.getItem(getSeenWordsKey(userId, courseId));
        if (cached) {
          return new Set(JSON.parse(cached));
        }
      } catch {}
    }
    return new Set();
  });

  const [status, setStatus] = useState<"none" | "correct" | "wrong">("none");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [selectedWords, setSelectedWords] = useState<{ id: string; text: string }[]>([]);
  const [selectedBlankOption, setSelectedBlankOption] = useState<any | null>(null);
  const [useKeyboard, setUseKeyboard] = useState(false);
  const [accentTip, setAccentTip] = useState<string | null>(null);
  const [feedbackTip, setFeedbackTip] = useState<string | null>(null);

  const [heartAnim, setHeartAnim] = useState(false);
  const [showOutOfHeartsModal, setShowOutOfHeartsModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [completedSaved, setCompletedSaved] = useState(false);
  const [earnedStats, setEarnedStats] = useState<{ xp: number; gems: number } | null>(null);

  // Fetch challenges
  useEffect(() => {
    if (!token) return;
    const lessonId = id || 1;
    fetch(`${API_BASE}/api/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id, token]);

  // Reload local seen words whenever user ID or course ID changes
  useEffect(() => {
    if (!userId || userId === "guest") {
      setSeenWords(new Set());
      return;
    }
    const key = getSeenWordsKey(userId, courseId);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        setSeenWords(new Set(JSON.parse(cached)));
      } else {
        setSeenWords(new Set());
      }
    } catch {
      setSeenWords(new Set());
    }
  }, [userId, courseId]);

  // Fetch seen words from completed lessons for this course
  useEffect(() => {
    if (!token || !userId || userId === "guest") return;
    const key = getSeenWordsKey(userId, courseId);

    fetch(`${API_BASE}/api/user/seen-words?course_id=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.words && Array.isArray(data.words)) {
          const freshSet = new Set<string>();
          data.words.forEach((w: string) => freshSet.add(w.toLowerCase()));
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                parsed.forEach((w: string) => freshSet.add(w.toLowerCase()));
              }
            }
            localStorage.setItem(key, JSON.stringify(Array.from(freshSet)));
          } catch {}
          setSeenWords(freshSet);
        }
      })
      .catch(() => {});
  }, [token, courseId, userId]);

  // Compute effective seen words including all challenges preceding currentChallengeIndex in this lesson
  const effectiveSeenWords = useMemo(() => {
    const combined = new Set(seenWords);
    for (let i = 0; i < currentChallengeIndex; i++) {
      const ch = challenges[i];
      if (ch) {
        const words = extractWordsFromChallenge(ch);
        words.forEach((w) => combined.add(w.toLowerCase()));
      }
    }
    return combined;
  }, [seenWords, challenges, currentChallengeIndex]);

  // Check initial hearts state
  useEffect(() => {
    if (!isLoading && hearts <= 0) {
      setShowOutOfHeartsModal(true);
    }
  }, [hearts, isLoading]);

  const isFinished = !isLoading && challenges.length > 0 && currentChallengeIndex >= challenges.length;
  const challenge = challenges[currentChallengeIndex];
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
  }, [currentChallengeIndex, challenge?.id, activeCourse?.code]);

  // Trigger completion API call, sound, and confetti
  useEffect(() => {
    if (isFinished && !completedSaved) {
      setCompletedSaved(true);
      playFinished();

      // Persist all words from this completed lesson into seenWords
      if (challenges.length > 0 && activeCourse?.id && userId && userId !== "guest") {
        setSeenWords((prev) => {
          const nextSet = new Set(prev);
          challenges.forEach((ch) => {
            const words = extractWordsFromChallenge(ch);
            words.forEach((w) => nextSet.add(w.toLowerCase()));
          });
          try {
            localStorage.setItem(
              getSeenWordsKey(userId, activeCourse.id),
              JSON.stringify(Array.from(nextSet))
            );
          } catch {}
          return nextSet;
        });
      }

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // canvas-confetti fallback safety
      }

      const lessonId = Number(id) || challenges[0]?.lesson_id || 1;
      completeLesson(lessonId).then((res) => {
        if (res) {
          setEarnedStats({ xp: res.xp_earned, gems: res.gems_earned });
        } else {
          setEarnedStats({ xp: 20, gems: 10 });
        }
      });
    }
  }, [isFinished, completedSaved, id, completeLesson, playFinished, challenges, activeCourse?.id]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-green-500)]"></div>
      </div>
    );
  }

  // 1. Victory Celebration Screen
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 py-8">
        <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-in">
          <div className="w-28 h-28 rounded-3xl bg-amber-100 border-4 border-amber-300 flex items-center justify-center mb-6 shadow-lg animate-bounce">
            <Award className="w-16 h-16 text-amber-500 stroke-[2.5]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-amber-500 mb-2">
            Lesson Complete!
          </h1>
          <p className="text-neutral-500 font-bold text-base md:text-lg mb-8">
            You pushed your language fluency to the next level today!
          </p>

          {/* Reward Badges */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-amber-50 flex flex-col items-center">
              <Zap className="w-6 h-6 text-amber-500 mb-1 fill-amber-500" />
              <span className="text-xs font-black text-neutral-400 uppercase">Total XP</span>
              <span className="text-2xl font-black text-amber-600">
                +{earnedStats?.xp || 20} XP
              </span>
            </div>

            <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-blue-50 flex flex-col items-center">
              <Sparkles className="w-6 h-6 text-blue-500 mb-1 fill-blue-500" />
              <span className="text-xs font-black text-neutral-400 uppercase">Gems Bonus</span>
              <span className="text-2xl font-black text-blue-600">
                +{earnedStats?.gems || 10} 💎
              </span>
            </div>
          </div>

          <Button onClick={() => navigate("/")} variant="secondary" size="lg" className="w-full">
            CONTINUE LEARNING
          </Button>
        </div>
      </div>
    );
  }

  // Fallback safety if challenge is not yet resolved
  if (!challenge) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-green-500)]"></div>
      </div>
    );
  }

  const progress = (currentChallengeIndex / challenges.length) * 100;

  const handleNext = () => {
    // Record current challenge words into in-memory seenWords before advancing!
    if (challenge) {
      const newWords = extractWordsFromChallenge(challenge);
      setSeenWords((prev) => {
        const nextSet = new Set(prev);
        newWords.forEach((w) => nextSet.add(w.toLowerCase()));
        return nextSet;
      });
    }

    setCurrentChallengeIndex((prev) => prev + 1);
    setStatus("none");
    setSelectedOption(null);
    setTypedAnswer("");
    setSelectedWords([]);
    setSelectedBlankOption(null);
    setUseKeyboard(false);
    setAccentTip(null);
    setFeedbackTip(null);
  };

  const handleFail = () => {
    setStatus("wrong");
    playWrong();
    reduceHearts();
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 1200);

    const currentHearts = useUserStore.getState().hearts;
    if (currentHearts <= 0) {
      setTimeout(() => setShowOutOfHeartsModal(true), 600);
    }

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
    const userText = useKeyboard
      ? typedAnswer
      : selectedWords.map((w) => w.text).join(" ");
    
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
    if (status !== "none" || !challenge) return;
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
    if (status !== "none" || !challenge || !selectedBlankOption) return;
    const res = evaluateAnswer(selectedBlankOption.text, challenge.answer || "", activeCourse?.code);
    if (selectedBlankOption.is_correct || res.isCorrect) {
      setFeedbackTip(res.feedbackTip || null);
      handlePass();
    } else {
      setFeedbackTip(null);
      handleFail();
    }
  };

  const canCheck =
    isTranslate
      ? useKeyboard
        ? typedAnswer.trim().length > 0
        : selectedWords.length > 0
      : isTyping
      ? typedAnswer.trim().length > 0
      : isFillInBlank
      ? selectedBlankOption !== null
      : false;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="pt-6 px-4 md:px-10 flex items-center justify-between gap-x-4 max-w-[1024px] mx-auto w-full">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="text-neutral-400 hover:text-neutral-600 transition"
        >
          <X className="w-8 h-8 stroke-[3]" />
        </button>
        <div className="flex-1 bg-neutral-200 h-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-green-500)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Hearts indicator with shake and floating -1 animation */}
        <div
          className={`relative flex items-center gap-x-2 text-rose-500 font-black cursor-default transition-all duration-300 ${
            heartAnim ? "scale-125 text-rose-600 animate-pulse" : ""
          }`}
          title={`Hearts remaining: ${hearts} / 5`}
        >
          <Heart className="w-7 h-7 fill-rose-500 stroke-rose-500" />
          <span>{hearts} / 5</span>
          {heartAnim && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-black text-rose-600 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full shadow-md animate-bounce whitespace-nowrap">
              -1 ❤️
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 overflow-y-auto py-8">
        <div className="w-full max-w-[620px] flex flex-col gap-y-6">
          {/* Top Instruction Header */}
          {challenge?.type !== "matching" && (
            <div className="flex items-center gap-x-2 text-xs font-black uppercase tracking-wider text-blue-500 mb-1">
              {isTranslate ? (
                <span>TRANSLATE THIS SENTENCE</span>
              ) : isTyping ? (
                <span>WRITE IN TARGET LANGUAGE</span>
              ) : isFillInBlank ? (
                <span>COMPLETE THE SENTENCE</span>
              ) : (
                <span>SELECT THE CORRECT MEANING</span>
              )}
            </div>
          )}

          {/* Clean Matching Header (Duolingo style) */}
          {challenge?.type === "matching" && (
            <h1 className="text-2xl md:text-3xl font-black text-neutral-800 tracking-tight text-center md:text-left mb-2">
              Tap the matching pairs
            </h1>
          )}

          {/* Speech Bubble with Mascot (not shown on fill-in-blank or matching exercises) */}
          {!isFillInBlank && challenge?.type !== "matching" && (() => {
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
                      width={110}
                      height={110}
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
                    width={110}
                    height={110}
                    className="rounded-2xl border-2 border-neutral-200 object-contain shadow-sm"
                  />
                )}
                <div className="flex-1 bg-white border-2 border-neutral-200 rounded-2xl p-4 md:p-6 relative shadow-sm flex items-center justify-between gap-x-4">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-neutral-200 rotate-45 hidden md:block"></div>
                  {/* Question text with hover hints on foreign words */}
                  <h1 className="text-xl md:text-2xl font-black text-neutral-800 leading-snug flex-1">
                    <InteractiveText text={challenge?.question} hintsJson={challenge?.hints} seenWords={effectiveSeenWords} />
                  </h1>

                  {/* Duolingo Audio Speaker Controls (Only for Spanish, German, Japanese, French - never English) */}
                  {spokenQuestion && (
                    <div className="flex items-center gap-1.5 self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => speakText(spokenQuestion, activeCourse?.code, false)}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-md transition-all group"
                        title="Listen (Normal speed)"
                      >
                        <Volume2 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        type="button"
                        onClick={() => speakText(spokenQuestion, activeCourse?.code, true)}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-100 hover:bg-blue-200 active:scale-95 text-blue-700 flex items-center justify-center transition-all shadow-sm"
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
            <MultipleChoice
              challenge={challenge}
              status={status}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              onPass={handlePass}
              onFail={handleFail}
              courseCode={activeCourse?.code}
            />
          )}

          {/* 2. Translate This Sentence (Word Bank + Hover Hints) */}
          {isTranslate && (
            <TranslateSentence
              challenge={challenge}
              status={status}
              selectedWords={selectedWords}
              setSelectedWords={setSelectedWords}
              typedAnswer={typedAnswer}
              setTypedAnswer={setTypedAnswer}
              useKeyboard={useKeyboard}
              setUseKeyboard={setUseKeyboard}
              courseCode={activeCourse?.code}
            />
          )}

          {/* 3. Matching Pairs */}
          {challenge?.type === "matching" && (
            <Matching
              challenge={challenge}
              status={status}
              playCorrect={playCorrect}
              onPass={handlePass}
              onFail={() => {
                playWrong();
                reduceHearts();
                setHeartAnim(true);
                setTimeout(() => setHeartAnim(false), 1200);
                const cur = useUserStore.getState().hearts;
                if (cur <= 0) {
                  setTimeout(() => setShowOutOfHeartsModal(true), 600);
                }
              }}
              courseCode={activeCourse?.code}
            />
          )}

          {/* 4. Fill in the Blank (Cloze) */}
          {isFillInBlank && (
            <FillInBlank
              challenge={challenge}
              status={status}
              selectedOption={selectedBlankOption}
              onSelectOption={setSelectedBlankOption}
              courseCode={activeCourse?.code}
              seenWords={effectiveSeenWords}
            />
          )}

          {/* 5. Typing Challenge */}
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
        </div>
      </div>

      {/* Footer / Action Bar */}
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
                <span>Nicely done!</span>
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
            <div className="text-neutral-400 font-bold text-sm md:text-base">
              {isTranslate || isTyping
                ? "Form your answer and tap check"
                : isFillInBlank
                ? "Select a tile to fill in the blank"
                : "Select the correct option above"}
            </div>
          )}

          {(isTranslate || isTyping || isFillInBlank) && status === "none" ? (
            <Button
              disabled={!canCheck}
              onClick={
                isTranslate
                  ? handleCheckTranslate
                  : isTyping
                  ? handleCheckTyping
                  : isFillInBlank
                  ? handleCheckFillInBlank
                  : undefined
              }
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

      {/* Out of Hearts Modal (Option A) */}
      {showOutOfHeartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 flex flex-col items-center text-center shadow-2xl border-2 border-neutral-100">
            <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center mb-5 text-rose-500 shadow-inner">
              <Heart className="w-14 h-14 fill-rose-500 stroke-rose-500 animate-pulse" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-neutral-800 tracking-tight mb-2">
              You ran out of hearts!
            </h2>
            <p className="text-neutral-500 font-bold text-sm md:text-base mb-6 leading-relaxed">
              Keep learning by refilling your hearts with gems or recharging them via a quick practice workout.
            </p>

            <div className="flex flex-col gap-y-3 w-full">
              {/* Practice Option */}
              <Button
                onClick={() => navigate("/practice")}
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-center gap-x-2"
              >
                <span>PRACTICE (+1 ❤️)</span>
              </Button>

              {/* Instant Gem Refill */}
              <Button
                onClick={() => {
                  if (gems >= 50) {
                    spendGems(50);
                    refillHearts();
                    playCorrect();
                    setShowOutOfHeartsModal(false);
                  } else {
                    navigate("/shop");
                  }
                }}
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-x-2"
              >
                <Gem className="w-5 h-5 text-cyan-500 fill-cyan-400" />
                <span>REFILL TO 5 ❤️ (💎 50)</span>
              </Button>

              {/* Quit Lesson */}
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="default"
                className="w-full text-neutral-400 hover:text-neutral-600"
              >
                <span>END LESSON & GO HOME</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-neutral-200 flex flex-col items-center text-center gap-y-4">
            <h3 className="text-2xl font-black text-neutral-800">Quit Lesson?</h3>
            <p className="text-sm font-bold text-neutral-500">
              Are you sure you want to exit? You will lose all current progress in this lesson!
            </p>
            <div className="flex flex-col gap-y-2 w-full mt-2">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)} className="w-full">
                KEEP LEARNING
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
                END SESSION
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 1. Multiple Choice Component
function MultipleChoice({ challenge, status, selectedOption, setSelectedOption, onPass, onFail, courseCode }: any) {
  const onSelect = (option: any) => {
    if (status !== "none") return;
    // Only speak option if the question was an English prompt WITHOUT an extracted foreign phrase
    // (so options are in the target learning language, not English translations)
    const foreignPromptPhrase = extractForeignTargetPhrase(challenge?.question);
    if (!foreignPromptPhrase && isEnglishPrompt(challenge?.question)) {
      speakText(option.text, courseCode);
    }
    setSelectedOption(option.id);
    if (option.is_correct) onPass();
    else onFail();
  };

  return (
    <div className="grid grid-cols-1 gap-3.5 max-w-[560px] mx-auto w-full">
      {challenge.options.map((option: any) => {
        const isSelected = selectedOption === option.id;
        const romaji = getRomajiReading(option.text);
        let borderClass = "border-neutral-200 border-b-4";
        let bgClass = "bg-white hover:bg-neutral-50";
        let textClass = "text-neutral-700";

        if (isSelected) {
          if (status === "correct") {
            borderClass = "border-emerald-500 border-b-4";
            bgClass = "bg-emerald-50";
            textClass = "text-emerald-700";
          } else if (status === "wrong") {
            borderClass = "border-rose-500 border-b-4";
            bgClass = "bg-rose-50";
            textClass = "text-rose-700";
          }
        } else if (status !== "none") {
          bgClass = "bg-white opacity-70";
        }

        return (
          <div
            key={option.id}
            onClick={() => onSelect(option)}
            className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center active:translate-y-1 active:border-b-2 shadow-sm ${borderClass} ${bgClass} ${textClass} ${
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
  );
}

// 2. Translate This Sentence with Interactive Word Bank & Keyboard Toggle
function TranslateSentence({
  challenge,
  status,
  selectedWords,
  setSelectedWords,
  typedAnswer,
  setTypedAnswer,
  useKeyboard,
  setUseKeyboard,
}: any) {
  const addWord = (opt: any) => {
    if (status !== "none") return;
    // Word bank words are English, do not speak them
    setSelectedWords((prev: any[]) => [...prev, { id: String(opt.id), text: opt.text }]);
  };

  const removeWord = (indexToRemove: number) => {
    if (status !== "none") return;
    setSelectedWords((prev: any[]) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full flex flex-col gap-y-6">
      {useKeyboard ? (
        <textarea
          className={`w-full p-4 border-2 rounded-2xl text-lg font-bold resize-none h-28 focus:outline-none transition-all ${
            status === "none"
              ? "border-neutral-200 focus:border-blue-500"
              : status === "correct"
              ? "border-emerald-500 text-emerald-700 bg-emerald-50"
              : "border-rose-500 text-rose-700 bg-rose-50"
          }`}
          placeholder="Type the English translation..."
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          disabled={status !== "none"}
          autoFocus
        />
      ) : (
        <>
          {/* Selected Words Area */}
          <div className="w-full min-h-[68px] border-b-2 border-neutral-300 pb-3 flex flex-wrap items-center gap-2">
            {selectedWords.map((wordObj: any, idx: number) => {
              const romaji = getRomajiReading(wordObj.text);
              return (
                <button
                  key={`${wordObj.id}-${idx}`}
                  disabled={status !== "none"}
                  onClick={() => removeWord(idx)}
                  className="px-4 py-2 bg-white border-2 border-b-4 border-neutral-200 rounded-2xl font-black text-base text-neutral-800 shadow-sm hover:border-neutral-300 active:translate-y-1 active:border-b-2 transition-all flex flex-col items-center"
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

          {/* Word Bank Pool */}
          <div className="w-full flex flex-wrap gap-2.5 justify-center pt-2">
            {challenge.options.map((opt: any) => {
              const isUsed = selectedWords.some((w: any) => w.id === String(opt.id));
              const romaji = getRomajiReading(opt.text);
              return (
                <button
                  key={opt.id}
                  disabled={isUsed || status !== "none"}
                  onClick={() => addWord(opt)}
                  className={`px-4 py-2 rounded-2xl font-black text-base transition-all border-2 border-b-4 flex flex-col items-center justify-center ${
                    isUsed
                      ? "opacity-25 bg-neutral-200 border-neutral-300 pointer-events-none"
                      : "bg-white border-neutral-200 text-neutral-800 hover:border-neutral-300 active:translate-y-1 active:border-b-2 shadow-sm"
                  }`}
                >
                  {romaji && (
                    <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase leading-none mb-0.5">
                      {romaji}
                    </span>
                  )}
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Keyboard / Word Bank Toggle */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => setUseKeyboard(!useKeyboard)}
          className="flex items-center gap-x-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition"
        >
          {useKeyboard ? (
            <>
              <LayoutGrid className="w-4 h-4" />
              <span>USE WORD BANK</span>
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4" />
              <span>USE KEYBOARD</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// 3. Word Matching Pairs (Duolingo Style with Romaji furigana & speech audio)
function Matching({ challenge, status, playCorrect, onPass, onFail, courseCode }: any) {
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
        // Deselect
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
        if (playCorrect) playCorrect();

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

// 4. Fill In The Blank (Cloze) Component
function FillInBlank({ challenge, status, selectedOption, onSelectOption, courseCode, seenWords }: any) {
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
            width={110}
            height={110}
            className="rounded-2xl border-2 border-neutral-200 object-contain shadow-sm"
          />
          <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
            <Volume2 className="w-3.5 h-3.5" />
          </span>
        </button>
        <div className="flex-1 bg-white border-2 border-neutral-200 rounded-2xl p-6 relative shadow-sm text-center md:text-left flex items-center justify-between gap-x-4">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-neutral-200 rotate-45 hidden md:block"></div>
          <div className="text-xl md:text-2xl font-black text-neutral-800 leading-snug flex items-center flex-wrap justify-center md:justify-start gap-2 flex-1">
            <InteractiveText text={before} hintsJson={challenge?.hints} seenWords={seenWords} />
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
                  <InteractiveText text={selectedOption.text} hintsJson={challenge?.hints} seenWords={seenWords} />
                </>
              ) : (
                "______"
              )}
            </span>
            <InteractiveText text={after} hintsJson={challenge?.hints} seenWords={seenWords} />
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
            <OptionTileWithHint
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

function OptionTileWithHint({
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
