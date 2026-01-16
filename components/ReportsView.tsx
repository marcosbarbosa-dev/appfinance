
import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';

const ReportsView: React.FC = () => {
  const { user, transactions, bankAccounts, categories, setIsSidebarOpen } = useAuth();
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

  const monthlyOutflows = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        const isOutflow = t.amount < 0; 
        return t.userId === user?.uid && 
               d.getUTCMonth() === currentMonth && 
               d.getUTCFullYear() === currentYear &&
               isOutflow;
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
      summary[t.accountId].total += Math.abs(t.amount);
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

  const getModalityLabel = (type: string, accountType?: string) => {
    if (type === 'credit_card') return 'Cartão de Crédito';
    if (accountType === 'cash') return 'Dinheiro (Saída)';
    return 'Débito/Dinheiro';
  };

  const totalMonthlyOutflow = monthlyOutflows.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 justify-between md:justify-start">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Relatórios</h2>
              <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest font-bold">Saídas & Impacto</p>
            </div>
          </div>
        </div>
        
        {/* Navegação Temporal Dupla Discreta e Centralizada em Mobile/Tablet */}
        <div className="flex justify-center md:justify-end">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-list-ul text-emerald-500"></i>
            Extrato Detalhado
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
                          <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-medium">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }}></div>
                              {t.category}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {acc?.name || 'Conta S/N'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-500"> R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-slate-300 uppercase tracking-tighter font-bold">
                          {getModalityLabel(t.type, acc?.type)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-inner">
                  <i className="fas fa-file-excel text-3xl"></i>
                </div>
                <p className="text-slate-400 font-bold text-sm">Sem movimentações em {months[currentMonth]} de {currentYear}.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-university text-violet-500"></i>
            Impacto por Origem
          </h3>

          <div className="space-y-3">
            {outflowsByAccount.map((acc) => (
              <div key={acc.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-violet-200 transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${acc.type === 'credit_card' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <i className={`fas ${acc.type === 'credit_card' ? 'fa-credit-card' : 'fa-university'}`}></i>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{acc.accountName}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{acc.bankName}</p>
                  <div className="mt-2 w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${acc.type === 'credit_card' ? 'bg-violet-500' : 'bg-rose-500'}`} 
                      style={{ width: `${(acc.total / (totalMonthlyOutflow || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800 text-sm">R$ {acc.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{((acc.total / (totalMonthlyOutflow || 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}

            {/* Card de Resumo de Saídas - Versão Clara e Sofisticada */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-rose-100 shadow-lg shadow-rose-50/50 mt-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <i className="fas fa-receipt text-6xl text-rose-500"></i>
              </div>
              
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total de Saídas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-rose-500 font-black text-lg">R$</span>
                <h4 className="text-3xl font-black text-slate-800 tracking-tighter">
                  {totalMonthlyOutflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                      <i className="fas fa-arrow-down-long text-xs"></i>
                   </div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">{monthlyOutflows.length} Lançamentos</span>
                </div>
                <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Faturamento
                </span>
              </div>
            </div>

            <div className="p-4 text-center">
               <p className="text-[10px] text-slate-300 italic">Os dados acima referem-se exclusivamente ao mês de {months[currentMonth]} de {currentYear}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
