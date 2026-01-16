
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Category, BankAccount } from '../types';
import { useAuth } from '../App';
import { AvatarIcon } from './Sidebar';

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
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
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
      if (loggedAdmin) addLog(loggedAdmin, 'edit_user', `Perfil atualizado | Usuário Alvo: ${editingUser.name}`);
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

      const defaultCategories: any[] = [
        { id: crypto.randomUUID(), userId: newUid, name: 'Salário', type: 'income', icon: 'fa-money-bill-wave', color: '#10b981' },
        { id: crypto.randomUUID(), userId: newUid, name: 'Moradia', type: 'expense', icon: 'fa-house', color: '#ef4444' }
      ];
      await saveCategoriesBatch(defaultCategories);

      const defaultAccounts: BankAccount[] = [
        { id: crypto.randomUUID(), userId: newUid, name: 'Carteira', type: 'cash', bankName: 'Dinheiro' }
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm"
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
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all font-medium text-sm"
        >
          <i className="fas fa-user-plus text-xs"></i>
          Novo Membro
        </button>
      </div>

      <div className="mb-6 relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <i className="fas fa-search text-sm"></i>
        </div>
        <input 
          type="text"
          placeholder="Pesquisar membros..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 md:py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Membro</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nível</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Acesso</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{u.role === 'admin' ? 'ADM' : 'PLATINUM'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {u.isActive ? 'ATIVO' : 'SUSPENSO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(u)} className="text-slate-400 hover:text-violet-600"><i className="fas fa-pen"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">Gerenciar Membro</h3>
              <button onClick={closeModal} className="text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleSaveAttempt} className="space-y-4">
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Nome" />
                <input type="text" disabled value={formData.username} className="w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-400" />
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-3 rounded-xl border border-slate-200">
                  <option value="user">Platinum</option>
                  <option value="admin">Administrador</option>
                </select>
                <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold">Salvar</button>
              </form>
              {editingUser && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <button onClick={() => setShowGenericConfirm({ show: true, type: 'reset', user: editingUser })} className="p-3 border rounded-xl text-xs font-bold text-slate-600">Resetar Senha</button>
                  <button onClick={() => setShowGenericConfirm({ show: true, type: 'status', user: editingUser })} className="p-3 border rounded-xl text-xs font-bold text-rose-600">Toggle Status</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdminRoleConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center space-y-4">
            <h3 className="text-xl font-bold">Elevar Privilégios?</h3>
            <p className="text-sm text-slate-500">Confirme sua senha administrativa para promover este usuário.</p>
            <input type="password" placeholder="Sua senha admin" value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-center font-bold" />
            {securityError && <p className="text-xs text-rose-600">{securityError}</p>}
            <button onClick={confirmAdminRoleSave} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl">Confirmar</button>
            <button onClick={() => setShowAdminRoleConfirm(false)} className="w-full py-2 text-slate-400">Cancelar</button>
          </div>
        </div>
      )}

      {showGenericConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center space-y-4">
             <h3 className="text-xl font-bold">Confirmar Ação?</h3>
             <button onClick={showGenericConfirm.type === 'reset' ? confirmResetPassword : confirmStatusToggle} className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl">Confirmar</button>
             <button onClick={() => setShowGenericConfirm({...showGenericConfirm, show: false})} className="w-full py-2 text-slate-400">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
