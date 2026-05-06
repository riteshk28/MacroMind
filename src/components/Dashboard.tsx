import { isToday, isSameDay } from 'date-fns';
import { useAppStore } from '../lib/store';
import { ProgressRing } from './ProgressRing';
import { Activity, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Dashboard() {
  const { logs, goals, deleteLog } = useAppStore();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter logs for today
  const todayLogs = logs.filter(log => isToday(new Date(log.timestamp)));

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        deleteLog(id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  };

  // Calculate totals
  const totals = todayLogs.reduce((acc, log) => {
    log.items.forEach(item => {
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.carbs += item.carbs || 0;
      acc.fat += item.fat || 0;
      acc.fiber += item.fiber || 0;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  return (
    <div className="bg-zinc-50 text-zinc-900 font-sans w-full min-h-screen p-4 md:p-8 flex flex-col pb-24">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">MacroMind AI</h1>
          <p className="text-zinc-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • Daily Nutrition Dashboard
          </p>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-6 flex-1">
        
        {/* Main Calorie Progress */}
        <div className="md:col-span-4 md:row-span-4 bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-6 left-8">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Energy</h3>
            <p className="text-2xl font-bold">Calories</p>
          </div>
          <div className="relative flex items-center justify-center mt-6">
            <ProgressRing 
              progress={(totals.calories / goals.calories) * 100} 
              size={220} 
              strokeWidth={20}
              color="text-indigo-500 hover:text-indigo-400"
              className="text-zinc-100"
            >
              <div className="text-center">
                <span className="block text-5xl font-black text-zinc-900">
                  {Math.round(totals.calories)}
                </span>
                <span className="text-zinc-400 font-bold uppercase text-xs">of {goals.calories} kcal</span>
              </div>
            </ProgressRing>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-8 w-full">
            <div className="text-center border-r border-zinc-100">
              <p className="text-zinc-400 text-xs font-bold">BURNED</p>
              <p className="text-xl font-bold">0</p>
            </div>
            <div className="text-center">
              <p className="text-zinc-400 text-xs font-bold">REMAINING</p>
              <p className="text-xl font-bold">{Math.max(goals.calories - Math.round(totals.calories), 0)}</p>
            </div>
          </div>
        </div>

        {/* Macro Nutrients */}
        <div className="md:col-span-4 md:row-span-4 bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100">
          <h3 className="font-bold text-lg mb-6">Macro Profile</h3>
          <div className="space-y-6">
            <MacroBar target={goals.protein} current={totals.protein} label="Protein" colorClass="bg-emerald-500" textClass="text-emerald-600" />
            <MacroBar target={goals.carbs} current={totals.carbs} label="Carbs" colorClass="bg-amber-500" textClass="text-amber-600" />
            <MacroBar target={goals.fat} current={totals.fat} label="Fats" colorClass="bg-rose-500" textClass="text-rose-600" />
            <MacroBar target={35} current={totals.fiber} label="Fiber" colorClass="bg-blue-500" textClass="text-blue-600" />
          </div>
        </div>

        {/* Recent AI Logs */}
        <div className="md:col-span-4 md:row-span-4 bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100 flex flex-col max-h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Recent Meals</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {todayLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-10 opacity-50">
                 <p className="text-zinc-500 font-medium">No meals logged today yet.</p>
                 <p className="text-sm text-zinc-400 italic">Tap the mic icon to start!</p>
              </div>
            ) : (
              todayLogs.map(log => (
                <div key={log.id} className="space-y-2 relative group mb-6">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={isDeleting === log.id}
                      className="text-zinc-300 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
                      title="Delete Entry"
                    >
                      {isDeleting === log.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  {log.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col p-4 bg-zinc-50 rounded-2xl w-full border border-transparent hover:border-zinc-200 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-xl mt-1 shrink-0">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1 cursor-pointer" onClick={() => setExpandedLog(expandedLog === `${log.id}-${idx}` ? null : `${log.id}-${idx}`)}>
                          <p className="text-sm text-zinc-500 mb-1 leading-snug italic">
                            {idx === 0 && log.rawText ? `"${log.rawText}"` : `Logged amount: ${item.amount}${item.unit}`}
                          </p>
                          <div className="flex justify-between mt-2">
                            <span className="font-bold text-sm text-zinc-800">{item.name} <span className="font-normal text-zinc-500">({log.mealType})</span></span>
                            <span className="font-bold text-sm text-indigo-600">{Math.round(item.calories)} kcal</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Micronutrients view */}
                      {expandedLog === `${log.id}-${idx}` && item.micronutrients && (
                        <div className="mt-3 ml-12 text-xs bg-white border border-zinc-100 p-3 rounded-xl text-zinc-600">
                          <span className="font-bold text-xs mb-2 block uppercase tracking-wider text-zinc-400">Micros & Details</span>
                          <div className="grid grid-cols-2 gap-y-1 mb-2 font-medium">
                            <span>Protein: {item.protein}g</span>
                            <span>Carbs: {item.carbs}g</span>
                            <span>Fat: {item.fat}g</span>
                            <span>Fiber: {item.fiber}g</span>
                          </div>
                          {Object.keys(item.micronutrients).length > 0 && (
                            <div className="border-t border-zinc-100 pt-2 grid grid-cols-2 gap-y-1">
                              {Object.entries(item.micronutrients).map(([k,v]) => (
                                <span key={k}>{k}: {v}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

function MacroBar({ target, current, label, colorClass, textClass }: { target: number, current: number, label: string, colorClass: string, textClass: string }) {
  const percent = Math.min((current/Math.max(target, 1)) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
        <span className={textClass}>{label}</span>
        <span>{Math.round(current)}g / {target}g</span>
      </div>
      <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`${colorClass} h-full rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  )
}
