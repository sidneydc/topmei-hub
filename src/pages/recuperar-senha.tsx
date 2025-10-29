import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth() as any;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!email.includes('@')) {
      setError('E-mail inválido');
      return false;
    }
    return true;
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);

      setSucesso(true);
      toast({
        title: "E-mail enviado com sucesso!",
        description: "Verifique sua caixa de entrada",
        variant: "default"
      });

      // Redireciona após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error?.message || 'Erro ao enviar e-mail de recuperação');
      toast({
        title: "Erro",
        description: error?.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            E-mail Enviado!
          </h2>
          <p className="text-muted-foreground mb-6">
            Enviamos um link de recuperação de senha para <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Verifique sua caixa de entrada (e também a pasta de spam) nos próximos minutos.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Voltar ao Login
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSucesso(false);
                setEmail('');
              }}
              className="w-full"
            >
              Tentar Outro E-mail
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Botão Voltar + Cabeçalho */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/login')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">TopMEI</h1>
            <p className="text-xs text-muted-foreground">Recuperar Senha</p>
          </div>
        </div>

        {/* Instruções */}
        <div className="mb-6 p-4 bg-muted rounded-lg border border-muted-foreground/20">
          <p className="text-sm text-foreground">
            Insira o e-mail associado à sua conta e enviaremos um link para resetar sua senha.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleRecuperarSenha} className="space-y-6">
          {/* Campo de E-mail */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="seu@email.com"
                className={`pl-12 ${error ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>

          {/* Botão Enviar */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              'Enviar Link de Recuperação'
            )}
          </Button>
        </form>

        {/* Links Alternativos */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Lembrou sua senha?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Faça login
            </button>
          </p>
          <p className="text-sm text-muted-foreground">
            Não tem conta?{' '}
            <button
              onClick={() => navigate('/cadastro')}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Crie uma agora
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}