
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../App';
import { TransactionType, Transaction } from '../types';

interface AddTransactionProps {
  editTransaction?: Transaction | null;
  onCancel?: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ editTransaction, onCancel }) => {
  const { setActiveView, categories, saveTransaction, saveTransactions, bankAccounts, user, setIsSidebarOpen, checkInternet } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: '',
    accountId: '',
    date: today,
    currentInstallment: 1 as number | string,
    totalInstallments: 1 as number | string,
    isInstallment: false
  });

  useEffect(() => {
    if (editTransaction) {
      setFormData({
        description: editTransaction.description,
        amount: Math.abs(editTransaction.amount).toString(),
        type: editTransaction.type,
        category: editTransaction.category,
        accountId: editTransaction.accountId,
        date: editTransaction.date,
        currentInstallment: editTransaction.installmentNumber || 1,
        totalInstallments: editTransaction.totalInstallments || 1,
        isInstallment: !!editTransaction.installmentNumber && editTransaction.installmentNumber > 0
      });
    }
  }, [editTransaction]);

  const filteredCategories = useMemo(() => {
    const typeToFilter = formData.type === 'income' ? 'income' : 'expense';
    return categories.filter(c => c.type === typeToFilter);
  }, [categories, formData.type]);

  const filteredAccounts = useMemo(() => {
    if (formData.type === 'credit_card') {
      return bankAccounts.filter(acc => acc.type === 'credit_card');
    }
    return bankAccounts.filter(acc => acc.type !== 'credit_card');
  }, [bankAccounts, formData.type]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === formData.category)) {
      setFormData(prev => ({ ...prev, category: filteredCategories[0].name }));
    }
  }, [filteredCategories]);

  useEffect(() => {
    if (filteredAccounts.length > 0 && !filteredAccounts.find(a => a.id === formData.accountId)) {
      setFormData(prev => ({ ...prev, accountId: filteredAccounts[0].id }));
    }
  }, [filteredAccounts]);

  const isInstallmentInvalid = useMemo(() => {
    if (!formData.isInstallment) return false;
    if (formData.currentInstallment === '' || formData.totalInstallments === '') return true;
    const start = Number(formData.currentInstallment);
    const end = Number(formData.totalInstallments);
    return start <= 0 || end <= 0 || end <= start;
  }, [formData.isInstallment, formData.currentInstallment, formData.totalInstallments]);

  const isFormInvalid = useMemo(() => {
    const isBasicInvalid = !formData.amount || !formData.accountId || !formData.category || filteredCategories.length === 0 || filteredAccounts.length === 0;
    
    if (formData.isInstallment) {
      return isBasicInvalid || isInstallmentInvalid;
    }
    
    return isBasicInvalid;
  }, [formData, filteredCategories, filteredAccounts, isInstallmentInvalid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet() || isFormInvalid || !user) return;

    // Garantir que o valor seja tratado como número corretamente
    const baseAmount = parseFloat(formData.amount.replace(',', '.'));
    const finalAmount = formData.type === 'income' ? Math.abs(baseAmount) : -Math.abs(baseAmount);

    const currentP_Num = Number(formData.currentInstallment);
    const totalP_Num = Number(formData.totalInstallments);

    if (editTransaction) {
      // Criação de um objeto limpo para evitar enviar campos de controle do formulário para o banco
      const cleanTransaction: Transaction = {
        id: editTransaction.id,
        userId: user.uid,
        description: formData.description,
        amount: finalAmount,
        type: formData.type,
        date: formData.date,
        category: formData.category,
        accountId: formData.accountId,
        installmentNumber: formData.isInstallment ? currentP_Num : undefined,
        totalInstallments: formData.isInstallment ? totalP_Num : undefined
      };

      await saveTransaction(cleanTransaction);
    } else {
      const newTransactions: Transaction[] = [];
      const startParcel = formData.isInstallment ? currentP_Num : 1;
      const endParcel = formData.isInstallment ? totalP_Num : 1;
      const numToGenerate = (endParcel - startParcel) + 1;
      const baseDate = new Date(formData.date + 'T12:00:00');

      for (let i = 0; i < numToGenerate; i++) {
        const parcelDate = new Date(baseDate);
        parcelDate.setMonth(baseDate.getMonth() + i);
        const currentP = startParcel + i;

        newTransactions.push({
          id: crypto.randomUUID(),
          userId: user.uid,
          description: formData.description + (formData.isInstallment ? ` (${currentP}/${totalP_Num})` : ''),
          amount: finalAmount,
          type: formData.type,
          date: parcelDate.toISOString().split('T')[0],
          category: formData.category,
          accountId: formData.accountId,
          installmentNumber: formData.isInstallment ? currentP : undefined,
          totalInstallments: formData.isInstallment ? totalP_Num : undefined,
        });
      }
      
      if (newTransactions.length === 1) {
        await saveTransaction(newTransactions[0]);
      } else {
        await saveTransactions(newTransactions);
      }
    }
    
    if (onCancel) onCancel();
    else setActiveView('inicio');
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else setActiveView('inicio');
  };

  return (
    <div className={`${editTransaction ? 'p-4' : 'p-4 md:p-8 max-w-2xl mx-auto'}`}>
      {!editTransaction && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"><i className="fas fa-bars"></i></button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Novo Lançamento</h2>
              <p className="text-slate-500 text-sm">Registre sua movimentação Personalle</p>
            </div>
          </div>
          <button onClick={handleCancel} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-all"><i className="fas fa-times"></i></button>
        </div>
      )}

      <div className={`rounded-2xl ${editTransaction ? '' : 'bg-white shadow-sm border border-slate-100 overflow-hidden'}`}>
        <form onSubmit={handleSubmit} className={`${editTransaction ? 'space-y-4' : 'p-8 space-y-8'}`}>
          <div>
            <label className={`block font-bold text-slate-700 mb-3 text-center text-slate-400 uppercase tracking-widest ${editTransaction ? 'text-[9px]' : 'text-sm'}`}>Fluxo de Caixa</label>
            <div className="flex p-1 bg-slate-50 rounded-xl gap-1 border border-slate-100">
              {[
                { id: 'income', label: 'Entrada', icon: 'fa-arrow-up', color: 'text-violet-500' },
                { id: 'expense', label: 'Saída', icon: 'fa-arrow-down', color: 'text-rose-500' },
                { id: 'credit_card', label: 'Cartão', icon: 'fa-credit-card', color: 'text-purple-500' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({...formData, type: t.id as TransactionType})}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all ${formData.type === t.id ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  <i className={`fas ${t.icon} ${formData.type === t.id ? t.color : ''} ${editTransaction ? 'text-xs' : 'text-sm'}`}></i>
                  <span className={`font-bold ${editTransaction ? 'text-[10px]' : 'text-xs'} ${formData.type === t.id ? 'text-slate-800' : ''}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${editTransaction ? 'space-y-4' : 'space-y-6'}`}>
            <div className={`grid grid-cols-1 ${editTransaction ? '' : 'sm:grid-cols-2'} gap-4`}>
              <div>
                <label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Valor do Lançamento</label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold ${editTransaction ? 'text-xs' : 'text-base'}`}>R$</span>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0,00" className={`w-full pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-black text-slate-800 ${editTransaction ? 'py-2.5 text-base' : 'py-3.5 text-xl'}`}/>
                </div>
              </div>

              <div>
                <label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Conta Relacionada</label>
                <select required value={formData.accountId} onChange={(e) => setFormData({...formData, accountId: e.target.value})} className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 bg-white ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}>
                  {filteredAccounts.length > 0 ? filteredAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</option>) : <option value="">Nenhuma conta disponível</option>}
                </select>
              </div>
            </div>

            <div>
              <label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Descrição <span className="text-slate-400 font-normal">(Opcional)</span></label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ex: Assinatura Personalle" className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}/>
            </div>

            {formData.type === 'credit_card' && !editTransaction && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-layer-group text-purple-500 text-xs"></i>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Habilitar Parcelamento?</span>
                  </div>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, isInstallment: !prev.isInstallment }))} className={`w-10 h-5 rounded-full transition-all relative ${formData.isInstallment ? 'bg-purple-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isInstallment ? 'right-1' : 'left-1'}`}></div></button>
                </div>
                {formData.isInstallment && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Parcela Inicial</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={formData.currentInstallment} 
                          onChange={(e) => setFormData(prev => ({ ...prev, currentInstallment: e.target.value }))} 
                          className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none transition-all ${isInstallmentInvalid && formData.currentInstallment !== '' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-purple-400'}`}
                        />
                      </div>
                      <div className="pt-4 text-slate-300 font-bold flex flex-col items-center">
                        <i className={`fas ${isInstallmentInvalid ? 'fa-triangle-exclamation text-rose-500 scale-110' : 'fa-angle-right'} transition-all`}></i>
                        <span className="text-[9px] uppercase mt-0.5">até</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Parcela Final</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={formData.totalInstallments} 
                          onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: e.target.value }))} 
                          className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none transition-all ${isInstallmentInvalid && formData.totalInstallments !== '' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-purple-400'}`}
                        />
                      </div>
                    </div>
                    {isInstallmentInvalid && formData.currentInstallment !== '' && formData.totalInstallments !== '' && (
                      <p className="text-[10px] text-rose-600 font-bold text-center italic bg-rose-50 py-1.5 rounded-lg border border-rose-100">
                        A parcela final deve ser maior que a inicial.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={`grid grid-cols-1 ${editTransaction ? '' : 'sm:grid-cols-2'} gap-4`}>
              <div><label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Categoria</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 bg-white ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}>{filteredCategories.length > 0 ? filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>) : <option value="">Nenhuma categoria</option>}</select></div>
              <div><label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Data {formData.isInstallment ? 'da 1ª Parcela' : ''}</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-slate-700 bg-white ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}/></div>
            </div>
          </div>

          <div className={`flex flex-col gap-2 ${editTransaction ? 'pt-2' : 'pt-4'}`}>
            <button 
              type="submit" 
              disabled={isFormInvalid} 
              className={`w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale ${editTransaction ? 'py-3.5 text-xs' : 'py-4 text-base'}`}
            >
              <i className="fas fa-check text-[10px]"></i>
              {editTransaction ? 'Atualizar Registro' : 'Salvar no Extrato'}
            </button>
            {!editTransaction && <button type="button" onClick={handleCancel} className="w-full py-4 text-slate-400 hover:text-rose-600 font-bold transition-all text-sm">Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;
