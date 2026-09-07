# Nervia

**Kurumsal İç Kontrol, Risk Yönetimi ve Süreç Yönetim Platformu**

Nervia; bir organizasyonun süreçlerini, alt süreçlerini, faaliyetlerini, iş adımlarını,
kontrol noktalarını, risklerini, prosedürlerini ve sorumluluklarını tek bir *görsel yapı*
üzerinden yönetmek için tasarlanmış bir GRC platformudur.

Tasarımın temel düşüncesi şudur:

> Bir organizasyonda herhangi bir işin nasıl yapıldığını, bu işte neyin yanlış gidebileceğini,
> hangi kontrolün bunu önlediğini, kimin sorumlu olduğunu ve mevcut risk seviyesinin ne
> olduğunu birkaç tıklamayla görebilmek.

Sistem klasik tablo veya statik doküman mantığında değildir. Kullanıcı, organizasyonun
işleyişini canlı bir süreç haritası üzerinde gezer; ihtiyaç duyduğu detayı açar, kapatır ve
süreçler arasındaki ilişkileri görsel olarak izler (*progressive disclosure*).

---

## Hızlı başlangıç

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run build      # tip kontrolü + üretim derlemesi
npm run preview    # derlenmiş sürümü yerelde çalıştır
npm run typecheck  # yalnızca tip kontrolü
npm test           # tip kontrolü + derleme + uçtan uca doğrulama
```

Uygulama tamamen istemci tarafında çalışır; arka uç gerektirmez. Demo veri kümesi
`src/data/` altında tanımlıdır ve her yüklemede deterministik olarak üretilir.

### Giriş ve yetkilendirme

Giriş **e-posta + parola** ile yapılır. Demo hesaplarının tamamının parolası
`Nervia2026!`, e-postalar `ad.soyad@nervia.example` biçimindedir.

> **Güvenlik notu.** Arka uç olmadığı için doğrulama tarayıcıda yapılır ve
> parola özetleri istemcide durur. Bu **gerçek bir güvenlik sınırı değildir** —
> konsolu açan biri atlatabilir. Amaç yetkilendirme modelinin doğru
> kurulması; gerçek kullanımda doğrulama sunucuya, parola saklama Argon2id
> veya bcrypt gibi yavaş bir algoritmaya taşınmalıdır.

Parolalar hiçbir yerde düz metin tutulmaz (SHA-256 + kullanıcıya özel salt),
art arda 5 hatalı denemede hesap 15 dakika kilitlenir, ve hesabın var olup
olmadığı hata mesajından anlaşılamaz.

Gösterim için parolasız hızlı geçiş de vardır; giriş ekranındaki
"Parolasız hızlı geçiş" düğmesi personaları listeler.

| Persona | Rol | Ne yapabilir |
|---|---|---|
| Elif Karaca | Üst Yönetim | Kurumsal risk profilini ve audit trail'i izler |
| Mert Aydın | Birim Yöneticisi · Süreç Sahibi | Kendi biriminin kayıtlarını yönetir, birinci kademe onayı verir |
| Barış Öztürk | Çalışan | Yalnızca okur; kendi aksiyonlarını günceller |
| Sinem Aktaş | İç Kontrol | Kontrol etkinliğini değerlendirir, ikinci kademe onayı verir |
| Pelin Yavuz | Risk Yönetimi | Risk skorlarını revize eder |
| Ceren Balcı | İç Denetim | Bağımsız güvence; her şeyi görür, hiçbir şeyi değiştirmez |
| Volkan Ateş | Sistem Yöneticisi | Rolleri, izinleri ve hesapları yönetir |

Oturum `localStorage`'da tutulur.

---

## Yetkilendirme modeli

Yetkiler koda gömülü değil, **veride** tanımlıdır ve yönetici arayüzden
değiştirir. Üç katman:

```
İZİN            KAPSAM                    ROL
risk.update  ×  all / unit / own / none = düzenlenebilir yetki demeti
menu.riskler
audit.view
```

**İzin** atomiktir: `kaynak.eylem` (`risk.update`), sistem yetkisi
(`audit.view`, `admin.roles`) ya da menü erişimi (`menu.riskler`).
Kaynaklar: süreç, risk, kontrol, aksiyon, doküman, KRI, gözden geçirme.
Eylemler: okuma, ekleme, güncelleme, arşivleme.

**Kapsam** iznin hangi kayıtlarda geçerli olduğunu söyler:

| Kapsam | Anlamı |
|---|---|
| `all` | Organizasyonun tamamı |
| `unit` | Kullanıcının birimi, **alt birimleri** ve hesabına eklenmiş ek birimler |
| `own` | Yalnızca sahibi olduğu kayıtlar |
| `none` | Yetki yok |

**Rol** izin + kapsam demetidir. Sekiz yerleşik rol vardır (Çalışan, Süreç
Sahibi, Birim Yöneticisi, İç Kontrol, Risk Yönetimi, İç Denetim, Üst
Yönetim, Sistem Yöneticisi); yerleşik roller silinemez ama izinleri
düzenlenebilir. Organizasyon kendi rollerini de tanımlayabilir —
mevcut bir rolden kopyalayarak başlamak mümkündür.

Bir kullanıcı birden çok rol taşıyabilir; roller birleşirken **geniş kapsam
kazanır**.

### Kullanıcıya özel istisnalar

Rolü bozmadan tek kişiye yetki vermek ya da almak için:

```
İZİN  + kapsam  → rolün verdiğini genişletir
YASAK           → rol izin verse bile yetkiyi tamamen kaldırır
```

**Ret her zaman kazanır.** Vekâlet, geçici kısıtlama gibi durumlar rol
tanımını kirletmeden çözülür; her istisna gerekçesiyle birlikte saklanır.

### Menü ve rota denetimi

Menü izni hem kenar çubuğunu hem rotayı yönetir. Kapalı bir sayfa yalnızca
gizlenmez — adres çubuğuna yazıldığında da açılmaz; kullanıcıya hangi iznin
eksik olduğunu söyleyen bir ekran çıkar. Menü tanımı `src/lib/navigation.ts`
içinde tek yerdedir, kenar çubuğu ve rota koruması aynı kaynaktan okur.

### Etki anında

Yönetici bir rolün iznini değiştirdiğinde, o rolü taşıyan oturumdaki
kullanıcıların menüsü ve yetkileri **anında** değişir; yeniden giriş
gerekmez. Rol, hesap ve parola değişikliklerinin hepsi denetim izine yazılır.

---

## Bilgi mimarisi

```
ORGANİZASYON
  └── ANA SÜREÇ            (Hasar Yönetimi, Mali İşler, Hukuk, BT, İK, …)
        └── ALT SÜREÇ      (İhbar ve Dosya Açılışı, Tazminat ve Ödeme, …)
              └── FAALİYET (Hasar İhbarı, Ödeme Onayı, Ödeme, …)
                    └── İŞ ADIMI
                          ├── KONTROL NOKTASI
                          ├── RİSK
                          └── AKSİYON
