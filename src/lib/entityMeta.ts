import type {
  ActionItem, Control, Dataset, FieldChange, GrcDocument, Risk, User,
} from '@/types/grc';
import {
  actionPriorityLabels, actionSourceLabels, actionStatusLabels, controlCategoryLabels,
  controlEffectivenessLabels, controlExecutionLabels, controlFrequencyLabels,
  controlNatureLabels, cosoComponentLabels, riskAppetiteLabels, riskCategoryLabels,
  riskStatusLabels, riskTreatmentLabels, riskTrendLabels,
} from './labels';
import { NOW } from '@/data/build';

/**
 * Varlıkların alan meta verisi: arayüz etiketleri, değer biçimlendirme ve
 * audit trail için alan bazlı fark hesaplama.
 */

export const riskFieldLabels: Record<string, string> = {
  code: 'Kod',
  name: 'Risk adı',
  description: 'Açıklama',
  cause: 'Risk nedeni',
  consequence: 'Risk sonucu',
  category: 'Risk türü',
  ownerId: 'Risk sahibi',
  unitId: 'Sorumlu birim',
  inherent: 'Doğal risk',
  residual: 'Artık risk',
  target: 'Hedef risk',
  appetite: 'Risk iştahı',
  treatment: 'Yönetim stratejisi',
  status: 'Durum',
  trend: 'Trend',
  controlIds: 'İlişkili kontroller',
  processNodeIds: 'İlişkili süreç adımları',
  lastAssessedAt: 'Son değerlendirme',
  nextAssessmentAt: 'Sonraki değerlendirme',
  archived: 'Arşiv durumu',
};

export const controlFieldLabels: Record<string, string> = {
  code: 'Kod',
  name: 'Kontrol adı',
  description: 'Açıklama',
  ownerId: 'Kontrol sahibi',
  unitId: 'Sorumlu birim',
  nature: 'Kontrol türü',
  execution: 'Uygulama biçimi',
  categories: 'Kontrol kategorisi',
  frequency: 'Kontrol sıklığı',
  method: 'Kontrol yöntemi',
  evidence: 'Kontrol kanıtı',
  keyControl: 'Kritik kontrol',
  cosoComponent: 'COSO bileşeni',
  designAdequacy: 'Tasarım yeterliliği',
  effectiveness: 'Etkinlik durumu',
  lastPerformedAt: 'Son uygulanma',
  lastTestedAt: 'Son test',
  testResult: 'Test sonucu',
  mitigationStrength: 'Azaltma gücü',
  riskIds: 'Yönettiği riskler',
  processNodeIds: 'Uygulandığı süreç adımları',
  archived: 'Arşiv durumu',
};

export const actionFieldLabels: Record<string, string> = {
  code: 'Kod',
  title: 'Aksiyon',
  description: 'Açıklama',
  ownerId: 'Sorumlu',
  dueDate: 'Hedef tarih',
  priority: 'Öncelik',
  status: 'Durum',
  progress: 'Tamamlanma',
  source: 'Kaynak',
  evidence: 'Kanıt',
  managerComment: 'Yönetici yorumu',
  riskId: 'İlgili risk',
  controlId: 'İlgili kontrol',
  processNodeId: 'İlgili süreç adımı',
  archived: 'Arşiv durumu',
};

const designAdequacyLabels: Record<string, string> = {
  adequate: 'Yeterli',
  needs_improvement: 'İyileştirme gerekli',
  inadequate: 'Yetersiz',
};

/** Kodlu değerleri okunabilir metne çevirir. */
const valueDictionaries: Record<string, string>[] = [
  riskCategoryLabels, riskAppetiteLabels, riskTreatmentLabels, riskStatusLabels, riskTrendLabels,
  controlNatureLabels, controlExecutionLabels, controlFrequencyLabels, controlEffectivenessLabels,
  controlCategoryLabels, cosoComponentLabels, designAdequacyLabels,
  actionStatusLabels, actionPriorityLabels, actionSourceLabels,
];

function translate(value: string): string {
  for (const dict of valueDictionaries) {
    if (value in dict) return dict[value];
  }
  return value;
}

/** Bir alan değerini audit trail'de gösterilecek metne çevirir. */
export function describeValue(
  value: unknown,
  resolveId?: (id: string) => string | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    return value
      .map((v) => (typeof v === 'string' ? (resolveId?.(v) ?? translate(v)) : String(v)))
      .join(', ');
  }
  if (typeof value === 'object') {
    const a = value as { likelihood?: number; impact?: number };
    if (typeof a.likelihood === 'number' && typeof a.impact === 'number') {
      return `${a.likelihood} × ${a.impact} = ${a.likelihood * a.impact}`;
    }
    return JSON.stringify(value);
  }
  const text = String(value);
  return resolveId?.(text) ?? translate(text);
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** İki kayıt arasındaki alan bazlı farkları audit trail biçiminde döner. */
export function diffEntity<T extends object>(
  before: T,
  patch: Partial<T>,
  labels: Record<string, string>,
  resolveId?: (id: string) => string | undefined,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const key of Object.keys(patch) as (keyof T & string)[]) {
    const oldValue = before[key];
    const newValue = patch[key];
    if (sameValue(oldValue, newValue)) continue;
    changes.push({
      field: key,
      label: labels[key] ?? key,
      oldValue: describeValue(oldValue, resolveId),
      newValue: describeValue(newValue, resolveId),
    });
  }
  return changes;
}

