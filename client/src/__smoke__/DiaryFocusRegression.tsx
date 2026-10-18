// Dev-only entry. No authentication shortcut or production API is installed.
// The REAL TrainingDiaryPage (including DashboardLayout, edits, mutations,
// selectors and Radix portals) runs with an in-memory tRPC transport.
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { trpc } from "@/lib/trpc";
import TrainingDiaryPage from "@/pages/TrainingDiaryPage";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "@/index.css";

const student = { id: 900001, name: "Aluno de teste", email: "focus@example.invalid" };
const names = ["Hack Squat", "Leg Press", "Extensora", "Flexora", "Elevação lateral", "Tríceps corda", "Remada", "Panturrilha"];
const log: any = {
  id: 900010, studentId: student.id, student, status: "in_progress",
  trainingDate: "2026-10-01", dayName: "REGRESSÃO DE FOCO", notes: null,
  startTime: "09:00", totalSets: 24, totalReps: 72, totalVolume: "1400", duration: 60,
  exercises: names.map((exerciseName, index) => ({
    id: 910000 + index, exerciseId: 920000 + index, exerciseName,
    muscleGroup: index < 4 ? "Quadríceps" : "Tríceps", notes: null,
    plannedSets: 3, plannedReps: "8-12", plannedRest: 180, loadType: "kg",
    sets: Array.from({ length: 3 }, (_, setIndex) => ({
      id: 930000 + index * 10 + setIndex, setNumber: setIndex + 1,
      setType: setIndex === 0 ? "warmup" : "working", loadType: "kg",
      weight: "30", reps: 8, restTime: 180, isCompleted: true,
      isDropSet: false, isRestPause: false, notes: null,
    })),
  })),
};
const calls: { path: string; type: string; input: unknown }[] = [];
const unknownQueries: string[] = [];
const state = { calls, unknownQueries, log };
(window as any).__diaryFocusFixture = state;

function reply(path: string, type: string, input: any): any {
  calls.push({ path, type, input: structuredClone(input) });
  if (path === "auth.me") return { id: 7, role: "admin", name: "Teste", email: "focus@example.invalid" };
  if (path === "students.list") return [student];
  if (path === "subscription.paymentStatus") return { isBlocked: false, status: "active", isActive: true, daysRemaining: 30 };
  if (path === "personal.featureFlags") return {};
  if (path === "chat.totalUnread") return 0;
  if (path === "trainingDiary.list") return Array.from({ length: 25 }, (_, index) => ({
    ...log, id: index === 12 ? log.id : log.id + index + 1,
    dayName: index === 12 ? log.dayName : `Histórico ${index + 1}`,
    exercises: undefined,
  }));
  if (path === "trainingDiary.get") return log;
  if (path === "trainingDiary.dashboard") return null;
  if (["trainingDiary.muscleGroupAnalysis", "trainingDiary.uniqueExercises", "trainingDiary.exerciseProgress", "sessions.list", "workouts.list", "cardio.list"].includes(path)) return [];
  if (path === "trainingDiary.updateSet") {
    const set = log.exercises.flatMap((ex: any) => ex.sets).find((item: any) => item.id === input.id);
    if (!set) throw new Error("Unknown synthetic set");
    Object.assign(set, Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)));
    return { success: true };
  }
  if (path === "trainingDiary.updateExercise") {
    const exercise = log.exercises.find((item: any) => item.id === input.id);
    if (!exercise) throw new Error("Unknown synthetic exercise");
    Object.assign(exercise, Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)));
    return { success: true };
  }
  if (path === "trainingDiary.addSet") {
    const exercise = log.exercises.find((item: any) => item.id === input.workoutLogExerciseId);
    const id = 940000 + calls.length;
    exercise.sets.push({ ...input, id, weight: null, reps: 0 });
    return { id };
  }
  if (type === "mutation") throw new Error(`Unconfigured synthetic mutation: ${path}`);
  unknownQueries.push(path);
  return [];
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } } });
const client = trpc.createClient({
  links: [() => ({ op }) => observable(observer => {
    const timer = window.setTimeout(() => {
      try {
        const data = structuredClone(reply(op.path, op.type, op.input));
        observer.next({ result: { data } } as any);
        observer.complete();
      } catch (error) { observer.error(error as any); }
    }, op.type === "mutation" ? 40 : 5);
    return () => window.clearTimeout(timer);
  })],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={client} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <OfflineProvider>
        <ThemeProvider defaultTheme="premium" switchable={false}>
          <TooltipProvider>
            <Toaster position="top-center" visibleToasts={1} expand={false} />
            <TrainingDiaryPage />
          </TooltipProvider>
        </ThemeProvider>
      </OfflineProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
