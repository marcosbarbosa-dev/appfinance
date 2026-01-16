
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const LogoInfinity = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M18 50C18 32 38 32 50 50C62 68 82 68 82 50C82 32 62 32 50 50C38 68 18 68 18 50Z" 
      stroke="currentColor" 
      strokeWidth="8.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const LoginForm: React.FC<{ error: string | null; loading: boolean }> = ({ error, loading }) => {
  const { login, supportInfo, maintenanceMessage, isSystemLocked } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [lockDismissed, setLockDismissed] = useState(false);

  // Reativar o overlay de bloqueio se o status de bloqueio mudar para ativo
  useEffect(() => {
    if (isSystemLocked) {
      setLockDismissed(false);
    }
  }, [isSystemLocked]);

  // Reativar o overlay de bloqueio sempre que houver um erro enquanto o sistema estiver bloqueado
  useEffect(() => {
    if (error && isSystemLocked) {
      setLockDismissed(false);
    }
  }, [error, isSystemLocked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <>
      <div className="relative bg-white p-8 rounded-2xl shadow-xl w-full max-md border border-slate-100 overflow-hidden">
        
        {/* Overlay de Bloqueio do Sistema */}
        {isSystemLocked && !lockDismissed && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center space-y-6 max-w-xs transform animate-in zoom-in-95">
              <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-3xl shadow-inner animate-pulse">
                <i className="fas fa-lock"></i>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Acesso Restrito</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed px-2 uppercase tracking-tight">
                  {maintenanceMessage || "Atualização em andamento"}
                </p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setLockDismissed(true)}
                  className="w-full py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Tentar Login
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`text-center mb-8 transition-all duration-500 ${isSystemLocked && !lockDismissed ? 'opacity-20 grayscale scale-95' : ''}`}>
          <div className="bg-violet-600 w-20 h-20 rounded-[2.2rem] flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-violet-200">
            <LogoInfinity className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personalle Infinity</h1>
          <p className="text-slate-500 text-sm font-medium">Gestão Financeira Premium</p>
        </div>

        <form onSubmit={handleSubmit} className={`space-y-4 transition-all duration-500 ${isSystemLocked && !lockDismissed ? 'opacity-20 grayscale pointer-events-none scale-95' : ''}`}>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors focus:outline-none"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 animate-in shake duration-300 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-sm"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-100 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        <div className={`text-center mt-6 transition-all duration-500 ${isSystemLocked && !lockDismissed ? 'opacity-20 grayscale pointer-events-none scale-95' : ''}`}>
          <button 
            onClick={() => setShowSupport(true)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
          >
            Entrar em contato com administrador
          </button>
        </div>
      </div>

      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
                <i className="fas fa-headset"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Suporte Personalle</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                  {supportInfo || "Entre em contato através dos canais oficiais."}
                </p>
              </div>
              <button 
                onClick={() => setShowSupport(false)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginForm;
