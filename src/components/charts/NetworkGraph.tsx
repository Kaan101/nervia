import { useMemo, useState } from 'react';
import type { Dataset } from '@/types/grc';
import { riskLevel } from '@/lib/riskMath';
import { controlNatureLabels, riskLevelLabels } from '@/lib/labels';
import { levelMark } from './Charts';
import { userName } from '@/data/org';

export type GraphNodeKind = 'process' | 'step' | 'risk' | 'control' | 'owner' | 'action';

interface GNode {
  id: string; label: string; sub: string; kind: GraphNodeKind;
  column: number; x: number; y: number; r: number; color: string;
}
interface GLink { source: string; target: string }

const columns: { kind: GraphNodeKind; title: string }[] = [
  { kind: 'process', title: 'Süreç adımı' },
  { kind: 'risk', title: 'Risk' },
  { kind: 'control', title: 'Kontrol' },
  { kind: 'owner', title: 'Sorumlu' },
  { kind: 'action', title: 'Aksiyon' },
];

const kindColor: Record<GraphNodeKind, string> = {
  process: 'var(--brand-700)',
  step: 'var(--brand-400)',
  risk: 'var(--risk-high-mark)',
  control: 'var(--brand-500)',
  owner: 'var(--ink-400)',
  action: 'var(--risk-medium-mark)',
};

const kindRadius: Record<GraphNodeKind, number> = {
  process: 11, step: 8, risk: 10, control: 9, owner: 7, action: 7,
};

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Süreç → Risk → Kontrol → Sorumlu → Aksiyon bağlantı grafiği.
 *
 * Katmanlı (soldan sağa) yerleşim kullanır: her sütun modeldeki bir seviyeye
 * karşılık gelir, böylece grafik okunduğu gibi anlaşılır. Yerleşim
 * deterministiktir — fizik simülasyonu yoktur, aynı veri hep aynı görünümü verir.
 */
