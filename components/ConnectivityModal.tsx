
import React from 'react';

interface ConnectivityModalProps {
  show: boolean;
  onClose: () => void;
}

const ConnectivityModal: React.FC<ConnectivityModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-300">
        <div className="p-10 text-center space-y-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping"></div>
            <div className="relative w-full h-full bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl shadow-inner border border-rose-100">
              <i className="fas fa-wifi-slash"></i>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Sem conexão</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
              Detectamos que você está offline. Para garantir a segurança dos seus dados, modificações só são permitidas com internet ativa.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              Entendido
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Verificando status em tempo real...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityModal;
