
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Notice } from '../types';

const NoticesManager: React.FC = () => {
  const { notices, saveNotice, deleteNotice, setIsSidebarOpen, checkInternet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{title: string, msg: string} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: ''
  });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const openModal = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({ title: notice.title, message: notice.message });
    setIsModalOpen(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;
    setIsSaving(true);

    const notice: Notice = {
      id: crypto.randomUUID(),
      title: formData.title,
      message: formData.message,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      await saveNotice(notice);
      // LIMPEZA OBRIGATÓRIA DO FORMULÁRIO
      setFormData({ title: '', message: '' });
      setSuccessMessage({ title: 'Publicado!', msg: 'O comunicado já está visível para os membros.' });
    } catch (error) {
      console.error("Erro ao publicar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet() || !editingNotice) return;
    setIsSaving(true);

    const updated: Notice = {
      ...editingNotice,
      title: formData.title,
      message: formData.message
    };

    try {
      await saveNotice(updated);
      setIsModalOpen(false);
      setSuccessMessage({ title: 'Atualizado!', msg: 'As alterações foram salvas com sucesso.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (notice: Notice) => {
    if (!checkInternet()) return;
    await saveNotice({ ...notice, isActive: !notice.isActive });
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!editingNotice || !checkInternet()) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteNotice(editingNotice.id);
      if (success) {
        setShowDeleteConfirm(false);
        setIsModalOpen(false);
        setEditingNotice(null);
        setSuccessMessage({ title: 'Removido!', msg: 'O aviso foi excluído permanentemente.' });
      } else {
        alert("Ocorreu um erro ao excluir. Verifique a conexão e tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao deletar aviso:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 relative">
      {/* Toast de Sucesso */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-[300] bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-right-10 duration-500 border border-white/10 ring-1 ring-white/20">
          <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-xl shadow-lg shadow-violet-500/20">
            <i className="fas fa-check"></i>
          </div>
          <div>
            <p className="font-black text-xs uppercase tracking-widest leading-none mb-1 text-violet-400">{successMessage.title}</p>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">{successMessage.msg}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 transition-all"><i className="fas fa-bars"></i></button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Avisos do Sistema</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Comunicados aos Membros Platinum</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-pen-nib text-violet-500"></i>
          Publicar Novo Aviso
        </h3>
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Título do Comunicado</label>
            <input 
              type="text" 
              required 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="Ex: Manutenção Programada"
              className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mensagem</label>
            <textarea 
              required 
              value={formData.message} 
              onChange={(e) => setFormData({...formData, message: e.target.value})} 
              placeholder="Digite os detalhes do comunicado..."
              className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSaving || !formData.title || !formData.message}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Publicando...' : 'Lançar Comunicado'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-list text-slate-400"></i>
          Histórico de Avisos
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-violet-200 transition-all">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${notice.isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-400'}`}>
                  <i className={`fas ${notice.isActive ? 'fa-check' : 'fa-power-off'}`}></i>
                </div>
                <h4 className="font-bold text-slate-800 truncate text-sm">{notice.title}</h4>
              </div>
              <button 
                onClick={() => openModal(notice)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
          ))}
          {notices.length === 0 && (
            <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sem comunicados registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      {isModalOpen && editingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-lg font-bold">Ações do Aviso</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <div className="p-8 space-y-6">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Título</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mensagem</label>
                  <textarea 
                    required 
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})} 
                    className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSaving || isDeleting}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-violet-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => toggleStatus(editingNotice)} 
                  disabled={isDeleting}
                  className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingNotice.isActive ? 'border-amber-100 text-amber-500 hover:bg-amber-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'} disabled:opacity-50`}
                >
                  <i className={`fas ${editingNotice.isActive ? 'fa-power-off' : 'fa-play'}`}></i>
                  {editingNotice.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  disabled={isDeleting}
                  className="p-3 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-trash-alt"></i>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão Personalizada */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100">
              <i className="fas fa-trash-can"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Confirmar Exclusão?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Esta ação removerá o comunicado permanentemente para todos os membros.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                disabled={isDeleting}
                className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : null}
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Agora'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                disabled={isDeleting}
                className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesManager;
