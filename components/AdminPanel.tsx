
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Category, BankAccount } from '../types';
import { useAuth } from '../App';
import { AvatarIcon } from './Sidebar';
import { supabase } from '../supabase';

const AdminPanel: React.FC = () => {
  const { allUsers, setAllUsers, deleteUserFromDb, setIsSidebarOpen, user: loggedAdmin, addLog, checkInternet, saveCategoriesBatch, saveBankAccountsBatch } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminRoleConfirm, setShowAdminRoleConfirm] = useState(false);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState<{ show: boolean, username: string }>({ show: false, username: '' });
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [showGenericConfirm, setShowGenericConfirm] = useState<{
    show: boolean;
    type: 'reset' | 'status' | 'refresh';
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
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
  }, [allUsers, searchTerm]);

  const openModal = (user: User | null = null) => {
    setShowDuplicateError(false);
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
      setFormData({ name: '', username: '', role: 'user', suspensionDate: '', isActive: true });
      setAccessType('permanent');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setSecurityError('');
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
      const updatedUser = { ...editingUser, ...formData, suspensionDate: finalDate, updatedAt: now };
      await setAllUsers(allUsers.map(u => u.uid === editingUser.uid ? updatedUser : u));
      if (loggedAdmin) addLog(loggedAdmin, 'edit_user', `Perfil atualizado: ${editingUser.name}`);
    } else {
      const newUid = crypto.randomUUID();
      // Senha padrão é o username para novos usuários
      const newUser: User = { uid: newUid, ...formData, password: formData.username, suspensionDate: finalDate, isFirstLogin: true, avatar: 'male_shadow', updatedAt: now };
      await setAllUsers([...allUsers, newUser]);
      
      // Categorias padrão solicitadas
      await saveCategoriesBatch([
        { id: crypto.randomUUID(), userId: newUid, name: 'Salário', type: 'income', icon: 'fa-money-bill-wave', color: '#10b981' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Serviços', type: 'income', icon: 'fa-handshake', color: '#3b82f6' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Moradia', type: 'expense', icon: 'fa-house', color: '#ef4444' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Alimentação', type: 'expense', icon: 'fa-utensils', color: '#f59e0b' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Passagem', type: 'expense', icon: 'fa-bus', color: '#0ea5e9' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Lazer', type: 'expense', icon: 'fa-gamepad', color: '#8b5cf6' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Despesas Pessoais', type: 'expense', icon: 'fa-user', color: '#64748b' }
      ]);

      // Contas padrão solicitadas
      await saveBankAccountsBatch([
        { id: crypto.randomUUID(), userId: newUid, name: 'Carteira', type: 'cash', bankName: 'Dinheiro' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Conta Corrente', type: 'checking', bankName: 'Banco' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Cartão de Crédito', type: 'credit_card', bankName: 'Cartão' }
      ]);

      if (loggedAdmin) addLog(loggedAdmin, 'create_user', `Novo usuário: ${newUser.name}`);
    }
    setShowAdminRoleConfirm(false);
    closeModal();
  };

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;
    if (formData.role === 'admin' && (!editingUser || editingUser.role !== 'admin')) {
      setAdminPasswordConfirm('');
      setShowAdminRoleConfirm(true);
    } else {
      executeSave();
    }
  };

  const handleFinalDelete = async () => {
    if (!editingUser || !loggedAdmin) return;
    if (adminPasswordConfirm !== loggedAdmin.password) {
      setSecurityError('Senha administrativa incorreta.');
      return;
    }
    await deleteUserFromDb(editingUser.uid);
    addLog(loggedAdmin, 'delete_user', `Usuário removido permanentemente: ${editingUser.name}`);
    setShowDeleteConfirm(false);
    closeModal();
  };

  const triggerIndividualRefresh = async () => {
    if (!editingUser) return;
    const newRid = crypto.randomUUID();
    const updated = { ...editingUser, refreshId: newRid };
    await supabase.from('users').update({ refresh_id: newRid }).eq('uid', editingUser.uid);
    setAllUsers(allUsers.map(u => u.uid === editingUser.uid ? updated : u));
    setShowGenericConfirm({ ...showGenericConfirm, show: false });
  };

  const confirmResetPassword = async () => {
    const u = showGenericConfirm.user;
    if (!u) return;
    // Reset de senha para o username do usuário
    const updated = { ...u, password: u.username, isFirstLogin: true, updatedAt: new Date().toISOString() };
    await setAllUsers(allUsers.map(user => user.uid === u.uid ? updated : user));
    setShowGenericConfirm({ ...showGenericConfirm, show: false });
    setShowResetSuccessModal({ show: true, username: u.username }); // Passa o username para o modal
  };

  const confirmStatusToggle = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
    setShowGenericConfirm({ ...showGenericConfirm, show: false });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm"><i className="fas fa-bars"></i></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Membros Personalle</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Controle de Licenças Infinity</p>
          </div>
        </div>
        <button onClick={() => openModal()} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all font-bold text-sm"><i className="fas fa-user-plus"></i>Novo Membro</button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300"><i className="fas fa-search"></i></div>
        <input type="text" placeholder="Pesquisar membros..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"/>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl border border-slate-100 overflow-hidden bg-slate-50"><AvatarIcon type={u.avatar || 'male_shadow'} /></div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{u.isActive ? 'ATIVO' : 'SUSPENSO'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(u)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-violet-600 rounded-lg shadow-sm transition-all"><i className="fas fa-ellipsis-h"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-lg font-bold">Gerenciar Membro</h3>
              <button onClick={closeModal} className="text-slate-300 hover:text-slate-500"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSaveAttempt} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm"/>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome de Usuário (Login)</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!editingUser}
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} 
                      className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm ${editingUser ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                      placeholder="ex: joao.silva"
                    />
                    {showDuplicateError && <p className="text-[10px] text-rose-500 font-bold mt-1">Este nome de usuário já está em uso.</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Perfil</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold">
                      <option value="user">Platinum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Validade</label>
                     <div className="flex gap-1 p-1 bg-slate-50 rounded-lg border">
                        <button type="button" onClick={() => setAccessType('permanent')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${accessType === 'permanent' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400'}`}>Permanente</button>
                        <button type="button" onClick={() => setAccessType('temporary')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${accessType === 'temporary' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400'}`}>Data</button>
                     </div>
                  </div>
                </div>

                {accessType === 'temporary' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Expiração do Acesso</label>
                    <input type="date" required value={formData.suspensionDate} onChange={(e) => setFormData({...formData, suspensionDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold"/>
                  </div>
                )}

                <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-violet-700 transition-all">Salvar Licença</button>
              </form>

              {editingUser && (
                <div className="pt-8 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ações do Administrador</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowGenericConfirm({ show: true, type: 'status', user: editingUser })} className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.isActive ? 'border-rose-100 text-rose-500 hover:bg-rose-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}>
                      <i className={`fas ${formData.isActive ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                      {formData.isActive ? 'Suspender' : 'Ativar'}
                    </button>
                    <button onClick={() => setShowGenericConfirm({ show: true, type: 'refresh', user: editingUser })} className="flex items-center justify-center gap-2 p-3 border border-sky-100 text-sky-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-50 transition-all">
                      <i className="fas fa-sync-alt"></i>Refresh Manual
                    </button>
                    <button onClick={() => setShowGenericConfirm({ show: true, type: 'reset', user: editingUser })} className="p-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Resetar Senha</button>
                    <button onClick={() => { setAdminPasswordConfirm(''); setSecurityError(''); setShowDeleteConfirm(true); }} className="p-3 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Excluir Permanente</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-600 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-xl"><i className="fas fa-trash-alt"></i></div>
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Apagar Conta Permanentemente</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Esta ação removerá todos os dados do membro. Digite sua senha de Admin para confirmar.</p>
            <div className="space-y-4">
              <input type="password" placeholder="Sua senha Admin" value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-rose-500"/>
              {securityError && <p className="text-[10px] text-rose-600 font-black uppercase">{securityError}</p>}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinalDelete} className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-rose-700 transition-all">Confirmar Destruição</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showGenericConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center text-3xl ${showGenericConfirm.type === 'refresh' ? 'bg-sky-50 text-sky-500' : 'bg-violet-50 text-violet-600'}`}>
              <i className={`fas ${showGenericConfirm.type === 'refresh' ? 'fa-sync-alt' : (showGenericConfirm.type === 'reset' ? 'fa-key' : 'fa-user-cog')}`}></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Confirmar Comando?</h3>
            <p className="text-sm text-slate-500">{showGenericConfirm.type === 'refresh' ? 'O navegador deste membro será atualizado na próxima verificação.' : 'Deseja prosseguir com esta operação?'}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => {
                if (showGenericConfirm.type === 'refresh') triggerIndividualRefresh();
                else if (showGenericConfirm.type === 'reset') confirmResetPassword();
                else confirmStatusToggle();
              }} className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl shadow-lg transition-all">Confirmar</button>
              <button onClick={() => setShowGenericConfirm({...showGenericConfirm, show: false})} className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-all">Voltar</button>
            </div>
          </div>
        </div>
      )}

      {showResetSuccessModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center text-3xl"><i className="fas fa-check-circle"></i></div>
              <h3 className="text-xl font-bold text-slate-800">Senha Resetada!</h3>
              <p className="text-sm text-slate-500">A senha padrão foi redefinida para <span className="font-bold text-violet-600">{showResetSuccessModal.username}</span>.</p>
              <button onClick={() => setShowResetSuccessModal({ show: false, username: '' })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl">Fechar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
