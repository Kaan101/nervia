/**
 * Parola özetleme.
 *
 * ÖNEMLİ — bu bir gösterim ortamıdır ve arka uç yoktur. Doğrulama
 * tarayıcıda yapılır; özetler istemcide durur. Bu, gerçek bir güvenlik
 * sınırı DEĞİLDİR: tarayıcının geliştirici konsolunu açan biri bunu
 * atlatabilir. Amaç, yetkilendirme mantığının doğru modellenmesi ve
 * parolaların hiçbir yerde düz metin durmaması.
 *
 * Gerçek kullanımda doğrulama sunucuda yapılmalı ve parolalar Argon2id
 * ya da bcrypt gibi yavaş bir algoritmayla saklanmalıdır; SHA-256 bu iş
 * için kasıtlı olarak yavaş değildir.
 */

/** Rastgele salt üretir. */
export function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** salt + parola → onaltılık SHA-256 özeti. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Girilen parola kayıtlı özetle eşleşiyor mu? */
export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashPassword(password, salt);
  // Sabit süreli karşılaştırma: uzunluk aynıysa tüm baytlar taranır.
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Parola kuralları. Yönetici ekranında ve parola değiştirmede kullanılır.
 * Sorun yoksa boş dizi döner.
 */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 10) problems.push('En az 10 karakter olmalı.');
  if (!/[a-zçğıöşü]/.test(password)) problems.push('En az bir küçük harf içermeli.');
  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) problems.push('En az bir büyük harf içermeli.');
  if (!/[0-9]/.test(password)) problems.push('En az bir rakam içermeli.');
  if (!/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(password)) problems.push('En az bir simge içermeli.');
  return problems;
}
