import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, SectionHeader } from "./ui/cards";
import { Button } from "./ui/buttons";
import { InputField, Badge } from "./ui/forms";
import { storage } from "../../config/storage";
import { Exercise, WorkoutSession, WorkoutSet, ExerciseDiaryEntry } from "../types";
import { 
  getTodayDateString, 
  formatDisplayDate, 
  shiftDateString, 
  formatFullDisplayDate 
} from "../utils/date";
import { calculateMetCalories, round } from "../utils/nutrition-calculations";
import { ExerciseDiaryModal } from "./ExerciseDiaryModal";
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Check, 
  Edit, 
  Clock, 
  Flame, 
  History as HistoryIcon,
  Timer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  ListChecks,
  PlayCircle
} from "lucide-react";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export function GymRoutine() {
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const today = getTodayDateString();

  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[currentDayIndex]);
  const [routine, setRoutine] = useState(() => storage.getGymRoutine());
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // View Mode: 'split' (Weekly Routine Split) | 'diary' (Daily Logged Exercises)
  const [activeTab, setActiveTab] = useState<'split' | 'diary'>('split');

  // Exercise Diary Modal state
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Date selection for Exercise Diary & Activity tracking (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [dailyLog, setDailyLog] = useState(() => storage.getDailyLog(selectedDate));
  const [summary, setSummary] = useState(() => storage.getDailySummary(selectedDate));

  // Active workout performance state for today
  const [todayWorkout, setTodayWorkout] = useState<WorkoutSession | null>(
    () => storage.getWorkoutHistory(today) || null
  );

  // Form states
  const [workoutName, setWorkoutName] = useState("");
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    sets: 3,
    reps: "10",
    weight: 0,
    restTime: 60,
    notes: "",
  });

  // Rest timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const refreshDiaryData = () => {
    setDailyLog(storage.getDailyLog(selectedDate));
    setSummary(storage.getDailySummary(selectedDate));
    setTodayWorkout(storage.getWorkoutHistory(today) || null);
    setRoutine(storage.getGymRoutine());
  };

  useEffect(() => {
    refreshDiaryData();
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const nextDate = shiftDateString(selectedDate, days);
    setSelectedDate(nextDate);
  };

  const currentWorkout = routine[selectedDay];

  // Helper to find previous session performance for an exercise
  const getPreviousPerformance = (exerciseName: string) => {
    const history = storage.get()?.workoutHistory || {};
    const sortedDates = Object.keys(history).sort().reverse();

    for (const d of sortedDates) {
      if (d === today) continue; // Skip current session
      const sess = history[d];
      const match = sess.exercises?.find(
        (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
      );
      if (match) {
        return {
          date: d,
          sets: match.sets,
          reps: match.reps,
          weight: match.weight,
          completedSets: match.detailedSets?.filter((s) => s.completed).length,
        };
      }
    }
    return null;
  };

  const handleCreateWorkout = () => {
    if (!workoutName.trim()) return;

    const workout: WorkoutSession = {
      id: Date.now().toString(),
      name: workoutName.trim(),
      exercises: [],
    };

    storage.saveWorkoutForDay(selectedDay, workout);
    setRoutine(storage.getGymRoutine());
    setWorkoutName("");
    setShowAddWorkout(false);
  };

  const handleAddOrEditExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkout || !exerciseForm.name.trim()) return;

    const numSets = Math.max(1, Number(exerciseForm.sets) || 3);
    const defaultSets: WorkoutSet[] = Array.from({ length: numSets }, (_, i) => ({
      setNumber: i + 1,
      weight: Number(exerciseForm.weight) || 0,
      reps: parseInt(exerciseForm.reps) || 10,
      restTimeSeconds: Number(exerciseForm.restTime) || 60,
      completed: false,
    }));

    if (editingExercise) {
      const updatedExercises = currentWorkout.exercises.map((ex) =>
        ex.id === editingExercise.id
          ? {
              ...ex,
              name: exerciseForm.name.trim(),
              sets: numSets,
              reps: exerciseForm.reps,
              weight: Number(exerciseForm.weight) || 0,
              restTime: Number(exerciseForm.restTime) || 60,
              notes: exerciseForm.notes.trim() || undefined,
              detailedSets: ex.detailedSets && ex.detailedSets.length === numSets ? ex.detailedSets : defaultSets,
            }
          : ex
      );
      const updatedWorkout = { ...currentWorkout, exercises: updatedExercises };
      storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    } else {
      const newEx: Exercise = {
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: exerciseForm.name.trim(),
        sets: numSets,
        reps: exerciseForm.reps,
        weight: Number(exerciseForm.weight) || 0,
        restTime: Number(exerciseForm.restTime) || 60,
        notes: exerciseForm.notes.trim() || undefined,
        detailedSets: defaultSets,
      };
      const updatedWorkout = {
        ...currentWorkout,
        exercises: [...currentWorkout.exercises, newEx],
      };
      storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    }

    setRoutine(storage.getGymRoutine());
    setExerciseForm({
      name: "",
      sets: 3,
      reps: "10",
      weight: 0,
      restTime: 60,
      notes: "",
    });
    setEditingExercise(null);
    setShowAddExercise(false);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!currentWorkout || !confirm("Delete this exercise?")) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter((e) => e.id !== exerciseId),
    };

    storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    setRoutine(storage.getGymRoutine());
  };

  const handleDeleteWorkout = () => {
    if (!confirm(`Delete entire workout plan for ${selectedDay}?`)) return;

    const updatedRoutine = { ...routine };
    delete updatedRoutine[selectedDay];

    const state = storage.get();
    if (state) {
      state.gymRoutine = updatedRoutine;
      storage.save(state);
      setRoutine(updatedRoutine);
    }
  };

  // Toggle set completion in live workout tracker
  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const numSets = ex.sets || 3;
      const sets: WorkoutSet[] = ex.detailedSets && ex.detailedSets.length === numSets
        ? [...ex.detailedSets]
        : Array.from({ length: numSets }, (_, i) => ({
            setNumber: i + 1,
            weight: ex.weight || 0,
            reps: parseInt(ex.reps) || 10,
            restTimeSeconds: ex.restTime || 60,
            completed: false,
          }));

      sets[setIndex] = {
        ...sets[setIndex],
        completed: !sets[setIndex].completed,
      };

      // Trigger rest timer if set was just completed
      if (sets[setIndex].completed && ex.restTime) {
        setTimerSeconds(ex.restTime);
      }

      return {
        ...ex,
        detailedSets: sets,
      };
    });

    const updatedWorkout = { ...currentWorkout, exercises: updatedExercises };
    storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    setRoutine(storage.getGymRoutine());

    // Also auto-save to today's workout history if this is today's day of week
    if (DAYS_OF_WEEK[currentDayIndex] === selectedDay) {
      storage.saveWorkoutHistory(today, updatedWorkout);
      setTodayWorkout(updatedWorkout);
    }
  };

  const handleUpdateSetWeightReps = (exerciseId: string, setIndex: number, newWeight: number, newReps: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const numSets = ex.sets || 3;
      const sets: WorkoutSet[] = ex.detailedSets && ex.detailedSets.length === numSets
        ? [...ex.detailedSets]
        : Array.from({ length: numSets }, (_, i) => ({
            setNumber: i + 1,
            weight: ex.weight || 0,
            reps: parseInt(ex.reps) || 10,
            restTimeSeconds: ex.restTime || 60,
            completed: false,
          }));

      sets[setIndex] = {
        ...sets[setIndex],
        weight: newWeight,
        reps: newReps,
      };

      return {
        ...ex,
        detailedSets: sets,
      };
    });

    const updatedWorkout = { ...currentWorkout, exercises: updatedExercises };
    storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    setRoutine(storage.getGymRoutine());
  };

  // Mark Workout Completed & Auto-Log to Exercise Diary
  const handleCompleteWorkout = () => {
    if (!currentWorkout) return;

    const completed = { ...currentWorkout, completed: true, date: today };
    storage.saveWorkoutHistory(today, completed);
    setTodayWorkout(completed);

    // Auto-record exercise diary entry for today so calories burned are captured
    const targetDate = DAYS_OF_WEEK[currentDayIndex] === selectedDay ? today : selectedDate;
    const currentDailyLog = storage.getDailyLog(targetDate);
    const alreadyLogged = currentDailyLog.exerciseEntries?.some(
      (e) => e.name.toLowerCase() === currentWorkout.name.toLowerCase() ||
             e.name.toLowerCase().includes(currentWorkout.name.toLowerCase())
    );

    if (!alreadyLogged) {
      const userWeight = storage.get()?.profile?.currentWeight || 82;
      const durationMin = Math.max(30, currentWorkout.exercises.length * 10);
      // Resistance training MET ~5.0
      const burnedCalories = calculateMetCalories(5.0, userWeight, durationMin);

      storage.addExerciseEntry(targetDate, {
        name: `${currentWorkout.name} (Resistance Workout)`,
        type: 'duration',
        duration: durationMin,
        intensity: 'moderate',
        met: 5.0,
        calculationMethod: 'duration',
        calories: burnedCalories,
        time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
        notes: `${currentWorkout.exercises.length} exercises completed in gym routine`,
      });
    }

    // Check off gym workout in today's checklist
    const todayRec = storage.getTodayRecord();
    if (!todayRec.checklist.gymWorkout) {
      storage.updateTodayChecklist({
        ...todayRec.checklist,
        gymWorkout: true,
      });
      window.dispatchEvent(new Event('checklistUpdated'));
    }

    refreshDiaryData();
    window.dispatchEvent(new Event('exerciseLogged'));
    alert(`Workout recorded, logged to exercise diary, and saved to history! Outstanding work! 💪`);
  };

  // Log single routine exercise directly to daily diary
  const handleLogSingleExercise = (exercise: Exercise) => {
    const userWeight = storage.get()?.profile?.currentWeight || 82;
    const numSets = exercise.sets || 3;
    const estimatedDuration = Math.max(10, numSets * 3);
    const met = 5.0; // Resistance training MET
    const calories = calculateMetCalories(met, userWeight, estimatedDuration);

    storage.addExerciseEntry(selectedDate, {
      name: exercise.name,
      type: 'duration',
      duration: estimatedDuration,
      intensity: 'moderate',
      met,
      calculationMethod: 'duration',
      calories,
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
      notes: `${numSets} sets × ${exercise.reps} reps ${exercise.weight ? `@ ${exercise.weight}kg` : ''}`,
    });

    refreshDiaryData();
    window.dispatchEvent(new Event('exerciseLogged'));
    alert(`Logged "${exercise.name}" (${calories} kcal, ${estimatedDuration} min) to exercise diary!`);
  };

  const handleDeleteExerciseEntry = (entryId: string, name: string) => {
    if (confirm(`Delete "${name}" from logged exercise diary?`)) {
      storage.deleteExerciseEntry(selectedDate, entryId);
      refreshDiaryData();
      window.dispatchEvent(new Event('exerciseLogged'));
    }
  };

  // One-click starter split for recomposition
  const handleLoadRecommendedSplit = () => {
    const starterSplit: Record<string, WorkoutSession> = {
      Monday: {
        id: "w_push_mon",
        name: "Push Day (Chest, Shoulders & Triceps)",
        exercises: [
          {
            id: "ex_p1",
            name: "Incline Dumbbell Press",
            sets: 4,
            reps: "8-10",
            weight: 22,
            restTime: 90,
            notes: "Focus on upper chest contraction, 2-sec eccentric",
            detailedSets: [
              { setNumber: 1, weight: 22, reps: 10, restTimeSeconds: 90, completed: false },
              { setNumber: 2, weight: 22, reps: 10, restTimeSeconds: 90, completed: false },
              { setNumber: 3, weight: 24, reps: 8, restTimeSeconds: 90, completed: false },
              { setNumber: 4, weight: 24, reps: 8, restTimeSeconds: 90, completed: false },
            ]
          },
          {
            id: "ex_p2",
            name: "Flat Barbell Bench Press",
            sets: 3,
            reps: "8-10",
            weight: 60,
            restTime: 90,
            notes: "Full range of motion, touch chest with control",
            detailedSets: [
              { setNumber: 1, weight: 60, reps: 10, restTimeSeconds: 90, completed: false },
              { setNumber: 2, weight: 60, reps: 8, restTimeSeconds: 90, completed: false },
              { setNumber: 3, weight: 60, reps: 8, restTimeSeconds: 90, completed: false },
            ]
          },
          {
            id: "ex_p3",
            name: "Overhead Dumbbell Shoulder Press",
            sets: 3,
            reps: "10-12",
            weight: 16,
            restTime: 60,
            notes: "Keep core tight, elbows slightly forward",
            detailedSets: [
              { setNumber: 1, weight: 16, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 16, reps: 10, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 16, reps: 10, restTimeSeconds: 60, completed: false },
            ]
          },
          {
            id: "ex_p4",
            name: "Dumbbell Lateral Raises",
            sets: 4,
            reps: "12-15",
            weight: 8,
            restTime: 45,
            notes: "Strict form, lead with elbows",
            detailedSets: [
              { setNumber: 1, weight: 8, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 2, weight: 8, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 3, weight: 8, reps: 12, restTimeSeconds: 45, completed: false },
              { setNumber: 4, weight: 8, reps: 12, restTimeSeconds: 45, completed: false },
            ]
          },
          {
            id: "ex_p5",
            name: "Tricep Rope Pushdowns",
            sets: 3,
            reps: "12-15",
            weight: 25,
            restTime: 45,
            notes: "Flare rope at bottom, squeeze triceps",
            detailedSets: [
              { setNumber: 1, weight: 25, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 2, weight: 25, reps: 12, restTimeSeconds: 45, completed: false },
              { setNumber: 3, weight: 25, reps: 12, restTimeSeconds: 45, completed: false },
            ]
          }
        ]
      },
      Tuesday: {
        id: "w_pull_tue",
        name: "Pull Day (Back, Biceps & Rear Delts)",
        exercises: [
          {
            id: "ex_pl1",
            name: "Lat Pulldown / Pull-ups",
            sets: 4,
            reps: "8-12",
            weight: 55,
            restTime: 75,
            notes: "Drive elbows down and back to engage lats",
            detailedSets: [
              { setNumber: 1, weight: 55, reps: 12, restTimeSeconds: 75, completed: false },
              { setNumber: 2, weight: 55, reps: 10, restTimeSeconds: 75, completed: false },
              { setNumber: 3, weight: 60, reps: 8, restTimeSeconds: 75, completed: false },
              { setNumber: 4, weight: 60, reps: 8, restTimeSeconds: 75, completed: false },
            ]
          },
          {
            id: "ex_pl2",
            name: "Seated Cable Row",
            sets: 3,
            reps: "10-12",
            weight: 50,
            restTime: 60,
            notes: "Keep chest tall, pause at contraction",
            detailedSets: [
              { setNumber: 1, weight: 50, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 50, reps: 10, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 50, reps: 10, restTimeSeconds: 60, completed: false },
            ]
          },
          {
            id: "ex_pl3",
            name: "Face Pulls",
            sets: 3,
            reps: "15",
            weight: 20,
            restTime: 45,
            notes: "High pull to forehead for rear delt and rotator cuff health",
            detailedSets: [
              { setNumber: 1, weight: 20, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 2, weight: 20, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 3, weight: 20, reps: 15, restTimeSeconds: 45, completed: false },
            ]
          },
          {
            id: "ex_pl4",
            name: "Incline Dumbbell Bicep Curls",
            sets: 3,
            reps: "10-12",
            weight: 12,
            restTime: 60,
            notes: "Full stretch on long head of bicep",
            detailedSets: [
              { setNumber: 1, weight: 12, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 12, reps: 10, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 12, reps: 10, restTimeSeconds: 60, completed: false },
            ]
          }
        ]
      },
      Wednesday: {
        id: "w_legs_wed",
        name: "Legs & Core Hypertrophy",
        exercises: [
          {
            id: "ex_l1",
            name: "Barbell Back Squats",
            sets: 4,
            reps: "8-10",
            weight: 70,
            restTime: 120,
            notes: "Depth parallel or below, brace core tightly",
            detailedSets: [
              { setNumber: 1, weight: 70, reps: 10, restTimeSeconds: 120, completed: false },
              { setNumber: 2, weight: 70, reps: 8, restTimeSeconds: 120, completed: false },
              { setNumber: 3, weight: 75, reps: 8, restTimeSeconds: 120, completed: false },
              { setNumber: 4, weight: 75, reps: 8, restTimeSeconds: 120, completed: false },
            ]
          },
          {
            id: "ex_l2",
            name: "Romanian Deadlift",
            sets: 3,
            reps: "10-12",
            weight: 50,
            restTime: 90,
            notes: "Hinge at hips, stretch hamstrings, neutral spine",
            detailedSets: [
              { setNumber: 1, weight: 50, reps: 12, restTimeSeconds: 90, completed: false },
              { setNumber: 2, weight: 50, reps: 10, restTimeSeconds: 90, completed: false },
              { setNumber: 3, weight: 50, reps: 10, restTimeSeconds: 90, completed: false },
            ]
          },
          {
            id: "ex_l3",
            name: "Leg Press",
            sets: 3,
            reps: "12-15",
            weight: 120,
            restTime: 75,
            notes: "Slow controlled descent, don't lock knees",
            detailedSets: [
              { setNumber: 1, weight: 120, reps: 15, restTimeSeconds: 75, completed: false },
              { setNumber: 2, weight: 120, reps: 12, restTimeSeconds: 75, completed: false },
              { setNumber: 3, weight: 120, reps: 12, restTimeSeconds: 75, completed: false },
            ]
          },
          {
            id: "ex_l4",
            name: "Hanging Leg Raises / Core Planks",
            sets: 3,
            reps: "15",
            weight: 0,
            restTime: 45,
            notes: "Curl pelvis upward, control swing",
            detailedSets: [
              { setNumber: 1, weight: 0, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 2, weight: 0, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 3, weight: 0, reps: 15, restTimeSeconds: 45, completed: false },
            ]
          }
        ]
      },
      Thursday: {
        id: "w_cardio_thu",
        name: "Active Recovery & Incline Cardio",
        exercises: [
          {
            id: "ex_c1",
            name: "Incline Treadmill Walking",
            sets: 1,
            reps: "30 min",
            weight: 0,
            restTime: 0,
            notes: "12% incline, 4.8 km/h speed, zone 2 fat burning cardio",
            detailedSets: [
              { setNumber: 1, weight: 0, reps: 30, restTimeSeconds: 0, completed: false }
            ]
          }
        ]
      },
      Friday: {
        id: "w_upper_fri",
        name: "Upper Body Hypertrophy",
        exercises: [
          {
            id: "ex_u1",
            name: "Dumbbell Incline Bench Press",
            sets: 3,
            reps: "10-12",
            weight: 22,
            restTime: 75,
            notes: "Chest pump and hypertrophy",
            detailedSets: [
              { setNumber: 1, weight: 22, reps: 12, restTimeSeconds: 75, completed: false },
              { setNumber: 2, weight: 22, reps: 10, restTimeSeconds: 75, completed: false },
              { setNumber: 3, weight: 22, reps: 10, restTimeSeconds: 75, completed: false },
            ]
          },
          {
            id: "ex_u2",
            name: "Chest Supported Row",
            sets: 3,
            reps: "10-12",
            weight: 20,
            restTime: 60,
            notes: "Eliminate momentum, squeeze mid-back",
            detailedSets: [
              { setNumber: 1, weight: 20, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 20, reps: 10, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 20, reps: 10, restTimeSeconds: 60, completed: false },
            ]
          },
          {
            id: "ex_u3",
            name: "Cable Lateral Raises",
            sets: 3,
            reps: "15",
            weight: 7,
            restTime: 45,
            notes: "Constant tension on side delts",
            detailedSets: [
              { setNumber: 1, weight: 7, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 2, weight: 7, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 3, weight: 7, reps: 15, restTimeSeconds: 45, completed: false },
            ]
          },
          {
            id: "ex_u4",
            name: "Hammer Curls",
            sets: 3,
            reps: "12-15",
            weight: 12,
            restTime: 60,
            notes: "Target brachialis for arm thickness",
            detailedSets: [
              { setNumber: 1, weight: 12, reps: 15, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 12, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 12, reps: 12, restTimeSeconds: 60, completed: false },
            ]
          }
        ]
      },
      Saturday: {
        id: "w_lower_sat",
        name: "Lower Body & Calves / Conditioning",
        exercises: [
          {
            id: "ex_ls1",
            name: "Leg Extensions",
            sets: 3,
            reps: "12-15",
            weight: 45,
            restTime: 60,
            notes: "Pause 1 sec at peak quad contraction",
            detailedSets: [
              { setNumber: 1, weight: 45, reps: 15, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 45, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 45, reps: 12, restTimeSeconds: 60, completed: false },
            ]
          },
          {
            id: "ex_ls2",
            name: "Seated Hamstring Leg Curls",
            sets: 3,
            reps: "12-15",
            weight: 40,
            restTime: 60,
            notes: "Control return phase",
            detailedSets: [
              { setNumber: 1, weight: 40, reps: 15, restTimeSeconds: 60, completed: false },
              { setNumber: 2, weight: 40, reps: 12, restTimeSeconds: 60, completed: false },
              { setNumber: 3, weight: 40, reps: 12, restTimeSeconds: 60, completed: false },
            ]
          },
          {
            id: "ex_ls3",
            name: "Standing Calf Raises",
            sets: 4,
            reps: "15-20",
            weight: 20,
            restTime: 45,
            notes: "Full stretch at bottom, hold at top",
            detailedSets: [
              { setNumber: 1, weight: 20, reps: 20, restTimeSeconds: 45, completed: false },
              { setNumber: 2, weight: 20, reps: 18, restTimeSeconds: 45, completed: false },
              { setNumber: 3, weight: 20, reps: 15, restTimeSeconds: 45, completed: false },
              { setNumber: 4, weight: 20, reps: 15, restTimeSeconds: 45, completed: false },
            ]
          }
        ]
      },
      Sunday: {
        id: "w_rest_sun",
        name: "Active Recovery & Mobility Walk",
        exercises: [
          {
            id: "ex_rst1",
            name: "Outdoor Brisk Walk",
            sets: 1,
            reps: "45 min",
            weight: 0,
            restTime: 0,
            notes: "Hit 10,000 daily step goal and recover muscles",
            detailedSets: [
              { setNumber: 1, weight: 0, reps: 45, restTimeSeconds: 0, completed: false }
            ]
          }
        ]
      }
    };

    Object.entries(starterSplit).forEach(([day, workout]) => {
      storage.saveWorkoutForDay(day, workout);
    });
    setRoutine(storage.getGymRoutine());
  };

  const isTodayDay = DAYS_OF_WEEK[currentDayIndex] === selectedDay;
  const isWorkoutCompleted = todayWorkout?.completed && isTodayDay;
  const loggedExercisesList = dailyLog.exerciseEntries || [];

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader 
          title="Gym & Workouts" 
          subtitle="Log exercise, track sets & weights, and record daily activities"
          icon={Dumbbell} 
          action={
            <div className="flex items-center gap-2">
              {timerSeconds !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold shadow-lg animate-pulse">
                  <Timer className="size-4" />
                  <span>Rest: {timerSeconds}s</span>
                </div>
              )}
              <Button
                onClick={() => setShowExerciseModal(true)}
                icon={Flame}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30"
              >
                Log Exercise
              </Button>
            </div>
          }
        />

        {/* Today's Exercise Activity & Calorie Burn Banner */}
        <Card delay={0.05} className="mt-2 mb-4 bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent border-purple-200/50 dark:border-purple-800/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Activity className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Activity Burn — {formatDisplayDate(selectedDate)}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {summary.exerciseSessions} session{summary.exerciseSessions !== 1 ? 's' : ''} logged today
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowExerciseModal(true)}
              icon={Plus}
              size="sm"
              variant="secondary"
              className="text-xs py-1.5 px-3 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
            >
              + Log Exercise
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-purple-100/60 dark:border-purple-900/40">
            <div className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/60 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">Burned</span>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">
                {summary.exerciseCalories} <span className="text-[10px] font-normal text-gray-500">kcal</span>
              </p>
            </div>

            <div className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/60 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Duration</span>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">
                {summary.exerciseDuration} <span className="text-[10px] font-normal text-gray-500">min</span>
              </p>
            </div>

            <div className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/60 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Sessions</span>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">
                {summary.exerciseSessions}
              </p>
            </div>
          </div>
        </Card>

        {/* View Switcher Tabs: Weekly Split vs Exercise Diary */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl mb-4">
          <button
            onClick={() => setActiveTab('split')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'split'
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md scale-[1.01]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Dumbbell className="size-4" />
            <span>Weekly Routine Split</span>
          </button>

          <button
            onClick={() => setActiveTab('diary')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'diary'
                ? "bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-md scale-[1.01]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Flame className="size-4" />
            <span>Exercise Diary</span>
            {loggedExercisesList.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                {loggedExercisesList.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: WEEKLY ROUTINE SPLIT */}
        {activeTab === 'split' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Day Selector */}
            <Card delay={0.1}>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {DAYS_OF_WEEK.map((day, idx) => {
                  const isSelected = day === selectedDay;
                  const hasWorkout = routine[day] && routine[day].exercises.length > 0;
                  const isToday = idx === currentDayIndex;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        flex-shrink-0 px-4 py-3 rounded-2xl font-semibold transition-all relative text-center
                        ${isSelected 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <div className="text-sm">{day.slice(0, 3)}</div>
                      {hasWorkout && (
                        <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                          isSelected ? "bg-white" : "bg-blue-600 dark:bg-blue-400"
                        }`} />
                      )}
                      {isToday && !isSelected && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Workout Plan Content */}
            {!currentWorkout ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="mt-4">
                  <div className="text-center py-10">
                    <Dumbbell className="size-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      No workout planned for {selectedDay}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                      Set up your resistance training plan, or load our recommended hypertrophy split for body recomposition.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-xs mx-auto">
                      <Button
                        onClick={() => setShowAddWorkout(true)}
                        icon={Plus}
                        size="sm"
                      >
                        Create Workout Plan
                      </Button>
                      <Button
                        onClick={handleLoadRecommendedSplit}
                        icon={Sparkles}
                        variant="secondary"
                        size="sm"
                      >
                        Load Recommended Split
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <>
                {/* Workout Header Card */}
                <Card delay={0.2} className="mt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                          {currentWorkout.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                          {currentWorkout.exercises.length} exercises
                        </span>
                        {isWorkoutCompleted ? (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                            <Check className="size-3" />
                            Completed Today
                          </span>
                        ) : (
                          isTodayDay && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
                              Today's Routine
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleDeleteWorkout}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Workout"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>

                  {/* Complete Workout & Auto-Log Button */}
                  <Button
                    onClick={handleCompleteWorkout}
                    variant={isWorkoutCompleted ? "secondary" : "primary"}
                    icon={Check}
                    fullWidth
                    className="mt-2"
                  >
                    {isWorkoutCompleted ? "Update Completed Workout & Diary" : "Mark Workout Completed & Log to Diary"}
                  </Button>
                </Card>

                {/* Exercises List with Set-by-Set Tracking */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Dumbbell className="size-4 text-purple-600" />
                      Exercises ({currentWorkout.exercises.length})
                    </h3>
                    <Button
                      onClick={() => {
                        setEditingExercise(null);
                        setExerciseForm({
                          name: "",
                          sets: 3,
                          reps: "10",
                          weight: 0,
                          restTime: 60,
                          notes: "",
                        });
                        setShowAddExercise(true);
                      }}
                      icon={Plus}
                      size="sm"
                    >
                      Add Exercise
                    </Button>
                  </div>

                  <div className="space-y-3.5">
                    {currentWorkout.exercises.length === 0 ? (
                      <Card>
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No exercises added yet. Tap "Add Exercise" to start building your routine!
                          </p>
                        </div>
                      </Card>
                    ) : (
                      currentWorkout.exercises.map((exercise, index) => {
                        const previous = getPreviousPerformance(exercise.name);
                        const numSets = exercise.sets || 3;
                        const detailedSets = exercise.detailedSets || Array.from({ length: numSets }, (_, i) => ({
                          setNumber: i + 1,
                          weight: exercise.weight || 0,
                          reps: parseInt(exercise.reps) || 10,
                          restTimeSeconds: exercise.restTime || 60,
                          completed: false,
                        }));

                        return (
                          <motion.div
                            key={exercise.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                          >
                            <Card hoverable className="overflow-hidden">
                              <div className="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <div>
                                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                    {exercise.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span>Target: {exercise.sets} sets × {exercise.reps} reps</span>
                                    {exercise.weight ? <span>@ {exercise.weight}kg</span> : null}
                                    {exercise.restTime ? <span>• Rest: {exercise.restTime}s</span> : null}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleLogSingleExercise(exercise)}
                                    className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors"
                                    title="Log this exercise session to diary"
                                  >
                                    <Flame className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingExercise(exercise);
                                      setExerciseForm({
                                        name: exercise.name,
                                        sets: exercise.sets,
                                        reps: exercise.reps,
                                        weight: exercise.weight || 0,
                                        restTime: exercise.restTime || 60,
                                        notes: exercise.notes || "",
                                      });
                                      setShowAddExercise(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExercise(exercise.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Previous Performance Comparison Badge */}
                              {previous ? (
                                <div className="mb-3 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold">
                                    <HistoryIcon className="size-3.5" />
                                    <span>Previous: {previous.sets} sets @ {previous.weight || 0}kg × {previous.reps} reps</span>
                                  </div>
                                  <span className="text-[10px] text-purple-600/80 dark:text-purple-400">
                                    {formatDisplayDate(previous.date)}
                                  </span>
                                </div>
                              ) : (
                                <div className="mb-3 text-[11px] text-gray-400 italic">
                                  First session recorded for this exercise
                                </div>
                              )}

                              {/* Interactive Set Rows */}
                              <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
                                  <div className="col-span-2">Set</div>
                                  <div className="col-span-4">Weight (kg)</div>
                                  <div className="col-span-4">Reps</div>
                                  <div className="col-span-2 text-right">Done</div>
                                </div>

                                {detailedSets.map((s, sIdx) => (
                                  <div
                                    key={s.setNumber || sIdx}
                                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-colors ${
                                      s.completed
                                        ? "bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40"
                                        : "bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50"
                                    }`}
                                  >
                                    <div className="col-span-2 font-bold text-xs text-gray-700 dark:text-gray-300">
                                      #{s.setNumber}
                                    </div>

                                    <div className="col-span-4">
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={s.weight}
                                        onChange={(e) =>
                                          handleUpdateSetWeightReps(
                                            exercise.id,
                                            sIdx,
                                            Number(e.target.value),
                                            s.reps
                                          )
                                        }
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-bold text-gray-900 dark:text-white"
                                      />
                                    </div>

                                    <div className="col-span-4">
                                      <input
                                        type="number"
                                        value={s.reps}
                                        onChange={(e) =>
                                          handleUpdateSetWeightReps(
                                            exercise.id,
                                            sIdx,
                                            s.weight,
                                            Number(e.target.value)
                                          )
                                        }
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-bold text-gray-900 dark:text-white"
                                      />
                                    </div>

                                    <div className="col-span-2 text-right">
                                      <button
                                        onClick={() => handleToggleSet(exercise.id, sIdx)}
                                        className={`p-1.5 rounded-lg transition-all ${
                                          s.completed
                                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-emerald-500 hover:text-white"
                                        }`}
                                        title={s.completed ? "Mark incomplete" : "Complete set"}
                                      >
                                        <Check className="size-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {exercise.notes && (
                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                                  Notes: {exercise.notes}
                                </p>
                              )}
                            </Card>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Today's Logged Exercises Preview at Bottom of Routine */}
            {loggedExercisesList.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Flame className="size-4 text-purple-600" />
                    Today's Logged Activities ({loggedExercisesList.length})
                  </h4>
                  <button
                    onClick={() => setActiveTab('diary')}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    View All in Diary →
                  </button>
                </div>

                <div className="space-y-2">
                  {loggedExercisesList.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
                          <Flame className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {entry.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            {entry.duration && <span>{entry.duration} min</span>}
                            {entry.intensity && <span className="capitalize">• {entry.intensity}</span>}
                            {entry.time && <span>• {entry.time}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                          {entry.calories} kcal
                        </span>
                        <button
                          onClick={() => handleDeleteExerciseEntry(entry.id, entry.name)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-lg"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: EXERCISE DIARY & LOGGED ACTIVITIES */}
        {activeTab === 'diary' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Date Navigator Card */}
            <Card className="mb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="size-5" />
                </button>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="size-4 text-purple-600" />
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      {formatDisplayDate(selectedDate)}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {formatFullDisplayDate(selectedDate)}
                  </div>
                </div>

                <button
                  onClick={() => changeDate(1)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>

              {selectedDate !== today && (
                <div className="mt-2 text-center">
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Jump to Today
                  </button>
                </div>
              )}
            </Card>

            {/* Log Exercise Action Button */}
            <div className="mb-4">
              <Button
                onClick={() => setShowExerciseModal(true)}
                icon={Plus}
                fullWidth
                className="py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/25"
              >
                Log Exercise Session
              </Button>
            </div>

            {/* List of Logged Exercise Entries */}
            <div className="space-y-3">
              {loggedExercisesList.length === 0 ? (
                <Card>
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mx-auto mb-3">
                      <Flame className="size-7" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      No exercise logged for {formatDisplayDate(selectedDate)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                      Record your gym workouts, cardio sessions, brisk walking, or recreational sports to calculate your calorie burn accurately.
                    </p>
                    <Button
                      onClick={() => setShowExerciseModal(true)}
                      icon={Flame}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Log Exercise Now
                    </Button>
                  </div>
                </Card>
              ) : (
                loggedExercisesList.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card hoverable className="overflow-hidden">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Flame className="size-5" />
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                              {entry.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {entry.duration && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  <Clock className="size-3" />
                                  {entry.duration} mins
                                </span>
                              )}

                              {entry.intensity && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 capitalize">
                                  {entry.intensity}
                                </span>
                              )}

                              {entry.met && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  MET {entry.met}
                                </span>
                              )}

                              {entry.time && (
                                <span className="text-[10px] text-gray-400 ml-1">
                                  at {entry.time}
                                </span>
                              )}
                            </div>

                            {entry.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                            {entry.calories} <span className="text-xs font-normal text-gray-500">kcal</span>
                          </span>

                          <button
                            onClick={() => handleDeleteExerciseEntry(entry.id, entry.name)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Modal: Exercise Diary (56 Master Library items, MET calculations, fixed burns & custom creation) */}
        <ExerciseDiaryModal
          isOpen={showExerciseModal}
          onClose={() => setShowExerciseModal(false)}
          selectedDate={selectedDate}
          onExerciseLogged={refreshDiaryData}
        />

        {/* Create Workout Modal */}
        <AnimatePresence>
          {showAddWorkout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowAddWorkout(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-6 z-10"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Create Workout for {selectedDay}
                </h3>
                
                <InputField
                  label="Workout Name"
                  type="text"
                  value={workoutName}
                  onChange={setWorkoutName}
                  placeholder="e.g. Chest & Triceps, Leg Hypertrophy, Pull Day"
                  required
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setShowAddWorkout(false)}
                  >
                    Cancel
                  </Button>
                  <Button fullWidth onClick={handleCreateWorkout}>
                    Create Plan
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add/Edit Exercise Modal */}
        <AnimatePresence>
          {showAddExercise && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowAddExercise(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-6 z-10 max-h-[85vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingExercise ? "Edit Exercise" : "Add Exercise to Plan"}
                </h3>
                
                <form onSubmit={handleAddOrEditExercise} className="space-y-4">
                  <InputField
                    label="Exercise Name"
                    type="text"
                    value={exerciseForm.name}
                    onChange={(v) => setExerciseForm({ ...exerciseForm, name: v })}
                    placeholder="e.g. Incline Dumbbell Press, Romanian Deadlift"
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Sets"
                      type="number"
                      min="1"
                      value={exerciseForm.sets}
                      onChange={(v) => setExerciseForm({ ...exerciseForm, sets: Number(v) })}
                      required
                    />
                    <InputField
                      label="Reps"
                      type="text"
                      value={exerciseForm.reps}
                      onChange={(v) => setExerciseForm({ ...exerciseForm, reps: v })}
                      placeholder="e.g. 10 or 8-12"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Starting Weight (kg)"
                      type="number"
                      step="0.5"
                      value={exerciseForm.weight || ""}
                      onChange={(v) => setExerciseForm({ ...exerciseForm, weight: Number(v) })}
                      placeholder="e.g. 24"
                    />

                    <InputField
                      label="Rest Time (seconds)"
                      type="number"
                      value={exerciseForm.restTime || ""}
                      onChange={(v) => setExerciseForm({ ...exerciseForm, restTime: Number(v) })}
                      placeholder="e.g. 60 or 90"
                    />
                  </div>

                  <InputField
                    label="Form Notes (Optional)"
                    type="text"
                    value={exerciseForm.notes}
                    onChange={(v) => setExerciseForm({ ...exerciseForm, notes: v })}
                    placeholder="e.g. Pause at bottom, 3-sec eccentric"
                  />

                  <div className="flex gap-3 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      fullWidth
                      onClick={() => setShowAddExercise(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" fullWidth icon={Check}>
                      {editingExercise ? "Update Exercise" : "Save Exercise"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageContainer>
    </div>
  );
}
