
import React, { useState } from 'react';
import { useAuth } from '../App';
import { BankAccount } from '../types';

const AccountsManager: React.FC = () => {
  const { bankAccounts, saveBankAccount, deleteBankAccount, setIsSidebarOpen, checkInternet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    type: 'checking' as BankAccount['type']
  });

  const openModal = (account: BankAccount | null = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({ name: account.name, bankName: account.bankName, type: account.type });
    } else {
      setEditingAccount(null);
      setFormData({ name: '', bankName: '', type: 'checking' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;

    const accToSave: BankAccount = {
      id: editingAccount ? editingAccount.id : crypto.randomUUID(),
      name: formData.name,
      bankName: formData.bankName,
      type: formData.type
    };

    await saveBankAccount(accToSave);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!checkInternet()) return;
    if (name === 'Dinheiro') {
      alert('A conta de Dinheiro é essencial para o sistema e não pode ser removida.');
      return;
    }
    if (confirm(`Deseja excluir a conta "${name}"? Lançamentos vinculados a ela ficarão órfãos.`)) {
      await deleteBankAccount(id);
    }
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
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
          const isImmutable = acc.name === 'Dinheiro' && acc.type === 'cash';
          return (
            <div key={acc.id} className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group relative ${isImmutable ? 'border-amber-100' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${acc.type === 'credit_card' ? 'bg-violet-50 text-violet-600' : acc.type === 'cash' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <i className={`fas ${getTypeIcon(acc.type)}`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    {acc.name}
                    {isImmutable && <i className="fas fa-shield-halved text-amber-400 text-xs" title="Conta Protegida"></i>}
                  </h4>
                  <p className="text-sm text-slate-400 font-medium">{acc.bankName}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {acc.type === 'credit_card' ? 'Cartão de Crédito' : acc.type === 'cash' ? 'Em Espécie' : acc.type === 'checking' ? 'Corrente' : acc.type}
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(acc)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded-xl transition-all" title="Editar">
                  <i className="fas fa-pen text-sm"></i>
                </button>
                {!isImmutable && (
                  <button onClick={() => handleDelete(acc.id, acc.name)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl transition-all" title="Excluir">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200">
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
                  readOnly={editingAccount?.name === 'Dinheiro'}
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none transition-all ${editingAccount?.name === 'Dinheiro' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500'}`} 
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  placeholder="Ex: Nubank"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Tipo de Conta</label>
                <select 
                  value={formData.type} 
                  disabled={editingAccount?.name === 'Dinheiro'}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})} 
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white transition-all ${editingAccount?.name === 'Dinheiro' ? 'text-slate-400 opacity-70' : ''}`}
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="investment">Investimentos</option>
                  <option value="cash">Em Espécie (Dinheiro)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsManager;
