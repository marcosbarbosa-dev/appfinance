
import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Transaction } from '../types';
import AddTransaction from './AddTransaction';

const TransactionsList: React.FC = () => {
  const { user, transactions, deleteTransactionFromDb, categories, bankAccounts, setIsSidebarOpen, checkInternet } = useAuth();
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'credit_card'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.userId === user?.uid && t.type === activeTab)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user, activeTab]);

  const handleDelete = async () => {
    if (!checkInternet()) return;
    if (editingTransaction) {
      await deleteTransactionFromDb(editingTransaction.id);
      setEditingTransaction(null);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  };

  return (
    <div className="p-2 md:p-8 max-w-5xl mx-auto pb-24 overflow-hidden">
      <div className="flex items-center gap-4 mb-6 px-2">
        <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 shadow-sm transition-all"><i className="fas fa-bars"></i></button>
        <div><h2 className="text-xl md:text-2xl font-bold text-slate-800">Lançamentos</h2><p className="text-slate-400 text-xs">Extrato Personalle Infinity</p></div>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mb-6 w-full max-w-md mx-auto sm:mx-0">
        {[
          { id: 'income', label: 'Entradas', icon: 'fa-arrow-up', color: 'text-violet-600' },
          { id: 'expense', label: 'Saídas', icon: 'fa-arrow-down', color: 'text-rose-600' },
          { id: 'credit_card', label: 'Cartão', icon: 'fa-credit-card', color: 'text-purple-600' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2.5 px-1 rounded-xl font-bold text-[10px] md:text-xs transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id ? `bg-white ${tab.color} shadow-sm` : 'text-slate-500'}`}><i className={`fas ${tab.icon} text-[9px]`}></i><span>{tab.label}</span></button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-hidden">
          <table className="w-full text-left table-fixed border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <tr><th className="px-3 py-4 w-[60px] md:w-24">Data</th><th className="px-1 py-4">Descrição</th><th className="px-2 py-4 text-right w-[95px] md:w-40">Valor</th><th className="px-3 py-4 text-right w-[55px] md:w-16"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(t => {
                const acc = bankAccounts.find(a => a.id === t.accountId);
                return (
                  <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-4 text-[10px] md:text-xs font-bold text-slate-400">{formatDate(t.date)}</td>
                    <td className="px-1 py-4 overflow-hidden"><div className="flex flex-col min-w-0"><div className="flex items-center gap-2"><span className="font-bold text-slate-800 text-xs md:text-sm truncate">{t.description || 'Sem descrição'}</span>{t.installmentNumber && <span className="bg-purple-50 text-purple-600 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-purple-100 shrink-0">{t.installmentNumber}/{t.totalInstallments}</span>}</div><div className="flex items-center gap-1.5 mt-0.5"><span className="text-[9px] text-violet-500 font-black uppercase tracking-tighter truncate opacity-80">{t.category}</span><span className="text-[9px] text-slate-300">•</span><span className={`text-[8px] font-black px-1 rounded border ${acc?.type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{acc?.name || 'S/ Conta'}</span></div></div></td>
                    <td className={`px-2 py-4 text-right font-black text-xs md:text-base ${t.amount >= 0 ? 'text-violet-600' : 'text-slate-900'}`}>{t.amount >= 0 ? '+' : ''} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-4 text-right"><button onClick={() => setEditingTransaction(t)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-violet-50 text-violet-600 border border-violet-100 rounded-xl hover:bg-violet-600 hover:text-white transition-all"><i className="fas fa-pen-to-square text-xs md:text-sm"></i></button></td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-300"><i className="fas fa-receipt text-5xl opacity-10 mb-2"></i><p className="text-sm font-medium">Nenhum registro encontrado.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editingTransaction && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center"><i className="fas fa-sliders"></i></div><div><h3 className="text-base font-bold text-slate-800">Editar Lançamento</h3><p className="text-[10px] text-slate-400">Ajuste seu registro financeiro</p></div></div><button onClick={() => setEditingTransaction(null)} className="text-slate-300 hover:text-slate-600"><i className="fas fa-times text-lg"></i></button></div>
            <div className="flex-1 overflow-y-auto"><AddTransaction editTransaction={editingTransaction} onCancel={() => setEditingTransaction(null)} /><div className="px-5 pb-8 pt-2"><button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 group"><i className="fas fa-trash-can text-[10px]"></i>Remover Registro</button></div></div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner"><i className="fas fa-exclamation-triangle"></i></div>
            <div className="space-y-2"><h3 className="text-xl font-bold text-slate-800">Excluir Registro?</h3><p className="text-sm text-slate-500">Esta ação é irreversível e o lançamento será removido permanentemente.</p></div>
            <div className="flex flex-col gap-3"><button onClick={handleDelete} className="w-full py-4 bg-rose-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-rose-700 transition-all">Confirmar Exclusão</button><button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600">Cancelar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
