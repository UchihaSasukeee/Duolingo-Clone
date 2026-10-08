import { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { Target, Trophy, Sparkles, Check, Gem } from "lucide-react";
import { Button } from "@/components/Button";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { API_BASE } from "@/utils/api";

interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward_gems: number;
  completed: boolean;
  claimed: boolean;
}

export default function QuestsPage() {
  const { xp, claimQuest, token } = useUserStore();
  const { playCorrect } = useSoundEffects();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [claimedQuests, setClaimedQuests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/quests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Quest[]) => {
        setQuests(data);
        const alreadyClaimed = new Set(data.filter((q) => q.claimed).map((q) => q.id));
        setClaimedQuests(alreadyClaimed);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [token, xp]);

  const handleClaim = async (quest: Quest) => {
    if (claimedQuests.has(quest.id) || !quest.completed) return;
    playCorrect();
    // Optimistically mark as claimed
    setClaimedQuests((prev) => new Set(prev).add(quest.id));
    const res = await claimQuest(quest.id);
    if (!res) {
      // Revert if backend claim failed
      setClaimedQuests((prev) => {
        const next = new Set(prev);
        next.delete(quest.id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full items-center px-4 md:px-8 pt-10 pb-[100px] max-w-[840px] mx-auto">
      {/* Monthly Challenge Banner */}
      <div className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-3xl p-6 md:p-8 text-neutral-900 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-amber-600">
        <div className="flex flex-col gap-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-x-2 bg-white/30 backdrop-blur px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit mx-auto md:mx-0">
            <Trophy className="w-4 h-4" />
            Monthly Badge Challenge
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">October Quest Champion</h2>
          <p className="font-bold text-sm md:text-base text-neutral-800">
            Earn 200 XP this month to unlock the exclusive October Polyglot badge!
          </p>
          <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden mt-2">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((xp / 200) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-black text-neutral-800 mt-1">
            {Math.min(xp, 200)} / 200 XP completed
          </span>
        </div>

        <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-inner">
          <Trophy className="w-14 h-14 text-white stroke-[2.5]" />
        </div>
      </div>

      {/* Daily Quests Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-800 flex items-center gap-x-2">
            <Target className="w-7 h-7 text-emerald-500 stroke-[2.5]" />
            Daily Quests
          </h1>
          <p className="text-sm font-bold text-neutral-500 mt-1">
            Complete daily quests to collect shiny bonus gems!
          </p>
        </div>
      </div>

      {/* Quests List */}
      <div className="w-full flex flex-col gap-y-4">
        {quests.map((quest) => {
          const progressPercent = Math.min((quest.current / quest.target) * 100, 100);
          const isDone = quest.completed;
          const isClaimed = claimedQuests.has(quest.id);

          return (
            <div
              key={quest.id}
              className={`flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl border-2 transition-all gap-4 ${
                isDone
                  ? "bg-emerald-50/60 border-emerald-400 shadow-sm"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div className="flex-1 w-full flex flex-col gap-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg md:text-xl text-neutral-800 flex items-center gap-x-2">
                    {quest.title}
                    {isDone && <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />}
                  </h3>
                  <div className="flex items-center gap-x-1 text-blue-500 font-black text-sm">
                    <Gem className="w-4 h-4 fill-blue-500" />
                    <span>+{quest.reward_gems}</span>
                  </div>
                </div>

                <p className="text-sm font-bold text-neutral-500">{quest.description}</p>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-200 h-3 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-black text-neutral-400">
                  <span>Progress</span>
                  <span>{quest.current} / {quest.target} XP</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full sm:w-auto flex-shrink-0">
                {isClaimed ? (
                  <Button variant="ghost" disabled className="w-full sm:w-[130px] text-emerald-600 font-black">
                    CLAIMED ✓
                  </Button>
                ) : isDone ? (
                  <Button
                    onClick={() => handleClaim(quest)}
                    variant="secondary"
                    className="w-full sm:w-[130px] flex items-center justify-center gap-x-1.5 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    CLAIM
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full sm:w-[130px] opacity-60">
                    LOCKED
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="py-16 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3"></div>
            <p className="text-neutral-400 font-bold">Loading daily quests...</p>
          </div>
        )}
      </div>
    </div>
  );
}
