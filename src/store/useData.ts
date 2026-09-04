import { create } from 'zustand';
import type {
  ActionItem, AuditEntry, ChangeRequest, Control, Dataset, FieldChange, GrcDocument,
  Kri, ProcessNode, Risk,
} from '@/types/grc';
import { dataset as seedDataset } from '@/data';
import { NOW } from '@/data/build';

interface Indexes {
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
  return `aud-live-${auditCounter}`;
}

interface DataState extends Indexes {
  data: Dataset;
  logAudit: (entry: Omit<AuditEntry, 'id' | 'at'> & { at?: string }) => void;
  updateAction: (id: string, patch: Partial<ActionItem>, actorId: string) => void;
  createAction: (action: ActionItem, actorId: string) => void;
  decideChangeRequest: (
    id: string,
    stepOrder: number,
    decision: 'approved' | 'rejected',
    approverId: string,
    comment: string,
  ) => void;
  createChangeRequest: (request: ChangeRequest, actorId: string) => void;
  markReviewed: (nodeId: string, actorId: string) => void;
  updateControlEffectiveness: (
    controlId: string,
    effectiveness: Control['effectiveness'],
    actorId: string,
    reason: string,
  ) => void;
  reassessRisk: (
    riskId: string,
    residual: { likelihood: number; impact: number },
    actorId: string,
    reason: string,
  ) => void;
}

function withIndexes(data: Dataset) {
  return { data, ...buildIndexes(data) };
}

export const useData = create<DataState>((set, get) => ({
  data: seedDataset,
  ...buildIndexes(seedDataset),

  logAudit: (entry) =>
    set((state) => ({
      data: {
        ...state.data,
        auditTrail: [
          { id: nextAuditId(), at: entry.at ?? new Date(NOW).toISOString(), ...entry } as AuditEntry,
          ...state.data.auditTrail,
        ],
      },
    })),

  updateAction: (id, patch, actorId) => {
    const before = get().actionById.get(id);
    if (!before) return;
    const changes: FieldChange[] = [];
    if (patch.status && patch.status !== before.status) {
      changes.push({ field: 'status', label: 'Durum', oldValue: before.status, newValue: patch.status });
    }
    if (patch.progress !== undefined && patch.progress !== before.progress) {
      changes.push({
        field: 'progress', label: 'Tamamlanma', oldValue: `%${before.progress}`, newValue: `%${patch.progress}`,
      });
    }
    set((state) => {
      const actions = state.data.actions.map((a) => (a.id === id ? { ...a, ...patch } : a));
      return withIndexes({ ...state.data, actions });
    });
    get().logAudit({
      userId: actorId,
      action: 'update',
      entityType: 'action',
      entityId: id,
      entityName: before.title,
      summary: 'Aksiyon güncellendi.',
      changes,
    });
  },

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
      summary: 'Yeni aksiyon oluşturuldu.',
    });
  },

  decideChangeRequest: (id, stepOrder, decision, approverId, comment) => {
    const request = get().data.changeRequests.find((c) => c.id === id);
    if (!request) return;
    const at = new Date(NOW).toISOString();
    const approvals = request.approvals.map((a) =>
      a.order === stepOrder ? { ...a, decision, approverId, comment, decidedAt: at } : a,
    );
    let status: ChangeRequest['status'] = request.status;
    if (decision === 'rejected') status = 'rejected';
    else if (approvals.every((a) => a.decision === 'approved')) status = 'approved';
    else {
      const next = approvals.find((a) => a.decision === 'pending');
      status = next?.requiredRole === 'unit_manager' ? 'pending_manager' : 'pending_control';
    }
    set((state) =>
      withIndexes({
        ...state.data,
        changeRequests: state.data.changeRequests.map((c) =>
          c.id === id ? { ...c, approvals, status } : c,
        ),
      }),
    );
    get().logAudit({
      userId: approverId,
      action: decision === 'approved' ? 'approve' : 'reject',
      entityType: 'change_request',
      entityId: id,
      entityName: `${request.code} — ${request.title}`,
      summary: decision === 'approved' ? 'Onay verildi.' : 'Talep reddedildi.',
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

  markReviewed: (nodeId, actorId) => {
    const node = get().nodeById.get(nodeId);
    if (!node) return;
    const today = new Date(NOW).toISOString().slice(0, 10);
    const next = new Date(NOW);
    next.setMonth(next.getMonth() + node.reviewFrequencyMonths);
    set((state) =>
      withIndexes({
        ...state.data,
        nodes: state.data.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, lastReviewedAt: today, nextReviewAt: next.toISOString().slice(0, 10), updatedAt: today }
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
        {
          field: 'lastReviewedAt',
          label: 'Son gözden geçirme',
          oldValue: node.lastReviewedAt,
          newValue: today,
        },
      ],
    });
  },

  updateControlEffectiveness: (controlId, effectiveness, actorId, reason) => {
    const control = get().controlById.get(controlId);
    if (!control || control.effectiveness === effectiveness) return;
    set((state) =>
      withIndexes({
        ...state.data,
        controls: state.data.controls.map((c) =>
          c.id === controlId
            ? { ...c, effectiveness, lastTestedAt: new Date(NOW).toISOString().slice(0, 10) }
            : c,
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

  reassessRisk: (riskId, residual, actorId, reason) => {
    const risk = get().riskById.get(riskId);
    if (!risk) return;
    const today = new Date(NOW).toISOString().slice(0, 10);
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
                lastAssessedAt: today,
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
          oldValue: `${risk.residual.likelihood} × ${risk.residual.impact}`,
          newValue: `${residual.likelihood} × ${residual.impact}`,
        },
      ],
    });
  },
}));
