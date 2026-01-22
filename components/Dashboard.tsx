import React, { useEffect, useState } from 'react';
import { InBodyData, UserProfile, MealLog } from '../types';
import { generateSeikotsuinPlan, evaluateDailyDiet } from '../services/geminiService';
import { Sparkles, ArrowRight, TrendingDown, Target, Utensils, Award } from 'lucide-react';
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
  const calorieTarget = 2000;

  useEffect(() => {
    const fetchData = async () => {
      setLoadingTip(true);
      setLoadingScore(true);
      
      const latest = inBodyHistory.length > 0 ? inBodyHistory[inBodyHistory.length - 1] : undefined;
      
      const [tip, scoreResult] = await Promise.all([
        generateSeikotsuinPlan(user, latest),
        evaluateDailyDiet(todaysMeals, user)
      ]);
      
      setDailyTip(tip);
      setDailyScore(scoreResult);
      setLoadingTip(false);
      setLoadingScore(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealLogs.length]); 

  const currentWeight = inBodyHistory.length > 0 ? inBodyHistory[inBodyHistory.length - 1].weightKg : 0;
  const weightChange = inBodyHistory.length > 1 
    ? (currentWeight - inBodyHistory[inBodyHistory.length - 2].weightKg).toFixed(1)
    : 0;
  
  const chartData = inBodyHistory.slice(-5).map(entry => ({
    date: new Date(entry.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
    weight: entry.weightKg
  }));

  return (
    <div className="p-4 space-y-6">
      {/* Welcome & Goal */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">こんにちは、{user.name}さん</h2>
            <p className="opacity-90 text-sm mt-1">姿勢を正して、健康的な一日を。</p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Target className="text-white" size={24} />
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-end">
          <div>
            <p className="text-teal-100 text-xs uppercase tracking-wider font-semibold">現在の体重</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{currentWeight}</span>
              <span className="text-lg">kg</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-teal-100 text-xs uppercase tracking-wider font-semibold">目標まで</p>
             <div className="flex items-center justify-end gap-1">
                <span className="text-2xl font-bold">あと {(currentWeight - user.targetWeightKg).toFixed(1)}</span>
                <span className="text-sm">kg</span>
             </div>
          </div>
        </div>
      </div>

      {/* Daily Score Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-12 -mt-12 flex items-end justify-start p-6">
           <Award className="text-teal-200" size={32} />
        </div>
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-4">本日の食事スコア</h3>
        {loadingScore ? (
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
               <svg className="w-20 h-20">
                  <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                  <circle className="text-teal-500 transition-all duration-1000 ease-out" strokeWidth="6" strokeDasharray={214} strokeDashoffset={214 - (214 * (dailyScore?.score || 0)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{dailyScore?.score || 0}</span>
               </div>
            </div>
            <div className="flex-1">
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 {dailyScore?.comment || "記録を始めるとAIが採点します"}
               </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Coach Tip */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3 text-indigo-600">
          <Sparkles size={18} />
          <h3 className="font-semibold text-sm uppercase tracking-wide">AIコーチからのアドバイス</h3>
        </div>
        {loadingTip ? (
          <div className="animate-pulse space-y-2">
             <div className="h-4 bg-slate-100 rounded w-3/4"></div>
             <div className="h-4 bg-slate-100 rounded w-full"></div>
             <div className="h-4 bg-slate-100 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="prose prose-sm prose-indigo max-w-none text-slate-600 text-sm leading-relaxed">
            <ReactMarkdown>{dailyTip}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Weight Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
          体重の推移
          <span className={`text-xs px-2 py-1 rounded-full ${Number(weightChange) <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {Number(weightChange) > 0 ? '+' : ''}{weightChange}kg (前回比)
          </span>
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                itemStyle={{color: '#0d9488', fontWeight: 600}}
              />
              <Area type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <button 
          onClick={() => setView('inbody')}
          className="w-full mt-4 py-2 text-sm text-teal-600 font-medium bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors flex items-center justify-center gap-1"
        >
          InBodyデータ詳細 <ArrowRight size={16} />
        </button>
      </div>

      {/* Daily Macros */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <p className="text-orange-600 text-xs font-bold uppercase">摂取カロリー</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{caloriesConsumed}</p>
          <div className="w-full bg-orange-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-orange-500 h-full rounded-full" 
              style={{ width: `${Math.min((caloriesConsumed / calorieTarget) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">目標: {calorieTarget} kcal</p>
        </div>
        
        <div 
          onClick={() => setView('meals')}
          className="bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition-all"
        >
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mb-2">
            <Utensils className="text-teal-600" size={20} />
          </div>
          <p className="font-semibold text-slate-700 text-sm">食事を記録</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
