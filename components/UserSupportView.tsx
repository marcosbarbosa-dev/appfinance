
import React from 'react';
import { useAuth } from '../App';

const UserSupportView: React.FC = () => {
  const { supportInfo, setIsSidebarOpen } = useAuth();
  
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Suporte</h2>
          <p className="text-slate-500">Canais de atendimento Personalle</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-8">
        <div className="w-24 h-24 bg-violet-50 text-violet-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-inner">
          <i className="fas fa-headset"></i>
        </div>
        
        <div className="space-y-4 max-w-lg w-full">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Suporte Personalle Infinity</h3>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {supportInfo || "Entre em contato através dos canais oficiais para obter ajuda com sua conta."}
            </p>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            Personalle Infinity Support Team
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSupportView;
