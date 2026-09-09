import { useMemo, useState } from 'react';
import { useData } from '@/store/useData';
import { useAuth, userCan } from '@/store/useAuth';
import { unitName, userById } from '@/data/org';
import { hashPassword, newSalt, passwordProblems } from '@/lib/password';
import { navEntries } from '@/lib/navigation';
import type {
  Account, MenuKey, Permission, PermissionMap, PermissionOverride, ResourceId, Role, Scope,
} from '@/types/rbac';
import { actions, resources, scopes, systemPermissions } from '@/types/rbac';
import { mergeRolePermissions } from '@/lib/access';
import { Avatar, Badge, Modal, SectionHeading } from '@/components/common/Primitives';
import { IconCheck, IconLock, IconPlus, IconShield, IconUsers } from '@/components/common/Icons';

/* ------------------------------------------------------------------ */
/* Etiketler                                                           */
/* ------------------------------------------------------------------ */

const resourceLabels: Record<ResourceId, string> = {
  process: 'Süreçler',
  risk: 'Riskler',
  control: 'Kontroller',
  action: 'Aksiyonlar',
  document: 'Dokümanlar',
  kri: 'KRI göstergeleri',
  review: 'Gözden geçirmeler',
};

const actionLabels: Record<string, string> = {
  read: 'Okuma',
  create: 'Ekleme',
  update: 'Güncelleme',
  archive: 'Arşivleme',
};

const scopeLabels: Record<Scope, string> = {
  none: 'Yok',
  own: 'Kendi kayıtları',
  unit: 'Kendi birimi',
  all: 'Tüm organizasyon',
};

const systemLabels: Record<string, string> = {
  'approve.manager': 'Birinci kademe onay (birim yöneticisi)',
  'approve.second_line': 'İkinci kademe onay (İç Kontrol / Risk Yönetimi)',
  'audit.view': 'Denetim izinin tamamını görme',
  'admin.users': 'Kullanıcı hesaplarını yönetme',
  'admin.roles': 'Rol ve izin tanımlarını yönetme',
  'admin.reset_password': 'Başkasının parolasını sıfırlama',
};

/* ------------------------------------------------------------------ */
/* Sayfa                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'roller' | 'kullanicilar';

export function AccessAdminPage() {
  const currentUser = useAuth((s) => s.currentUser);
  const [tab, setTab] = useState<Tab>('roller');

  const canRoles = userCan(currentUser, 'admin.roles');
  const canUsers = userCan(currentUser, 'admin.users');

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack gap-1">
          <span className="eyebrow">Sistem</span>
          <h1>Rol ve Yetki Yönetimi</h1>
          <p className="muted" style={{ maxWidth: '76ch' }}>
            Yetkiler burada tanımlanır ve uygulamanın tamamı bu tanımlardan okur. Bir rolün
            iznini değiştirdiğinizde, o rolü taşıyan kullanıcılarda etki <strong>anında</strong>
            {' '}görünür — yeniden giriş gerekmez. Her değişiklik denetim izine yazılır.
          </p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'roller'}
          className={tab === 'roller' ? 'active' : ''} onClick={() => setTab('roller')}>
          <IconShield size={15} /> Roller ve İzinler
        </button>
        <button role="tab" aria-selected={tab === 'kullanicilar'}
          className={tab === 'kullanicilar' ? 'active' : ''} onClick={() => setTab('kullanicilar')}>
          <IconUsers size={15} /> Kullanıcı Atamaları
        </button>
      </div>

      {tab === 'roller'
        ? (canRoles ? <RolesTab /> : <NoPermission need="admin.roles" />)
        : (canUsers ? <UsersTab /> : <NoPermission need="admin.users" />)}
    </div>
  );
}

function NoPermission({ need }: { need: string }) {
  return (
    <div className="card" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
      <IconLock size={24} />
      <p className="muted" style={{ marginTop: 'var(--s3)' }}>
        Bu bölüm için <code>{need}</code> izni gerekiyor.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Roller sekmesi                                                      */
/* ------------------------------------------------------------------ */

