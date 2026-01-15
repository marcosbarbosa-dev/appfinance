
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../App';
import { TransactionType, Transaction, BankAccount } from '../types';

interface AddTransactionProps {
  editTransaction?: Transaction | null;
  onCancel?: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ editTransaction, onCancel }) => {
  const { setActiveView, categories, transactions, setTransactions, bankAccounts, user, setIsSidebarOpen } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: '',
    accountId: '',
    date: today,
  });

  useEffect(() => {
    if (editTransaction) {
      setFormData({
        description: editTransaction.description,
        amount: editTransaction.amount.toString(),
        type: editTransaction.type,
        category: editTransaction.category,
        accountId: editTransaction.accountId,
        date: editTransaction.date,
      });
    }
  }, [editTransaction]);

  const filteredCategories = useMemo(() => {
    const typeToFilter = formData.type === 'income' ? 'income' : 'expense';
    return categories.filter(c => c.type === typeToFilter);
  }, [categories, formData.type]);

  const filteredAccounts = useMemo(() => {
    if (formData.type === 'credit_card') {
      return bankAccounts.filter(acc => acc.type === 'credit_card');
    }
    return bankAccounts.filter(acc => acc.type !== 'credit_card');
  }, [bankAccounts, formData.type]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === formData.category)) {
      setFormData(prev => ({ ...prev, category: filteredCategories[0].name }));
    }
  }, [filteredCategories]);

  useEffect(() => {
    if (filteredAccounts.length > 0 && !filteredAccounts.find(a => a.id === formData.accountId)) {
      setFormData(prev => ({ ...prev, accountId: filteredAccounts[0].id }));
    }
  }, [filteredAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editTransaction) {
      setTransactions(transactions.map(t => 
        t.id === editTransaction.id ? { ...t, ...formData, amount: parseFloat(formData.amount) } : t
      ));
    } else {
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.uid || 'anonymous',
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        date: formData.date,
        category: formData.category,
        accountId: formData.accountId,
      };
      setTransactions([...transactions, newTransaction]);
    }
    
    if (onCancel) onCancel();
    else setActiveView('inicio');
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else setActiveView('inicio');
  };

  return (
    <div className={`p-4 md:p-8 max-w-2xl mx-auto ${editTransaction ? 'bg-white p-0 shadow-none' : ''}`}>
      {!editTransaction && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Novo Lançamento</h2>
              <p className="text-slate-500 text-sm">Registre sua movimentação Personalle</p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className={`rounded-3xl ${editTransaction ? '' : 'bg-white shadow-sm border border-slate-100 overflow-hidden'}`}>
        <form onSubmit={handleSubmit} className={`${editTransaction ? '' : 'p-8'} space-y-8`}>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-4 text-center text-slate-500 uppercase tracking-widest">Selecione o Fluxo</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
              {[
                { id: 'income', label: 'Entrada', icon: 'fa-arrow-up', color: 'text-violet-500', active: 'bg-white shadow-sm' },
                { id: 'expense', label: 'Saída', icon: 'fa-arrow-down', color: 'text-rose-500', active: 'bg-white shadow-sm' },
                { id: 'credit_card', label: 'Cartão', icon: 'fa-credit-card', color: 'text-purple-500', active: 'bg-white shadow-sm' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({...formData, type: t.id as TransactionType})}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${formData.type === t.id ? t.active : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <i className={`fas ${t.icon} ${formData.type === t.id ? t.color : ''}`}></i>
                  <span className={`text-xs font-bold ${formData.type === t.id ? 'text-slate-800' : ''}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Conta Relacionada</label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 bg-white"
                >
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bankName})
                      </option>
                    ))
                  ) : (
                    <option value="">Nenhuma conta cadastrada</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Assinatura Personalle"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 bg-white"
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                  ) : (
                    <option value="">Nenhuma categoria</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Data da Transação</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={filteredCategories.length === 0 || filteredAccounts.length === 0}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i className="fas fa-check"></i>
              {editTransaction ? 'Atualizar Registro' : 'Salvar no Extrato'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-4 text-slate-400 hover:text-rose-600 font-bold transition-all"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;