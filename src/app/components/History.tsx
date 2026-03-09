import { useState } from "react";
import { motion } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, InfoRow } from "./ui/cards";
import { storage } from "../../config/storage";
import { DayRecord } from "../types";
import { Calendar as CalendarIcon, Check, X, TrendingDown } from "lucide-react";

export function History() {
  const [state] = useState(() => storage.get());
  const records = state?.records || {};
  const profile = state?.profile;

  // Get all days from start to today
  const startDate = profile?.startDate ? new Date(profile.startDate) : new Date();
  const today = new Date();
  const daysList: Array<{ date: string; record?: DayRecord }> = [];

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    daysList.push({
      date: dateStr,
      record: records[dateStr],
    });
  }

  // Calculate weekly average
  const weeklyAverage = daysList.slice(-7).reduce((acc, day) => {
    return acc + (day.record?.completionRate || 0);
  }, 0) / Math.min(7, daysList.length);

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader title="History" icon={CalendarIcon} />

        {/* Weekly Stats */}
        <Card delay={0.1}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Last 7 Days
          </h3>
          <div className="flex items-end justify-between gap-2">
            {daysList.slice(-7).map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const completion = day.record?.completionRate || 0;
              const height = completion === 0 ? 8 : (completion / 100) * 120 + 8;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`w-full rounded-full ${
                      completion === 100
                        ? "bg-gradient-to-t from-green-500 to-green-400"
                        : completion > 50
                        ? "bg-gradient-to-t from-yellow-500 to-yellow-400"
                        : completion > 0
                        ? "bg-gradient-to-t from-red-500 to-red-400"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Weekly Average
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyAverage.toFixed(0)}%
              </span>
            </div>
          </div>
        </Card>

        {/* Weight Progress */}
        {profile && (
          <Card delay={0.2} className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="size-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Weight Progress
              </h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Start Weight" value={`${profile.startWeight} kg`} />
              <InfoRow label="Current Weight" value={`${profile.currentWeight} kg`} />
              <InfoRow label="Goal Weight" value={`${profile.goalWeight} kg`} />
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Total Lost
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(profile.startWeight - profile.currentWeight).toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Daily History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Daily Progress
          </h3>
          <div className="space-y-2">
            {daysList.reverse().map((day, index) => {
              const date = new Date(day.date);
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const completion = day.record?.completionRate || 0;

              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.02 }}
                  className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-4 rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 hover:bg-white/50 dark:hover:bg-gray-900/50 hover:shadow-lg transition-all duration-300 transform hover:scale-102"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          completion === 100
                            ? "bg-green-100 dark:bg-green-900/30"
                            : completion > 0
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        {completion === 100 ? (
                          <Check className="size-6 text-green-600 dark:text-green-400" strokeWidth={3} />
                        ) : completion > 0 ? (
                          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {completion}%
                          </span>
                        ) : (
                          <X className="size-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {isToday && (
                            <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {completion}%
                      </div>
                      {day.record && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Object.values(day.record.checklist).filter(Boolean).length}/8
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </PageContainer>
    </div>
  );
}