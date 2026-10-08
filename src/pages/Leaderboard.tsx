import { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { Shield, Trophy, Flame, Sparkles } from "lucide-react";
import { API_BASE } from "@/utils/api";

interface LeaderboardUser {
  id: string;
  name: string;
  imageSrc: string;
  xp: number;
  is_current?: boolean;
}

const LEAGUES = [
  { name: "Bronze League", color: "text-amber-600 bg-amber-100", active: true },
  { name: "Silver League", color: "text-slate-500 bg-slate-100", active: false },
  { name: "Gold League", color: "text-yellow-600 bg-yellow-100", active: false },
  { name: "Diamond League", color: "text-cyan-600 bg-cyan-100", active: false },
];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState("Bronze League");
  const token = useUserStore((state) => state.token);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/api/leaderboard`, { headers });
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token]);

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 md:px-8 py-10 flex flex-col items-center">
      {/* Header Banner */}
      <div className="w-full flex flex-col items-center text-center pb-8 border-b-2 border-neutral-200">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center mb-4 shadow-sm">
          <Trophy className="w-12 h-12 text-amber-500 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-neutral-800 tracking-tight">
          Leaderboard
        </h1>
        <p className="text-neutral-500 font-bold text-base md:text-lg mt-2">
          Compete against learners worldwide! Top learners gain promotion every week.
        </p>

        {/* League Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {LEAGUES.map((league) => (
            <button
              key={league.name}
              onClick={() => setSelectedLeague(league.name)}
              className={`px-4 py-2 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all ${
                selectedLeague === league.name
                  ? "bg-amber-400 text-white shadow-sm scale-105 border-b-4 border-amber-500"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>
      </div>

      {/* Promotion Zone Notification */}
      <div className="w-full mt-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800">
        <div className="flex items-center gap-x-2 font-black text-sm">
          <Sparkles className="w-5 h-5 text-emerald-600 fill-emerald-600" />
          <span>PROMOTION ZONE: Top 7 players advance to the next league!</span>
        </div>
        <Shield className="w-5 h-5 text-emerald-600" />
      </div>

      {/* Leaderboard List */}
      <div className="w-full flex flex-col mt-6 gap-y-2">
        {leaderboard.map((user, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const isCurrent = !!user.is_current;

          return (
            <div
              key={user.id}
              className={`flex items-center w-full p-4 rounded-2xl border-2 transition-all ${
                isCurrent
                  ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20 shadow-md font-black"
                  : "bg-white border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/60"
              }`}
            >
              {/* Rank Number / Medal */}
              <div className="w-10 flex items-center justify-center mr-4">
                {rank === 1 ? (
                  <span className="text-2xl" title="1st Place">🥇</span>
                ) : rank === 2 ? (
                  <span className="text-2xl" title="2nd Place">🥈</span>
                ) : rank === 3 ? (
                  <span className="text-2xl" title="3rd Place">🥉</span>
                ) : (
                  <span className="font-black text-neutral-400 text-base">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <img
                src={user.imageSrc}
                alt="Avatar"
                width={48}
                height={48}
                className={`rounded-2xl border-2 mr-4 object-cover ${
                  isTop3 ? "border-amber-400" : "border-neutral-200"
                }`}
              />

              {/* Player Name */}
              <div className="flex-1 flex items-center gap-x-2">
                <p className={`font-black text-base md:text-lg ${isCurrent ? "text-emerald-700" : "text-neutral-800"}`}>
                  {user.name}
                </p>
                {isCurrent && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    YOU
                  </span>
                )}
              </div>

              {/* XP Display */}
              <div className="flex items-center gap-x-1.5 font-black text-neutral-600 text-sm md:text-base">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>{user.xp} XP</span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="py-16 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-3"></div>
            <p className="text-neutral-400 font-bold">Loading standings...</p>
          </div>
        )}
      </div>
    </div>
  );
}
