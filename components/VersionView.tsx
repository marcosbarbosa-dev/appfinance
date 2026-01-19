
import React from 'react';
import { useAuth } from '../App';

const VersionView: React.FC = () => {
  const { versionLink, versionText, versionBtnColor, versionBtnLabel, setIsSidebarOpen } = useAuth();
  
  const handleUpdateClick = () => {
    if (versionLink) {
      // Abre em uma nova página/aba fora da aplicação atual
      window.open(versionLink, '_blank', 'noopener,noreferrer');
    }
  };

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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Versão do Sistema</h2>
          <p className="text-slate-500 text-sm">Status e atualizações da plataforma</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 bg-violet-50 text-violet-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-inner">
            <i className="fas fa-code-branch"></i>
          </div>
        </div>
        
        <div className="space-y-4 max-w-lg w-full">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Personalle Infinity Premium</h3>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {versionText || "Você está utilizando a versão mais recente e segura do ecossistema Personalle. Nossa equipe trabalha diariamente para garantir a integridade dos seus dados e novas funcionalidades premium."}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {versionLink ? (
            <button 
              onClick={handleUpdateClick}
              style={{ backgroundColor: versionBtnColor || '#8b5cf6' }}
              className="w-full py-5 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 hover:brightness-110"
            >
              <i className="fas fa-cloud-arrow-down"></i>
              {versionBtnLabel || "Verificar Atualizações"}
            </button>
          ) : (
            <div className="w-full py-5 bg-slate-100 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 flex items-center justify-center gap-3 cursor-not-allowed">
              <i className="fas fa-check-circle"></i>
              Sistema Atualizado
            </div>
          )}
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Personalle Infinity Software Foundation
          </p>
        </div>
      </div>
    </div>
  );
};

export default VersionView;
