import type { NodeSpec } from '../spec';

/**
 * YURT İÇİ HASAR SERVİSİ — 1.1
 *
 * Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024),
 * Bölüm 6 – Yurt İçi Hasar Süreci (Madde 17-20) ile Ek 1 Detaylı Yurt İçi
 * Hasar İş Akışı. Yapı, Ek 1'deki rol hatlarını izler; Madde 17-20'deki
 * sayısal kural ve onay şartları kritik nokta olarak işlenmiştir. Bölüm 9
 * Madde 43'teki aşama bazlı özet akış ise Hasar İş Akışı ekranındadır.
 *
 * Türkiye Motorlu Taşıt Bürosu'nun yurt içi hasar süreç akış diyagramından
 * modellenmiştir. Büro, yabancı plakalı araçların Türkiye'de yol açtığı
 * zararlarda Yeşil Kart sistemi kapsamında tazminat ödeyen ve ardından
 * ilgili ülke bürosundan rücu eden kurumdur. Bu yüzden akış klasik bir
 * sigorta şirketi hasar sürecinden ayrılır:
 *
 *   • Talep, sigortalıdan değil zarar gören üçüncü şahıstan gelir.
 *   • Poliçe yerine Yeşil Kart ve yabancı sigortacı tespiti yapılır.
 *   • Ödeme, Güvence Hesabı ya da öz kaynaktan yapılır.
 *   • Ödenen tutar yurt dışı büroya/sigortacıya rücu edilir; gelmezse
 *     Garanti Çağrısı (G Call) mekanizması işletilir.
 *
 * Süreç, diyagramdaki üç rol hattına göre bölünmüştür:
 *   1.1 Hasar Destek · 1.2 Servis Yöneticisi · 1.3 Dosya Sorumlusu
 *
 * Riskler ve kontroller diyagramın karar noktalarından ve üzerindeki
 * iyileştirme notlarından türetilmiştir; not balonları kurumun kendi
 * tespit ettiği zayıflıklardır ve burada risk olarak kayda geçmiştir.
 */
