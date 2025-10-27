import React from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardLayout({ 
  children, 
  title, 
  tabs, 
  activeTab, 
  onTabChange 
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                2
              </span>
            </Button>
            <div className="text-right border-l pl-6">
              <p className="text-sm font-semibold text-foreground">{user?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'cliente' && 'Cliente MEI'}
                {user?.role === 'contador' && 'Contador'}
                {user?.role === 'admin' && 'Administrador'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {tabs && tabs.length > 0 && (
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`py-4 px-2 border-b-4 font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
