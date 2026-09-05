import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DocumentType, GrcDocument } from '@/types/grc';
import { useData } from '@/store/useData';
import { canCreateRecords, useAuth } from '@/store/useAuth';
import { DocumentFormModal } from '@/components/forms/DocumentForm';
import { documentTypeLabels } from '@/lib/labels';
import { daysBetween, formatDate } from '@/lib/riskMath';
import { userName } from '@/data/org';
import { Badge, EmptyState, Metric, Tabs } from '@/components/common/Primitives';
import { DocumentViewer } from '@/components/process/DetailPanel';
import { IconDoc, IconPlus, IconSearch } from '@/components/common/Icons';

export function DocumentsPage() {
  const data = useData((s) => s.data);
  const activeDocuments = useData((s) => s.activeDocuments);
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [type, setType] = useState<DocumentType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<GrcDocument | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const currentUser = useAuth((s) => s.currentUser);
  const canCreate = canCreateRecords(currentUser);
  const archivedCount = data.documents.filter((d) => d.archived).length;

  useEffect(() => {
    if (documentId) {
      const doc = data.documents.find((d) => d.id === documentId);
      if (doc) setOpen(doc);
    }
  }, [documentId, data.documents]);

  const rows = useMemo(() => {
    let list = showArchived ? data.documents.filter((d) => d.archived) : activeDocuments;
    if (type !== 'all') list = list.filter((d) => d.type === type);
    if (query.trim()) {
      const q = query.toLocaleLowerCase('tr-TR');
      list = list.filter((d) => `${d.code} ${d.name} ${d.summary}`.toLocaleLowerCase('tr-TR').includes(q));
    }
    return [...list].sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));
  }, [activeDocuments, data.documents, type, query, showArchived]);

  const expired = activeDocuments.filter((d) => d.status === 'expired');
  const dueSoon = activeDocuments.filter((d) => {
    const days = daysBetween(new Date('2026-09-04'), d.nextReviewAt);
    return days >= 0 && days <= 90;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Doküman Yönetimi</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Prosedür, politika ve talimatlar</h1>
          <p className="lede">
            Süreçlere bağlı tüm dokümanlar; versiyonu, sahibi, yayın tarihi ve bir sonraki gözden geçirme
            tarihiyle birlikte izlenir.
          </p>
        </div>
        <div className="row gap-2">
          {archivedCount ? (
            <button className="btn" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Aktif kayıtlar' : `Arşiv (${archivedCount})`}
            </button>
          ) : null}
          {canCreate ? (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus size={14} /> Yeni doküman
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Toplam doküman" value={activeDocuments.length} /></div>
        <div className="card card-pad"><Metric compact label="Gözden geçirmesi geçen" value={expired.length} tone={expired.length ? 'alert' : 'default'} /></div>
        <div className="card card-pad"><Metric compact label="90 gün içinde gözden geçirilecek" value={dueSoon.length} tone={dueSoon.length ? 'warn' : 'default'} /></div>
        <div className="card card-pad"><Metric compact label="Prosedür sayısı" value={activeDocuments.filter((d) => d.type === 'procedure').length} /></div>
      </div>

      <Tabs<DocumentType | 'all'>
        value={type}
        onChange={setType}
        tabs={[
          { id: 'all', label: 'Tümü', count: activeDocuments.length },
          ...(Object.keys(documentTypeLabels) as DocumentType[])
            .filter((t) => activeDocuments.some((d) => d.type === t))
            .map((t) => ({ id: t, label: documentTypeLabels[t], count: activeDocuments.filter((d) => d.type === t).length })),
        ]}
      />

      <div className="card" style={{ marginTop: 'var(--s5)' }}>
        <div className="card-head">
          <span className="input row gap-2" style={{ display: 'flex', alignItems: 'center', maxWidth: 320 }}>
            <IconSearch size={14} className="dim" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Doküman ara…"
              style={{ border: 0, outline: 'none', background: 'none', width: '100%' }} />
          </span>
          <span className="dim num" style={{ fontSize: 'var(--text-xs)' }}>{rows.length} doküman</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Kod</th><th>Doküman</th><th>Tür</th><th>Versiyon</th><th>Sahip</th>
                <th>Yayın</th><th>Son güncelleme</th><th>Sonraki gözden geçirme</th><th className="num">Bağlı süreç</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="clickable" onClick={() => navigate(`/dokumanlar/${d.id}`)}>
                  <td className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{d.code}</td>
                  <td style={{ maxWidth: 340 }}>
                    <div className="stack" style={{ gap: 2 }}>
                      <span style={{ fontWeight: 500 }}>{d.name}</span>
                      <span className="dim clamp-2" style={{ fontSize: 'var(--text-2xs)' }}>{d.summary}</span>
                    </div>
                  </td>
                  <td><Badge tone="brand">{documentTypeLabels[d.type]}</Badge></td>
                  <td className="mono">v{d.version}</td>
                  <td className="dim">{userName(d.ownerId)}</td>
                  <td className="dim">{formatDate(d.publishedAt)}</td>
                  <td className="dim">{formatDate(d.updatedAt)}</td>
                  <td className={d.status === 'expired' ? 'status-red' : 'dim'}>
                    {formatDate(d.nextReviewAt)}
                    {d.status === 'expired' ? <div style={{ fontSize: 'var(--text-2xs)' }}>gecikmiş</div> : null}
                  </td>
                  <td className="num">{d.processNodeIds.length}</td>
                  <td>
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(d); }}>
                      <IconDoc size={13} /> Gör
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? <EmptyState title="Doküman bulunamadı" /> : null}
      </div>

      {open ? (
        <DocumentViewer
          document={data.documents.find((d) => d.id === open.id) ?? open}
          onClose={() => { setOpen(null); if (documentId) navigate('/dokumanlar'); }}
        />
      ) : null}
      <DocumentFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(id) => {
          const created = data.documents.find((d) => d.id === id);
          if (created) setOpen(created);
        }}
      />
    </div>
  );
}
