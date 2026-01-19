
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../App';

interface BreakdownData {
  name: string;
  value: number;
}

const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#c084fc', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

const DashboardWidget: React.FC<{ title: string; data: BreakdownData[]; emptyMessage: string; icon: string }> = ({ title, data, emptyMessage, icon }) => {
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
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
  const { user, transactions, bankAccounts, setActiveView, setIsSidebarOpen } = useAuth();
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  const stats = useMemo(() => {
    const userTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return t.userId === user?.uid && 
             (m - 1) === currentMonth && 
             y === currentYear;
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

    // Breakdown de gastos por categoria
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

    // Breakdown de entradas por conta
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

    // Breakdown de saídas por conta (Total)
    const expenseAccountMap: Record<string, number> = {};
    userTransactions.filter(t => t.type === 'expense' || t.type === 'credit_card').forEach(t => {
      const acc = bankAccounts.find(a => a.id === t.accountId);
      if (acc) {
        const val = Math.abs(t.amount);
        expenseAccountMap[acc.name] = (expenseAccountMap[acc.name] || 0) + val;
      }
    });
    const expenseAccountBreakdown = Object.entries(expenseAccountMap)
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

    return { 
      totalBalance, totalIncome, totalExpense, cashExpenses, digitalExpenses, 
      categoryBreakdown, incomeAccountBreakdown, expenseAccountBreakdown, cashCategoryBreakdown, digitalAccountBreakdown, cardBreakdown 
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
          
          <button 
            onClick={() => setActiveView('adicionar_transacao')}
            className="md:hidden bg-violet-600 hover:bg-violet-700 text-white w-10 h-10 rounded-xl shadow-lg shadow-violet-200 flex items-center justify-center transition-all active:scale-95"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
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

        <button 
          onClick={() => setActiveView('adicionar_transacao')}
          className="hidden md:flex bg-violet-600 hover:bg-violet-700 text-white w-12 h-12 rounded-2xl shadow-xl shadow-violet-200 items-center justify-center transition-all active:scale-95"
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
            {stats.incomeAccountBreakdown.length > 0 && (
              <div className="mt-3 space-y-1 pt-2 border-t border-slate-50">
                {stats.incomeAccountBreakdown.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-400 truncate max-w-[80px]">{item.name}</span>
                    <span className="text-emerald-500">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
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
            {stats.expenseAccountBreakdown.length > 0 && (
              <div className="mt-3 space-y-1 pt-2 border-t border-slate-50">
                {stats.expenseAccountBreakdown.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-400 truncate max-w-[80px]">{item.name}</span>
                    <span className="text-rose-500">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DashboardWidget 
          title={`Entradas por Conta (${months[currentMonth]})`} 
          data={stats.incomeAccountBreakdown} 
          emptyMessage={`Sem entradas registradas.`}
          icon="fa-piggy-bank"
        />
        <DashboardWidget 
          title={`Gastos por categorias (${months[currentMonth]})`} 
          data={stats.categoryBreakdown} 
          emptyMessage={`Sem gastos registrados.`}
          icon="fa-chart-pie"
        />
        <DashboardWidget 
          title={`Gastos Dinheiro (${months[currentMonth]})`} 
          data={stats.cashCategoryBreakdown} 
          emptyMessage={`Sem gastos em dinheiro.`}
          icon="fa-wallet"
        />
        <DashboardWidget 
          title={`Gastos Conta Digital (${months[currentMonth]})`} 
          data={stats.digitalAccountBreakdown} 
          emptyMessage={`Sem gastos digitais.`}
          icon="fa-university"
        />
      </div>

      <button 
        onClick={() => setActiveView('adicionar_transacao')}
        className="fixed bottom-24 right-6 md:hidden bg-violet-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-30 active:scale-90 transition-transform"
      >
        <i className="fas fa-plus text-xl"></i>
      </button>
    </div>
  );
};

export default UserHome;