export const hasarYonetimi: NodeSpec = {
  code: 'HSR',
  name: 'Yurt İçi Hasar Yönetimi',
  unit: 'U-HSR',
  owner: 'usr-02',
  participants: ['usr-02', 'usr-03', 'usr-04', 'usr-05'],
  processClass: 'core',
  standards: [
    'COSO', 'ISO 31000', 'ISO 9001', 'Yeşil Kart Sistemi', 'KVKK',
    'TMTB Süreç Dokümanı v10.0 Madde 17-20',
  ],
  description:
    'Yabancı plakalı araçların Türkiye’de yol açtığı zararlarda üçüncü şahıs talebinin alınmasından, '
    + 'tazminatın ödenmesine ve ödenen tutarın ilgili ülke bürosundan rücu edilmesine kadar geçen süreç.',
  purpose:
    'Yeşil Kart kapsamındaki zararların mevzuata ve büro kurallarına uygun, zamanında ve '
    + 'rücu edilebilir biçimde tazmin edilmesini sağlamak.',
  customer: 'Zarar gören üçüncü şahıs / vekili',
  slaDays: 30,
  maturity: 3,
  version: '1.1',
  lastReviewedAt: '2024-12-12',
  reviewFrequencyMonths: 12,
  updatedAt: '2026-08-28',
  systems: ['Büro Hasar Sistemi', 'Tramer', 'DYS', 'Oracle', 'Outlook', 'Güvence Hesabı'],
  inputs: ['Tazminat talep formu ve ekleri', 'Kaza tespit tutanağı', 'Yeşil Kart bilgisi'],
  outputs: ['Ödenmiş tazminat', 'Rücu faturası', 'Kapatılmış hasar dosyası'],

  children: [
    /* ============================================================ */
    /* 1.1 — HASAR DESTEK                                            */
    /* ============================================================ */
    {
      code: 'HSR-A',
      name: 'Hasar Destek (1.1)',
      owner: 'usr-05',
      description:
        'Talebin karşılanması, evrak kontrolü, dosya açılışı, zarar gören girişi ve '
        + 'muallak karşılığının belirlenmesi.',
      purpose:
        'Talebin doğru sınıflandırılarak eksiksiz evrakla dosyaya dönüşmesini ve karşılığın '
        + 'baştan doğru ayrılmasını sağlamak.',
      systems: ['Büro Hasar Sistemi', 'DYS', 'Outlook'],
      inputs: ['Telefon / e-posta / posta ile gelen talep'],
      outputs: ['Açılmış hasar dosyası', 'Muallak kaydı'],
      maturity: 3,
      slaDays: 5,

      children: [
        /* ---------- 1.1.1 Evrak Yönetimi ---------- */
        {
          code: 'HSR-01',
          name: 'Evrak Yönetimi (1.1.1)',
          owner: 'usr-05',
          participants: ['usr-04'],
          description:
            'İletişim merkezinden (telefon, e-posta, posta) gelen evrakın kayda alınması, '
            + 'taranarak DYS’ye yüklenmesi ve ilgili birime havale edilmesi.',
          purpose: 'Kuruma ulaşan her evrakın izlenebilir biçimde kayda geçmesini sağlamak.',
          systems: ['DYS', 'Outlook'],
          inputs: ['Fiziki posta', 'E-posta eki', 'Elden teslim evrak'],
          outputs: ['DYS kayıt numarası', 'Havale edilmiş evrak'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Talep evrakının kuruma ulaştığı tarih, zamanaşımı ve faiz hesabının başlangıcıdır; kayıt tarihi gerçeği yansıtmalıdır.'],
            ['privacy', 'Veri Gizliliği',
              'Bedeni zarar dosyalarındaki sağlık raporları özel nitelikli kişisel veridir; DYS erişimi rol bazlı sınırlandırılır.'],
          ],
          examples: [
            {
              title: 'Postayla gelen talebin geç kayda alınması',
              scenario:
                'Cuma günü gelen fiziki tazminat talebi, yoğunluk nedeniyle Pazartesi taranıyor ve '
                + 'DYS’ye Pazartesi tarihiyle kaydediliyor.',
              risk: 'Talep tarihi üç gün geç görünüyor; faiz başlangıcı yanlış hesaplanıyor ve zamanaşımı savunması zayıflıyor.',
              control: 'Evrakın fiziki geliş tarihinin damga ile basılması ve DYS’de ayrı alan olarak tutulması.',
              controlType: 'Önleyici — kayıt disiplini',
              evidence: 'Evrak damgası ve DYS geliş tarihi alanı',
              criticalNote: 'DYS’de "geliş tarihi" ile "kayıt tarihi" ayrı alanlardır; geliş tarihi boş bırakılamaz.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-01',
              name: 'Gelen evrakın kayda alınmaması veya geç kaydedilmesi',
              description:
                'Telefon, e-posta veya postayla ulaşan tazminat talebinin DYS’ye hiç kaydedilmemesi '
                + 'ya da geliş tarihinden sonra kaydedilmesi.',
              cause:
                'Evrak yönetiminin farklı kanallara dağılmış olması ve DYS’nin kanal bazlı otomatik '
                + 'kayıt desteğinin bulunmaması.',
              consequence:
                'Talebin kaybolması, zamanaşımı ve faiz hesabının hatalı yapılması, şikâyet ve dava riski.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-05-14',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
            {
              code: 'R-HSR-20',
              name: 'DYS erişim yetkisinin veri hassasiyetine göre sınırlanmaması',
              description:
                'Bedeni zarar dosyalarındaki sağlık raporlarına, işi gereği erişmesi gerekmeyen '
                + 'kullanıcıların da erişebilmesi.',
              cause: 'DYS klasör yetkilerinin dosya türüne değil birime göre tanımlanmış olması.',
              consequence: 'KVKK ihlali, idari para cezası ve itibar kaybı.',
              category: 'privacy',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-25',
              identifiedAt: '2025-11-20',
              lastAssessedAt: '2026-03-05',
              standards: ['KVKK', 'ISO 27001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-01',
              name: 'Evrak geliş tarihi damgası ve DYS ayrı alan kontrolü',
              description:
                'Fiziki evraka geliş tarihi damgası basılır; DYS’de "geliş tarihi" kayıt tarihinden '
                + 'ayrı zorunlu alandır ve geçmişe dönük değiştirilemez.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['data_validation', 'system'],
              frequency: 'per_transaction',
              method: 'Evrak damgası ve DYS zorunlu alan denetimi.',
              evidence: 'Damgalı evrak görüntüsü ve DYS alan geçmişi',
              mitigates: ['R-HSR-01'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-12',
              testResult:
                '40 evrakın 34’ünde geliş tarihi doğru. E-posta kanalında alan çoğu zaman kayıt tarihiyle aynı giriliyor.',
            },
            {
              code: 'K-HSR-02',
              name: 'DYS klasör yetkilerinin dosya türüne göre tanımlanması',
              description:
                'Bedeni zarar klasörleri ayrı yetki grubundadır; erişim yalnızca dosya sorumlusu, '
                + 'servis yöneticisi ve hukuk için açıktır ve altı ayda bir gözden geçirilir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['authorization', 'system'],
              frequency: 'quarterly',
              method: 'DYS yetki matrisi ve dönemsel erişim gözden geçirmesi.',
              evidence: 'Yetki matrisi ve gözden geçirme tutanağı',
              mitigates: ['R-HSR-20'],
              owner: 'usr-25',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-07-01',
              lastTestedAt: '2026-07-01',
              testResult: 'Erişim listesi gözden geçirildi; ayrılan 2 personelin yetkisi kaldırıldı.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSR-01',
              name: 'Evrak Yönetimi Prosedürü',
              type: 'procedure',
              version: '3.0',
              owner: 'usr-05',
              publishedAt: '2025-04-01',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-03-05',
              summary:
                'İletişim merkezinden gelen evrakın kaydı, taranması, DYS’ye yüklenmesi ve havalesi.',
              sections: [
                {
                  heading: 'Kanallar',
                  body: [
                    'Telefon (5.1.1), e-posta (5.1.2) ve posta (5.1.3) kanallarından gelen evrak bu prosedüre tabidir.',
                    'Her kanal için sorumlu ve azami cevap süresi tanımlıdır.',
                  ],
                },
                {
                  heading: 'Kayıt',
                  body: [
                    'Fiziki evraka geliş tarihi damgası basılır.',
                    'DYS’de geliş tarihi ile kayıt tarihi ayrı alanlarda tutulur; geliş tarihi boş bırakılamaz.',
                    'Taranan evrak ilgili dosya klasörüne bağlanır.',
                  ],
                },
                {
                  heading: 'Havale',
                  body: [
                    'Yeni talepler Hasar Destek’e, mevcut dosya evrakları dosya sorumlusuna havale edilir.',
                    'Havale edilmeyen evrak günlük listede takip edilir.',
                  ],
                },
              ],
              controlCodes: ['K-HSR-01', 'K-HSR-02'],
            },
          ],
          children: [
            {
              code: 'HSR-01-1',
              name: 'Evrakın kanaldan alınması',
              description: 'Telefon, e-posta veya posta kanalından gelen evrakın teslim alınması.',
              systems: ['Outlook', 'DYS'],
              inputs: ['Fiziki veya elektronik evrak'],
              outputs: ['Teslim alınmış evrak'],
            },
            {
              code: 'HSR-01-2',
              name: 'Tarama ve DYS kaydı',
              description: 'Evrakın taranarak DYS’ye geliş tarihiyle birlikte kaydedilmesi.',
              systems: ['DYS'],
              inputs: ['Teslim alınmış evrak'],
              outputs: ['DYS kayıt numarası'],
              controlRefs: ['K-HSR-01'],
            },
            {
              code: 'HSR-01-3',
              name: 'İlgili birime havale',
              description: 'Evrakın yeni talep ya da mevcut dosya evrakı olarak havale edilmesi.',
              systems: ['DYS'],
              inputs: ['DYS kaydı'],
              outputs: ['Havale kaydı'],
            },
          ],
        },

        /* ---------- 1.1.2 Talep Değerlendirme ---------- */
        {
          code: 'HSR-02',
          name: 'Talep Değerlendirme (1.1.2)',
          owner: 'usr-05',
          participants: ['usr-04'],
          description:
            'Gelen talebin yeni talep mi dosya bilgi talebi mi olduğunun ayrıştırılması, maddi/bedeni '
            + 'sınıflandırması, evrak kontrolü ve arabuluculuk başvurularının ayrılması.',
          purpose:
            'Eksik evrakla dosya açılmasını önlemek ve talebi doğru hatta yönlendirmek.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['Tazminat talep formu', 'Kaza tespit tutanağı', 'Vekaletname'],
          outputs: ['Evrak kontrolü tamamlanmış talep', 'Arabuluculuk yönlendirmesi'],
          maturity: 3,
          slaDays: 2,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Hukuki Sonuç',
              'Vekaleten yapılan başvurularda vekaletin kapsamı ödeme yetkisini belirler; kapsam dışı ödeme geri alınamaz.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Arabuluculuk, bedeni zarar taleplerinde dava şartıdır; süreç 6+2 hafta içinde sonuçlanmalıdır.'],
          ],
          examples: [
            {
              title: 'Vekaletin kapsamı kontrol edilmeden ödeme yapılması',
              scenario:
                'Avukat, müvekkili adına tazminat talebinde bulunuyor. Vekaletnamede "tahsile yetkilidir" '
                + 'ibaresi yok ama evrak tam olduğu için dosya açılıp ödeme avukatın hesabına yapılıyor.',
              risk: 'Zarar gören parayı almadığını beyan ediyor; büro ikinci kez ödemek zorunda kalıyor.',
              control: 'Vekaletnamenin tahsil yetkisi içerip içermediğinin sistemde ayrı alan olarak işaretlenmesi.',
              controlType: 'Önleyici — evrak ve yetki kontrolü',
              evidence: 'Vekaletname görüntüsü ve sistemdeki tahsil yetkisi işareti',
              criticalNote:
                'Tahsil yetkisi işaretlenmemiş dosyalarda ödeme yalnızca zarar görenin kendi hesabına yapılabilir.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-02',
              name: 'Vekaletin kapsamı doğrulanmadan vekile ödeme yapılması',
              description:
                'Vekaleten yapılan başvurularda vekaletnamenin tahsil yetkisi içerip içermediği '
                + 'kontrol edilmeden ödemenin vekile yapılması.',
              cause:
                'Sistemde vekalet ve vekalet kapsamı için ayrı alan bulunmaması; kontrolün tamamen '
                + 'personelin dikkatine bırakılması.',
              consequence: 'Hak sahibi olmayana ödeme, ikinci kez ödeme zorunluluğu ve hukuki ihtilaf.',
              category: 'legal',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-06-25',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
            {
              code: 'R-HSR-21',
              name: 'Arabuluculuk süresinin kaçırılması',
              description:
                'Arabuluculuk sürecine giren dosyalarda 6+2 haftalık yasal sürenin takip edilmemesi '
                + 've toplantıya katılım sağlanamaması.',
              cause: 'Sürenin sistemde uyarı üretmemesi; takibin ajanda üzerinden elle yapılması.',
              consequence:
                'Arabuluculuk tutanağının aleyhe düzenlenmesi, dava açılması ve yargılama gideri.',
              category: 'legal',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-10-08',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-03',
              name: 'Vekalet ve tahsil yetkisi alan kontrolü',
              description:
                'Vekaleten başvurularda sistemde vekaletname ve tahsil yetkisi ayrı alanlar olarak '
                + 'işaretlenir; tahsil yetkisi yoksa ödeme alıcısı olarak vekil seçilemez.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['authorization', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Evrak kontrol adımında vekalet kapsamının okunması ve sistemde işaretlenmesi.',
              evidence: 'Vekalet kapsamı işareti ve ödeme alıcısı kaydı',
              mitigates: ['R-HSR-02'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-26',
              lastTestedAt: '2026-05-30',
              testResult:
                'Alan henüz sistemde yok; kontrol vekaletnamenin elle okunmasıyla yapılıyor. 30 dosyanın 5’inde kapsam not edilmemiş.',
            },
            {
              code: 'K-HSR-04',
              name: 'Arabuluculuk 6+2 hafta süre uyarısı',
              description:
                'Arabuluculuğa giren dosyalarda süre sonuna iki hafta kala sistem uyarı üretir ve '
                + 'dosya sorumlusuna görev atar.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'system'],
              frequency: 'daily',
              method: 'Arabuluculuk başlangıç tarihine göre günlük uyarı taraması.',
              evidence: 'Uyarı listesi ve görev kaydı',
              mitigates: ['R-HSR-21'],
              owner: 'usr-05',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-20',
              testResult: 'Son çeyrekte 12 arabuluculuk dosyasının tamamında uyarı zamanında üretildi.',
            },
          ],
          docs: [
            {
              code: 'CHK-HSR-02',
              name: 'Tazminat Talebi Evrak Kontrol Listesi',
              type: 'checklist',
              version: '2.3',
              owner: 'usr-05',
              publishedAt: '2025-05-10',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-05-10',
              summary: 'Maddi ve bedeni zarar taleplerinde aranan asgari evrak seti.',
              sections: [
                {
                  heading: 'Maddi Araç Zararı (1.1.2.1)',
                  body: [
                    'Tazminat talep formu (ıslak imzalı).',
                    'Kaza tespit tutanağı veya Tramer kaydı.',
                    'Ruhsat ve hasarlı araç fotoğrafları.',
                    'Eksper raporu ya da onarım faturası.',
                    'Vekaleten başvuruda vekaletname ve tahsil yetkisi.',
                  ],
                },
                {
                  heading: 'Bedeni Zarar (1.1.2.1.1)',
                  body: [
                    'Bedeni zarar talep formu.',
                    'Hastane raporları ve epikriz.',
                    'Maluliyet oranı raporu (varsa).',
                    'Veraset ilamı (ölüm hâlinde).',
                  ],
                },
              ],
              controlCodes: ['K-HSR-03'],
            },
          ],
          children: [
            {
              code: 'HSR-02-1',
              name: 'Talep tipinin belirlenmesi',
              description: 'Yeni talep mi dosya bilgi talebi mi, maddi mi bedeni mi olduğunun ayrıştırılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Gelen talep'],
              outputs: ['Sınıflandırılmış talep'],
            },
            {
              code: 'HSR-02-2',
              name: 'Evrak kontrolü',
              description: 'Talep tipine göre asgari evrak setinin eksiksizliğinin denetlenmesi.',
              systems: ['Büro Hasar Sistemi', 'DYS'],
              inputs: ['Talep evrakı'],
              outputs: ['Evrak kontrol sonucu', 'Eksik evrak bildirimi'],
              controlRefs: ['K-HSR-03'],
            },
            {
              code: 'HSR-02-3',
              name: 'Arabuluculuk yönlendirmesi',
              description: 'Arabuluculuk başvurularının ayrı hatta alınması ve süre takibinin başlatılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Arabuluculuk başvurusu'],
              outputs: ['Arabuluculuk dosyası', 'Süre uyarısı'],
              controlRefs: ['K-HSR-04'],
            },
          ],
        },

        /* ---------- 1.1.3 Dosya Oluşturma ---------- */
        {
          code: 'HSR-03',
          name: 'Dosya Oluşturma (1.1.3)',
          owner: 'usr-05',
          description:
            'Yeşil Kart kontrolü, poliçe/sigortacı tespiti ve hasar dosyasının açılması. UHT '
            + '(Uluslararası Hasar Talebi) kapsamındaki talepler ayrı akışa girer.',
          purpose:
            'Dosyanın doğru sigortacı ve doğru teminat kapsamıyla açılmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Tramer'],
          inputs: ['Evrak kontrolü tamamlanmış talep', 'Yabancı plaka bilgisi'],
          outputs: ['Dosya numarası', 'Tespit edilmiş sigortacı'],
          maturity: 3,
          slaDays: 2,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Yeşil Kart bulunmayan taleplerde büro sorumluluğu doğmaz; dosya açılması hatalı yükümlülük yaratır.'],
          ],
          examples: [
            {
              title: 'Yeşil Kart olmadan dosya açılması',
              scenario:
                'Yabancı plakalı araç için talep geliyor, ancak araca ait geçerli Yeşil Kart bulunamıyor. '
                + 'Evrak tam olduğu için personel yine de dosya açıyor.',
              risk: 'Büro, sorumlu olmadığı bir zarar için karşılık ayırıyor ve süreç boyunca kaynak harcıyor.',
              control: 'Yeşil Kart kontrolü olumsuzsa sistemin dosya açılışını engellemesi, yalnızca evrak kaydına izin vermesi.',
              controlType: 'Önleyici — sistem engeli',
              evidence: 'Yeşil Kart sorgu sonucu ve dosya açılış logu',
              criticalNote: 'Yeşil Kart yoksa evrak kaydı yapılır, dosya açılmaz.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-03',
              name: 'Yeşil Kart bulunmayan talepte dosya açılması',
              description:
                'Geçerli Yeşil Kart teyidi alınmadan hasar dosyasının açılması ve büronun sorumlu '
                + 'olmadığı bir talep için süreç işletilmesi.',
              cause: 'Yeşil Kart kontrolünün dosya açılışında bloke edici olmaması.',
              consequence: 'Gereksiz muallak karşılığı, boşa harcanan işgücü ve rücu edilemeyen ödeme riski.',
              category: 'operational',
              inherent: [4, 4],
              residual: [2, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'down',
              owner: 'usr-05',
              identifiedAt: '2025-03-18',
              lastAssessedAt: '2026-03-05',
              standards: ['Yeşil Kart Sistemi', 'COSO'],
            },
            {
              code: 'R-HSR-22',
              name: 'Yabancı sigortacı sorgusunun yavaşlığı nedeniyle sürecin durması',
              description:
                'Yabancı sigorta şirketi bilgisi sistemden çağrıldığında yanıtın çok yavaş gelmesi ve '
                + 'dosya açılışının bekletilmesi.',
              cause: 'Dış servisin yanıt süresinin izlenmemesi ve zaman aşımı davranışının tanımsız olması.',
              consequence: 'Dosya açılışında gecikme, SLA aşımı ve personel verimsizliği.',
              category: 'it',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-11',
              identifiedAt: '2025-09-30',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 27001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-05',
              name: 'Yeşil Kart teyidi olmadan dosya açılışının engellenmesi',
              description:
                'Yeşil Kart sorgusu olumsuz sonuçlanırsa sistem dosya açılışına izin vermez; '
                + 'yalnızca evrak kaydı yapılabilir ve talep sahibi bilgilendirilir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'authorization'],
              frequency: 'per_transaction',
              method: 'Dosya açılış ekranında Yeşil Kart teyidi zorunlu ön koşul olarak tanımlıdır.',
              evidence: 'Yeşil Kart sorgu logu ve engellenen açılış kayıtları',
              mitigates: ['R-HSR-03'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-15',
              testResult: '75 talebin 9’unda Yeşil Kart bulunamadı, dosya açılmadı; kontrol çalışıyor.',
            },
            {
              code: 'K-HSR-06',
              name: 'Dış servis yanıt süresi izleme ve zaman aşımı',
              description:
                'Yabancı sigortacı sorgu servisinin yanıt süresi izlenir; belirlenen süreyi aşan '
                + 'sorgular zaman aşımına uğrar ve kullanıcı manuel tespite yönlendirilir.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'system'],
              frequency: 'continuous',
              method: 'Servis çağrılarının süre ölçümü ve eşik aşımında uyarı.',
              evidence: 'Servis süre raporu',
              mitigates: ['R-HSR-22'],
              owner: 'usr-11',
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-04-22',
              testResult:
                'Süre ölçümü var ancak zaman aşımı tanımlı değil; kullanıcı ekran donduğunda bekliyor.',
            },
          ],
          children: [
            {
              code: 'HSR-03-1',
              name: 'Yeşil Kart kontrolü (1.1.3.4)',
              description: 'Yabancı plakaya ait geçerli Yeşil Kart bulunup bulunmadığının sorgulanması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Yabancı plaka', 'Kaza tarihi'],
              outputs: ['Yeşil Kart teyidi'],
              controlRefs: ['K-HSR-05'],
            },
            {
              code: 'HSR-03-2',
              name: 'Poliçe ve sigortacı tespiti (1.1.3.3)',
              description: 'Yeşil Kart üzerinden yabancı sigorta şirketinin ve teminatın tespiti.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Yeşil Kart bilgisi'],
              outputs: ['Sigortacı bilgisi', 'Teminat kapsamı'],
              controlRefs: ['K-HSR-06'],
            },
            {
              code: 'HSR-03-3',
              name: 'Dosya açılışı ve numara verilmesi',
              description: 'Kaza ve taraf bilgileriyle hasar dosyasının açılması, dosya numarasının üretilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Teyit edilmiş bilgiler'],
              outputs: ['Dosya numarası'],
            },
            {
              code: 'HSR-03-4',
              name: 'UHT dosya açılışı (1.1.3.1)',
              description: 'Uluslararası Hasar Talebi kapsamındaki dosyaların ayrı akışta açılması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['UHT talebi'],
              outputs: ['UHT dosyası'],
            },
          ],
        },

        /* ---------- 1.1.4 Zarar Gören Girişi ---------- */
        {
          code: 'HSR-04',
          name: 'Zarar Gören Girişi (1.1.4)',
          owner: 'usr-05',
          participants: ['usr-04'],
          description:
            'Açılan dosyaya zarar görenlerin (alt dosya) tanımlanması: şahıs/şirket ayrımı, talep tipi '
            + '(maddi-araç, maddi-araç dışı, bedeni), zamanaşımı ve limit kontrolü.',
          purpose:
            'Her zarar görenin ayrı takip edilebilir bir alt dosyada, doğru talep tipiyle kayda geçmesini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['Açılmış dosya', 'Zarar gören bilgileri'],
          outputs: ['Alt dosya kaydı', 'Otomatik bilgilendirme'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Zamanaşımına uğramış talepler ödenemez; kontrol alt dosya açılışında yapılmalıdır.'],
            ['privacy', 'Veri Gizliliği',
              'Zarar görene yapılan otomatik bilgilendirme KVKK aydınlatma yükümlülüğünü karşılamalı ve kaydı tutulmalıdır.'],
          ],
          examples: [
            {
              title: 'Zamanaşımı kontrolü yapılmadan alt dosya açılması',
              scenario:
                'Kaza tarihi üzerinden üç yıl geçmiş bir talep için alt dosya açılıyor; zamanaşımı '
                + 'kontrolü ödeme aşamasına kadar yapılmıyor.',
              risk: 'Süreç sonuna kadar kaynak harcanıyor, ödeme aşamasında talep reddedilince şikâyet doğuyor.',
              control: 'Alt dosya açılışında kaza tarihine göre otomatik zamanaşımı kontrolü ve uyarı.',
              controlType: 'Önleyici — otomatik tarih kontrolü',
              evidence: 'Zamanaşımı kontrol logu',
              criticalNote: 'Zamanaşımı uyarısı verilen dosyalar yönetici onayı olmadan ilerleyemez.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-04',
              name: 'Zamanaşımı ve teminat limiti kontrolünün geç yapılması',
              description:
                'Zamanaşımı ve teminat limiti kontrolünün alt dosya açılışında değil ödeme aşamasında '
                + 'yapılması sonucu gereksiz iş yükü ve hatalı beklenti yaratılması.',
              cause: 'Kontrollerin akışın başında sistemsel olarak konumlandırılmamış olması.',
              consequence:
                'Boşa harcanan işgücü, zarar görende yanlış beklenti, geç red nedeniyle şikâyet.',
              category: 'operational',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-07-02',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
            {
              code: 'R-HSR-23',
              name: 'KVKK aydınlatma bildiriminin yapılmaması veya kaydedilmemesi',
              description:
                'Zarar görene dosya açılışında yapılması gereken KVKK aydınlatma bildiriminin '
                + 'gönderilmemesi ya da gönderildiğinin sistemde kayıt altına alınmaması.',
              cause:
                'Bildirimin Outlook üzerinden elle gönderilmesi ve gönderim kaydının sisteme işlenmemesi.',
              consequence: 'KVKK ihlali iddiasına karşı kanıt üretilememesi, idari yaptırım riski.',
              category: 'privacy',
              inherent: [4, 4],
              residual: [3, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-25',
              identifiedAt: '2025-12-01',
              lastAssessedAt: '2026-03-05',
              standards: ['KVKK'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-07',
              name: 'Alt dosya açılışında zamanaşımı ve limit kontrolü',
              description:
                'Alt dosya açılışında kaza tarihine göre zamanaşımı, teminat türüne göre limit '
                + 'otomatik kontrol edilir; uyarı üretilen dosyalar yönetici onayı olmadan ilerleyemez.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Kaza tarihi ve teminat limiti üzerinden sistem kontrolü.',
              evidence: 'Kontrol logu ve yönetici onay kaydı',
              mitigates: ['R-HSR-04'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-27',
              lastTestedAt: '2026-05-18',
              testResult:
                'Limit kontrolü çalışıyor; zamanaşımı kontrolü henüz alt dosya açılışında değil, ödeme adımında devrede.',
            },
            {
              code: 'K-HSR-08',
              name: 'Otomatik KVKK aydınlatma bildirimi ve gönderim kaydı',
              description:
                'Alt dosya açılışında şahıs/şirket ayrımına göre KVKK aydınlatma metni otomatik '
                + 'gönderilir ve "bilgilendirme yapıldı" olarak sisteme kaydedilir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'monitoring'],
              frequency: 'per_transaction',
              method: 'Alt dosya açılışında tetiklenen otomatik e-posta ve sistem kaydı.',
              evidence: 'Gönderim kaydı ve e-posta logu',
              mitigates: ['R-HSR-23'],
              owner: 'usr-25',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'ineffective',
              strength: 1,
              lastPerformedAt: '2026-08-27',
              lastTestedAt: '2026-06-05',
              testResult:
                'Bildirim Outlook üzerinden elle gönderiliyor ve sisteme kaydedilmiyor. 20 dosyanın 7’sinde gönderim kanıtı bulunamadı.',
            },
          ],
          children: [
            {
              code: 'HSR-04-1',
              name: 'Zarar gören tanımı ve şahıs/şirket ayrımı',
              description: 'Zarar görenin gerçek veya tüzel kişi olarak tanımlanması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Zarar gören bilgileri'],
              outputs: ['Alt dosya kaydı'],
            },
            {
              code: 'HSR-04-2',
              name: 'Talep tipi ve plaka bilgisi',
              description: 'Maddi-araç, maddi-araç dışı veya bedeni ayrımının ve zarar gören plakasının girilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Talep beyanı'],
              outputs: ['Talep tipi'],
            },
            {
              code: 'HSR-04-3',
              name: 'Zamanaşımı ve limit kontrolü',
              description: 'Kaza tarihine göre zamanaşımı, teminata göre limit kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Kaza tarihi', 'Teminat bilgisi'],
              outputs: ['Kontrol sonucu'],
              controlRefs: ['K-HSR-07'],
            },
            {
              code: 'HSR-04-4',
              name: 'Otomatik bilgilendirme gönderimi',
              description: 'Dosya açıldı bilgisi ve KVKK aydınlatma metninin gönderilip kaydedilmesi.',
              systems: ['Büro Hasar Sistemi', 'Outlook'],
              inputs: ['Alt dosya kaydı'],
              outputs: ['Bilgilendirme kaydı'],
              controlRefs: ['K-HSR-08'],
            },
          ],
        },

        /* ---------- 1.1.5 Muallak Girişi ---------- */
        {
          code: 'HSR-05',
          name: 'Muallak Girişi (1.1.5)',
          owner: 'usr-05',
          description:
            'Talep tutarına ve tahmini tedvir ücretine göre muallak (ödenmemiş hasar) karşılığının '
            + 'belirlenip sisteme girilmesi; evrak orijinal değilse fiziki dosya açılması.',
          purpose:
            'Kurumun yükümlülüğünün mali tablolarda doğru zamanlı ve doğru tutarla görünmesini sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Talep yazısında belirtilen tutar', 'Tahmini tedvir ücreti'],
          outputs: ['Muallak kaydı', 'Fiziki dosya'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Muallak karşılığı doğrudan mali tabloya yansır; eksik karşılık yükümlülüğün gizlenmesi anlamına gelir.'],
          ],
          examples: [
            {
              title: 'Tutar bildirilmeyen bedeni dosyada muallak eksik ayrılması',
              scenario:
                'Bedeni zarar talebinde tutar belirtilmemiş. Personel iş akışında tanımlı standart tutar '
                + 'yerine sembolik bir rakam giriyor.',
              risk: 'Karşılık gerçek yükümlülüğün çok altında kalıyor; dönem sonunda büyük düzeltme gerekiyor.',
              control: 'Tutar bildirilmemiş dosyalarda iş akışında tanımlı asgari tutarın sistem tarafından zorunlu kılınması.',
              controlType: 'Önleyici — parametrik varsayılan',
              evidence: 'Muallak giriş logu ve parametre tablosu',
              criticalNote: 'Standart tutarın altına inmek yalnızca yönetici onayıyla mümkündür.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-05',
              name: 'Muallak karşılığının eksik veya fazla ayrılması',
              description:
                'Talep tutarının bildirilmediği ya da tahmini tedvir ücretinin hatalı hesaplandığı '
                + 'dosyalarda muallak karşılığının gerçek yükümlülüğü yansıtmaması.',
              cause:
                'Tutar bildirilmeyen dosyalarda standart tutarın sistemsel olarak zorunlu olmaması ve '
                + 'dosya bazlı muallak güncellemesinin düzenli yapılmaması.',
              consequence:
                'Mali tabloda yanlış yükümlülük, dönem sonu düzeltme ve denetim bulgusu.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-06',
              identifiedAt: '2025-02-20',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 31000'],
            },
            {
              code: 'R-HSR-24',
              name: 'Orijinal olmayan evrakla dosya ilerletilmesi',
              description:
                'Fotokopi veya taranmış evrakla dosyanın ödeme aşamasına kadar ilerletilmesi ve '
                + 'orijinal evrakın hiç talep edilmemesi.',
              cause: 'Orijinal evrak kontrolünün yalnızca fiziki dosya açılışına bağlı olması.',
              consequence: 'Sahte evrak riski, rücu aşamasında yurt dışı büronun evrakı reddetmesi.',
              category: 'operational',
              inherent: [3, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-08-14',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-09',
              name: 'Muallak asgari tutar parametresi ve dönemsel güncelleme',
              description:
                'Tutar bildirilmemiş dosyalarda iş akışında tanımlı asgari muallak tutarı sistem '
                + 'tarafından zorunlu kılınır; muallaklar aylık olarak dosya bazında gözden geçirilir.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['data_validation', 'monitoring'],
              frequency: 'monthly',
              method: 'Parametrik asgari tutar ve aylık muallak gözden geçirme listesi.',
              evidence: 'Parametre tablosu ve aylık gözden geçirme tutanağı',
              mitigates: ['R-HSR-05'],
              owner: 'usr-06',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-01',
              lastTestedAt: '2026-06-28',
              testResult:
                'Asgari tutar uygulanıyor. Aylık gözden geçirme son üç ayın ikisinde yapılmış; dosya bazlı güncelleme eksik.',
            },
            {
              code: 'K-HSR-10',
              name: 'Orijinal evrak kontrolü ve fiziki dosya açılışı',
              description:
                'Evrakın orijinal olup olmadığı muallak girişinde işaretlenir; orijinal değilse fiziki '
                + 'dosya açılır ve orijinal evrak talebi listeyle yöneticiye bildirilir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['data_validation'],
              frequency: 'per_transaction',
              method: 'Evrak orijinallik kontrolü ve eksik orijinal listesi.',
              evidence: 'Orijinallik işareti ve yönetici bildirim listesi',
              mitigates: ['R-HSR-24'],
              owner: 'usr-05',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-27',
              lastTestedAt: '2026-06-10',
              testResult: '35 dosyanın tamamında orijinallik işareti mevcut.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSR-05',
              name: 'Muallak Karşılığı Belirleme Prosedürü',
              type: 'procedure',
              version: '1.8',
              owner: 'usr-06',
              publishedAt: '2025-01-15',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-01-15',
              summary:
                'Muallak karşılığının belirlenmesi, asgari tutar parametreleri ve dönemsel gözden geçirme.',
              sections: [
                {
                  heading: 'Karşılık Tutarı',
                  body: [
                    'Talep yazısında tutar belirtilmişse bu tutara tahmini tedvir ücreti eklenir.',
                    'Tutar belirtilmemişse iş akışında tanımlı asgari muallak tutarı uygulanır.',
                    'Asgari tutarın altına inmek yalnızca servis yöneticisi onayıyla mümkündür.',
                  ],
                },
                {
                  heading: 'Dönemsel Gözden Geçirme',
                  body: [
                    'Muallaklar aylık olarak dosya bazında gözden geçirilir.',
                    'Gerçekleşen ödemelerle karşılık arasındaki sapma çeyreklik raporlanır.',
                  ],
                },
              ],
              controlCodes: ['K-HSR-09'],
            },
          ],
          kris: [
            {
              code: 'KRI-HSR-01',
              name: 'Muallak sapma oranı',
              definition:
                'Kapanan dosyalarda ödenen tutar ile ilk ayrılan muallak arasındaki mutlak sapmanın '
                + 'ortalaması (%). Karşılık kalitesinin göstergesidir.',
              riskCode: 'R-HSR-05',
              owner: 'usr-06',
              unit: 'U-HSR',
              frequency: 'monthly',
              direction: 'lower_better',
              greenMax: 15,
              amberMax: 30,
              readings: [22, 25, 24, 28, 31, 29, 33, 30, 27, 32, 35, 34],
            },
          ],
          actions: [
            {
              code: 'AKS-006',
              title: 'Muallak asgari tutarının talep tipine göre parametrelenmesi',
              description:
                'Tutar bildirilmemiş dosyalarda tek bir asgari tutar yerine maddi-araç, maddi-araç dışı '
                + 've bedeni için ayrı parametre tanımlanması; aylık gözden geçirmenin sistem görevine bağlanması.',
              riskCode: 'R-HSR-05',
              controlCode: 'K-HSR-09',
              owner: 'usr-06',
              dueDate: '2026-11-30',
              priority: 'high',
              status: 'in_progress',
              progress: 40,
              source: 'internal_control',
              createdAt: '2026-06-28',
              createdBy: 'usr-22',
            },
          ],
          children: [
            {
              code: 'HSR-05-1',
              name: 'Tutar bildirimi kontrolü',
              description: 'Talep yazısında tutar belirtilip belirtilmediğinin kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Talep yazısı'],
              outputs: ['Tutar bilgisi'],
            },
            {
              code: 'HSR-05-2',
              name: 'Muallak tutarının girilmesi',
              description: 'Talep tutarı + tahmini tedvir ücreti ya da iş akışındaki standart tutarın girilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Tutar bilgisi', 'Tedvir ücreti'],
              outputs: ['Muallak kaydı'],
              controlRefs: ['K-HSR-09'],
            },
            {
              code: 'HSR-05-3',
              name: 'Orijinal evrak ve fiziki dosya',
              description: 'Evrak orijinal değilse fiziki dosya açılması ve yöneticiye bildirim.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Evrak'],
              outputs: ['Fiziki dosya', 'Bildirim listesi'],
              controlRefs: ['K-HSR-10'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* 1.2 — SERVİS YÖNETİCİSİ                                       */
    /* ============================================================ */
    {
      code: 'HSR-B',
      name: 'Servis Yöneticisi (1.2)',
      owner: 'usr-02',
      description:
        'Dosyanın sorumluya atanması, ödeme talebinin onaylanması ve ödeme gününün oluşturulması.',
      purpose:
        'Her dosyanın bir sahibi olmasını ve hiçbir ödemenin tek kişinin kararıyla çıkmamasını sağlamak.',
      systems: ['Büro Hasar Sistemi', 'Güvence Hesabı', 'Excel'],
      inputs: ['Muallak girilmiş dosya', 'Talep girişi'],
      outputs: ['Atanmış dosya', 'Onaylanmış talep', 'Ödeme günü listesi'],
      maturity: 3,
      slaDays: 5,

      children: [
        /* ---------- 1.2.1 Dosya Sorumlu Ataması ---------- */
        {
          code: 'HSR-06',
          name: 'Dosya Sorumlu Ataması (1.2.1)',
          owner: 'usr-02',
          description:
            'Açılan dosyanın ve alt dosyaların uzmanlık ve iş yüküne göre bir dosya sorumlusuna atanması.',
          purpose: 'Her dosyanın ve alt dosyanın takip edilebilir bir sahibi olmasını sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Açılmış dosya listesi'],
          outputs: ['Atama kaydı'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['control', 'Kontrol Noktası',
              'Atanmamış alt dosyalar hiçbir raporda görünmediği için sessizce kaybolabilir.'],
          ],
          examples: [
            {
              title: 'Alt dosyanın atanmadan kalması',
              scenario:
                'Ana dosya sorumluya atanıyor ama üç zarar görenden birinin alt dosyası atanmamış kalıyor. '
                + 'Atanmamış alt dosya takip raporunda görünmüyor.',
              risk: 'Alt dosya aylarca işlem görmüyor; zarar gören şikâyet edene kadar fark edilmiyor.',
              control: 'Atanmamış dosya ve alt dosyaların günlük listede raporlanması.',
              controlType: 'Tespit edici — istisna raporu',
              evidence: 'Atanmamış dosya günlük listesi',
              criticalNote: 'Rapor alt dosya seviyesini de kapsamalıdır; yalnızca ana dosya bakmak yetmez.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-06',
              name: 'Alt dosyaların sorumluya atanmadan kalması',
              description:
                'Ana dosya atanmasına rağmen alt dosyaların atanmaması ve atanmamış alt dosyaların '
                + 'takip raporlarında görünmemesi.',
              cause: 'Takip raporunun yalnızca ana dosya seviyesinde çalışması.',
              consequence:
                'İşlem görmeyen dosya, gecikmiş ödeme, faiz yükü ve zarar gören şikâyeti.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-02',
              identifiedAt: '2025-04-09',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-11',
              name: 'Atanmamış dosya ve alt dosya günlük raporu',
              description:
                'Açık olup sorumluya atanmamış tüm dosya ve alt dosyalar günlük listede raporlanır; '
                + 'liste servis yöneticisi tarafından her sabah kapatılır.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring'],
              frequency: 'daily',
              method: 'Alt dosya seviyesini kapsayan günlük istisna raporu.',
              evidence: 'Günlük atanmamış dosya listesi ve kapatma kaydı',
              mitigates: ['R-HSR-06'],
              owner: 'usr-02',
              key: true,
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-18',
              testResult:
                'Rapor çalışıyor ancak alt dosya seviyesini kapsamıyor; atanmamış 4 alt dosya raporda görünmedi.',
            },
          ],
          children: [
            {
              code: 'HSR-06-1',
              name: 'Atanacak dosyaların listelenmesi',
              description: 'Muallak girişi tamamlanmış, sorumlusu olmayan dosyaların listelenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Açık dosya listesi'],
              outputs: ['Atama bekleyen liste'],
              controlRefs: ['K-HSR-11'],
            },
            {
              code: 'HSR-06-2',
              name: 'Sorumlu ataması',
              description: 'Uzmanlık ve iş yüküne göre dosya ve alt dosyaların atanması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Atama bekleyen liste'],
              outputs: ['Atama kaydı'],
            },
          ],
        },

        /* ---------- 1.2.2 Talep Onay ---------- */
        {
          code: 'HSR-07',
          name: 'Talep Onay (1.2.2)',
          owner: 'usr-02',
          participants: ['usr-06', 'usr-08'],
          description:
            'Dosya sorumlusunun girdiği ödeme talebinin yönetici tarafından kontrol edilip onaylanması, '
            + 'Güvence Hesabı’ndan talep edilmesi ve gelen tutarların dosyalara işlenmesi.',
          purpose:
            'Hiçbir ödemenin tek kişinin kararıyla çıkmamasını ve talep tutarının dosyayla tutarlı olmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Güvence Hesabı'],
          inputs: ['Girilmiş ödeme talebi'],
          outputs: ['Onaylanmış talep', 'Güvence talep yazısı', 'Gelen tutar kaydı'],
          maturity: 3,
          slaDays: 3,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['authorization', 'Yetki Ayrımı',
              'Talebi giren ile onaylayan farklı kişi olmalıdır; aynı kişinin her ikisini yapması görevler ayrılığını bozar.'],
            ['financial', 'Finansal Etki',
              'Onaylanan tutar doğrudan Güvence Hesabı’ndan talep edilir; hatalı onay geri alınması güç bir ödeme doğurur.'],
          ],
          examples: [
            {
              title: 'Zarar görene ödeme bilgisinin iletilmemesi',
              scenario:
                'Talep onaylanıp Güvence’ye iletiliyor ve ödeme yapılıyor, ancak zarar görene hiçbir '
                + 'bildirim gitmiyor. Zarar gören durumu öğrenmek için defalarca arıyor.',
              risk: 'Gereksiz çağrı yükü, memnuniyetsizlik ve şikâyet.',
              control: 'Ödeme onayı sonrası zarar görene otomatik e-posta veya SMS bildirimi.',
              controlType: 'Önleyici — otomatik bildirim',
              evidence: 'Bildirim gönderim kaydı',
              criticalNote: 'Bildirim, ödeme gününün oluşturulmasıyla birlikte tetiklenmelidir.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-07',
              name: 'Talebi girenin aynı zamanda onaylaması',
              description:
                'Görevler ayrılığının uygulanmaması sonucu ödeme talebini giren kişinin aynı talebi '
                + 'onaylayabilmesi.',
              cause: 'Sistemde giren ve onaylayan kullanıcı farkının zorunlu kılınmaması.',
              consequence: 'Suistimal ve hatalı ödemenin fark edilmeden çıkması.',
              category: 'financial',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-02',
              identifiedAt: '2025-05-22',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
            {
              code: 'R-HSR-25',
              name: 'Zarar görenin ödeme hakkında bilgilendirilmemesi',
              description:
                'Ödeme onaylandığında ve ödeme günü verildiğinde zarar görene otomatik bildirim '
                + 'yapılmaması.',
              cause: 'Bildirimin süreçte tanımlı olmaması.',
              consequence: 'Çağrı merkezinde gereksiz yük, memnuniyetsizlik ve şikâyet.',
              category: 'reputational',
              inherent: [4, 2],
              residual: [3, 2],
              target: [1, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-02',
              identifiedAt: '2025-09-16',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-12',
              name: 'Talebi giren ile onaylayan ayrımı',
              description:
                'Sistem, ödeme talebini giren kullanıcının aynı talebi onaylamasına izin vermez; '
                + 'onay yalnızca servis yöneticisi rolündeki farklı bir kullanıcı tarafından verilebilir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['segregation_of_duties', 'authorization'],
              frequency: 'per_transaction',
              method: 'Onay ekranında kullanıcı kimliği karşılaştırması.',
              evidence: 'Onay kaydı ve kullanıcı logu',
              mitigates: ['R-HSR-07'],
              owner: 'usr-02',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 5,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-07-10',
              testResult: '120 onayın tamamında giren ve onaylayan farklı; kontrol atlatılamıyor.',
            },
            {
              code: 'K-HSR-13',
              name: 'Ödeme onayı sonrası zarar görene otomatik bildirim',
              description:
                'Talep onaylanıp ödeme günü verildiğinde zarar görene e-posta veya SMS ile bildirim '
                + 'gönderilir ve gönderim kaydı dosyaya işlenir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system'],
              frequency: 'per_transaction',
              method: 'Ödeme günü kaydına bağlı otomatik bildirim tetikleyicisi.',
              evidence: 'Bildirim gönderim kaydı',
              mitigates: ['R-HSR-25'],
              owner: 'usr-02',
              coso: 'control_activities',
              design: 'inadequate',
              effectiveness: 'ineffective',
              strength: 1,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-22',
              testResult: 'Bildirim mekanizması henüz kurulmadı; talep geliştirme listesinde.',
            },
          ],
          docs: [
            {
              code: 'TLM-HSR-07',
              name: 'Ödeme Talebi Onay Talimatı',
              type: 'instruction',
              version: '2.0',
              owner: 'usr-02',
              publishedAt: '2025-06-01',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-06-01',
              summary: 'Talep onayı, Güvence Hesabı’ndan talep ve gelen tutarların işlenmesi.',
              sections: [
                {
                  heading: 'Onay Öncesi Kontroller',
                  body: [
                    'Talep tutarı dosyadaki evrak ve eksper raporuyla karşılaştırılır.',
                    'Peşin ödeme yapılmışsa mahsup edilir.',
                    'Talebi giren ile onaylayan aynı kişi olamaz.',
                  ],
                },
                {
                  heading: 'Güvence Talebi',
                  body: [
                    'Onaylanan talepler PDF talep yazısı ve dosya listesiyle Güvence Hesabı’na iletilir.',
                    'Gelen tutarlar dosya bazında sisteme işlenir ve Güvence referansı girilir.',
                  ],
                },
              ],
              controlCodes: ['K-HSR-12', 'K-HSR-13'],
            },
          ],
          children: [
            {
              code: 'HSR-07-1',
              name: 'Ödemeye ilişkin dosya kontrolü',
              description: 'Talep tutarının ve evrakın dosyayla tutarlılığının kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Girilmiş talep'],
              outputs: ['Kontrol sonucu'],
              controlRefs: ['K-HSR-12'],
            },
            {
              code: 'HSR-07-2',
              name: 'Talebin onaylanması ve Güvence’ye iletilmesi',
              description: 'Talep tarihinin girilip onaylanması, PDF talep yazısı ve listenin iletilmesi.',
              systems: ['Büro Hasar Sistemi', 'Güvence Hesabı'],
              inputs: ['Onaylanmış talep'],
              outputs: ['Güvence talep yazısı'],
            },
            {
              code: 'HSR-07-3',
              name: 'Gelen tutarların dosyalara işlenmesi',
              description: 'Güvence’den gelen ödeme ve dosya bilgilerinin referansla sisteme kaydı.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Güvence ödeme bildirimi'],
              outputs: ['Ödeme kaydı', 'Güvence referansı'],
              controlRefs: ['K-HSR-13'],
            },
          ],
        },

        /* ---------- 1.2.3 Ödeme Günü Verme ---------- */
        {
          code: 'HSR-08',
          name: 'Ödeme Günü Verme (1.2.3)',
          owner: 'usr-02',
          participants: ['usr-08'],
          description:
            'Güvence Hesabı’ndan gelen veya öz kaynaktan yapılacak ödemeler için ödeme gününün '
            + 'oluşturulması ve muhasebeye iletilmesi.',
          purpose: 'Ödemelerin planlı, kontrollü ve izlenebilir biçimde yapılmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Excel'],
          inputs: ['Güvence ödemesi', 'Öz kaynak ödeme kararı'],
          outputs: ['Ödeme günü listesi', 'Muhasebe bildirimi'],
          maturity: 2,
          slaDays: 2,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Ödeme günü listesi ödemenin tek dayanağıdır; liste üzerinde kontrolsüz değişiklik doğrudan hatalı ödeme demektir.'],
          ],
          examples: [
            {
              title: 'Excel ödeme listesinde kontrolsüz düzeltme',
              scenario:
                'Ödeme günü listesi Excel olarak üretiliyor. Muhasebeye gönderilmeden önce bir tutar '
                + 'elle düzeltiliyor; sistemdeki kayıtla liste arasında fark oluşuyor.',
              risk: 'Sistemde görünenden farklı tutar ödeniyor ve fark ancak mutabakatta fark ediliyor.',
              control: 'Ödeme günü listesinin sistemden kilitli üretilmesi ve elle değiştirilememesi.',
              controlType: 'Önleyici — çıktı bütünlüğü',
              evidence: 'Sistem listesi ile muhasebeye giden listenin karşılaştırması',
              criticalNote: 'Liste üzerinde değişiklik gerekiyorsa sistemde düzeltilip yeniden üretilmelidir.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-08',
              name: 'Ödeme günü listesinin sistem dışında değiştirilebilmesi',
              description:
                'Ödeme günü listesinin Excel olarak üretilmesi ve muhasebeye iletilmeden önce '
                + 'elle değiştirilebilmesi.',
              cause: 'Listenin kilitli olmayan bir formatta üretilmesi ve sistemle mutabakatının yapılmaması.',
              consequence:
                'Sistemde görünenden farklı tutarın ödenmesi, suistimal ve mutabakatsızlık.',
              category: 'financial',
              inherent: [4, 5],
              residual: [3, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-06',
              identifiedAt: '2025-01-28',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
            {
              code: 'R-HSR-26',
              name: 'Peşin ödemenin sistemde görünmemesi ve mükerrer ödeme',
              description:
                'Muhasebe tarafından yapılan peşin ödemenin sisteme girilmemesi sonucu aynı tutarın '
                + 'ikinci kez ödenmesi.',
              cause: 'Peşin ödemenin sistemde uyarı üretmemesi ve muhasebe girişinin zorunlu olmaması.',
              consequence: 'Mükerrer ödeme ve geri tahsil güçlüğü.',
              category: 'financial',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-06',
              identifiedAt: '2025-11-05',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-14',
              name: 'Ödeme günü listesinin kilitli üretilmesi',
              description:
                'Ödeme günü listesi sistemden değiştirilemez biçimde (PDF/kilitli) üretilir; '
                + 'muhasebeye giden liste ile sistem kaydı gün sonunda mutabık kılınır.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'reconciliation'],
              frequency: 'daily',
              method: 'Kilitli liste üretimi ve gün sonu mutabakatı.',
              evidence: 'Kilitli liste ve mutabakat kaydı',
              mitigates: ['R-HSR-08'],
              owner: 'usr-06',
              key: true,
              coso: 'control_activities',
              design: 'inadequate',
              effectiveness: 'ineffective',
              strength: 1,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-07-02',
              testResult:
                'Liste hâlâ Excel olarak üretiliyor ve düzenlenebiliyor. Mutabakat elle ve düzensiz yapılıyor. Öncelikli bulgu.',
            },
            {
              code: 'K-HSR-15',
              name: 'Peşin ödeme uyarısı ve muhasebe girişi zorunluluğu',
              description:
                'Peşin ödeme yapılan dosyalarda sistem ödeme günü oluşturulurken uyarı üretir; '
                + 'muhasebenin peşin ödemeyi sisteme girmesi zorunludur.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['system', 'reconciliation'],
              frequency: 'per_transaction',
              method: 'Peşin ödeme alanı ve ödeme günü ekranında uyarı.',
              evidence: 'Peşin ödeme kaydı ve uyarı logu',
              mitigates: ['R-HSR-26'],
              owner: 'usr-06',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-06-30',
              testResult: 'Alan mevcut ancak uyarı üretilmiyor; peşin ödemelerin 3’ü geç girilmiş.',
            },
          ],
          actions: [
            {
              code: 'AKS-007',
              title: 'Ödeme günü listesinin kilitli çıktıya çevrilmesi',
              description:
                'Ödeme günü listesinin Excel yerine değiştirilemez PDF olarak üretilmesi, Excel çıktısının '
                + 'kaldırılması ve sistem–liste mutabakatının otomatikleştirilmesi.',
              riskCode: 'R-HSR-08',
              controlCode: 'K-HSR-14',
              owner: 'usr-11',
              dueDate: '2026-10-31',
              priority: 'critical',
              status: 'in_progress',
              progress: 25,
              source: 'internal_control',
              createdAt: '2026-07-12',
              createdBy: 'usr-08',
              managerComment:
                'Muhasebe ile ortak çalışılıyor; kilitli çıktı geliştirmesi öncelik listesinin başında.',
            },
          ],
          children: [
            {
              code: 'HSR-08-1',
              name: 'Genel dosya kontrolü',
              description: 'Ödeme öncesi dosyanın ve peşin ödeme durumunun kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Ödeme bekleyen dosyalar'],
              outputs: ['Kontrol sonucu'],
              controlRefs: ['K-HSR-15'],
            },
            {
              code: 'HSR-08-2',
              name: 'Ödeme gününün oluşturulması',
              description: 'Güvence ve öz kaynak ödemeleri için ödeme gününün sistemde oluşturulması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Onaylanmış ödemeler'],
              outputs: ['Ödeme günü kaydı'],
              controlRefs: ['K-HSR-14'],
            },
            {
              code: 'HSR-08-3',
              name: 'Listenin muhasebeye iletilmesi',
              description: 'Tüm ödemeler listesinin muhasebe ödeme sürecine devredilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Ödeme günü listesi'],
              outputs: ['Muhasebe bildirimi'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* 1.3 — DOSYA SORUMLUSU                                         */
    /* ============================================================ */
    {
      code: 'HSR-C',
      name: 'Dosya Sorumlusu (1.3)',
      owner: 'usr-03',
      description:
        'Dosyanın esastan incelenmesi, sigortacı ve teminat teyidi, bilirkişi/eksper yönetimi, '
        + 'talep girişi, ret değerlendirmesi ve ödenen tutarın rücusu.',
      purpose:
        'Her dosyada ödenecek tutarın doğru tespit edilmesini ve ödenen tutarın geri alınmasını sağlamak.',
      systems: ['Büro Hasar Sistemi', 'Tramer', 'Oracle', 'Outlook'],
      inputs: ['Atanmış dosya', 'Eksper/bilirkişi raporu', 'Sigortacı yanıtı'],
      outputs: ['Ödeme talebi', 'Rücu faturası', 'Ret yazısı'],
      maturity: 3,
      slaDays: 20,

      children: [
        /* ---------- 1.3.1 Maddi Hasar Dosya İnceleme ---------- */
        {
          code: 'HSR-09',
          name: 'Maddi Hasar Dosya İnceleme (1.3.1)',
          owner: 'usr-03',
          participants: ['usr-04'],
          description:
            'Maddi zarar dosyalarında evrakın incelenmesi, sigortacı ve teminat teyidi, gerekirse '
            + 'bilirkişi/eksper atanması ve zarar tutarının belirlenmesi.',
          purpose: 'Ödenecek maddi zarar tutarının bağımsız ve belgeye dayalı biçimde tespitini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Tramer', 'Outlook'],
          inputs: ['Atanmış dosya', 'Hasar evrakı', 'Eksper raporu'],
          outputs: ['Tespit edilmiş zarar tutarı', 'Teminat onayı'],
          maturity: 3,
          slaDays: 10,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Eksper raporu ödenecek tutarın tek dayanağıdır; hatalı değerlendirme doğrudan ödeme hatasına dönüşür.'],
            ['control', 'Kontrol Noktası',
              'Eksper raporunun gelip gelmediği sistemsel olarak izlenmediğinde dosya sessizce bekler.'],
          ],
          examples: [
            {
              title: 'Eksper raporunun beklenmesi ve dosyanın unutulması',
              scenario:
                'Eksper atanıyor ancak rapor gelmiyor. Sistemde "rapor bekleniyor" durumu izlenmediği '
                + 'için dosya altı hafta hareketsiz kalıyor.',
              risk: 'Ödeme gecikiyor, faiz işliyor ve zarar gören şikâyet ediyor.',
              control: 'Eksper raporunun geldi/gelmedi durumunun sistemde izlenmesi ve süre aşımında uyarı üretilmesi.',
              controlType: 'Tespit edici — süre izleme',
              evidence: 'Eksper takip listesi ve uyarı kaydı',
              criticalNote: 'Rapor gelmeden ödeme talebi girilemez.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-09',
              name: 'Hasar tutarının hatalı tespit edilmesi',
              description:
                'Eksper raporunun eksik, fazla veya hatalı değerlendirilmesi sonucu yanlış hasar tutarı belirlenmesi.',
              cause:
                'Rapor içeriğinin ikinci bir gözle kontrol edilmemesi ve yansıtma fatura düzenleme '
                + 'kurallarının sistemde tanımlı olmaması.',
              consequence:
                'Eksik ödemede şikâyet ve faiz, fazla ödemede rücu edilemeyen kayıp.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-03-12',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 31000'],
            },
            {
              code: 'R-HSR-27',
              name: 'Eksper raporunun takip edilmemesi',
              description:
                'Atanan eksperin raporunun gelip gelmediğinin sistemsel olarak izlenmemesi ve '
                + 'dosyanın hareketsiz kalması.',
              cause: 'Eksper atama kaydında rapor durumu alanının ve süre uyarısının bulunmaması.',
              consequence: 'Dosya gecikmesi, faiz yükü ve SLA aşımı.',
              category: 'operational',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-06-30',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-16',
              name: 'Eksper raporu ikinci göz kontrolü',
              description:
                'Belirlenen tutarın üzerindeki maddi zarar dosyalarında eksper raporu ve hesaplanan '
                + 'tutar, dosya sorumlusu dışında ikinci bir uzman tarafından kontrol edilir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['segregation_of_duties', 'monitoring'],
              frequency: 'per_transaction',
              method: 'Eşik üzeri dosyalarda ikinci uzman incelemesi ve sistemde işaretleme.',
              evidence: 'İkinci göz onay kaydı',
              mitigates: ['R-HSR-09'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-27',
              lastTestedAt: '2026-06-14',
              testResult: 'Eşik üzeri 28 dosyanın 26’sında ikinci göz kontrolü yapılmış.',
            },
            {
              code: 'K-HSR-17',
              name: 'Eksper raporu geldi/gelmedi izleme ve süre uyarısı',
              description:
                'Eksper atamasında rapor durumu izlenir; bir hafta içinde rapor gelmezse sistem uyarı '
                + 'üretir ve dosya sorumlusuna görev atar. Gelen evrak kaydedildiğinde durum otomatik güncellenir.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring', 'system'],
              frequency: 'weekly',
              method: 'Eksper takip listesi ve süre aşımı uyarısı.',
              evidence: 'Takip listesi ve uyarı kaydı',
              mitigates: ['R-HSR-27'],
              owner: 'usr-03',
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-26',
              lastTestedAt: '2026-05-25',
              testResult:
                'Takip listesi elle tutuluyor; otomatik uyarı ve "geldi" işaretlemesi yok. Birden fazla eksper ataması da desteklenmiyor.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSR-09',
              name: 'Maddi Hasar Dosya İnceleme Prosedürü',
              type: 'procedure',
              version: '2.4',
              owner: 'usr-03',
              publishedAt: '2025-02-15',
              updatedAt: '2026-03-05',
              nextReviewAt: '2027-02-15',
              summary:
                'Maddi zarar dosyalarında evrak incelemesi, sigortacı/teminat teyidi, eksper yönetimi ve tutar tespiti.',
              sections: [
                {
                  heading: 'Sigortacı ve Teminat Teyidi',
                  body: [
                    'Sigortacı tespit edilemezse büro sigortacı tespit desteği talep edilir.',
                    'Teminat onayı alınmadan ödeme talebi girilemez.',
                    'Teminat yoksa dosya ret değerlendirmesine (1.3.7) yönlendirilir.',
                  ],
                },
                {
                  heading: 'Eksper ve Bilirkişi',
                  body: [
                    'Eşik üzeri dosyalarda eksper atanır; rapor durumu sistemde izlenir.',
                    'Rapor bir hafta içinde gelmezse uyarı üretilir.',
                    'Eşik üzeri tutarlarda rapor ikinci uzman tarafından kontrol edilir.',
                  ],
                },
                {
                  heading: 'Eksik Evrak',
                  body: [
                    'Eksik evrak talebi sistemden zarar görene iletilir ve talep tarihi kaydedilir.',
                    'Yanıt alınamayan dosyalar ret değerlendirmesine yönlendirilir.',
                  ],
                },
              ],
              controlCodes: ['K-HSR-16', 'K-HSR-17'],
            },
          ],
          children: [
            {
              code: 'HSR-09-1',
              name: 'Evrak incelemesi',
              description: 'Dosyadaki evrakın esastan incelenmesi ve eksik evrak tespiti.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dosya evrakı'],
              outputs: ['Eksik evrak listesi'],
            },
            {
              code: 'HSR-09-2',
              name: 'Sigortacı ve teminat teyidi',
              description: 'Yabancı sigortacının tespiti ve teminat onayının alınması.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Yeşil Kart bilgisi'],
              outputs: ['Teminat onayı'],
            },
            {
              code: 'HSR-09-3',
              name: 'Eksper/bilirkişi atama ve rapor takibi',
              description: 'Gerekli dosyalarda eksper atanması ve rapor durumunun izlenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Atama kararı'],
              outputs: ['Eksper raporu'],
              controlRefs: ['K-HSR-17'],
            },
            {
              code: 'HSR-09-4',
              name: 'Zarar tutarının belirlenmesi',
              description: 'Rapor ve evrak üzerinden ödenecek tutarın hesaplanması ve kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Eksper raporu', 'Faturalar'],
              outputs: ['Tespit edilmiş tutar'],
              controlRefs: ['K-HSR-16'],
            },
          ],
        },

        /* ---------- 1.3.2 Bedeni Hasar Dosya İnceleme ---------- */
        {
          code: 'HSR-10',
          name: 'Bedeni Hasar Dosya İnceleme (1.3.2)',
          owner: 'usr-03',
          description:
            'Bedeni zarar dosyalarında tıbbi evrakın incelenmesi, aktüer ve tıbbi bilirkişi ataması, '
            + 'maluliyet ve destekten yoksun kalma hesabının değerlendirilmesi.',
          purpose:
            'Bedeni zarar tazminatının aktüeryal ve tıbbi dayanağa oturmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Tıbbi raporlar', 'Maluliyet raporu', 'Aktüer raporu'],
          outputs: ['Hesaplanmış bedeni tazminat', 'Ret veya ödeme kararı'],
          maturity: 3,
          slaDays: 20,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Aktüer raporu tazminatın dayanağıdır; rapor sisteme kaydedilmediğinde karar denetlenemez hâle gelir.'],
            ['privacy', 'Veri Gizliliği',
              'Tıbbi raporlar özel nitelikli kişisel veridir; yalnızca dosya ekibi erişebilir.'],
          ],
          examples: [
            {
              title: 'Aktüer raporunun sisteme kaydedilmemesi',
              scenario:
                'Aktüer raporu online görüntüleniyor ama dosyaya kaydedilmiyor. Ödeme yapıldıktan sonra '
                + 'rapor talep edildiğinde erişilemiyor.',
              risk: 'Ödeme kararının dayanağı gösterilemiyor; denetim ve rücu aşamasında sorun çıkıyor.',
              control: 'Aktüer raporu dosyaya kaydedilmeden ödeme talebinin girilememesi.',
              controlType: 'Önleyici — kanıt zorunluluğu',
              evidence: 'Dosyaya kayıtlı aktüer raporu',
              criticalNote: 'Rapor kaydı olmadan talep girişi engellenmelidir.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-10',
              name: 'Aktüer raporunun dosyaya kaydedilmemesi',
              description:
                'Aktüer raporunun yalnızca online görüntülenip dosyaya kaydedilmemesi ve ödeme '
                + 'kararının dayanağının belgelenememesi.',
              cause: 'Raporun sisteme yüklenmesinin zorunlu olmaması.',
              consequence:
                'Ödeme kararının denetlenememesi, rücu aşamasında yurt dışı büronun belge talebine yanıt verilememesi.',
              category: 'compliance',
              inherent: [4, 4],
              residual: [3, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-07-21',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-18',
              name: 'Aktüer raporu kaydı olmadan talep girişinin engellenmesi',
              description:
                'Bedeni zarar dosyalarında aktüer veya tıbbi bilirkişi raporu dosyaya kaydedilmeden '
                + 'ödeme talebi girilemez; sistem talep girişini bloke eder.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Talep girişi ön koşulu olarak rapor eki kontrolü.',
              evidence: 'Rapor eki ve engellenen talep logu',
              mitigates: ['R-HSR-10'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-25',
              lastTestedAt: '2026-06-08',
              testResult:
                'Bloke mekanizması yok; rapor eklenmesi prosedürel olarak isteniyor. 18 dosyanın 5’inde rapor eki bulunamadı.',
            },
          ],
          children: [
            {
              code: 'HSR-10-1',
              name: 'Tıbbi evrak incelemesi',
              description: 'Hastane raporları, epikriz ve maluliyet raporlarının incelenmesi.',
              systems: ['DYS'],
              inputs: ['Tıbbi evrak'],
              outputs: ['İnceleme notu'],
            },
            {
              code: 'HSR-10-2',
              name: 'Aktüer ve tıbbi bilirkişi ataması',
              description: 'Sistemden aktüer veya tıbbi bilirkişi atanması ve talep gönderimi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Atama kararı'],
              outputs: ['Aktüer/bilirkişi raporu'],
              controlRefs: ['K-HSR-18'],
            },
            {
              code: 'HSR-10-3',
              name: 'Tazminat hesabının değerlendirilmesi',
              description: 'Maluliyet ve destekten yoksun kalma hesabının değerlendirilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Aktüer raporu'],
              outputs: ['Hesaplanmış tazminat'],
            },
          ],
        },

        /* ---------- 1.3.3 ZK Süreci ---------- */
        {
          code: 'HSR-11',
          name: 'ZK Süreci (1.3.3)',
          owner: 'usr-04',
          description:
            'Zorunlu Karşılama (ZK) kapsamındaki taleplerin değerlendirilmesi, matbu yazışmaların '
            + 'hazırlanması ve mükerrer taleplerin ayıklanması.',
          purpose: 'ZK taleplerinin tek elden, tutarlı ve mükerrersiz yürütülmesini sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['ZK talebi'],
          outputs: ['ZK yanıt yazısı', 'Düzeltme kaydı'],
          maturity: 2,
          slaDays: 7,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['control', 'Kontrol Noktası',
              'Aynı konuda birden fazla talep gelebildiği için dosya açılışında mükerrerlik uyarısı şarttır.'],
          ],
          risks: [
            {
              code: 'R-HSR-11',
              name: 'Aynı konuda mükerrer ZK dosyası açılması',
              description:
                'Aynı olayla ilgili birden fazla talep geldiğinde sistemin uyarı üretmemesi ve '
                + 'mükerrer dosya açılması.',
              cause: 'Dosya açılışında geçmiş talep sorgusunun yapılmaması.',
              consequence: 'Mükerrer işlem, çelişkili yanıt ve mükerrer ödeme riski.',
              category: 'operational',
              inherent: [4, 3],
              residual: [3, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-04',
              identifiedAt: '2025-08-27',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-19',
              name: 'Dosya açılışında geçmiş talep uyarısı',
              description:
                'Aynı kaza veya taraf bilgisiyle daha önce talep açılmışsa sistem dosya açılışında '
                + 'uyarı üretir ve kullanıcıyı mevcut dosyaya yönlendirir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Kaza tarihi, plaka ve taraf bilgisiyle mükerrerlik sorgusu.',
              evidence: 'Mükerrerlik uyarı logu',
              mitigates: ['R-HSR-11'],
              owner: 'usr-04',
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'ineffective',
              strength: 1,
              lastPerformedAt: '2026-08-20',
              lastTestedAt: '2026-05-12',
              testResult: 'Uyarı mekanizması yok; mükerrerlik ancak dosya sorumlusunun fark etmesiyle yakalanıyor.',
            },
          ],
          children: [
            {
              code: 'HSR-11-1',
              name: 'ZK talebinin değerlendirilmesi',
              description: 'Talebin ZK kapsamına girip girmediğinin değerlendirilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['ZK talebi'],
              outputs: ['Kapsam kararı'],
              controlRefs: ['K-HSR-19'],
            },
            {
              code: 'HSR-11-2',
              name: 'Yanıt yazısının hazırlanması',
              description: 'Matbu yazının hazırlanıp sistemden ve Outlook üzerinden gönderilmesi.',
              systems: ['Büro Hasar Sistemi', 'Outlook'],
              inputs: ['Kapsam kararı'],
              outputs: ['Yanıt yazısı'],
            },
          ],
        },

        /* ---------- 1.3.4 Talep Girişi ---------- */
        {
          code: 'HSR-12',
          name: 'Talep Girişi (1.3.4)',
          owner: 'usr-03',
          participants: ['usr-04', 'usr-08'],
          description:
            'Tespit edilen tutarın ödeme talebi olarak sisteme girilmesi: para birimi, IBAN, stopaj, '
            + 'KDV, tevkifat ve yansıtma faturası ayrımlarının yapılması.',
          purpose: 'Ödeme talebinin vergisel ve hukuki olarak doğru kurgulanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Oracle'],
          inputs: ['Tespit edilmiş tutar', 'IBAN ve alıcı bilgisi'],
          outputs: ['Sisteme girilmiş ödeme talebi'],
          maturity: 3,
          slaDays: 2,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Gerçek kişilere yapılan bedeni tazminat ödemelerinde stopaj ve tevkifat limitleri ayrı hesaplanır.'],
            ['financial', 'Finansal Etki',
              'Yabancı para talebinde bildirilen para biriminden ödeme yapılır; TL karşılığı geri bildirilir.'],
            ['authorization', 'Yetki Kontrolü',
              'Talep girişi yapılan miktarların teminat limitlerini aşıp aşmadığı mutlaka kontrol '
              + 'edilir; aşılması hâlinde aşan kısım için yabancı sigortacıdan ayrıca ve açıkça '
              + 'ödeme onayı istenir (Madde 18/4).'],
            ['authorization', 'Yetki Kontrolü',
              'Talep girişi yapılan dosyalar birim yöneticisine verilir; yalnızca onaylanan '
              + 'talepler Güvence Hesabından talep edilir (Madde 18/4).'],
          ],
          examples: [
            {
              title: 'Sirküler dışı tutarla talep girilmesi',
              scenario:
                'Dosya sorumlusu, büro sirkülerinde tanımlı azami tedvir ücretinin üzerinde bir tutarla '
                + 'talep giriyor; sistem tutar sınırını kontrol etmiyor.',
              risk: 'Sirküler dışı ödeme yapılıyor, rücu aşamasında yurt dışı büro fazla kısmı reddediyor.',
              control: 'Talep tutarının sirkülerde tanımlı sınırlara karşı sistemsel kontrolü.',
              controlType: 'Önleyici — parametrik limit kontrolü',
              evidence: 'Sirküler parametre tablosu ve talep girişi logu',
              criticalNote: 'Sirküler üzeri talepler yönetici onayı olmadan girilemez.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-12',
              name: 'Talep tutarının sirküler sınırlarına aykırı girilmesi',
              description:
                'Büro sirkülerinde tanımlı tedvir ücreti ve tutar sınırlarının sistemsel olarak '
                + 'kontrol edilmemesi.',
              cause: 'Sirküler parametrelerinin sisteme tanımlanmamış olması.',
              consequence: 'Rücu edilemeyen fazla ödeme ve yurt dışı büro itirazı.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-04-30',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
            {
              code: 'R-HSR-28',
              name: 'Tramer kaydı olmayan talebin ödemeye girmesi',
              description:
                'Tramer (AKTT) seçili dosyalarda giriş numarasının bulunup bulunmadığının kontrol '
                + 'edilmemesi.',
              cause: 'Tramer giriş numarası alanının zorunlu olmaması.',
              consequence: 'Kayıt dışı ödeme, mutabakat farkı ve denetim bulgusu.',
              category: 'compliance',
              inherent: [3, 4],
              residual: [2, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-10-22',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-20',
              name: 'Sirküler esaslı talep tutarı kontrolü',
              description:
                'Talep girişinde tutar, sirkülerde tanımlı tedvir ücreti ve azami sınırlara karşı '
                + 'kontrol edilir; sınır aşımında yönetici onayı istenir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'authorization'],
              frequency: 'per_transaction',
              method: 'Sirküler parametre tablosu ile talep tutarının karşılaştırılması.',
              evidence: 'Parametre tablosu ve onay kaydı',
              mitigates: ['R-HSR-12'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-26',
              lastTestedAt: '2026-06-16',
              testResult:
                'Parametre tablosu var ama talep girişinde bloke etmiyor; yalnızca raporda görünüyor.',
            },
            {
              code: 'K-HSR-21',
              name: 'Tramer giriş numarası zorunluluğu',
              description:
                'Tramer (AKTT) seçili dosyalarda giriş numarası alanı zorunludur; boş bırakılan '
                + 'talepler kaydedilemez.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['data_validation', 'system'],
              frequency: 'per_transaction',
              method: 'Talep girişinde koşullu zorunlu alan denetimi.',
              evidence: 'Talep kaydı ve alan denetim logu',
              mitigates: ['R-HSR-28'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-26',
              lastTestedAt: '2026-07-08',
              testResult: 'Tramer seçili 45 talebin tamamında giriş numarası mevcut.',
            },
          ],
          children: [
            {
              code: 'HSR-12-1',
              name: 'Para birimi ve alıcı bilgilerinin girilmesi',
              description: 'Talep para biriminin, IBAN ve alıcı bilgilerinin girilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Alıcı bilgisi'],
              outputs: ['Ödeme bilgileri'],
            },
            {
              code: 'HSR-12-2',
              name: 'Vergisel ayrımların yapılması',
              description: 'Gerçek/tüzel kişi ayrımı, stopaj, tevkifat limiti ve KDV tutarının ayrı girilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Alıcı türü', 'Fatura bilgisi'],
              outputs: ['Vergisel kırılım'],
              controlRefs: ['K-HSR-21'],
            },
            {
              code: 'HSR-12-3',
              name: 'Tutar kontrolü ve talebin kaydı',
              description: 'Sirküler sınırlarına göre tutar kontrolü ve talebin kaydedilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Vergisel kırılım'],
              outputs: ['Sisteme girilmiş talep'],
              controlRefs: ['K-HSR-20'],
            },
          ],
        },

        /* ---------- 1.3.5 Rücu İşlemleri ---------- */
        {
          code: 'HSR-13',
          name: 'Rücu İşlemleri (1.3.5)',
          owner: 'usr-03',
          participants: ['usr-08'],
          description:
            'Ödenen tazminatın ilgili ülke bürosuna veya yabancı sigortacıya faturalandırılarak '
            + 'rücu edilmesi, tedvir ücretinin hesaplanması ve dosya kapanışı.',
          purpose: 'Büronun ödediği tutarın eksiksiz ve zamanında geri alınmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Oracle', 'Outlook'],
          inputs: ['Ödeme dekontu', 'Dosya bilgileri'],
          outputs: ['Rücu faturası', 'Kapatılmış dosya'],
          maturity: 3,
          slaDays: 10,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['financial', 'Finansal Etki',
              'Rücu edilmeyen her ödeme doğrudan zarardır; faturalama gecikmesi tahsilat riskini artırır.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Parası gelmeyen taleplerde önce yurt dışındaki sigorta şirketine, ardından ilgili '
              + 'ülke Bürosuna G. Call öncesi yazı yazılır; süre geçerse Garanti Çağrısı (G. Call) '
              + 'prosedürü uygulanır ve bu aşamada son bir kontrol yapılır (Madde 20/3-4).'],
          ],
          examples: [
            {
              title: 'Dekont olmadan fatura kesilmesi',
              scenario:
                'Ödeme yapıldığı varsayılarak rücu faturası kesiliyor, ancak dekont dosyaya '
                + 'eklenmemiş. Yurt dışı büro dekont istiyor ve fatura askıda kalıyor.',
              risk: 'Tahsilat gecikiyor, fatura iptal ve yeniden düzenleme gerekiyor.',
              control: 'Ödeme dekontu dosyaya eklenmeden fatura basımının engellenmesi.',
              controlType: 'Önleyici — kanıt zorunluluğu',
              evidence: 'Dosyadaki dekont ve fatura kaydı',
              criticalNote: 'Dekont yoksa muhasebeden talep edilir, fatura beklemeye alınır.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-13',
              name: 'Rücu faturasının eksik belgeyle veya geç düzenlenmesi',
              description:
                'Ödeme dekontu dosyaya eklenmeden fatura kesilmesi ya da son fatura bildiriminin '
                + 'yapılmaması nedeniyle rücu sürecinin uzaması.',
              cause:
                'Fatura basımında dekont kontrolünün bulunmaması ve Oracle fatura gönderiminde '
                + 'eklerin otomatik iliştirilmemesi.',
              consequence: 'Tahsilat gecikmesi, kur farkı zararı ve tahsil edilemeyen alacak.',
              category: 'financial',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-05-08',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-22',
              name: 'Dekont kontrolü olmadan fatura basımının engellenmesi',
              description:
                'Rücu faturası, ödeme dekontu dosyaya eklenmeden basılamaz; dekont yoksa sistem '
                + 'muhasebeye dekont talebi görevi açar.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'Fatura basım ekranında dekont eki ön koşulu.',
              evidence: 'Dekont eki ve fatura kaydı',
              mitigates: ['R-HSR-13'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-24',
              lastTestedAt: '2026-06-26',
              testResult:
                'Kontrol çalışıyor. Oracle fatura gönderiminde ekler elle iliştiriliyor; toplu faturada hata alınıyor.',
            },
          ],
          children: [
            {
              code: 'HSR-13-1',
              name: 'Dekont kontrolü',
              description: 'Ödeme dekontunun dosyada bulunup bulunmadığının kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Ödeme kaydı'],
              outputs: ['Dekont teyidi'],
              controlRefs: ['K-HSR-22'],
            },
            {
              code: 'HSR-13-2',
              name: 'Tedvir ücreti hesabı ve fatura basımı',
              description: 'Tedvir ücretinin hesaplanması, TL veya Euro faturanın PDF olarak basılması.',
              systems: ['Oracle'],
              inputs: ['Ödenen tutar', 'Tedvir parametreleri'],
              outputs: ['Rücu faturası'],
            },
            {
              code: 'HSR-13-3',
              name: 'Faturanın sigortacıya gönderilmesi ve dosya kapanışı',
              description: 'Fatura ve dekontların e-posta ile iletilmesi, dosya/alt dosya kapatılması.',
              systems: ['Oracle', 'Outlook', 'Büro Hasar Sistemi'],
              inputs: ['Rücu faturası'],
              outputs: ['Gönderim kaydı', 'Kapatılmış dosya'],
            },
          ],
        },

        /* ---------- 1.3.6 Garanti Çağrısı ---------- */
        {
          code: 'HSR-14',
          name: 'Garanti Çağrısı — G Call (1.3.6)',
          owner: 'usr-03',
          description:
            'Rücu faturasına rağmen ödemesi gelmeyen dosyalarda, Yeşil Kart sistemi kuralları '
            + 'çerçevesinde ilgili ülke bürosuna garanti çağrısı yapılması.',
          purpose: 'Tahsil edilemeyen alacakların sistem garantisi kapsamında geri alınmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'Outlook'],
          inputs: ['Ödemesi gelmeyen rücu faturası'],
          outputs: ['G Call yazısı', 'Tahsilat'],
          maturity: 2,
          slaDays: 15,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Garanti çağrısı Yeşil Kart sistemi kurallarındaki süre ve biçim şartlarına uymak zorundadır.'],
          ],
          examples: [
            {
              title: 'E+60 gün takibinin yapılmaması',
              scenario:
                'Fatura gönderildikten 60 gün sonra ödeme gelmemiş, ancak hatırlatma üretilmediği için '
                + 'garanti çağrısı hiç başlatılmıyor.',
              risk: 'Sistem kurallarındaki süre kaçırılıyor ve alacak tahsil edilemez hâle geliyor.',
              control: 'Ödemesi gelmeyen dosyalarda 60 günün sonunda otomatik G Call hatırlatması.',
              controlType: 'Tespit edici — süre izleme',
              evidence: 'G Call hatırlatma listesi',
              criticalNote: 'Hatırlatma üretilmeyen dosyalar aylık alacak yaşlandırma raporunda yakalanmalıdır.',
            },
          ],
          risks: [
            {
              code: 'R-HSR-14',
              name: 'Garanti çağrısı süresinin kaçırılması',
              description:
                'Rücu faturası sonrası 60 gün içinde ödeme gelmeyen dosyalarda garanti çağrısının '
                + 'zamanında başlatılmaması.',
              cause: 'Süre takibinin sistemsel hatırlatmaya bağlanmamış olması.',
              consequence: 'Sistem garantisinden yararlanılamaması ve alacağın zarar yazılması.',
              category: 'financial',
              inherent: [4, 5],
              residual: [3, 5],
              target: [2, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-06-11',
              lastAssessedAt: '2026-03-05',
              standards: ['Yeşil Kart Sistemi', 'COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-23',
              name: 'E+60 gün garanti çağrısı hatırlatması',
              description:
                'Rücu faturası gönderiminden 60 gün sonra ödemesi gelmeyen dosyalar için sistem '
                + 'otomatik hatırlatma üretir ve garanti çağrısı görevi açar.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring', 'system'],
              frequency: 'daily',
              method: 'Fatura tarihine göre günlük yaşlandırma taraması.',
              evidence: 'Hatırlatma listesi ve görev kaydı',
              mitigates: ['R-HSR-14'],
              owner: 'usr-03',
              key: true,
              coso: 'monitoring',
              design: 'needs_improvement',
              effectiveness: 'ineffective',
              strength: 1,
              lastPerformedAt: '2026-08-28',
              lastTestedAt: '2026-05-20',
              testResult:
                'Otomatik hatırlatma yok; takip elle tutulan listeyle yapılıyor. 60 günü aşan 11 dosyada çağrı başlatılmamış.',
            },
          ],
          kris: [
            {
              code: 'KRI-HSR-02',
              name: '60 günü aşan rücu alacağı adedi',
              definition:
                'Rücu faturası gönderiminden bu yana 60 günü aşmış ve tahsil edilmemiş dosya adedi. '
                + 'Garanti çağrısı disiplininin göstergesidir.',
              riskCode: 'R-HSR-14',
              owner: 'usr-03',
              unit: 'U-HSR',
              frequency: 'monthly',
              direction: 'lower_better',
              greenMax: 5,
              amberMax: 12,
              readings: [7, 8, 6, 9, 11, 10, 13, 14, 12, 15, 16, 18],
            },
          ],
          actions: [
            {
              code: 'AKS-008',
              title: 'E+60 gün garanti çağrısı hatırlatmasının kurulması',
              description:
                'Rücu faturası sonrası 60 günü aşan ve ödemesi gelmeyen dosyalar için otomatik hatırlatma '
                + 've görev üretimi; GC yanıtlarının sisteme otomatik kaydı.',
              riskCode: 'R-HSR-14',
              controlCode: 'K-HSR-23',
              owner: 'usr-11',
              dueDate: '2026-12-15',
              priority: 'critical',
              status: 'open',
              progress: 0,
              source: 'internal_audit',
              createdAt: '2026-07-22',
              createdBy: 'usr-24',
            },
            {
              code: 'AKS-009',
              title: 'Rücu ve garanti çağrısı takibinin geriye dönük taranması',
              description:
                'Son 24 ayda faturası kesilmiş ancak tahsil edilmemiş dosyaların taranarak garanti çağrısı '
                + 'süresi kaçırılmış olanların tespiti ve mümkün olanların yeniden işletilmesi.',
              riskCode: 'R-HSR-14',
              controlCode: 'K-HSR-23',
              owner: 'usr-03',
              dueDate: '2026-10-15',
              priority: 'critical',
              status: 'in_progress',
              progress: 55,
              source: 'internal_audit',
              createdAt: '2026-07-22',
              createdBy: 'usr-24',
              evidence: 'İç Denetim 2026-07 raporu, bulgu no 2',
            },
          ],
          children: [
            {
              code: 'HSR-14-1',
              name: 'Ödeme gelmeyen dosyaların tespiti',
              description: 'Fatura sonrası 60 gün geçen ve ödemesi gelmeyen dosyaların listelenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Rücu faturaları'],
              outputs: ['G Call bekleyen liste'],
              controlRefs: ['K-HSR-23'],
            },
            {
              code: 'HSR-14-2',
              name: 'Garanti çağrısı yazısının hazırlanması',
              description: 'Section-3 formunun doldurulması ve ülke bürosuna gönderilmesi.',
              systems: ['Outlook'],
              inputs: ['G Call bekleyen dosya'],
              outputs: ['G Call yazısı'],
            },
            {
              code: 'HSR-14-3',
              name: 'Yanıt ve tahsilat takibi',
              description: 'Büro yanıtının kaydı ve ödemenin gelip gelmediğinin kontrolü.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Büro yanıtı'],
              outputs: ['Tahsilat kaydı'],
            },
          ],
        },

        /* ---------- 1.3.7 Ret Değerlendirme ---------- */
        {
          code: 'HSR-15',
          name: 'Ret Değerlendirme (1.3.7)',
          owner: 'usr-03',
          description:
            'Teminat dışı, zamanaşımına uğramış veya evrakı tamamlanmayan taleplerin gerekçeli '
            + 'olarak reddedilmesi ve ret yazısının iletilmesi.',
          purpose: 'Reddedilen taleplerin gerekçesinin tutarlı, hukuken savunulabilir ve izlenebilir olmasını sağlamak.',
          systems: ['Büro Hasar Sistemi'],
          inputs: ['Ret kararı gerektiren dosya'],
          outputs: ['Ret yazısı', 'Ret nedeni kaydı'],
          maturity: 2,
          slaDays: 5,
          lastReviewedAt: '2026-03-05',
          critical: [
            ['regulatory', 'Hukuki Sonuç',
              'Ret gerekçesi dava dosyasının temelini oluşturur; standart dışı gerekçeler savunmayı zayıflatır.'],
          ],
          risks: [
            {
              code: 'R-HSR-15',
              name: 'Ret yazılarının standart dışı ve elle hazırlanması',
              description:
                'Ret gerekçelerinin sistemde tanımlı liste yerine elle yazılması ve gerekçelerin '
                + 'dosyadan dosyaya farklılaşması.',
              cause:
                'Sistemdeki ret nedeni listesinin yetersiz olması ve kullanıcının yeni neden ekleyememesi.',
              consequence:
                'Tutarsız gerekçe, hukuki savunmanın zayıflaması ve ret istatistiklerinin üretilememesi.',
              category: 'compliance',
              inherent: [3, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-09-04',
              lastAssessedAt: '2026-03-05',
              standards: ['COSO', 'ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-24',
              name: 'Standart ret nedeni listesi ve matbu yazı',
              description:
                'Ret nedenleri sistemde tanımlı listeden seçilir ve ret yazısı matbu şablondan '
                + 'üretilir; yeni neden ihtiyacı hukuk onayıyla listeye eklenir.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['data_validation', 'authorization'],
              frequency: 'per_transaction',
              method: 'Ret nedeni seçim listesi ve şablon yazı üretimi.',
              evidence: 'Ret nedeni kaydı ve üretilen yazı',
              mitigates: ['R-HSR-15'],
              owner: 'usr-09',
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-22',
              lastTestedAt: '2026-06-02',
              testResult:
                'Liste var ama dar; 22 ret yazısının 9’u serbest metinle yazılmış. Kullanıcı yeni neden ekleyemiyor.',
            },
          ],
          children: [
            {
              code: 'HSR-15-1',
              name: 'Ret gerekçesinin belirlenmesi',
              description: 'Teminat, zamanaşımı veya evrak eksikliği gerekçelerinin değerlendirilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Dosya inceleme sonucu'],
              outputs: ['Ret gerekçesi'],
              controlRefs: ['K-HSR-24'],
            },
            {
              code: 'HSR-15-2',
              name: 'Ret yazısının iletilmesi',
              description: 'Matbu ret yazısının üretilip talep sahibine gönderilmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Ret gerekçesi'],
              outputs: ['Ret yazısı'],
            },
          ],
        },

        /* ---------- 1.3.9 Tramer Değerlendirme ---------- */
        {
          code: 'HSR-16',
          name: 'Tramer Değerlendirme (1.3.9)',
          owner: 'usr-04',
          description:
            'Tramer üzerinden gelen kaza ve hasar kayıtlarının dosyayla karşılaştırılması, '
            + 'tutanak takibi ve mükerrer kayıt tespiti.',
          purpose: 'Dosya bilgisinin sektör kayıtlarıyla tutarlı olmasını sağlamak.',
          systems: ['Tramer', 'Büro Hasar Sistemi'],
          inputs: ['Tramer kaydı', 'Kaza tespit tutanağı'],
          outputs: ['Tutarlılık teyidi'],
          maturity: 3,
          slaDays: 3,
          lastReviewedAt: '2026-03-05',
          risks: [
            {
              code: 'R-HSR-16',
              name: 'Kaza tespit tutanağının takip edilmemesi',
              description:
                'Tramer üzerinden beklenen kaza tespit tutanağının gelip gelmediğinin izlenmemesi.',
              cause: 'Tutanak bekleyen dosyalar için hafta içi uyarı üretilmemesi.',
              consequence: 'Dosyanın eksik belgeyle ilerlemesi ve sonradan düzeltme gereği.',
              category: 'operational',
              inherent: [3, 3],
              residual: [2, 3],
              target: [2, 2],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-04',
              identifiedAt: '2025-11-18',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-25',
              name: 'Tutanak bekleyen dosya haftalık uyarısı',
              description:
                'Kaza tespit tutanağı beklenen dosyalar hafta içinde gelmezse sistem uyarı üretir.',
              nature: 'detective',
              execution: 'automated',
              categories: ['monitoring'],
              frequency: 'weekly',
              method: 'Tutanak bekleyen dosya listesi ve süre uyarısı.',
              evidence: 'Uyarı listesi',
              mitigates: ['R-HSR-16'],
              owner: 'usr-04',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-25',
              lastTestedAt: '2026-06-19',
              testResult: 'Uyarı üretiliyor ancak kapatma takibi yapılmıyor.',
            },
          ],
          children: [
            {
              code: 'HSR-16-1',
              name: 'Tramer kaydının sorgulanması',
              description: 'Kaza ve hasar kayıtlarının Tramer üzerinden sorgulanması.',
              systems: ['Tramer'],
              inputs: ['Plaka', 'Kaza tarihi'],
              outputs: ['Tramer kaydı'],
            },
            {
              code: 'HSR-16-2',
              name: 'Dosya ile karşılaştırma',
              description: 'Tramer kaydının dosya bilgileriyle karşılaştırılması ve tutanak takibi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Tramer kaydı'],
              outputs: ['Tutarlılık teyidi'],
              controlRefs: ['K-HSR-25'],
            },
          ],
        },

        /* ---------- 1.3.11 Eksper Değerlendirme ---------- */
        {
          code: 'HSR-17',
          name: 'Eksper Başvuruları Değerlendirme (1.3.11)',
          owner: 'usr-05',
          description:
            'Büro eksper havuzuna yapılan başvuruların değerlendirilmesi, yetkinlik kontrolü ve '
            + 'onaylı eksper listesinin güncellenmesi.',
          purpose: 'Dosyalara yalnızca yetkinliği doğrulanmış eksperlerin atanmasını sağlamak.',
          systems: ['Büro Hasar Sistemi', 'DYS'],
          inputs: ['Eksper başvuru dosyası'],
          outputs: ['Onaylı eksper listesi'],
          maturity: 3,
          slaDays: 15,
          lastReviewedAt: '2026-03-05',
          risks: [
            {
              code: 'R-HSR-17',
              name: 'Onaylı eksper listesinin güncel tutulmaması',
              description:
                'Ruhsatı sona ermiş veya yetkinliği düşen eksperlerin listeden çıkarılmaması.',
              cause: 'Liste güncellemesinin dönemsel bir kontrole bağlanmamış olması.',
              consequence: 'Yetkisiz eksper ataması, raporun geçersizliği ve dosyanın yeniden açılması.',
              category: 'supplier',
              inherent: [3, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'cautious',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-12-10',
              lastAssessedAt: '2026-03-05',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSR-26',
              name: 'Eksper ruhsat geçerliliği dönemsel kontrolü',
              description:
                'Onaylı eksper listesindeki ruhsat geçerlilik tarihleri üç ayda bir kontrol edilir; '
                + 'süresi dolanlar listeden otomatik çıkarılır.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring', 'authorization'],
              frequency: 'quarterly',
              method: 'Ruhsat tarihi taraması ve liste güncellemesi.',
              evidence: 'Liste güncelleme kaydı',
              mitigates: ['R-HSR-17'],
              owner: 'usr-05',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-07-15',
              lastTestedAt: '2026-07-15',
              testResult: 'Q3 kontrolünde ruhsatı dolan 3 eksper listeden çıkarıldı.',
            },
          ],
          children: [
            {
              code: 'HSR-17-1',
              name: 'Başvuru evrakının incelenmesi',
              description: 'Eksper ruhsatı, referans ve uzmanlık alanının doğrulanması.',
              systems: ['DYS'],
              inputs: ['Başvuru dosyası'],
              outputs: ['İnceleme sonucu'],
            },
            {
              code: 'HSR-17-2',
              name: 'Listeye ekleme ve dönemsel gözden geçirme',
              description: 'Onaylanan eksperin listeye eklenmesi ve ruhsat geçerliliğinin izlenmesi.',
              systems: ['Büro Hasar Sistemi'],
              inputs: ['Onay kararı'],
              outputs: ['Onaylı eksper listesi'],
              controlRefs: ['K-HSR-26'],
            },
          ],
        },
      ],
    },
  ],
};
