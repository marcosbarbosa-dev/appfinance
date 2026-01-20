import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Goal, Transaction } from '../types';

const GoalsManager: React.FC = () => {
  const { user, goals, saveGoal, deleteGoal, bankAccounts, transactions, saveTransaction, saveTransactions, deleteTransactionFromDb, setIsSidebarOpen, checkInternet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<Goal | null>(null);
  const [contributionError, setContributionError] = useState('');
  const [createGoalError, setCreateGoalError] = useState('');
  const [showNoGoalsModal, setShowNoGoalsModal] = useState(false);
  
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

  // Estado para edição de item específico do histórico
  const [isEditHistoryItemModalOpen, setIsEditHistoryItemModalOpen] = useState(false);
  const [editingHistoryItem, setEditingHistoryItem] = useState<Transaction | null>(null);
  const [editHistoryAmount, setEditHistoryAmount] = useState('');
  const [editHistoryAccountId, setEditHistoryAccountId] = useState('');

  const parseFormattedNumber = (val: string) => {
    return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
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

  const eligibleAccounts = useMemo(() => {
    return bankAccounts.filter(acc => acc.type !== 'credit_card');
  }, [bankAccounts]);

  // Define currentContributionGoal based on selected goalId or first available goal
  const currentContributionGoal = useMemo(() => {
    const goalId = contributionData.goalId || (goals.length === 1 ? goals[0].id : '');
    return goals.find(g => g.id === goalId);
  }, [goals, contributionData.goalId]);

  const icons = [
    'fa-bullseye', 'fa-piggy-bank', 'fa-car', 'fa-house', 'fa-plane', 
    'fa-laptop', 'fa-mobile-screen', 'fa-gift', 'fa-graduation-cap', 
    'fa-briefcase', 'fa-gem', 'fa-heart', 'fa-star', 'fa-umbrella-beach'
  ];

  const colors = [
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', 
    '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#3b82f6'
  ];

  const handleOpenContributionMenu = () => {
    if (goals.length === 0) {
      setShowNoGoalsModal(true);
      return;
    }
    setShowContributionOptions(!showContributionOptions);
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setCreateGoalError('');
    setFormData({ 
      name: '', 
      targetAmount: '', 
      initialAmount: '', 
      debitFromAccount: false, 
      accountId: eligibleAccounts[0]?.id || '',
      icon: 'fa-bullseye', 
      color: '#8b5cf6' 
    });
    setIsModalOpen(true);
    setShowNoGoalsModal(false);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setCreateGoalError('');
    setFormData({ 
      name: goal.name, 
      targetAmount: goal.targetAmount.toString(), 
      initialAmount: '', 
      debitFromAccount: false,
      accountId: eligibleAccounts[0]?.id || '',
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
    
    if (target <= 0) {
      setCreateGoalError('O valor alvo deve ser maior que zero.');
      return;
    }

    const goalId = editingGoal ? editingGoal.id : crypto.randomUUID();
    let currentAmount = editingGoal ? editingGoal.currentAmount : initial;

    // Se mudou o nome da meta, atualizar todas as transações vinculadas
    if (editingGoal && editingGoal.name !== formData.name) {
      const relatedTransactions = transactions.filter(t => 
        t.category === 'Metas' && t.description.includes(`Meta: ${editingGoal.name}`)
      );
      
      if (relatedTransactions.length > 0) {
        const updatedTransactions = relatedTransactions.map(t => ({
          ...t,
          description: t.description.replace(`Meta: ${editingGoal.name}`, `Meta: ${formData.name}`)
        }));
        await saveTransactions(updatedTransactions);
      }
    }

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
        description: `Entrada Inicial Meta: ${formData.name}`,
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
    const goalId = contributionData.goalId || (goals.length === 1 ? goals[0].id : '');
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) {
      setContributionError('Selecione uma meta válida.');
      return;
    }

    if (contributionMode === 'in') {
      const balance = accountBalances[contributionData.accountId] || 0;
      if (amount > balance) {
        setContributionError('Saldo insuficiente na conta selecionada.');
        return;
      }
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        userId: user.uid,
        description: `Entrada Meta: ${goal.name}`,
        amount: -amount,
        type: 'expense',
        category: 'Metas',
        date: new Date().toISOString().split('T')[0],
        accountId: contributionData.accountId
      };
      await saveTransaction(newTransaction);
      await saveGoal({ ...goal, currentAmount: goal.currentAmount + amount });
    } else {
      if (amount > goal.currentAmount) {
        setContributionError('Valor maior que o disponível na meta.');
        return;
      }
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
      await saveGoal({ ...goal, currentAmount: Math.max(0, goal.currentAmount - amount) });
    }
    
    setIsContributionModalOpen(false);
    setContributionData({ goalId: '', accountId: '', amount: '' });
  };

  const openHistoryModal = (goal: Goal) => {
    setSelectedGoalForHistory(goal);
    setIsHistoryModalOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete || !checkInternet()) return;
    
    const goal = goals.find(g => g.id === goalToDelete);
    if (goal) {
      // Remover todas as transações vinculadas a esta meta
      const relatedTransactions = transactions.filter(t => 
        t.category === 'Metas' && t.description.includes(`Meta: ${goal.name}`)
      );
      
      for (const t of relatedTransactions) {
        await deleteTransactionFromDb(t.id);
      }
    }
    
    await deleteGoal(goalToDelete);
    setGoalToDelete(null);
  };

  const goalHistory = useMemo(() => {
    if (!selectedGoalForHistory) return [];
    return transactions.filter(t => 
      t.userId === user?.uid && 
      t.category === 'Metas' && 
      t.description.includes(`Meta: ${selectedGoalForHistory.name}`)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedGoalForHistory, user]);

  const handleDeleteHistoryItem = async (transaction: Transaction) => {
    if (!selectedGoalForHistory || !checkInternet()) return;
    if (confirm("Deseja realmente excluir este lançamento? Esta ação também removerá o valor do seu extrato e relatórios.")) {
      const amountAbs = Math.abs(transaction.amount);
      const isEntrada = transaction.amount < 0;
      
      const newCurrentAmount = isEntrada 
        ? selectedGoalForHistory.currentAmount - amountAbs 
        : selectedGoalForHistory.currentAmount + amountAbs;
      
      const updatedGoal = { ...selectedGoalForHistory, currentAmount: Math.max(0, newCurrentAmount) };
      await saveGoal(updatedGoal);
      await deleteTransactionFromDb(transaction.id);
      
      setSelectedGoalForHistory(updatedGoal);
    }
  };

  const openEditHistoryItem = (transaction: Transaction) => {
    setEditingHistoryItem(transaction);
    setEditHistoryAmount(Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setEditHistoryAccountId(transaction.accountId);
    setIsEditHistoryItemModalOpen(true);
  };

  const handleSaveHistoryItemEdit = async () => {
    if (!editingHistoryItem || !selectedGoalForHistory || !checkInternet()) return;
    const newAmountAbs = parseFormattedNumber(editHistoryAmount);
    const oldAmountAbs = Math.abs(editingHistoryItem.amount);
    
    const isEntrada = editingHistoryItem.amount < 0;
    const difference = newAmountAbs - oldAmountAbs;
    
    let newGoalAmount = selectedGoalForHistory.currentAmount;

    // Se mudou de conta, precisa devolver para a antiga e tirar da nova
    if (editHistoryAccountId !== editingHistoryItem.accountId) {
      // Estorno na conta antiga (se era entrada, devolve o valor oldAmountAbs para a conta)
      // Como não criamos transações de estorno manuais, apenas alteramos a transação atual.
      // O sistema recalcula saldos dinamicamente baseado em transactions.
    }

    if (isEntrada) {
      // Verificar saldo se o valor aumentou (mais dinheiro saindo da conta)
      if (difference > 0) {
        const balance = accountBalances[editHistoryAccountId] || 0;
        // Compensar o fato de que a transação antiga já está debitada no saldo se for a mesma conta
        const actualBalance = editHistoryAccountId === editingHistoryItem.accountId ? balance + oldAmountAbs : balance;
        
        if (newAmountAbs > actualBalance) {
          alert("Saldo insuficiente na conta selecionada.");
          return;
        }
      }
      newGoalAmount += difference;
    } else {
      // Retirada: verificar se a meta tem saldo para a nova retirada
      if (newAmountAbs > (selectedGoalForHistory.currentAmount + oldAmountAbs)) {
        alert("Saldo insuficiente na meta para esta retirada.");
        return;
      }
      newGoalAmount -= difference;
    }

    const updatedTransaction: Transaction = {
      ...editingHistoryItem,
      accountId: editHistoryAccountId,
      amount: isEntrada ? -newAmountAbs : newAmountAbs
    };

    await saveTransaction(updatedTransaction);
    const updatedGoal = { ...selectedGoalForHistory, currentAmount: Math.max(0, newGoalAmount) };
    await saveGoal(updatedGoal);
    
    setSelectedGoalForHistory(updatedGoal);
    setIsEditHistoryItemModalOpen(false);
    setEditingHistoryItem(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm transition-all active:scale-95"><i className="fas fa-bars"></i></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Metas</h2>
            <p className="text-slate-500 text-sm">Gerencie seus objetivos financeiros</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="w-full md:w-auto px-6 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 flex items-center justify-center gap-2 transition-all hover:bg-violet-700 active:scale-95">
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
                  <button onClick={() => openHistoryModal(goal)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600 transition-colors"><i className="fas fa-history text-xs"></i></button>
                  <button onClick={() => openEditModal(goal)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-colors"><i className="fas fa-pen text-xs"></i></button>
                  <button onClick={() => setGoalToDelete(goal.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
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
        {goals.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <i className="fas fa-bullseye text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhuma meta ativa</p>
          </div>
        )}
      </div>

      {/* Botão Flutuante de Entradas/Retiradas */}
      <div className="fixed bottom-24 right-6 z-30 flex flex-col items-end gap-3">
        {showContributionOptions && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => { 
                setContributionError(''); 
                setContributionMode('in'); 
                setContributionData({ goalId: goals[0]?.id || '', accountId: eligibleAccounts[0]?.id || '', amount: '' }); 
                setIsContributionModalOpen(true); 
                setShowContributionOptions(false); 
              }} 
              className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <i className="fas fa-arrow-up"></i>Nova Entrada
            </button>
            <button 
              onClick={() => { 
                setContributionError(''); 
                setContributionMode('out'); 
                setContributionData({ goalId: goals[0]?.id || '', accountId: eligibleAccounts[0]?.id || '', amount: '' }); 
                setIsContributionModalOpen(true); 
                setShowContributionOptions(false); 
              }} 
              className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <i className="fas fa-arrow-down"></i>Retirada
            </button>
          </div>
        )}
        <button 
          onClick={handleOpenContributionMenu} 
          className={`bg-violet-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all border-4 border-white ${showContributionOptions ? 'rotate-45 bg-slate-800' : 'hover:scale-110 active:scale-90'}`}
        >
          <i className={`fas ${showContributionOptions ? 'fa-times' : 'fa-coins'} text-2xl`}></i>
        </button>
      </div>

      {/* Modal Nenhuma Meta Criada */}
      {showNoGoalsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto bg-violet-50 text-violet-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-violet-100">
              <i className="fas fa-bullseye"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Crie uma nova meta!</h3>
              <p className="text-sm text-slate-500 font-medium">Você ainda não possui nenhuma meta criada. Para realizar entradas ou retiradas, você precisa de uma nova meta primeiro.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={openCreateModal} className="w-full py-4 bg-violet-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-violet-700 transition-all active:scale-95">Criar Nova Meta</button>
              <button onClick={() => setShowNoGoalsModal(false)} className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest transition-colors hover:text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Defina seu objetivo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome do Objetivo</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 font-bold bg-white text-black outline-none transition-all"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Valor Alvo (R$)</label>
                    <input type="text" required inputMode="decimal" value={formData.targetAmount} onChange={(e) => setFormData({...formData, targetAmount: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 font-black bg-white text-black text-base outline-none"/>
                  </div>
                  {!editingGoal && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Entrada Inicial (R$)</label>
                      <input type="text" inputMode="decimal" value={formData.initialAmount} onChange={(e) => setFormData({...formData, initialAmount: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 font-black bg-white text-black text-base outline-none"/>
                    </div>
                  )}
                </div>

                {!editingGoal && formData.initialAmount && parseFormattedNumber(formData.initialAmount) > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Debitar do saldo disponível?</span>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, debitFromAccount: !prev.debitFromAccount }))} className={`w-10 h-6 rounded-full transition-all relative ${formData.debitFromAccount ? 'bg-violet-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.debitFromAccount ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                    {formData.debitFromAccount && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Selecionar Conta</label>
                        <select 
                          value={formData.accountId} 
                          onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-black"
                        >
                          {eligibleAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} (R$ {accountBalances[acc.id]?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] font-bold text-slate-400 ml-1">O valor será deduzido do saldo atual da conta.</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1">Ícone</label>
                  <div className="grid grid-cols-7 gap-2">
                    {icons.map(icon => (
                      <button 
                        key={icon} 
                        type="button" 
                        onClick={() => setFormData({...formData, icon})}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.icon === icon ? 'bg-violet-600 text-white shadow-lg scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        <i className={`fas ${icon} text-sm`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button 
                        key={color} 
                        type="button" 
                        onClick={() => setFormData({...formData, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-slate-800 scale-110 shadow-lg' : 'border-white'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {createGoalError && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2 animate-in shake">
                  <i className="fas fa-exclamation-circle"></i>
                  {createGoalError}
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-violet-700 transition-all active:scale-95">
                {editingGoal ? 'Atualizar Objetivo' : 'Confirmar Meta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Entrada/Retirada */}
      {isContributionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800">{contributionMode === 'in' ? 'Nova Entrada' : 'Retirada'}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Movimentação de Meta</p>
            </div>
            <form onSubmit={handleAddContribution} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Escolher Meta</label>
                <select 
                  required 
                  value={contributionData.goalId} 
                  onChange={(e) => setContributionData({...contributionData, goalId: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-black"
                >
                  {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                {contributionMode === 'out' && currentContributionGoal && (
                  <p className="text-[10px] font-bold text-violet-500 mt-1 ml-1">
                    Disponível na Meta: R$ {currentContributionGoal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Conta Financeira</label>
                <select 
                  required 
                  value={contributionData.accountId} 
                  onChange={(e) => setContributionData({...contributionData, accountId: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-black"
                >
                  {eligibleAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (R$ {accountBalances[acc.id]?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label>
                <input type="text" required inputMode="decimal" value={contributionData.amount} onChange={(e) => setContributionData({...contributionData, amount: e.target.value})} placeholder="0,00" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-black bg-white text-black text-xl text-center outline-none focus:ring-2 focus:ring-violet-500"/>
              </div>

              {contributionError && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase border border-rose-100 animate-in shake">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {contributionError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button type="submit" className={`w-full py-5 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${contributionMode === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Confirmar Operação</button>
                <button type="button" onClick={() => setIsContributionModalOpen(false)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico */}
      {isHistoryModalOpen && selectedGoalForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: selectedGoalForHistory.color }}><i className={`fas ${selectedGoalForHistory.icon}`}></i></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedGoalForHistory.name}</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Histórico de Movimentações</p>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {goalHistory.length > 0 ? (
                <div className="space-y-3">
                  {goalHistory.map(t => (
                    <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{t.description}</p>
                        <p className={`font-black text-sm ${t.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.amount >= 0 ? '+' : ''} R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditHistoryItem(t)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-violet-600 rounded-lg shadow-sm border border-slate-100 transition-all"><i className="fas fa-pen text-[10px]"></i></button>
                        <button onClick={() => handleDeleteHistoryItem(t)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-rose-600 rounded-lg shadow-sm border border-slate-100 transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-300">
                  <i className="fas fa-history text-4xl mb-3 opacity-10"></i>
                  <p className="text-xs font-bold uppercase tracking-widest">Sem movimentações</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edição de Item do Histórico */}
      {isEditHistoryItemModalOpen && editingHistoryItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800">Editar Lançamento</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{editingHistoryItem.description}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Conta Financeira</label>
                <select 
                  required 
                  value={editHistoryAccountId} 
                  onChange={(e) => setEditHistoryAccountId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-black text-sm"
                >
                  {eligibleAccounts.map(acc => {
                    const balance = accountBalances[acc.id] || 0;
                    // Compensar o fato de que a transação antiga já está debitada no saldo se for a mesma conta
                    const actualBalance = acc.id === editingHistoryItem.accountId ? balance + Math.abs(editingHistoryItem.amount) : balance;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (R$ {actualBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Novo Valor (R$)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={editHistoryAmount} 
                  onChange={(e) => setEditHistoryAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-black bg-white text-black text-xl text-center outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={handleSaveHistoryItemEdit} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">Salvar Alteração</button>
                <button onClick={() => setIsEditHistoryItemModalOpen(false)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação Exclusão Meta */}
      {goalToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100">
              <i className="fas fa-trash-can"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Excluir Meta?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Tem certeza que deseja apagar a meta inteira? Esta ação também removerá **todos os lançamentos vinculados** a ela do seu extrato.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteGoal} className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-rose-700 transition-all active:scale-95">Sim, Excluir Tudo</button>
              <button onClick={() => setGoalToDelete(null)} className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest transition-colors hover:text-slate-600">Manter Meta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsManager;