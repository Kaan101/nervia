import { useMemo, useState } from 'react';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import { controlNatureLabels, nodeKindLabels, riskCategoryLabels } from '@/lib/labels';
import { score } from '@/lib/riskMath';
import { pathTo } from '@/lib/selectors';
import { normalize } from '@/lib/search';
import { userName } from '@/data/org';
import { Badge, EmptyState, Modal } from '@/components/common/Primitives';
import { IconCheck, IconSearch } from '@/components/common/Icons';

type Mode =
  | { kind: 'risk-controls'; riskId: string }
  | { kind: 'control-risks'; controlId: string }
  | { kind: 'risk-nodes'; riskId: string }
  | { kind: 'control-nodes'; controlId: string };

const titles: Record<Mode['kind'], { title: string; hint: string }> = {
  'risk-controls': {
    title: 'Bu riski azaltan kontroller',
    hint: 'Seçtiğiniz kontroller riskin azaltma zincirine girer ve artık risk yorumunu etkiler.',
  },
  'control-risks': {
    title: 'Bu kontrolün yönettiği riskler',
    hint: 'Bir kontrol birden fazla riski yönetebilir; bağ iki yönde de kurulur.',
  },
  'risk-nodes': {
    title: 'Riskin görüldüğü süreç adımları',
    hint: 'Risk, seçilen adımların risk görünümünde ve sayımlarında yer alır.',
  },
  'control-nodes': {
    title: 'Kontrolün uygulandığı süreç adımları',
    hint: 'Aynı kontrol birden fazla süreçte uygulanabilir.',
  },
};

interface LinkRow {
  id: string;
  title: string;
  meta: string;
  /** Bağ kurulu mu? */
  on: boolean;
  badge?: string;
}

/** Risk ↔ kontrol ve süreç adımı bağlarını kuran/kaldıran ekran. */
export function LinkEditorModal({
  open, onClose, mode,
}: { open: boolean; onClose: () => void; mode: Mode | null }) {
  const data = useData((s) => s.data);
  const linkRiskControl = useData((s) => s.linkRiskControl);
  const linkRiskNode = useData((s) => s.linkRiskNode);
  const linkControlNode = useData((s) => s.linkControlNode);
  const currentUser = useAuth((s) => s.currentUser);
  const [query, setQuery] = useState('');

  const rows = useMemo<LinkRow[]>(() => {
    if (!mode) return [];
    const q = normalize(query);
    const match = (text: string) => !q || normalize(text).includes(q);

    if (mode.kind === 'risk-controls') {
      const risk = data.risks.find((r) => r.id === mode.riskId);
      return data.controls
        .filter((c) => !c.archived && match(`${c.code} ${c.name} ${c.description}`))
        .map((c) => ({
          id: c.id,
          title: c.name,
          meta: `${c.code} · ${controlNatureLabels[c.nature]} · ${userName(c.ownerId)}`,
          on: Boolean(risk?.controlIds.includes(c.id)),
          badge: c.keyControl ? 'Kritik' : undefined,
        }));
    }
    if (mode.kind === 'control-risks') {
      const control = data.controls.find((c) => c.id === mode.controlId);
      return data.risks
        .filter((r) => !r.archived && match(`${r.code} ${r.name} ${r.description}`))
        .map((r) => ({
          id: r.id,
          title: r.name,
          meta: `${r.code} · ${riskCategoryLabels[r.category]} · artık skor ${score(r.residual)}`,
          on: Boolean(control?.riskIds.includes(r.id)),
        }));
    }
    const owner = mode.kind === 'risk-nodes'
      ? data.risks.find((r) => r.id === mode.riskId)?.processNodeIds ?? []
      : data.controls.find((c) => c.id === mode.controlId)?.processNodeIds ?? [];
    return data.nodes
      .filter((n) => n.kind !== 'organization' && match(`${n.code} ${n.name}`))
      .map((n) => ({
        id: n.id,
        title: n.name,
        meta: `${n.code} · ${nodeKindLabels[n.kind]} · ${pathTo(data.nodes, n.id).slice(1, -1).map((p) => p.name).join(' / ')}`,
        on: owner.includes(n.id),
      }));
  }, [data, mode, query]);

  if (!open || !mode || !currentUser) return null;

  const toggle = (id: string, on: boolean) => {
    if (mode.kind === 'risk-controls') linkRiskControl(mode.riskId, id, on, currentUser.id);
    else if (mode.kind === 'control-risks') linkRiskControl(id, mode.controlId, on, currentUser.id);
    else if (mode.kind === 'risk-nodes') linkRiskNode(mode.riskId, id, on, currentUser.id);
    else linkControlNode(mode.controlId, id, on, currentUser.id);
  };

  const selectedCount = rows.filter((r) => r.on).length;
  const { title, hint } = titles[mode.kind];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="row between gap-3">
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            Her bağ değişikliği anında kaydedilir ve audit trail’e yazılır.
          </span>
          <button className="btn btn-sm btn-primary" onClick={onClose}>Bitti</button>
        </div>
      }
    >
      <p className="muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--s4)' }}>{hint}</p>

      <div className="row between gap-3" style={{ marginBottom: 'var(--s3)' }}>
        <span className="input row gap-2" style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: 360 }}>
          <IconSearch size={14} className="dim" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ara…"
            style={{ border: 0, outline: 'none', background: 'none', width: '100%' }}
          />
        </span>
        <Badge tone="brand">{selectedCount} seçili</Badge>
      </div>

      <div className="stack gap-2" style={{ maxHeight: '48vh', overflowY: 'auto' }}>
        {rows.map((row) => (
          <button
            key={row.id}
            className="rel-control"
            onClick={() => toggle(row.id, !row.on)}
            style={{
              width: '100%', textAlign: 'left',
              borderColor: row.on ? 'var(--brand-400)' : undefined,
              background: row.on ? 'var(--brand-050)' : undefined,
            }}
            aria-pressed={row.on}
          >
            <span style={{
              width: 18, height: 18, borderRadius: 4, flex: '0 0 auto',
              border: `1px solid ${row.on ? 'var(--brand-600)' : 'var(--border-strong)'}`,
              background: row.on ? 'var(--brand-700)' : 'var(--surface)',
              display: 'grid', placeItems: 'center', color: '#fff',
            }}>
              {row.on ? <IconCheck size={12} /> : null}
            </span>
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{row.title}</span>
              <span className="dim truncate" style={{ fontSize: 'var(--text-2xs)' }}>{row.meta}</span>
            </span>
            {row.badge ? <Badge tone="brand">{row.badge}</Badge> : null}
          </button>
        ))}
        {!rows.length ? <EmptyState title="Eşleşen kayıt yok" /> : null}
      </div>
    </Modal>
  );
}

export type { Mode as LinkEditorMode };