```

Her seviye `expand / collapse` mantığıyla açılır. Kullanıcı isterse yalnızca süreç
isimlerini görür, isterse tüm detayı açar.

## Süreç Kanvası

Sürecin tıkladıkça derinleşen kutu görünümü. Giriş ekranı hangi süreci
açacağınızı sorar; hasarda iki varyant vardır çünkü **hasarın nerede
gerçekleştiği süreci baştan aşağı değiştirir**:

| | Yurt İçi Hasar | Yurt Dışı Hasar |
|---|---|---|
| Tespit | Kendi eksper ağı | Asistans şirketi + yerel muhabir |
| Evrak | Türkçe, doğrudan | Yabancı dil, yeminli tercüme, apostil |
| Ödeme | TL, yurt içi havale | Döviz, kur tarihi, SWIFT |
| Ek riskler | — | Coğrafi kapsam, yaptırım taraması, kur farkı, sahte yabancı fatura |
| Hedef süre | 15 iş günü | 25 iş günü |

Seçimden sonra kırılım:

```
ANA SÜREÇ → ALT SÜREÇ → FAALİYET → İŞ ADIMI
```

Her kutu **altındaki her şeyin toplamını** taşır — risk, kontrol, prosedür
ve doküman sayaçları. Kutuya girmeden "burada ne var" sorusu cevaplanır;
kritik risk taşıyan kutunun risk sayacı kırmızıya döner. Sıfır olan sayaç
gizlenmez, soluklaşır: eksikliğin kendisi de bilgidir.

Kutular sıra oklarıyla bağlıdır ve şerit kendi içinde kayar; sayfa gövdesi
yatay kaymaz. Sol üstteki kırıntı yolu her seviyeye geri döner.

### Yerinde ekleme

Her seviyede **"Bu seviyeye ekle"** düğmesi vardır: risk, kontrol, prosedür
veya doküman eklersiniz, kayıt bulunduğunuz düğüme bağlanır. Ekleme
yetkisi kayıt bazlı denetlenir — yetkisi olmayan kullanıcıda düğme hiç
görünmez. Eklenen kayıt aynı ekranda sayaçlara ve listeye yansır.

---

## Görünümler

Aynı süreç altı farklı görünümle incelenebilir (`Süreç Haritası` sayfası):

| Görünüm | Ne gösterir |
|---|---|
| **Harita** | Ana süreç kartları; alt süreç, risk, kritik risk, kontrol, aksiyon ve olgunluk göstergeleriyle |
| **Ağaç** | Tam hiyerarşi; expand/collapse ile katman katman |
| **Akış** | Journey/flow görünümü — işin baştan sona yatay ilerleyişi |
| **Risk** | Yalnızca riskler ve kritik noktalar |
| **Kontrol** | Yalnızca kontroller; niteliğine göre gruplanmış |
| **Yönetim** | Risk seviyesi, aksiyon ve performans göstergelerine odaklı sade tablo |

## Modüller

- **Dashboard** — toplam süreç/risk/kontrol/aksiyon göstergeleri, risk trendi, birim ve
  süreç bazlı risk dağılımı, kontrol etkinliği, KRI’ler, gecikmiş aksiyonlar, süreç sağlık özeti.
- **Süreç Haritası** — yukarıdaki altı görünüm + iş adımı detay paneli (Genel, Kontroller,
  Riskler, Prosedür, Örnekler, **Yapı**, Analiz sekmeleri).
- **Bağlantı Ağı** — Süreç → Risk → Kontrol → Sorumlu → Aksiyon katmanlı ağ grafiği.
- **Risk Isı Haritası** — 5×5 olasılık × etki matrisi; birim, süreç, risk türü, sahip,
  seviye, kontrol etkinliği ve değerlendirme tarihi filtreleriyle.
- **Risk Kütüphanesi** — merkezî risk envanteri (ISO 31000 kategorileri).
- **Kontrol Kütüphanesi** — merkezî kontrol envanteri; bir kontrol birden fazla süreç ve
  riskle ilişkilendirilebilir.
- **KRI Göstergeleri** — riske bağlı anahtar risk göstergeleri, yeşil/sarı/kırmızı bantlar.
- **Aksiyon Yönetimi** — sorumlu, hedef tarih, öncelik, durum, tamamlanma yüzdesi, kanıt.
- **Doküman Yönetimi** — prosedür, talimat, politika, form, kontrol listesi, mevzuat,
  eğitim dokümanı; versiyon ve gözden geçirme takibi.
- **Periyodik Gözden Geçirme** — tarihi gelen ve geçen süreçlerin otomatik işaretlenmesi.
- **Değişiklik Yönetimi** — talep → birim yöneticisi → İç Kontrol / Risk Yönetimi → onay →
  yeni versiyon akışı, alan bazlı eski/yeni değer karşılaştırmasıyla.
- **Audit Trail** — kim, ne zaman, neyi değiştirdi, eski/yeni değer, gerekçe.
- **Arşiv görünümleri** — arşivlenen risk, kontrol ve aksiyonların ayrı listesi ve geri alma.
- **Analiz Asistanı** — doğal dil sorgusu ve süreç analizi (aşağıya bakınız).
- **Global Arama** — tek terimle süreç, risk, kontrol, prosedür, aksiyon ve KRI sonuçları.
- **Standart Uyumu** — hangi standart gereksiniminin platformda nerede karşılandığı.

---

## Veri girişi: ekleme, düzenleme, arşivleme

Sistem yalnızca okuma odaklı değildir; kayıtlar arayüzden yönetilir.

**Ne yapılabilir**

| İşlem | Nereden |
|---|---|
| Risk / kontrol / aksiyon / doküman **oluşturma** | Kütüphane sayfalarındaki “Yeni …” düğmesi, ya da bir süreç adımının detay panelinden (kayıt o adıma bağlı açılır) |
| **Süreç oluşturma** | Süreç haritasında “Yeni ana süreç”; alt süreç, faaliyet ve iş adımı için detay panelinin **Yapı** sekmesi |
| **Düzenleme** | İlgili kaydın detay panelindeki “Düzenle” — süreçlerde ayrıca kritik nokta ve örnek senaryo editörleri |
| **Yapı düzenleme** | Yapı sekmesi: akıştaki sırayı değiştirme (yukarı/aşağı), başka bir üst sürecin altına taşıma, alt kayıt ve kardeş ekleme |
| **İlişkilendirme** | Risk ↔ kontrol, risk ↔ süreç adımı, kontrol ↔ süreç adımı, doküman ↔ süreç adımı, doküman ↔ kontrol — bağ iki yönde de kurulur |
| **Onay** | Kritik alan değişiklikleri Değişiklik Yönetimi’nde onaylanır; onay tamamlanınca yama uygulanır ve yeni versiyon yayımlanır |
| Kontrol **etkinlik değerlendirmesi** | Kontrol panelinin altı (yalnızca İç Kontrol) |
| Aksiyon **durum ve ilerleme** | Aksiyon panelinin altı |
| Süreç **gözden geçirme** işaretleme | Süreç paneli ve Gözden Geçirme sayfası |
| Değişiklik talebi **onay / ret** | Değişiklik Yönetimi |
| **Arşivleme / geri alma** | Detay panelinin altı (yalnızca 2. hat ve sistem yöneticisi) |

**Silme yerine arşivleme.** GRC'de kayıt silmek audit izini koparır ve geçmiş
raporları tutarsızlaştırır. Arşivlenen kayıt listelerden, sayımlardan, ısı
haritasından, aramadan ve analizden düşer; kütüphanenin “Arşiv” görünümünde ve
audit trail'de yerinde kalır, geri alınabilir.

Süreçlerde arşivleme durum alanı üzerinden yapılır ve **alt ağacın tamamını**
kapsar: bir ana süreç arşivlendiğinde altındaki alt süreç, faaliyet ve iş
adımları da haritadan, sayımlardan ve analizden düşer — aksi halde ağaçta
sahipsiz düğümler kalırdı.

**Her değişiklik audit trail'e yazılır** — kim, ne zaman, hangi alan, eski değer,
yeni değer ve (düzenlemelerde zorunlu) gerekçe. Onay akışında talep oluşturma, her
onay kademesi ve yamanın uygulanması ayrı kayıtlar olarak izlenir.

**Form doğrulamaları** yalnızca boş alan kontrolü değildir; GRC kurallarını da
uygular. Örnek: artık risk doğal riskten büyük olamaz (kontroller riski
artırmaz); tamamlandı işaretlenen aksiyon kanıtsız kapatılamaz; kanıtı olmayan
kontrol tanımlanamaz. Risk iştahı aşıldığında form uyarır.

**Taşıma güvenliği.** Bir süreç yalnızca aynı türde kayıt alabilen düğümlerin
altına taşınabilir ve kendi alt ağacının içine taşınamaz; döngü oluşması
engellenir. Taşıma altındaki tüm yapıyı birlikte götürür ve gerekçe ister.

## Onay mekanizması

Her değişiklik doğrudan kaydedilmez. Alanlar iki gruba ayrılır:

- **Kritik alanlar** — kurumsal risk profilini, kontrol tasarımını, sorumluluğu ya da
  yazılı dayanağı değiştirenler. Örnek: doğal/artık risk skoru, risk iştahı, kontrol
  türü ve kanıtı, kontrol etkinliği, süreç sahibi, süreç durumu, doküman versiyonu
  ve içeriği.
- **Betimleyici alanlar** — açıklama düzeltmesi, sistem listesi, girdi/çıktı gibi
  kayıt anlamını değiştirmeyenler.

Kritik alan değiştiğinde form bunu **kaydetmeden önce** söyler: uyarı şeridi hangi
alanların onaya götürdüğünü yazar ve kaydet düğmesi “Onaya gönder”e döner.
Yamanın **tamamı** talebe girer — kayıt yarısı uygulanmış yarısı bekliyor durumuna
düşmez.

```
Süreç Sahibi
   ↓  değişiklik talebi (DT-YYYY-NNN)
