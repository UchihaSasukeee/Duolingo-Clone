import { create } from "zustand";

export interface Course {
  id: number;
  title: string;
  flag_emoji: string;
  code: string;
}

interface UserState {
  hearts: number;
  gems: number;
  streak: number;
  xp: number;
  active_course_id: number | null;
  courses: Course[];
  activeCourse: Course | null;
  isLoading: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  fetchUser: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  selectCourse: (courseId: number) => Promise<void>;
  syncUser: () => Promise<void>;
  reduceHearts: () => void;
  addXP: (amount: number) => void;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  refillHearts: () => void;
  completeLesson: (lessonId: number) => Promise<{ success: boolean; xp_earned: number; gems_earned: number } | null>;
  completePractice: () => Promise<{ success: boolean; hearts_added: number; xp_added: number } | null>;
  claimQuest: (questId: string) => Promise<{ success: boolean; gems: number; reward_gems: number } | null>;
}

import { API_BASE } from "@/utils/api";

const BASE_API = `${API_BASE}/api`;

const DEFAULT_COURSES: Course[] = [
  { id: 1, title: "Spanish", flag_emoji: "🇪🇸", code: "es" },
  { id: 2, title: "German", flag_emoji: "🇩🇪", code: "de" },
  { id: 3, title: "Japanese", flag_emoji: "🇯🇵", code: "ja" },
  { id: 4, title: "French", flag_emoji: "🇫🇷", code: "fr" },
];

export const useUserStore = create<UserState>((set, get) => ({
  hearts: 5,
  gems: 50,
  streak: 0,
  xp: 0,
  active_course_id: 1,
  courses: DEFAULT_COURSES,
  activeCourse: DEFAULT_COURSES[0],
  isLoading: true,
  token: null,

  setToken: (token) => set({ token }),

  fetchCourses: async () => {
    try {
      const res = await fetch(`${BASE_API}/courses`);
      if (res.ok) {
        const data: Course[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          set({ courses: data });
          const currentActiveId = get().active_course_id || 1;
          const found = data.find((c) => c.id === currentActiveId) || data[0];
          if (found) set({ activeCourse: found, active_course_id: found.id });
        }
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  },

  selectCourse: async (courseId: number) => {
    // 1. Immediately update UI state so user is never stuck
    const courses = get().courses.length > 0 ? get().courses : DEFAULT_COURSES;
    const found = courses.find((c) => c.id === courseId) || courses[0];
    set({ active_course_id: courseId, activeCourse: found });

    const token = get().token;
    if (!token) return;

    try {
      await fetch(`${BASE_API}/user/course?course_id=${courseId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Failed to select course on server", error);
    }
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const res = await fetch(`${BASE_API}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const activeId = data.active_course_id || 1;
        const courses = get().courses.length > 0 ? get().courses : DEFAULT_COURSES;
        const found = courses.find((c) => c.id === activeId) || courses[0];

        set({
          hearts: data.hearts ?? 5,
          gems: data.gems ?? 50,
          streak: data.streak ?? 0,
          xp: data.xp ?? 0,
          active_course_id: activeId,
          activeCourse: found,
          isLoading: false,
        });

        await get().fetchCourses();
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      set({ isLoading: false });
    }
  },

  syncUser: async () => {
    const { hearts, xp, gems, streak, active_course_id, token } = get();
    if (!token) return;

    try {
      await fetch(`${BASE_API}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hearts, xp, gems, streak, active_course_id }),
      });
    } catch (error) {
      console.error("Failed to sync user", error);
    }
  },

  reduceHearts: () => {
    set((state) => ({ hearts: Math.max(0, state.hearts - 1) }));
    get().syncUser();
  },

  addXP: (amount) => {
    set((state) => ({ xp: state.xp + amount }));
    get().syncUser();
  },

  addGems: (amount) => {
    set((state) => ({ gems: state.gems + amount }));
    get().syncUser();
  },

  spendGems: (amount) => {
    const currentGems = get().gems;
    if (currentGems >= amount) {
      set({ gems: currentGems - amount });
      get().syncUser();
      return true;
    }
    return false;
  },

  refillHearts: () => {
    set({ hearts: 5 });
    get().syncUser();
  },

  completeLesson: async (lessonId: number) => {
    const token = get().token;
    if (!token) return null;

    try {
      const res = await fetch(`${BASE_API}/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          hearts: data.hearts,
          xp: data.xp,
          gems: data.gems,
          streak: data.streak,
        });
        return {
          success: true,
          xp_earned: data.xp_earned,
          gems_earned: data.gems_earned,
        };
      }
    } catch (error) {
      console.error("Failed to complete lesson", error);
    }
    return null;
  },

  completePractice: async () => {
    const token = get().token;
    if (!token) return null;

    try {
      const res = await fetch(`${BASE_API}/practice/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          hearts: data.hearts,
          xp: data.xp,
          gems: data.gems,
        });
        return {
          success: true,
          hearts_added: data.hearts_added,
          xp_added: data.xp_added,
        };
      }
    } catch (error) {
      console.error("Failed to complete practice", error);
    }
    return null;
  },

  claimQuest: async (questId: string) => {
    const token = get().token;
    if (!token) return null;

    try {
      const res = await fetch(`${BASE_API}/quests/${questId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ gems: data.gems });
        return {
          success: true,
          gems: data.gems,
          reward_gems: data.reward_gems,
        };
      }
    } catch (error) {
      console.error("Failed to claim quest", error);
    }
    return null;
  },
}));
