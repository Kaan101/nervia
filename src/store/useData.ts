import { create } from 'zustand';
import type {
  ActionItem, ApprovalStep, Attachment, AuditEntry, ChangeRequest, Control, Dataset, FieldChange,
  GrcDocument, Kri, ProcessNode, Risk, RoleId,
} from '@/types/grc';
import type { Account, Role } from '@/types/rbac';
import { dataset as seedDataset } from '@/data';
import { NOW } from '@/data/build';
import {
  actionFieldLabels, bumpVersion, controlFieldLabels, diffEntity, documentFieldLabels,
  nodeFieldLabels, riskFieldLabels, splitByApproval,
} from '@/lib/entityMeta';
import { userName } from '@/data/org';
import { loadSnapshot, saveSnapshot, clearSnapshot, persistenceState } from './persistence';

interface Indexes {
  /**
   * Arşivlenmemiş kayıtlar. Sayım, gösterge ve liste ekranları bunları kullanır;
   * `data.risks` gibi ham listeler yalnızca arşiv görünümü ve geçmiş çözümlemesi
   * içindir.
   */
  activeRisks: Risk[];
  activeControls: Control[];
  activeActions: ActionItem[];
  activeDocuments: GrcDocument[];

  nodeById: Map<string, ProcessNode>;
  riskById: Map<string, Risk>;
  controlById: Map<string, Control>;
  actionById: Map<string, ActionItem>;
  documentById: Map<string, GrcDocument>;
  kriById: Map<string, Kri>;
  childrenOf: Map<string, ProcessNode[]>;
}

function buildIndexes(d: Dataset): Indexes {
  const childrenOf = new Map<string, ProcessNode[]>();
  for (const node of d.nodes) {
    if (!node.parentId) continue;
    const list = childrenOf.get(node.parentId) ?? [];
    list.push(node);
    childrenOf.set(node.parentId, list);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.order - b.order);
  return {
    activeRisks: d.risks.filter((r) => !r.archived),
    activeControls: d.controls.filter((c) => !c.archived),
    activeActions: d.actions.filter((a) => !a.archived),
    activeDocuments: d.documents.filter((x) => !x.archived),
    nodeById: new Map(d.nodes.map((n) => [n.id, n])),
    riskById: new Map(d.risks.map((r) => [r.id, r])),
    controlById: new Map(d.controls.map((c) => [c.id, c])),
    actionById: new Map(d.actions.map((a) => [a.id, a])),
    documentById: new Map(d.documents.map((x) => [x.id, x])),
    kriById: new Map(d.kris.map((k) => [k.id, k])),
    childrenOf,
  };
}

let auditCounter = 0;
function nextAuditId(): string {
  auditCounter += 1;
  return `aud-live-${Date.now().toString(36)}-${auditCounter}`;
}

function nowIso(): string {
  return new Date(NOW).toISOString();
}

function today(): string {
  return nowIso().slice(0, 10);
}

export type ArchivableKind = 'risk' | 'control' | 'action' | 'document';

/** Onay akışına tabi kayıt türleri. */
export type ApprovableKind = 'risk' | 'control' | 'process' | 'document';

export interface SaveOutcome {
  /** 'saved' doğrudan kaydedildi, 'requested' onaya gönderildi, 'noop' değişiklik yok. */
  result: 'saved' | 'requested' | 'noop';
  /** Onaya gönderildiyse talebin kodu. */
  requestCode?: string;
  /** Onayı tetikleyen alan etiketleri. */
  criticalLabels?: string[];
}

interface DataState extends Indexes {
  data: Dataset;

  /* --- Kayıt --- */
  logAudit: (entry: Omit<AuditEntry, 'id' | 'at'> & { at?: string }) => void;

  /* --- Risk --- */
  createRisk: (risk: Risk, actorId: string) => void;
  updateRisk: (id: string, patch: Partial<Risk>, actorId: string, reason?: string) => void;
  reassessRisk: (
    riskId: string,
    residual: { likelihood: number; impact: number },
    actorId: string,
    reason: string,
  ) => void;

  /* --- Kontrol --- */
  createControl: (control: Control, actorId: string) => void;
  updateControl: (id: string, patch: Partial<Control>, actorId: string, reason?: string) => void;
  updateControlEffectiveness: (
    controlId: string,
    effectiveness: Control['effectiveness'],
    actorId: string,
    reason: string,
  ) => void;

  /* --- Aksiyon --- */
  createAction: (action: ActionItem, actorId: string) => void;
  updateAction: (id: string, patch: Partial<ActionItem>, actorId: string) => void;

  /* --- Arşivleme (silme yerine) --- */
  setArchived: (kind: ArchivableKind, id: string, archived: boolean, actorId: string, reason?: string) => void;

  /* --- İlişkilendirme --- */
  linkRiskControl: (riskId: string, controlId: string, on: boolean, actorId: string) => void;
  linkRiskNode: (riskId: string, nodeId: string, on: boolean, actorId: string) => void;
  linkControlNode: (controlId: string, nodeId: string, on: boolean, actorId: string) => void;

  /* --- Süreç yapısı --- */
  markReviewed: (nodeId: string, actorId: string) => void;
  createNode: (node: ProcessNode, actorId: string) => void;
  updateNode: (id: string, patch: Partial<ProcessNode>, actorId: string, reason?: string) => void;
  /** Düğümü kardeşleri arasında bir sıra yukarı/aşağı taşır. */
  reorderNode: (id: string, direction: 'up' | 'down', actorId: string) => void;
  /** Düğümü başka bir üst düğümün altına taşır. */
  moveNode: (id: string, newParentId: string, actorId: string, reason?: string) => void;