Birim Yöneticisi
   ↓
İç Kontrol  /  Risk Yönetimi        (risklerde Risk Yönetimi, diğerlerinde İç Kontrol)
   ↓
Onay → yama uygulanır → yeni versiyon (v4.2 → v4.3)
```

**Taslak kayıtlar onay gerektirmez.** Onay mekanizması *yürürlükteki* bir tanımın
değişmesini korur; henüz hazırlanmakta olan taslak (`status: draft`) süreç ya da
doküman üzerinde çalışırken her düzenleme doğrudan kaydedilir. Kayıt yürürlüğe
alındıktan sonra kritik alanlar onaya tabi olur.

Talep açan kişi birim yöneticisiyse ilk kademe atlanır. **Kimse kendi talebini
onaylayamaz** — görevler ayrılığı onay zincirinde de geçerlidir; sayfa bunu gerekçesiyle
söyler.

Talep beklerken hedef kaydın detay panelinde şerit görünür: gördüğünüz değerlerin
hâlâ yürürlükteki sürüm olduğu belirtilir. Onay tamamlandığında yama hedefe
uygulanır ve sürüm bir basamak artar. Talep açıldığından beri hedefin sürümü
değiştiyse yama yine uygulanır, ancak audit kaydında çakışma açıkça belirtilir —
sessizce üzerine yazılmaz.

Reddedilen talepte hedef kayıt hiç değişmez.

**Yetkiler kayıt bazlıdır.** Yeni kayıt açmak için süreç sahibi / birim yöneticisi
/ 2. hat rolü gerekir; düzenleme için kaydın sahibi olmak, biriminden sorumlu
olmak ya da 2. hatta bulunmak gerekir; arşivleme yalnızca 2. hat ve sistem
yöneticisindedir. Yetkisi olmayan kullanıcı düğmeleri görmez, gerekçesini görür.

## Doğrulama

Beş uçtan uca süit uygulamayı gerçek tarayıcıda sürer: kaydı arayüzden oluşturur,
düzenler, sonucu ekranda **ve** audit trail'de doğrular. Toplam 96 kontrol.

```bash
npm run build
npm run preview -- --port 4173 --strictPort &
npm run test:e2e
```

| Süit | Kapsam | Kontrol |
|---|---|---|
| `faz1-kayit-yonetimi` | Kayıt oluşturma, düzenleme, risk–kontrol bağlama, arşivleme, kalıcılık, rol bazlı yetki reddi | 16 |
| `faz2-surec-yapisi` | Ana süreç → alt süreç → faaliyet ağacı, sıralama, kritik nokta, doküman bağlama, süreç arşivleme | 15 |
| `faz3-onay-mekanizmasi` | Kritik alan tespiti, talep üretimi, kendi talebini onaylayamama, iki kademeli zincir, uygulama | 19 |
| `faz4-yetkilendirme` | Giriş, hatalı parola, menü filtresi, rota koruması, rol düzenleme, kullanıcı istisnası, pasif hesap | 24 |
| `faz5-kanvas` | Varyant seçimi, kırılım, sayaçlar, bağlantı okları, kırıntı yolu, yerinde ekleme, yetki denetimi | 22 |

Ortam değişkenleri:

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `NERVIA_BASE_URL` | `http://localhost:4173` | Süitlerin bağlanacağı sunucu |
| `NERVIA_SHOT_DIR` | `test-results` | Ekran görüntüsü klasörü |
| `NERVIA_CHROMIUM_PATH` | — | Sistemde hazır bir Chromium varsa yolu; Playwright'in indirmesini atlatır |

