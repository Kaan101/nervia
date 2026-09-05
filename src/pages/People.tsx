import { useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/riskMath';
import { useData } from '@/store/useData';
import { persistenceState, snapshotSizeKb } from '@/store/persistence';
import { useAuth, capabilitiesOf, demoPersonas } from '@/store/useAuth';
import { roleDescriptions, roleLabels } from '@/lib/labels';
import { unitName, userById, userName } from '@/data/org';
import { Avatar, Badge, EmptyState, Metric, Modal, SectionHeading } from '@/components/common/Primitives';
import { IconCheck, IconClose, IconRefresh, IconSearch, IconWarning } from '@/components/common/Icons';
import type { RoleId } from '@/types/grc';

/* ------------------------------------------------------------------ */
/* Kullanıcı yönetimi                                                  */
/* ------------------------------------------------------------------ */

export function UsersPage() {
  const data = useData((s) => s.data);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleId | ''>('');

  const rows = useMemo(() => {
    let list = data.users;
    if (query.trim()) {
      const q = query.toLocaleLowerCase('tr-TR');
      list = list.filter((u) => `${u.name} ${u.title} ${u.department} ${u.email}`.toLocaleLowerCase('tr-TR').includes(q));
    }
    if (role) list = list.filter((u) => u.roles.includes(role));
    return list;
  }, [data.users, query, role]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Kullanıcı Yönetimi</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Kullanıcılar, roller ve yetki seviyeleri</h1>
          <p className="lede">
            Her çalışan kendi hesabıyla giriş yapar. Kullanıcı yalnızca yetkili olduğu süreçlerde değişiklik
            yapabilir; diğer süreçleri yetki seviyesine göre görüntüleyebilir.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Kullanıcı" value={data.users.length} /></div>
        <div className="card card-pad"><Metric compact label="Süreç sahibi" value={data.users.filter((u) => u.roles.includes('process_owner')).length} /></div>
        <div className="card card-pad"><Metric compact label="Birim" value={data.units.length} /></div>
        <div className="card card-pad"><Metric compact label="2. ve 3. hat" value={data.units.filter((u) => u.defenceLine >= 2).length} sub="Risk, İç Kontrol, İç Denetim" /></div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--s6)' }}>
        <div className="card-head">
          <span className="input row gap-2" style={{ display: 'flex', alignItems: 'center', maxWidth: 300 }}>
            <IconSearch size={14} className="dim" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kullanıcı ara…"
              style={{ border: 0, outline: 'none', background: 'none', width: '100%' }} />
          </span>
          <select className="select" style={{ width: 'auto' }} value={role} onChange={(e) => setRole(e.target.value as RoleId | '')}>
            <option value="">Tüm roller</option>
            {(Object.keys(roleLabels) as RoleId[]).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Ad Soyad</th><th>Birim</th><th>Departman</th><th>Görev / Pozisyon</th>
                <th>Rol</th><th>Yönetici</th><th className="num">Yetki seviyesi</th><th>E-posta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="row gap-2">
                      <Avatar user={u} size="sm" />
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="dim">{unitName(u.unitId)}</td>
                  <td className="dim">{u.department}</td>
                  <td>{u.title}</td>
                  <td>
                    <span className="row gap-1 wrap">
                      {u.roles.map((r) => <Badge key={r} tone="plain" title={roleDescriptions[r]}>{roleLabels[r]}</Badge>)}
                    </span>
                  </td>
                  <td className="dim">{u.managerId ? userName(u.managerId) : '—'}</td>
                  <td className="num">{u.authLevel}</td>
                  <td className="dim mono" style={{ fontSize: 'var(--text-2xs)' }}>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? <EmptyState title="Kullanıcı bulunamadı" /> : null}
      </div>

      <SectionHeading title="Rol yetki matrisi" />
      <div className="card" style={{ marginTop: 'var(--s4)' }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Rol</th><th>Açıklama</th>
                <th>Tümünü görüntüle</th><th>Onay verme</th><th>Kontrol değerlendirme</th>
                <th>Risk skoru güncelleme</th><th>Audit trail</th><th>Sistem yönetimi</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(roleLabels) as RoleId[]).map((r) => {
                const caps = capabilitiesOf({
                  id: 'x', name: '', email: '', initials: '', unitId: '', department: '',
                  title: '', roles: [r], managerId: null, authLevel: 1,
                });
                const cell = (v: boolean) => (v
                  ? <IconCheck size={15} className="status-green" />
                  : <IconClose size={15} className="dim" />);
                return (
                  <tr key={r}>
                    <td style={{ fontWeight: 600 }}>{roleLabels[r]}</td>
                    <td className="dim" style={{ maxWidth: 380 }}>{roleDescriptions[r]}</td>
                    <td>{cell(caps.viewAll)}</td>
                    <td>{cell(caps.approve)}</td>
                    <td>{cell(caps.assessControls)}</td>
                    <td>{cell(caps.assessRisks)}</td>
                    <td>{cell(caps.viewAudit)}</td>
                    <td>{cell(caps.administer)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profil                                                              */
/* ------------------------------------------------------------------ */

export function ProfilePage() {
  const data = useData((s) => s.data);
  const resetToSeed = useData((s) => s.resetToSeed);
  const { currentUser, capabilities, login, logout } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!currentUser) return null;

  // Kalıcılık durumu her render'da tazelenir; veri değiştikçe bileşen yeniden çizilir.
  const sizeKb = snapshotSizeKb();
  const savedAt = persistenceState.savedAt;
  const storageError = persistenceState.error;

  const ownedProcesses = data.nodes.filter((n) => n.ownerId === currentUser.id && n.kind !== 'step');
  const ownedRisks = data.risks.filter((r) => !r.archived && r.ownerId === currentUser.id);
  const ownedControls = data.controls.filter((c) => !c.archived && c.ownerId === currentUser.id);
  const myActions = data.actions.filter((a) => !a.archived && a.ownerId === currentUser.id);

  const capRows: { label: string; value: boolean; note: string }[] = [
    { label: 'Tüm organizasyonu görüntüleme', value: capabilities.viewAll, note: 'Kendi birimi dışındaki süreçleri de görebilir.' },
    { label: 'Değişiklik talebi onaylama', value: capabilities.approve, note: 'Onay zincirinde rolüne düşen adımı karara bağlayabilir.' },
    { label: 'Kontrol etkinliği değerlendirme', value: capabilities.assessControls, note: 'Kontrol testleri sonucunda etkinlik durumunu günceller.' },
    { label: 'Risk skoru güncelleme', value: capabilities.assessRisks, note: 'Artık risk değerlendirmesini revize edebilir.' },
    { label: 'Audit trail görüntüleme', value: capabilities.viewAudit, note: 'Tüm değişiklik kayıtlarını inceleyebilir.' },
    { label: 'Sistem yönetimi', value: capabilities.administer, note: 'Kullanıcı, rol ve referans verilerini yönetir.' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="row gap-4">
          <Avatar user={currentUser} size="lg" />
          <div className="stack">
            <h1>{currentUser.name}</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {currentUser.title} · {unitName(currentUser.unitId)}
            </p>
            <div className="row gap-1 wrap" style={{ marginTop: 'var(--s2)' }}>
              {currentUser.roles.map((r) => <Badge key={r} tone="brand" title={roleDescriptions[r]}>{roleLabels[r]}</Badge>)}
            </div>
          </div>
        </div>
        <button className="btn" onClick={logout}>Çıkış yap</button>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s6)' }}>
        <div className="card card-pad"><Metric compact label="Sahibi olduğu süreç" value={ownedProcesses.length} /></div>
        <div className="card card-pad"><Metric compact label="Sahibi olduğu risk" value={ownedRisks.length} /></div>
        <div className="card card-pad"><Metric compact label="Sahibi olduğu kontrol" value={ownedControls.length} /></div>
        <div className="card card-pad"><Metric compact label="Üzerindeki aksiyon" value={myActions.filter((a) => a.status !== 'completed').length} /></div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-head"><h4>Profil bilgileri</h4></div>
          <div className="card-body">
            <dl className="dl">
              <dt>Ad Soyad</dt><dd>{currentUser.name}</dd>
              <dt>Birim</dt><dd>{unitName(currentUser.unitId)}</dd>
              <dt>Departman</dt><dd>{currentUser.department}</dd>
              <dt>Görev / Pozisyon</dt><dd>{currentUser.title}</dd>
              <dt>Rol</dt><dd>{currentUser.roles.map((r) => roleLabels[r]).join(', ')}</dd>
              <dt>Yönetici</dt>
              <dd>{currentUser.managerId ? `${userName(currentUser.managerId)} — ${userById.get(currentUser.managerId)?.title ?? ''}` : '—'}</dd>
              <dt>Yetki seviyesi</dt><dd>{currentUser.authLevel} / 5</dd>
              <dt>E-posta</dt><dd className="mono">{currentUser.email}</dd>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h4>Yetkileriniz</h4></div>
          <div className="card-body stack gap-3">
            {capRows.map((c) => (
              <div className="row gap-3 items-start" key={c.label}>
                {c.value
                  ? <IconCheck size={16} className="status-green" style={{ flex: '0 0 auto', marginTop: 2 }} />
                  : <IconClose size={16} className="dim" style={{ flex: '0 0 auto', marginTop: 2 }} />}
                <span className="stack" style={{ gap: 1 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: c.value ? 'var(--ink-900)' : 'var(--ink-500)' }}>
                    {c.label}
                  </span>
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{c.note}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <SectionHeading title="Veri ve kalıcılık" />
        <div className="card">
          <div className="card-body stack gap-4">
            {storageError ? (
              <div className="callout lvl-critical">
                <IconWarning size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
                <span><span className="callout-title">Kaydedilemiyor. </span>{storageError}</span>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                Yaptığınız her değişiklik — yeni risk, kontrol, aksiyon, düzenleme, arşivleme, onay —
                bu tarayıcıda saklanır ve sayfayı yenilediğinizde korunur. Veri yalnızca bu tarayıcıda
                tutulur; başka bir cihaza ya da kullanıcıya taşınmaz.
              </p>
            )}

            <dl className="dl">
              <dt>Durum</dt>
              <dd>
                {savedAt
                  ? <Badge level="low"><span className="dot" />Yerel değişiklikler kayıtlı</Badge>
                  : <Badge tone="plain">Demo verisi — henüz değişiklik yok</Badge>}
              </dd>
              <dt>Son kayıt</dt>
              <dd>{savedAt ? formatDateTime(savedAt) : '—'}</dd>
              <dt>Kayıt boyutu</dt>
              <dd>{sizeKb !== null ? `${sizeKb} KB` : '—'}</dd>
              <dt>Kayıt sayısı</dt>
              <dd className="num">
                {data.risks.filter((r) => !r.archived).length} risk
                · {data.controls.filter((c) => !c.archived).length} kontrol
                · {data.actions.filter((a) => !a.archived).length} aksiyon
                · {data.auditTrail.length} audit kaydı
              </dd>
            </dl>

            <div className="hairline" style={{ margin: 0 }} />

            <div className="row between gap-3 wrap">
              <span className="dim" style={{ fontSize: 'var(--text-xs)', maxWidth: '60ch' }}>
                Sıfırlama, bu tarayıcıdaki tüm değişiklikleri kalıcı olarak siler ve demo verisini
                geri yükler. Bu işlem geri alınamaz.
              </span>
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
                <IconRefresh size={14} /> Demo verisine sıfırla
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Demo verisine sıfırla"
        footer={
          <div className="row gap-2 end">
            <button className="btn btn-sm" onClick={() => setConfirmReset(false)}>Vazgeç</button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => { resetToSeed(); setConfirmReset(false); }}
            >
              Evet, sıfırla
            </button>
          </div>
        }
      >
        <div className="callout lvl-critical">
          <IconWarning size={16} style={{ flex: '0 0 auto', marginTop: 2 }} />
          <span>
            <span className="callout-title">Bu işlem geri alınamaz. </span>
            Eklediğiniz tüm risk, kontrol ve aksiyonlar, yaptığınız düzenlemeler, arşivlemeler ve
            audit trail kayıtları silinir; sistem ilk demo verisine döner.
          </span>
        </div>
      </Modal>

      <div className="section">
        <SectionHeading title="Persona değiştir" />
        <p className="muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--s4)' }}>
          Gösterim ortamında rol bazlı yetkilendirmenin etkisini görmek için başka bir kullanıcıya geçebilirsiniz.
        </p>
        <div className="grid auto">
          {demoPersonas.map((u) => (
            <button className="persona" key={u.id} onClick={() => login(u.id)}
              style={u.id === currentUser.id ? { borderColor: 'var(--brand-400)' } : undefined}>
              <Avatar user={u} />
              <span className="stack grow" style={{ minWidth: 0 }}>
                <span className="who">{u.name}</span>
                <span className="role truncate">{u.title}</span>
              </span>
              {u.id === currentUser.id ? <Badge tone="brand">Aktif</Badge> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
