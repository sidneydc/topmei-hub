import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: User) => {
    try {
      // Buscar role do usuário
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();

      const role = (userRole?.role as AppRole) || 'cliente';

      // Buscar dados adicionais baseado no role
      let userData: UserSession = {
        user_id: authUser.id,
        email: authUser.email!,
        nome: authUser.user_metadata?.nome || authUser.email!,
        role,
      };

      if (role === 'cliente') {
        const { data: cadastro } = await supabase
          .from('cadastros_clientes')
          .select('id_cadastro, razaoSocial')
          .eq('criado_por', authUser.email)
          .single();

        if (cadastro) {
          userData.id_cadastro = cadastro.id_cadastro;
          userData.nome = cadastro.razaoSocial;
        }
      } else if (role === 'contador' || role === 'admin') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id_profissional, nome_profissional, profissionais_escritorios(id_escritorio)')
          .eq('email_profissional', authUser.email)
          .single();

        if (profissional) {
          userData.nome = profissional.nome_profissional;
          const escritorios = profissional.profissionais_escritorios as any[];
          if (escritorios && escritorios.length > 0) {
            userData.id_escritorio = escritorios[0].id_escritorio;
          }
        }
      }

      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await loadUserData(data.user);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
