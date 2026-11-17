import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { storage } from "../../config/storage";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { 
  Scale, 
  Ruler, 
  Activity, 
  Footprints, 
  X, 
  Check, 
  Calendar 
} from "lucide-react";

interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSaved?: () => void;
}

export function MeasurementModal({
  isOpen,
  onClose,
  selectedDate,
  onSaved,
}: MeasurementModalProps) {
  const summary = storage.getDailySummary(selectedDate);
  const profile = storage.get()?.profile;

  const [weight, setWeight] = useState<string>(
    summary.weight?.toString() || profile?.currentWeight?.toString() || ""
  );
  const [waist, setWaist] = useState<string>(
    summary.waist?.toString() || profile?.currentWaist?.toString() || ""
  );
  const [bodyFat, setBodyFat] = useState<string>(
    summary.bodyFat?.toString() || profile?.currentBodyFat?.toString() || ""
  );
  const [steps, setSteps] = useState<string>(
    summary.steps > 0 ? summary.steps.toString() : ""
  );
  const [notes, setNotes] = useState<string>("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    storage.saveDailyMeasurement(selectedDate, {
      weight: weight ? Number(weight) : undefined,
      waist: waist ? Number(waist) : undefined,
      bodyFat: bodyFat ? Number(bodyFat) : undefined,
      steps: steps ? Number(steps) : undefined,
      notes: notes.trim() || undefined,
    });

    if (onSaved) onSaved();
    onClose();
  };

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
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 to-teal-600/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md">
                <Activity className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Log Measurements
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Record stats for {selectedDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Body Weight (kg)"
                type="number"
                step="0.1"
                placeholder="e.g. 78.5"
                value={weight}
                onChange={setWeight}
                icon={Scale}
              />

              <InputField
                label="Waist Size (cm)"
                type="number"
                step="0.5"
                placeholder="e.g. 84.0"
                value={waist}
                onChange={setWaist}
                icon={Ruler}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Body Fat (%)"
                type="number"
                step="0.1"
                placeholder="e.g. 18.5"
                value={bodyFat}
                onChange={setBodyFat}
                icon={Activity}
              />

              <InputField
                label="Daily Steps"
                type="number"
                placeholder="e.g. 10500"
                value={steps}
                onChange={setSteps}
                icon={Footprints}
              />
            </div>

            <InputField
              label="Notes (Optional)"
              type="text"
              placeholder="e.g. Morning fasted measurement, low water retention"
              value={notes}
              onChange={setNotes}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" fullWidth icon={Check}>
                Save Measurements
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
