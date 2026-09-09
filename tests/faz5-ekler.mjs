// Faz 5 — dosya bağlantısı ekleri
//
// Ekler dosyanın kendisini değil adresini tutar. Bu süit üç şeyi doğrular:
// (1) forma girilen ek kayda yazılıyor ve yenilemeden sonra duruyor,
// (2) http(s) adresleri açılabilir bağlantı, ağ/dosya yolları kopyalanabilir
//     düğme olarak çıkıyor,
// (3) çalıştırılabilir şemalar (javascript:) reddediliyor.
import { startRun, BASE } from './harness.mjs';

const { page, check, step, finish } = await startRun('usr-22');

/** Ek ekleme satırını doldurup "Ek ekle" düğmesine basar. */
const addAttachment = async (scope, { label, href, note }) => {
  await scope.getByLabel('Ek adı').fill(label);
  await scope.getByLabel('Bağlantı veya yol').fill(href);
  if (note) await scope.getByLabel('Not', { exact: true }).fill(note);
  await scope.getByRole('button', { name: 'Ek ekle' }).click();
  await page.waitForTimeout(300);
};

// ---------- 1. Tohum verisindeki ekler görünüyor ----------
await page.goto(`${BASE}/#/dokumanlar`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.getByText('Evrak Yönetimi Prosedürü').first().click();
await page.waitForTimeout(700);
const docPanel = page.locator('.drawer');
const seedText = await docPanel.innerText();
check('Dokümanda tohum eki listeleniyor', /Evrak Yönetimi Prosedürü v3\.0/.test(seedText));
check('SharePoint kaynağı etiketlenmiş', /SharePoint/.test(seedText));
const openLink = docPanel.getByRole('link', { name: 'Aç' }).first();
check('http adresi açılabilir bağlantı olarak sunuluyor', await openLink.count() > 0);
if (await openLink.count()) {
  const target = await openLink.getAttribute('target');
  const rel = await openLink.getAttribute('rel');
  check('Bağlantı yeni sekmede ve rel="noopener" ile açılıyor',
    target === '_blank' && (rel ?? '').includes('noopener'), `${target} / ${rel}`);
}
await page.screenshot({ path: 'ek-01-dokuman-tohum.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ---------- 2. Risk formundan ek ekle ----------
await page.goto(`${BASE}/#/riskler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Yeni risk' }).click();
await page.waitForTimeout(400);

const modal = page.locator('.modal');
await modal.getByLabel(/Risk adı/).fill('Ek bağlantısı testi');
await modal.getByLabel(/^Açıklama/).fill('Dosya bağlantısı özelliğini doğrulamak için açılmış geçici kayıt.');
await modal.getByLabel(/Risk nedeni/).fill('Otomatik test.');
await modal.getByLabel(/Risk sonucu/).fill('Yok — test kaydıdır.');

step('Zararlı şema deneniyor');
await addAttachment(modal, { label: 'Kötü ek', href: 'javascript:alert(1)' });
const rejected = await modal.locator('.callout.danger').innerText().catch(() => '');
check('javascript: şeması reddedildi', /kabul edilmiyor/i.test(rejected), rejected);

step('SharePoint bağlantısı ekleniyor');
await addAttachment(modal, {
  label: 'Risk değerlendirme tutanağı',
  href: 'https://tmtb.sharepoint.com/sites/Risk/Tutanaklar/2026-09.docx',
  note: 'Değerlendirme toplantısı tutanağı.',
});
step('Ağ paylaşımı yolu ekleniyor');
await addAttachment(modal, {
  label: 'Kanıt klasörü',
  href: '\\\\dosya01\\Risk\\Kanit\\2026\\eylul.xlsx',
});
await page.screenshot({ path: 'ek-02-risk-formu.png' });

const formText = await modal.innerText();
check('İki ek de forma eklendi',
  /Risk değerlendirme tutanağı/.test(formText) && /Kanıt klasörü/.test(formText));
check('Kaynak türü adresten otomatik çıkarıldı',
  /SharePoint/.test(formText) && /Ağ \/ Dizin/.test(formText));

await modal.getByRole('button', { name: 'Riski oluştur' }).click();
await page.waitForTimeout(900);

// ---------- 3. Detay panelinde görünüm ----------
const drawer = page.locator('.drawer');
const drawerText = await drawer.innerText();
// Bölüm başlığı CSS ile büyük harfe çevriliyor; innerText bunu uyguladığı
// için karşılaştırma büyük/küçük harften bağımsız yapılır.
check('Ekler detay panelinde listeleniyor',
  /ekler/i.test(drawerText) && /Risk değerlendirme tutanağı/.test(drawerText));
const copyBtn = drawer.getByRole('button', { name: 'Yolu kopyala' }).first();
check('Ağ yolu için kopyalama düğmesi sunuluyor', await copyBtn.count() > 0);
await page.screenshot({ path: 'ek-03-risk-detay.png' });

// ---------- 4. Kalıcılık ----------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
const afterReload = await page.locator('.drawer').innerText().catch(() => '');
check('Ekler yenilemeden sonra da duruyor', /Risk değerlendirme tutanağı/.test(afterReload));

// ---------- 5. Ek silinebiliyor ----------
await page.getByRole('button', { name: 'Düzenle' }).first().click();
await page.waitForTimeout(500);
const editModal = page.locator('.modal');
await editModal.getByRole('button', { name: 'Kanıt klasörü ekini kaldır' }).click();
await page.waitForTimeout(300);
await editModal.getByLabel(/Neden değiştiriliyor/).fill('Otomatik doğrulama: ek kaldırma testi.');
await editModal.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(900);
const afterRemove = await page.locator('.drawer').innerText();
check('Kaldırılan ek listeden çıktı',
  !/Kanıt klasörü/.test(afterRemove) && /Risk değerlendirme tutanağı/.test(afterRemove));

// ---------- 6. Audit trail'de "Ekler" alanı görünüyor ----------
await page.goto(`${BASE}/#/audit`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const auditText = await page.locator('.timeline').first().innerText();
check('Ek değişikliği audit trail\'e alan adıyla yazıldı', /Ekler/.test(auditText));
await page.screenshot({ path: 'ek-04-audit.png' });

await finish();
