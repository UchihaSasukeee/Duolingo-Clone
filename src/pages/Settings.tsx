import { useState } from "react";
import { Volume2, Mic, Moon, Sparkles, Users } from "lucide-react";

export default function Settings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechAudioEnabled, setSpeechAudioEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState<number>(20);

  const goalOptions = [
    { label: "Casual", xp: 10, time: "5 mins / day" },
    { label: "Regular", xp: 20, time: "10 mins / day" },
    { label: "Serious", xp: 30, time: "15 mins / day" },
    { label: "Intense", xp: 50, time: "20 mins / day" },
  ];

  return (
    <div className="flex flex-col h-full items-center px-4 md:px-8 pt-10 pb-[100px] max-w-[720px] mx-auto w-full">
      <div className="w-full flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-neutral-800">Settings</h1>
          <p className="text-sm font-bold text-neutral-400">Manage your learning preferences, audio, and goals.</p>
        </div>

        {/* 1. Preferences & Audio */}
        <div className="bg-white border-2 border-neutral-200 rounded-3xl p-6 shadow-sm flex flex-col gap-y-5">
          <h2 className="text-lg font-black text-neutral-800 uppercase tracking-wider text-xs text-neutral-400">
            Audio & Feedback
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-neutral-800 block">Sound Effects</span>
                <span className="text-xs text-neutral-400 font-bold">Chimes and celebratory sounds</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                soundEnabled ? "bg-emerald-500 justify-end" : "bg-neutral-300 justify-start"
              }`}
            >
              <div className="bg-white w-5 h-5 rounded-full shadow-md" />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-neutral-800 block">Pronunciation & Speech Voice</span>
                <span className="text-xs text-neutral-400 font-bold">Native voice pronunciation for foreign words</span>
              </div>
            </div>
            <button
              onClick={() => setSpeechAudioEnabled(!speechAudioEnabled)}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                speechAudioEnabled ? "bg-emerald-500 justify-end" : "bg-neutral-300 justify-start"
              }`}
            >
              <div className="bg-white w-5 h-5 rounded-full shadow-md" />
            </button>
          </div>

          {/* Daily Goal Selection */}
          <div className="flex flex-col gap-y-3 pt-2">
            <span className="font-extrabold text-neutral-800 block">Daily XP Goal</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {goalOptions.map((g) => {
                const isSelected = dailyGoal === g.xp;
                return (
                  <button
                    key={g.label}
                    onClick={() => setDailyGoal(g.xp)}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <span className="font-black text-sm">{g.label}</span>
                    <span className="text-xs font-bold text-neutral-400">{g.xp} XP / day</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Placeholders / Coming Soon Features */}
        <div className="bg-white border-2 border-neutral-200 rounded-3xl p-6 shadow-sm flex flex-col gap-y-4">
          <h2 className="text-lg font-black text-neutral-800 uppercase tracking-wider text-xs text-neutral-400">
            Coming Soon / Mocked Features
          </h2>

          {/* Super Duolingo */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
                ✨
              </div>
              <div>
                <span className="font-extrabold text-neutral-800 block">Super Duolingo (In-App Purchases)</span>
                <span className="text-xs text-neutral-500 font-bold">Unlimited hearts, progress mastery, ad-free experience</span>
              </div>
            </div>
            <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          {/* Speech Recognition */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/60">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-neutral-800 block">Speech Recognition (Microphone)</span>
                <span className="text-xs text-neutral-500 font-bold">Live AI pronunciation check & speaking practice</span>
              </div>
            </div>
            <span className="text-xs font-black bg-neutral-200 text-neutral-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/60">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-neutral-800 block">Dark Mode</span>
                <span className="text-xs text-neutral-500 font-bold">OLED high contrast theme for night learning</span>
              </div>
            </div>
            <span className="text-xs font-black bg-neutral-200 text-neutral-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          {/* Social / Friends */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/60">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-neutral-800 block">Friends & Social Quests</span>
                <span className="text-xs text-neutral-500 font-bold">Cooperative weekly goals with friends</span>
              </div>
            </div>
            <span className="text-xs font-black bg-neutral-200 text-neutral-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
