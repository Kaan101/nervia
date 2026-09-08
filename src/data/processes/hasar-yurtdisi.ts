import type { NodeSpec } from '../spec';

/**
 * YURT DIŞI HASAR — 2.1
 *
 * Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024),
 * Bölüm 4-5 – Yurt Dışı Hasar Prosedürü (Madde 1-16) ile Ek 2 Detaylı
 * Yurt Dışı Hasar İş Akışı. Yapı Ek 2'yi izler; Madde 1-16'daki sayısal
 * eşikler (50.000 / 100.000 / 25.000 / 5.000 Euro), fiziki dosya açma
 * hâlleri ve onay şartları kritik nokta ve kontrol olarak işlenmiştir.
 * Bölüm 9 Madde 42'deki aşama bazlı özet akış Hasar İş Akışı ekranındadır.
 *
 * Türkiye Motorlu Taşıt Bürosu'nun yurt dışı hasar akış diyagramından
 * modellenmiştir. Yurt içi hasarın aynası değildir; yön tersine döner:
 *
 *   Yurt içi  → yabancı araç Türkiye'de zarar verir, büro öder ve
 *               yabancı bürodan rücu eder.
 *   Yurt dışı → Türk plakalı araç yurt dışında zarar verir; ilgili
 *               ülkenin bürosu/muhabiri öder, TMTB karşılar ve üye
 *               şirketlerle ay sonu mutabakatıyla mahsuplaşır.
 *
 * Bu yüzden akışın ağırlık merkezi tazminat ödemesi değil, muhabir
 * koordinasyonu ve mali mutabakattır: dekont üretimi, SBM kayıtları,
 * ay kapama, reasürans ihbarı ve Yeşil Kart teminatı geçersizse
 * sigortalıya rücu.
 *
 * Diyagramdaki karar noktaları (yurt dışı mı, YK/ZK, geçici/gerçek,
 * TMTB mi muhabir mi, sahtecilik, kabul/red) süreç adımlarına;
 * belirsiz bırakılan eşikler ve takipsiz kalan adımlar risklere
 * dönüştürülmüştür.
 */
