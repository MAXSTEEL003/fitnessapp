import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, SectionHeader } from "./ui/cards";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { Badge } from "./ui/forms";
import { storage } from "../../config/storage";
import { Exercise, WorkoutSession } from "../types";
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Check,
  Edit
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
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [routine, setRoutine] = useState(() => storage.getGymRoutine());
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutSession | null>(null);
  
  // Form state
  const [workoutName, setWorkoutName] = useState("");
  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: 3,
    reps: "10",
    weight: 0,
    notes: "",
  });

  const currentWorkout = routine[selectedDay];
  const today = new Date().toISOString().split('T')[0];
  const workoutHistory = storage.getWorkoutHistory(today);

  const handleCreateWorkout = () => {
    if (!workoutName.trim()) return;

    const workout: WorkoutSession = {
      id: Date.now().toString(),
      name: workoutName,
      exercises: [],
    };

    storage.saveWorkoutForDay(selectedDay, workout);
    setRoutine(storage.getGymRoutine());
    setWorkoutName("");
    setShowAddWorkout(false);
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkout) return;

    const exercise: Exercise = {
      id: Date.now().toString(),
      ...newExercise,
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, exercise],
    };

    storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    setRoutine(storage.getGymRoutine());
    
    setNewExercise({
      name: "",
      sets: 3,
      reps: "10",
      weight: 0,
      notes: "",
    });
    setShowAddExercise(false);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!currentWorkout || !confirm("Delete this exercise?")) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter(e => e.id !== exerciseId),
    };

    storage.saveWorkoutForDay(selectedDay, updatedWorkout);
    setRoutine(storage.getGymRoutine());
  };

  const handleDeleteWorkout = () => {
    if (!confirm("Delete this entire workout?")) return;

    const updatedRoutine = { ...routine };
    delete updatedRoutine[selectedDay];
    
    const state = storage.get();
    if (state) {
      state.gymRoutine = updatedRoutine;
      storage.save(state);
      setRoutine(updatedRoutine);
    }
  };

  const handleCompleteWorkout = () => {
    if (!currentWorkout) return;

    storage.saveWorkoutHistory(today, currentWorkout);
    alert("Workout completed! Great job! 💪");
  };

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader title="Gym Routine" icon={Dumbbell} />

        {/* Day Selector */}
        <Card delay={0.1}>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = day === selectedDay;
              const hasWorkout = routine[day];
              const dayIndex = DAYS_OF_WEEK.indexOf(day);
              const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
              const isToday = dayIndex === currentDayIndex;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all relative
                    ${isSelected 
                      ? "bg-blue-600 text-white shadow-lg scale-105" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <div className="text-sm">{day.slice(0, 3)}</div>
                  {hasWorkout && (
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                      isSelected ? "bg-white" : "bg-blue-600"
                    }`} />
                  )}
                  {isToday && !isSelected && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Workout Content */}
        {!currentWorkout ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mt-6">
              <div className="text-center py-12">
                <Dumbbell className="size-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No workout planned
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create a workout routine for {selectedDay}
                </p>
                <Button
                  onClick={() => setShowAddWorkout(true)}
                  icon={Plus}
                >
                  Create Workout
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Workout Header */}
            <Card delay={0.2} className="mt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentWorkout.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {currentWorkout.exercises.length} exercises
                    </Badge>
                    {workoutHistory?.completed && (
                      <Badge variant="success">
                        <Check className="size-3 mr-1" />
                        Completed Today
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDeleteWorkout}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>

              {!workoutHistory?.completed && (
                <Button
                  onClick={handleCompleteWorkout}
                  variant="primary"
                  icon={Check}
                  fullWidth
                >
                  Mark as Complete
                </Button>
              )}
            </Card>

            {/* Exercises List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Exercises
                </h3>
                <Button
                  onClick={() => setShowAddExercise(true)}
                  icon={Plus}
                  size="sm"
                >
                  Add Exercise
                </Button>
              </div>

              <div className="space-y-3">
                {currentWorkout.exercises.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        No exercises yet. Add your first exercise!
                      </p>
                    </div>
                  </Card>
                ) : (
                  currentWorkout.exercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card hoverable>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                              {exercise.name}
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500 dark:text-gray-400">Sets</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {exercise.sets}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 dark:text-gray-400">Reps</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {exercise.reps}
                                </div>
                              </div>
                              {exercise.weight && exercise.weight > 0 && (
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Weight</div>
                                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                                    {exercise.weight}kg
                                  </div>
                                </div>
                              )}
                            </div>
                            {exercise.notes && (
                              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                                {exercise.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="ml-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Create Workout Modal */}
        <AnimatePresence>
          {showAddWorkout && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowAddWorkout(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-1/3 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 p-6"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Create Workout for {selectedDay}
                </h3>
                
                <InputField
                  label="Workout Name"
                  type="text"
                  value={workoutName}
                  onChange={setWorkoutName}
                  placeholder="e.g., Push Day, Leg Day"
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
                    Create
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Add Exercise Modal */}
        <AnimatePresence>
          {showAddExercise && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowAddExercise(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-20 max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto p-6"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Add Exercise
                </h3>
                
                <form onSubmit={handleAddExercise} className="space-y-4">
                  <InputField
                    label="Exercise Name"
                    type="text"
                    value={newExercise.name}
                    onChange={(value) => setNewExercise({ ...newExercise, name: value })}
                    placeholder="e.g., Bench Press"
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Sets"
                      type="number"
                      value={newExercise.sets}
                      onChange={(value) => setNewExercise({ ...newExercise, sets: Number(value) })}
                      required
                    />
                    <InputField
                      label="Reps"
                      type="text"
                      value={newExercise.reps}
                      onChange={(value) => setNewExercise({ ...newExercise, reps: value })}
                      placeholder="e.g., 10 or 8-12"
                      required
                    />
                  </div>

                  <InputField
                    label="Weight (kg) - Optional"
                    type="number"
                    value={newExercise.weight || ""}
                    onChange={(value) => setNewExercise({ ...newExercise, weight: Number(value) })}
                  />

                  <InputField
                    label="Notes - Optional"
                    type="text"
                    value={newExercise.notes}
                    onChange={(value) => setNewExercise({ ...newExercise, notes: value })}
                    placeholder="Form tips, tempo, etc."
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      fullWidth
                      onClick={() => setShowAddExercise(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" fullWidth>
                      Add Exercise
                    </Button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </PageContainer>
    </div>
  );
}
