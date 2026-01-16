
import React, { useState } from 'react';
import { useAuth } from '../App';

const SupportManager: React.FC = () => {
  const { supportInfo, setSupportInfo, maintenanceMessage, setMaintenanceMessage, isSystemLocked, setIsSystemLocked, triggerGlobalRefresh, setIsSidebarOpen, user: loggedAdmin, addLog, checkInternet } = useAuth();
  const [tempSupport, setTempSupport] = useState(supportInfo);
  const [tempMaintenance, setTempMaintenance] = useState(maintenanceMessage);
  const [tempLocked, setTempLocked] = useState(isSystemLocked);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para comandos manuais do ADM
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [actionError, setActionError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await setSupportInfo(tempSupport);
    await setMaintenanceMessage(tempMaintenance);
    await setIsSystemLocked(tempLocked);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const executeKickAll = async () => {
    if (!checkInternet() || !loggedAdmin) return;
    if (adminPassword !== loggedAdmin.password) {
      setActionError('Senha administrativa incorreta.');
      return;
    }
    await setIsSystemLocked(true);
    setTempLocked(true);
    addLog(loggedAdmin, 'edit_user', 'Acesso global bloqueado: Desconexão forçada enviada.');
    setShowKickConfirm(false);
    setAdminPassword('');
    setActionError('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const executeGlobalRefresh = async () => {
    if (!checkInternet() || !loggedAdmin) return;
    if (adminPassword !== loggedAdmin.password) {
      setActionError('Senha administrativa incorreta.');
      return;
    }
    await triggerGlobalRefresh();
    addLog(loggedAdmin, 'edit_user', 'Comando manual de Refresh Global disparado.');
    setShowRefreshConfirm(false);
    setAdminPassword('');
    setActionError('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 transition-all"><i className="fas fa-bars"></i></button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gerenciar Suporte</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Controles Manuais & Segurança</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Desconexão Global */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-lg shadow-amber-50/20 flex flex-col items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-plug-circle-xmark"></i></div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Desconexão</p>
              <p className="text-xs text-slate-400 font-medium">Encerrar sessões de todos os usuários Platinum.</p>
            </div>
          </div>
          <button onClick={() => { setAdminPassword(''); setActionError(''); setShowKickConfirm(true); }} className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95">Desconectar Todos Agora</button>
        </div>

        {/* Refresh Global Manual */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-sky-100 shadow-lg shadow-sky-50/20 flex flex-col items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-sync-alt"></i></div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Refresh Global</p>
              <p className="text-xs text-slate-400 font-medium">Forçar atualização manual de todos os navegadores.</p>
            </div>
          </div>
          <button onClick={() => { setAdminPassword(''); setActionError(''); setShowRefreshConfirm(true); }} className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95">Atualizar Todos (Refresh)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-headset text-emerald-500"></i>Canais de Suporte</h3>
            <textarea value={tempSupport} onChange={(e) => setTempSupport(e.target.value)} className="w-full h-24 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all text-sm" placeholder="Texto de suporte..." />
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-lock text-rose-500"></i>Trava do Sistema</h3>
              <button type="button" onClick={() => setTempLocked(!tempLocked)} className={`w-12 h-6 rounded-full relative transition-all duration-300 flex items-center px-0.5 ${tempLocked ? 'bg-rose-500 shadow-lg' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center transition-all ${tempLocked ? 'translate-x-6' : 'translate-x-0'}`}><i className={`fas ${tempLocked ? 'fa-lock' : 'fa-unlock'} text-[8px]`}></i></div></button>
            </div>
            <textarea value={tempMaintenance} onChange={(e) => setTempMaintenance(e.target.value)} className="w-full h-24 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all text-sm" placeholder="Mensagem de manutenção..." />
          </div>

          <button type="submit" disabled={isSaving} className={`w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all ${tempLocked ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-950 hover:bg-slate-900'}`}>{isSaving ? 'Salvando...' : 'Publicar Alterações'}</button>
        </form>

        <div className="bg-slate-100/40 p-8 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
           <div className="bg-white w-full max-w-[240px] rounded-[3rem] shadow-2xl p-6 space-y-4 text-center">
              <div className={`w-16 h-16 mx-auto ${tempLocked ? 'bg-rose-50 text-rose-500' : 'bg-violet-50 text-violet-500'} rounded-3xl flex items-center justify-center text-2xl`}><i className={`fas ${tempLocked ? 'fa-shield-virus' : 'fa-headset'}`}></i></div>
              <p className="text-xs font-bold text-slate-800">{tempLocked ? 'Acesso Restrito' : 'Suporte Ativo'}</p>
              <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] text-slate-500 italic leading-relaxed">{tempLocked ? tempMaintenance : tempSupport}</p></div>
           </div>
        </div>
      </div>

      {/* Modais de Confirmação Crítica */}
      {(showKickConfirm || showRefreshConfirm) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <div className={`w-20 h-20 mx-auto ${showRefreshConfirm ? 'bg-sky-500' : 'bg-amber-600'} text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl`}>
              <i className={`fas ${showRefreshConfirm ? 'fa-sync-alt' : 'fa-plug-circle-xmark'}`}></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">{showRefreshConfirm ? 'Sincronização Global' : 'Segurança Global'}</h3>
            <p className="text-sm text-slate-500 font-medium">{showRefreshConfirm ? 'Todos os clientes recarregarão a página agora.' : 'Todos os clientes Platinum serão desconectados.'}</p>
            <div className="space-y-4">
              <input type="password" placeholder="Senha Administrativa" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold focus:ring-2 focus:ring-slate-500 outline-none"/>
              {actionError && <p className="text-[10px] text-rose-600 font-black uppercase">{actionError}</p>}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={showRefreshConfirm ? executeGlobalRefresh : executeKickAll} className={`w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all ${showRefreshConfirm ? 'bg-sky-600 hover:bg-sky-700' : 'bg-amber-600 hover:bg-amber-700'}`}>Confirmar Comando</button>
              <button onClick={() => { setShowKickConfirm(false); setShowRefreshConfirm(false); setAdminPassword(''); setActionError(''); }} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          <span className="text-xs font-black uppercase tracking-widest">Sincronizado</span>
        </div>
      )}
    </div>
  );
};

export default SupportManager;
