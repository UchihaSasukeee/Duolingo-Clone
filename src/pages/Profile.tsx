import { useUser, SignOutButton } from "@clerk/react";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/Button";
import { Flame, Gem, Heart, Zap, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { CountryFlag } from "@/components/CountryFlag";

export default function Profile() {
  const { user } = useUser();
  const { xp, streak, gems, hearts, activeCourse } = useUserStore();

  return (
    <div className="flex flex-col h-full items-center px-4 md:px-8 pt-10 pb-[100px] max-w-[800px] mx-auto">
      <div className="w-full flex flex-col items-center gap-y-6">
        <h1 className="text-3xl md:text-4xl font-black text-neutral-800">Your Profile</h1>

        {user ? (
          <div className="flex flex-col items-center w-full p-6 md:p-8 rounded-3xl border-2 border-neutral-200 bg-white shadow-sm mt-2">
            {/* Avatar & User Details */}
            <img
              src={user.imageUrl}
              alt="Avatar"
              className="w-28 h-28 rounded-3xl mb-4 border-4 border-emerald-400 shadow-md object-cover"
            />
            <h2 className="text-2xl md:text-3xl font-black text-neutral-800 tracking-tight">
              {user.fullName || user.username || "Language Learner"}
            </h2>
            <p className="text-neutral-400 font-bold text-sm mb-6">
              {user.primaryEmailAddress?.emailAddress}
            </p>

            {/* Currently Learning Card */}
            <div className="w-full bg-neutral-50 border-2 border-neutral-200 rounded-2xl p-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-x-3.5">
                <CountryFlag code={activeCourse?.code} title={activeCourse?.title} size="lg" />
                <div>
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Currently Learning</span>
                  <span className="text-lg font-black text-neutral-800">{activeCourse?.title || "Spanish"}</span>
                </div>
              </div>
              <Link to="/courses">
                <Button variant="outline" size="sm">
                  CHANGE
                </Button>
              </Link>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
              {/* Streak */}
              <div className="flex flex-col items-center p-4 border-2 border-neutral-200 rounded-2xl bg-orange-50/50">
                <Flame className="w-7 h-7 text-orange-500 fill-orange-500 mb-1" />
                <span className="font-black text-2xl text-neutral-800">{streak}</span>
                <span className="font-bold text-xs text-neutral-400 uppercase">Day Streak</span>
              </div>

              {/* Total XP */}
              <div className="flex flex-col items-center p-4 border-2 border-neutral-200 rounded-2xl bg-amber-50/50">
                <Zap className="w-7 h-7 text-amber-500 fill-amber-500 mb-1" />
                <span className="font-black text-2xl text-neutral-800">{xp}</span>
                <span className="font-bold text-xs text-neutral-400 uppercase">Total XP</span>
              </div>

              {/* Gems */}
              <div className="flex flex-col items-center p-4 border-2 border-neutral-200 rounded-2xl bg-blue-50/50">
                <Gem className="w-7 h-7 text-blue-500 fill-blue-500 mb-1" />
                <span className="font-black text-2xl text-neutral-800">{gems}</span>
                <span className="font-bold text-xs text-neutral-400 uppercase">Gems</span>
              </div>

              {/* Hearts */}
              <div className="flex flex-col items-center p-4 border-2 border-neutral-200 rounded-2xl bg-rose-50/50">
                <Heart className="w-7 h-7 text-rose-500 fill-rose-500 mb-1" />
                <span className="font-black text-2xl text-neutral-800">{hearts} / 5</span>
                <span className="font-bold text-xs text-neutral-400 uppercase">Hearts</span>
              </div>
            </div>

            {/* Achievements & Badges */}
            <div className="w-full flex flex-col gap-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-black text-neutral-800">Achievements</h3>
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {[streak >= 3, xp >= 100, xp >= 40, xp >= 60].filter(Boolean).length} / 4 Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Wildfire */}
                <div
                  className={`p-4 md:p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    streak >= 3
                      ? "bg-white border-orange-300 shadow-sm"
                      : "bg-neutral-50/70 border-neutral-200 opacity-90"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${
                      streak >= 3
                        ? "bg-orange-100 border-orange-300 text-orange-500 shadow-inner"
                        : "bg-neutral-100 border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <Flame className="w-8 h-8 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-black text-base text-neutral-800">Wildfire</span>
                      <span className="text-xs font-black text-neutral-400">Level 1</span>
                    </div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">
                      Reach a 3-day learning streak
                    </p>
                    <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (streak / 3) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 mt-1">
                      <span>{streak >= 3 ? "COMPLETED ✓" : `${streak} / 3 Days`}</span>
                      <span>{Math.round(Math.min(100, (streak / 3) * 100))}%</span>
                    </div>
                  </div>
                </div>

                {/* Sage */}
                <div
                  className={`p-4 md:p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    xp >= 100
                      ? "bg-white border-amber-300 shadow-sm"
                      : "bg-neutral-50/70 border-neutral-200 opacity-90"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${
                      xp >= 100
                        ? "bg-amber-100 border-amber-300 text-amber-500 shadow-inner"
                        : "bg-neutral-100 border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <Zap className="w-8 h-8 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-black text-base text-neutral-800">Sage</span>
                      <span className="text-xs font-black text-neutral-400">Level 1</span>
                    </div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">
                      Earn 100 total experience points
                    </p>
                    <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (xp / 100) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 mt-1">
                      <span>{xp >= 100 ? "COMPLETED ✓" : `${xp} / 100 XP`}</span>
                      <span>{Math.round(Math.min(100, (xp / 100) * 100))}%</span>
                    </div>
                  </div>
                </div>

                {/* Scholar */}
                <div
                  className={`p-4 md:p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    xp >= 60
                      ? "bg-white border-blue-300 shadow-sm"
                      : "bg-neutral-50/70 border-neutral-200 opacity-90"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${
                      xp >= 60
                        ? "bg-blue-100 border-blue-300 text-blue-500 shadow-inner"
                        : "bg-neutral-100 border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <Gem className="w-8 h-8 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-black text-base text-neutral-800">Scholar</span>
                      <span className="text-xs font-black text-neutral-400">Level 1</span>
                    </div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">
                      Master vocabulary in challenges
                    </p>
                    <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (xp / 60) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 mt-1">
                      <span>{xp >= 60 ? "COMPLETED ✓" : `${Math.min(20, Math.floor(xp / 3))} / 20 Words`}</span>
                      <span>{Math.round(Math.min(100, (xp / 60) * 100))}%</span>
                    </div>
                  </div>
                </div>

                {/* Champion */}
                <div
                  className={`p-4 md:p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    xp >= 40
                      ? "bg-white border-emerald-300 shadow-sm"
                      : "bg-neutral-50/70 border-neutral-200 opacity-90"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${
                      xp >= 40
                        ? "bg-emerald-100 border-emerald-300 text-emerald-600 shadow-inner"
                        : "bg-neutral-100 border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <Heart className="w-8 h-8 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-black text-base text-neutral-800">Champion</span>
                      <span className="text-xs font-black text-neutral-400">Level 1</span>
                    </div>
                    <p className="text-xs font-bold text-neutral-500 mb-2">
                      Complete learning unit milestones
                    </p>
                    <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (xp / 40) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 mt-1">
                      <span>{xp >= 40 ? "COMPLETED ✓" : `${xp >= 40 ? 1 : 0} / 1 Unit`}</span>
                      <span>{Math.round(Math.min(100, (xp / 40) * 100))}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <SignOutButton>
              <Button variant="danger" className="w-full flex items-center justify-center gap-x-2">
                <LogOut className="w-5 h-5" />
                SIGN OUT
              </Button>
            </SignOutButton>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3"></div>
            <p className="text-neutral-400 font-bold">Loading profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}
