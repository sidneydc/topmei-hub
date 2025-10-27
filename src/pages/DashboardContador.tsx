import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Meus Clientes</h2>
          {[
            { nome: 'João Silva', cnpj: '12.345.678/0001-90', regime: 'MEI', status: 'Ativo' },
            { nome: 'Maria Santos', cnpj: '98.765.432/0001-01', regime: 'SIMPLES', status: 'Ativo' },
            { nome: 'Pedro Oliveira', cnpj: '55.555.555/0001-55', regime: 'MEI', status: 'Pendente' },
          ].map((c, i) => (
            <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{c.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {c.cnpj} | Regime: {c.regime}
                  </p>
                </div>
                <Badge variant={c.status === 'Ativo' ? 'default' : 'secondary'}>
                  {c.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'aprovacoes' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Fila de Aprovações</h2>
          {[
            { cliente: 'João Silva', tipo: 'RG', status: 'pendente' },
            { cliente: 'Maria Santos', tipo: 'CPF', status: 'pendente' },
            { cliente: 'Pedro Oliveira', tipo: 'Comprovante Endereço', status: 'pendente' },
          ].map((a, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{a.cliente}</h3>
                  <p className="text-sm text-muted-foreground">Documento: {a.tipo}</p>
                </div>
                <Badge variant="secondary">Pendente</Badge>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Aprovar
                </Button>
                <Button variant="destructive" className="flex-1">
                  Rejeitar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'contratos' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Gestão de Contratos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Contratos Ativos" value="2" description="Clientes ativos" variant="success" />
            <StatCard title="Receita Mensal" value="R$ 108,16" description="Total de planos" variant="warning" />
            <StatCard title="Próximos Vencimentos" value="2" description="Próximos 7 dias" variant="destructive" />
          </div>
          <div className="space-y-4">
            {[
              { cliente: 'João Silva', plano: 'Super TOPMEI', valor: 49.91, vencimento: '15/02/2024' },
              { cliente: 'Maria Santos', plano: 'Mega TOPMEI', valor: 58.25, vencimento: '10/02/2024' },
            ].map((c, i) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{c.cliente}</h3>
                    <p className="text-sm text-muted-foreground">{c.plano}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">R$ {c.valor.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{c.vencimento}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Relatório Financeiro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Receita Janeiro" value="R$ 108,16" description="Total de contratos" variant="success" />
            <StatCard title="Inadimplência" value="R$ 0,00" description="Sem atrasos" variant="warning" />
            <StatCard title="Taxa Retenção" value="100%" description="Clientes ativos" variant="success" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
