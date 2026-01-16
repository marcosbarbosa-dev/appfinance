
import React, { useState } from 'react';
import { useAuth } from '../App';
import { LogAction } from '../types';

const LogsPanel: React.FC = () => {
  const { logs, setIsSidebarOpen, deleteLog, clearLogs, isLoggingEnabled, setIsLoggingEnabled } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getLogIcon = (action: LogAction) => {
    switch (action) {
      case 'login': return { icon: 'fa-sign-in-alt', color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'logout': return { icon: 'fa-sign-out-alt', color: 'text-slate-400', bg: 'bg-slate-50' };
      case 'create_user': return { icon: 'fa-user-plus', color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'delete_user': return { icon: 'fa-user-xmark', color: 'text-rose-500', bg: 'bg-rose-50' };
      case 'edit_user': return { icon: 'fa-user-pen', color: 'text-violet-500', bg: 'bg-violet-50' };
      default: return { icon: 'fa-info-circle', color: 'text-slate-400', bg: 'bg-slate-50' };
    }
  };

  const parseLogDetails = (rawDetails: any) => {
    const details = rawDetails || '';

    if (details.includes('| Usuário Alvo:')) {
      const parts = details.split('| Usuário Alvo:');
      return {
        modificacao: parts[0].trim(),
        alvo: parts[1].trim()
      };
    }
    
    if (details.includes('Novo usuário cadastrado:')) {
      return { 
        modificacao: 'Usuário cadastrado no sistema', 
        alvo: details.split(': ')[1] || 'N/A' 
      };
    }
    
    if (details.includes('Usuário removido:')) {
      return { 
        modificacao: 'Remoção total do banco de dados', 
        alvo: details.split(': ')[1] || 'N/A' 
      };
    }
    
    return {
      modificacao: details || 'Ação registrada',
      alvo: 'N/A'
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm transition-all"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Auditoria</h2>
            <p className="text-slate-500 text-xs">Apenas ações administrativas registradas</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Botão de Toggle On/Off para Logs */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs</span>
            <button 
              onClick={() => setIsLoggingEnabled(!isLoggingEnabled)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 flex items-center px-1 ${
                isLoggingEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 'bg-rose-500'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center transition-all duration-300 ${
                isLoggingEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}>
                <span className={`text-[7px] font-black uppercase ${isLoggingEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isLoggingEnabled ? 'On' : 'Off'}
                </span>
              </div>
            </button>
          </div>

          {logs.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <i className="fas fa-trash-sweep"></i>
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {logs.length > 0 ? (
          logs.map((log) => {
            const { icon, color, bg } = getLogIcon(log.action);
            const { modificacao, alvo } = parseLogDetails(log.details);
            const fullDate = formatDate(log.timestamp);

            return (
              <div key={log.id} className="bg-white p-4 md:px-6 md:py-4 rounded-2xl border border-slate-100 shadow-sm flex items-start md:items-center gap-4 group transition-all hover:border-slate-200">
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                  <i className={`fas ${icon} text-sm`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                    <span className="text-[11px] font-black text-slate-400 font-mono tracking-tighter shrink-0">
                      {fullDate}
                    </span>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-slate-200 shrink-0"></div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 truncate">
                      <span className="text-slate-400 font-normal">Por ADM:</span> {log.userName}
                    </p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-xs md:text-sm font-bold text-slate-800 break-words leading-tight">
                      {modificacao}
                    </p>
                    {alvo !== 'N/A' && (
                      <p className="text-[10px] md:text-xs font-medium text-violet-500 truncate italic">
                        Alvo: {alvo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center h-full">
                  <button 
                    onClick={() => setLogToDelete(log.id)}
                    className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-sm hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                    title="Excluir este log"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <i className="fas fa-history text-3xl"></i>
            </div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">
              {isLoggingEnabled ? 'Sem registros no momento' : 'Sistema de Auditoria Desativado'}
            </p>
          </div>
        )}
      </div>

      {logToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl">
              <i className="fas fa-trash-can"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Apagar Registro?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Esta informação será removida permanentemente da trilha de auditoria.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setLogToDelete(null)}
                className="flex-1 py-3.5 text-slate-400 font-bold text-xs hover:bg-slate-100 rounded-xl transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={() => {
                  deleteLog(logToDelete);
                  setLogToDelete(null);
                }}
                className="flex-1 py-3.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl animate-pulse">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Limpeza Total</h3>
              <p className="text-xs text-slate-500 font-medium">Todos os logs serão apagados de uma só vez. Esta operação é irreversível.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  clearLogs();
                  setShowClearConfirm(false);
                }}
                className="w-full py-4 bg-rose-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-300 hover:bg-rose-700 transition-all uppercase tracking-widest"
              >
                Confirmar Limpeza
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-4 text-slate-400 font-bold text-xs hover:text-slate-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPanel;
