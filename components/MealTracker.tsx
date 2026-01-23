import React, { useState, useRef, useEffect } from 'react';
import { MealLog, UserProfile, Gender, JobActivity, MealCategory } from '../types';
import { analyzeMeal, evaluateDailyDiet } from '../services/geminiService';
import { 
  Camera, Plus, Loader2, Info, ChevronRight, Calculator, 
  Award, TrendingUp, Sun, Sunrise, Moon, Coffee, 
  CheckCircle2, Utensils 
} from 'lucide-react';

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

  useEffect(() => {
    // 画面を開いた際に一番上を表示
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
        try {
          const result = await evaluateDailyDiet(todaysMeals, user, targets);
          setDailyScore(result);
        } catch (e) {
          setDailyScore({ score: 70, comment: "記録を続けていきましょう！" });
        } finally {
          setLoadingScore(false);
        }
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
      alert("解析に時間がかかっています。内容を保持したまま手動で保存しました。");
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

  const categories: {name: MealCategory, icon: any}[] = [
    { name: '朝食', icon: Sunrise },
    { name: '昼食', icon: Sun },
    { name: '夕食', icon: Moon },
    { name: '間食', icon: Coffee }
  ];

  const isLogged = (cat: MealCategory) => todaysMeals.some(m => m.category === cat);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* 
        ヘッダーとの重なりを防ぐために、stickyのtopを調整。
        Layout.tsxのヘッダーがh-14(56px)なので、top-0の代わりに「ヘッダーの下」に固定。
      */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Utensils size={18} className="text-teal-600" />
            今日の食事
          </h2>
          <div className="flex gap-1.5">
            {categories.map(c => (
              <div key={c.name} className={`w-2 h-2 rounded-full border border-slate-100 transition-colors duration-500 ${isLogged(c.name) ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
        
        {/* カテゴリ選択: 大きなボタンで押しやすく */}
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95 ${
                  isSelected 
                    ? 'bg-white text-teal-600 shadow-md font-black' 
                    : 'text-slate-400 font-bold hover:text-slate-500'
                }`}
              >
                <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
                <span className="text-[10px] mt-1 tracking-tighter">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* 入力エリア */}
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`${selectedCategory}のメニューを入力...`}
            className="w-full p-2 bg-transparent border-none focus:ring-0 text-slate-700 resize-none mb-3 text-lg min-h-[120px] font-medium"
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
             <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 text-slate-600 p-4 rounded-2xl border border-slate-100 active:scale-90 transition-all">
               <Camera size={26} />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

             <button 
               onClick={handleSubmit}
               disabled={isAnalyzing || (!description && !previewImage)}
               className="flex-1 bg-slate-900 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-30"
             >
               {isAnalyzing ? (
                 <div className="flex items-center gap-2">
                   <Loader2 className="animate-spin" size={20} />
                   <span>AIが計算中...</span>
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

        {/* タイムライン */}
        <div className="space-y-4 pt-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
            <TrendingUp size={14} /> 今日のタイムライン
          </h3>
          
          {todaysMeals.length === 0 ? (
            <div className="py-20 text-center text-slate-300">
               <p className="text-xs font-bold">まだ記録がありません</p>
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
                    <span className="text-[9px] px-2 py-0.5 rounded-lg font-black uppercase bg-slate-100 text-slate-600">
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
