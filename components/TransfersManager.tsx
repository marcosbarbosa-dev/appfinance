
import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Transaction, BankAccount } from '../types';

const TransfersManager: React.FC = () => {
  const { user, transactions, bankAccounts, saveTransactions, setIsSidebarOpen, checkInternet, setActiveView } = useAuth();
  
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Transferência Interna'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtramos apenas contas que NÃO sejam Cartão de Crédito
  const eligibleAccounts = useMemo(() => {
    return bankAccounts.filter(acc => acc.type !== 'credit_card');
  }, [bankAccounts]);

  // Cálculo do saldo em tempo real da conta de origem selecionada
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

    // Validação de saldo insuficiente
    if (sourceBalance < amountValue) {
      setError(`Saldo insuficiente. Saldo disponível: R$ ${sourceBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fromAcc = eligibleAccounts.find(a => a.id === formData.fromAccountId);
      const toAcc = eligibleAccounts.find(a => a.id === formData.toAccountId);

      // Criamos dois lançamentos: um negativo na origem e um positivo no destino
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
      setActiveView('lancamentos');
    } catch (err) {
      setError('Falha ao processar transferência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 transition-all shadow-sm"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Transferências</h2>
          <p className="text-slate-500 text-sm">Movimente saldo entre suas contas</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <form onSubmit={handleTransfer} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Conta de Origem */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem (Sai de)</label>
              <select 
                required
                value={formData.fromAccountId}
                onChange={(e) => {
                  setFormData({...formData, fromAccountId: e.target.value});
                  setError(''); // Limpa erro ao trocar a conta
                }}
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
              >
                <option value="">Selecione a conta</option>
                {eligibleAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>
                ))}
              </select>
              {formData.fromAccountId && (
                <p className="text-[10px] font-bold text-slate-400 ml-1">
                  Saldo disponível: <span className={sourceBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    R$ {sourceBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              )}
            </div>

            {/* Ícone de seta no meio */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 bg-white border border-slate-100 rounded-full items-center justify-center text-violet-500 shadow-md z-10">
              <i className="fas fa-arrow-right-long"></i>
            </div>

            {/* Conta de Destino */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destino (Entra em)</label>
              <select 
                required
                value={formData.toAccountId}
                onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
              >
                <option value="">Selecione a conta</option>
                {eligibleAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({...formData, amount: e.target.value});
                    setError(''); // Limpa erro ao digitar
                  }}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none font-black text-slate-800 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-700"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2 animate-in shake duration-300">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit"
              disabled={loading || !canTransfer}
              className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {loading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Confirmar Transferência'}
            </button>
            <p className="mt-4 text-[10px] text-slate-400 text-center uppercase font-black tracking-tight opacity-70">
              * Operação interna sem impacto em relatórios de ganhos/gastos
            </p>
          </div>
        </form>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50 flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100 shrink-0">
          <i className="fas fa-circle-info"></i>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          Transferências são úteis para registrar quando você saca dinheiro do banco para sua carteira, ou quando transfere entre contas de diferentes instituições. Essas ações não contam como "Receita" ou "Despesa" nos seus gráficos mensais.
        </p>
      </div>
    </div>
  );
};

export default TransfersManager;
