import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, AppRole } from '@/types/database';

interface AuthContextType {
  user: UserSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há sessão salva
    const savedUser = localStorage.getItem('topmei_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Substituir por chamada real ao Supabase
    // Lógica mock baseada no email
    let role: AppRole = 'cliente';
    let nome = 'Usuário';
    
    if (email.includes('contador')) {
      role = 'contador';
      nome = 'Carlos Contador';
    } else if (email.includes('admin')) {
      role = 'admin';
      nome = 'Admin Sistema';
    } else if (email.includes('joao')) {
      nome = 'João Silva';
    }

    const mockUser: UserSession = {
      user_id: Math.random().toString(),
      email,
      nome,
      role,
      id_escritorio: role !== 'cliente' ? '1' : undefined,
      id_cadastro: role === 'cliente' ? '1' : undefined,
    };

    setUser(mockUser);
    localStorage.setItem('topmei_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('topmei_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
