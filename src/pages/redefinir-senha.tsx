import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    // Ao chegar nesta página via link de recuperação do Supabase, o token/ sessão
    // pode estar presente na URL. Devemos extrair a sessão da URL antes de
    // tentar obter a sessão local. O método getSessionFromUrl() trata disso.
    const checkRecoverySession = async () => {
      try {
        // Tenta extrair e aplicar a sessão presente na URL (hash ou query)
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (error) {
          // Se houver erro ou não vier sessão, considerar link inválido
          console.warn('getSessionFromUrl error:', error);
          toast({
            title: "Link inválido ou expirado",
            description: "Por favor, solicite um novo link de recuperação",
            variant: "destructive"
          });
          setTimeout(() => navigate('/recuperar-senha'), 2000);
          return;
        }

        const session = data?.session ?? null;
        if (session) {
          setTokenValido(true);
        } else {
          // Caso não exista sessão após parse, informar e redirecionar
          toast({
            title: "Link inválido ou expirado",
            description: "Por favor, solicite um novo link de recuperação",
            variant: "destructive"
          });
          setTimeout(() => navigate('/recuperar-senha'), 2000);
        }
      } catch (err) {
        console.error('Erro ao validar token de recuperação:', err);
        toast({
          title: "Link inválido ou expirado",
          description: "Por favor, solicite um novo link de recuperação",
          variant: "destructive"
        });
        setTimeout(() => navigate('/recuperar-senha'), 2000);
      }
    };

    checkRecoverySession();
  }, [navigate, toast]);

  const validatePassword = (): boolean => {
    if (!novaSenha) {
      setError('Nova senha é obrigatória');
      return false;
    }
    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        throw error;
      }

      setSucesso(true);
      toast({
        title: "Senha redefinida com sucesso!",
        description: "Você já pode fazer login com sua nova senha",
        variant: "default"
      });

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(error?.message || 'Erro ao redefinir senha');
      toast({
        title: "Erro",
        description: error?.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <p className="text-muted-foreground">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Senha Redefinida!
          </h2>
          <p className="text-muted-foreground mb-6">
            Sua senha foi atualizada com sucesso.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">TopMEI</h1>
          <p className="text-xs text-muted-foreground">Redefinir Senha</p>
        </div>

        {/* Instruções */}
        <div className="mb-6 p-4 bg-muted rounded-lg border border-muted-foreground/20">
          <p className="text-sm text-foreground">
            Crie uma nova senha segura para sua conta.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleRedefinirSenha} className="space-y-6">
          {/* Nova Senha */}
          <div>
            <label htmlFor="novaSenha" className="block text-sm font-semibold text-foreground mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="novaSenha"
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Mínimo 6 caracteres"
                className="pl-12 pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-semibold text-foreground mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmarSenha"
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Digite a senha novamente"
                className="pl-12 pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarConfirmar ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>

          {/* Botão Redefinir */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Redefinindo...
              </span>
            ) : (
              'Redefinir Senha'
            )}
          </Button>
        </form>

        {/* Link para Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
}
