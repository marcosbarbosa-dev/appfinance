import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Goal, Transaction } from '../types';

const GoalsManager: React.FC = () => {
  const { user, goals, saveGoal, deleteGoal, bankAccounts, transactions, saveTransaction, deleteTransactionFromDb, setIsSidebarOpen, checkInternet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<Goal | null>(null);
  const [editingContribution, setEditingContribution] = useState<Transaction | null>(null);
  const [contributionToDelete, setContributionToDelete] = useState<Transaction | null>(null);
  const [contributionError, setContributionError] = useState('');
  const [createGoalError, setCreateGoalError] = useState('');
  
  const [showContributionOptions, setShowContributionOptions] = useState(false);
  const [contributionMode, setContributionMode] = useState<'in' | 'out'>('in');

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    initialAmount: '',
    debitFromAccount: false,
    accountId: '',
    icon: 'fa-bullseye',
    color: '#8b5cf6'
  });

  const [contributionData, setContributionData] = useState({
    goalId: '',
    accountId: '',
    amount: ''
  });

  const parseFormattedNumber = (val: string) => {
    return parseFloat(String(val).replace(',', '.')) || 0;
  };

  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    bankAccounts.forEach(acc => {
      balances[acc.id] = transactions
        .filter(t => t.accountId === acc.id)
        .reduce((sum, t) => sum + t.amount, 0);
    });
    return balances;
  }, [bankAccounts, transactions]);

  const icons = [
    'fa-bullseye', 'fa-piggy-bank', 'fa-car', 'fa-house', 'fa-plane', 
    'fa-laptop', 'fa-mobile-screen', 'fa-gift', 'fa-graduation-cap', 
    'fa-briefcase', 'fa-gem', 'fa-heart', 'fa-star', 'fa-umbrella-beach'
  ];

  const colors = [
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', 
    '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#3b82f6'
  ];

  const openCreateModal = () => {
    setEditingGoal(null);
    setCreateGoalError('');
    setFormData({ 
      name: '', 
      targetAmount: '', 
      initialAmount: '', 
      debitFromAccount: false, 
      accountId: '',
      icon: 'fa-bullseye', 
      color: '#8b5cf6' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setCreateGoalError('');
    setFormData({ 
      name: goal.name, 
      targetAmount: goal.targetAmount.toString(), 
      initialAmount: '', 
      debitFromAccount: false,
      accountId: '',
      icon: goal.icon, 
      color: goal.color 
    });
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateGoalError('');
    if (!checkInternet() || !user) return;
    const target = parseFormattedNumber(formData.targetAmount);
    const initial = parseFormattedNumber(formData.initialAmount);
    if (target <= 0) return;
    const goalId = editingGoal ? editingGoal.id : crypto.randomUUID();
    let currentAmount = editingGoal ? editingGoal.currentAmount : initial;
    if (!editingGoal && formData.debitFromAccount && initial > 0) {
      if (!formData.accountId) {
        setCreateGoalError('Selecione uma conta para o débito inicial.');
        return;
      }
      const balance = accountBalances[formData.accountId] || 0;
      if (initial > balance) {
        setCreateGoalError('Saldo insuficiente na conta selecionada.');
        return;
      }
      const initialTransaction: Transaction = {
        id: crypto.randomUUID(),
        userId: user.uid,
        description: `Aporte Inicial Meta: ${formData.name}`,
        amount: -Math.abs(initial),
        type: 'expense',
        category: 'Metas',
        date: new Date().toISOString().split('T')[0],
        accountId: formData.accountId
      };
      await saveTransaction(initialTransaction);
    }
    const goalData: Goal = {
      id: goalId,
      userId: user.uid,
      name: formData.name,
      targetAmount: target,
      currentAmount: currentAmount,
      icon: formData.icon,
      color: formData.color,
      createdAt: editingGoal ? editingGoal.createdAt : new Date().toISOString()
    };
    await saveGoal(goalData);
    setIsModalOpen(false);
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setContributionError('');
    if (!checkInternet() || !user) return;
    const amount = Math.abs(parseFormattedNumber(contributionData.amount));
    const goal = goals.find(g => g.id === contributionData.goalId) || selectedGoalForHistory;
    if (!goal) return;
    if (editingContribution) {
      const oldAmountAbs = Math.abs(editingContribution.amount);
      const isOriginallyExpense = editingContribution.amount < 0;
      const diff = amount - oldAmountAbs;
      const finalAmount = isOriginallyExpense ? -amount : amount;
      if (isOriginallyExpense) {
        const balance = accountBalances[contributionData.accountId] || 0;
        if (diff > balance) {
          setContributionError('Saldo insuficiente na conta.');
          return;
        }
      } else {
        if (diff > (goal.currentAmount)) {
          setContributionError('Saldo insuficiente na meta.');
          return;
        }
      }
      const updatedTransaction: Transaction = {
        ...editingContribution,
        amount: finalAmount,
        accountId: contributionData.accountId
      };
      await saveTransaction(updatedTransaction);
      const goalDiff = isOriginallyExpense ? diff : -diff;
      const updatedGoal: Goal = { ...goal, currentAmount: Math.max(0, goal.currentAmount + goalDiff) };
      await saveGoal(updatedGoal);
      if (selectedGoalForHistory?.id === goal.id) setSelectedGoalForHistory(updatedGoal);
    } else {
      if (!contributionData.goalId || !contributionData.accountId) return;
      if (contributionMode === 'in') {
        const balance = accountBalances[contributionData.accountId] || 0;
        if (amount > balance) {
          setContributionError('Saldo insuficiente na conta');
          return;
        }
        if (amount > 0) {
          const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            userId: user.uid,
            description: `Aporte Meta: ${goal.name}`,
            amount: -amount,
            type: 'expense',
            category: 'Metas',
            date: new Date().toISOString().split('T')[0],
            accountId: contributionData.accountId
          };
          await saveTransaction(newTransaction);
          const updatedGoal: Goal = { ...goal, currentAmount: goal.currentAmount + amount };
          await saveGoal(updatedGoal);
        }
      } else {
        if (amount > goal.currentAmount) {
          setContributionError('Valor maior que o disponível na meta');
          return;
        }
        if (amount > 0) {
          const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            userId: user.uid,
            description: `Retirada Meta: ${goal.name}`,
            amount: amount,
            type: 'income',
            category: 'Metas',
            date: new Date().toISOString().split('T')[0],
            accountId: contributionData.accountId
          };
          await saveTransaction(newTransaction);
          const updatedGoal: Goal = { ...goal, currentAmount: Math.max(0, goal.currentAmount - amount) };
          await saveGoal(updatedGoal);
        }
      }
    }
    setContributionData({ goalId: '', accountId: '', amount: '' });
    setEditingContribution(null);
    setIsContributionModalOpen(false);
  };

  const executeDeleteContribution = async () => {
    if (!checkInternet() || !contributionToDelete) return;
    const t = contributionToDelete;
    const currentGoal = goals.find(g => selectedGoalForHistory && g.id === selectedGoalForHistory.id) || selectedGoalForHistory;
    if (!currentGoal) return;
    const amountAbs = Math.abs(t.amount);
    const isExpense = t.amount < 0;
    try {
      await deleteTransactionFromDb(t.id);
      const goalAdjustment = isExpense ? -amountAbs : amountAbs;
      const updatedGoal: Goal = { ...currentGoal, currentAmount: Math.max(0, currentGoal.currentAmount + goalAdjustment) };
      await saveGoal(updatedGoal);
      setSelectedGoalForHistory(updatedGoal);
      setIsContributionModalOpen(false);
      setEditingContribution(null);
      setContributionToDelete(null);
    } catch (err) {
      alert("Ocorreu um erro ao excluir o aporte.");
    }
  };

  const openHistoryModal = (goal: Goal) => {
    setSelectedGoalForHistory(goal);
    setIsHistoryModalOpen(true);
  };

  const openEditContributionModal = (t: Transaction) => {
    setEditingContribution(t);
    setContributionMode(t.amount < 0 ? 'in' : 'out');
    setContributionData({
      goalId: selectedGoalForHistory?.id || '',
      accountId: t.accountId,
      amount: Math.abs(t.amount).toString()
    });
    setIsContributionModalOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete || !checkInternet()) return;
    await deleteGoal(goalToDelete);
    setGoalToDelete(null);
  };

  const goalHistory = useMemo(() => {
    if (!selectedGoalForHistory) return [];
    return transactions.filter(t => t.userId === user?.uid && t.category === 'Metas' && t.description.includes(`Meta: ${selectedGoalForHistory.name}`))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedGoalForHistory, user]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm"><i className="fas fa-bars"></i></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Metas</h2>
            <p className="text-slate-500 text-sm">Gerencie seus objetivos financeiros</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="w-full md:w-auto px-6 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 flex items-center justify-center gap-2 transition-all">
          <i className="fas fa-plus"></i>Criar nova meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-inner border border-white/20" style={{ backgroundColor: goal.color }}><i className={`fas ${goal.icon}`}></i></div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openHistoryModal(goal)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600"><i className="fas fa-history text-xs"></i></button>
                  <button onClick={() => openEditModal(goal)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600"><i className="fas fa-pen text-xs"></i></button>
                  <button onClick={() => setGoalToDelete(goal.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500"><i className="fas fa-trash-alt text-xs"></i></button>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-black text-slate-800 text-lg tracking-tight truncate">{goal.name}</h4>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: goal.color }}></div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Acumulado</p>
                    <p className="font-black text-slate-800 text-sm">R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Objetivo</p>
                    <p className="font-black text-violet-600 text-sm">R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-24 right-6 z-30 flex flex-col items-end gap-3">
        {showContributionOptions && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => { setContributionError(''); setEditingContribution(null); setContributionMode('in'); setContributionData({ goalId: '', accountId: '', amount: '' }); setIsContributionModalOpen(true); setShowContributionOptions(false); }} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"><i className="fas fa-arrow-up"></i>Nova Entrada</button>
            <button onClick={() => { setContributionError(''); setEditingContribution(null); setContributionMode('out'); setContributionData({ goalId: '', accountId: '', amount: '' }); setIsContributionModalOpen(true); setShowContributionOptions(false); }} className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"><i className="fas fa-arrow-down"></i>Retirada</button>
          </div>
        )}
        <button onClick={() => setShowContributionOptions(!showContributionOptions)} className={`bg-violet-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all border-4 border-white ${showContributionOptions ? 'rotate-45 bg-slate-800' : 'hover:scale-110 active:scale-90'}`}><i className={`fas ${showContributionOptions ? 'fa-times' : 'fa-coins'} text-2xl`}></i></button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-lg font-bold text-slate-800">{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Nome da Meta</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 font-bold bg-white text-black"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Valor Alvo (R$)</label>
                  <input type="text" required inputMode="decimal" value={formData.targetAmount} onChange={(e) => setFormData({...formData, targetAmount: e.target.value})} placeholder="0,00" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 font-black bg-white text-black text-lg"/>
                </div>
                {!editingGoal && (
                  <>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Valor Inicial (R$)</label>
                    <input type="text" inputMode="decimal" value={formData.initialAmount} onChange={(e) => setFormData({...formData, initialAmount: e.target.value})} placeholder="0,00" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold bg-white text-black"/>
                    <div className="flex items-center gap-3"><button type="button" onClick={() => setFormData(prev => ({ ...prev, debitFromAccount: !prev.debitFromAccount }))} className={`w-10 h-6 rounded-full transition-all relative ${formData.debitFromAccount ? 'bg-violet-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.debitFromAccount ? 'right-1' : 'left-1'}`}></div></button><span className="text-[10px] font-black text-slate-500 uppercase">Debitar do saldo?</span></div>
                  </>
                )}
              </div>
              <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Salvar Meta</button>
            </form>
          </div>
        </div>
      )}

      {isContributionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 text-center">{contributionMode === 'in' ? 'Nova Entrada' : 'Retirada'}</h3>
            <form onSubmit={handleAddContribution} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Valor (R$)</label>
                <input type="text" required inputMode="decimal" value={contributionData.amount} onChange={(e) => setContributionData({...contributionData, amount: e.target.value})} placeholder="0,00" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-black bg-white text-black text-lg"/>
              </div>
              <button type="submit" className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest ${contributionMode === 'in' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirmar</button>
            </form>
          </div>
        </div>
      )}

      {goalToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100">
              <i className="fas fa-trash-can"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Excluir Meta?</h3>
              <p className="text-sm text-slate-500 font-medium">Esta ação é irreversível.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteGoal} className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl">Sim, Excluir</button>
              <button onClick={() => setGoalToDelete(null)} className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsManager;