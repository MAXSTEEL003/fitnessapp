import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, InfoRow, SectionHeader } from "./ui/cards";
import { Button } from "./ui/buttons";
import { storage } from "../../config/storage";
import { DayRecord, MeasurementRecord, DailyLog } from "../types";
import { 
  getTodayDateString, 
  shiftDateString, 
  formatDisplayDate 
} from "../utils/date";
import { MeasurementModal } from "./MeasurementModal";
import { 
  TrendingDown, 
  Scale, 
  Ruler, 
  Flame, 
  Footprints, 
  Beef, 
  Activity, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Plus, 
  BarChart3,
  Dumbbell
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from "recharts";

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function History() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [state, setState] = useState(() => storage.get());
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'weight' | 'waist' | 'calories' | 'protein' | 'steps' | 'consistency'>('weight');

  const refreshData = () => {
    setState(storage.get());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const profile = state?.profile;
  const records = state?.records || {};
  const dailyLogs = state?.dailyLogs || {};
  const measurements = storage.getMeasurements();

  // Build continuous date range
  const todayStr = getTodayDateString();
  const startDateStr = profile?.startDate || shiftDateString(todayStr, -30);
  
  let daysBack = 30;
  if (timeRange === '7d') daysBack = 7;
  else if (timeRange === '30d') daysBack = 30;
  else if (timeRange === '90d') daysBack = 90;
  else if (timeRange === 'all') {
    const diff = Math.max(30, Math.ceil((new Date(todayStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    daysBack = Math.min(365, diff);
  }

  // Generate historical data array for Recharts
  const chartData: any[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = shiftDateString(todayStr, -i);
    const rec = records[date];
    const log = dailyLogs[date];
    const meas = measurements.find((m) => m.date === date);

    const nutrition = log ? storage.getDailySummary(date) : null;

    const [year, month, day] = date.split('-');
    const label = `${month}/${day}`;

    chartData.push({
      date,
      label,
      weight: meas?.weight ?? log?.weight ?? rec?.weight ?? null,
      waist: meas?.waist ?? log?.waist ?? rec?.waist ?? null,
      bodyFat: meas?.bodyFat ?? log?.bodyFat ?? rec?.bodyFat ?? null,
      calories: nutrition?.consumedCalories ?? 0,
      targetCalories: nutrition?.targetCalories ?? profile?.targetCalories ?? 2100,
      protein: nutrition?.consumedProtein ?? 0,
      targetProtein: nutrition?.targetProtein ?? profile?.targetProtein ?? 150,
      steps: meas?.steps ?? log?.steps ?? rec?.steps ?? 0,
      targetSteps: profile?.targetSteps ?? 10000,
      completionRate: rec?.completionRate ?? 0,
      hadWorkout: rec?.checklist?.gymWorkout ? 100 : 0,
    });
  }

  // Filter valid entries for stats
  const validWeights = chartData.map((d) => d.weight).filter((w) => w !== null && w > 0);
  const validWaists = chartData.map((d) => d.waist).filter((w) => w !== null && w > 0);

  const startWeight = profile?.startWeight || (validWeights.length > 0 ? validWeights[0] : 0);
  const currentWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1] : (profile?.currentWeight || startWeight);
  const goalWeight = profile?.goalWeight || 70;
  const totalWeightLost = Math.max(0, startWeight - currentWeight);

  const currentWaist = validWaists.length > 0 ? validWaists[validWaists.length - 1] : profile?.currentWaist;

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader 
          title="Progress & Analytics" 
          subtitle="Body recomposition and historical tracking"
          icon={Activity} 
          action={
            <Button
              onClick={() => setShowMeasurementModal(true)}
              icon={Plus}
              size="sm"
            >
              Log Stats
            </Button>
          }
        />

        {/* Time Range Selector */}
        <div className="flex items-center justify-between mt-2 mb-4 bg-white/60 dark:bg-gray-900/60 p-1.5 rounded-2xl border border-white/40 dark:border-gray-800">
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                timeRange === r
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              {r === '7d' && "Last 7 Days"}
              {r === '30d' && "Last 30 Days"}
              {r === '90d' && "90 Days"}
              {r === 'all' && "All Time"}
            </button>
          ))}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/50 dark:border-blue-800/40 p-3 rounded-2xl text-center">
            <Scale className="size-4 text-blue-600 mx-auto mb-1" />
            <div className="text-[11px] text-gray-500">Weight</div>
            <div className="text-lg font-black text-gray-900 dark:text-white">{currentWeight} kg</div>
            <div className="text-[10px] text-emerald-600 font-semibold">-{totalWeightLost.toFixed(1)}kg total</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/50 dark:border-purple-800/40 p-3 rounded-2xl text-center">
            <Ruler className="size-4 text-purple-600 mx-auto mb-1" />
            <div className="text-[11px] text-gray-500">Waist</div>
            <div className="text-lg font-black text-gray-900 dark:text-white">
              {currentWaist ? `${currentWaist} cm` : "Not logged"}
            </div>
            <div className="text-[10px] text-purple-600 font-semibold">Fat loss index</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-200/50 dark:border-orange-800/40 p-3 rounded-2xl text-center">
            <TrendingDown className="size-4 text-orange-600 mx-auto mb-1" />
            <div className="text-[11px] text-gray-500">Goal Target</div>
            <div className="text-lg font-black text-gray-900 dark:text-white">{goalWeight} kg</div>
            <div className="text-[10px] text-gray-400 font-semibold">
              {(currentWeight - goalWeight > 0 ? (currentWeight - goalWeight).toFixed(1) : 0)}kg to go
            </div>
          </div>
        </div>

        {/* Interactive Recharts Section */}
        <Card delay={0.15} className="mb-6">
          {/* Chart Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-gray-100 dark:border-gray-800 no-scrollbar">
            {[
              { id: 'weight', label: 'Weight Trend', icon: Scale },
              { id: 'waist', label: 'Waist Trend', icon: Ruler },
              { id: 'calories', label: 'Calories', icon: Flame },
              { id: 'protein', label: 'Protein', icon: Beef },
              { id: 'steps', label: 'Daily Steps', icon: Footprints },
              { id: 'consistency', label: 'Habit Consistency', icon: Dumbbell },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeChartTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveChartTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Chart 1: Weight Trend */}
          {activeChartTab === 'weight' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Body Weight (kg)</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Goal: {goalWeight} kg</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.filter((d) => d.weight !== null)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={11} 
                      domain={['auto', 'auto']}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} kg`, 'Weight']}
                    />
                    <ReferenceLine y={goalWeight} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#10b981', fontSize: 10 }} />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#3b82f6' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Log regular morning weigh-ins to track fat loss trends.
              </p>
            </div>
          )}

          {/* Chart 2: Waist Trend */}
          {activeChartTab === 'waist' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Waist Measurement (cm)</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Primary Fat Loss Metric</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.filter((d) => d.waist !== null)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} domain={['auto', 'auto']} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} cm`, 'Waist']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="waist" 
                      stroke="#a855f7" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#a855f7' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Waist circumference is the cleanest indicator of visceral & subcutaneous abdominal fat loss.
              </p>
            </div>
          )}

          {/* Chart 3: Daily Calorie Intake vs Target */}
          {activeChartTab === 'calories' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Calorie Intake (kcal)</span>
                <span className="text-xs text-red-500 font-semibold">Target: 2,100 kcal</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} kcal`, 'Intake']}
                    />
                    <ReferenceLine y={profile?.targetCalories || 2100} stroke="#ef4444" strokeDasharray="4 4" />
                    <Bar dataKey="calories" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 4: Daily Protein Intake vs Target */}
          {activeChartTab === 'protein' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Daily Protein (grams)</span>
                <span className="text-xs text-blue-500 font-semibold">Target: {profile?.targetProtein || 150}g</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} g`, 'Protein']}
                    />
                    <ReferenceLine y={profile?.targetProtein || 150} stroke="#3b82f6" strokeDasharray="4 4" />
                    <Bar dataKey="protein" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 5: Daily Step Count vs Target */}
          {activeChartTab === 'steps' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Daily Step Count</span>
                <span className="text-xs text-emerald-500 font-semibold">Goal: {profile?.targetSteps || 10000}</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val.toLocaleString()} steps`, 'Steps']}
                    />
                    <ReferenceLine y={profile?.targetSteps || 10000} stroke="#10b981" strokeDasharray="4 4" />
                    <Bar dataKey="steps" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 6: Habit Consistency / Completion */}
          {activeChartTab === 'consistency' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Checklist Completion Rate (%)</span>
                <span className="text-xs text-emerald-500 font-semibold">Discipline Tracker</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" domain={[0, 100]} fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val}%`, 'Completion']}
                    />
                    <Bar dataKey="completionRate" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* Daily Record Breakdown List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="size-5 text-blue-600" />
              Daily Log History
            </h3>
            <span className="text-xs text-gray-500">Showing {chartData.length} days</span>
          </div>

          <div className="space-y-2.5">
            {[...chartData].reverse().map((day, index) => {
              const isToday = day.date === todayStr;
              const completion = day.completionRate || 0;

              return (
                <div
                  key={day.date}
                  className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/40 dark:border-gray-800 hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        completion === 100
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : completion > 0
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      {completion === 100 ? <Check className="size-5" /> : `${completion}%`}
                    </div>

                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        {formatDisplayDate(day.date)}
                        {isToday && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {day.weight && <span>{day.weight} kg</span>}
                        {day.waist && <span>• {day.waist} cm waist</span>}
                        {day.steps > 0 && <span>• {day.steps.toLocaleString()} steps</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {day.calories > 0 ? `${day.calories} kcal` : 'No food'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {day.protein > 0 ? `P: ${day.protein}g` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Measurement Entry Modal */}
        <MeasurementModal
          isOpen={showMeasurementModal}
          onClose={() => setShowMeasurementModal(false)}
          selectedDate={todayStr}
          onSaved={refreshData}
        />
      </PageContainer>
    </div>
  );
}
