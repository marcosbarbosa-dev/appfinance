import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { User, Category, Transaction, TransactionType, BankAccount, SystemLog, LogAction, Notice, Goal } from './types';
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
import TransfersManager from './components/TransfersManager';
import GoalsManager from './components/GoalsManager';
import NoticesManager from './components/NoticesManager';
import UserNoticeOverlay from './components/UserNoticeOverlay';
import ReportsView from './components/ReportsView';
import LogsPanel from './components/LogsPanel';
import UserProfile from './components/UserProfile';
import SupportManager from './components/SupportManager';
import ConnectivityModal from './components/ConnectivityModal';
import UserSupportView from './components/UserSupportView';
import ConfigManager from './components/ConfigManager';
import VersionView from './components/VersionView';

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
  goals: Goal[];
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  logs: SystemLog[];
  setLogs: (logs: SystemLog[]) => Promise<void>;
  notices: Notice[];
  saveNotice: (notice: Notice) => Promise<void>;
  deleteNotice: (id: string) => Promise<boolean>;
  acknowledgeNotice: (noticeId: string) => Promise<void>;
  acknowledgedNoticeIds: string[] | null;
  supportInfo: string;
  maintenanceMessage: string;
  versionLink: string;
  versionText: string;
  versionBtnColor: string;
  versionBtnLabel: string;
  updateAppConfig: (config: { supportInfo?: string, maintenanceMessage?: string, isLoggingEnabled?: boolean, isSystemLocked?: boolean, versionLink?: string, versionText?: string, versionBtnColor?: string, versionBtnLabel?: string }) => Promise<void>;
  loginTitle: string;
  setLoginTitle: (title: string) => Promise<void>;
  sidebarTitle: string;
  setSidebarTitle: (title: string) => Promise<void>;
  logoutTitle: string;
  setLogoutTitle: (title: string) => Promise<void>;
  logoutMessage: string;
  setLogoutMessageConfig: (msg: string) => Promise<void>;
  logoData: string | null;
  setLogoData: (data: string | null) => Promise<void>;
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
  viewMode: 'admin' | 'user';
  setViewMode: (mode: 'admin' | 'user') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  login: (username: string, pass: string) => Promise<void>;
  logout: (msg?: string) => void;
  updatePassword: (newPass: string) => Promise<void>;
  updateProfile: (name: string, avatar: string, password?: string) => Promise<void>;
  isOnline: boolean;
  checkInternet: () => boolean;
  transactionListTab: TransactionType;
  setTransactionListTab: (tab: TransactionType) => void;
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

