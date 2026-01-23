import React, { useState, useEffect } from 'react';
import { ViewState, InBodyData, MealLog, ExerciseLog, UserProfile, Gender, JobActivity, LifestyleActivity } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InBodyManager from './components/InBodyManager';
import MealTracker from './components/MealTracker';
import ExercisePlan from './components/ExercisePlan';
import StaffPortal from './components/StaffPortal';
import { Briefcase, Activity, Save, User as UserIcon, Lock, Users } from 'lucide-react';

const EMPTY_USER: UserProfile = {
  patientId: "",
  clinicCode: "",
  name: "",
  age: 0,
  gender: Gender.MALE,
  heightCm: 0,
  targetWeightKg: 0,
  jobActivity: JobActivity.DESK,
  lifestyleActivity: LifestyleActivity.NONE
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
  }, []);

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
    const updated: UserProfile = {
      ...user,
      name: formData.get('name') as string,
      age: Number(formData.get('age')),
      gender: formData.get('gender') as Gender,
      heightCm: Number(formData.get('heightCm')),
      targetWeightKg: Number(formData.get('targetWeightKg')),
      jobActivity: formData.get('jobActivity') as JobActivity,
      lifestyleActivity: formData.get('lifestyleActivity') as LifestyleActivity,
    };
    setUser(updated);
    setView('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('diet_user');
    setUser(EMPTY_USER);
    setView('login');
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 shadow-2xl shadow-teal-500/20">整</div>
        <h1 className="text-2xl font-bold mb-2">整骨院AIダイエット</h1>
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
        <p className="mt-8 text-[10px] text-slate-500">IDをお持ちでない方は、受付スタッフまでお声がけください。</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} inBodyHistory={inBodyHistory} mealLogs={mealLogs} setView={setView} />;
      case 'inbody': return <InBodyManager history={inBodyHistory} onAddEntry={d => setInBodyHistory([...inBodyHistory, d].sort((a,b) => a.date.localeCompare(b.date)))} />;
      case 'meals': return <MealTracker logs={mealLogs} onAddLog={l => setMealLogs([...mealLogs, l])} user={user} />;
      case 'exercise': return <ExercisePlan logs={exerciseLogs} />;
      case 'staff-portal': return <StaffPortal logout={logout} />;
      case 'profile': return (
        <div className="p-6 pb-24">
          <h2 className="text-xl font-bold mb-6">プロフィール設定</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">お名前</label>
                <input name="name" required placeholder="例：山田 太郎" defaultValue={user.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">年齢</label>
                  <input name="age" type="number" required placeholder="例：30" defaultValue={user.age || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">性別</label>
                  <select name="gender" defaultValue={user.gender} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                    {Object.values(Gender).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">身長 (cm)</label>
                  <input name="heightCm" type="number" required placeholder="例：170" defaultValue={user.heightCm || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">目標体重 (kg)</label>
                  <input name="targetWeightKg" type="number" required placeholder="例：60" defaultValue={user.targetWeightKg || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95">設定を保存</button>
            <button type="button" onClick={logout} className="w-full text-slate-400 text-xs py-4">ログアウトしてIDを変更する</button>
          </form>
        </div>
      );
      default: return null;
    }
  };

  return <Layout currentView={currentView} setView={setView} isStaff={user.isStaff}>{renderContent()}</Layout>;
};

export default App;
