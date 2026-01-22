import React, { useState, useEffect } from 'react';
import { ViewState, InBodyData, MealLog, ExerciseLog, UserProfile, Gender, JobActivity, LifestyleActivity } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InBodyManager from './components/InBodyManager';
import MealTracker from './components/MealTracker';
import ExercisePlan from './components/ExercisePlan';
import { Briefcase, Activity, Save, User as UserIcon } from 'lucide-react';

const EMPTY_USER: UserProfile = {
  name: "",
  age: 0,
  gender: Gender.MALE,
  heightCm: 0,
  targetWeightKg: 0,
  jobActivity: JobActivity.DESK,
  lifestyleActivity: LifestyleActivity.NONE
};

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('dashboard');
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
    localStorage.setItem('diet_user', JSON.stringify(user));
    localStorage.setItem('diet_inbody', JSON.stringify(inBodyHistory));
    localStorage.setItem('diet_meals', JSON.stringify(mealLogs));
  }, [user, inBodyHistory, mealLogs]);

  // プロフィールが未設定なら設定画面へ誘導
  const isProfileEmpty = !user.name || user.heightCm === 0;

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated: UserProfile = {
      name: formData.get('name') as string,
      age: Number(formData.get('age')),
      gender: formData.get('gender') as Gender,
      heightCm: Number(formData.get('heightCm')),
      targetWeightKg: Number(formData.get('targetWeightKg')),
      jobActivity: formData.get('jobActivity') as JobActivity,
      lifestyleActivity: formData.get('lifestyleActivity') as LifestyleActivity,
    };
    setUser(updated);
    alert("プロフィールを保存しました！");
    setView('dashboard');
  };

  const renderContent = () => {
    if (isProfileEmpty && currentView !== 'profile') {
      return (
        <div className="p-8 text-center mt-20">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto mb-6">
            <UserIcon size={40} />
          </div>
          <h2 className="text-xl font-bold mb-2">まずは設定をしましょう</h2>
          <p className="text-slate-500 text-sm mb-8">AIコーチがあなたに合わせたプランを作成します。</p>
          <button 
            onClick={() => setView('profile')}
            className="bg-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg"
          >
            設定を始める
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} inBodyHistory={inBodyHistory} mealLogs={mealLogs} setView={setView} />;
      case 'inbody': return <InBodyManager history={inBodyHistory} onAddEntry={d => setInBodyHistory([...inBodyHistory, d].sort((a,b) => a.date.localeCompare(b.date)))} />;
      case 'meals': return <MealTracker logs={mealLogs} onAddLog={l => setMealLogs([...mealLogs, l])} />;
      case 'exercise': return <ExercisePlan logs={exerciseLogs} />;
      case 'profile': return (
        <div className="p-6 pb-24">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-xl font-bold">プロフィール設定</h2>
          </div>
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

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3 text-teal-600">
                <Briefcase size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider">仕事のスタイル</h3>
              </div>
              <select name="jobActivity" defaultValue={user.jobActivity} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                {Object.values(JobActivity).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <Activity size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider">日常生活の運動習慣</h3>
              </div>
              <select name="lifestyleActivity" defaultValue={user.lifestyleActivity} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                {Object.values(LifestyleActivity).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-100 hover:bg-teal-700 transition-colors active:scale-[0.98]">
              <Save size={20} /> 設定を保存する
            </button>
          </form>
        </div>
      );
      default: return null;
    }
  };

  return <Layout currentView={currentView} setView={setView}>{renderContent()}</Layout>;
};

export default App;
