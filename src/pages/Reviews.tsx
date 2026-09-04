import { useMemo, useState } from 'react';
import { useData } from '@/store/useData';
import { useAuth, canEditNode } from '@/store/useAuth';
import { useUi } from '@/store/useUi';
import { rollup } from '@/lib/selectors';
import { daysBetween, formatDate, isReviewOverdue, monthsSince } from '@/lib/riskMath';
import { nodeKindLabels } from '@/lib/labels';
import { userName } from '@/data/org';
import { Badge, EmptyState, Metric, Tabs } from '@/components/common/Primitives';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { IconCheck, IconClock } from '@/components/common/Icons';

type Bucket = 'overdue' | 'soon' | 'ok' | 'all';

export function ReviewsPage() {
  const data = useData((s) => s.data);
  const markReviewed = useData((s) => s.markReviewed);
  const currentUser = useAuth((s) => s.currentUser);
  const select = useUi((s) => s.select);
  const [bucket, setBucket] = useState<Bucket>('overdue');

  const reviewable = useMemo(
    () => data.nodes.filter((n) => n.kind === 'process' || n.kind === 'subprocess' || n.kind === 'activity'),
    [data],
  );

  const overdue = reviewable.filter(isReviewOverdue);
  const soon = reviewable.filter((n) => {
    const d = daysBetween(new Date('2026-09-04'), n.nextReviewAt);
    return d >= 0 && d <= 90;
  });
  const ok = reviewable.filter((n) => !isReviewOverdue(n) && daysBetween(new Date('2026-09-04'), n.nextReviewAt) > 90);

  const rows = bucket === 'overdue' ? overdue : bucket === 'soon' ? soon : bucket === 'ok' ? ok : reviewable;
  const sorted = [...rows].sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Periyodik Gözden Geçirme</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Süreçler unutulmasın</h1>
          <p className="lede">
            Her süreç için gözden geçirme periyodu tanımlıdır. Sistem, tarihi gelen ve geçen süreçleri
            otomatik olarak işaretler; süreç sahibi gözden geçirmeyi tamamladığında yeni tarih hesaplanır.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="İzlenen süreç" value={reviewable.length} /></div>
        <div className="card card-pad"><Metric compact label="Tarihi geçen" value={overdue.length} tone={overdue.length ? 'alert' : 'default'} /></div>
        <div className="card card-pad"><Metric compact label="90 gün içinde" value={soon.length} tone={soon.length ? 'warn' : 'default'} /></div>
        <div className="card card-pad">
          <Metric compact label="Ortalama gecikme"
            value={overdue.length ? `${Math.round(overdue.reduce((s, n) => s + daysBetween(n.nextReviewAt), 0) / overdue.length)} gün` : '—'} />
        </div>
      </div>

      <Tabs<Bucket>
        value={bucket}
        onChange={setBucket}
        tabs={[
          { id: 'overdue', label: 'Tarihi geçen', count: overdue.length },
          { id: 'soon', label: 'Yaklaşan', count: soon.length },
          { id: 'ok', label: 'Güncel', count: ok.length },
          { id: 'all', label: 'Tümü', count: reviewable.length },
        ]}
      />

      <div className="card" style={{ marginTop: 'var(--s5)' }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Süreç</th><th>Seviye</th><th>Süreç sahibi</th><th>Son gözden geçirme</th>
                <th>Sonraki tarih</th><th>Periyot</th><th className="num">Risk</th><th className="num">Kontrol</th>
                <th>Durum</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((n) => {
                const roll = rollup(data, n.id);
                const late = isReviewOverdue(n);
                const editable = canEditNode(currentUser, n);
                return (
                  <tr key={n.id} className="clickable" onClick={() => select('node', n.id)}>
                    <td>
                      <div className="stack" style={{ gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>{n.name}</span>
                        <span className="dim mono" style={{ fontSize: 'var(--text-2xs)' }}>{n.code} · v{n.version}</span>
                      </div>
                    </td>
                    <td className="dim">{nodeKindLabels[n.kind]}</td>
                    <td className="dim">{userName(n.ownerId)}</td>
                    <td className="dim">
                      {formatDate(n.lastReviewedAt)}
                      <div style={{ fontSize: 'var(--text-2xs)' }}>{monthsSince(n.lastReviewedAt)} ay önce</div>
                    </td>
                    <td className={late ? 'status-red' : 'dim'}>{formatDate(n.nextReviewAt)}</td>
                    <td className="dim num">{n.reviewFrequencyMonths} ay</td>
                    <td className="num">{roll.riskIds.length}</td>
                    <td className="num">{roll.controlIds.length}</td>
                    <td>
                      {late ? (
                        <Badge level="high" title={`Bu süreç ${monthsSince(n.lastReviewedAt)} aydır gözden geçirilmedi.`}>
                          <IconClock size={11} /> {monthsSince(n.lastReviewedAt)} aydır gözden geçirilmedi
                        </Badge>
                      ) : daysBetween(new Date('2026-09-04'), n.nextReviewAt) <= 90 ? (
                        <Badge level="medium">Yaklaşıyor</Badge>
                      ) : (
                        <Badge level="low">Güncel</Badge>
                      )}
                    </td>
                    <td>
                      {editable ? (
                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); markReviewed(n.id, currentUser!.id); }}>
                          <IconCheck size={13} /> Tamamlandı
                        </button>
                      ) : (
                        <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>Yetki yok</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!sorted.length ? <EmptyState title="Bu kategoride süreç yok" /> : null}
      </div>

      <SelectionDrawer />
    </div>
  );
}
