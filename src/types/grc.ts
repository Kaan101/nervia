/**
 * Nervia — GRC alan modeli.
 *
 * Model, arka planda COSO Internal Control Framework, ISO 31000, ISO 9001 süreç
 * yaklaşımı ve Three Lines Model terminolojisini taşır; arayüzde ise sade
 * Türkçe karşılıklarıyla sunulur (bkz. `src/lib/labels.ts`).
 */

/* ------------------------------------------------------------------ */
/* Organizasyon & kullanıcı                                            */
/* ------------------------------------------------------------------ */

export type RoleId =
  | 'employee'
  | 'process_owner'
  | 'unit_manager'
  | 'internal_control'
  | 'risk_management'
  | 'internal_audit'
  | 'executive'
  | 'system_admin';

/** Three Lines Model konumu. */
export type DefenceLine = 1 | 2 | 3 | 0;

export interface Unit {
  id: string;
  code: string;
  name: string;
  /** Üst birim. */
  parentId: string | null;
  managerId: string;
  defenceLine: DefenceLine;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  unitId: string;
  department: string;
  title: string;
  roles: RoleId[];
  managerId: string | null;
  /** 1 = görüntüleyici … 5 = sistem yöneticisi */
  authLevel: 1 | 2 | 3 | 4 | 5;
  location?: string;
  phone?: string;
}

/* ------------------------------------------------------------------ */
/* Süreç hiyerarşisi                                                   */
/* ------------------------------------------------------------------ */

export type NodeKind = 'organization' | 'process' | 'subprocess' | 'activity' | 'step';

export type ProcessStatus = 'active' | 'draft' | 'under_review' | 'archived';

/** ISO 9001 süreç sınıflandırması. */
export type ProcessClass = 'core' | 'support' | 'management';

export interface CriticalPoint {
  id: string;
  label: string;
  kind: 'control' | 'authorization' | 'financial' | 'privacy' | 'regulatory' | 'continuity';
  note: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  scenario: string;
  risk: string;
  control: string;
  controlType: string;
  evidence: string;
  criticalNote: string;
}

export interface ProcessNode {
  id: string;
  code: string;
  name: string;
  kind: NodeKind;
  parentId: string | null;
  /** Kardeşler arası sıra. */
  order: number;

  description: string;
  purpose?: string;

  ownerId: string;
  unitId: string;
  participantIds: string[];

  systems: string[];
  inputs: string[];
  outputs: string[];

  riskIds: string[];
  controlIds: string[];
  documentIds: string[];
  actionIds: string[];

  criticalPoints: CriticalPoint[];
  examples: WorkedExample[];

  /** 1–5, COSO olgunluk ölçeği. */
  maturity: number;
  status: ProcessStatus;
  processClass: ProcessClass;
  standards: string[];

  lastReviewedAt: string;
  nextReviewAt: string;
  reviewFrequencyMonths: number;
  version: string;
  updatedAt: string;

  /** Sürecin dışa açılan hizmet/çıktı alıcısı. */
  customer?: string;
  /** Hedef süre (iş günü). */
  slaDays?: number;
}

/* ------------------------------------------------------------------ */
/* Risk                                                                */
/* ------------------------------------------------------------------ */

export type RiskCategory =
  | 'operational'
  | 'financial'
  | 'legal'
  | 'compliance'
  | 'it'
  | 'cyber'
  | 'privacy'
  | 'hr'
  | 'supplier'
  | 'strategic'
  | 'reputational'
  | 'continuity';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskTreatment = 'mitigate' | 'accept' | 'transfer' | 'avoid';

export type RiskStatus = 'open' | 'monitoring' | 'mitigated' | 'closed';

export type RiskTrend = 'up' | 'down' | 'stable';

/** ISO 31000 risk iştahı bandı. */
export type RiskAppetite = 'averse' | 'minimal' | 'cautious' | 'open';

export interface Assessment {
  /** 1–5 */
  likelihood: number;
  /** 1–5 */
  impact: number;
}

export interface Risk {
  id: string;
  code: string;
  name: string;
  description: string;
  cause: string;
  consequence: string;
  category: RiskCategory;

  ownerId: string;
  unitId: string;

  /** Doğal (kontrolsüz) risk. */
  inherent: Assessment;
  /** Artık (kontrol sonrası) risk. */
  residual: Assessment;
  /** Hedeflenen risk seviyesi. */
  target: Assessment;
  appetite: RiskAppetite;

  treatment: RiskTreatment;
  status: RiskStatus;
  trend: RiskTrend;

  controlIds: string[];
  processNodeIds: string[];
  actionIds: string[];
  kriIds: string[];

  identifiedAt: string;
  lastAssessedAt: string;
  nextAssessmentAt: string;

  /** İlgili mevzuat / standart referansları. */
  standards?: string[];

  /**
   * Arşivlenmiş kayıt. GRC'de kayıt silinmez — arşivlenen kayıt listelerden
   * düşer, geçmiş raporlarda ve audit trail'de yerinde kalır.
   */
  archived?: boolean;
}

/* ------------------------------------------------------------------ */
/* Kontrol                                                             */
/* ------------------------------------------------------------------ */

export type ControlNature = 'preventive' | 'detective' | 'corrective';
export type ControlExecution = 'manual' | 'automated' | 'semi_automated';

export type ControlCategory =
  | 'system'
  | 'management'
  | 'reconciliation'
  | 'authorization'
  | 'approval'
  | 'data_validation'
  | 'segregation_of_duties'
  | 'physical'
  | 'monitoring';

export type ControlFrequency =
  | 'continuous'
  | 'per_transaction'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'event_based';

export type ControlEffectiveness = 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';

