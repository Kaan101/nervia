import type {
  ActionPriority, ActionSource, ActionStatus, ChangeRequest, ControlCategory, ControlEffectiveness,
  ControlExecution, ControlFrequency, ControlNature, CosoComponent, DocumentType,
  NodeKind, ProcessClass, ProcessStatus, RiskAppetite, RiskCategory, RiskLevel,
  RiskStatus, RiskTreatment, RiskTrend, RoleId, AuditAction, EntityType,
  ChangeRequestStatus,
} from '@/types/grc';

/** Arka plandaki GRC terminolojisini arayüz diline çeviren sözlükler. */

export const roleLabels: Record<RoleId, string> = {
  employee: 'Çalışan',
  process_owner: 'Süreç Sahibi',
  unit_manager: 'Birim Yöneticisi',
  internal_control: 'İç Kontrol',
  risk_management: 'Risk Yönetimi',
  internal_audit: 'İç Denetim',
  executive: 'Üst Yönetim',
  system_admin: 'Sistem Yöneticisi',
};

export const roleDescriptions: Record<RoleId, string> = {
  employee: 'Kendi biriminin süreçlerini görüntüler, öneri ve değişiklik talebi oluşturur.',
  process_owner: 'Sahibi olduğu süreçleri günceller, risk ve kontrolleri yönetir.',
  unit_manager: 'Biriminin tüm süreçlerini görür, değişiklik taleplerini birinci aşamada onaylar.',
  internal_control: 'Kontrol tasarımını ve etkinliğini değerlendirir, tüm süreçleri görüntüler.',
  risk_management: 'Risk envanterini yönetir, risk değerlendirmesi ve iştah bantlarını belirler.',
  internal_audit: 'Bağımsız güvence sağlar; tüm kayıtları ve audit trail’i görüntüler.',
  executive: 'Kurumsal risk profilini ve yönetim göstergelerini izler.',
  system_admin: 'Kullanıcı, yetki ve referans verilerini yönetir.',
};

export const nodeKindLabels: Record<NodeKind, string> = {
  organization: 'Organizasyon',
  process: 'Ana Süreç',
  subprocess: 'Alt Süreç',
  activity: 'Faaliyet',
  step: 'İş Adımı',
};

/** Çoğul biçimler — Türkçe ekler düzensiz olduğu için ayrı tanımlanır. */
export const nodeKindPlurals: Record<NodeKind, string> = {
  organization: 'Organizasyonlar',
  process: 'Ana Süreçler',
  subprocess: 'Alt Süreçler',
  activity: 'Faaliyetler',
  step: 'İş Adımları',
};

export const processStatusLabels: Record<ProcessStatus, string> = {
  active: 'Yürürlükte',
  draft: 'Taslak',
  under_review: 'Gözden Geçiriliyor',
  archived: 'Arşiv',
};

export const processClassLabels: Record<ProcessClass, string> = {
  core: 'Temel Süreç',
  support: 'Destek Süreci',
  management: 'Yönetim Süreci',
};

export const riskCategoryLabels: Record<RiskCategory, string> = {
  operational: 'Operasyonel Risk',
  financial: 'Finansal Risk',
  legal: 'Hukuki Risk',
  compliance: 'Mevzuat Riski',
  it: 'Bilgi Teknolojileri Riski',
  cyber: 'Siber Risk',
  privacy: 'Veri Gizliliği Riski',
  hr: 'İnsan Kaynakları Riski',
  supplier: 'Tedarikçi Riski',
  strategic: 'Stratejik Risk',
  reputational: 'İtibar Riski',
  continuity: 'İş Sürekliliği Riski',
};

export const riskLevelLabels: Record<RiskLevel, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const riskTreatmentLabels: Record<RiskTreatment, string> = {
  mitigate: 'Azalt',
  accept: 'Kabul Et',
  transfer: 'Devret',
  avoid: 'Kaçın',
};

export const riskStatusLabels: Record<RiskStatus, string> = {
  open: 'Açık',
  monitoring: 'İzleniyor',
  mitigated: 'Azaltıldı',
  closed: 'Kapatıldı',
};

export const riskTrendLabels: Record<RiskTrend, string> = {
  up: 'Artıyor',
  down: 'Azalıyor',
  stable: 'Yatay',
};

export const riskAppetiteLabels: Record<RiskAppetite, string> = {
  averse: 'Kaçınan',
  minimal: 'Asgari',
  cautious: 'Temkinli',
  open: 'Açık',
};

export const controlNatureLabels: Record<ControlNature, string> = {
  preventive: 'Önleyici',
  detective: 'Tespit Edici',
  corrective: 'Düzeltici',
};

export const controlExecutionLabels: Record<ControlExecution, string> = {
  manual: 'Manuel',
  automated: 'Otomatik',
  semi_automated: 'Yarı Otomatik',
};

