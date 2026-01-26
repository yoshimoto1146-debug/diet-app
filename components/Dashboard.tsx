
import React, { useEffect, useState } from 'react';
import { InBodyData, UserProfile, MealLog, Gender, JobActivity, DietGoal } from '../types';
import { generateSeikotsuinPlan, evaluateDailyDiet } from '../services/geminiService';
import { Sparkles, ArrowRight, TrendingDown, Plus, Info } from 'lucide-react';
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
    // 1. カスタム設定（上級者）が最優先
    if (user.goal === DietGoal.OTHER && user.customTargets) {
      return user.customTargets;
    }

    // 2. 標準BMR計算 (Mifflin-St Jeor Equation)
    let baseBMR = user.gender === Gender.MALE 
      ? (10 * (user.targetWeightKg || 60)) + (6.25 * (user.heightCm || 170)) - (5 * (user.age || 30)) + 5
      : (10 * (user.targetWeightKg || 50)) + (6.25 * (user.heightCm || 160)) - (5 * (user.age || 30)) - 161;
    
    // 3. 活動量による補正
    const activityMult = user.jobActivity === JobActivity.HEAVY ? 1.7 : user.jobActivity === JobActivity.WALK ? 1.5 : 1.2;
    let targetCal = Math.round(baseBMR * activityMult);

    // 4. 産後・授乳中の特別加算 (+350kcal は授乳によるエネルギー消費を考慮)
    if (user.goal === DietGoal.POSTPARTUM_NURSING) {
      targetCal += 350;
    }
    
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
    [DietGoal.POSTPARTUM_NURSING]: 'bg-pink-600',
    [DietGoal.DIABETES]: 'bg-indigo-600',
    [DietGoal.HYPERTENSION]: 'bg-sky-600',
    [DietGoal.GENERAL]: 'bg-teal-600',
    [DietGoal.OTHER]: 'bg-slate-700',
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">{user.name || 'ゲスト'}さん</h2>
            <span className={`text-[9px] text-white px-2 py-0.5 rounded-full font-bold shadow-sm ${goalColors[user.goal] || 'bg-slate-600'}`}>
              {user.goal}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            目標: {user.targetWeightKg || '--'}kg
          </p>
        </div>
        <button onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 active:scale-90 transition-transform">
          <Info size={16} />
        </button>
      </div>

      <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
          <TrendingDown size={120} />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">現在の体重</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{currentWeight || '--'}</span>
              <span className="text-sm opacity-60 font-medium tracking-tight">kg</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">前回比</p>
            <div className={`text-xl font-black ${Number(weightChange) <= 0 ? 'text-green-400' : 'text-rose-400'}`}>
              {currentWeight ? `${Number(weightChange) > 0 ? '+' : ''}${weightChange}kg` : '--'}
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex gap-3">
          <div className="flex-1 bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10">
             <div className="flex justify-between items-end mb-2">
               <p className="text-slate-400 text-[9px] font-bold uppercase">摂取カロリー</p>
               <p className="text-xs font-black">{caloriesConsumed} <span className="opacity-40 font-bold">/ {calorieTarget}</span></p>
             </div>
             <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(45,212,191,0.5)]" 
                  style={{ width: `${Math.min((caloriesConsumed / (calorieTarget || 1)) * 100, 100)}%` }}
                ></div>
             </div>
          </div>
          <button 
            onClick={() => setView('inbody')}
            className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all text-white"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="relative w-16 h-16 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-50" strokeWidth="6" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32" />
                <circle 
                  className="text-teal-500 transition-all duration-1000" 
                  strokeWidth="6" 
                  strokeDasharray={176} 
                  strokeDashoffset={176 - (176 * (dailyScore?.score || 0)) / 100} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="28" 
                  cx="32" 
                  cy="32" 
                />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center font-black text-slate-800 text-base">
                {dailyScore?.score || 0}
             </div>
          </div>
          <div className="flex-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">本日の食事評価</h3>
            <p className="text-xs text-slate-600 leading-tight font-medium">
              {loadingScore ? "解析中..." : (dailyScore?.comment || "食事を記録してアドバイスをもらいましょう！")}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-5 border border-indigo-100 shadow-sm">
           <div className="flex items-center gap-2 mb-2 text-indigo-600">
             <Sparkles size={16} fill="currentColor" />
             <h3 className="text-[10px] font-black uppercase tracking-widest">AIコーチの専門助言</h3>
           </div>
           <div className="text-xs text-indigo-900 leading-relaxed italic font-bold">
             {loadingTip ? "考え中..." : <ReactMarkdown>{dailyTip}</ReactMarkdown>}
           </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">体重トレンド</h3>
            <button onClick={() => setView('inbody')} className="text-[10px] font-black text-teal-600 flex items-center gap-1 uppercase tracking-tight">
              履歴をみる <ArrowRight size={12} />
            </button>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 'black', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 'black', fontSize: '14px', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" dot={{ r: 5, fill: '#0f172a', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
