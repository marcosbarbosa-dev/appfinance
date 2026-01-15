
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Category } from '../types';

const CategoriesManager: React.FC = () => {
  const { categories, setCategories, setIsSidebarOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    icon: 'fa-tag',
    color: '#64748b'
  });

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const icons = [
    'fa-tag', 'fa-money-bill-wave', 'fa-shopping-cart', 'fa-utensils', 
    'fa-bus', 'fa-gamepad', 'fa-heartbeat', 'fa-graduation-cap', 
    'fa-home', 'fa-car', 'fa-briefcase', 'fa-gift'
  ];

  const colors = [
    '#64748b', '#ef4444', '#f59e0b', '#10b981', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', 
    '#f43f5e', '#78350f'
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
      setFormData({ name: '', icon: 'fa-tag', color: '#64748b' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c));
    } else {
      const newCategory: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        type: activeTab,
        icon: formData.icon,
        color: formData.color
      };
      setCategories([...categories, newCategory]);
    }
    setIsModalOpen(false);
  };

  const deleteCategory = (id: string) => {
    if (confirm('Deseja excluir esta categoria? Isso não removerá transações já existentes.')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 shadow-sm transition-all"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Categorias</h2>
            <p className="text-slate-500">Personalize seus agrupamentos financeiros</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all font-medium"
        >
          <i className="fas fa-plus text-sm"></i>
          Nova Categoria
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mb-8 max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fas fa-arrow-up text-xs"></i>
          Entradas
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fas fa-arrow-down text-xs"></i>
          Saídas
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-sm"
                style={{ backgroundColor: cat.color }}
              >
                <i className={`fas ${cat.icon}`}></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{cat.name}</h4>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  {cat.type === 'income' ? 'Entrada' : 'Saída'}
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openModal(cat)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <i className="fas fa-pen text-xs"></i>
              </button>
              <button 
                onClick={() => deleteCategory(cat.id)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
          </div>
        ))}
        
        {filteredCategories.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <i className="fas fa-folder-open text-slate-300 text-4xl mb-4"></i>
            <p className="text-slate-500">Nenhuma categoria encontrada nesta seção.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Supermercado"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, icon})}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${formData.icon === icon ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                    >
                      <i className={`fas ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Cor</label>
                <div className="grid grid-cols-5 gap-3">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, color})}
                      className={`w-full h-8 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