/** COSO iç kontrol bileşeni. */
export type CosoComponent =
  | 'control_environment'
  | 'risk_assessment'
  | 'control_activities'
  | 'information_communication'
  | 'monitoring';

export interface Control {
  id: string;
  code: string;
  name: string;
  description: string;

  ownerId: string;
  unitId: string;

  nature: ControlNature;
  execution: ControlExecution;
  categories: ControlCategory[];
  frequency: ControlFrequency;

  /** Kontrolün nasıl uygulandığı. */
  method: string;
  /** Kontrolün kanıtı (audit evidence). */
  evidence: string;

  keyControl: boolean;
  cosoComponent: CosoComponent;

  designAdequacy: 'adequate' | 'needs_improvement' | 'inadequate';
  effectiveness: ControlEffectiveness;
  lastPerformedAt: string;
  lastTestedAt: string | null;
  testResult?: string;

  riskIds: string[];
  processNodeIds: string[];
  documentIds: string[];
  actionIds: string[];

  /** Kontrolün riski azaltma gücü, 0–1. */
  mitigationStrength: number;

  /** Arşivlenmiş kayıt (bkz. Risk.archived). */
  archived?: boolean;
}

/* ------------------------------------------------------------------ */
/* Aksiyon                                                             */
/* ------------------------------------------------------------------ */

export type ActionStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';
export type ActionSource =
  | 'risk_assessment'
  | 'internal_control'
  | 'internal_audit'
  | 'incident'
  | 'self_assessment'
  | 'regulatory';

export interface ActionItem {
  id: string;
  code: string;
  title: string;
  description: string;

  riskId: string | null;
  controlId: string | null;
  processNodeId: string | null;

  ownerId: string;
  createdById: string;
  createdAt: string;
  dueDate: string;
  closedAt: string | null;

  priority: ActionPriority;
  status: ActionStatus;
  progress: number;
  source: ActionSource;

  evidence: string;
  managerComment: string;

  /** Arşivlenmiş kayıt (bkz. Risk.archived). */
  archived?: boolean;
}

/* ------------------------------------------------------------------ */
/* Doküman                                                             */
/* ------------------------------------------------------------------ */

export type DocumentType =
  | 'procedure'
  | 'instruction'
  | 'policy'
  | 'form'
  | 'checklist'
  | 'regulation'
  | 'training';

export interface DocumentSection {
  heading: string;
  body: string[];
}

export interface GrcDocument {
  id: string;
  code: string;
  name: string;
  type: DocumentType;
  version: string;
  ownerId: string;
  unitId: string;
  publishedAt: string;
  updatedAt: string;
  nextReviewAt: string;
  status: 'published' | 'draft' | 'expired';
  summary: string;
  sections: DocumentSection[];
  processNodeIds: string[];
  controlIds: string[];

  /** Arşivlenmiş kayıt (bkz. Risk.archived). */
  archived?: boolean;
}

/* ------------------------------------------------------------------ */
/* KRI                                                                 */
/* ------------------------------------------------------------------ */

export interface KriReading {
  period: string;
  value: number;
}

export interface Kri {
  id: string;
  code: string;
  name: string;
  definition: string;
  riskId: string;
  ownerId: string;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  /** Düşük değer iyi ise 'lower_better'. */
  direction: 'lower_better' | 'higher_better';
  /** Yeşil bandın sınırı. */
  greenMax: number;
  /** Sarı bandın sınırı; üstü kırmızı. */
  amberMax: number;
  readings: KriReading[];
}

/* ------------------------------------------------------------------ */
/* Değişiklik yönetimi & audit trail                                   */
/* ------------------------------------------------------------------ */

export type EntityType =
  | 'process'
  | 'risk'
  | 'control'
  | 'action'
  | 'document'
  | 'kri'
  | 'change_request'
  | 'session';

export interface FieldChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export type ChangeRequestStatus =
  | 'draft'
  | 'pending_manager'
  | 'pending_control'
  | 'approved'
  | 'rejected';

export interface ApprovalStep {
  order: number;
  label: string;
  requiredRole: RoleId;
  approverId: string | null;
  decision: 'pending' | 'approved' | 'rejected';
  comment: string;
  decidedAt: string | null;
}

export interface ChangeRequest {
  id: string;
  code: string;
  targetType: EntityType;
  targetId: string;
  targetName: string;
  title: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  requestedById: string;
  requestedAt: string;
  status: ChangeRequestStatus;
  /** İnsan okunur alan farkları — onay ekranında gösterilir. */
  changes: FieldChange[];
  approvals: ApprovalStep[];
  resultingVersion: string | null;

  /**
   * Onaylandığında hedefe uygulanacak alan değerleri.
   * Demo verisindeki geçmiş talepler bu alanı taşımaz; onlar yalnızca
   * kayıt olarak durur ve yeniden uygulanmaz.
   */
  payload?: Record<string, unknown>;
  /** Talep açıldığı andaki hedef versiyonu — çakışma tespiti için. */
  baseVersion?: string;
  /** Kritik kabul edilen ve onayı tetikleyen alanlar. */
  criticalFields?: string[];
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'submit'
  | 'login'
  | 'logout'
  | 'review'
  | 'view';

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  summary: string;
  reason?: string;
  changes?: FieldChange[];
}

/* ------------------------------------------------------------------ */
/* Toplu veri kümesi                                                   */
/* ------------------------------------------------------------------ */

export interface Dataset {
  units: Unit[];
  users: User[];
  nodes: ProcessNode[];
  risks: Risk[];
  controls: Control[];
  actions: ActionItem[];
  documents: GrcDocument[];
  kris: Kri[];
  changeRequests: ChangeRequest[];
  auditTrail: AuditEntry[];
}
