import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore, type Course } from "@/store/useUserStore";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { CountryFlag } from "@/components/CountryFlag";

const COURSE_DESCRIPTIONS: Record<string, { desc: string; tag: string }> = {
  Spanish: {
    desc: "Speak Spanish with native confidence. Learn greetings, food, travel & grammar.",
    tag: "35M+ learners worldwide",
  },
  German: {
    desc: "Master German vocabulary, cases, and everyday conversational phrases.",
    tag: "18M+ learners worldwide",
  },
  Japanese: {
    desc: "Learn Hiragana, Katakana, Kanji, and essential Tokyo daily dialogue.",
    tag: "24M+ learners worldwide",
  },
  French: {
    desc: "Speak French with elegance. Master café dining, culture & everyday dialogue.",
    tag: "31M+ learners worldwide",
  },
};

export default function Courses() {
  const courses = useUserStore((state) => state.courses);
  const activeCourseId = useUserStore((state) => state.active_course_id);
  const fetchCourses = useUserStore((state) => state.fetchCourses);
  const selectCourse = useUserStore((state) => state.selectCourse);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSelect = async (course: Course) => {
    await selectCourse(course.id);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 py-12 bg-white">
      <div className="w-full max-w-[1100px] flex flex-col items-center">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-x-2 bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            Language Selection
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-neutral-800 tracking-tight">
            Which language would you like to learn?
          </h1>
          <p className="text-neutral-500 font-bold text-base md:text-lg mt-2">
            Switch anytime. Your progress in each language is always saved!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {courses.map((course) => {
            const isActive = activeCourseId === course.id;
            const extra = COURSE_DESCRIPTIONS[course.title] || {
              desc: "Explore lessons, build streaks, and level up your fluency.",
              tag: "Interactive lessons",
            };

            return (
              <div
                key={course.id}
                onClick={() => handleSelect(course)}
                className={`relative flex flex-col justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.99] ${
                  isActive
                    ? "border-[var(--color-green-500)] bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-lg"
                }`}
              >
                {/* Active Badge */}
                {isActive && (
                  <div className="absolute -top-3 right-5 bg-[var(--color-green-500)] text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-x-1 shadow-sm uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ACTIVE
                  </div>
                )}

                <div>
                  <div className="w-20 h-20 rounded-2xl bg-neutral-50 border-2 border-neutral-100 flex items-center justify-center p-2 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <CountryFlag code={course.code} title={course.title} size="xl" />
                  </div>
                  <h2 className="text-2xl font-black text-neutral-800 tracking-tight">
                    {course.title}
                  </h2>
                  <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mt-1 block">
                    {extra.tag}
                  </span>
                  <p className="text-sm font-semibold text-neutral-600 mt-3 leading-relaxed">
                    {extra.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <Button
                    variant={isActive ? "secondary" : "outline"}
                    className="w-full text-sm font-extrabold"
                  >
                    {isActive ? "CURRENT COURSE" : "LEARN THIS"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className="py-20 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-green-500)] mb-4"></div>
            <p className="text-neutral-400 font-bold">Loading available languages...</p>
          </div>
        )}
      </div>
    </div>
  );
}
