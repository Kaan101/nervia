// Faz 2 — süreç ağacı kurma, sıralama, kritik nokta ve doküman yönetimi
//
// Süreç Haritası, Süreç Kanvası ve Hasar İş Akışı tek "Süreç Akışı"
// ekranında birleşti; bu süit de o ekran üzerinden koşar. Sınanan
// yetenekler değişmedi: yeni ana süreç, alt kayıt, sıralama, kritik nokta
// ve örnek senaryo, doküman bağlama, kalıcılık, arşivleme ve audit izi.
import { startRun, BASE } from './harness.mjs';

const { page, check, step, finish } = await startRun('usr-22');

/** Akıştaki en üst seviye kutu adları. */
const topNames = async () =>
  (await page
    .locator('.fe-canvas > .fe-branch > .fe-slot > .fe-box > .fe-box-main strong')
    .allInnerTexts()).map((t) => t.trim());

const openFlow = async () => {
  await page.goto(`${BASE}/#/akis`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
};

await openFlow();

// ---------- 1. Yeni ana süreç ----------
const rootsBefore = await page.locator('.fe-variant').count();
step(`Başlangıç ana süreç sayısı: ${rootsBefore}`);

await page.getByRole('button', { name: 'Yeni ana süreç' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'f2-01-surec-formu.png' });
await page.getByLabel(/^Ad/).first().fill('Pazarlama ve İletişim');
await page.getByLabel(/^Açıklama/).fill('Marka iletişimi, kampanya yönetimi ve dış iletişim süreçleri.');
await page.getByLabel(/^Amaç/).fill('Kurumsal iletişimin mevzuata ve marka ilkelerine uygun yürütülmesi.');
await page.getByLabel(/Kullanılan sistem/).fill('Kampanya Yönetimi');
await page.keyboard.press('Enter');
await page.getByRole('button', { name: /Ana Süreç oluştur/ }).click();
await page.waitForTimeout(1000);

const rootsAfter = await page.locator('.fe-variant').count();
check('Yeni ana süreç oluşturuldu', rootsAfter === rootsBefore + 1, `${rootsBefore} → ${rootsAfter}`);
const activeRoot = await page.locator('.fe-variant.is-active').innerText();
check('Yeni süreç akışta açıldı', /Pazarlama ve İletişim/.test(activeRoot), activeRoot.trim());
await page.screenshot({ path: 'f2-02-surec-olustu.png' });

// ---------- 2. Alt süreç ekle ----------
// Boş akışta "… ekle" düğmesi çıkar.
await page.getByRole('button', { name: /Alt Süreç ekle/ }).click();
await page.waitForTimeout(600);
await page.getByLabel(/^Ad/).first().fill('Kampanya Yönetimi');
await page.getByLabel(/^Açıklama/).fill('Kampanya tasarımı, onayı ve yayına alınması.');
await page.getByRole('button', { name: /Alt Süreç oluştur/ }).click();
await page.waitForTimeout(1000);
check('Alt süreç akışa eklendi', (await topNames()).includes('Kampanya Yönetimi'));

// ---------- 3. Faaliyet ekle ----------
// Alt sürece tıklayınca alt dalı açılır ve orada "Faaliyet ekle" çıkar.
await page.locator('.fe-box-main').first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: /Faaliyet ekle/ }).click();
await page.waitForTimeout(600);
await page.getByLabel(/^Ad/).first().fill('Kampanya Onayı');
await page.getByLabel(/^Açıklama/).fill('Kampanya içeriğinin hukuk ve uyum açısından onaylanması.');
await page.getByRole('button', { name: /Faaliyet oluştur/ }).click();
await page.waitForTimeout(1000);
const panelAfterActivity = await page.locator('.fe-inspector').innerText();
check('Faaliyet eklendi ve detayı açıldı', /Kampanya Onayı/.test(panelAfterActivity));
await page.screenshot({ path: 'f2-03-faaliyet.png' });

// ---------- 4. Adım detayı üst süreci ve künyeyi gösteriyor ----------
check('Adım detayı sorumlu birimi gösteriyor', /Sorumlu birim/i.test(panelAfterActivity));

// ---------- 5. İkinci faaliyet + sıralama ----------
await page.locator('.fe-nest .fe-insert-btn').last().click();
await page.waitForTimeout(600);
await page.getByLabel(/^Ad/).first().fill('Kampanya Yayını');
await page.getByLabel(/^Açıklama/).fill('Onaylı kampanyanın kanallarda yayına alınması.');
await page.getByRole('button', { name: /Faaliyet oluştur/ }).click();
await page.waitForTimeout(1000);

