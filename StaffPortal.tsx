import React from 'react';
import { Users, AlertCircle, ChevronRight } from 'lucide-react';

const StaffPortal: React.FC<{ logout: () => void }> = ({ logout }) => {
  const patients = [
    { id: 'P-1001', name: '佐藤 健一', alert: true },
    { id: 'P-1002', name: '鈴木 美香', alert: false },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">患者一覧</h2>
        <button onClick={logout} className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-full">終了</button>
      </div>
      <div className="space-y-3">
        {patients.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border border-slate-50">
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">{p.name}</h3>
              <p className="text-[10px] text-slate-300 font-bold">{p.id}</p>
            </div>
            {p.alert && <AlertCircle size={16} className="text-rose-500" />}
            <ChevronRight size={16} className="text-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
};
export default StaffPortal;
