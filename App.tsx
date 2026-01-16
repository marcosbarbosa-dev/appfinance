
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { User, Category, Transaction, BankAccount, SystemLog, LogAction } from './types';
import { supabase } from './supabase';
import LoginForm from './components/LoginForm';
import UserHome from './components/UserHome';
import AdminPanel from './components/AdminPanel';
import FirstLoginFlow from './components/FirstLoginFlow';
import Sidebar from './components/Sidebar';
import AddTransaction from './components/AddTransaction';
import CategoriesManager from './components/CategoriesManager';
import TransactionsList from './components/TransactionsList';
import AccountsManager from './components/AccountsManager';
import ReportsView from './components/ReportsView';
import LogsPanel from './components/LogsPanel';
import UserProfile from './components/UserProfile';
import SupportManager from './components/SupportManager';
import ConnectivityModal from './components/ConnectivityModal';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  setAllUsers: (users: User[]) => Promise<void>;
  saveUser: (userData: User) => Promise<void>;
  deleteUserFromDb: (uid: string) => Promise<void>;
  categories: Category[];
  saveCategory: (cat: Category) => Promise<void>;
  saveCategoriesBatch: (cats: Category[]) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  transactions: Transaction[];
  saveTransaction: (t: Transaction) => Promise<void>;
  saveTransactions: (ts: Transaction[]) => Promise<void>;
  deleteTransactionFromDb: (id: string) => Promise<void>;
  bankAccounts: BankAccount[];
  saveBankAccount: (acc: BankAccount) => Promise<void>;
  saveBankAccountsBatch: (accs: BankAccount[]) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  logs: SystemLog[];
  setLogs: (logs: SystemLog[]) => Promise<void>;
  supportInfo: string;
  setSupportInfo: (info: string) => Promise<void>;
  maintenanceMessage: string;
  setMaintenanceMessage: (info: string) => Promise<void>;
  isLoggingEnabled: boolean;
  setIsLoggingEnabled: (enabled: boolean) => Promise<void>;
  isSystemLocked: boolean;
  setIsSystemLocked: (locked: boolean) => Promise<void>;
  addLog: (userToLog: User, action: LogAction, details?: string) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  updatePassword: (newPass: string) => Promise<void>;
  updateProfile: (name: string, avatar: string, password?: string) => Promise<void>;
  isOnline: boolean;
  checkInternet: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const LogoInfinity = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M18 50C18 32 38 32 50 50C62 68 82 68 82 50C82 32 62 32 50 50C38 68 18 68 18 50Z" 
      stroke="currentColor" 
      strokeWidth="8.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const LogoutLoading: React.FC = () => (
  <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
    <div className="text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
        <div className="relative w-full h-full bg-violet-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40">
          <LogoInfinity className="w-12 h-12" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-white text-xl font-black tracking-tight">Personalle Infinity</h2>
        <div className="flex items-center justify-center gap-3">
          <i className="fas fa-circle-notch animate-spin text-violet-400 text-sm"></i>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Encerrando sessão com segurança...</p>
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { allUsers, setIsSidebarOpen } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];

  const activeMembers = allUsers.filter(u => {
    const isAutoSuspended = u.suspensionDate && today >= u.suspensionDate;
    return u.isActive && !isAutoSuspended;
  }).length;

  const suspendedMembers = allUsers.filter(u => {
    const isAutoSuspended = u.suspensionDate && today >= u.suspensionDate;
    return !u.isActive || isAutoSuspended;
  }).length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 shadow-sm transition-all"><i className="fas fa-bars"></i></button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Painel Administrativo</h2>
          <p className="text-slate-500 text-sm">Visão geral do sistema Personalle Infinity</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-users text-xl"></i></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Usuários Cadastrados</p>
          <h3 className="text-3xl font-black text-slate-800">{allUsers.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-user-check text-xl"></i></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Membros Ativos</p>
          <h3 className="text-3xl font-black text-slate-800">{activeMembers}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-user-slash text-xl"></i></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Membros Suspensos</p>
          <h3 className="text-3xl font-black text-slate-800">{suspendedMembers}</h3>
        </div>
      </div>
      <div className="mt-8 p-6 bg-violet-600 rounded-3xl text-white shadow-xl shadow-violet-100">
        <h4 className="text-lg font-bold mb-2">Bem-vindo ao Controle Central</h4>
        <p className="text-violet-100 text-sm opacity-90 leading-relaxed">Utilize o menu lateral para gerenciar usuários, visualizar logs de auditoria e configurar as informações de suporte do sistema.</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsersState] = useState<User[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccountsState] = useState<BankAccount[]>([]);
  const [logs, setLogsState] = useState<SystemLog[]>([]);
  const [supportInfo, setSupportInfoState] = useState("");
  const [maintenanceMessage, setMaintenanceMessageState] = useState("");
  const [isLoggingEnabled, setIsLoggingEnabledState] = useState(true);
  const [isSystemLocked, setIsSystemLockedState] = useState(false);
  const [activeView, setActiveView] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  // Sync Logic
  const saveUser = async (userData: User) => {
    const { error } = await supabase.from('users').upsert(userData);
    if (!error) setAllUsersState(prev => {
      const exists = prev.find(u => u.uid === userData.uid);
      return exists ? prev.map(u => u.uid === userData.uid ? userData : u) : [...prev, userData];
    });
  };

  const deleteUserFromDb = async (uid: string) => {
    const { error } = await supabase.from('users').delete().eq('uid', uid);
    if (!error) setAllUsersState(prev => prev.filter(u => u.uid !== uid));
  };

  const setAllUsers = async (users: User[]) => {
    setAllUsersState(users);
    await supabase.from('users').upsert(users);
  };

  const saveCategory = async (cat: Category) => {
    if (!user) return;
    const payload = { ...cat, userId: cat.userId || user.uid };
    const { error } = await supabase.from('categories').upsert(payload);
    if (!error && (!cat.userId || cat.userId === user.uid)) {
      setCategoriesState(prev => {
        const exists = prev.find(c => c.id === cat.id);
        return exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat];
      });
    }
  };

  const saveCategoriesBatch = async (cats: Category[]) => {
     const { error } = await supabase.from('categories').insert(cats);
     if (!error && cats[0]?.userId === user?.uid) {
       setCategoriesState(prev => [...cats, ...prev]);
     }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategoriesState(prev => prev.filter(c => c.id !== id));
  };

  const saveTransaction = async (t: Transaction) => {
    if (!user) return;
    const payload = { ...t, userId: user.uid };
    const { error } = await supabase.from('transactions').upsert(payload);
    if (!error) {
      setTransactionsState(prev => {
        const exists = prev.find(tr => tr.id === t.id);
        return exists ? prev.map(tr => tr.id === t.id ? t : tr) : [t, ...prev];
      });
    } else {
      console.error("Erro ao salvar transação:", error.message);
    }
  };

  const saveTransactions = async (ts: Transaction[]) => {
    if (!user) return;
    const payload = ts.map(t => ({ ...t, userId: user.uid }));
    const { error } = await supabase.from('transactions').upsert(payload);
    if (!error) {
      setTransactionsState(prev => [...ts, ...prev]);
    } else {
      console.error("Erro ao salvar lote de transações:", error.message);
    }
  };

  const deleteTransactionFromDb = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactionsState(prev => prev.filter(t => t.id !== id));
  };

  const saveBankAccount = async (acc: BankAccount) => {
    if (!user) return;
    const payload = { ...acc, userId: acc.userId || user.uid };
    const { error } = await supabase.from('bank_accounts').upsert(payload);
    if (!error && (!acc.userId || acc.userId === user.uid)) {
      setBankAccountsState(prev => {
        const exists = prev.find(a => a.id === acc.id);
        return exists ? prev.map(a => a.id === acc.id ? acc : a) : [...prev, acc];
      });
    }
  };

  const saveBankAccountsBatch = async (accs: BankAccount[]) => {
     const { error } = await supabase.from('bank_accounts').insert(accs);
     if (!error && accs[0]?.userId === user?.uid) {
       setBankAccountsState(prev => [...accs, ...prev]);
     }
  };

  const deleteBankAccount = async (id: string) => {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (!error) setBankAccountsState(prev => prev.filter(a => a.id !== id));
  };

  const setLogs = async (l: SystemLog[]) => {
    setLogsState(l);
    await supabase.from('logs').upsert(l);
  };

  const setSupportInfo = async (info: string) => {
    setSupportInfoState(info);
    await supabase.from('app_config').upsert({ id: 'support', content: info });
  };

  const setMaintenanceMessage = async (info: string) => {
    setMaintenanceMessageState(info);
    await supabase.from('app_config').upsert({ id: 'maintenance_message', content: info });
  };

  const setIsLoggingEnabled = async (enabled: boolean) => {
    setIsLoggingEnabledState(enabled);
    await supabase.from('app_config').upsert({ id: 'logging_enabled', content: enabled.toString() });
  };

  const setIsSystemLocked = async (locked: boolean) => {
    setIsSystemLockedState(locked);
    await supabase.from('app_config').upsert({ id: 'system_locked', content: locked.toString() });
  };

  const logout = useCallback(async () => {
    if (user && user.role === 'admin') { addLog(user, 'logout'); }
    setIsSidebarOpen(false);
    setIsLoggingOut(true);
    // Tempo reduzido para 1.5 segundos conforme solicitado
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUser(null);
    setIsLoggingOut(false);
    setActiveView('inicio');
  }, [user]);

  // Real-time listener for app configs (System Lock & Messages)
  useEffect(() => {
    const channel = supabase
      .channel('app_config_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_config' 
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord.id === 'system_locked') {
          setIsSystemLockedState(newRecord.content === 'true');
        } else if (newRecord.id === 'maintenance_message') {
          setMaintenanceMessageState(newRecord.content);
        } else if (newRecord.id === 'support') {
          setSupportInfoState(newRecord.content);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Automatic logout effect when system is locked
  useEffect(() => {
    if (isSystemLocked && user && user.role !== 'admin') {
      logout();
    }
  }, [isSystemLocked, user, logout]);

  const fetchData = useCallback(async (loggedInUser: User) => {
    const isAdmin = loggedInUser.role === 'admin';
    if (isAdmin) {
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) setAllUsersState(usersData);
    }
    const { data: catsData } = await supabase.from('categories').select('*').or(`userId.eq.${loggedInUser.uid},userId.is.null`);
    if (catsData) setCategoriesState(catsData);
    const { data: accsData } = await supabase.from('bank_accounts').select('*').eq('userId', loggedInUser.uid);
    if (accsData) setBankAccountsState(accsData);
    const { data: transData } = await supabase.from('transactions').select('*').eq('userId', loggedInUser.uid);
    if (transData) setTransactionsState(transData);
    const logQuery = isAdmin ? supabase.from('logs').select('*').order('timestamp', { ascending: false }) : supabase.from('logs').select('*').eq('userId', loggedInUser.uid).order('timestamp', { ascending: false });
    const { data: logsData } = await logQuery;
    if (logsData) setLogsState(logsData);
    
    // Fetch initial configs
    const { data: configData } = await supabase.from('app_config').select('*');
    if (configData) {
      const support = configData.find(d => d.id === 'support');
      if (support) setSupportInfoState(support.content);
      const maintenance = configData.find(d => d.id === 'maintenance_message');
      if (maintenance) setMaintenanceMessageState(maintenance.content);
      const logging = configData.find(d => d.id === 'logging_enabled');
      if (logging) setIsLoggingEnabledState(logging.content === 'true');
      const locked = configData.find(d => d.id === 'system_locked');
      if (locked) setIsSystemLockedState(locked.content === 'true');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial fetch of configs (can be done without user)
    supabase.from('app_config').select('*').then(({ data }) => {
      if(data) {
        const support = data.find(d => d.id === 'support');
        if(support) setSupportInfoState(support.content);
        const maintenance = data.find(d => d.id === 'maintenance_message');
        if(maintenance) setMaintenanceMessageState(maintenance.content);
        const logging = data.find(d => d.id === 'logging_enabled');
        if(logging) setIsLoggingEnabledState(logging.content === 'true');
        const locked = data.find(d => d.id === 'system_locked');
        if(locked) setIsSystemLockedState(locked.content === 'true');
      }
    });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkInternet = () => {
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
      return false;
    }
    return true;
  };

  const addLog = async (userToLog: User, action: LogAction, details?: string) => {
    if (!isLoggingEnabled || userToLog.role !== 'admin') return;

    const newLog: SystemLog = { 
      id: crypto.randomUUID(), 
      userId: userToLog.uid, 
      userName: userToLog.name, 
      action, 
      details, 
      timestamp: new Date().toISOString() 
    };
    
    setLogsState(prev => [newLog, ...prev]);
    await supabase.from('logs').insert(newLog);
  };

  const deleteLog = async (id: string) => {
    if (!checkInternet()) return;
    const { error } = await supabase.from('logs').delete().eq('id', id);
    if (!error) {
      setLogsState(prev => prev.filter(l => l.id !== id));
    }
  };

  const clearLogs = async ( ) => {
    if (!checkInternet()) return;
    const { error } = await supabase.from('logs').delete().not('id', 'is', null);
    if (!error) {
      setLogsState([]);
    }
  };

  const login = async (username: string, pass: string) => {
    if (!checkInternet()) return;
    setLoading(true);
    setError(null);
    const { data: foundUser, error: fetchError } = await supabase.from('users').select('*').eq('username', username).single();
    
    if (fetchError || !foundUser) {
      setError("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    if (isSystemLocked && foundUser.role !== 'admin') {
      setError("Atualização em andamento");
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const isSuspendedByDate = foundUser.suspensionDate && today >= foundUser.suspensionDate;
    if (!foundUser.isActive || isSuspendedByDate) {
      setError("Não foi possível fazer login no sistema. Entre em contato com o administrador.");
      setLoading(false);
      return;
    }
    if (foundUser.isFirstLogin) {
      if (pass !== foundUser.username) {
        setError("Para primeiro acesso, use a senha padrão (seu usuário).");
        setLoading(false);
        return;
      }
    } else {
      if (pass !== foundUser.password) {
        setError("Senha incorreta.");
        setLoading(false);
        return;
      }
    }
    setUser(foundUser);
    await fetchData(foundUser);
    if (foundUser.role === 'admin') { addLog(foundUser, 'login'); }
    setLoading(false);
  };

  const updatePassword = async (newPass: string) => {
    if (!user) return;
    if (!checkInternet()) return;
    setLoading(true);
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('users').update({ password: newPass, isFirstLogin: false, updatedAt: now }).eq('uid', user.uid);
    if (!updateError) { setUser({ ...user, password: newPass, isFirstLogin: false, updatedAt: now }); }
    setLoading(false);
  };

  const updateProfile = async (name: string, avatar: string, password?: string) => {
    if (!user) return;
    if (!checkInternet()) return;
    setLoading(true);
    const now = new Date().toISOString();
    const updateData: any = { name, avatar, updatedAt: now };
    if (password) updateData.password = password;
    const { error: updateError } = await supabase.from('users').update(updateData).eq('uid', user.uid);
    if (!updateError) { setUser({ ...user, ...updateData }); }
    setLoading(false);
  };

  const renderContent = () => {
    if (!user) return null;

    if (user.role === 'admin') {
      switch (activeView) {
        case 'dashboard': return <AdminDashboard />;
        case 'usuarios': return <AdminPanel />;
        case 'logs': return <LogsPanel />;
        case 'meus_dados': return <UserProfile />;
        case 'suporte': return <SupportManager />;
        default: return <AdminDashboard />;
      }
    } else {
      switch (activeView) {
        case 'inicio': return <UserHome />;
        case 'relatorio': return <ReportsView />;
        case 'adicionar_transacao': return <AddTransaction />;
        case 'categorias': return <CategoriesManager />;
        case 'lancamentos': return <TransactionsList />;
        case 'contas': return <AccountsManager />;
        case 'meus_dados': return <UserProfile />;
        default: return <UserHome />;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, allUsers, setAllUsers, saveUser, deleteUserFromDb,
      categories, saveCategory, saveCategoriesBatch, deleteCategory, transactions, saveTransaction, saveTransactions, deleteTransactionFromDb,
      bankAccounts, saveBankAccount, saveBankAccountsBatch, deleteBankAccount, logs, setLogs, supportInfo, setSupportInfo,
      maintenanceMessage, setMaintenanceMessage,
      isLoggingEnabled, setIsLoggingEnabled, isSystemLocked, setIsSystemLocked,
      addLog, deleteLog, clearLogs, activeView, setActiveView, isSidebarOpen, setIsSidebarOpen,
      login, logout, updatePassword, updateProfile, isOnline, checkInternet
    }}>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        {isLoggingOut && <LogoutLoading />}
        
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <LoginForm error={error} loading={loading} />
          </div>
        ) : user.isFirstLogin ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <FirstLoginFlow />
          </div>
        ) : (
          <div className="flex w-full h-screen overflow-hidden relative">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50 relative">{renderContent()}</main>
          </div>
        )}
        <ConnectivityModal show={showOfflineAlert} onClose={() => setShowOfflineAlert(false)} />
      </div>
    </AuthContext.Provider>
  );
};

export default App;
