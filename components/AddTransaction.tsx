import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../App';
import { TransactionType, Transaction } from '../types';

interface AddTransactionProps {
  editTransaction?: Transaction | null;
  onCancel?: () => void;
  initialType?: TransactionType;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ editTransaction, onCancel, initialType }) => {
  const { 
    setActiveView, 
    categories, 
    saveTransaction, 
    saveTransactions, 
    bankAccounts, 
    user, 
    setIsSidebarOpen, 
    checkInternet,
    transactions 
  } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: (initialType || 'expense') as TransactionType,
    category: '',
    accountId: '',
    date: today,
    currentInstallment: 1 as number | string,
    totalInstallments: 1 as number | string,
    isInstallment: false
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editTransaction) {
      setFormData({
        description: editTransaction.description,
        amount: Math.abs(editTransaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        type: editTransaction.type,
        category: editTransaction.category,
        accountId: editTransaction.accountId,
        date: editTransaction.date,
        currentInstallment: editTransaction.installmentNumber || 1,
        totalInstallments: editTransaction.totalInstallments || 1,
        isInstallment: !!editTransaction.installmentNumber && editTransaction.installmentNumber > 0
      });
    } else if (initialType) {
      let defaultId = '';
      if (initialType === 'income' || initialType === 'expense') {
        const defaultAcc = bankAccounts.find(acc => acc.isDefault);
        if (defaultAcc) {
          defaultId = defaultAcc.id;
        }
      } else if (initialType === 'credit_card') {
        const firstCard = bankAccounts.find(acc => acc.type === 'credit_card');
        if (firstCard) defaultId = firstCard.id;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        type: initialType, 
        accountId: defaultId || prev.accountId 
      }));
    }
  }, [editTransaction, initialType, bankAccounts]);

  useEffect(() => {
    if (editTransaction) return;

    if (formData.type === 'income' || formData.type === 'expense') {
      const defaultAcc = bankAccounts.find(acc => acc.isDefault);
      if (defaultAcc && formData.accountId !== defaultAcc.id) {
        setFormData(prev => ({ ...prev, accountId: defaultAcc.id }));
      }
    }
  }, [formData.type, editTransaction, bankAccounts]);

  const currentAccountBalance = useMemo(() => {
    if (!formData.accountId) return 0;
    return transactions
      .filter(t => t.accountId === formData.accountId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions, formData.accountId]);

  const selectedAccount = useMemo(() => {
    return bankAccounts.find(a => a.id === formData.accountId);
  }, [bankAccounts, formData.accountId]);

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
      const defaultAcc = filteredAccounts.find(a => a.isDefault);
      setFormData(prev => ({ ...prev, accountId: defaultAcc ? defaultAcc.id : filteredAccounts[0].id }));
    }
  }, [filteredAccounts]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^\d,]/g, "");
    const parts = val.split(',');
    if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    const formatted = parts.join(',');
    setFormData({ ...formData, amount: formatted });
    setError(null);
  };

  const isInstallmentInvalid = useMemo(() => {
    if (!formData.isInstallment) return false;
    if (formData.currentInstallment === '' || formData.totalInstallments === '') return true;
    const start = Number(formData.currentInstallment);
    const end = Number(formData.totalInstallments);
    return start <= 0 || end <= 0 || end <= start;
  }, [formData.isInstallment, formData.currentInstallment, formData.totalInstallments]);

  const isFormInvalid = useMemo(() => {
    const isBasicInvalid = !formData.amount || !formData.accountId || !formData.category || filteredCategories.length === 0 || filteredAccounts.length === 0;
    if (formData.isInstallment) return isBasicInvalid || isInstallmentInvalid;
    return isBasicInvalid;
  }, [formData, filteredCategories, filteredAccounts, isInstallmentInvalid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet() || isFormInvalid || !user) return;
    const rawAmount = formData.amount.replace(/\./g, "").replace(",", ".");
    const amountValue = parseFloat(rawAmount);
    if (isNaN(amountValue)) return;
    const finalAmount = formData.type === 'income' ? Math.abs(amountValue) : -Math.abs(amountValue);
    const isLiquid = selectedAccount?.type !== 'credit_card';
    if (formData.type !== 'income' && isLiquid && amountValue > currentAccountBalance && !editTransaction) {
      setError("Saldo insuficiente");
      return;
    }
    const currentP_Num = Number(formData.currentInstallment);
    const totalP_Num = Number(formData.totalInstallments);
    if (editTransaction) {
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
          id: window.crypto.randomUUID(),
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
      if (newTransactions.length === 1) await saveTransaction(newTransactions[0]);
      else await saveTransactions(newTransactions);
    }
    if (onCancel) onCancel();
    else setActiveView('inicio');
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else setActiveView('inicio');
  };

  return (
    <div className="p-4 md:p-6">
      <div className={`rounded-2xl ${editTransaction ? '' : 'bg-white'}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className={`grid grid-cols-1 ${editTransaction ? '' : 'sm:grid-cols-2'} gap-4`}>
              <div>
                <label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Valor do Lançamento</label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold ${editTransaction ? 'text-xs' : 'text-base'}`}>R$</span>
                  <input 
                    type="text" 
                    required 
                    inputMode="decimal"
                    value={formData.amount} 
                    onChange={handleAmountChange} 
                    placeholder="0,00" 
                    className={`w-full pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-black bg-white text-black ${editTransaction ? 'py-2.5 text-base' : 'py-3.5 text-xl'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Conta Relacionada</label>
                <select required value={formData.accountId} onChange={(e) => { setFormData({...formData, accountId: e.target.value}); setError(null); }} className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all bg-white text-black font-bold ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}>
                  {filteredAccounts.length > 0 ? filteredAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName}){acc.isDefault ? ' [Padrão]' : ''}
                    </option>
                  )) : <option value="">Nenhuma conta disponível</option>}
                </select>
                {formData.accountId && selectedAccount?.type !== 'credit_card' && (
                  <p className="text-[10px] font-bold text-slate-400 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    Saldo: <span className={currentAccountBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      R$ {currentAccountBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in shake duration-300">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div>
              <label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Descrição <span className="text-slate-400 font-normal">(Opcional)</span></label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ex: Assinatura Personalle" className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all bg-white text-black font-bold ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}/>
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
                          inputMode="numeric"
                          value={formData.currentInstallment} 
                          onChange={(e) => setFormData(prev => ({ ...prev, currentInstallment: e.target.value }))} 
                          className={`w-full bg-white text-black border rounded-lg px-3 py-2 text-sm font-bold outline-none transition-all ${isInstallmentInvalid && formData.currentInstallment !== '' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-purple-400'}`}
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
                          inputMode="numeric"
                          value={formData.totalInstallments} 
                          onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: e.target.value }))} 
                          className={`w-full bg-white text-black border rounded-lg px-3 py-2 text-sm font-bold outline-none transition-all ${isInstallmentInvalid && formData.totalInstallments !== '' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-purple-400'}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`grid grid-cols-1 ${editTransaction ? '' : 'sm:grid-cols-2'} gap-4`}>
              <div><label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Categoria</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all bg-white text-black font-bold ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}>{filteredCategories.length > 0 ? filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>) : <option value="">Nenhuma categoria</option>}</select></div>
              <div><label className={`block font-bold text-slate-600 mb-1.5 ${editTransaction ? 'text-[10px]' : 'text-sm'}`}>Data {formData.isInstallment ? 'da 1ª Parcela' : ''}</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={`w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all bg-white text-black font-bold ${editTransaction ? 'py-2.5 text-xs' : 'py-3.5 text-sm'}`}/></div>
            </div>
          </div>

          <div className={`flex flex-col gap-2 ${editTransaction ? 'pt-2' : 'pt-4'}`}>
            <button type="submit" disabled={isFormInvalid} className={`w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale ${editTransaction ? 'py-3.5 text-xs' : 'py-4 text-base'}`}><i className="fas fa-check text-[10px]"></i>{editTransaction ? 'Atualizar Registro' : 'Salvar no Extrato'}</button>
            {!editTransaction && <button type="button" onClick={handleCancel} className="w-full py-4 text-slate-400 hover:text-rose-600 font-bold transition-all text-sm">Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;