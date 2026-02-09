import React from 'react';
import { ViewState } from './types';
import { LayoutDashboard, Scale, Utensils, User, Users } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isStaff?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, isStaff }) => {
  if (currentView === 'login') return <>{children}</>;

  const navItems = isStaff ? [
    { id: 'staff-portal', label: '管理', icon: Users },
    { id: 'profile', label: '設定', icon: User },
  ] : [
    { id: 'dashboard', label: 'ホーム', icon: LayoutDashboard },
    { id: 'inbody', label: '記録', icon: Scale },
    { id: 'meals', label: '食事', icon: Utensils },
    { id: 'profile', label: '設定', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-100 p-4">
        <h1 className="font-black text-slate-800 text-center uppercase tracking-widest text-sm">
          {isStaff ? 'Clinic Management' : 'AI Diet Coach'}
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto pb-24 max-w-md mx-auto w-full">
        {children}
      </main>
      <nav className="bg-white border-t border-slate-100 fixed bottom-0 w-full z-40">
        <div className="max-w-md mx-auto flex justify-around p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center p-2 w-full transition-all ${currentView === item.id ? 'text-teal-600' : 'text-slate-300'}`}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
export default Layout;
