import React, { useState } from 'react';
import { ViewState, InBodyData, MealLog, ExerciseLog, UserProfile, Gender, JobActivity, LifestyleActivity } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InBodyManager from './components/InBodyManager';
import MealTracker from './components/MealTracker';
import ExercisePlan from './components/ExercisePlan';
import { Briefcase, Activity, Save, User as UserIcon } from 'lucide-react';

const INITIAL_USER: UserProfile = {
  name: "田中 太郎",
  age: 42,
  gender: Gender.MALE,
  heightCm: 175,
  targetWeightKg: 70,
  jobActivity: JobActivity.DESK,
  lifestyleActivity: LifestyleActivity.NONE
};

const INITIAL_INBODY: InBodyData[] = [
  { id: '1', date: '2023-10-01', weightKg: 82.5, bodyFatPercent: 28, muscleMassKg: 30, bmi: 26.9, score: 68 },
  { id: '2', date: '2023-11-15', weightKg: 78.5, bodyFatPercent: 26.0, muscleMassKg: 30.8, bmi: 25.6, score: 74 },
];

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [inBodyHistory, setInBodyHistory] = useState<InBodyData[]>(INITIAL_INBODY);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [exerciseLogs] = useState<ExerciseLog[]>([]);

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
    alert("プロフィールを保存しました。AIアドバイスが更新されます。");
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} inBodyHistory={inBodyHistory} mealLogs={mealLogs} setView={setView} />;
      case 'inbody': return <InBodyManager history={inBodyHistory} onAddEntry={d => setInBodyHistory([...inBodyHistory, d])} />;
      case 'meals': return <MealTracker logs={mealLogs} onAddLog={l => setMealLogs([...mealLogs, l])} />;
      case 'exercise': return <ExercisePlan logs={exerciseLogs} />;
      case 'profile': return (
        <div className="p-6 pb-24">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-2">
              <UserIcon size={40} />
            </div>
            <h2 className="text-xl font-bold">プロフィール設定</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">お名前</label>
                <input name="name" defaultValue={user.name} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">年齢</label>
                  <input name="age" type="number" defaultValue={user.age} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">性別</label>
                  <select name="gender" defaultValue={user.gender} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm">
                    {Object.values(Gender).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">身長 (cm)</label>
                  <input name="heightCm" type="number" defaultValue={user.heightCm} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">目標体重 (kg)</label>
                  <input name="targetWeightKg" type="number" defaultValue={user.targetWeightKg} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3 text-teal-600">
                <Briefcase size={18} />
                <h3 className="font-bold text-sm">仕事のスタイル</h3>
              </div>
              <select name="jobActivity" defaultValue={user.jobActivity} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm">
                {Object.values(JobActivity).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <Activity size={18} />
                <h3 className="font-bold text-sm">日常生活の運動習慣</h3>
              </div>
              <select name="lifestyleActivity" defaultValue={user.lifestyleActivity} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm">
                {Object.values(LifestyleActivity).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-100 hover:bg-teal-700 transition-colors">
              <Save size={20} /> 設定を保存して反映
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