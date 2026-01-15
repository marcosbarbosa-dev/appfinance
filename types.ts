
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
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  bankName: string;
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout';
  timestamp: string;
}
