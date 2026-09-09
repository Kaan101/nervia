// Faz 4 — giriş, rol bazlı yetkilendirme ve yönetici yetki düzenlemesi
//
// Kimlik doğrulamayı, menü/rota denetimini ve yöneticinin yetki
// değişikliğinin anında etki etmesini uçtan uca doğrular.
import { startRun, BASE } from './harness.mjs';

const { page, check, setPersona, finish } = await startRun('usr-25');

const PW = 'Nervia2026!';

/** Tam yeniden yükleme: hash gezinmesi aynı belgede kalır. */
const open = async (hash) => {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
};

/**
 * Oturumu kapatıp giriş ekranına döner.
 *
 * Anahtarı silmek yetmiyor: harness'ın init script'i oturum yoksa
 * başlangıç personasını geri yazıyor. Geçersiz ama dolu bir değer
 * yazmak hem uygulamayı giriş ekranına düşürüyor hem de yeniden
 * enjeksiyonu engelliyor.
 */
const signOut = async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('nervia.session', 'oturum-kapali'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
};

// ---------- 1. Giriş ekranı ve hatalı parola ----------
await signOut();
const loginVisible = await page.getByRole('button', { name: 'Giriş yap' }).count();
check('Oturum yokken giriş ekranı çıkıyor', loginVisible > 0);

await page.getByLabel('E-posta').fill('sinem.aktas@nervia.example');
await page.getByLabel('Parola').fill('kesinlikleyanlis');
await page.getByRole('button', { name: 'Giriş yap' }).click();
await page.waitForTimeout(700);
const wrongMsg = (await page.locator('[role="alert"]').textContent()) ?? '';
check('Hatalı parola reddediliyor', /parola hatalı/i.test(wrongMsg), wrongMsg);
check('Kalan deneme hakkı gösteriliyor', /deneme hakkınız kaldı/.test(wrongMsg));
await page.screenshot({ path: 'f4-01-hatali-parola.png' });

// Var olmayan hesapla aynı mesaj gelmeli: hesabın varlığı ele verilmemeli.
await page.getByLabel('E-posta').fill('olmayan.kisi@nervia.example');
await page.getByLabel('Parola').fill('birsey');
await page.getByRole('button', { name: 'Giriş yap' }).click();
await page.waitForTimeout(600);
const unknownMsg = (await page.locator('[role="alert"]').textContent()) ?? '';
check('Olmayan hesap için ayırt edici bilgi sızmıyor',
  /E-posta veya parola hatalı\.$/.test(unknownMsg.trim()), unknownMsg);

// ---------- 2. Doğru parola ile giriş ----------
await page.getByLabel('E-posta').fill('sinem.aktas@nervia.example');
await page.getByLabel('Parola').fill(PW);
await page.getByRole('button', { name: 'Giriş yap' }).click();
await page.waitForTimeout(1200);
const shell = await page.locator('.sidebar-nav').count();
check('Doğru parola ile giriş yapılıyor', shell > 0);
await page.screenshot({ path: 'f4-02-giris-basarili.png' });

// ---------- 3. Menü rol bazlı filtreleniyor ----------
const controlMenu = await page.locator('.sidebar-nav').innerText();
check('İç Kontrol audit trail görüyor', /Audit Trail/.test(controlMenu));
check('İç Kontrol yönetim menüsünü görmüyor', !/Rol ve Yetki Yönetimi/.test(controlMenu));

await setPersona('usr-04'); // Barış Öztürk — yalnızca çalışan
await open('#/');
const employeeMenu = await page.locator('.sidebar-nav').innerText();
check('Çalışan audit trail görmüyor', !/Audit Trail/.test(employeeMenu));
check('Çalışan değişiklik yönetimini görmüyor', !/Değişiklik Yönetimi/.test(employeeMenu));
check('Çalışan süreç akışını görüyor', /Süreç Akışı/.test(employeeMenu));
await page.screenshot({ path: 'f4-03-calisan-menu.png' });

// ---------- 4. Rota koruması: adres çubuğundan atlatılamıyor ----------
await open('#/audit');
const blocked = await page.locator('.page').innerText();
check('Yetkisiz sayfa adresten açılamıyor', /erişim yetkiniz yok/i.test(blocked));
check('Hangi iznin gerektiği söyleniyor', /menu\.audit/.test(blocked));
await page.screenshot({ path: 'f4-04-rota-korumasi.png' });

// ---------- 5. Yönetici bir rolden menü iznini kaldırıyor ----------
await setPersona('usr-25'); // Volkan Ateş — sistem yöneticisi
await open('#/yetkiler');
await page.locator('.split-2 .card').filter({ hasText: 'İç Denetim' }).first().click();
await page.waitForTimeout(500);
const auditLabel = page.locator('label').filter({ hasText: 'Audit Trail' }).first();
check('İç Denetim rolünde audit menüsü açık',
  await auditLabel.locator('input[type="checkbox"]').isChecked());
await auditLabel.locator('input[type="checkbox"]').uncheck();
await page.waitForTimeout(600);
check('İzin kaldırıldı',
  !(await auditLabel.locator('input[type="checkbox"]').isChecked()));
await page.screenshot({ path: 'f4-05-izin-kaldirildi.png' });

// ---------- 6. Etki anında: o rolün kullanıcısı menüyü kaybetti ----------
await setPersona('usr-24'); // Ceren Balcı — İç Denetim
await open('#/');
const auditorMenu = await page.locator('.sidebar-nav').innerText();
check('Rol değişikliği kullanıcıda anında etkili', !/Audit Trail/.test(auditorMenu));
await open('#/audit');
check('Kaldırılan menü rotadan da kapandı',
  /erişim yetkiniz yok/i.test(await page.locator('.page').innerText()));
await page.screenshot({ path: 'f4-06-denetci-kayipmenu.png' });

// Geri al: sonraki kontroller etkilenmesin.
await setPersona('usr-25');
await open('#/yetkiler');
await page.locator('.split-2 .card').filter({ hasText: 'İç Denetim' }).first().click();
await page.waitForTimeout(500);
await page.locator('label').filter({ hasText: 'Audit Trail' }).first()
  .locator('input[type="checkbox"]').check();
await page.waitForTimeout(500);

// ---------- 7. Kullanıcı bazlı YASAK rolü ezer ----------
await page.getByRole('tab', { name: /Kullanıcı Atamaları/ }).click();
await page.waitForTimeout(700);
await page.getByLabel('Kullanıcı ara').fill('Ceren');
await page.waitForTimeout(500);
await page.locator('table.data tbody tr').first().getByRole('button', { name: 'Düzenle' }).click();
await page.waitForTimeout(700);
await page.getByLabel('İzin', { exact: true }).selectOption('menu.riskler');
await page.getByLabel('Etki', { exact: true }).selectOption('deny');
await page.getByLabel('Gerekçe', { exact: true }).fill('Otomatik doğrulama: yasak testi.');
await page.getByRole('button', { name: 'Ekle' }).click();
await page.waitForTimeout(400);
check('İstisna listeye eklendi',
  /YASAK/.test(await page.locator('.modal').innerText()));
await page.screenshot({ path: 'f4-07-istisna.png' });
await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(800);

await setPersona('usr-24');
await open('#/');
const deniedMenu = await page.locator('.sidebar-nav').innerText();
check('Kullanıcı bazlı yasak rolü eziyor', !/Risk Kütüphanesi/.test(deniedMenu));
check('Diğer menüler etkilenmedi', /Kontrol Kütüphanesi/.test(deniedMenu));
await page.screenshot({ path: 'f4-08-yasak-etkili.png' });

// ---------- 8. Pasif hesap giriş yapamıyor ----------
await setPersona('usr-25');
await open('#/yetkiler');
await page.getByRole('tab', { name: /Kullanıcı Atamaları/ }).click();
await page.waitForTimeout(600);
await page.getByLabel('Kullanıcı ara').fill('Barış');
await page.waitForTimeout(500);
await page.locator('table.data tbody tr').first().getByRole('button', { name: 'Düzenle' }).click();
await page.waitForTimeout(700);
await page.locator('.modal').getByLabel('Hesap aktif').uncheck();
await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
await page.waitForTimeout(800);

await signOut();
await page.getByLabel('E-posta').fill('baris.ozturk@nervia.example');
await page.getByLabel('Parola').fill(PW);
await page.getByRole('button', { name: 'Giriş yap' }).click();
await page.waitForTimeout(800);
const passiveMsg = (await page.locator('[role="alert"]').textContent()) ?? '';
check('Pasif hesap giriş yapamıyor', /pasif durumda/i.test(passiveMsg), passiveMsg);
await page.screenshot({ path: 'f4-09-pasif-hesap.png' });

// ---------- 9. Değişiklikler denetim izinde ----------
await setPersona('usr-25');
await open('#/audit');
const audit = await page.locator('.timeline').first().innerText();
check('Rol izni değişikliği audit’te', /Rol izinleri güncellendi/.test(audit));
check('Hesap güncellemesi audit’te', /Yetki kaydı güncellendi/.test(audit));
check('Pasife alma audit’te', /pasife alındı/i.test(audit));
await page.screenshot({ path: 'f4-10-audit.png' });

// ---------- 10. Kalıcılık ----------
await open('#/yetkiler');
await page.getByRole('tab', { name: /Kullanıcı Atamaları/ }).click();
await page.waitForTimeout(600);
await page.getByLabel('Kullanıcı ara').fill('Barış');
await page.waitForTimeout(500);
const persisted = await page.locator('table.data tbody tr').first().innerText();
check('Yetki değişikliği yenilemeden sonra duruyor', /Pasif/.test(persisted), persisted.split('\n').pop() ?? '');

await finish();