const LogoutLoading: React.FC<{ title: string; message: string; logoData?: string | null }> = ({ title, message, logoData }) => (
  <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center animate-in fade-in duration-500">
    <div className="text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
        <div className="relative w-full h-full bg-violet-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40 overflow-hidden">
          {logoData ? (
            <img src={logoData} alt="Logo" className="w-full h-full object-contain p-4" />
          ) : (
            <LogoInfinity className="w-12 h-12" />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-slate-900 text-xl font-black tracking-tight">{title}</h2>
        <div className="flex items-center justify-center gap-3 px-8">
          <i className="fas fa-circle-notch animate-spin text-violet-600 text-sm"></i>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{message}</p>
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
  const lastUid = useRef<string | null>(user?.uid || null);
  const lastRefreshId = useRef<string | null>(user?.refreshId || null);
  const lastGlobalRefreshId = useRef<string | null>(null);

  const [allUsers, setAllUsersState] = useState<User[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccountsState] = useState<BankAccount[]>([]);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [logs, setLogsState] = useState<SystemLog[]>([]);
  const [notices, setNoticesState] = useState<Notice[]>([]);
  const [acknowledgedNoticeIds, setAcknowledgedNoticeIds] = useState<string[] | null>(null);
  const [supportInfo, setSupportInfoState] = useState("");
  const [maintenanceMessage, setMaintenanceMessageState] = useState("");
  const [versionLink, setVersionLinkState] = useState("");
  const [versionText, setVersionTextState] = useState("");
  const [versionBtnColor, setVersionBtnColorState] = useState("#8b5cf6");
  const [versionBtnLabel, setVersionBtnLabelState] = useState("Verificar Atualizações");
  const [loginTitle, setLoginTitleState] = useState("Personalle Infinity");
  const [sidebarTitle, setSidebarTitleState] = useState("Personalle");
  const [logoutTitle, setLogoutTitleState] = useState("Personalle");
  const [logoutMessageConfig, setLogoutMessageConfigState] = useState("Saindo com segurança...");
  const [logoData, setLogoDataState] = useState<string | null>(null);
  const [isLoggingEnabled, setIsLoggingEnabledState] = useState(true);
  const [isSystemLocked, setIsSystemLockedState] = useState(false);
  const [activeView, setActiveView] = useState('inicio');
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('user');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [transactionListTab, setTransactionListTab] = useState<TransactionType>('expense');

  useEffect(() => {
    userRef.current = user;
    if (user) {
      localStorage.setItem('personalle_user', JSON.stringify(user));
      if (lastUid.current !== user.uid) {
        setViewMode(user.role === 'admin' ? 'admin' : 'user');
        setActiveView(user.role === 'admin' ? 'dashboard' : 'inicio');
        lastUid.current = user.uid;
      }
    } else {
      localStorage.removeItem('personalle_user');
      setViewMode('user');
      lastUid.current = null;
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
    
    setCategoriesState([]);
    setTransactionsState([]);
    setBankAccountsState([]);
    setGoalsState([]);
    setAcknowledgedNoticeIds(null);
    setNoticesState([]);
    
    if (msg && typeof msg === 'string') setLogoutMessage(msg);
    else setLogoutMessage("");
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoggingOut(false);
    setLogoutMessage("");
    setActiveView('inicio');
    setViewMode('user');
    setError(null);
  }, []);

  const fetchGlobalConfig = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const { data: configData, error: configError } = await supabase.from('app_config').select('*').eq('id', 'main').maybeSingle();
      if (configData) {
        setSupportInfoState(configData.support_info || "");
        setMaintenanceMessageState(configData.maintenance_message || "");
        setVersionLinkState(configData.version_link || "");
        setVersionTextState(configData.version_text || "");
        setVersionBtnColorState(configData.version_btn_color || "#8b5cf6");
        setVersionBtnLabelState(configData.version_btn_label || "Verificar Atualizações");
        setIsLoggingEnabledState(configData.is_logging_enabled ?? true);
        setIsSystemLockedState(configData.is_system_locked ?? false);

        if (lastGlobalRefreshId.current === null) {
          lastGlobalRefreshId.current = configData.global_refresh_id;
        } else if (configData.global_refresh_id && lastGlobalRefreshId.current !== configData.global_refresh_id) {
          window.location.reload();
          return;
        }

        if (configData.is_system_locked && userRef.current && userRef.current.role !== 'admin') {
          logout("Sessão encerrada pelo administrador.");
          return;
        }
      }

      const { data: uiData } = await supabase.from('ui_config').select('*').eq('id', 'main').maybeSingle();
      if (uiData) {
        setLoginTitleState(uiData.loginTitle || "Personalle Infinity");
        setSidebarTitleState(uiData.sidebarTitle || "Personalle");
        setLogoutTitleState(uiData.logoutTitle || "Personalle");
        setLogoutMessageConfigState(uiData.logoutMessage || "Saindo com segurança...");
        setLogoDataState(uiData.logoData || null);
      }
    } catch (e: any) {
      console.error("Erro ao sincronizar configurações:", e?.message);
    }
  }, [logout]);

  const fetchUserData = useCallback(async (loggedInUser: User) => {
    if (!userRef.current || !navigator.onLine) return;
    try {
      const { data: currentUserStatus, error: fetchError } = await supabase.from('users').select('*').eq('uid', loggedInUser.uid).maybeSingle();
      
      if (fetchError) {
        if (!fetchError.message.toLowerCase().includes('fetch')) {
          console.error("Erro ao validar usuário:", fetchError.message);
        }
        return;
      }

      if (!currentUserStatus && userRef.current) {
        logout();
        return;
      }

      if (currentUserStatus && userRef.current) {
        if (currentUserStatus.refreshId && lastRefreshId.current && currentUserStatus.refreshId !== lastRefreshId.current) {
          window.location.reload();
          return;
        }
        lastRefreshId.current = currentUserStatus.refreshId || null;
        const today = new Date().toISOString().split('T')[0];
        if (!currentUserStatus.isActive || (currentUserStatus.suspensionDate && today > currentUserStatus.suspensionDate)) {
          logout("Sua conta foi suspensa.");
          return;
        }
        setUser(currentUserStatus);
      }

      const { data: noticesData } = await supabase.from('notices').select('*').order('createdAt', { ascending: false });
      if (noticesData) setNoticesState(noticesData);

      const { data: ackData } = await supabase.from('notice_acknowledgments').select('noticeId').eq('userId', loggedInUser.uid);
      if (ackData) setAcknowledgedNoticeIds(ackData.map(a => a.noticeId));

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
        if (accsData) {
          setBankAccountsState(accsData);
        }
        
        const { data: goalsData } = await supabase.from('goals').select('*').eq('userId', loggedInUser.uid);
        if (goalsData) setGoalsState(goalsData);
      }
    } catch (e: any) {
      if (e?.name !== 'TypeError') {
        console.error("Erro ao sincronizar dados do usuário:", e?.message || e);
      }
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
      const { data, error: loginError } = await supabase.from('users').select('*').eq('username', username).eq('password', pass).maybeSingle();
      if (loginError || !data) {
        setError("Usuário ou senha incorretos.");
        setLoading(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      if (!data.isActive || (data.suspensionDate && today > data.suspensionDate)) {
        setError("Acesso suspenso.");
        setLoading(false);
        return;
      }
      if (isSystemLocked && data.role !== 'admin') {
        setError(maintenanceMessage || "Manutenção.");
        setLoading(false);
        return;
      }
      setUser(data);
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
    if (!user) return;
    const catsWithUser = cats.map(c => ({ ...c, userId: c.userId || user.uid }));
    await supabase.from('categories').upsert(catsWithUser);
    setCategoriesState(prev => {
      const newState = [...prev];
      catsWithUser.forEach(newCat => {
        const idx = newState.findIndex(c => c.id === newCat.id);
        if (idx >= 0) newState[idx] = newCat;
        else newState.push(newCat);
      });
      return newState;
    });
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

    setBankAccountsState(prev => {
      const exists = prev.find(a => a.id === acc.id);
      let newState;
      if (exists) newState = prev.map(a => a.id === acc.id ? accWithUser : a);
      else newState = [...prev, accWithUser];

      if (accWithUser.isDefault) {
        return newState.map(a => a.id === accWithUser.id ? a : { ...a, isDefault: false });
      }
      return newState;
    });

    try {
      const { error } = await supabase.from('bank_accounts').upsert(accWithUser);
      if (error) console.error("Erro ao salvar conta no Supabase:", error.message);
    } catch (err) {
      console.error("Exceção ao persistir conta:", err);
    }
  };

  const saveBankAccountsBatch = async (accs: BankAccount[]) => {
    if (!user) return;
    const accsWithUser = accs.map(a => ({ ...a, userId: a.userId || user.uid }));
    
    setBankAccountsState(prev => {
      const newState = [...prev];
      accsWithUser.forEach(newAcc => {
        const idx = newState.findIndex(a => a.id === newAcc.id);
        if (idx >= 0) newState[idx] = newAcc;
        else newState.push(newAcc);
      });

      const defaultAcc = accsWithUser.find(a => a.isDefault);
      if (defaultAcc) {
        return newState.map(a => a.id === defaultAcc.id ? a : { ...a, isDefault: false });
      }
      return newState;
    });

    try {
      await supabase.from('bank_accounts').upsert(accsWithUser);
    } catch (err) {
      console.error("Erro ao persistir lote de contas no Supabase:", err);
    }
  };

  const deleteBankAccount = async (id: string) => {
    setBankAccountsState(prev => prev.filter(a => a.id !== id));
    try {
      await supabase.from('bank_accounts').delete().eq('id', id);
    } catch (err) {
      console.error("Erro ao deletar conta no Supabase:", err);
    }
  };

  const saveGoal = async (goal: Goal) => {
    if (!user) return;
    
    setGoalsState(prev => {
      const exists = prev.find(g => g.id === goal.id);
      if (exists) return prev.map(g => g.id === goal.id ? goal : g);
      return [goal, ...prev];
    });

    try {
      const { error } = await supabase.from('goals').upsert(goal);
      if (error) {
        console.error("Erro ao salvar meta no banco:", error.message);
      }
    } catch (e) {
      console.error("Exceção ao persistir meta:", e);
    }
  };

  const deleteGoal = async (id: string) => {
    setGoalsState(prev => prev.filter(g => g.id !== id));
    
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        console.error("Erro ao deletar meta no banco:", error.message);
      }
    } catch (e) {
      console.error("Exceção ao deletar meta:", e);
    }
  };

  const saveNotice = useCallback(async (notice: Notice) => {
    await supabase.from('notices').upsert(notice);
    setNoticesState(prev => {
      const exists = prev.find(n => n.id === notice.id);
      if (exists) return prev.map(n => n.id === notice.id ? notice : n);
      return [notice, ...prev];
    });
  }, []);

  const deleteNotice = useCallback(async (id: string): Promise<boolean> => {
    try {
      await supabase.from('notice_acknowledgments').delete().eq('noticeId', id);
      const { error: dbError } = await supabase.from('notices').delete().eq('id', id);
      if (dbError) throw dbError;
      
      setNoticesState(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (error) {
      console.error("Erro crítico ao deletar aviso:", error);
      return false;
    }
  }, []);

  const acknowledgeNotice = useCallback(async (noticeId: string) => {
    if (!user) return;
    await supabase.from('notice_acknowledgments').insert({ userId: user.uid, noticeId });
    setAcknowledgedNoticeIds(prev => [...(prev || []), noticeId]);
  }, [user]);

  const setLogs = async (newLogs: SystemLog[]) => setLogsState(newLogs);
  const deleteLog = async (id: string) => {
    await supabase.from('logs').delete().eq('id', id);
    setLogsState(prev => prev.filter(l => l.id !== id));
  };
  const clearLogs = async () => {
    await supabase.from('logs').delete().gt('timestamp', '1970-01-01T00:00:00Z');
    setLogsState([]);
  };

  const updateAppConfig = async (config: { supportInfo?: string, maintenanceMessage?: string, isLoggingEnabled?: boolean, isSystemLocked?: boolean, versionLink?: string, versionText?: string, versionBtnColor?: string, versionBtnLabel?: string }) => {
    const dbPayload: any = { id: 'main' };
    if (config.supportInfo !== undefined) dbPayload.support_info = config.supportInfo;
    if (config.maintenanceMessage !== undefined) dbPayload.maintenance_message = config.maintenanceMessage;
    if (config.isLoggingEnabled !== undefined) dbPayload.is_logging_enabled = config.isLoggingEnabled;
    if (config.isSystemLocked !== undefined) dbPayload.is_system_locked = config.isSystemLocked;
    if (config.versionLink !== undefined) dbPayload.version_link = config.versionLink;
    if (config.versionText !== undefined) dbPayload.version_text = config.versionText;
    if (config.versionBtnColor !== undefined) dbPayload.version_btn_color = config.versionBtnColor;
    if (config.versionBtnLabel !== undefined) dbPayload.version_btn_label = config.versionBtnLabel;

    const { error } = await supabase.from('app_config').upsert(dbPayload);
    if (error) throw error;

    if (config.supportInfo !== undefined) setSupportInfoState(config.supportInfo);
    if (config.maintenanceMessage !== undefined) setMaintenanceMessageState(config.maintenanceMessage);
    if (config.isLoggingEnabled !== undefined) setIsLoggingEnabledState(config.isLoggingEnabled);
    if (config.isSystemLocked !== undefined) setIsSystemLockedState(config.isSystemLocked);
    if (config.versionLink !== undefined) setVersionLinkState(config.versionLink);
    if (config.versionText !== undefined) setVersionTextState(config.versionText);
    if (config.versionBtnColor !== undefined) setVersionBtnColorState(config.versionBtnColor);
    if (config.versionBtnLabel !== undefined) setVersionBtnLabelState(config.versionBtnLabel);
  };

  const setLoginTitle = async (title: string) => {
    const { error } = await supabase.from('ui_config').upsert({ id: 'main', loginTitle: title });
    if (error) throw error;
    setLoginTitleState(title);
  };
  const setSidebarTitle = async (title: string) => {
    const { error } = await supabase.from('ui_config').upsert({ id: 'main', sidebarTitle: title });
    if (error) throw error;
    setSidebarTitleState(title);
  };
  const setLogoutTitle = async (title: string) => {
    const { error } = await supabase.from('ui_config').upsert({ id: 'main', logoutTitle: title });
    if (error) throw error;
    setLogoutTitleState(title);
  };
  const setLogoutMessageConfig = async (msg: string) => {
    const { error } = await supabase.from('ui_config').upsert({ id: 'main', logoutMessage: msg });
    if (error) throw error;
    setLogoutMessageConfigState(msg);
  };
  const setLogoData = async (data: string | null) => {
    const { error } = await supabase.from('ui_config').upsert({ id: 'main', logoData: data });
    if (error) throw error;
    setLogoDataState(data);
  };
  const setIsLoggingEnabled = async (enabled: boolean) => {
    const { error } = await supabase.from('app_config').upsert({ id: 'main', is_logging_enabled: enabled });
    if (error) throw error;
    setIsLoggingEnabledState(enabled);
  };
  const setIsSystemLocked = async (locked: boolean) => {
    const { error } = await supabase.from('app_config').upsert({ id: 'main', is_system_locked: locked });
    if (error) throw error;
    setIsSystemLockedState(locked);
  };
  const triggerGlobalRefresh = async () => {
    const newRid = crypto.randomUUID();
    const { error } = await supabase.from('app_config').upsert({ id: 'main', global_refresh_id: newRid });
    if (error) throw error;
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
      case 'transferencias': return <TransfersManager />;
      case 'metas': return <GoalsManager />;
      case 'avisos': return <NoticesManager />;
      case 'config': return <ConfigManager />;
      case 'adicionar_transacao': return <AddTransaction />;
      case 'meus_dados': return <UserProfile />;
      case 'suporte_usuario': return <UserSupportView />;
      case 'versao': return <VersionView />;
      case 'logs': return <LogsPanel />;
      case 'suporte': return <SupportManager />;
      default: return viewMode === 'admin' ? <AdminDashboard /> : <UserHome />;
    }
  };

  if (isLoggingOut) return <LogoutLoading title={logoutTitle} message={logoutMessage || logoutMessageConfig} logoData={logoData} />;

  return (
    <AuthContext.Provider value={{ 
      user, allUsers, setAllUsers, saveUser, deleteUserFromDb,
      categories, saveCategory, saveCategoriesBatch, deleteCategory,
      transactions, saveTransaction, saveTransactions, deleteTransactionFromDb,
      bankAccounts, saveBankAccount, saveBankAccountsBatch, deleteBankAccount,
      goals, saveGoal, deleteGoal,
      logs, setLogs, notices, saveNotice, deleteNotice, acknowledgeNotice, acknowledgedNoticeIds,
      supportInfo, maintenanceMessage, versionLink, versionText, versionBtnColor, versionBtnLabel, updateAppConfig,
      loginTitle, setLoginTitle, sidebarTitle, setSidebarTitle, 
      logoutTitle, setLogoutTitle, logoutMessage: logoutMessageConfig, setLogoutMessageConfig,
      logoData, setLogoData,
      isLoggingEnabled, setIsLoggingEnabled, isSystemLocked, setIsSystemLocked,
      triggerGlobalRefresh,
      addLog, deleteLog, clearLogs, activeView, setActiveView, viewMode, setViewMode, isSidebarOpen, setIsSidebarOpen,
      login, logout, updatePassword, updateProfile, isOnline, checkInternet,
      transactionListTab, setTransactionListTab
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
          <UserNoticeOverlay />
          <ConnectivityModal show={showOfflineAlert} onClose={() => setShowOfflineAlert(false)} />
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default App;