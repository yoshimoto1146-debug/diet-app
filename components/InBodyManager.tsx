import React, { useState } from 'react';
import { InBodyData } from './types';
import { Plus, Save, Calendar } from 'lucide-react';

const InBodyManager: React.FC<{ history: InBodyData[]; onAddEntry: (d: InBodyData) => void; }> = ({ history, onAddEntry }) => {
  const [w, setW] = useState('');
  const [d, setD] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    if (!w) return;
    onAddEntry({ id: Date.now().toString(), date: d, weightKg: parseFloat(w) });
    setW('');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
          <input type="date" value={d} onChange={e => setD(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
          <input type="number" value={w} onChange={e => setW(e.target.value)} placeholder="00.0" className="w-full bg-slate-50 border-none rounded-xl p-4 text-2xl font-black text-teal-600" />
        </div>
        <button onClick={handleSave} className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2"><Save size={20} /> 保存する</button>
      </div>
      <div className="space-y-3">
        {history.map(entry => (
          <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-300">{entry.date}</p>
              <p className="text-lg font-black text-slate-800">{entry.weightKg}kg</p>
            </div>
            <Calendar size={16} className="text-teal-500" />
          </div>
        ))}
      </div>
    </div>
  );
};
export default InBodyManager;
