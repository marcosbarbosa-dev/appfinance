
import React, { useState } from 'react';
import { useAuth } from '../App';
import { AvatarIcon } from './Sidebar';

const UserProfile: React.FC = () => {
  const { user, updateProfile, setIsSidebarOpen } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const formatSuspensionDate = (dateString?: string) => {
    if (!dateString) return 'Vitalício';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
      console.error("Erro ao formatar data de suspensão:", e);
      return 'Inválida';
    }
  };

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
      // Fixamos o avatar como 'male_shadow' que é o padrão do sistema
      await updateProfile(name, 'male_shadow', password || undefined);
      setMessage({ text: 'Dados atualizados com sucesso!', type: 'success' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: 'Erro ao atualizar dados.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
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
          <h2 className="text-2xl font-bold text-slate-800">Perfil</h2>
          <p className="text-slate-500">Configurações da conta Infinity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Avatar Oficial</h3>
            
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-50 shadow-inner overflow-hidden bg-slate-100 flex items-center justify-center">
                <AvatarIcon type="male_shadow" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <i className="fas fa-shield-halved text-[10px]"></i>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">
                 Identidade Digital<br/>Padronizada Infinity
               </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                  <i className="fas fa-id-card text-violet-500"></i>
                  Dados Cadastrais
                </h4>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 opacity-50">Username (Inalterável)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-sm font-bold text-slate-700 mb-1">
                    Vencimento:
                    <span className={`ml-2 px-3 py-1 rounded-lg text-xs font-black uppercase ${user?.suspensionDate ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {formatSuspensionDate(user?.suspensionDate)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                  <i className="fas fa-lock text-purple-500"></i>
                  Segurança da Conta
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
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Senha</label>
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
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  {message.text}
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-save"></i>
                  {isSaving ? 'Processando...' : 'Atualizar Perfil'}
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
