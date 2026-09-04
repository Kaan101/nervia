import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { buildSearchIndex, resultKindLabels, search, type ResultKind } from '@/lib/search';
import { Badge, EmptyState, Tabs } from '@/components/common/Primitives';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { IconArrowRight, IconSearch } from '@/components/common/Icons';

export function SearchPage() {
  const data = useData((s) => s.data);
  const select = useUi((s) => s.select);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [kind, setKind] = useState<ResultKind | 'all'>('all');

  const index = useMemo(() => buildSearchIndex(data), [data]);
  const results = useMemo(() => search(index, query, 300), [index, query]);
  const filtered = kind === 'all' ? results : results.filter((r) => r.kind === kind);

  useEffect(() => {
    const t = window.setTimeout(() => setParams(query ? { q: query } : {}, { replace: true }), 300);
    return () => window.clearTimeout(t);
  }, [query, setParams]);

  const counts = (Object.keys(resultKindLabels) as ResultKind[])
    .map((k) => ({ id: k, label: resultKindLabels[k], count: results.filter((r) => r.kind === k).length }))
    .filter((t) => t.count > 0);

  const open = (r: (typeof results)[number]) => {
    if (r.kind === 'process') select('node', r.id);
    else if (r.kind === 'risk') select('risk', r.id);
    else if (r.kind === 'control') select('control', r.id);
    else if (r.kind === 'action') select('action', r.id);
    else navigate(r.href.replace(/^#/, ''));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack grow">
          <span className="eyebrow">Global Arama</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Tek ekranda tüm kayıtlar</h1>
          <p className="lede">
            Bir terim yazın — o terimin geçtiği süreçler, riskler, kontroller, prosedürler ve aksiyonlar
            birlikte listelenir. Örneğin “IBAN” araması ödeme sürecini, ilgili riski, kontrolü ve prosedürü
            aynı anda getirir.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 'var(--s5)' }}>
        <span className="input row gap-3" style={{ display: 'flex', alignItems: 'center', height: 44 }}>
          <IconSearch size={18} className="dim" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Örn. IBAN, görevler ayrılığı, mutabakat, eksper…"
            style={{ border: 0, outline: 'none', background: 'none', width: '100%', fontSize: 'var(--text-md)' }}
          />
          {query ? <button className="btn btn-sm btn-ghost" onClick={() => setQuery('')}>Temizle</button> : null}
        </span>
      </div>

      {query.trim().length >= 2 ? (
        <>
          <Tabs<ResultKind | 'all'>
            value={kind}
            onChange={setKind}
            tabs={[{ id: 'all', label: 'Tümü', count: results.length }, ...counts]}
          />

          <div className="stack gap-2" style={{ marginTop: 'var(--s5)' }}>
            {filtered.map((r) => (
              <button className="card card-pad row gap-4 items-start" key={`${r.kind}-${r.id}`} onClick={() => open(r)}
                style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                <Badge tone="brand" className="mono">{resultKindLabels[r.kind]}</Badge>
                <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
                  <span className="row gap-2 wrap items-baseline">
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--ink-900)' }}>{r.title}</span>
                    <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{r.code}</span>
                  </span>
                  <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{r.subtitle}</span>
                  {r.snippet ? (
                    <span className="dim clamp-2" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>“{r.snippet}”</span>
                  ) : null}
                  {r.context ? (
                    <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>Bağlam: {r.context}</span>
                  ) : null}
                </span>
                <IconArrowRight size={16} className="dim" />
              </button>
            ))}
            {!filtered.length ? (
              <EmptyState
                title="Sonuç bulunamadı"
                hint="Farklı bir terim deneyin ya da Analiz Asistanı’na doğal dilde sorun."
              />
            ) : null}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<IconSearch size={30} />}
          title="Aramaya başlayın"
          hint="En az iki karakter yazın. Arama; kod, ad, açıklama, kontrol yöntemi, kanıt, prosedür içeriği ve örnek senaryolarda çalışır."
        />
      )}

      <SelectionDrawer />
    </div>
  );
}
