
import React, { useState, useRef, useEffect } from 'react';
import { MealLog, UserProfile, Gender, JobActivity, MealCategory } from '../types';
import { analyzeMeal, evaluateDailyDiet } from '../services/geminiService';
// Added Utensils to the imports
import { Camera, Plus, Loader2, Info, ChevronRight, Calculator, Award, TrendingUp, Clock, Sun, Sunrise, Moon, Coffee, CheckCircle2, Utensils } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = logs.filter(m => m.date === today);

  // 初回表示時に最上部へスクロールし、時間からカテゴリを推測
  useEffect(() => {
    window.scrollTo(0, 0);
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setSelectedCategory('朝食');
    else if (hour >= 11 && hour < 16) setSelectedCategory('昼食');
    else if (hour >= 16 && hour < 23) setSelectedCategory('夕食');
    else setSelectedCategory('間食');
  }, []);

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
        description: description || `${selectedCategory}の記録`,
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
      console.error(error);
      const fallbackLog: MealLog = {
        id: Date.now().toString(),
        date: today,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        category: selectedCategory,
        description: description || `${selectedCategory}`,
        calories: 0, protein: 0, fat: 0, carbs: 0,
        aiAnalysis: "手動保存されました。"
      };
      onAddLog(fallbackLog);
      setDescription('');
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderProgress = (label: string, actual: number, target: number, unit: string) => {
    const percent = Math.min((actual / target) * 100, 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-end">
          <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
          <span className="text-[10px] font-bold text-slate-700">{actual}/{target}{unit}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const categories: {name: MealCategory, icon: any, color: string}[] = [
    { name: '朝食', icon: Sunrise, color: 'amber' },
    { name: '昼食', icon: Sun, color: 'sky' },
    { name: '夕食', icon: Moon, color: 'indigo' },
    { name: '間食', icon: Coffee, color: 'slate' }
  ];

  const isLogged = (cat: MealCategory) => todaysMeals.some(m => m.category === cat);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50" ref={scrollRef}>
      {/* 
         レイアウトの重なりを防ぐため、padding-top ではなく 
         個別のコンポーネントとして明確にセクション分けします。
      */}
      <div className="bg-white border-b border-slate-100 px-4 pt-4 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Utensils size={20} className="text-teal-600" />
            食事を記録
          </h2>
          <div className="flex gap-1.5">
            {categories.map(c => (
              <div key={c.name} className={`w-2 h-2 rounded-full transition-colors duration-500 ${isLogged(c.name) ? 'bg-teal-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
        
        {/* カテゴリ選択タブ: ここが「朝昼夕間」の選択エリアです */}
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all active:scale-95 ${
                  isSelected 
                    ? 'bg-white text-teal-600 shadow-sm font-black' 
                    : 'text-slate-400 font-bold'
                }`}
              >
                <Icon size={18} strokeWidth={isSelected ? 3 : 2} />
                <span className="text-[10px] mt-1">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* 入力フォーム */}
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`${selectedCategory}のメニューを入力... (例: 鶏むね肉、サラダ、おにぎり)`}
            className="w-full p-2 bg-transparent border-none focus:ring-0 text-slate-700 resize-none mb-3 text-lg min-h-[120px] font-medium placeholder:text-slate-300"
          />
          
          {previewImage && (
             <div className="relative mb-4 h-64 w-full rounded-3xl overflow-hidden shadow-inner border border-slate-100">
               <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
               <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 backdrop-blur-md">
                 <Plus className="rotate-45" size={24} />
               </button>
             </div>
          )}

          <div className="flex gap-3">
             <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 text-slate-600 p-4 rounded-2xl hover:bg-slate-100 border border-slate-100 active:scale-90 transition-all">
               <Camera size={24} />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

             <button 
               onClick={handleSubmit}
               disabled={isAnalyzing || (!description && !previewImage)}
               className="flex-1 bg-teal-600 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 active:scale-95 disabled:opacity-30"
             >
               {isAnalyzing ? (
                 <div className="flex items-center gap-2">
                   <Loader2 className="animate-spin" size={20} />
                   <span>AI解析中...</span>
                 </div>
               ) : (
                 <>
                   <Plus size={20} strokeWidth={3} />
                   <span>{selectedCategory}を保存</span>
                 </>
               )}
             </button>
          </div>
        </div>

        {/* 本日の進捗 */}
        {todaysMeals.length > 0 && (
          <div className="space-y-3">
            <button 
              onClick={() => setShowSummary(!showSummary)}
              className={`w-full p-5 rounded-[28px] border-2 flex items-center justify-between transition-all ${showSummary ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-800 shadow-sm'}`}
            >
              <div className="flex items-center gap-3">
                 <Calculator size={20} />
                 <div className="text-left">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">本日の栄養バランス</p>
                   <p className="text-base font-black">{actuals.calories} / {targets.calories} kcal</p>
                 </div>
              </div>
              <ChevronRight className={`transition-transform duration-300 ${showSummary ? 'rotate-90' : ''}`} size={20} />
            </button>

            {showSummary && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-5">
                   <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-slate-50" strokeWidth="8" stroke="currentColor" fill="transparent" r="32" cx="40" cy="40" />
                        <circle className="text-teal-500" strokeWidth="8" strokeDasharray={200} strokeDashoffset={200 - (200 * (dailyScore?.score || 0)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="32" cx="40" cy="40" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-black">
                        <span className="text-xl text-slate-800">{loadingScore ? ".." : dailyScore?.score}</span>
                      </div>
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-teal-600 mb-1.5">
                        <Award size={16} />
                        <span className="text-[11px] font-black uppercase">AIコーチのアドバイス</span>
                      </div>
                      <p className="text-[13px] text-slate-600 leading-relaxed font-bold italic">
                        {loadingScore ? "評価中..." : (dailyScore?.comment || "記録を続けましょう！")}
                      </p>
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-5 border-t border-slate-50">
                   {renderProgress("総カロリー", actuals.calories, targets.calories, "kcal")}
                   <div className="grid grid-cols-3 gap-4">
                     {renderProgress("P (タンパク)", actuals.protein, targets.protein, "g")}
                     {renderProgress("F (脂質)", actuals.fat, targets.fat, "g")}
                     {renderProgress("C (糖質)", actuals.carbs, targets.carbs, "g")}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* タイムライン */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
            <TrendingUp size={14} /> 本日のタイムライン
          </h3>
          
          {todaysMeals.length === 0 ? (
            <div className="py-20 text-center text-slate-300">
               <Plus size={32} className="mx-auto mb-2 opacity-10" />
               <p className="text-xs font-bold">まだ今日の記録はありません</p>
            </div>
          ) : (
            [...todaysMeals].sort((a, b) => {
               const order = { '朝食': 1, '昼食': 2, '夕食': 3, '間食': 4 };
               return order[a.category] - order[b.category];
            }).map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border-2 ${
                  log.category === '朝食' ? 'bg-amber-50 border-amber-100' :
                  log.category === '昼食' ? 'bg-sky-50 border-sky-100' :
                  log.category === '夕食' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'
                }`}>
                  {log.imageUrl ? (
                    <img src={log.imageUrl} alt="Meal" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{log.category === '朝食' ? '🍳' : log.category === '昼食' ? '🍱' : log.category === '夕食' ? '🍣' : '🥞'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase ${
                      log.category === '朝食' ? 'bg-amber-100 text-amber-600' :
                      log.category === '昼食' ? 'bg-sky-100 text-sky-600' :
                      log.category === '夕食' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {log.category}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm truncate">{log.description}</h4>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs font-black text-teal-600">{log.calories} kcal</span>
                    <div className="flex gap-2 text-[9px] text-slate-400 font-bold">
                      <span>P:{log.protein}g</span>
                      <span>F:{log.fat}g</span>
                      <span>C:{log.carbs}g</span>
                    </div>
                  </div>
                  {log.aiAnalysis && (
                    <div className="mt-2 bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-500 leading-tight border border-slate-100/50 italic flex items-start gap-2">
                      <Info size={12} className="text-teal-400 shrink-0" />
                      <span>{log.aiAnalysis}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MealTracker;