function RolesTab() {
  const roles = useData((s) => s.data.roles);
  const accounts = useData((s) => s.data.accounts);
  const { updateRole, createRole, deleteRole } = useData();
  const currentUser = useAuth((s) => s.currentUser);

  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? '');
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [copyFrom, setCopyFrom] = useState('');

  const role = roles.find((r) => r.id === selectedId) ?? roles[0];
  const holders = accounts.filter((a) => a.roleIds.includes(role?.id ?? '')).length;

  if (!role) return null;

  /** Tek bir iznin kapsamını değiştirir. 'none' izni tamamen kaldırır. */
  const setScope = (permission: Permission, scope: Scope) => {
    const next: PermissionMap = { ...role.permissions };
    if (scope === 'none') delete next[permission];
    else next[permission] = scope;
    updateRole(role.id, { permissions: next }, currentUser!.id);
  };

  const addRole = () => {
    const id = `custom-${Date.now().toString(36)}`;
    const source = roles.find((r) => r.id === copyFrom);
    createRole({
      id,
      name: newName.trim() || 'Yeni rol',
      description: newDesc.trim() || 'Organizasyonun tanımladığı özel rol.',
      permissions: source ? { ...source.permissions } : {},
      builtIn: false,
    }, currentUser!.id);
    setSelectedId(id);
    setNewRoleOpen(false);
    setNewName('');
    setNewDesc('');
    setCopyFrom('');
  };

  return (
    <div className="split-2">
      {/* Rol listesi */}
      <div className="stack gap-3">
        <SectionHeading
          title="Roller"
          count={roles.length}
          action={
            <button className="btn btn-sm" onClick={() => setNewRoleOpen(true)}>
              <IconPlus size={14} /> Yeni rol
            </button>
          }
        />
        <div className="stack gap-2">
          {roles.map((r) => {
            const count = accounts.filter((a) => a.roleIds.includes(r.id)).length;
            return (
              <button
                key={r.id}
                className={`card row gap-3 ${r.id === role.id ? 'selected' : ''}`}
                style={{
                  padding: 'var(--s3) var(--s4)', textAlign: 'left', width: '100%',
                  borderColor: r.id === role.id ? 'var(--brand-400)' : undefined,
                }}
                onClick={() => setSelectedId(r.id)}
              >
                <span className="stack grow gap-1" style={{ minWidth: 0 }}>
                  <span className="row gap-2">
                    <strong>{r.name}</strong>
                    {r.builtIn ? <Badge tone="plain">Yerleşik</Badge> : <Badge tone="brand">Özel</Badge>}
                  </span>
                  <span className="muted truncate" style={{ fontSize: 'var(--text-xs)' }}>
                    {Object.keys(r.permissions).length} izin · {count} kullanıcı
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* İzin matrisi */}
      <div className="stack gap-4">
        <div className="card" style={{ padding: 'var(--s5)' }}>
          <div className="row gap-3 wrap" style={{ alignItems: 'flex-start' }}>
            <div className="stack gap-1 grow">
              <h3>{role.name}</h3>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{role.description}</p>
            </div>
            {!role.builtIn ? (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  deleteRole(role.id, currentUser!.id);
                  setSelectedId(roles[0]?.id ?? '');
                }}
              >
                Rolü sil
              </button>
            ) : null}
          </div>
          {holders > 0 ? (
            <div className="callout" style={{ marginTop: 'var(--s4)' }}>
              Bu rol <strong>{holders} kullanıcıda</strong> tanımlı. Yapacağınız değişiklik
              hepsini anında etkiler.
            </div>
          ) : null}
        </div>

        <PermissionMatrix role={role} onChange={setScope} />
        <SystemPermissions role={role} onChange={setScope} />
        <MenuPermissions role={role} onChange={setScope} />
      </div>

      <Modal
        open={newRoleOpen}
        onClose={() => setNewRoleOpen(false)}
        title="Yeni rol tanımla"
        footer={
          <>
            <button className="btn" onClick={() => setNewRoleOpen(false)}>Vazgeç</button>
            <button className="btn btn-primary" onClick={addRole}>Rolü oluştur</button>
          </>
        }
      >
        <div className="stack gap-4">
          <div className="field">
            <label className="field-label" htmlFor="role-name">Rol adı</label>
            <input id="role-name" className="input" value={newName}
              onChange={(e) => setNewName(e.target.value)} placeholder="Örn. Süreç Denetçisi" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="role-desc">Açıklama</label>
            <textarea id="role-desc" className="input" rows={3} value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Bu rol ne için var, kimler taşımalı?" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="role-copy">İzinleri şu rolden kopyala</label>
            <select id="role-copy" className="input" value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}>
              <option value="">Boş başla (hiçbir izin yok)</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Kaynak × eylem matrisi; her hücrede kapsam seçilir. */
function PermissionMatrix({
  role, onChange,
}: { role: Role; onChange: (p: Permission, s: Scope) => void }) {
  return (
    <div className="stack gap-3">
      <SectionHeading title="Kayıt izinleri" />
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        Her hücre, bu rolün ilgili kayıtlarda o eylemi <em>hangi kapsamda</em> yapabileceğini
        söyler. Kapsam kaydın sahibine ve birimine göre değerlendirilir.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Kaynak</th>
              {actions.map((a) => <th key={a}>{actionLabels[a]}</th>)}
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r}>
                <td><strong>{resourceLabels[r]}</strong></td>
                {actions.map((a) => {
                  const key = `${r}.${a}` as Permission;
                  const value = role.permissions[key] ?? 'none';
                  return (
                    <td key={a}>
                      <select
                        className="input input-sm"
                        aria-label={`${resourceLabels[r]} — ${actionLabels[a]}`}
                        value={value}
                        onChange={(e) => onChange(key, e.target.value as Scope)}
                      >
                        {scopes.map((s) => (
                          <option key={s} value={s}>{scopeLabels[s]}</option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Kaynağa bağlı olmayan yetkiler — açık/kapalı. */
function SystemPermissions({
  role, onChange,
}: { role: Role; onChange: (p: Permission, s: Scope) => void }) {
  return (
    <div className="stack gap-3">
      <SectionHeading title="Sistem yetkileri" />
      <div className="stack gap-2">
        {systemPermissions.map((p) => {
          const on = role.permissions[p] === 'all';
          return (
            <label key={p} className="row gap-3 card" style={{ padding: 'var(--s3) var(--s4)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => onChange(p, e.target.checked ? 'all' : 'none')}
              />
              <span className="stack gap-1 grow">
                <strong>{systemLabels[p] ?? p}</strong>
                <code style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>{p}</code>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Menü görünürlüğü — hem kenar çubuğunu hem rota erişimini belirler. */
function MenuPermissions({
  role, onChange,
}: { role: Role; onChange: (p: Permission, s: Scope) => void }) {
  return (
    <div className="stack gap-3">
      <SectionHeading title="Menü erişimi" />
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        Kapalı bir menü yalnızca gizlenmez; adres çubuğundan da açılamaz.
      </p>
      <div className="grid auto">
        {navEntries.map((entry) => {
          const key = `menu.${entry.key}` as Permission;
          const on = role.permissions[key] === 'all';
          return (
            <label key={entry.key} className="row gap-3 card"
              style={{ padding: 'var(--s3) var(--s4)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => onChange(key, e.target.checked ? 'all' : 'none')}
              />
              <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                <strong className="truncate">{entry.label}</strong>
                <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{entry.group}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kullanıcılar sekmesi                                                */
/* ------------------------------------------------------------------ */

function UsersTab() {
  const roles = useData((s) => s.data.roles);
  const accounts = useData((s) => s.data.accounts);
  const units = useData((s) => s.data.units);
  const { updateAccount, setPassword } = useData();
  const currentUser = useAuth((s) => s.currentUser);

  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    if (!q) return accounts;
    return accounts.filter((a) => {
      const u = userById.get(a.userId);
      return `${u?.name ?? ''} ${a.email} ${u?.title ?? ''}`.toLocaleLowerCase('tr-TR').includes(q);
    });
  }, [accounts, query]);

  const account = accounts.find((a) => a.userId === openId) ?? null;

  return (
    <div className="stack gap-4">
      <div className="row gap-3 wrap">
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Kullanıcı ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Kullanıcı ara"
        />
        <span className="muted" style={{ alignSelf: 'center' }}>{filtered.length} hesap</span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Birim</th>
              <th>Roller</th>
              <th>İstisna</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const u = userById.get(a.userId);
              return (
                <tr key={a.userId}>
                  <td>
                    <span className="row gap-2">
                      <Avatar user={u} />
                      <span className="stack gap-1" style={{ minWidth: 0 }}>
                        <strong>{u?.name}</strong>
                        <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{a.email}</span>
                      </span>
                    </span>
                  </td>
                  <td>{unitName(u?.unitId)}</td>
                  <td>
                    <span className="row gap-1 wrap">
                      {a.roleIds.length === 0 ? <span className="muted">—</span> : null}
                      {a.roleIds.map((id) => (
                        <Badge key={id} tone="plain">
                          {roles.find((r) => r.id === id)?.name ?? id}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td>{a.overrides.length ? <Badge tone="brand">{a.overrides.length}</Badge> : <span className="muted">—</span>}</td>
                  <td>
                    {a.active
                      ? <Badge tone="plain">Aktif</Badge>
                      : <Badge tone="solid">Pasif</Badge>}
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setOpenId(a.userId)}>Düzenle</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {account ? (
        <AccountEditor
          account={account}
          roles={roles}
          units={units.map((u) => ({ id: u.id, name: u.name }))}
          onClose={() => setOpenId(null)}
          onSave={(patch, reason) => {
            updateAccount(account.userId, patch, currentUser!.id, reason);
            setOpenId(null);
          }}
          onResetPassword={async (password) => {
            const salt = newSalt();
            const hash = await hashPassword(password, salt);
            setPassword(account.userId, salt, hash, currentUser!.id, true);
          }}
          canResetPassword={userCan(currentUser, 'admin.reset_password')}
        />
      ) : null}
    </div>
  );
}

function AccountEditor({
  account, roles, units, onClose, onSave, onResetPassword, canResetPassword,
}: {
  account: Account;
  roles: Role[];
  units: { id: string; name: string }[];
  onClose: () => void;
  onSave: (patch: Partial<Account>, reason?: string) => void;
  onResetPassword: (password: string) => Promise<void>;
  canResetPassword: boolean;
}) {
  const user = userById.get(account.userId);
  const [roleIds, setRoleIds] = useState<string[]>(account.roleIds);
  const [active, setActive] = useState(account.active);
  const [extraUnitIds, setExtraUnitIds] = useState<string[]>(account.extraUnitIds);
  const [overrides, setOverrides] = useState<PermissionOverride[]>(account.overrides);
  const [reason, setReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordNote, setPasswordNote] = useState('');

  // Rollerden gelen izinler: yöneticinin ne verdiğini görmesi için özet.
  const inherited = useMemo(
    () => mergeRolePermissions(roles.filter((r) => roleIds.includes(r.id))),
    [roles, roleIds],
  );

  const toggleRole = (id: string) => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const problems = newPassword ? passwordProblems(newPassword) : [];

  return (
    <Modal
      open
      onClose={onClose}
      title={<span className="row gap-2"><Avatar user={user} /> {user?.name}</span>}
      footer={
        <>
          <button className="btn" onClick={onClose}>Vazgeç</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave({ roleIds, active, extraUnitIds, overrides }, reason || undefined)}
          >
            Değişiklikleri kaydet
          </button>
        </>
      }
    >
      <div className="stack gap-5">
        <div className="stack gap-3">
          <SectionHeading title="Roller" />
          <div className="stack gap-2">
            {roles.map((r) => (
              <label key={r.id} className="row gap-3" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                <span className="stack gap-1 grow">
                  <strong>{r.name}</strong>
                  <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{r.description}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Bu roller birlikte <strong>{Object.keys(inherited).length}</strong> izin veriyor.
            Aynı izin birden çok rolde varsa geniş olan kapsam geçerlidir.
          </p>
        </div>

        <div className="stack gap-3">
          <SectionHeading title="Ek birim sorumluluğu" />
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            "Kendi birimi" kapsamı normalde {unitName(user?.unitId)} ve alt birimleridir.
            Matris organizasyonda bir kişi başka birimlerden de sorumlu olabilir.
          </p>
          <div className="grid auto">
            {units.filter((u) => u.id !== user?.unitId).map((u) => (
              <label key={u.id} className="row gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={extraUnitIds.includes(u.id)}
                  onChange={() => setExtraUnitIds((prev) =>
                    prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id])}
                />
                <span className="truncate">{u.name}</span>
              </label>
            ))}
          </div>
        </div>

        <OverrideEditor overrides={overrides} onChange={setOverrides} />

        <div className="stack gap-3">
          <SectionHeading title="Hesap durumu" />
          <label className="row gap-3" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span className="stack gap-1">
              <strong>Hesap aktif</strong>
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                Pasif hesap giriş yapamaz; kayıtları ve geçmişi olduğu gibi kalır.
              </span>
            </span>
          </label>
          {account.lockedUntil ? (
            <div className="callout warn">
              Hesap hatalı giriş nedeniyle kilitli. Parola sıfırlandığında kilit kalkar.
            </div>
          ) : null}
        </div>

        {canResetPassword ? (
          <div className="stack gap-3">
            <SectionHeading title="Parola sıfırlama" />
            <div className="field">
              <label className="field-label" htmlFor="new-pw">Yeni parola</label>
              <input id="new-pw" className="input" type="text" value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordNote(''); }}
                placeholder="En az 10 karakter, büyük/küçük harf, rakam ve simge" />
            </div>
            {problems.length ? (
              <ul className="muted" style={{ fontSize: 'var(--text-xs)', paddingLeft: '1.2em' }}>
                {problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            ) : null}
            {passwordNote ? <div className="callout good">{passwordNote}</div> : null}
            <button
              className="btn btn-sm"
              disabled={!newPassword || problems.length > 0}
              onClick={async () => {
                await onResetPassword(newPassword);
                setNewPassword('');
                setPasswordNote('Parola sıfırlandı. Kullanıcı ilk girişte değiştirmek zorunda.');
              }}
            >
              <IconCheck size={14} /> Parolayı sıfırla
            </button>
          </div>
        ) : null}

        <div className="field">
          <label className="field-label" htmlFor="acc-reason">Neden değiştiriliyor?</label>
          <textarea id="acc-reason" className="input" rows={2} value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Denetim izine yazılır." />
        </div>
      </div>
    </Modal>
  );
}

/** Kullanıcıya özel izin ve yasaklar. */
function OverrideEditor({
  overrides, onChange,
}: { overrides: PermissionOverride[]; onChange: (o: PermissionOverride[]) => void }) {
  const [permission, setPermission] = useState<Permission>('risk.update');
  const [effect, setEffect] = useState<'grant' | 'deny'>('grant');
  const [scope, setScope] = useState<Scope>('unit');
  const [reason, setReason] = useState('');

  const allPermissions: Permission[] = [
    ...resources.flatMap((r) => actions.map((a) => `${r}.${a}` as Permission)),
    ...systemPermissions,
    ...navEntries.map((e) => `menu.${e.key}` as Permission),
  ];

  const labelOf = (p: Permission): string => {
    if (p.startsWith('menu.')) {
      const key = p.slice(5) as MenuKey;
      return `Menü: ${navEntries.find((e) => e.key === key)?.label ?? key}`;
    }
    if (systemLabels[p]) return systemLabels[p];
    const [res, act] = p.split('.') as [ResourceId, string];
    return `${resourceLabels[res] ?? res} — ${actionLabels[act] ?? act}`;
  };

  return (
    <div className="stack gap-3">
      <SectionHeading title="Kullanıcıya özel istisnalar" count={overrides.length} />
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        Rolü bozmadan tek kişiye yetki vermek ya da almak için. <strong>Ret her zaman
        kazanır</strong> — rol izin verse bile yasaklanmış bir izin çalışmaz.
      </p>

      {overrides.length ? (
        <div className="stack gap-2">
          {overrides.map((o, i) => (
            <div key={`${o.permission}-${i}`} className="row gap-3 card"
              style={{ padding: 'var(--s3) var(--s4)' }}>
              <Badge tone={o.effect === 'deny' ? 'solid' : 'brand'}>
                {o.effect === 'deny' ? 'YASAK' : 'İZİN'}
              </Badge>
              <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                <strong className="truncate">{labelOf(o.permission)}</strong>
                <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                  {o.effect === 'grant' ? `${scopeLabels[o.scope]} · ` : ''}{o.reason || 'Gerekçe belirtilmemiş'}
                </span>
              </span>
              <button className="btn btn-sm"
                onClick={() => onChange(overrides.filter((_, idx) => idx !== i))}>
                Kaldır
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="row gap-2 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="field grow" style={{ minWidth: 220 }}>
          <label className="field-label" htmlFor="ov-perm">İzin</label>
          <select id="ov-perm" className="input" value={permission}
            onChange={(e) => setPermission(e.target.value as Permission)}>
            {allPermissions.map((p) => <option key={p} value={p}>{labelOf(p)}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ov-effect">Etki</label>
          <select id="ov-effect" className="input" value={effect}
            onChange={(e) => setEffect(e.target.value as 'grant' | 'deny')}>
            <option value="grant">İzin ver</option>
            <option value="deny">Yasakla</option>
          </select>
        </div>
        {effect === 'grant' ? (
          <div className="field">
            <label className="field-label" htmlFor="ov-scope">Kapsam</label>
            <select id="ov-scope" className="input" value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}>
              {scopes.filter((s) => s !== 'none').map((s) => (
                <option key={s} value={s}>{scopeLabels[s]}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="field grow" style={{ minWidth: 180 }}>
          <label className="field-label" htmlFor="ov-reason">Gerekçe</label>
          <input id="ov-reason" className="input" value={reason}
            onChange={(e) => setReason(e.target.value)} placeholder="Örn. Vekâlet — 3 ay" />
        </div>
        <button
          className="btn btn-sm"
          onClick={() => {
            onChange([...overrides, { permission, effect, scope, reason }]);
            setReason('');
          }}
        >
          <IconPlus size={14} /> Ekle
        </button>
      </div>
    </div>
  );
}
