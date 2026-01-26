import React, { useState, useRef } from 'react';
import { InBodyData } from '../types';
import { analyzeInBodyImage } from '../services/geminiService';
import { Camera, Loader2, Calendar, Plus, Save, Info, Smartphone, FileText } from 'lucide-react';

interface InBodyManagerProps {
  history: InBodyData[];
  onAddEntry: (data: InBodyData) => void;
}

const InBodyManager: React.FC<InBodyManagerProps> = ({ history, onAddEntry }) => {
  const [activeMode, setActiveMode] = useState<'manual' | 'scan'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualWeight, setManualWeight] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const result = await analyzeInBodyImage(base64String);
        
        if (result.weightKg) {
          onAddEntry({
            id: Date.now().toString(),
            date: result.date || manualDate,
            weightKg: result.weightKg,
            bodyFatPercent: result.bodyFatPercent,
            muscleMassKg: result.muscleMassKg,
            bmi: result.bmi,
            visceralFatLevel: result.visceralFatLevel,
            score: result.score,
            isManual: false
          });
          alert("スキャン完了！データを保存しました。");
        } else {
          alert("数値を読み取れませんでした。手動で入力してください。");
        }
      } catch (e) {
        alert("解析中にエラーが発生しました。");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(manualWeight);
    if (isNaN(weight) || weight <= 0) return;

    onAddEntry({
      id: Date.now().toString(),
      date: manualDate,
      weightKg: weight,
      isManual: true
    });
    setManualWeight('');
    alert("体重を記録しました！");
  };

  const sortedHistory = [...history].sort((a,b) => b.date.localeCompare(a.date));
  const latest = sortedHistory[0];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">測定記録</h2>
        <div className="flex bg-slate-200/50 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveMode('manual')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${activeMode === 'manual' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}
          >
            <Smartphone size={14} /> 入力
          </button>
          <button 
            onClick={() => setActiveMode('scan')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${activeMode === 'scan' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}
          >
            <FileText size={14} /> スキャン
          </button>
        </div>
      </div>

      {activeMode === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
              <Plus size={24} strokeWidth={3} />
            </div>
            <h3 className="font-bold text-slate-800">今日の体重を記録</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">日付</label>
              <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">体重 (kg)</label>
              <input type="number" step="0.1" value={manualWeight} onChange={e => setManualWeight(e.target.value)} placeholder="00.0" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-black focus:ring-2 focus:ring-teal-500 outline-none text-teal-600" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Save size={20} /> 保存する
          </button>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 text-center space-y-5">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
            <Camera size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800">InBody用紙をスキャン</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-4">結果用紙の全体が入るように撮影してください。AIが自動で数値を読み取ります。</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
            カメラを起動する
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      )}

      {latest && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
             <Calendar size={14} /> 最新の測定データ
          </h3>
          <div className="bg-slate-900 text-white p-7 rounded-[40px] shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 opacity-10">
                <Info size={160} />
             </div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{latest.date}</p>
                 <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${latest.isManual ? 'bg-slate-800 text-slate-400' : 'bg-teal-500/20 text-teal-400'}`}>
                   {latest.isManual ? 'Manual' : 'InBody'}
                 </span>
               </div>
               <div className="flex items-baseline gap-1.5">
                 <span className="text-5xl font-black">{latest.weightKg}</span>
                 <span className="text-lg font-bold opacity-40">kg</span>
               </div>
               
               {!latest.isManual && (
                 <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10">
                   <div className="space-y-1">
                     <p className="text-[9px] font-bold text-slate-500 uppercase">体脂肪率</p>
                     <p className="text-lg font-black">{latest.bodyFatPercent || '--'} <span className="text-[10px] font-normal opacity-50">%</span></p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[9px] font-bold text-slate-500 uppercase">筋肉量</p>
                     <p className="text-lg font-black">{latest.muscleMassKg || '--'} <span className="text-[10px] font-normal opacity-50">kg</span></p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[9px] font-bold text-slate-500 uppercase">スコア</p>
                     <p className="text-lg font-black text-teal-400">{latest.score || '--'}</p>
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InBodyManager;
