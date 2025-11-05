import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import ClientesTab from './ClientesTab';
import AprovacoesTab from './AprovacoesTab';
import ContratosTab from './ContratosTab';
import FinanceiroTab from './FinanceiroTab';

export default function DashboardContador() {
  const [activeTab, setActiveTab] = useState('clientes');

  const tabs = [
    { id: 'clientes', label: 'Meus Clientes' },
    { id: 'aprovacoes', label: 'Aprovações' },
    { id: 'contratos', label: 'Contratos' },
    { id: 'financeiro', label: 'Financeiro' },
  ];

  return (
    <DashboardLayout
      title="TopMEI - Profissional"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'clientes' && <ClientesTab />}
      {activeTab === 'aprovacoes' && <AprovacoesTab />}
      {activeTab === 'contratos' && <ContratosTab />}
      {activeTab === 'financeiro' && <FinanceiroTab />}
    </DashboardLayout>
  );
}
