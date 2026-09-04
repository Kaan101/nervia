import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi, type ProcessView } from '@/store/useUi';
import { buildTree, mainProcesses, pathTo, rollup } from '@/lib/selectors';
import { formatDate, isReviewOverdue, levelOf, monthsSince } from '@/lib/riskMath';
import { nodeKindLabels, processClassLabels, riskLevelLabels } from '@/lib/labels';
import { userName } from '@/data/org';
import { Badge, Maturity, Metric, Segmented } from '@/components/common/Primitives';
import {
  ControlView, EffectivenessSummary, FlowView, ManagementView, ProcessMap, ProcessTree, RiskView,
} from '@/components/process/Views';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import {
  IconChevronLeft, IconControl, IconFlow, IconHeat, IconLayers, IconList, IconProcess,
} from '@/components/common/Icons';

const viewOptions: { id: ProcessView; label: string; icon: React.ReactNode }[] = [
  { id: 'map', label: 'Harita', icon: <IconProcess size={13} /> },
  { id: 'tree', label: 'Ağaç', icon: <IconList size={13} /> },
  { id: 'flow', label: 'Akış', icon: <IconFlow size={13} /> },
  { id: 'risk', label: 'Risk', icon: <IconHeat size={13} /> },
  { id: 'control', label: 'Kontrol', icon: <IconControl size={13} /> },
  { id: 'management', label: 'Yönetim', icon: <IconLayers size={13} /> },
];

export function ProcessesPage() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const data = useData((s) => s.data);
  const { view, setView, select, selection, setExpanded } = useUi();

  const root = useMemo(
    () => (nodeId ? data.nodes.find((n) => n.id === nodeId) : data.nodes.find((n) => n.kind === 'organization')),
    [data, nodeId],
  );

  // Odaklanılan sürecin yolunu otomatik aç.
  useEffect(() => {
    if (root) setExpanded(pathTo(data.nodes, root.id).map((n) => n.id), true);
  }, [root, data.nodes, setExpanded]);

  if (!root) return null;

  const isOrg = root.kind === 'organization';
  const roll = rollup(data, root.id);
  const tree = buildTree(data.nodes, root.id);
  const trail = pathTo(data.nodes, root.id);

  const effectiveView: ProcessView = isOrg && view === 'flow' ? 'map' : view;

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack gap-2" style={{ minWidth: 0 }}>
          {!isOrg ? (
            <div className="row gap-2 wrap" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/surecler')}>
                <IconChevronLeft size={13} /> Organizasyon
              </button>
              {trail.slice(1, -1).map((n) => (
                <button key={n.id} className="btn btn-sm btn-ghost" onClick={() => navigate(`/surecler/${n.id}`)}>
                  {n.name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="row gap-3 wrap items-baseline">
            <h1>{isOrg ? 'Süreç Haritası' : root.name}</h1>
            {!isOrg ? (
              <>
                <Badge tone="brand">{nodeKindLabels[root.kind]}</Badge>
                <span className="mono dim" style={{ fontSize: 'var(--text-xs)' }}>{root.code}</span>
                <Badge tone="plain">v{root.version}</Badge>
                <Badge tone="plain">{processClassLabels[root.processClass]}</Badge>
              </>
            ) : null}
          </div>
          <p className="lede">
            {isOrg
              ? 'Organizasyondaki tüm ana süreçler. Bir sürece tıklayın; alt süreçler, faaliyetler, riskler ve kontroller katman katman açılır.'
              : root.description}
          </p>
          {!isOrg ? (
            <div className="row gap-3 wrap" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
              <span>Süreç sahibi: <strong style={{ color: 'var(--ink-800)' }}>{userName(root.ownerId)}</strong></span>
              <span>·</span>
              <span className="row gap-2">Olgunluk <Maturity level={roll.averageMaturity} /></span>
              <span>·</span>
              <span className={isReviewOverdue(root) ? 'status-red' : ''}>
                {isReviewOverdue(root)
                  ? `${monthsSince(root.lastReviewedAt)} aydır gözden geçirilmedi`
                  : `Sonraki gözden geçirme ${formatDate(root.nextReviewAt)}`}
              </span>
            </div>
          ) : null}
        </div>

        <Segmented<ProcessView>
          ariaLabel="Görünüm seçimi"
          value={effectiveView}
          onChange={setView}
          options={isOrg ? viewOptions.filter((v) => v.id !== 'flow') : viewOptions}
        />
      </div>

      <div className="grid cols-5" style={{ marginBottom: 'var(--s6)' }}>
        <div className="card card-pad"><Metric compact label="Alt süreç" value={roll.subprocessCount} sub={`${roll.activityCount} faaliyet · ${roll.stepCount} iş adımı`} /></div>
        <div className="card card-pad"><Metric compact label="Tanımlı risk" value={roll.riskIds.length} sub={`En yüksek artık: ${roll.maxResidualScore} (${riskLevelLabels[levelOf(roll.maxResidualScore)]})`} /></div>
        <div className="card card-pad"><Metric compact label="Kritik risk" value={roll.criticalRiskCount} tone={roll.criticalRiskCount ? 'alert' : 'default'} sub={`${roll.highRiskCount} yüksek risk`} /></div>
        <div className="card card-pad"><Metric compact label="Kontrol" value={roll.controlIds.length} sub={`${roll.ineffectiveControlCount} kontrol zayıf`} tone={roll.ineffectiveControlCount ? 'warn' : 'default'} /></div>
        <div className="card card-pad"><Metric compact label="Açık aksiyon" value={roll.openActionCount} tone={roll.overdueActionCount ? 'alert' : 'default'} sub={`${roll.overdueActionCount} gecikmiş`} /></div>
      </div>

      {effectiveView === 'map' ? (
        isOrg ? (
          <ProcessMap nodes={mainProcesses(data)} onOpen={(id) => navigate(`/surecler/${id}`)} />
        ) : (
          <ProcessMap
            nodes={data.nodes.filter((n) => n.parentId === root.id)}
            onOpen={(id) => {
              const target = data.nodes.find((n) => n.id === id);
              if (target && (target.kind === 'process' || target.kind === 'subprocess')) navigate(`/surecler/${id}`);
              else select('node', id);
            }}
          />
        )
      ) : null}

      {effectiveView === 'tree' && tree ? (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)' }}>
          <div className="card card-pad tree">
            <ProcessTree tree={tree} selectedId={selection.id} onSelect={(id) => select('node', id)} />
          </div>
          <EffectivenessSummary rootId={root.id} />
        </div>
      ) : null}

      {effectiveView === 'flow' ? (
        <FlowView rootId={root.id} selectedId={selection.id} onSelect={(id) => select('node', id)} />
      ) : null}

      {effectiveView === 'risk' ? <RiskView rootId={root.id} /> : null}
      {effectiveView === 'control' ? <ControlView rootId={root.id} /> : null}
      {effectiveView === 'management' ? (
        <div className="stack gap-5">
          <ManagementView rootId={root.id} onSelect={(id) => {
            const target = data.nodes.find((n) => n.id === id);
            if (target && (target.kind === 'process' || target.kind === 'subprocess')) navigate(`/surecler/${id}`);
            else select('node', id);
          }} />
          <div className="grid cols-3">
            <EffectivenessSummary rootId={root.id} />
          </div>
        </div>
      ) : null}

      <SelectionDrawer />
    </div>
  );
}
