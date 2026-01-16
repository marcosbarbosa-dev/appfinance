
import React, { useState } from 'react';
import { useAuth } from '../App';

const SupportManager: React.FC = () => {
  const { supportInfo, setSupportInfo, maintenanceMessage, setMaintenanceMessage, isSystemLocked, setIsSystemLocked, setIsSidebarOpen } = useAuth();
  const [tempSupport, setTempSupport] = useState(supportInfo);
  const [tempMaintenance, setTempMaintenance] = useState(maintenanceMessage);
  const [tempLocked, setTempLocked] = useState(isSystemLocked);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Publish all changes at once
    await setSupportInfo(tempSupport);
    await setMaintenanceMessage(tempMaintenance);
    await setIsSystemLocked(tempLocked);
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gerenciar Suporte</h2>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Editor de Comunicação e Segurança</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna de Edição (Editor de Conteúdo) */}
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Bloco 1: Suporte Operacional */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-headset text-sm"></i>
                  </div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Canais de Suporte</h3>
                </div>
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">On-line</span>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">Mensagem de Contato</label>
                <textarea
                  value={tempSupport}
                  onChange={(e) => setTempSupport(e.target.value)}
                  className="w-full h-28 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none text-slate-700 text-sm font-medium shadow-inner"
                  placeholder="Ex: Entre em contato pelo WhatsApp (11) 99999-9999"
                />
                <p className="text-[9px] text-slate-400 italic px-1 leading-relaxed">Informações visíveis quando o sistema está operando normalmente.</p>
              </div>
            </div>

            {/* Bloco 2: Bloqueio e Manutenção */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-lock text-sm"></i>
                  </div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Bloqueio do Sistema</h3>
                </div>
                
                {/* Switch de Ativação - Local (tempLocked) */}
                <button 
                  type="button"
                  onClick={() => setTempLocked(!tempLocked)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 flex items-center px-0.5 ${
                    tempLocked ? 'bg-rose-500 shadow-lg shadow-rose-100' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 ${
                    tempLocked ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                    <i className={`fas ${tempLocked ? 'fa-lock text-rose-500' : 'fa-unlock text-slate-400'} text-[8px]`}></i>
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Mensagem de Manutenção</label>
                  {tempLocked && <span className="text-[8px] font-black text-rose-500 animate-pulse uppercase">Modo de Bloqueio</span>}
                </div>
                <textarea
                  value={tempMaintenance}
                  onChange={(e) => setTempMaintenance(e.target.value)}
                  className={`w-full h-28 px-4 py-3 rounded-2xl border outline-none transition-all resize-none text-sm font-medium shadow-inner ${
                    tempLocked ? 'border-rose-100 bg-rose-50/20 focus:bg-white focus:ring-rose-500' : 'border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-violet-500'
                  }`}
                  placeholder="Ex: Estamos realizando melhorias. Previsão de retorno: 18h."
                />
                <div className={`p-2.5 rounded-xl text-[9px] font-bold flex items-center gap-2 ${tempLocked ? 'bg-rose-100/50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <i className="fas fa-circle-info text-xs"></i>
                  {tempLocked 
                    ? 'AVISO: Ao publicar, todos usuários não-admins serão deslogados imediatamente.' 
                    : 'O sistema está aberto para todos os usuários.'}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 ${
                  tempLocked ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-slate-950 hover:bg-slate-900 shadow-slate-200'
                }`}
              >
                <i className={isSaving ? "fas fa-circle-notch animate-spin" : tempLocked ? "fas fa-shield-halved" : "fas fa-cloud-arrow-up"}></i>
                {isSaving ? 'Salvando...' : tempLocked ? 'Publicar Bloqueio Global' : 'Publicar Alterações'}
              </button>
              
              {showSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <i className="fas fa-check-double"></i>
                  Sincronizado e propagado com sucesso
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Coluna de Simulação (Preview) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <i className="fas fa-desktop text-xs"></i>
              Visualização de Tela
            </h3>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${tempLocked ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>
              {tempLocked ? 'Preview: Bloqueio Total' : 'Preview: Operacional'}
            </span>
          </div>

          <div className="bg-slate-100/40 p-10 rounded-[4rem] border-4 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden min-h-[500px]">
             {tempLocked && (
               <div className="absolute inset-0 bg-rose-500/5 backdrop-blur-[1px] z-0"></div>
             )}
             
             {/* Mockup de Celular/Modal */}
             <div className="bg-white w-full max-w-[280px] rounded-[3.5rem] shadow-2xl border border-white p-8 space-y-6 scale-95 md:scale-100 relative z-10 transition-all duration-700 transform hover:rotate-1">
                <div className={`w-20 h-20 mx-auto ${tempLocked ? 'bg-rose-50 text-rose-500' : 'bg-violet-50 text-violet-500'} rounded-[2.2rem] flex items-center justify-center text-3xl shadow-inner transition-colors duration-500`}>
                  <i className={`fas ${tempLocked ? 'fa-shield-virus' : 'fa-headset'}`}></i>
                </div>
                
                <div className="text-center space-y-4">
                  <h4 className="font-black text-slate-800 text-base tracking-tight">
                    {tempLocked ? 'Acesso Interrompido' : 'Central de Suporte'}
                  </h4>
                  <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100 shadow-inner">
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                      {tempLocked 
                        ? (tempMaintenance || 'Estamos realizando uma manutenção preventiva para sua segurança...') 
                        : (tempSupport || 'Conte com nossa equipe para qualquer dúvida ou suporte técnico.')}
                    </p>
                  </div>
                </div>

                <button type="button" className={`w-full py-4 ${tempLocked ? 'bg-rose-600 shadow-rose-100' : 'bg-slate-900 shadow-slate-200'} text-white font-black rounded-2xl text-[9px] uppercase tracking-[0.2em] pointer-events-none opacity-90 shadow-lg transition-all duration-500`}>
                  {tempLocked ? 'Sistema Bloqueado' : 'Continuar'}
                </button>
             </div>
          </div>
          
          {/* Alerta de Segurança */}
          <div className={`p-6 rounded-[2.5rem] border flex items-start gap-4 transition-all duration-500 ${tempLocked ? 'bg-rose-950 text-rose-100 border-rose-900' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${tempLocked ? 'bg-rose-600 text-white' : 'bg-violet-600 text-white'}`}>
              <i className={`fas ${tempLocked ? 'fa-triangle-exclamation' : 'fa-shield-halved'}`}></i>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-tight">{tempLocked ? 'Manutenção Ativa' : 'Blindagem Operacional'}</p>
              <p className="text-[10px] leading-relaxed font-bold opacity-60 italic">
                {tempLocked 
                  ? 'Atenção: A publicação do bloqueio causará o encerramento automático da sessão de todos os usuários Platinum.' 
                  : 'O sistema está seguro e acessível. Mantenha os canais de suporte atualizados para o bem-estar dos membros.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportManager;
