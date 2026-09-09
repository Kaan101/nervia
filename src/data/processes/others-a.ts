import type { NodeSpec } from '../spec';

/** Mali İşler, Hukuk, Bilgi Teknolojileri ve İnsan Kaynakları ana süreçleri. */

export const maliIsler: NodeSpec = {
  code: 'FIN',
  name: 'Mali İşler',
  unit: 'U-FIN',
  owner: 'usr-06',
  processClass: 'support',
  standards: ['COSO', 'ISO 9001', 'TFRS'],
  description: 'Muhasebe, ödeme, tahsilat ve mali raporlama süreçlerinin bütünü.',
  purpose: 'Mali kayıtların doğru, tam ve zamanında tutulmasını; nakit ve ödeme süreçlerinin güvenli işlemesini sağlamak.',
  systems: ['Logo Muhasebe', 'ÖdemeGW', 'Banka Kanalları'],
  inputs: ['Fatura ve masraf belgeleri', 'Banka ekstreleri', 'Hasar ve prim hareketleri'],
  outputs: ['Mali tablolar', 'Ödeme kayıtları', 'Mutabakat raporları'],
  maturity: 4,
  version: '3.5',
  lastReviewedAt: '2026-01-20',
  children: [
    {
      code: 'FIN-A',
      name: 'Satıcı Ödemeleri',
      owner: 'usr-08',
      description: 'Tedarikçi faturalarının kaydı, onayı ve ödenmesi.',
      systems: ['Logo Muhasebe', 'ÖdemeGW'],
      children: [
        {
          code: 'FIN-01',
          name: 'Fatura Kayıt ve Eşleştirme',
          description: 'Gelen tedarikçi faturalarının sipariş ve mal/hizmet kabulüyle üçlü eşleştirmesi.',
          purpose: 'Yalnızca sipariş edilmiş ve teslim alınmış mal/hizmet için ödeme yapılmasını sağlamak.',
          owner: 'usr-07',
          systems: ['Logo Muhasebe'],
          inputs: ['Tedarikçi faturası', 'Satın alma siparişi', 'Mal kabul kaydı'],
          outputs: ['Onaylı fatura kaydı'],
          critical: [['financial', 'Finansal Risk', 'Üçlü eşleştirme yapılmadan ödeme kaydı açılamaz.']],
          risks: [
            {
              code: 'R-FIN-01',
              name: 'Siparişsiz veya teslim alınmamış hizmet için ödeme yapılması',
              description: 'Sipariş ve mal kabul kaydı olmadan fatura kaydı açılması.',
              cause: 'Acil alımlarda sonradan sipariş açma pratiği, eşleştirme kontrolünün istisnaları.',
              consequence: 'Haksız ödeme, bütçe aşımı ve denetim bulgusu.',
              category: 'financial',
              inherent: [3, 4],
              residual: [2, 3],
              appetite: 'minimal',
            },
            {
              code: 'R-FIN-02',
              name: 'Mükerrer fatura kaydı',
              description: 'Aynı faturanın farklı kullanıcılar tarafından iki kez sisteme girilmesi.',
              cause: 'PDF ve fiziksel fatura akışının paralel yürümesi.',
              consequence: 'Mükerrer ödeme ve geri tahsilat maliyeti.',
              category: 'financial',
              inherent: [3, 3],
              residual: [1, 2],
              appetite: 'minimal',
              trend: 'down',
            },
          ],
          controls: [
            {
              code: 'K-FIN-01',
              name: 'Üçlü eşleştirme kontrolü (sipariş – irsaliye – fatura)',
              description: 'Fatura kaydı, satın alma siparişi ve mal/hizmet kabul kaydıyla otomatik eşleştirilir; tolerans dışı farklar bloklanır.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation', 'reconciliation'],
              frequency: 'per_transaction',
              method: 'SAP FI three-way match; %2 tolerans, aşımda iş akışı durur.',
              evidence: 'SAP eşleştirme raporu',
              mitigates: ['R-FIN-01'],
              key: true,
              strength: 0.72,
            },
            {
              code: 'K-FIN-02',
              name: 'Mükerrer fatura tespit kontrolü',
              description: 'Tedarikçi vergi no, fatura no ve tutar kombinasyonunda tekillik kontrolü.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'data_validation'],
              frequency: 'per_transaction',
              method: 'SAP tekillik kuralı; eşleşmede kayıt engellenir.',
              evidence: 'Sistem uyarı logu',
              mitigates: ['R-FIN-02'],
              key: false,
              strength: 0.7,
            },
          ],
          docs: [
            {
              code: 'PRS-FIN-01',
              name: 'Satıcı Ödemeleri Prosedürü',
              type: 'procedure',
              version: '4.0',
              publishedAt: '2025-06-01',
              nextReviewAt: '2026-06-01',
              summary: 'Fatura kabulü, üçlü eşleştirme, onay ve ödeme adımları.',
              controlCodes: ['K-FIN-01', 'K-FIN-02'],
              sections: [
                { heading: 'Eşleştirme Toleransı', body: ['Tutar farkı %2 veya 1.000 TL’yi aşamaz.', 'Aşım halinde Satın Alma ile mutabakat gerekir.'] },
              ],
            },
          ],
        },
        {
          code: 'FIN-02',
          name: 'Ödeme Gerçekleştirme',
          description: 'Onaylı faturaların ödeme dosyasına alınması ve bankaya iletilmesi.',
          owner: 'usr-08',
          systems: ['ÖdemeGW', 'Banka Kanalları'],
          inputs: ['Onaylı fatura kayıtları'],
          outputs: ['Ödeme dosyası', 'Dekont'],
          critical: [['authorization', 'Yetki Kontrolü', 'Ödeme dosyasını hazırlayan ile bankaya iletim yetkisi ayrıdır.']],
          risks: [
            {
              code: 'R-FIN-03',
              name: 'Tedarikçi banka bilgisinin yetkisiz değiştirilmesi',
              description: 'Sahte hesap değişikliği talebiyle ödemenin üçüncü kişilere yönlendirilmesi.',
              cause: 'Sosyal mühendislik, e-posta üzerinden gelen değişiklik talepleri.',
              consequence: 'Doğrudan finansal kayıp ve tedarikçi ilişkisinin zedelenmesi.',
              category: 'financial',
              inherent: [4, 5],
              residual: [2, 4],
              appetite: 'averse',
              trend: 'up',
              owner: 'usr-08',
            },
          ],
          controls: [
            {
              code: 'K-FIN-03',
              name: 'Tedarikçi banka bilgisi değişikliğinde geri arama kontrolü',
              description: 'Banka hesabı değişikliği talepleri, tedarikçinin sözleşmede kayıtlı numarasından geri aranarak teyit edilir ve ikinci kullanıcı onayına tabidir.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['authorization', 'approval', 'segregation_of_duties'],
              frequency: 'event_based',
              method: 'Master data değişiklik iş akışı; geri arama kaydı zorunlu alan.',
              evidence: 'Geri arama kaydı, ikinci onay logu',
              mitigates: ['R-FIN-03'],
              key: true,
              strength: 0.62,
              effectiveness: 'partially_effective',
              design: 'adequate',
              testResult: '2026-Q1: 20 örneklemin 3’ünde geri arama kaydı eksik.',
            },
          ],
          actions: [
            {
              code: 'AKS-010',
              title: 'Tedarikçi master data değişikliklerinde çift onayın sistemselleştirilmesi',
              description: 'Banka bilgisi değişikliğinde ikinci onaycı olmadan kaydın aktifleşmemesi sağlanacak.',
              riskCode: 'R-FIN-03',
              controlCode: 'K-FIN-03',
              owner: 'usr-13',
              createdAt: '2026-05-18',
              dueDate: '2026-11-15',
              priority: 'high',
              status: 'in_progress',
              progress: 30,
              source: 'internal_control',
            },
          ],
        },
      ],
    },
    {
      code: 'FIN-B',
      name: 'Muhasebe ve Kapanış',
      owner: 'usr-07',
      description: 'Dönemsel muhasebe kapanışı, karşılıklar ve mutabakatlar.',
      systems: ['Logo Muhasebe'],
      children: [
        /* ---------------------------------------------------------- */
        /* Hasar ödemelerinin muhasebe ayağı.                          */
        /* Kaynak: Süreç Dokümanı v10.0 Madde 14 (avans, tahakkuk      */
        /* iptali, hatalı tahakkuk düzeltme) ve Madde 19 (Güvence      */
        /* Hesabı parası, ödeme günü listesi).                         */
        /* ---------------------------------------------------------- */
        {
          code: 'FIN-04',
          name: 'Hasar Ödemeleri ve Tahakkuk Düzeltmeleri',
          owner: 'usr-08',
          participants: ['usr-07'],
          description:
            'Güvence Hesabından gelen paranın ve referans numarasının sisteme kaydedilmesi, ödeme '
            + 'günü verilen dosya listesinin ödemeden bir gün önce alınması ve ödemenin yapılması; '
            + 'hatalı tahakkuk düzeltmeleri, avans ödemeleri, temsilciden para iadesi ve rücu '
            + 'tahsilatında tahakkuk iptali.',
          purpose:
            'Hasar ödemelerinin doğru dosyaya, doğru tutarla ve yetkili onayıyla yapılmasını sağlamak.',
          systems: ['Logo Muhasebe', 'Büro Hasar Sistemi', 'Banka Kanalları'],
          inputs: ['Ödeme günü verilen dosya listesi', 'Güvence Hesabı havalesi ve referans numarası'],
          outputs: ['Ödeme kaydı', 'Tahakkuk iptali', 'Avans kaydı'],
          maturity: 3,
          slaDays: 2,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['authorization', 'Yetki Kontrolü',
              'Avans işlemi ve ödemesi Büro Yönetiminin onayı ile yapılır (Madde 14).'],
            ['authorization', 'Yetki Kontrolü',
              'Güvence Hesabından talep edilmeden peşin ödenmesi gereken dosyalar Birim Müdürünün '
              + 'onayı ve bilgisi dâhilinde ödenir (Madde 19/5).'],
            ['financial', 'Finansal Risk',
              'İlgili ayın tahakkuku kapanmışsa hatalı giriş düzeltilmez; tutar kadar tahakkuk '
              + 'iptali yapılır (Madde 14).'],
            ['control', 'Kontrol Noktası',
              'Ödeme günü verilen dosya listesi gerekli kontroller yapılarak ödeme gününden bir '
              + 'gün önce Muhasebe departmanına verilir (Madde 19/3).'],
          ],
          examples: [
            {
              title: 'İhtiyaten tahakkuk ettirilen avansın ödenmesi',
              scenario:
                'Büro tarafından ihtiyaten avans tahakkuku yapılıyor. Muhasebe’ye "ödeme yapılmasın" '
                + 'bilgisi verilmediği için avans tutarı da ödeme listesine giriyor ve ödeniyor.',
              risk:
                'Kesinleşmemiş tutar ödeniyor; sonradan kesinleşen tutar girildiğinde mükerrer '
                + 'ödeme doğuyor ve geri alınması gerekiyor.',
              control:
                'İhtiyaten tahakkuk ettirilen avans işlemlerinde Muhasebe Bölümüne "ödeme yapılmayacak" '
                + 'bilgisinin yazılı verilmesi ve bu kayıtların ödeme listesinden dışlanması.',
              controlType: 'Önleyici — ödeme listesi filtresi',
              evidence: 'Muhasebe bilgilendirme yazısı ve ödeme listesi çıktısı',
              criticalNote:
                'Madde 14: ihtiyaten tahakkuk ettirilen avans işlemleriyle ilgili ödeme yapılmaması '
                + 'için Muhasebe Bölümüne bilgi verilir.',
            },
          ],
          risks: [
            {
              code: 'R-FIN-05',
              name: 'İhtiyati avans tahakkukunun sehven ödenmesi',
              description:
                'Kesinleşmemiş tutar için yapılan ihtiyati avans tahakkukunun ödeme listesine '
                + 'girmesi ve ödenmesi.',
              cause:
                'Avans kayıtlarının ödeme listesinde ayrı işaretlenmemesi ve Muhasebe’ye yazılı '
                + 'bilgi verilmemesi.',
              consequence: 'Mükerrer ödeme ve geri tahsilat süreci.',
              category: 'financial',
              inherent: [3, 4],
              residual: [2, 4],
              target: [1, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              owner: 'usr-08',
              identifiedAt: '2024-12-12',
              lastAssessedAt: '2026-09-08',
            },
            {
              code: 'R-FIN-06',
              name: 'Tahakkuk iptalinin yapılmaması',
              description:
                'Temsilciden para iadesi geldiğinde veya rücu tahsilatı yapıldığında ilgili tutar '
                + 'kadar tahakkuk iptalinin yapılmaması.',
              cause: 'Tahsilat kaydı ile tahakkuk kaydının ayrı ekranlarda tutulması.',
              consequence:
                'Tahakkuk bakiyesinin şişmesi, üye şirket paylarının ve mali tabloların yanlış görünmesi.',
              category: 'financial',
              inherent: [3, 4],
              residual: [2, 3],
              target: [1, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              owner: 'usr-07',
              identifiedAt: '2024-12-12',
              lastAssessedAt: '2026-09-08',
            },
          ],
          controls: [
            {
              code: 'K-FIN-05',
              name: 'Ödeme listesi ön kontrolü ve avans dışlaması',
              description:
                'Ödeme günü verilen dosya listesi ödemeden bir gün önce Muhasebe’ye verilir; liste '
                + 'üzerinde avans ve ihtiyati tahakkuk kayıtları ayrı işaretlenir ve ödemeye '
                + 'çıkarılmaz. Peşin ödemeler için Birim Müdürü onayı aranır.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['authorization', 'reconciliation'],
              frequency: 'weekly',
              method:
                'Liste hasar bölümünce hazırlanır, Muhasebe kontrol eder; onaysız veya avans '
                + 'işaretli kayıt ödenmez.',
              evidence: 'İmzalı ödeme listesi ve Birim Müdürü onayları',
              mitigates: ['R-FIN-05'],
              owner: 'usr-08',
              key: true,
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-09-04',
              lastTestedAt: '2026-07-08',
              testResult: 'Örneklenen 6 ödeme listesinin tamamı bir gün önce ve imzalı teslim edilmiş.',
            },
            {
              code: 'K-FIN-06',
              name: 'İade ve tahsilatta tahakkuk iptali mutabakatı',
              description:
                'Temsilciden gelen para iadeleri ve rücu tahsilatları ay sonunda tahakkuk iptal '
                + 'kayıtlarıyla karşılaştırılır; eşleşmeyen tutarlar araştırılır.',
              nature: 'detective',
              execution: 'semi_automated',
              categories: ['reconciliation'],
              frequency: 'monthly',
              method: 'Tahsilat listesi ile tahakkuk iptal listesi karşılaştırılır.',
              evidence: 'Aylık mutabakat çalışma kâğıdı',
              mitigates: ['R-FIN-06'],
              owner: 'usr-07',
              coso: 'monitoring',
              design: 'adequate',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-31',
              lastTestedAt: '2026-06-15',
              testResult: 'Mutabakat yapılıyor; iki ayda toplam dört kayıt eşleşmemiş ve takibe alınmış.',
            },
          ],
          children: [
            {
              code: 'FIN-04-1',
              name: 'Güvence Hesabı parasının kaydı',
              description: 'Gelen para ve Güvence Hesabı referans numarasının sisteme kaydedilmesi.',
            },
            {
              code: 'FIN-04-2',
              name: 'Ödeme listesi ve ödeme',
              description: 'Ödeme günü verilen dosya listesinin kontrolü ve ödemenin yapılması.',
            },
            {
              code: 'FIN-04-3',
              name: 'Tahakkuk düzeltme ve iptal',
              description: 'Hatalı tahakkuk düzeltmesi, avans işlemleri ve iade/tahsilatta tahakkuk iptali.',
            },
          ],
        },
        {
          code: 'FIN-03',
          name: 'Dönem Sonu Kapanış',
          description: 'Ay ve yıl sonu kapanış kayıtlarının yapılması, karşılıkların ayrılması.',
          owner: 'usr-07',
          systems: ['Logo Muhasebe'],
          inputs: ['Mizan', 'Karşılık hesaplamaları'],
          outputs: ['Kapanış kayıtları', 'Mali tablolar'],
          risks: [
            {
              code: 'R-FIN-04',
              name: 'Kapanış kayıtlarının hatalı veya eksik yapılması',
              description: 'Manuel kapanış fişlerinin hatalı tutar veya hesapla kaydedilmesi.',
              cause: 'Kısa kapanış takvimi, manuel çalışma kâğıtları.',
              consequence: 'Mali tabloların yanlış sunulması ve düzeltme kaydı ihtiyacı.',
              category: 'financial',
              inherent: [3, 5],
              residual: [2, 4],
              appetite: 'minimal',
            },
          ],
          controls: [
            {
              code: 'K-FIN-04',
              name: 'Kapanış kontrol listesi ve ikinci imza',
              description: 'Kapanış adımları kontrol listesi üzerinden yürütülür; her manuel fiş ikinci bir muhasebe yetkilisince gözden geçirilir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['management', 'monitoring', 'segregation_of_duties'],
              frequency: 'monthly',
              method: 'Kapanış çalışma kâğıdı ve ikinci imza.',
              evidence: 'İmzalı kapanış kontrol listesi',
              mitigates: ['R-FIN-04'],
              key: true,
              strength: 0.5,
            },
          ],
          docRefs: ['PRS-HSR-05'],
        },
      ],
    },
  ],
};

