
import React from 'react';
import { useAuth } from '../App';

const Sidebar: React.FC = () => {
  const { user, logout, activeView, setActiveView, isSidebarOpen, setIsSidebarOpen } = useAuth();

  const menuItems = user?.role === 'admin' ? [
    { id: 'dashboard', label: 'Dashboard Admin', icon: 'fas fa-shield-alt' },
    { id: 'usuarios', label: 'Usuários', icon: 'fas fa-users' },
    { id: 'logs', label: 'Logs do Sistema', icon: 'fas fa-history' },
    { id: 'meus_dados', label: 'Meus Dados', icon: 'fas fa-user-cog' },
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
    setIsSidebarOpen(false); // Fecha o menu ao navegar
  };

  return (
    <>
      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer - Cor Azul Marinho (blue-950) */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-blue-950 text-slate-300 flex flex-col h-screen shadow-2xl z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-violet-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
              <i className="fas fa-infinity text-lg"></i>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Personalle</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-blue-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-2">
          <div className="relative group">
            {/* Sombra Masculina/Feminina no Sidebar */}
            <div className="w-20 h-20 rounded-2xl border-2 border-blue-800 bg-blue-900/50 flex items-center justify-center text-3xl text-blue-400 shadow-lg transition-transform group-hover:scale-105">
              <i className={`fas ${user?.avatar === 'female_shadow' ? 'fa-user-nurse' : 'fa-user'} opacity-70`}></i>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-500 border-4 border-blue-950 rounded-full"></div>
          </div>
          <div className="text-center mt-2">
            <p className="text-white font-bold leading-tight">{user?.name}</p>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-black mt-1">
              {user?.role === 'admin' ? '🔥 System Admin' : '👤 Platinum User'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeView === item.id 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                : 'hover:bg-blue-900/50 hover:text-white'
              }`}
            >
              <i className={`${item.icon} w-5 text-center ${activeView === item.id ? 'text-white' : 'text-blue-400 group-hover:text-violet-400'}`}></i>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-blue-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span className="font-bold text-sm">Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
