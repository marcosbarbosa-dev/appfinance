
import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Goal, Transaction } from '../types';

const GoalsManager: React.FC = () => {
  const { user, goals, saveGoal, deleteGoal, bankAccounts, transactions, saveTransaction, setIsSidebarOpen, checkInternet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [contributionError, setContributionError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    icon: 'fa-bullseye',
    color: '#8b5cf6'
  });

  const [contributionData, setContributionData] = useState({
    goalId: '',
    accountId: '',
    amount: ''
  });

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
    setFormData({ name: '', targetAmount: '', icon: 'fa-bullseye', color: '#8b5cf6' });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({ 
      name: goal.name, 
      targetAmount: goal.targetAmount.toString(), 
      icon: goal.icon, 
      color: goal.color 
    });
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet() || !user) return;

    const target = parseFloat(formData.targetAmount) || 0;
    if (target <= 0) return;

    const goalData: Goal = {
      id: editingGoal ? editingGoal.id : crypto.randomUUID(),
      userId: user.uid,
      name: formData.name,
      targetAmount: target,
      currentAmount: editingGoal ? editingGoal.currentAmount : 0,
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
    
    if (!checkInternet() || !contributionData.goalId || !contributionData.accountId || !user) return;

    const goal = goals.find(g => g.id === contributionData.goalId);
    const account = bankAccounts.find(a => a.id === contributionData.accountId);
    const amount = parseFloat(contributionData.amount) || 0;
    const balance = accountBalances[contributionData.accountId] || 0;

    if (account && account.type !== 'credit_card' && amount > balance) {
      setContributionError('Saldo insuficiente');
      return;
    }

    if (goal && amount > 0) {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        userId: user.uid,
        description: `Aporte Meta: ${goal.name}`,
        amount: -Math.abs(amount),
        type: 'expense',
        category: 'Metas',
        date: new Date().toISOString().split('T')[0],
        accountId: contributionData.accountId
      };

      await saveTransaction(newTransaction);

      const updatedGoal: Goal = {
        ...goal,
        currentAmount: goal.currentAmount + amount
      };
      await saveGoal(updatedGoal);
    }

    setContributionData({ goalId: '', accountId: '', amount: '' });
    setIsContributionModalOpen(false);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete || !checkInternet()) return;
    try {
      await deleteGoal(goalToDelete);
    } finally {
      setGoalToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm hover:bg-violet-50 transition-all"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Metas</h2>
            <p className="text-slate-500 text-sm">Gerencie seus objetivos financeiros</p>
          </div>
        </div>

        <button 
          onClick={openCreateModal}
          className="w-full md:w-auto px-6 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <i className="fas fa-plus"></i>
          Criar nova meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-inner border border-white/20" 
                  style={{ backgroundColor: goal.color }}
                >
                  <i className={`fas ${goal.icon}`}></i>
                </div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => openEditModal(goal)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-colors"
                    aria-label="Editar meta"
                  >
                    <i className="fas fa-pen text-xs"></i>
                  </button>
                  <button 
                    onClick={() => setGoalToDelete(goal.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                    aria-label="Excluir meta"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-black text-slate-800 text-lg tracking-tight truncate">{goal.name}</h4>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</p>
                    <p className="text-xs font-black text-slate-700">{progress.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  ></div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Acumulado</p>
                    <p className="font-black text-slate-800 text-sm">R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Objetivo</p>
                    <p className="font-black text-violet-600 text-sm">R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
              <i className="fas fa-bullseye text-3xl"></i>
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma meta definida</p>
          </div>
        )}
      </div>

      {goals.length > 0 && (
        <button 
          onClick={() => {
            setContributionError('');
            setIsContributionModalOpen(true);
          }}
          className="fixed bottom-24 right-6 bg-violet-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-30 hover:scale-110 active:scale-90 transition-all border-4 border-white"
        >
          <i className="fas fa-coins text-2xl"></i>
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Planejamento Infinity</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveGoal} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome da Meta</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: Viagem, Carro Novo..." className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold bg-white text-black"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valor Alvo (R$)</label>
                  <input type="number" step="0.01" required value={formData.targetAmount} onChange={(e) => setFormData({...formData, targetAmount: e.target.value})} placeholder="0,00" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-black bg-white text-black text-lg"/>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 text-center">Visual</label>
                  <div className="grid grid-cols-7 gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    {icons.map(icon => (
                      <button 
                        key={icon}
                        type="button" 
                        onClick={() => setFormData({...formData, icon})}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${formData.icon === icon ? 'bg-violet-600 text-white shadow-lg scale-110' : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-600'}`}
                      >
                        <i className={`fas ${icon} text-xs`}></i>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    {colors.map(color => (
                      <button 
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-slate-800 scale-125 z-10' : 'border-white'}`}
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 active:scale-95 transition-all">
                {editingGoal ? 'Salvar Alterações' : 'Salvar Meta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isContributionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                <i className="fas fa-coins"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Novo Aporte</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Este valor sairá da sua conta</p>
            </div>

            <form onSubmit={handleAddContribution} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Destino</label>
                <select 
                  required 
                  value={contributionData.goalId} 
                  onChange={(e) => setContributionData({...contributionData, goalId: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold bg-white text-black outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Escolha uma meta</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Conta de Origem</label>
                <select 
                  required 
                  value={contributionData.accountId} 
                  onChange={(e) => {
                    setContributionData({...contributionData, accountId: e.target.value});
                    setContributionError('');
                  }}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold bg-white text-black outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Escolha a conta</option>
                  {bankAccounts.map(acc => {
                    const balance = accountBalances[acc.id] || 0;
                    const isDisabled = acc.type !== 'credit_card' && balance <= 0;
                    return (
                      <option 
                        key={acc.id} 
                        value={acc.id} 
                        disabled={isDisabled}
                        className={isDisabled ? 'text-slate-300' : ''}
                      >
                        {acc.name} ({acc.bankName}) {acc.type !== 'credit_card' ? `- R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valor do Aporte</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={contributionData.amount} 
                    onChange={(e) => {
                      setContributionData({...contributionData, amount: e.target.value});
                      setContributionError('');
                    }}
                    placeholder="0,00" 
                    className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 font-black bg-white text-black outline-none focus:ring-2 focus:ring-violet-500 text-lg"
                  />
                </div>
              </div>

              {contributionError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase animate-in shake duration-300">
                  <i className="fas fa-exclamation-circle"></i>
                  {contributionError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 active:scale-95 transition-all">Confirmar e Pagar</button>
                <button type="button" onClick={() => setIsContributionModalOpen(false)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {goalToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100">
              <i className="fas fa-trash-can"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Excluir Meta?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Deseja excluir esta meta permanentemente? Os aportes já realizados permanecerão no seu extrato como despesas.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDeleteGoal} 
                className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
              >
                Sim, Excluir Meta
              </button>
              <button 
                onClick={() => setGoalToDelete(null)} 
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

export default GoalsManager;
