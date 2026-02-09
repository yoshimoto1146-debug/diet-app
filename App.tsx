import React, { useState, useEffect } from 'react';
import { ViewState, InBodyData, MealLog, UserProfile, Gender, JobActivity, LifestyleActivity, DietGoal } from './types';
import Layout from './Layout';
import Dashboard from './Dashboard';
import InBodyManager from './InBodyManager';
import MealTracker from './MealTracker';
import StaffPortal from './StaffPortal';
import { ChevronLeft } from 'lucide-react';

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

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const patientId = new FormData(e.currentTarget).get('patientId') as string;
    if (patientId === "STAFF999") {
      setUser({ ...EMPTY_USER, patientId: "STAFF", isStaff: true });
      setView('staff-portal');
    } else if (patientId) {
      setUser({ ...user, patientId, isStaff: false });
      setView(user.name ? 'dashboard' : 'profile');
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(EMPTY_USER);
    setView('login');
  };

  const renderContent = () => {
    if (currentView === 'login') return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl mx-auto mb-8 shadow-lg flex items-center justify-center text-white font-black text-2xl">D</div>
          <input name="patientId" required placeholder="診察券番号を入力" className="w-full bg-white p-4 rounded-2xl shadow-sm outline-none border border-slate-100 font-bold" />
          <button className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-600/20">ログイン</button>
        </form>
      </div>
    );

    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} inBodyHistory={inBodyHistory} mealLogs={mealLogs} setView={setView} />;
      case 'inbody': return <InBodyManager history={inBodyHistory} onAddEntry={d => setInBodyHistory(prev => [...prev, d].sort((a,b) => b.date.localeCompare(a.date)))} />;
      case 'meals': return <MealTracker logs={mealLogs} onAddLog={l => setMealLogs(prev => [...prev, l])} onDeleteLog={id => setMealLogs(prev => prev.filter(m => m.id !== id))} user={user} />;
      case 'staff-portal': return <StaffPortal logout={logout} />;
      case 'profile': return (
        <div className="p-6">
          <button onClick={() => setView('dashboard')} className="mb-8 p-2 bg-white rounded-full shadow-sm"><ChevronLeft size={20} /></button>
          <form onSubmit={e => { e.preventDefault(); setView('dashboard'); }} className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-xl space-y-4">
              <input name="name" required placeholder="お名前" defaultValue={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none font-bold" />
              <select value={user.goal} onChange={e => setUser({...user, goal: e.target.value as DietGoal})} className="w-full bg-slate-50 p-4 rounded-xl outline-none font-bold">
                {Object.values(DietGoal).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <button className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl">保存する</button>
            <button type="button" onClick={logout} className="w-full text-rose-400 font-bold">ログアウト</button>
          </form>
        </div>
      );
      default: return null;
    }
  };

  return <Layout currentView={currentView} setView={setView} isStaff={user.isStaff}>{renderContent()}</Layout>;
};
export default App;