Her süit kendi tarayıcı bağlamını açar, böylece `localStorage` süitler arasında
taşınmaz ve her biri tohum veriden başlar. Bir kontrol düşerse süreç sıfırdan
farklı çıkış kodu döner; `.github/workflows/ci.yml` bunu her push ve pull
request'te koşar, ekran görüntülerini artifact olarak yükler.

---

## Kalıcılık

Uygulama arka uçsuz çalışır. Yapılan her değişiklik tarayıcının `localStorage`
alanında anlık görüntü olarak saklanır ve sayfa yenilendiğinde korunur
(`src/store/persistence.ts`). Veri yalnızca o tarayıcıda tutulur; başka cihaza
ya da kullanıcıya taşınmaz.

Snapshot, demo verisinin sürümüyle etiketlenir: seed verisi değiştiğinde
`SEED_VERSION` artırılır ve uyumsuz snapshot sessizce atılır. **Profilim**
sayfasındaki *Veri ve kalıcılık* bölümü kayıt durumunu, boyutunu ve son kayıt
zamanını gösterir; oradan demo verisine sıfırlanabilir.

Kalıcı bir kurumsal kurulum için bu katmanın yerine bir API + veritabanı
konmalıdır; mağaza arayüzü (`src/store/useData.ts`) bunun için hazırdır —
mutasyonlar tek noktada toplanmıştır.

## Analiz katmanı

`src/lib/ai.ts` içindeki analiz motoru **kural tabanlıdır**: bir dil modeli çağırmaz,
GRC bilgi tabanı ve organizasyonun veri grafiği üzerinde deterministik olarak çalışır.
Sonuçlar her zaman dayandığı kayda geri bağlanır. Üç yeteneği vardır:

1. **Risk / kontrol önerme** — süreç adımının adı, açıklaması, girdi–çıktısı ve
   kullandığı sistemler, bilinen GRC desenleriyle (ödeme, onay, görevler ayrılığı,
   kişisel veri, manuel giriş, üçüncü taraf, mevzuat, belge, sistem değişikliği)
   eşleştirilir.
2. **Süreç analizi** — kontrol boşlukları, önleyici kontrol eksikliği, görevler ayrılığı
   zafiyetleri, örtüşen kontroller, prosedürü olmayan faaliyetler, güncelliğini yitirmiş
   süreç ve dokümanlar, test edilmemiş kritik kontroller, risk iştahı aşımları, gecikmiş
   aksiyonlar ve KRI eşik aşımları.
3. **Doğal dil sorgulama** — “Ödemelerdeki kritik riskleri göster”, “Son 6 ayda
   güncellenmeyen süreçler hangileri?”, “Hangi kontroller manuel yapılıyor?”,
   “Hukuk birimindeki yüksek riskleri göster” gibi sorular yorumlanır; sorgunun nasıl
   anlaşıldığı kullanıcıya açıkça yazılır.

