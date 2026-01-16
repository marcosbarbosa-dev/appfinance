
import React, { useState } from 'react';
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

const FirstLoginFlow: React.FC = () => {
  const { updatePassword, user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    await updatePassword(password);
    setLoading(false);
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
      
      <div className="text-center mb-8">
        <div className="bg-violet-600 w-16 h-16 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-violet-100">
          <LogoInfinity className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ativação de Conta</h2>
        <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">
          Olá, <span className="text-violet-600 font-bold">{user?.name.split(' ')[0]}</span>. Por segurança, você deve definir uma nova senha personalizada para o seu acesso <span className="font-bold uppercase tracking-widest text-[10px]">Infinity</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Sua Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Repita a Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2 animate-bounce-subtle">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-circle-notch animate-spin"></i>
              Configurando...
            </div>
          ) : (
            'Finalizar Ativação'
          )}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
         <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Personalle Infinity Security Standard</p>
      </div>
    </div>
  );
};

export default FirstLoginFlow;
