import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardCliente() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'cadastro', label: 'Meu Cadastro' },
  ];

  return (
    <DashboardLayout 
      title="TopMEI - Cliente"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Status Cadastro"
            value="Ativo"
            description="Aprovado em 15/01"
            variant="success"
          />
          <StatCard
            title="Plano"
            value="Super TOPMEI"
            description="R$ 49,91/mês"
            variant="warning"
          />
          <StatCard
            title="Documentos"
            value="1"
            description="Pendente: RG"
            variant="destructive"
          />
        </div>
      )}

      {activeTab === 'servicos' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Meus Serviços</h2>
          <Card className="p-6 border-l-4 border-primary">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Super TOPMEI</h3>
                <Badge variant="default" className="mt-2">Ativo</Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">R$ 49,91</p>
                <p className="text-xs text-muted-foreground">Próx: 15/02/2024</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'documentos' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Meus Documentos</h2>
          <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              1 de 5 documentos obrigatórios aprovados
            </p>
          </Card>
          <div className="grid grid-cols-1 gap-4">
            {[
              { desc: 'CPF do Proprietário', status: 'aprovado' },
              { desc: 'RG do Proprietário', status: 'rejeitado' },
              { desc: 'Comprovante de Endereço', status: null },
            ].map((doc, i) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold">{doc.desc}</h3>
                  {doc.status === 'aprovado' && (
                    <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprovado
                    </Badge>
                  )}
                  {doc.status === 'rejeitado' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejeitado
                    </Badge>
                  )}
                </div>
                {(!doc.status || doc.status === 'rejeitado') && (
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    {doc.status === 'rejeitado' ? 'Reenviar' : 'Enviar'} Documento
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cadastro' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Meu Cadastro</h2>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-bold">12.345.678/0001-90</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="font-bold">ABC Comércio LTDA</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p className="font-bold">Empresa ABC</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regime Tributário</p>
                <p className="font-bold">Simples Nacional</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
