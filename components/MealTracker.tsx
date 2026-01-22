import React, { useState, useRef } from 'react';
import { MealLog } from '../types';
import { analyzeMeal } from '../services/geminiService';
import { Camera, Plus, Loader2, Info, ChevronRight } from 'lucide-react';

interface MealTrackerProps {
  logs: MealLog[];
  onAddLog: (log: MealLog) => void;
}

const MealTracker: React.FC<MealTrackerProps> = ({ logs, onAddLog }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async () => {
    if (!description && !previewImage) return;

    setIsAnalyzing(true);
    try {
      const base64Image = previewImage ? previewImage.split(',')[1] : undefined;
      const analysis = await analyzeMeal(description || "画像の食事", base64Image);
      
      const newLog: MealLog = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        time: '記録', 
        description: analysis.description || description || "写真の食事",
        imageUrl: previewImage || undefined,
        calories: analysis.calories || 0,
        protein: analysis.protein || 0,
        fat: analysis.fat || 0,
        carbs: analysis.carbs || 0,
        aiAnalysis: analysis.aiAnalysis || "記録完了しました。"
      };
      
      onAddLog(newLog);
      setDescription('');
      setPreviewImage(null);
    } catch (error) {
      alert("AIによる解析に失敗しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold text-slate-800 mb-4">食事管理</h2>
      
      {/* Input Area */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="食事内容を入力（例：唐揚げ弁当）または写真を撮影..."
          className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-teal-500 text-slate-700 resize-none mb-3 text-sm"
          rows={3}
        />
        
        {previewImage && (
           <div className="relative mb-3 h-40 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
             <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
             <button 
               onClick={() => setPreviewImage(null)}
               className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm"
             >
               <Plus className="rotate-45" size={16} />
             </button>
           </div>
        )}

        <div className="flex gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
           >
             <Camera size={20} />
             <span className="text-xs font-bold hidden sm:block">写真を撮る</span>
           </button>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

           <button 
             onClick={handleSubmit}
             disabled={isAnalyzing || (!description && !previewImage)}
             className="flex-1 bg-teal-600 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
           >
             {isAnalyzing ? (
               <>
                 <Loader2 className="animate-spin" size={20} /> 解析中...
               </>
             ) : (
               <>
                 <Plus size={20} /> AIで解析・記録
               </>
             )}
           </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-20">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
           <ChevronRight size={14} /> 最近の食事履歴
        </h3>
        {[...logs].reverse().map((log) => (
          <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group transition-all hover:border-teal-200">
            <div className="flex gap-4">
              {log.imageUrl ? (
                <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                  <img src={log.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 border border-teal-100">
                  <span className="text-3xl">🍱</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                   <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{log.description}</h4>
                   <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full whitespace-nowrap">{log.calories} kcal</span>
                </div>
                
                <div className="flex gap-2 mb-2">
                   <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">たんぱく質</span>
                      <span className="text-xs font-bold text-indigo-600">{log.protein}g</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">脂質</span>
                      <span className="text-xs font-bold text-orange-600">{log.fat}g</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">炭水化物</span>
                      <span className="text-xs font-bold text-teal-600">{log.carbs}g</span>
                   </div>
                </div>

                {log.aiAnalysis && (
                  <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 flex gap-2 items-start border border-slate-100">
                    <Info size={12} className="mt-0.5 text-teal-500 flex-shrink-0" />
                    <span className="leading-tight">{log.aiAnalysis}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealTracker;