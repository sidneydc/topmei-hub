import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

type TipoConta = 'cliente' | 'contador';

interface CadastroErrors {
  nome?: string;
  email?: string;
  senha?: string;
  senhaConfirm?: string;
}

export default function Cadastro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<CadastroErrors>({});

  const validateForm = (): boolean => {
    const newErrors: CadastroErrors = {};

    if (!nome) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (nome.trim().length < 3) {
      newErrors.nome = 'Mínimo 3 caracteres';
    }

    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!email.includes('@')) {
      newErrors.email = 'E-mail inválido';
    }

    if (!senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      newErrors.senha = 'Mínimo 6 caracteres';
    }

    if (!senhaConfirm) {
      newErrors.senhaConfirm = 'Confirmação de senha é obrigatória';
    } else if (senha !== senhaConfirm) {
      newErrors.senhaConfirm = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(email, senha, nome, 'cliente');
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para o login...",
        variant: "default"
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error?.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <p className="text-xs text-muted-foreground">Criar Conta</p>
          </div>
        </div>

        {/* Info: Apenas Cliente pode se cadastrar */}
        <div className="mb-6 p-4 bg-muted rounded-lg border border-muted-foreground/20">
          <p className="text-sm text-foreground">
            <span className="font-semibold">📋 Cadastro de Cliente</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Crie sua conta para acessar o painel da TopMEI. Gerentes/contadores serão cadastrados por administradores.
          </p>
        </div>


        {/* Formulário */}
        <form onSubmit={handleCadastro} className="space-y-4">
          {/* Campo Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-semibold text-foreground mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (errors.nome) setErrors({ ...errors, nome: undefined });
                }}
                placeholder="Seu nome completo"
                // ** CORREÇÃO AQUI **: O erro estava na forma de concatenar classes dinamicamente.
                className={`pl-12 ${errors.nome ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.nome && (
              <p className="text-xs text-destructive mt-1">{errors.nome}</p>
            )}
          </div>

          {/* Campo E-mail */}
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
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="seu@email.com"
                // ** CORREÇÃO AQUI **
                className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          {/* Campo Senha */}
          <div>
            <label htmlFor="senha" className="block text-sm font-semibold text-foreground mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (errors.senha) setErrors({ ...errors, senha: undefined });
                }}
                placeholder="Mínimo 6 caracteres"
                // ** CORREÇÃO AQUI **
                className={`pl-12 pr-12 ${errors.senha ? 'border-destructive' : ''}`}
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
            {errors.senha && (
              <p className="text-xs text-destructive mt-1">{errors.senha}</p>
            )}
          </div>

          {/* Campo Confirmar Senha */}
          <div>
            <label htmlFor="senhaConfirm" className="block text-sm font-semibold text-foreground mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="senhaConfirm"
                type={showPassword ? 'text' : 'password'}
                value={senhaConfirm}
                onChange={(e) => {
                  setSenhaConfirm(e.target.value);
                  if (errors.senhaConfirm) setErrors({ ...errors, senhaConfirm: undefined });
                }}
                placeholder="Confirme sua senha"
                // ** CORREÇÃO AQUI **
                className={`pl-12 pr-12 ${errors.senhaConfirm ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.senhaConfirm && (
              <p className="text-xs text-destructive mt-1">{errors.senhaConfirm}</p>
            )}
          </div>

          {/* Botão Criar Conta */}
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Criando conta...
              </span>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </form>

        {/* Link para Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}