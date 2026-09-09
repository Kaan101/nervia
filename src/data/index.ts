import type { Attachment, AuditEntry, ChangeRequest, Dataset, ProcessNode } from '@/types/grc';
import type { NodeSpec } from './spec';
import { buildDataset } from './build';
import { hasarYonetimi } from './processes/hasar';
import { yurtDisiHasar } from './processes/hasar-yurtdisi';
import { hukuk, maliIsler } from './processes/others-a';
import { insanKaynaklari } from './processes/insan-kaynaklari';
import { bilgiSistemleri } from './processes/bilgi-sistemleri';
import { icKontrol, idariIsler, raporlama, riskYonetimi, satinAlma } from './processes/others-b';
import { builtInRoles } from './roles';
import { accounts } from './accounts';

const organization: NodeSpec = {
  code: 'ORG',
  name: 'Organizasyon',
  unit: 'U-EXE',
  owner: 'usr-01',
  processClass: 'management',
  standards: ['COSO', 'ISO 31000', 'ISO 9001', 'ISO 27001', 'ISO 22301', 'Three Lines Model'],
  description:
    'Şirketin uçtan uca süreç envanteri. Her ana süreç, kendi alt süreç, faaliyet ve iş adımlarıyla birlikte risk ve kontrol yapısını taşır.',
  purpose: 'Organizasyonun nasıl çalıştığını, nerede risk taşıdığını ve hangi kontrollerle yönetildiğini tek bir haritada göstermek.',
  version: '2026.3',
  lastReviewedAt: '2026-06-01',
  reviewFrequencyMonths: 12,

  /* Kurumun tüm süreçlerinin yazılı dayanağı. Alt süreçlerdeki prosedür ve
     talimatlar bu dokümana atıf yapar; İç Sistemler Yönetmeliği md. 54
     gereğince Kuruma iletilen belge de budur. */
  docs: [
    {
      code: 'DOK-ORG-01',
      name: 'TMTB Süreç ve İş Akışı Dokümanı',
      type: 'regulation',
      version: '10.0',
      owner: 'usr-22',
      publishedAt: '2024-12-12',
      updatedAt: '2024-12-12',
      nextReviewAt: '2026-12-12',
      summary:
        'Büro’nun yurt dışı ve yurt içi hasar prosedürleri, insan kaynakları ve bilgi sistemleri '
        + 'süreçleri ile iş akış şemalarını içeren ana süreç dokümanı. Sigortacılık ve Özel '
        + 'Emeklilik Sektörlerinde İç Sistemlere Dair Yönetmelik md. 54 kapsamında Kuruma iletilir.',
      sections: [
        {
          heading: 'Amaç ve kapsam',
          body: [
            'Doküman, yeşil kart sistemine dâhil ülkelerde meydana gelen kazalarda ve yurt içinde '
            + 'yeşil kart sahibi yabancı plakalı araçların karıştığı kazalarda TMTB tarafından '
            + 'yapılacak hasar yönetim işlemlerini içerir.',
            'TMTB üyesi sigortacılar tarafından düzenlenmiş tüm yeşil kart hasarlarını ve bu '
            + 'yeşil kartlara dayanan tüm talepleri kapsar.',
          ],
        },
        {
          heading: 'Dayanak',
          body: [
            'Sigortacılık ve Özel Emeklilik Sektörlerinde İç Sistemlere Dair Yönetmelik md. 54 — '
            + 'iç kontrol fonksiyonu kapsamında tanımlanan iş süreçlerinin, yıl içinde yapılan '
            + 'değişikliklerin ve güncel iş akış şemalarının Kuruma raporlanması.',
            'Aynı madde kapsamında bilgi sistemlerinin yapısı, hizmet alımları, iş sürekliliği '
            + 'tedbirleri ve yapılan testlere ilişkin raporun iletilmesi.',
          ],
        },
        {
          heading: 'Bölümler',
          body: [
            'Bölüm 4-5 — Yurt Dışı Hasar Prosedürü (Madde 1-16).',
            'Bölüm 6 — Yurt İçi Hasar Süreci (Madde 17-20).',
            'Bölüm 7 — İnsan Kaynakları (Madde 21-37).',
            'Bölüm 8 — Bilgi Sistemleri (Madde 38-41).',
            'Bölüm 9 — İş Akışları (Madde 42 Yurt Dışı, Madde 43 Yurt İçi).',
          ],
        },
        {
          heading: 'Ekler',
          body: [
            'Detaylı Yurt İçi Hasar İş Akışı.',
            'Detaylı Yurt Dışı Hasar İş Akışı.',
            'Bilgi Sistemleri Sızma Testi Raporu.',
          ],
        },
      ],
    },
  ],

  children: [
    hasarYonetimi,
    yurtDisiHasar,
    maliIsler,
    hukuk,
    bilgiSistemleri,
    insanKaynaklari,
    satinAlma,
    idariIsler,
    raporlama,
    riskYonetimi,
    icKontrol,
  ],
};

