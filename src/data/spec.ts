import type {
  ActionPriority, ActionSource, ActionStatus, ControlCategory, ControlEffectiveness,
  ControlExecution, ControlFrequency, ControlNature, CosoComponent, CriticalPoint,
  DocumentType, ProcessClass, ProcessStatus, RiskAppetite, RiskCategory, RiskStatus,
  RiskTreatment, RiskTrend, WorkedExample,
} from '@/types/grc';

/**
 * Veri yazımını kısaltan bildirimsel süreç tanımı (spec).
 * `buildDataset` bu ağacı normalize edilmiş varlık grafiğine dönüştürür.
 */

export type Pair = [likelihood: number, impact: number];

export interface RiskSpec {
  code: string;
  name: string;
  description: string;
  cause: string;
  consequence: string;
  category: RiskCategory;
  inherent: Pair;
  residual: Pair;
  target?: Pair;
  appetite?: RiskAppetite;
  treatment?: RiskTreatment;
  status?: RiskStatus;
  trend?: RiskTrend;
  owner?: string;
  identifiedAt?: string;
  lastAssessedAt?: string;
  standards?: string[];
}

export interface ControlSpec {
  code: string;
  name: string;
  description: string;
  nature: ControlNature;
  execution: ControlExecution;
  categories: ControlCategory[];
  frequency: ControlFrequency;
  method: string;
  evidence: string;
  /** Bu kontrolün azalttığı risk kodları. */
  mitigates: string[];
  owner?: string;
  key?: boolean;
  coso?: CosoComponent;
  design?: 'adequate' | 'needs_improvement' | 'inadequate';
  effectiveness?: ControlEffectiveness;
  strength?: number;
  lastPerformedAt?: string;
  lastTestedAt?: string | null;
  testResult?: string;
}

export interface ActionSpec {
  code: string;
  title: string;
  description: string;
  riskCode?: string;
  controlCode?: string;
  owner: string;
  dueDate: string;
  priority: ActionPriority;
  status: ActionStatus;
  progress: number;
  source: ActionSource;
  createdAt?: string;
  createdBy?: string;
  evidence?: string;
  managerComment?: string;
}

export interface DocSpec {
  code: string;
  name: string;
  type: DocumentType;
  version: string;
  owner?: string;
  publishedAt: string;
  updatedAt?: string;
  nextReviewAt: string;
  summary: string;
  sections?: { heading: string; body: string[] }[];
  controlCodes?: string[];
}

export interface KriSpec {
  code: string;
  name: string;
  definition: string;
  riskCode: string;
  owner?: string;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  direction: 'lower_better' | 'higher_better';
  greenMax: number;
  amberMax: number;
  readings: number[];
}

export type CriticalSpec = [kind: CriticalPoint['kind'], label: string, note: string];

export interface NodeSpec {
  code: string;
  name: string;
  description: string;
  purpose?: string;
  owner?: string;
  unit?: string;
  participants?: string[];
  systems?: string[];
  inputs?: string[];
  outputs?: string[];
  maturity?: number;
  status?: ProcessStatus;
  processClass?: ProcessClass;
  standards?: string[];
  lastReviewedAt?: string;
  reviewFrequencyMonths?: number;
  version?: string;
  updatedAt?: string;
  customer?: string;
  slaDays?: number;

  critical?: CriticalSpec[];
  examples?: Omit<WorkedExample, 'id'>[];

  risks?: RiskSpec[];
  controls?: ControlSpec[];
  actions?: ActionSpec[];
  docs?: DocSpec[];
  kris?: KriSpec[];

  /** Başka yerde tanımlanmış risk/kontrol/doküman kodlarıyla ilişkilendirme. */
  riskRefs?: string[];
  controlRefs?: string[];
  docRefs?: string[];

  children?: NodeSpec[];
}
