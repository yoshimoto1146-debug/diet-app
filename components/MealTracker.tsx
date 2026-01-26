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
      alert("解析に失敗しました。記録を保存します。");
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
      <div className="bg-white border-b border-slate-100 p-5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Utensils size={24} className="text-teal-600" />
            食事管理
          </h2>
          <div className="flex gap-1.5">
            {categories.map(c => (
              <div key={c.name} className={`w-2.5 h-2.5 rounded-full border border-slate-100 ${todaysMeals.some(m => m.category === c.name) ? 'bg-teal-500' : 'bg-slate-200'}`} />
            ))}
          </div>
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
                  isSelected 
                    ? 'bg-white text-teal-600 shadow-md font-black scale-[1.02]' 
                    : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
              >
                <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
                <span className="text-[10px] mt-1.5">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-5 pb-32">
        <div className="bg-white p-6 rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`${selectedCategory}に何を食べましたか？`}
            className="w-full p-2 bg-transparent border-none focus:ring-0 text-slate-700 resize-none mb-4 text-xl min-h-[120px] font-medium placeholder:text-slate-300"
          />
          
          {previewImage && (
             <div className="relative mb-5 h-72 w-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100">
               <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
               <button 
                 onClick={() => setPreviewImage(null)} 
                 className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2.5 backdrop-blur-xl hover:bg-black/80 transition-colors"
               >
                 <Plus className="rotate-45" size={24} strokeWidth={3} />
               </button>
             </div>
          )}

          <div className="flex gap-3.5">
             <button 
               onClick={() => fileInputRef.current?.click()} 
               className="bg-slate-50 text-slate-600 p-5 rounded-[24px] border border-slate-200 active:scale-90 transition-all hover:bg-slate-100"
             >
               <Camera size={28} />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

             <button 
               onClick={handleSubmit}
               disabled={isAnalyzing || (!description && !previewImage)}
               className="flex-1 bg-teal-600 text-white font-black rounded-[24px] py-5 flex items-center justify-center gap-2.5 shadow-xl shadow-teal-600/30 active:scale-95 transition-all disabled:opacity-30"
             >
               {isAnalyzing ? (
                 <div className="flex items-center gap-2.5">
                   <Loader2 className="animate-spin" size={22} />
                   <span className="text-sm">解析中...</span>
                 </div>
               ) : (
                 <>
                   <Plus size={22} strokeWidth={3} />
                   <span className="text-sm tracking-wide">食事を記録する</span>
                 </>
               )}
             </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-300" /> 本日の履歴
          </h3>
          
          {todaysMeals.length === 0 ? (
            <div className="py-20 text-center bg-white/50 rounded-[40px] border-2 border-dashed border-slate-200">
               <Utensils size={40} className="mx-auto text-slate-200 mb-3" />
               <p className="text-xs font-bold text-slate-400">まだ今日の記録はありません</p>
            </div>
          ) : (
            [...todaysMeals].sort((a, b) => {
               const order = { '朝食': 1, '昼食': 2, '夕食': 3, '間食': 4 };
               return order[a.category] - order[b.category];
            }).map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex gap-5 items-center group transition-all hover:shadow-md">
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl flex-shrink-0 border transition-transform group-hover:scale-105 ${
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
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-black uppercase">
                      {log.category}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm truncate tracking-tight">{log.description}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-teal-600">{log.calories} <span className="text-[10px] font-bold opacity-60">kcal</span></span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-tight">P:{log.protein}g F:{log.fat}g C:{log.carbs}g</span>
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
