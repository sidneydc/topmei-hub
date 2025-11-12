import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import type { DocumentoStatus } from '@/types/database';
import DocumentoCard from '@/components/documentos/DocumentoCard';

// 👇 ADICIONE ESTAS DUAS IMPORTAÇÕES
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type Props = {
  clienteData: { documentosStatus?: DocumentoStatus[] } | any;
  onUploaded?: () => void;
};

export default function DocumentosTab({ clienteData, onUploaded }: Props) {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [obrigatorioFilter, setObrigatorioFilter] = useState<'all' | 'obrigatorio' | 'opcional'>('all');


  if (!clienteData || !clienteData.documentosStatus) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Meus Documentos</h2>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Nenhum documento solicitado.</p>
        </Card>
      </div>
    );
  }

  const documentos: DocumentoStatus[] = clienteData.documentosStatus || [];

  return (
    <div className="space-y-6">
      
      <h2 className="text-2xl font-bold">Meus Documentos</h2>
      <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {documentos.filter((d) => d.status_geral === 'aprovado').length} de {documentos.length} documento(s) aprovado(s) • {documentos.filter((d) => d.status_geral === 'nao_enviado').length} não enviado(s)
        </p>
      </Card>

      {/* Filters (Sem mudança) */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por status:</span>
          {['all', 'nao_enviado', 'pendente_analise', 'aprovado', 'rejeitado'].map((st) => (
            <Button key={st} variant={filterStatus === st ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus(st as any)}>
              {st === 'all' ? 'Todos' : (st === 'nao_enviado' ? 'Não enviado' : st === 'pendente_analise' ? 'Pendente' : st === 'aprovado' ? 'Aprovado' : 'Rejeitado')}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Obrigatório / Opcional:</span>
          {['all', 'obrigatorio', 'opcional'].map((o) => (
            <Button key={o} variant={obrigatorioFilter === o ? 'default' : 'ghost'} size="sm" onClick={() => setObrigatorioFilter(o as any)}>
              {o === 'all' ? 'Todos' : (o === 'obrigatorio' ? 'Obrigatório' : 'Opcional')}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Documentos (Agora usa DocumentoCard) */}
      <div className="grid grid-cols-1 gap-4">
        {documentos
          .filter((d) => filterStatus === 'all' ? true : d.status_geral === filterStatus)
          .filter((d) => obrigatorioFilter === 'all' ? true : (obrigatorioFilter === 'obrigatorio' ? !!d.obrigatorio : !d.obrigatorio))
          .map((doc) => (
            <DocumentoCard
              key={doc.id_lista_documento || doc.id_documento}
              doc={doc}
              clienteId={user?.id_cadastro || ''}
              onUploaded={onUploaded}
            />
          ))}
      </div>
      
    </div>
  );
}