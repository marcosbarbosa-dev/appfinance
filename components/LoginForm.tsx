
import React, { useState } from 'react';
import { useAuth } from '../App';

interface Props {
  error: string | null;
  loading: boolean;
}

const LoginForm: React.FC<Props> = ({ error, loading }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
      <div className="text-center mb-8">
        <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl shadow-lg shadow-violet-200">
          <i className="fas fa-infinity"></i>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Personalle Infinity</h1>
        <p className="text-slate-500">Gestão Financeira Premium</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            placeholder="Digite seu usuário"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 animate-pulse">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <i className="fas fa-circle-notch animate-spin"></i>
          ) : (
            'Acessar Painel'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          Exclusivo para assinantes Personalle Infinity.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;