const built = buildDataset(organization);

/* ------------------------------------------------------------------ */
/* Değişiklik talepleri                                                */
/* ------------------------------------------------------------------ */

const changeRequests: ChangeRequest[] = [
  {
    id: 'chg-001',
    code: 'DT-2026-014',
    targetType: 'process',
    targetId: 'nd-HSR-08',
    targetName: 'Ödeme Günü Verme (1.2.3)',
    title: 'Ödeme günü listesinin Excel yerine kilitli çıktı olarak üretilmesi',
    reason:
      'İç Kontrol 2026-Q2 testinde ödeme günü listesinin Excel olarak üretildiği ve muhasebeye iletilmeden önce elle değiştirilebildiği tespit edildi. Sistemdeki kayıtla listenin mutabakatı düzensiz yapılıyor.',
    impact: 'high',
    requestedById: 'usr-08',
    requestedAt: '2026-07-12T10:20:00Z',
    status: 'pending_control',
    changes: [
      {
        field: 'controls.K-HSR-14.method',
        label: 'Kontrol yöntemi',
        oldValue: 'Kilitli liste üretimi ve gün sonu mutabakatı.',
        newValue:
          'Ödeme günü listesi sistemden yalnızca kilitli PDF olarak üretilir; Excel çıktısı kaldırılır ve gün sonu mutabakatı sistem tarafından otomatik yapılır.',
      },
      {
        field: 'controls.K-HSR-14.effectiveness',
        label: 'Etkinlik durumu',
        oldValue: 'Etkin Değil',
        newValue: 'Etkin (geliştirme sonrası yeniden test edilecek)',
      },
    ],
    approvals: [
      {
        order: 1,
        label: 'Birim Yöneticisi Onayı',
        requiredRole: 'unit_manager',
        approverId: 'usr-06',
        decision: 'approved',
        comment: 'Kontrolün güçlendirilmesi uygundur.',
        decidedAt: '2026-07-15T08:40:00Z',
      },
      {
        order: 2,
        label: 'İç Kontrol Onayı',
        requiredRole: 'internal_control',
        approverId: null,
        decision: 'pending',
        comment: '',
        decidedAt: null,
      },
    ],
    resultingVersion: null,
  },
  {
    id: 'chg-002',
    code: 'DT-2026-011',
    targetType: 'process',
    targetId: 'nd-HSR-05',
    targetName: 'Muallak Girişi (1.1.5)',
    title: 'Muallak asgari tutarının talep tipine göre farklılaştırılması',
    reason:
      'Tutar bildirilmemiş dosyalarda uygulanan tek bir asgari muallak tutarı, bedeni zarar dosyalarında gerçek yükümlülüğün çok altında kalıyor. Talep tipine göre ayrı parametre önerilmektedir.',
    impact: 'medium',
    requestedById: 'usr-03',
    requestedAt: '2026-06-28T13:05:00Z',
    status: 'pending_manager',
    changes: [
      {
        field: 'controls.K-HSR-09.description',
        label: 'Kontrol açıklaması',
        oldValue:
          'Tutar bildirilmemiş dosyalarda iş akışında tanımlı asgari muallak tutarı sistem tarafından zorunlu kılınır.',
        newValue:
          'Tutar bildirilmemiş dosyalarda talep tipine (maddi-araç, maddi-araç dışı, bedeni) göre ayrı tanımlanmış asgari muallak tutarı sistem tarafından zorunlu kılınır.',
      },
    ],
    approvals: [
      {
        order: 1,
        label: 'Birim Yöneticisi Onayı',
        requiredRole: 'unit_manager',
        approverId: null,
        decision: 'pending',
        comment: '',
        decidedAt: null,
      },
      {
        order: 2,
        label: 'Risk Yönetimi Onayı',
        requiredRole: 'risk_management',
        approverId: null,
        decision: 'pending',
        comment: '',
        decidedAt: null,
      },
    ],
    resultingVersion: null,
  },
  {
    id: 'chg-003',
    code: 'DT-2026-009',
    targetType: 'process',
    targetId: 'nd-HSR-01',
    targetName: 'Evrak Yönetimi (1.1.1)',
    title: 'E-posta kanalında geliş tarihinin ayrı alan olarak zorunlu kılınması',
    reason:
      'E-posta ile gelen evrakta geliş tarihi çoğu zaman kayıt tarihiyle aynı giriliyor. Zamanaşımı ve faiz başlangıcı bu tarihe bağlı olduğu için alan kanal bağımsız zorunlu olmalıdır.',
    impact: 'high',
    requestedById: 'usr-23',
    requestedAt: '2026-06-10T09:00:00Z',
    status: 'approved',
    changes: [
      {
        field: 'controls.K-HSR-01.description',
        label: 'Kontrol açıklaması',
        oldValue:
          'Fiziki evraka geliş tarihi damgası basılır; DYS’de "geliş tarihi" kayıt tarihinden ayrı zorunlu alandır.',
        newValue:
          'Tüm kanallarda (posta, e-posta, elden teslim) geliş tarihi DYS’de ayrı zorunlu alandır; e-postada mesajın sunucuya ulaştığı tarih otomatik doldurulur ve değiştirilemez.',
      },
    ],
    approvals: [
      {
        order: 1,
        label: 'Birim Yöneticisi Onayı',
        requiredRole: 'unit_manager',
        approverId: 'usr-02',
        decision: 'approved',
        comment: 'Uygundur, geliştirme talebi açıldı.',
        decidedAt: '2026-06-11T11:30:00Z',
      },
      {
        order: 2,
        label: 'İç Kontrol Onayı',
        requiredRole: 'internal_control',
        approverId: 'usr-22',
        decision: 'approved',
        comment: 'Kontrol kapsamı genişletilerek yeni versiyon yayımlanmıştır.',
        decidedAt: '2026-06-12T15:10:00Z',
      },
    ],
    resultingVersion: '3.1',
  },
  {
    id: 'chg-004',
    code: 'DT-2026-006',
    targetType: 'process',
    targetId: 'nd-SAT-01',
    targetName: 'Teklif Toplama ve Değerlendirme',
    title: 'Teklif eşiğinin 100.000 TL’den 250.000 TL’ye çıkarılması',
    reason: 'Operasyonel hız gerekçesiyle üç teklif zorunluluğu eşiğinin yükseltilmesi talep edilmiştir.',
    impact: 'high',
    requestedById: 'usr-17',
    requestedAt: '2026-05-04T14:25:00Z',
    status: 'rejected',
    changes: [
      {
        field: 'documents.PRS-SAT-01.thresholds',
        label: 'Teklif eşiği',
        oldValue: '100.001 – 500.000 TL: en az üç teklif',
        newValue: '250.001 – 500.000 TL: en az üç teklif',
      },
    ],
    approvals: [
      {
        order: 1,
        label: 'Birim Yöneticisi Onayı',
        requiredRole: 'unit_manager',
        approverId: 'usr-16',
        decision: 'approved',
        comment: 'Operasyonel gerekçe makul.',
        decidedAt: '2026-05-06T09:15:00Z',
      },
      {
        order: 2,
        label: 'İç Kontrol Onayı',
        requiredRole: 'internal_control',
        approverId: 'usr-22',
        decision: 'rejected',
        comment:
          'Rekabet ve şeffaflık kontrolü zayıflar; alım bölünmesi riski (R-SAT-01) hâlihazırda artış eğiliminde. Talep reddedilmiştir.',
        decidedAt: '2026-05-09T16:00:00Z',
      },
    ],
    resultingVersion: null,
  },
];

