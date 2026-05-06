import { useAppStore } from '../lib/store';
import { Target, UserRound } from 'lucide-react';

export function Settings() {
  const { goals, setGoals, logs, profile, setProfile } = useAppStore();

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
      goalType: formData.get('goalType') as 'lose' | 'maintain' | 'gain',
    });
  };

  const calculateTDEE = () => {
    const { weight, height, age, gender, activityLevel, goalType } = profile;
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;
    let tdee = bmr * activityLevel;
    
    if (goalType === 'lose') tdee -= 500;
    if (goalType === 'gain') tdee += 500;

    return Math.round(tdee);
  };

  const applyCalculatedGoals = () => {
    const tdee = calculateTDEE();
    // Standard macro split: 30% protein, 40% carbs, 30% fat
    const protein = Math.round((tdee * 0.3) / 4); // 4 kcal per gram
    const carbs = Math.round((tdee * 0.4) / 4);   // 4 kcal per gram
    const fat = Math.round((tdee * 0.3) / 9);     // 9 kcal per gram

    setGoals({
      calories: tdee,
      protein,
      carbs,
      fat,
    });
    alert('Goals updated based on your profile!');
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
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Activity Level</label>
               <select name="activityLevel" defaultValue={profile.activityLevel} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900">
                 <option value="1.2">Sedentary (Office job)</option>
                 <option value="1.375">Lightly Active (1-3 days/wk)</option>
                 <option value="1.55">Moderately Active (3-5 days/wk)</option>
                 <option value="1.725">Very Active (6-7 days/wk)</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Goal</label>
               <select name="goalType" defaultValue={profile.goalType} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900">
                 <option value="lose">Lose Weight</option>
                 <option value="maintain">Maintain Weight</option>
                 <option value="gain">Gain Muscle</option>
               </select>
             </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-zinc-100">
            <div className="flex justify-between items-center text-sm font-medium">
               <span className="text-zinc-500">Estimated Target Calories:</span>
               <span className="font-bold text-indigo-600 text-lg">{calculateTDEE()} kcal</span>
            </div>
            
            <div className="flex gap-2 w-full mt-2">
              <button type="submit" className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-3 rounded-xl font-bold text-sm transition-colors">
                Save Profile
              </button>
              <button type="button" onClick={applyCalculatedGoals} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                Apply to Goals
              </button>
            </div>
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
