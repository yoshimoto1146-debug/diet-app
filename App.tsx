import React, { useState, useEffect } from 'react';
import { ViewState, InBodyData, MealLog, UserProfile, Gender, JobActivity, LifestyleActivity, DietGoal } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InBodyManager from './components/InBodyManager';
import MealTracker from './components/MealTracker';
import StaffPortal from './components/StaffPortal';
import { Lock, Settings2, ChevronLeft } from 'lucide-react';

const EMPTY_USER: UserProfile = {
  patientId: "",
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

    if (patientId === "STAFF999") {
      setUser({ ...EMPTY_USER, patientId: "STAFF", isStaff: true });
      setView('staff-portal');
      return;
    }

    if (patientId) {
      setUser({ ...user, patientId, isStaff: false });
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

  const updateMealLog = (updatedLog: MealLog) => {
    setMealLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };

  const deleteMealLog = (id: string) => {
    if (window.confirm('この記録を削除しますか？')) {
      setMealLogs(prev => prev.filter(log => log.id !== id));
    }
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans text-center">
        <div className="w-24 h-24 bg-teal-500 rounded-[32px] flex items-center justify-center text-5xl font-black mb-12 shadow-[0_20px_50px_rgba(20,184,166,0.4)] text-white">食</div>
        <h1 className="text-3xl font-black mb-3 leading-tight tracking-tight">AI食事管理<br/>ダイエットコーチ</h1>
        <p className="text-slate-400 text-sm mb-12 font-medium">診察券番号を入力して開始してください</p>
        
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="space-y-2.5 text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">診察券番号</label>
            <input name="patientId" required type="text" placeholder="12345678" className="w-full bg-slate-800 border-none rounded-3xl p-5 text-lg font-black focus:ring-4 focus:ring-teal-500/20 outline-none transition-all placeholder:text-slate-700 text-teal-400" />
          </div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-teal-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 text-base tracking-widest">
            ログイン <Lock size={20} />
          </button>
        </form>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} inBodyHistory={inBodyHistory} mealLogs={mealLogs} setView={setView} />;
      case 'inbody': return <InBodyManager history={inBodyHistory} onAddEntry={d => setInBodyHistory(prev => [...prev, d].sort((a,b) => a.date.localeCompare(b.date)))} onDeleteEntry={deleteInBodyEntry} />;
      case 'meals': return <MealTracker logs={mealLogs} onAddLog={l => setMealLogs(prev => [...prev, l])} onUpdateLog={updateMealLog} onDeleteLog={deleteMealLog} user={user} />;
      case 'staff-portal': return <StaffPortal logout={logout} />;
      case 'profile': return (
        <div className="p-6 pb-32">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 active:scale-90 transition-transform"><ChevronLeft size={24} /></button>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">基本設定</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="bg-white p-6 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">お名前</label>
                <input name="name" required placeholder="山田 花子" defaultValue={user.name} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-base font-bold focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ダイエットの目的</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[DietGoal.GENERAL, DietGoal.POSTPARTUM, DietGoal.POSTPARTUM_NURSING, DietGoal.DIABETES, DietGoal.HYPERTENSION, DietGoal.OTHER].map(goal => (
                    <label key={goal} className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${user.goal === goal ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}>
                      <input type="radio" name="goal" value={goal} checked={user.goal === goal} onChange={() => setUser({...user, goal})} className="hidden" />
                      <span className="text-[11px] font-black text-center leading-tight tracking-tighter">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
              {user.goal === DietGoal.OTHER && (
                <div className="p-6 bg-slate-900 rounded-[32px] space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 text-teal-400"><Settings2 size={18} /><span className="text-xs font-black uppercase tracking-[0.2em]">カスタム数値目標</span></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">目標カロリー</label><input name="customCal" type="number" defaultValue={user.customTargets?.calories || 2000} className="w-full bg-slate-800 border-none rounded-xl p-4 text-base text-teal-400 font-black outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">P (g)</label><input name="customP" type="number" defaultValue={user.customTargets?.protein || 100} className="w-full bg-slate-800 border-none rounded-xl p-4 text-base text-white font-black outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">F (g)</label><input name="customF" type="number" defaultValue={user.customTargets?.fat || 60} className="w-full bg-slate-800 border-none rounded-xl p-4 text-base text-white font-black outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">C (g)</label><input name="customC" type="number" defaultValue={user.customTargets?.carbs || 250} className="w-full bg-slate-800 border-none rounded-xl p-4 text-base text-white font-black outline-none" /></div>
                  </div>
                </div>
              )}
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-teal-600/30 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]">設定を保存</button>
            <button type="button" onClick={logout} className="w-full text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] py-4 text-center">ログアウト</button>
          </form>
        </div>
      );
      default: return null;
    }
  };

  return <Layout currentView={currentView} setView={setView} isStaff={user.isStaff}>{renderContent()}</Layout>;
};

export default App;
