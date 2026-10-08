import { Link } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { UserButton } from "@clerk/react";
import { Flame, Gem, Heart, ChevronDown, Zap } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";

export function Header() {
  const { streak, xp, gems, hearts, activeCourse } = useUserStore();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur border-b-2 border-neutral-200 px-4 lg:px-8 py-3">
      <div className="max-w-[1140px] mx-auto flex items-center justify-between">
        {/* Left: Active Course Switcher */}
        <Link
          to="/courses"
          className="flex items-center gap-x-2.5 px-3 py-1.5 rounded-xl border-2 border-neutral-200 hover:bg-neutral-100 transition font-bold text-neutral-700 text-sm md:text-base shadow-sm active:translate-y-0.5"
          title="Switch Language Course"
        >
          <CountryFlag code={activeCourse?.code} title={activeCourse?.title} size="md" />
          <span className="font-extrabold text-neutral-800">{activeCourse?.title || "Spanish"}</span>
          <ChevronDown className="w-4 h-4 text-neutral-400 stroke-[2.5]" />
        </Link>

        {/* Right: Stats (Streak, Gems, Hearts) & User Profile */}
        <div className="flex items-center gap-x-4 md:gap-x-6">
          {/* Streak */}
          <div
            className="flex items-center gap-x-1.5 text-orange-500 font-extrabold cursor-default"
            title={`${streak} day streak`}
          >
            <Flame className="w-6 h-6 fill-orange-500 stroke-orange-500 animate-pulse" />
            <span className="text-sm md:text-base">{streak}</span>
          </div>

          {/* XP */}
          <div
            className="flex items-center gap-x-1.5 text-amber-500 font-extrabold cursor-default"
            title={`${xp} total XP`}
          >
            <Zap className="w-6 h-6 fill-amber-500 stroke-amber-500" />
            <span className="text-sm md:text-base">{xp}</span>
          </div>

          {/* Gems */}
          <Link
            to="/shop"
            className="flex items-center gap-x-1.5 text-blue-500 font-extrabold hover:opacity-80 transition"
            title={`${gems} gems - Click to visit shop`}
          >
            <Gem className="w-6 h-6 fill-blue-500 stroke-blue-500" />
            <span className="text-sm md:text-base">{gems}</span>
          </Link>

          {/* Hearts / Daily Lessons */}
          <Link
            to="/shop"
            className="flex items-center gap-x-1.5 text-rose-500 font-extrabold hover:opacity-80 transition"
            title={`${hearts} / 5 daily lessons remaining - Click to refill in shop`}
          >
            <Heart className="w-6 h-6 fill-rose-500 stroke-rose-500" />
            <span className="text-sm md:text-base">{hearts}</span>
          </Link>

          {/* Clerk Profile Button */}
          <div className="pl-1 border-l-2 border-neutral-200 flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
