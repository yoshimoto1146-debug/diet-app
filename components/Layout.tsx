import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Scale, Utensils, Activity, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'ホーム', icon: LayoutDashboard },
    { id: 'inbody', label: 'InBody', icon: Scale },
    { id: 'meals', label: '食事', icon: Utensils },
    { id: 'exercise', label: '運動', icon: Activity },
    { id: 'profile', label: '設定', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <header className="bg-white shadow-sm z-10 sticky top-0 safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              整
            </div>
            <h1 className="font-bold text-slate-800 text-lg">整骨院AIコーチ</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 relative max-w-md mx-auto w-full">
        {children}
      </main>

      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-20 pb-safe">
        <div className="max-w-md mx-auto flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`flex flex-col items-center py-3 px-1 w-full transition-colors duration-200 ${
                  isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;