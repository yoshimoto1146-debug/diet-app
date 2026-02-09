import React, { useState, useRef } from 'react';
import { MealLog, UserProfile, MealCategory } from './types';
import { analyzeMeal } from './geminiService';
import { Camera, Plus, Loader2, Utensils, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const MealTracker: React.FC<{ logs: MealLog[]; onAddLog: (l: MealLog) => void; onDeleteLog: (id: string) => void; user: UserProfile; }> = ({ logs, onAddLog, onDeleteLog, user }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState<MealCategory>('昼食');
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = logs.filter(m => m.date === viewDate);
  const total = filtered.reduce((a, c) => ({
    p: a.p + c.protein, f: a.f + c.fat, c: a.c + c.carbs
  }), { p: 0, f: 0, c: 0 });

  const handleAdd = async () => {
    if (!desc) return;
    setIsAnalyzing(true);
    const res = await analyzeMeal(desc);
    onAddLog({
      id: Date.now().toString(),
      date: viewDate,
      time: '12:00',
      category: cat,
      description: desc,
      calories: res.calories || 0,
      protein: res.protein || 0,
      fat: res.fat || 0,
      carbs: res.carbs || 0,
      aiAnalysis: res.aiAnalysis
    });
    setDesc('');
    setIsAnalyzing(false);
  };

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="何を食べましたか？" className="w-full bg-transparent border-none text-lg font-medium outline-none h-12" />
        <div className="flex gap-2">
          <button onClick={() => fileInput.current?.click()} className="bg-slate-50 p-4 rounded-2xl"><Camera size={20} /></button>
          <button onClick={handleAdd} disabled={isAnalyzing} className="flex-1 bg-teal-600 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2">
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Plus />} 記録する
          </button>
        </div>
        <input type="file" ref={fileInput} className="hidden" />
      </div>

      {filtered.length > 0 && (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white space-y-4 shadow-xl">
          <div className="h-2 w-full bg-white/10 rounded-full flex overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: '30%' }} />
            <div className="h-full bg-amber-400" style={{ width: '25%' }} />
            <div className="h-full bg-emerald-500" style={{ width: '45%' }} />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
            <span className="text-rose-400">P(赤): {total.p}g</span>
            <span className="text-amber-400">F(黄): {total.f}g</span>
            <span className="text-emerald-400">C(緑): {total.c}g</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(log => (
          <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">{log.description}</h4>
              <div className="flex gap-2 text-[10px] font-black mt-1">
                <span className="text-rose-500">P:{log.protein}</span>
                <span className="text-amber-500">F:{log.fat}</span>
                <span className="text-emerald-500">C:{log.carbs}</span>
              </div>
            </div>
            <button onClick={() => onDeleteLog(log.id)} className="text-slate-200"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MealTracker;