  /* --- Doküman --- */
  createDocument: (doc: GrcDocument, actorId: string) => void;
  updateDocument: (id: string, patch: Partial<GrcDocument>, actorId: string, reason?: string) => void;
  linkDocumentNode: (documentId: string, nodeId: string, on: boolean, actorId: string) => void;
  linkDocumentControl: (documentId: string, controlId: string, on: boolean, actorId: string) => void;

  /* --- Değişiklik yönetimi --- */
  decideChangeRequest: (
    id: string,
    stepOrder: number,
    decision: 'approved' | 'rejected',
    approverId: string,
    comment: string,
    attachments?: Attachment[],
  ) => void;
  createChangeRequest: (request: ChangeRequest, actorId: string) => void;

  /**
   * Kaydı günceller. Kritik alanlar değiştiyse doğrudan kaydetmez;
   * değişiklik talebi açar ve onay zincirine gönderir.
   */
  saveWithApproval: (input: {
    kind: ApprovableKind;
    id: string;
    patch: Record<string, unknown>;
    reason: string;
    actorId: string;
  }) => SaveOutcome;

  /* --- Kalıcılık --- */
  /* --- Kimlik ve yetki --- */
  registerFailedLogin: (userId: string, maxAttempts: number, lockMinutes: number) => void;
  registerSuccessfulLogin: (userId: string) => void;
  setPassword: (userId: string, salt: string, hash: string, actorId: string, forceChange: boolean) => void;
  updateAccount: (userId: string, patch: Partial<Account>, actorId: string, reason?: string) => void;
  createRole: (role: Role, actorId: string) => void;
  updateRole: (roleId: string, patch: Partial<Role>, actorId: string, reason?: string) => void;
  deleteRole: (roleId: string, actorId: string) => void;

  resetToSeed: () => void;
}

function withIndexes(data: Dataset) {
  return { data, ...buildIndexes(data) };
}

const initialData = loadSnapshot() ?? seedDataset;

/** Sadece dizi üyeliğini açıp kapatır. */
function toggle(list: string[], id: string, on: boolean): string[] {
  if (on) return list.includes(id) ? list : [...list, id];
  return list.filter((x) => x !== id);
}

