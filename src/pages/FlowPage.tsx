import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { flowCharts } from '@/data/flows/hasar-akis';
import type { FlowChart, FlowNode, FlowNodeKind } from '@/types/flow';
import { FlowDiagram } from '@/components/process/FlowDiagram';
import { AttachmentList } from '@/components/forms/AttachmentInput';
import { Badge, EmptyState, ScoreChip, SectionHeading } from '@/components/common/Primitives';
import {
  IconArrowRight, IconChevronRight, IconControl, IconDoc, IconProcess, IconRisk,
} from '@/components/common/Icons';
import { activeNodes } from '@/lib/selectors';

/**
 * HASAR İŞ AKIŞI
 *
 * Süreç haritası "ne var" sorusunu, iş akışı "sonra ne oluyor" sorusunu
 * cevaplar. Bu ekran ikincisi: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0
 * Bölüm 9'daki şemaları tek ekranda, tıklanabilir olarak gösterir.
 *
 * Bir adıma tıklandığında sağdaki panel o adımın dokümandaki dayanağını,
 * bağlı süreç düğümünü ve o düğümün risk/kontrollerini açar — böylece
 * akış ile kontrol ortamı aynı ekranda birleşir.
 */

const kindLabels: Record<FlowNodeKind, string> = {
  start: 'Başlangıç',
  task: 'İş adımı',
  decision: 'Karar',
  system: 'Sistem adımı',
  actor: 'Taraf',
  handoff: 'Devir',
  end: 'Bitiş',
};