export function NetworkGraph({
  data, rootNodeId, onSelect,
}: {
  data: Dataset;
  rootNodeId: string;
  onSelect?: (kind: GraphNodeKind, id: string) => void;
  height?: number;
}) {
  const [focus, setFocus] = useState<string | null>(null);

  const { nodes, links, width, height: svgHeight } = useMemo(() => {
    const root = data.nodes.find((n) => n.id === rootNodeId);
    if (!root) return { nodes: [] as GNode[], links: [] as GLink[], width: 900, height: 320 };

    const buckets: GNode[][] = [[], [], [], [], []];
    const linkList: GLink[] = [];
    const seen = new Map<string, GNode>();

    const add = (
      id: string, label: string, sub: string, kind: GraphNodeKind, column: number, color?: string,
    ) => {
      const existing = seen.get(id);
      if (existing) return existing;
      const node: GNode = {
        id, label, sub, kind, column, x: 0, y: 0,
        r: kindRadius[kind], color: color ?? kindColor[kind],
      };
      seen.set(id, node);
      buckets[column].push(node);
      return node;
    };
    const link = (a: string, b: string) => linkList.push({ source: a, target: b });

    add(root.id, root.name, root.code, 'process', 0);

    const risks = root.riskIds.map((id) => data.risks.find((r) => r.id === id)!).filter(Boolean);
    for (const risk of risks) {
      const level = riskLevel(risk.residual);
      add(risk.id, risk.name, `${risk.code} · ${riskLevelLabels[level]}`, 'risk', 1, levelMark[level]);
      link(root.id, risk.id);
    }

    const controls = root.controlIds.map((id) => data.controls.find((c) => c.id === id)!).filter(Boolean);
    for (const control of controls) {
      add(control.id, control.name, `${control.code} · ${controlNatureLabels[control.nature]}`, 'control', 2);
      const linked = control.riskIds.filter((rid) => seen.has(rid));
      if (linked.length === 0) link(root.id, control.id);
      for (const rid of linked) link(rid, control.id);

      const ownerId = `own-${control.ownerId}`;
      add(ownerId, userName(control.ownerId), 'Kontrol sahibi', 'owner', 3);
      link(control.id, ownerId);
    }

    for (const risk of risks) {
      for (const aid of risk.actionIds) {
        const action = data.actions.find((a) => a.id === aid);
        if (!action) continue;
        add(action.id, action.title, `${action.code} · %${action.progress}`, 'action', 4);
        link(risk.id, action.id);
      }
    }

    const filled = buckets.filter((b) => b.length > 0);
    const rowHeight = 62;
    const tallest = Math.max(1, ...filled.map((b) => b.length));
    const h = Math.max(280, tallest * rowHeight + 96);
    const w = 940;
    const colGap = w / (columns.length + 0.4);

    buckets.forEach((bucket, columnIndex) => {
      bucket.forEach((n, i) => {
        n.x = colGap * (columnIndex + 0.7);
        n.y = 62 + ((i + 0.5) * (h - 78)) / bucket.length;
      });
    });

    return { nodes: [...seen.values()], links: linkList, width: w, height: h };
  }, [data, rootNodeId]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const connected = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const l of links) {
      if (l.source === focus) set.add(l.target);
      if (l.target === focus) set.add(l.source);
    }
    return set;
  }, [focus, links]);

  if (!nodes.length) return null;

  const colGap = width / (columns.length + 0.4);
  const usedColumns = columns.filter((_, i) => nodes.some((n) => n.column === i));

  return (
    <div className="stack gap-3">
      <svg
        className="network" viewBox={`0 0 ${width} ${svgHeight}`} width="100%" height={svgHeight}
        preserveAspectRatio="xMidYMid meet"
        role="img" aria-label="Süreç adımı, riskler, kontroller, sorumlular ve aksiyonlar arasındaki bağlantılar"
        onMouseLeave={() => setFocus(null)}
      >
        {/* Sütun başlıkları */}
        {columns.map((c, i) => (
          nodes.some((n) => n.column === i) ? (
            <text key={c.kind} x={colGap * (i + 0.7)} y={28} textAnchor="middle"
              fontSize={10} fontWeight={600} letterSpacing="0.09em" fill="var(--ink-400)">
              {c.title.toLocaleUpperCase('tr-TR')}
            </text>
          ) : null
        ))}
        <line x1={0} x2={width} y1={40} y2={40} stroke="var(--border)" strokeWidth={1} />

        <g>
          {links.map((l, i) => {
            const a = nodeById.get(l.source);
            const b = nodeById.get(l.target);
            if (!a || !b) return null;
            const active = connected ? (l.source === focus || l.target === focus) : false;
            const dim = Boolean(connected) && !active;
            const mid = (a.x + b.x) / 2;
            const curve = `M${a.x + a.r},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x - b.r},${b.y}`;
            return <path key={i} d={curve} className={`link ${active ? 'active' : ''} ${dim ? 'dim' : ''}`} fill="none" />;
          })}
        </g>

        <g>
          {nodes.map((n) => {
            const dim = Boolean(connected) && !connected!.has(n.id);
            const isFocus = focus === n.id;
            return (
              <g key={n.id} className={`node ${dim ? 'dim' : ''}`}
                onMouseEnter={() => setFocus(n.id)}
                onClick={() => onSelect?.(n.kind, n.id)}
                style={{ cursor: 'pointer' }}>
                <circle cx={n.x} cy={n.y} r={isFocus ? n.r + 3 : n.r}
                  fill={n.color} stroke="var(--surface)" strokeWidth={2} />
                <title>{`${n.label} — ${n.sub}`}</title>
                <text x={n.x} y={n.y + n.r + 13} textAnchor="middle" fontWeight={500}>
                  {truncate(n.label, isFocus ? 40 : 24)}
                </text>
                <text x={n.x} y={n.y + n.r + 24} textAnchor="middle" fontSize={8.5} fill="var(--ink-400)">
                  {truncate(n.sub, 28)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <ul className="row wrap gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {usedColumns.map((c) => (
          <li key={c.kind} className="row gap-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-600)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: kindColor[c.kind] }} />
            {c.kind === 'risk' ? 'Risk (renk = seviye)' : c.title}
          </li>
        ))}
        <li className="dim" style={{ fontSize: 'var(--text-xs)' }}>
          Bir düğümün üzerine gelin — yalnızca ona bağlı öğeler vurgulanır.
        </li>
      </ul>
    </div>
  );
}
