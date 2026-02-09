import React, { useState, useRef, useEffect } from 'react';
import { MealLog, UserProfile, MealCategory, DietGoal, Gender, JobActivity } from '../types';
import { analyzeMeal } from '../services/geminiService';
import { 
  Camera, Plus, Loader2, TrendingUp, Sun, Sunrise, Moon, Coffee, 
  Utensils, Trash2, Edit2, Save, X, PieChart, Calendar as CalendarIcon, ChevronLeft, ChevronRight
} from 'lucide-react';

interface MealTrackerProps {
  logs: MealLog[];
  onAddLog: (log: MealLog) => void;
  onUpdateLog: (log: MealLog) => void;
  onDeleteLog: (id: string) => void;
  user: UserProfile;
}

const MealTracker: React.FC<MealTrackerProps> = ({ logs, onAddLog, onUpdateLog, onDeleteLog, user }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('昼食');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(todayStr);
  
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editP, setEditP] = useState<number>(0);
  const [editF, setEditF] = useState<number>(0);
  const [editC, setEditC] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const filteredMeals = logs.filter(m => m.date === viewDate);

  const totalNutrition = filteredMeals.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    fat: acc.fat + curr.fat,
    carbs: acc.carbs + curr.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

  const calculateTargets = () => {
    if (user.goal === DietGoal.OTHER && user.customTargets) return user.customTargets;
    let baseBMR = user.gender === Gender.MALE 
      ? (10 * (user.targetWeightKg || 60)) + (6.25 * (user.heightCm || 170)) - (5 * (user.age || 30)) + 5
      : (10 * (user.targetWeightKg || 50)) + (6.25 * (user.heightCm || 160)) - (5 * (user.age || 30)) - 161;
    const activityMult = user.jobActivity === JobActivity.HEAVY ? 1.7 : user.jobActivity === JobActivity.WALK ? 1.5 : 1.2;
    let targetCal = Math.round(baseBMR * activityMult);
    if (user.goal === DietGoal.POSTPARTUM_NURSING) targetCal += 350;
    return {
      calories: targetCal,
      protein: Math.round((user.targetWeightKg || 60) * 1.5),
      fat: Math.round(targetCal * 0.25 / 9),
      carbs: Math.round(targetCal * 0.5 / 4),
    };
  };
  const targets = calculateTargets();

  useEffect(() => {
    window.scrollTo(0, 0);
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setSelectedCategory('朝食');
    else if (hour >= 11 && hour < 16) setSelectedCategory('昼食');
    else if (hour >= 16 && hour < 23) setSelectedCategory('夕食');
    else setSelectedCategory('間食');
  }, []);

  const handleSubmit = async () => {
    if (editingLogId) {
      const original = logs.find(l => l.id === editingLogId);
      if (original) {
        onUpdateLog({
          ...original,
          date: targetDate,
          description,
          calories: editCalories,
          protein: editP,
          fat: editF,
          carbs: editC,
          category: selectedCategory
        });
        setEditingLogId(null);
        setDescription('');
        setPreviewImage(null);
        alert("更新しました");
      }
      return;
    }

    if (!description && !previewImage) return;
    setIsAnalyzing(true);
    try {
      const base64Image = previewImage ? previewImage.split(',')[1] : undefined;
      const analysis = await analyzeMeal(description || "食事", base64Image);
      
      const newLog: MealLog = {
        id: Date.now().toString(),
        date: targetDate,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        category: selectedCategory,
        description: description || `${selectedCategory}の記録`,
        imageUrl: previewImage || undefined,
        calories: analysis.calories || 0,
        protein: analysis.protein || 0,
        fat: analysis.fat || 0,
        carbs: analysis.carbs || 0,
        aiAnalysis: analysis.aiAnalysis
      };
      
      onAddLog(newLog);
      setViewDate(targetDate);
      setDescription('');
      setPreviewImage(null);
    } catch (error) {
      alert("解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditClick = (log: MealLog) => {
    setEditingLogId(log.id);
    setTargetDate(log.date);
    setDescription(log.description);
    setSelectedCategory(log.category);
    setEditCalories(log.calories);
    setEditP(log.protein);
    setEditF(log.fat);
    setEditC(log.carbs);
    setPreviewImage(log.imageUrl || null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingLogId(null);
    setDescription('');
    setPreviewImage(null);
    setTargetDate(todayStr);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const changeViewDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const categories: {name: MealCategory, icon: any}[] = [
    { name: '朝食', icon: Sunrise },
    { name: '昼食', icon: Sun },
    { name: '夕食', icon: Moon },
    { name: '間食', icon: Coffee }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 p-5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Utensils size={24} className="text-teal-600" />
            {editingLogId ? '記録を修正' : '食事管理'}
          </h2>
          {editingLogId && (
            <button onClick={cancelEdit} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
          )}
        </div>
        
        <div className="flex p-1.5 bg-slate-100 rounded-[24px] gap-1 shadow-inner">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-2xl transition-all duration-300 ${
                  isSelected ? 'bg-white text-teal-600 shadow-md font-black scale-[1.02]' : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
              >
                <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
                <span className="text-[10px] mt-1.5">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-6 pb-32">
        <div ref={formRef} className={`bg-white p-6 rounded-[40px] shadow-xl border-2 transition-all ${editingLogId ? 'border-indigo-200' : 'border-slate-100 shadow-slate-200/40'}`}>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <CalendarIcon size={12} /> 日付指定
                </label>
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-start">
               <textarea
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder={`${selectedCategory}に何を食べましたか？`}
                 className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 resize-none text-xl min-h-[80px] font-medium placeholder:text-slate-300"
               />
               {editingLogId && (
                 <button onClick={() => onDeleteLog(editingLogId)} className="text-rose-400 p-2 active:scale-90"><Trash2 size={20} /></button>
               )}
            </div>
          </div>
          
          {editingLogId && (
            <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-slate-50 rounded-2xl">
              <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">kcal</label><input type="number" value={editCalories} onChange={e => setEditCalories(Number(e.target.value))} className="w-full bg-white rounded-lg p-2 text-xs font-black text-teal-600 outline-none" /></div>
              <div className="space-y-1"><label className="text-[8px] font-black text-rose-500 uppercase">P (g)</label><input type="number" value={editP} onChange={e => setEditP(Number(e.target.value))} className="w-full bg-white rounded-lg p-2 text-xs font-black outline-none" /></div>
              <div className="space-y-1"><label className="text-[8px] font-black text-amber-500 uppercase">F (g)</label><input type="number" value={editF} onChange={e => setEditF(Number(e.target.value))} className="w-full bg-white rounded-lg p-2 text-xs font-black outline-none" /></div>
              <div className="space-y-1"><label className="text-[8px] font-black text-emerald-500 uppercase">C (g)</label><input type="number" value={editC} onChange={e => setEditC(Number(e.target.value))} className="w-full bg-white rounded-lg p-2 text-xs font-black outline-none" /></div>
            </div>
          )}

          {previewImage && (
             <div className="relative mb-5 h-48 w-full rounded-[24px] overflow-hidden shadow-lg border-2 border-white ring-1 ring-slate-100">
               <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
               <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 backdrop-blur-xl transition-all"><Plus className="rotate-45" size={16} /></button>
             </div>
          )}

          <div className="flex gap-3">
             {!editingLogId && (
               <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 text-slate-600 p-4 rounded-[20px] border border-slate-200 active:scale-90 transition-all"><Camera size={24} /></button>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

             <button 
               onClick={handleSubmit}
               disabled={isAnalyzing || (!description && !previewImage)}
               className={`flex-1 font-black rounded-[20px] py-4 flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-95 disabled:opacity-30 ${editingLogId ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-teal-600 text-white shadow-teal-600/20'}`}
             >
               {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : (editingLogId ? <Save size={20} /> : <Plus size={20} />)}
               <span className="text-sm tracking-wide">{editingLogId ? '修正を保存' : '記録する'}</span>
             </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
           <button onClick={() => changeViewDate(-1)} className="p-2 text-slate-400 hover:text-slate-600"><ChevronLeft size={20} /></button>
           <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-700">{viewDate === todayStr ? '今日' : viewDate}</span>
              <CalendarIcon size={14} className="text-slate-300" />
           </div>
           <button onClick={() => changeViewDate(1)} className="p-2 text-slate-400 hover:text-slate-600"><ChevronRight size={20} /></button>
        </div>

        {filteredMeals.length > 0 && (
          <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><PieChart size={100} /></div>
             <div className="relative z-10 flex justify-between items-end">
                <div>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{viewDate === todayStr ? '本日' : 'この日'}の総摂取</p>
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{totalNutrition.calories}</span>
                      <span className="text-sm opacity-40 font-bold uppercase tracking-widest">/ {targets.calories} kcal</span>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`text-xs font-black ${totalNutrition.calories <= targets.calories ? 'text-teal-400' : 'text-rose-400'}`}>
                      {totalNutrition.calories <= targets.calories ? 'OK' : 'OVER'}
                   </div>
                </div>
             </div>

             <div className="space-y-4 pt-2 relative z-10">
                <div className="space-y-1.5">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                      <span>PFC分布（赤:P / 黄:F / 緑:C）</span>
                      <span>合計: {totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs}g</span>
                   </div>
                   <div className="h-4 w-full bg-white/10 rounded-full flex overflow-hidden ring-1 ring-white/5">
                      <div className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" style={{ width: `${(totalNutrition.protein / (totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs || 1)) * 100}%` }} />
                      <div className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" style={{ width: `${(totalNutrition.fat / (totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs || 1)) * 100}%` }} />
                      <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${(totalNutrition.carbs / (totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs || 1)) * 100}%` }} />
                   </div>
                   <div className="flex justify-between gap-1 pt-2">
                      <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                         <div className="w-2 h-2 rounded-full bg-rose-500 mb-1" />
                         <span className="text-[10px] font-black tracking-tighter">P:{totalNutrition.protein}g</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                         <div className="w-2 h-2 rounded-full bg-amber-400 mb-1" />
                         <span className="text-[10px] font-black tracking-tighter">F:{totalNutrition.fat}g</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1" />
                         <span className="text-[10px] font-black tracking-tighter">C:{totalNutrition.carbs}g</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-300" /> {viewDate === todayStr ? '本日' : viewDate}の履歴
          </h3>
          
          <div className="space-y-3">
            {filteredMeals.length === 0 ? (
              <div className="py-20 text-center bg-white/50 rounded-[40px] border-2 border-dashed border-slate-200">
                 <Utensils size={40} className="mx-auto text-slate-200 mb-3" />
                 <p className="text-xs font-bold text-slate-400">この日の記録はありません</p>
              </div>
            ) : (
              [...filteredMeals].sort((a, b) => {
                 const order = { '朝食': 1, '昼食': 2, '夕食': 3, '間食': 4 };
                 return order[a.category] - order[b.category];
              }).map((log) => (
                <button 
                  key={log.id} 
                  onClick={() => handleEditClick(log)}
                  className={`w-full bg-white p-5 rounded-[32px] shadow-sm border flex gap-5 items-center group transition-all text-left ${editingLogId === log.id ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-md scale-[1.02]' : 'border-slate-100 hover:shadow-md'}`}
                >
                  <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl flex-shrink-0 border transition-transform ${
                    log.category === '朝食' ? 'bg-amber-50 border-amber-100' :
                    log.category === '昼食' ? 'bg-sky-50 border-sky-100' :
                    log.category === '夕食' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    {log.imageUrl ? (
                      <img src={log.imageUrl} alt="Meal" className="w-full h-full object-cover rounded-[18px]" />
                    ) : (
                      <span>{log.category === '朝食' ? '🍳' : log.category === '昼食' ? '🍱' : log.category === '夕食' ? '🍣' : '🥞'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${editingLogId === log.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        {log.category}
                      </span>
                      <h4 className="font-black text-slate-800 text-sm truncate tracking-tight">{log.description}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-teal-600">{log.calories} <span className="text-[9px] font-bold opacity-40 uppercase">kcal</span></span>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[9px] text-rose-500 font-black">P:{log.protein}</span>
                           <span className="text-[9px] text-amber-500 font-black">F:{log.fat}</span>
                           <span className="text-[9px] text-emerald-500 font-black">C:{log.carbs}</span>
                        </div>
                      </div>
                      <Edit2 size={12} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealTracker;
