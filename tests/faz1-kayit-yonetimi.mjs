// Faz 1 — kalıcılık, kayıt oluşturma/düzenleme, ilişkilendirme ve arşivleme
//
// Uygulamayı gerçek tarayıcıda uçtan uca sürer: kaydı oluşturur, arayüzden
// düzenler, sonucu ekranda ve audit trail'de doğrular. Sunucu adresi
// NERVIA_BASE_URL ile verilir (varsayılan: vite preview).
import { startRun, BASE } from './harness.mjs';

const { page, check, step, setPersona, finish } = await startRun('usr-22');


// ---------- 1. Yeni risk oluştur ----------
await page.goto(`${BASE}/#/riskler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
const before = await page.locator('.metric-value').first().textContent();
step(`Başlangıç risk sayısı: ${before}`);

await page.getByRole('button', { name: 'Yeni risk' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'crud-01-risk-form.png' });

await page.getByLabel(/Risk adı/).fill('Test riski — otomatik doğrulama');
await page.getByLabel(/^Açıklama/).fill('CRUD akışını doğrulamak için oluşturulmuş geçici risk kaydı.');
await page.getByLabel(/Risk nedeni/).fill('Otomatik test.');
await page.getByLabel(/Risk sonucu/).fill('Yok — test kaydıdır.');
await page.screenshot({ path: 'crud-01b-risk-form-dolu.png' });
await page.getByRole('button', { name: 'Riski oluştur' }).click();
await page.waitForTimeout(800);

// Oluşturunca yeni kaydın detayı açılır
const drawerTitle = await page.locator('.drawer h2').first().textContent().catch(() => '');
check('Yeni risk oluşturuldu ve detayı açıldı', /Test riski/.test(drawerTitle ?? ''), drawerTitle ?? '');
await page.screenshot({ path: 'crud-02-risk-created.png' });

// ---------- 2. Düzenle ----------
await page.getByRole('button', { name: 'Düzenle' }).click();
await page.waitForTimeout(400);
await page.getByLabel(/Risk adı/).fill('Test riski — düzenlendi');
await page.getByLabel(/Neden değiştiriliyor/).fill('Otomatik doğrulama: ad değişikliği testi.');
await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(700);
const editedTitle = await page.locator('.drawer h2').first().textContent().catch(() => '');
check('Düzenleme kaydedildi', /düzenlendi/.test(editedTitle ?? ''), editedTitle ?? '');

// ---------- 3. Kontrol bağla ----------
await page.getByRole('button', { name: 'Kontrolleri bağla' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'crud-03-link-editor.png' });
await page.locator('.modal .rel-control').first().click();
await page.waitForTimeout(400);
const selected = await page.locator('.modal .badge-brand').filter({ hasText: 'seçili' }).textContent();
check('Kontrol bağlandı', selected?.startsWith('1'), selected ?? '');
await page.getByRole('button', { name: 'Bitti' }).click();
await page.waitForTimeout(700);
const chainText = await page.locator('.rel-chain').first().innerText().catch(() => '');
check('Risk–kontrol zinciri güncellendi', /AZALTAN KONTROLLER \(1\)/i.test(chainText), chainText.split('\n')[3] ?? '');
await page.screenshot({ path: 'crud-04-risk-with-control.png' });

// ---------- 4. Kalıcılık: yenile ----------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const afterReload = await page.locator('.drawer h2').first().textContent().catch(() => '');
check('Yenilemeden sonra kayıt duruyor (kalıcılık)', /düzenlendi/.test(afterReload ?? ''), afterReload ?? '');

// ---------- 5. Arşivle ----------
await page.getByRole('button', { name: 'Arşivle' }).click();
await page.waitForTimeout(700);
const noticeVisible = await page.locator('.callout', { hasText: 'Bu kayıt arşivde' }).count();
check('Arşiv şeridi göründü', noticeVisible > 0);
await page.screenshot({ path: 'crud-05-archived.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

const afterArchive = await page.locator('.metric-value').first().textContent();
check('Arşivlenen kayıt sayımdan düştü', afterArchive === before, `${before} → ${afterArchive}`);
const archiveTab = await page.getByRole('button', { name: /^Arşiv \(/ }).count();
check('Arşiv sekmesi göründü', archiveTab > 0);
await page.screenshot({ path: 'crud-06-liste.png' });

// ---------- 6. Arşiv görünümü ----------
await page.getByRole('button', { name: /^Arşiv \(/ }).click();
await page.waitForTimeout(600);
const archivedRow = await page.getByText('Test riski — düzenlendi').count();
check('Kayıt arşiv görünümünde listeleniyor', archivedRow > 0);
await page.screenshot({ path: 'crud-07-arsiv.png' });

// ---------- 7. Audit trail ----------
await page.goto(`${BASE}/#/audit`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const auditText = await page.locator('.timeline').first().innerText();
check('Oluşturma audit trail’e yazıldı', /Yeni risk tanımlandı/.test(auditText));
check('Düzenleme audit trail’e yazıldı', /Risk kaydı güncellendi/.test(auditText));
check('İlişkilendirme audit trail’e yazıldı', /kontrolü bu riske bağlandı/.test(auditText));
check('Arşivleme audit trail’e yazıldı', /Kayıt arşivlendi/.test(auditText));
await page.screenshot({ path: 'crud-08-audit.png' });

// ---------- 8. Profil / kalıcılık paneli ----------
await page.goto(`${BASE}/#/profil`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const profileText = await page.locator('.page').innerText();
check('Kalıcılık paneli durumu gösteriyor', /Yerel değişiklikler kayıtlı/.test(profileText));
await page.screenshot({ path: 'crud-09-profil.png' });

// ---------- 9. Yetki kontrolü ----------
await setPersona('usr-04'); // Barış Öztürk — Hasar Uzmanı, yalnızca 'employee' rolü
await page.goto(`${BASE}/#/riskler`, { waitUntil: 'domcontentloaded' });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const newRiskBtn = await page.getByRole('button', { name: 'Yeni risk' }).count();
check('Çalışan rolünde "Yeni risk" gizli', newRiskBtn === 0);

await page.locator('table.data tbody tr').first().click();
await page.waitForTimeout(800);
const drawerFooter = await page.locator('.drawer-foot').innerText().catch(() => '');
check('Çalışan rolünde düzenleme reddediliyor', /yetkiniz yok/.test(drawerFooter), drawerFooter.slice(0, 80));
await page.screenshot({ path: 'crud-10-yetkisiz.png' });

await finish();
