import type { NodeSpec } from '../spec';

/**
 * YURT DIŞI HASAR YÖNETİMİ
 *
 * Yurt içi hasardan farkı kozmetik değil: hasar yurt dışında gerçekleştiği
 * için sigortacı olay yerinde değildir. Süreç bir asistans şirketi ve yerel
 * muhabir/eksper ağı üzerinden yürür; evraklar yabancı dilde ve çoğu zaman
 * konsolosluk/apostil onaylıdır; tazminat döviz cinsinden hesaplanıp
 * uluslararası transferle ödenir. Bunların her biri yurt içinde
 * bulunmayan riskler doğurur — kur farkı, sahte yabancı evrak, asistans
 * şirketinin performansı, yaptırım (sanctions) taraması gibi.
 */
export const yurtDisiHasar: NodeSpec = {
  code: 'HSD',
  name: 'Yurt Dışı Hasar Yönetimi',
  unit: 'U-HSR',
  owner: 'usr-02',
  participants: ['usr-02', 'usr-03', 'usr-05'],
  processClass: 'core',
  standards: ['COSO', 'ISO 31000', 'ISO 9001', 'SEDDK Hasar Yönetmeliği', 'MASAK'],
  description:
    'Sigortalının yurt dışında uğradığı hasarın asistans şirketi ve yerel muhabir ağı üzerinden '
    + 'tespit edilmesinden, döviz cinsinden tazminatın uluslararası transferle ödenmesine kadar geçen süreç.',
  purpose:
    'Yurt dışında gerçekleşen hasarlarda sigortalıya olay yerinde destek sağlamak ve tazminatı '
    + 'doğru kur, doğru teminat ve mevzuata uygun evrakla ödemek.',
  customer: 'Yurt dışındaki sigortalı / hak sahibi',
  slaDays: 25,
  maturity: 3,
  version: '2.4',
  lastReviewedAt: '2026-01-22',
  reviewFrequencyMonths: 12,
  updatedAt: '2026-08-14',
  systems: ['HasarNet', 'PoliçeCore', 'AsistansPortal', 'DocVault', 'SWIFT Gateway', 'TCMB Kur Servisi'],
  inputs: ['Yurt dışı hasar ihbarı', 'Seyahat/nakliyat poliçesi', 'Yabancı dil hasar evrakı'],
  outputs: ['Döviz cinsinden tazminat ödemesi', 'Kapatılmış yurt dışı hasar dosyası', 'Muallak karşılık kaydı'],

  children: [
    /* ============================================================ */
    /* ALT SÜREÇ A — İhbar ve Asistans Koordinasyonu                 */
    /* ============================================================ */
    {
      code: 'HSD-A',
      name: 'İhbar ve Asistans Koordinasyonu',
      owner: 'usr-03',
      description:
        'Yurt dışından gelen ihbarın alınması, teminat ve coğrafi kapsam doğrulaması ve '
        + 'asistans şirketinin devreye alınması.',
      purpose:
        'Sigortalının bulunduğu ülkede en kısa sürede desteğe ulaşmasını ve dosyanın doğru '
        + 'teminatla açılmasını sağlamak.',
      systems: ['AsistansPortal', 'PoliçeCore', 'HasarNet'],
      inputs: ['Uluslararası çağrı', 'Poliçe ve teminat bilgisi'],
      outputs: ['Açılmış yurt dışı hasar dosyası', 'Asistans görev numarası'],
      maturity: 3,
      slaDays: 1,

      children: [
        /* ---------- 1. Yurt Dışı İhbarın Alınması ---------- */
        {
          code: 'HSD-01',
          name: 'Yurt Dışı İhbarın Alınması',
          owner: 'usr-03',
          participants: ['usr-04'],
          description:
            'Sigortalının yurt dışından 7/24 uluslararası hattı arayarak ya da mobil uygulamadan '
            + 'yaptığı hasar bildiriminin alınması; olay ülkesi, saat dilimi ve iletişim bilgisinin kaydı.',
          purpose: 'İhbarın saat dilimi farkına rağmen kesintisiz alınmasını ve doğru kaydedilmesini sağlamak.',
          systems: ['AsistansPortal', 'CRM360'],
          inputs: ['Sigortalı beyanı', 'Poliçe numarası', 'Olay ülkesi ve tarihi'],
          outputs: ['Yurt dışı ihbar kaydı', 'Geri arama planı'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-01-22',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Seyahat sağlık poliçelerinde acil tıbbi durum ihbarı anında değerlendirilmek zorundadır; gecikme sağlık riskine dönüşür.'],
            ['privacy', 'Veri Gizliliği',
              'Yurt dışı sağlık hasarlarında tedavi bilgisi özel nitelikli kişisel veridir; sınır ötesi veri aktarımı KVKK m.9 kapsamındadır.'],
          ],
          examples: [
            {
              title: 'Saat dilimi farkı nedeniyle geri dönülemeyen ihbar',
              scenario:
                'Sigortalı Türkiye saatiyle gece 03:00’te Bangkok’tan arıyor; nöbetçi ekip ihbarı alıyor ama '
                + 'geri arama saatini yerel saate göre değil Türkiye saatine göre planlıyor.',
              risk: 'Sigortalı yerel saatle gece yarısı aranıyor, ulaşılamıyor ve tedavi süreci onaysız ilerliyor.',
              control: 'İhbar formunda olay ülkesinin seçilmesi ve geri arama saatinin sistem tarafından yerel saate çevrilmesi.',
              controlType: 'Önleyici — otomatik sistem kontrolü',
              evidence: 'AsistansPortal geri arama planı ve saat dilimi logu',
              criticalNote: 'Ülke seçilmeden ihbar kaydedilemez.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-01',
              name: 'Olay ülkesinin poliçe coğrafi kapsamı dışında olması',
              description:
                'Sigortalının hasarı, poliçenin teminat verdiği coğrafi bölge dışında bir ülkede gerçekleşmiş '
                + 'olmasına rağmen dosyanın açılması ve asistans hizmetinin başlatılması.',
              cause: 'Coğrafi kapsamın ihbar anında sorgulanmaması; poliçe metnindeki bölge tanımının yoruma açık olması.',
              consequence: 'Teminat dışı hizmetin sigortacı tarafından üstlenilmesi ve geri alınamayan asistans maliyeti.',
              category: 'operational',
              inherent: [4, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-03',
              identifiedAt: '2025-04-11',
              lastAssessedAt: '2026-01-22',
              standards: ['COSO', 'ISO 31000'],
            },
            {
              code: 'R-HSD-02',
              name: 'Yaptırım kapsamındaki ülkeye ödeme yapılması',
              description:
                'Hasarın, uluslararası yaptırım listesinde bulunan bir ülkede gerçekleşmesi ve '
                + 'ödemenin yaptırım taraması yapılmadan sürece girmesi.',
              cause: 'Ülke ve taraf taramasının ihbar aşamasında değil ödeme aşamasında yapılması.',
              consequence: 'Muhabir bankanın işlemi bloke etmesi, MASAK bildirimi ve itibar kaybı.',
              category: 'compliance',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'up',
              owner: 'usr-22',
              identifiedAt: '2025-09-02',
              lastAssessedAt: '2026-01-22',
              standards: ['MASAK', 'COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-01',
              name: 'Coğrafi kapsam otomatik doğrulaması',
              description:
                'İhbar formunda seçilen olay ülkesi, poliçenin coğrafi teminat bölgesiyle sistem tarafından '
                + 'karşılaştırılır; kapsam dışıysa dosya açılamaz, istisna onayı istenir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system'],
              frequency: 'per_transaction',
              method: 'PoliçeCore coğrafi bölge tablosu ile olay ülkesinin eşleştirilmesi.',
              evidence: 'Sistem doğrulama logu ve istisna onay kaydı',
              mitigates: ['R-HSD-01'],
              owner: 'usr-03',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-14',
              lastTestedAt: '2026-05-20',
              testResult: '120 örnek ihbarda kapsam dışı 6 vaka tespit edildi, tamamı bloke edildi.',
            },
            {
              code: 'K-HSD-02',
              name: 'İhbar anında yaptırım ve ülke taraması',
              description:
                'Olay ülkesi ve sigortalı bilgileri, dosya açılışında uluslararası yaptırım listelerine karşı taranır; '
                + 'eşleşme hâlinde dosya Uyum birimine yönlendirilir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'authorization'],
              frequency: 'per_transaction',
              method: 'Yaptırım listesi servisine ülke ve taraf sorgusu.',
              evidence: 'Tarama sonucu ekran görüntüsü ve Uyum yönlendirme kaydı',
              mitigates: ['R-HSD-02'],
              owner: 'usr-22',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-14',
              lastTestedAt: '2026-06-10',
              testResult:
                'Tarama çalışıyor ancak liste güncelleme sıklığı haftalık; gün içi güncellemeler yakalanmıyor.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSD-01',
              name: 'Yurt Dışı Hasar İhbar Kabul Prosedürü',
              type: 'procedure',
              version: '2.1',
              owner: 'usr-03',
              publishedAt: '2025-06-01',
              updatedAt: '2026-01-22',
              nextReviewAt: '2027-01-22',
              summary:
                'Yurt dışından gelen hasar ihbarının alınması, coğrafi kapsam ve yaptırım kontrolü ile '
                + 'asistans şirketine devri.',
              sections: [
                {
                  heading: 'Kapsam',
                  body: [
                    'Seyahat sağlık, yurt dışı nakliyat ve yeşil kart kapsamındaki tüm hasar ihbarlarını kapsar.',
                    'Yurt içinde gerçekleşen hasarlar bu prosedürün kapsamı dışındadır.',
                  ],
                },
                {
                  heading: 'İhbarın Alınması',
                  body: [
                    'Uluslararası hat 7/24 açıktır; ihbar alan personel olay ülkesini ve yerel saati kaydeder.',
                    'Geri arama saati sigortalının bulunduğu ülkenin yerel saatine göre planlanır.',
                    'Acil tıbbi durumlarda asistans şirketi ihbar anında hatta alınır.',
                  ],
                },
                {
                  heading: 'Kapsam ve Yaptırım Kontrolü',
                  body: [
                    'Olay ülkesi poliçenin coğrafi teminat bölgesiyle karşılaştırılır.',
                    'Kapsam dışı ihbarlar birim yöneticisi onayı olmadan açılamaz.',
                    'Yaptırım listesi eşleşmesinde dosya Uyum birimine yönlendirilir ve süreç durdurulur.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-01', 'K-HSD-02'],
            },
          ],
          children: [
            {
              code: 'HSD-01-1',
              name: 'Uluslararası çağrının karşılanması',
              description: '7/24 uluslararası hattan gelen çağrının alınması ve sigortalının konumunun tespiti.',
              systems: ['AsistansPortal'],
              inputs: ['Sigortalı çağrısı'],
              outputs: ['Ham ihbar kaydı', 'Konum bilgisi'],
            },
            {
              code: 'HSD-01-2',
              name: 'Coğrafi kapsam ve yaptırım sorgusu',
              description: 'Olay ülkesinin poliçe teminat bölgesinde olup olmadığının ve yaptırım listesinin sorgulanması.',
              systems: ['PoliçeCore', 'AsistansPortal'],
              inputs: ['Olay ülkesi', 'Poliçe numarası'],
              outputs: ['Kapsam teyidi', 'Yaptırım tarama sonucu'],
              controlRefs: ['K-HSD-01', 'K-HSD-02'],
            },
            {
              code: 'HSD-01-3',
              name: 'Dosyanın açılması ve bilgilendirme',
              description: 'Yurt dışı hasar dosyasının açılması ve sigortalıya dosya numarasının iletilmesi.',
              systems: ['HasarNet'],
              inputs: ['Doğrulanmış ihbar'],
              outputs: ['Dosya numarası', 'Bilgilendirme mesajı'],
            },
          ],
        },

        /* ---------- 2. Asistans Şirketine Devir ---------- */
        {
          code: 'HSD-02',
          name: 'Asistans Şirketine Devir',
          owner: 'usr-05',
          description:
            'Dosyanın anlaşmalı asistans şirketine aktarılması, görev numarası alınması ve '
            + 'sigortalıya olay yerinde destek sağlanmasının takibi.',
          purpose: 'Sigortalının bulunduğu ülkede yetkin bir hizmet sağlayıcıya en kısa sürede bağlanmasını sağlamak.',
          systems: ['AsistansPortal', 'HasarNet'],
          inputs: ['Açılmış dosya', 'Sigortalı konum ve iletişim bilgisi'],
          outputs: ['Asistans görev numarası', 'Hizmet başlangıç teyidi'],
          maturity: 3,
          slaDays: 1,
          lastReviewedAt: '2026-01-22',
          critical: [
            ['financial', 'Finansal Etki',
              'Asistans şirketinin ön ödeme yaptığı tutarlar sigortacıya rücu edilir; teminat dışı hizmet doğrudan zarardır.'],
          ],
          examples: [
            {
              title: 'Asistans şirketinin teminat dışı hizmet vermesi',
              scenario:
                'Sigortalı Roma’da hastaneye kaldırılıyor. Asistans şirketi teminat limitini teyit etmeden '
                + 'özel oda ve refakatçi hizmetini onaylıyor.',
              risk: 'Poliçe limitini aşan 4.200 EUR’luk fatura sigortacıya yansıyor.',
              control: 'Asistans şirketinin her hizmet onayı öncesi portal üzerinden teminat limiti sorgulaması.',
              controlType: 'Önleyici — sistem üzerinden limit teyidi',
              evidence: 'AsistansPortal limit sorgu logu ve hizmet onay kaydı',
              criticalNote: 'Limit sorgusu yapılmadan verilen hizmetin bedeli asistans şirketinde kalır.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-03',
              name: 'Asistans şirketinin teminat limitini aşan hizmet onaylaması',
              description:
                'Anlaşmalı asistans şirketinin, poliçe teminat limitini sorgulamadan sigortalıya hizmet '
                + 'onayı vermesi ve maliyetin sigortacıya yansıması.',
              cause: 'Limit sorgusunun sözleşmede zorunlu tutulmaması; acil durumlarda sorgunun atlanması.',
              consequence: 'Teminat dışı maliyetin üstlenilmesi ve hasar/prim oranının bozulması.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-03-19',
              lastAssessedAt: '2026-01-22',
              standards: ['COSO', 'ISO 31000'],
            },
            {
              code: 'R-HSD-04',
              name: 'Asistans şirketine geç devir nedeniyle sigortalının mağdur olması',
              description:
                'Dosyanın asistans şirketine aktarılmasında yaşanan gecikme sebebiyle sigortalının '
                + 'yurt dışında desteksiz kalması.',
              cause: 'Mesai dışı devir akışının tanımsız olması; nöbetçi ekipte yetki bulunmaması.',
              consequence: 'Sigortalının kendi imkânıyla masraf yapması, şikâyet ve itibar kaybı.',
              category: 'reputational',
              inherent: [4, 4],
              residual: [3, 3],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'down',
              owner: 'usr-03',
              identifiedAt: '2025-05-30',
              lastAssessedAt: '2026-01-22',
              standards: ['ISO 9001'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-03',
              name: 'Asistans hizmet onayında teminat limiti sorgusu',
              description:
                'Asistans şirketi, her hizmet onayı öncesinde portal üzerinden kalan teminat limitini sorgulamak '
                + 'zorundadır; sorgusuz onaylanan hizmetin bedeli sözleşme gereği sağlayıcıda kalır.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'authorization'],
              frequency: 'per_transaction',
              method: 'AsistansPortal limit sorgu servisi ve sözleşmesel yaptırım maddesi.',
              evidence: 'Limit sorgu logu ve aylık sağlayıcı mutabakatı',
              mitigates: ['R-HSD-03'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-13',
              lastTestedAt: '2026-04-18',
              testResult:
                'Sorgu oranı %91. Acil vakalarda atlanabiliyor; sözleşmedeki istisna maddesi geniş yorumlanıyor.',
            },
            {
              code: 'K-HSD-04',
              name: 'Mesai dışı nöbetçi devir kontrolü',
              description:
                'Mesai dışında açılan yurt dışı dosyalarının 60 dakika içinde asistans şirketine devredilip '
                + 'devredilmediği nöbet listesi üzerinden izlenir; devredilmeyenler eskalasyona düşer.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['monitoring'],
              frequency: 'daily',
              method: 'Devir süresi raporunun her sabah nöbet devriyle birlikte gözden geçirilmesi.',
              evidence: 'Devir süresi raporu ve eskalasyon kaydı',
              mitigates: ['R-HSD-04'],
              owner: 'usr-03',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-14',
              lastTestedAt: '2026-06-25',
              testResult: 'Son 90 günde ortalama devir süresi 34 dakika; 3 eskalasyon kaydı mevcut.',
            },
          ],
          docs: [
            {
              code: 'TLM-HSD-02',
              name: 'Asistans Şirketi Koordinasyon Talimatı',
              type: 'instruction',
              version: '1.6',
              owner: 'usr-05',
              publishedAt: '2025-07-15',
              updatedAt: '2026-01-22',
              nextReviewAt: '2027-01-15',
              summary:
                'Dosyanın asistans şirketine devri, hizmet onayı ve mesai dışı nöbet akışı.',
              sections: [
                {
                  heading: 'Devir Süresi',
                  body: [
                    'Mesai içinde açılan dosyalar 30 dakika, mesai dışında açılanlar 60 dakika içinde devredilir.',
                    'Devredilemeyen dosyalar nöbetçi yöneticiye eskalasyon edilir.',
                  ],
                },
                {
                  heading: 'Hizmet Onayı',
                  body: [
                    'Asistans şirketi her hizmet için kalan teminat limitini portal üzerinden sorgular.',
                    'Limit aşımı gerektiren acil tıbbi durumlarda yazılı yönetici onayı alınır.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-03', 'K-HSD-04'],
            },
          ],
          children: [
            {
              code: 'HSD-02-1',
              name: 'Asistans şirketinin bilgilendirilmesi',
              description: 'Dosya bilgilerinin asistans portalı üzerinden sağlayıcıya aktarılması.',
              systems: ['AsistansPortal'],
              inputs: ['Dosya numarası', 'Sigortalı konumu'],
              outputs: ['Asistans görev numarası'],
            },
            {
              code: 'HSD-02-2',
              name: 'Teminat limitinin paylaşılması',
              description: 'Kalan teminat limitinin sağlayıcıya bildirilmesi ve hizmet sınırının netleştirilmesi.',
              systems: ['PoliçeCore', 'AsistansPortal'],
              inputs: ['Poliçe teminat bilgisi'],
              outputs: ['Limit teyidi'],
              controlRefs: ['K-HSD-03'],
            },
            {
              code: 'HSD-02-3',
              name: 'Hizmet başlangıcının teyidi',
              description: 'Sigortalıya olay yerinde hizmet verildiğinin sağlayıcıdan teyit edilmesi.',
              systems: ['AsistansPortal'],
              inputs: ['Sağlayıcı geri bildirimi'],
              outputs: ['Hizmet başlangıç kaydı'],
              controlRefs: ['K-HSD-04'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* ALT SÜREÇ B — Yurt Dışı Tespit ve Evrak                       */
    /* ============================================================ */
    {
      code: 'HSD-B',
      name: 'Yurt Dışı Tespit ve Evrak',
      owner: 'usr-05',
      description:
        'Hasarın yerel muhabir/eksper ağı üzerinden tespiti ve yabancı dildeki evrakın '
        + 'çevirisi, onayı ve doğrulanması.',
      purpose:
        'Olay yerinde bulunulamayan bir hasarda tespitin güvenilir, evrakın hukuken geçerli olmasını sağlamak.',
      systems: ['AsistansPortal', 'DocVault', 'HasarNet'],
      inputs: ['Asistans raporu', 'Yabancı dil hasar evrakı'],
      outputs: ['Doğrulanmış hasar tespiti', 'Tercüme ve onaylı evrak seti'],
      maturity: 3,
      slaDays: 10,

      children: [
        /* ---------- 3. Yerel Eksper Tespiti ---------- */
        {
          code: 'HSD-03',
          name: 'Yerel Eksper Tespiti',
          owner: 'usr-05',
          description:
            'Hasarın gerçekleştiği ülkedeki muhabir şirket veya bağımsız eksper aracılığıyla '
            + 'tespit yapılması ve raporun alınması.',
          purpose: 'Sigortacının fiziksel olarak bulunamadığı yerde hasarın bağımsız biçimde tespitini sağlamak.',
          systems: ['AsistansPortal', 'DocVault'],
          inputs: ['Asistans görev kaydı', 'Hasar yeri bilgisi'],
          outputs: ['Yerel eksper raporu', 'Fotoğraf ve tespit dosyası'],
          maturity: 3,
          slaDays: 7,
          lastReviewedAt: '2026-01-22',
          critical: [
            ['financial', 'Finansal Etki',
              'Yerel eksper raporu tazminat tutarının tek dayanağıdır; hatalı tespit doğrudan ödeme hatasına dönüşür.'],
          ],
          examples: [
            {
              title: 'Muhabir şirketin yetkinliği doğrulanmadan görevlendirilmesi',
              scenario:
                'Gürcistan’daki bir nakliyat hasarında, listede bulunmayan yerel bir firma acil olduğu '
                + 'gerekçesiyle görevlendiriliyor. Firma emtia hasarında deneyimsiz.',
              risk: 'Hasar tutarı %40 eksik tespit ediliyor; sigortalı itiraz ediyor ve dosya yeniden açılıyor.',
              control: 'Yalnızca onaylı muhabir listesinden görevlendirme; liste dışı atamanın yönetici onayına bağlanması.',
              controlType: 'Önleyici — yetkilendirme kontrolü',
              evidence: 'Muhabir listesi ve görevlendirme onay kaydı',
              criticalNote: 'Liste dışı görevlendirme sistem tarafından engellenir.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-05',
              name: 'Yetkin olmayan yerel eksperin görevlendirilmesi',
              description:
                'Hasarın türüne uygun uzmanlığı bulunmayan bir yerel eksper veya muhabir şirketin '
                + 'görevlendirilmesi ve tespitin hatalı yapılması.',
              cause: 'Onaylı muhabir listesinin güncel olmaması; acil durumlarda liste dışına çıkılması.',
              consequence: 'Eksik veya fazla tazminat, dosyanın yeniden açılması, sigortalı itirazı.',
              category: 'operational',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-05',
              identifiedAt: '2025-02-14',
              lastAssessedAt: '2026-01-22',
              standards: ['COSO', 'ISO 9001'],
            },
            {
              code: 'R-HSD-06',
              name: 'Yabancı dildeki evrakın hatalı tercüme edilmesi',
              description:
                'Tıbbi rapor, polis tutanağı veya fatura gibi belgelerin yeminli olmayan tercümeyle '
                + 'işlenmesi ve içeriğin yanlış anlaşılması.',
              cause: 'Maliyet ve süre baskısıyla yeminli tercüme yerine serbest çeviri kullanılması.',
              consequence: 'Teminat kapsamının yanlış değerlendirilmesi ve hukuken savunulamayan ödeme kararı.',
              category: 'compliance',
              inherent: [4, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2025-06-08',
              lastAssessedAt: '2026-01-22',
              standards: ['ISO 9001', 'SEDDK Hasar Yönetmeliği'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-05',
              name: 'Onaylı muhabir listesinden görevlendirme',
              description:
                'Yerel eksper görevlendirmesi yalnızca hasar türüne göre onaylanmış muhabir listesinden '
                + 'yapılabilir; liste dışı atama birim yöneticisi onayı gerektirir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['authorization', 'system'],
              frequency: 'per_transaction',
              method: 'AsistansPortal görevlendirme ekranında liste kısıtı ve onay akışı.',
              evidence: 'Görevlendirme kaydı ve istisna onayı',
              mitigates: ['R-HSD-05'],
              owner: 'usr-05',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-12',
              lastTestedAt: '2026-05-28',
              testResult: '60 görevlendirmenin tamamı listeden yapılmış; 2 istisna onayı usulüne uygun.',
            },
            {
              code: 'K-HSD-06',
              name: 'Yeminli tercüme zorunluluğu',
              description:
                'Tazminat kararına dayanak olan yabancı dildeki belgeler, yeminli tercüman onayı olmadan '
                + 'dosyaya eklenemez; DocVault yükleme sırasında onay bilgisini zorunlu tutar.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['data_validation', 'authorization'],
              frequency: 'per_transaction',
              method: 'DocVault belge yükleme formunda yeminli tercüman ve onay tarihi alanının zorunlu olması.',
              evidence: 'Tercüme onay kaydı ve belge meta verisi',
              mitigates: ['R-HSD-06'],
              owner: 'usr-09',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-08-11',
              lastTestedAt: '2026-06-02',
              testResult: '45 belgede yeminli tercüme oranı %100.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSD-03',
              name: 'Yurt Dışı Eksper Görevlendirme ve Evrak Prosedürü',
              type: 'procedure',
              version: '1.9',
              owner: 'usr-05',
              publishedAt: '2025-03-10',
              updatedAt: '2026-01-22',
              nextReviewAt: '2027-03-10',
              summary:
                'Yerel eksper seçimi, görevlendirme onayı ve yabancı dildeki evrakın tercüme ve onay kuralları.',
              sections: [
                {
                  heading: 'Eksper Seçimi',
                  body: [
                    'Görevlendirme, hasar türüne göre onaylanmış muhabir listesinden yapılır.',
                    'Liste dışı görevlendirme yalnızca birim yöneticisi yazılı onayıyla mümkündür.',
                  ],
                },
                {
                  heading: 'Evrak ve Tercüme',
                  body: [
                    'Tazminat kararına dayanak olacak belgeler yeminli tercümanca çevrilir.',
                    'Polis tutanağı ve resmî belgelerde apostil veya konsolosluk onayı aranır.',
                    'Onaysız belge dosyaya eklenemez.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-05', 'K-HSD-06'],
            },
            {
              code: 'CHK-HSD-03',
              name: 'Yurt Dışı Hasar Evrak Kontrol Listesi',
              type: 'checklist',
              version: '1.3',
              owner: 'usr-05',
              publishedAt: '2025-08-20',
              nextReviewAt: '2026-12-31',
              summary: 'Dosya kapanmadan önce bulunması gereken yurt dışı evrak seti.',
              sections: [
                {
                  heading: 'Zorunlu Belgeler',
                  body: [
                    'Yerel eksper raporu (imzalı ve tarihli).',
                    'Yeminli tercüme edilmiş tıbbi rapor veya polis tutanağı.',
                    'Orijinal fatura ve ödeme belgesi.',
                    'Apostil veya konsolosluk onayı (resmî belgelerde).',
                  ],
                },
              ],
            },
          ],
          children: [
            {
              code: 'HSD-03-1',
              name: 'Muhabir seçimi ve görevlendirme',
              description: 'Hasar türüne uygun yerel muhabirin onaylı listeden seçilip görevlendirilmesi.',
              systems: ['AsistansPortal'],
              inputs: ['Hasar türü', 'Olay ülkesi'],
              outputs: ['Görevlendirme kaydı'],
              controlRefs: ['K-HSD-05'],
            },
            {
              code: 'HSD-03-2',
              name: 'Tespit raporunun alınması',
              description: 'Yerel eksperin hazırladığı tespit raporunun ve görsellerin dosyaya alınması.',
              systems: ['DocVault'],
              inputs: ['Eksper raporu', 'Fotoğraflar'],
              outputs: ['Tespit dosyası'],
            },
            {
              code: 'HSD-03-3',
              name: 'Evrak tercümesi ve onayı',
              description: 'Yabancı dildeki belgelerin yeminli tercümesi ve resmî belgelerde apostil kontrolü.',
              systems: ['DocVault'],
              inputs: ['Yabancı dil belgeler'],
              outputs: ['Onaylı tercüme seti'],
              controlRefs: ['K-HSD-06'],
            },
          ],
        },
      ],
    },

    /* ============================================================ */
    /* ALT SÜREÇ C — Döviz Değerlendirme ve Ödeme                    */
    /* ============================================================ */
    {
      code: 'HSD-C',
      name: 'Döviz Değerlendirme ve Ödeme',
      owner: 'usr-08',
      description:
        'Tazminatın döviz cinsinden hesaplanması, kur tarihinin belirlenmesi ve '
        + 'uluslararası transferle ödenmesi.',
      purpose:
        'Tazminatın doğru kurla hesaplanmasını ve mevzuata uygun biçimde yurt dışına transferini sağlamak.',
      systems: ['HasarNet', 'TCMB Kur Servisi', 'SWIFT Gateway', 'SAP FI'],
      inputs: ['Doğrulanmış tespit', 'Onaylı evrak seti', 'Sigortalı banka bilgisi'],
      outputs: ['Döviz tazminat hesabı', 'Uluslararası transfer kaydı'],
      maturity: 3,
      slaDays: 12,

      children: [
        /* ---------- 4. Döviz Tazminat Hesabı ---------- */
        {
          code: 'HSD-04',
          name: 'Döviz Tazminat Hesabı',
          owner: 'usr-08',
          description:
            'Yabancı para cinsinden faturaların değerlendirilmesi, uygulanacak kur tarihinin '
            + 'belirlenmesi ve tazminat tutarının hesaplanması.',
          purpose: 'Kur farkından doğan hak kaybını veya fazla ödemeyi önlemek.',
          systems: ['HasarNet', 'TCMB Kur Servisi'],
          inputs: ['Yabancı para fatura', 'Poliçe kur şartı'],
          outputs: ['Hesaplanmış tazminat tutarı', 'Kur uygulama kaydı'],
          maturity: 3,
          slaDays: 5,
          lastReviewedAt: '2026-01-22',
          critical: [
            ['financial', 'Finansal Etki',
              'Kur tarihi seçimi tazminat tutarını doğrudan değiştirir; poliçe şartına aykırı kur uygulaması hak kaybı doğurur.'],
            ['regulatory', 'Mevzuat Gerekliliği',
              'Poliçede kur tarihi tanımlıysa buna uyulması zorunludur; aksi hâlde SEDDK şikâyeti gündeme gelir.'],
          ],
          examples: [
            {
              title: 'Ödeme günü kuru yerine olay günü kurunun uygulanması',
              scenario:
                'Poliçe “ödeme tarihindeki TCMB efektif satış kuru” diyor. Uzman, alışkanlıkla olay '
                + 'tarihindeki kuru uyguluyor. Aradaki 4 ay içinde kur %12 yükselmiş.',
              risk: 'Sigortalıya 6.800 TL eksik ödeme yapılıyor; şikâyet ve faiz yükümlülüğü doğuyor.',
              control: 'Kur tarihinin poliçe şartından sistem tarafından okunması ve kullanıcının değiştirememesi.',
              controlType: 'Önleyici — otomatik parametre kontrolü',
              evidence: 'Kur uygulama logu ve poliçe şart kaydı',
              criticalNote: 'Kur tarihi elle değiştirilemez; istisna yalnızca Mali İşler onayıyla açılır.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-07',
              name: 'Yanlış kur tarihi uygulanarak eksik/fazla ödeme yapılması',
              description:
                'Poliçe şartında tanımlı kur tarihi yerine farklı bir tarihin kuru kullanılarak '
                + 'tazminatın hatalı hesaplanması.',
              cause: 'Kur tarihinin elle seçilebilmesi ve poliçe şartının sistemde parametrik olmaması.',
              consequence: 'Sigortalı aleyhine eksik ödeme ve faiz yükümlülüğü ya da sigortacı aleyhine fazla ödeme.',
              category: 'financial',
              inherent: [4, 4],
              residual: [2, 4],
              target: [1, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-08',
              identifiedAt: '2025-01-30',
              lastAssessedAt: '2026-01-22',
              standards: ['COSO', 'SEDDK Hasar Yönetmeliği'],
            },
            {
              code: 'R-HSD-08',
              name: 'Yabancı para faturanın sahte veya şişirilmiş olması',
              description:
                'Yurt dışında düzenlenen faturanın gerçeği yansıtmaması; tutarın şişirilmesi ya da '
                + 'hiç yapılmamış bir hizmetin faturalandırılması.',
              cause: 'Yabancı ülkedeki hizmet sağlayıcının doğrulanmasının güç olması.',
              consequence: 'Haksız tazminat ödemesi ve suistimal kaybı.',
              category: 'financial',
              inherent: [4, 5],
              residual: [3, 5],
              target: [2, 4],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'up',
              owner: 'usr-22',
              identifiedAt: '2025-10-05',
              lastAssessedAt: '2026-01-22',
              standards: ['COSO', 'MASAK'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-07',
              name: 'Kur tarihinin poliçe şartından otomatik uygulanması',
              description:
                'Uygulanacak kur tarihi poliçe şartından okunur ve TCMB servisinden çekilir; kullanıcı '
                + 'bu alanı değiştiremez, istisna Mali İşler onayına bağlıdır.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'HasarNet kur alanının poliçe parametresine bağlanması ve salt okunur olması.',
              evidence: 'Kur uygulama logu ve istisna onay kaydı',
              mitigates: ['R-HSD-07'],
              owner: 'usr-08',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 5,
              lastPerformedAt: '2026-08-14',
              lastTestedAt: '2026-07-01',
              testResult: '80 dosyanın tamamında kur tarihi poliçe şartıyla uyumlu.',
            },
            {
              code: 'K-HSD-08',
              name: 'Yurt dışı fatura doğrulama ve eşik kontrolü',
              description:
                'Belirlenen eşiği aşan yabancı para faturalar, hizmet sağlayıcının varlığı ve '
                + 'faturanın gerçekliği açısından muhabir üzerinden teyit edilir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['monitoring', 'authorization'],
              frequency: 'per_transaction',
              method: '5.000 EUR üzeri faturalarda muhabir teyidi ve sağlayıcı kayıt sorgusu.',
              evidence: 'Muhabir teyit yazışması ve sorgu çıktısı',
              mitigates: ['R-HSD-08'],
              owner: 'usr-22',
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 2,
              lastPerformedAt: '2026-08-08',
              lastTestedAt: '2026-06-30',
              testResult:
                'Eşik üzeri 22 faturanın 16’sında teyit yapılmış. Teyit süresi ortalama 9 gün; SLA’yı zorluyor.',
            },
          ],
          docs: [
            {
              code: 'PRS-HSD-04',
              name: 'Döviz Cinsinden Tazminat Hesaplama Prosedürü',
              type: 'procedure',
              version: '2.2',
              owner: 'usr-08',
              publishedAt: '2025-02-01',
              updatedAt: '2026-01-22',
              nextReviewAt: '2027-02-01',
              summary: 'Kur tarihinin belirlenmesi, döviz tazminat hesabı ve fatura doğrulama eşikleri.',
              sections: [
                {
                  heading: 'Kur Tarihi',
                  body: [
                    'Uygulanacak kur tarihi poliçe genel ve özel şartlarından okunur.',
                    'Poliçede tanım yoksa ödeme tarihindeki TCMB efektif satış kuru uygulanır.',
                    'Kur tarihi elle değiştirilemez; istisna Mali İşler onayına tabidir.',
                  ],
                },
                {
                  heading: 'Fatura Doğrulama',
                  body: [
                    '5.000 EUR ve üzeri faturalar muhabir üzerinden teyit edilir.',
                    'Teyit alınamayan faturalar ödemeye alınmaz, dosya suistimal incelemesine yönlendirilir.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-07', 'K-HSD-08'],
            },
          ],
          children: [
            {
              code: 'HSD-04-1',
              name: 'Fatura ve masraf kalemlerinin değerlendirilmesi',
              description: 'Yabancı para faturaların teminat kapsamı açısından kalem kalem incelenmesi.',
              systems: ['HasarNet'],
              inputs: ['Onaylı fatura seti'],
              outputs: ['Kabul edilen masraf kalemleri'],
              controlRefs: ['K-HSD-08'],
            },
            {
              code: 'HSD-04-2',
              name: 'Kur tarihinin belirlenmesi ve çevrim',
              description: 'Poliçe şartına göre kur tarihinin okunması ve TCMB kuruyla çevrim yapılması.',
              systems: ['TCMB Kur Servisi', 'HasarNet'],
              inputs: ['Poliçe kur şartı', 'Döviz tutarı'],
              outputs: ['TL karşılığı tazminat tutarı'],
              controlRefs: ['K-HSD-07'],
            },
            {
              code: 'HSD-04-3',
              name: 'Tazminat teklifinin oluşturulması',
              description: 'Hesaplanan tutarın sigortalıya teklif olarak sunulması ve mutabakat alınması.',
              systems: ['HasarNet'],
              inputs: ['Tazminat hesabı'],
              outputs: ['Tazminat teklifi', 'Sigortalı mutabakatı'],
            },
          ],
        },

        /* ---------- 5. Uluslararası Ödeme ---------- */
        {
          code: 'HSD-05',
          name: 'Uluslararası Ödeme',
          owner: 'usr-08',
          description:
            'Mutabık kalınan tazminatın SWIFT üzerinden sigortalının yurt dışı veya yurt içi '
            + 'hesabına transfer edilmesi ve muhasebeleştirilmesi.',
          purpose: 'Ödemenin doğru hesaba, mevzuata uygun ve izlenebilir biçimde ulaşmasını sağlamak.',
          systems: ['SWIFT Gateway', 'SAP FI', 'HasarNet'],
          inputs: ['Mutabık tazminat tutarı', 'IBAN / SWIFT bilgisi'],
          outputs: ['Transfer dekontu', 'Muhasebe kaydı', 'Kapatılmış dosya'],
          maturity: 3,
          slaDays: 5,
          lastReviewedAt: '2026-01-22',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Yurt dışına yapılan transferler MASAK kapsamında raporlanır; alıcı taraf yaptırım taramasından geçmelidir.'],
            ['financial', 'Finansal Etki',
              'Yanlış IBAN’a giden uluslararası transferin geri çağrılması çoğu ülkede mümkün olmaz.'],
          ],
          examples: [
            {
              title: 'Alıcı adı ile hesap sahibinin uyuşmaması',
              scenario:
                'Sigortalı, tedavi masrafının doğrudan yurt dışındaki hastaneye ödenmesini istiyor; '
                + 'ancak dosyada hastanenin adı ile IBAN’ın sahibi farklı görünüyor.',
              risk: 'Ödeme üçüncü bir tarafa gidiyor, geri alınamıyor ve sigortalıya ikinci kez ödeme yapılıyor.',
              control: 'Alıcı adı ile hesap sahibinin eşleştiği teyit edilmeden transferin başlatılamaması.',
              controlType: 'Önleyici — çift teyit',
              evidence: 'Hesap sahibi teyit belgesi ve transfer onay kaydı',
              criticalNote: 'Uyuşmazlık hâlinde ödeme durdurulur, sigortalıdan yazılı beyan istenir.',
            },
          ],
          risks: [
            {
              code: 'R-HSD-09',
              name: 'Ödemenin yanlış alıcıya transfer edilmesi',
              description:
                'IBAN/SWIFT bilgisinin hatalı girilmesi ya da alıcı adı ile hesap sahibinin '
                + 'uyuşmaması sonucu tazminatın yanlış tarafa gitmesi.',
              cause: 'Alıcı doğrulamasının tek kişiye bırakılması; yurt dışı hesaplarda ad-hesap eşleşmesinin zor doğrulanması.',
              consequence: 'Geri alınamayan ödeme ve sigortalıya ikinci kez ödeme yapma zorunluluğu.',
              category: 'financial',
              inherent: [3, 5],
              residual: [2, 5],
              target: [1, 5],
              appetite: 'averse',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-08',
              identifiedAt: '2025-07-19',
              lastAssessedAt: '2026-01-22',
              standards: ['COSO', 'ISO 27001'],
            },
            {
              code: 'R-HSD-10',
              name: 'Transferin muhabir banka tarafından bloke edilmesi',
              description:
                'Yaptırım taraması veya eksik açıklama nedeniyle uluslararası transferin ara bankada '
                + 'bloke olması ve ödemenin sigortalıya ulaşmaması.',
              cause: 'Transfer açıklamasının yetersiz olması ve alıcı taraf taramasının eksik yapılması.',
              consequence: 'Ödeme gecikmesi, sigortalı şikâyeti ve MASAK bildirim yükümlülüğü.',
              category: 'compliance',
              inherent: [3, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'up',
              owner: 'usr-22',
              identifiedAt: '2025-11-12',
              lastAssessedAt: '2026-01-22',
              standards: ['MASAK', 'COSO'],
            },
          ],
          controls: [
            {
              code: 'K-HSD-09',
              name: 'Alıcı adı ve hesap sahibi çift teyidi',
              description:
                'Uluslararası transfer öncesinde alıcı adı ile hesap sahibinin eşleştiği iki farklı '
                + 'kişi tarafından teyit edilir; uyuşmazlıkta transfer başlatılamaz.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['segregation_of_duties', 'authorization'],
              frequency: 'per_transaction',
              method: 'Ödeme hazırlayan ve onaylayan farklı kişilerce alıcı doğrulaması.',
              evidence: 'Çift onay kaydı ve hesap sahibi teyit belgesi',
              mitigates: ['R-HSD-09'],
              owner: 'usr-08',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 5,
              lastPerformedAt: '2026-08-14',
              lastTestedAt: '2026-07-05',
              testResult: '50 transferin tamamında çift onay mevcut; 1 uyuşmazlık tespit edilip durdurulmuş.',
            },
            {
              code: 'K-HSD-10',
              name: 'Transfer öncesi yaptırım taraması ve açıklama standardı',
              description:
                'Her uluslararası transfer öncesi alıcı taraf yaptırım listelerine taranır ve transfer '
                + 'açıklaması standart formatta doldurulur.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['system', 'monitoring'],
              frequency: 'per_transaction',
              method: 'SWIFT Gateway üzerinde tarama servisi ve zorunlu açıklama şablonu.',
              evidence: 'Tarama çıktısı ve transfer mesajı',
              mitigates: ['R-HSD-10'],
              owner: 'usr-22',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-14',
              lastTestedAt: '2026-06-18',
              testResult:
                'Tarama tüm transferlerde yapılmış. Açıklama şablonuna uyum %78; serbest metin kullanımı sürüyor.',
            },
          ],
          docs: [
            {
              code: 'TLM-HSD-05',
              name: 'Uluslararası Tazminat Transferi Talimatı',
              type: 'instruction',
              version: '1.4',
              owner: 'usr-08',
              publishedAt: '2025-09-01',
              updatedAt: '2026-01-22',
              nextReviewAt: '2027-09-01',
              summary: 'SWIFT transferi, alıcı doğrulaması, yaptırım taraması ve muhasebeleştirme.',
              sections: [
                {
                  heading: 'Alıcı Doğrulama',
                  body: [
                    'Alıcı adı ile hesap sahibi iki farklı kişi tarafından teyit edilir.',
                    'Üçüncü tarafa (hastane, servis) doğrudan ödemede sigortalının yazılı talimatı aranır.',
                  ],
                },
                {
                  heading: 'Transfer ve Raporlama',
                  body: [
                    'Alıcı taraf yaptırım listelerine taranmadan transfer başlatılmaz.',
                    'Transfer açıklaması standart şablona göre doldurulur.',
                    'Eşik üzeri transferler MASAK kapsamında raporlanır.',
                  ],
                },
              ],
              controlCodes: ['K-HSD-09', 'K-HSD-10'],
            },
          ],
          children: [
            {
              code: 'HSD-05-1',
              name: 'Alıcı bilgilerinin doğrulanması',
              description: 'IBAN/SWIFT bilgisinin ve alıcı adının hesap sahibiyle eşleştiğinin teyidi.',
              systems: ['HasarNet'],
              inputs: ['Sigortalı banka bilgisi'],
              outputs: ['Doğrulanmış alıcı kaydı'],
              controlRefs: ['K-HSD-09'],
            },
            {
              code: 'HSD-05-2',
              name: 'Yaptırım taraması ve transfer',
              description: 'Alıcı tarafın taranması ve SWIFT üzerinden transferin başlatılması.',
              systems: ['SWIFT Gateway'],
              inputs: ['Doğrulanmış alıcı', 'Tazminat tutarı'],
              outputs: ['Transfer dekontu'],
              controlRefs: ['K-HSD-10'],
            },
            {
              code: 'HSD-05-3',
              name: 'Muhasebeleştirme ve dosya kapanışı',
              description: 'Ödemenin muhasebeleştirilmesi, muallak kaydının kapatılması ve dosyanın kapanışı.',
              systems: ['SAP FI', 'HasarNet'],
              inputs: ['Transfer dekontu'],
              outputs: ['Muhasebe kaydı', 'Kapatılmış dosya'],
            },
          ],
        },
      ],
    },
  ],
};
