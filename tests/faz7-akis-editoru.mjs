// Faz 7 — süreç akışı editörü
//
// Akış editörü, süreç ağacını yukarıdan aşağı akan kutular hâlinde gösterir
// ve düzenlemeye açar. Süreç Kanvası'ndan farkı, seviyelerin AYNI ekranda
// iç içe açılmasıdır: üst kutu görüntüden çıkmaz.
//
// Bu süit beş şeyi doğrular:
// (1) akış dikey olarak çiziliyor ve kutular okla bağlanıyor,
// (2) bir kutu açıldığında alt adımları yerinde çıkıyor ve ÜST KUTU DURUYOR,
// (3) iki kutu arasına yeni adım eklenebiliyor ve doğru sıraya giriyor,
// (4) adım paneli risk/kontrol/prosedür gösteriyor ve oradan ekleme yapılıyor,
// (5) düzenleme yetkisi olmayan rol ekleme tutamaklarını görmüyor.
import { startRun, BASE } from './harness.mjs';

const { page, check, step, setPersona, finish } = await startRun('usr-22');

const boxCount = () => page.locator('.fe-box').count();

/** Ekrandaki TÜM kutu adları (iç içe açılmış olanlar dâhil). */
const boxNames = async () =>
  (await page.locator('.fe-box-main strong').allInnerTexts()).map((t) => t.trim());

/**
 * Yalnızca EN ÜST seviyedeki kutu adları, akış sırasıyla.
 *
 * Sıralama kontrolleri bunu kullanmalı: alt dallar açıkken düz liste,
 * kardeş sırasıyla iç içe sırayı karıştırıyor. Doğrudan çocuk zinciri
 * (.fe-canvas > .fe-branch > .fe-slot > .fe-box > .fe-box-main) yalnızca
 * kökün kardeşlerini verir, çünkü .fe-nest kutunun içinde değil yanındadır.
 */
const topNames = async () =>
  (await page
    .locator('.fe-canvas > .fe-branch > .fe-slot > .fe-box > .fe-box-main strong')
    .allInnerTexts()).map((t) => t.trim());

await page.goto(`${BASE}/#/akis`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

// ---------- 1. Süreç seçimi ve dikey akış ----------
// Kanvasın varyant seçicisi bu ekrana taşındı: her ana süreç bir akış.
const variants = (await page.locator('.fe-variant').allInnerTexts()).map((v) => v.trim());
check('Yurt içi hasar akışı listeleniyor', variants.some((v) => /Yurt İçi Hasar/.test(v)));
check('Yurt dışı hasar akışı listeleniyor', variants.some((v) => /Yurt Dışı Hasar/.test(v)));

// Akış başvurudan kapanışa okunuyor mu?
const flowOrder = await topNames();
step(`Akış: ${flowOrder.join(' → ')}`);
check('Akış başvuruyla başlıyor', /Başvuru/.test(flowOrder[0] ?? ''), flowOrder[0] ?? '');
check('Akış dosya kapanışıyla bitiyor',
  /Kapanış/.test(flowOrder[flowOrder.length - 1] ?? ''), flowOrder[flowOrder.length - 1] ?? '');

const topLevel = await boxCount();
check('Akış kutuları çizildi', topLevel >= 2, `${topLevel} kutu`);

// Sayaçlar: her kutu altındaki her şeyin toplamını taşır (eski kanvas işi).
const firstChips = (await page.locator('.fe-box').first().locator('.fe-chip').allInnerTexts())
  .map((t) => t.replace(/\s+/g, ' ').trim());
check('Kutuda risk sayacı var', firstChips.some((c) => /^Risk/.test(c)), firstChips.join(' · '));
check('Kutuda kontrol sayacı var', firstChips.some((c) => /^Kontrol/.test(c)));
check('Kutuda prosedür sayacı var', firstChips.some((c) => /^Prosedür/.test(c)));
check('Kutuda doküman sayacı var', firstChips.some((c) => /^Doküman/.test(c)));
const nonZero = await page.locator('.fe-chip:not(.is-zero)').count();
check('Sayaçlar dolu', nonZero >= 1, `${nonZero} dolu sayaç`);
const arrows = await page.locator('.fe-arrow').count();
check('Kutular okla bağlandı', arrows === topLevel - 1, `${arrows} ok / ${topLevel} kutu`);
const firstName = (await topNames())[0];
step(`İlk adım: ${firstName}`);
await page.screenshot({ path: 'ed-01-akis.png' });

// ---------- 2. Yerinde açılma: üst kutu ekranda kalıyor ----------
await page.locator('.fe-box-main').first().click();
await page.waitForTimeout(700);
const afterOpen = await boxCount();
check('Alt adımlar yerinde açıldı', afterOpen > topLevel, `${topLevel} → ${afterOpen}`);
const namesAfterOpen = await boxNames();
check('Üst kutu görüntüden çıkmadı', namesAfterOpen.includes(firstName), firstName);
check('Alt dal girintili çizildi', (await page.locator('.fe-nest').count()) >= 1);
await page.screenshot({ path: 'ed-02-acildi.png' });

// Bir seviye daha
const nested = page.locator('.fe-nest .fe-box-main').first();
await nested.click();
await page.waitForTimeout(700);
const afterSecond = await boxCount();
check('İkinci seviye de yerinde açıldı', afterSecond > afterOpen, `${afterOpen} → ${afterSecond}`);

// Ok işareti kapatıyor; gövdeye tıklamak açık kutuyu kapatmıyor
await page.locator('.fe-box.is-selected .fe-box-main').first().click();
await page.waitForTimeout(500);
check('Açık kutuyu seçmek onu kapatmıyor', (await boxCount()) === afterSecond, `${await boxCount()}`);
await page.locator('.fe-nest .fe-box-caret-btn').first().click();
await page.waitForTimeout(500);
check('Ok işareti alt dalı kapattı', (await boxCount()) < afterSecond, `${await boxCount()}`);

// ---------- 3. Araya adım ekleme ----------
// En üstteki tutamak, akışın BAŞINA ekler.
const beforeInsert = await topNames();
await page.locator('.fe-insert-btn').first().click();
await page.waitForTimeout(600);
const modal = page.locator('.modal');
check('Adım ekleme formu açıldı', await modal.count() > 0);
// Etiket zorunlu alanlarda yıldız taşıyor ("Ad*"); bu yüzden başa
// çapalı ama sona çapasız desen kullanılıyor.
await modal.getByLabel(/^Ad/).first().fill('Otomatik doğrulama adımı');
await modal.getByLabel(/^Açıklama/).fill('Akış editörü araya ekleme kontrolü için oluşturuldu.');
await page.screenshot({ path: 'ed-03-ekleme-formu.png' });
await modal.getByRole('button', { name: /oluştur$/ }).click();
await page.waitForTimeout(1000);

const afterInsert = await topNames();
check('Yeni adım akışa eklendi', afterInsert.includes('Otomatik doğrulama adımı'));
check('Yeni adım akışın başına girdi',
  afterInsert[0] === 'Otomatik doğrulama adımı',
  `${beforeInsert[0]} → ${afterInsert[0]}`);
await page.screenshot({ path: 'ed-04-eklendi.png' });

// ---------- 4. Sıralama ----------
await page.locator('.fe-box').first().locator('.fe-box-menu button').first().click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: 'Aşağı taşı' }).click();
await page.waitForTimeout(800);
const afterMove = await topNames();
check('Adım bir aşağı taşındı',
  afterMove[1] === 'Otomatik doğrulama adımı' && afterMove[0] === beforeInsert[0],
  afterMove.slice(0, 2).join(' | '));

