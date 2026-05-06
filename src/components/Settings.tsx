import { useAppStore } from '../lib/store';
import { Target, UserRound, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const { goals, setGoals, logs, profile, setProfile } = useAppStore();
  const [isCalculating, setIsCalculating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

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

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setProfile({
      age: Number(formData.get('age')),
      gender: formData.get('gender') as 'male' | 'female',
      height: Number(formData.get('height')),
      weight: Number(formData.get('weight')),
      activityLevel: Number(formData.get('activityLevel')),
      targetPace: formData.get('targetPace') as string,
      dietPreference: formData.get('dietPreference') as string,
      activityNotes: formData.get('activityNotes') as string,
    });
    alert('Profile saved!');
  };

  const generateAIGoals = async () => {
    setIsCalculating(true);
    setAiExplanation('');
    try {
      const res = await fetch('/api/calculate-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (data.calories) {
        setGoals({
          calories: Math.round(data.calories),
          protein: Math.round(data.protein),
          carbs: Math.round(data.carbs),
          fat: Math.round(data.fat),
        });
        setAiExplanation(data.explanation || 'Goals calculated successfully!');
      } else {
        alert('Could not determine goals from AI response.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to calculate goals via AI');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 pb-24 px-4 pt-6 max-w-2xl mx-auto w-full font-sans text-zinc-900">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
      </header>

      {/* Profile Config */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100">
        <div className="flex items-center space-x-3 mb-6">
          <UserRound className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-bold text-zinc-900">Personal Profile</h2>
        </div>
        
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Age</label>
               <input name="age" type="number" defaultValue={profile.age} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Gender</label>
               <select name="gender" defaultValue={profile.gender} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900">
                 <option value="male">Male</option>
                 <option value="female">Female</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Height (cm)</label>
               <input name="height" type="number" defaultValue={profile.height} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Weight (kg)</label>
               <input name="weight" type="number" defaultValue={profile.weight} step="0.1" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900" />
             </div>
             <div className="col-span-2">
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Activity Level</label>
               <select name="activityLevel" defaultValue={profile.activityLevel} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900">
                 <option value="1.2">Sedentary (Office job, little to no exercise)</option>
                 <option value="1.375">Lightly Active (Light exercise 1-3 days/wk)</option>
                 <option value="1.55">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                 <option value="1.725">Very Active (Heavy exercise 6-7 days/wk)</option>
               </select>
             </div>
             
             <div className="col-span-2 mt-2">
               <h3 className="text-sm font-bold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">Target & Habits</h3>
             </div>

             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pace</label>
               <select name="targetPace" defaultValue={profile.targetPace || 'maintain'} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900">
                 <option value="lose_1.0">Lose 1.0 kg / week (Aggressive)</option>
                 <option value="lose_0.5">Lose 0.5 kg / week</option>
                 <option value="lose_0.25">Lose 0.25 kg / week</option>
                 <option value="maintain">Maintain Weight</option>
                 <option value="gain_0.25">Gain 0.25 kg / week (Lean Bulk)</option>
                 <option value="gain_0.5">Gain 0.5 kg / week</option>
               </select>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Diet Type</label>
               <select name="dietPreference" defaultValue={profile.dietPreference || 'balanced'} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900">
                 <option value="balanced">Balanced</option>
                 <option value="high_protein">High Protein</option>
                 <option value="low_carb">Low Carb</option>
                 <option value="keto">Ketogenic</option>
               </select>
             </div>
             <div className="col-span-2">
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Exercise Routine / Notes (Optional)</label>
               <textarea name="activityNotes" defaultValue={profile.activityNotes || ''} placeholder="e.g. I run 5k three times a week and lift weights twice a week." className="w-full min-h-[80px] bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 resize-none" />
             </div>
          </div>
          
          <div className="flex flex-col mt-6 pt-4 border-t border-zinc-100">
            <button type="submit" className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-3 rounded-xl font-bold text-sm transition-colors">
              Save Profile First
            </button>
            <button type="button" onClick={generateAIGoals} disabled={isCalculating} className="mt-3 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-colors">
              {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isCalculating ? 'Calculating optimal macros...' : 'Calculate Goals with Gemini'}
            </button>
            {aiExplanation && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800 border border-indigo-100">
                <p className="font-medium">{aiExplanation}</p>
                <p className="text-xs text-indigo-500 mt-2">Daily Goals overridden below.</p>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Goal Config */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-bold text-zinc-900">Daily Goals Override</h2>
        </div>
        <form onSubmit={handleSaveGoals} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Calories</label>
               <input name="calories" type="number" key={goals.calories} defaultValue={goals.calories} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Protein (g)</label>
               <input name="protein" type="number" key={goals.protein} defaultValue={goals.protein} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Carbs (g)</label>
               <input name="carbs" type="number" key={goals.carbs} defaultValue={goals.carbs} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Fat (g)</label>
               <input name="fat" type="number" key={goals.fat} defaultValue={goals.fat} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-zinc-900" />
             </div>
           </div>
           <button type="submit" className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold text-sm mt-4 hover:bg-zinc-800 transition-colors">
             Save Custom Goals
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
