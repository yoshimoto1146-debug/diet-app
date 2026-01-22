import React, { useState, useRef } from 'react';
import { InBodyData } from '../types';
import { analyzeInBodyImage } from '../services/geminiService';
import { Camera, Upload, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

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
        
        // Create new entry
        const newEntry: InBodyData = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          weightKg: result.weightKg || 0,
          bodyFatPercent: result.bodyFatPercent || 0,
          muscleMassKg: result.muscleMassKg || 0,
          bmi: result.bmi || 0,
          visceralFatLevel: result.visceralFatLevel,
          score: result.score
        };

        if (newEntry.weightKg === 0) {
          throw new Error("体重を検出できませんでした。手動で入力してください。");
        }

        onAddEntry(newEntry);
      } catch (e) {
        setError("画像の解析に失敗しました。より鮮明な写真を試すか、手動で入力してください。");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const latest = history[history.length - 1];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">InBody データ</h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
          結果をスキャン
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">体重</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest.weightKg}</span>
            <span className="text-sm text-slate-500">kg</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">骨格筋量 (SMM)</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest.muscleMassKg}</span>
            <span className="text-sm text-slate-500">kg</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">体脂肪率</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest.bodyFatPercent}</span>
            <span className="text-sm text-slate-500">%</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">InBody点数</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-teal-600">{latest.score || '--'}</span>
            <span className="text-sm text-slate-500">点</span>
          </div>
        </div>
      </div>

      {/* Composition Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">体成分の履歴</h3>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={history.slice(-6)}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('ja-JP', {month:'numeric', day:'numeric'})} fontSize={12} stroke="#94a3b8" />
               <YAxis fontSize={12} stroke="#94a3b8" />
               <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('ja-JP')}
               />
               <Bar dataKey="muscleMassKg" name="筋肉量 (kg)" fill="#0d9488" radius={[4, 4, 0, 0]} />
               <Bar dataKey="bodyFatPercent" name="体脂肪率 (%)" fill="#fb923c" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 mt-8">
        InBodyの結果用紙全体が写るように撮影してください。
      </div>
    </div>
  );
};

export default InBodyManager;