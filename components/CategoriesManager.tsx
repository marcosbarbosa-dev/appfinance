
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Category } from '../types';

const CategoriesManager: React.FC = () => {
  const { categories, saveCategory, deleteCategory, setIsSidebarOpen, checkInternet } = useAuth();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    icon: 'fa-tag',
    color: '#8b5cf6'
  });

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const icons = [
    'fa-tag', 'fa-cart-shopping', 'fa-bag-shopping', 'fa-utensils', 
    'fa-burger', 'fa-coffee', 'fa-bus', 'fa-car', 'fa-gas-pump',
    'fa-plane', 'fa-house', 'fa-couch', 'fa-bolt', 'fa-wifi',
    'fa-mobile-screen', 'fa-gamepad', 'fa-film', 'fa-ticket',
    'fa-heart-pulse', 'fa-pills', 'fa-dumbbell', 'fa-graduation-cap',
    'fa-briefcase', 'fa-gift', 'fa-dog', 'fa-piggy-bank',
    'fa-wallet', 'fa-money-bill-transfer', 'fa-handshake', 'fa-money-bill-wave'
  ];

  const colors = [
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', 
    '#f43f5e', '#ef4444', '#fb923c', '#f59e0b', 
    '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', 
    '#3b82f6', '#64748b'
  ];

  const openModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ 
        name: category.name, 
        icon: category.icon, 
        color: category.color 
      });
    } else {
      setEditingCategory(null);
      setFormData({ 
        name: '', 
        icon: 'fa-tag', 
        color: '#8b5cf6' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;

    const catToSave: Category = {
      id: editingCategory ? editingCategory.id : crypto.randomUUID(),
      name: formData.name,
      type: activeTab,
      icon: formData.icon,
      color: formData.color
    };
    
    await saveCategory(catToSave);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!checkInternet()) return;
    if (confirm('Deseja excluir esta categoria?')) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all active:scale-95"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Categorias</h2>
            <p className="text-slate-500 text-sm">Personalize seus agrupamentos financeiros</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-violet-100 flex items-center gap-2 transition-all font-bold text-sm active:scale-95"
        >
          <i className="fas fa-plus text-xs"></i>
          Nova Categoria
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mb-8 max-w-md mx-auto sm:mx-0 border border-slate-200/50 shadow-inner">
        <button 
          onClick={() => setActiveTab('income')} 
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Entradas
        </button>
        <button 
          onClick={() => setActiveTab('expense')} 
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Saídas
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div 
            key={cat.id} 
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-slate-200 transition-all cursor-default"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-inner border border-white/20" 
                style={{ backgroundColor: cat.color }}
              >
                <i className={`fas ${cat.icon}`}></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeTab === 'income' ? 'Ganho' : 'Gasto'}</p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openModal(cat)} 
                className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                title="Editar"
              >
                <i className="fas fa-pen text-xs"></i>
              </button>
              <button 
                onClick={() => handleDelete(cat.id)} 
                className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Excluir"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-tag"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{editingCategory ? 'Editar' : 'Nova'} Categoria</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Personalização Infinity</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pré-visualização</label>
                <div className="flex justify-center">
                   <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-md flex items-center gap-4 w-full max-w-xs animate-in zoom-in-95 duration-200">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-inner transition-all duration-300" 
                        style={{ backgroundColor: formData.color }}
                      >
                        <i className={`fas ${formData.icon}`}></i>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-slate-800 truncate">{formData.name || 'Nome da Categoria'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeTab === 'income' ? 'Receita' : 'Despesa'}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-tight">Nome da Categoria</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium text-slate-700" 
                    placeholder="Ex: Alimentação, Lazer..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-tight">Escolher Ícone</label>
                  <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({...formData, icon})}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                          formData.icon === icon 
                          ? 'bg-violet-600 text-white shadow-lg scale-110' 
                          : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                        }`}
                      >
                        <i className={`fas ${icon} text-xs`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-tight">Escolher Cor</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                          formData.color === color 
                          ? 'border-slate-800 scale-110' 
                          : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {formData.color === color && (
                          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-[10px]">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all"
                >
                  Descartar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all active:scale-95"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
