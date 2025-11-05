import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// Páginas de Autenticação
import Login from "./pages/Login";
import Cadastro from "./pages/cadastro";
import RecuperarSenha from "./pages/recuperar-senha";
import RedefinirSenha from "./pages/redefinir-senha";

// Dashboards
import DashboardCliente from "./pages/DashboardCliente/index";
import DashboardContador from "./pages/DashboardContador";
import DashboardAdmin from "./pages/DashboardAdmin";
import Dashboard from "./pages/Dashboard";

// Outras páginas
import NotFound from "./pages/NotFound";

// Protected Route Component
interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ element, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  // Enquanto carregando a sessão, não renderizamos nada (poderíamos mostrar um loader)
  if (isLoading) return null;

  // Se não há usuário autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se houver roles permitidas e o role do usuário não estiver na lista, redireciona
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{element}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota padrão */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Autenticação */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />

            {/* Dashboards protegidos */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute element={<Dashboard />} />} 
            />
            <Route 
              path="/dashboard/cliente" 
              element={<ProtectedRoute element={<DashboardCliente />} allowedRoles={['cliente']} />} 
            />
            <Route 
              path="/dashboard/contador" 
              element={<ProtectedRoute element={<DashboardContador />} allowedRoles={['contador']} />} 
            />
            <Route 
              path="/dashboard/admin" 
              element={<ProtectedRoute element={<DashboardAdmin />} allowedRoles={['admin']} />} 
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;