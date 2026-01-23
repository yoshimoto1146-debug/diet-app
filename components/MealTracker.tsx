import React, { useState, useRef, useEffect } from 'react';
import { MealLog, UserProfile, MealCategory } from '../types';
import { analyzeMeal } from '../services/geminiService';
import { 
  Camera, Plus, Loader2, TrendingUp, Sun, Sunrise, Moon, Coffee, 
  Utensils 
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = logs.filter(m => m.date === today);

  useEffect(() => {
    window.scrollTo(0, 0);
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setSelectedCategory('朝食');
    else if (hour >= 11 && hour < 16) setSelectedCategory('昼食');
    else if (hour >= 16 && hour < 23) setSelectedCategory('夕食');
    else setSelectedCategory('間食');
  }, []);

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
      alert("解析中にエラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories: {name: MealCategory, icon: any}[] = [
    { name: '朝食', icon: Sunrise },
    { name: '昼食', icon: Sun },
    { name: '夕食', icon: Moon },
    { name: '間食', icon: Coffee }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Utensils size={20} className="text-teal-600" />
            食事管理
          </h2>
          <div className="flex gap-1.5">
            {categories.map(c => (
              <div key={c.name} className={`w-2.5 h-2.5 rounded-full border border-slate-100 ${todaysMeals.some(m => m.category === c.name) ? 'bg-teal-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
        
        <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-white text-teal-600 shadow-md font-black' 
                    : 'text-slate-400 font-bold'
                }`}
              >
                <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
                <span className="text-[10px] mt-1">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`${selectedCategory}のメニューを入力...`}
            className="w-full p-2 bg-transparent border-none focus:ring-0 text-slate-700 resize-none mb-3 text-lg min-h-[100px] font-medium"
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
             <button onClick={() => fileInputRef.current?.click()} className="bg-slate-50 text-slate-600 p-4 rounded-2xl border border-slate-200 active:scale-90 transition-all">
               <Camera size={28} />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

             <button 
               onClick={handleSubmit}
               disabled={isAnalyzing || (!description && !previewImage)}
               className="flex-1 bg-teal-600 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2 shadow-xl shadow-teal-600/20 active:scale-95 disabled:opacity-30"
             >
               {isAnalyzing ? (
                 <div className="flex items-center gap-2">
                   <Loader2 className="animate-spin" size={20} />
                   <span>AIが解析中...</span>
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

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
            <TrendingUp size={14} /> 最近の食事履歴
          </h3>
          
          {todaysMeals.length === 0 ? (
            <div className="py-16 text-center text-slate-300">
               <p className="text-xs font-bold">まだ今日の記録はありません</p>
            </div>
          ) : (
            [...todaysMeals].sort((a, b) => {
               const order = { '朝食': 1, '昼食': 2, '夕食': 3, '間食': 4 };
               return order[a.category] - order[b.category];
            }).map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border ${
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-black">
                      {log.category}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm truncate">{log.description}</h4>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xs font-black text-teal-600">{log.calories} kcal</span>
                    <span className="text-[9px] text-slate-400 font-bold">P:{log.protein}g F:{log.fat}g C:{log.carbs}g</span>
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