export const yurtDisiHasar: NodeSpec = {
  code: 'HSD',
  name: 'Yurt Dışı Hasar Yönetimi',
  unit: 'U-HSR',
  owner: 'usr-02',
  participants: ['usr-02', 'usr-03', 'usr-05', 'usr-08', 'usr-09'],
  processClass: 'core',
  standards: [
    'COSO', 'ISO 31000', 'ISO 9001', 'Yeşil Kart Sistemi', 'Reasürans Sözleşmesi',
    'TMTB Süreç Dokümanı v10.0 Madde 1-16',
  ],
  description:
    'Türk plakalı araçların yurt dışında yol açtığı zararlarda ilgili ülke bürosu veya muhabiri '
    + 'üzerinden yürütülen dosyanın açılmasından, tazminatın karşılanmasına ve üye şirketlerle '
    + 'ay sonu mutabakatına kadar geçen süreç.',
  purpose:
    'Yeşil Kart sistemi kapsamında yurt dışında doğan yükümlülüğün doğru karşılanmasını, üye '
    + 'şirketlere doğru yansıtılmasını ve teminat dışı hâllerde sigortalıya rücu edilmesini sağlamak.',
  customer: 'Üye sigorta şirketleri / yurt dışı büro ve muhabirler',
  slaDays: 45,
  maturity: 3,
  version: '1.1',
  lastReviewedAt: '2026-03-05',
  reviewFrequencyMonths: 12,
  updatedAt: '2026-08-30',
  systems: ['Büro Hasar Sistemi', 'SBM', 'DYS', 'Oracle', 'Outlook'],
  inputs: ['Yurt dışı hasar ihbarı (faks/e-posta)', 'Poliçe kaydı', 'Muhabir dosyası'],
  outputs: ['Karşılanmış tazminat', 'Üye şirket dekontu', 'Rücu dosyası', 'Reasürans ihbarı'],

  children: [
    /* ============================================================ */
    /* A — İHBAR VE DOSYA AÇILIŞI                                    */
    /* ============================================================ */
    {
      code: 'HSD-A',
      name: 'İhbar ve Dosya Açılışı',
      owner: 'usr-05',
      description:
        'Hasar ihbarının kayda alınması, yurt içi/yurt dışı ve teminat türü ayrımının yapılması, '
        + 'dosyanın TMTB direkt başvuru ya da muhabir dosyası olarak açılması ve muallak girişi.',
      purpose:
        'İhbarın doğru hatta yönlendirilmesini ve yükümlülüğün baştan doğru tutarla kayda geçmesini sağlamak.',
      systems: ['Büro Hasar Sistemi', 'DYS', 'Outlook'],
      inputs: ['Faks / e-posta ihbarı', 'Poliçe kaydı'],
      outputs: ['Açılmış dijital dosya', 'Muallak kaydı'],
      maturity: 3,
      slaDays: 3,

      children: [
        /* ---------- Hasar İhbarının Alınması ---------- */
        {
          code: 'HSD-01',
          name: 'Hasar İhbarının Alınması ve Kaydı',
          owner: 'usr-05',
          participants: ['usr-04'],
          description:
            'Yurt dışında gerçekleşen hasara ilişkin ihbarın faks veya e-posta ile alınması, poliçe '
            + 'kaydıyla eşleştirilmesi ve başvurana bilgi verilmesi.',
          purpose: 'Her ihbarın kayda geçmesini ve poliçeyle doğru eşleşmesini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['Faks / e-posta ihbarı', 'Poliçe numarası'],
          outputs: ['İhbar kaydı', 'Başvurana bilgilendirme'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['control', 'Kontrol Noktası',
              'İhbar faks ve e-posta gibi yapılandırılmamış kanallardan geldiği için kayda alınmama riski yüksektir.'],
          ],
          examples: [
            {
              title: 'E-posta ile gelen ihbarın kayda geçmemesi',
              scenario:
                'Muhabir bürodan gelen ihbar e-postası, izinli personelin kutusuna düşüyor. Ortak kutuya '
                + 'yönlendirme tanımlı olmadığı için ihbar iki hafta kimseye ulaşmıyor.',
              risk: 'Muhabire zamanında dönülmüyor; büro sistem kuralları çerçevesinde gecikme faizi ödüyor.',
              control: 'Yurt dışı ihbarlarının yalnızca ortak kutu üzerinden alınması ve günlük kayıt mutabakatı.',
              controlType: 'Önleyici — kanal tekilleştirme',
              evidence: 'Ortak kutu kayıt listesi ve günlük mutabakat',
              criticalNote: 'Kişisel kutuya gelen ihbar aynı gün ortak kutuya aktarılır.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-01',
              name: 'Yapılandırılmamış kanaldan gelen ihbarın kayda alınmaması',
              description:
                'Faks veya kişisel e-posta kutusuna düşen yurt dışı hasar ihbarının sisteme hiç '
                + 'kaydedilmemesi ya da geç kaydedilmesi.',
              cause: 'İhbar kanallarının tekilleştirilmemiş olması ve günlük kayıt mutabakatının bulunmaması.',
              consequence:
                'Muhabire geç dönüş, sistem kuralları gereği gecikme faizi ve büro itibarının zedelenmesi.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-04-18',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-01',
              name: 'Ortak kutu üzerinden ihbar kabulü ve günlük mutabakat',
              description:
                'Yurt dışı hasar ihbarları yalnızca ortak e-posta kutusu ve merkezi faks üzerinden '
                + 'kabul edilir; gelen adet ile sisteme kaydedilen adet her gün karşılaştırılır.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['reconciliation', 'monitoring'],
              frequency: 'daily',
              method: 'Kanal adedi ile sistem kaydı adedinin günlük karşılaştırılması.',
              evidence: 'Günlük mutabakat listesi',
              mitigates: ['R-HSD-01'],
              owner: 'usr-05',
              key: true,
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-06-11',
              testResult:
                'Mutabakat yapılıyor ancak kişisel kutulara gelen ihbarlar kapsam dışı; 3 ihbar geç kaydedilmiş.',
            },
          ],
          children: [
            {
              code: 'HSD-01-1',
              name: 'İhbarın alınması',
              description: 'Faks veya e-posta ile gelen hasar ihbarının teslim alınması.',
              systems: ['Outlook'],
              inputs: ['İhbar mesajı'],
              outputs: ['Ham ihbar'],
            },
            {
              code: 'HSD-01-2',
              name: 'Poliçe eşleştirmesi ve kayıt',
              description: 'İhbarın poliçe kaydıyla eşleştirilerek sisteme kaydedilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Ham ihbar', 'Poliçe kaydı'],
              outputs: ['İhbar kaydı'],
              controlRefs: ['K-HSD-01'],
            },
            {
              code: 'HSD-01-3',
              name: 'Başvurana bilgi verilmesi',
              description: 'Başvurana ihbarın alındığına dair otomatik bilgilendirme yapılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['İhbar kaydı'],
              outputs: ['Bilgilendirme kaydı'],
            },
          ],
        },

        /* ---------- Yönlendirme ve Kapsam Kararı ---------- */
        {
          code: 'HSD-02',
          name: 'Yönlendirme ve Kapsam Kararı',
          owner: 'usr-05',
          description:
            'Dört ardışık karar: hasar yurt dışında mı, teminat Yeşil Kart mı Zorunlu Karşılama mı, '
            + 'poliçe geçici mi gerçek mi, dosyayı TMTB mi muhabir mi yönetecek.',
          purpose:
            'Dosyanın en baştan doğru süreçte ve doğru sorumlulukla ilerlemesini sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['İhbar kaydı', 'Poliçe ve teminat bilgisi'],
          outputs: ['Yönlendirme kararı', 'Dosya tipi'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Yeşil Kart ile Zorunlu Karşılama farklı yükümlülük doğurur; ayrım yanlış yapılırsa ödeme dayanaksız kalır.'],
            ['control', 'Kontrol Noktası',
              'Yurt dışı olmayan ihbarlar yurt içi hasar sürecine devredilir; yanlış yönlendirme dosyayı iki süreç arasında kaybettirir.'],
          ],
          examples: [
            {
              title: 'Geçici poliçenin gerçek poliçe gibi işlenmesi',
              scenario:
                'Sınır kapısında düzenlenen geçici Yeşil Kart poliçesi, sistemde gerçek poliçe gibi '
                + 'kaydediliyor. Teminat süresi ve kapsamı farklı olduğu hâlde standart akış işletiliyor.',
              risk: 'Teminat dışı bir dönem için yükümlülük üstleniliyor; üye şirkete yansıtılamıyor.',
              control: 'Poliçe tipinin (geçici/gerçek) sistemde zorunlu alan olması ve akışı belirlemesi.',
              controlType: 'Önleyici — koşullu akış',
              evidence: 'Poliçe tipi alanı ve akış logu',
              criticalNote: 'Geçici poliçelerde teminat süresi ayrıca doğrulanır.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-02',
              name: 'Teminat türü veya poliçe tipi ayrımının hatalı yapılması',
              description:
                'Yeşil Kart / Zorunlu Karşılama ve geçici / gerçek poliçe ayrımlarının yanlış '
                + 'belirlenmesi ve dosyanın hatalı akışta ilerlemesi.',
              cause:
                'Ayrımların serbest seçim olarak bırakılması, poliçe kaydından otomatik türetilmemesi.',
              consequence:
                'Dayanaksız yükümlülük üstlenilmesi, üye şirkete yansıtılamayan tutar ve düzeltme iş yükü.',
              category: 'compliance',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-06-05',
              lastAssessedAt: '2026-03-05',
              standards: ['Yeşil Kart Sistemi', 'COSO'],
            },
            {
              code: 'R-HSD-11',
              name: 'Yurt içine ait ihbarın yurt dışı hattında kalması',
              description:
                'Yurt dışı olmadığı anlaşılan ihbarın yurt içi hasar sürecine devredilmemesi ve '
                + 'iki süreç arasında takipsiz kalması.',
              cause: 'Devir işleminin sistemsel bir aktarım yerine e-postayla yapılması.',
              consequence: 'Dosyanın hiçbir ekipte sahiplenilmemesi ve gecikme.',
              category: 'operational',
              inherent: [3, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-09-12',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-02',
              name: 'Teminat ve poliçe tipinin poliçe kaydından türetilmesi',
              description:
                'Yeşil Kart / Zorunlu Karşılama ve geçici / gerçek ayrımı poliçe kaydından otomatik '
                + 'getirilir; kullanıcı değiştiremez, istisna yönetici onayına bağlıdır.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Poliçe kaydından teminat ve tip alanlarının otomatik doldurulması.',
              evidence: 'Alan kaynağı logu ve istisna onayları',
              mitigates: ['R-HSD-02'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-06-14',
              testResult:
                'Teminat türü otomatik geliyor; geçici/gerçek ayrımı hâlâ elle seçiliyor. 30 dosyanın 4’ünde hatalı seçim.',
            },
            {
              code: 'K-HSD-03',
              name: 'Süreçler arası sistemsel dosya devri',
              description:
                'Yurt içi hasara devredilen ihbarlar sistem üzerinden aktarılır; devir alınana kadar '
                + 'dosya devreden ekipte açık kalır ve günlük listede görünür.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'monitoring'],
              frequency: 'daily',
              method: 'Sistemsel devir kuyruğu ve devralınmayan dosya listesi.',
              evidence: 'Devir kaydı ve bekleyen devir listesi',
              mitigates: ['R-HSD-11'],
              owner: 'usr-03',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-06-24',
              testResult: 'Son çeyrekte devredilen 18 dosyanın tamamı 1 gün içinde devralınmış.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSD-02',
              name: 'Yurt Dışı Hasar Dosya Açılış Prosedürü',
              type: 'procedure',
              version: '2.1',
              owner: 'usr-05',
              publishedAt: '2025-03-20',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-03-20',
              summary:
                'İhbarın alınması, yurt içi/yurt dışı ayrımı, teminat türü ve poliçe tipi belirleme, '
                + 'TMTB/muhabir sorumluluk kararı ve dosya açılışı.',
              sections: [
                {
                  heading: 'Karar Sırası',
                  body: [
                    'Önce hasarın yurt dışında gerçekleşip gerçekleşmediği belirlenir; değilse dosya yurt içi hasara devredilir.',
                    'Teminat türü (Yeşil Kart / Zorunlu Karşılama) poliçe kaydından okunur.',
                    'Poliçe tipi (geçici / gerçek) doğrulanır; geçici poliçelerde teminat süresi ayrıca kontrol edilir.',
                    'Dosyayı TMTB’nin mi muhabirin mi yöneteceği ülke anlaşmalarına göre belirlenir.',
                  ],
                },
                {
                  heading: 'Dijital Dosya',
                  body: [
                    'Açılan her dosya için dijital dosya oluşturulur.',
                    'Süreç boyunca tüm belge ve yazışmalar bu dosyaya kaydedilir.',
                    'Dosya numarası yazışma konu satırında kullanılır.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-02', 'K-HSD-03', 'K-HSD-04'],
            },
          ],
          children: [
            {
              code: 'HSD-02-1',
              name: 'Yurt içi / yurt dışı ayrımı',
              description: 'Hasarın yurt dışında gerçekleşip gerçekleşmediğinin belirlenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['İhbar kaydı'],
              outputs: ['Yönlendirme kararı'],
              controlRefs: ['K-HSD-03'],
            },
            {
              code: 'HSD-02-2',
              name: 'Teminat türü ve poliçe tipi belirleme',
              description: 'Yeşil Kart / Zorunlu Karşılama ve geçici / gerçek poliçe ayrımının yapılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Poliçe kaydı'],
              outputs: ['Teminat türü', 'Poliçe tipi'],
              controlRefs: ['K-HSD-02'],
            },
            {
              code: 'HSD-02-3',
              name: 'TMTB / muhabir sorumluluk kararı',
              description: 'Dosyayı TMTB’nin mi yoksa ilgili ülke muhabirinin mi yöneteceğinin kararı.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Olay ülkesi', 'Muhabir anlaşmaları'],
              outputs: ['Dosya tipi'],
            },
          ],
        },

        /* ---------- Dosya Açılışı ---------- */
        {
          code: 'HSD-03',
          name: 'Dosya Açılışı ve Dijital Dosya',
          owner: 'usr-05',
          description:
            'TMTB direkt başvuru dosyası ya da muhabir dosyasının açılması; dijital dosyanın '
            + 'oluşturulması ve süreç boyunca tüm belge ve yazışmaların bu dosyaya kaydedilmesi.',
          purpose:
            'Dosyaya ait her belgenin ve yazışmanın tek yerde, denetlenebilir biçimde toplanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Yönlendirme kararı'],
          outputs: ['Dijital dosya', 'Dosya numarası'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['control', 'Kontrol Noktası',
              'Yazışmaların dosya dışında (kişisel e-posta) kalması denetim izini kopartır.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Dosya numarası ülke kodu ile başlar, işlem yılı ile devam eder ve toplam 10 rakamdan '
              + 'oluşur (Madde 2/2). Fiziki dosya yalnızca altı hâlde açılır: bedeni zararlı ve '
              + '50.000 Euro üzeri muallak, TMTB Direkt Başvuru, dava ihtimali, orijinal belge '
              + 'sunulması, sahte yeşil kart, yönetim onayı (Madde 4/2).'],
            ['control', 'Kontrol Noktası',
              'İhbar giriş ekranındaki açıklama alanına fiziki dosya durumu FDA (açıldı) ya da '
              + 'FDY (açılmadı) olarak yazılır.'],
          ],
          risks: [
            {
              code: 'R-HSD-03',
              name: 'Yazışma ve belgelerin dijital dosyaya kaydedilmemesi',
              description:
                'Muhabir ve başvuranla yapılan yazışmaların kişisel e-posta kutusunda kalması ve '
                + 'dijital dosyaya işlenmemesi.',
              cause: 'Kaydın el ile yapılması ve e-posta ile dosya arasında entegrasyon bulunmaması.',
              consequence:
                'Kararın dayanağının gösterilememesi, personel değişiminde bilgi kaybı ve denetim bulgusu.',
              category: 'compliance',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-05-27',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-04',
              name: 'Dosya numarası ile e-posta eşleştirme',
              description:
                'Dosyaya ait yazışmalar konu satırındaki dosya numarası ile otomatik olarak dijital '
                + 'dosyaya iliştirilir; iliştirilemeyen yazışmalar haftalık listede raporlanır.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['system', 'monitoring'],
              frequency: 'weekly',
              method: 'Konu satırı eşleştirmesi ve eşleşmeyen yazışma raporu.',
              evidence: 'Eşleştirme logu ve haftalık istisna listesi',
              mitigates: ['R-HSD-03'],
              owner: 'usr-11',
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-25',
              lastTestedAt: '2026-06-17',
              testResult:
                'Eşleştirme yalnızca ortak kutuda çalışıyor; kişisel kutulardaki yazışmalar kapsam dışı.',
            },
          ],
          children: [
            {
              code: 'HSD-03-1',
              name: 'Dosya açılış kararı',
              description: 'Dosyanın açılıp açılamayacağının değerlendirilmesi ve başvurana bilgi verilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Yönlendirme kararı'],
              outputs: ['Açılış kararı'],
            },
            {
              code: 'HSD-03-2',
              name: 'TMTB veya muhabir dosyasının açılması',
              description: 'Dosya tipine göre TMTB direkt başvuru ya da muhabir dosyasının açılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dosya tipi'],
              outputs: ['Dosya numarası'],
            },
            {
              code: 'HSD-03-3',
              name: 'Dijital dosyanın oluşturulması',
              description: 'Belge ve yazışmaların toplanacağı dijital dosyanın kurulması.',
              systems: ['DYS'],
              inputs: ['Dosya numarası'],
              outputs: ['Dijital dosya'],
              controlRefs: ['K-HSD-04'],
            },
          ],
        },

        /* ---------- Muallak Girişi ve Eskalasyon ---------- */
        {
          code: 'HSD-04',
          name: 'Muallak Hasar Tutarı Ayırma ve Eskalasyon (Madde 6)',
          owner: 'usr-06',
          participants: ['usr-02'],
          description:
            'Muallak hasar tutarının maddi ve bedeni olarak ayrı ayrı belirlenip EURO cinsinden '
            + 'dosyaya girilmesi, tedvir ücretinin eklenmesi ve dokümanda tanımlı eşiklerin '
            + 'aşılması hâlinde Bölüm Yöneticisinin görüşünün alınması.',
          purpose:
            'Yükümlülüğün mali tabloda doğru görünmesini ve büyük tutarlı ya da bedeni zararlı '
            + 'dosyaların yönetimce bilinmesini sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Temsilci hasar bildirimi', 'Kaza ülkesi teminat limitleri', 'TCMB döviz alış kuru'],
          outputs: ['Maddi ve bedeni muallak kaydı', 'Tedvir ücreti girişi', 'Bölüm Yöneticisi görüşü'],
          maturity: 3,
          slaDays: 2,
          version: '2.0',
          lastReviewedAt: '2024-12-12',
          critical: [
            ['financial', 'Finansal Etki',
              'Muallak doğrudan mali tabloya girer; büyük tutarlı dosyaların yönetimce bilinmemesi karar riskidir.'],
            ['authorization', 'Yetki Kontrolü',
              'Muallak 50.000 Euro’nun üzerindeyse ve yaralanmalı/ölümlü kazalarda Bölüm Yöneticisine '
              + 'bilgi verilir ve görüşü alındıktan sonra muallak girişi yapılır (Madde 6).'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Dava açılan dosyalar ile 50.000 Euro üzerinde muallak taşıyan dosyalar en az yılda '
              + 'bir kez gözden geçirilir (Madde 6/c).'],
          ],
          examples: [
            {
              title: 'Prosedürde tanımlı eşiğin sistemde zorunlu olmaması',
              scenario:
                'Süreç dokümanı Madde 6, 50.000 Euro üzeri muallak için Bölüm Yöneticisi görüşünü '
                + 'şart koşuyor. Sistem ise eşiği bilmiyor: dosya sorumlusu 120.000 Euro muallağı '
                + 'görüş almadan kaydedebiliyor ve kayıt tamamlanıyor.',
              risk:
                'Prosedür yazılı olduğu hâlde uygulanmıyor; yönetim büyük yükümlülükten dönem '
                + 'sonunda haberdar oluyor ve iş akışındaki 100.000 Euro üzeri kıdemli sorumlu '
                + 'ataması da tetiklenmiyor.',
              control:
                'Eşiklerin sisteme parametre olarak girilmesi ve eşik üzeri kayıtta Bölüm Yöneticisi '
                + 'onayı alınmadan muallak girişinin tamamlanamaması.',
              controlType: 'Önleyici — parametrik eşik ve zorunlu onay',
              evidence: 'Eşik parametre tablosu, onay kaydı ve eşik üzeri dosya listesi',
              criticalNote:
                'Eşik prosedürde VAR, sistemde YOK. Bu bir tanım eksiği değil, uygulama eksiğidir.',
            },
            {
              title: 'Muallağın EURO’ya çevrilmemesi',
              scenario:
                'Muhabir bildirimindeki tutar Polonya zlotisi cinsinden geliyor ve dosyaya olduğu '
                + 'gibi giriliyor; EURO’ya çevrilmediği için muallak gerçek yükümlülüğün çok '
                + 'altında görünüyor.',
              risk: 'Mali tabloda eksik karşılık ve eşik kontrollerinin devreye girmemesi.',
              control:
                'Sisteme giriş yapılırken tutarın TCMB işlem tarihi döviz alış kuru üzerinden '
                + 'EURO’ya çevrilmesinin zorunlu kılınması.',
              controlType: 'Önleyici — veri doğrulama',
              evidence: 'Kur dönüşüm kaydı ve muallak giriş ekranı çıktısı',
              criticalNote: 'Madde 6: sisteme girilecek muallak hasar tutarı EURO’ya çevrilerek girilir.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-04',
              name: 'Prosedürde tanımlı muallak eşiğinin sistemde zorlanmaması',
              description:
                'Süreç dokümanının 50.000 Euro üzeri muallak ile yaralanmalı/ölümlü kazalarda şart '
                + 'koştuğu Bölüm Yöneticisi görüşünün, sistemde zorunlu bir adım olmaması ve '
                + 'personelin takdirine bırakılması.',
              cause:
                'Eşiklerin sisteme parametre olarak girilmemiş olması; muallak giriş ekranının '
                + 'onay alanı taşımaması.',
              consequence:
                'Yazılı prosedürün uygulanmaması, önemli yükümlülüklerin yönetime geç ulaşması ve '
                + 'iç kontrol bulgusu.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-06',
              identifiedAt: '2025-02-26',
              lastAssessedAt: '2026-09-08',
              standards: ['COSO', 'ISO 31000'],
            },
            {
              code: 'R-HSD-25',
              name: 'Muallağın EURO’ya çevrilmeden girilmesi',
              description:
                'Farklı para biriminde bildirilen muallak tutarının TCMB döviz alış kuruyla EURO’ya '
                + 'çevrilmeden sisteme girilmesi.',
              cause:
                'Kur dönüşümünün elle yapılması ve giriş ekranında para birimi doğrulaması olmaması.',
              consequence:
                'Mali tabloda eksik ya da fazla karşılık; eşik kontrollerinin yanlış tetiklenmesi.',
              category: 'financial',
              inherent: [3, 4],
              residual: [2, 3],
              target: [1, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              owner: 'usr-06',
              identifiedAt: '2024-12-12',
              lastAssessedAt: '2026-09-08',
            },
            {
              code: 'R-HSD-26',
              name: 'Hareketsiz ve büyük tutarlı dosyaların gözden geçirilmemesi',
              description:
                'Dava açılan ve 50.000 Euro üzeri muallak taşıyan dosyaların yılda en az bir kez '
                + 'gözden geçirilmemesi; altı ay hiç hareket görmeyen dosyaların fark edilmemesi.',
              cause:
                'Gözden geçirme ve hareketsizlik listelerinin sistemden düzenli olarak alınmaması.',
              consequence:
                'Muallağın güncelliğini yitirmesi, zamanaşımının kaçırılması ve dönem sonunda '
                + 'toplu düzeltme ihtiyacı.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-02',
              identifiedAt: '2024-12-12',
              lastAssessedAt: '2026-09-08',
            },
          ],
          controls: [
            {
              code: 'K-HSD-05',
              name: 'Parametrik muallak eşiği ve zorunlu Bölüm Yöneticisi onayı',
              description:
                'Muallak tutarı 50.000 Euro’yu aştığında ya da dosya bedeni zarar taşıdığında sistem '
                + 'Bölüm Yöneticisi onayı ister; onay alınmadan muallak girişi tamamlanamaz. '
                + '100.000 Euro üzeri dosyalarda ayrıca kıdemli sorumlu ataması tetiklenir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'authorization'],
              frequency: 'per_transaction',
              method:
                'Eşik parametre tablosundan okunur; eşik aşımında onay akışı başlar ve bildirim üretilir.',
              evidence: 'Eşik parametre tablosu, onay kaydı ve kıdemli sorumlu atama kaydı',
              mitigates: ['R-HSD-04'],
              owner: 'usr-06',
              key: true,
              coso: 'control_activities',
              design: 'inadequate',
              effectiveness: 'ineffective',
              strength: 1,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-06-20',
              testResult:
                'Eşik prosedürde tanımlı (50.000 / 100.000 Euro) ancak sisteme parametre olarak '
                + 'girilmemiş; bildirim personelin takdirinde. Eşik üzeri 6 dosyanın 4’ünde onay kaydı yok.',
            },
            {
              code: 'K-HSD-26',
              name: 'Muallak girişinde EURO dönüşümü zorunluluğu',
              description:
                'Muallak giriş ekranında para birimi seçilir; EURO dışındaki tutarlar işlem tarihli '
                + 'TCMB döviz alış kuru ile otomatik çevrilir ve dönüşüm kaydı saklanır.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['data_validation', 'system'],
              frequency: 'per_transaction',
              method: 'Giriş ekranında para birimi zorunlu alan; kur TCMB servisinden çekilir.',
              evidence: 'Kur dönüşüm kaydı ve muallak giriş günlüğü',
              mitigates: ['R-HSD-25'],
              owner: 'usr-06',
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-06-20',
              testResult: 'Dönüşüm yapılıyor ancak kur elle giriliyor; iki dosyada kur farkı tespit edildi.',
            },
            {
              code: 'K-HSD-27',
              name: 'Yıllık gözden geçirme ve hareketsiz dosya listesi',
              description:
                'Dava açılan ve 50.000 Euro üzeri muallak taşıyan dosyalar için yılda en az bir kez '
                + 'gözden geçirme çalışması yapılır; ayrıca altı ay hareket görmeyen dosyalar aylık '
                + 'listeyle Bölüm Yöneticisine sunulur.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring'],
              frequency: 'monthly',
              method:
                'Muallak Hasar Raporu ve hareketsizlik raporu çalıştırılır; gözden geçirme sonucu '
                + 'dosyaya not edilir ve gerekiyorsa muallak güncellenir.',
              evidence: 'Yıllık gözden geçirme tutanağı ve aylık hareketsiz dosya listesi',
              mitigates: ['R-HSD-26'],
              owner: 'usr-02',
              key: true,
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-01',
              lastTestedAt: '2026-07-18',
              testResult:
                'Yıllık gözden geçirme yapılmış; hareketsiz dosya listesi son dört ayın ikisinde alınmamış.',
            },
          ],
          actions: [
            {
              code: 'AKS-HSD-01',
              title: 'Muallak eşiklerini sisteme parametre olarak girmek',
              description:
                'Süreç dokümanı Madde 6’daki 50.000 Euro (Bölüm Yöneticisi görüşü) ve iş akışındaki '
                + '100.000 Euro (kıdemli sorumlu ataması) eşikleri sisteme parametre olarak '
                + 'girilecek; eşik aşımında onay alınmadan muallak kaydı tamamlanamayacak.',
              riskCode: 'R-HSD-04',
              controlCode: 'K-HSD-05',
              owner: 'usr-06',
              dueDate: '2026-11-15',
              priority: 'high',
              status: 'open',
              progress: 0,
              source: 'internal_control',
              createdAt: '2026-07-30',
              createdBy: 'usr-22',
            },
          ],
          docs: [
            {
              code: 'TAL-HSD-01',
              name: 'Muallak Hasar Tutarı Ayırma Talimatı',
              type: 'instruction',
              version: '10.0',
              owner: 'usr-06',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary:
                'Süreç dokümanı Madde 6’nın uygulama talimatı: muallağın nasıl belirleneceği, '
                + 'hangi eşiklerde kimin görüşünün alınacağı ve ne sıklıkla gözden geçirileceği.',
              sections: [
                {
                  heading: 'Muallağın belirlenmesi',
                  body: [
                    'Muallak, zarara uğrayan üçüncü şahısların sayısı ve zararın niteliğine göre maddi ve bedeni olarak ayrı belirlenir.',
                    'Kaza ülkesindeki trafik sigortası teminat limitleri ve kapsamı dikkate alınır.',
                    'Tutar EURO’ya çevrilerek girilir; farklı para biriminde bildirilmişse TCMB işlem tarihi döviz alış kuru kullanılır.',
                    'Tedvir ücreti toplam üzerinden hesaplanır ve ayrı alana girilir.',
                  ],
                },
                {
                  heading: 'Eşikler ve onay',
                  body: [
                    'Muallak 50.000 Euro’nun üzerindeyse Bölüm Yöneticisine bilgi verilir ve görüşü alındıktan sonra giriş yapılır.',
                    'Yaralanmalı veya ölümlü kazalarda tutara bakılmaksızın Bölüm Yöneticisinin görüşü alınır.',
                    'İş akışına göre muallak 100.000 Euro’yu aşarsa dosyaya kıdemli sorumlu atanır.',
                  ],
                },
                {
                  heading: 'Gözden geçirme',
                  body: [
                    'Dava açılan dosyalar ile 50.000 Euro üzerinde muallak taşıyan dosyalar en az yılda bir kez gözden geçirilir.',
                    'Davanın geldiği aşama, talep tutarı, kusur durumu, işlemiş faiz ve yargılama giderleri dikkate alınır.',
                    'Altı ay hiç hareket görmeyen dosyalara özellikle dikkat edilir.',
                    'Açık dosyalarla ilgili yılda en az bir defa Bölüm Yöneticisinin belirlediği kriterlerle çalışma yapılır.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-05', 'K-HSD-26', 'K-HSD-27'],
            },
          ],
          children: [
            {
              code: 'HSD-04-1',
              name: 'Muallak tutarının belirlenmesi',
              description:
                'Maddi ve bedeni zararlar için ayrı tutar belirlenmesi, teminat limitlerinin dikkate '
                + 'alınması, EURO’ya çevrilmesi ve tedvir ücretinin eklenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Temsilci bildirimi', 'Teminat limitleri', 'TCMB kuru'],
              outputs: ['Maddi ve bedeni muallak tutarı'],
              controlRefs: ['K-HSD-26'],
            },
            {
              code: 'HSD-04-2',
              name: 'Eşik kontrolü ve Bölüm Yöneticisi görüşü',
              description:
                '50.000 Euro üzeri ve bedeni zararlı dosyalarda görüş alınması; 100.000 Euro üzeri '
                + 'dosyalarda kıdemli sorumlu atanması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Muallak tutarı', 'Zarar niteliği'],
              outputs: ['Bölüm Yöneticisi görüşü', 'Kıdemli sorumlu ataması'],
              controlRefs: ['K-HSD-05'],
            },
            {
              code: 'HSD-04-3',
              name: 'Muallağın güncellenmesi ve gözden geçirme',
              description:
                'Dosyadaki her gelişmede muallağın kontrol edilip güncellenmesi; yıllık gözden '
                + 'geçirme ve hareketsiz dosya takibi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dosya gelişmeleri', 'Muallak Hasar Raporu'],
              outputs: ['Güncellenmiş muallak', 'Gözden geçirme notu'],
              controlRefs: ['K-HSD-27'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* B — İNCELEME VE KARAR                                         */
    /* ============================================================ */
    {
      code: 'HSD-B',
      name: 'İnceleme ve Karar',
      owner: 'usr-03',
      description:
        'Sahtecilik değerlendirmesi, muhabir koordinasyonu, destek hizmetleriyle zarar tespiti, '
        + 'belge kontrolü ve talebin kabul/red kararı.',
      purpose: 'Karşılanacak tutarın belgeye dayalı, doğrulanmış ve savunulabilir olmasını sağlamak.',
      systems: ['Büro Hasar Sistemi', 'DYS', 'Outlook'],
      inputs: ['Açılmış dosya', 'Muhabir belgeleri', 'Destek raporları'],
      outputs: ['Kabul/red kararı', 'Zarar raporu'],
      maturity: 3,
      slaDays: 25,

      children: [
        /* ---------- Sahtecilik Değerlendirmesi ---------- */
        {
          code: 'HSD-05',
          name: 'Sahtecilik Değerlendirmesi',
          owner: 'usr-04',
          description:
            'Hem TMTB hem muhabir hattında, dosyanın sahtecilik belirtileri açısından değerlendirilmesi.',
          purpose: 'Suistimal girişimlerinin ödeme yapılmadan önce yakalanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Dosya belgeleri', 'Kaza beyanı'],
          outputs: ['Sahtecilik değerlendirme notu'],
          maturity: 2,
          slaDays: 3,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['control', 'Kontrol Noktası',
              'Sahtecilik kontrolü akışta iki ayrı yerde geçer; ikisinde de aynı ölçütlerin uygulanması gerekir.'],
          ],
          risks: [
            {
              code: 'R-HSD-05',
              name: 'Sahtecilik değerlendirmesinin ölçütsüz yapılması',
              description:
                'Sahtecilik kontrolünün tanımlı gösterge listesi olmadan, personelin sezgisine bırakılarak '
                + 'yapılması ve TMTB ile muhabir hattında farklı ölçütler uygulanması.',
              cause: 'Sahtecilik göstergelerinin yazılı ölçüte ve sistemsel skora bağlanmamış olması.',
              consequence: 'Suistimalin gözden kaçması ve karşılanan tutarın geri alınamaması.',
              category: 'financial',
              inherent: [4, 5],
              residual: [3, 5],
              target: [2, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'up',
              owner: 'usr-22',
              identifiedAt: '2025-08-19',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-06',
              name: 'Sahtecilik gösterge listesi ve zorunlu değerlendirme',
              description:
                'Dosya kapanmadan önce tanımlı sahtecilik göstergeleri (mükerrer kaza, kısa süreli poliçe, '
                + 'tutarsız beyan, yüksek tutarlı geçici poliçe) listesi üzerinden değerlendirme yapılır.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Gösterge listesi üzerinden zorunlu değerlendirme ve not kaydı.',
              evidence: 'Değerlendirme notu ve gösterge işaretlemeleri',
              mitigates: ['R-HSD-05'],
              owner: 'usr-22',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-27',
              lastTestedAt: '2026-06-13',
              testResult:
                'Değerlendirme yapılıyor ama gösterge listesi yazılı değil; 25 dosyanın 8’inde not tek cümle.',
            },
          ],
          children: [
            {
              code: 'HSD-05-1',
              name: 'Gösterge taraması',
              description: 'Dosyanın tanımlı sahtecilik göstergelerine karşı taranması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dosya belgeleri'],
              outputs: ['Gösterge sonucu'],
              controlRefs: ['K-HSD-06'],
            },
            {
              code: 'HSD-05-2',
              name: 'Değerlendirme notunun kaydı',
              description: 'Sahtecilik değerlendirmesinin gerekçesiyle dosyaya kaydedilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Gösterge sonucu'],
              outputs: ['Değerlendirme notu'],
            },
          ],
        },

        /* ---------- Muhabir Koordinasyonu ---------- */
        {
          code: 'HSD-06',
          name: 'Muhabir Koordinasyonu',
          owner: 'usr-05',
          description:
            'Muhabire bilgi, onay ve referans numarası verilmesi; kaza ile ilgili bilgi ve belgelerin '
            + 'muhabirden talep edilmesi ve sigortalıdan kaza beyan formunun istenmesi.',
          purpose:
            'Yurt dışındaki dosyanın büro adına doğru referansla ve izlenebilir biçimde yürütülmesini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['Açılmış muhabir dosyası'],
          outputs: ['Muhabir referans numarası', 'Kaza beyan formu'],
          maturity: 3,
          slaDays: 5,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Referans numarası verilmeden muhabirin yaptığı masraf büroya bağlanamaz; mutabakatta askıda kalır.'],
          ],
          examples: [
            {
              title: 'Referans numarası verilmeden muhabirin işlem başlatması',
              scenario:
                'Muhabir, acil olduğu gerekçesiyle onay ve referans numarası beklemeden eksper görevlendiriyor '
                + 've masraf yapıyor.',
              risk: 'Masraf dosyayla eşleşmiyor; ay sonu mutabakatında askıda kalan tutar oluşuyor.',
              control: 'Muhabire onay ve referans numarası verilmeden masraf kabul edilmemesi.',
              controlType: 'Önleyici — referans zorunluluğu',
              evidence: 'Referans numarası kaydı ve muhabir yazışması',
              criticalNote: 'Referanssız masraflar mutabakat öncesi ayrı listede incelenir.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-06',
              name: 'Muhabire referans numarası verilmeden işlem başlatılması',
              description:
                'Muhabirin onay ve referans numarası almadan masraf yapması ve bu masrafın dosyayla '
                + 'eşleştirilememesi.',
              cause: 'Referans verme adımının sistemsel ön koşul olmaması.',
              consequence: 'Ay sonu mutabakatında askıda tutar, üye şirkete yansıtılamayan masraf.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-07-08',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-07',
              name: 'Muhabir referans numarası ön koşulu',
              description:
                'Muhabir masrafları yalnızca büro tarafından verilmiş referans numarasıyla kabul edilir; '
                + 'referanssız gelen masraflar ayrı listede incelenir ve yönetici onayına sunulur.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['authorization', 'reconciliation'],
              frequency: 'per_transaction',
              method: 'Referans numarası eşleştirmesi ve referanssız masraf listesi.',
              evidence: 'Referans kaydı ve istisna listesi',
              mitigates: ['R-HSD-06'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-27',
              testResult:
                'Referans verme adımı uygulanıyor; acil vakalarda atlanabiliyor. Son çeyrekte 5 referanssız masraf.',
            },
          ],
          docs: [
            {
              code: 'TLM-HSD-06',
              name: 'Muhabir Koordinasyon Talimatı',
              type: 'instruction',
              version: '1.7',
              owner: 'usr-05',
              publishedAt: '2025-05-05',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-05-05',
              summary:
                'Muhabire onay ve referans numarası verilmesi, belge talebi ve masraf kabulü kuralları.',
              sections: [
                {
                  heading: 'Referans Numarası',
                  body: [
                    'Muhabir hiçbir masrafı büro referans numarası almadan yapamaz.',
                    'Referanssız gelen masraflar ayrı listede incelenir ve yönetici onayına sunulur.',
                  ],
                },
                {
                  heading: 'Belge Talebi',
                  body: [
                    'Kaza ile ilgili bilgi ve belgeler muhabirden yazılı olarak istenir.',
                    'Sigortalıdan kaza beyan formu talep edilir ve teyit alınır.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-07'],
            },
          ],
          children: [
            {
              code: 'HSD-06-1',
              name: 'Muhabire bilgi, onay ve referans verilmesi',
              description: 'Muhabire dosya bilgisinin, onayın ve referans numarasının iletilmesi.',
              systems: ['Büro Hasar Sistemi', 'Outlook'],
              inputs: ['Muhabir dosyası'],
              outputs: ['Referans numarası'],
              controlRefs: ['K-HSD-07'],
            },
            {
              code: 'HSD-06-2',
              name: 'Muhabirden bilgi ve belge talebi',
              description: 'Kaza ile ilgili bilgi ve belgelerin muhabirden istenmesi.',
              systems: ['Outlook'],
              inputs: ['Referans numarası'],
              outputs: ['Muhabir belgeleri'],
            },
            {
              code: 'HSD-06-3',
              name: 'Sigortalıdan kaza beyan formu',
              description: 'Sigortalıya kaza ihbar dosya bilgisi verilmesi, teyit ve beyan formu istenmesi.',
              systems: ['Outlook'],
              inputs: ['Dosya bilgisi'],
              outputs: ['Kaza beyan formu'],
            },
          ],
        },

        /* ---------- Destek Hizmetleri ---------- */
        {
          code: 'HSD-07',
          name: 'Destek Hizmetleri (Eksper, Aktüer, Tıbbi Bilirkişi, Araştırmacı)',
          owner: 'usr-05',
          description:
            'Zararın tespiti için eksper, aktüer, tıbbi bilirkişi veya araştırmacı görevlendirilmesi ve '
            + 'zarar raporu ile destekleyici belgelerin hazırlanması.',
          purpose: 'Zarar tutarının bağımsız uzman görüşüne dayanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Görevlendirme kararı'],
          outputs: ['Zarar raporu', 'Destekleyici belgeler', 'Hizmet faturası'],
          maturity: 3,
          slaDays: 15,
          lastReviewedAt: '2026-03-05',
          risks: [
            {
              code: 'R-HSD-07',
              name: 'Destek hizmeti maliyetinin kontrolsüz büyümesi',
              description:
                'Eksper, aktüer ve araştırmacı görevlendirmelerinin bütçe onayı olmadan yapılması ve '
                + 'hizmet faturalarının dosya tutarına oranla yüksek kalması.',
              cause: 'Görevlendirmede tutar tahmini ve onay eşiği bulunmaması.',
              consequence: 'Dosya maliyetinin tazminat tutarını aşması, üye şirkete yansıtılamayan gider.',
              category: 'financial',
              inherent: [3, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-10-14',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-08',
              name: 'Destek hizmeti tutar tahmini ve onay eşiği',
              description:
                'Görevlendirme öncesi tahmini hizmet bedeli girilir; belirlenen eşiği aşan '
                + 'görevlendirmeler bölüm müdürü onayına tabidir.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['authorization'],
              frequency: 'per_transaction',
              method: 'Görevlendirme ekranında tahmini bedel ve onay akışı.',
              evidence: 'Tahmini bedel kaydı ve onay',
              mitigates: ['R-HSD-07'],
              owner: 'usr-05',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-26',
              lastTestedAt: '2026-06-29',
              testResult: 'Eşik üzeri 14 görevlendirmenin tamamında onay mevcut.',
            },
          ],
          children: [
            {
              code: 'HSD-07-1',
              name: 'Uzman görevlendirmesi',
              description: 'Zarar türüne göre eksper, aktüer, tıbbi bilirkişi veya araştırmacı atanması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Zarar türü'],
              outputs: ['Görevlendirme kaydı'],
              controlRefs: ['K-HSD-08'],
            },
            {
              code: 'HSD-07-2',
              name: 'Zarar raporunun hazırlanması',
              description: 'Uzmanın zarar raporu ve destekleyici belgeleri hazırlaması.',
              systems: ['DYS'],
              inputs: ['Görevlendirme'],
              outputs: ['Zarar raporu'],
            },
          ],
        },

        /* ---------- Belge Kontrolü ---------- */
        {
          code: 'HSD-08',
          name: 'Belge Kontrolü ve Eksik Evrak Takibi',
          owner: 'usr-04',
          description:
            'Muhabir ve destek hizmetlerinden gelen belgelerin kontrol edilmesi, eksik evrak varsa '
            + 'talep edilmesi ve takip edilmesi.',
          purpose: 'Kararın eksiksiz belge setine dayanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Muhabir belgeleri', 'Zarar raporu'],
          outputs: ['Belge kontrol sonucu', 'Eksik evrak talebi'],
          maturity: 3,
          slaDays: 5,
          lastReviewedAt: '2026-03-05',
          risks: [
            {
              code: 'R-HSD-08',
              name: 'Eksik evrak talebinin takipsiz kalması',
              description:
                'Talep edilen eksik belgenin gelip gelmediğinin izlenmemesi ve dosyanın süresiz beklemesi.',
              cause: 'Eksik evrak talebinin sistemde süre takibine bağlanmaması.',
              consequence: 'Dosya gecikmesi, muhabirle ilişkide gerginlik ve SLA aşımı.',
              category: 'operational',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-04',
              identifiedAt: '2025-06-19',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-09',
              name: 'Eksik evrak süre takibi ve hatırlatma',
              description:
                'Eksik evrak talebi sistemde tarihle kaydedilir; belirlenen süre içinde yanıt gelmezse '
                + 'hatırlatma üretilir ve ikinci hatırlatmada dosya değerlendirmeye alınır.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'system'],
              frequency: 'weekly',
              method: 'Eksik evrak talep tarihine göre otomatik hatırlatma.',
              evidence: 'Talep kaydı ve hatırlatma logu',
              mitigates: ['R-HSD-08'],
              owner: 'usr-04',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-25',
              lastTestedAt: '2026-06-21',
              testResult: 'Hatırlatma üretiliyor; ikinci hatırlatma sonrası değerlendirme adımı işletilmiyor.',
            },
          ],
          children: [
            {
              code: 'HSD-08-1',
              name: 'Belgelerin kontrolü',
              description: 'Gelen belgelerin eksiksizlik ve tutarlılık açısından kontrolü.',
              systems: ['DYS'],
              inputs: ['Belgeler'],
              outputs: ['Kontrol sonucu'],
            },
            {
              code: 'HSD-08-2',
              name: 'Eksik evrak talebi ve takibi',
              description: 'Eksik belgenin talep edilmesi ve süre takibinin başlatılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Kontrol sonucu'],
              outputs: ['Eksik evrak talebi'],
              controlRefs: ['K-HSD-09'],
            },
          ],
        },

        /* ---------- Değerlendirme ve Karar ---------- */
        {
          code: 'HSD-09',
          name: 'Değerlendirme ve Karar',
          owner: 'usr-03',
          description:
            'Dosyanın bütün olarak değerlendirilmesi ve talebin kabul mü red mi edileceğine karar '
            + 'verilmesi; red hâlinde başvurana bilgi verilip dosyanın kapatılması.',
          purpose: 'Kararın belgeye dayalı, gerekçeli ve tutarlı olmasını sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Tam belge seti', 'Zarar raporu', 'Sahtecilik değerlendirmesi'],
          outputs: ['Kabul/red kararı', 'Başvurana bildirim'],
          maturity: 3,
          slaDays: 5,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Hukuki Sonuç',
              'Red kararı Türkiye’de dava konusu olabilir; gerekçenin dosyada belgeli durması savunmanın temelidir.'],
          ],
          risks: [
            {
              code: 'R-HSD-09',
              name: 'Red gerekçesinin dosyada belgelenmemesi',
              description:
                'Talebin reddedilmesi hâlinde gerekçenin yalnızca bildirim yazısında kalması ve '
                + 'dayanak belgelerin dosyaya bağlanmaması.',
              cause: 'Red kararında gerekçe ve dayanak belge bağlantısının zorunlu olmaması.',
              consequence: 'Dava hâlinde savunmanın zayıf kalması ve aleyhe karar riski.',
              category: 'legal',
              inherent: [3, 5],
              residual: [2, 5],
              target: [2, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-11-27',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-10',
              name: 'Red kararında gerekçe ve dayanak belge zorunluluğu',
              description:
                'Red kararı verilirken gerekçe listeden seçilir ve en az bir dayanak belge dosyadan '
                + 'işaretlenir; ikisi olmadan karar kaydedilemez.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['data_validation', 'system'],
              frequency: 'per_transaction',
              method: 'Karar ekranında zorunlu gerekçe ve belge bağlantısı.',
              evidence: 'Karar kaydı ve bağlı belgeler',
              mitigates: ['R-HSD-09'],
              owner: 'usr-09',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-27',
              lastTestedAt: '2026-07-03',
              testResult: '16 red kararının tamamında gerekçe ve dayanak belge mevcut.',
            },
          ],
          children: [
            {
              code: 'HSD-09-1',
              name: 'Dosyanın bütün olarak değerlendirilmesi',
              description: 'Belge, rapor ve sahtecilik değerlendirmesinin birlikte ele alınması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Tam belge seti'],
              outputs: ['Değerlendirme notu'],
            },
            {
              code: 'HSD-09-2',
              name: 'Kabul / red kararı',
              description: 'Talebin kabul veya reddine karar verilmesi ve gerekçenin kaydı.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Değerlendirme notu'],
              outputs: ['Karar kaydı'],
              controlRefs: ['K-HSD-10'],
            },
            {
              code: 'HSD-09-3',
              name: 'Sonucun bildirilmesi ve dosya kapanışı',
              description: 'Red hâlinde başvurana bilgi verilmesi ve dosyanın kapatılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Karar kaydı'],
              outputs: ['Bildirim', 'Kapatılmış dosya'],
            },
          ],
        },

        /* ---------- Dava Takibi ---------- */
        {
          code: 'HSD-10',
          name: 'Dava Süreci Takibi',
          owner: 'usr-09',
          description:
            'Red edilen veya tutarına itiraz edilen dosyalarda Türkiye’de dava açılması hâlinde '
            + 'sürecin hukuk birimince takip edilmesi.',
          purpose: 'Dava sürecinin duruşma ve süre kaçırmadan yürütülmesini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Dava dilekçesi', 'Dosya belgeleri'],
          outputs: ['Dava takip kaydı', 'Karar'],
          maturity: 3,
          slaDays: 30,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Hukuki Sonuç',
              'Cevap ve itiraz süreleri hak düşürücüdür; kaçırılan süre davanın kaybı anlamına gelebilir.'],
          ],
          risks: [
            {
              code: 'R-HSD-10',
              name: 'Dava sürelerinin kaçırılması',
              description:
                'Cevap dilekçesi, itiraz ve temyiz sürelerinin sistemde izlenmemesi ve kaçırılması.',
              cause: 'Dava takibinin ajanda üzerinden elle yapılması.',
              consequence: 'Hak kaybı, aleyhe karar ve yargılama gideri.',
              category: 'legal',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-03-25',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-11',
              name: 'Dava süre takip ve uyarı sistemi',
              description:
                'Dava dosyalarında cevap, itiraz ve temyiz süreleri sistemde tutulur; süre bitimine '
                + 'bir hafta kala hukuk birimine uyarı üretilir.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'system'],
              frequency: 'daily',
              method: 'Süre alanlarına göre günlük uyarı taraması.',
              evidence: 'Süre kaydı ve uyarı logu',
              mitigates: ['R-HSD-10'],
              owner: 'usr-09',
              key: true,
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-07-07',
              testResult: 'Açık 9 dava dosyasının tamamında süreler sistemde; uyarılar zamanında üretilmiş.',
            },
          ],
          children: [
            {
              code: 'HSD-10-1',
              name: 'Dava dosyasının açılması',
              description: 'Dava bilgilerinin ve sürelerin sisteme kaydedilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dava dilekçesi'],
              outputs: ['Dava kaydı'],
              controlRefs: ['K-HSD-11'],
            },
            {
              code: 'HSD-10-2',
              name: 'Sürecin takibi',
              description: 'Duruşma, cevap ve itiraz sürelerinin takip edilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dava kaydı'],
              outputs: ['Takip kaydı'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* C — TAZMİNAT VE KAPANIŞ                                       */
    /* ============================================================ */
    {
      code: 'HSD-C',
      name: 'Tazminat ve Kapanış',
      owner: 'usr-03',
      description:
        'Tazminat tutarının belirlenmesi, belge–fatura tutarlılık kontrolü, talep girişi ve bölüm '
        + 'müdürünün onayıyla dosyanın kapatılması.',
      purpose: 'Karşılanacak tutarın belgeyle tutarlı olmasını ve tek elden onaylanmasını sağlamak.',
      systems: ['Büro Hasar Sistemi'],
      inputs: ['Kabul kararı', 'Zarar raporu', 'Muhabir faturası'],
      outputs: ['Onaylanmış tazminat', 'Kapatılmış dosya'],
      maturity: 3,
      slaDays: 7,

      children: [
        {
          code: 'HSD-11',
          name: 'Tazminat Tutarının Belirlenmesi ve Talep Girişi',
          owner: 'usr-03',
          description:
            'Zarar raporu ve muhabir faturası esas alınarak tazminat tutarının belirlenmesi ve '
            + 'sisteme talep olarak girilmesi.',
          purpose: 'Karşılanacak tutarın belgeye dayanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Zarar raporu', 'Muhabir faturası'],
          outputs: ['Talep kaydı'],
          maturity: 3,
          slaDays: 3,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Belge ile fatura arasındaki tutarsızlık, üye şirkete yansıtılamayan fark olarak büroda kalır.'],
          ],
          examples: [
            {
              title: 'Muhabir faturası ile zarar raporunun uyuşmaması',
              scenario:
                'Zarar raporu 8.400 EUR diyor, muhabir faturası 9.150 EUR geliyor. Aradaki fark '
                + 'sorgulanmadan talep girişi yapılıyor.',
              risk: '750 EUR’luk fark üye şirkete yansıtılamıyor ve büroda kalıyor.',
              control: 'Talep girişinde rapor tutarı ile fatura tutarının sistemce karşılaştırılması.',
              controlType: 'Önleyici — tutarlılık kontrolü',
              evidence: 'Karşılaştırma logu ve fark açıklaması',
              criticalNote: 'Belirlenen toleransı aşan farklarda açıklama zorunludur.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-12',
              name: 'Belge ile fatura tutarının uyuşmaması',
              description:
                'Zarar raporundaki tutar ile muhabir faturasındaki tutar arasındaki farkın sorgulanmadan '
                + 'talep girişine geçilmesi.',
              cause: 'Tutarlılık kontrolünün sistemsel değil, gözle yapılması.',
              consequence: 'Üye şirkete yansıtılamayan fark ve mutabakat uyuşmazlığı.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-05-16',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-12',
              name: 'Rapor–fatura tutar karşılaştırması',
              description:
                'Talep girişinde zarar raporu tutarı ile muhabir faturası sistemce karşılaştırılır; '
                + 'toleransı aşan farklarda açıklama zorunludur ve kayıt yönetici onayına düşer.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['data_validation', 'reconciliation'],
              frequency: 'per_transaction',
              method: 'Tutar alanlarının karşılaştırılması ve tolerans denetimi.',
              evidence: 'Karşılaştırma logu ve fark açıklamaları',
              mitigates: ['R-HSD-12'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-07-04',
              testResult: 'Karşılaştırma yapılıyor; tolerans parametresi tanımlı değil, fark açıklamaları yüzeysel.',
            },
          ],
          children: [
            {
              code: 'HSD-11-1',
              name: 'Tazminat tutarının belirlenmesi',
              description: 'Zarar raporu ve fatura esas alınarak tutarın belirlenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Zarar raporu'],
              outputs: ['Tazminat tutarı'],
            },
            {
              code: 'HSD-11-2',
              name: 'Tutarlılık kontrolü ve talep girişi',
              description: 'Belge–fatura tutarlılığının kontrolü ve talebin sisteme girilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Tazminat tutarı', 'Muhabir faturası'],
              outputs: ['Talep kaydı'],
              controlRefs: ['K-HSD-12'],
            },
          ],
        },
        {
          code: 'HSD-12',
          name: 'Bölüm Müdürü Onayı ve Dosya Kapanışı',
          owner: 'usr-02',
          description:
            'Talebin bölüm müdürü tarafından kontrol edilip onaylanması ve dosyanın kapanış kararının verilmesi.',
          purpose: 'Hiçbir yükümlülüğün tek kişinin kararıyla kesinleşmemesini sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Talep kaydı'],
          outputs: ['Onaylanmış talep', 'Kapanış kararı'],
          maturity: 3,
          slaDays: 3,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['authorization', 'Yetki Ayrımı',
              'Talebi giren ile onaylayan farklı kişi olmalıdır.'],
          ],
          risks: [
            {
              code: 'R-HSD-13',
              name: 'Kapanan dosyanın eksik belgeyle kapatılması',
              description:
                'Bölüm müdürü onayında belge tamlığının kontrol edilmemesi ve dosyanın eksik '
                + 'evrakla kapatılması.',
              cause: 'Kapanış kontrol listesinin bulunmaması.',
              consequence:
                'Rücu veya mutabakat aşamasında belge istendiğinde dosyanın yeniden açılması.',
              category: 'operational',
              inherent: [3, 3],
              residual: [2, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-02',
              identifiedAt: '2025-09-23',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-13',
              name: 'Dosya kapanış kontrol listesi',
              description:
                'Kapanış onayında zorunlu belge seti (zarar raporu, fatura, dekont, karar kaydı) '
                + 'sistemce kontrol edilir; eksik varsa kapanış yapılamaz.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['data_validation', 'authorization'],
              frequency: 'per_transaction',
              method: 'Kapanış ekranında zorunlu belge kontrolü.',
              evidence: 'Kapanış kontrol logu',
              mitigates: ['R-HSD-13'],
              owner: 'usr-02',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-07-06',
              testResult: 'Kapanan 30 dosyanın tamamında zorunlu belge seti tam.',
            },
          ],
          docs: [
            {
              code: 'CHK-HSD-12',
              name: 'Yurt Dışı Hasar Dosya Kapanış Kontrol Listesi',
              type: 'checklist',
              version: '1.4',
              owner: 'usr-02',
              publishedAt: '2025-09-10',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-09-10',
              summary: 'Dosya kapanmadan önce bulunması zorunlu belge seti.',
              sections: [
                {
                  heading: 'Zorunlu Belgeler',
                  body: [
                    'Zarar raporu (eksper, aktüer veya tıbbi bilirkişi).',
                    'Muhabir faturası ve destekleyici belgeler.',
                    'Ödeme dekontu.',
                    'Kabul/red karar kaydı ve gerekçesi.',
                    'Sahtecilik değerlendirme notu.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-13'],
            },
          ],
          children: [
            {
              code: 'HSD-12-1',
              name: 'Talebin kontrol ve onayı',
              description: 'Bölüm müdürünün talebi kontrol edip onaylaması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Talep kaydı'],
              outputs: ['Onay kaydı'],
            },
            {
              code: 'HSD-12-2',
              name: 'Kapanış kararı',
              description: 'Belge tamlığının kontrolü ve dosyanın kapatılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Onay kaydı'],
              outputs: ['Kapatılmış dosya'],
              controlRefs: ['K-HSD-13'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* D — MUTABAKAT, TAHAKKUK VE RÜCU                               */
    /* ============================================================ */
    {
      code: 'HSD-D',
      name: 'Mutabakat, Tahakkuk ve Rücu',
      owner: 'usr-08',
      description:
        'Ay kapama ve üye şirketlerle prim mutabakatı, SBM kayıtlarının esas alınması, tahakkuk ve '
        + 'muallak raporları, dekont üretimi ve transfer, teminat dışı hâllerde rücu ve reasürans ihbarı.',
      purpose:
        'Yurt dışında doğan yükümlülüğün üye şirketlere ve reasürörlere doğru yansıtılmasını sağlamak.',
      systems: ['Büro Hasar Sistemi', 'SBM', 'Oracle'],
      inputs: ['Kapanan dosyalar', 'SBM kayıtları', 'Muallak verileri'],
      outputs: ['Üye şirket dekontu', 'Tahakkuk kaydı', 'Rücu dosyası', 'Reasürans ihbarı'],
      maturity: 3,
      slaDays: 15,

      children: [
        {
          code: 'HSD-13',
          name: 'Ay Kapama ve Üye Şirket Prim Mutabakatı',
          owner: 'usr-08',
          participants: ['usr-06'],
          description:
            'Ay sonu toplu tahakkukun yapılması, üye şirketlerle prim mutabakatı ve SBM kayıtlarının '
            + 'esas alınması; düzeltme gerekiyorsa 10 gün içinde kayıt düzeltilmesi.',
          purpose: 'Üye şirket paylarının sektör kayıtlarıyla tutarlı biçimde belirlenmesini sağlamak.',
          systems: ['SBM', 'Büro Hasar Sistemi', 'Oracle'],
          inputs: ['SBM kayıtları', 'Poliçe üretim verileri'],
          outputs: ['Mutabık prim tabanı', 'Düzeltme kayıtları'],
          maturity: 3,
          slaDays: 10,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              '25.000 Euro üzerindeki tazminat ödemelerinde, temsilcinin hak sahibine yaptığı '
              + 'ödemeye ilişkin ödeme belgesinin temin edilmesi gerekir (Madde 8).'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Rücu taleplerinin tahakkuk işlemi, Yeşil Kart Reasürans Havuzu Kuruluş ve Çalışma '
              + 'İlkeleri gereğince aylık olarak yapılır (Madde 8).'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'SBM kayıtlarında düzeltme için 10 günlük süre vardır; kaçırılan süre yanlış payın kesinleşmesi demektir.'],
            ['financial', 'Finansal Etki',
              'Prim tabanı, üye şirketlere yansıtılacak hasar payının doğrudan belirleyicisidir.'],
          ],
          examples: [
            {
              title: '10 günlük düzeltme süresinin kaçırılması',
              scenario:
                'SBM kayıtlarında bir üye şirketin prim üretimi eksik görünüyor. Fark ay kapanışında '
                + 'tespit ediliyor ama düzeltme talebi 12. günde yapılıyor.',
              risk: 'Yanlış prim tabanı kesinleşiyor; hasar payı dağıtımı hatalı yapılıyor.',
              control: 'Düzeltme süresinin sistemde geri sayımla izlenmesi ve son iki günde uyarı üretilmesi.',
              controlType: 'Tespit edici — süre izleme',
              evidence: 'Düzeltme talep kaydı ve uyarı logu',
              criticalNote: 'Süre dolduğunda SBM kayıtları esas alınır, itiraz hakkı kalmaz.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-14',
              name: 'SBM kayıt düzeltme süresinin kaçırılması',
              description:
                'SBM kayıtlarındaki hatalı prim verisinin 10 günlük düzeltme süresi içinde '
                + 'düzeltilmemesi ve yanlış tabanın kesinleşmesi.',
              cause: 'Sürenin sistemde izlenmemesi ve kontrolün ay kapanışına bırakılması.',
              consequence: 'Hasar payı dağıtımının hatalı yapılması ve üye şirketlerle uyuşmazlık.',
              category: 'compliance',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-08',
              identifiedAt: '2025-04-03',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-14',
              name: 'SBM düzeltme süresi geri sayımı',
              description:
                'SBM kayıtlarıyla tespit edilen farklar için 10 günlük düzeltme süresi sistemde '
                + 'geri sayımla izlenir; son iki günde sorumluya ve yöneticiye uyarı gider.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'system'],
              frequency: 'daily',
              method: 'Fark kaydı tarihine göre geri sayım ve uyarı.',
              evidence: 'Fark kaydı ve uyarı logu',
              mitigates: ['R-HSD-14'],
              owner: 'usr-08',
              key: true,
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-07-09',
              testResult:
                'Geri sayım yok; farklar Excel listede takip ediliyor. Son yılda 2 düzeltme süresi kaçırılmış.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSD-13',
              name: 'Ay Kapama ve Üye Şirket Mutabakat Prosedürü',
              type: 'procedure',
              version: '3.2',
              owner: 'usr-08',
              publishedAt: '2025-01-10',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-01-10',
              summary:
                'Ay sonu toplu tahakkuk, SBM kayıtlarının esas alınması, düzeltme süresi ve üye '
                + 'şirketlerle prim mutabakatı.',
              sections: [
                {
                  heading: 'SBM Kayıtları',
                  body: [
                    'Prim tabanı olarak SBM kayıtları esas alınır.',
                    'Tespit edilen farklar için düzeltme talebi 10 gün içinde yapılır.',
                    'Süre dolduğunda SBM kayıtları kesinleşir, itiraz hakkı kalmaz.',
                  ],
                },
                {
                  heading: 'Dekont ve Transfer',
                  body: [
                    'Mutabık taban üzerinden alacaklı/borçlu dekontları sistemce üretilir.',
                    'Dekontlar üye şirketlere gönderilir ve bedeller toplanır.',
                    'Toplanan bedeller alacaklılara transfer edilir ve bilgilendirme yapılır.',
                    '30 günü aşan tahsil edilmemiş dekontlar aylık olarak yönetime raporlanır.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-14', 'K-HSD-15', 'K-HSD-16'],
            },
          ],
          children: [
            {
              code: 'HSD-13-1',
              name: 'Ay sonu toplu tahakkuk',
              description: 'Ay kapama ve toplu tahakkuk işleminin yapılması.',
              systems: ['Oracle'],
              inputs: ['Dosya verileri'],
              outputs: ['Tahakkuk kaydı'],
            },
            {
              code: 'HSD-13-2',
              name: 'SBM karşılaştırması ve düzeltme',
              description: 'SBM kayıtlarıyla karşılaştırma ve 10 gün içinde düzeltme talebi.',
              systems: ['SBM'],
              inputs: ['SBM kayıtları'],
              outputs: ['Düzeltme kaydı'],
              controlRefs: ['K-HSD-14'],
            },
            {
              code: 'HSD-13-3',
              name: 'Üye şirketlerle prim mutabakatı',
              description: 'Mutabık prim tabanının üye şirketlerle teyit edilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Düzeltilmiş kayıtlar'],
              outputs: ['Mutabık prim tabanı'],
            },
          ],
        },
        {
          code: 'HSD-14',
          name: 'Tahakkuk ve Muallak Raporları',
          owner: 'usr-08',
          description:
            'Ay sonu tahakkuk ve muallak raporlarının hazırlanması, üst yönetim tarafından '
            + 'değerlendirilmesi ve ay kapanış bilgisinin paylaşılması.',
          purpose: 'Yükümlülüğün ve gerçekleşen tahakkukun yönetimce izlenmesini sağlamak.',
          systems: ['Oracle', 'Büro Hasar Sistemi'],
          inputs: ['Tahakkuk kayıtları', 'Muallak verileri'],
          outputs: ['Ay sonu raporu', 'Yönetim değerlendirmesi'],
          maturity: 3,
          slaDays: 3,
          lastReviewedAt: '2026-03-05',
          risks: [
            {
              code: 'R-HSD-15',
              name: 'Muallak ve tahakkuk raporlarının mutabık olmaması',
              description:
                'Hasar sisteminden gelen muallak verisi ile muhasebe tahakkuk kayıtlarının '
                + 'karşılaştırılmaması ve farkın raporlanmaması.',
              cause: 'İki kaynak arasında sistemsel mutabakat bulunmaması.',
              consequence: 'Mali tabloda açıklanamayan fark ve denetim bulgusu.',
              category: 'financial',
              inherent: [3, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-06',
              identifiedAt: '2025-12-17',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-15',
              name: 'Hasar–muhasebe muallak mutabakatı',
              description:
                'Ay sonunda hasar sistemindeki muallak toplamı ile muhasebe kayıtları karşılaştırılır; '
                + 'fark açıklanmadan rapor yayımlanmaz.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['reconciliation'],
              frequency: 'monthly',
              method: 'İki kaynaklı toplam karşılaştırması ve fark açıklaması.',
              evidence: 'Mutabakat tablosu ve fark açıklamaları',
              mitigates: ['R-HSD-15'],
              owner: 'usr-06',
              key: true,
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-05',
              lastTestedAt: '2026-07-05',
              testResult: 'Son üç ayın tamamında mutabakat yapılmış, farklar açıklanmış.',
            },
          ],
          children: [
            {
              code: 'HSD-14-1',
              name: 'Raporların hazırlanması',
              description: 'Ay sonu tahakkuk ve muallak raporlarının üretilmesi.',
              systems: ['Oracle'],
              inputs: ['Tahakkuk ve muallak verileri'],
              outputs: ['Ay sonu raporu'],
              controlRefs: ['K-HSD-15'],
            },
            {
              code: 'HSD-14-2',
              name: 'Yönetim değerlendirmesi',
              description: 'Raporların üst yönetim tarafından değerlendirilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Ay sonu raporu'],
              outputs: ['Değerlendirme notu'],
            },
          ],
        },
        {
          code: 'HSD-15',
          name: 'Dekont Üretimi ve Transfer',
          owner: 'usr-08',
          description:
            'Alacaklı/borçlu dekontlarının sistemce üretilip üye şirketlere gönderilmesi, dekont '
            + 'bedellerinin toplanması ve alacaklılara transferin sağlanması.',
          purpose: 'Mahsuplaşmanın doğru tutarlarla ve zamanında tamamlanmasını sağlamak.',
          systems: ['Oracle', 'Büro Hasar Sistemi'],
          inputs: ['Mutabık prim tabanı', 'Tahakkuk kayıtları'],
          outputs: ['Üye şirket dekontu', 'Transfer kaydı'],
          maturity: 3,
          slaDays: 7,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Dekont, üye şirketle mahsuplaşmanın tek dayanağıdır; hatalı dekont doğrudan alacak/borç hatasıdır.'],
          ],
          risks: [
            {
              code: 'R-HSD-16',
              name: 'Dekont bedellerinin eksik tahsil edilmesi',
              description:
                'Üye şirketlere gönderilen dekont bedellerinin tahsil edilip edilmediğinin '
                + 'yaşlandırma ile izlenmemesi.',
              cause: 'Dekont alacaklarının vade bazlı takip edilmemesi.',
              consequence: 'Tahsil edilmemiş alacağın birikmesi ve nakit akışının bozulması.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-08',
              identifiedAt: '2025-07-31',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-16',
              name: 'Dekont alacak yaşlandırma raporu',
              description:
                'Gönderilen dekontlar vade bazında yaşlandırılır; 30 günü aşan tahsil edilmemiş '
                + 'dekontlar aylık olarak yönetime raporlanır.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'reconciliation'],
              frequency: 'monthly',
              method: 'Dekont vade tarihine göre yaşlandırma.',
              evidence: 'Yaşlandırma raporu',
              mitigates: ['R-HSD-16'],
              owner: 'usr-08',
              key: true,
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-05',
              lastTestedAt: '2026-06-30',
              testResult: 'Rapor üretiliyor; 30 günü aşan 7 dekont için takip aksiyonu açılmamış.',
            },
          ],
          children: [
            {
              code: 'HSD-15-1',
              name: 'Dekontların üretilmesi',
              description: 'Alacaklı/borçlu dekontlarının sistemce üretilmesi.',
              systems: ['Oracle'],
              inputs: ['Mutabık taban'],
              outputs: ['Dekontlar'],
            },
            {
              code: 'HSD-15-2',
              name: 'Üye şirketlere gönderim ve tahsilat',
              description: 'Dekontların gönderilmesi ve bedellerin toplanması.',
              systems: ['Oracle'],
              inputs: ['Dekontlar'],
              outputs: ['Tahsilat kaydı'],
              controlRefs: ['K-HSD-16'],
            },
            {
              code: 'HSD-15-3',
              name: 'Alacaklılara transfer',
              description: 'Toplanan bedellerin alacaklılara transferi ve bilgilendirme.',
              systems: ['Oracle'],
              inputs: ['Tahsilat kaydı'],
              outputs: ['Transfer kaydı'],
            },
          ],
        },
        {
          code: 'HSD-16',
          name: 'Rücu Süreci',
          owner: 'usr-09',
          participants: ['usr-03'],
          description:
            'Yeşil Kart teminatı geçerli değilse dosyadan ilgili kişinin bulunması, rücu nedenlerinin '
            + 'belirlenmesi, dokümanların hazırlanması ve ödeme geldikten sonra tahakkuk iptali.',
          purpose: 'Teminat dışı hâllerde ödenen tutarın sorumlusundan geri alınmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Teminat geçersizlik tespiti', 'Dosya belgeleri'],
          outputs: ['Rücu dosyası', 'Tahsilat', 'Tahakkuk iptali'],
          maturity: 2,
          slaDays: 30,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Hukuki Sonuç',
              'Rücu hakkı zamanaşımına tabidir; gecikme hakkın tamamen kaybına yol açar.'],
          ],
          examples: [
            {
              title: 'Rücu nedeninin belgelenmemesi',
              scenario:
                'Teminatın geçersiz olduğu tespit ediliyor ama gerekçe (poliçe süresi dışı kaza, '
                + 'ehliyetsiz sürücü, alkol) dosyada belgelenmiyor.',
              risk: 'Rücu davası açıldığında iddia ispatlanamıyor ve dava kaybediliyor.',
              control: 'Rücu nedeninin listeden seçilmesi ve en az bir dayanak belgeye bağlanması.',
              controlType: 'Önleyici — kanıt zorunluluğu',
              evidence: 'Rücu nedeni kaydı ve dayanak belge',
              criticalNote: 'Dayanak belgesi olmayan rücu dosyası açılamaz.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-17',
              name: 'Rücu nedeninin belgelenmemesi veya rücunun takipsiz kalması',
              description:
                'Teminat geçersizliğinin gerekçesinin dosyada belgelenmemesi ya da açılan rücu '
                + 'dosyasının tahsilata kadar takip edilmemesi.',
              cause:
                'Rücu nedeni listesinin ve dayanak belge zorunluluğunun bulunmaması; rücu dosyalarının '
                + 'ayrı bir takip listesinde izlenmemesi.',
              consequence:
                'Geri alınamayan ödeme, zamanaşımına uğrayan rücu hakkı ve kaybedilen dava.',
              category: 'legal',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-06-02',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 31000'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-17',
              name: 'Rücu nedeni ve dayanak belge zorunluluğu',
              description:
                'Rücu dosyası açılırken neden listeden seçilir ve en az bir dayanak belge bağlanır; '
                + 'açık rücu dosyaları zamanaşımı tarihine göre yaşlandırılarak aylık izlenir.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['data_validation', 'monitoring'],
              frequency: 'monthly',
              method: 'Zorunlu alan denetimi ve rücu yaşlandırma raporu.',
              evidence: 'Rücu dosya kaydı ve yaşlandırma raporu',
              mitigates: ['R-HSD-17'],
              owner: 'usr-09',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-05',
              lastTestedAt: '2026-06-23',
              testResult:
                'Neden alanı var ama liste değil serbest metin; yaşlandırma raporu yok. Açık 14 rücu dosyasının 3’ü bir yıldır hareketsiz.',
            },
          ],
          actions: [
            {
              code: 'AKS-HSD-02',
              title: 'Rücu takip listesi ve zamanaşımı yaşlandırması',
              description:
                'Rücu nedenlerinin listeye çevrilmesi, dayanak belge zorunluluğu ve açık rücu '
                + 'dosyalarının zamanaşımı tarihine göre aylık yaşlandırılması.',
              riskCode: 'R-HSD-17',
              controlCode: 'K-HSD-17',
              owner: 'usr-09',
              dueDate: '2026-12-31',
              priority: 'high',
              status: 'in_progress',
              progress: 20,
              source: 'internal_audit',
              createdAt: '2026-07-18',
              createdBy: 'usr-24',
            },
          ],
          children: [
            {
              code: 'HSD-16-1',
              name: 'Teminat geçersizliğinin tespiti',
              description: 'Yeşil Kart teminatının geçerli olup olmadığının değerlendirilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Poliçe ve kaza bilgisi'],
              outputs: ['Geçersizlik tespiti'],
            },
            {
              code: 'HSD-16-2',
              name: 'Rücu dosyasının hazırlanması',
              description: 'İlgili kişinin bulunması, rücu nedenlerinin belirlenmesi ve dokümanların hazırlanması.',
              systems: ['DYS'],
              inputs: ['Geçersizlik tespiti'],
              outputs: ['Rücu dosyası'],
              controlRefs: ['K-HSD-17'],
            },
            {
              code: 'HSD-16-3',
              name: 'Tahsilat ve tahakkuk iptali',
              description: 'Rücu ödemesi geldikten sonra tahakkuk iptal işleminin yapılması.',
              systems: ['Oracle'],
              inputs: ['Rücu tahsilatı'],
              outputs: ['Tahakkuk iptali'],
            },
          ],
        },
        {
          code: 'HSD-17',
          name: 'Reasürans İhbarı',
          owner: 'usr-06',
          description:
            'Reasürans sözleşmesinde tanımlı eşiği aşan dosyaların Milli Reasürans ve diğer '
            + 'reasürörlere sözleşme şartlarına göre ihbar edilmesi.',
          purpose: 'Reasürans korumasının kaybedilmemesini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['Eşik üzeri dosya'],
          outputs: ['Reasürans ihbarı'],
          maturity: 3,
          slaDays: 5,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Reasürans sözleşmesindeki ihbar süresi hak düşürücüdür; süresinde ihbar edilmeyen hasarda koruma kaybedilir.'],
          ],
          risks: [
            {
              code: 'R-HSD-18',
              name: 'Reasürans ihbar süresinin kaçırılması',
              description:
                'Sözleşme eşiğini aşan dosyaların reasüröre süresinde ihbar edilmemesi.',
              cause: 'Eşik kontrolünün ve ihbar süresinin sistemde izlenmemesi.',
              consequence: 'Reasürans korumasının kaybı ve zararın tamamının büroda kalması.',
              category: 'financial',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-06',
              identifiedAt: '2025-08-06',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'Reasürans Sözleşmesi'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-18',
              name: 'Reasürans eşiği ve ihbar süresi kontrolü',
              description:
                'Muallak veya ödenen tutar sözleşme eşiğini aştığında sistem ihbar görevi açar ve '
                + 'sözleşmedeki süre içinde ihbar edilmeyen dosyalar için uyarı üretir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'monitoring'],
              frequency: 'daily',
              method: 'Eşik taraması ve ihbar süresi izleme.',
              evidence: 'İhbar görevi ve gönderim kaydı',
              mitigates: ['R-HSD-18'],
              owner: 'usr-06',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-07-11',
              testResult: 'Eşik üzeri 6 dosyanın tamamı süresinde ihbar edilmiş.',
            },
          ],
          kris: [
            {
              code: 'KRI-HSD-01',
              name: 'Açık rücu dosyalarında ortalama yaş (gün)',
              definition:
                'Açık rücu dosyalarının açılış tarihinden bu yana geçen ortalama gün sayısı. '
                + 'Zamanaşımı riskinin göstergesidir.',
              riskCode: 'R-HSD-17',
              owner: 'usr-09',
              unit: 'U-HSR',
              frequency: 'monthly',
              direction: 'lower_better',
              greenMax: 120,
              amberMax: 240,
              readings: [140, 155, 162, 178, 190, 205, 218, 231, 246, 258, 272, 285],
            },
          ],
          children: [
            {
              code: 'HSD-17-1',
              name: 'Eşik kontrolü',
              description: 'Dosya tutarının reasürans sözleşme eşiğiyle karşılaştırılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Muallak / ödenen tutar'],
              outputs: ['Eşik sonucu'],
              controlRefs: ['K-HSD-18'],
            },
            {
              code: 'HSD-17-2',
              name: 'İhbarın yapılması',
              description: 'Sözleşme şartlarına göre reasüröre ihbarın gönderilmesi.',
              systems: ['Outlook'],
              inputs: ['Eşik sonucu'],
              outputs: ['Reasürans ihbarı'],
            },
          ],
        },
      ],
    },
  ],
};
