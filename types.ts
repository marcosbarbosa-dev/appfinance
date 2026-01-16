
export type UserRole = 'admin' | 'user';

export interface User {
  uid: string;
  username: string;
  password?: string; // Campo para persistência da senha
  name: string;
  role: UserRole;
  isActive: boolean;
  isFirstLogin: boolean;
  avatar?: string;
  suspensionDate?: string; // Data para suspensão automática (YYYY-MM-DD)
  updatedAt?: string; // Timestamp para controle de ordenação
}

export type TransactionType = 'income' | 'expense' | 'credit_card';

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO format
  category: string;
  accountId: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

export interface Category {
  id: string;
  // Added userId to support user-specific or global categories
  userId?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

// Fixed: Added optional userId property to allow linking bank accounts to specific users and resolve type errors during persistence
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
