import React, { useState } from 'react';
import { ExerciseLog } from '../types';
import { Dumbbell, Clock, Flame, PlayCircle } from 'lucide-react';

interface ExercisePlanProps {
  logs: ExerciseLog[];
}

// Mock suggested exercises relevant to a Seikotsuin in Japan
const SUGGESTED_EXERCISES = [
  { id: 1, name: "プランク", duration: 2, intensity: "Medium", tags: ["体幹", "安定性"] },
  { id: 2, name: "ドローイン", duration: 5, intensity: "Low", tags: ["インナーマッスル", "腰痛予防"] },
  { id: 3, name: "バードドッグ", duration: 5, intensity: "Low", tags: ["背中", "リハビリ"] },
  { id: 4, name: "ウォーキング", duration: 20, intensity: "Medium", tags: ["有酸素", "脂肪燃焼"] },
  { id: 5, name: "ストレッチポール", duration: 10, intensity: "Low", tags: ["姿勢改善", "リラックス"] },
];

const ExercisePlan: React.FC<ExercisePlanProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<'suggested' | 'history'>('suggested');

  return (
    <div className="p-4">
       <div className="flex items-center justify-between mb-6">
         <h2 className="text-xl font-bold text-slate-800">運動・リハビリ</h2>
         <div className="bg-white rounded-lg p-1 border border-slate-200 flex text-sm">
           <button 
             onClick={() => setActiveTab('suggested')}
             className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'suggested' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'}`}
           >
             おすすめ
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'history' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'}`}
           >
             履歴
           </button>
         </div>
       </div>

       {activeTab === 'suggested' && (
         <div className="space-y-4">
           <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
             <h3 className="font-bold text-indigo-900 mb-1">整骨院のポイント</h3>
             <p className="text-indigo-700 text-sm">
               強い負荷をかけるよりも、正しいフォームでインナーマッスルを刺激し、関節の安定性を高めることを重視しましょう。
             </p>
           </div>

           {SUGGESTED_EXERCISES.map((ex) => (
             <div key={ex.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                    <Dumbbell size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">{ex.name}</h4>
                   <div className="flex gap-2 text-xs text-slate-500 mt-1">
                     {ex.tags.map(t => <span key={t} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{t}</span>)}
                   </div>
                 </div>
               </div>
               <div className="text-right">
                 <div className="flex items-center gap-1 text-slate-600 text-xs justify-end">
                   <Clock size={12} /> {ex.duration} 分
                 </div>
                 <button className="mt-2 text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-slate-700">
                   <PlayCircle size={12} /> 開始
                 </button>
               </div>
             </div>
           ))}
         </div>
       )}

       {activeTab === 'history' && (
         <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Dumbbell size={48} className="mx-auto mb-2 opacity-20" />
                まだ運動記録がありません。
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{log.activity}</p>
                      <p className="text-xs text-slate-400">{log.date}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-orange-500 text-sm font-bold">
                         <Flame size={14} /> {log.caloriesBurned} kcal
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                         <Clock size={12} /> {log.durationMinutes} 分
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
         </div>
       )}
    </div>
  );
};

export default ExercisePlan;