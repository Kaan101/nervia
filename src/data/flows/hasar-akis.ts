import type { FlowChart } from '@/types/flow';

/**
 * TMTB HASAR İŞ AKIŞLARI
 *
 * Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024),
 * Bölüm 9 – İş Akışları:
 *   Madde 42 – Yurt Dışı Hasar İş Akışları (Ana Süreçler, Kaza Bildirim,
 *              Dosya Oluşturma, Araştırma)
 *   Madde 43 – Yurt İçi Hasar İş Akışları (Kaza Bildirim, Dosya Oluşturma,
 *              Araştırma, Ödeme, Rücu İşlemleri)
 *
 * Kutu adları dokümandaki şemalarla birebir tutulmuştur; şemada olmayan
 * hiçbir adım eklenmemiştir. `note` alanları ise şemanın yanındaki
 * açıklamalar ile prosedür metnindeki (Madde 1-20) sayısal eşiklerdir —
 * kaynak maddesi `source` alanında yazılıdır.
 *
 * Yerleşim (col/row) elle verilir: otomatik yerleştirme karar dallarını
 * dokümandaki okunuşundan farklı sıralayabiliyor ve şema kaynağından
 * uzaklaşıyordu.
 */

/* ================================================================== */
/* YURT İÇİ HASAR                                                      */
/* ================================================================== */

