import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";

// Páginas de Autenticação
import Login from "./pages/Login";
import Cadastro from "./pages/cadastro";
import RecuperarSenha from "./pages/recuperar-senha";

// Dashboards
import DashboardCliente from "./pages/DashboardCliente";
import DashboardContador from "./pages/DashboardContador";
import DashboardAdmin from "./pages/DashboardAdmin";

// Outras páginas
import NotFound from "./pages/NotFound";

// Protected Route Component
interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ element, allowedRoles }: ProtectedRouteProps) => {
  // TODO: Implementar lógica de verificação de roles com useAuth
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

            {/* Dashboards protegidos */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute element={<DashboardCliente />} allowedRoles={['cliente']} />} 
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