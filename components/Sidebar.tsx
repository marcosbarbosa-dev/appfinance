
import React from 'react';
import { useAuth } from '../App';

export const AvatarIcon = ({ type, className = "w-full h-full" }: { type: string; className?: string }) => {
  if (type === 'female_shadow') {
    return (
      <svg viewBox="0 0 128 128" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="64" fill="#F1F5F9"/>
        <path d="M64 28C52.9543 28 44 36.9543 44 48C44 59.0457 52.9543 68 64 68C75.0457 68 84 59.0457 84 48C84 36.9543 75.0457 28 64 28Z" fill="#94A3B8"/>
        <path d="M28 102C28 85.4315 41.4315 72 58 72H70C86.5685 72 100 85.4315 100 102V108H28V102Z" fill="#94A3B8"/>
        <path d="M44 48C44 35 52 30 64 30C76 30 84 35 84 48C84 55 78 58 64 58C50 58 44 55 44 48Z" fill="#64748B" opacity="0.3"/>
      </svg>
    );
  }
  // Default Male Shadow
  return (
    <svg viewBox="0 0 128 128" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="64" cy="64" r="64" fill="#F1F5F9"/>
      <path d="M64 32C55.1634 32 48 39.1634 48 48C48 56.8366 55.1634 64 64 64C72.8366 64 80 56.8366 80 48C80 39.1634 72.8366 32 64 32Z" fill="#94A3B8"/>
      <path d="M32 104C32 86.3269 46.3269 72 64 72C81.6731 72 96 86.3269 96 104V108H32V104Z" fill="#94A3B8"/>
    </svg>
  );
};

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
    { id: 'dashboard', label: 'Monitoração', icon: 'fas fa-shield-alt' },
    { id: 'usuarios', label: 'Usuários', icon: 'fas fa-users' },
    { id: 'logs', label: 'Logs do System', icon: 'fas fa-history' },
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
            <div className="bg-violet-600 p-2 rounded-xl text-white">
              <LogoInfinity className="w-6 h-6" />
            </div>
            <span className="text-lg font-black text-white italic whitespace-nowrap">Personalle Infinity</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-2">
          <div className="relative group">
            <div className="w-20 h-20 rounded-[2.5rem] border-2 border-slate-800 bg-slate-900 flex items-center justify-center overflow-hidden">
              <AvatarIcon type={user?.avatar || 'male_shadow'} className="w-full h-full" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-slate-950 rounded-full ${isOnline ? 'bg-violet-600' : 'bg-rose-500'}`}></div>
          </div>
          <div className="text-center mt-2">
            <p className="text-white font-black truncate max-w-[180px]">{user?.name}</p>
            <p className="text-[10px] text-violet-400 uppercase tracking-widest font-black">
              {user?.role === 'admin' ? 'Controller' : 'PLATINUM'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                activeView === item.id 
                ? 'bg-violet-600 text-white shadow-lg' 
                : 'hover:bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <i className="fas fa-power-off text-sm"></i>
            <span className="font-black text-xs uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