/* ------------------------------------------------------------------ */
/* Audit trail                                                         */
/* ------------------------------------------------------------------ */

const handwrittenAudit: AuditEntry[] = [
  {
    id: 'aud-001',
    at: '2026-08-28T09:14:00Z',
    userId: 'usr-23',
    action: 'update',
    entityType: 'control',
    entityId: 'ctl-K-HSR-23',
    entityName: 'E+60 gün garanti çağrısı hatırlatması',
    summary: 'Kontrol etkinliği “Kısmen Etkin” → “Etkin Değil” olarak güncellendi.',
    reason: '2026-Q2 kontrol testinde 60 günü aşan 11 dosyada garanti çağrısının hiç başlatılmadığı tespit edildi.',
    changes: [
      { field: 'effectiveness', label: 'Etkinlik durumu', oldValue: 'Kısmen Etkin', newValue: 'Etkin Değil' },
      { field: 'designAdequacy', label: 'Tasarım yeterliliği', oldValue: 'Yeterli', newValue: 'İyileştirme Gerekli' },
    ],
  },
  {
    id: 'aud-002',
    at: '2026-08-21T16:42:00Z',
    userId: 'usr-02',
    action: 'update',
    entityType: 'process',
    entityId: 'nd-HSR',
    entityName: 'Hasar Yönetimi',
    summary: 'Süreç versiyonu 4.1 → 4.2 olarak yayımlandı.',
    reason: 'Ödeme adımındaki IBAN doğrulama kuralı prosedüre eklendi.',
    changes: [{ field: 'version', label: 'Versiyon', oldValue: '4.1', newValue: '4.2' }],
  },
  {
    id: 'aud-003',
    at: '2026-08-14T11:05:00Z',
    userId: 'usr-21',
    action: 'update',
    entityType: 'risk',
    entityId: 'rsk-R-HSR-05',
    entityName: 'Muallak karşılığının eksik veya fazla ayrılması',
    summary: 'Artık risk skoru 8 → 12 olarak revize edildi.',
    reason:
      'Dönem sonu düzeltme tutarlarının üç çeyrektir artması üzerine etki bir kademe yükseltildi; aylık muallak gözden geçirmesi düzensiz yapılıyor.',
    changes: [
      { field: 'residual.impact', label: 'Artık etki', oldValue: '3', newValue: '4' },
      { field: 'trend', label: 'Trend', oldValue: 'Yatay', newValue: 'Yatay' },
    ],
  },
  {
    id: 'aud-004',
    at: '2026-07-22T08:30:00Z',
    userId: 'usr-24',
    action: 'create',
    entityType: 'action',
    entityId: 'act-AKS-009',
    entityName: 'Rücu entegrasyon hatalarının izlenmesi ve geriye dönük tarama',
    summary: 'İç Denetim bulgusuna istinaden kritik öncelikli aksiyon açıldı.',
    reason: 'İç Denetim 2026-07 raporu, bulgu no 2.',
  },
  {
    id: 'aud-005',
    at: '2026-07-15T08:40:00Z',
    userId: 'usr-06',
    action: 'approve',
    entityType: 'change_request',
    entityId: 'chg-001',
    entityName: 'DT-2026-014 — IBAN değişikliğinde geri arama kaydı',
    summary: 'Birim yöneticisi onayı verildi; talep İç Kontrol onayına iletildi.',
  },
  {
    id: 'aud-006',
    at: '2026-06-12T15:10:00Z',
    userId: 'usr-22',
    action: 'approve',
    entityType: 'change_request',
    entityId: 'chg-003',
    entityName: 'DT-2026-009 — Evrak geliş tarihinin zorunlu kılınması',
    summary: 'İç Kontrol onayı verildi; PRS-HSR-01 Evrak Yönetimi Prosedürü 3.1 sürümüyle yayımlandı.',
    changes: [{ field: 'version', label: 'Doküman versiyonu', oldValue: '3.0', newValue: '3.1' }],
  },
  {
    id: 'aud-007',
    at: '2026-05-09T16:00:00Z',
    userId: 'usr-22',
    action: 'reject',
    entityType: 'change_request',
    entityId: 'chg-004',
    entityName: 'DT-2026-006 — Teklif eşiğinin yükseltilmesi',
    summary: 'Talep reddedildi.',
    reason: 'Alım bölünmesi riski artış eğiliminde; kontrol ortamı zayıflar.',
  },
  {
    id: 'aud-008',
    at: '2026-06-15T10:00:00Z',
    userId: 'usr-22',
    action: 'review',
    entityType: 'process',
    entityId: 'nd-ICK',
    entityName: 'İç Kontrol',
    summary: 'Yıllık süreç gözden geçirmesi tamamlandı.',
  },
  {
    id: 'aud-009',
    at: '2026-04-22T13:20:00Z',
    userId: 'usr-08',
    action: 'update',
    entityType: 'document',
    entityId: 'doc-PRS-HSR-09',
    entityName: 'Maddi Hasar Dosya İnceleme Prosedürü',
    summary: 'Prosedür 2.3 → 2.4 sürümüne güncellendi.',
    reason: 'Eksper raporunun ikinci uzman tarafından kontrol edileceği eşik ve rapor takip adımı eklendi.',
    changes: [{ field: 'version', label: 'Versiyon', oldValue: '2.3', newValue: '2.4' }],
  },
  {
    id: 'aud-010',
    at: '2026-03-30T09:45:00Z',
    userId: 'usr-11',
    action: 'review',
    entityType: 'process',
    entityId: 'nd-BIT',
    entityName: 'Bilgi Teknolojileri',
    summary: 'Yıllık süreç gözden geçirmesi tamamlandı; olgunluk seviyesi 3 → 4 olarak güncellendi.',
    changes: [{ field: 'maturity', label: 'Olgunluk seviyesi', oldValue: '3', newValue: '4' }],
  },
];

