import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';
import DashboardCliente from './DashboardCliente';
import DashboardContador from './DashboardContador';
import DashboardAdmin from './DashboardAdmin';

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'cliente') {
    return <DashboardCliente />;
  }

  if (user.role === 'contador') {
    return <DashboardContador />;
  }

  if (user.role === 'admin') {
    return <DashboardAdmin />;
  }

  return <Navigate to="/login" replace />;
}
