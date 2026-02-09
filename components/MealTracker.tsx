import React, { useState, useRef, useEffect } from 'react';
import { MealLog, UserProfile, MealCategory, DietGoal, Gender, JobActivity } from '../types';
import { analyzeMeal } from '../services/geminiService';
import { 
  Camera, Plus, Loader2, Sun, Sunrise, Moon, Coffee, 
  Utensils, Trash2, Edit2, Save, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight
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
      }
      return;
    }

    if (!description && !previewImage) return;
    setIsAnalyzing(true);
    try {
      const base64Image = previewImage ? previewImage.split(',')[1] : undefined;
      const analysis = await analyzeMeal(description || "食事", base64Image);
      
      onAddLog({
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
      });
      setViewDate(targetDate);
      setDescription('');
      setPreviewImage(null);
    } catch (error) {
      alert("解析に失敗しました");
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
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 p-5 sticky top-0 z-30 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
          <Utensils size={24} className="text-teal-600" />
          食事管理
        </h2>
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
          {(['朝食', '昼食', '夕食', '間食'] as MealCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-6 pb-32">
        <div ref={formRef} className={`bg-white p-6 rounded-[32px] shadow-xl border-2 transition-all ${editingLogId ? 'border-teal-200' : 'border-slate-100'}`}>
          <div className="space-y-4 mb-4">
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold border-none outline-none" />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="何を食べましたか？"
              className="w-full bg-transparent border-none text-lg min-h-[60px] font-medium outline-none"
            />
          </div>
          
          {editingLogId && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center"><label className="text-[8px] font-bold text-slate-400">kcal</label><input type="number" value={editCalories} onChange={e => setEditCalories(Number(e.target.value))} className="w-full bg-slate-50 p-1 text-xs font-bold rounded" /></div>
              <div className="text-center"><label className="text-[8px] font-bold text-rose-500 font-black">P</label><input type="number" value={editP} onChange={e => setEditP(Number(e.target.value))} className="w-full bg-slate-50 p-1 text-xs font-bold rounded" /></div>
              <div className="text-center"><label className="text-[8px] font-bold text-amber-500 font-black">F</label><input type="number" value={editF} onChange={e => setEditF(Number(e.target.value))} className="w-full bg-slate-50 p-1 text-xs font-bold rounded" /></div>
              <div className="text-center"><label className="text-[8px] font-bold text-emerald-500 font-black">C</label><input type="number" value={editC} onChange={e => setEditC(Number(e.target.value))} className="w-full bg-slate-50 p-1 text-xs font-bold rounded" /></div>
            </div>
          )}

          <div className="flex gap-2">
             <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 p-4 rounded-2xl border border-slate-200"><Camera size={24} /></button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onloadend = () => setPreviewImage(reader.result as string);
                 reader.readAsDataURL(file);
               }
             }} />
             <button onClick={handleSubmit} disabled={isAnalyzing} className="flex-1 bg-teal-600 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2">
               {isAnalyzing ? <Loader2 className="animate-spin" /> : <Plus />}
               {editingLogId ? '修正を保存' : '記録する'}
             </button>
             {editingLogId && <button onClick={() => { setEditingLogId(null); setDescription(''); setPreviewImage(null); }} className="bg-slate-100 p-4 rounded-2xl"><X /></button>}
          </div>
        </div>

        {filteredMeals.length > 0 && (
          <div className="bg-slate-900 rounded-[32px] p-6 text-white space-y-4 shadow-2xl">
             <div className="h-4 w-full bg-white/10 rounded-full flex overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${(totalNutrition.protein / (totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs || 1)) * 100}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${(totalNutrition.fat / (totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs || 1)) * 100}%` }} />
                <div className="h-full bg-emerald-500" style={{ width: `${(totalNutrition.carbs / (totalNutrition.protein + totalNutrition.fat + totalNutrition.carbs || 1)) * 100}%` }} />
             </div>
             <div className="flex justify-around text-[10px] font-black">
                <span className="text-rose-400">P(赤): {totalNutrition.protein}g</span>
                <span className="text-amber-400">F(黄): {totalNutrition.fat}g</span>
                <span className="text-emerald-400">C(緑): {totalNutrition.carbs}g</span>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2">
           <button onClick={() => {
             const d = new Date(viewDate);
             d.setDate(d.getDate() - 1);
             setViewDate(d.toISOString().split('T')[0]);
           }} className="p-2 text-slate-400"><ChevronLeft size={20} /></button>
           <div className="text-sm font-black text-slate-700">{viewDate === todayStr ? '今日の履歴' : viewDate}</div>
           <button onClick={() => {
             const d = new Date(viewDate);
             d.setDate(d.getDate() + 1);
             setViewDate(d.toISOString().split('T')[0]);
           }} className="p-2 text-slate-400"><ChevronRight size={20} /></button>
        </div>

        <div className="space-y-3">
          {filteredMeals.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl overflow-hidden">
                {log.imageUrl ? <img src={log.imageUrl} className="w-full h-full object-cover" /> : '🍽️'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm">{log.description}</h4>
                <div className="flex gap-2 text-[10px] font-black">
                  <span className="text-teal-600">{log.calories}kcal</span>
                  <span className="text-rose-500">P:{log.protein}</span>
                  <span className="text-amber-500">F:{log.fat}</span>
                  <span className="text-emerald-500">C:{log.carbs}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEditClick(log)} className="text-slate-300 hover:text-teal-500 p-1"><Edit2 size={16} /></button>
                <button onClick={() => onDeleteLog(log.id)} className="text-slate-200 hover:text-rose-400 p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MealTracker;
