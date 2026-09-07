import type { AuditEntry, ChangeRequest, Dataset, ProcessNode } from '@/types/grc';
import type { NodeSpec } from './spec';
import { buildDataset } from './build';
import { hasarYonetimi } from './processes/hasar';
import { yurtDisiHasar } from './processes/hasar-yurtdisi';
import { bilgiTeknolojileri, hukuk, insanKaynaklari, maliIsler } from './processes/others-a';
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
  children: [
    hasarYonetimi,
    yurtDisiHasar,
    maliIsler,
    hukuk,
    bilgiTeknolojileri,
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
    targetId: 'nd-HSR-09',
    targetName: 'Ödeme',
    title: 'IBAN değişikliğinde geri arama kaydının zorunlu hale getirilmesi',
    reason:
      'İç Kontrol 2026-Q2 testinde 25 örneklemin 4’ünde geri arama kaydı bulunamadı. Kontrolün kanıtı sistemde zorunlu alan olarak tutulmalıdır.',
    impact: 'high',
    requestedById: 'usr-08',
    requestedAt: '2026-07-12T10:20:00Z',
    status: 'pending_control',
    changes: [
      {
        field: 'controls.K-HSR-18.method',
        label: 'Kontrol yöntemi',
        oldValue: 'IBAN değişikliği iş akışı; geri arama kaydı ve ikinci kullanıcı onayı zorunlu.',
        newValue:
          'IBAN değişikliği iş akışı; ses kaydı referansı zorunlu alan olarak girilmeden iş akışı ilerleyemez, ikinci kullanıcı onayı zorunlu.',
      },
      {
        field: 'controls.K-HSR-18.effectiveness',
        label: 'Etkinlik durumu',
        oldValue: 'Kısmen Etkin',
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
    targetName: 'Hasar Değerlendirmesi',
    title: 'İkinci göz eşiğinin 250.000 TL’den risk bazlı modele çevrilmesi',
    reason:
      'Sabit eşik, düşük tutarlı ancak yüksek suistimal riskli dosyaları kapsam dışında bırakıyor. Branş ve suistimal skoruna göre değişken eşik önerilmektedir.',
    impact: 'medium',
    requestedById: 'usr-03',
    requestedAt: '2026-06-28T13:05:00Z',
    status: 'pending_manager',
    changes: [
      {
        field: 'controls.K-HSR-09.description',
        label: 'Kontrol açıklaması',
        oldValue: '250.000 TL üzerindeki hasar tutarlarında ikinci göz değerlendirmesi yapılır.',
        newValue:
          'Branş ve suistimal skoruna göre belirlenen dinamik eşiğin üzerindeki dosyalarda ikinci göz değerlendirmesi yapılır.',
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
    targetName: 'Hasar İhbarı',
    title: 'E-posta kanalının günlük mutabakat kapsamına alınması',
    reason: 'Kanal mutabakatı e-posta kutusunu kapsamadığı için üç ihbarın kayda geçmediği tespit edildi.',
    impact: 'high',
    requestedById: 'usr-23',
    requestedAt: '2026-06-10T09:00:00Z',
    status: 'approved',
    changes: [
      {
        field: 'controls.K-HSR-02.description',
        label: 'Kontrol açıklaması',
        oldValue: 'Çağrı merkezi, web formu ve acente portalı ihbar adetleri karşılaştırılır.',
        newValue:
          'Çağrı merkezi, web formu, acente portalı ve hasar e-posta kutusundan gelen ihbar adetleri karşılaştırılır.',
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
    entityId: 'ctl-K-HSR-21',
    entityName: 'Rücu potansiyeli otomatik taraması',
    summary: 'Kontrol etkinliği “Kısmen Etkin” → “Etkin Değil” olarak güncellendi.',
    reason: '2026-Q2 kontrol testinde 42 dosyanın 11’inde rücu dosyası açılmadığı tespit edildi.',
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
    entityName: 'Sahte veya tahrif edilmiş evrak ile işlem yapılması',
    summary: 'Artık risk skoru 9 → 12 olarak revize edildi.',
    reason: 'Son altı ayda tespit edilen suistimal girişimlerinde artış gözlendi; trend “artıyor” olarak işaretlendi.',
    changes: [
      { field: 'residual.likelihood', label: 'Artık olasılık', oldValue: '2', newValue: '3' },
      { field: 'trend', label: 'Trend', oldValue: 'Yatay', newValue: 'Artıyor' },
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
    entityName: 'DT-2026-009 — E-posta kanalının mutabakata alınması',
    summary: 'İç Kontrol onayı verildi; PRS-HSR-01 prosedürü 3.1 sürümüyle yayımlandı.',
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
    entityName: 'Hasar Ödeme Prosedürü',
    summary: 'Prosedür 5.1 → 5.2 sürümüne güncellendi.',
    reason: 'IBAN değişiklik taleplerinde geri arama ve ikinci onay adımı eklendi.',
    changes: [{ field: 'version', label: 'Versiyon', oldValue: '5.1', newValue: '5.2' }],
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

export const dataset: Dataset = {
  ...built,
  roles: builtInRoles,
  accounts,
  changeRequests,
  auditTrail: [...handwrittenAudit, ...derivedAudit(built.nodes)].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  ),
};

export const rootNode = built.nodeByCode.get('ORG')!;
