// Faz 5 — süreç kanvası
//
// Varyant seçiminden iş adımına kadar kırılımı, sayaçların doğruluğunu
// ve kanvastan yerinde kayıt eklemeyi doğrular.
import { startRun, BASE } from './harness.mjs';

const { page, check, finish } = await startRun('usr-22');

const open = async (hash) => {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
};

// ---------- 1. Giriş: varyant seçimi ----------
await open('#/kanvas');
const variants = await page.locator('.canvas-variant').allInnerTexts();
check('Kanvas girişinde iki hasar varyantı çıkıyor', variants.length === 2, `${variants.length} varyant`);
check('Yurt içi varyantı listeleniyor', variants.some((v) => /Yurt İçi Hasar/.test(v)));
check('Yurt dışı varyantı listeleniyor', variants.some((v) => /Yurt Dışı Hasar/.test(v)));
await page.screenshot({ path: 'f5-01-varyant.png' });

// ---------- 2. Ana süreç seviyesi ----------
await page.locator('.canvas-variant').filter({ hasText: 'Yurt Dışı' }).click();
await page.waitForTimeout(800);
check('Seçilen varyant açıldı', /Yurt Dışı Hasar Yönetimi/.test(
  (await page.locator('h1').first().textContent()) ?? ''));
// Kutu sayısını sabitlemiyoruz: demo veri değişince test kırılmamalı.
// Doğrulanan şey mekanizma — her alt süreç bir kutu, aralarında birer ok.
const subBoxes = await page.locator('.canvas-flow .canvas-box').count();
check('Alt süreçler kutu olarak çıkıyor', subBoxes >= 2, `${subBoxes} kutu`);
const arrows = await page.locator('.canvas-arrow').count();
check('Kutular bağlantı okuyla bağlı', arrows === subBoxes - 1, `${arrows} ok / ${subBoxes} kutu`);
await page.screenshot({ path: 'f5-02-anasurec.png' });

// Sayaç rozetleri
const firstCounts = await page.locator('.canvas-flow .canvas-counts').first().innerText();
check('Kutuda risk sayacı var', /Risk/.test(firstCounts));
check('Kutuda kontrol sayacı var', /Kontrol/.test(firstCounts));
check('Kutuda prosedür sayacı var', /Prosedür/.test(firstCounts));
check('Kutuda doküman sayacı var', /Doküman/.test(firstCounts));

// ---------- 3. Alt süreç → faaliyet ----------
// Tıklanacak kutunun adını önce okuyup sonra başlıkla karşılaştırıyoruz;
// böylece doğrulanan şey "doğru kutuya girildi mi", içeriğin kendisi değil.
const firstBoxName = (await page.locator('.canvas-flow .canvas-box-name').first().textContent())?.trim() ?? '';
await page.locator('.canvas-flow .canvas-box-main').first().click();
await page.waitForTimeout(800);
const openedTitle = ((await page.locator('h1').first().textContent()) ?? '').trim();
check('Alt süreç açıldı', openedTitle === firstBoxName, `${firstBoxName} → ${openedTitle}`);
const trail = await page.locator('.canvas-trail').innerText();
check('Kırıntı yolu derinliği gösteriyor',
  /Kanvas/.test(trail) && /Yurt Dışı Hasar Yönetimi/.test(trail));
await page.screenshot({ path: 'f5-03-altsurec.png' });

// Prosedürler faaliyet seviyesinde durur, adım seviyesinde değil. Bu yüzden
// kontrolü buradayken yapıyoruz: prosedür sayacı dolu olan kutuya girip
// listenin gerçekten dolduğunu doğruluyoruz.
const procBox = page.locator('.canvas-flow .canvas-box').filter({
  has: page.locator('.canvas-chip:not(.is-zero)', { hasText: 'Prosedür' }),
}).first();
if (await procBox.count()) {
  const procName = (await procBox.locator('.canvas-box-name').textContent())?.trim() ?? '';
  await procBox.locator('.canvas-box-main').click();
  await page.waitForTimeout(900);
  const procInspector = await page.locator('.canvas-inspector').innerText();
  check('Prosedür sayacı dolu olan seviyede prosedür listeleniyor',
    /PRS-[A-Z]+-\d+|TLM-[A-Z]+-\d+|CHK-[A-Z]+-\d+/.test(procInspector), procName);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
} else {
  check('Prosedür sayacı dolu olan seviyede prosedür listeleniyor', false,
    'prosedür sayacı dolu kutu bulunamadı');
}

