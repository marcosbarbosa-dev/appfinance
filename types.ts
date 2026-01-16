
export type UserRole = 'admin' | 'user';

export interface User {
  uid: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  isFirstLogin: boolean;
  avatar?: string;
  suspensionDate?: string;
  updatedAt?: string;
  refreshId?: string; // Novo: ID para forçar refresh do navegador
}

export type TransactionType = 'income' | 'expense' | 'credit_card';

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
  accountId: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface BankAccount {
  id: string;
  userId?: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
  bankName: string;
}

export type LogAction = 'login' | 'logout' | 'create_user' | 'edit_user' | 'delete_user';

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: LogAction;
  timestamp: string;
  details?: string;
}
