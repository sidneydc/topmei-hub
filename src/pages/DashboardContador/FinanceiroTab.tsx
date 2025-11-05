import React from 'react';
import { StatCard } from '@/components/ui/stat-card';

export default function FinanceiroTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Relatório Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Receita Janeiro" value="R$ 108,16" description="Total de contratos" variant="success" />
        <StatCard title="Inadimplência" value="R$ 0,00" description="Sem atrasos" variant="warning" />
        <StatCard title="Taxa Retenção" value="100%" description="Clientes ativos" variant="success" />
      </div>
    </div>
  );
}