// ---------- 4. Faaliyet seviyesi: kayıtlar görünüyor ----------
await page.locator('.canvas-flow .canvas-box-main').first().click();
await page.waitForTimeout(900);
const inspector = await page.locator('.canvas-inspector').innerText();
// Kayıt kodlarını sabitlemek yerine biçimlerini doğruluyoruz: bu faaliyette
// bir risk ve bir kontrol listeleniyor mu? Demo veri değişince test kırılmaz.
check('Faaliyetin riskleri listeleniyor', /R-[A-Z]+-\d+/.test(inspector));
check('Faaliyetin kontrolleri listeleniyor', /K-[A-Z]+-\d+/.test(inspector));

const steps = await page.locator('.canvas-flow .canvas-box').count();
check('İş adımları kutu olarak çıkıyor', steps >= 2, `${steps} adım`);
await page.screenshot({ path: 'f5-04-faaliyet.png' });

// ---------- 5. Kırıntı yolundan geri ----------
await page.locator('.canvas-trail button', { hasText: 'Yurt Dışı Hasar Yönetimi' }).click();
await page.waitForTimeout(800);
check('Kırıntı yolundan üst seviyeye dönülüyor', /Yurt Dışı Hasar Yönetimi/.test(
  (await page.locator('h1').first().textContent()) ?? ''));

// ---------- 6. Kanvastan risk ekleme ----------
await page.locator('.canvas-flow .canvas-box-main').first().click();
await page.waitForTimeout(700);
await page.locator('.canvas-flow .canvas-box-main').first().click();
await page.waitForTimeout(900);
const riskCountBefore = (await page.locator('.canvas-inspector .sh').first().innerText()).trim();

await page.locator('.canvas-inspector').getByRole('button', { name: 'Bu seviyeye ekle' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Risk', exact: true }).click();
await page.waitForTimeout(600);
check('Kanvastan risk formu açıldı', await page.locator('.modal').count() > 0);
await page.screenshot({ path: 'f5-05-risk-formu.png' });

await page.getByLabel(/Risk adı/).fill('Kanvastan eklenen test riski');
await page.getByLabel(/^Açıklama/).fill('Kanvas ekleme akışını doğrulamak için oluşturuldu.');
await page.getByLabel(/Risk nedeni/).fill('Otomatik test.');
await page.getByLabel(/Risk sonucu/).fill('Yok — test kaydıdır.');
await page.getByRole('button', { name: 'Riski oluştur' }).click();
await page.waitForTimeout(1000);

const afterAdd = await page.locator('.canvas-inspector').innerText();
check('Eklenen risk bu seviyede görünüyor', /Kanvastan eklenen test riski/.test(afterAdd));
const riskCountAfter = (await page.locator('.canvas-inspector .sh').first().innerText()).trim();
check('Risk sayacı arttı', riskCountBefore !== riskCountAfter, `${riskCountBefore} → ${riskCountAfter}`);
await page.screenshot({ path: 'f5-06-risk-eklendi.png' });

// ---------- 7. Kalıcılık ----------
const url = page.url();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
check('Eklenen kayıt yenilemeden sonra duruyor',
  /Kanvastan eklenen test riski/.test(await page.locator('.canvas-inspector').innerText()));

// ---------- 8. Yetkisiz kullanıcıda ekleme gizli ----------
await page.evaluate(() => localStorage.setItem('nervia.session', 'usr-04'));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const addForEmployee = await page.getByRole('button', { name: 'Bu seviyeye ekle' }).count();
check('Çalışan rolünde ekleme düğmesi yok', addForEmployee === 0);
await page.screenshot({ path: 'f5-07-yetkisiz.png' });

await finish();
