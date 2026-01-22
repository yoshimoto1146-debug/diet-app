import React, { useState, useRef } from 'react';
import { InBodyData } from '../types';
import { analyzeInBodyImage } from '../services/geminiService';
import { Camera, Loader2, Calendar, AlertCircle } from 'lucide-react';

interface InBodyManagerProps {
  history: InBodyData[];
  onAddEntry: (data: InBodyData) => void;
}

const InBodyManager: React.FC<InBodyManagerProps> = ({ history, onAddEntry }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const result = await analyzeInBodyImage(base64String);
        
        const newEntry: InBodyData = {
          id: Date.now().toString(),
          date: result.date || new Date().toISOString().split('T')[0],
          weightKg: result.weightKg || 0,
          bodyFatPercent: result.bodyFatPercent || 0,
          muscleMassKg: result.muscleMassKg || 0,
          bmi: result.bmi || 0,
          visceralFatLevel: result.visceralFatLevel,
          score: result.score
        };

        if (newEntry.weightKg === 0) {
          throw new Error("数値を読み取れませんでした。");
        }

        onAddEntry(newEntry);
        alert(`${newEntry.date}のデータとして登録しました！`);
      } catch (e) {
        setError("スキャンに失敗しました。鮮明に撮り直すか、手動入力を検討してください。");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const latest = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">InBody記録</h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {isScanning ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
          結果をスキャン
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-[11px] flex items-center gap-2 border border-rose-100">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {latest ? (
        <>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">最新の測定: {latest.date}</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                   <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">体重</p>
                   <p className="text-xl font-bold">{latest.weightKg} <span className="text-[10px] font-normal opacity-50">kg</span></p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                   <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">筋肉量</p>
                   <p className="text-xl font-bold text-teal-600">{latest.muscleMassKg} <span className="text-[10px] font-normal opacity-50 text-slate-800">kg</span></p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                   <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">体脂肪率</p>
                   <p className="text-xl font-bold text-orange-500">{latest.bodyFatPercent} <span className="text-[10px] font-normal opacity-50 text-slate-800">%</span></p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                   <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">スコア</p>
                   <p className="text-xl font-bold text-indigo-600">{latest.score || '--'} <span className="text-[10px] font-normal opacity-50 text-slate-800">点</span></p>
                </div>
             </div>
          </div>

          <div className="space-y-2">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">履歴</h3>
             {[...history].reverse().slice(0, 5).map(entry => (
               <div key={entry.id} className="bg-white px-4 py-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">{entry.date}</span>
                  <div className="flex gap-4">
                     <div className="text-right">
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Weight</p>
                        <p className="text-xs font-bold">{entry.weightKg}kg</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Muscle</p>
                        <p className="text-xs font-bold text-teal-600">{entry.muscleMassKg}kg</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
           <Camera size={40} className="mx-auto text-slate-200 mb-4" />
           <p className="text-slate-400 text-sm">InBody用紙を撮影してください</p>
        </div>
      )}
    </div>
  );
};

export default InBodyManager;