export const yurtIciHasarAkis: FlowChart = {
  id: 'akis-hsr',
  name: 'Yurt İçi Hasar İş Akışı',
  processCode: 'HSR',
  description:
    'Yabancı plakalı aracın Türkiye’de yol açtığı zararda talebin alınmasından '
    + 'rücunun tahsiline kadar olan akış.',
  stages: [
    /* ---------------------------------------------------------- */
    {
      id: 'hsr-ana',
      name: 'Ana Süreçler',
      summary:
        'Hasar yönetiminin uçtan uca zinciri. Her kutu aşağıdaki aşamalardan '
        + 'birine karşılık gelir; Muhasebe ve Hukuk destek süreçleridir.',
      source: 'Madde 42 – Ana Süreçler şeması',
      nodes: [
        { id: 'a1', label: 'Kaza Bildirim', kind: 'task', col: 0, row: 1, nodeCode: 'HSR-01' },
        { id: 'a2', label: 'Dosya Oluşturma', kind: 'task', col: 1, row: 1, nodeCode: 'HSR-03' },
        { id: 'a3', label: 'Araştırma / İnceleme', kind: 'task', col: 2, row: 1, nodeCode: 'HSR-09' },
        { id: 'a4', label: 'Ödeme İşlemleri', kind: 'task', col: 3, row: 1, nodeCode: 'HSR-14' },
        { id: 'a5', label: 'Muhasebe', kind: 'task', col: 4, row: 1, note: 'Tahakkuk ve ödeme kaydı' },
        { id: 'a6', label: 'Hukuk', kind: 'task', col: 4, row: 2, note: 'Rücu, dava ve sahte yeşil kart işlemleri' },
      ],
      edges: [
        { from: 'a1', to: 'a2' },
        { from: 'a2', to: 'a3' },
        { from: 'a3', to: 'a4' },
        { from: 'a4', to: 'a5' },
        { from: 'a5', to: 'a6' },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsr-bildirim',
      name: 'Kaza Bildirim',
      summary:
        'Talep iki kanaldan gelir: yazılı kanal (e-posta/evrak) doğrudan '
        + 'Doküman Yönetim Sistemi’ne düşer; telefon kanalı IVR üzerinden '
        + 'yönlendirilir ve SMS ile web bağlantısı gönderilir.',
      source: 'Madde 43/1 – Kaza Bildirim şeması',
      nodes: [
        { id: 'b1', label: 'E-posta', kind: 'start', col: 0, row: 0 },
        { id: 'b2', label: 'Evrak', kind: 'start', col: 1, row: -1 },
        {
          id: 'b3', label: 'Doküman Yönetim Sistemi', kind: 'system', col: 1, row: 0,
          nodeCode: 'HSR-01',
          note: 'Dosya numarası oluşturma — kayıt numarası da olabilir',
        },
        { id: 'b4', label: 'Başvuru kaydı yapılır', kind: 'task', col: 1, row: 1, nodeCode: 'HSR-01' },
        { id: 'b5', label: 'Yurt içi / yurt dışı?', kind: 'decision', col: 2, row: 0 },
        { id: 'b6', label: 'Yurt Dışı Hasar', kind: 'handoff', col: 3, row: -1, note: 'YK — yurt dışı hasar akışına devredilir' },
        { id: 'b7', label: 'Yurt İçi Hasar', kind: 'handoff', col: 3, row: 1, note: 'MB — bu akışta devam eder' },

        { id: 'b8', label: 'Telefon', kind: 'start', col: 0, row: 3 },
        { id: 'b9', label: 'IVR (API) loglama', kind: 'system', col: 1, row: 3, note: 'Çağrı kaydı API üzerinden loglanır' },
        { id: 'b10', label: 'Kaza bildirimi mi?', kind: 'decision', col: 2, row: 3 },
        { id: 'b11', label: 'Çağrı sonlanır', kind: 'end', col: 3, row: 3 },
        { id: 'b12', label: 'Yurt içi / yurt dışı?', kind: 'decision', col: 2, row: 4 },
        { id: 'b13', label: 'MB web linki', kind: 'system', col: 1, row: 5 },
        { id: 'b14', label: 'YK web linki', kind: 'system', col: 3, row: 5 },
        { id: 'b15', label: 'SMS mesajı', kind: 'system', col: 2, row: 6 },
      ],
      edges: [
        { from: 'b1', to: 'b3' },
        { from: 'b2', to: 'b3' },
        { from: 'b3', to: 'b4' },
        { from: 'b3', to: 'b5' },
        { from: 'b5', to: 'b6', label: 'YK' },
        { from: 'b5', to: 'b7', label: 'MB' },
        { from: 'b8', to: 'b9' },
        { from: 'b9', to: 'b10' },
        { from: 'b10', to: 'b11', label: 'H' },
        { from: 'b10', to: 'b12', label: 'E' },
        { from: 'b12', to: 'b13', label: 'MB' },
        { from: 'b12', to: 'b14', label: 'YK' },
        { from: 'b13', to: 'b15' },
        { from: 'b14', to: 'b15' },
        { from: 'b12', to: 'b15' },
        { from: 'b15', to: 'b8', back: true },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsr-dosya',
      name: 'Dosya Oluşturma',
      summary:
        'Talep otomatik değerlendirilir, veri girişçisi belgeleri kontrol eder. '
        + 'Belge eksikse dosya açılamaz ve eksik işaretlenerek talep edilir; '
        + 'tamamsa dosya oluşturulur ve atama kurallarına göre sorumlu atanır.',
      source: 'Madde 43/2 – Dosya Oluşturma şeması · Madde 17',
      nodes: [
        { id: 'c1', label: 'Otomatik talep değerlendirme', kind: 'system', col: 0, row: 2, nodeCode: 'HSR-02' },
        {
          id: 'c2', label: 'Talep türü', kind: 'decision', col: 1, row: 2,
          nodeCode: 'HSR-02',
          note: 'Dosya açılmadan önce: mükerrer dosya, UHT ve Avrupa plaka sistemi kontrolü',
          source: 'Madde 17/2',
        },
        { id: 'c3', label: 'Veri girişçisi', kind: 'actor', col: 2, row: 1 },
        { id: 'c4', label: 'Belge / bilgi kontrolü', kind: 'task', col: 3, row: 1, nodeCode: 'HSR-02' },
        { id: 'c5', label: 'Belge / bilgi tam mı?', kind: 'decision', col: 4, row: 1 },
        { id: 'c6', label: 'Dosya açılamaz', kind: 'end', col: 4, row: 0 },
        { id: 'c7', label: 'Eksik belge / bilgi işaretleme', kind: 'task', col: 5, row: 1 },
        { id: 'c8', label: 'Belge / bilgi talebi', kind: 'task', col: 5, row: 0 },
        { id: 'c9', label: 'Eksik belge / bilgi', kind: 'end', col: 6, row: 0 },
        {
          id: 'c10', label: 'Dosya oluşturma', kind: 'task', col: 4, row: 2,
          nodeCode: 'HSR-03',
          note: 'UHT’si olmayan talepte muallak girişi yapılır; maddi ve bedeni ayrı girilir',
          source: 'Madde 17/4',
        },
        { id: 'c11', label: 'Zarar gören', kind: 'actor', col: 3, row: 2, note: 'SMS / e-posta ile bilgilendirilir' },
        { id: 'c12', label: 'ZK', kind: 'task', col: 1, row: 3, note: 'Zorunlu Karayolu — ayrı hat' },
        { id: 'c13', label: 'Otomatik değerlendirme', kind: 'system', col: 4, row: 3 },
        {
          id: 'c14', label: 'Atama kuralları', kind: 'decision', col: 4, row: 4,
          note: 'Açılan dosya birim yöneticisine teslim edilir; dosya sorumlusunu birim yöneticisi atar',
          source: 'Madde 17/6 · Madde 18/1',
        },
        { id: 'c15', label: 'Dosya sorumlusu', kind: 'actor', col: 2, row: 4 },
        {
          id: 'c16', label: 'UHT', kind: 'handoff', col: 6, row: 4,
          note: 'UHT kaydı oluşturulur, referans numarası istenir ve sisteme kaydedilir',
          source: 'Madde 17/3',
        },
      ],
      edges: [
        { from: 'c1', to: 'c2' },
        { from: 'c2', to: 'c3' },
        { from: 'c2', to: 'c12' },
        { from: 'c3', to: 'c4' },
        { from: 'c4', to: 'c5' },
        { from: 'c5', to: 'c6', label: 'Eksik' },
        { from: 'c5', to: 'c7', label: 'Eksik' },
        { from: 'c7', to: 'c8' },
        { from: 'c8', to: 'c9' },
        { from: 'c5', to: 'c10', label: 'Tamam' },
        { from: 'c10', to: 'c11', label: 'SMS / e-posta' },
        { from: 'c12', to: 'c11', label: 'SMS / e-posta' },
        { from: 'c10', to: 'c13' },
        { from: 'c13', to: 'c14' },
        { from: 'c14', to: 'c15' },
        { from: 'c12', to: 'c15' },
        { from: 'c14', to: 'c16', label: 'Evrak gönderimi (fiziksel / e-posta)' },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsr-arastirma',
      name: 'Araştırma',
      summary:
        'Dosya sorumlusu belgeleri inceler, yeşil kartı ve kusuru değerlendirir. '
        + 'Yeşil kart yoksa ya da talep reddedilirse ret sürecine, kabul edilirse '
        + 'teminat onayı alınarak ödeme sürecine gider.',
      source: 'Madde 43/3 – Araştırma şeması · Madde 18',
      nodes: [
        { id: 'd1', label: 'Arabulucu var mı?', kind: 'decision', col: 0, row: 2 },
        { id: 'd2', label: 'Arabuluculuk', kind: 'task', col: 0, row: 1 },
        { id: 'd3', label: 'Büro vekili', kind: 'actor', col: 0, row: 0 },
        {
          id: 'd4', label: 'Belgeleri inceleme', kind: 'task', col: 1, row: 2,
          nodeCode: 'HSR-09',
          note: 'Ön inceleme: eksik belge tespiti, kusur dağılımı, TRAMER girişi ve eksper kararı Dosya Kontrol Formu’na işlenir',
          source: 'Madde 18/2',
        },
        { id: 'd5', label: 'Mevcut ya da gelebilecek alt dosya talepleri', kind: 'task', col: 1, row: 3 },
        { id: 'd6', label: 'Alt dosya', kind: 'decision', col: 2, row: 3 },
        { id: 'd7', label: 'Talep türü (maddi / bedeni)', kind: 'decision', col: 2, row: 2, nodeCode: 'HSR-10' },
        { id: 'd8', label: 'YK var mı?', kind: 'decision', col: 3, row: 2 },
        { id: 'd9', label: 'Ret süreci', kind: 'handoff', col: 3, row: 1, note: 'Red kararı birim yöneticisi onayıyla, gerekçeli ve yazılı bildirilir', source: 'Madde 18/4' },
        {
          id: 'd10', label: 'YK sigortacıya / büroya bildirim', kind: 'task', col: 4, row: 2,
          nodeCode: 'HSR-11',
          note: 'E-posta / COBX ekranı. İhbar tarihinden itibaren bir ay içinde cevap gelmezse nazik hatırlatma yapılır',
          source: 'Madde 18/4',
        },
        { id: 'd11', label: 'Kusur değerlendirmesi', kind: 'task', col: 5, row: 2, nodeCode: 'HSR-12' },
        { id: 'd12', label: 'Ret mi?', kind: 'decision', col: 6, row: 2 },
        { id: 'd13', label: 'Kurum / rücu talebi?', kind: 'decision', col: 7, row: 2 },
        { id: 'd14', label: 'Kurum / rücu talepleri', kind: 'task', col: 7, row: 3 },
        { id: 'd15', label: 'Bağımsız bilirkişi ataması', kind: 'task', col: 8, row: 2, note: 'Eksper, tıbbi danışman ve aktüer ücretleri ilgili talimata göre sisteme girilir' },
        { id: 'd16', label: 'Zarar gören', kind: 'actor', col: 9, row: 1 },
        { id: 'd17', label: 'Bağımsız bilirkişi', kind: 'actor', col: 9, row: 3 },
        {
          id: 'd18', label: 'YK sigortacıdan / bürodan teminat onayı alınması', kind: 'task', col: 10, row: 2,
          nodeCode: 'HSR-13',
          note: 'Talep tutarının teminat limitini aşması hâlinde aşan kısım için yabancı sigortacıdan ayrıca ve açıkça onay istenir',
          source: 'Madde 18/4',
        },
        { id: 'd19', label: 'Belge / bilgi kontrol', kind: 'task', col: 10, row: 3 },
        { id: 'd20', label: 'Belge / bilgi tamam mı?', kind: 'decision', col: 10, row: 4 },
        { id: 'd21', label: 'Ödeme süreci', kind: 'handoff', col: 10, row: 5 },
      ],
      edges: [
        { from: 'd1', to: 'd2', label: 'E' },
        { from: 'd2', to: 'd3' },
        { from: 'd1', to: 'd4', label: 'H' },
        { from: 'd4', to: 'd7' },
        { from: 'd4', to: 'd5' },
        { from: 'd5', to: 'd6' },
        { from: 'd6', to: 'd7' },
        { from: 'd7', to: 'd8' },
        { from: 'd8', to: 'd9', label: 'H' },
        { from: 'd8', to: 'd10', label: 'E' },
        { from: 'd10', to: 'd11' },
        { from: 'd11', to: 'd12' },
        { from: 'd12', to: 'd9', label: 'E', back: true },
        { from: 'd12', to: 'd13', label: 'H' },
        { from: 'd13', to: 'd14', label: 'E' },
        { from: 'd13', to: 'd15', label: 'H' },
        { from: 'd14', to: 'd15' },
        { from: 'd15', to: 'd16', label: 'E-posta / evrak' },
        { from: 'd15', to: 'd17' },
        { from: 'd16', to: 'd18' },
        { from: 'd17', to: 'd18' },
        { from: 'd18', to: 'd19' },
        { from: 'd19', to: 'd20' },
        { from: 'd20', to: 'd18', label: 'H', back: true },
        { from: 'd20', to: 'd21', label: 'E' },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsr-odeme',
      name: 'Ödeme',
      summary:
        'Talep girişi birim yöneticisi onayından geçer ve ödeme günü verilir. '
        + 'Güvence Hesabı’ndan para gelmeden yapılacak peşin ödemeler Birim '
        + 'Müdürünün onayı ve bilgisi dâhilinde yapılır.',
      source: 'Madde 43/4 – Ödeme şeması · Madde 19',
      nodes: [
        {
          id: 'e1', label: 'Peşin ödeme', kind: 'start', col: 0, row: 0,
          note: 'Güvence Hesabından talep edilmeden ödenecek dosyalar yalnızca Birim Müdürünün onayı ve bilgisi dâhilinde ödenir',
          source: 'Madde 19/5',
        },
        { id: 'e2', label: 'Muhasebe departmanı bilgilendirme', kind: 'task', col: 0, row: 1 },
        { id: 'e3', label: 'Muhasebe öder', kind: 'task', col: 0, row: 2, nodeCode: 'HSR-15' },
        { id: 'e4', label: 'Dosya sorumlusu / Hukuk departmanı', kind: 'actor', col: 0, row: 3 },
        { id: 'e5', label: 'Talep girişi', kind: 'task', col: 1, row: 0, nodeCode: 'HSR-13' },
        {
          id: 'e6', label: 'Talep onay', kind: 'task', col: 2, row: 0,
          nodeCode: 'HSR-14',
          note: 'Talep girişi yapılan dosyalar birim yöneticisine verilir; onaylananlar Güvence Hesabından talep edilir',
          source: 'Madde 18/4',
        },
        {
          id: 'e7', label: 'Ödeme günü verme', kind: 'task', col: 3, row: 0,
          nodeCode: 'HSR-15',
          note: 'Ödeme günü verilen dosyaların listesi kontrol edilerek ödemeden bir gün önce Muhasebe’ye verilir',
          source: 'Madde 19/2-3',
        },
      ],
      edges: [
        { from: 'e1', to: 'e2', label: 'E-posta' },
        { from: 'e2', to: 'e3' },
        { from: 'e3', to: 'e4', label: 'E-posta' },
        { from: 'e3', to: 'e5' },
        { from: 'e5', to: 'e6' },
        { from: 'e6', to: 'e7' },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsr-rucu',
      name: 'Rücu İşlemleri',
      summary:
        'Ödenen tutar için rücu talebi (fatura) hazırlanır ve yeşil kart '
        + 'sigortacısına ya da ilgili ülke bürosuna iletilir. Para gelmezse '
        + 'yazışma zinciri ardından Garanti Çağrısı (G. Call) prosedürü işler.',
      source: 'Madde 43/5 – Rücu İşlemleri şeması · Madde 20',
      nodes: [
        { id: 'f1', label: 'Ödeme işlemleri tamamlanır', kind: 'start', col: 0, row: 1 },
        { id: 'f2', label: 'Rücu talebi oluşturma', kind: 'task', col: 1, row: 1, nodeCode: 'HSR-16' },
        {
          id: 'f3', label: 'Rücu talebi YK sigortacısına / büroya iletilir', kind: 'task', col: 2, row: 1,
          nodeCode: 'HSR-16',
          note: 'Yurt dışından gelen paranın sisteme kaydı Muhasebe servisi tarafından yapılır',
          source: 'Madde 20/1-2',
        },
        { id: 'f4', label: 'Dosya kapanır', kind: 'task', col: 3, row: 1 },
        {
          id: 'f5', label: 'Geri ödeme kontrolü', kind: 'decision', col: 4, row: 1,
          nodeCode: 'HSR-17',
          note: 'Parası gelmeyen taleplerin takibi dosya sorumlusundadır',
          source: 'Madde 20/3',
        },
        { id: 'f6', label: 'Ödeme geldiyse', kind: 'decision', col: 5, row: 0 },
        { id: 'f7', label: 'Muhasebe giriş işlemlerini tamamlar', kind: 'end', col: 6, row: 0 },
        { id: 'f8', label: 'Ödeme gelmediyse', kind: 'decision', col: 5, row: 2 },
        {
          id: 'f9', label: 'Garanti Call süreci başlar', kind: 'handoff', col: 6, row: 2,
          note: 'Önce sigorta şirketine, sonra ilgili ülke bürosuna G. Call öncesi yazı yazılır; süre geçerse G. Call uygulanır — bu aşamada son bir kontrol yapılır',
          source: 'Madde 20/3-4',
        },
      ],
      edges: [
        { from: 'f1', to: 'f2' },
        { from: 'f2', to: 'f3' },
        { from: 'f3', to: 'f4' },
        { from: 'f4', to: 'f5' },
        { from: 'f5', to: 'f6' },
        { from: 'f6', to: 'f7' },
        { from: 'f5', to: 'f8' },
        { from: 'f8', to: 'f9' },
      ],
    },
  ],
};

/* ================================================================== */
/* YURT DIŞI HASAR                                                     */
/* ================================================================== */

export const yurtDisiHasarAkis: FlowChart = {
  id: 'akis-hsd',
  name: 'Yurt Dışı Hasar İş Akışı',
  processCode: 'HSD',
  description:
    'TMTB üyesi sigortacının düzenlediği yeşil kartla yurt dışında meydana '
    + 'gelen kazada talebin alınmasından ödeme talebinin oluşturulmasına '
    + 'kadar olan akış.',
  stages: [
    /* ---------------------------------------------------------- */
    {
      id: 'hsd-bildirim',
      name: 'Kaza Bildirim',
      summary:
        'Bildirim TMTB’ye üç yoldan ulaşır: kazanın olduğu ülkenin bürosu '
        + '(aynı zamanda COBX üzerinden), o ülkedeki muhabir ve doğrudan '
        + 'zarar gören. Telefonla tazminat talebi kabul edilmez.',
      source: 'Madde 42/2 – Kaza Bildirim şeması · Madde 2',
      nodes: [
        { id: 'g1', label: 'Ülke bürosu', kind: 'actor', col: 0, row: 0 },
        { id: 'g2', label: 'COBX', kind: 'system', col: 2, row: 0, note: 'Bürolar Konseyi ortak veri değişim sistemi' },
        { id: 'g3', label: 'Muhabir', kind: 'actor', col: 0, row: 2 },
        { id: 'g4', label: 'Zarar gören', kind: 'actor', col: 0, row: 4 },
        {
          id: 'g5', label: 'TMTB', kind: 'task', col: 2, row: 2,
          nodeCode: 'HSD-01',
          note: 'Gelen tüm ihbar ve talep bildirimleri gelen evrak defterine kaydedilir. '
            + 'Telefonla tazminat talep bildirimi kabul edilmez; talebini yazılı iletmesi istenir',
          source: 'Madde 2/1',
        },
      ],
      edges: [
        { from: 'g1', to: 'g2' },
        { from: 'g2', to: 'g5' },
        { from: 'g1', to: 'g5', label: 'E-posta, evrak' },
        { from: 'g3', to: 'g5', label: 'E-posta, evrak' },
        { from: 'g4', to: 'g5', label: 'E-posta, telefon, evrak' },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsd-dosya',
      name: 'Dosya Oluşturma',
      summary:
        'Dosya sorumlusu atanır, belge ve bilgi kontrol edilir. Eksik bilgi '
        + 'talep edilerek tamamlanır; dosya açıldıktan sonra sigortalıya kaza '
        + 'bildirim formu, muhabire teminat formu gönderilir.',
      source: 'Madde 42/3 – Dosya Oluşturma şeması · Madde 4',
      nodes: [
        { id: 'h1', label: 'Hasar sorumlusu atama kontrolü', kind: 'task', col: 0, row: 0, nodeCode: 'HSD-01' },
        {
          id: 'h2', label: 'Kaza ülkesi', kind: 'decision', col: 1, row: 0,
          note: 'Atama ölçütü: kaza ülkesi / muallak tutarı / diğer',
        },
        { id: 'h3', label: 'Dosya sorumlusu', kind: 'actor', col: 2, row: 0 },
        {
          id: 'h4', label: 'Belge / bilgi kontrolü', kind: 'task', col: 3, row: 0,
          nodeCode: 'HSD-02',
          note: 'Asgari bilgi: kaza tarihi, sigortalı aracın plakası veya yeşil kart bilgileri, kazanın meydana geldiği ülke',
          source: 'Madde 2/2',
        },
        {
          id: 'h5', label: 'Eksik bilgi', kind: 'decision', col: 4, row: 0,
          note: 'Dosya numarası oluşturma — kayıt numarası da olabilir. '
            + 'Dosya numarası ülke kodu + işlem yılı + 6 hane olacak şekilde 10 rakamdan oluşur',
          source: 'Madde 2/2',
        },
        { id: 'h6', label: 'Eksik bilgi işaretleme', kind: 'task', col: 5, row: 0 },
        { id: 'h7', label: 'Bilgi talebi', kind: 'task', col: 5, row: 1 },
        { id: 'h8', label: 'Eksik bilgi', kind: 'end', col: 5, row: 2 },
        {
          id: 'h9', label: 'Dosya açma', kind: 'task', col: 4, row: 3,
          nodeCode: 'HSD-03',
          note: 'Fiziki dosya yalnızca altı hâlde açılır (bedeni zararlı 50.000 € üzeri, direkt başvuru, '
            + 'dava ihtimali, orijinal belge, sahte yeşil kart, yönetim onayı); durum ekrana FDA / FDY yazılır',
          source: 'Madde 4/2',
        },
        { id: 'h10', label: 'Sigortalımıza kaza bildirim formu gönderme', kind: 'task', col: 5, row: 3 },
        { id: 'h11', label: 'Sigortalı', kind: 'actor', col: 5, row: 4 },
        {
          id: 'h12', label: 'Muhabire teminat formu gönderme', kind: 'task', col: 2, row: 3,
          nodeCode: 'HSD-04',
          note: 'Teminat onayı sistemdeki YK dosyasından otomatik hazırlanır ve referans numarasıyla gönderilir',
          source: 'Madde 5/1',
        },
      ],
      edges: [
        { from: 'h1', to: 'h2' },
        { from: 'h2', to: 'h3' },
        { from: 'h3', to: 'h4' },
        { from: 'h4', to: 'h5' },
        { from: 'h5', to: 'h6', label: 'E' },
        { from: 'h6', to: 'h7' },
        { from: 'h7', to: 'h8' },
        { from: 'h8', to: 'h9', back: true },
        { from: 'h5', to: 'h9', label: 'H' },
        { from: 'h9', to: 'h10' },
        { from: 'h10', to: 'h11' },
        { from: 'h9', to: 'h12' },
      ],
    },

    /* ---------------------------------------------------------- */
    {
      id: 'hsd-arastirma',
      name: 'Araştırma',
      summary:
        'Belgeler ve sigortalı beyanı incelenir. Muallak tutarı 100.000 €’yu '
        + 'aşarsa kıdemli sorumlu atanır. Kusur yoksa dosya tedvir ücreti '
        + 'ödenerek kapanır; kusur varsa muhabir şirkete ödeme onayı verilir.',
      source: 'Madde 42/4 – Araştırma şeması · Madde 5-8',
      nodes: [
        { id: 'i1', label: 'Belgeleri inceleme', kind: 'task', col: 0, row: 2, nodeCode: 'HSD-05' },
        { id: 'i2', label: 'Sigortalı beyanı inceleme', kind: 'task', col: 1, row: 2, nodeCode: 'HSD-06' },
        {
          id: 'i3', label: 'Muallak tutarı 100.000 €’dan büyükse', kind: 'decision', col: 1, row: 3,
          nodeCode: 'HSD-04',
          note: '50.000 € üzeri muallak ile yaralanmalı/ölümlü kazalarda ayrıca Bölüm Yöneticisine bilgi verilir ve görüşü alınır',
          source: 'Madde 6',
        },
        { id: 'i4', label: 'Kıdemli sorumlu atanır', kind: 'task', col: 1, row: 4 },
        {
          id: 'i5', label: 'Kusur var mı?', kind: 'decision', col: 3, row: 2,
          note: '(1) Sigortalı kusuru kabul etmezse',
        },
        { id: 'i6', label: 'Muhabirden tedvir ücreti', kind: 'task', col: 3, row: 1 },
        { id: 'i7', label: 'Dosya kapanır', kind: 'end', col: 3, row: 0 },
        { id: 'i8', label: 'Muhabir şirkete ödeme onayı', kind: 'task', col: 4, row: 2, nodeCode: 'HSD-11' },
        { id: 'i9', label: 'Zarar gören', kind: 'actor', col: 5, row: 2 },
        { id: 'i10', label: 'Muhabir', kind: 'actor', col: 4, row: 3 },
        {
          id: 'i11', label: 'Muhabir şirketin evrakları göndermesi', kind: 'task', col: 4, row: 4,
          nodeCode: 'HSD-13',
          note: '25.000 € üzeri tazminat ödemelerinde temsilcinin hak sahibine yaptığı ödemeye ilişkin ödeme belgesi zorunludur',
          source: 'Madde 8',
        },
        { id: 'i12', label: 'Evraklar eksik', kind: 'decision', col: 4, row: 5 },
        {
          id: 'i13', label: 'Ödeme talebi oluşturma', kind: 'handoff', col: 4, row: 6,
          nodeCode: 'HSD-14',
          note: 'Rücu taleplerinin tahakkuk işlemi Yeşil Kart Reasürans Havuzu ilkeleri gereğince aylık yapılır',
          source: 'Madde 8',
        },
      ],
      edges: [
        { from: 'i1', to: 'i2' },
        { from: 'i2', to: 'i3' },
        { from: 'i3', to: 'i4', label: 'E' },
        { from: 'i4', to: 'i5', back: true },
        { from: 'i3', to: 'i5', label: 'H' },
        { from: 'i2', to: 'i5' },
        { from: 'i5', to: 'i6', label: 'H' },
        { from: 'i6', to: 'i7' },
        { from: 'i5', to: 'i8', label: 'E' },
        { from: 'i8', to: 'i9' },
        { from: 'i8', to: 'i10' },
        { from: 'i10', to: 'i11' },
        { from: 'i11', to: 'i12' },
        { from: 'i12', to: 'i10', label: 'E — e-posta', back: true },
        { from: 'i12', to: 'i13', label: 'H' },
        { from: 'i10', to: 'i5', label: 'E-posta', back: true },
      ],
    },
  ],
};

export const flowCharts: FlowChart[] = [yurtIciHasarAkis, yurtDisiHasarAkis];
