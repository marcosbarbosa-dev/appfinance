
import React, { useState } from 'react';
import { useAuth } from '../App';

const UserProfile: React.FC = () => {
  const { user, updateProfile, setIsSidebarOpen } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'male_shadow');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const AVATAR_OPTIONS = [
    { 
      id: 'male_shadow', 
      label: 'Sombra Masculina', 
      icon: 'fa-user',
      color: 'bg-slate-100 text-slate-400'
    },
    { 
      id: 'female_shadow', 
      label: 'Sombra Feminina', 
      icon: 'fa-user-tie', // Usando tie para diferenciar visualmente a silhueta ou mantendo padrão
      color: 'bg-slate-100 text-slate-400'
    }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    if (password && password.length < 6) {
      setMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(name, avatar, password || undefined);
      setMessage({ text: 'Dados atualizados com sucesso!', type: 'success' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: 'Erro ao atualizar dados.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvatarPreview = (type: string) => {
    return (
      <div className={`w-full h-full flex items-center justify-center text-4xl bg-slate-50 text-slate-300`}>
        <i className={`fas ${type === 'female_shadow' ? 'fa-user-plus' : 'fa-user'} opacity-50`}></i>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Perfil Premium</h2>
          <p className="text-slate-500">Ajustes da conta Personalle Infinity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">Avatar do Perfil</h3>
            
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 rounded-3xl border-4 border-slate-100 shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center text-5xl text-slate-200">
                <i className={`fas ${avatar === 'female_shadow' ? 'fa-user-nurse' : 'fa-user'}`}></i>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-violet-500 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-fingerprint text-sm"></i>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 font-medium italic">Selecione uma silhueta de identificação</p>

            <div className="flex justify-center gap-4">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatar(opt.id)}
                  className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all hover:scale-105 active:scale-95 ${
                    avatar === opt.id ? 'border-violet-500 bg-violet-50 text-violet-600 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-300'
                  }`}
                  title={opt.label}
                >
                  <i className={`fas ${opt.id === 'female_shadow' ? 'fa-user-nurse' : 'fa-user'}`}></i>
                  {avatar === opt.id && (
                    <div className="absolute -top-1 -right-1 bg-violet-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                  <i className="fas fa-id-card text-violet-500"></i>
                  Identificação
                </h4>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome de Exibição</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 opacity-50">Username (Fixo)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                  <i className="fas fa-lock text-purple-500"></i>
                  Alterar Senha
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nova Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Repetir Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in duration-300 ${
                  message.type === 'success' ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  {message.text}
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-violet-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-save"></i>
                  {isSaving ? 'Salvando...' : 'Salvar Preferências'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
