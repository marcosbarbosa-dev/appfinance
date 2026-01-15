
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../App';

const AdminPanel: React.FC = () => {
  const { allUsers, setAllUsers, setIsSidebarOpen } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'user' as UserRole,
    suspensionDate: '',
  });

  const [accessType, setAccessType] = useState<'permanent' | 'temporary'>('permanent');

  const openModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        role: user.role,
        suspensionDate: user.suspensionDate || '',
      });
      setAccessType(user.suspensionDate ? 'temporary' : 'permanent');
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', role: 'user', suspensionDate: '' });
      setAccessType('permanent');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      suspensionDate: accessType === 'permanent' ? '' : formData.suspensionDate
    };

    if (editingUser) {
      setAllUsers(allUsers.map(u => u.uid === editingUser.uid ? { ...u, ...finalData } : u));
    } else {
      const newUser: User = {
        uid: Math.random().toString(36).substr(2, 9),
        ...finalData,
        isActive: true,
        isFirstLogin: true,
        avatar: 'male_shadow'
      };
      setAllUsers([...allUsers, newUser]);
    }
    closeModal();
  };

  const toggleUserStatus = (uid: string) => {
    setAllUsers(allUsers.map(u => u.uid === uid ? { ...u, isActive: !u.isActive } : u));
  };

  const executeResetPassword = (user: User) => {
    setAllUsers(allUsers.map(u => u.uid === user.uid ? { ...u, isFirstLogin: true } : u));
    alert(`Senha de ${user.name} resetada para padrão (username).`);
  };

  const executeDeleteUser = (user: User) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente o usuário ${user.name}?`)) {
      setAllUsers(allUsers.filter(u => u.uid !== user.uid));
      closeModal();
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"
          >
            <i className="fas fa-bars text-sm"></i>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Membros</h2>
            <p className="text-xs md:text-sm text-slate-500">Gestão de Licenças Infinity</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl shadow-lg shadow-violet-100 flex items-center justify-center gap-2 transition-all font-medium text-sm"
        >
          <i className="fas fa-user-plus text-xs"></i>
          Novo Membro
        </button>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left table-fixed md:table-auto">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="w-[50%] md:w-auto px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Usuário e Vencimento</th>
                <th className="w-[15%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Nível</th>
                <th className="w-[20%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="w-[15%] md:w-auto px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allUsers.map((u) => {
                const today = new Date().toISOString().split('T')[0];
                const isAutoSuspended = u.suspensionDate && today >= u.suspensionDate;

                return (
                  <tr key={u.uid} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-5">
                      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        <div className="bg-violet-50 text-violet-300 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex-shrink-0 flex items-center justify-center text-sm md:text-xl shadow-sm border border-violet-100">
                          <i className={`fas ${u.avatar === 'female_shadow' ? 'fa-user-nurse' : 'fa-user'} opacity-50`}></i>
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 text-xs md:text-base truncate">{u.name}</p>
                          
                          {/* Exibição do Vencimento / Status Permanente */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {!u.suspensionDate ? (
                              <span className="text-[9px] md:text-xs text-amber-500 font-black flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
                                <i className="fas fa-crown"></i> Permanente
                              </span>
                            ) : (
                              <span className={`text-[9px] md:text-xs font-bold ${isAutoSuspended ? 'text-rose-500' : 'text-slate-400'}`}>
                                Vencimento: {formatDateDisplay(u.suspensionDate)}
                              </span>
                            )}
                          </div>

                          <p className="text-[9px] md:text-xs text-slate-400 flex items-center gap-1 truncate opacity-60">
                            <i className="fas fa-at text-[8px] md:text-[9px]"></i>{u.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 md:px-6 py-3 md:py-5">
                      <span className={`text-[9px] md:text-xs font-bold py-0.5 md:py-1 px-1.5 md:px-3 rounded-md md:rounded-lg border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                        {u.role === 'admin' ? 'ADM' : 'PLAT'}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-3 md:py-5 text-center">
                      <div className={`inline-flex items-center gap-1 md:gap-2 px-1.5 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black tracking-widest ${
                        u.isActive && !isAutoSuspended
                        ? 'bg-violet-100 text-violet-700' 
                        : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${u.isActive && !isAutoSuspended ? 'bg-violet-500' : 'bg-slate-400'}`}></span>
                        <span className="hidden xs:inline">{(u.isActive && !isAutoSuspended) ? 'ATIVO' : 'OFF'}</span>
                        <span className="xs:hidden">{(u.isActive && !isAutoSuspended) ? 'ON' : 'OFF'}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-right">
                      <button 
                        onClick={() => openModal(u)}
                        className="w-8 h-8 md:w-10 md:h-10 inline-flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 rounded-lg md:rounded-xl transition-all shadow-sm"
                      >
                        <i className="fas fa-pen text-xs"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">
                  {editingUser ? 'Gestão de Membro' : 'Novo Membro Personalle'}
                </h3>
              </div>
              <button onClick={closeModal} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-white transition-all">
                <i className="fas fa-times text-lg md:text-xl"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 md:space-y-8 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-5 md:space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <i className="fas fa-id-card text-violet-500"></i> Informações Básicas
                </h4>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm text-black"
                      placeholder="Nome do membro"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5">Username</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm text-black"
                        placeholder="login"
                        disabled={!!editingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5">Perfil</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                        className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm text-black font-medium"
                      >
                        <option value="user" className="text-black">Platinum</option>
                        <option value="admin" className="text-black">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-violet-500"></i> Gestão de Licença
                  </h4>
                  
                  <div className="bg-slate-50 p-3 rounded-2xl space-y-4 border border-slate-100">
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setAccessType('permanent')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          accessType === 'permanent' 
                          ? 'bg-amber-100 border-amber-200 text-amber-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <i className="fas fa-crown mr-2"></i> Permanente
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAccessType('temporary')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          accessType === 'temporary' 
                          ? 'bg-violet-100 border-violet-200 text-violet-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <i className="fas fa-clock mr-2"></i> Temporário
                      </button>
                    </div>

                    {accessType === 'temporary' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Data de Expiração
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.suspensionDate}
                          onChange={(e) => setFormData({...formData, suspensionDate: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm text-black bg-white"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 italic text-center px-4 leading-relaxed">
                      {accessType === 'permanent' 
                        ? 'O acesso deste membro nunca expirará automaticamente.' 
                        : 'O acesso será bloqueado à meia-noite da data configurada.'}
                    </p>
                  </div>
                </div>

                <button type="submit" className="w-full py-3 md:py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 text-sm">
                  <i className="fas fa-save text-xs"></i>
                  {editingUser ? 'Salvar Alterações' : 'Confirmar Novo Membro'}
                </button>
              </form>

              {editingUser && (
                <div className="pt-6 border-t border-slate-100 space-y-5 md:space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <i className="fas fa-shield-alt text-violet-500"></i> Ações de Segurança
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => executeResetPassword(editingUser)}
                      className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 border border-slate-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 text-slate-700 transition-all text-xs md:text-sm font-bold"
                    >
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0 flex items-center justify-center">
                        <i className="fas fa-key text-xs"></i>
                      </div>
                      Resetar Senha
                    </button>

                    <button 
                      type="button"
                      onClick={() => toggleUserStatus(editingUser.uid)}
                      disabled={editingUser.username === 'root'}
                      className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 border rounded-xl transition-all text-xs md:text-sm font-bold ${
                        editingUser.isActive 
                        ? 'border-orange-100 hover:bg-orange-50 text-slate-700' 
                        : 'border-emerald-100 hover:bg-emerald-50 text-slate-700'
                      } ${editingUser.username === 'root' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        editingUser.isActive ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <i className={editingUser.isActive ? "fas fa-user-slash text-xs" : "fas fa-user-check text-xs"}></i>
                      </div>
                      {editingUser.isActive ? 'Suspender' : 'Reativar'}
                    </button>

                    <button 
                      type="button"
                      onClick={() => executeDeleteUser(editingUser)}
                      disabled={editingUser.username === 'root'}
                      className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 border border-rose-100 rounded-xl hover:bg-rose-50 hover:border-rose-200 text-rose-700 transition-all text-xs md:text-sm font-bold sm:col-span-2 ${
                        editingUser.username === 'root' ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-rose-100 text-rose-600 flex-shrink-0 flex items-center justify-center">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </div>
                      Excluir Definitivamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
