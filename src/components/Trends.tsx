import { useAppStore } from '../lib/store';
import { format, subDays, startOfDay, isSameDay, startOfWeek, subWeeks, addDays, isFuture } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, YAxis, ReferenceLine } from 'recharts';
import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export function Trends() {
  const { logs, goals, weightLogs, addWeightLog, deleteWeightLog, profile } = useAppStore();
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate maintenance calories (TDEE)
  const { weight: pWeight, height, age, gender, activityLevel } = profile;
  let bmr = (10 * pWeight) + (6.25 * height) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;
  const maintenanceCals = Math.round(bmr * activityLevel);

  // Generate Mon-Sun data for the selected week
  const baseDate = subWeeks(new Date(), weekOffset);
  const startOfSelectedWeek = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = startOfDay(addDays(startOfSelectedWeek, i));
    const dayLogs = logs.filter(l => isSameDay(new Date(l.timestamp), date));
    const cals = dayLogs.reduce((sum, l) => sum + ((l.totalCalories ?? (l as any).total_calories ?? 0)), 0);
    const isToday = isSameDay(date, new Date());
    
    return {
      name: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      calories: Math.round(cals),
      isToday,
      isFuture: isFuture(date) && !isToday
    };
  });

  // Weekly accumulated balance
  // Sum of (Consumed - Maintenance) for days with logged calories
  const accumulatedBalance = weekDays.reduce((sum, day) => {
    if (day.isFuture) return sum; 
    // Only calculate balance for days with actual logged calories
    if (day.calories > 0) {
      const dayBalance = day.calories - maintenanceCals;
      return sum + dayBalance;
    }
    return sum;
  }, 0);

  const balanceColor = accumulatedBalance > 0 ? 'text-rose-500' : (accumulatedBalance < 0 ? 'text-emerald-500' : 'text-zinc-900');

  // Determine max value for Y-axis to ensure ReferenceLine shows up
  const maxCalories = Math.max(goals.calories, ...weekDays.map(d => d.calories));

  // Process Weight Logs for chart
  // Group by day, taking the latest weight for each day
  const groupedWeightLogs = weightLogs.reduce((acc, log) => {
    const dateKey = format(new Date(log.timestamp), 'MMM d');
    // since we reduce, we can overwrite with the newest if we sort first
    acc[dateKey] = log;
    return acc;
  }, {} as Record<string, typeof weightLogs[0]>);

  const sortedGroupedLogs = Object.values(groupedWeightLogs).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const chartWeightLogs = sortedGroupedLogs.map(log => ({
    ...log,
    formattedDate: format(new Date(log.timestamp), 'MMM d'),
  }));

  const sortedAllLogsForList = [...weightLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleLogWeight = async () => {
    if (!weightInput) return;
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: Number(weightInput) })
      });
      if (res.ok) {
        const savedLog = await res.json();
        addWeightLog(savedLog);
        setWeightInput('');
        setShowWeightInput(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    if (!window.confirm("Delete this weight log?")) return;
    try {
      const res = await fetch(`/api/weight/${id}`, { method: 'DELETE' });
      if (res.ok) {
        deleteWeightLog(id);
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-24 px-4 pt-6 max-w-2xl mx-auto w-full font-sans text-zinc-900">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Trends</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Weekly Snapshot</p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <button 
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-2 bg-white border border-zinc-100 shadow-sm rounded-full text-zinc-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold w-20 text-center text-zinc-400 uppercase tracking-widest">
            {weekOffset === 0 ? 'This Wk' : weekOffset === 1 ? 'Last Wk' : `${weekOffset} Wks Ago`}
          </span>
          <button 
            onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="p-2 bg-white border border-zinc-100 shadow-sm rounded-full text-zinc-600 hover:text-indigo-600 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Average Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 flex justify-between items-center">
         <div>
           <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Weekly Accum. Balance</p>
           <p className={`text-4xl font-black ${balanceColor}`}>
             {accumulatedBalance > 0 ? '+' : ''}{Math.round(accumulatedBalance)} <span className="text-xl font-bold text-zinc-400">kcal</span>
           </p>
         </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 h-96">
        <h3 className="font-bold text-lg text-zinc-900 mb-8">Calories</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={weekDays}>
            <YAxis hide domain={[0, maxCalories >= 100 ? maxCalories * 1.1 : 2500]} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#71717A', fontWeight: 'bold' }}
              dy={15}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-zinc-900 text-white text-xs py-2 px-3 rounded-xl shadow-lg font-bold">
                      <p className="mb-1 text-zinc-400">{payload[0].payload.fullDate}</p>
                      <p className="text-sm">{payload[0].value} kcal</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={goals.calories} stroke="#A1A1AA" strokeDasharray="3 3" />
            <Bar dataKey="calories" radius={[6, 6, 6, 6]}>
              {weekDays.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isToday ? '#6366F1' : (entry.calories > goals.calories ? '#F43F5E' : '#E4E4E7')} 
                  opacity={entry.isToday ? 1 : (entry.calories > goals.calories ? 0.8 : 1)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weight Chart */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8">
          <h3 className="font-bold text-lg text-zinc-900">Body Weight (kg)</h3>
          {!showWeightInput && (
            <button 
              onClick={() => setShowWeightInput(true)}
              className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" /> Log
            </button>
          )}
        </div>

        {showWeightInput && (
          <div className="w-full flex gap-2 mb-8 bg-zinc-50 p-2 rounded-2xl">
            <input 
              type="number" 
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="e.g. 70.5" 
              className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-300 font-bold"
            />
            <button 
              onClick={handleLogWeight}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
            >
              Save
            </button>
            <button 
              onClick={() => setShowWeightInput(false)}
              className="text-zinc-400 hover:text-zinc-600 p-2"
            >
              Cancel
            </button>
          </div>
        )}

        {chartWeightLogs.length > 0 ? (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartWeightLogs} margin={{ left: 0, right: 10, bottom: 20, top: 10 }}>
                <YAxis width={35} domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#A1A1AA', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{stroke: '#E0E7FF', strokeWidth: 2}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 text-white text-xs py-2 px-3 rounded-xl shadow-lg font-bold">
                          <p className="mb-1 text-zinc-400">{payload[0].payload.formattedDate}</p>
                          <p className="text-sm">{payload[0].value} kg</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="weight" stroke="#6366F1" strokeWidth={4} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            
            {/* List history underneath chart */}
            <div className="mt-4 flex flex-col gap-2 max-h-40 overflow-y-auto">
              {sortedAllLogsForList.map(log => (
                 <div key={log.id} className="flex justify-between items-center bg-zinc-50 rounded-xl px-4 py-2">
                   <div className="flex flex-col">
                     <span className="font-bold text-sm text-zinc-900">{log.weight} kg</span>
                     <span className="text-xs text-zinc-400">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                   </div>
                   <button onClick={() => handleDeleteWeight(log.id)} className="text-zinc-300 hover:text-rose-500 p-1">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
             <p className="text-sm font-bold text-zinc-400 mb-2">No weight data yet.</p>
             <p className="text-xs text-zinc-500">Log your weight to see trends.</p>
          </div>
        )}
      </div>
      
      <p className="text-xs text-center text-zinc-400 font-bold px-8">
         Showing daily totals. Indigo is today. Red indicates exceeding your {goals.calories} kcal goal. Gray is normal log.
      </p>
    </div>
  );
}
