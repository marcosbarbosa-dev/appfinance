
import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { User, Category, Transaction, BankAccount, SystemLog, LogAction } from './types';
import { supabase } from './supabase';
import LoginForm from './components/LoginForm';
import UserHome from './components/UserHome';
import AdminDashboard from './components/AdminDashboard';
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
  triggerGlobalRefresh: () => Promise<void>;
  addLog: (userToLog: User, action: LogAction, details?: string) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  login: (username: string, pass: string) => Promise<void>;
  logout: (msg?: string) => void;
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

const LogoutLoading: React.FC<{ message?: string }> = ({ message = "Processando..." }) => (
  <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-500">
    <div className="text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
        <div className="relative w-full h-full bg-violet-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40">
          <LogoInfinity className="w-12 h-12" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-white text-xl font-black tracking-tight">Personalle Infinity</h2>
        <div className="flex items-center justify-center gap-3 px-8">
          <i className="fas fa-circle-notch animate-spin text-violet-400 text-sm"></i>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">{message || "Saindo com segurança..."}</p>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('personalle_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const userRef = useRef<User | null>(user);
  const lastRefreshId = useRef<string | null>(user?.refreshId || null);
  const lastGlobalRefreshId = useRef<string | null>(null);

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
  const [logoutMessage, setLogoutMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    userRef.current = user;
    if (user) {
      localStorage.setItem('personalle_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('personalle_user');
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkInternet = useCallback(() => {
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async (msg?: any) => {
    setIsSidebarOpen(false);
    localStorage.removeItem('personalle_user');
    userRef.current = null;
    setUser(null);
    if (msg && typeof msg === 'string') setLogoutMessage(msg);
    else setLogoutMessage("");
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoggingOut(false);
    setLogoutMessage("");
    setActiveView('inicio');
    setError(null);
  }, []);

  const fetchGlobalConfig = useCallback(async () => {
    try {
      const { data: configData } = await supabase.from('system_config').select('*').single();
      if (configData) {
        setSupportInfoState(configData.supportInfo || "");
        setMaintenanceMessageState(configData.maintenanceMessage || "");
        setIsLoggingEnabledState(configData.isLoggingEnabled ?? true);
        setIsSystemLockedState(configData.isSystemLocked ?? false);

        if (lastGlobalRefreshId.current === null) {
          lastGlobalRefreshId.current = configData.globalRefreshId;
        } else if (configData.globalRefreshId && lastGlobalRefreshId.current !== configData.globalRefreshId) {
          window.location.reload();
          return;
        }

        if (configData.isSystemLocked && userRef.current && userRef.current.role !== 'admin') {
          logout("Sessão encerrada pelo administrador.");
          return;
        }
      }
    } catch (e) {
      console.error("Erro config:", e);
    }
  }, [logout]);

  const fetchUserData = useCallback(async (loggedInUser: User) => {
    if (!userRef.current) return;
    try {
      const { data: currentUserStatus } = await supabase.from('users').select('*').eq('uid', loggedInUser.uid).single();
      if (currentUserStatus && userRef.current) {
        if (currentUserStatus.refreshId && lastRefreshId.current && currentUserStatus.refreshId !== lastRefreshId.current) {
          window.location.reload();
          return;
        }
        lastRefreshId.current = currentUserStatus.refreshId || null;

        const today = new Date().toISOString().split('T')[0];
        const isSuspendedByDate = currentUserStatus.suspensionDate && today >= currentUserStatus.suspensionDate;
        if (!currentUserStatus.isActive || isSuspendedByDate) {
          logout("Sua conta foi suspensa.");
          return;
        }
        setUser(currentUserStatus);
      } else if (!currentUserStatus && userRef.current) {
        logout();
        return;
      }

      if (loggedInUser.role === 'admin' && userRef.current) {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setAllUsersState(usersData);
        const { data: logsData } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(500);
        if (logsData) setLogsState(logsData);
      }

      if (userRef.current) {
        const { data: catsData } = await supabase.from('categories').select('*').or(`userId.eq.${loggedInUser.uid},userId.is.null`);
        if (catsData) setCategoriesState(catsData);
        const { data: transData } = await supabase.from('transactions').select('*').eq('userId', loggedInUser.uid);
        if (transData) setTransactionsState(transData);
        const { data: accsData } = await supabase.from('bank_accounts').select('*').eq('userId', loggedInUser.uid);
        if (accsData) setBankAccountsState(accsData);
      }
    } catch (e) {
      console.error("Erro userData:", e);
    }
  }, [logout]);

  useEffect(() => {
    fetchGlobalConfig();
    const interval = setInterval(fetchGlobalConfig, 10000);
    return () => clearInterval(interval);
  }, [fetchGlobalConfig]);

  useEffect(() => {
    let interval: any;
    if (user) {
      fetchUserData(user);
      interval = setInterval(() => {
        if (userRef.current) fetchUserData(userRef.current);
      }, 10000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [user, fetchUserData]);

  const addLog = useCallback(async (userToLog: User, action: LogAction, details?: string) => {
    if (!isLoggingEnabled) return;
    const adminActions: LogAction[] = ['create_user', 'edit_user', 'delete_user'];
    if (!adminActions.includes(action)) return;
    const newLog: SystemLog = {
      id: crypto.randomUUID(),
      userId: userToLog.uid,
      userName: userToLog.name,
      action,
      timestamp: new Date().toISOString(),
      details
    };
    setLogsState(prev => [newLog, ...prev]);
    await supabase.from('logs').insert(newLog);
  }, [isLoggingEnabled]);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: loginError } = await supabase.from('users').select('*').eq('username', username).eq('password', pass).single();
      if (loginError || !data) {
        setError("Usuário ou senha incorretos.");
        setLoading(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const isSuspendedByDate = data.suspensionDate && today >= data.suspensionDate;
      if (!data.isActive || isSuspendedByDate) {
        setError("Acesso suspenso. Contate o suporte.");
        setLoading(false);
        return;
      }
      if (isSystemLocked && data.role !== 'admin') {
        setError(maintenanceMessage || "Sistema em manutenção.");
        setLoading(false);
        return;
      }
      setUser(data);
      setActiveView(data.role === 'admin' ? 'dashboard' : 'inicio');
    } catch (e) {
      setError("Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPass: string) => {
    if (!user) return;
    await supabase.from('users').update({ password: newPass, isFirstLogin: false }).eq('uid', user.uid);
    setUser({ ...user, password: newPass, isFirstLogin: false });
  };

  const updateProfile = async (name: string, avatar: string, password?: string) => {
    if (!user) return;
    const updates: any = { name, avatar };
    if (password) updates.password = password;
    await supabase.from('users').update(updates).eq('uid', user.uid);
    setUser({ ...user, ...updates });
  };

  const setAllUsers = async (users: User[]) => {
    setAllUsersState(users);
    for (const u of users) await supabase.from('users').upsert(u);
  };

  const saveUser = async (userData: User) => {
    await supabase.from('users').upsert(userData);
    setAllUsersState(prev => {
      const exists = prev.find(u => u.uid === userData.uid);
      if (exists) return prev.map(u => u.uid === userData.uid ? userData : u);
      return [...prev, userData];
    });
  };

  const deleteUserFromDb = async (uid: string) => {
    await supabase.from('users').delete().eq('uid', uid);
    setAllUsersState(prev => prev.filter(u => u.uid !== uid));
  };

  const saveCategory = async (cat: Category) => {
    if (!user) return;
    const catToSave = { ...cat, userId: user.uid };
    await supabase.from('categories').upsert(catToSave);
    setCategoriesState(prev => {
      const exists = prev.find(c => c.id === cat.id);
      if (exists) return prev.map(c => c.id === cat.id ? catToSave : c);
      return [...prev, catToSave];
    });
  };

  const saveCategoriesBatch = async (cats: Category[]) => {
    await supabase.from('categories').upsert(cats);
    setCategoriesState(prev => [...prev, ...cats]);
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategoriesState(prev => prev.filter(c => c.id !== id));
  };

  const saveTransaction = async (t: Transaction) => {
    await supabase.from('transactions').upsert(t);
    setTransactionsState(prev => {
      const exists = prev.find(tr => tr.id === t.id);
      if (exists) return prev.map(tr => tr.id === t.id ? t : tr);
      return [t, ...prev];
    });
  };

  const saveTransactions = async (ts: Transaction[]) => {
    await supabase.from('transactions').upsert(ts);
    setTransactionsState(prev => [...ts, ...prev]);
  };

  const deleteTransactionFromDb = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactionsState(prev => prev.filter(t => t.id !== id));
  };

  const saveBankAccount = async (acc: BankAccount) => {
    if (!user) return;
    const accWithUser = { ...acc, userId: user.uid };
    await supabase.from('bank_accounts').upsert(accWithUser);
    setBankAccountsState(prev => {
      const exists = prev.find(a => a.id === acc.id);
      if (exists) return prev.map(a => a.id === acc.id ? accWithUser : a);
      return [...prev, accWithUser];
    });
  };

  const saveBankAccountsBatch = async (accs: BankAccount[]) => {
    await supabase.from('bank_accounts').upsert(accs);
    setBankAccountsState(prev => [...prev, ...accs]);
  };

  const deleteBankAccount = async (id: string) => {
    await supabase.from('bank_accounts').delete().eq('id', id);
    setBankAccountsState(prev => prev.filter(a => a.id !== id));
  };

  const setLogs = async (newLogs: SystemLog[]) => setLogsState(newLogs);
  const deleteLog = async (id: string) => {
    await supabase.from('logs').delete().eq('id', id);
    setLogsState(prev => prev.filter(l => l.id !== id));
  };
  const clearLogs = async () => {
    await supabase.from('logs').delete().gt('timestamp', '1970-01-01T00:00:00Z');
    setLogsState([]);
  };

  const setSupportInfo = async (info: string) => {
    setSupportInfoState(info);
    await supabase.from('system_config').upsert({ id: 'main', supportInfo: info });
  };
  const setMaintenanceMessage = async (msg: string) => {
    setMaintenanceMessageState(msg);
    await supabase.from('system_config').upsert({ id: 'main', maintenanceMessage: msg });
  };
  const setIsLoggingEnabled = async (enabled: boolean) => {
    setIsLoggingEnabledState(enabled);
    await supabase.from('system_config').upsert({ id: 'main', isLoggingEnabled: enabled });
  };
  const setIsSystemLocked = async (locked: boolean) => {
    setIsSystemLockedState(locked);
    await supabase.from('system_config').upsert({ id: 'main', isSystemLocked: locked });
  };
  const triggerGlobalRefresh = async () => {
    const newRid = crypto.randomUUID();
    await supabase.from('system_config').upsert({ id: 'main', globalRefreshId: newRid });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'inicio': return <UserHome />;
      case 'dashboard': return <AdminDashboard />;
      case 'usuarios': return <AdminPanel />;
      case 'relatorio': return <ReportsView />;
      case 'contas': return <AccountsManager />;
      case 'categorias': return <CategoriesManager />;
      case 'lancamentos': return <TransactionsList />;
      case 'adicionar_transacao': return <AddTransaction />;
      case 'meus_dados': return <UserProfile />;
      case 'logs': return <LogsPanel />;
      case 'suporte': return <SupportManager />;
      default: return user?.role === 'admin' ? <AdminDashboard /> : <UserHome />;
    }
  };

  if (isLoggingOut) return <LogoutLoading message={logoutMessage} />;

  return (
    <AuthContext.Provider value={{ 
      user, allUsers, setAllUsers, saveUser, deleteUserFromDb,
      categories, saveCategory, saveCategoriesBatch, deleteCategory,
      transactions, saveTransaction, saveTransactions, deleteTransactionFromDb,
      bankAccounts, saveBankAccount, saveBankAccountsBatch, deleteBankAccount,
      logs, setLogs, supportInfo, setSupportInfo, maintenanceMessage, setMaintenanceMessage,
      isLoggingEnabled, setIsLoggingEnabled, isSystemLocked, setIsSystemLocked,
      triggerGlobalRefresh,
      addLog, deleteLog, clearLogs, activeView, setActiveView, isSidebarOpen, setIsSidebarOpen,
      login, logout, updatePassword, updateProfile, isOnline, checkInternet
    }}>
      {!user ? (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <LoginForm error={error} loading={loading} />
          <ConnectivityModal show={showOfflineAlert} onClose={() => setShowOfflineAlert(false)} />
        </div>
      ) : user.isFirstLogin ? (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <FirstLoginFlow />
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
          <Sidebar />
          <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64 opacity-50 pointer-events-none md:opacity-100 md:pointer-events-auto' : ''}`}>
            {renderActiveView()}
          </main>
          <ConnectivityModal show={showOfflineAlert} onClose={() => setShowOfflineAlert(false)} />
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default App;
