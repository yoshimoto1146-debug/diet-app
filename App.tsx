import React, { useState, useEffect } from 'react';
import { ViewState, InBodyData, MealLog, ExerciseLog, UserProfile, Gender, JobActivity, LifestyleActivity, DietGoal } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InBodyManager from './components/InBodyManager';
import MealTracker from './components/MealTracker';
import ExercisePlan from './components/ExercisePlan';
import StaffPortal from './components/StaffPortal';
import { Lock, Settings2 } from 'lucide-react';

const EMPTY_USER: UserProfile = {
  patientId: "",
  clinicCode: "",
  name: "",
  age: 0,
  gender: Gender.MALE,
  heightCm: 0,
  targetWeightKg: 0,
  jobActivity: JobActivity.DESK,
  lifestyleActivity: LifestyleActivity.NONE,
  goal: DietGoal.GENERAL
};

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('login');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('diet_user');
    return saved ? JSON.parse(saved) : EMPTY_USER;
  });
  const [inBodyHistory, setInBodyHistory] = useState<InBodyData[]>(() => {
    const saved = localStorage.getItem('diet_inbody');
    return saved ? JSON.parse(saved) : [];
  });
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('diet_meals');
    return saved ? JSON.parse(saved) : [];
  });
  const [exerciseLogs] = useState<ExerciseLog[]>([]);

  useEffect(() => {
    if (user.patientId) {
      localStorage.setItem('diet_user', JSON.stringify(user));
      localStorage.setItem('diet_inbody', JSON.stringify(inBodyHistory));
      localStorage.setItem('diet_meals', JSON.stringify(mealLogs));
    }
  }, [user, inBodyHistory, mealLogs]);

  useEffect(() => {
    if (user.patientId && currentView === 'login') {
      setView(user.isStaff ? 'staff-portal' : 'dashboard');
    }
  }, [user.patientId, user.isStaff, currentView]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientId = formData.get('patientId') as string;
    const clinicCode = formData.get('clinicCode') as string;

    if (clinicCode === "STAFF999") {
      setUser({ ...EMPTY_USER, patientId: "STAFF", clinicCode, isStaff: true });
      setView('staff-portal');
      return;
    }

    if (patientId && clinicCode) {
      setUser({ ...user, patientId, clinicCode, isStaff: false });
      setView(user.name ? 'dashboard' : 'profile');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const goal = formData.get('goal') as DietGoal;
    
    let customTargets = undefined;
    if (goal === DietGoal.OTHER) {
      customTargets = {
        calories: Number(formData.get('customCal')),
        protein: Number(formData.get('customP')),
        fat: Number(formData.get('customF')),
        carbs: Number(formData.get('customC')),
      };
    }

    const updated: UserProfile = {
      ...user,
      name: formData.get('name') as string,
      age: Number(formData.get('age')),
      gender: (formData.get('gender') as Gender) || Gender.MALE,
      heightCm: Number(formData.get('heightCm')),
      targetWeightKg: Number(formData.get('targetWeightKg')),
      jobActivity: (formData.get('jobActivity') as JobActivity) || JobActivity.DESK,
      lifestyleActivity: (formData.get('lifestyleActivity') as LifestyleActivity) || LifestyleActivity.NONE,
      goal: goal || DietGoal.GENERAL,
      customTargets
    };
    setUser(updated);
    setView('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('diet_user');
    setUser(EMPTY_USER);
    setView('login');
  };

  const deleteInBodyEntry = (id: string) => {
    setInBodyHistory(prev => prev.filter(e => e.id !== id));
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 shadow-2xl shadow-teal-500/20 text-white">整</div>
        <h1 className="text-2xl font-bold mb-2 text-center leading-tight">整骨院AI<br/>ダイエットコーチ</h1>
        <p className="text-slate-400 text-sm mb-10">専用IDでログインしてください</p>
        
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">院コード</label>
            <input name="clinicCode" required placeholder="スタッフから渡されたコード" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">患者ID</label>
            <input name="patientId" required placeholder="例: P-12345" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
            ログイン <Lock size={18} />
          </button>
        </form>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} inBodyHistory={inBodyHistory} mealLogs={mealLogs} setView={setView} />;
      case 'inbody': return <InBodyManager history={inBodyHistory} onAddEntry={d => setInBodyHistory(prev => [...prev, d].sort((a,b) => a.date.localeCompare(b.date)))} onDeleteEntry={deleteInBodyEntry} />;
      case 'meals': return <MealTracker logs={mealLogs} onAddLog={l => setMealLogs(prev => [...prev, l])} user={user} />;
      case 'exercise': return <ExercisePlan logs={exerciseLogs} />;
      case 'staff-portal': return <StaffPortal logout={logout} />;
      case 'profile': return (
        <div className="p-6 pb-24">
          <h2 className="text-2xl font-black mb-6 tracking-tight text-slate-800">プロフィール設定</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">お名前</label>
                <input name="name" required placeholder="例：山田 太郎" defaultValue={user.name} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">ダイエットの目的</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    DietGoal.GENERAL, 
                    DietGoal.POSTPARTUM, 
                    DietGoal.POSTPARTUM_NURSING, 
                    DietGoal.DIABETES, 
                    DietGoal.HYPERTENSION, 
                    DietGoal.OTHER
                  ].map(goal => (
                    <label key={goal} className={`flex items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${user.goal === goal ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="goal" 
                        value={goal} 
                        checked={user.goal === goal} 
                        onChange={() => setUser({...user, goal})} 
                        className="hidden" 
                      />
                      <span className="text-[10px] font-black text-center leading-tight">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {user.goal === DietGoal.OTHER && (
                <div className="p-4 bg-slate-900 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-white mb-2">
                    <Settings2 size={16} className="text-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">カスタム目標設定</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">目標カロリー (kcal)</label>
                      <input name="customCal" type="number" defaultValue={user.customTargets?.calories} className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm text-teal-400 font-bold outline-none" placeholder="2000" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">タンパク質 (g)</label>
                      <input name="customP" type="number" defaultValue={user.customTargets?.protein} className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm text-white font-bold outline-none" placeholder="100" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">脂質 (g)</label>
                      <input name="customF" type="number" defaultValue={user.customTargets?.fat} className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm text-white font-bold outline-none" placeholder="60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">炭水化物 (g)</label>
                      <input name="customC" type="number" defaultValue={user.customTargets?.carbs} className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm text-white font-bold outline-none" placeholder="250" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">年齢</label>
                  <input name="age" type="number" required defaultValue={user.age || ''} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">性別</label>
                  <select name="gender" defaultValue={user.gender} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none">
                    {Object.values(Gender).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">身長 (cm)</label>
                  <input name="heightCm" type="number" required defaultValue={user.heightCm || ''} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">目標体重 (kg)</label>
                  <input name="targetWeightKg" type="number" required defaultValue={user.targetWeightKg || ''} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-teal-600/20 active:scale-95 transition-all text-sm tracking-widest">
              設定を保存して開始
            </button>
            <button type="button" onClick={logout} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest py-2 text-center">
              ログアウト
            </button>
          </form>
        </div>
      );
      default: return null;
    }
  };

  return <Layout currentView={currentView} setView={setView} isStaff={user.isStaff}>{renderContent()}</Layout>;
};

export default App;
