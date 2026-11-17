import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExerciseLibraryItem, ExerciseDiaryEntry, ExerciseType, ExerciseIntensity } from "../types";
import { storage } from "../../config/storage";
import { estimateExerciseCalories, calculateMetCalories, MET_TABLE, round } from "../utils/nutrition-calculations";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { 
  Dumbbell, 
  Flame, 
  Clock, 
  Search, 
  Plus, 
  Star, 
  Trash2, 
  Copy, 
  Edit2, 
  X, 
  Check, 
  Sparkles,
  Zap,
  Activity,
  Calculator
} from "lucide-react";

const EXERCISE_CATEGORIES = [
  'All',
  'Strength Training',
  'Cardio',
  'Walking',
  'Daily Activities',
  'Core Training',
  'Sports & Recreation',
];

interface ExerciseDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onExerciseLogged?: () => void;
}

export function ExerciseDiaryModal({
  isOpen,
  onClose,
  selectedDate,
  onExerciseLogged,
}: ExerciseDiaryModalProps) {
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>(() => storage.getExercises());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // 'browse' | 'create' | 'edit' | 'logEntry'
  const [modalMode, setModalMode] = useState<'browse' | 'create' | 'edit' | 'logEntry'>('browse');
  const [activeExercise, setActiveExercise] = useState<ExerciseLibraryItem | null>(null);

  // Form for create/edit
  const [formData, setFormData] = useState({
    name: "",
    type: "fixed" as ExerciseType,
    category: "Strength Training",
    defaultCalories: 200,
    defaultDuration: 30,
    defaultIntensity: "moderate" as ExerciseIntensity,
    met: 5.0,
    notes: "",
  });

  // Logging state
  const [logMethod, setLogMethod] = useState<ExerciseType>("fixed");
  const [logName, setLogName] = useState("");
  const [logDuration, setLogDuration] = useState<number>(30);
  const [logIntensity, setLogIntensity] = useState<ExerciseIntensity>("moderate");
  const [logMet, setLogMet] = useState<number>(3.5);
  const [logCalories, setLogCalories] = useState<number>(200);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  const profile = storage.get()?.profile;
  const userWeight = profile?.currentWeight || 82;

  const refreshExercises = () => {
    setExercises(storage.getExercises());
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      type: "fixed",
      category: "Strength Training",
      defaultCalories: 150,
      defaultDuration: 30,
      defaultIntensity: "moderate",
      met: 5.0,
      notes: "",
    });
    setModalMode('create');
  };

  const handleOpenEdit = (ex: ExerciseLibraryItem) => {
    setActiveExercise(ex);
    setFormData({
      name: ex.name,
      type: ex.type,
      category: ex.category || "Strength Training",
      defaultCalories: ex.defaultCalories || 150,
      defaultDuration: ex.defaultDuration || 30,
      defaultIntensity: ex.defaultIntensity || "moderate",
      met: ex.met || 4.5,
      notes: ex.notes || "",
    });
    setModalMode('edit');
  };

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (modalMode === 'edit' && activeExercise) {
      storage.saveExercise({
        ...activeExercise,
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category,
        defaultCalories: formData.type === 'fixed' ? Number(formData.defaultCalories) || 0 : undefined,
        defaultDuration: Number(formData.defaultDuration) || 30,
        defaultIntensity: formData.defaultIntensity,
        met: Number(formData.met) || 3.5,
        notes: formData.notes.trim() || undefined,
      });
    } else {
      const newEx: ExerciseLibraryItem = {
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category,
        defaultCalories: formData.type === 'fixed' ? Number(formData.defaultCalories) || 0 : undefined,
        defaultDuration: Number(formData.defaultDuration) || 30,
        defaultIntensity: formData.defaultIntensity,
        met: Number(formData.met) || 3.5,
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      storage.saveExercise(newEx);
    }

    refreshExercises();
    setModalMode('browse');
    setActiveExercise(null);
  };

  const handleDeleteExercise = (id: string, name: string) => {
    if (confirm(`Delete "${name}" from exercise library?`)) {
      storage.deleteExercise(id);
      refreshExercises();
    }
  };

  const handleDuplicateExercise = (id: string) => {
    storage.duplicateExercise(id);
    refreshExercises();
  };

  const handleToggleFavorite = (id: string) => {
    storage.toggleFavoriteExercise(id);
    refreshExercises();
  };

  const getMetForActivity = (name: string, fallbackMet?: number): number => {
    if (fallbackMet && fallbackMet > 0) return fallbackMet;
    const lower = name.toLowerCase();
    if (lower.includes('running')) return 9.8;
    if (lower.includes('jogging')) return 7.0;
    if (lower.includes('cycling') || lower.includes('bike')) return 6.8;
    if (lower.includes('stair')) return 8.0;
    if (lower.includes('incline')) return 5.3;
    if (lower.includes('rowing')) return 7.0;
    if (lower.includes('hiking')) return 6.0;
    if (lower.includes('weight') || lower.includes('strength') || lower.includes('gym')) return 5.0;
    if (lower.includes('calisthenic')) return 4.0;
    if (lower.includes('abs') || lower.includes('core')) return 4.0;
    if (lower.includes('brisk')) return 4.3;
    if (lower.includes('casual')) return 2.8;
    return 3.5;
  };

  const handleSelectToLog = (ex: ExerciseLibraryItem) => {
    setActiveExercise(ex);
    setLogName(ex.name);
    setLogMethod(ex.type);
    const duration = ex.defaultDuration || 30;
    setLogDuration(duration);
    setLogIntensity(ex.defaultIntensity || 'moderate');
    
    const met = getMetForActivity(ex.name, ex.met);
    setLogMet(met);

    if (ex.type === 'fixed') {
      setLogCalories(ex.defaultCalories || 150);
    } else {
      const calculated = calculateMetCalories(met, userWeight, duration);
      setLogCalories(calculated);
    }
    setSaveToLibrary(false);
    setModalMode('logEntry');
  };

  const handleOpenManualLog = () => {
    setActiveExercise(null);
    setLogName("");
    setLogMethod("fixed");
    setLogDuration(30);
    setLogIntensity("moderate");
    setLogMet(3.5);
    setLogCalories(150);
    setSaveToLibrary(false);
    setModalMode('logEntry');
  };

  // Recalculate duration-based calories using exact MET formula:
  // Calories = MET × 3.5 × body weight in kg / 200 × duration in minutes
  const handleDurationOrIntensityChange = (newDuration: number, newIntensity: ExerciseIntensity, newMet?: number) => {
    const duration = Math.max(0, newDuration);
    setLogDuration(duration);
    setLogIntensity(newIntensity);
    const currentMet = newMet !== undefined ? newMet : logMet;
    if (newMet !== undefined) setLogMet(newMet);

    if (logMethod === 'duration') {
      const calculated = calculateMetCalories(currentMet, userWeight, duration);
      setLogCalories(calculated);
    }
  };

  const handleConfirmLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logName.trim()) return;

    // Optional: save manual entry to library
    let exerciseId = activeExercise?.id;
    if (saveToLibrary && !activeExercise) {
      const newLibItem: ExerciseLibraryItem = {
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: logName.trim(),
        type: logMethod,
        category: "Cardio",
        defaultCalories: logMethod === 'fixed' ? logCalories : undefined,
        defaultDuration: logDuration,
        defaultIntensity: logIntensity,
        met: logMet,
        createdAt: new Date().toISOString(),
      };
      storage.saveExercise(newLibItem);
      exerciseId = newLibItem.id;
      refreshExercises();
    }

    storage.addExerciseEntry(selectedDate, {
      exerciseId,
      name: logName.trim(),
      type: logMethod,
      duration: logDuration > 0 ? logDuration : undefined,
      intensity: logMethod === 'duration' ? logIntensity : undefined,
      met: logMethod === 'duration' ? logMet : undefined,
      calculationMethod: logMethod,
      calories: Math.max(0, Number(logCalories) || 0),
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
    });

    if (onExerciseLogged) onExerciseLogged();
    onClose();
  };

  const filteredExercises = exercises
    .filter((ex) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = ex.name.toLowerCase().includes(q) ||
        (ex.category && ex.category.toLowerCase().includes(q));
      const matchesFav = !showOnlyFavorites || ex.isFavorite;
      const matchesCategory = selectedCategory === "All" ||
        ex.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesFav && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.lastUsedAt && b.lastUsedAt) return b.lastUsedAt.localeCompare(a.lastUsedAt);
      return a.name.localeCompare(b.name);
    });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg max-h-[88vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-blue-600/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                <Dumbbell className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modalMode === 'browse' && "Exercise & Activity Library"}
                  {modalMode === 'logEntry' && "Log Exercise Session"}
                  {(modalMode === 'create' || modalMode === 'edit') && "Manage Activity"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {modalMode === 'logEntry'
                    ? `Logging for ${selectedDate} • Does not increase food allowance`
                    : "Fixed-calorie or duration-based activity library"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (modalMode !== 'browse') {
                  setModalMode('browse');
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* ---------------- MODE: BROWSE ---------------- */}
            {modalMode === 'browse' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search activity (e.g. Walking, Treadmill, Weights)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <Button
                    onClick={handleOpenCreate}
                    icon={Plus}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    New
                  </Button>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {EXERCISE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? "bg-purple-600 border-purple-600 text-white font-semibold shadow-sm"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pb-1">
                  <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                      showOnlyFavorites
                        ? "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300 font-semibold"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <Star className={`size-3.5 ${showOnlyFavorites ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    Favorites
                  </button>

                  <button
                    onClick={handleOpenManualLog}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    + Quick Manual Entry
                  </button>
                </div>

                {/* List */}
                <div className="space-y-2.5">
                  {filteredExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="group bg-gray-50/70 dark:bg-gray-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-3.5 transition-all flex items-center justify-between"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleSelectToLog(ex)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {ex.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                            {ex.type === 'fixed' ? 'Fixed Calories' : 'Duration-based'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {ex.type === 'fixed' ? (
                            <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Flame className="size-3.5" />
                              {ex.defaultCalories} kcal est.
                            </span>
                          ) : (
                            <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {ex.defaultDuration || 30} mins ({ex.defaultIntensity || 'moderate'})
                            </span>
                          )}
                          {ex.notes && (
                            <span className="italic truncate max-w-[200px]">
                              • {ex.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleToggleFavorite(ex.id)}
                          className={`p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors ${
                            ex.isFavorite ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          <Star className={`size-4 ${ex.isFavorite ? "fill-yellow-500" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleDuplicateExercise(ex.id)}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ex)}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-purple-600"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(ex.id, ex.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleSelectToLog(ex)}
                          className="ml-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- MODE: LOG ENTRY ---------------- */}
            {modalMode === 'logEntry' && (
              <form onSubmit={handleConfirmLog} className="space-y-4">
                {/* Method selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Logging Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLogMethod('fixed')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        logMethod === 'fixed'
                          ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="font-bold text-sm flex items-center gap-1.5 mb-0.5">
                        <Flame className="size-4" />
                        Fixed Calories
                      </div>
                      <div className="text-[11px] opacity-80">User-defined estimate</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLogMethod('duration');
                        const est = estimateExerciseCalories(logName || 'Walking', logDuration, logIntensity, userWeight);
                        setLogCalories(est);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        logMethod === 'duration'
                          ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="font-bold text-sm flex items-center gap-1.5 mb-0.5">
                        <Clock className="size-4" />
                        Duration-based
                      </div>
                      <div className="text-[11px] opacity-80">Estimated from minutes & pace</div>
                    </button>
                  </div>
                </div>

                <InputField
                  label="Activity Name"
                  type="text"
                  placeholder="e.g. Weight training, Evening walk, Cycling"
                  value={logName}
                  onChange={(v) => {
                    setLogName(v);
                    if (logMethod === 'duration') {
                      setLogCalories(estimateExerciseCalories(v, logDuration, logIntensity, userWeight));
                    }
                  }}
                  required
                />

                {/* Duration & Intensity for duration-based */}
                {logMethod === 'duration' && (
                  <div className="space-y-3.5 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="size-3.5" />
                        MET Formula Calculator
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        Body Weight: <strong className="text-gray-900 dark:text-white">{userWeight} kg</strong>
                      </span>
                    </div>

                    {/* MET Activity Preset Select */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Activity MET Rating
                      </label>
                      <select
                        value={logMet}
                        onChange={(e) => {
                          const newMet = Number(e.target.value);
                          handleDurationOrIntensityChange(logDuration, logIntensity, newMet);
                        }}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="3.5">Walking (moderate 4.8 km/h) — MET 3.5</option>
                        <option value="4.3">Walking (brisk 6 km/h) — MET 4.3</option>
                        <option value="5.3">Incline walking — MET 5.3</option>
                        <option value="7.0">Jogging (7-8 km/h) — MET 7.0</option>
                        <option value="9.8">Running (9.5+ km/h) — MET 9.8</option>
                        <option value="6.8">Cycling (moderate) — MET 6.8</option>
                        <option value="5.0">Weight training (Hypertrophy) — MET 5.0</option>
                        <option value="4.0">Calisthenics & Core — MET 4.0</option>
                        <option value="8.0">Stair climbing — MET 8.0</option>
                        <option value="7.0">Rowing machine — MET 7.0</option>
                        <option value="2.8">Casual walking — MET 2.8</option>
                        <option value="6.0">Hiking — MET 6.0</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={logDuration}
                          onChange={(e) => handleDurationOrIntensityChange(Number(e.target.value), logIntensity)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Intensity Preset
                        </label>
                        <select
                          value={logIntensity}
                          onChange={(e) => handleDurationOrIntensityChange(logDuration, e.target.value as ExerciseIntensity)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          <option value="low">Low Intensity</option>
                          <option value="moderate">Moderate Intensity</option>
                          <option value="high">High Intensity</option>
                        </select>
                      </div>
                    </div>

                    {/* Exact ACSM Formula Visualizer */}
                    <div className="p-3 bg-purple-100/60 dark:bg-purple-900/30 rounded-xl border border-purple-300/40 dark:border-purple-700/40 text-[11px] space-y-1">
                      <div className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <Calculator className="size-3.5" />
                        ACSM Formula: MET × 3.5 × weight / 200 × duration
                      </div>
                      <div className="text-purple-700 dark:text-purple-300 font-mono text-xs">
                        {logMet} × 3.5 × {userWeight}kg / 200 × {logDuration}m = <strong>{calculateMetCalories(logMet, userWeight, logDuration)} kcal</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calories Display and Manual Adjustment */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Flame className="size-4 text-orange-500" />
                      Calorie Burn Estimate (kcal)
                    </label>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium">
                      Editable estimate
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={logCalories}
                    onChange={(e) => setLogCalories(Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                    Note: Exercise calories are tracked separately and not added to your daily food calorie allowance.
                  </p>
                </div>

                {!activeExercise && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="saveExerciseToLib"
                      checked={saveToLibrary}
                      onChange={(e) => setSaveToLibrary(e.target.checked)}
                      className="size-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="saveExerciseToLib" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                      Save to reusable Exercise Library for future quick-logging
                    </label>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => setModalMode('browse')}
                  >
                    Back to Library
                  </Button>
                  <Button type="submit" fullWidth icon={Check}>
                    Save to Exercise Diary
                  </Button>
                </div>
              </form>
            )}

            {/* ---------------- MODE: CREATE / EDIT ACTIVITY ---------------- */}
            {(modalMode === 'create' || modalMode === 'edit') && (
              <form onSubmit={handleSaveExercise} className="space-y-4">
                <InputField
                  label="Activity Name"
                  type="text"
                  placeholder="e.g. Weight training, Cycling, Treadmill"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logging Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ExerciseType })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="fixed">Fixed Calorie</option>
                      <option value="duration">Duration-based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Strength">Strength</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="Sports">Sports</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {formData.type === 'fixed' ? (
                  <InputField
                    label="Default Calorie Estimate (kcal)"
                    type="number"
                    value={formData.defaultCalories}
                    onChange={(v) => setFormData({ ...formData, defaultCalories: Number(v) })}
                    required
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Default Duration (mins)"
                      type="number"
                      value={formData.defaultDuration}
                      onChange={(v) => setFormData({ ...formData, defaultDuration: Number(v) })}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Intensity
                      </label>
                      <select
                        value={formData.defaultIntensity}
                        onChange={(e) => setFormData({ ...formData, defaultIntensity: e.target.value as ExerciseIntensity })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                )}

                <InputField
                  label="Notes (Optional)"
                  type="text"
                  placeholder="e.g. Heart rate zone, resistance level"
                  value={formData.notes}
                  onChange={(v) => setFormData({ ...formData, notes: v })}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setModalMode('browse');
                      setActiveExercise(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" fullWidth icon={Check}>
                    {modalMode === 'edit' ? "Update Activity" : "Save to Library"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
