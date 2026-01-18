
import React, { useMemo } from 'react';
import { useAuth } from '../App';

const UserNoticeOverlay: React.FC = () => {
  const { notices, acknowledgedNoticeIds, acknowledgeNotice, user } = useAuth();

  // Encontra o primeiro aviso ativo que o usuário logado ainda não deu ciência
  const pendingNotice = useMemo(() => {
    if (!user) return null;
    return notices.find(n => n.isActive && !acknowledgedNoticeIds.includes(n.id));
  }, [notices, acknowledgedNoticeIds, user]);

  if (!pendingNotice) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-500">
        <div className="p-8 md:p-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-violet-600 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-xl shadow-violet-200">
              <i className="fas fa-bullhorn"></i>
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              {pendingNotice.title}
            </h3>
            <div className="max-h-48 overflow-y-auto custom-scrollbar px-2">
              <p className="text-sm text-slate-500 font-medium leading-relaxed whitespace-pre-wrap text-left md:text-center">
                {pendingNotice.message}
              </p>
            </div>
          </div>

          <button 
            onClick={() => acknowledgeNotice(pendingNotice.id)}
            className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-violet-100 transition-all active:scale-95"
          >
            Ciente
          </button>
          
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center">
            Comunicado Personalle Infinity
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserNoticeOverlay;
