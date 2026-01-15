
import React, { useState, createContext, useContext, useEffect } from 'react';
import { User, Category, Transaction, BankAccount, SystemLog } from './types';
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

const AdminDashboard = () => {
  const { setIsSidebarOpen } = useAuth();
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Administrativo</h2>
          <p className="text-slate-500">Métricas de uso e performance do sistema Personalle Infinity.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <i className="fas fa-users text-xl"></i>
          </div>
          <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest">Usuários Totais</h3>
          <p className="text-3xl font-black text-slate-800">24</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-4">
            <i className="fas fa-exchange-alt text-xl"></i>
          </div>
          <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest">Transações Hoje</h3>
          <p className="text-3xl font-black text-slate-800">142</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <i className="fas fa-server text-xl"></i>
          </div>
          <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest">Status do Servidor</h3>
          <p className="text-3xl font-black text-violet-500">ONLINE</p>
        </div>
      </div>
    </div>
  );
};

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  logs: SystemLog[];
  setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  updatePassword: (newPass: string) => Promise<void>;
  updateProfile: (name: string, avatar: string, password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const INITIAL_USERS: User[] = [
  { uid: '1', username: 'root', password: 'marcos', name: 'Administrador Marcos', role: 'admin', isActive: true, isFirstLogin: false, avatar: 'male_shadow' },
  { uid: '2', username: 'joaosilva', password: 'joaosilva', name: 'João Silva', role: 'user', isActive: true, isFirstLogin: true, avatar: 'male_shadow' },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Salário', type: 'income', icon: 'fa-money-bill-wave', color: '#8b5cf6' },
  { id: '2', name: 'Vendas', type: 'income', icon: 'fa-shopping-cart', color: '#a855f7' },
  { id: '3', name: 'Alimentação', type: 'expense', icon: 'fa-utensils', color: '#f43f5e' },
  { id: '4', name: 'Transporte', type: 'expense', icon: 'fa-bus', color: '#f59e0b' },
  { id: '5', name: 'Lazer', type: 'expense', icon: 'fa-gamepad', color: '#d946ef' },
];

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'acc1', name: 'Principal', type: 'checking', bankName: 'Nubank' },
  { id: 'card1', name: 'Visa Platinum', type: 'credit_card', bankName: 'Itaú' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', userId: '2', description: 'Salário Mensal', amount: 5000, type: 'income', date: new Date().toISOString().split('T')[0], category: 'Salário', accountId: 'acc1' },
  { id: '2', userId: '2', description: 'Almoço Restaurante', amount: 45.50, type: 'expense', date: new Date().toISOString().split('T')[0], category: 'Alimentação', accountId: 'acc1' },
  { id: '3', userId: '2', description: 'Uber Trabalho', amount: 25.00, type: 'expense', date: new Date().toISOString().split('T')[0], category: 'Transporte', accountId: 'card1' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeView, setActiveView] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setActiveView(user.role === 'admin' ? 'dashboard' : 'inicio');
    }
  }, [user]);

  const addLog = (userToLog: User, action: 'login' | 'logout') => {
    if (userToLog.role === 'admin') return;
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userToLog.uid,
      userName: userToLog.name,
      action,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const login = async (username: string, pass: string) => {
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 800));

    const foundUser = allUsers.find(u => u.username === username);

    if (!foundUser) {
      setError("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    // Verificar suspensão automática por data
    const today = new Date().toISOString().split('T')[0];
    const isSuspendedByDate = foundUser.suspensionDate && today >= foundUser.suspensionDate;

    if (!foundUser.isActive || isSuspendedByDate) {
      setError("Não foi possível fazer login no sistema. Entre em contato com o administrador.");
      setLoading(false);
      return;
    }

    if (foundUser.isFirstLogin) {
      if (pass !== foundUser.username) {
        setError("Para primeiro acesso, use a senha padrão.");
        setLoading(false);
        return;
      }
    } else {
      if (foundUser.password ? pass !== foundUser.password : pass !== foundUser.username) {
        setError("Senha incorreta. Entre em contato com administrador.");
        setLoading(false);
        return;
      }
    }

    setUser(foundUser);
    addLog(foundUser, 'login');
    setLoading(false);
  };

  const logout = () => {
    if (user) {
      addLog(user, 'logout');
    }
    setUser(null);
    setIsSidebarOpen(false);
  };

  const updatePassword = async (newPass: string) => {
    if (!user) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const updatedUsers = allUsers.map(u => 
      u.uid === user.uid ? { ...u, password: newPass, isFirstLogin: false } : u
    );
    setAllUsers(updatedUsers);
    setUser({ ...user, password: newPass, isFirstLogin: false });
    setLoading(false);
  };

  const updateProfile = async (name: string, avatar: string, password?: string) => {
    if (!user) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    
    const updatedUser = { 
      ...user, 
      name, 
      avatar, 
      password: password || user.password 
    };
    
    const updatedUsers = allUsers.map(u => u.uid === user.uid ? updatedUser : u);
    setAllUsers(updatedUsers);
    setUser(updatedUser);
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
      user, 
      allUsers, 
      setAllUsers, 
      categories,
      setCategories,
      transactions,
      setTransactions,
      bankAccounts,
      setBankAccounts,
      logs,
      setLogs,
      activeView, 
      setActiveView, 
      isSidebarOpen,
      setIsSidebarOpen,
      login, 
      logout, 
      updatePassword,
      updateProfile
    }}>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
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
            <main className="flex-1 overflow-y-auto bg-slate-50 relative">
              {renderContent()}
            </main>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