/** Süreç gözden geçirmelerinden türetilen ek audit kayıtları. */
function derivedAudit(nodes: ProcessNode[]): AuditEntry[] {
  return nodes
    .filter((n) => n.kind === 'process' || n.kind === 'subprocess')
    .map((n, i) => ({
      id: `aud-d-${i + 1}`,
      at: `${n.lastReviewedAt}T07:30:00Z`,
      userId: n.ownerId,
      action: 'review' as const,
      entityType: 'process' as const,
      entityId: n.id,
      entityName: n.name,
      summary: `Periyodik gözden geçirme yapıldı (v${n.version}).`,
    }));
}

/* ------------------------------------------------------------------ */
/* Örnek ek bağlantıları                                               */
/* ------------------------------------------------------------------ */

/**
 * Ekler kaydın kendisinde değil, kaynak sisteminde durur. Demo verisinde
 * üç tipik kaynağı da gösteriyoruz: SharePoint kütüphanesi, ağ paylaşımı
 * ve kurum içi sunucu. Ağ yolları tarayıcıdan açılamaz; arayüz bunları
 * kopyalanabilir gösterir.
 */
const seedAttachments: Record<string, Attachment[]> = {
  'doc-PRS-HSR-01': [
    {
      id: 'att-seed-01',
      label: 'Evrak Yönetimi Prosedürü v3.0 (imzalı PDF)',
      href: 'https://tmtb.sharepoint.com/sites/IcKontrol/Prosedurler/PRS-HSR-01-v3.pdf',
      source: 'sharepoint',
      note: 'Yürürlükteki imzalı nüsha; kâğıt kopya Hasar Destek arşivindedir.',
      addedById: 'usr-05',
      addedAt: '2026-03-05T08:20:00Z',
    },
  ],
  'ctl-K-HSR-01': [
    {
      id: 'att-seed-02',
      label: 'Günlük evrak kontrol listesi (Ağustos 2026)',
      href: '\\\\dosya01\\Hasar\\Kontroller\\K-HSR-01\\2026-08.xlsx',
      source: 'network',
      note: 'Kontrol kanıtı; her ay yeni dosya açılır.',
      addedById: 'usr-05',
      addedAt: '2026-08-03T06:40:00Z',
    },
  ],
  'rsk-R-HSR-09': [
    {
      id: 'att-seed-03',
      label: 'Muallak yeterlilik analizi 2026-Q2',
      href: 'https://intranet/raporlar/hasar/muallak-analiz-2026Q2',
      source: 'server',
      note: 'Risk değerlendirmesinde kullanılan rapor.',
      addedById: 'usr-03',
      addedAt: '2026-07-14T12:05:00Z',
    },
  ],
};

/** Örnek ekleri ilgili kayıtlara iliştirir. */
function withSeedAttachments<T extends { id: string; attachments?: Attachment[] }>(items: T[]): T[] {
  return items.map((item) =>
    seedAttachments[item.id] ? { ...item, attachments: seedAttachments[item.id] } : item,
  );
}

export const dataset: Dataset = {
  ...built,
  documents: withSeedAttachments(built.documents),
  controls: withSeedAttachments(built.controls),
  risks: withSeedAttachments(built.risks),
  roles: builtInRoles,
  accounts,
  changeRequests,
  auditTrail: [...handwrittenAudit, ...derivedAudit(built.nodes)].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  ),
};

export const rootNode = built.nodeByCode.get('ORG')!;
