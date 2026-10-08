import { useEffect, useState, useMemo } from "react";
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

const DEFAULT_UNITS: Record<number, Unit[]> = {
  1: [
    {
      id: 1,
      title: "Unit 1: Basics & Greetings",
      description: "Learn essential greetings, introduce yourself, and order basic items",
      order: 1,
      guidebook: "In Spanish, nouns have gender: 'el' is masculine and 'la' is feminine. Use 'Hola' for hello and 'Adiós' for goodbye.",
      lessons: [
        { id: 1, title: "Lesson 1: Hola!", order: 1, is_current: true, completed: false, locked: false },
        { id: 2, title: "Lesson 2: Por Favor", order: 2, is_current: false, completed: false, locked: true },
        { id: 3, title: "Lesson 3: Review", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
    {
      id: 2,
      title: "Unit 2: Cafe & Phrases",
      description: "Order drinks and food in a Spanish café with polite phrases",
      order: 2,
      guidebook: "Order drinks politely using 'por favor' and thank your server with 'gracias'.",
      lessons: [
        { id: 4, title: "Lesson 1: Un Café", order: 1, is_current: false, completed: false, locked: true },
        { id: 5, title: "Lesson 2: La Cuenta", order: 2, is_current: false, completed: false, locked: true },
        { id: 6, title: "Lesson 3: Checkpoint", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
  ],
  2: [
    {
      id: 3,
      title: "Unit 1: German Basics",
      description: "Master simple greetings, gender articles (der/die/das), and everyday nouns",
      order: 1,
      guidebook: "German nouns are always capitalized! Hallo means hello, and Danke means thank you.",
      lessons: [
        { id: 7, title: "Lesson 1: Hallo!", order: 1, is_current: true, completed: false, locked: false },
        { id: 8, title: "Lesson 2: Bitte & Danke", order: 2, is_current: false, completed: false, locked: true },
        { id: 9, title: "Lesson 3: Review", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
    {
      id: 4,
      title: "Unit 2: Cafe & Daily Life",
      description: "Order coffee and snacks in a Berlin café with polite phrases",
      order: 2,
      guidebook: "Order coffee with 'Ein Kaffee, bitte!'.",
      lessons: [
        { id: 10, title: "Lesson 1: Ein Kaffee", order: 1, is_current: false, completed: false, locked: true },
        { id: 11, title: "Lesson 2: Zahlen bitte", order: 2, is_current: false, completed: false, locked: true },
        { id: 12, title: "Lesson 3: Checkpoint", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
  ],
  3: [
    {
      id: 5,
      title: "Unit 1: Japanese Basics",
      description: "Master essential greetings and basic vocabulary with Romaji phonetic guides",
      order: 1,
      guidebook: "Konnichiwa means hello. Arigatou means thank you.",
      lessons: [
        { id: 13, title: "Lesson 1: Konnichiwa", order: 1, is_current: true, completed: false, locked: false },
        { id: 14, title: "Lesson 2: Arigatou", order: 2, is_current: false, completed: false, locked: true },
        { id: 15, title: "Lesson 3: Review", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
    {
      id: 6,
      title: "Unit 2: Greetings & Politeness",
      description: "Navigate everyday Tokyo conversations with polite expressions",
      order: 2,
      guidebook: "Sumimasen means excuse me or sorry.",
      lessons: [
        { id: 16, title: "Lesson 1: Sumimasen", order: 1, is_current: false, completed: false, locked: true },
        { id: 17, title: "Lesson 2: Sayounara", order: 2, is_current: false, completed: false, locked: true },
        { id: 18, title: "Lesson 3: Checkpoint", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
  ],
  4: [
    {
      id: 7,
      title: "Unit 1: Basics & Salutations",
      description: "Learn Parisian greetings, essential phrases, and café basics",
      order: 1,
      guidebook: "Bonjour means good morning/hello. Merci means thank you.",
      lessons: [
        { id: 19, title: "Lesson 1: Bonjour", order: 1, is_current: true, completed: false, locked: false },
        { id: 20, title: "Lesson 2: S'il vous plaît", order: 2, is_current: false, completed: false, locked: true },
        { id: 21, title: "Lesson 3: Review", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
    {
      id: 8,
      title: "Unit 2: Café & City Life",
      description: "Order croissants and coffee with authentic Parisian flair",
      order: 2,
      guidebook: "Un croissant, s'il vous plaît!",
      lessons: [
        { id: 22, title: "Lesson 1: Un Croissant", order: 1, is_current: false, completed: false, locked: true },
        { id: 23, title: "Lesson 2: L'addition", order: 2, is_current: false, completed: false, locked: true },
        { id: 24, title: "Lesson 3: Checkpoint", order: 3, is_current: false, completed: false, locked: true },
      ],
    },
  ],
};

export default function Home() {
  const token = useUserStore((state) => state.token);
  const activeCourseId = useUserStore((state) => state.active_course_id) || 1;
  const activeCourse = useUserStore((state) => state.activeCourse);
  const completedLessonIds = useUserStore((state) => state.completedLessonIds);
  const userId = useUserStore((state) => state.userId);

  const [units, setUnits] = useState<Unit[]>(() => {
    return DEFAULT_UNITS[activeCourseId] || DEFAULT_UNITS[1];
  });
  const [activeGuidebookUnit, setActiveGuidebookUnit] = useState<Unit | null>(null);

  useEffect(() => {
    const defaultList = DEFAULT_UNITS[activeCourseId] || DEFAULT_UNITS[1];
    setUnits(defaultList);

    const targetCourse = activeCourseId || 1;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_BASE}/api/units?course_id=${targetCourse}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUnits(data);
          const serverCompleted = data.flatMap((u: Unit) =>
            u.lessons.filter((l: Lesson) => l.completed).map((l: Lesson) => l.id)
          );
          if (serverCompleted.length > 0) {
            useUserStore.setState((s) => {
              const merged = Array.from(new Set([...s.completedLessonIds, ...serverCompleted]));
              if (userId) {
                try {
                  localStorage.setItem(
                    `duolingo_completed_lessons_${userId}`,
                    JSON.stringify(merged)
                  );
                } catch {}
              }
              return { completedLessonIds: merged };
            });
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching units:", err);
      });
  }, [token, activeCourseId, userId]);

  // Compute progressive completion state ensuring completed lessons advance learning path
  const enrichedUnits = useMemo(() => {
    const completedSet = new Set<number>(completedLessonIds);
    if (userId) {
      try {
        const cached = localStorage.getItem(`duolingo_completed_lessons_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: number) => completedSet.add(Number(id)));
          }
        }
      } catch {}
    }

    let foundCurrent = false;

    return units.map((unit) => {
      const updatedLessons = unit.lessons.map((lesson) => {
        const isDone = completedSet.has(lesson.id) || !!lesson.completed;
        if (isDone) {
          return {
            ...lesson,
            completed: true,
            locked: false,
            is_current: false,
          };
        } else if (!foundCurrent) {
          foundCurrent = true;
          return {
            ...lesson,
            completed: false,
            locked: false,
            is_current: true,
          };
        } else {
          return {
            ...lesson,
            completed: false,
            locked: true,
            is_current: false,
          };
        }
      });

      return {
        ...unit,
        lessons: updatedLessons,
      };
    });
  }, [units, completedLessonIds, userId]);

  // Sinuous horizontal offset pattern: [0, 40, 60, 40, 0, -40, -60, -40]
  const offsets = [0, 40, 60, 40, 0, -40, -60, -40];

  return (
    <div className="flex justify-center px-4 md:px-8 py-8 gap-x-12 min-h-full">
      {/* Main Learning Path Column */}
      <div className="w-full max-w-[620px] flex flex-col items-center pb-24">
        {enrichedUnits.map((unit, unitIndex) => {
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
        })}
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
