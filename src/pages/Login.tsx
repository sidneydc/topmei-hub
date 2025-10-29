import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!email.includes('@')) {
      newErrors.email = 'E-mail inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
        variant: "default"
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error?.message || "Verifique suas credenciais",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({ ...errors, email: undefined });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) setErrors({ ...errors, password: undefined });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">TopMEI</h1>
          <p className="text-muted-foreground mt-2">Gestão Contábil Simplificada</p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-6">
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
                onChange={handleEmailChange}
                placeholder="seu@email.com"
                // ** CORREÇÃO AQUI **
                className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Demo: joao@email.com | contador@escritorio.com
            </p>
          </div>

          {/* Campo de Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                // ** CORREÇÃO AQUI **
                className={`pl-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          {/* Botão de Login */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              'Acessar'
            )}
          </Button>
        </form>

        {/* Links para Cadastro e Recuperação */}
        <div className="mt-6 flex gap-2 text-sm">
          <Link
            to="/cadastro"
            className="flex-1 text-center px-4 py-2 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 font-semibold transition-colors"
          >
            Criar Conta
          </Link>
          <Link
            to="/recuperar-senha"
            className="flex-1 text-center px-4 py-2 rounded-lg border-2 border-muted-foreground text-muted-foreground hover:bg-muted font-semibold transition-colors"
          >
            Recuperar Senha
          </Link>
        </div>

        {/* Info de Credenciais */}
        <div className="mt-6 p-4 bg-muted rounded-lg border border-muted-foreground/20">
          <p className="text-xs font-semibold text-foreground mb-2">📧 Credenciais de teste:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>Cliente: <code className="bg-background px-1 py-0.5 rounded">joao@email.com</code></li>
            <li>Contador: <code className="bg-background px-1 py-0.5 rounded">contador@escritorio.com</code></li>
            <li>Senha: <code className="bg-background px-1 py-0.5 rounded">qualquer coisa com 6+</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}