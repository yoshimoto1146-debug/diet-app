import React, { useState, useRef, useEffect } from 'react';
import { MealLog, UserProfile, Gender, JobActivity, MealCategory } from '../types';
import { analyzeMeal, evaluateDailyDiet } from '../services/geminiService';
import { Camera, Plus, Loader2, Info, ChevronRight, Calculator, Award, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface MealTrackerProps {
  logs: MealLog[];
  onAddLog: (log: MealLog) => void;
  user: UserProfile;
}

const MealTracker: React.FC<MealTrackerProps> = ({ logs, onAddLog, user }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('昼食');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [dailyScore, setDailyScore] = useState<{ score: number; comment: string } | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = logs.filter(m => m.date === today);

  const calculateTargets = () => {
    let baseBMR = user.gender === Gender.MALE 
      ? (10 * user.targetWeightKg) + (6.25 * user.heightCm) - (5 * user.age) + 5
      : (10 * user.targetWeightKg) + (6.25 * user.heightCm) - (5 * user.age) - 161;
    
    const activityMult = user.jobActivity === JobActivity.HEAVY ? 1.7 : user.jobActivity === JobActivity.WALK ? 1.5 : 1.2;
    const targetCal = Math.round(baseBMR * activityMult);
    
    return {
      calories: targetCal,
      protein: Math.round(user.targetWeightKg * 1.5),
      fat: Math.round(targetCal * 0.25 / 9),
      carbs: Math.round(targetCal * 0.5 / 4),
    };
  };

  const targets = calculateTargets();
  const actuals = {
    calories: todaysMeals.reduce((s, m) => s + m.calories, 0),
    protein: todaysMeals.reduce((s, m) => s + m.protein, 0),
    fat: todaysMeals.reduce((s, m) => s + m.fat, 0),
    carbs: todaysMeals.reduce((s, m) => s + m.carbs, 0),
  };

  useEffect(() => {
    if (showSummary && todaysMeals.length > 0) {
      const fetchScore = async () => {
        setLoadingScore(true);
        const result = await evaluateDailyDiet(todaysMeals, user, targets);
        setDailyScore(result);
        setLoadingScore(false);
      };
      fetchScore();
    }
  }, [showSummary, todaysMeals.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!description && !previewImage) return;
    setIsAnalyzing(true);
    try {
      const base64Image = previewImage ? previewImage.split(',')[1] : undefined;
      const analysis = await analyzeMeal(description || "食事", base64Image);
      
      const newLog: MealLog = {
        id: Date.now().toString(),
        date: today,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        category: selectedCategory,
        description: analysis.description || description || `${selectedCategory}`,
        imageUrl: previewImage || undefined,
        calories: analysis.calories || 0,
        protein: analysis.protein || 0,
        fat: analysis.fat || 0,
        carbs: analysis.carbs || 0,
        aiAnalysis: analysis.aiAnalysis
      };
      
      onAddLog(newLog);
      setDescription('');
      setPreviewImage(null);
    } catch (error) {
      alert("AI解析中に問題が発生しました。再度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderProgress = (label: string, actual: number, target: number, unit: string) => {
    const percent = Math.min((actual / target) * 100, 100);
    const diff = actual - target;
    const isOver = diff > (target * 0.1);
    const isUnder = actual < (target * 0.8);

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="text-xs font-bold text-slate-700">{actual} / {target}{unit}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : isUnder ? 'bg-sky-400' : 'bg-teal-500'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const categories: MealCategory[] = ['朝食', '昼食', '夕食', '間食'];

  return (
    <div className="p-4 flex flex-col h-full bg-slate-50">
      <h2 className="text-xl font-bold text-slate-800 mb-4">食事管理</h2>
      
      {/* カテゴリ選択 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`py-2 text-xs font-bold rounded-xl border transition-all ${
              selectedCategory === cat 
                ? 'bg-teal-600 border-teal-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 入力エリア */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6 transition-all focus-within:ring-2 focus-within:ring-teal-500/20">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`${selectedCategory}の内容を入力...`}
          className="w-full p-2 bg-transparent border-none focus:ring-0 text-slate-700 resize-none mb-3 text-sm min-h-[60px]"
        />
        
        {previewImage && (
           <div className="relative mb-3 h-48 w-full rounded-2xl overflow-hidden shadow-inner">
             <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
             <button onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 backdrop-blur-md">
               <Plus className="rotate-45" size={16} />
             </button>
           </div>
        )}

        <div className="flex gap-2">
           <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 text-slate-600 p-3.5 rounded-2xl hover:bg-slate-200 transition-colors">
             <Camera size={20} />
           </button>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

           <button 
             onClick={handleSubmit}
             disabled={isAnalyzing || (!description && !previewImage)}
             className="flex-1 bg-teal-600 text-white font-bold rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/10 active:scale-95 disabled:opacity-50"
           >
             {isAnalyzing ? (
               <>
                 <Loader2 className="animate-spin" size={20} />
                 <span>高速解析中 (10秒以内)...</span>
               </>
             ) : (
               <>
                 <Plus size={20} />
                 <span>記録する</span>
               </>
             )}
           </button>
        </div>
      </div>

      {/* 合計ボタン */}
      {todaysMeals.length > 0 && (
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className={`w-full mb-6 p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${showSummary ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-800 shadow-sm'}`}
        >
          <div className="flex items-center gap-3">
             <Calculator size={20} />
             <div className="text-left">
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">今日の合計</p>
               <p className="text-sm font-bold">{actuals.calories} kcal</p>
             </div>
          </div>
          <ChevronRight className={`transition-transform duration-300 ${showSummary ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* 合計詳細表示 */}
      {showSummary && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
               <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-50" strokeWidth="6" stroke="currentColor" fill="transparent" r="24" cx="32" cy="32" />
                    <circle className="text-indigo-500" strokeWidth="6" strokeDasharray={150} strokeDashoffset={150 - (150 * (dailyScore?.score || 0)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="24" cx="32" cy="32" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800 leading-none">{loadingScore ? ".." : dailyScore?.score}</span>
                  </div>
               </div>
               <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                    <Award size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">AI評価</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                    {loadingScore ? "解析中..." : `「${dailyScore?.comment || "記録を始めましょう！"}」`}
                  </p>
               </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-50">
               {renderProgress("エネルギー", actuals.calories, targets.calories, "kcal")}
               <div className="grid grid-cols-3 gap-2">
                 {renderProgress("P", actuals.protein, targets.protein, "g")}
                 {renderProgress("F", actuals.fat, targets.fat, "g")}
                 {renderProgress("C", actuals.carbs, targets.carbs, "g")}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 履歴一覧（時間帯別にソート） */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-24">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
           <TrendingUp size={12} /> 今日の記録
        </h3>
        {todaysMeals.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
             <Calculator size={40} className="mx-auto mb-2 opacity-10" />
             <p className="text-sm">食事を記録して分析を始めましょう</p>
          </div>
        ) : (
          [...todaysMeals].sort((a, b) => {
             const order = { '朝食': 1, '昼食': 2, '夕食': 3, '間食': 4 };
             return order[a.category] - order[b.category];
          }).map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
              {log.imageUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-50">
                  <img src={log.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {log.category === '朝食' ? '☀️' : log.category === '昼食' ? '🕛' : log.category === '夕食' ? '🌙' : '☕'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                   <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                        log.category === '朝食' ? 'bg-amber-100 text-amber-600' :
                        log.category === '昼食' ? 'bg-sky-100 text-sky-600' :
                        log.category === '夕食' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {log.category}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm truncate">{log.description}</h4>
                   </div>
                   <span className="text-[9px] font-bold text-slate-300 flex items-center gap-1 whitespace-nowrap ml-1">
                      <Clock size={8} /> {log.time}
                   </span>
                </div>
                <div className="flex gap-3 mb-1.5">
                   <span className="text-[10px] font-black text-teal-600 uppercase tracking-tighter">{log.calories} kcal</span>
                   <div className="flex gap-2 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                      <span>P:{log.protein}g</span>
                      <span>F:{log.fat}g</span>
                      <span>C:{log.carbs}g</span>
                   </div>
                </div>
                {log.aiAnalysis && (
                  <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 border border-slate-100/50 leading-relaxed italic">
                    {log.aiAnalysis}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MealTracker;
