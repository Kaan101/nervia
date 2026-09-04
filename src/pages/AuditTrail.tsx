import { useMemo, useState } from 'react';
import type { AuditAction, EntityType } from '@/types/grc';
import { useData } from '@/store/useData';
import { auditActionLabels, entityTypeLabels } from '@/lib/labels';
import { formatDateTime, relativeTime } from '@/lib/riskMath';
import { userById, userName } from '@/data/org';
import { Avatar, Badge, EmptyState, Metric } from '@/components/common/Primitives';
import { IconSearch } from '@/components/common/Icons';

export function AuditTrailPage() {
  const data = useData((s) => s.data);
  const [entity, setEntity] = useState<EntityType | ''>('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [actor, setActor] = useState('');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    let list = data.auditTrail;
    if (entity) list = list.filter((e) => e.entityType === entity);
    if (action) list = list.filter((e) => e.action === action);
    if (actor) list = list.filter((e) => e.userId === actor);
    if (query.trim()) {
      const q = query.toLocaleLowerCase('tr-TR');
      list = list.filter((e) => `${e.entityName} ${e.summary} ${e.reason ?? ''}`.toLocaleLowerCase('tr-TR').includes(q));
    }
    return list;
  }, [data.auditTrail, entity, action, actor, query]);

  const actors = useMemo(() => [...new Set(data.auditTrail.map((e) => e.userId))], [data.auditTrail]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Audit Trail</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Değişikliklerin tam izi</h1>
          <p className="lede">
            Sistemde yapılan her değişiklik; kim, ne zaman, neyi değiştirdi, eski değer neydi, yeni değer nedir
            ve neden değiştirildi bilgileriyle kalıcı olarak saklanır.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Toplam kayıt" value={data.auditTrail.length} /></div>
        <div className="card card-pad"><Metric compact label="Güncelleme" value={data.auditTrail.filter((e) => e.action === 'update').length} /></div>
        <div className="card card-pad"><Metric compact label="Onay / ret" value={data.auditTrail.filter((e) => e.action === 'approve' || e.action === 'reject').length} /></div>
        <div className="card card-pad"><Metric compact label="Gözden geçirme" value={data.auditTrail.filter((e) => e.action === 'review').length} /></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 'var(--s5)' }}>
        <div className="row gap-3 wrap">
          <span className="input row gap-2" style={{ display: 'flex', alignItems: 'center', maxWidth: 300 }}>
            <IconSearch size={14} className="dim" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kayıtlarda ara…"
              style={{ border: 0, outline: 'none', background: 'none', width: '100%' }} />
          </span>
          <select className="select" style={{ width: 'auto' }} value={entity} onChange={(e) => setEntity(e.target.value as EntityType | '')}>
            <option value="">Tüm kayıt türleri</option>
            {Object.entries(entityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')}>
            <option value="">Tüm işlemler</option>
            {Object.entries(auditActionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={actor} onChange={(e) => setActor(e.target.value)}>
            <option value="">Tüm kullanıcılar</option>
            {actors.map((id) => <option key={id} value={id}>{userName(id)}</option>)}
          </select>
          <span className="spacer" />
          <span className="dim num" style={{ fontSize: 'var(--text-xs)', alignSelf: 'center' }}>{rows.length} kayıt</span>
        </div>
      </div>

      <div className="card card-pad">
        {rows.length ? (
          <div className="timeline">
            {rows.slice(0, 200).map((entry) => (
              <div className={`timeline-item ${entry.action}`} key={entry.id}>
                <span className="bullet" />
                <div className="stack gap-2">
                  <div className="row gap-2 wrap items-baseline">
                    <Avatar user={userById.get(entry.userId)} size="sm" />
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{userName(entry.userId)}</strong>
                    <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{auditActionLabels[entry.action].toLocaleLowerCase('tr-TR')}</span>
                    <Badge tone="plain">{entityTypeLabels[entry.entityType]}</Badge>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{entry.entityName}</span>
                    <span className="spacer" />
                    <span className="dim" style={{ fontSize: 'var(--text-2xs)' }} title={formatDateTime(entry.at)}>
                      {relativeTime(entry.at)}
                    </span>
                  </div>

                  <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{entry.summary}</p>

                  {entry.changes?.length ? (
                    <div className="change-diff">
                      {entry.changes.map((c) => (
                        <div className="change-row" key={c.field}>
                          <span className="dim">{c.label}</span>
                          <span>
                            <span className="old">{c.oldValue}</span>
                            <span className="arrow">→</span>
                            <span className="new">{c.newValue}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {entry.reason ? (
                    <div className="callout" style={{ padding: 'var(--s2) var(--s3)' }}>
                      <span style={{ fontSize: 'var(--text-xs)' }}>
                        <strong>Gerekçe: </strong>{entry.reason}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Kriterlere uyan kayıt yok" />
        )}
      </div>
    </div>
  );
}
