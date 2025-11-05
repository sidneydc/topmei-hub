import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AprovacoesTab() {
  return (
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
  );
}
