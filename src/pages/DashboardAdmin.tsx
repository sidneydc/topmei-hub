import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'escritorios', label: 'Escritórios' },
    { id: 'profissionais', label: 'Profissionais' },
    { id: 'sistema', label: 'Sistema' },
  ];

  return (
    <DashboardLayout
      title="TopMEI - Administração"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Visão Geral do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Escritórios" value="15" description="Ativos no sistema" variant="success" />
            <StatCard title="Total Profissionais" value="48" description="Contadores ativos" variant="default" />
            <StatCard title="Total Clientes" value="324" description="MEIs cadastrados" variant="success" />
            <StatCard title="Receita Total" value="R$ 15.840" description="Mensal recorrente" variant="warning" />
          </div>
        </div>
      )}

      {activeTab === 'escritorios' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Gestão de Escritórios</h2>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
        </div>
      )}

      {activeTab === 'profissionais' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Gestão de Profissionais</h2>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
        </div>
      )}

      {activeTab === 'sistema' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
        </div>
      )}
    </DashboardLayout>
  );
}
