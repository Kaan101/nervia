import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { NetworkGraph } from '@/components/charts/NetworkGraph';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { Badge, EmptyState, Metric } from '@/components/common/Primitives';
import { descendants, pathTo } from '@/lib/selectors';
import { nodeKindLabels } from '@/lib/labels';
import { userName } from '@/data/org';
import { IconNetwork } from '@/components/common/Icons';

export function NetworkPage() {
  const data = useData((s) => s.data);
  const activeRisks = useData((s) => s.activeRisks);
  const activeControls = useData((s) => s.activeControls);
  const activeActions = useData((s) => s.activeActions);
  const select = useUi((s) => s.select);
  const [params, setParams] = useSearchParams();
  const [nodeId, setNodeId] = useState(params.get('dugum') ?? '');

  const candidates = useMemo(
    () => data.nodes.filter((n) => n.kind === 'activity' && (n.riskIds.length > 0 || n.controlIds.length > 0)),
    [data],
  );

  const activeId = nodeId || candidates[0]?.id || '';
  const node = data.nodes.find((n) => n.id === activeId);

  const stats = useMemo(() => {
    if (!node) return null;
    const ids = new Set([node.id, ...descendants(data.nodes, node.id).map((n) => n.id)]);
    return {
      risks: activeRisks.filter((r) => r.processNodeIds.some((id) => ids.has(id))).length,
      controls: activeControls.filter((c) => c.processNodeIds.some((id) => ids.has(id))).length,
      owners: new Set(activeControls.filter((c) => c.processNodeIds.some((id) => ids.has(id))).map((c) => c.ownerId)).size,
      actions: activeActions.filter((a) => a.processNodeId && ids.has(a.processNodeId)).length,
    };
  }, [data, node, activeRisks, activeControls, activeActions]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Bağlantı Ağı</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Süreç → Risk → Kontrol → Sorumlu → Aksiyon</h1>
          <p className="lede">
            Bir süreç adımının etrafındaki tüm bağlantılar tek grafikte. Bir düğümün üzerine gelin;
            yalnızca ona bağlı öğeler vurgulanır. Tıklayarak ilgili kaydın detayını açabilirsiniz.
          </p>
        </div>
        <select
          className="select" style={{ width: 'auto', minWidth: 280 }}
          value={activeId}
          onChange={(e) => { setNodeId(e.target.value); setParams({ dugum: e.target.value }, { replace: true }); }}
        >
          {candidates.map((n) => {
            const trail = pathTo(data.nodes, n.id);
            const proc = trail.find((t) => t.kind === 'process');
            return <option key={n.id} value={n.id}>{proc ? `${proc.name} · ` : ''}{n.name}</option>;
          })}
        </select>
      </div>

      {node && stats ? (
        <>
          <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
            <div className="card card-pad"><Metric compact label="Bağlı risk" value={stats.risks} /></div>
            <div className="card card-pad"><Metric compact label="Bağlı kontrol" value={stats.controls} /></div>
            <div className="card card-pad"><Metric compact label="Sorumlu kişi" value={stats.owners} /></div>
            <div className="card card-pad"><Metric compact label="Aksiyon" value={stats.actions} /></div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="stack" style={{ gap: 3 }}>
                <span className="row gap-2">
                  <Badge tone="brand">{nodeKindLabels[node.kind]}</Badge>
                  <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{node.code}</span>
                </span>
                <h4>{node.name}</h4>
                <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                  Süreç sahibi: {userName(node.ownerId)}
                </span>
              </div>
              <button className="btn btn-sm" onClick={() => select('node', node.id)}>Adım detayı</button>
            </div>
            <div className="card-body">
              <NetworkGraph
                data={data}
                rootNodeId={node.id}
                onSelect={(kind, id) => {
                  if (kind === 'risk') select('risk', id);
                  else if (kind === 'control') select('control', id);
                  else if (kind === 'action') select('action', id);
                  else if (kind === 'process' || kind === 'step') select('node', id);
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <EmptyState icon={<IconNetwork size={30} />} title="Görüntülenecek düğüm seçilmedi" />
      )}

      <SelectionDrawer />
    </div>
  );
}
