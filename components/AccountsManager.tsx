import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../App';
import { BankAccount } from '../types';

interface AccountFormData {
  name: string;
  bankName: string;
  type: BankAccount['type'];
  isDefault: boolean;
}

const AccountsManager: React.FC = () => {
  const { bankAccounts, transactions, saveBankAccount, saveBankAccountsBatch, deleteBankAccount, setIsSidebarOpen, checkInternet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    bankName: '',
    type: 'checking',
    isDefault: false
  });

  const checkingAccounts = useMemo(() => bankAccounts.filter(acc => acc.type === 'checking'), [bankAccounts]);

  // Regra: Se houver apenas uma conta corrente e ela não estiver como padrão, marca automaticamente
  useEffect(() => {
    const onlyChecking = bankAccounts.filter(a => a.type === 'checking');
    if (onlyChecking.length === 1 && !onlyChecking[0].isDefault) {
      saveBankAccount({ ...onlyChecking[0], isDefault: true });
    }
  }, [bankAccounts]);

  const openModal = (account: BankAccount | null = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({ 
        name: account.name, 
        bankName: account.bankName, 
        type: account.type,
        isDefault: !!account.isDefault
      });
    } else {
      setEditingAccount(null);
      const willBeDefault = checkingAccounts.length === 0;
      setFormData({ 
        name: '', 
        bankName: '', 
        type: 'checking',
        isDefault: willBeDefault
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;

    let isDefaultFinal = formData.isDefault;
    const currentCheckingCount = checkingAccounts.length;
    
    // Força padrão se for a única corrente
    const isAddingFirstChecking = formData.type === 'checking' && currentCheckingCount === 0;
    const isEditingOnlyChecking = formData.type === 'checking' && editingAccount !== null && currentCheckingCount === 1 && checkingAccounts[0].id === editingAccount.id;

    if (isAddingFirstChecking || isEditingOnlyChecking) {
      isDefaultFinal = true;
    }

    const accToSave: BankAccount = {
      id: editingAccount ? editingAccount.id : window.crypto.randomUUID(),
      name: formData.name,
      bankName: formData.bankName,
      type: formData.type,
      isDefault: formData.type === 'checking' ? isDefaultFinal : false
    };

    if (accToSave.isDefault) {
      const otherAccountsToUpdate = bankAccounts
        .filter(a => a.id !== accToSave.id && a.isDefault)
        .map(a => ({ ...a, isDefault: false }));
      
      if (otherAccountsToUpdate.length > 0) {
        await saveBankAccountsBatch([...otherAccountsToUpdate, accToSave]);
      } else {
        await saveBankAccount(accToSave);
      }
    } else {
      await saveBankAccount(accToSave);
    }
    
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!checkInternet() || !accountToDelete) return;
    await deleteBankAccount(accountToDelete.id);
    setAccountToDelete(null);
  };

  const getTypeIcon = (type: BankAccount['type']) => {
    switch(type) {
      case 'checking': return 'fa-university';
      case 'savings': return 'fa-piggy-bank';
      case 'credit_card': return 'fa-credit-card';
      case 'investment': return 'fa-chart-line';
      default: return 'fa-wallet';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm transition-all"><i className="fas fa-bars"></i></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Minhas Contas</h2>
            <p className="text-slate-500">Gerencie seus bancos e cartões de crédito</p>
          </div>
        </div>
        <button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all font-medium"><i className="fas fa-plus text-sm"></i>Nova Conta</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {bankAccounts.map((acc) => {
          const isDinheiro = acc.name.toLowerCase() === 'dinheiro';
          const balance = transactions
            .filter(t => t.accountId === acc.id)
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div key={acc.id} className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group relative ${isDinheiro ? 'border-amber-100 bg-amber-50/10' : (acc.isDefault ? 'border-violet-200 ring-1 ring-violet-50' : 'border-slate-100')}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${acc.type === 'credit_card' ? 'bg-violet-50 text-violet-600' : acc.type === 'cash' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <i className={`fas ${getTypeIcon(acc.type)}`}></i>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 truncate">
                    {acc.name}
                    {acc.isDefault && <span className="text-[10px] text-slate-400 font-medium italic ml-1">(padrão)</span>}
                    {isDinheiro && <i className="fas fa-shield-halved text-amber-400 text-xs" title="Conta Protegida"></i>}
                  </h4>
                  <p className="text-sm text-slate-400 font-medium truncate">{acc.bankName}</p>
                  
                  <div className="mt-3">
                    <p className={`text-base font-black tracking-tight ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {acc.type === 'credit_card' ? 'Cartão de Crédito' : acc.type === 'cash' ? 'Em Espécie' : acc.type === 'checking' ? 'Corrente' : acc.type === 'savings' ? 'Poupança' : acc.type === 'investment' ? 'Investimento' : acc.type}
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(acc)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded-xl transition-all" title="Editar">
                  <i className="fas fa-pen text-sm"></i>
                </button>
                {!isDinheiro && (
                  <button onClick={() => setAccountToDelete(acc)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl transition-all" title="Excluir">
                    <i className="fas fa-trash-alt text-sm"></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {bankAccounts.length === 0 && <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100"><i className="fas fa-building-columns text-slate-200 text-5xl mb-4"></i><p className="text-slate-400 font-medium">Você ainda não possui contas cadastradas.</p></div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-xl font-bold text-slate-800">{editingAccount ? 'Editar Conta' : 'Nova Conta'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Nome da Conta</label>
                <input 
                  type="text" 
                  required 
                  readOnly={editingAccount?.name.toLowerCase() === 'dinheiro'}
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none transition-all font-bold bg-white text-black ${editingAccount?.name.toLowerCase() === 'dinheiro' ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="Ex: Conta Corrente"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Instituição</label>
                <input 
                  type="text" 
                  required 
                  value={formData.bankName} 
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white text-black font-bold" 
                  placeholder="Ex: Nubank"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Tipo de Conta</label>
                <select 
                  value={formData.type} 
                  disabled={editingAccount?.name.toLowerCase() === 'dinheiro'}
                  onChange={(e) => {
                    const newType = e.target.value as BankAccount['type'];
                    const isOnlyChecking = checkingAccounts.length === 0 || (editingAccount !== null && checkingAccounts.length === 1 && checkingAccounts[0].id === editingAccount.id);
                    setFormData({
                      ...formData, 
                      type: newType,
                      isDefault: newType === 'checking' && isOnlyChecking ? true : (newType !== 'checking' ? false : formData.isDefault)
                    });
                  }} 
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-black font-bold transition-all ${editingAccount?.name.toLowerCase() === 'dinheiro' ? 'opacity-70' : 'focus:ring-2 focus:ring-emerald-500'}`}
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="investment">Investimentos</option>
                  <option value="cash">Em Espécie (Dinheiro)</option>
                </select>
              </div>

              {formData.type === 'checking' && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
                  <input 
                    type="checkbox" 
                    id="isDefault"
                    checked={formData.isDefault === true}
                    disabled={checkingAccounts.length === 0 || (editingAccount !== null && checkingAccounts.length === 1 && checkingAccounts[0].id === editingAccount.id)}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                    className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <label htmlFor="isDefault" className="text-sm font-bold text-slate-700 cursor-pointer flex flex-col">
                    Definir como conta padrão
                    <span className="text-[10px] text-slate-400 font-normal">Pré-selecionada em novos lançamentos</span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão Premium */}
      {accountToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6 transform animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100">
              <i className="fas fa-trash-can"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Excluir Conta?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Tem certeza que deseja remover a conta <span className="font-bold text-slate-700">"{accountToDelete.name}"</span>? 
                Lançamentos vinculados a ela não serão apagados do seu histórico.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirmDelete} 
                className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
              >
                Sim, Excluir Agora
              </button>
              <button 
                onClick={() => setAccountToDelete(null)} 
                className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsManager;