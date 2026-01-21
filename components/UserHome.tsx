import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../App';
import { TransactionType } from '../types';
import AddTransaction from './AddTransaction';
import TransfersManager from './TransfersManager';

interface BreakdownData {
  name: string;
  value: number;
}

// Paletas de cores robustas para garantir unicidade visual dentro de cada gráfico
const PALETTES = {
  income: [
    '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', 
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981'
  ],
  category: [
    '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', 
    '#4c1d95', '#5b21b6', '#6d28d9', '#9333ea', '#a855f7'
  ],
  cash: [
    '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', 
    '#78350f', '#92400e', '#b45309', '#ea580c', '#f97316'
  ],
  digital: [
    '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', 
    '#0c4a6e', '#075985', '#0369a1', '#2563eb', '#3b82f6'
  ],
  card: [
    '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', 
    '#881337', '#9f1239', '#be123c', '#db2777', '#ec4899'
  ]
};

const DashboardWidget: React.FC<{ 
  title: string; 
  data: BreakdownData[]; 
  emptyMessage: string; 
  icon: string;
  palette: string[];
}> = ({ title, data, emptyMessage, icon, palette }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[350px]">
      <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className={`fas ${icon} text-violet-500 text-sm`}></i>
        {title}
      </h4>
      <div className="flex flex-col sm:flex-row items-center sm:items-start flex-1 min-h-0">
        <div className="w-full sm:w-1/2 h-64 relative min-w-0">
          {data.length > 0 ? (
            <ResponsiveContainer width="99%" height="100%">
              <PieChart key={JSON.stringify(data.map(d => d.name))}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center px-4 space-y-4">
              <i className={`fas ${icon} text-4xl opacity-10`}></i>
              <p className="text-[10px] leading-tight font-bold uppercase tracking-wider">{emptyMessage}</p>
            </div>
          )}
        </div>
        
        <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 sm:pl-6 overflow-y-auto max-h-64 custom-scrollbar">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }}></div>
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{entry.name}</span>
              </div>
              <span className="text-[11px] font-black text-slate-800">R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UserHome: React.FC = () => {
  const { user, transactions, bankAccounts, setIsSidebarOpen } = useAuth();
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleMonthChange = (dir: 'next' | 'prev') => {
    if (dir === 'next') {
      if (currentMonth === 11) setCurrentMonth(0);
      else setCurrentMonth(prev => prev + 1);
    } else {
      if (currentMonth === 0) setCurrentMonth(11);
      else setCurrentMonth(prev => prev - 1);
    }
  };

  const handleYearChange = (dir: 'next' | 'prev') => {
    setCurrentYear(prev => dir === 'next' ? prev + 1 : prev - 1);
  };

  const openAddForm = (type: TransactionType) => {
    setSelectedType(type);
    setIsAddModalOpen(true);
    setShowAddMenu(false);
  };

  const stats = useMemo(() => {
    const userTransactions = transactions.filter(t => {
      const date = new Date(t.date + 'T12:00:00');
      return t.userId === user?.uid && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear;
    });
    
    const liquidAccountIds = bankAccounts
      .filter(acc => acc.type === 'cash' || acc.type === 'checking')
      .map(acc => acc.id);
    
    const totalBalance = transactions
      .filter(t => t.userId === user?.uid && liquidAccountIds.includes(t.accountId))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalIncome = userTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = userTransactions
      .filter(t => t.type === 'expense' || t.type === 'credit_card')
      .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const cashExpenses = userTransactions
      .filter(t => (t.type === 'expense' || t.type === 'credit_card'))
      .filter(t => {
        const acc = bankAccounts.find(a => a.id === t.accountId);
        return acc?.type === 'cash';
      })
      .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const digitalExpenses = userTransactions
      .filter(t => (t.type === 'expense' || t.type === 'credit_card'))
      .filter(t => {
        const acc = bankAccounts.find(a => a.id === t.accountId);
        return acc?.type === 'checking' || acc?.type === 'savings' || acc?.type === 'investment';
      })
      .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const cardMap: Record<string, number> = {};
    userTransactions.filter(t => t.type === 'expense' || t.type === 'credit_card').forEach(t => {
      const acc = bankAccounts.find(a => a.id === t.accountId);
      if (acc && acc.type === 'credit_card') {
        cardMap[acc.name] = (cardMap[acc.name] || 0) + Math.abs(t.amount);
      }
    });
    const cardBreakdown = Object.entries(cardMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const totalCardExpense = cardBreakdown.reduce((acc, curr) => acc + curr.value, 0);

    const categoryMap: Record<string, number> = {};
    userTransactions.filter(t => t.type === 'expense' || t.type === 'credit_card').forEach(t => {
      const val = Math.abs(t.amount);
      if (val > 0) {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + val;
      }
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const incomeAccountMap: Record<string, number> = {};
    userTransactions.filter(t => t.type === 'income').forEach(t => {
      const acc = bankAccounts.find(a => a.id === t.accountId);
      if (acc) {
        const val = Math.abs(t.amount);
        incomeAccountMap[acc.name] = (incomeAccountMap[acc.name] || 0) + val;
      }
    });
    const incomeAccountBreakdown = Object.entries(incomeAccountMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const cashCategoryMap: Record<string, number> = {};
    userTransactions.filter(t => t.type === 'expense' || t.type === 'credit_card').forEach(t => {
      const acc = bankAccounts.find(a => a.id === t.accountId);
      if (acc?.type === 'cash') {
        const val = Math.abs(t.amount);
        cashCategoryMap[t.category] = (cashCategoryMap[t.category] || 0) + val;
      }
    });
    const cashCategoryBreakdown = Object.entries(cashCategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const digitalAccountMap: Record<string, number> = {};
    userTransactions.filter(t => t.type === 'expense' || t.type === 'credit_card').forEach(t => {
      const acc = bankAccounts.find(a => a.id === t.accountId);
      if (acc && (acc.type === 'checking' || acc.type === 'savings' || acc.type === 'investment')) {
        const val = Math.abs(t.amount);
        digitalAccountMap[acc.name] = (digitalAccountMap[acc.name] || 0) + val;
      }
    });
    const digitalAccountBreakdown = Object.entries(digitalAccountMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      totalBalance, totalIncome, totalExpense, cashExpenses, digitalExpenses, totalCardExpense,
      categoryBreakdown, incomeAccountBreakdown, cashCategoryBreakdown, digitalAccountBreakdown, cardBreakdown 
    };
  }, [transactions, user, bankAccounts, currentMonth, currentYear]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 justify-between md:justify-start w-full md:w-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-all shadow-sm active:scale-95"
            >
              <i className="fas fa-bars-staggered"></i>
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Finanças</h2>
              <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest font-bold">Gestão Infinity</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
            <div className="flex items-center bg-white rounded-xl shadow-sm px-2 py-1 gap-1">
               <button onClick={() => handleMonthChange('prev')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all active:scale-90"><i className="fas fa-chevron-left text-[10px]"></i></button>
               <span className="font-bold text-slate-700 text-xs uppercase min-w-[90px] text-center tracking-tighter">{months[currentMonth]}</span>
               <button onClick={() => handleMonthChange('next')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all active:scale-90"><i className="fas fa-chevron-right text-[10px]"></i></button>
            </div>
            <div className="flex items-center px-1 gap-1 border-l border-slate-200 ml-1">
               <button onClick={() => handleYearChange('prev')} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-all active:scale-90"><i className="fas fa-angle-left text-xs"></i></button>
               <span className="text-[11px] font-black text-emerald-500/60 tracking-tighter min-w-[40px] text-center">{currentYear}</span>
               <button onClick={() => handleYearChange('next')} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-all active:scale-90"><i className="fas fa-angle-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-violet-600 p-6 rounded-[2rem] relative overflow-hidden group shadow-xl shadow-violet-100 transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-700 text-white">
            <i className="fas fa-wallet text-4xl"></i>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200 mb-1">Liquidez Total</p>
          <h3 className="text-xl font-black tracking-tighter text-white flex items-baseline gap-1">
            <span className="text-violet-300 text-sm font-bold">R$</span>
            {stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Entradas</p>
            <h3 className="text-lg font-black text-emerald-500 tracking-tight">
              + R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-2">
             <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><i className="fas fa-arrow-trend-up text-[10px]"></i></div>
             <span className="text-[9px] text-slate-400 font-bold uppercase">Mês</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Saídas Totais</p>
            <h3 className="text-lg font-black text-rose-500 tracking-tight">
              - R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-2">
             <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><i className="fas fa-arrow-trend-down text-[10px]"></i></div>
             <span className="text-[9px] text-slate-400 font-bold uppercase">Mês</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Gastos Dinheiro</p>
            <h3 className="text-lg font-black text-amber-500 tracking-tight">
              - R$ {stats.cashExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-2">
             <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><i className="fas fa-wallet text-[10px]"></i></div>
             <span className="text-[9px] text-slate-400 font-bold uppercase">Cash</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Conta Digital</p>
            <h3 className="text-lg font-black text-sky-500 tracking-tight">
              - R$ {stats.digitalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-2">
             <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center"><i className="fas fa-university text-[10px]"></i></div>
             <span className="text-[9px] text-slate-400 font-bold uppercase">Digital</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-500 mb-1">Gastos Cartão</p>
            <h3 className="text-lg font-black text-rose-600 tracking-tight">
              - R$ {stats.totalCardExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-2">
             <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><i className="fas fa-credit-card text-[10px]"></i></div>
             <span className="text-[9px] text-slate-400 font-bold uppercase">Cartões</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <DashboardWidget 
          title={`Entradas por Conta (${months[currentMonth]})`} 
          data={stats.incomeAccountBreakdown} 
          emptyMessage={`Sem entradas registradas.`}
          icon="fa-piggy-bank"
          palette={PALETTES.income}
        />
        <DashboardWidget 
          title={`Gastos por Categorias (${months[currentMonth]})`} 
          data={stats.categoryBreakdown} 
          emptyMessage={`Sem gastos registrados.`}
          icon="fa-chart-pie"
          palette={PALETTES.category}
        />
        <DashboardWidget 
          title={`Gastos em Dinheiro (${months[currentMonth]})`} 
          data={stats.cashCategoryBreakdown} 
          emptyMessage={`Sem gastos em dinheiro.`}
          icon="fa-wallet"
          palette={PALETTES.cash}
        />
        <DashboardWidget 
          title={`Gastos Contas Digitais (${months[currentMonth]})`} 
          data={stats.digitalAccountBreakdown} 
          emptyMessage={`Sem gastos digitais.`}
          icon="fa-university"
          palette={PALETTES.digital}
        />
        <DashboardWidget 
          title={`Gastos por Cartão (${months[currentMonth]})`} 
          data={stats.cardBreakdown} 
          emptyMessage={`Sem gastos em cartões.`}
          icon="fa-credit-card"
          palette={PALETTES.card}
        />
      </div>

      <div className="fixed bottom-10 right-6 z-30 flex flex-col items-end gap-3">
        {showAddMenu && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => openAddForm('income')}
              className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <i className="fas fa-arrow-up"></i>
              Entrada
            </button>
            <button 
              onClick={() => openAddForm('expense')}
              className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <i className="fas fa-arrow-down"></i>
              Saída
            </button>
            <button 
              onClick={() => openAddForm('credit_card')}
              className="bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <i className="fas fa-credit-card"></i>
              Saída Cartão
            </button>
            <button 
              onClick={() => openAddForm('transfer')}
              className="bg-sky-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <i className="fas fa-repeat"></i>
              Transferência
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`bg-violet-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all border-4 border-white ${showAddMenu ? 'rotate-45 bg-slate-800' : 'hover:scale-110 active:scale-90'}`}
        >
          <i className={`fas ${showAddMenu ? 'fa-times' : 'fa-plus'} text-xl`}></i>
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${selectedType === 'income' ? 'bg-emerald-600' : selectedType === 'expense' ? 'bg-rose-600' : selectedType === 'credit_card' ? 'bg-purple-600' : 'bg-sky-600'}`}>
                  <i className={`fas ${selectedType === 'income' ? 'fa-arrow-up' : selectedType === 'expense' ? 'fa-arrow-down' : selectedType === 'credit_card' ? 'fa-credit-card' : 'fa-repeat'}`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedType === 'income' ? 'Nova Entrada' : selectedType === 'expense' ? 'Nova Saída' : selectedType === 'credit_card' ? 'Lançamento Cartão' : 'Nova Transferência'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Movimentação Financeira</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {selectedType === 'transfer' ? (
                <TransfersManager isModal onCancel={() => setIsAddModalOpen(false)} />
              ) : (
                <AddTransaction 
                  initialType={selectedType} 
                  onCancel={() => setIsAddModalOpen(false)} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;