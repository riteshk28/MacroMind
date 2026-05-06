import { useAppStore } from '../lib/store';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Trends() {
  const { logs, goals } = useAppStore();

  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dayLogs = logs.filter(l => isSameDay(new Date(l.timestamp), date));
    const cals = dayLogs.reduce((sum, l) => sum + l.totalCalories, 0);
    
    return {
      name: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      calories: Math.round(cals),
      isToday: i === 6
    };
  });

  const averageCals = last7Days.reduce((sum, day) => sum + day.calories, 0) / 7;

  return (
    <div className="flex flex-col space-y-6 pb-24 px-4 pt-6 max-w-2xl mx-auto w-full font-sans text-zinc-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Trends</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">Last 7 Days</p>
      </header>

      {/* Average Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 flex justify-between items-center">
         <div>
           <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Weekly Average</p>
           <p className="text-4xl font-black text-zinc-900">{Math.round(averageCals)} <span className="text-xl font-bold text-zinc-400">kcal</span></p>
         </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 h-96">
        <h3 className="font-bold text-lg text-zinc-900 mb-8">Calories</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={last7Days}>
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
            <Bar dataKey="calories" radius={[6, 6, 6, 6]}>
              {last7Days.map((entry, index) => (
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
      
      <p className="text-xs text-center text-zinc-400 font-bold px-8">
         Showing daily totals. Indigo is today. Red indicates exceeding your {goals.calories} kcal goal. Gray is normal log.
      </p>
    </div>
  );
}