/* ------------------------------------------------------------------ */
/* Kod üretimi                                                         */
/* ------------------------------------------------------------------ */

/**
 * Verilen önek için kullanılmayan bir sonraki kodu üretir.
 * Örn. mevcut R-HSR-01…R-HSR-20 için "R-HSR-21".
 */
export function nextCode(prefix: string, existing: string[], pad = 2): string {
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);
  const max = existing.reduce((acc, code) => {
    const m = re.exec(code);
    return m ? Math.max(acc, Number(m[1])) : acc;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`;
}

/**
 * Yeni kayıt kodunun öneki.
 *
 * Kayıt bir süreç adımına bağlı açılıyorsa o adımın ana süreç kodu kullanılır
 * (örn. HSR); değilse kaydı açan kullanıcının birim kodu (örn. ICK). Böylece
 * kod, kaydın nereden geldiğini taşır.
 */
export function processPrefix(
  data: Dataset,
  nodeId: string | null | undefined,
  fallbackUnitId?: string,
): string {
  if (nodeId) {
    let current = data.nodes.find((n) => n.id === nodeId);
    while (current && current.kind !== 'process') {
      current = current.parentId ? data.nodes.find((n) => n.id === current!.parentId) : undefined;
    }
    if (current) return current.code;
  }
  const unit = data.units.find((u) => u.id === fallbackUnitId);
  return unit?.code ?? 'GEN';
}

/* ------------------------------------------------------------------ */
/* Boş kayıt üreticileri                                               */
/* ------------------------------------------------------------------ */

const today = () => new Date(NOW).toISOString().slice(0, 10);

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function blankRisk(user: User, nodeId: string | null, code: string): Risk {
  return {
    id: `rsk-${code}`,
    code,
    name: '',
    description: '',
    cause: '',
    consequence: '',
    category: 'operational',
    ownerId: user.id,
    unitId: user.unitId,
    inherent: { likelihood: 3, impact: 3 },
    residual: { likelihood: 2, impact: 3 },
    target: { likelihood: 2, impact: 2 },
    appetite: 'cautious',
    treatment: 'mitigate',
    status: 'open',
    trend: 'stable',
    controlIds: [],
    processNodeIds: nodeId ? [nodeId] : [],
    actionIds: [],
    kriIds: [],
    identifiedAt: today(),
    lastAssessedAt: today(),
    nextAssessmentAt: addMonths(today(), 6),
  };
}

export function blankControl(user: User, nodeId: string | null, code: string): Control {
  return {
    id: `ctl-${code}`,
    code,
    name: '',
    description: '',
    ownerId: user.id,
    unitId: user.unitId,
    nature: 'preventive',
    execution: 'manual',
    categories: ['monitoring'],
    frequency: 'monthly',
    method: '',
    evidence: '',
    keyControl: false,
    cosoComponent: 'control_activities',
    designAdequacy: 'adequate',
    effectiveness: 'not_tested',
    lastPerformedAt: today(),
    lastTestedAt: null,
    riskIds: [],
    processNodeIds: nodeId ? [nodeId] : [],
    documentIds: [],
    actionIds: [],
    mitigationStrength: 0.45,
  };
}

export function blankAction(
  user: User,
  code: string,
  links: { riskId?: string | null; controlId?: string | null; processNodeId?: string | null } = {},
): ActionItem {
  return {
    id: `act-${code}`,
    code,
    title: '',
    description: '',
    riskId: links.riskId ?? null,
    controlId: links.controlId ?? null,
    processNodeId: links.processNodeId ?? null,
    ownerId: user.id,
    createdById: user.id,
    createdAt: today(),
    dueDate: addMonths(today(), 3),
    closedAt: null,
    priority: 'medium',
    status: 'open',
    progress: 0,
    source: 'internal_control',
    evidence: '',
    managerComment: '',
  };
}

/** Arşivlenmemiş kayıtları süzer. */
export function active<T extends { archived?: boolean }>(items: T[]): T[] {
  return items.filter((i) => !i.archived);
}

export function isArchivedDocument(doc: GrcDocument): boolean {
  return Boolean(doc.archived);
}
