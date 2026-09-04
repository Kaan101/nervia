import { useState } from 'react';
import { demoPersonas, useAuth } from '@/store/useAuth';
import { users } from '@/data/org';
import { roleDescriptions, roleLabels } from '@/lib/labels';
import { Avatar, Badge } from '@/components/common/Primitives';
import { IconArrowRight } from '@/components/common/Icons';

const principles = [
  'Bir işin nasıl yapıldığını gör.',
  'Bu işte neyin yanlış gidebileceğini gör.',
  'Hangi kontrolün bunu önlediğini gör.',
  'Kimin sorumlu olduğunu ve mevcut risk seviyesini gör.',
];

export function Login() {
  const login = useAuth((s) => s.login);
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? users : demoPersonas;

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
        <h2 style={{ marginTop: 'var(--s2)' }}>Kullanıcı hesabınızı seçin</h2>
        <p className="muted" style={{ marginTop: 'var(--s2)', maxWidth: '52ch' }}>
          Bu bir gösterim ortamıdır. Rol bazlı yetkilendirmenin nasıl çalıştığını görmek için
          farklı personalarla giriş yapabilirsiniz — gördüğünüz ekranlar ve yapabildikleriniz role göre değişir.
        </p>

        <div className="persona-list">
          {list.map((user) => (
            <button key={user.id} className="persona" onClick={() => login(user.id)}>
              <Avatar user={user} size="lg" />
              <span className="stack grow" style={{ minWidth: 0 }}>
                <span className="who">{user.name}</span>
                <span className="role truncate">{user.title} · {user.department}</span>
                <span className="row gap-1 wrap" style={{ marginTop: 4 }}>
                  {user.roles.map((r) => (
                    <Badge key={r} tone="plain" title={roleDescriptions[r]}>{roleLabels[r]}</Badge>
                  ))}
                </span>
              </span>
              <IconArrowRight className="go" />
            </button>
          ))}
        </div>

        <button className="btn btn-ghost" style={{ marginTop: 'var(--s4)', alignSelf: 'flex-start' }}
          onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Yalnızca öne çıkan personaları göster' : `Tüm kullanıcıları göster (${users.length})`}
        </button>
      </main>
    </div>
  );
}
