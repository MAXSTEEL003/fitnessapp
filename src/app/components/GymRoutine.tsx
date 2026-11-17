import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, SectionHeader } from "./ui/cards";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { Badge } from "./ui/forms";
import { storage } from "../../config/storage";
import { Exercise, WorkoutSession, WorkoutSet } from "../types";
import { getTodayDateString, formatDisplayDate } from "../utils/date";
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
  Sparkles
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
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[currentDayIndex]);
  const [routine, setRoutine] = useState(() => storage.getGymRoutine());
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Active workout performance state for today
  const today = getTodayDateString();
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

  const handleCompleteWorkout = () => {
    if (!currentWorkout) return;

    const completed = { ...currentWorkout, completed: true, date: today };
    storage.saveWorkoutHistory(today, completed);
    setTodayWorkout(completed);

    // Also check off gym workout in today's checklist
    const todayRec = storage.getTodayRecord();
    if (!todayRec.checklist.gymWorkout) {
      storage.updateTodayChecklist({
        ...todayRec.checklist,
        gymWorkout: true,
      });
      window.dispatchEvent(new Event('checklistUpdated'));
    }

    alert("Workout recorded and saved to history! Outstanding work! 💪");
  };

  const isTodayDay = DAYS_OF_WEEK[currentDayIndex] === selectedDay;
  const isWorkoutCompleted = todayWorkout?.completed && isTodayDay;

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader 
          title="Gym Routine" 
          subtitle="Track sets, weights, and gym performance"
          icon={Dumbbell} 
          action={
            timerSeconds !== null ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold shadow-lg animate-pulse">
                <Timer className="size-4" />
                <span>Rest: {timerSeconds}s</span>
              </div>
            ) : undefined
          }
        />

        {/* Day Selector */}
        <Card delay={0.1} className="mt-2">
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
            <Card className="mt-6">
              <div className="text-center py-12">
                <Dumbbell className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  No workout planned for {selectedDay}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Set up your resistance training plan and record your performance
                </p>
                <Button
                  onClick={() => setShowAddWorkout(true)}
                  icon={Plus}
                >
                  Create Workout Plan
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Workout Header Card */}
            <Card delay={0.2} className="mt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
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

              {/* Complete Workout Button */}
              <Button
                onClick={handleCompleteWorkout}
                variant={isWorkoutCompleted ? "secondary" : "primary"}
                icon={Check}
                fullWidth
                className="mt-2"
              >
                {isWorkoutCompleted ? "Update Completed Workout" : "Mark Workout Completed & Log"}
              </Button>
            </Card>

            {/* Exercises List with Set-by-Set Tracking */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="size-5 text-purple-600" />
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

              <div className="space-y-4">
                {currentWorkout.exercises.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No exercises yet. Click "Add Exercise" to begin your plan!
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
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card hoverable className="overflow-hidden">
                          <div className="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
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
                                <span>Previous best: {previous.sets} sets @ {previous.weight || 0}kg × {previous.reps} reps</span>
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
                            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
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
            </motion.div>
          </>
        )}

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
