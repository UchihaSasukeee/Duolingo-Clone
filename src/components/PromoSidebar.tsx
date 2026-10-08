import { Link } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "./Button";
import { Shield, Target, Heart, Dumbbell } from "lucide-react";

export function PromoSidebar() {
  const { hearts, xp } = useUserStore();

  return (
    <aside className="w-[340px] hidden xl:flex flex-col gap-y-6 pt-6 pr-4 sticky top-16 h-fit">
      {/* Hearts / Super Widget */}
      <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col gap-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-neutral-800 text-lg">Daily Lessons</h3>
          <div className="flex items-center gap-x-1 text-rose-500 font-extrabold">
            <Heart className="w-5 h-5 fill-rose-500" />
            <span>{hearts} / 5</span>
          </div>
        </div>

        {hearts < 5 ? (
          <>
            <p className="text-sm text-neutral-500 font-bold">
              {hearts === 0
                ? "Daily lesson limit reached! Practice to unlock +1 bonus lesson, or refill with gems."
                : `${hearts} lessons left today. Practice anytime to unlock bonus lessons (+1 ❤️).`}
            </p>
            <div className="flex flex-col gap-y-2 mt-1">
              <Link to="/practice">
                <Button variant="secondary" className="w-full flex items-center justify-center gap-x-2">
                  <Dumbbell className="w-5 h-5" />
                  PRACTICE FOR HEARTS (+1 ❤️)
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" className="w-full text-sm">
                  REFILL IN SHOP (💎 50)
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500 font-bold">
              All 5 daily lessons available! Hearts replenish daily, and mistakes never cost hearts.
            </p>
            <Link to="/practice" className="mt-1">
              <Button variant="outline" className="w-full flex items-center justify-center gap-x-2">
                <Dumbbell className="w-5 h-5" />
                PRACTICE MODE
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Daily Quests Widget */}
      <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col gap-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Target className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-neutral-800 text-lg">Daily Quests</h3>
          </div>
          <Link to="/quests" className="text-blue-500 font-extrabold text-xs uppercase hover:underline">
            VIEW ALL
          </Link>
        </div>

        {/* Quest 1 */}
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between text-xs font-bold text-neutral-600">
            <span>Earn 20 XP</span>
            <span>{Math.min(xp, 20)} / 20 XP</span>
          </div>
          <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((xp / 20) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Quest 2 */}
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between text-xs font-bold text-neutral-600">
            <span>Earn 50 XP</span>
            <span>{Math.min(xp, 50)} / 50 XP</span>
          </div>
          <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((xp / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Widget */}
      <div className="border-2 border-neutral-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col gap-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            <h3 className="font-extrabold text-neutral-800 text-lg">Bronze League</h3>
          </div>
          <Link to="/leaderboard" className="text-blue-500 font-extrabold text-xs uppercase hover:underline">
            VIEW
          </Link>
        </div>
        <p className="text-sm text-neutral-500 font-bold">
          Top 10 players advance to Silver League each week! Complete lessons to climb the ranks.
        </p>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400 font-bold px-2">
        <span>ABOUT</span>
        <span>•</span>
        <span>BLOG</span>
        <span>•</span>
        <span>STORE</span>
        <span>•</span>
        <span>TERMS</span>
        <span>•</span>
        <span>PRIVACY</span>
      </div>
    </aside>
  );
}