Bir LLM entegrasyonu eklenecekse bu modül, model çıktısını doğrulayan kural katmanı
olarak korunmalıdır.

---

## Veri modeli ve standartlar

Veri modeli (`src/types/grc.ts`) arka planda aşağıdaki çerçeveleri taşır; arayüz bu
terminolojiyi kullanıcıya dayatmaz (`src/lib/labels.ts` sade Türkçe karşılıkları sağlar):

- **COSO Internal Control** — kontrol bileşeni sınıflandırması, kontrol faaliyetleri
- **ISO 31000** — doğal / artık / hedef risk, risk iştahı, işleme stratejileri
- **ISO 9001** — süreç yaklaşımı; girdi, çıktı, süreç sahibi, çıktı alıcısı
- **ISO 27001** — erişim yönetimi, değişiklik yönetimi, veri gizliliği kontrolleri
- **ISO 22301** — iş sürekliliği riskleri, yedekleme ve kurtarma testleri
- **Three Lines Model** — birimlerin savunma hattı konumu

**Risk skoru = olasılık (1–5) × etki (1–5)** ve dört bantla seviyelendirilir:
`1–4 Düşük · 5–9 Orta · 10–14 Yüksek · 15–25 Kritik`.

Artık risk, kontrollerin niteliği (önleyici olasılığı, tespit edici/düzeltici etkiyi
azaltır) ve etkinlik değerlendirmesi dikkate alınarak yorumlanır
(`src/lib/riskMath.ts` → `derivedResidual`, `combinedMitigation`).

