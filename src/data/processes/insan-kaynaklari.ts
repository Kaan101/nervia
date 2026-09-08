import type { NodeSpec } from '../spec';

/**
 * İNSAN KAYNAKLARI — 2.0
 *
 * Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024),
 * Bölüm 7 – İnsan Kaynakları, Madde 21-37.
 *
 * Alt süreçler dokümandaki madde başlıklarıyla birebir eşleşir; iş adımları
 * maddelerin numaralı bentleridir. Doküman bir görev listesi verir, risk
 * listesi vermez — buradaki riskler o görevlerin YAPILMAMASI ya da
 * SÜRESİNDE yapılmaması hâlinde doğan sonuçlardır ve her biri dayandığı
 * bende işaret eder. Dokümanda karşılığı olmayan hiçbir görev eklenmemiştir.
 *
 * Dokümanda başlık olarak geçip içeriği verilmemiş maddeler (Madde 23
 * Oryantasyon, Madde 24 İş Tanımı ve Yetkinlikler, Madde 26 Dokümantasyon,
 * Madde 27 CV-kayıt yönetimi, Madde 31 Motivasyon/Ödül, Madde 33 Mevzuat
 * takibi, Madde 34 Duyuru) adım olarak yer alır ama içeriği uydurulmamıştır;
 * olgunluk seviyeleri bunu yansıtacak şekilde düşüktür.
 */
