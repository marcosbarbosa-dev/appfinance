
import React, { useMemo } from 'react';
import { useAuth } from '../App';

const AdminDashboard: React.FC = () => {
  const { allUsers, logs, isSystemLocked, isLoggingEnabled, setActiveView, setIsSidebarOpen } = useAuth();

  const stats = useMemo(() => {
    const total = allUsers.length;
    const today = new Date().toISOString().split('T')[0];
    
    const active = allUsers.filter(u => {
      const isAutoSuspended = u.suspensionDate && today >= u.suspensionDate;
      return u.isActive && !isAutoSuspended;
    }).length;

    const suspended = total - active;

    return { total, active, suspended };
  }, [allUsers]);

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto pb-32">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="group w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-violet-600 hover:border-violet-100 transition-all shadow-sm active:scale-95"
          >
            <i className="fas fa-bars-staggered group-hover:rotate-12 transition-transform"></i>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Central de Monitoramento</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
              Operacional / Admin Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Estado Global</p>
              <p className={`text-xs font-black ${isSystemLocked ? 'text-rose-400' : 'text-emerald-500'}`}>
                {isSystemLocked ? 'RESTRITO' : 'LIBERADO'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSystemLocked ? 'bg-rose-50 text-rose-400' : 'bg-emerald-50 text-emerald-500'}`}>
               <i className={`fas ${isSystemLocked ? 'fa-lock' : 'fa-check-double'} text-sm`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Total Users Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50/20 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 bg-violet-500 text-white rounded-[1.5rem] flex items-center justify-center text-xl shadow-lg shadow-violet-100">
              <i className="fas fa-users"></i>
            </div>
            <span className="px-3 py-1 bg-violet-50 text-violet-400 text-[10px] font-black rounded-full uppercase tracking-tighter">Database</span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{stats.total}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Contas Registradas</p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
            <button onClick={() => setActiveView('usuarios')} className="text-[10px] font-black text-violet-400 hover:text-violet-600 uppercase tracking-widest hover:gap-2 flex items-center gap-1 transition-all">
              Gestão de Membros <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/20 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 bg-emerald-400 text-white rounded-[1.5rem] flex items-center justify-center text-xl shadow-lg shadow-emerald-100">
              <i className="fas fa-user-check"></i>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-tighter">Live Access</span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-emerald-500 tracking-tighter">{stats.active}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Licenças Ativas</p>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${(stats.active / (stats.total || 1)) * 100}%` }}></div>
            </div>
            <span className="text-[10px] font-black text-emerald-500">{((stats.active / (stats.total || 1)) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Suspended Users Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/20 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 bg-rose-400 text-white rounded-[1.5rem] flex items-center justify-center text-xl shadow-lg shadow-rose-100">
              <i className="fas fa-user-slash"></i>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-400 text-[10px] font-black rounded-full uppercase tracking-tighter">Inactive</span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-rose-400 tracking-tighter">{stats.suspended}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Acessos Restritos</p>
          </div>

          <div className="mt-8">
            <div className="px-4 py-2 bg-rose-50/50 rounded-2xl border border-rose-100 inline-block">
               <p className="text-[10px] text-rose-400 font-bold uppercase italic tracking-tighter">Verificar validades pendentes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* System Monitoring Card */}
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
              <i className="fas fa-microchip text-slate-200 text-[12rem]"></i>
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h4 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.3)] ${isLoggingEnabled ? 'bg-violet-400' : 'bg-slate-300'}`}></span>
                  Monitoração
                </h4>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                   <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${isLoggingEnabled ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Registros de Logs</p>
                      </div>
                   </div>
                   <span className={`text-[10px] font-black ${isLoggingEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>{isLoggingEnabled ? 'ATIVO' : 'OFFLINE'}</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                   <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${!isSystemLocked ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Status do Servidor</p>
                      </div>
                   </div>
                   <span className={`text-[10px] font-black ${!isSystemLocked ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {!isSystemLocked ? 'ONLINE' : 'LOCKED'}
                   </span>
                </div>
              </div>
           </div>
        </div>

        {/* Activity Stream */}
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-10">
              <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <i className="fas fa-bolt text-amber-300"></i>
                 Atividades
              </h4>
              <button onClick={() => setActiveView('logs')} className="text-[10px] font-black text-slate-400 hover:text-violet-500 transition-colors uppercase tracking-widest">Ver Todos</button>
           </div>

           <div className="flex-1 space-y-4">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-5 p-4 hover:bg-slate-50 rounded-[2rem] transition-all border border-transparent hover:border-slate-100 group">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 text-sm group-hover:bg-violet-50 group-hover:text-violet-400 transition-all">
                        <i className={`fas ${log.action === 'login' ? 'fa-fingerprint' : 'fa-gear'}`}></i>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{log.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{log.action}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[8px] font-bold text-slate-200">HOJE</p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-200">
                   <i className="fas fa-wind text-4xl mb-4 opacity-10"></i>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tráfego Silencioso</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
