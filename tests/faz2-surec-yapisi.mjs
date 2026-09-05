// Faz 2 — süreç ağacı düzenleme, sıralama, kritik nokta ve doküman yönetimi
//
// Uygulamayı gerçek tarayıcıda uçtan uca sürer: kaydı oluşturur, arayüzden
// düzenler, sonucu ekranda ve audit trail'de doğrular. Sunucu adresi
// NERVIA_BASE_URL ile verilir (varsayılan: vite preview).
import { startRun, BASE } from './harness.mjs';

const { page, check, finish } = await startRun('usr-22');


// ---------- 1. Yeni ana süreç ----------
await page.goto(`${BASE}/#/surecler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const processCountBefore = await page.locator('.proc-card').count();
console.log(`  → Başlangıç ana süreç sayısı: ${processCountBefore}`);

await page.getByRole('button', { name: 'Yeni ana süreç' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'f2-01-surec-formu.png' });
await page.getByLabel(/^Ad/).first().fill('Pazarlama ve İletişim');
await page.getByLabel(/^Açıklama/).fill('Marka iletişimi, kampanya yönetimi ve dış iletişim süreçleri.');
await page.getByLabel(/^Amaç/).fill('Kurumsal iletişimin mevzuata ve marka ilkelerine uygun yürütülmesi.');
await page.getByLabel(/Kullanılan sistem/).fill('Kampanya Yönetimi');
await page.keyboard.press('Enter');
await page.getByRole('button', { name: /Ana Süreç oluştur/ }).click();
await page.waitForTimeout(900);
const url1 = page.url();
check('Yeni ana süreç oluşturuldu', /surecler\/nd-/.test(url1), url1.split('#')[1] ?? '');
await page.screenshot({ path: 'f2-02-surec-olustu.png' });

// ---------- 2. Alt süreç ekle ----------
await page.getByRole('button', { name: 'Alt kayıt ekle' }).click();
await page.waitForTimeout(500);
await page.getByLabel(/^Ad/).first().fill('Kampanya Yönetimi');
await page.getByLabel(/^Açıklama/).fill('Kampanya tasarımı, onayı ve yayına alınması.');
await page.getByRole('button', { name: /Alt Süreç oluştur/ }).click();
await page.waitForTimeout(900);
check('Alt süreç eklendi', /surecler\/nd-/.test(page.url()));

// ---------- 3. Faaliyet ekle (yapı sekmesinden) ----------
await page.getByRole('button', { name: 'Alt kayıt ekle' }).click();
await page.waitForTimeout(500);
await page.getByLabel(/^Ad/).first().fill('Kampanya Onayı');
await page.getByLabel(/^Açıklama/).fill('Kampanya içeriğinin hukuk ve uyum açısından onaylanması.');
await page.getByRole('button', { name: /Faaliyet oluştur/ }).click();
await page.waitForTimeout(900);
const drawerOpen = await page.locator('.drawer').count();
check('Faaliyet eklendi ve detayı açıldı', drawerOpen > 0);
await page.screenshot({ path: 'f2-03-faaliyet.png' });

// ---------- 4. Yapı sekmesi ----------
await page.getByRole('tab', { name: /Yapı/ }).click();
await page.waitForTimeout(500);
const structureText = await page.locator('.drawer-body').innerText();
check('Yapı sekmesi üst süreci gösteriyor', /Kampanya Yönetimi/.test(structureText));
await page.screenshot({ path: 'f2-04-yapi.png' });

// ---------- 5. İkinci faaliyet + sıralama ----------
await page.getByRole('button', { name: /Bu seviyeye faaliyet ekle/ }).click();
await page.waitForTimeout(500);
await page.getByLabel(/^Ad/).first().fill('Kampanya Yayını');
await page.getByLabel(/^Açıklama/).fill('Onaylı kampanyanın kanallarda yayına alınması.');
await page.getByRole('button', { name: /Faaliyet oluştur/ }).click();
await page.waitForTimeout(900);
await page.getByRole('tab', { name: /Yapı/ }).click();
await page.waitForTimeout(500);
const orderBefore = await page.locator('.drawer-body').innerText();
check('İki faaliyet sıralanıyor', /1 \/ 2|2 \/ 2/.test(orderBefore), (orderBefore.match(/\d \/ \d/) ?? [''])[0]);

await page.locator('button[title="Yukarı taşı"]').click();
await page.waitForTimeout(700);
const orderAfter = await page.locator('.drawer-body').innerText();
check('Sıra değiştirildi', /1 \/ 2/.test(orderAfter), (orderAfter.match(/\d \/ \d/) ?? [''])[0]);
await page.screenshot({ path: 'f2-05-sira.png' });

// ---------- 6. Kritik nokta + örnek senaryo ----------
await page.getByRole('button', { name: 'Düzenle' }).first().click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Kritik nokta ekle/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/^Açıklama/).last().fill('Kampanya metinleri yayından önce hukuk onayından geçmelidir.');
await page.getByRole('button', { name: /Örnek senaryo ekle/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/^Başlık/).last().fill('Onaysız kampanya yayını');
await page.getByLabel(/Neden değiştiriliyor/).fill('Faaliyet için kritik nokta ve örnek senaryo tanımlandı.');
await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(900);
const tabs = await page.locator('.tabs').innerText();
check('Kritik nokta ve örnek kaydedildi', /Örnekler\s*1/.test(tabs), tabs.replace(/\n/g, ' '));
await page.screenshot({ path: 'f2-06-kritik-ornek.png' });

// ---------- 7. Doküman ekle ----------
await page.getByRole('tab', { name: /Prosedür/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /doküman ekle/ }).click();
await page.waitForTimeout(500);
await page.getByLabel(/Doküman adı/).fill('Kampanya Onay Prosedürü');
await page.getByLabel(/^Özet/).fill('Kampanya içeriklerinin hukuk ve uyum onayına ilişkin kurallar.');
await page.getByRole('button', { name: /Bölüm ekle/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/^Başlık/).last().fill('1. Amaç');
await page.getByLabel(/^Metin/).last().fill('Bu prosedürün amacı kampanya içeriklerinin yayından önce onaylanmasını sağlamaktır.');
await page.getByRole('button', { name: 'Dokümanı oluştur' }).click();
await page.waitForTimeout(900);
const procText = await page.locator('.drawer-body').innerText();
check('Doküman oluşturuldu ve adıma bağlandı', /Kampanya Onay Prosedürü/.test(procText));
await page.screenshot({ path: 'f2-07-dokuman.png' });

// ---------- 8. Kalıcılık ----------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
await page.goto(`${BASE}/#/surecler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const processCountAfter = await page.locator('.proc-card').count();
check('Yeni süreç yenilemeden sonra duruyor', processCountAfter === processCountBefore + 1,
  `${processCountBefore} → ${processCountAfter}`);

// ---------- 9. Süreç arşivleme ----------
await page.locator('.proc-card', { hasText: 'Pazarlama ve İletişim' })
  .getByRole('button', { name: 'Süreci aç' }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Süreç detayı' }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Düzenle' }).first().click();
