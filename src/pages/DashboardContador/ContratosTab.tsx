import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ContractRow = { [key: string]: any };

export default function ContratosTab() {
  const [data, setData] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [clientsMap, setClientsMap] = useState<Record<string,string>>({});
  const [servicesMap, setServicesMap] = useState<Record<string,string>>({});

  const [editingRow, setEditingRow] = useState<ContractRow | null>(null);
  const [saving, setSaving] = useState(false);

  // history state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<Array<{ dados_novos: any; created_at?: string }>>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data: rows, error: fetchErr } = await supabase.from('contratos').select('*').order('id_contrato', { ascending: false }).limit(2000);
        if (fetchErr) throw fetchErr;
        const raw = rows || [];

        // enrich with client and service names
        const cadastroIds = Array.from(new Set(raw.map((r: any) => r.id_cadastro).filter(Boolean)));
        const servicoIds = Array.from(new Set(raw.map((r: any) => r.id_servico || r.id_serviços || r.id_serviços).filter(Boolean)));

        let clientsMapLocal: Record<string, string> = {};
        if (cadastroIds.length > 0) {
          const { data: clients } = await supabase.from('cadastros_clientes').select('id_cadastro, nome_fantasia, razao_social').in('id_cadastro', cadastroIds);
          if (clients) {
            for (const c of clients) {
              clientsMapLocal[c.id_cadastro] = c.nome_fantasia || c.razao_social || c.id_cadastro;
            }
          }
        }

        let servicesMapLocal: Record<string, string> = {};
        if (servicoIds.length > 0) {
          const { data: services } = await supabase.from('servicos').select('id_servico, nome_servico').in('id_servico', servicoIds);
          if (services) {
            for (const s of services) {
              servicesMapLocal[s.id_servico] = s.nome_servico || s.id_servico;
            }
          }
        }

        const enriched = raw.map((r: any) => ({
          ...r,
          cliente_nome: clientsMapLocal[r.id_cadastro] ?? r.id_cadastro,
          servico_nome: servicesMapLocal[r.id_servico] ?? r.id_servico,
        }));

        if (mounted) {
          setClientsMap(clientsMapLocal);
          setServicesMap(servicesMapLocal);
          setData(enriched);
        }
      } catch (err: any) {
        console.error('Erro ao buscar contratos:', err);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return ['id_contrato', 'id_cadastro', 'plano', 'valor', 'status_contrato', 'vencimento'];
    const keys = Object.keys(data[0]);
  const preferred = ['id_contrato', 'id_cadastro', 'cliente_nome', 'servico_nome', 'plano', 'valor', 'status_contrato', 'vencimento', 'created_at'];
    return [...preferred.filter(k => keys.includes(k)), ...keys.filter(k => !preferred.includes(k))];
  }, [data]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    for (const r of data) {
      const st = r.status_contrato ?? r.status ?? null;
      if (st) s.add(String(st));
    }
    return [''].concat(Array.from(s));
  }, [data]);

  const filtered = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter(r => String(r.status_contrato ?? r.status ?? '').toLowerCase() === String(statusFilter).toLowerCase());
  }, [data, statusFilter]);

  const total = filtered.length;

  function exportCsv(rows: ContractRow[]) {
    if (!rows || rows.length === 0) return;
    const hdrs = columns;
    const csv = [hdrs.join(',')].concat(rows.map(r => hdrs.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
      return '"' + String(v).replace(/"/g, '""') + '"';
    }).join(',')) ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contratos_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPdf(rows: ContractRow[]) {
    const hdrs = columns;
    const html = `
      <html><head><title>Contratos</title>
      <style>table{width:100%;border-collapse:collapse;font-family:Arial}th,td{border:1px solid #ccc;padding:6px;text-align:left;font-size:12px}</style>
      </head><body>
      <h1>Contratos</h1>
      <table><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
      ${rows.map(r=>`<tr>${hdrs.map(h=>`<td>${String(r[h] ?? '')}</td>`).join('')}</tr>`).join('')}
      </tbody></table>
      </body></html>`;
    const w = window.open('', '_blank', 'noopener');
    if (!w) { alert('Bloqueador de popups impediu abrir a janela de impressão. Permita popups para este site.'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  }

  async function saveEdit(updated: Partial<ContractRow>) {
    if (!editingRow) return;
    setSaving(true);
    try {
      const payload = { ...updated };
      const { error: upErr } = await supabase.from('contratos').update(payload).eq('id_contrato', editingRow.id_contrato);
      if (upErr) throw upErr;
      // update local state
      setData(prev => prev.map(r => r.id_contrato === editingRow.id_contrato ? { ...r, ...payload } : r));
      setEditingRow(null);
    } catch (err: any) {
      console.error('Erro ao salvar contrato:', err);
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestão de Contratos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Contratos Visíveis" value={`${total}`} description="Contratos filtrados" variant="success" />
        <StatCard title="Contratos Totais" value={`${data.length}`} description="Total na base" variant="warning" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filtrar por status:</label>
          <select className="rounded-md border border-input px-3 py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            {statuses.filter(s=>s).map((s,i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Card className="p-4">
        {loading && <div>Carregando...</div>}
        {error && <div className="text-destructive">Erro: {error}</div>}

        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>Exportar CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportPdf(filtered)}>Exportar PDF</Button>
        </div>

        <Table>
          <TableHeader>
            <tr>
              <TableHead>Ações</TableHead>
              {columns.map(c => <TableHead key={c}>{c}</TableHead>)}
            </tr>
          </TableHeader>
          <TableBody>
            {filtered.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingRow(row)}>Editar</Button>
                  </div>
                </TableCell>
                {columns.map(c => (
                  <TableCell key={c}>{typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Contract edit modal */}
        {editingRow && (
          <Dialog open={true} onOpenChange={(open) => { if (!open) setEditingRow(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Contrato</DialogTitle>
                <DialogDescription>Altere os campos do contrato e salve.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>id_contrato</Label>
                  <div className="text-sm font-mono">{editingRow.id_contrato}</div>
                </div>
                <div>
                  <Label>id_cadastro</Label>
                  <div className="text-sm">{editingRow.id_cadastro}</div>
                </div>
                <div>
                  <Label>Serviço (id_servico)</Label>
                  <select className="w-full rounded-md border border-input px-3 py-2" value={editingRow.id_servico ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, id_servico: e.target.value, servico_nome: servicesMap[e.target.value] ?? e.target.value }) : prev)}>
                    <option value="">-- selecione --</option>
                    {Object.entries(servicesMap).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Número do Contrato</Label>
                  <Input value={editingRow.numero_contrato ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, numero_contrato: e.target.value }) : prev)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Label>Data Contratação</Label>
                    <Input type="date" value={editingRow.data_contratacao ? String(editingRow.data_contratacao).split('T')[0] : ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, data_contratacao: e.target.value }) : prev)} />
                  </div>
                  <div>
                    <Label>Início Vigência</Label>
                    <Input type="date" value={editingRow.data_inicio_vigencia ? String(editingRow.data_inicio_vigencia).split('T')[0] : ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, data_inicio_vigencia: e.target.value }) : prev)} />
                  </div>
                  <div>
                    <Label>Fim Vigência</Label>
                    <Input type="date" value={editingRow.data_fim_vigencia ? String(editingRow.data_fim_vigencia).split('T')[0] : ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, data_fim_vigencia: e.target.value }) : prev)} />
                  </div>
                </div>
                <div>
                  <Label>Ciclo de Cobrança</Label>
                  <Input value={editingRow.ciclo_cobranca ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, ciclo_cobranca: e.target.value }) : prev)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div>
                    <Label>Preço Contratado</Label>
                    <Input type="number" step="0.01" value={editingRow.preco_contratado ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, preco_contratado: e.target.value === '' ? null : Number(e.target.value) }) : prev)} />
                  </div>
                  <div>
                    <Label>Desconto Aplicado</Label>
                    <Input type="number" step="0.01" value={editingRow.desconto_aplicado ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, desconto_aplicado: e.target.value === '' ? null : Number(e.target.value) }) : prev)} />
                  </div>
                  <div>
                    <Label>Valor Desconto</Label>
                    <Input type="number" step="0.01" value={editingRow.valor_desconto ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, valor_desconto: e.target.value === '' ? null : Number(e.target.value) }) : prev)} />
                  </div>
                  <div>
                    <Label>Valor Final</Label>
                    <Input type="number" step="0.01" value={editingRow.valor_final ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, valor_final: e.target.value === '' ? null : Number(e.target.value) }) : prev)} />
                  </div>
                </div>
                <div>
                  <Label>Data Próximo Vencimento</Label>
                  <Input type="date" value={editingRow.data_proximo_vencimento ? String(editingRow.data_proximo_vencimento).split('T')[0] : ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, data_proximo_vencimento: e.target.value }) : prev)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <select className="w-full rounded-md border border-input px-3 py-2" value={editingRow.status_contrato ?? ''} onChange={(e)=> setEditingRow(prev => prev ? ({ ...prev, status_contrato: e.target.value }) : prev)}>
                    <option value="pendente">pendente</option>
                    <option value="ativo">ativo</option>
                    <option value="inativo">inativo</option>
                    <option value="cancelado">cancelado</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="renov_chk" type="checkbox" checked={Boolean(editingRow.renovacao_automatica)} onChange={(e) => setEditingRow(prev => prev ? ({ ...prev, renovacao_automatica: e.target.checked }) : prev)} />
                  <label htmlFor="renov_chk">Renovação automática</label>
                </div>
                <div>
                  <Label>Data Criação</Label>
                  <div className="text-sm">{editingRow.data_criacao ?? ''}</div>
                </div>
              </div>
              <DialogFooter>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingRow(null)}>Cancelar</Button>
                  <Button variant="ghost" onClick={() => editingRow && openHistory(String(editingRow.id_contrato))}>Histórico</Button>
                  <Button onClick={() => saveEdit({
                    id_servico: editingRow.id_servico,
                    numero_contrato: editingRow.numero_contrato,
                    data_contratacao: editingRow.data_contratacao,
                    data_inicio_vigencia: editingRow.data_inicio_vigencia,
                    data_fim_vigencia: editingRow.data_fim_vigencia,
                    ciclo_cobranca: editingRow.ciclo_cobranca,
                    preco_contratado: editingRow.preco_contratado,
                    desconto_aplicado: editingRow.desconto_aplicado,
                    valor_desconto: editingRow.valor_desconto,
                    valor_final: editingRow.valor_final,
                    data_proximo_vencimento: editingRow.data_proximo_vencimento,
                    status_contrato: editingRow.status_contrato,
                    renovacao_automatica: editingRow.renovacao_automatica,
                  })} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* History dialog */}
        {historyOpen && (
          <Dialog open={true} onOpenChange={(open) => { if (!open) setHistoryOpen(false); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Histórico de Alterações</DialogTitle>
                <DialogDescription>Registros na tabela auditoria para este contrato (campo dados_novos)</DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-4 max-h-96 overflow-auto">
                {historyLoading && <div>Carregando histórico...</div>}
                {!historyLoading && historyEntries.length === 0 && <div>Nenhum histórico encontrado.</div>}
                {historyEntries.map((h, i) => (
                  <div key={i} className="border rounded p-2 bg-muted">
                    <div className="text-xs text-muted-foreground">{h.created_at ?? ''}</div>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(h.dados_novos, null, 2)}</pre>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setHistoryOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </div>
  );

  async function openHistory(contractId: string) {
    setHistoryLoading(true);
    try {
      // Query auditoria where dados_novos->>id_contrato equals the contractId
      const { data: rows, error } = await supabase
        .from('auditoria')
        .select('dados_novos, created_at')
        .eq('dados_novos->>id_contrato', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHistoryEntries(rows || []);
      setHistoryOpen(true);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
      setError(err.message || String(err));
    } finally {
      setHistoryLoading(false);
    }
  }
}