export const insanKaynaklari: NodeSpec = {
  code: 'IKY',
  name: 'İnsan Kaynakları',
  unit: 'U-IKY',
  owner: 'usr-14',
  participants: ['usr-14', 'usr-15'],
  processClass: 'support',
  standards: ['COSO', 'ISO 9001', 'KVKK', '4857 sayılı İş Kanunu', '5510 sayılı Kanun'],
  description:
    'TMTB çalışanlarının özlük haklarının tam ve doğru kayıt altına alınması, güncel tutulması '
    + 've İK süreçlerinin eksiksiz yürütülmesi.',
  purpose:
    'Büro’nun iş süreçlerine destek vermek amacıyla İK süreçlerini yürütmek, mevcut süreçleri '
    + 'güncel tutmak, hazır olmayan sistem veya süreçleri yaratmak.',
  customer: 'TMTB çalışanları ve bölüm yöneticileri',
  systems: ['İK yazılımı', 'Logo Muhasebe', 'GİB e-Beyanname', 'SGK e-Bildirge', 'İŞKUR'],
  inputs: ['Personel ihtiyaç talebi', 'Puantaj ve izin kayıtları', 'Performans puanlamaları'],
  outputs: ['Özlük dosyası', 'Bordro ve ödeme', 'Beyanname', 'Eğitim ve izin kayıtları'],
  maturity: 3,
  version: '2.0',
  slaDays: 30,
  lastReviewedAt: '2024-12-12',
  reviewFrequencyMonths: 12,
  updatedAt: '2026-09-08',

  critical: [
    ['regulatory', 'Mevzuat Gerekliliği',
      'Muhtasar, SGK ve İŞKUR bildirimleri aylık yasal sürelere tabidir; gecikme idari para cezası doğurur.'],
    ['privacy', 'Veri Gizliliği',
      'Özlük dosyası, ücret ve sağlık sigortası verileri özel nitelikli kişisel veridir.'],
  ],

  children: [
    /* ============================================================ */
    /* IKY-A — İŞE ALIM VE YERLEŞTİRME (Madde 22-24)                */
    /* ============================================================ */
    {
      code: 'IKY-A',
      name: 'İşe Alım ve Yerleştirme',
      owner: 'usr-15',
      description:
        'Personel ihtiyacının belirlenmesinden deneme süresinin tamamlanmasına kadar olan '
        + 'işe alım, seçme, yerleştirme ve oryantasyon işlemleri.',
      purpose: 'İhtiyaç duyulan yetkinlikteki personelin kazanılması ve özlük kaydının eksiksiz açılması.',
      maturity: 3,
      slaDays: 45,
      children: [
        {
          code: 'IKY-01',
          name: 'İşe Alım, Seçme ve Yerleştirme (Madde 22)',
          owner: 'usr-15',
          description:
            'Personel ihtiyacının belirlenmesi, ilan, aday görüşmeleri, seçim ve işe giriş '
            + 'işlemlerinin (SGK girişi, özlük dosyası, banka hesabı, OKS) tamamlanması.',
          purpose: 'Doğru adayın seçilmesi ve işe giriş yükümlülüklerinin süresinde yerine getirilmesi.',
          systems: ['İK yazılımı', 'SGK e-Bildirge'],
          inputs: ['Bölüm müdürünün personel talebi ve aranan özellikler'],
          outputs: ['İşe alım kararı', 'Açılmış özlük dosyası', 'SGK girişi', 'OKS kaydı'],
          maturity: 3,
          slaDays: 45,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'SGK işe giriş bildirgesi, çalışma başlamadan önce verilmelidir; gecikmesi idari para cezası doğurur.'],
            ['authorization', 'Yetki ve Onay',
              'İhtiyaç duyulan personelin özellikleri bölüm müdüründen alınır; seçim tek başına İK kararı değildir.'],
          ],
          examples: [
            {
              title: 'Deneme süresi sonucunun istenmemesi',
              scenario:
                'Deneme süresi dolan personel için bölüm yetkilisinden sonuç istenmiyor; süre '
                + 'sessizce geçiyor ve personel kadroya geçmiş sayılıyor.',
              risk:
                'Deneme süresi hakkı kullanılamıyor; ayrıca sağlık ve hayat sigortası deneme '
                + 'süresi olumlu sonuçlandığında yapılacağı için sigorta da başlatılmıyor.',
              control: 'Deneme süresi bitiş tarihinin İK takviminde izlenmesi ve bölüm yetkilisine hatırlatma çıkılması.',
              controlType: 'Önleyici — takvim kontrolü',
              evidence: 'Deneme süresi izleme listesi ve bölüm yetkilisi yanıtı',
              criticalNote: 'Madde 22/12-13: deneme süresinin takibi ve sonucunun bölüm yetkilisinden istenmesi ayrı iki görevdir.',
            },
          ],
          risks: [
            {
              code: 'R-IKY-01',
              name: 'SGK işe giriş bildiriminin süresinde yapılmaması',
              description:
                'Personelin SGK girişinin çalışma başlamadan önce yapılmaması veya unutulması.',
              cause:
                'İşe başlama tarihinin İK’ya geç bildirilmesi; giriş belgelerinin toplanmasının '
                + 'bildirimden önce beklenmesi.',
              consequence:
                'İdari para cezası, kayıt dışı çalıştırma iddiası ve iş kazası hâlinde sigortasızlık.',
              category: 'compliance',
              inherent: [3, 4],
              residual: [1, 4],
              target: [1, 3],
              appetite: 'averse',
              treatment: 'mitigate',
              owner: 'usr-15',
              standards: ['5510 sayılı Kanun md. 8'],
            },
            {
              code: 'R-IKY-02',
              name: 'Deneme süresi sonucunun alınmaması',
              description:
                'Deneme süresi dolan personel için bölüm yetkilisinden değerlendirme istenmemesi.',
              cause: 'Deneme süresi bitiş tarihinin izlenmemesi; hatırlatma mekanizmasının olmaması.',
              consequence:
                'Deneme süresi hakkının kaybı ve sağlık/hayat sigortasının başlatılmaması.',
              category: 'hr',
              inherent: [3, 3],
              residual: [2, 2],
              appetite: 'cautious',
              owner: 'usr-15',
            },
            {
              code: 'R-IKY-03',
              name: 'Özlük dosyasının eksik oluşturulması',
              description:
                'İşe giriş belgelerinin tamamı istenmeden özlük dosyasının açılması ve eksiğin kapatılmaması.',
              cause: 'Belge listesinin kontrol listesi olarak işletilmemesi.',
              consequence: 'Denetimde eksik özlük dosyası tespiti ve ispat güçlüğü.',
              category: 'compliance',
              inherent: [3, 3],
              residual: [2, 2],
              appetite: 'cautious',
              owner: 'usr-15',
            },
          ],
          controls: [
            {
              code: 'K-IKY-01',
              name: 'İşe giriş kontrol listesi ve SGK bildirim teyidi',
              description:
                'İşe giriş belgeleri, SGK girişi, banka hesabı ve OKS kaydı tek bir kontrol '
                + 'listesinde izlenir; SGK bildiriminin çalışma başlamadan önce yapıldığı '
                + 'e-Bildirge çıktısıyla teyit edilir.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['authorization', 'monitoring'],
              frequency: 'event_based',
              method:
                'Her işe alımda liste doldurulur; SGK bildirimi yapılmadan personel çalışmaya '
                + 'başlatılmaz. Liste İK Direktörü tarafından imzalanır.',
              evidence: 'İmzalı işe giriş kontrol listesi ve e-Bildirge çıktısı',
              mitigates: ['R-IKY-01', 'R-IKY-03'],
              owner: 'usr-15',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-07-15',
              lastTestedAt: '2026-06-20',
              testResult: 'Son 12 işe alımın tamamında liste eksiksiz; SGK bildirimleri süresinde.',
            },
            {
              code: 'K-IKY-02',
              name: 'Deneme süresi izleme ve bölüm yetkilisine hatırlatma',
              description:
                'Deneme süresi bitiş tarihleri İK takviminde izlenir; bitiş tarihinden iki hafta '
                + 'önce bölüm yetkilisinden yazılı sonuç istenir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring'],
              frequency: 'monthly',
              method: 'Aylık deneme süresi listesi çıkarılır ve süresi yaklaşanlar için yazı gönderilir.',
              evidence: 'Deneme süresi izleme listesi ve bölüm yetkilisi yanıt yazısı',
              mitigates: ['R-IKY-02'],
              owner: 'usr-15',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-01',
              lastTestedAt: null,
            },
          ],
          docs: [
            {
              code: 'PRS-IKY-01',
              name: 'İşe Alım, Seçme ve Yerleştirme Prosedürü',
              type: 'procedure',
              version: '1.0',
              owner: 'usr-14',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary:
                'Personel ihtiyacının belirlenmesinden deneme süresinin sonuçlanmasına kadar '
                + 'olan on dört adımlık işe alım akışı.',
              sections: [
                {
                  heading: 'İhtiyaç ve ilan',
                  body: [
                    'Personel ihtiyacı belirlenir.',
                    'İhtiyaç duyulan personelin özellikleri bölüm müdüründen öğrenilir.',
                    'Gerekli kurumlara iş ilanı verilir; ilanlar takip edilerek bölüm müdürü bilgilendirilir.',
                  ],
                },
                {
                  heading: 'Seçim',
                  body: [
                    'Aday ile gerekli görüşmeler yapılır ve aday şartlar hakkında bilgilendirilir.',
                    'Uygun olan aday belirlenir.',
                  ],
                },
                {
                  heading: 'İşe giriş işlemleri',
                  body: [
                    'Personelin SGK girişi yapılır.',
                    'Tüm işe giriş belgeleri istenir ve özlük dosyası oluşturulur.',
                    'Gerekli banka hesapları açılır ve OKS yapılır.',
                  ],
                },
                {
                  heading: 'Deneme süresi',
                  body: [
                    'Deneme süresi takip edilir.',
                    'Bölüm yetkilisinden deneme süresinin sonucu istenir.',
                    'Deneme süresi olumlu sonuçlanan personelin sağlık ve hayat sigortası yapılır.',
                  ],
                },
              ],
              controlCodes: ['K-IKY-01', 'K-IKY-02'],
            },
          ],
          children: [
            {
              code: 'IKY-01-1',
              name: 'İhtiyaç belirleme ve ilan',
              description: 'Personel ihtiyacının belirlenmesi, özelliklerin bölüm müdüründen alınması ve ilan verilmesi.',
            },
            {
              code: 'IKY-01-2',
              name: 'Aday görüşmeleri ve seçim',
              description: 'Adayla görüşme, şartlar hakkında bilgilendirme ve uygun adayın belirlenmesi.',
            },
            {
              code: 'IKY-01-3',
              name: 'İşe giriş işlemleri',
              description: 'SGK girişi, işe giriş belgeleri, özlük dosyası, banka hesabı ve OKS.',
            },
            {
              code: 'IKY-01-4',
              name: 'Deneme süresi takibi',
              description: 'Deneme süresinin izlenmesi, sonucun istenmesi, sağlık ve hayat sigortasının yapılması.',
            },
          ],
        },

        {
          code: 'IKY-02',
          name: 'Oryantasyon, İş Tanımı ve Yetkinlikler (Madde 23-24)',
          owner: 'usr-15',
          description:
            'İşe yeni başlayan personelin oryantasyonu ile iş tanımlarının ve yetkinliklerin '
            + 'tanımlanması ve güncel tutulması.',
          purpose: 'Personelin görev sınırlarının yazılı olması ve göreve hazır başlaması.',
          maturity: 2,
          status: 'draft',
          inputs: ['İşe alım kararı', 'Bölüm görev dağılımı'],
          outputs: ['Oryantasyon kaydı', 'Güncel iş tanımı'],
          critical: [
            ['authorization', 'Yetki ve Onay',
              'İş tanımı, görevler ayrılığının temelidir; onay ve işlem yetkisi buradan türetilir.'],
          ],
          risks: [
            {
              code: 'R-IKY-04',
              name: 'İş tanımlarının güncel olmaması',
              description:
                'Görev değişikliklerinin iş tanımlarına yansıtılmaması; yetkinlik ve sorumluluğun '
                + 'yazılı dayanağının kalmaması.',
              cause:
                'Dokümanda Madde 23-24 yalnızca başlık olarak yer alıyor; işleyişi tarif eden '
                + 'bir içerik yazılmamış.',
              consequence:
                'Görevler ayrılığının ispat edilememesi, yetki uyuşmazlıkları ve denetim bulgusu.',
              category: 'operational',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-14',
            },
          ],
          controls: [
            {
              code: 'K-IKY-03',
              name: 'Yıllık iş tanımı gözden geçirmesi',
              description:
                'İş tanımları yılda bir kez bölüm yöneticileriyle gözden geçirilir ve '
                + 'değişiklikler personele tebliğ edilir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring'],
              frequency: 'annual',
              method: 'Bölüm bazında iş tanımı listesi çıkarılır ve yöneticiden teyit alınır.',
              evidence: 'Gözden geçirme tutanağı ve tebliğ imzaları',
              mitigates: ['R-IKY-04'],
              owner: 'usr-14',
              coso: 'control_environment',
              design: 'needs_improvement',
              effectiveness: 'not_tested',
              strength: 2,
              lastPerformedAt: '2025-11-10',
              lastTestedAt: null,
            },
          ],
          actions: [
            {
              code: 'AKS-IKY-01',
              title: 'Oryantasyon ve iş tanımı maddelerinin içeriğini yazmak',
              description:
                'Süreç dokümanının Madde 23 (Oryantasyon) ve Madde 24 (İş Tanımı ve Yetkinlikler) '
                + 'maddeleri yalnızca başlık hâlinde. Bu iki maddenin adım adım içeriği yazılacak '
                + 've bir sonraki doküman sürümüne eklenecek.',
              riskCode: 'R-IKY-04',
              controlCode: 'K-IKY-03',
              owner: 'usr-14',
              dueDate: '2026-12-31',
              priority: 'medium',
              status: 'in_progress',
              progress: 35,
              source: 'internal_control',
              createdAt: '2026-02-10',
              createdBy: 'usr-22',
              evidence: 'Taslak oryantasyon programı hazırlandı; iş tanımı şablonu bekliyor.',
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* IKY-B — ÜCRET VE ÖZLÜK YÖNETİMİ (Madde 28-29, 32)            */
    /* ============================================================ */
    {
      code: 'IKY-B',
      name: 'Ücret ve Özlük Yönetimi',
      owner: 'usr-15',
      description:
        'Ücret skalasının belirlenmesi ve onayı, aylık ücret çalışması, BES, bordro teslimi, '
        + 'özlük hakları ve izin süreci.',
      purpose: 'Hakların doğru hesaplanması, süresinde ödenmesi ve kayıt altına alınması.',
      maturity: 4,
      slaDays: 5,
      children: [
        {
          code: 'IKY-03',
          name: 'Ücret Yönetimi (Madde 28)',
          owner: 'usr-15',
          description:
            'Unvanlara göre ücret skalasının belirlenip Büro müdürü tarafından onaylanması, aylık '
            + 'ücret çalışmasının hazırlanması, ekleme ve kesintilerin yapılması, ayın son iş günü '
            + 'ödeme, BES tutarlarının yatırılması, bordro teslimi ve muhasebeleştirme.',
          purpose: 'Ücretin doğru hesaplanıp yetkili onayıyla ve süresinde ödenmesi.',
          systems: ['İK yazılımı', 'Logo Muhasebe'],
          inputs: ['Ücret skalası', 'Puantaj', 'Ekleme ve kesinti bilgileri'],
          outputs: ['Bordro', 'Banka ödeme dosyası', 'BES yatırımı', 'Ücret tahakkuku'],
          maturity: 4,
          slaDays: 3,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['authorization', 'Yetki ve Onay',
              'Belirlenen ücretler Büro müdürü tarafından onaylanmadan personele yansıtılamaz.'],
            ['privacy', 'Veri Gizliliği',
              'Ücret bilgisi kişisel veridir; bordro imza karşılığında teslim edilir.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Ücretler her ayın son iş günü personel banka hesaplarına yatırılır.'],
          ],
          examples: [
            {
              title: 'Onaysız ücret değişikliğinin bordroya yansıması',
              scenario:
                'Bölüm yöneticisinin sözlü talebiyle bir personelin ücreti güncelleniyor ve o ayın '
                + 'bordrosuna giriyor; Büro müdürü onayı sonradan alınmaya çalışılıyor.',
              risk:
                'Yetkisiz ücret değişikliği; geri alınması hukuken güç, ücret skalası bozuluyor '
                + 've emsal oluşuyor.',
              control: 'Ücret değişikliklerinin yalnızca Büro müdürünün yazılı onayıyla sisteme girilmesi.',
              controlType: 'Önleyici — yetki kontrolü',
              evidence: 'Büro müdürü onaylı ücret çalışması',
              criticalNote: 'Madde 28/2-3: onay, personele yansıtmadan ÖNCE gelir.',
            },
          ],
          risks: [
            {
              code: 'R-IKY-05',
              name: 'Onaysız ücret değişikliğinin bordroya yansıması',
              description:
                'Büro müdürü onayı alınmadan yapılan ücret değişikliğinin aylık ücret çalışmasına girmesi.',
              cause:
                'Onayın ödeme sonrasına bırakılması; sistemde onay alanının zorunlu olmaması.',
              consequence: 'Yetkisiz ödeme, ücret skalasının bozulması ve geri alma güçlüğü.',
              category: 'financial',
              inherent: [3, 4],
              residual: [1, 4],
              target: [1, 3],
              appetite: 'averse',
              owner: 'usr-14',
            },
            {
              code: 'R-IKY-06',
              name: 'Ücret ödemesinin ayın son iş gününde yapılamaması',
              description:
                'Aylık ücret çalışmasının geç tamamlanması nedeniyle ödemenin son iş gününü aşması.',
              cause: 'Puantaj, ekleme ve kesinti bilgilerinin bölümlerden geç gelmesi.',
              consequence: 'İş Kanunu’na aykırılık, faiz yükümlülüğü ve çalışan memnuniyetsizliği.',
              category: 'compliance',
              inherent: [3, 3],
              residual: [1, 3],
              appetite: 'averse',
              owner: 'usr-15',
              standards: ['4857 sayılı İş Kanunu md. 32'],
            },
            {
              code: 'R-IKY-07',
              name: 'Ücret verilerinin yetkisiz erişime açılması',
              description:
                'Bordro ve ücret dosyalarının yetkisiz kişilerce görüntülenmesi veya e-posta ile paylaşılması.',
              cause: 'Ortak klasör yetkilerinin geniş olması; bordroların e-postayla gönderilmesi.',
              consequence: 'KVKK ihlali, idari para cezası ve güven kaybı.',
              category: 'privacy',
              inherent: [3, 5],
              residual: [2, 4],
              target: [1, 4],
              appetite: 'averse',
              owner: 'usr-14',
              standards: ['KVKK md. 12', 'ISO 27001 A.5.34'],
            },
          ],
          controls: [
            {
              code: 'K-IKY-04',
              name: 'Ücret çalışmasının Büro müdürü onayı',
              description:
                'Aylık ücret çalışması ve ücret değişiklikleri, personele yansıtılmadan önce '
                + 'Büro müdürü tarafından onaylanır.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['authorization'],
              frequency: 'monthly',
              method: 'Ücret çalışması çıktısı Büro müdürüne sunulur ve imzalı nüsha dosyalanır.',
              evidence: 'Büro müdürü imzalı aylık ücret çalışması',
              mitigates: ['R-IKY-05'],
              owner: 'usr-14',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 5,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-06-30',
              testResult: 'Son altı ayın tamamında imzalı onay mevcut.',
            },
            {
              code: 'K-IKY-05',
              name: 'Ay sonu ödeme takvimi ve önceki ayla fark analizi',
              description:
                'Ödeme takvimi ayın başında ilan edilir; bordro tutarları önceki ayla '
                + 'karşılaştırılır ve eşiği aşan farklar gerekçelendirilir.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring', 'reconciliation'],
              frequency: 'monthly',
              method: 'Ay bazlı fark raporu alınır; %10’u aşan personel bazlı farklar açıklanır.',
              evidence: 'Fark analizi raporu ve gerekçe notları',
              mitigates: ['R-IKY-05', 'R-IKY-06'],
              owner: 'usr-15',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-29',
              lastTestedAt: '2026-05-31',
              testResult: 'Fark analizi düzenli; iki ayda açıklanmamış fark bulunmadı.',
            },
            {
              code: 'K-IKY-06',
              name: 'Bordronun imza karşılığı teslimi ve erişim sınırlaması',
              description:
                'Maaş bordroları personele imza karşılığında teslim edilir; ücret dosyalarına '
                + 'erişim İK Direktörü ve bordro sorumlusuyla sınırlıdır.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['authorization'],
              frequency: 'monthly',
              method: 'Teslim listesi imzalatılır; klasör yetkileri altı ayda bir gözden geçirilir.',
              evidence: 'İmzalı bordro teslim listesi ve erişim yetki listesi',
              mitigates: ['R-IKY-07'],
              owner: 'usr-15',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-30',
              lastTestedAt: '2026-04-15',
              testResult: 'Teslim listeleri tam; erişim gözden geçirmesi bir dönem atlanmış.',
            },
          ],
          docs: [
            {
              code: 'PRS-IKY-02',
              name: 'Ücret Yönetimi Prosedürü',
              type: 'procedure',
              version: '1.0',
              owner: 'usr-14',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary:
                'Ücret skalasının belirlenmesinden ücret tahakkuklarının muhasebeleştirilmesine '
                + 'kadar sekiz adımlık ücret akışı.',
              sections: [
                {
                  heading: 'Skala ve onay',
                  body: [
                    'Unvanlara göre ücret ve ücret skalası belirlenir.',
                    'Belirlenen ücretler Büro müdürü tarafından onaylanır.',
                    'Onaylanan ücretler personele yansıtılır.',
                  ],
                },
                {
                  heading: 'Aylık işlemler',
                  body: [
                    'Her ay ücret çalışması hazırlanır; gerekli eklemeler ve kesintiler yapılır.',
                    'Her ayın son iş günü personel banka hesaplarına ücretler yatırılır.',
                    'BES tutarları, personel sözleşme numaralarına istinaden çalışılan banka hesaplarına yatırılır.',
                  ],
                },
                {
                  heading: 'Teslim ve muhasebe',
                  body: [
                    'Maaş bordroları personele imza karşılığında teslim edilir.',
                    'Ücret tahakkukları muhasebeleştirilir.',
                  ],
                },
              ],
              controlCodes: ['K-IKY-04', 'K-IKY-05', 'K-IKY-06'],
            },
          ],
          kris: [
            {
              code: 'KRI-IKY-01',
              name: 'Ay sonunu aşan ücret ödemesi sayısı',
              definition:
                'İlgili ayda son iş gününden sonra hesaba geçen personel ücreti sayısı.',
              riskCode: 'R-IKY-06',
              owner: 'usr-15',
              unit: 'adet',
              frequency: 'monthly',
              direction: 'lower_better',
              greenMax: 0,
              amberMax: 2,
              readings: [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
            },
          ],
          children: [
            {
              code: 'IKY-03-1',
              name: 'Ücret skalasının belirlenmesi ve onayı',
              description: 'Unvan bazlı skalanın hazırlanması ve Büro müdürü onayının alınması.',
            },
            {
              code: 'IKY-03-2',
              name: 'Aylık ücret çalışması',
              description: 'Ekleme ve kesintilerin işlenmesi, bordronun hazırlanması.',
            },
            {
              code: 'IKY-03-3',
              name: 'Ödeme ve BES',
              description: 'Ayın son iş günü ücret ödemesi ve BES tutarlarının yatırılması.',
            },
            {
              code: 'IKY-03-4',
              name: 'Teslim ve muhasebeleştirme',
              description: 'Bordroların imza karşılığı teslimi ve ücret tahakkuklarının muhasebeleştirilmesi.',
            },
          ],
        },

        {
          code: 'IKY-04',
          name: 'Özlük Hakları ve İzin Süreci (Madde 29, 32)',
          owner: 'usr-15',
          description:
            'Personele özlük hakları konusunda bilgilendirme yapılması, ilgili evrakların '
            + 'arşivlenmesi; izin hakları hakkında bilgilendirme ile hak edilen ve kullanılan '
            + 'izinlerin arşivlenmesi.',
          purpose: 'Hak ve izin bakiyelerinin doğru, güncel ve ispatlanabilir tutulması.',
          systems: ['İK yazılımı'],
          inputs: ['İzin talepleri', 'Özlük hakkı bildirimleri'],
          outputs: ['İzin kayıtları', 'Arşivlenmiş özlük evrakı'],
          maturity: 3,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Kullanılan yıllık izinler yazılı belgeye bağlanır; ispat yükü işverendedir.'],
          ],
          risks: [
            {
              code: 'R-IKY-08',
              name: 'İzin kayıtlarının eksik tutulması',
              description:
                'Kullanılan iznin sisteme işlenmemesi veya izin formunun arşivlenmemesi.',
              cause:
                'Kısa süreli izinlerin sözlü verilmesi; "home ofis" günlerinin izinle karıştırılması.',
              consequence:
                'Yanlış izin bakiyesi, çıkışta hatalı izin ücreti ödemesi ve ispat güçlüğü.',
              category: 'hr',
              inherent: [4, 3],
              residual: [2, 3],
              target: [1, 2],
              appetite: 'cautious',
              owner: 'usr-15',
            },
          ],
          controls: [
            {
              code: 'K-IKY-07',
              name: 'İzin formu ve yıllık bakiye mutabakatı',
              description:
                'Her izin yazılı forma bağlanır ve sisteme işlenir; yıl sonunda personel bazında '
                + 'izin bakiyesi mutabakatı yapılır.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['reconciliation'],
              frequency: 'annual',
              method: 'Yıl sonunda bakiye listesi personele tebliğ edilir ve itirazlar kapatılır.',
              evidence: 'İmzalı izin formları ve yıl sonu bakiye mutabakatı',
              mitigates: ['R-IKY-08'],
              owner: 'usr-15',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2025-12-31',
              lastTestedAt: '2026-01-20',
              testResult: 'Bakiye mutabakatı yapılmış; üç personelde düzeltme kaydı açılmış.',
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* IKY-C — PERFORMANS VE EĞİTİM (Madde 25, 30, 31)              */
    /* ============================================================ */
    {
      code: 'IKY-C',
      name: 'Performans ve Eğitim Yönetimi',
      owner: 'usr-14',
      description:
        'Hedef ve yetkinliklerin paylaşılması, puanlamaların toplanması, performans '
        + 'ikramiyelerinin ödenmesi; eğitim ihtiyaçlarının tespiti ve zorunlu eğitimlerin takibi.',
      purpose: 'Performansın ölçülebilir olması ve yetkinlik açıklarının eğitimle kapatılması.',
      maturity: 3,
      children: [
        {
          code: 'IKY-05',
          name: 'Performans Sistemi Yönetimi (Madde 25)',
          owner: 'usr-14',
          description:
            'Belirlenen hedef ve yetkinliklerin bölüm yetkilileriyle paylaşılması, gelen '
            + 'puanlamaların Büro müdürüyle paylaşılması, değerlendirmelerin arşivlenmesi ve '
            + 'Büro müdürünün onayıyla performans ikramiyelerinin ödenmesi.',
          purpose: 'Performans değerlendirmesinin yazılı, onaylı ve arşivlenmiş olması.',
          systems: ['İK yazılımı'],
          inputs: ['Hedef ve yetkinlik seti', 'Bölüm yetkilisi puanlamaları'],
          outputs: ['Performans değerlendirme dosyası', 'İkramiye ödemesi'],
          maturity: 3,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['authorization', 'Yetki ve Onay',
              'Performans ikramiyeleri yalnızca Büro müdürünün onayıyla banka hesaplarına yatırılır.'],
          ],
          risks: [
            {
              code: 'R-IKY-09',
              name: 'Performans ikramiyesinin onaysız ödenmesi',
              description:
                'Büro müdürü onayı tamamlanmadan ikramiye ödemesinin banka hesaplarına yansıtılması.',
              cause: 'Ödeme takviminin onay takviminden bağımsız işlemesi.',
              consequence: 'Yetkisiz ödeme ve geri alma güçlüğü.',
              category: 'financial',
              inherent: [3, 4],
              residual: [1, 4],
              appetite: 'averse',
              owner: 'usr-14',
            },
          ],
          controls: [
            {
              code: 'K-IKY-08',
              name: 'İkramiye ödemesinde Büro müdürü onay şartı',
              description:
                'İkramiye ödeme listesi, Büro müdürünün imzası olmadan Muhasebe’ye iletilmez.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['authorization'],
              frequency: 'annual',
              method: 'Onaylı liste Muhasebe’ye teslim edilir; onaysız liste kabul edilmez.',
              evidence: 'Büro müdürü imzalı ikramiye listesi',
              mitigates: ['R-IKY-09'],
              owner: 'usr-14',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 5,
              lastPerformedAt: '2026-02-28',
              lastTestedAt: '2026-03-15',
              testResult: 'Ödeme listesi imzalı; onaysız ödeme tespit edilmedi.',
            },
          ],
        },

        {
          code: 'IKY-06',
          name: 'Eğitim İhtiyaçları ve Zorunlu Eğitim Takibi (Madde 30)',
          owner: 'usr-15',
          description:
            'Belirlenen eğitim ihtiyaçlarına göre gerekli kuruluşlara kayıtların yapılması, '
            + 'eğitim sonuçlarının takip edilmesi ve eğitim belgelerinin arşivlenmesi.',
          purpose: 'Zorunlu eğitimlerin tamamlanması ve belgelerinin ispatlanabilir olması.',
          systems: ['İK yazılımı'],
          inputs: ['Eğitim ihtiyaç listesi', 'Zorunlu eğitim mevzuatı'],
          outputs: ['Eğitim kaydı', 'Katılım ve başarı belgesi'],
          maturity: 3,
          slaDays: 20,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'İş sağlığı ve güvenliği ile KVKK farkındalık eğitimleri mevzuat gereği zorunludur.'],
          ],
          risks: [
            {
              code: 'R-IKY-10',
              name: 'Zorunlu eğitimlerin tamamlanmaması',
              description:
                'Mevzuatın zorunlu kıldığı eğitimlerin süresinde alınmaması veya belgesinin arşivlenmemesi.',
              cause:
                'Eğitim sonuçlarının takip edilmemesi; katılım belgesinin kuruluştan istenmemesi.',
              consequence: 'Denetim bulgusu, idari para cezası ve farkındalık açığı.',
              category: 'compliance',
              inherent: [4, 3],
              residual: [2, 3],
              target: [1, 3],
              appetite: 'cautious',
              owner: 'usr-15',
            },
          ],
          controls: [
            {
              code: 'K-IKY-09',
              name: 'Eğitim tamamlama izleme ve yönetici eskalasyonu',
              description:
                'Zorunlu eğitim tamamlama oranı çeyrek dönemde izlenir; tamamlamayan personelin '
                + 'yöneticisine yazı gönderilir ve belge arşivi kontrol edilir.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring'],
              frequency: 'quarterly',
              method: 'Eğitim kayıt listesi ile personel listesi karşılaştırılır; eksikler bildirilir.',
              evidence: 'Çeyreklik eğitim tamamlama raporu ve eskalasyon yazıları',
              mitigates: ['R-IKY-10'],
              owner: 'usr-15',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-06-30',
              lastTestedAt: '2026-07-10',
              testResult: 'Tamamlama oranı %86; iki bölümde eskalasyon yazısı gönderilmemiş.',
            },
          ],
          kris: [
            {
              code: 'KRI-IKY-02',
              name: 'Zorunlu eğitim tamamlama oranı',
              definition:
                'Dönem içinde zorunlu eğitimini tamamlayan personelin toplam personele oranı.',
              riskCode: 'R-IKY-10',
              owner: 'usr-15',
              unit: '%',
              frequency: 'quarterly',
              direction: 'higher_better',
              greenMax: 100,
              amberMax: 90,
              readings: [78, 82, 86, 86],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* IKY-D — BEYANNAME VE KAYIT YÖNETİMİ (Madde 26-27, 33-37)     */
    /* ============================================================ */
    {
      code: 'IKY-D',
      name: 'Beyanname ve Kayıt Yönetimi',
      owner: 'usr-15',
      description:
        'Resmî kurumlara beyanname ve bildirimlerin yapılması, ödemelerinin takibi ve '
        + 'muhasebeleştirilmesi; İK dokümantasyonunun ve kayıtlarının yönetimi.',
      purpose: 'Yasal bildirim yükümlülüklerinin süresinde yerine getirilmesi ve kaydın güncel tutulması.',
      maturity: 4,
      slaDays: 26,
      children: [
        {
          code: 'IKY-07',
          name: 'Resmî Beyanname ve Bildirimler (Madde 35-37)',
          owner: 'usr-15',
          description:
            'Her ay muhtasar beyannamesi ve SGK beyannamesinin hazırlanıp gönderilmesi, '
            + 'onaylanması ve ödenmesi; İŞKUR iş gücü çizelgesinin hazırlanıp gönderilmesi; '
            + 'ödemelerin takibi ve ödenen tahakkukların muhasebeleştirilmesi.',
          purpose: 'Aylık yasal bildirimlerin süresinde ve doğru tutarla tamamlanması.',
          systems: ['GİB e-Beyanname', 'SGK e-Bildirge', 'İŞKUR', 'Logo Muhasebe'],
          inputs: ['Bordro verileri', 'Ücret tahakkukları'],
          outputs: ['Muhtasar beyanname', 'SGK bildirgesi', 'İŞKUR çizelgesi', 'Ödeme kaydı'],
          maturity: 4,
          slaDays: 26,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Muhtasar ve SGK beyannameleri aylık yasal sürelere tabidir; gecikme cezalıdır.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Beyannamenin verilmesi ile ödemesinin yapılması ayrı iki yükümlülüktür; ikisi de takip edilir.'],
          ],
          examples: [
            {
              title: 'Beyanname verilip ödemesinin unutulması',
              scenario:
                'Muhtasar beyanname süresinde gönderiliyor ve onaylanıyor; ancak ödeme adımı takip '
                + 'listesinde ayrı izlenmediği için son ödeme günü geçiriliyor.',
              risk: 'Gecikme zammı ve vergi dairesi nezdinde uyumsuzluk kaydı.',
              control: 'Beyanname takip listesinde "gönderildi", "onaylandı" ve "ödendi" adımlarının ayrı izlenmesi.',
              controlType: 'Tespit edici — takip listesi',
              evidence: 'Aylık beyanname ve ödeme takip listesi',
              criticalNote: 'Madde 35-36: gönderme, onaylama ve ödeme dokümanda ayrı ayrı sayılmıştır.',
            },
          ],
          risks: [
            {
              code: 'R-IKY-11',
              name: 'Beyannamenin süresinde verilmemesi veya ödenmemesi',
              description:
                'Muhtasar, SGK veya İŞKUR bildiriminin yasal süresinde gönderilmemesi ya da '
                + 'gönderilip ödemesinin yapılmaması.',
              cause:
                'Gönderme ve ödeme adımlarının tek kalem olarak izlenmesi; tek kişiye bağımlılık.',
              consequence: 'Gecikme zammı, idari para cezası ve uyumsuzluk kaydı.',
              category: 'compliance',
              inherent: [3, 4],
              residual: [1, 4],
              target: [1, 3],
              appetite: 'averse',
              owner: 'usr-15',
              standards: ['213 sayılı VUK', '5510 sayılı Kanun'],
            },
            {
              code: 'R-IKY-12',
              name: 'Beyanname hazırlığında tek kişiye bağımlılık',
              description:
                'Muhtasar, SGK ve İŞKUR bildirimlerinin tamamının tek personel tarafından '
                + 'hazırlanması ve yedeğinin olmaması.',
              cause: 'Görev yedeklemesinin ve yazılı iş talimatının bulunmaması.',
              consequence: 'İzin veya ayrılık hâlinde yasal sürenin kaçırılması.',
              category: 'operational',
              inherent: [3, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'cautious',
              trend: 'stable',
              owner: 'usr-14',
            },
          ],
          controls: [
            {
              code: 'K-IKY-10',
              name: 'Beyanname takip listesi — gönderim, onay ve ödeme ayrı izlenir',
              description:
                'Her beyanname için hazırlama, gönderme, onaylama ve ödeme adımları ayrı satırlarda '
                + 've son tarihleriyle izlenir; ay kapanışında tamamı işaretlenmeden dönem kapanmaz.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring', 'management'],
              frequency: 'monthly',
              method: 'Aylık takip listesi doldurulur ve İK Direktörü tarafından kontrol edilir.',
              evidence: 'Aylık beyanname ve ödeme takip listesi, tahakkuk fişleri',
              mitigates: ['R-IKY-11'],
              owner: 'usr-15',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 5,
              lastPerformedAt: '2026-08-26',
              lastTestedAt: '2026-07-05',
              testResult: 'Son 12 dönemde gecikme yok; liste eksiksiz doldurulmuş.',
            },
          ],
          actions: [
            {
              code: 'AKS-IKY-02',
              title: 'Beyanname hazırlığı için yedek personel yetkilendirmek',
              description:
                'Muhtasar, SGK ve İŞKUR bildirimlerinin hazırlanması tek personelde. Bir yedek '
                + 'personel belirlenip GİB ve SGK yetkileri tanımlanacak, iş talimatı yazılacak.',
              riskCode: 'R-IKY-12',
              controlCode: 'K-IKY-10',
              owner: 'usr-14',
              dueDate: '2026-11-28',
              priority: 'high',
              status: 'open',
              progress: 10,
              source: 'internal_control',
              createdAt: '2026-05-18',
              createdBy: 'usr-22',
            },
          ],
          docs: [
            {
              code: 'PRS-IKY-03',
              name: 'Resmî Beyanname ve Bildirim Takvimi',
              type: 'procedure',
              version: '1.0',
              owner: 'usr-15',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary:
                'Aylık muhtasar, SGK ve İŞKUR bildirimlerinin hazırlanma, gönderim, onay ve '
                + 'ödeme adımları ile son tarihleri.',
              sections: [
                {
                  heading: 'Aylık bildirimler',
                  body: [
                    'Her ay muhtasar beyannamesi hazırlanır, GİB’e gönderilir, onaylanır ve ödemesi yapılır.',
                    'Her ay SGK beyannamesi hazırlanır, gönderilir, onaylanır ve ödemesi yapılır.',
                    'Her ay İŞKUR iş gücü çizelgesi hazırlanır ve İŞKUR’a gönderilir.',
                  ],
                },
                {
                  heading: 'Takip ve muhasebeleştirme',
                  body: [
                    'Beyannamelerin ödemelerinin takibi yapılır.',
                    'Ödemesi yapılan tahakkuklar muhasebeleştirilir.',
                  ],
                },
              ],
              controlCodes: ['K-IKY-10'],
            },
          ],
          children: [
            {
              code: 'IKY-07-1',
              name: 'Muhtasar beyanname',
              description: 'Hazırlama, GİB’e gönderim, onaylama ve ödeme.',
            },
            {
              code: 'IKY-07-2',
              name: 'SGK beyannamesi',
              description: 'Hazırlama, gönderim, onaylama ve ödeme.',
            },
            {
              code: 'IKY-07-3',
              name: 'İŞKUR iş gücü çizelgesi',
              description: 'Aylık çizelgenin hazırlanıp İŞKUR’a gönderilmesi.',
            },
            {
              code: 'IKY-07-4',
              name: 'Ödeme takibi ve muhasebeleştirme',
              description: 'Beyanname ödemelerinin takibi ve ödenen tahakkukların muhasebeleştirilmesi.',
            },
          ],
        },

        {
          code: 'IKY-08',
          name: 'Dokümantasyon ve Kayıt Yönetimi (Madde 26-27, 33-34)',
          owner: 'usr-14',
          description:
            'İK kapsamındaki dokümantasyonun versiyon yönetimi, güncellenmesi ve duyurulması; '
            + 'CV ve kayıt yönetimi; mevzuat ve talimat takibi; çalışanlara bilgi ve duyuru '
            + 'yapılması. İşe giriş-çıkış, "home ofis" çalışmaları ve izinlerin koordineli takibi.',
          purpose: 'İK bilgisinin tek noktada, güncel ve erişilebilir tutulması.',
          systems: ['İK yazılımı', 'Office 365'],
          inputs: ['Mevzuat değişiklikleri', 'CV başvuruları', 'Doküman revizyon talepleri'],
          outputs: ['Yayımlanmış doküman sürümü', 'Duyuru', 'Arşiv kaydı'],
          maturity: 2,
          status: 'draft',
          lastReviewedAt: '2024-12-12',
          critical: [
            ['privacy', 'Veri Gizliliği',
              'Alınan CV’ler kişisel veridir; saklama süresi ve imha planı gerektirir.'],
          ],
          risks: [
            {
              code: 'R-IKY-13',
              name: 'İK dokümanlarının versiyon yönetiminin yapılmaması',
              description:
                'Güncellenen İK dokümanının eski sürümünün dolaşımda kalması ve duyurulmaması.',
              cause:
                'Dokümanda Madde 26 yalnızca başlık; versiyon numaralandırma ve duyuru adımı '
                + 'yazılı bir işleyişe bağlanmamış.',
              consequence: 'Farklı sürümlerin aynı anda uygulanması ve uygulama birliğinin bozulması.',
              category: 'operational',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-14',
            },
            {
              code: 'R-IKY-14',
              name: 'CV ve aday verilerinin süresiz saklanması',
              description:
                'İşe alım sürecinde toplanan CV ve aday belgelerinin saklama süresi dolduğu hâlde imha edilmemesi.',
              cause: 'Saklama ve imha politikasının CV kayıtlarını kapsamaması.',
              consequence: 'KVKK’nın saklama süresi ilkesine aykırılık ve veri ihlali riski.',
              category: 'privacy',
              inherent: [3, 4],
              residual: [3, 3],
              target: [1, 3],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'up',
              owner: 'usr-14',
              standards: ['KVKK md. 7', 'KVKK md. 12'],
            },
          ],
          controls: [
            {
              code: 'K-IKY-11',
              name: 'Doküman sürüm numarası ve duyuru kaydı',
              description:
                'Her İK dokümanı sürüm numarası, yayın tarihi ve duyuru kaydı ile yayımlanır; '
                + 'eski sürüm arşive alınır.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['management'],
              frequency: 'event_based',
              method: 'Yayın öncesi sürüm alanı ve duyuru listesi doldurulur.',
              evidence: 'Doküman künyesi ve duyuru e-postası',
              mitigates: ['R-IKY-13'],
              owner: 'usr-14',
              coso: 'information_communication',
              design: 'needs_improvement',
              effectiveness: 'not_tested',
              strength: 2,
              lastPerformedAt: '2026-04-18',
              lastTestedAt: null,
            },
          ],
          actions: [
            {
              code: 'AKS-IKY-03',
              title: 'CV ve aday verileri için saklama ve imha planı yapmak',
              description:
                'İşe alım sürecinde toplanan CV ve aday belgeleri için saklama süresi belirlenecek, '
                + 'süresi dolanların periyodik imhası için takvim kurulacak ve KVKK aydınlatma '
                + 'metni güncellenecek.',
              riskCode: 'R-IKY-14',
              owner: 'usr-14',
              dueDate: '2026-12-19',
              priority: 'high',
              status: 'open',
              progress: 0,
              source: 'internal_control',
              createdAt: '2026-06-02',
              createdBy: 'usr-23',
            },
          ],
        },
      ],
    },
  ],
};