export const controlCategoryLabels: Record<ControlCategory, string> = {
  system: 'Sistem Kontrolü',
  management: 'Yönetim Kontrolü',
  reconciliation: 'Mutabakat',
  authorization: 'Yetki Kontrolü',
  approval: 'Onay Kontrolü',
  data_validation: 'Veri Doğrulama',
  segregation_of_duties: 'Görevler Ayrılığı',
  physical: 'Fiziksel Kontrol',
  monitoring: 'İzleme Kontrolü',
};

export const controlFrequencyLabels: Record<ControlFrequency, string> = {
  continuous: 'Sürekli',
  per_transaction: 'Her İşlemde',
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: 'Üç Aylık',
  annual: 'Yıllık',
  event_based: 'Olay Bazlı',
};

export const controlEffectivenessLabels: Record<ControlEffectiveness, string> = {
  effective: 'Etkin',
  partially_effective: 'Kısmen Etkin',
  ineffective: 'Etkin Değil',
  not_tested: 'Test Edilmedi',
};

export const cosoComponentLabels: Record<CosoComponent, string> = {
  control_environment: 'Kontrol Ortamı',
  risk_assessment: 'Risk Değerlendirme',
  control_activities: 'Kontrol Faaliyetleri',
  information_communication: 'Bilgi ve İletişim',
  monitoring: 'İzleme',
};

export const actionStatusLabels: Record<ActionStatus, string> = {
  open: 'Açık',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

export const actionPriorityLabels: Record<ActionPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const actionSourceLabels: Record<ActionSource, string> = {
  risk_assessment: 'Risk Değerlendirmesi',
  internal_control: 'İç Kontrol',
  internal_audit: 'İç Denetim',
  incident: 'Olay / Kayıp',
  self_assessment: 'Öz Değerlendirme',
  regulatory: 'Mevzuat',
};

export const documentTypeLabels: Record<DocumentType, string> = {
  procedure: 'Prosedür',
  instruction: 'Talimat',
  policy: 'Politika',
  form: 'Form',
  checklist: 'Kontrol Listesi',
  regulation: 'Mevzuat',
  training: 'Eğitim Dokümanı',
};

export const auditActionLabels: Record<AuditAction, string> = {
  create: 'Oluşturdu',
  update: 'Güncelledi',
  delete: 'Sildi',
  approve: 'Onayladı',
  reject: 'Reddetti',
  submit: 'Talep Oluşturdu',
  login: 'Giriş Yaptı',
  logout: 'Çıkış Yaptı',
  review: 'Gözden Geçirdi',
  view: 'Görüntüledi',
};

export const entityTypeLabels: Record<EntityType, string> = {
  process: 'Süreç',
  risk: 'Risk',
  control: 'Kontrol',
  action: 'Aksiyon',
  document: 'Doküman',
  kri: 'KRI',
  change_request: 'Değişiklik Talebi',
  account: 'Kullanıcı Hesabı',
  role: 'Rol',
  session: 'Oturum',
};

export const changeRequestStatusLabels: Record<ChangeRequestStatus, string> = {
  draft: 'Taslak',
  pending_manager: 'Birim Yöneticisi Onayında',
  pending_control: 'İç Kontrol Onayında',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

/**
 * Talebin görünen durumu.
 *
 * `ChangeRequestStatus` ikinci hat onayını tek bir değerle (`pending_control`)
 * temsil eder; oysa zincirin ikinci kademesi risklerde Risk Yönetimi, diğer
 * kayıtlarda İç Kontrol'dür. Etiket bu yüzden bekleyen onay adımından
 * türetilir — kullanıcı kimin onayını beklediğini doğru görür.
 */
export function changeRequestStatusText(request: ChangeRequest): string {
  if (request.status === 'approved' || request.status === 'rejected' || request.status === 'draft') {
    return changeRequestStatusLabels[request.status];
  }
  const step = request.approvals.find((a) => a.decision === 'pending');
  return step ? `${roleLabels[step.requiredRole]} Onayında` : changeRequestStatusLabels[request.status];
}

export const criticalPointLabels: Record<string, string> = {
  control: 'Kritik Kontrol',
  authorization: 'Yetki Kontrolü',
  financial: 'Finansal Risk',
  privacy: 'Veri Gizliliği',
  regulatory: 'Mevzuat Gerekliliği',
  continuity: 'İş Sürekliliği',
};

export const maturityLabels: Record<number, string> = {
  1: 'Başlangıç',
  2: 'Tekrarlanabilir',
  3: 'Tanımlı',
  4: 'Yönetilen',
  5: 'Optimize',
};

export const likelihoodLabels: Record<number, string> = {
  1: 'Çok Düşük',
  2: 'Düşük',
  3: 'Orta',
  4: 'Yüksek',
  5: 'Çok Yüksek',
};

export const impactLabels: Record<number, string> = {
  1: 'Önemsiz',
  2: 'Küçük',
  3: 'Orta',
  4: 'Büyük',
  5: 'Felaket',
};
