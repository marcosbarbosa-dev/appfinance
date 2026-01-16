
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Category, BankAccount } from '../types';
import { useAuth } from '../App';

const AdminPanel: React.FC = () => {
  const { allUsers, setAllUsers, deleteUserFromDb, setIsSidebarOpen, user: loggedAdmin, addLog, checkInternet, saveCategoriesBatch, saveBankAccountsBatch } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminRoleConfirm, setShowAdminRoleConfirm] = useState(false);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [showGenericConfirm, setShowGenericConfirm] = useState<{
    show: boolean;
    type: 'reset' | 'status';
    user: User | null;
  }>({ show: false, type: 'reset', user: null });

  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [securityError, setSecurityError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'user' as UserRole,
    suspensionDate: '',
    isActive: true,
  });

  const [accessType, setAccessType] = useState<'permanent' | 'temporary'>('permanent');

  useEffect(() => {
    if (formData.role === 'admin') {
      setAccessType('permanent');
      setFormData(prev => ({ ...prev, suspensionDate: '' }));
    }
  }, [formData.role]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allUsers
      .filter(u => 
        (u.name?.toLowerCase() || '').includes(term) || 
        (u.username?.toLowerCase() || '').includes(term)
      )
      .sort((a, b) => {
        const roleOrder = { admin: 1, user: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        // Fix: corrected self-reference 'dateB' to 'b.updatedAt' in the dateB initialization
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateA - dateB;
      });
  }, [allUsers, searchTerm]);

  const openModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        username: user.username || '',
        role: user.role,
        suspensionDate: user.suspensionDate || '',
        isActive: user.isActive,
      });
      setAccessType(user.suspensionDate ? 'temporary' : 'permanent');
    } else {
      setEditingUser(null);
      setFormData({ 
        name: '', 
        username: '', 
        role: 'user', 
        suspensionDate: '', 
        isActive: true 
      });
      setAccessType('permanent');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const executeSave = async () => {
    if (!checkInternet()) return;

    if (!editingUser) {
      const userExists = allUsers.some(u => u.username.toLowerCase() === formData.username.toLowerCase());
      if (userExists) {
        setShowDuplicateError(true);
        return;
      }
    }

    const finalDate = formData.role === 'admin' ? '' : (accessType === 'permanent' ? '' : formData.suspensionDate);
    const now = new Date().toISOString();

    if (editingUser) {
      const updatedUser = { 
        ...editingUser, 
        ...formData, 
        suspensionDate: finalDate, 
        updatedAt: now 
      };
      const newAllUsers = allUsers.map(u => u.uid === editingUser.uid ? updatedUser : u);
      await setAllUsers(newAllUsers);
      if (loggedAdmin) addLog(loggedAdmin, 'edit_user', `Perfil atualizado | Usuário Alvo: ${editingUser.name} | Status: ${formData.isActive ? 'Ativo' : 'Suspenso'}`);
    } else {
      const newUid = crypto.randomUUID();
      const newUser: User = {
        uid: newUid,
        ...formData,
        password: formData.username,
        suspensionDate: finalDate,
        isFirstLogin: true,
        avatar: 'male_shadow',
        updatedAt: now
      };
      
      await setAllUsers([...allUsers, newUser]);

      // Criação de Categorias Padrão
      const defaultCategories: any[] = [
        { id: crypto.randomUUID(), userId: newUid, name: 'Salário', type: 'income', icon: 'fa-money-bill-wave', color: '#10b981' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Serviços', type: 'income', icon: 'fa-handshake', color: '#3b82f6' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Moradia', type: 'expense', icon: 'fa-house', color: '#ef4444' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Alimentação', type: 'expense', icon: 'fa-utensils', color: '#f59e0b' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Transporte', type: 'expense', icon: 'fa-car', color: '#3b82f6' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Saúde e Bem-Estar', type: 'expense', icon: 'fa-heart-pulse', color: '#ec4899' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Educação', type: 'expense', icon: 'fa-graduation-cap', color: '#8b5cf6' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Lazer', type: 'expense', icon: 'fa-gamepad', color: '#d946ef' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Despesas Pessoais', type: 'expense', icon: 'fa-user-gear', color: '#64748b' }
      ];
      await saveCategoriesBatch(defaultCategories);

      // Criação de Contas Padrão
      const defaultAccounts: BankAccount[] = [
        { id: crypto.randomUUID(), userId: newUid, name: 'Conta Corrente', type: 'checking', bankName: 'Banco Padrão' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Dinheiro', type: 'cash', bankName: 'Carteira' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Cartão de Crédito', type: 'credit_card', bankName: 'Meu Cartão' }
      ];
      await saveBankAccountsBatch(defaultAccounts);

      if (loggedAdmin) addLog(loggedAdmin, 'create_user', `Novo usuário cadastrado: ${newUser.name}`);
    }
    setShowAdminRoleConfirm(false);
    closeModal();
  };

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;
    const isPromotingToAdmin = formData.role === 'admin' && (!editingUser || editingUser.role !== 'admin');
    if (isPromotingToAdmin) {
      setAdminPasswordConfirm('');
      setSecurityError('');
      setShowAdminRoleConfirm(true);
    } else {
      executeSave();
    }
  };

  const confirmAdminRoleSave = () => {
    if (!loggedAdmin) return;
    if (adminPasswordConfirm !== loggedAdmin.password) {
      setSecurityError('Senha administrativa inválida.');
      return;
    }
    executeSave();
  };

  const handleFinalDelete = async () => {
    if (!editingUser || !loggedAdmin) return;
    if (!checkInternet()) return;
    if (adminPasswordConfirm !== loggedAdmin.password) {
      setSecurityError('Senha incorreta.');
      return;
    }
    await deleteUserFromDb(editingUser.uid);
    addLog(loggedAdmin, 'delete_user', `Usuário removido: ${editingUser.name}`);
    setShowDeleteConfirm(false);
    closeModal();
  };

  const confirmResetPassword = async () => {
    if (!checkInternet()) return;
    const u = showGenericConfirm.user;
    if (!u) return;
    const now = new Date().toISOString();
    const updatedUser = { ...u, password: u.username, isFirstLogin: true, updatedAt: now };
    const newAllUsers = allUsers.map(user => user.uid === u.uid ? updatedUser : user);
    await setAllUsers(newAllUsers);
    if (loggedAdmin) addLog(loggedAdmin, 'edit_user', `Senha resetada | Usuário Alvo: ${u.name}`);
    setShowGenericConfirm({ ...showGenericConfirm, show: false });
    setShowResetSuccessModal(true);
  };

  const confirmStatusToggle = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
    setShowGenericConfirm({ ...showGenericConfirm, show: false });
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

      <div className="mb-6 relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors">
          <i className="fas fa-search text-sm"></i>
        </div>
        <input 
          type="text"
          placeholder="Pesquisar por nome ou usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 md:py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm text-slate-700 font-medium"
        />
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left table-fixed md:table-auto">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Membro</th>
                <th className="px-2 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Nível</th>
                <th className="px-2 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Acesso</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const today = new Date().toISOString().split('T')[0];
                const isAutoSuspended = u.suspensionDate && today >= u.suspensionDate;

                return (
                  <tr key={u.uid} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-5">
                      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        <div className="bg-slate-100 text-slate-400 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex-shrink-0 flex items-center justify-center text-sm md:text-xl">
                          <i className={`fas ${u.avatar === 'female_shadow' ? 'fa-user-nurse' : 'fa-user'} opacity-40`}></i>
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 text-xs md:text-base truncate">{u.name}</p>
                          <p className="text-[9px] md:text-xs text-slate-400 opacity-60">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 md:px-6 py-3 md:py-5">
                      <span className={`text-[9px] md:text-xs font-bold py-0.5 px-2 rounded border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                        {u.role === 'admin' ? 'ADM' : 'PLAT'}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-3 md:py-5 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black ${
                        u.isActive && !isAutoSuspended ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive && !isAutoSuspended ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {(u.isActive && !isAutoSuspended) ? 'ATIVO' : 'BLOQUEADO'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-right">
                      <button 
                        onClick={() => openModal(u)}
                        className="w-8 h-8 md:w-10 md:h-10 inline-flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 rounded-lg md:rounded-xl transition-all"
                      >
                        <i className="fas fa-ellipsis-v text-xs"></i>
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
              <h3 className="text-lg md:text-xl font-bold text-slate-800">
                {editingUser ? 'Gerenciar Membro' : 'Novo Membro'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSaveAttempt} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Username</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingUser}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Perfil</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold"
                    >
                      <option value="user">Platinum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Validade da Licença</label>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      disabled={formData.role === 'admin'}
                      onClick={() => setAccessType('permanent')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        accessType === 'permanent' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      Vitalícia
                    </button>
                    <button 
                      type="button"
                      disabled={formData.role === 'admin'}
                      onClick={() => setAccessType('temporary')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        accessType === 'temporary' ? 'bg-violet-100 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      Temporária
                    </button>
                  </div>
                  {accessType === 'temporary' && formData.role !== 'admin' && (
                    <input
                      type="date"
                      required
                      value={formData.suspensionDate}
                      onChange={(e) => setFormData({...formData, suspensionDate: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <button type="submit" className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-100 transition-all">
                    {editingUser ? 'Salvar Configurações' : 'Cadastrar Membro'}
                  </button>
                </div>
              </form>

              {editingUser && (
                <div className="pt-8 border-t border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ações de Suporte</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowGenericConfirm({ show: true, type: 'reset', user: editingUser })}
                      className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Resetar Senha
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowGenericConfirm({ show: true, type: 'status', user: editingUser })}
                      disabled={editingUser.username === 'root'}
                      className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-xs font-bold transition-all ${
                        formData.isActive 
                          ? 'border-rose-100 text-rose-500 hover:bg-rose-50' 
                          : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {formData.isActive ? 'Suspender' : 'Ativar'}
                    </button>
                    <button 
                      onClick={() => {
                        setAdminPasswordConfirm('');
                        setSecurityError('');
                        setShowDeleteConfirm(true);
                      }}
                      disabled={editingUser.username === 'root'}
                      className="col-span-2 p-3 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Erro por Duplicidade */}
      {showDuplicateError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6 border border-white/20">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Membro já Existe</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                O nome de usuário <span className="text-rose-600 font-bold">@{formData.username}</span> já está em uso no sistema Personalle Infinity.
              </p>
            </div>
            <button 
              onClick={() => setShowDuplicateError(false)}
              className="w-full py-4 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
              Revisar Cadastro
            </button>
          </div>
        </div>
      )}

      {/* Modais de Confirmação */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl">
              <i className="fas fa-user-xmark"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Excluir Membro?</h3>
              <p className="text-xs text-slate-500">Confirme sua senha de administrador para prosseguir com a exclusão definitiva.</p>
            </div>
            <input 
              type="password" 
              placeholder="Senha Admin"
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold"
            />
            {securityError && <p className="text-[10px] text-rose-500 font-bold">{securityError}</p>}
            <div className="flex flex-col gap-2">
              <button onClick={handleFinalDelete} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold">Confirmar Exclusão</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 text-slate-400 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showAdminRoleConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center text-3xl">
              <i className="fas fa-shield-halved"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Promover a Admin?</h3>
              <p className="text-xs text-slate-500">Esta ação concede controle total sobre o sistema. Confirme sua senha administrativa.</p>
            </div>
            <input 
              type="password" 
              placeholder="Senha Admin"
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold"
            />
            {securityError && <p className="text-[10px] text-rose-500 font-bold">{securityError}</p>}
            <div className="flex flex-col gap-2">
              <button onClick={confirmAdminRoleSave} className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold">Confirmar Promoção</button>
              <button onClick={() => setShowAdminRoleConfirm(false)} className="w-full py-3 text-slate-400 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showGenericConfirm.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Confirmar Ação?</h3>
            <p className="text-xs text-slate-500">
              {showGenericConfirm.type === 'reset' 
                ? 'Deseja prosseguir com o reset de senha?' 
                : formData.isActive 
                  ? 'Deseja realmente suspender este acesso?' 
                  : 'Deseja reativar este acesso?'}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={showGenericConfirm.type === 'reset' ? confirmResetPassword : confirmStatusToggle} 
                className={`flex-1 py-3 text-white rounded-xl font-bold ${
                  showGenericConfirm.type === 'status' && formData.isActive ? 'bg-rose-600' : 'bg-slate-900'
                }`}
              >
                Confirmar
              </button>
              <button onClick={() => setShowGenericConfirm({ ...showGenericConfirm, show: false })} className="flex-1 py-3 text-slate-400 font-bold">Sair</button>
            </div>
          </div>
        </div>
      )}

      {showResetSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl">
              <i className="fas fa-key"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Senha Resetada!</h3>
            <p className="text-xs text-slate-500">A senha agora é igual ao nome de usuário. O membro será solicitado a trocá-la no próximo acesso.</p>
            <button onClick={() => setShowResetSuccessModal(false)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">Ótimo!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
