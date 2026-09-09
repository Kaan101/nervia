import type { NodeSpec } from '../spec';

/**
 * BİLGİ SİSTEMLERİ — 2.0
 *
 * Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024),
 * Bölüm 8 – Bilgi Sistemleri, Madde 38-41.
 *
 * Bu bölüm, Sigortacılık ve Özel Emeklilik Sektörlerinde İç Sistemlere Dair
 * Yönetmelik'in 54. maddesi gereğince Kuruma iletilecek "bilgi sistemleri
 * raporu"nun içeriğidir: sistemlerin yapısı, hizmet alımları, iş sürekliliği
 * tedbirleri ve yapılan testler.
 *
 * Dokümandaki envanter (donanım adetleri, uygulamalar, hizmet alımları,
 * günlük bakım listesi) burada olduğu gibi taşınmıştır — sayılar ve marka
 * adları uydurulmamış, dokümandan alınmıştır. Riskler bu envanterin kendi
 * yapısından doğar: tekil cihaz, tek bulut sağlayıcı, yılda bir test gibi.
 *
 * Kod `BIT` olarak korunmuştur; audit trail'de bu düğüme yapılmış geçmiş
 * gözden geçirme kaydı (aud-010) bu kimliğe bağlıdır.
 */
export const bilgiSistemleri: NodeSpec = {
  code: 'BIT',
  name: 'Bilgi Sistemleri',
  unit: 'U-BIT',
  owner: 'usr-11',
  participants: ['usr-11', 'usr-13', 'usr-25'],
  processClass: 'support',
  standards: [
    'COSO', 'ISO 27001', 'ISO 22301', 'COBIT',
    'İç Sistemler Yönetmeliği md. 54',
  ],
  description:
    'Bilgi sistemlerinin yapısı, kapsamında yapılan hizmet alımları, iş sürekliliğinin '
    + 'sağlanması için alınan tedbirler ve yapılan testlere ilişkin süreçler.',
  purpose:
    'Büro’nun iş süreçlerini taşıyan altyapının sürekli, güvenli ve raporlanabilir biçimde '
    + 'çalışmasını sağlamak ve Kuruma iletilecek bilgi sistemleri raporunun dayanağını üretmek.',
  customer: 'Tüm bölümler ve Sigortacılık ve Özel Emeklilik Düzenleme ve Denetleme Kurumu',
  systems: [
    'Oracle Veritabanı (KoçSistem Bulut)', 'Oracle BI Raporlama (KoçSistem Bulut)',
    'Logo Muhasebe (KoçSistem Bulut)', 'Web Servis (SBM)', 'Web Servis (Azerbaycan)',
    'Office 365', 'Sophos Firewall', 'Sophos Endpoint',
  ],
  inputs: ['Kullanıcı talepleri', 'Lisans yenileme takvimi', 'Sızma testi bulguları'],
  outputs: ['Çalışır altyapı', 'Yedekleme kayıtları', 'Bilgi sistemleri raporu'],
  maturity: 3,
  version: '2.0',
  lastReviewedAt: '2024-12-12',
  reviewFrequencyMonths: 12,
  updatedAt: '2026-09-08',

  critical: [
    ['regulatory', 'Mevzuat Gerekliliği',
      'Bilgi sistemlerinin yapısı, hizmet alımları, iş sürekliliği tedbirleri ve test sonuçları '
      + 'yıllık olarak Kuruma raporlanır.'],
    ['continuity', 'İş Sürekliliği',
      'Oracle, Oracle BI ve Logo Muhasebe tek bir bulut sağlayıcı (KoçSistem) üzerinde çalışır.'],
  ],

  children: [
    /* ============================================================ */
    /* BIT-A — ALTYAPI VE ENVANTER (Madde 38)                       */
    /* ============================================================ */
    {
      code: 'BIT-A',
      name: 'Bilgi Sistemleri Altyapısı (Madde 38)',
      owner: 'usr-25',
      description:
        'Ağ ve internet altyapısı, donanım envanteri ile uygulama ve veritabanı katmanının '
        + 'kurulması, izlenmesi ve güncel tutulması.',
      purpose: 'Altyapının envanterinin bilinir, izlenir ve raporlanabilir olması.',
      maturity: 3,
      children: [
        {
          code: 'BIT-01',
          name: 'Ağ ve Donanım Envanteri',
          owner: 'usr-25',
          description:
            'Fiber internet ve yedek uydu hattı, güvenlik duvarı ve erişim noktaları, fiziksel '
            + 'sunucu, son kullanıcı cihazları ve çevre birimlerinin envanteri ile bakımı.',
          purpose: 'Hangi cihazın nerede ve hangi amaçla bulunduğunun kayıtlı olması.',
          systems: ['Sophos Firewall', 'Sophos AP', 'Active Directory'],
          inputs: ['Donanım talepleri', 'Garanti ve bakım takvimi'],
          outputs: ['Güncel donanım envanteri', 'Bakım kayıtları'],
          maturity: 3,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['continuity', 'İş Sürekliliği',
              'Fiziksel IBM sunucu, 48 port switch ve firewall cihazı tekil birimdir; arızası hizmeti durdurur.'],
          ],
          examples: [
            {
              title: 'Tekil switch arızası',
              scenario:
                'Envanterdeki tek HP 48 port switch arızalanıyor; yedeği olmadığı için ofis içi '
                + 'ağ tamamen kesiliyor ve bulut sistemlerine erişim duruyor.',
              risk:
                'Yedekli internet hattı devrede olsa bile iç ağ kesildiği için hasar dosyası '
                + 'işlemleri, ödeme listesi hazırlığı ve muhasebe kaydı duruyor.',
              control: 'Kritik ağ cihazları için yedek cihaz bulundurulması veya hızlı tedarik anlaşması.',
              controlType: 'Önleyici — yedeklilik',
              evidence: 'Yedek cihaz envanteri veya tedarikçi SLA’sı',
              criticalNote: 'Madde 40’ta yedeklilik internet hattı, notebook ve yazıcı için sayılmış; ağ anahtarı için sayılmamıştır.',
            },
          ],
          risks: [
            {
              code: 'R-BIT-01',
              name: 'Tekil ağ ve sunucu donanımının yedeğinin bulunmaması',
              description:
                'Switch, firewall ve fiziksel sunucunun birer adet olması; arıza hâlinde yerine '
                + 'konacak cihazın hazırda bulunmaması.',
              cause:
                'İş sürekliliği tedbirlerinde yedeklilik internet hattı, notebook ve yazıcı için '
                + 'tanımlı; ağ anahtarı ve sunucu için tanımlı değil.',
              consequence:
                'Ofis içi ağın tamamen kesilmesi ve tüm bölümlerin işlem yapamaması.',
              category: 'it',
              inherent: [3, 5],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-25',
              standards: ['ISO 22301'],
            },
            {
              code: 'R-BIT-02',
              name: 'Donanım envanterinin güncel tutulmaması',
              description:
                'Zimmet değişiklikleri ve hurdaya ayrılan cihazların envantere işlenmemesi.',
              cause: 'Envanterin elle tutulması ve zimmet değişikliğinde güncellenmemesi.',
              consequence:
                'Kuruma raporlanan envanterin gerçeği yansıtmaması ve kayıp cihazın fark edilmemesi.',
              category: 'it',
              inherent: [3, 3],
              residual: [2, 3],
              appetite: 'cautious',
              owner: 'usr-25',
            },
          ],
          controls: [
            {
              code: 'K-BIT-01',
              name: 'Yıllık donanım envanteri sayımı ve zimmet mutabakatı',
              description:
                'Donanım envanteri yılda bir fiziken sayılır; notebook ve çevre birimi zimmetleri '
                + 'personel bazında mutabık kalınır.',
              nature: 'detective',
              execution: 'manual',
              categories: ['reconciliation', 'monitoring'],
              frequency: 'annual',
              method: 'Sayım listesi ile kayıtlı envanter karşılaştırılır; farklar tutanağa bağlanır.',
              evidence: 'Sayım tutanağı ve zimmet mutabakat formları',
              mitigates: ['R-BIT-02'],
              owner: 'usr-25',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2025-12-05',
              lastTestedAt: '2026-01-15',
              testResult: 'Sayım yapılmış; iki notebook zimmet kaydı düzeltilmiş.',
            },
          ],
          docs: [
            {
              code: 'DOK-BIT-01',
              name: 'Bilgi Sistemleri Envanteri',
              type: 'form',
              version: '10.0',
              owner: 'usr-25',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary:
                'Süreç dokümanı Madde 38’de sayılan altyapı, donanım ve uygulama envanteri.',
              sections: [
                {
                  heading: 'Altyapı',
                  body: ['Fiber internet.', 'Yedek uydu internet (AIFER).'],
                },
                {
                  heading: 'Donanım',
                  body: [
                    'HP 48 port switch — 1 adet.',
                    'TP-Link ADSL router — 1 adet.',
                    'AIFER uydu — 1 adet.',
                    'Sophos firewall cihazı — 1 adet.',
                    'Sophos AP — 2 adet.',
                    'Fiziksel IBM sunucu — 1 adet.',
                    'Ağ yazıcısı — 2 adet, harici (USB) yazıcı — 6 adet, HP tarayıcı (USB) — 1 adet.',
                    'PC kasa — 4 adet, HP all-in-one PC — 1 adet, IBM all-in-one PC — 1 adet.',
                    'Notebook — 32 adet.',
                    'LG televizyon — 2 adet, Logitech toplantı seti — 1 adet.',
                    'DVR kamera kayıt cihazı — 1 adet, kamera — 2 adet.',
                  ],
                },
                {
                  heading: 'Uygulamalar',
                  body: [
                    'Oracle veritabanı (KoçSistem bulut).',
                    'Oracle BI raporlama (KoçSistem bulut).',
                    'Logo muhasebe programı (KoçSistem bulut).',
                    'Web servis (SBM).',
                    'Web servis (Azerbaycan).',
                  ],
                },
              ],
              controlCodes: ['K-BIT-01'],
            },
          ],
          children: [
            {
              code: 'BIT-01-1',
              name: 'Ağ ve internet altyapısı',
              description: 'Fiber hat, yedek uydu hattı, switch, router ve erişim noktalarının işletimi.',
            },
            {
              code: 'BIT-01-2',
              name: 'Sunucu ve son kullanıcı cihazları',
              description: 'Fiziksel sunucu, PC ve notebook envanteri ile bakım ve zimmet takibi.',
            },
          ],
        },

        {
          code: 'BIT-02',
          name: 'Uygulamalar ve Veritabanı',
          owner: 'usr-13',
          description:
            'Oracle veritabanı, Oracle BI raporlama ve Logo muhasebe programının bulut üzerinde '
            + 'işletilmesi; SBM ve Azerbaycan web servislerinin çalışır tutulması.',
          purpose: 'Hasar, muhasebe ve raporlama uygulamalarının kesintisiz çalışması.',
          systems: ['Oracle', 'Oracle BI', 'Logo Muhasebe', 'Web Servis (SBM)', 'Web Servis (Azerbaycan)'],
          inputs: ['Kullanıcı talepleri', 'Veri düzeltme talepleri'],
          outputs: ['Çalışır uygulama', 'Raporlar', 'Servis kayıtları'],
          maturity: 3,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['continuity', 'İş Sürekliliği',
              'SBM ve Azerbaycan web servisleri dış kurumlara aittir; kesintisi hasar dosya açılışını etkiler.'],
            ['authorization', 'Yetki ve Onay',
              'Tahakkuk düzeltmeleri Bölüm Yöneticisine bilgi verilerek Bilgi İşlem Sorumlusu tarafından yapılır.'],
          ],
          risks: [
            {
              code: 'R-BIT-03',
              name: 'Dış web servisinin kesilmesi hâlinde işlemin durması',
              description:
                'SBM veya Azerbaycan web servisinin erişilemez olması durumunda sorgu gerektiren '
                + 'işlemlerin bekletilmesi.',
              cause:
                'Servis kesintisinde devreye girecek elle işlem yönteminin yazılı olmaması.',
              consequence: 'Dosya açılışının ve talep girişinin gecikmesi.',
              category: 'it',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-13',
            },
            {
              code: 'R-BIT-04',
              name: 'Üretim verisinde izsiz düzeltme yapılması',
              description:
                'Tahakkuk ve dosya düzeltmelerinin doğrudan veritabanı üzerinden, iz bırakmadan yapılması.',
              cause:
                'Düzeltme yetkisinin Bilgi İşlem Sorumlusunda olması ve işlem kaydının '
                + 'uygulama günlüğüne düşmemesi.',
              consequence:
                'Yapılan düzeltmenin kim tarafından, hangi gerekçeyle yapıldığının ispat edilememesi.',
              category: 'it',
              inherent: [3, 5],
              residual: [2, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              owner: 'usr-11',
              standards: ['ISO 27001 A.8.15'],
            },
          ],
          controls: [
            {
              code: 'K-BIT-02',
              name: 'Düzeltme taleplerinin yazılı onay ve günlük kaydı',
              description:
                'Tahakkuk ve dosya düzeltmeleri, Bölüm Yöneticisinin yazılı bilgisi alınarak '
                + 'yapılır; her düzeltme talep numarası, gerekçe ve uygulayan kişiyle kayda geçer.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['authorization', 'system'],
              frequency: 'event_based',
              method: 'Düzeltme talebi formla açılır; formsuz düzeltme yapılmaz.',
              evidence: 'Düzeltme talep formu ve uygulama günlüğü kaydı',
              mitigates: ['R-BIT-04'],
              owner: 'usr-11',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-12',
              lastTestedAt: '2026-05-20',
              testResult: 'Örneklenen 15 düzeltmenin 13’ünde form mevcut; 2’sinde sözlü talimat.',
            },
          ],
          actions: [
            {
              code: 'AKS-BIT-01',
              title: 'Web servis kesintisi için elle işlem talimatı yazmak',
              description:
                'SBM ve Azerbaycan web servisleri kesildiğinde hangi sorguların hangi alternatif '
                + 'yolla yapılacağı, kaç saat sonra eskalasyon yapılacağı yazılı talimata bağlanacak.',
              riskCode: 'R-BIT-03',
              owner: 'usr-13',
              dueDate: '2026-11-14',
              priority: 'medium',
              status: 'in_progress',
              progress: 40,
              source: 'internal_control',
              createdAt: '2026-04-08',
              createdBy: 'usr-23',
              evidence: 'Taslak talimat hazırlandı; hasar bölümü görüşü bekleniyor.',
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* BIT-B — HİZMET ALIMLARI VE LİSANS (Madde 39)                 */
    /* ============================================================ */
    {
      code: 'BIT-B',
      name: 'Hizmet Alımları ve Lisans Yönetimi (Madde 39)',
      owner: 'usr-11',
      description:
        'Bilgi sistemleri kapsamında yapılan dış hizmet alımlarının ve yazılım lisanslarının '
        + 'yönetilmesi ve süresinde yenilenmesi.',
      purpose: 'Hizmet ve lisansların kesintisiz devamı ile sağlayıcı bağımlılığının bilinmesi.',
      maturity: 3,
      children: [
        {
          code: 'BIT-03',
          name: 'Dış Hizmet ve Lisans Takibi',
          owner: 'usr-25',
          description:
            'KoçSistem bulut (Oracle, Logo, web servis, yedekleme), Sophos güvenlik cihazı yıllık '
            + 'lisansı, Sophos antivirüs programı, Logo muhasebe lisans ve desteği, Office 365 mail '
            + 've DataSafe arşivleme hizmetlerinin sözleşme ve lisans takibi.',
          purpose: 'Hiçbir lisansın veya hizmetin süresi dolarak kesintiye yol açmaması.',
          systems: ['Office 365', 'Sophos', 'Logo Muhasebe'],
          inputs: ['Sözleşme ve lisans bitiş tarihleri'],
          outputs: ['Yenilenmiş lisans', 'Sözleşme dosyası'],
          maturity: 3,
          slaDays: 30,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['continuity', 'İş Sürekliliği',
              'Oracle, Oracle BI ve Logo Muhasebe aynı sağlayıcının bulutunda çalışır; sağlayıcı '
              + 'kesintisi üç uygulamayı birden durdurur.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Sophos lisansının bitmesi güvenlik duvarı ve uç nokta korumasını devre dışı bırakır.'],
          ],
          examples: [
            {
              title: 'Sophos lisansının süresinin dolması',
              scenario:
                'Sophos firewall ve antivirüs lisansı yenilenmeden süresi doluyor; cihaz çalışmaya '
                + 'devam ediyor ama imza güncellemesi almıyor.',
              risk:
                'Yeni zararlı yazılımlara karşı koruma zayıflıyor; kesinti olmadığı için durum '
                + 'fark edilmiyor.',
              control: 'Lisans bitiş tarihlerinin takvimde izlenmesi ve 60 gün önce yenileme sürecinin başlatılması.',
              controlType: 'Önleyici — takvim kontrolü',
              evidence: 'Lisans takip tablosu ve yenileme siparişi',
              criticalNote: 'Madde 40/3: Sophos firewall, Sophos virüs programı ve Office 365 lisans takibi günlük görevler arasında sayılmıştır.',
            },
          ],
          risks: [
            {
              code: 'R-BIT-05',
              name: 'Lisans veya hizmet süresinin sessizce dolması',
              description:
                'Güvenlik, muhasebe veya e-posta lisansının yenilenmeden süresinin dolması ve '
                + 'kesinti oluşana kadar fark edilmemesi.',
              cause: 'Bitiş tarihlerinin merkezi bir takvimde izlenmemesi.',
              consequence:
                'Güvenlik korumasının zayıflaması, muhasebe desteğinin kesilmesi veya e-posta erişiminin durması.',
              category: 'it',
              inherent: [3, 4],
              residual: [2, 3],
              target: [1, 3],
              appetite: 'cautious',
              owner: 'usr-25',
            },
            {
              code: 'R-BIT-06',
              name: 'Tek bulut sağlayıcısına bağımlılık',
              description:
                'Oracle veritabanı, Oracle BI ve Logo muhasebe programının tamamının aynı '
                + 'sağlayıcının bulutunda çalışması.',
              cause:
                'Uygulama ve yedekleme hizmetlerinin tek sözleşmede toplanmış olması.',
              consequence:
                'Sağlayıcı kaynaklı kesintide üç kritik uygulamanın aynı anda durması ve '
                + 'kurum içinde devreye alınabilecek alternatifin olmaması.',
              category: 'strategic',
              inherent: [3, 5],
              residual: [3, 4],
              target: [2, 4],
              appetite: 'cautious',
              treatment: 'accept',
              trend: 'stable',
              owner: 'usr-11',
              standards: ['ISO 22301'],
            },
          ],
          controls: [
            {
              code: 'K-BIT-03',
              name: 'Lisans ve sözleşme bitiş takvimi',
              description:
                'Tüm lisans ve hizmet sözleşmelerinin bitiş tarihi tek tabloda tutulur; bitişe '
                + '60 gün kala yenileme süreci başlatılır ve Bilgi Teknolojileri Müdürüne bildirilir.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['monitoring'],
              frequency: 'monthly',
              method: 'Aylık lisans takip tablosu gözden geçirilir; süresi yaklaşanlar işaretlenir.',
              evidence: 'Lisans takip tablosu ve yenileme siparişleri',
              mitigates: ['R-BIT-05'],
              owner: 'usr-25',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-01',
              lastTestedAt: '2026-06-10',
              testResult: 'Tablodaki tüm lisanslar geçerli; iki yenileme süresinde tamamlanmış.',
            },
            {
              code: 'K-BIT-04',
              name: 'Sağlayıcı hizmet seviyesi ve çıkış planı gözden geçirmesi',
              description:
                'Bulut sağlayıcısının hizmet seviyesi taahhütleri ve verinin geri alınabilirliği '
                + 'yılda bir gözden geçirilir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring'],
              frequency: 'annual',
              method: 'Sözleşme SLA maddeleri ve veri dışa aktarım imkânı gözden geçirilip rapor edilir.',
              evidence: 'Yıllık sağlayıcı değerlendirme notu',
              mitigates: ['R-BIT-06'],
              owner: 'usr-11',
              coso: 'risk_assessment',
              design: 'needs_improvement',
              effectiveness: 'not_tested',
              strength: 2,
              lastPerformedAt: '2025-11-20',
              lastTestedAt: null,
            },
          ],
          docs: [
            {
              code: 'DOK-BIT-02',
              name: 'Bilgi Sistemleri Hizmet Alımları Listesi',
              type: 'form',
              version: '10.0',
              owner: 'usr-11',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary: 'Süreç dokümanı Madde 39’da sayılan dış hizmet alımları ve lisanslar.',
              sections: [
                {
                  heading: 'Hizmet alımları',
                  body: [
                    'KoçSistem Cloud — Oracle, Logo, web servis ve yedekleme hizmetleri.',
                    'Sophos güvenlik cihazı yıllık lisansı.',
                    'Sophos antivirüs programı.',
                    'Logo muhasebe programı lisans ve desteği.',
                    'Office 365 mail.',
                    'DataSafe arşivleme (folder).',
                  ],
                },
              ],
              controlCodes: ['K-BIT-03', 'K-BIT-04'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* BIT-C — İŞ SÜREKLİLİĞİ (Madde 40)                            */
    /* ============================================================ */
    {
      code: 'BIT-C',
      name: 'İş Sürekliliği (Madde 40)',
      owner: 'usr-25',
      description:
        'Yedekli internet hattı, bulut yedekliliği, yedek cihazlar ve güç kaynağı ile günlük '
        + 'yedekleme, bakım ve lisans kontrolü görevleri.',
      purpose: 'Kesinti hâlinde hizmetin en kısa sürede sürdürülebilmesi.',
      maturity: 3,
      children: [
        {
          code: 'BIT-04',
          name: 'Yedekleme ve Günlük Sistem Görevleri',
          owner: 'usr-25',
          description:
            'Active Directory sunucu kontrolü; firewall, virüs programı, switch, DVR, santral kaydı, '
            + 'PC yönetimi ve cihazların günlük yedeklenmesi; lisans takibi; kullanıcı bakımları; '
            + 'yedek PC temini; Oracle ve Oracle BI bakımı ile veritabanı yedeklenmesi; sunucuların '
            + 'takibi ve yedeklenmesi; Office 365 portalının yönetilmesi; Logo desteği; santral sorunları.',
          purpose: 'Verinin geri dönülebilir olması ve günlük bakım görevlerinin aksamaması.',
          systems: ['Active Directory', 'Sophos', 'Oracle', 'Office 365'],
          inputs: ['Günlük görev listesi', 'Yedekleme takvimi'],
          outputs: ['Yedekleme kayıtları', 'Bakım kayıtları'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['continuity', 'İş Sürekliliği',
              'Yedekleme, KoçSistem bulutu üzerinde alınmaktadır; geri dönüş sağlayıcıya bağımlıdır.'],
          ],
          examples: [
            {
              title: 'Yedeğin alınıp geri dönüşünün hiç denenmemesi',
              scenario:
                'Veritabanı yedeği her gün alınıyor ve kayıt tutuluyor; ancak yedekten geri dönüş '
                + 'testi yapılmadığı için yedeğin gerçekten açılıp açılmadığı bilinmiyor.',
              risk:
                'Gerçek bir olayda yedeğin bozuk veya eksik olduğunun anlaşılması; veri kaybı.',
              control: 'Periyodik geri dönüş (restore) testi yapılması ve sonucunun tutanağa bağlanması.',
              controlType: 'Tespit edici — geri dönüş testi',
              evidence: 'Restore testi tutanağı',
              criticalNote: 'Madde 40 yedekleme görevini sayar; yedeğin geri dönüşünün test edilmesini ayrıca saymaz.',
            },
          ],
          risks: [
            {
              code: 'R-BIT-07',
              name: 'Yedekten geri dönülememesi',
              description:
                'Yedek düzenli alındığı hâlde geri dönüş testi yapılmadığı için, gerçek olayda '
                + 'yedeğin kullanılamaz olması.',
              cause:
                'Günlük görev listesinde yedek ALMA var, yedekten DÖNME testi yok.',
              consequence: 'Veri kaybı, hasar dosyası geçmişinin yeniden oluşturulamaması.',
              category: 'it',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-25',
              standards: ['ISO 22301', 'ISO 27001 A.8.13'],
            },
            {
              code: 'R-BIT-08',
              name: 'Günlük sistem görevlerinin tek kişide toplanması',
              description:
                'Madde 40’ta sayılan on günlük görevin tamamının Sistem Yöneticisi tarafından yürütülmesi.',
              cause: 'Görev yedeklemesinin ve yazılı işletim talimatının bulunmaması.',
              consequence: 'İzin veya ayrılık hâlinde yedekleme ve bakım görevlerinin aksaması.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-11',
            },
          ],
          controls: [
            {
              code: 'K-BIT-05',
              name: 'Günlük yedekleme kontrol listesi',
              description:
                'Madde 40’ta sayılan günlük görevler (AD kontrolü, cihaz yedekleri, lisans takibi, '
                + 'veritabanı yedeği, sunucu takibi, portal yönetimi) tek listede işaretlenir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring', 'system'],
              frequency: 'daily',
              method: 'Her iş günü sonunda liste işaretlenir; başarısız yedek aynı gün eskalasyona çıkar.',
              evidence: 'Günlük sistem kontrol listesi',
              mitigates: ['R-BIT-07', 'R-BIT-08'],
              owner: 'usr-25',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-09-05',
              lastTestedAt: '2026-06-25',
              testResult: 'Örneklenen 20 günün 20’sinde liste doldurulmuş.',
            },
            {
              code: 'K-BIT-06',
              name: 'Üç aylık yedekten geri dönüş testi',
              description:
                'Veritabanı yedeğinden ayrı bir ortama geri dönüş yapılır; açılan verinin '
                + 'bütünlüğü örnekleme ile doğrulanır ve tutanağa bağlanır.',
              nature: 'detective',
              execution: 'manual',
              categories: ['system'],
              frequency: 'quarterly',
              method: 'Sağlayıcı ile birlikte test ortamına restore yapılır ve kayıt sayıları karşılaştırılır.',
              evidence: 'Restore testi tutanağı ve karşılaştırma çıktısı',
              mitigates: ['R-BIT-07'],
              owner: 'usr-25',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-06-18',
              lastTestedAt: '2026-06-18',
              testResult: 'Geri dönüş başarılı; ancak yılda yalnızca iki kez yapılmış, hedef dört.',
            },
          ],
          actions: [
            {
              code: 'AKS-BIT-02',
              title: 'Sistem yöneticisi görevleri için yedek personel yetiştirmek',
              description:
                'Madde 40’taki günlük görevler tek kişide. Bir yedek personel belirlenip görev '
                + 'devri yapılacak, işletim talimatı yazılacak ve dönüşümlü uygulanacak.',
              riskCode: 'R-BIT-08',
              controlCode: 'K-BIT-05',
              owner: 'usr-11',
              dueDate: '2027-01-30',
              priority: 'high',
              status: 'open',
              progress: 15,
              source: 'internal_control',
              createdAt: '2026-03-20',
              createdBy: 'usr-22',
            },
          ],
          kris: [
            {
              code: 'KRI-BIT-01',
              name: 'Başarısız yedekleme günü sayısı',
              definition:
                'Ay içinde günlük yedekleme kontrol listesinde başarısız olarak işaretlenen gün sayısı.',
              riskCode: 'R-BIT-07',
              owner: 'usr-25',
              unit: 'gün',
              frequency: 'monthly',
              direction: 'lower_better',
              greenMax: 0,
              amberMax: 2,
              readings: [1, 0, 0, 2, 0, 1, 0, 0, 3, 1, 0, 0],
            },
          ],
          children: [
            {
              code: 'BIT-04-1',
              name: 'Günlük yedekleme ve cihaz kontrolleri',
              description: 'AD sunucu kontrolü, firewall/virüs/switch/DVR/santral/PC yedeklemeleri.',
            },
            {
              code: 'BIT-04-2',
              name: 'Veritabanı ve sunucu bakımı',
              description: 'Oracle ve Oracle BI bakımı, veritabanı yedeklemesi, sunucu takibi ve yedeklenmesi.',
            },
            {
              code: 'BIT-04-3',
              name: 'Lisans, portal ve destek görevleri',
              description: 'Sophos ve Office 365 lisans takibi, portal yönetimi, Logo desteği, santral sorunları.',
            },
          ],
        },

        {
          code: 'BIT-05',
          name: 'Kesinti Tedbirleri',
          owner: 'usr-25',
          description:
            'Elektrik kesintisinde jeneratörün devreye girmesi, internet kesintisinde yedek uydu '
            + 'hattının devreye girmesi, virüs saldırılarında Sophos Firewall ve Sophos Endpoint '
            + 'ile engelleme; yedekli notebook, yazıcı ve güç kaynağı bulundurulması.',
          purpose: 'Öngörülen kesinti türlerinde hizmetin durmaması.',
          systems: ['Sophos Firewall', 'Sophos Endpoint'],
          inputs: ['Kesinti bildirimi'],
          outputs: ['Devreye alınmış yedek kaynak', 'Kesinti kaydı'],
          maturity: 3,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['continuity', 'İş Sürekliliği',
              'Yedek internet uydu bağlantısıdır; bant genişliği fiber ile eşdeğer değildir.'],
          ],
          risks: [
            {
              code: 'R-BIT-09',
              name: 'Kesinti tedbirlerinin tatbik edilmemesi',
              description:
                'Jeneratör ve yedek uydu hattının gerçek kesinti öncesinde denenmemesi; devreye '
                + 'girme süresinin ölçülmemiş olması.',
              cause: 'İş sürekliliği tatbikatının planlı bir görev olarak tanımlanmamış olması.',
              consequence:
                'Gerçek kesintide yedek kaynağın devreye girmemesi veya beklenenden geç girmesi.',
              category: 'it',
              inherent: [3, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              owner: 'usr-25',
              standards: ['ISO 22301'],
            },
          ],
          controls: [
            {
              code: 'K-BIT-07',
              name: 'Yıllık kesinti tatbikatı',
              description:
                'Jeneratör ve yedek internet hattı yılda bir planlı olarak devreye alınır; '
                + 'geçiş süresi ölçülür ve tutanağa bağlanır.',
              nature: 'detective',
              execution: 'manual',
              categories: ['system', 'monitoring'],
              frequency: 'annual',
              method: 'Mesai dışında planlı kesinti yapılır; geçiş süresi ve etkilenen hizmetler kaydedilir.',
              evidence: 'Tatbikat tutanağı ve geçiş süresi ölçümü',
              mitigates: ['R-BIT-09'],
              owner: 'usr-25',
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'not_tested',
              strength: 2,
              lastPerformedAt: '2025-10-08',
              lastTestedAt: null,
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* BIT-D — GÜVENLİK TESTLERİ (Madde 41)                          */
    /* ============================================================ */
    {
      code: 'BIT-D',
      name: 'Güvenlik Testleri (Madde 41)',
      owner: 'usr-11',
      description:
        'Yıllık sızma testinin yaptırılması, bulguların kapatılması ve sonucun bilgi sistemleri '
        + 'raporuyla Kuruma iletilmesi.',
      purpose: 'Güvenlik zafiyetlerinin bağımsız olarak tespit edilmesi ve kapatılması.',
      maturity: 3,
      children: [
        {
          code: 'BIT-06',
          name: 'Yıllık Sızma Testi',
          owner: 'usr-11',
          description:
            'Yılda bir kez bağımsız kuruluşa sızma testi yaptırılması, bulguların önem derecesine '
            + 'göre sınıflandırılması, kapatılması ve test raporunun Kuruma iletilecek bilgi '
            + 'sistemleri raporuna eklenmesi.',
          purpose: 'Zafiyetlerin saldırgandan önce bulunması ve kapatılmasının belgelenmesi.',
          systems: ['Sophos Firewall', 'Oracle'],
          inputs: ['Test kapsamı', 'Önceki yıl bulguları'],
          outputs: ['Sızma testi raporu', 'Bulgu kapatma kayıtları'],
          maturity: 3,
          slaDays: 90,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Yapılan testlere ilişkin bilgi sistemleri raporu Kuruma iletilir.'],
          ],
          examples: [
            {
              title: 'Testin yapılıp bulguların kapatılmaması',
              scenario:
                'Yıllık sızma testi yaptırılıyor ve rapor alınıyor; ancak yüksek önemli bulgular '
                + 'için aksiyon açılmadığı için bir sonraki yılın testinde aynı bulgular çıkıyor.',
              risk:
                'Bilinen zafiyetin bir yıl boyunca açık kalması ve raporun uyum belgesine dönüşmesi.',
              control: 'Her bulgu için sahip, hedef tarih ve kapatma kanıtı içeren aksiyon açılması.',
              controlType: 'Düzeltici — bulgu takibi',
              evidence: 'Bulgu takip tablosu ve kapatma kanıtları',
              criticalNote: 'Madde 41 testin yapılmasını ister; bulguların kapatılmasının takibi kurum içi kontroldür.',
            },
          ],
          risks: [
            {
              code: 'R-BIT-10',
              name: 'Sızma testi bulgularının kapatılmaması',
              description:
                'Testte tespit edilen zafiyetler için aksiyon açılmaması veya açılan aksiyonun '
                + 'kanıtsız kapatılması.',
              cause: 'Bulgu takibinin ayrı bir kayıt olarak tutulmaması.',
              consequence:
                'Bilinen zafiyetin açık kalması ve testin uyum belgesine dönüşmesi.',
              category: 'cyber',
              inherent: [4, 5],
              residual: [2, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'down',
              owner: 'usr-11',
              standards: ['ISO 27001 A.8.8'],
            },
            {
              code: 'R-BIT-11',
              name: 'Test sıklığının yıllıkla sınırlı olması',
              description:
                'Sızma testinin yılda bir yapılması; yıl içindeki altyapı ve uygulama '
                + 'değişikliklerinin test edilmeden kalması.',
              cause: 'Test takviminin değişiklik yönetimine bağlanmamış olması.',
              consequence: 'İki test arasında ortaya çıkan zafiyetin uzun süre açık kalması.',
              category: 'cyber',
              inherent: [3, 4],
              residual: [3, 4],
              target: [2, 4],
              appetite: 'cautious',
              treatment: 'accept',
              trend: 'stable',
              owner: 'usr-11',
            },
          ],
          controls: [
            {
              code: 'K-BIT-08',
              name: 'Sızma testi bulgu takip tablosu',
              description:
                'Her bulgu için önem derecesi, sahip, hedef tarih ve kapatma kanıtı tutulur; '
                + 'yüksek önemli bulgular kapatılmadan test dönemi kapanmış sayılmaz.',
              nature: 'corrective',
              execution: 'manual',
              categories: ['monitoring', 'system'],
              frequency: 'quarterly',
              method: 'Bulgu tablosu çeyrek dönemde gözden geçirilir ve Üst Yönetime raporlanır.',
              evidence: 'Bulgu takip tablosu ve kapatma kanıtları',
              mitigates: ['R-BIT-10'],
              owner: 'usr-11',
              key: true,
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-06-30',
              lastTestedAt: '2026-07-12',
              testResult: 'Önceki yılın 11 bulgusundan 10’u kapatılmış, 1’i kabul edilmiş risk olarak kaydedilmiş.',
            },
          ],
          docs: [
            {
              code: 'RPR-BIT-01',
              name: 'Bilgi Sistemleri Raporu',
              type: 'regulation',
              version: '10.0',
              owner: 'usr-11',
              publishedAt: '2024-12-12',
              updatedAt: '2024-12-12',
              nextReviewAt: '2026-12-12',
              summary:
                'İç Sistemler Yönetmeliği Madde 54 gereğince Kuruma iletilen; bilgi sistemlerinin '
                + 'yapısı, hizmet alımları, iş sürekliliği tedbirleri ve yapılan testleri içeren rapor.',
              sections: [
                {
                  heading: 'Kapsam',
                  body: [
                    'Bilgi sistemlerinin yapısı (Madde 38).',
                    'Bilgi sistemleri kapsamında yapılan hizmet alımları (Madde 39).',
                    'İş sürekliliğinin sağlanması konusunda alınan tedbirler ve yürütülen çalışmalar (Madde 40).',
                    'Yapılan testlere ilişkin rapor — yıllık sızma testi (Madde 41).',
                  ],
                },
              ],
              controlCodes: ['K-BIT-08'],
            },
          ],
        },
      ],
    },
  ],
};
