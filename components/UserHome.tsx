
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../App';

const UserHome: React.FC = () => {
  const { user, setActiveView, setIsSidebarOpen, transactions, categories } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleMonthChange = (dir: 'next' | 'prev') => {
    if (dir === 'next') setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
    else setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  // FILTRO CRÍTICO: Filtra transações pelo ID do usuário LOGADO
  const myTransactions = useMemo(() => {
    return transactions.filter(t => t.userId === user?.uid);
  }, [transactions, user]);

  const monthlyTransactions = useMemo(() => {
    return myTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [myTransactions, currentMonth, currentYear]);

  const stats = useMemo(() => {
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const credit = monthlyTransactions.filter(t => t.type === 'credit_card').reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalIncome = myTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = myTransactions.filter(t => t.type === 'expense' || t.type === 'credit_card').reduce((acc, curr) => acc + curr.amount, 0);

    return {
      monthlyIncome: income,
      monthlyExpense: expense,
      monthlyCredit: credit,
      currentBalance: totalIncome - totalExpense
    };
  }, [myTransactions, monthlyTransactions]);

  const chartData = [
    { name: 'Entradas', value: stats.monthlyIncome, color: '#8b5cf6' },
    { name: 'Saídas', value: stats.monthlyExpense, color: '#f43f5e' },
    { name: 'Cartão', value: stats.monthlyCredit, color: '#a855f7' },
  ];

  const categoryGrouping = useMemo(() => {
    const grouping: Record<string, number> = {};
    monthlyTransactions.filter(t => t.type !== 'income').forEach(t => {
      grouping[t.category] = (grouping[t.category] || 0) + t.amount;
    });
    return Object.entries(grouping).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions]);

  const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#c084fc', '#f43f5e', '#3b82f6', '#f59e0b'];

  const hasData = stats.monthlyIncome > 0 || stats.monthlyExpense > 0 || stats.monthlyCredit > 0;

  return (
    <div className="relative min-h-full p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-all"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Personalle Dashboard</h2>
            <p className="text-slate-500">Olá, {user?.name.split(' ')[0]}. Sua liberdade financeira começa aqui.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl">
          <button onClick={() => handleMonthChange('prev')} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
            <i className="fas fa-chevron-left text-slate-400"></i>
          </button>
          <span className="font-semibold text-slate-700 min-w-[100px] text-center">{months[currentMonth]}</span>
          <button onClick={() => handleMonthChange('next')} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
            <i className="fas fa-chevron-right text-slate-400"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-violet-600 p-6 rounded-2xl text-white shadow-lg shadow-violet-100">
          <p className="text-violet-100 text-sm font-medium mb-1">Saldo Total</p>
          <h3 className="text-3xl font-bold">R$ {stats.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Entradas Mês</p>
          <h3 className="text-2xl font-bold text-violet-500">+ R$ {stats.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Despesas Mês</p>
          <h3 className="text-2xl font-bold text-rose-500">- R$ {stats.monthlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Cartões Mês</p>
          <h3 className="text-2xl font-bold text-purple-500">R$ {stats.monthlyCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Comparativo do Período</h4>
          <div className="h-64">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <i className="fas fa-chart-bar text-4xl opacity-20"></i>
                <p className="text-sm">Aguardando seus primeiros lançamentos.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Gastos por Categoria</h4>
          <div className="h-64 flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2 h-full">
              {categoryGrouping.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryGrouping}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryGrouping.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center px-4 space-y-4">
                  <i className="fas fa-chart-pie text-4xl opacity-20"></i>
                  <p>Categorias aparecerão após registros de saída.</p>
                </div>
              )}
            </div>
            <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 overflow-y-auto max-h-48 px-2">
              {categoryGrouping.length > 0 ? (
                categoryGrouping.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                      <span className="text-slate-600 truncate max-w-[80px]">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">R$ {cat.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-300 text-center italic">Dashboard Personalle Infinity</p>
              )}
            </div>
          </div>
        </div>
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
