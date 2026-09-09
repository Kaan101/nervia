import { useMemo, useState } from 'react';
import type { ProcessNode } from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth, canEditNode } from '@/store/useAuth';
import { nodeKindLabels, nodeKindPlurals, processStatusLabels } from '@/lib/labels';
import { childKindOf } from '@/lib/entityMeta';
import { pathTo } from '@/lib/selectors';
import { userName } from '@/data/org';
import { Badge, EmptyState, Modal } from '@/components/common/Primitives';
import { TextArea } from './Fields';
import {
  IconArrowDown, IconChevronRight, IconLayers, IconPlus, IconSettings,
} from '@/components/common/Icons';

/**
 * Süreç yapısı düzenleyicisi.
 * Bir düğümün üst süreçteki yerini, kardeşleri arasındaki sırasını ve
 * altındaki düğümleri yönetir.
 */
export function NodeStructurePanel({
  node, onAddChild, onAddSibling, onEditNode, onSelectNode,
}: {
  node: ProcessNode;
  onAddChild: () => void;
  /** Aynı seviyeye yeni kayıt ekler (üst düğümün altına). */
  onAddSibling: () => void;
  onEditNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}) {
  const data = useData((s) => s.data);
  const reorderNode = useData((s) => s.reorderNode);
  const currentUser = useAuth((s) => s.currentUser);
  const [moving, setMoving] = useState(false);

  const editable = canEditNode(currentUser, node);
  const parent = node.parentId ? data.nodes.find((n) => n.id === node.parentId) : undefined;
  const siblings = data.nodes
    .filter((n) => n.parentId === node.parentId)
    .sort((a, b) => a.order - b.order);
  const index = siblings.findIndex((n) => n.id === node.id);
  const children = data.nodes
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => a.order - b.order);
  const childKind = childKindOf(node.kind);

  return (
    <div className="stack gap-6">
      {/* Üst süreç */}
      <div>
        <div className="sh"><span>Üst süreç</span><span className="line" /></div>
        {parent ? (
          <div className="rel-control">
            <IconLayers size={15} className="dim" />
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <button
                onClick={() => onSelectNode(parent.id)}
                style={{ border: 0, background: 'none', padding: 0, font: 'inherit', textAlign: 'left', fontWeight: 500, cursor: 'pointer' }}
              >
                {parent.name}
              </button>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                {pathTo(data.nodes, parent.id).map((p) => p.name).join(' / ')}
              </span>
            </span>
            {editable ? (
              <button className="btn btn-sm" onClick={() => setMoving(true)}>Taşı</button>
            ) : null}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>Bu kayıt hiyerarşinin kökü.</p>
        )}
      </div>

      {/* Kardeşler arası sıra */}
      {parent ? (
        <div>
          <div className="sh">
            <span>Akıştaki sırası</span>
            <span className="n">{index + 1} / {siblings.length}</span>
            <span className="line" />
          </div>
          <div className="stack gap-2">
            {siblings.map((s, i) => (
              <div
                key={s.id}
                className="rel-control"
                style={s.id === node.id
                  ? { borderColor: 'var(--brand-400)', background: 'var(--brand-050)' }
                  : undefined}
              >
                <span className="num dim" style={{ width: 20, fontSize: 'var(--text-xs)' }}>{i + 1}</span>
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: s.id === node.id ? 600 : 400 }}>
                    {s.name}
                  </span>
                  <span className="dim mono" style={{ fontSize: 'var(--text-2xs)' }}>{s.code}</span>
                </span>
                {s.id === node.id && editable ? (
                  <span className="row gap-1">
                    <button
                      className="btn btn-sm btn-icon" title="Yukarı taşı" disabled={i === 0}
                      onClick={() => reorderNode(node.id, 'up', currentUser!.id)}
                    >
                      <IconArrowDown size={13} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <button
                      className="btn btn-sm btn-icon" title="Aşağı taşı" disabled={i === siblings.length - 1}
                      onClick={() => reorderNode(node.id, 'down', currentUser!.id)}
                    >
                      <IconArrowDown size={13} />
                    </button>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {editable ? (
            <button className="btn" style={{ marginTop: 'var(--s3)' }} onClick={onAddSibling}>
              <IconPlus size={14} /> Bu seviyeye {nodeKindLabels[node.kind].toLocaleLowerCase('tr-TR')} ekle
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Alt düğümler */}
      <div>
        <div className="sh">
          <span>{childKind ? nodeKindPlurals[childKind] : 'Alt kayıtlar'}</span>
          <span className="n">{children.length}</span>
          <span className="line" />
        </div>
        {children.length ? (
          <div className="stack gap-2">
            {children.map((c, i) => (
              <div className="rel-control" key={c.id}>
                <span className="num dim" style={{ width: 20, fontSize: 'var(--text-xs)' }}>{i + 1}</span>
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <button
                    onClick={() => onSelectNode(c.id)}
                    className="truncate"
                    style={{ border: 0, background: 'none', padding: 0, font: 'inherit', textAlign: 'left', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {c.name}
                  </button>
                  <span className="row gap-2 dim" style={{ fontSize: 'var(--text-2xs)' }}>
                    <span className="mono">{c.code}</span>
                    <span>·</span>
                    <span>{userName(c.ownerId)}</span>
                    {c.status !== 'active' ? (
                      <Badge tone="plain">{processStatusLabels[c.status]}</Badge>
                    ) : null}
                  </span>
                </span>
                {editable ? (
                  <button className="btn btn-sm btn-icon" title="Düzenle" onClick={() => onEditNode(c.id)}>
                    <IconSettings size={13} />
                  </button>
                ) : null}
                <IconChevronRight size={14} className="dim" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={childKind ? `Tanımlı ${nodeKindLabels[childKind].toLocaleLowerCase('tr-TR')} yok` : 'Alt kayıt yok'}
          />
        )}

        {editable && childKind ? (
          <button className="btn btn-primary" style={{ marginTop: 'var(--s3)' }} onClick={onAddChild}>
            <IconPlus size={14} /> {nodeKindLabels[childKind]} ekle
          </button>
        ) : null}
      </div>

      <MoveNodeModal open={moving} onClose={() => setMoving(false)} node={node} />
    </div>
  );
}

/** Düğümü başka bir üst düğümün altına taşır. */
function MoveNodeModal({
  open, onClose, node,
}: { open: boolean; onClose: () => void; node: ProcessNode }) {
  const data = useData((s) => s.data);
  const moveNode = useData((s) => s.moveNode);
  const currentUser = useAuth((s) => s.currentUser);
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');

  /** Geçerli hedefler: aynı türde çocuk kabul eden ve kendi alt ağacında olmayan düğümler. */
  const candidates = useMemo(() => {
    const descendants = new Set<string>();
    const collect = (id: string) => {
      for (const n of data.nodes.filter((x) => x.parentId === id)) {
        descendants.add(n.id);
        collect(n.id);
      }
    };
    collect(node.id);
    return data.nodes.filter(
      (n) => childKindOf(n.kind) === node.kind && n.id !== node.id && n.id !== node.parentId && !descendants.has(n.id),
    );
  }, [data.nodes, node]);

  if (!open || !currentUser) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`“${node.name}” kaydını taşı`}
      footer={
        <div className="row between gap-3">
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            Taşıma, altındaki tüm kayıtları birlikte götürür.
          </span>
          <span className="row gap-2">
            <button className="btn btn-sm" onClick={onClose}>Vazgeç</button>
            <button
              className="btn btn-sm btn-primary"
              disabled={!target || !reason.trim()}
              onClick={() => { moveNode(node.id, target, currentUser.id, reason.trim()); onClose(); }}
            >
              Taşı
            </button>
          </span>
        </div>
      }
    >
      {candidates.length ? (
        <div className="stack gap-4">
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Yalnızca bu türde kayıt alabilen ve kendi alt ağacında olmayan süreçler listelenir.
          </p>
          <div className="stack gap-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
            {candidates.map((c) => (
              <button
                key={c.id}
                className="rel-control"
                onClick={() => setTarget(c.id)}
                style={target === c.id
                  ? { borderColor: 'var(--brand-400)', background: 'var(--brand-050)', width: '100%', textAlign: 'left' }
                  : { width: '100%', textAlign: 'left' }}
                aria-pressed={target === c.id}
              >
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{c.name}</span>
                  <span className="dim truncate" style={{ fontSize: 'var(--text-2xs)' }}>
                    {c.code} · {nodeKindLabels[c.kind]} · {pathTo(data.nodes, c.id).slice(0, -1).map((p) => p.name).join(' / ')}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <TextArea
            label="Taşıma gerekçesi" required value={reason} rows={2}
            placeholder="Örn. Süreç sahipliği Mali İşler’e devredildi."
            onChange={setReason}
          />
        </div>
      ) : (
        <EmptyState
          title="Uygun hedef yok"
          hint="Bu kaydı alabilecek başka bir üst süreç bulunmuyor."
        />
      )}
    </Modal>
  );
}