export const useData = create<DataState>((set, get) => ({
  data: initialData,
  ...buildIndexes(initialData),

  logAudit: (entry) =>
    set((state) => ({
      data: {
        ...state.data,
        auditTrail: [
          { id: nextAuditId(), at: entry.at ?? nowIso(), ...entry } as AuditEntry,
          ...state.data.auditTrail,
        ],
      },
    })),

  /* ---------------- Risk ---------------- */

  createRisk: (risk, actorId) => {
    set((state) => {
      const nodes = state.data.nodes.map((n) =>
        risk.processNodeIds.includes(n.id) && !n.riskIds.includes(risk.id)
          ? { ...n, riskIds: [...n.riskIds, risk.id] }
          : n,
      );
      const controls = state.data.controls.map((c) =>
        risk.controlIds.includes(c.id) && !c.riskIds.includes(risk.id)
          ? { ...c, riskIds: [...c.riskIds, risk.id] }
          : c,
      );
      return withIndexes({ ...state.data, risks: [risk, ...state.data.risks], nodes, controls });
    });
    get().logAudit({
      userId: actorId,
      action: 'create',
      entityType: 'risk',
      entityId: risk.id,
      entityName: risk.name,
      summary: `Yeni risk tanımlandı (${risk.code}).`,
    });
  },

  updateRisk: (id, patch, actorId, reason) => {
    const before = get().riskById.get(id);
    if (!before) return;
    const changes = diffEntity(before, patch, riskFieldLabels, (x) => resolveName(get().data, x));
    if (!changes.length) return;
    set((state) =>
      withIndexes({
        ...state.data,
        risks: state.data.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'risk',
      entityId: id,
      entityName: patch.name ?? before.name,
      summary: 'Risk kaydı güncellendi.',
      reason,
      changes,
    });
  },

  reassessRisk: (riskId, residual, actorId, reason) => {
    const risk = get().riskById.get(riskId);
    if (!risk) return;
    const nextAssessment = new Date(NOW);
    nextAssessment.setMonth(nextAssessment.getMonth() + 6);
    set((state) =>
      withIndexes({
        ...state.data,
        risks: state.data.risks.map((r) =>
          r.id === riskId
            ? {
                ...r,
                residual,
                lastAssessedAt: today(),
                nextAssessmentAt: nextAssessment.toISOString().slice(0, 10),
              }
            : r,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'risk',
      entityId: riskId,
      entityName: risk.name,
      summary: 'Risk yeniden değerlendirildi.',
      reason,
      changes: [
        {
          field: 'residual',
          label: 'Artık risk (olasılık × etki)',
          oldValue: `${risk.residual.likelihood} × ${risk.residual.impact} = ${risk.residual.likelihood * risk.residual.impact}`,
          newValue: `${residual.likelihood} × ${residual.impact} = ${residual.likelihood * residual.impact}`,
        },
      ],
    });
  },

  /* ---------------- Kontrol ---------------- */

  createControl: (control, actorId) => {
    set((state) => {
      const nodes = state.data.nodes.map((n) =>
        control.processNodeIds.includes(n.id) && !n.controlIds.includes(control.id)
          ? { ...n, controlIds: [...n.controlIds, control.id] }
          : n,
      );
      const risks = state.data.risks.map((r) =>
        control.riskIds.includes(r.id) && !r.controlIds.includes(control.id)
          ? { ...r, controlIds: [...r.controlIds, control.id] }
          : r,
      );
      return withIndexes({ ...state.data, controls: [control, ...state.data.controls], nodes, risks });
    });
    get().logAudit({
      userId: actorId,
      action: 'create',
      entityType: 'control',
      entityId: control.id,
      entityName: control.name,
      summary: `Yeni kontrol tanımlandı (${control.code}).`,
    });
  },

  updateControl: (id, patch, actorId, reason) => {
    const before = get().controlById.get(id);
    if (!before) return;
    const changes = diffEntity(before, patch, controlFieldLabels, (x) => resolveName(get().data, x));
    if (!changes.length) return;
    set((state) =>
      withIndexes({
        ...state.data,
        controls: state.data.controls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'control',
      entityId: id,
      entityName: patch.name ?? before.name,
      summary: 'Kontrol kaydı güncellendi.',
      reason,
      changes,
    });
  },

  updateControlEffectiveness: (controlId, effectiveness, actorId, reason) => {
    const control = get().controlById.get(controlId);
    if (!control || control.effectiveness === effectiveness) return;
    set((state) =>
      withIndexes({
        ...state.data,
        controls: state.data.controls.map((c) =>
          c.id === controlId ? { ...c, effectiveness, lastTestedAt: today() } : c,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'control',
      entityId: controlId,
      entityName: control.name,
      summary: 'Kontrol etkinlik değerlendirmesi güncellendi.',
      reason,
      changes: [
        { field: 'effectiveness', label: 'Etkinlik durumu', oldValue: control.effectiveness, newValue: effectiveness },
      ],
    });
  },

  /* ---------------- Aksiyon ---------------- */

  createAction: (action, actorId) => {
    set((state) => {
      const actions = [action, ...state.data.actions];
      const nodes = state.data.nodes.map((n) =>
        n.id === action.processNodeId && !n.actionIds.includes(action.id)
          ? { ...n, actionIds: [...n.actionIds, action.id] }
          : n,
      );
      const risks = state.data.risks.map((r) =>
        r.id === action.riskId && !r.actionIds.includes(action.id)
          ? { ...r, actionIds: [...r.actionIds, action.id] }
          : r,
      );
      const controls = state.data.controls.map((c) =>
        c.id === action.controlId && !c.actionIds.includes(action.id)
          ? { ...c, actionIds: [...c.actionIds, action.id] }
          : c,
      );
      return withIndexes({ ...state.data, actions, nodes, risks, controls });
    });
    get().logAudit({
      userId: actorId,
      action: 'create',
      entityType: 'action',
      entityId: action.id,
      entityName: action.title,
      summary: `Yeni aksiyon açıldı (${action.code}).`,
    });
  },

  updateAction: (id, patch, actorId) => {
    const before = get().actionById.get(id);
    if (!before) return;
    const changes = diffEntity(before, patch, actionFieldLabels, (x) => resolveName(get().data, x));
    if (!changes.length) return;
    const closedAt = patch.status === 'completed' ? (before.closedAt ?? today()) : before.closedAt;
    set((state) =>
      withIndexes({
        ...state.data,
        actions: state.data.actions.map((a) => (a.id === id ? { ...a, ...patch, closedAt } : a)),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'action',
      entityId: id,
      entityName: patch.title ?? before.title,
      summary: 'Aksiyon güncellendi.',
      changes,
    });
  },

  /* ---------------- Arşivleme ---------------- */

  setArchived: (kind, id, archived, actorId, reason) => {
    const state = get();
    const record =
      kind === 'risk' ? state.riskById.get(id)
        : kind === 'control' ? state.controlById.get(id)
          : kind === 'action' ? state.actionById.get(id)
            : state.documentById.get(id);
    if (!record) return;

    const apply = <T extends { id: string }>(list: T[]) =>
      list.map((x) => (x.id === id ? { ...x, archived } : x));

    set((s) =>
      withIndexes({
        ...s.data,
        risks: kind === 'risk' ? apply(s.data.risks) : s.data.risks,
        controls: kind === 'control' ? apply(s.data.controls) : s.data.controls,
        actions: kind === 'action' ? apply(s.data.actions) : s.data.actions,
        documents: kind === 'document' ? apply(s.data.documents) : s.data.documents,
      }),
    );

    const name = 'name' in record ? record.name : record.title;
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: kind,
      entityId: id,
      entityName: name,
      summary: archived
        ? 'Kayıt arşivlendi; listelerden düştü, geçmiş kayıtlarda yerinde kaldı.'
        : 'Kayıt arşivden geri alındı.',
      reason,
      changes: [
        { field: 'archived', label: 'Arşiv durumu', oldValue: archived ? 'Aktif' : 'Arşivde', newValue: archived ? 'Arşivde' : 'Aktif' },
      ],
    });
  },

  /* ---------------- İlişkilendirme ---------------- */

  linkRiskControl: (riskId, controlId, on, actorId) => {
    const risk = get().riskById.get(riskId);
    const control = get().controlById.get(controlId);
    if (!risk || !control) return;
    set((state) =>
      withIndexes({
        ...state.data,
        risks: state.data.risks.map((r) =>
          r.id === riskId ? { ...r, controlIds: toggle(r.controlIds, controlId, on) } : r,
        ),
        controls: state.data.controls.map((c) =>
          c.id === controlId ? { ...c, riskIds: toggle(c.riskIds, riskId, on) } : c,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'risk',
      entityId: riskId,
      entityName: risk.name,
      summary: on
        ? `“${control.name}” kontrolü bu riske bağlandı.`
        : `“${control.name}” kontrolünün bu riskle ilişkisi kaldırıldı.`,
      changes: [
        { field: 'controlIds', label: 'İlişkili kontrol', oldValue: on ? '—' : control.code, newValue: on ? control.code : '—' },
      ],
    });
  },

  linkRiskNode: (riskId, nodeId, on, actorId) => {
    const risk = get().riskById.get(riskId);
    const node = get().nodeById.get(nodeId);
    if (!risk || !node) return;
    set((state) =>
      withIndexes({
        ...state.data,
        risks: state.data.risks.map((r) =>
          r.id === riskId ? { ...r, processNodeIds: toggle(r.processNodeIds, nodeId, on) } : r,
        ),
        nodes: state.data.nodes.map((n) =>
          n.id === nodeId ? { ...n, riskIds: toggle(n.riskIds, riskId, on) } : n,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'risk',
      entityId: riskId,
      entityName: risk.name,
      summary: on
        ? `Risk “${node.name}” adımına bağlandı.`
        : `Riskin “${node.name}” adımıyla ilişkisi kaldırıldı.`,
    });
  },

  linkControlNode: (controlId, nodeId, on, actorId) => {
    const control = get().controlById.get(controlId);
    const node = get().nodeById.get(nodeId);
    if (!control || !node) return;
    set((state) =>
      withIndexes({
        ...state.data,
        controls: state.data.controls.map((c) =>
          c.id === controlId ? { ...c, processNodeIds: toggle(c.processNodeIds, nodeId, on) } : c,
        ),
        nodes: state.data.nodes.map((n) =>
          n.id === nodeId ? { ...n, controlIds: toggle(n.controlIds, controlId, on) } : n,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'control',
      entityId: controlId,
      entityName: control.name,
      summary: on
        ? `Kontrol “${node.name}” adımına bağlandı.`
        : `Kontrolün “${node.name}” adımıyla ilişkisi kaldırıldı.`,
    });
  },

  /* ---------------- Süreç ---------------- */

  markReviewed: (nodeId, actorId) => {
    const node = get().nodeById.get(nodeId);
    if (!node) return;
    const next = new Date(NOW);
    next.setMonth(next.getMonth() + node.reviewFrequencyMonths);
    set((state) =>
      withIndexes({
        ...state.data,
        nodes: state.data.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, lastReviewedAt: today(), nextReviewAt: next.toISOString().slice(0, 10), updatedAt: today() }
            : n,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'review',
      entityType: 'process',
      entityId: nodeId,
      entityName: node.name,
      summary: 'Periyodik gözden geçirme tamamlandı olarak işaretlendi.',
      changes: [
        { field: 'lastReviewedAt', label: 'Son gözden geçirme', oldValue: node.lastReviewedAt, newValue: today() },
      ],
    });
  },

  createNode: (node, actorId) => {
    // Araya ekleme: yeni düğümün sırası zaten dolu ise o sıradan itibaren
    // kardeşler bir aşağı kaydırılır. Akış editöründe iki kutu arasındaki
    // "+" bunu kullanır; sona ekleyen çağrılarda kaydırılacak kardeş
    // olmadığı için davranış değişmez.
    set((state) => {
      const nodes = state.data.nodes.map((n) =>
        n.parentId === node.parentId && n.order >= node.order
          ? { ...n, order: n.order + 1 }
          : n,
      );
      return withIndexes({ ...state.data, nodes: [...nodes, node] });
    });
    get().logAudit({
      userId: actorId,
      action: 'create',
      entityType: 'process',
      entityId: node.id,
      entityName: node.name,
      summary: `Yeni süreç kaydı oluşturuldu (${node.code}).`,
    });
  },

  updateNode: (id, patch, actorId, reason) => {
    const before = get().nodeById.get(id);
    if (!before) return;
    const changes = diffEntity(before, patch, nodeFieldLabels, (x) => resolveName(get().data, x));
    if (!changes.length) return;

    // Gözden geçirme periyodu değiştiyse sonraki tarih yeniden hesaplanır.
    let extra: Partial<ProcessNode> = {};
    if (patch.reviewFrequencyMonths && patch.reviewFrequencyMonths !== before.reviewFrequencyMonths) {
      const next = new Date(before.lastReviewedAt);
      next.setMonth(next.getMonth() + patch.reviewFrequencyMonths);
      extra = { nextReviewAt: next.toISOString().slice(0, 10) };
    }

    set((state) =>
      withIndexes({
        ...state.data,
        nodes: state.data.nodes.map((n) =>
          n.id === id ? { ...n, ...patch, ...extra, updatedAt: today() } : n,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'process',
      entityId: id,
      entityName: patch.name ?? before.name,
      summary: 'Süreç kaydı güncellendi.',
      reason,
      changes,
    });
  },

  reorderNode: (id, direction, actorId) => {
    const node = get().nodeById.get(id);
    if (!node) return;
    const siblings = get().data.nodes
      .filter((n) => n.parentId === node.parentId)
      .sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((n) => n.id === id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= siblings.length) return;

    const other = siblings[target];
    set((state) =>
      withIndexes({
        ...state.data,
        nodes: state.data.nodes.map((n) => {
          if (n.id === node.id) return { ...n, order: other.order };
          if (n.id === other.id) return { ...n, order: node.order };
          return n;
        }),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'process',
      entityId: id,
      entityName: node.name,
      summary: `Akıştaki sırası değiştirildi: “${other.name}” ile yer değiştirdi.`,
      changes: [
        { field: 'order', label: 'Sıra', oldValue: String(index + 1), newValue: String(target + 1) },
      ],
    });
  },

  moveNode: (id, newParentId, actorId, reason) => {
    const node = get().nodeById.get(id);
    const newParent = get().nodeById.get(newParentId);
    const oldParent = node?.parentId ? get().nodeById.get(node.parentId) : undefined;
    if (!node || !newParent || node.parentId === newParentId) return;
    // Bir düğüm kendi alt ağacının içine taşınamaz.
    if (isDescendant(get().data.nodes, newParentId, id)) return;

    const nextOrder = get().data.nodes.filter((n) => n.parentId === newParentId).length;
    set((state) =>
      withIndexes({
        ...state.data,
        nodes: state.data.nodes.map((n) =>
          n.id === id ? { ...n, parentId: newParentId, order: nextOrder, updatedAt: today() } : n,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'process',
      entityId: id,
      entityName: node.name,
      summary: `Süreç “${newParent.name}” altına taşındı.`,
      reason,
      changes: [
        {
          field: 'parentId',
          label: 'Üst süreç',
          oldValue: oldParent?.name ?? '—',
          newValue: newParent.name,
        },
      ],
    });
  },

  /* ---------------- Doküman ---------------- */

  createDocument: (doc, actorId) => {
    set((state) => {
      const nodes = state.data.nodes.map((n) =>
        doc.processNodeIds.includes(n.id) && !n.documentIds.includes(doc.id)
          ? { ...n, documentIds: [...n.documentIds, doc.id] }
          : n,
      );
      const controls = state.data.controls.map((c) =>
        doc.controlIds.includes(c.id) && !c.documentIds.includes(doc.id)
          ? { ...c, documentIds: [...c.documentIds, doc.id] }
          : c,
      );
      return withIndexes({ ...state.data, documents: [doc, ...state.data.documents], nodes, controls });
    });
    get().logAudit({
      userId: actorId,
      action: 'create',
      entityType: 'document',
      entityId: doc.id,
      entityName: doc.name,
      summary: `Yeni doküman oluşturuldu (${doc.code} v${doc.version}).`,
    });
  },

  updateDocument: (id, patch, actorId, reason) => {
    const before = get().documentById.get(id);
    if (!before) return;
    const changes = diffEntity(before, patch, documentFieldLabels, (x) => resolveName(get().data, x));
    if (!changes.length) return;
    const merged = { ...before, ...patch };
    // Gözden geçirme tarihi geçmişse doküman "süresi geçmiş" sayılır.
    const status: GrcDocument['status'] =
      new Date(merged.nextReviewAt).getTime() < new Date(NOW).getTime() ? 'expired' : 'published';
    set((state) =>
      withIndexes({
        ...state.data,
        documents: state.data.documents.map((d) =>
          d.id === id ? { ...merged, status, updatedAt: today() } : d,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'document',
      entityId: id,
      entityName: patch.name ?? before.name,
      summary: 'Doküman güncellendi.',
      reason,
      changes,
    });
  },

  linkDocumentNode: (documentId, nodeId, on, actorId) => {
    const doc = get().documentById.get(documentId);
    const node = get().nodeById.get(nodeId);
    if (!doc || !node) return;
    set((state) =>
      withIndexes({
        ...state.data,
        documents: state.data.documents.map((d) =>
          d.id === documentId ? { ...d, processNodeIds: toggle(d.processNodeIds, nodeId, on) } : d,
        ),
        nodes: state.data.nodes.map((n) =>
          n.id === nodeId ? { ...n, documentIds: toggle(n.documentIds, documentId, on) } : n,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'document',
      entityId: documentId,
      entityName: doc.name,
      summary: on
        ? `Doküman “${node.name}” adımına bağlandı.`
        : `Dokümanın “${node.name}” adımıyla ilişkisi kaldırıldı.`,
    });
  },

  linkDocumentControl: (documentId, controlId, on, actorId) => {
    const doc = get().documentById.get(documentId);
    const control = get().controlById.get(controlId);
    if (!doc || !control) return;
    set((state) =>
      withIndexes({
        ...state.data,
        documents: state.data.documents.map((d) =>
          d.id === documentId ? { ...d, controlIds: toggle(d.controlIds, controlId, on) } : d,
        ),
        controls: state.data.controls.map((c) =>
          c.id === controlId ? { ...c, documentIds: toggle(c.documentIds, documentId, on) } : c,
        ),
      }),
    );
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'document',
      entityId: documentId,
      entityName: doc.name,
      summary: on
        ? `“${control.name}” kontrolü bu dokümana bağlandı.`
        : `“${control.name}” kontrolünün bu dokümanla ilişkisi kaldırıldı.`,
    });
  },

  /* ---------------- Değişiklik yönetimi ---------------- */

  decideChangeRequest: (id, stepOrder, decision, approverId, comment, attachments) => {
    const request = get().data.changeRequests.find((c) => c.id === id);
    if (!request) return;
    // Kimse kendi talebini onaylayamaz.
    if (decision === 'approved' && request.requestedById === approverId) return;

    const at = nowIso();
    const approvals = request.approvals.map((a) =>
      a.order === stepOrder
        ? { ...a, decision, approverId, comment, decidedAt: at, attachments: attachments?.length ? attachments : a.attachments }
        : a,
    );

    let status: ChangeRequest['status'] = request.status;
    if (decision === 'rejected') status = 'rejected';
    else if (approvals.every((a) => a.decision === 'approved')) status = 'approved';
    else {
      const next = approvals.find((a) => a.decision === 'pending');
      status = next?.requiredRole === 'unit_manager' ? 'pending_manager' : 'pending_control';
    }

    const fullyApproved = status === 'approved';
    const applied = fullyApproved ? applyRequestPayload(get(), request, approverId) : null;

    set((state) =>
      withIndexes({
        ...state.data,
        changeRequests: state.data.changeRequests.map((c) =>
          c.id === id
            ? { ...c, approvals, status, resultingVersion: applied?.version ?? c.resultingVersion }
            : c,
        ),
      }),
    );

    get().logAudit({
      userId: approverId,
      action: decision === 'approved' ? 'approve' : 'reject',
      entityType: 'change_request',
      entityId: id,
      entityName: `${request.code} — ${request.title}`,
      summary: decision === 'rejected'
        ? 'Talep reddedildi; hedef kayıt değişmedi.'
        : fullyApproved
          ? applied
            ? `Talep onaylandı ve uygulandı; ${applied.version ? `yeni versiyon v${applied.version}.` : 'kayıt güncellendi.'}`
            : 'Talep onaylandı. (Bu kayıt yalnızca geçmiş olarak tutulduğu için uygulanacak bir yama yok.)'
          : 'Onay verildi; talep bir sonraki kademeye iletildi.',
      reason: comment || undefined,
    });
  },

  createChangeRequest: (request, actorId) => {
    set((state) => withIndexes({ ...state.data, changeRequests: [request, ...state.data.changeRequests] }));
    get().logAudit({
      userId: actorId,
      action: 'submit',
      entityType: 'change_request',
      entityId: request.id,
      entityName: `${request.code} — ${request.title}`,
      summary: 'Değişiklik talebi oluşturuldu.',
      reason: request.reason,
      changes: request.changes,
    });
  },

  saveWithApproval: ({ kind, id, patch, reason, actorId }) => {
    const state = get();
    const meta = approvalMeta[kind];
    const before = meta.find(state, id);
    if (!before) return { result: 'noop' };

    const resolve = (x: string) => resolveName(state.data, x);
    const changes = diffEntity(before as object, patch, meta.labels, resolve);
    if (!changes.length) return { result: 'noop' };

    const { critical } = splitByApproval(kind, changes);

    // Kritik alan yoksa doğrudan kaydedilir.
    // Henüz yürürlüğe girmemiş taslak kayıtlar da onay gerektirmez: onay
    // mekanizması yürürlükteki bir tanımın değişmesini korur, hazırlanmakta
    // olan taslağı değil.
    if (!critical.length || isDraftRecord(before)) {
      meta.apply(get(), id, patch, actorId, reason);
      return { result: 'saved' };
    }

    // Kritik alan varsa yamanın tamamı onaya gider: kayıt bölünmüş biçimde
    // yarısı uygulanmış yarısı bekliyor durumuna düşmemelidir.
    const code = nextRequestCode(state.data.changeRequests);
    const targetName = 'name' in before ? (before as { name: string }).name : id;
    const version = 'version' in before ? String((before as { version: string }).version) : undefined;

    const request: ChangeRequest = {
      id: `chg-${code}`,
      code,
      targetType: kind === 'process' ? 'process' : kind,
      targetId: id,
      targetName,
      title: `${targetName} — ${critical.map((c) => c.label).join(', ')} değişikliği`,
      reason,
      impact: critical.length > 2 ? 'high' : critical.length > 1 ? 'medium' : 'low',
      requestedById: actorId,
      requestedAt: nowIso(),
      status: 'pending_manager',
      changes,
      approvals: buildApprovalChain(kind, state.data, actorId),
      resultingVersion: null,
      payload: patch,
      baseVersion: version,
      criticalFields: critical.map((c) => c.field),
    };

    get().createChangeRequest(request, actorId);
    return {
      result: 'requested',
      requestCode: code,
      criticalLabels: critical.map((c) => c.label),
    };
  },

  /* ---------------- Kalıcılık ---------------- */

  /* ---------------- Kimlik ve yetki ---------------- */

  registerFailedLogin: (userId, maxAttempts, lockMinutes) =>
    set((state) => ({
      data: {
        ...state.data,
        accounts: state.data.accounts.map((a) => {
          if (a.userId !== userId) return a;
          const failedAttempts = a.failedAttempts + 1;
          // Kilit yalnızca eşiğe ulaşıldığında konur; sayaç başarılı
          // girişte sıfırlanır.
          const lockedUntil = failedAttempts >= maxAttempts
            ? new Date(Date.now() + lockMinutes * 60000).toISOString()
            : a.lockedUntil;
          return { ...a, failedAttempts, lockedUntil };
        }),
      },
    })),

  registerSuccessfulLogin: (userId) =>
    set((state) => ({
      data: {
        ...state.data,
        accounts: state.data.accounts.map((a) =>
          a.userId === userId
            ? { ...a, failedAttempts: 0, lockedUntil: null, lastLoginAt: nowIso() }
            : a),
      },
    })),

  setPassword: (userId, salt, hash, actorId, forceChange) => {
    set((state) => ({
      data: {
        ...state.data,
        accounts: state.data.accounts.map((a) =>
          a.userId === userId
            ? {
              ...a,
              passwordSalt: salt,
              passwordHash: hash,
              mustChangePassword: forceChange,
              failedAttempts: 0,
              lockedUntil: null,
            }
            : a),
      },
    }));
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'account',
      entityId: userId,
      entityName: userName(userId),
      // Parolanın kendisi hiçbir zaman kaydedilmez; yalnızca olay kaydedilir.
      summary: actorId === userId ? 'Parola değiştirildi.' : 'Parola sistem yöneticisi tarafından sıfırlandı.',
    });
  },

  updateAccount: (userId, patch, actorId, reason) => {
    const before = get().data.accounts.find((a) => a.userId === userId);
    if (!before) return;
    set((state) => ({
      data: {
        ...state.data,
        accounts: state.data.accounts.map((a) => (a.userId === userId ? { ...a, ...patch } : a)),
      },
    }));
    const bits: string[] = [];
    if (patch.roleIds) {
      const names = patch.roleIds
        .map((id) => get().data.roles.find((r) => r.id === id)?.name ?? id)
        .join(', ');
      bits.push(`Roller: ${names || 'yok'}`);
    }
    if (patch.active !== undefined && patch.active !== before.active) {
      bits.push(patch.active ? 'Hesap etkinleştirildi' : 'Hesap pasife alındı');
    }
    if (patch.overrides) bits.push(`${patch.overrides.length} kullanıcı istisnası`);
    if (patch.extraUnitIds) {
      bits.push(`Ek birim: ${patch.extraUnitIds.length || 'yok'}`);
    }
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'account',
      entityId: userId,
      entityName: userName(userId),
      summary: `Yetki kaydı güncellendi. ${bits.join(' · ')}`.trim(),
      reason,
    });
  },

  createRole: (role, actorId) => {
    set((state) => ({ data: { ...state.data, roles: [...state.data.roles, role] } }));
    get().logAudit({
      userId: actorId,
      action: 'create',
      entityType: 'role',
      entityId: role.id,
      entityName: role.name,
      summary: `Yeni rol tanımlandı: ${role.name}.`,
    });
  },

  updateRole: (roleId, patch, actorId, reason) => {
    const before = get().data.roles.find((r) => r.id === roleId);
    if (!before) return;
    set((state) => ({
      data: {
        ...state.data,
        roles: state.data.roles.map((r) => (r.id === roleId ? { ...r, ...patch } : r)),
      },
    }));
    let summary = `Rol güncellendi: ${before.name}.`;
    if (patch.permissions) {
      const oncesi = Object.keys(before.permissions).length;
      const sonrasi = Object.keys(patch.permissions).length;
      summary = `Rol izinleri güncellendi: ${before.name} (${oncesi} → ${sonrasi} izin).`;
    }
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'role',
      entityId: roleId,
      entityName: before.name,
      summary,
      reason,
    });
  },

  deleteRole: (roleId, actorId) => {
    const role = get().data.roles.find((r) => r.id === roleId);
    // Yerleşik roller silinemez: sistemin varsayılan davranışı bunlara bağlı.
    if (!role || role.builtIn) return;
    set((state) => ({
      data: {
        ...state.data,
        roles: state.data.roles.filter((r) => r.id !== roleId),
        // Rol silinince kimsede askıda kalmasın.
        accounts: state.data.accounts.map((a) =>
          a.roleIds.includes(roleId)
            ? { ...a, roleIds: a.roleIds.filter((id) => id !== roleId) }
            : a),
      },
    }));
    get().logAudit({
      userId: actorId,
      action: 'delete',
      entityType: 'role',
      entityId: roleId,
      entityName: role.name,
      summary: `Rol silindi: ${role.name}. Bu role sahip kullanıcılardan kaldırıldı.`,
    });
  },

  resetToSeed: () => {
    clearSnapshot();
    set(withIndexes(seedDataset));
  },
}));

/** Kayıt henüz yürürlüğe girmemiş bir taslak mı? */
function isDraftRecord(record: object): boolean {
  return 'status' in record && (record as { status: string }).status === 'draft';
}

/**
 * Onaylanan talebi hedefe uygular ve versiyonu bir basamak artırır.
 *
 * Talep açıldığından bu yana hedefin versiyonu değiştiyse (başka bir talep
 * araya girmişse) yama yine de uygulanır, ancak audit kaydında çakışma
 * belirtilir — sessizce üzerine yazmak yerine iz bırakılır.
 */
function applyRequestPayload(
  state: DataState,
  request: ChangeRequest,
  approverId: string,
): { version: string | null } | null {
  if (!request.payload) return null;
  const kind = (request.targetType === 'process' ? 'process' : request.targetType) as ApprovableKind;
  const meta = approvalMeta[kind];
  if (!meta) return null;

  const target = meta.find(state, request.targetId);
  if (!target) return null;

  const currentVersion = 'version' in target ? String((target as { version: string }).version) : null;
  const conflicted = Boolean(
    request.baseVersion && currentVersion && request.baseVersion !== currentVersion,
  );
  const nextVersion = currentVersion ? bumpVersion(currentVersion) : null;

  const patch = { ...request.payload };
  if (nextVersion) patch.version = nextVersion;

  meta.apply(
    state,
    request.targetId,
    patch,
    approverId,
    conflicted
      ? `${request.code} onayı uygulandı. Dikkat: talep v${request.baseVersion} üzerine açılmıştı, kayıt bu arada v${currentVersion} olmuştu.`
      : `${request.code} onayı uygulandı.`,
  );

  return { version: nextVersion };
}

/** Onay akışında kayıt türüne göre okuma/yazma ve etiketler. */
const approvalMeta: Record<
  ApprovableKind,
  {
    labels: Record<string, string>;
    find: (s: DataState, id: string) => object | undefined;
    apply: (s: DataState, id: string, patch: Record<string, unknown>, actorId: string, reason: string) => void;
  }
> = {
  risk: {
    labels: riskFieldLabels,
    find: (s, id) => s.riskById.get(id),
    apply: (s, id, patch, actorId, reason) => s.updateRisk(id, patch as Partial<Risk>, actorId, reason),
  },
  control: {
    labels: controlFieldLabels,
    find: (s, id) => s.controlById.get(id),
    apply: (s, id, patch, actorId, reason) => s.updateControl(id, patch as Partial<Control>, actorId, reason),
  },
  process: {
    labels: nodeFieldLabels,
    find: (s, id) => s.nodeById.get(id),
    apply: (s, id, patch, actorId, reason) => s.updateNode(id, patch as Partial<ProcessNode>, actorId, reason),
  },
  document: {
    labels: documentFieldLabels,
    find: (s, id) => s.documentById.get(id),
    apply: (s, id, patch, actorId, reason) => s.updateDocument(id, patch as Partial<GrcDocument>, actorId, reason),
  },
};

/** Sıradaki değişiklik talebi kodu: DT-YYYY-NNN. */
function nextRequestCode(existing: ChangeRequest[]): string {
  const year = new Date(NOW).getFullYear();
  const prefix = `DT-${year}-`;
  const max = existing.reduce((acc, c) => {
    if (!c.code.startsWith(prefix)) return acc;
    const n = Number(c.code.slice(prefix.length));
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/**
 * Onay zinciri.
 * Birinci aşama hedef kaydın birim yöneticisi; ikinci aşama risklerde
 * Risk Yönetimi, diğer kayıtlarda İç Kontrol. Talebi açan kişi kendi
 * talebini onaylayamaz — bu kural karar anında ayrıca denetlenir.
 */
function buildApprovalChain(kind: ApprovableKind, data: Dataset, requesterId: string): ApprovalStep[] {
  const secondLine: RoleId = kind === 'risk' ? 'risk_management' : 'internal_control';
  const requester = data.users.find((u) => u.id === requesterId);
  const steps: ApprovalStep[] = [];

  // Talebi açan kişi zaten birim yöneticisiyse ilk kademe atlanır.
  const requesterIsManager = Boolean(requester?.roles.includes('unit_manager'));
  if (!requesterIsManager) {
    steps.push({
      order: 1,
      label: 'Birim Yöneticisi Onayı',
      requiredRole: 'unit_manager',
      approverId: null,
      decision: 'pending',
      comment: '',
      decidedAt: null,
    });
  }

  steps.push({
    order: steps.length + 1,
    label: secondLine === 'risk_management' ? 'Risk Yönetimi Onayı' : 'İç Kontrol Onayı',
    requiredRole: secondLine,
    approverId: null,
    decision: 'pending',
    comment: '',
    decidedAt: null,
  });

  return steps;
}

/** `candidateId`, `ancestorId`'nin alt ağacında mı? Döngüsel taşımayı engeller. */
function isDescendant(nodes: ProcessNode[], candidateId: string, ancestorId: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let current = byId.get(candidateId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = byId.get(current.parentId);
  }
  return false;
}

/** Audit trail'de kimlik değerlerini okunabilir hale getirir. */
function resolveName(data: Dataset, id: string): string | undefined {
  if (id.startsWith('usr-')) return userName(id);
  if (id.startsWith('rsk-')) return data.risks.find((r) => r.id === id)?.code;
  if (id.startsWith('ctl-')) return data.controls.find((c) => c.id === id)?.code;
  if (id.startsWith('nd-')) return data.nodes.find((n) => n.id === id)?.name;
  if (id.startsWith('U-')) return data.units.find((u) => u.id === id)?.name;
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Otomatik kalıcılık                                                  */
/* ------------------------------------------------------------------ */

let saveTimer: number | undefined;
useData.subscribe((state, prev) => {
  if (state.data === prev.data) return;
  if (typeof window === 'undefined') return;
  window.clearTimeout(saveTimer);
  // Art arda gelen değişikliklerde tek yazma yeterli.
  saveTimer = window.setTimeout(() => saveSnapshot(useData.getState().data), 350);
});

export { persistenceState };
export type { FieldChange };
