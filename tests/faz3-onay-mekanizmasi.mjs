// Faz 3 — kritik alan değişikliklerinin onay zincirinden geçmesi
//
// Uygulamayı gerçek tarayıcıda uçtan uca sürer: kaydı oluşturur, arayüzden
// düzenler, sonucu ekranda ve audit trail'de doğrular. Sunucu adresi
// NERVIA_BASE_URL ile verilir (varsayılan: vite preview).
import { startRun, BASE } from './harness.mjs';

const { page, check, setPersona, finish } = await startRun('usr-03');


const openRisk = async (id) => {
  await page.goto('about:blank');
  await page.goto(`${BASE}/#/riskler/${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
};

// R-HSR-09 "Hasar tutarının hatalı tespit edilmesi" — sahibi Selin Tunç
const RISK = 'rsk-R-HSR-09';

// ---------- 1. Kritik OLMAYAN alan: doğrudan kaydedilir ----------
await openRisk(RISK);
const versionBefore = await page.locator('.drawer').innerText();
await page.getByRole('button', { name: 'Düzenle' }).click();
await page.waitForTimeout(500);
await page.getByLabel(/^Açıklama/).fill('Eksper raporunun eksik, fazla veya hatalı değerlendirilmesi sonucu yanlış hasar tutarı belirlenmesi. (açıklama güncellendi)');
await page.getByLabel(/Neden değiştiriliyor/).fill('Açıklama netleştirildi.');
const btnLabelNonCritical = await page.getByRole('button', { name: /Değişiklikleri kaydet|Onaya gönder/ }).textContent();
check('Kritik olmayan alanda düğme "kaydet" diyor', /kaydet/i.test(btnLabelNonCritical ?? ''), btnLabelNonCritical ?? '');
await page.getByRole('button', { name: /Değişiklikleri kaydet/ }).click();
await page.waitForTimeout(900);
const toast1 = await page.locator('.toast').innerText().catch(() => '');
check('Doğrudan kaydedildi bildirimi', /kaydedildi/i.test(toast1), toast1.split('\n')[0] ?? '');
const bodyAfterDirect = await page.locator('.drawer').innerText();
check('Açıklama hemen güncellendi', /açıklama güncellendi/.test(bodyAfterDirect));
await page.screenshot({ path: 'f3-01-dogrudan-kayit.png' });

// ---------- 2. Kritik alan: onaya gider ----------
await page.getByRole('button', { name: 'Düzenle' }).click();
await page.waitForTimeout(500);
// Artık riski [3,3]=9 -> [4,4]=16 yap (kritik alan)
const artik = page.locator('.modal .field').filter({ hasText: 'Artık risk' });
await artik.locator('.stack.gap-1').filter({ hasText: 'Olasılık' })
  .getByRole('button', { name: '4', exact: true }).click();
await page.waitForTimeout(250);
await artik.locator('.stack.gap-1').filter({ hasText: 'Etki' })
  .getByRole('button', { name: '4', exact: true }).click();
await page.waitForTimeout(400);
const artikScore = await artik.innerText();
check('Form skoru anında hesapladı (16)', /16/.test(artikScore), (artikScore.match(/SKOR\s+(\d+)/) ?? [])[1] ?? '');
const noticeVisible = await page.locator('.modal .callout', { hasText: 'onay gerektiriyor' }).count();
check('Formda onay uyarısı göründü', noticeVisible > 0);
const btnLabelCritical = await page.locator('.modal').getByRole('button', { name: /Onaya gönder|Değişiklikleri kaydet/ }).textContent();
check('Kritik alanda düğme "Onaya gönder" oldu', /onaya gönder/i.test(btnLabelCritical ?? ''), btnLabelCritical ?? '');
await page.screenshot({ path: 'f3-02-onay-uyarisi.png' });
await page.getByLabel(/Neden değiştiriliyor/).fill('2026-Q3 değerlendirmesinde artık risk yükseltildi.');
await page.getByRole('button', { name: /Onaya gönder/ }).click();
await page.waitForTimeout(1000);
const toast2 = await page.locator('.toast').innerText().catch(() => '');
check('Onaya gönderildi bildirimi', /onaya gönderildi/i.test(toast2), toast2.split('\n')[0] ?? '');
await page.screenshot({ path: 'f3-03-onaya-gonderildi.png' });

// ---------- 3. Kayıt HENÜZ değişmemiş olmalı ----------
await openRisk(RISK);
const bodyPending = await page.locator('.drawer').innerText();
check('Bekleyen talep şeridi göründü', /Onay bekleyen değişiklik var/.test(bodyPending));
check('Kayıt henüz değişmedi (artık skor 9)', /\b9\b/.test(bodyPending.split('RİSK – KONTROL')[0] ?? ''), '');
await page.screenshot({ path: 'f3-04-bekleyen-serit.png' });

// ---------- 4. Kendi talebini onaylayamama ----------
await page.goto(`${BASE}/#/degisiklikler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const requestCard = () => page.locator('.card').filter({ hasText: 'DT-2026-015' }).first();
const selfText = await requestCard().innerText();
check('Kendi talebini onaylayamıyor', /kendi talebini onaylayamaz/.test(selfText), '');
await page.screenshot({ path: 'f3-05-kendi-talebi.png' });

// ---------- 5. Birim yöneticisi onaylar ----------
setPersona('usr-02'); // Mert Aydın — Hasar Direktörü, birim yöneticisi
await page.goto('about:blank');
await page.goto(`${BASE}/#/degisiklikler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Onayla' }).first().click();
await page.waitForTimeout(500);
await page.getByLabel(/Karar açıklaması/).fill('Değerlendirme gerekçesi uygundur.');
await page.locator('.modal').getByRole('button', { name: 'Onayla' }).click();
await page.waitForTimeout(900);
const afterFirst = await page.locator('.card').filter({ hasText: 'DT-2026-015' }).first().innerText();
check('İlk onaydan sonra ikinci kademeye geçti', /Risk Yönetimi Onayında|RİSK YÖNETİMİ ONAYI/i.test(afterFirst), '');
await page.screenshot({ path: 'f3-06-ilk-onay.png' });

// Kayıt hâlâ değişmemiş olmalı
await openRisk(RISK);
const stillPending = await page.locator('.drawer').innerText();
check('Tek onaydan sonra kayıt hâlâ değişmedi', /Onay bekleyen değişiklik var/.test(stillPending));

// ---------- 6. Risk Yönetimi onaylar → uygulanır ----------
setPersona('usr-20'); // Pelin Yavuz — Risk Yönetimi Direktörü
await page.goto('about:blank');
await page.goto(`${BASE}/#/degisiklikler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Onayla' }).first().click();
await page.waitForTimeout(500);
await page.getByLabel(/Karar açıklaması/).fill('Risk profiline uygundur, onaylanmıştır.');
await page.locator('.modal').getByRole('button', { name: 'Onayla' }).click();
await page.waitForTimeout(1000);
await page.getByRole('tab', { name: /Onaylanan/ }).click();
await page.waitForTimeout(600);
const applied = await page.locator('.card').filter({ hasText: 'DT-2026-015' }).first().innerText();
check('Talep onaylandı ve uygulandı', /Onaylandı ve uygulandı/.test(applied), '');
await page.screenshot({ path: 'f3-07-uygulandi.png' });

// ---------- 7. Kayıt artık değişmiş olmalı ----------
await openRisk(RISK);
const finalBody = await page.locator('.drawer').innerText();
check('Bekleyen şerit kayboldu', !/Onay bekleyen değişiklik var/.test(finalBody));
check('Artık risk yeni değere geçti (16)', /16/.test(finalBody), '');
await page.screenshot({ path: 'f3-08-son-durum.png' });

// ---------- 8. Audit trail ----------
await page.goto(`${BASE}/#/audit`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const audit = await page.locator('.timeline').first().innerText();
check('Talep oluşturma audit’te', /Değişiklik talebi oluşturuldu/.test(audit));
check('İki onay kaydı audit’te', (audit.match(/onayladı/gi) ?? []).length >= 2, String((audit.match(/onayladı/gi) ?? []).length));
check('Uygulama audit’te', /onayı uygulandı|Talep onaylandı ve uygulandı/.test(audit));
await page.screenshot({ path: 'f3-09-audit.png' });

// ---------- 9. Kalıcılık ----------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await openRisk(RISK);
const persisted = await page.locator('.drawer').innerText();
check('Onay sonucu yenilemeden sonra duruyor', /16/.test(persisted) && !/Onay bekleyen/.test(persisted));

await finish();