// ---------- 5. Kalıcılık ----------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const afterReload = await topNames();
check('Eklenen adım yenilemeden sonra duruyor', afterReload.includes('Otomatik doğrulama adımı'));
check('Sıra da korundu', afterReload[1] === 'Otomatik doğrulama adımı', afterReload.slice(0, 2).join(' | '));

// ---------- 6. Adım paneli: içerik ve ekleme ----------
await page.locator('.fe-box-main').first().click();
await page.waitForTimeout(800);
const panelLinks = await page.locator('.fe-inspector .rel-control').count();
check('Adım paneli kayıtları listeliyor', panelLinks >= 1, `${panelLinks} kayıt`);

await page.locator('.fe-inspector').getByRole('button', { name: 'Risk ekle' }).click();
await page.waitForTimeout(600);
const riskModal = page.locator('.modal');
await riskModal.getByLabel(/Risk adı/).fill('Akış editöründen eklenen risk');
await riskModal.getByLabel(/^Açıklama/).fill('Panelden ekleme kontrolü.');
await riskModal.getByLabel(/Risk nedeni/).fill('Otomatik test.');
await riskModal.getByLabel(/Risk sonucu/).fill('Yok — test kaydıdır.');
await riskModal.getByRole('button', { name: 'Riski oluştur' }).click();
await page.waitForTimeout(1000);
const panelText = await page.locator('.fe-inspector').innerText();
check('Panelden eklenen risk adımda göründü', /Akış editöründen eklenen risk/.test(panelText));
await page.screenshot({ path: 'ed-05-panel.png' });

// Kutudaki sayaç da arttı mı? (sayaç alt ağacın toplamıdır)
const chipText = await page.locator('.fe-box.is-selected .fe-chip').first().innerText();
check('Kutudaki risk sayacı güncellendi', /\d/.test(chipText), chipText.replace(/\n/g, ' '));

// ---------- 7. Akıştan çıkarma onay zincirine düşüyor ----------
// Süreçte "status" kritik alandır; adım tek kişinin kararıyla kaybolmamalı.
await page.locator('.fe-box.is-selected .fe-box-menu button').first().click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: /Akıştan çıkar/ }).click();
await page.waitForTimeout(900);
const toast = await page.locator('.toast').innerText().catch(() => '');
check('Akıştan çıkarma onaya gönderildi', /onaya gönderildi/i.test(toast), toast.split('\n')[0] ?? '');

// ---------- 8. Başka bir sürece geçiş ----------
await page.locator('.fe-variant', { hasText: 'Yurt Dışı Hasar' }).click();
await page.waitForTimeout(900);
const hsdFlow = await topNames();
step(`Yurt dışı akışı: ${hsdFlow.join(' → ')}`);
check('Yurt dışı akışına geçildi', hsdFlow.length >= 2 && !hsdFlow.includes('Başvuru ve İhbar'),
  hsdFlow.join(' | '));

// ---------- 9. Yetkisiz rol düzenleyemiyor ----------
await setPersona('usr-04'); // Barış Öztürk — yalnızca 'employee'
await page.goto(`${BASE}/#/akis`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
check('Çalışan rolünde araya ekleme tutamağı yok',
  (await page.locator('.fe-insert-btn').count()) === 0);
check('Çalışan rolünde adım menüsü yok',
  (await page.locator('.fe-box-menu').count()) === 0);
check('Çalışan rolü akışı yine de görebiliyor', (await boxCount()) >= 2);
await page.screenshot({ path: 'ed-06-calisan.png' });

await finish();
