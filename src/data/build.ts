import type {
  ActionItem, Control, Dataset, GrcDocument, Kri, NodeKind, ProcessNode, Risk,
} from '@/types/grc';
import type { NodeSpec, Pair } from './spec';
import { units, users } from './org';

/* Deterministik sözde-rastgele üreteç: veri her yüklemede aynı kalsın. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const DAY = 86_400_000;
export const NOW = new Date('2026-09-04T09:00:00Z');

function shiftDays(base: Date, days: number): string {
  return new Date(base.getTime() + days * DAY).toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const kindByDepth: NodeKind[] = ['organization', 'process', 'subprocess', 'activity', 'step'];

function pair([likelihood, impact]: Pair) {
  return { likelihood, impact };
}

export interface BuildResult extends Dataset {
  /** kod → id eşlemeleri (referanslar için). */
  nodeByCode: Map<string, ProcessNode>;
}

export function buildDataset(root: NodeSpec): BuildResult {
  const nodes: ProcessNode[] = [];
  const risks = new Map<string, Risk>();
  const controls = new Map<string, Control>();
  const actions = new Map<string, ActionItem>();
  const documents = new Map<string, GrcDocument>();
  const kris = new Map<string, Kri>();

  const nodeByCode = new Map<string, ProcessNode>();
  /** Kontrol kodundan azalttığı risk kodlarına — ikinci geçişte bağlanır. */
  const controlMitigates = new Map<string, string[]>();
  const docControlLinks = new Map<string, string[]>();
  const kriRiskLinks = new Map<string, string>();
  const actionLinks = new Map<string, { riskCode?: string; controlCode?: string }>();

  function walk(spec: NodeSpec, parent: ProcessNode | null, depth: number, order: number): ProcessNode {
    const kind = kindByDepth[Math.min(depth, kindByDepth.length - 1)];
    const seed = hash(spec.code);
    const unitId = spec.unit ?? parent?.unitId ?? 'U-EXE';
    const ownerId = spec.owner ?? parent?.ownerId ?? units.find((u) => u.id === unitId)?.managerId ?? 'usr-01';
    const reviewFrequencyMonths = spec.reviewFrequencyMonths ?? (kind === 'process' ? 12 : 12);
    const lastReviewedAt = spec.lastReviewedAt ?? shiftDays(NOW, -Math.round(40 + seed * 300));

    const node: ProcessNode = {
      id: `nd-${spec.code}`,
      code: spec.code,
      name: spec.name,
      kind,
      parentId: parent ? parent.id : null,
      order,
      description: spec.description,
      purpose: spec.purpose,
      ownerId,
      unitId,
      participantIds: spec.participants ?? parent?.participantIds ?? [],
      systems: spec.systems ?? [],
      inputs: spec.inputs ?? [],
      outputs: spec.outputs ?? [],
      riskIds: [],
      controlIds: [],
      documentIds: [],
      actionIds: [],
      criticalPoints: (spec.critical ?? []).map(([kindKey, label, note], i) => ({
        id: `${spec.code}-cp-${i + 1}`,
        kind: kindKey,
        label,
        note,
      })),
      examples: (spec.examples ?? []).map((e, i) => ({ ...e, id: `${spec.code}-ex-${i + 1}` })),
      maturity: spec.maturity ?? Math.max(2, Math.min(5, Math.round(2.5 + seed * 2))),
      status: spec.status ?? 'active',
      processClass: spec.processClass ?? parent?.processClass ?? 'core',
      standards: spec.standards ?? parent?.standards ?? [],
      lastReviewedAt,
      nextReviewAt: addMonths(lastReviewedAt, reviewFrequencyMonths),
      reviewFrequencyMonths,
      version: spec.version ?? `${1 + Math.floor(seed * 3)}.${Math.floor(seed * 9)}`,
      updatedAt: spec.updatedAt ?? shiftDays(NOW, -Math.round(5 + seed * 200)),
      customer: spec.customer,
      slaDays: spec.slaDays,
    };

    nodes.push(node);
    nodeByCode.set(spec.code, node);

    /* --- Riskler --- */
    for (const r of spec.risks ?? []) {
      const rSeed = hash(r.code);
      const identifiedAt = r.identifiedAt ?? shiftDays(NOW, -Math.round(200 + rSeed * 700));
      const lastAssessedAt = r.lastAssessedAt ?? shiftDays(NOW, -Math.round(20 + rSeed * 220));
      const risk: Risk = {
        id: `rsk-${r.code}`,
        code: r.code,
        name: r.name,
        description: r.description,
        cause: r.cause,
        consequence: r.consequence,
        category: r.category,
        ownerId: r.owner ?? ownerId,
        unitId,
        inherent: pair(r.inherent),
        residual: pair(r.residual),
        target: pair(r.target ?? [Math.max(1, r.residual[0] - 1), Math.max(1, r.residual[1] - 1)]),
        appetite: r.appetite ?? 'cautious',
        treatment: r.treatment ?? 'mitigate',
        status: r.status ?? 'monitoring',
        trend: r.trend ?? 'stable',
        controlIds: [],
        processNodeIds: [node.id],
        actionIds: [],
        kriIds: [],
        identifiedAt,
        lastAssessedAt,
        nextAssessmentAt: addMonths(lastAssessedAt, 6),
        standards: r.standards,
      };
      risks.set(r.code, risk);
      node.riskIds.push(risk.id);
    }

    /* --- Kontroller --- */
    for (const c of spec.controls ?? []) {
      const cSeed = hash(c.code);
      const control: Control = {
        id: `ctl-${c.code}`,
        code: c.code,
        name: c.name,
        description: c.description,
        ownerId: c.owner ?? ownerId,
        unitId,
        nature: c.nature,
        execution: c.execution,
        categories: c.categories,
        frequency: c.frequency,
        method: c.method,
        evidence: c.evidence,
        keyControl: c.key ?? false,
        cosoComponent: c.coso ?? 'control_activities',
        designAdequacy: c.design ?? 'adequate',
        effectiveness: c.effectiveness ?? 'effective',
        lastPerformedAt: c.lastPerformedAt ?? shiftDays(NOW, -Math.round(1 + cSeed * 40)),
        lastTestedAt: c.lastTestedAt === undefined ? shiftDays(NOW, -Math.round(30 + cSeed * 300)) : c.lastTestedAt,
        testResult: c.testResult,
        riskIds: [],
        processNodeIds: [node.id],
        documentIds: [],
        actionIds: [],
        mitigationStrength: c.strength ?? (c.execution === 'automated' ? 0.62 : 0.45),
      };
      controls.set(c.code, control);
      controlMitigates.set(c.code, c.mitigates);
      node.controlIds.push(control.id);
    }

    /* --- Dokümanlar --- */
    for (const d of spec.docs ?? []) {
      const doc: GrcDocument = {
        id: `doc-${d.code}`,
        code: d.code,
        name: d.name,
        type: d.type,
        version: d.version,
        ownerId: d.owner ?? ownerId,
        unitId,
        publishedAt: d.publishedAt,
        updatedAt: d.updatedAt ?? d.publishedAt,
        nextReviewAt: d.nextReviewAt,
        status: new Date(d.nextReviewAt).getTime() < NOW.getTime() ? 'expired' : 'published',
        summary: d.summary,
        sections: d.sections ?? [],
        processNodeIds: [node.id],
        controlIds: [],
      };
      documents.set(d.code, doc);
      docControlLinks.set(d.code, d.controlCodes ?? []);
      node.documentIds.push(doc.id);
    }

    /* --- Aksiyonlar --- */
    for (const a of spec.actions ?? []) {
      const aSeed = hash(a.code);
      const action: ActionItem = {
        id: `act-${a.code}`,
        code: a.code,
        title: a.title,
        description: a.description,
        riskId: a.riskCode ? `rsk-${a.riskCode}` : null,
        controlId: a.controlCode ? `ctl-${a.controlCode}` : null,
        processNodeId: node.id,
        ownerId: a.owner,
        createdById: a.createdBy ?? 'usr-23',
        createdAt: a.createdAt ?? shiftDays(NOW, -Math.round(30 + aSeed * 200)),
        dueDate: a.dueDate,
        closedAt: a.status === 'completed' ? shiftDays(NOW, -Math.round(3 + aSeed * 40)) : null,
        priority: a.priority,
        status: a.status,
        progress: a.progress,
        source: a.source,
        evidence: a.evidence ?? '',
        managerComment: a.managerComment ?? '',
      };
      actions.set(a.code, action);
      actionLinks.set(a.code, { riskCode: a.riskCode, controlCode: a.controlCode });
      node.actionIds.push(action.id);
    }

    /* --- KRI --- */
    for (const k of spec.kris ?? []) {
      const start = new Date(NOW);
      start.setMonth(start.getMonth() - (k.readings.length - 1));
      const kri: Kri = {
        id: `kri-${k.code}`,
        code: k.code,
        name: k.name,
        definition: k.definition,
        riskId: `rsk-${k.riskCode}`,
        ownerId: k.owner ?? ownerId,
        unit: k.unit,
        frequency: k.frequency,
        direction: k.direction,
        greenMax: k.greenMax,
        amberMax: k.amberMax,
        readings: k.readings.map((value, i) => {
          const d = new Date(start);
          d.setMonth(d.getMonth() + i);
          return { period: d.toISOString().slice(0, 7), value };
        }),
      };
      kris.set(k.code, kri);
      kriRiskLinks.set(k.code, k.riskCode);
    }

    (spec.children ?? []).forEach((child, i) => walk(child, node, depth + 1, i));
    return node;
  }

  walk(root, null, 0, 0);

  /* ---------------- İkinci geçiş: referanslar ve çapraz bağlar ---------------- */

  const specByCode = new Map<string, NodeSpec>();
  (function index(spec: NodeSpec) {
    specByCode.set(spec.code, spec);
    (spec.children ?? []).forEach(index);
  })(root);

  for (const node of nodes) {
    const spec = specByCode.get(node.code);
    if (!spec) continue;
    for (const code of spec.riskRefs ?? []) {
      const risk = risks.get(code);
      if (!risk) continue;
      if (!node.riskIds.includes(risk.id)) node.riskIds.push(risk.id);
      if (!risk.processNodeIds.includes(node.id)) risk.processNodeIds.push(node.id);
    }
    for (const code of spec.controlRefs ?? []) {
      const control = controls.get(code);
      if (!control) continue;
      if (!node.controlIds.includes(control.id)) node.controlIds.push(control.id);
      if (!control.processNodeIds.includes(node.id)) control.processNodeIds.push(node.id);
    }
    for (const code of spec.docRefs ?? []) {
      const doc = documents.get(code);
      if (!doc) continue;
      if (!node.documentIds.includes(doc.id)) node.documentIds.push(doc.id);
      if (!doc.processNodeIds.includes(node.id)) doc.processNodeIds.push(node.id);
    }
  }

  for (const [controlCode, riskCodes] of controlMitigates) {
    const control = controls.get(controlCode);
    if (!control) continue;
    for (const rc of riskCodes) {
      const risk = risks.get(rc);
      if (!risk) continue;
      if (!control.riskIds.includes(risk.id)) control.riskIds.push(risk.id);
      if (!risk.controlIds.includes(control.id)) risk.controlIds.push(control.id);
      // Kontrol, riskin bağlı olduğu süreç adımlarını da kapsar.
      for (const nodeId of risk.processNodeIds) {
        if (!control.processNodeIds.includes(nodeId)) control.processNodeIds.push(nodeId);
        const n = nodes.find((x) => x.id === nodeId);
        if (n && !n.controlIds.includes(control.id)) n.controlIds.push(control.id);
      }
    }
  }

  for (const [docCode, controlCodes] of docControlLinks) {
    const doc = documents.get(docCode);
    if (!doc) continue;
    for (const cc of controlCodes) {
      const control = controls.get(cc);
      if (!control) continue;
      if (!doc.controlIds.includes(control.id)) doc.controlIds.push(control.id);
      if (!control.documentIds.includes(doc.id)) control.documentIds.push(doc.id);
    }
  }

  for (const [actionCode, link] of actionLinks) {
    const action = actions.get(actionCode);
    if (!action) continue;
    if (link.riskCode) {
      const risk = risks.get(link.riskCode);
      if (risk && !risk.actionIds.includes(action.id)) risk.actionIds.push(action.id);
    }
    if (link.controlCode) {
      const control = controls.get(link.controlCode);
      if (control && !control.actionIds.includes(action.id)) control.actionIds.push(action.id);
    }
  }

  for (const [kriCode, riskCode] of kriRiskLinks) {
    const kri = kris.get(kriCode);
    const risk = risks.get(riskCode);
    if (kri && risk && !risk.kriIds.includes(kri.id)) risk.kriIds.push(kri.id);
  }

  return {
    units,
    users,
    nodes,
    risks: [...risks.values()],
    controls: [...controls.values()],
    actions: [...actions.values()],
    documents: [...documents.values()],
    kris: [...kris.values()],
    changeRequests: [],
    auditTrail: [],
    nodeByCode,
  };
}
