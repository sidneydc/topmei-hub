import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ClientRow = { [key: string]: any };

export default function ClientesTab() {
  const [data, setData] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data: rows, error: fetchErr } = await supabase.from('cadastros_clientes').select('*').order('id_cadastro', { ascending: false }).limit(1000);
        if (fetchErr) throw fetchErr;
        if (mounted) {
          setData(rows || []);
        }
      } catch (err: any) {
        console.error('Erro ao buscar cadastros_clientes:', err);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // derive columns from first row
  const columns = useMemo(() => {
    if (!data || data.length === 0) return ['id_cadastro', 'nome', 'cpf_cnpj', 'email'];
    const keys = Object.keys(data[0]);
    // prefer common ordering
    const preferred = ['id_cadastro', 'nome', 'cpf_cnpj', 'cpf', 'cnpj', 'email', 'status', 'created_at'];
    const ordered = [...preferred.filter(k => keys.includes(k)), ...keys.filter(k => !preferred.includes(k))];
    return ordered;
  }, [data]);

  // filtered rows by per-column filters
  const filtered = useMemo(() => {
    if (!data || data.length === 0) return data;
    const filters = columnFilters;
    const keys = Object.keys(filters).filter(k => filters[k] && filters[k].trim() !== '');
    if (keys.length === 0) return data;
    return data.filter(r => {
      return keys.every(k => {
        const val = String(r[k] ?? '').toLowerCase();
        const f = String(filters[k] ?? '').toLowerCase();
        return val.includes(f);
      });
    });
  }, [data, columnFilters]);

  // no debounce: apply filters immediately for simplicity

  // compute unique values per column (for suggestions)
  const uniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of columns) {
      const s = new Set<string>();
      for (const r of data) {
        const v = r[c];
        if (v === undefined || v === null) continue;
        if (typeof v === 'object') {
          const j = JSON.stringify(v);
          s.add(j);
        } else {
          s.add(String(v));
        }
        if (s.size >= 100) break;
      }
      map[c] = Array.from(s).slice(0, 100);
    }
    return map;
  }, [data, columns]);

  function setFilter(col: string, value: string) {
    setColumnFilters(prev => ({ ...prev, [col]: value }));
  }

  function clearFilters() {
    setColumnFilters({});
  }

  const total = filtered.length;

  // export CSV
  function exportCsv(rows: ClientRow[]) {
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
    a.download = `meus_clientes_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // open printable view for PDF printing
  function exportPdf(rows: ClientRow[]) {
    const hdrs = columns;
    const html = `
      <html><head><title>Meus Clientes</title>
      <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}</style>
      </head><body>
      <h1>Meus Clientes</h1>
      <table><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
      ${rows.map(r=>`<tr>${hdrs.map(h=>`<td>${String(r[h] ?? '')}</td>`).join('')}</tr>`).join('')}
      </tbody></table>
      </body></html>`;
    const w = window.open('', '_blank', 'noopener');
    if (!w) { alert('Bloqueador de popups impediu abrir a janela de impressão. Permita popups para este site.'); return; }
    w.document.write(html);
    w.document.close();
    // give the new window a moment to render
    setTimeout(() => { w.print(); }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meus Clientes</h2>
          <div className="text-sm text-muted-foreground">{total} registros</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>Exportar CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportPdf(filtered)}>Exportar PDF</Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <div className="mb-3 overflow-auto">
            <div className="w-full">
              <div className="grid grid-cols-12 gap-2">
                {columns.map((c, idx) => (
                  <div key={c} className={`col-span-12 sm:col-span-6 lg:col-span-${Math.max(1, Math.floor(12 / Math.min(6, columns.length)))}` }>
                    <label className="text-xs text-muted-foreground block mb-1">{c}</label>
                    <input
                      list={`dl-${c}`}
                      className="w-full rounded-md border border-input px-3 py-2 text-sm"
                      placeholder={`Filtrar ${c}`}
                      value={columnFilters[c] ?? ''}
                      onChange={(e) => setFilter(c, e.target.value)}
                    />
                    <datalist id={`dl-${c}`}>
                      {(uniqueValues[c] || []).slice(0,20).map((v, i) => (
                        <option key={i} value={v} />
                      ))}
                    </datalist>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-0">
          {loading && <div>Carregando...</div>}
          {error && <div className="text-destructive">Erro: {error}</div>}

          <Table>
            <TableHeader>
              <tr>
                {columns.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
              </tr>
            </TableHeader>
            <TableBody>
              {filtered.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((c) => (
                    <TableCell key={c}>{
                      typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '')
                    }</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          </div>
        </div>
      </Card>
    </div>
  );
}