export function DocumentFlowView() {
  const [chartId, setChartId] = useState(flowCharts[0].id);
  const chart = flowCharts.find((c) => c.id === chartId) ?? flowCharts[0];
  const [stageId, setStageId] = useState(chart.stages[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Geniş şemalar (Araştırma 11 sütun) tek ekrana sığmıyor; ölçek kullanıcıda.
  const [zoom, setZoom] = useState(1);

  const stage = chart.stages.find((s) => s.id === stageId) ?? chart.stages[0];
  const selected = stage.nodes.find((n) => n.id === selectedId) ?? null;

  const pickChart = (c: FlowChart) => {
    setChartId(c.id);
    setStageId(c.stages[0].id);
    setSelectedId(null);
  };

  const totals = useMemo(() => ({
    stages: chart.stages.length,
    steps: chart.stages.reduce((n, s) => n + s.nodes.length, 0),
    decisions: chart.stages.reduce(
      (n, s) => n + s.nodes.filter((x) => x.kind === 'decision').length, 0,
    ),
  }), [chart]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack gap-1">
          <span className="eyebrow">İş Akışı</span>
          <h1>{chart.name}</h1>
          <p className="muted" style={{ maxWidth: '96ch' }}>
            {chart.description}{' '}
            <span className="dim">
              Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024), Bölüm 9 – İş Akışları ·
              {' '}{totals.stages} aşama, {totals.steps} adım, {totals.decisions} karar noktası.
            </span>
          </p>
        </div>
      </div>

      <div className="row gap-2 wrap flow-variants">
        {flowCharts.map((c) => (
          <button
            key={c.id}
            className={`btn flow-variant${c.id === chart.id ? ' is-active' : ''}`}
            onClick={() => pickChart(c)}
          >
            <IconProcess size={14} /> {c.name}
          </button>
        ))}
      </div>

      <div className="flow-stages" role="tablist" aria-label="Akış aşamaları">
        {chart.stages.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === stage.id}
            className={`flow-stage${s.id === stage.id ? ' is-active' : ''}`}
            onClick={() => { setStageId(s.id); setSelectedId(null); }}
          >
            <span className="flow-stage-no">{i + 1}</span>
            <span className="flow-stage-name">{s.name}</span>
            {i < chart.stages.length - 1 ? (
              <IconChevronRight size={13} className="flow-stage-sep dim" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flow-body">
        <div className="card flow-canvas">
          <div className="stack gap-2" style={{ padding: 'var(--s4) var(--s4) 0' }}>
            <div className="row gap-2 between wrap">
              <strong>{stage.name}</strong>
              <span className="row gap-3" style={{ alignItems: 'center' }}>
                <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{stage.source}</span>
                <span className="row gap-1 flow-zoom" role="group" aria-label="Şema ölçeği">
                  {[0.6, 0.8, 1].map((z) => (
                    <button
                      key={z}
                      className={`btn btn-sm${zoom === z ? ' is-active' : ''}`}
                      onClick={() => setZoom(z)}
                      aria-pressed={zoom === z}
                    >
                      %{Math.round(z * 100)}
                    </button>
                  ))}
                </span>
              </span>
            </div>
            <p className="muted" style={{ fontSize: 'var(--text-sm)', maxWidth: '90ch' }}>
              {stage.summary}
            </p>
          </div>
          <FlowDiagram stage={stage} selectedId={selectedId} onSelect={setSelectedId} zoom={zoom} />
          <FlowLegend />
        </div>

        <aside className="card flow-inspector">
          {selected ? <StepDetail node={selected} /> : (
            <EmptyState
              icon={<IconArrowRight size={26} />}
              title="Bir adım seçin"
              hint="Şemadaki kutuya tıklayın; dokümandaki dayanağı, bağlı süreç adımı ve o adımın riskleri burada açılır."
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function FlowLegend() {
  const shown: FlowNodeKind[] = ['start', 'task', 'system', 'decision', 'actor', 'handoff', 'end'];
  return (
    <div className="flow-legend">
      {shown.map((k) => (
        <span key={k} className="flow-legend-item">
          <span className={`flow-swatch kind-${k}`} />
          {kindLabels[k]}
        </span>
      ))}
      <span className="flow-legend-item dim">● işaretli kutularda doküman dayanağı vardır</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Adım detayı                                                         */
/* ------------------------------------------------------------------ */

function StepDetail({ node }: { node: FlowNode }) {
  const data = useData((s) => s.data);
  const select = useUi((s) => s.select);
  const navigate = useNavigate();

  const processNode = node.nodeCode
    ? activeNodes(data.nodes).find((n) => n.code === node.nodeCode)
    : undefined;

  const risks = processNode
    ? data.risks.filter((r) => !r.archived && processNode.riskIds.includes(r.id))
    : [];
  const controls = processNode
    ? data.controls.filter((c) => !c.archived && processNode.controlIds.includes(c.id))
    : [];
  const documents = processNode
    ? data.documents.filter((d) => !d.archived && processNode.documentIds.includes(d.id))
    : [];

  return (
    <div className="stack gap-4">
      <div className="stack gap-2">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone="plain">{kindLabels[node.kind]}</Badge>
          {node.source ? <Badge tone="brand">{node.source}</Badge> : null}
        </div>
        <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{node.label}</h2>
        {node.note ? (
          <div className="callout">
            <span>{node.note}</span>
          </div>
        ) : null}
      </div>

      {processNode ? (
        <div className="detail-section">
          <SectionHeading title="Bağlı süreç adımı" />
          <button className="rel-control" onClick={() => navigate(`/surecler/${processNode.id}`)}>
            <IconProcess size={15} className="dim" />
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                {processNode.name}
              </span>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                Süreç haritasında aç · {processNode.code}
              </span>
            </span>
            <IconChevronRight size={14} className="dim" />
          </button>
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          Bu kutu bir taraf ya da bağlantı noktasıdır; süreç haritasında karşılığı olan bir adım
          değildir.
        </p>
      )}

      {risks.length ? (
        <div className="detail-section">
          <SectionHeading title="Bu adımdaki riskler" count={risks.length} />
          <div className="stack gap-2">
            {risks.map((r) => (
              <button key={r.id} className="rel-control" onClick={() => select('risk', r.id)}>
                <IconRisk size={15} className="dim" />
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{r.name}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{r.code}</span>
                </span>
                <ScoreChip assessment={r.residual} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {controls.length ? (
        <div className="detail-section">
          <SectionHeading title="Bu adımdaki kontroller" count={controls.length} />
          <div className="stack gap-2">
            {controls.map((c) => (
              <button key={c.id} className="rel-control" onClick={() => select('control', c.id)}>
                <IconControl size={15} className="dim" />
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{c.name}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{c.code}</span>
                </span>
                {c.keyControl ? <Badge tone="brand">Kritik</Badge> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {documents.length ? (
        <div className="detail-section">
          <SectionHeading title="Dayanak dokümanlar" count={documents.length} />
          <div className="stack gap-2">
            {documents.map((d) => (
              <button key={d.id} className="rel-control" onClick={() => navigate(`/dokumanlar/${d.id}`)}>
                <IconDoc size={15} className="dim" />
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{d.name}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{d.code} · v{d.version}</span>
                </span>
              </button>
            ))}
            {documents.some((d) => d.attachments?.length) ? (
              <AttachmentList items={documents.flatMap((d) => d.attachments ?? [])} />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
