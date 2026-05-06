import { useAppStore } from '../lib/store';
import { Target, Info } from 'lucide-react';

export function Settings() {
  const { goals, setGoals, logs } = useAppStore();

  const handleSaveGoals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setGoals({
      calories: Number(formData.get('calories')),
      protein: Number(formData.get('protein')),
      carbs: Number(formData.get('carbs')),
      fat: Number(formData.get('fat')),
    });
  };

  return (
    <div className="flex flex-col space-y-8 pb-24 px-4 pt-6 max-w-2xl mx-auto w-full font-sans text-zinc-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
      </header>

      {/* Info Notice about Backend */}
      <section className="bg-indigo-50 rounded-3xl p-6 shadow-sm border border-indigo-100 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-indigo-900">Backend Connected</h2>
          <p className="text-sm text-indigo-700 mt-1 leading-snug">
            Your Groq API and NeonDB connections are securely configured on the backend using environment variables. 
          </p>
        </div>
      </section>

      {/* Goal Config */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-bold text-zinc-900">Daily Goals</h2>
        </div>
        <form onSubmit={handleSaveGoals} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Calories</label>
               <input name="calories" type="number" defaultValue={goals.calories} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Protein (g)</label>
               <input name="protein" type="number" defaultValue={goals.protein} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Carbs (g)</label>
               <input name="carbs" type="number" defaultValue={goals.carbs} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Fat (g)</label>
               <input name="fat" type="number" defaultValue={goals.fat} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
           </div>
           <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold text-sm mt-4 hover:bg-zinc-800 transition-colors">
             Update Goals
           </button>
        </form>
      </section>
      
      {/* Dev Stats */}
      <div className="text-center">
         <p className="text-xs font-bold text-zinc-400 uppercase">Total logs recorded: {logs.length}</p>
      </div>
    </div>
  );
}
