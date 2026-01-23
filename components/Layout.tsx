import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Scale, Utensils, Activity, User, Users } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isStaff?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, isStaff }) => {
  if (currentView === 'login') return <>{children}</>;

  const navItems = isStaff ? [
    { id: 'staff-portal', label: '管理画面', icon: Users },
    { id: 'profile', label: '設定', icon: User },
  ] : [
    { id: 'dashboard', label: 'ホーム', icon: LayoutDashboard },
    { id: 'inbody', label: 'InBody', icon: Scale },
    { id: 'meals', label: '食事', icon: Utensils },
    { id: 'exercise', label: '運動', icon: Activity },
    { id: 'profile', label: '設定', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <header className="bg-white shadow-sm z-40 sticky top-0 safe-top border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${isStaff ? 'bg-indigo-600' : 'bg-teal-600'} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
              {isStaff ? '管' : '整'}
            </div>
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">{isStaff ? 'スタッフ管理パネル' : '整骨院AIコーチ'}</h1>
          </div>
          {isStaff && (
            <div className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-100">
              STAFF
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 relative max-w-md mx-auto w-full">
        {children}
      </main>

      <nav className="bg-white border-t border-slate-100 fixed bottom-0 w-full z-40 pb-safe">
        <div className="max-w-md mx-auto flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`flex flex-col items-center py-3 px-1 w-full transition-all duration-200 ${
                  isActive ? (isStaff ? 'text-indigo-600' : 'text-teal-600') : 'text-slate-300'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
