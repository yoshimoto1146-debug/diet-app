
import React, { useEffect, useState } from 'react';
import { InBodyData, UserProfile, MealLog, Gender, JobActivity, DietGoal } from '../types';
import { generateSeikotsuinPlan, evaluateDailyDiet } from '../services/geminiService';
import { Sparkles, ArrowRight, TrendingDown, Target, Utensils, Award, Plus, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  user: UserProfile;
  inBodyHistory: InBodyData[];
  mealLogs: MealLog[];
  setView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, inBodyHistory, mealLogs, setView }) => {
  const [dailyTip, setDailyTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [dailyScore, setDailyScore] = useState<{ score: number; comment: string } | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = mealLogs.filter(m => m.date === today);
  const caloriesConsumed = todaysMeals.reduce((acc, curr) => acc + curr.calories, 0);

  const calculateTargets = () => {
    let baseBMR = user.gender === Gender.MALE 
      ? (10 * (user.targetWeightKg || 60)) + (6.25 * (user.heightCm || 170)) - (5 * (user.age || 30)) + 5
      : (10 * (user.targetWeightKg || 50)) + (6.25 * (user.heightCm || 160)) - (5 * (user.age || 30)) - 161;
    
    const activityMult = user.jobActivity === JobActivity.HEAVY ? 1.7 : user.jobActivity === JobActivity.WALK ? 1.5 : 1.2;
    const targetCal = Math.round(baseBMR * activityMult);
    
    return {
      calories: targetCal,
      protein: Math.round((user.targetWeightKg || 60) * 1.5),
      fat: Math.round(targetCal * 0.25 / 9),
      carbs: Math.round(targetCal * 0.5 / 4),
    };
  };

  const targets = calculateTargets();
  const calorieTarget = targets.calories;

  useEffect(() => {
    const fetchData = async () => {
      if (!user.patientId) return;
      
      setLoadingTip(true);
      setLoadingScore(true);
      
      try {
        const latest = inBodyHistory.length > 0 ? inBodyHistory[inBodyHistory.length - 1] : undefined;
        const [tip, scoreResult] = await Promise.all([
          generateSeikotsuinPlan(user, latest),
          evaluateDailyDiet(todaysMeals, user, targets)
        ]);
        setDailyTip(tip);
        setDailyScore(scoreResult);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoadingTip(false);
        setLoadingScore(false);
      }
    };
    fetchData();
  }, [mealLogs.length, inBodyHistory.length, user.goal]);

  const currentWeight = inBodyHistory.length > 0 ? inBodyHistory[inBodyHistory.length - 1].weightKg : 0;
  const weightChange = inBodyHistory.length > 1 
    ? (currentWeight - inBodyHistory[inBodyHistory.length - 2].weightKg).toFixed(1)
    : 0;
  
  const chartData = inBodyHistory.length > 0 
    ? inBodyHistory.slice(-7).map(entry => ({
        date: entry.date.split('-').slice(1).join('/'),
        weight: entry.weightKg
      }))
    : [];

  const goalColors: Record<DietGoal, string> = {
    [DietGoal.POSTPARTUM]: 'bg-rose-500',
    [DietGoal.DIABETES]: 'bg-indigo-600',
    [DietGoal.HYPERTENSION]: 'bg-sky-600',
    [DietGoal.GENERAL]: 'bg-teal-600',
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">{user.name || 'ゲスト'}さん</h2>
            <span className={`text-[9px] text-white px-2 py-0.5 rounded-full font-bold ${goalColors[user.goal] || 'bg-slate-600'}`}>
              {user.goal}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            目標: {user.targetWeightKg || '--'}kg へ向けて
          </p>
        </div>
        <button onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
          <Info size={16} />
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingDown size={80} />
        </div>
        <div className="relative z-10 flex justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">現在の体重</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold">{currentWeight || '--'}</span>
              <span className="text-sm opacity-60 font-medium">kg</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">前回比</p>
            <div className={`text-lg font-bold mt-1 ${Number(weightChange) <= 0 ? 'text-green-400' : 'text-rose-400'}`}>
              {currentWeight ? `${Number(weightChange) > 0 ? '+' : ''}${weightChange}kg` : '--'}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <div className="flex-1 bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5">
             <p className="text-slate-500 text-[8px] font-bold uppercase mb-1">摂取カロリー</p>
             <p className="text-sm font-bold">{caloriesConsumed} <span className="text-[10px] opacity-40">/ {calorieTarget}</span></p>
             <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-teal-400 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((caloriesConsumed / (calorieTarget || 1)) * 100, 100)}%` }}
                ></div>
             </div>
          </div>
          <button 
            onClick={() => setView('inbody')}
            className="px-4 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform text-white font-bold text-xs gap-1"
          >
            <Plus size={16} /> 体重入力
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-50" strokeWidth="4" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                <circle 
                  className="text-teal-500 transition-all duration-1000" 
                  strokeWidth="4" 
                  strokeDasharray={150} 
                  strokeDashoffset={150 - (150 * (dailyScore?.score || 0)) / 100} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="24" 
                  cx="28" 
                  cy="28" 
                />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-800 text-sm">
                {dailyScore?.score || 0}
             </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">今日の食事評価</h3>
            <p className="text-xs text-slate-600 leading-tight">
              {loadingScore ? "解析中..." : (dailyScore?.comment || "記録を始めましょう！")}
            </p>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
           <div className="flex items-center gap-2 mb-2">
             <Sparkles size={14} className="text-indigo-600" />
             <h3 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">AIコーチの助言</h3>
           </div>
           <div className="text-xs text-indigo-800 leading-relaxed italic font-medium">
             {loadingTip ? "考え中..." : <ReactMarkdown>{dailyTip}</ReactMarkdown>}
           </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">体重トレンド</h3>
            <button onClick={() => setView('inbody')} className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
              詳しく見る <ArrowRight size={10} />
            </button>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#0f172a" strokeWidth={3} fill="#f1f5f9" dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {chartData.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <TrendingDown size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-400">グラフを表示するには体重を記録してください</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
