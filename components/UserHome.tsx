
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../App';

interface BreakdownData {
  name: string;
  value: number;
}

const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#c084fc', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

const DashboardWidget: React.FC<{ title: string; data: BreakdownData[]; emptyMessage: string; icon: string }> = ({ title, data, emptyMessage, icon }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className={`fas ${icon} text-violet-500 text-sm`}></i>
        {title}
      </h4>
      <div className="flex flex-col sm:flex-row items-center sm:items-start flex-1">
        <div className="w-full sm:w-1/2 h-48 md:h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center px-4 space-y-4">
              <i className={`fas ${icon} text-4xl opacity-10`}></i>
              <p className="text-[10px] leading-tight">{emptyMessage}</p>
            </div>
          )}
        </div>
        
        <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 px-2 overflow-y-auto max-h-64 custom-scrollbar">
          {data.length > 0 ? (
            data.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] md:text-sm group/cat py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800 ml-2">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] text-slate-300 italic">Nenhum registro no período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserHome: React.FC = () => {
  const { user, setActiveView, setIsSidebarOpen, transactions, bankAccounts } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const handleMonthChange = (dir: 'next' | 'prev') => {
    if (dir === 'next') setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
    else setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleYearChange = (dir: 'next' | 'prev') => {
    setCurrentYear(prev => dir === 'next' ? prev + 1 : prev - 1);
  };

  const myTransactions = useMemo(() => {
    return transactions.filter(t => t.userId === user?.uid);
  }, [transactions, user]);

  const monthlyTransactions = useMemo(() => {
    return myTransactions.filter(t => {
      const d = new Date(t.date);
      const transMonth = d.getUTCMonth();
      const transYear = d.getUTCFullYear();
      return transMonth === currentMonth && transYear === currentYear;
    });
  }, [myTransactions, currentMonth, currentYear]);

  const stats = useMemo(() => {
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
    const credit = monthlyTransactions.filter(t => t.type === 'credit_card').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
    
    const cashAccountsIds = bankAccounts.filter(a => a.type === 'cash').map(a => a.id);
    const cashBalance = monthlyTransactions.filter(t => cashAccountsIds.includes(t.accountId)).reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalBalance = myTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      monthlyIncome: income,
      monthlyExpense: expense,
      monthlyCredit: credit,
      monthlyCash: cashBalance,
      currentBalance: totalBalance
    };
  }, [myTransactions, monthlyTransactions, bankAccounts]);

  const chartData = [
    { name: 'Entradas', value: stats.monthlyIncome, color: '#8b5cf6' },
    { name: 'Saídas', value: stats.monthlyExpense, color: '#f43f5e' },
    { name: 'Cartão', value: stats.monthlyCredit, color: '#a855f7' },
    { name: 'Dinheiro', value: Math.abs(stats.monthlyCash), color: '#10b981' },
  ];

  const categoryGrouping = useMemo(() => {
    const grouping: Record<string, number> = {};
    monthlyTransactions.filter(t => t.amount < 0).forEach(t => {
      grouping[t.category] = (grouping[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(grouping).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions]);

  const digitalAccountGrouping = useMemo(() => {
    const grouping: Record<string, number> = {};
    const digitalTypes = ['checking', 'savings', 'investment'];
    
    monthlyTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const acc = bankAccounts.find(a => a.id === t.accountId);
        if (acc && digitalTypes.includes(acc.type)) {
          grouping[acc.name] = (grouping[acc.name] || 0) + Math.abs(t.amount);
        }
      });
    return Object.entries(grouping).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions, bankAccounts]);

  const cashGrouping = useMemo(() => {
    const grouping: Record<string, number> = {};
    const cashAccountsIds = bankAccounts.filter(a => a.type === 'cash').map(a => a.id);
    
    monthlyTransactions
      .filter(t => t.amount < 0 && cashAccountsIds.includes(t.accountId))
      .forEach(t => {
        grouping[t.category] = (grouping[t.category] || 0) + Math.abs(t.amount);
      });
    return Object.entries(grouping).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions, bankAccounts]);

  const creditCardGrouping = useMemo(() => {
    const grouping: Record<string, number> = {};
    
    monthlyTransactions
      .filter(t => t.type === 'credit_card' && t.amount < 0)
      .forEach(t => {
        const acc = bankAccounts.find(a => a.id === t.accountId);
        if (acc) {
          grouping[acc.name] = (grouping[acc.name] || 0) + Math.abs(t.amount);
        }
      });
    return Object.entries(grouping).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions, bankAccounts]);

  const hasData = stats.monthlyIncome > 0 || stats.monthlyExpense > 0 || stats.monthlyCredit > 0 || Math.abs(stats.monthlyCash) > 0;

  return (
    <div className="relative min-h-full p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-4 z-10">
        <div className="flex items-center gap-4 justify-between md:justify-start">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-all active:scale-95"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="overflow-hidden">
              <h2 className="text-lg md:text-2xl font-bold text-slate-800 truncate">Dashboard Personalle</h2>
              <p className="text-slate-500 text-xs md:text-sm truncate">Seja bem-vindo, {user?.name.split(' ')[0]}.</p>
            </div>
          </div>
        </div>
        
        {/* Navegação Temporal Compacta e Centralizada em Mobile/Tablet */}
        <div className="flex justify-center md:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
            <div className="flex items-center bg-white rounded-xl shadow-sm px-2 py-1 gap-1">
               <button onClick={() => handleMonthChange('prev')} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-all active:scale-90"><i className="fas fa-chevron-left text-[10px]"></i></button>
               <span className="font-bold text-slate-700 text-xs uppercase min-w-[40px] text-center tracking-tighter">{months[currentMonth]}</span>
               <button onClick={() => handleMonthChange('next')} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-all active:scale-90"><i className="fas fa-chevron-right text-[10px]"></i></button>
            </div>
            <div className="flex items-center px-1 gap-1 border-l border-slate-200 ml-1">
               <button onClick={() => handleYearChange('prev')} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-violet-600 transition-all active:scale-90"><i className="fas fa-angle-left text-xs"></i></button>
               <span className="text-[11px] font-black text-violet-400 tracking-tighter min-w-[35px] text-center">{currentYear}</span>
               <button onClick={() => handleYearChange('next')} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-violet-600 transition-all active:scale-90"><i className="fas fa-angle-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-violet-600 p-6 rounded-2xl text-white shadow-lg shadow-violet-100 lg:col-span-1">
          <p className="text-violet-100 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo Total</p>
          <h3 className="text-2xl font-bold truncate">R$ {stats.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Entradas</p>
          <h3 className="text-xl font-bold text-violet-500 truncate">+ R$ {stats.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Saídas</p>
          <h3 className="text-xl font-bold text-rose-500 truncate">- R$ {stats.monthlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Cartões</p>
          <h3 className="text-xl font-bold text-purple-500 truncate">R$ {stats.monthlyCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Dinheiro</p>
          <h3 className={`text-xl font-bold truncate ${stats.monthlyCash >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.monthlyCash >= 0 ? '+' : ''} R$ {stats.monthlyCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-chart-line text-violet-500"></i>
          Fluxo de Caixa ({months[currentMonth]} / {currentYear})
        </h4>
        <div className="h-64">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <i className="fas fa-chart-bar text-4xl opacity-20"></i>
              <p className="text-sm">Nenhum registro encontrado em {months[currentMonth]} de {currentYear}.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DashboardWidget 
          title="Gastos por Categoria" 
          data={categoryGrouping} 
          emptyMessage="Categorias aparecerão após registros de saída no mês."
          icon="fa-chart-pie"
        />
        
        <DashboardWidget 
          title="Gastos por Conta Digital" 
          data={digitalAccountGrouping} 
          emptyMessage="Acompanhe saídas de contas corrente, poupança e investimentos."
          icon="fa-university"
        />

        <DashboardWidget 
          title="Gastos em Dinheiro" 
          data={cashGrouping} 
          emptyMessage="Distribuição de gastos pagos em espécie neste mês."
          icon="fa-wallet"
        />

        <DashboardWidget 
          title="Gastos por Cartão de Crédito" 
          data={creditCardGrouping} 
          emptyMessage="Peso de cada fatura de cartão no seu orçamento mensal."
          icon="fa-credit-card"
        />
      </div>

      <button
        onClick={() => setActiveView('adicionar_transacao')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-violet-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-violet-700 hover:scale-110 transition-all active:scale-95 z-50 group"
        title="Novo Lançamento"
      >
        <i className="fas fa-plus text-2xl group-hover:rotate-90 transition-transform duration-300"></i>
      </button>
    </div>
  );
};

export default UserHome;
