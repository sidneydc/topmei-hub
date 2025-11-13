import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Edit, Plus, Loader2, X, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// [NOVO] Componente para o Modal de Detalhes do Plano
// Ele busca os serviços inclusos de um plano específico
function ModalDetalhesPlano({ plano, onClose }: { plano: any; onClose: () => void; }) {
  const [servicosInclusos, setServicosInclusos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchServicosInclusos = async () => {
      if (!plano?.id_plano) return;
      setIsLoading(true);
      
      // [ASSUMINDO A TABELA 'planos_servicos']
      // Esta consulta SÓ FUNCIONA se você tiver uma tabela 'planos_servicos'
      // que liga 'planos' (id_plano) a 'servicos' (id_servico).
      const { data, error } = await supabase
        .from('planos_servicos')
        .select('servicos(nome_servico, descricao)')
        .eq('id_plano', plano.id_plano);

      if (error) {
        console.error("Erro ao buscar serviços inclusos (verifique a tabela 'planos_servicos'):", error);
      } else {
        setServicosInclusos(data || []);
      }
      setIsLoading(false);
    };

    fetchServicosInclusos();
  }, [plano]);

  const precoMensal = Number(plano.preco_mensal || 0);
  const precoAnual = Number(plano.preco_anual || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>{plano.nome_plano || "Detalhes do Plano"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground">{plano.descricao || "Sem descrição."}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <CardDescription>Preço Mensal</CardDescription>
              <CardTitle>R$ {precoMensal.toFixed(2)}</CardTitle>
            </Card>
            <Card className="p-4">
              <CardDescription>Preço Anual</CardDescription>
              <CardTitle>R$ {precoAnual.toFixed(2)}</CardTitle>
              {plano.desconto_anual > 0 && <Badge className="mt-1">-{plano.desconto_anual}%</Badge>}
            </Card>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Serviços Inclusos</h4>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isLoading && servicosInclusos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum serviço incluso neste plano (ou tabela 'planos_servicos' não encontrada).</p>
            )}
            {!isLoading && servicosInclusos.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {servicosInclusos.map((item: any) => (
                  <li key={item.servicos.nome_servico}>{item.servicos.nome_servico}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}

// [NOVO] Componente para o Modal de Alteração de Plano
function ModalAlterarPlano(
  {
    isOpen,
    onClose,
    planoAtual,
    onSelectPlano,
    onViewDetails
  }: {
    isOpen: boolean;
    onClose: () => void;
    planoAtual: any;
    onSelectPlano: (plano: any, ciclo: 'mensal' | 'anual', valor: number) => void;
    onViewDetails: (plano: any) => void;
  }
) {
  const [availablePlanos, setAvailablePlanos] = useState<any[]>([]);
  const [isLoadingPlanos, setIsLoadingPlanos] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlanos = async () => {
      setIsLoadingPlanos(true);
      const { data, error } = await supabase
        .from('planos') //
        .select('*')
        .eq('ativo', true)
        .order('preco_mensal', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar planos:', error);
      } else {
        setAvailablePlanos(data || []);
      }
      setIsLoadingPlanos(false);
    };

    fetchPlanos();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Alterar Plano</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingPlanos ? (
            <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlanos.length === 0 && <p>Nenhum plano disponível.</p>}
              {availablePlanos.map((p) => {
                
                // [CORREÇÃO] Lógica de preços vinda do banco
                const temMensal = p.preco_mensal !== null && p.preco_mensal >= 0;
                const temAnual = p.preco_anual !== null && p.preco_anual >= 0;
                const isGratuito = !temMensal && !temAnual && p.preco_mensal === null && p.preco_anual === null; // Ou preco_mensal == 0

                const isCurrentMensal = planoAtual?.id_plano === p.id_plano && planoAtual?.ciclo_cobranca === 'mensal';
                const isCurrentAnual = planoAtual?.id_plano === p.id_plano && planoAtual?.ciclo_cobranca === 'anual';

                return (
                  <Card key={p.id_plano} className="p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold">{p.nome_plano}</h4>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{p.descricao}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onViewDetails(p)}>
                        <Eye className="w-4 h-4 mr-1" /> Ver Detalhes
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {isGratuito && (
                        <Button 
                          className="w-full"
                          variant={isCurrentMensal || isCurrentAnual ? "outline" : "default"}
                          onClick={() => onSelectPlano(p, 'mensal', 0)}
                          disabled={isCurrentMensal || isCurrentAnual}
                        >
                          {isCurrentMensal || isCurrentAnual ? "Plano Atual" : "Gratuito"}
                        </Button>
                      )}
                      {temMensal && !isGratuito && (
                        <Button
                          className="w-full"
                          variant={isCurrentMensal ? "outline" : "default"}
                          onClick={() => onSelectPlano(p, 'mensal', p.preco_mensal)}
                          disabled={isCurrentMensal}
                        >
                          {isCurrentMensal ? "Atual: " : ""}R$ {Number(p.preco_mensal).toFixed(2)} /mês
                        </Button>
                      )}
                      {temAnual && !isGratuito && (
                        <Button
                          className="w-full"
                          variant={isCurrentAnual ? "outline" : "default"}
                          onClick={() => onSelectPlano(p, 'anual', p.preco_anual)}
                          disabled={isCurrentAnual}
                        >
                          {isCurrentAnual ? "Atual: " : ""}R$ {Number(p.preco_anual).toFixed(2)} /ano
                          {p.desconto_anual > 0 && <Badge className="ml-2">-{p.desconto_anual}%</Badge>}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}

// [NOVO] Componente para o Modal de Serviços Avulsos
function ModalServicosAvulsos(
  {
    isOpen,
    onClose,
    onContratar,
    servicosInclusosIds // <--- Recebe os IDs do plano atual
  }: {
    isOpen: boolean;
    onClose: () => void;
    onContratar: (servico: any, isIncluso: boolean) => void;
    servicosInclusosIds: string[];
  }
) {
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchServicos = async () => {
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
    };
    fetchServicos();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Contratar Serviços Avulsos</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingServices ? (
            <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableServices.length === 0 && <p>Nenhum serviço disponível.</p>}
              {availableServices.map((s) => {
                // [CORREÇÃO] A lógica que você pediu (verificar se está incluso)
                const isIncluded = servicosInclusosIds.includes(s.id_servico);
                return (
                  <Card key={s.id_servico} className={`p-4 ${isIncluded ? 'bg-green-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{s.nome_servico}</h4>
                        {isIncluded ? (
                          <Badge variant="outline" className="border-green-600 text-green-700">Incluso no seu plano</Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">R$ {Number(s.preco_unitario || 0).toFixed(2)}</p>
                        )}
                      </div>
                      <div>
                        <Button size="sm" onClick={() => onContratar(s, isIncluded)}>
                          {isIncluded ? 'Solicitar' : 'Contratar'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}


// --- COMPONENTE PRINCIPAL ---
export default function ServicosTab(props: any) {
  const { user, clienteData, refetch } = props;
  
  // Estados dos Modais
  const [planosModalOpen, setPlanosModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);
  const [updatingContrato, setUpdatingContrato] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');

  // --- LÓGICA DE DADOS ---
  const planoAtualContrato = clienteData.contratos.find((c: any) => c.id_servico === null);
  const planoAtual = clienteData.plano; // O objeto do plano (com nome, preços, etc.)
  const servicosContratados = clienteData.contratos.filter((c: any) => c.id_servico !== null);

  // [CORREÇÃO] Pega os IDs dos serviços inclusos (baseado na minha suposição)
  // [ASSUMINDO] que 'clienteData.plano.planos_servicos' existe
  const servicosInclusosIds = planoAtual?.planos_servicos?.map((ps: any) => ps.id_servico) || [];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ativo': 'Ativo', 'aguardando_aprovacao': 'Aguardando Aprovação', 'rejeitado': 'Rejeitado',
      'pendente': 'Pendente', 'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const updateContrato = async (id_contrato: string, changes: any) => {
    setUpdatingContrato(id_contrato);
    try {
      const { data, error } = await supabase.from('contratos').update(changes).eq('id_contrato', id_contrato).select().single();
      if (error) { throw error; }
      if (refetch) await refetch();
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar contrato:', error);
      alert('Erro ao atualizar contrato. Veja console para detalhes.');
      return null;
    } finally {
      setUpdatingContrato(null);
    }
  };

  // [CORREÇÃO] Lógica para contratar serviço (agora recebe 'isIncluso')
  const handleContratarServico = async (servico: any, isIncluso: boolean) => {
    if (!user?.id_cadastro) return alert('ID do cadastro não encontrado');
    
    const payload = {
      id_cadastro: user.id_cadastro,
      id_servico: servico.id_servico,
      valor_final: isIncluso ? 0 : (servico.preco_unitario || 0), // Preço 0 se estiver incluso
      status_contrato: 'pendente',
      data_criacao: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase.from('contratos').insert([payload]).select().single();
    if (insertError) {
      console.error('Erro ao contratar serviço:', insertError);
      alert('Erro ao contratar serviço');
      return;
    }

    if (refetch) await refetch();
    alert(isIncluso ? 'Serviço (incluso) solicitado com sucesso.' : 'Serviço contratado com sucesso (pendente).');
    setServicesModalOpen(false);
  };

  // Lógica para alterar o plano principal
  const handleAlterarPlano = async (novoPlano: any, ciclo: 'mensal' | 'anual', valor: number) => {
    if (!planoAtualContrato?.id_contrato) {
      alert("Erro: Contrato principal (plano) não encontrado.");
      return;
    }
    if (planoAtual?.id_plano === novoPlano.id_plano && planoAtualContrato?.ciclo_cobranca === ciclo) {
      alert("Este já é o seu plano atual.");
      return;
    }
    if (!confirm(`Deseja alterar seu plano para "${novoPlano.nome_plano}" (${ciclo}) por R$ ${Number(valor).toFixed(2)}?`)) {
      return;
    }

    const changes = {
      id_plano: novoPlano.id_plano, // Assumindo que 'contratos' tem 'id_plano'
      valor_final: valor,
      ciclo_cobranca: ciclo, // Assumindo que 'contratos' tem 'ciclo_cobranca'
      status_contrato: 'pendente' 
    };

    const sucesso = await updateContrato(planoAtualContrato.id_contrato, changes);
    if (sucesso) {
      alert('Solicitação de alteração de plano enviada!');
      setPlanosModalOpen(false);
    }
  };

  // Funções para controlar os modais
  const handleOpenPlanosModal = () => setPlanosModalOpen(true);
  const handleOpenDetailsModal = (plano: any) => {
    if(!plano) return alert("Dados do plano não encontrados.");
    setSelectedPlanDetails(plano);
    setDetailsModalOpen(true);
  };
  
  // Lógica para exibir o preço do plano atual
  const renderPlanoAtualPreco = () => {
    if (!planoAtualContrato) {
      return <p className="text-2xl font-bold text-gray-500">Nenhum plano</p>;
    }
    const valor = Number(planoAtualContrato.valor_final || 0);
    const isGratuito = valor === 0;
    const cicloLabel = planoAtualContrato.ciclo_cobranca === 'anual' ? '/ano' : '/mês';

    if (isGratuito) {
      return <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">Gratuito</p>;
    }
    return (
      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
        R$ {valor.toFixed(2)}
        <span className="text-sm font-normal text-muted-foreground">{cicloLabel}</span>
      </p>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Meus Serviços</h2>

      {/* === CARD DO PLANO ATUAL (Com "Ver Detalhes") === */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardDescription>Plano Atual</CardDescription>
            <CardTitle className="text-2xl">
              {planoAtual?.nome_plano || "Nenhum plano"}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenDetailsModal(planoAtual)} disabled={!planoAtual}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
            <Button onClick={handleOpenPlanosModal}>
              <Edit className="w-4 h-4 mr-2" />
              Alterar Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderPlanoAtualPreco()}
          {planoAtualContrato && planoAtualContrato.status_contrato !== 'ativo' && (
            <Badge variant="destructive" className="mt-2">
              Status: {getStatusLabel(planoAtualContrato.status_contrato)}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* === SEÇÃO DE SERVIÇOS AVULSOS === */}
      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold">Serviços Avulsos</h3>
        <div>
          <Button onClick={() => setServicesModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Novo Serviço
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por status:</span>
          {['all', 'pendente', 'aguardando_aprovacao', 'ativo', 'rejeitado', 'cancelado'].map((st) => (
            <Button key={st} variant={filterStatus === st ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus(st as any)}>
              {st === 'all' ? 'Todos' : getStatusLabel(st)}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Serviços Avulsos */}
      {servicosContratados.length === 0 ? (
        <Card className="p-6 mt-4">
          <p className="text-muted-foreground">Nenhum serviço avulso contratado</p>
        </Card>
      ) : (
        (servicosContratados.filter((c: any) => filterStatus === 'all' ? true : c.status_contrato === filterStatus)).map((contrato: any) => (
          <Card key={contrato.id_contrato} className="p-6">
            {/* ... (renderização do card do serviço avulso contratado, sem mudança) ... */}
          </Card>
        ))
      )}

      {/* === MODAIS RENDERIZADOS AQUI === */}

      <ModalAlterarPlano
        isOpen={planosModalOpen}
        onClose={() => setPlanosModalOpen(false)}
        planoAtual={planoAtualContrato}
        onSelectPlano={handleAlterarPlano}
        onViewDetails={handleOpenDetailsModal}
      />
      
      {detailsModalOpen && selectedPlanDetails && (
        <ModalDetalhesPlano
          plano={selectedPlanDetails}
          onClose={() => setDetailsModalOpen(false)}
        />
      )}

      <ModalServicosAvulsos
        isOpen={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        onContratar={handleContratarServico}
        servicosInclusosIds={servicosInclusosIds} // Passa os IDs para o modal
      />
    </div>
  );
}