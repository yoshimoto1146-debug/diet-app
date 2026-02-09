import React, { useEffect, useState } from 'react';
import { InBodyData, UserProfile, MealLog, ViewState } from './types';
import { generateSeikotsuinTip, evaluateDailyDiet } from './geminiService';
import { Sparkles, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: UserProfile;
  inBodyHistory: InBodyData[];
  mealLogs: MealLog[];
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, inBodyHistory, mealLogs, setView }) => {
  const [tip, setTip] = useState('');
  const [score, setScore] = useState<{ score: number; comment: string } | null>(null);

  useEffect(() => {
    generateSeikotsuinTip(user).then(setTip);
    evaluateDailyDiet(mealLogs.filter(m => m.date === new Date().toISOString().split('T')[0]), user).then(setScore);
  }, [mealLogs.length]);

  const currentWeight = inBodyHistory[0]?.weightKg || 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1">Current Weight</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">{currentWeight || '--'}</span>
          <span className="text-sm opacity-50">kg</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full border-4 border-teal-500 flex items-center justify-center font-black text-xl">{score?.score || 0}</div>
        <div className="flex-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-1">Daily Score</h3>
          <p className="text-xs text-slate-600 leading-tight font-medium">{score?.comment || "記録を始めましょう！"}</p>
        </div>
      </div>

      <div className="bg-teal-50 rounded-3xl p-5 border border-teal-100 flex items-start gap-3">
        <Sparkles size={16} className="text-teal-600 mt-0.5" />
        <p className="text-xs text-teal-900 font-bold italic">{tip || "解析中..."}</p>
      </div>

      {inBodyHistory.length > 1 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={inBodyHistory.slice(0, 7).reverse()}>
              <Area type="monotone" dataKey="weightKg" stroke="#0f172a" strokeWidth={3} fill="#f1f5f9" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