const nestNames = async () =>
  (await page.locator('.fe-nest .fe-box > .fe-box-main strong').allInnerTexts()).map((t) => t.trim());
const orderBefore = await nestNames();
check('İki faaliyet akışta sıralanıyor', orderBefore.length >= 2, orderBefore.join(' | '));

// Sonuncuyu yukarı taşı
await page.locator('.fe-nest .fe-box').last().locator('.fe-box-menu button').first().click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: 'Yukarı taşı' }).click();
await page.waitForTimeout(900);
const orderAfter = await nestNames();
check('Sıra değiştirildi',
  orderAfter[0] === orderBefore[orderBefore.length - 1],
  `${orderBefore.join(' | ')} → ${orderAfter.join(' | ')}`);
await page.screenshot({ path: 'f2-05-sira.png' });

// ---------- 6. Kritik nokta + örnek senaryo ----------
await page.locator('.fe-nest .fe-box-main').first().click();
await page.waitForTimeout(600);
await page.locator('.fe-inspector').getByRole('button', { name: 'Adımı düzenle' }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Kritik nokta ekle/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/^Açıklama/).last().fill('Kampanya metinleri yayından önce hukuk onayından geçmelidir.');
await page.getByRole('button', { name: /Örnek senaryo ekle/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/^Başlık/).last().fill('Onaysız kampanya yayını');
await page.getByLabel(/Neden değiştiriliyor/).fill('Faaliyet için kritik nokta ve örnek senaryo tanımlandı.');
await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(1000);
const toastCritical = await page.locator('.toast').innerText().catch(() => '');
check('Kritik nokta ve örnek kaydedildi', /kaydedildi/i.test(toastCritical), toastCritical.split('\n')[0] ?? '');
await page.screenshot({ path: 'f2-06-kritik-ornek.png' });

// ---------- 7. Doküman ekle ----------
await page.locator('.fe-inspector').getByRole('button', { name: 'Prosedür ekle' }).click();
await page.waitForTimeout(600);
await page.getByLabel(/Doküman adı/).fill('Kampanya Onay Prosedürü');
await page.getByLabel(/^Özet/).fill('Kampanya içeriklerinin hukuk ve uyum onayına ilişkin kurallar.');
await page.getByRole('button', { name: /Bölüm ekle/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/^Başlık/).last().fill('1. Amaç');
await page.getByLabel(/^Metin/).last().fill('Bu prosedürün amacı kampanya içeriklerinin yayından önce onaylanmasını sağlamaktır.');
await page.getByRole('button', { name: 'Dokümanı oluştur' }).click();
await page.waitForTimeout(1000);
const panelWithDoc = await page.locator('.fe-inspector').innerText();
check('Doküman oluşturuldu ve adıma bağlandı', /Kampanya Onay Prosedürü/.test(panelWithDoc));
await page.screenshot({ path: 'f2-07-dokuman.png' });

// ---------- 8. Kalıcılık ----------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const rootsReload = await page.locator('.fe-variant').count();
check('Yeni süreç yenilemeden sonra duruyor', rootsReload === rootsBefore + 1,
  `${rootsAfter} → ${rootsReload}`);

// ---------- 9. Süreç arşivleme ----------
// Yeni kayıtlar taslak durumda açılır; taslakta onay zinciri işlemez,
// bu yüzden arşivleme doğrudan uygulanır.
await page.locator('.fe-variant', { hasText: 'Pazarlama ve İletişim' }).click();
await page.waitForTimeout(800);
await page.locator('.fe-box').first().locator('.fe-box-menu button').first().click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: /Akıştan çıkar/ }).click();
await page.waitForTimeout(1000);
const archivedNames = await topNames();
check('Arşivlenen adım akıştan düştü', !archivedNames.includes('Kampanya Yönetimi'),
  archivedNames.join(' | ') || '(boş)');
await page.screenshot({ path: 'f2-08-arsiv.png' });

// ---------- 10. Audit trail ----------
await page.goto(`${BASE}/#/audit`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
const auditText = await page.locator('.timeline').first().innerText();
check('Süreç oluşturma audit’te', /Yeni süreç kaydı oluşturuldu/.test(auditText));
check('Sıra değişikliği audit’te', /yer değiştirdi/.test(auditText));
check('Doküman oluşturma audit’te', /Yeni doküman oluşturuldu/.test(auditText));
check('Süreç güncelleme audit’te', /Süreç kaydı güncellendi/.test(auditText));
await page.screenshot({ path: 'f2-09-audit.png' });

await finish();
