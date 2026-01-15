
import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Transaction } from '../types';
import AddTransaction from './AddTransaction';

const TransactionsList: React.FC = () => {
  const { user, transactions, setTransactions, categories, setIsSidebarOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'credit_card'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.userId === user?.uid && t.type === activeTab)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user, activeTab]);

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este lançamento? Esta ação é irreversível.')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.color || '#cbd5e1';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 shadow-sm transition-all"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lançamentos</h2>
          <p className="text-slate-500">Histórico detalhado de suas movimentações</p>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mb-8 max-w-lg overflow-x-auto">
        {[
          { id: 'income', label: 'Entradas', icon: 'fa-arrow-up', color: 'emerald' },
          { id: 'expense', label: 'Saídas', icon: 'fa-arrow-down', color: 'rose' },
          { id: 'credit_card', label: 'Cartão', icon: 'fa-credit-card', color: 'violet' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id 
              ? `bg-white text-${tab.color}-600 shadow-sm` 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className={`fas ${tab.icon} text-xs`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{t.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }}></div>
                      <span className="text-sm text-slate-600">{t.category}</span>
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${activeTab === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {activeTab === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingTransaction(t)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <i className="fas fa-pen text-xs"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <i className="fas fa-search text-3xl mb-3 opacity-20 block"></i>
                    Nenhum lançamento encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Editar Lançamento</h3>
              <button onClick={() => setEditingTransaction(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <AddTransaction 
                editTransaction={editingTransaction} 
                onCancel={() => setEditingTransaction(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