export const hukuk: NodeSpec = {
  code: 'LEG',
  name: 'Hukuk',
  unit: 'U-LEG',
  owner: 'usr-09',
  processClass: 'support',
  standards: ['COSO', 'ISO 31000'],
  description: 'Dava ve icra takibi, sözleşme yönetimi ve mevzuat uyum süreçleri.',
  purpose: 'Şirketin hukuki risklerini yönetmek ve mevzuata uyumu sürdürülebilir kılmak.',
  systems: ['Dava Takip', 'Sözleşme Yönetimi', 'UYAP Entegrasyonu'],
  inputs: ['Dava dosyaları', 'Sözleşme talepleri', 'Mevzuat değişiklikleri'],
  outputs: ['Hukuki görüş', 'Karşılık tutarları', 'Uyum raporları'],
  maturity: 3,
  lastReviewedAt: '2025-11-05',
  children: [
    {
      code: 'LEG-A',
      name: 'Dava ve İcra Takibi',
      owner: 'usr-09',
      description: 'Aleyhte ve lehte açılan davaların takibi ve karşılık yönetimi.',
      children: [
        {
          code: 'LEG-01',
          name: 'Dava Dosyası Takibi',
          description: 'Duruşma, süre ve tebligatların izlenmesi; dava karşılıklarının güncellenmesi.',
          owner: 'usr-09',
          systems: ['Dava Takip', 'UYAP Entegrasyonu'],
          inputs: ['Tebligat', 'Dava dosyası'],
          outputs: ['Duruşma takvimi', 'Karşılık önerisi'],
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği', 'Yasal süreler kaçırıldığında hak kaybı geri alınamaz.'],
            ['financial', 'Finansal Risk', 'Dava karşılıkları mali tabloları doğrudan etkiler.'],
          ],
          examples: [
            {
              title: 'İtiraz süresinin kaçırılması',
              scenario: 'Aleyhte verilen kararın tebliğinden sonra istinaf süresi takip edilmiyor ve süre doluyor.',
              risk: 'Kesinleşen aleyhte karar ve ödeme yükümlülüğü.',
              control: 'UYAP entegrasyonu ile süre takvimi ve otomatik hatırlatma.',
              controlType: 'Önleyici — otomatik izleme kontrolü',
              evidence: 'Süre takvimi ekran kaydı ve hatırlatma logu',
              criticalNote: 'Süre bitimine 5 gün kala yönetici eskalasyonu devreye girer.',
            },
          ],
          risks: [
            {
              code: 'R-LEG-01',
              name: 'Yasal sürelerin kaçırılması',
              description: 'Cevap, itiraz veya istinaf sürelerinin takip edilmemesi.',
              cause: 'Manuel takvim yönetimi, yüksek dosya sayısı, vekâlet devirleri.',
              consequence: 'Hak kaybı, kesinleşen aleyhte karar ve doğrudan finansal yük.',
              category: 'legal',
              inherent: [4, 5],
              residual: [2, 4],
              appetite: 'averse',
              trend: 'down',
              owner: 'usr-09',
            },
            {
              code: 'R-LEG-02',
              name: 'Dava karşılıklarının hatalı belirlenmesi',
              description: 'Kaybetme olasılığı ve tutar tahminlerinin gerçekçi olmaması.',
              cause: 'Öznel değerlendirme, geçmiş sonuç verisinin kullanılmaması.',
              consequence: 'Mali tablolarda eksik veya fazla karşılık, denetim bulgusu.',
              category: 'financial',
              inherent: [3, 4],
              residual: [2, 3],
              appetite: 'cautious',
            },
          ],
          controls: [
            {
              code: 'K-LEG-01',
              name: 'UYAP entegrasyonlu süre takip ve eskalasyon',
              description: 'Tebligat ve duruşma bilgileri otomatik alınır; süre bitimine 15/5 gün kala hatırlatma ve yönetici eskalasyonu üretilir.',
              nature: 'preventive',
              execution: 'automated',
              categories: ['system', 'monitoring'],
              frequency: 'daily',
              method: 'Dava Takip süre motoru ve bildirim kuralları.',
              evidence: 'Hatırlatma logu, süre takvimi raporu',
              mitigates: ['R-LEG-01'],
              key: true,
              strength: 0.68,
            },
            {
              code: 'K-LEG-02',
              name: 'Üç aylık dava karşılığı gözden geçirmesi',
              description: 'Hukuk ve Mali İşler, eşik üstü dosyaların kaybetme olasılığını ve tahmini tutarını üç ayda bir birlikte gözden geçirir.',
              nature: 'detective',
              execution: 'manual',
              categories: ['management', 'monitoring'],
              frequency: 'quarterly',
              method: 'Ortak değerlendirme toplantısı ve karşılık tablosu güncellemesi.',
              evidence: 'Toplantı tutanağı ve karşılık tablosu',
              mitigates: ['R-LEG-02'],
              key: true,
              strength: 0.5,
            },
          ],
          docs: [
            {
              code: 'PRS-LEG-01',
              name: 'Dava ve İcra Takip Prosedürü',
              type: 'procedure',
              version: '2.2',
              publishedAt: '2024-09-12',
              nextReviewAt: '2025-09-12',
              summary: 'Dava dosyalarının açılması, süre takibi ve karşılık belirleme esasları.',
              controlCodes: ['K-LEG-01', 'K-LEG-02'],
            },
          ],
          kris: [
            {
              code: 'KRI-LEG-01',
              name: 'Süre kaçırma sayısı',
              definition: 'Çeyrek içinde yasal süresi kaçırılan dosya adedi.',
              riskCode: 'R-LEG-01',
              unit: 'adet',
              frequency: 'quarterly',
              direction: 'lower_better',
              greenMax: 0,
              amberMax: 1,
              readings: [1, 0, 0, 1, 0, 0],
              owner: 'usr-09',
            },
          ],
        },
      ],
    },
    {
      code: 'LEG-B',
      name: 'Sözleşme ve Uyum Yönetimi',
      owner: 'usr-10',
      description: 'Sözleşmelerin hukuki incelemesi ve mevzuat değişikliklerinin süreçlere yansıtılması.',
      children: [
        {
          code: 'LEG-02',
          name: 'Mevzuat Takibi ve Etki Analizi',
          description: 'Yeni ve değişen mevzuatın izlenmesi, etkilenen süreçlerin belirlenmesi ve aksiyon açılması.',
          owner: 'usr-10',
          systems: ['Sözleşme Yönetimi'],
          inputs: ['Resmî Gazete', 'SEDDK duyuruları'],
          outputs: ['Etki analizi notu', 'Uyum aksiyonları'],
          risks: [
            {
              code: 'R-LEG-03',
              name: 'Mevzuat değişikliğinin süreçlere zamanında yansıtılmaması',
              description: 'Yürürlüğe giren düzenlemenin ilgili süreç ve sistemlerde uygulanmaması.',
              cause: 'Takip sorumluluğunun dağınık olması, etki analizinin yapılmaması.',
              consequence: 'İdari para cezası, denetim bulgusu ve itibar kaybı.',
              category: 'compliance',
              inherent: [4, 4],
              residual: [2, 3],
              appetite: 'averse',
              owner: 'usr-10',
            },
          ],
          controls: [
            {
              code: 'K-LEG-03',
              name: 'Aylık mevzuat izleme ve etki analizi',
              description: 'Uyum uzmanı her ay yayımlanan düzenlemeleri tarar, etkilenen süreç sahiplerine etki analizi formu gönderir ve aksiyon açar.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['monitoring', 'management'],
              frequency: 'monthly',
              method: 'Mevzuat izleme listesi ve etki analizi formu.',
              evidence: 'Aylık mevzuat izleme raporu, açılan aksiyon kayıtları',
              mitigates: ['R-LEG-03'],
              key: true,
              strength: 0.55,
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    /* LEG-C — Hasar kaynaklı hukuki işlemler                        */
    /* Kaynak: Süreç Dokümanı v10.0 Madde 11 (sahte yeşil kart),     */
    /* Madde 12 (rücu) ve Madde 13 (dava açılması).                  */
    /* ------------------------------------------------------------ */
    {
      code: 'LEG-C',
      name: 'Hasar Kaynaklı Hukuki İşlemler',
      owner: 'usr-09',
      description:
        'Hasar bölümünden Hukuk Bölümüne devredilen işler: sahte veya tahrif edilmiş yeşil kart '
        + 'dosyaları, sigorta ettirene rücu hakkı doğuran dosyalar ve Büro ya da üye sigortacı '
        + 'aleyhine açılan davalar.',
      purpose:
        'Hasar dosyasından doğan hukuki hakkın kaybedilmemesi ve dava takibinin koordineli yürütülmesi.',
      systems: ['Dava Takip', 'Büro Hasar Sistemi'],
      inputs: ['Hasar bölümü bildirimi', 'Ödeme belgeleri', 'Dava ihbarı'],
      outputs: ['Rücu davası', 'Dava takip kaydı', 'Hukuki görüş'],
      maturity: 3,
      children: [
        {
          code: 'LEG-03',
          name: 'Hasar Dosyasından Doğan Rücu ve Dava Takibi',
          owner: 'usr-09',
          description:
            'Trafik sigortası genel şartlarına göre sigorta ettirene rücu hakkı bulunan dosyalar '
            + '(alkollü veya ehliyetsiz sürücü) ile sahte yeşil karttan açılan dosyalarda, ödeme '
            + 'yapıldıktan sonra yapılacak hukuki işlemlerin değerlendirilmesi; Büro, sigortalı '
            + 'ya da üye sigortacı aleyhine açılan davaların takibi.',
          purpose: 'Rücu hakkının zamanaşımına uğramadan kullanılması ve dava süreçlerinin izlenmesi.',
          systems: ['Dava Takip', 'Büro Hasar Sistemi', 'UYAP Entegrasyonu'],
          inputs: ['Hasar bölümü bilgilendirmesi ve belgeler', 'Ödeme dekontu'],
          outputs: ['Rücu davası dosyası', 'Dava takip kaydı'],
          maturity: 3,
          slaDays: 15,
          lastReviewedAt: '2024-12-12',
          critical: [
            ['regulatory', 'Mevzuat Gerekliliği',
              'Sahte yeşil karttan dosya açılması ve ödeme yapılması hâlinde dosya hakkında Hukuk '
              + 'Bölümüne bilgi verilir ve gerekli belgeler teslim edilir (Madde 11-12).'],
            ['financial', 'Finansal Risk',
              'Sigortalının kısmi kusurlu olmasına rağmen üçüncü şahsın tüm zararı karşılanmışsa, '
              + 'zarardan sorumlu diğer taraflara kusur oranında rücu edilir (Madde 12).'],
            ['control', 'Kontrol Noktası',
              'Rücu hakkı olan dosyalarda bu hakkın takibi için sisteme veri girişi yapılır ve '
              + 'raporlarla takip edilir (Madde 12).'],
          ],
          examples: [
            {
              title: 'Rücu hakkının sisteme işlenmemesi',
              scenario:
                'Alkollü sürücü nedeniyle rücu hakkı doğan bir dosyada ödeme yapılıyor ve Hukuk '
                + 'Bölümüne sözlü bilgi veriliyor; ancak sistemde "rücu hakkı var" işareti '
                + 'konmadığı için dosya rücu raporlarında görünmüyor.',
              risk:
                'Rücu hakkı raporlanmadığı için takip edilmiyor ve zamanaşımına uğruyor; ödenen '
                + 'tutar doğrudan zarar olarak kalıyor.',
              control:
                'Rücu hakkı doğuran hâllerde sistemde işaretleme yapılmadan dosyanın kapatılamaması '
                + 've aylık rücu hakkı raporunun Hukuk Bölümüne gönderilmesi.',
              controlType: 'Önleyici — zorunlu alan ve raporlama',
              evidence: 'Rücu hakkı işaretli dosya listesi ve aylık rapor',
              criticalNote: 'Madde 12: rücu hakkı olan dosyalarda sisteme veri girişi yapılır ve raporlarla takip edilir.',
            },
          ],
          risks: [
            {
              code: 'R-LEG-04',
              name: 'Rücu hakkının takip edilmeden zamanaşımına uğraması',
              description:
                'Sigorta ettirene ya da sahte yeşil kart düzenleyene rücu hakkı doğan dosyaların '
                + 'sistemde işaretlenmemesi ve Hukuk Bölümüne devredilmemesi.',
              cause:
                'Rücu hakkı alanının zorunlu olmaması ve hasar–hukuk devrinin sözlü yapılması.',
              consequence:
                'Rücu hakkının kullanılamaması; ödenen tazminatın tamamının Büro üzerinde kalması.',
              category: 'legal',
              inherent: [4, 4],
              residual: [3, 4],
              target: [2, 3],
              appetite: 'minimal',
              treatment: 'mitigate',
              trend: 'stable',
              owner: 'usr-09',
              identifiedAt: '2024-12-12',
              lastAssessedAt: '2026-09-08',
            },
            {
              code: 'R-LEG-05',
              name: 'Yurt dışında açılan davanın koordinasyonsuz yürütülmesi',
              description:
                'Yurt dışında sigortalı veya üye sigortacı aleyhine açılan davada ilgili ülkedeki '
                + 'temsilci ile koordinasyonun kurulmaması.',
              cause:
                'Dava ihbarının Hukuk Bölümüne ulaşmaması ya da temsilci iletişiminin dosya '
                + 'sorumlusunda kalması.',
              consequence:
                'Savunmanın zamanında yapılamaması ve aleyhte kesinleşen karar.',
              category: 'legal',
              inherent: [3, 4],
              residual: [2, 4],
              target: [2, 3],
              appetite: 'averse',
              treatment: 'mitigate',
              owner: 'usr-09',
              identifiedAt: '2024-12-12',
              lastAssessedAt: '2026-09-08',
            },
          ],
          controls: [
            {
              code: 'K-LEG-04',
              name: 'Rücu hakkı işaretlemesi ve aylık rücu raporu',
              description:
                'Rücu hakkı doğuran hâllerde (alkollü/ehliyetsiz sürücü, sahte yeşil kart, kısmi '
                + 'kusur) dosyada rücu hakkı işaretlenir; işaretsiz dosya kapatılamaz. Aylık rücu '
                + 'hakkı raporu Hukuk Bölümüne gönderilir.',
              nature: 'preventive',
              execution: 'semi_automated',
              categories: ['system', 'monitoring'],
              frequency: 'monthly',
              method: 'Dosya kapanış ekranında zorunlu alan; aylık rapor Hukuk Bölümüne iletilir.',
              evidence: 'Rücu hakkı işaretli dosya listesi ve aylık rapor teslim kaydı',
              mitigates: ['R-LEG-04'],
              owner: 'usr-09',
              key: true,
              coso: 'control_activities',
              design: 'needs_improvement',
              effectiveness: 'partially_effective',
              strength: 3,
              lastPerformedAt: '2026-08-05',
              lastTestedAt: '2026-06-12',
              testResult:
                'Aylık rapor gönderiliyor; ancak işaretleme zorunlu değil, örneklenen 12 dosyanın 3’ünde işaret yok.',
            },
            {
              code: 'K-LEG-05',
              name: 'Dava ihbarının Hukuk Bölümüne yönlendirilmesi',
              description:
                'Büro, sigortalı veya üye sigortacı aleyhine açılan davaların Büroya ihbarı '
                + 'hâlinde dosya Hukuk Bölümüne aynı gün devredilir ve sisteme dava kaydı açılır.',
              nature: 'preventive',
              execution: 'manual',
              categories: ['management'],
              frequency: 'event_based',
              method: 'Dava ihbarı gelen evrak kaydından Hukuk Bölümüne havale edilir.',
              evidence: 'Havale kaydı ve sistemdeki dava kaydı',
              mitigates: ['R-LEG-05'],
              owner: 'usr-09',
              coso: 'control_activities',
              design: 'adequate',
              effectiveness: 'effective',
              strength: 4,
              lastPerformedAt: '2026-07-22',
              lastTestedAt: '2026-05-30',
              testResult: 'Örneklenen 8 dava ihbarının tamamı aynı gün devredilmiş.',
            },
          ],
          actions: [
            {
              code: 'AKS-LEG-01',
              title: 'Rücu hakkı alanını dosya kapanışında zorunlu yapmak',
              description:
                'Süreç dokümanı Madde 12, rücu hakkı olan dosyalarda sisteme veri girişi yapılmasını '
                + 've raporla takip edilmesini şart koşuyor. Dosya kapanış ekranında rücu hakkı '
                + 'alanı zorunlu hâle getirilecek ve boş bırakılan dosya kapatılamayacak.',
              riskCode: 'R-LEG-04',
              controlCode: 'K-LEG-04',
              owner: 'usr-09',
              dueDate: '2026-12-12',
              priority: 'high',
              status: 'open',
              progress: 0,
              source: 'internal_control',
              createdAt: '2026-06-25',
              createdBy: 'usr-22',
            },
          ],
          children: [
            {
              code: 'LEG-03-1',
              name: 'Rücu hakkının değerlendirilmesi',
              description:
                'Ödeme sonrası dosyanın Hukuk Bölümüne devri, belgelerin teslimi ve rücu '
                + 'işleminin değerlendirilmesi.',
            },
            {
              code: 'LEG-03-2',
              name: 'Dava takibi ve temsilci koordinasyonu',
              description:
                'Yurt içi davalarda Hukuk Bölümü ile, yurt dışı davalarda ilgili ülkedeki temsilci '
                + 'ile koordineli takip.',
            },
          ],
        },
      ],
    },
  ],
};
