import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { PromoSidebar } from "@/components/PromoSidebar";
import { GuidebookModal } from "@/components/GuidebookModal";
import { BookOpen, Check, Lock, Sparkles, Star } from "lucide-react";
import { API_BASE } from "@/utils/api";

interface Lesson {
  id: number;
  title: string;
  order: number;
  completed?: boolean;
  locked?: boolean;
  is_current?: boolean;
}

interface Unit {
  id: number;
  title: string;
  description: string;
  order: number;
  guidebook: string | null;
  lessons: Lesson[];
}

export default function Home() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGuidebookUnit, setActiveGuidebookUnit] = useState<Unit | null>(null);

  const token = useUserStore((state) => state.token);
  const activeCourseId = useUserStore((state) => state.active_course_id);
  const activeCourse = useUserStore((state) => state.activeCourse);

  useEffect(() => {
    if (!token || !activeCourseId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const targetCourse = activeCourseId || 1;
    fetch(`${API_BASE}/api/units?course_id=${targetCourse}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUnits(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching units:", err);
        setIsLoading(false);
      });
  }, [token, activeCourseId]);

  // Sinuous horizontal offset pattern: [0, 40, 60, 40, 0, -40, -60, -40]
  const offsets = [0, 40, 60, 40, 0, -40, -60, -40];

  return (
    <div className="flex justify-center px-4 md:px-8 py-8 gap-x-12 min-h-full">
      {/* Main Learning Path Column */}
      <div className="w-full max-w-[620px] flex flex-col items-center pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-y-4">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-emerald-600 rounded-full animate-spin" />
            <span className="font-extrabold text-neutral-400 text-sm">Loading your learning path...</span>
          </div>
        ) : (
          units.map((unit, unitIndex) => {
          return (
            <div key={unit.id} className="w-full mb-14">
              {/* Unit Header Banner */}
              <div
                className={`p-6 rounded-3xl w-full flex items-center justify-between shadow-sm mb-12 text-white relative overflow-hidden ${
                  unitIndex % 2 === 0
                    ? "bg-gradient-to-r from-[var(--color-green-500)] to-emerald-600 border-b-4 border-emerald-700"
                    : "bg-gradient-to-r from-[var(--color-blue-500)] to-sky-600 border-b-4 border-sky-700"
                }`}
              >
                <div className="flex flex-col gap-y-1 max-w-[70%]">
                  <div className="flex items-center gap-x-2 text-white/90 text-sm font-black uppercase tracking-wider">
                    <span>{unit.title}</span>
                    <span>•</span>
                    <span>{activeCourse?.title || "Language"}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                    {unit.description}
                  </h2>
                </div>

                {/* Guidebook Button */}
                <button
                  onClick={() => setActiveGuidebookUnit(unit)}
                  className="flex items-center gap-x-2 bg-white/20 hover:bg-white/30 backdrop-blur active:translate-y-0.5 transition px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider text-white border-2 border-white/30 shadow-sm"
                >
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                  <span>GUIDEBOOK</span>
                </button>
              </div>

              {/* Stepping Path Nodes */}
              <div className="flex flex-col items-center gap-y-8 w-full relative">
                {unit.lessons.map((lesson, idx) => {
                  const offset = offsets[idx % offsets.length];
                  const isCompleted = !!lesson.completed;
                  const isCurrent = !!lesson.is_current;
                  const isLocked = !!lesson.locked;

                  return (
                    <div
                      key={lesson.id}
                      className="relative flex flex-col items-center"
                      style={{
                        transform: `translateX(${offset}px)`,
                      }}
                    >
                      {/* Floating START Badge for Active Lesson */}
                      {isCurrent && (
                        <div className="absolute -top-11 z-20 animate-bounce">
                          <div className="bg-white border-2 border-[var(--color-green-500)] text-[var(--color-green-600)] font-black text-xs uppercase px-3 py-1.5 rounded-xl shadow-md tracking-wider flex items-center gap-x-1">
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>START</span>
                          </div>
                          <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-[var(--color-green-500)] rotate-45 mx-auto -mt-1.5" />
                        </div>
                      )}

                      {/* Node Button with Duolingo Progress Ring */}
                      {isLocked ? (
                        <div
                          className="h-20 w-20 md:h-24 md:w-24 rounded-full flex items-center justify-center bg-neutral-200 border-b-8 border-neutral-300 shadow-inner cursor-not-allowed opacity-80"
                          title="Complete previous lesson to unlock"
                        >
                          <Lock className="w-8 h-8 text-neutral-400 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Circular Animated Progress Ring for Active Lesson */}
                          {isCurrent && (
                            <div className="absolute -inset-2.5 rounded-full border-4 border-dashed border-[var(--color-green-500)] animate-spin-slow pointer-events-none" />
                          )}

                          <Link
                            to={`/lesson/${lesson.id}`}
                            className={`h-20 w-20 md:h-24 md:w-24 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md active:border-b-0 active:translate-y-2 ${
                              isCompleted
                                ? "bg-amber-400 border-b-8 border-amber-500 hover:brightness-105 ring-4 ring-amber-300/50"
                                : isCurrent
                                ? "bg-[var(--color-green-500)] border-b-8 border-[var(--color-green-600)] hover:brightness-105 shadow-xl ring-4 ring-emerald-400/40"
                                : "bg-[var(--color-green-500)] border-b-8 border-[var(--color-green-600)] hover:brightness-105"
                            }`}
                            title={isCompleted ? `${lesson.title} (Completed - Replay)` : lesson.title}
                          >
                            {isCompleted ? (
                              <Check className="w-10 h-10 text-white stroke-[4]" />
                            ) : (
                              <Star className="w-9 h-9 text-white fill-white" />
                            )}
                          </Link>
                        </div>
                      )}

                      {/* Lesson title label */}
                      <span className="text-xs font-black text-neutral-500 mt-2 tracking-wide uppercase">
                        {lesson.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Right Desktop Promo Sidebar */}
      <PromoSidebar />

      {/* Guidebook Modal */}
      {activeGuidebookUnit && (
        <GuidebookModal
          isOpen={!!activeGuidebookUnit}
          onClose={() => setActiveGuidebookUnit(null)}
          unitTitle={activeGuidebookUnit.title}
          unitDescription={activeGuidebookUnit.description}
          guidebook={activeGuidebookUnit.guidebook}
        />
      )}
    </div>
  );
}
