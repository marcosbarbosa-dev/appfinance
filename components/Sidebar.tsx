
import React from 'react';
import { useAuth } from '../App';

const LogoInfinity = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M18 50C18 32 38 32 50 50C62 68 82 68 82 50C82 32 62 32 50 50C38 68 18 68 18 50Z" 
      stroke="currentColor" 
      strokeWidth="9" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const Sidebar: React.FC = () => {
  const { user, logout, activeView, setActiveView, isSidebarOpen, setIsSidebarOpen, isOnline } = useAuth();

  const menuItems = user?.role === 'admin' ? [
    { id: 'dashboard', label: 'Dashboard Admin', icon: 'fas fa-shield-alt' },
    { id: 'usuarios', label: 'Usuários', icon: 'fas fa-users' },
    { id: 'logs', label: 'Logs do Sistema', icon: 'fas fa-history' },
    { id: 'meus_dados', label: 'Meus Dados', icon: 'fas fa-user-cog' },
    { id: 'suporte', label: 'Suporte', icon: 'fas fa-headset' },
  ] : [
    { id: 'inicio', label: 'Início', icon: 'fas fa-home' },
    { id: 'relatorio', label: 'Relatório', icon: 'fas fa-file-invoice-dollar' },
    { id: 'contas', label: 'Contas', icon: 'fas fa-university' },
    { id: 'categorias', label: 'Categorias', icon: 'fas fa-tags' },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'fas fa-exchange-alt' },
    { id: 'meus_dados', label: 'Meus Dados', icon: 'fas fa-user-cog' },
  ];

  const handleNavigate = (id: string) => {
    setActiveView(id);
    setIsSidebarOpen(false);
  };

  const formatSuspensionDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-950 text-slate-300 flex flex-col h-screen shadow-2xl z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
              <LogoInfinity className="w-6 h-6" />
            </div>
            <span className="text-lg font-black text-white tracking-tighter italic whitespace-nowrap">Personalle Infinity</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-2">
          <div className="relative group">
            <div className="w-20 h-20 rounded-[2.5rem] border-2 border-slate-800 bg-slate-900/50 flex items-center justify-center text-3xl text-slate-400 shadow-lg transition-transform group-hover:scale-105">
              <i className={`fas ${user?.avatar === 'female_shadow' ? 'fa-user-nurse' : 'fa-user'} opacity-70`}></i>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-slate-950 rounded-full flex items-center justify-center ${isOnline ? 'bg-violet-600' : 'bg-rose-500'}`}>
               <div className={`w-1.5 h-1.5 bg-white rounded-full ${isOnline ? 'animate-pulse' : ''}`}></div>
            </div>
          </div>
          <div className="text-center mt-2 flex flex-col items-center w-full px-2">
            <p className="text-white font-black leading-tight truncate w-full tracking-tight">{user?.name}</p>
            <p className="text-[10px] text-violet-400 uppercase tracking-widest font-black mt-1 mb-2">
              {user?.role === 'admin' ? 'System Controller' : 'PLATINUM'}
            </p>
            
            {!isOnline && (
              <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30">
                <i className="fas fa-wifi-slash text-[10px] text-rose-400"></i>
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Offline</span>
              </div>
            )}
            
            {user?.role !== 'admin' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 border border-slate-800/50 shadow-inner">
                {user?.suspensionDate ? (
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                    Vencimento: {formatSuspensionDate(user.suspensionDate)}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Vitalício</span>
                    <i className="fas fa-crown text-[10px] text-amber-400"></i>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeView === item.id 
                ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/30' 
                : 'hover:bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <i className={`${item.icon} w-5 text-center ${activeView === item.id ? 'text-white' : 'text-slate-600 group-hover:text-violet-400'}`}></i>
              <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <i className="fas fa-power-off text-sm"></i>
            <span className="font-black text-xs uppercase tracking-widest">Desconectar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
