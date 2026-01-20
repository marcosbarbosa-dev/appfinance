import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Transaction, BankAccount } from '../types';

interface TransfersManagerProps {
  isModal?: boolean;
  onCancel?: () => void;
}

const TransfersManager: React.FC<TransfersManagerProps> = ({ isModal, onCancel }) => {
  const { user, transactions, bankAccounts, saveTransactions, setIsSidebarOpen, checkInternet, setActiveView, setTransactionListTab } = useAuth();
  
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Transferência Interna'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const eligibleAccounts = useMemo(() => {
    return bankAccounts.filter(acc => acc.type !== 'credit_card');
  }, [bankAccounts]);

  const sourceBalance = useMemo(() => {
    if (!formData.fromAccountId) return 0;
    return transactions
      .filter(t => t.accountId === formData.fromAccountId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions, formData.fromAccountId]);

  const canTransfer = useMemo(() => {
    return (
      formData.fromAccountId !== '' &&
      formData.toAccountId !== '' &&
      formData.fromAccountId !== formData.toAccountId &&
      parseFloat(formData.amount) > 0
    );
  }, [formData]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet() || !canTransfer || !user) return;
    const amountValue = parseFloat(formData.amount);
    if (sourceBalance < amountValue) {
      setError(`Saldo insuficiente. Disponível: R$ ${sourceBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fromAcc = eligibleAccounts.find(a => a.id === formData.fromAccountId);
      const toAcc = eligibleAccounts.find(a => a.id === formData.toAccountId);
      const debitTransaction: Transaction = {
        id: crypto.randomUUID(),
        userId: user.uid,
        description: `Transferência: Enviado para ${toAcc?.name}`,
        amount: -Math.abs(amountValue),
        type: 'transfer',
        category: 'Transferência',
        accountId: formData.fromAccountId,
        date: formData.date
      };
      const creditTransaction: Transaction = {
        id: crypto.randomUUID(),
        userId: user.uid,
        description: `Transferência: Recebido de ${fromAcc?.name}`,
        amount: Math.abs(amountValue),
        type: 'transfer',
        category: 'Transferência',
        accountId: formData.toAccountId,
        date: formData.date
      };
      await saveTransactions([debitTransaction, creditTransaction]);
      setTransactionListTab('transfer');
      if (onCancel) {
        onCancel();
        setActiveView('lancamentos');
      } else {
        setActiveView('lancamentos');
      }
    } catch (err) {
      setError('Falha ao processar transferência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isModal ? 'p-4 md:p-6' : 'p-4 md:p-8 max-w-2xl mx-auto space-y-8'}`}>
      {!isModal && (
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm transition-all"><i className="fas fa-bars"></i></button>
          <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">Transferências</h2><p className="text-slate-500 text-sm">Movimente saldo entre suas contas</p></div>
        </div>
      )}

      <div className={`${isModal ? '' : 'bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm'}`}>
        <form onSubmit={handleTransfer} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem (Sai de)</label>
              <select required value={formData.fromAccountId} onChange={(e) => { setFormData({...formData, fromAccountId: e.target.value}); setError(''); }} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-black"><option value="">Selecione a conta</option>{eligibleAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>))}</select>
              {formData.fromAccountId && (<p className="text-[10px] font-bold text-slate-400 ml-1">Saldo: <span className={sourceBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>R$ {sourceBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>)}
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destino (Entra em)</label>
              <select required value={formData.toAccountId} onChange={(e) => setFormData({...formData, toAccountId: e.target.value})} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-black"><option value="">Selecione a conta</option>{eligibleAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>))}</select>
            </div>
          </div>
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  required 
                  value={formData.amount} 
                  onChange={(e) => { setFormData({...formData, amount: e.target.value}); setError(''); }} 
                  placeholder="0,00" 
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none font-black bg-white text-black text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Data</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none font-bold bg-white text-black"/>
            </div>
          </div>
          {error && (<div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2 animate-in shake"><i className="fas fa-exclamation-circle"></i>{error}</div>)}
          
          <div className="flex flex-col gap-2">
            <button type="submit" disabled={loading || !canTransfer} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-violet-700 transition-all disabled:opacity-50">Confirmar Transferência</button>
            {isModal && onCancel && (
              <button type="button" onClick={onCancel} className="w-full py-4 text-slate-400 hover:text-rose-600 font-bold transition-all text-sm">Cancelar</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransfersManager;