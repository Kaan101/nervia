// Doğrulama süitlerini sırayla koşar ve toplu sonuç üretir.
//
// Her süit ayrı bir Node süreci olarak çalışır: biri çökse bile diğerleri
// koşar ve rapor eksiksiz olur. Süitler kalıcı veriyi (localStorage)
// değiştirdiği için ayrı tarayıcı bağlamları şart; süreç ayrımı bunu da
// garanti eder.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const suites = [
  ['Faz 1 — kayıt yönetimi', 'faz1-kayit-yonetimi.mjs'],
  ['Faz 2 — süreç yapısı', 'faz2-surec-yapisi.mjs'],
  ['Faz 3 — onay mekanizması', 'faz3-onay-mekanizmasi.mjs'],
  ['Faz 4 — yetkilendirme', 'faz4-yetkilendirme.mjs'],
  ['Faz 5 — süreç kanvası', 'faz5-kanvas.mjs'],
  ['Faz 6 — dosya ekleri', 'faz6-ekler.mjs'],
  ['Faz 7 — hasar iş akışı', 'faz7-is-akisi.mjs'],
  ['Faz 8 — akış editörü', 'faz8-akis-editoru.mjs'],
];

const run = (file) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [join(here, file)], {
      stdio: 'inherit',
      // Süitler ekran görüntüsü için çalışma dizinini değiştirir; her biri
      // kendi sürecinde olduğu için bu birbirini etkilemez.
      cwd: process.cwd(),
      env: process.env,
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });

let failed = 0;
for (const [title, file] of suites) {
  console.log(`\n=== ${title} ===`);
  const code = await run(file);
  if (code !== 0) {
    failed += 1;
    console.log(`!!! ${title} BAŞARISIZ (çıkış kodu ${code})`);
  }
}

console.log(
  failed === 0
    ? `\nTÜM SÜİTLER GEÇTİ (${suites.length}/${suites.length})`
    : `\n${failed}/${suites.length} SÜİT BAŞARISIZ`,
);
process.exit(failed === 0 ? 0 : 1);
