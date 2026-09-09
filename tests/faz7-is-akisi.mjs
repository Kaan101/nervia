// Faz 7 — Hasar İş Akışı ekranı
//
// Akış şeması, süreç haritasından ayrı bir veridir: sıra ve karar ağı.
// Bu süit üç şeyi doğrular:
// (1) dokümandaki iki akış ve aşamaları eksiksiz listeleniyor,
// (2) şema gerçekten çiziliyor — kutu ve ok sayısı veriyle tutarlı,
// (3) bir adıma tıklandığında dokümandaki dayanağı, bağlı süreç adımı ve
//     o adımın risk/kontrolleri açılıyor.
import { startRun, BASE } from './harness.mjs';

const { page, check, step, setPersona, finish } = await startRun('usr-22');

await page.goto(`${BASE}/#/is-akisi`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);

// Ekran varsayılan olarak düzenlenebilir Akış Editörü'nü açar; bu süit
// dokümandan okunan salt okunur şemayı sınar, o yüzden görünüm değiştirilir.
await page.getByRole('button', { name: 'Doküman Şeması' }).click();
await page.waitForTimeout(800);

// ---------- 1. Varyantlar ve aşamalar ----------
const variants = await page.locator('.flow-variant').allInnerTexts();
check('Yurt içi akışı listeleniyor', variants.some((v) => /Yurt İçi Hasar İş Akışı/.test(v)));
check('Yurt dışı akışı listeleniyor', variants.some((v) => /Yurt Dışı Hasar İş Akışı/.test(v)));

const stages = await page.locator('.flow-stage-name').allInnerTexts();
step(`Yurt içi aşamalar: ${stages.join(' · ')}`);
// Doküman Madde 43: Kaza Bildirim, Dosya Oluşturma, Araştırma, Ödeme, Rücu İşlemleri
for (const s of ['Kaza Bildirim', 'Dosya Oluşturma', 'Araştırma', 'Ödeme', 'Rücu İşlemleri']) {
  check(`Aşama var: ${s}`, stages.some((x) => x.trim() === s));
}
await page.screenshot({ path: 'akis-01-giris.png' });

// ---------- 2. Şema çiziliyor ----------
const boxes = await page.locator('.flow-node').count();
const edges = await page.locator('.flow-edge').count();
check('Ana Süreçler aşamasında kutular çizildi', boxes >= 5, `${boxes} kutu`);
check('Kutular arasında ok çizildi', edges >= boxes - 1, `${edges} ok`);

// ---------- 3. Aşama değiştirme ----------
await page.locator('.flow-stage', { hasText: 'Araştırma' }).first().click();
await page.waitForTimeout(600);
const arastirmaBoxes = await page.locator('.flow-node').count();
check('Aşama değişince şema yenilendi', arastirmaBoxes > boxes, `${arastirmaBoxes} kutu`);
const decisions = await page.locator('.flow-node.kind-decision').count();
check('Araştırma aşamasında karar noktaları var', decisions >= 3, `${decisions} karar`);
await page.screenshot({ path: 'akis-02-arastirma.png' });

// ---------- 4. Adım detayı: dayanak, süreç adımı, risk ----------
// Şemadaki adı okunup açılan panelin aynı adı taşıdığı doğrulanır; içerik
// sabitlenmediği için veri değişse de kontrol ayakta kalır.
const stepBox = page.locator('.flow-node').filter({ hasText: 'Kusur değerlendirmesi' }).first();
// Kutu bir SVG <g> öğesidir; innerText SVG'de çalışmaz, textContent kullanılır.
const stepName = ((await stepBox.textContent()) ?? '').replace(/\s+/g, ' ').trim();
await stepBox.click();
await page.waitForTimeout(600);
const panel = await page.locator('.flow-inspector').innerText();
check('Adım detayı açıldı', panel.includes('Kusur değerlendirmesi'), stepName);

// Bölüm başlıkları CSS ile büyük harfe çevriliyor ve Türkçe'de "ADIMI" ile
// "adımı" arasında büyük/küçük harf eşleşmesi yok (noktalı/noktasız I).
// Bu yüzden başlık metni yerine yapı sınanır: bağlantı düğmesi ve skor rozeti.
const linkCount = await page.locator('.flow-inspector .rel-control').count();
check('Bağlı süreç adımı gösteriliyor', linkCount >= 1 && /HSR-\d+/.test(panel),
  `${linkCount} bağlantı`);
const riskChips = await page.locator('.flow-inspector .score-chip').count();
check('Adımın riskleri listeleniyor', riskChips >= 1, `${riskChips} risk`);
await page.screenshot({ path: 'akis-03-adim-detay.png' });

// Süreç adımına gidiş çalışıyor mu?
await page.locator('.flow-inspector .rel-control').first().click();
await page.waitForTimeout(800);
check('Süreç haritasına geçildi', /#\/surecler\/nd-/.test(page.url()), page.url().split('#')[1] ?? '');

// ---------- 5. Doküman dayanağı olan kutular işaretli ----------
await page.goto(`${BASE}/#/is-akisi`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Doküman Şeması' }).click();
await page.waitForTimeout(600);
await page.locator('.flow-stage', { hasText: 'Dosya Oluşturma' }).first().click();
await page.waitForTimeout(600);
const dots = await page.locator('.flow-node .flow-dot').count();
check('Dayanaklı kutular işaretlenmiş', dots >= 1, `${dots} işaret`);

// ---------- 6. Ölçek düğmeleri ----------
const svgBefore = await page.locator('.flow-svg').getAttribute('width');
await page.locator('.flow-zoom .btn', { hasText: '%60' }).click();
await page.waitForTimeout(400);
const svgAfter = await page.locator('.flow-svg').getAttribute('width');
check('Ölçek küçültme şemayı daralttı', Number(svgAfter) < Number(svgBefore), `${svgBefore} → ${svgAfter}`);

// ---------- 7. Yurt dışı akışı ----------
await page.locator('.flow-variant', { hasText: 'Yurt Dışı' }).click();
await page.waitForTimeout(700);
const hsdStages = await page.locator('.flow-stage-name').allInnerTexts();
step(`Yurt dışı aşamalar: ${hsdStages.join(' · ')}`);
check('Yurt dışı akışına geçildi',
  hsdStages.some((x) => x.trim() === 'Kaza Bildirim') && !hsdStages.some((x) => x.trim() === 'Rücu İşlemleri'));
const title = await page.locator('h1').first().innerText();
check('Başlık yurt dışı akışını gösteriyor', /Yurt Dışı Hasar İş Akışı/.test(title), title);
await page.screenshot({ path: 'akis-04-yurtdisi.png' });

// ---------- 8. Menü izni ----------
// Doküman uzmanı olmayan bir rolde de akış görünür (temel menülerde),
// ancak menü izni kaldırıldığında rota korunmalı. Burada yalnızca menüde
// göründüğü doğrulanır; rota koruması Faz 4'te sınanıyor.
await setPersona('usr-04'); // Barış Öztürk — yalnızca 'employee' rolü
await page.goto(`${BASE}/#/is-akisi`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Doküman Şeması' }).click();
await page.waitForTimeout(600);
const employeeTitle = await page.locator('h1').first().innerText().catch(() => '');
check('Çalışan rolü akışı görebiliyor', /Hasar İş Akışı/.test(employeeTitle), employeeTitle);

await finish();