---

## Demo süreci — Hasar Yönetimi

İlk prototip, uçtan uca bir hasar sürecini tam detayla içerir:

1. Hasar İhbarı · 2. Dosya Açılışı · 3. Evrak Kontrolü · 4. Eksper Atama ·
5. Hasar Değerlendirmesi · 6. Tazminat Hesaplama · 7. Ödeme Onayı ·
8. Muhasebeleştirme · 9. Ödeme · 10. Dosya Kapatma

Her adım için açıklama, amaç, süreç sahibi, sorumlu birim, görevli kişiler, kullanılan
sistem, girdi/çıktı, prosedür, **en az iki risk**, **en az iki kontrol**, kritik noktalar,
gerçek hayata yakın örnek senaryo, bağlı doküman ve aksiyon tanımlıdır.

Diğer dokuz ana süreç (Mali İşler, Hukuk, Bilgi Teknolojileri, İnsan Kaynakları,
Satın Alma, İdari İşler, Raporlama, Risk Yönetimi, İç Kontrol) daha sade fakat gerçekçi
içerikle modellenmiştir.

---

## Tasarım dili

Swiss modernism + modern enterprise SaaS + veri görselleştirme yaklaşımı. Bol beyaz alan,
güçlü ve sade tipografi, hairline kenarlıklar, kurumsal lacivert–mavi–gri palet.

**Risk renkleri yalnızca risk seviyesi için kullanılır** ve her zaman bir metin etiketiyle
birlikte gösterilir; hiçbir yerde tek başına renk anlam taşımaz. Seviye paleti iki
katmanlıdır:

- `--risk-*` — metin/kenarlık katmanı, WCAG AA kontrastını sağlar (5.3–9.2:1)
- `--risk-*-mark` — grafik işaret katmanı (ısı haritası noktaları, çubuklar, çizgiler);
  renk körlüğü ayrımı için doğrulanmıştır (en yakın komşu ΔE 15.9 normal / 9.6 deutan)

Animasyonlar profesyonel ve kısa tutulmuştur; `prefers-reduced-motion` desteklenir.

---

## Proje yapısı

