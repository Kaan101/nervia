import { useState } from 'react';
import { useAuth } from '@/store/useAuth';
import { useData } from '@/store/useData';
import { users } from '@/data/org';
import { DEMO_PASSWORD } from '@/data/accounts';
import { Avatar, Badge } from '@/components/common/Primitives';
import { IconArrowRight } from '@/components/common/Icons';

const principles = [
  'Bir işin nasıl yapıldığını gör.',
  'Bu işte neyin yanlış gidebileceğini gör.',
  'Hangi kontrolün bunu önlediğini gör.',
  'Kimin sorumlu olduğunu ve mevcut risk seviyesini gör.',
];

/** Giriş ekranında öne çıkarılan personalar — yetki farkları en belirgin olanlar. */
const featured = ['usr-01', 'usr-02', 'usr-04', 'usr-20', 'usr-22', 'usr-24', 'usr-25'];

export function Login() {
  const { login, loginAs } = useAuth();
  const roles = useData((s) => s.data.roles);
  const accounts = useData((s) => s.data.accounts);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  /** Personanın rollerini hesabından okur; rol adları artık veriden geliyor. */
  const roleNamesOf = (userId: string): string[] => {
    const account = accounts.find((a) => a.userId === userId);
    if (!account) return [];
    return account.roleIds.map((id) => roles.find((r) => r.id === id)?.name ?? id);
  };

  const demoList = showDemo ? users : users.filter((u) => featured.includes(u.id));

  return (
    <div className="login">
      <aside className="login-aside">
        <div style={{ position: 'relative' }}>
          <div className="row gap-3">
            <span className="logo" style={{
              width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-400))',
              color: '#fff', fontWeight: 700, letterSpacing: '-0.04em',
            }}>N</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 'var(--text-md)', letterSpacing: '-0.02em' }}>Nervia</span>
          </div>
          <h1 className="headline" style={{ marginTop: 'var(--s8)' }}>
            Organizasyonun yaşayan iç kontrol haritası
          </h1>
          <p className="blurb">
            Süreçler, riskler, kontroller, prosedürler ve sorumluluklar tek bir görsel yapıda.
            Tabloda değil, haritada. Birkaç tıkla derinleşen, her seviyede bağlam veren bir GRC platformu.
          </p>
          <div className="principles">
            {principles.map((p, i) => (
              <div className="principle" key={p}>
                <span className="idx">0{i + 1}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', color: '#7f93ad', fontSize: 'var(--text-xs)' }}>
          COSO Internal Control · ISO 31000 · ISO 9001 · ISO 27001 · ISO 22301 · Three Lines Model
        </div>
      </aside>

      <main className="login-panel">
        <span className="eyebrow">Oturum aç</span>
        <h2 style={{ marginTop: 'var(--s2)' }}>Hesabınıza giriş yapın</h2>

        <form className="login-form" onSubmit={submit}>
          <div className="field">
            <label className="field-label" htmlFor="login-email">E-posta</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad.soyad@nervia.example"
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-password">Parola</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <div className="callout danger" role="alert">{error}</div> : null}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Doğrulanıyor…' : 'Giriş yap'}
          </button>
        </form>

        <div className="callout" style={{ marginTop: 'var(--s5)' }}>
          <strong>Gösterim ortamı.</strong> Tüm demo hesaplarının parolası{' '}
          <code>{DEMO_PASSWORD}</code>. E-posta adresleri{' '}
          <code>ad.soyad@nervia.example</code> biçimindedir. Kimlik doğrulama
          tarayıcıda yapıldığı için bu gerçek bir güvenlik sınırı değildir;
          amaç yetkilendirmenin nasıl çalıştığını göstermektir.
        </div>

        <button
          className="btn btn-ghost"
          style={{ marginTop: 'var(--s4)', alignSelf: 'flex-start' }}
          onClick={() => setShowDemo((v) => !v)}
          type="button"
        >
          {showDemo ? 'Hızlı geçişi gizle' : 'Parolasız hızlı geçiş (gösterim)'}
        </button>

        {showDemo ? (
          <div className="persona-list">
            {demoList.map((user) => (
              <button key={user.id} className="persona" onClick={() => loginAs(user.id)} type="button">
                <Avatar user={user} size="lg" />
                <span className="stack grow" style={{ minWidth: 0 }}>
                  <span className="who">{user.name}</span>
                  <span className="role truncate">{user.title} · {user.department}</span>
                  <span className="row gap-1 wrap" style={{ marginTop: 4 }}>
                    {roleNamesOf(user.id).map((name) => (
                      <Badge key={name} tone="plain">{name}</Badge>
                    ))}
                  </span>
                </span>
                <IconArrowRight className="go" />
              </button>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
