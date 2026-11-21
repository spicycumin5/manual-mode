import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Score {
  best: number;
  attempts: number;
}

interface ProgressState {
  lessons: Record<string, number>; // lesson key -> completed timestamp
  quizzes: Record<string, Score>; // quiz id -> best fraction correct (0–1)
  challenges: Record<string, Score & { passed: boolean }>;
  streak: { last: string; count: number };
  lastLesson: string | null;
  completeLesson: (key: string) => void;
  visitLesson: (key: string) => void;
  recordQuiz: (id: string, score: number) => void;
  recordChallenge: (id: string, score: number, passed: boolean) => void;
  importData: (json: string) => boolean;
  reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function bumpStreak(st: ProgressState['streak']): ProgressState['streak'] {
  const t = today();
  if (st.last === t) return st;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return { last: t, count: st.last === y ? st.count + 1 : 1 };
}

const safeStorage = createJSONStorage(() => {
  try {
    const k = '__mm_test';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
});

const empty = {
  lessons: {},
  quizzes: {},
  challenges: {},
  streak: { last: '', count: 0 },
  lastLesson: null,
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...empty,
      completeLesson: (key) =>
        set((s) => ({ lessons: { ...s.lessons, [key]: s.lessons[key] ?? Date.now() }, streak: bumpStreak(s.streak) })),
      visitLesson: (key) => set({ lastLesson: key }),
      recordQuiz: (id, score) =>
        set((s) => {
          const prev = s.quizzes[id];
          return {
            quizzes: { ...s.quizzes, [id]: { best: Math.max(prev?.best ?? 0, score), attempts: (prev?.attempts ?? 0) + 1 } },
            streak: bumpStreak(s.streak),
          };
        }),
      recordChallenge: (id, score, passed) =>
        set((s) => {
          const prev = s.challenges[id];
          return {
            challenges: {
              ...s.challenges,
              [id]: { best: Math.max(prev?.best ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, passed: passed || !!prev?.passed },
            },
            streak: bumpStreak(s.streak),
          };
        }),
      importData: (json) => {
        try {
          const d = JSON.parse(json);
          if (typeof d !== 'object' || !d || typeof d.lessons !== 'object') return false;
          set({
            lessons: d.lessons ?? {},
            quizzes: d.quizzes ?? {},
            challenges: d.challenges ?? {},
            streak: d.streak ?? empty.streak,
            lastLesson: d.lastLesson ?? null,
          });
          return true;
        } catch {
          return false;
        }
      },
      reset: () => set({ ...empty }),
    }),
    { name: 'manual-mode-progress', storage: safeStorage, version: 1 },
  ),
);

export function exportProgress(): string {
  const { lessons, quizzes, challenges, streak, lastLesson } = useProgress.getState();
  return JSON.stringify({ lessons, quizzes, challenges, streak, lastLesson, exported: new Date().toISOString() }, null, 2);
}
