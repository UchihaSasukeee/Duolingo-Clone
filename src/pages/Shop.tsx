import { useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/Button";
import { Heart, Flame, Shield, Sparkles, Check, Gem } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function ShopPage() {
  const { hearts, gems, refillHearts, spendGems } = useUserStore();
  const { playCorrect, playWrong } = useSoundEffects();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRefillHearts = () => {
    if (hearts === 5) return;
    if (spendGems(50)) {
      refillHearts();
      playCorrect();
      showToast("❤️ Hearts completely refilled to 5!");
    } else {
      playWrong();
      showToast("❌ Not enough gems! Earn gems by completing lessons.");
    }
  };

  const handleBuyStreakFreeze = () => {
    if (spendGems(150)) {
      playCorrect();
      showToast("🧊 Streak Freeze equipped! Your streak is protected.");
    } else {
      playWrong();
      showToast("❌ Not enough gems! Need 150 gems.");
    }
  };

  const handleBuyUnlimitedPass = () => {
    if (spendGems(200)) {
      refillHearts();
      playCorrect();
      showToast("⚡ Super Power Pass activated! Full hearts granted.");
    } else {
      playWrong();
      showToast("❌ Not enough gems! Need 200 gems.");
    }
  };

  return (
    <div className="flex flex-col h-full items-center px-4 md:px-8 pt-10 pb-[100px] max-w-[840px] mx-auto">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="fixed top-20 z-50 bg-neutral-900 text-white font-black px-6 py-3 rounded-2xl shadow-xl animate-fade-in flex items-center gap-x-2">
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-indigo-700">
        <div className="flex flex-col gap-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-x-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit mx-auto md:mx-0">
            <Sparkles className="w-4 h-4" />
            Gem Bazaar
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Supercharge Your Learning</h2>
          <p className="font-bold text-sm md:text-base text-blue-100">
            Equip streak freezes, refill hearts, and unlock practice boosts using your earned gems.
          </p>
        </div>

        <div className="flex items-center gap-x-2 bg-white/20 backdrop-blur px-5 py-3 rounded-2xl border-2 border-white/30 shadow-inner">
          <Gem className="w-8 h-8 fill-cyan-300 stroke-cyan-300" />
          <span className="text-2xl font-black">{gems} Gems</span>
        </div>
      </div>

      <div className="w-full flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-neutral-800">Power-Ups & Refills</h1>
      </div>

      <div className="w-full flex flex-col gap-y-4">
        {/* Refill Hearts */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl border-2 border-neutral-200 bg-white gap-4 shadow-sm hover:border-neutral-300 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500">
            <Heart className="w-9 h-9 fill-rose-500 stroke-rose-500" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-black text-xl text-neutral-800">Refill Hearts</h3>
            <p className="text-sm font-bold text-neutral-500 mt-1">
              Restore your hearts to maximum (5/5) so you can keep tackling challenges without worry.
            </p>
          </div>
          <Button
            onClick={handleRefillHearts}
            disabled={hearts === 5 || gems < 50}
            variant={hearts === 5 ? "ghost" : gems >= 50 ? "secondary" : "outline"}
            className="w-full sm:w-[140px] flex items-center justify-center gap-x-1.5"
          >
            {hearts === 5 ? (
              <span className="flex items-center gap-x-1 text-emerald-600 font-black">
                <Check className="w-4 h-4 stroke-[3]" /> FULL
              </span>
            ) : (
              <span>💎 50</span>
            )}
          </Button>
        </div>

        {/* Streak Freeze */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl border-2 border-neutral-200 bg-white gap-4 shadow-sm hover:border-neutral-300 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center flex-shrink-0 text-sky-500">
            <Shield className="w-9 h-9 stroke-[2.5]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-black text-xl text-neutral-800">Streak Freeze</h3>
            <p className="text-sm font-bold text-neutral-500 mt-1">
              Protect your study streak if you miss a day of practice. Equips automatically!
            </p>
          </div>
          <Button
            onClick={handleBuyStreakFreeze}
            disabled={gems < 150}
            variant={gems >= 150 ? "primary" : "outline"}
            className="w-full sm:w-[140px]"
          >
            💎 150
          </Button>
        </div>

        {/* Unlimited Pass */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl border-2 border-neutral-200 bg-white gap-4 shadow-sm hover:border-neutral-300 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-500">
            <Flame className="w-9 h-9 fill-amber-500 stroke-amber-500" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-black text-xl text-neutral-800">Super Energy Elixir</h3>
            <p className="text-sm font-bold text-neutral-500 mt-1">
              Replenishes all hearts immediately and awards a special gold aura to your avatar!
            </p>
          </div>
          <Button
            onClick={handleBuyUnlimitedPass}
            disabled={gems < 200}
            variant={gems >= 200 ? "primary" : "outline"}
            className="w-full sm:w-[140px]"
          >
            💎 200
          </Button>
        </div>
      </div>
    </div>
  );
}
