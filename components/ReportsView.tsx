import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportsView: React.FC = () => {
  const { user, transactions, bankAccounts, categories, setIsSidebarOpen } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

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

  const monthlyIncomes = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.userId === user?.uid && 
               d.getUTCMonth() === currentMonth && 
               d.getUTCFullYear() === currentYear &&
               t.amount > 0;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user, currentMonth, currentYear]);

  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.userId === user?.uid && 
               d.getUTCMonth() === currentMonth && 
               d.getUTCFullYear() === currentYear &&
               t.amount < 0;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user, currentMonth, currentYear]);

  const totalIncomes = monthlyIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = monthlyExpenses.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  };

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.color || '#cbd5e1';
  };

  const generatePDF = async () => {
    const allT = transactions.filter(t => {
      const d = new Date(t.date);
      return t.userId === user?.uid && 
             d.getUTCMonth() === currentMonth && 
             d.getUTCFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (allT.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Extrato Consolidado Personalle', 15, 18);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${months[currentMonth]} de ${currentYear}`, 15, 25);
      
      const balance = totalIncomes - totalExpenses;

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 15, 45);
      doc.text(`Proprietário: ${user?.name || 'N/A'}`, 15, 49);

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Balanço do Período', 15, 62);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text(`(+) Entradas: R$ ${totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 70);
      doc.setTextColor(244, 63, 94);
      doc.text(`(-) Saídas: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 76);
      
      doc.setTextColor(balance >= 0 ? 16 : 244, balance >= 0 ? 185 : 63, balance >= 0 ? 129 : 94);
      doc.setFont('helvetica', 'bold');
      doc.text(`(=) Saldo Final: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 84);

      const tableData = allT.map(t => {
        const acc = bankAccounts.find(a => a.id === t.accountId);
        return [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.description || 'Sem descrição',
          t.category || 'Geral',
          acc?.name || 'N/A',
          `${t.amount > 0 ? '+' : '-'} R$ ${Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          t.type === 'transfer' ? 'Transferência' : (t.type === 'income' ? 'Entrada' : 'Saída')
        ];
      });

      autoTable(doc, {
        startY: 92,
        head: [['Data', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Tipo']],
        body: tableData,
        headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' },
          5: { fontStyle: 'italic', fontSize: 7 }
        },
        didParseCell: function(data: any) {
          if (data.section === 'body') {
            const rowType = data.row.cells[5].text[0];
            if (data.column.index === 4) {
              if (rowType === 'Transferência') data.cell.styles.textColor = [59, 130, 246];
              else if (rowType === 'Entrada') data.cell.styles.textColor = [16, 185, 129];
              else data.cell.styles.textColor = [244, 63, 94];
            }
          }
        }
      });

      doc.save(`Extrato_Geral_Infinity_${months[currentMonth]}_${currentYear}.pdf`);
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      alert(`Erro na geração do relatório: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-all shadow-sm active:scale-95"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Relatório Consolidado</h2>
            <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest font-bold">Visão Geral Mensal</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-end">
          <button 
            onClick={generatePDF}
            disabled={isGenerating || transactions.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-2xl transition-all active:scale-95 disabled:opacity-50 hover:bg-violet-700 shadow-lg shadow-violet-100 font-black text-[10px] uppercase tracking-widest order-last lg:order-none w-full lg:w-auto justify-center"
          >
            {isGenerating ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fas fa-file-pdf"></i>
            )}
            Gerar Relatório PDF
          </button>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COLUNA ENTRADAS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm shadow-emerald-50/50 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Entradas</p>
              <h3 className="text-2xl font-black text-emerald-600">R$ {totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-circle-arrow-up"></i>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Detalhamento Entradas</h4>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{monthlyIncomes.length} registros</span>
            </div>
            {monthlyIncomes.length > 0 ? (
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {monthlyIncomes.map((t) => {
                  const acc = bankAccounts.find(a => a.id === t.accountId);
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[45px] shrink-0">
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">{formatDate(t.date)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{t.description}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }}></div>
                              {t.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-500 text-sm">+ R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[8px] text-slate-300 font-bold uppercase truncate max-w-[80px]">{acc?.name || 'S/N'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-300">
                <i className="fas fa-piggy-bank text-3xl opacity-20 mb-2"></i>
                <p className="text-[10px] font-bold uppercase">Nenhuma entrada</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA SAÍDAS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm shadow-rose-50/50 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Saídas</p>
              <h3 className="text-2xl font-black text-rose-600">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-circle-arrow-down"></i>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Detalhamento Saídas</h4>
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{monthlyExpenses.length} registros</span>
            </div>
            {monthlyExpenses.length > 0 ? (
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {monthlyExpenses.map((t) => {
                  const acc = bankAccounts.find(a => a.id === t.accountId);
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[45px] shrink-0">
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">{formatDate(t.date)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{t.description}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }}></div>
                              {t.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-500 text-sm">- R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[8px] text-slate-300 font-bold uppercase truncate max-w-[80px]">{acc?.name || 'S/N'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-300">
                <i className="fas fa-file-excel text-3xl opacity-20 mb-2"></i>
                <p className="text-[10px] font-bold uppercase">Nenhuma saída</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BALANÇO FINAL RODAPÉ */}
      <div className="bg-violet-50 p-8 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-violet-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <i className="fas fa-infinity text-8xl text-violet-200"></i>
        </div>
        <div className="relative z-10">
          <p className="text-violet-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Resultado Líquido do Mês</p>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-black text-lg">R$</span>
            <h4 className={`text-4xl font-black tracking-tighter ${totalIncomes - totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(totalIncomes - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="bg-white/60 border border-violet-100 px-6 py-3 rounded-2xl text-center backdrop-blur-sm shadow-sm">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto</p>
             <p className={`text-xs font-bold ${totalIncomes >= totalExpenses ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes * 100).toFixed(1) : 0}% Lucro
             </p>
          </div>
          <div className="bg-white/60 border border-violet-100 px-6 py-3 rounded-2xl text-center backdrop-blur-sm shadow-sm">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
             <p className={`text-xs font-bold uppercase tracking-tighter ${totalIncomes >= totalExpenses ? 'text-emerald-600' : 'text-rose-400'}`}>
                {totalIncomes > totalExpenses ? 'Positivo' : 'Alerta'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;