import React, { useState } from 'react';
import { Search, ChevronRight, MessageSquare, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react';

interface StaffPortalProps {
  logout: () => void;
}

const MOCK_PATIENTS = [
  { id: 'P-1001', name: '佐藤 健一', age: 45, weight: 78.5, trend: 'down', lastSync: '10分前', alert: true },
  { id: 'P-1002', name: '鈴木 美香', age: 32, weight: 54.2, trend: 'stable', lastSync: '1時間前', alert: false },
  { id: 'P-1003', name: '高橋 浩', age: 58, weight: 89.0, trend: 'up', lastSync: '昨日', alert: true },
  { id: 'P-1004', name: '田中 友美', age: 29, weight: 62.1, trend: 'down', lastSync: '3時間前', alert: false },
];

const StaffPortal: React.FC<StaffPortalProps> = ({ logout }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_PATIENTS.filter(p => 
    p.name.includes(searchTerm) || p.id.includes(searchTerm)
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">患者一覧</h2>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">{MOCK_PATIENTS.length} 名の登録</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="名前またはIDで検索..." 
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map(patient => (
          <div key={patient.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 active:bg-slate-50 transition-colors">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${patient.alert ? 'bg-rose-500' : 'bg-indigo-500'}`}>
              {patient.name[0]}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-slate-800">{patient.name}</h3>
                <span className="text-[9px] text-slate-400 font-bold tracking-tighter">{patient.id}</span>
              </div>
              <div className="flex gap-3 text-[10px] font-bold text-slate-500">
                <span>{patient.age}歳</span>
                <span>{patient.weight}kg</span>
                <span className={patient.trend === 'down' ? 'text-green-500' : patient.trend === 'up' ? 'text-rose-500' : 'text-slate-400'}>
                  {patient.trend === 'down' ? '▼' : patient.trend === 'up' ? '▲' : '●'} 推移
                </span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[9px] text-slate-300 font-bold uppercase">{patient.lastSync}</span>
              {patient.alert ? (
                <div className="text-rose-500 flex items-center gap-1">
                   <AlertCircle size={14} />
                </div>
              ) : (
                <div className="text-teal-500">
                   <CheckCircle2 size={14} />
                </div>
              )}
              <ChevronRight size={16} className="text-slate-300 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-slate-400">
           <Search size={40} className="mx-auto mb-2 opacity-10" />
           <p className="text-sm">見つかりませんでした</p>
        </div>
      )}

      <div className="pt-8">
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <MessageSquare size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-indigo-900 mb-1 tracking-wider uppercase">運用ヒント</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              患者様が「送信」した最新データには赤いマークが表示されます。優先的にコメントを返してモチベーションを維持させましょう。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPortal;