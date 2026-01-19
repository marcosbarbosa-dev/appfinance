
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';

const ConfigManager: React.FC = () => {
  const { 
    loginTitle, setLoginTitle, 
    sidebarTitle, setSidebarTitle, 
    logoutTitle, setLogoutTitle,
    logoutMessage, setLogoutMessageConfig,
    logoData, setLogoData,
    setIsSidebarOpen, checkInternet
  } = useAuth();

  const [tempLoginTitle, setTempLoginTitle] = useState(loginTitle);
  const [tempSidebarTitle, setTempSidebarTitle] = useState(sidebarTitle);
  const [tempLogoutTitle, setTempLogoutTitle] = useState(logoutTitle);
  const [tempLogoutMessage, setTempLogoutMessage] = useState(logoutMessage);
  const [tempLogo, setTempLogo] = useState<string | null>(logoData);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempLoginTitle(loginTitle);
    setTempSidebarTitle(sidebarTitle);
    setTempLogoutTitle(logoutTitle);
    setTempLogoutMessage(logoutMessage);
    setTempLogo(logoData);
  }, [loginTitle, sidebarTitle, logoutTitle, logoutMessage, logoData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200000) { 
        alert("A imagem deve ter no máximo 200KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogo(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInternet()) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Sincroniza as configurações uma a uma.
      await setLoginTitle(tempLoginTitle);
      await setSidebarTitle(tempSidebarTitle);
      await setLogoutTitle(tempLogoutTitle);
      await setLogoutMessageConfig(tempLogoutMessage);
      await setLogoData(tempLogo);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Erro Supabase Capturado:", err);
      
      let errorMsg = "Ocorreu um erro ao gravar as alterações.";
      
      if (err) {
        if (typeof err === 'string') {
          errorMsg = err;
        } else if (err.message) {
          errorMsg = err.message;
        } else if (err.details) {
          errorMsg = err.details;
        } else if (typeof err === 'object') {
          try {
            errorMsg = err.message || JSON.stringify(err);
          } catch {
            errorMsg = "Erro de persistência no banco de dados.";
          }
        }
      }
      
      if (errorMsg.includes('42883') || errorMsg.toLowerCase().includes('uuid')) {
        setError("Erro de permissão: Incompatibilidade de tipos no banco. Execute o novo script SQL de correção no Supabase.");
      } else if (errorMsg.includes('schema cache') || errorMsg.includes('column')) {
        setError("Erro de cache: A nova tabela ainda não foi reconhecida. Execute o script SQL de criação da tabela 'ui_config'.");
      } else {
        setError(`Erro Supabase: ${errorMsg}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-violet-50 transition-all shadow-sm active:scale-95"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configurações</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Identidade Visual do Sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Personalização da Logo</p>
            
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-[2.5rem] bg-violet-600 border-4 border-slate-50 shadow-inner overflow-hidden flex items-center justify-center p-4 transition-all">
                {tempLogo ? (
                  <img src={tempLogo} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-white text-4xl">
                    <i className="fas fa-infinity"></i>
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-violet-600 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 hover:scale-110 transition-all active:scale-95"
              >
                <i className="fas fa-camera text-sm"></i>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                 Esta alteração reflete no<br/>Login e Menu Lateral
               </p>
               {tempLogo && (
                 <button 
                    onClick={() => setTempLogo(null)}
                    className="mt-4 text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600"
                 >
                   Restaurar Logo Padrão
                 </button>
               )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                  <i className="fas fa-edit text-violet-500"></i>
                  Títulos da Plataforma
                </h4>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título da Tela de Login</label>
                  <input
                    type="text"
                    value={tempLoginTitle}
                    onChange={(e) => setTempLoginTitle(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold bg-white text-black"
                    placeholder="Ex: Personalle Infinity"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título do Menu Lateral</label>
                  <input
                    type="text"
                    value={tempSidebarTitle}
                    onChange={(e) => setTempSidebarTitle(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold bg-white text-black"
                    placeholder="Ex: Personalle"
                  />
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-4">
                    <i className="fas fa-power-off text-rose-500"></i>
                    Tela de Saída (Logout)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título de Saída</label>
                      <input
                        type="text"
                        value={tempLogoutTitle}
                        onChange={(e) => setTempLogoutTitle(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold bg-white text-black"
                        placeholder="Ex: Personalle"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mensagem de Saída</label>
                      <input
                        type="text"
                        value={tempLogoutMessage}
                        onChange={(e) => setTempLogoutMessage(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold bg-white text-black"
                        placeholder="Ex: Saindo com segurança..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 animate-in slide-in-from-top-4">
                  <i className="fas fa-check-circle"></i>
                  Sincronizado permanentemente com o banco!
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2 animate-in shake">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? (
                    <i className="fas fa-circle-notch animate-spin"></i>
                  ) : (
                    <i className="fas fa-save"></i>
                  )}
                  {isSaving ? 'Gravando Alterações...' : 'Salvar no Banco de Dados'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigManager;
