// Üç doğrulama süitinin ortak iskeleti.
//
// Her süit kendi tarayıcısını açar; localStorage bu sayede süitler arasında
// taşınmaz ve her süit tohum veriden (seed) başlar. Sunucu adresi ve ekran
// görüntüsü klasörü ortam değişkeninden gelir, böylece süitler hem yerelde
// hem CI'da aynı şekilde koşar.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

export const BASE = process.env.NERVIA_BASE_URL ?? 'http://localhost:4173';

/**
 * Tarayıcıyı açar, oturum personasını enjekte eder ve sayaçları kurar.
 * @param {string} initialPersona Başlangıçta oturum açacak kullanıcının kimliği.
 */
export async function startRun(initialPersona) {
  const shotDir = process.env.NERVIA_SHOT_DIR ?? 'test-results';
  mkdirSync(shotDir, { recursive: true });
  // Süit gövdeleri ekran görüntülerini göreli yolla kaydeder; çalışma dizinini
  // taşıyarak hepsi tek klasörde toplanır.
  process.chdir(shotDir);

  // Playwright normalde kendi indirdiği Chromium'u kullanır. Sistemde hazır
  // bir Chromium varsa (CI imajı, kurumsal makine, sanal ortam) yolunu
  // NERVIA_CHROMIUM_PATH ile vermek indirmeyi tamamen atlatır.
  const executablePath = process.env.NERVIA_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 980 } });

  // Persona kapanış değişkeni olarak tutulur: addInitScript her gezinmede
  // yeniden koşar ve o anki değeri okur, sabit bir değeri ezmez.
  const state = { persona: initialPersona };
  await ctx.exposeFunction('__persona', () => state.persona);
  await ctx.addInitScript(async () => {
    try {
      localStorage.setItem('nervia.session', await window.__persona());
    } catch {
      /* depolama kapalıysa uygulama giriş ekranına düşer, test bunu raporlar */
    }
  });

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    // Yazı tipi CDN'i sanal ortamda engelli olabilir; ürün hatası değildir.
    if (m.type() === 'error' && !/ERR_CONNECTION_RESET/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text());
    }
  });

  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok: Boolean(ok) });
    console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  };
  const step = (n) => console.log('  →', n);
  const setPersona = (id) => {
    state.persona = id;
  };

  /** Sonucu özetler ve başarısızlıkta süreç çıkış kodunu 1 yapar. */
  const finish = async () => {
    const failed = results.filter((r) => !r.ok);
    const pageErrors = errs.filter((e) => e.startsWith('PAGEERROR:'));
    console.log(`\nSONUÇ: ${results.length - failed.length}/${results.length} kontrol başarılı`);
    if (failed.length) console.log('BAŞARISIZ:', failed.map((f) => f.name));
    console.log('ERRORS:', errs.length ? errs : 'none');
    await browser.close();
    if (failed.length || pageErrors.length) process.exitCode = 1;
    return { total: results.length, failed: failed.length, pageErrors: pageErrors.length };
  };

  return { browser, ctx, page, check, step, setPersona, finish };
}
