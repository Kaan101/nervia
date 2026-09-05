import { useMemo, useState } from 'react';
import type { ChangeRequest, ChangeRequestStatus } from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import { changeRequestStatusText, roleLabels } from '@/lib/labels';
import { formatDateTime, relativeTime } from '@/lib/riskMath';
import { userName } from '@/data/org';
import { Avatar, Badge, EmptyState, Metric, Modal, Tabs } from '@/components/common/Primitives';
import { userById } from '@/data/org';
import { IconArrowRight, IconCheck, IconClose } from '@/components/common/Icons';

type Filter = ChangeRequestStatus | 'all' | 'pending';

export function ChangeManagementPage() {
  const data = useData((s) => s.data);
  const decide = useData((s) => s.decideChangeRequest);
  const { currentUser, capabilities } = useAuth();
  const [filter, setFilter] = useState<Filter>('pending');
  const [decision, setDecision] = useState<{ request: ChangeRequest; step: number; kind: 'approved' | 'rejected' } | null>(null);
  const [comment, setComment] = useState('');

  const pending = data.changeRequests.filter((c) => c.status === 'pending_manager' || c.status === 'pending_control');

  const rows = useMemo(() => {
    if (filter === 'all') return data.changeRequests;
    if (filter === 'pending') return pending;
    return data.changeRequests.filter((c) => c.status === filter);
  }, [data.changeRequests, filter, pending]);

  /**
   * Karar verebilir mi?
   * Rol eşleşmesi yetmez: kimse kendi talebini onaylayamaz — görevler ayrılığı
   * ilkesi onay zincirinde de geçerlidir.
   */
  const canDecide = (request: ChangeRequest) => {
    if (!currentUser || !capabilities.approve) return false;
    if (request.requestedById === currentUser.id) return false;
    const step = request.approvals.find((a) => a.decision === 'pending');
    if (!step) return false;
    return currentUser.roles.includes(step.requiredRole) || currentUser.roles.includes('system_admin');
  };

  /** Yetkisi olduğu halde karar veremiyorsa nedenini açıklar. */
  const denialReason = (request: ChangeRequest): string | null => {
    if (!currentUser) return null;
    const step = request.approvals.find((a) => a.decision === 'pending');
    if (!step) return null;
    if (request.requestedById === currentUser.id) {
      return 'Bu talebi siz oluşturdunuz; kimse kendi talebini onaylayamaz.';
    }
    return `Sıradaki onay ${roleLabels[step.requiredRole]} rolündedir; bu talebi onaylama yetkiniz yok.`;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Değişiklik Yönetimi</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Süreç güncelleme talepleri</h1>
          <p className="lede">
            Süreç sahibi kendi sürecini güncelleyebilir; kritik değişiklikler birim yöneticisi ve
            İç Kontrol / Risk Yönetimi onayından geçtikten sonra yeni versiyon olarak yayımlanır.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Toplam talep" value={data.changeRequests.length} /></div>
        <div className="card card-pad"><Metric compact label="Onay bekleyen" value={pending.length} tone={pending.length ? 'warn' : 'default'} /></div>
        <div className="card card-pad"><Metric compact label="Onaylanan" value={data.changeRequests.filter((c) => c.status === 'approved').length} tone="good" /></div>
        <div className="card card-pad"><Metric compact label="Reddedilen" value={data.changeRequests.filter((c) => c.status === 'rejected').length} /></div>
      </div>

      {/* Onay akışı şeması */}
      <div className="card card-pad" style={{ marginBottom: 'var(--s5)' }}>
        <span className="eyebrow">Onay akışı</span>
        <div className="row gap-2 wrap" style={{ marginTop: 'var(--s3)', fontSize: 'var(--text-sm)' }}>
          {['Çalışan / Süreç Sahibi', 'Değişiklik Talebi', 'Birim Yöneticisi', 'İç Kontrol / Risk Yönetimi', 'Onay', 'Yeni Versiyon'].map((s, i, arr) => (
            <span key={s} className="row gap-2">
              <span className="tag" style={i === arr.length - 1 ? { borderColor: 'var(--brand-400)', color: 'var(--brand-700)', fontWeight: 600 } : undefined}>{s}</span>
              {i < arr.length - 1 ? <IconArrowRight size={13} className="dim" /> : null}
            </span>
          ))}
        </div>
      </div>

      <Tabs<Filter>
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'pending', label: 'Onay bekleyen', count: pending.length },
          { id: 'approved', label: 'Onaylanan', count: data.changeRequests.filter((c) => c.status === 'approved').length },
          { id: 'rejected', label: 'Reddedilen', count: data.changeRequests.filter((c) => c.status === 'rejected').length },
          { id: 'all', label: 'Tümü', count: data.changeRequests.length },
        ]}
      />

      <div className="stack gap-4" style={{ marginTop: 'var(--s5)' }}>
        {rows.map((request) => {
          const step = request.approvals.find((a) => a.decision === 'pending');
          return (
            <div className="card" key={request.id}>
              <div className="card-head">
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <span className="row gap-2 wrap">
                    <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{request.code}</span>
                    <Badge
                      level={request.status === 'approved' ? 'low' : request.status === 'rejected' ? 'critical' : 'medium'}
                    >
                      {changeRequestStatusText(request)}
                    </Badge>
                    <Badge tone="plain">Etki: {request.impact === 'high' ? 'Yüksek' : request.impact === 'medium' ? 'Orta' : 'Düşük'}</Badge>
                    <Badge tone="plain">Hedef: {request.targetName}</Badge>
                  </span>
                  <h4>{request.title}</h4>
                </div>
                <div className="stack" style={{ alignItems: 'flex-end', gap: 2 }}>
                  <div className="row gap-2">
                    <Avatar user={userById.get(request.requestedById)} size="sm" />
                    <span style={{ fontSize: 'var(--text-sm)' }}>{userName(request.requestedById)}</span>
                  </div>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{relativeTime(request.requestedAt)}</span>
                </div>
              </div>

              <div className="card-body stack gap-4">
                <div>
                  <span className="eyebrow">Gerekçe</span>
                  <p style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>{request.reason}</p>
                </div>

                <div>
                  <span className="row between gap-3 wrap" style={{ marginBottom: 'var(--s2)' }}>
                    <span className="eyebrow">Değişiklikler</span>
                    {request.criticalFields?.length ? (
                      <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                        Onayı tetikleyen kritik alan: {request.criticalFields.length}
                      </span>
                    ) : null}
                  </span>
                  <div className="change-diff">
                    {request.changes.map((c) => (
                      <div
                        className="change-row"
                        key={c.field}
                        style={request.criticalFields?.includes(c.field)
                          ? { borderColor: 'var(--risk-medium-line)', background: 'var(--risk-medium-bg)' }
                          : undefined}
                      >
                        <span className="dim">
                          {c.label}
                          {request.criticalFields?.includes(c.field) ? (
                            <span title="Bu alan onay gerektirir" style={{ color: 'var(--risk-medium)', marginLeft: 4 }}>*</span>
                          ) : null}
                        </span>
                        <span>
                          <span className="old">{c.oldValue}</span>
                          <span className="arrow">→</span>
                          <span className="new">{c.newValue}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="eyebrow">Onay zinciri</span>
                  <div className="approval-flow" style={{ marginTop: 'var(--s2)' }}>
                    {request.approvals.map((a) => (
                      <div
                        key={a.order}
                        className={`approval-step ${a.decision === 'approved' ? 'done' : a.decision === 'rejected' ? 'rejected' : step?.order === a.order ? 'current' : ''}`}
                      >
                        <div className="st">
                          {a.decision === 'approved' ? 'Onaylandı' : a.decision === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                        </div>
                        <div className="nm">{a.label}</div>
                        <div className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                          {roleLabels[a.requiredRole]}
                          {a.approverId ? ` · ${userName(a.approverId)}` : ''}
                        </div>
                        {a.decidedAt ? (
                          <div className="dim" style={{ fontSize: 'var(--text-2xs)', marginTop: 2 }}>{formatDateTime(a.decidedAt)}</div>
                        ) : null}
                        {a.comment ? (
                          <div style={{ fontSize: 'var(--text-xs)', marginTop: 4, color: 'var(--ink-700)' }}>“{a.comment}”</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {request.status === 'approved' ? (
                  <div className="callout lvl-low">
                    <IconCheck size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
                    <span>
                      <span className="callout-title">Onaylandı ve uygulandı. </span>
                      {request.resultingVersion
                        ? <>Değişiklikler hedef kayda işlendi; yeni sürüm <strong>v{request.resultingVersion}</strong>.</>
                        : 'Değişiklikler hedef kayda işlendi.'}
                    </span>
                  </div>
                ) : null}

                {request.status === 'rejected' ? (
                  <div className="callout lvl-critical">
                    <IconClose size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
                    <span>
                      <span className="callout-title">Reddedildi. </span>
                      Hedef kayıt değişmedi; yürürlükteki sürüm korundu.
                    </span>
                  </div>
                ) : null}

                {step && request.payload ? (
                  <div className="callout">
                    <span style={{ fontSize: 'var(--text-xs)' }}>
                      Onay tamamlandığında bu değişiklikler hedef kayda otomatik olarak uygulanır ve
                      sürüm numarası bir basamak artırılır. O ana kadar kayıt değişmez.
                    </span>
                  </div>
                ) : null}
              </div>

              {step && canDecide(request) ? (
                <div className="card-foot row gap-2">
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
                    Sıradaki onay: <strong>{step.label}</strong>
                  </span>
                  <span className="spacer" />
                  <button className="btn btn-sm btn-danger" onClick={() => { setDecision({ request, step: step.order, kind: 'rejected' }); setComment(''); }}>
                    <IconClose size={13} /> Reddet
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => { setDecision({ request, step: step.order, kind: 'approved' }); setComment(''); }}>
                    <IconCheck size={13} /> Onayla
                  </button>
                </div>
              ) : step ? (
                <div className="card-foot">
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{denialReason(request)}</span>
                </div>
              ) : null}
            </div>
          );
        })}
        {!rows.length ? <EmptyState title="Bu durumda değişiklik talebi yok" /> : null}
      </div>

      <Modal
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        title={decision?.kind === 'approved' ? 'Değişikliği onayla' : 'Değişikliği reddet'}
        footer={
          <div className="row gap-2 end">
            <button className="btn btn-sm" onClick={() => setDecision(null)}>Vazgeç</button>
            <button
              className={`btn btn-sm ${decision?.kind === 'approved' ? 'btn-primary' : 'btn-danger'}`}
              onClick={() => {
                if (decision && currentUser) {
                  decide(decision.request.id, decision.step, decision.kind, currentUser.id, comment);
                }
                setDecision(null);
              }}
            >
              {decision?.kind === 'approved' ? 'Onayla' : 'Reddet'}
            </button>
          </div>
        }
      >
        {decision ? (
          <div className="stack gap-4">
            <div>
              <span className="eyebrow">Talep</span>
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>{decision.request.title}</p>
            </div>
            <div className="field">
              <label htmlFor="cr-comment">Karar açıklaması</label>
              <textarea
                id="cr-comment" className="textarea" rows={4} value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={decision.kind === 'approved'
                  ? 'Örn. Kontrol tasarımı güçlendiği için uygundur.'
                  : 'Örn. Kontrol ortamını zayıflattığı için uygun bulunmamıştır.'}
              />
            </div>
            <p className="dim" style={{ fontSize: 'var(--text-xs)' }}>
              Kararınız audit trail’e kim, ne zaman, hangi gerekçeyle bilgisiyle kaydedilir.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
