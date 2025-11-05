import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ServicosTab(props: any) {
  const { user, clienteData, refetch } = props;
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [updatingContrato, setUpdatingContrato] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ativo': 'Ativo',
      'aguardando_aprovacao': 'Aguardando Aprovação',
      'rejeitado': 'Rejeitado',
      'pendente': 'Pendente',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const updateContrato = async (id_contrato: string, changes: any) => {
    setUpdatingContrato(id_contrato);
    try {
      const { data, error } = await supabase
        .from('contratos')
        .update(changes)
        .eq('id_contrato', id_contrato)
        .select()
        .single();
      if (error) {
        console.error('Erro ao atualizar contrato:', error);
        alert('Erro ao atualizar contrato. Veja console para detalhes.');
        return null;
      }
      if (refetch) await refetch();
      return data;
    } finally {
      setUpdatingContrato(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Meus Serviços</h2>
      <div className="flex justify-between items-center">
        <div />
        <div>
          <Button onClick={async () => {
            setServicesModalOpen(true);
            // fetch available services
            setIsLoadingServices(true);
            const { data: servs, error } = await supabase
              .from('servicos')
              .select('*')
              .eq('ativo', true)
              .order('nome_servico', { ascending: true });
            if (error) {
              console.error('Erro ao buscar serviços:', error);
              setAvailableServices([]);
            } else {
              setAvailableServices(servs || []);
            }
            setIsLoadingServices(false);
          }}>Contratar Serviço</Button>
        </div>
      </div>
      
      {/* Filters (moved above the contracts list) */}
      <div className="pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por status:</span>
          {['all', 'pendente', 'aguardando_aprovacao', 'ativo', 'rejeitado', 'cancelado'].map((st) => (
            <Button key={st} variant={filterStatus === st ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus(st as any)}>
              {st === 'all' ? 'Todos' : getStatusLabel(st)}
            </Button>
          ))}
        </div>
      </div>

      {clienteData.contratos.length === 0 ? (
        <Card className="p-6 mt-4">
          <p className="text-muted-foreground">Nenhum serviço contratado</p>
        </Card>
      ) : (
        (clienteData.contratos.filter((c: any) => filterStatus === 'all' ? true : c.status_contrato === filterStatus)).map((contrato: any) => {
          return (
            <Card key={contrato.id_contrato} className="p-6 border-l-4 border-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{(contrato as any).servicos?.nome_servico || 'Serviço'}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="default">{getStatusLabel(contrato.status_contrato)}</Badge>
                    <div className="text-sm text-muted-foreground">Contrato: {contrato.numero_contrato || '—'}</div>
                  </div>
                  <div className="mt-3 text-sm space-y-1">
                    <div>Contratado em: {contrato.data_contratacao ? new Date(contrato.data_contratacao).toLocaleDateString('pt-BR') : '—'}</div>
                    <div>Início: {contrato.data_inicio_vigencia ? new Date(contrato.data_inicio_vigencia).toLocaleDateString('pt-BR') : '—'}</div>
                    <div>Fim: {contrato.data_fim_vigencia ? new Date(contrato.data_fim_vigencia).toLocaleDateString('pt-BR') : '—'}</div>
                    <div>Ciclo: {contrato.ciclo_cobranca || '—'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">R$ {(contrato.valor_final || 0).toFixed(2)}</p>
                  {contrato.data_proximo_vencimento && (
                    <p className="text-xs text-muted-foreground">Próx: {new Date(contrato.data_proximo_vencimento).toLocaleDateString('pt-BR')}</p>
                  )}
                  <div className="mt-3 flex flex-col items-end gap-2">
                    {/* Cliente não pode alterar status; apenas visualizar. */}
                    {contrato.status_contrato === 'pendente' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" disabled={updatingContrato === contrato.id_contrato} onClick={async () => {
                          if (!confirm('Deseja cancelar esta contratação?')) return;
                          await updateContrato(contrato.id_contrato, { status_contrato: 'cancelado' });
                        }}>{updatingContrato === contrato.id_contrato ? 'Cancelando...' : 'Cancelar Contratação'}</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}

      

      {/* Services modal */}
      {servicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Contratar Serviços</h3>
              <Button variant="ghost" onClick={() => setServicesModalOpen(false)}>Fechar</Button>
            </div>
            {isLoadingServices ? (
              <div className="flex items-center justify-center p-6">Carregando serviços...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableServices.length === 0 && <p>Nenhum serviço disponível.</p>}
                {availableServices.map((s) => (
                  <Card key={s.id_servico} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{s.nome_servico}</h4>
                        <p className="text-sm text-muted-foreground mt-1">R$ {Number(s.preco_unitario || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <Button size="sm" onClick={async () => {
                          // insert contrato
                          if (!user?.id_cadastro) return alert('ID do cadastro não encontrado');
                          const payload = {
                            id_cadastro: user.id_cadastro,
                            id_servico: s.id_servico,
                            valor_final: s.preco_unitario || 0,
                            status_contrato: 'pendente',
                            data_criacao: new Date().toISOString()
                          };
                          const { data: inserted, error: insertError } = await supabase
                            .from('contratos')
                            .insert([payload])
                            .select()
                            .single();
                          if (insertError) {
                            console.error('Erro ao contratar serviço:', insertError);
                            alert('Erro ao contratar serviço');
                            return;
                          }
                          // refresh cliente data
                          if (refetch) await refetch();
                          alert('Serviço contratado com sucesso (pendente).');
                          setServicesModalOpen(false);
                        }}>Contratar</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
