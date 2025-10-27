// Cliente Supabase - Configurar quando conectar ao projeto Supabase
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock client para desenvolvimento
export const mockSupabaseClient = {
  auth: {
    signIn: async (email: string, password: string) => {
      // Simular login
      if (email.includes('contador')) {
        return { user: { id: '1', email }, role: 'contador' };
      } else if (email.includes('admin')) {
        return { user: { id: '2', email }, role: 'admin' };
      } else {
        return { user: { id: '3', email }, role: 'cliente' };
      }
    },
    signUp: async (email: string, password: string) => {
      return { user: { id: '4', email } };
    },
    signOut: async () => {
      return { error: null };
    }
  }
};
