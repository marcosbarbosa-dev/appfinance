
import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';

const ReportsView: React.FC = () => {
  const { user, transactions, bankAccounts, categories, setIsSidebarOpen } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleMonthChange = (dir: 'next' | 'prev') => {
    if (dir === 'next') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    } else {
      if (currentMonth === 0) {
        setCurrentMonth(11);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    }
  };

  const monthlyOutflows = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.userId === user?.uid && 
               d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear &&
               (t.type === 'expense' || t.type === 'credit_card');
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user, currentMonth, currentYear]);

  const outflowsByAccount = useMemo(() => {
    const summary: Record<string, { accountName: string; bankName: string; type: string; total: number }> = {};
    
    monthlyOutflows.forEach(t => {
      if (!summary[t.accountId]) {
        const acc = bankAccounts.find(a => a.id === t.accountId);
        summary[t.accountId] = {
          accountName: acc?.name || 'Conta Removida',
          bankName: acc?.bankName || 'Banco Desconhecido',
          type: acc?.type || 'checking',
          total: 0
        };
      }
      summary[t.accountId].total += t.amount;
    });

    return Object.entries(summary).map(([id, data]) => ({ id, ...data }));
  }, [monthlyOutflows, bankAccounts]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  };

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.color || '#cbd5e1';
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Relatório de Saídas</h2>
            <p className="text-slate-500">Análise detalhada por conta e extrato</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-list-ul text-emerald-500"></i>
            Extrato de Despesas
          </h3>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {monthlyOutflows.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {monthlyOutflows.map((t) => {
                  const acc = bankAccounts.find(a => a.id === t.accountId);
                  return (
                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[45px]">
                          <span className="block text-xs font-bold text-slate-400 uppercase">{formatDate(t.date).split('/')[1]}</span>
                          <span className="block text-lg font-black text-slate-700 leading-none">{formatDate(t.date).split('/')[0]}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div>
                          <p className="font-bold text-slate-800">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }}></div>
                              {t.category}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                              {acc?.name || 'Conta S/N'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-500">- R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-slate-300 uppercase tracking-tighter">{t.type === 'credit_card' ? 'Cartão de Crédito' : 'Débito/Dinheiro'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <i className="fas fa-ghost text-2xl"></i>
                </div>
                <p className="text-slate-400 font-medium">Nenhuma saída registrada neste período para sua conta.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-university text-violet-500"></i>
            Saídas por Conta
          </h3>

          <div className="space-y-4">
            {outflowsByAccount.map((acc) => (
              <div key={acc.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${acc.type === 'credit_card' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <i className={`fas ${acc.type === 'credit_card' ? 'fa-credit-card' : 'fa-university'}`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{acc.accountName}</h4>
                  <p className="text-xs text-slate-400">{acc.bankName}</p>
                  <div className="mt-2 w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${acc.type === 'credit_card' ? 'bg-violet-500' : 'bg-rose-500'}`} 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">R$ {acc.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Mês</span>
                </div>
              </div>
            ))}

            {outflowsByAccount.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 text-sm">Sem dados de contas impactadas.</p>
              </div>
            )}

            <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 mt-8">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total de Saídas no Mês</p>
              <h4 className="text-2xl font-black text-rose-400">
                - R$ {monthlyOutflows.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
              <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">{monthlyOutflows.length} Lançamentos</span>
                <span className="text-emerald-400 font-bold">Relatório Gerado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