```
src/
  types/grc.ts            # GRC alan modeli
  types/rbac.ts           # izin, kapsam, rol ve hesap modeli
  data/
    org.ts                # birimler ve kullanıcılar
    roles.ts              # yerleşik rol tanımları
    accounts.ts           # kimlik kayıtları (özetlenmiş parolalar)
    spec.ts               # bildirimsel süreç tanımı (DSL)
    build.ts              # spec → normalize edilmiş varlık grafiği
    processes/            # ana süreç tanımları (yurt içi ve yurt dışı hasar dahil)
    index.ts              # veri kümesi + değişiklik talepleri + audit trail
  lib/
    riskMath.ts           # skorlama, seviyelendirme, KRI, tarih yardımcıları
    labels.ts             # GRC terminolojisi → arayüz dili
    selectors.ts          # ağaç, rollup, dağılım, ısı matrisi, trend
    search.ts             # global arama indeksi (Türkçe normalizasyon ile)
    ai.ts                 # kural tabanlı öneri, analiz ve doğal dil sorgusu
    entityMeta.ts         # alan etiketleri, fark hesaplama, kod üretimi
    access.ts             # yetki motoru: izin birleştirme, kapsam çözümlemesi
    password.ts           # parola özetleme ve kural denetimi
    navigation.ts         # menü ↔ rota eşlemesi (tek kaynak)
  store/
    useData.ts            # veri kümesi ve tüm mutasyonlar (tek yazma noktası)
    useAuth.ts            # oturum, kimlik doğrulama, yetki sorguları
    useUi.ts              # seçim, görünüm, filtreler
    persistence.ts        # localStorage anlık görüntüsü ve sürüm koruması
  components/
    common/               # ikonlar ve temel bileşenler
    forms/                # ekle/düzenle formları, alan bileşenleri, ilişkilendirme,
                          #   süreç yapısı düzenleyicisi, onay yönlendirmesi
    charts/               # el yazımı SVG grafikler, ısı haritası, ağ grafiği
    layout/               # kabuk, kenar çubuğu, komut paleti
    process/              # süreç görünümleri ve detay panelleri
  pages/                  # rota bileşenleri
  styles/                 # tasarım belirteçleri ve katmanlı stiller
tests/
  harness.mjs             # ortak tarayıcı iskeleti ve kontrol sayacı
  faz1-kayit-yonetimi.mjs # kalıcılık, CRUD, ilişkilendirme, arşivleme
  faz2-surec-yapisi.mjs   # süreç ağacı, sıralama, doküman yönetimi
  faz3-onay-mekanizmasi.mjs # kritik alan → onay zinciri → uygulama
  faz4-yetkilendirme.mjs  # giriş, menü/rota denetimi, rol ve istisna yönetimi
  faz5-kanvas.mjs         # varyant seçimi, kırılım, sayaçlar, yerinde ekleme
  run-all.mjs             # üç süiti sırayla koşan toplu koşucu
```

Grafiklerin tamamı bağımlılık kullanmadan, doğrudan SVG olarak çizilmiştir.

## Klavye

| Kısayol | İşlev |
|---|---|
| `Ctrl/⌘ + K` | Komut paleti / global arama |
| `↑ ↓` | Sonuçlar arasında gezinme |
| `↵` | Seçili sonucu açma |
| `Esc` | Palet veya detay panelini kapatma |

---

## Notlar

- Demo veri kümesindeki kişi, şirket ve olayların tamamı kurgusaldır.
- Bugünün tarihi veri kümesinde `2026-09-04` olarak sabitlenmiştir; gecikme ve
  gözden geçirme hesapları bu tarihe göre yapılır (`src/lib/riskMath.ts` → `TODAY`).
- Risk trendi grafiği, tarihsel değerlendirme kaydı bulunmadığı için güncel skorlardan ve
  trend yönlerinden projekte edilir; grafik başlığında bu açıkça belirtilir.