await page.waitForTimeout(500);
await page.getByLabel(/^Durum/).selectOption('archived');
await page.getByLabel(/Neden değiştiriliyor/).fill('Süreç devredildi; kayıt arşive alındı.');
await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(900);
await page.keyboard.press('Escape');
await page.goto(`${BASE}/#/surecler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const processCountArchived = await page.locator('.proc-card').count();
check('Arşivlenen süreç haritadan düştü', processCountArchived === processCountBefore,
  `${processCountAfter} → ${processCountArchived}`);
const archiveBtn = await page.getByRole('button', { name: /^Arşiv \(/ }).count();
check('Süreç arşiv görünümü açıldı', archiveBtn > 0);
await page.screenshot({ path: 'f2-08-arsiv.png' });

// ---------- 10. Audit trail ----------
await page.goto(`${BASE}/#/audit`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const auditText = await page.locator('.timeline').first().innerText();
check('Süreç oluşturma audit’te', /Yeni süreç kaydı oluşturuldu/.test(auditText));
check('Sıra değişikliği audit’te', /yer değiştirdi/.test(auditText));
check('Doküman oluşturma audit’te', /Yeni doküman oluşturuldu/.test(auditText));
check('Süreç güncelleme audit’te', /Süreç kaydı güncellendi/.test(auditText));
await page.screenshot({ path: 'f2-09-audit.png' });

await finish();
