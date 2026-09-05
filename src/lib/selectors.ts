import type {
  ActionItem, Control, Dataset, GrcDocument, Kri, ProcessNode, Risk, RiskLevel,
} from '@/types/grc';
import { isOverdue, isReviewOverdue, levelOf, levelOrder, riskLevel, score } from './riskMath';

export interface NodeTree extends ProcessNode {
  children: NodeTree[];
}

export function buildTree(nodes: ProcessNode[], rootId: string): NodeTree | null {
  const byParent = new Map<string, ProcessNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = byParent.get(n.parentId) ?? [];
    list.push(n);
    byParent.set(n.parentId, list);
  }
  const root = nodes.find((n) => n.id === rootId);
  if (!root) return null;
  const attach = (node: ProcessNode): NodeTree => ({
    ...node,
    children: (byParent.get(node.id) ?? []).sort((a, b) => a.order - b.order).map(attach),
  });
  return attach(root);
}

/**
 * Arşivlenmiş süreçler ve onların tüm alt ağaçları hariç düğüm listesi.
 *
 * Süreç arşivlemek yalnızca o kaydı değil, altındaki tüm yapıyı da görünürden
 * düşürür; aksi halde ağaçta sahipsiz alt süreçler kalırdı.
 */
export function activeNodes(nodes: ProcessNode[]): ProcessNode[] {
  const archivedRoots = nodes.filter((n) => n.status === 'archived').map((n) => n.id);
  if (!archivedRoots.length) return nodes;

  const hidden = new Set(archivedRoots);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of nodes) {
      if (!hidden.has(n.id) && n.parentId && hidden.has(n.parentId)) {
        hidden.add(n.id);
        grew = true;
      }
    }
  }
  return nodes.filter((n) => !hidden.has(n.id));
}

/** Bir düğüm ve tüm alt düğümleri. */
export function descendants(nodes: ProcessNode[], rootId: string): ProcessNode[] {
  const byParent = new Map<string, ProcessNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = byParent.get(n.parentId) ?? [];
    list.push(n);
    byParent.set(n.parentId, list);
  }
  const out: ProcessNode[] = [];
  const stack = [...(byParent.get(rootId) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    stack.push(...(byParent.get(n.id) ?? []));
  }
  return out;
}

/** Kökten hedefe kadar olan yol (breadcrumb). */
export function pathTo(nodes: ProcessNode[], nodeId: string): ProcessNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: ProcessNode[] = [];
  let current = byId.get(nodeId);
  while (current) {
    out.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return out;
}

export interface NodeRollup {
  subprocessCount: number;
  activityCount: number;
  stepCount: number;
  riskIds: string[];
  controlIds: string[];
  actionIds: string[];
  documentIds: string[];
  criticalRiskCount: number;
  highRiskCount: number;
  openActionCount: number;
  overdueActionCount: number;
  ineffectiveControlCount: number;
  maxResidualScore: number;
  averageMaturity: number;
  reviewOverdue: boolean;
  lastUpdatedAt: string;
}

export function rollup(data: Dataset, nodeId: string): NodeRollup {
  // Arşivlenmiş alt süreçler sayımlara dahil edilmez.
  const visible = activeNodes(data.nodes);
  const node = visible.find((n) => n.id === nodeId) ?? data.nodes.find((n) => n.id === nodeId);
  const subtree = node ? [node, ...descendants(visible, nodeId)] : [];
  const riskIds = new Set<string>();
  const controlIds = new Set<string>();
  const actionIds = new Set<string>();
  const documentIds = new Set<string>();
  let maturitySum = 0;
  let maturityCount = 0;
  let lastUpdatedAt = '1970-01-01';
  let reviewOverdue = false;

  for (const n of subtree) {
    n.riskIds.forEach((id) => riskIds.add(id));
    n.controlIds.forEach((id) => controlIds.add(id));
    n.actionIds.forEach((id) => actionIds.add(id));
    n.documentIds.forEach((id) => documentIds.add(id));
    if (n.kind !== 'step') { maturitySum += n.maturity; maturityCount += 1; }
    if (n.updatedAt > lastUpdatedAt) lastUpdatedAt = n.updatedAt;
    if (isReviewOverdue(n)) reviewOverdue = true;
  }

  // Arşivlenmiş kayıtlar sayımlara girmez.
  const risks = risksOf(data, [...riskIds]);
  const controls = controlsOf(data, [...controlIds]);
  const actions = actionsOf(data, [...actionIds]);

  return {
    subprocessCount: subtree.filter((n) => n.kind === 'subprocess').length,
    activityCount: subtree.filter((n) => n.kind === 'activity').length,
    stepCount: subtree.filter((n) => n.kind === 'step').length,
    riskIds: risks.map((r) => r.id),
    controlIds: controls.map((c) => c.id),
    actionIds: actions.map((a) => a.id),
    documentIds: documentsOf(data, [...documentIds]).map((d) => d.id),
    criticalRiskCount: risks.filter((r) => riskLevel(r.residual) === 'critical').length,
    highRiskCount: risks.filter((r) => riskLevel(r.residual) === 'high').length,
    openActionCount: actions.filter((a) => a.status === 'open' || a.status === 'in_progress').length,
    overdueActionCount: actions.filter(
      (a) => (a.status === 'open' || a.status === 'in_progress') && isOverdue(a.dueDate),
    ).length,
    ineffectiveControlCount: controls.filter(
      (c) => c.effectiveness === 'ineffective' || c.effectiveness === 'partially_effective',
    ).length,
    maxResidualScore: risks.reduce((max, r) => Math.max(max, score(r.residual)), 0),
    averageMaturity: maturityCount ? maturitySum / maturityCount : 0,
    reviewOverdue,
    lastUpdatedAt,
  };
}

export function mainProcesses(data: Dataset, includeArchived = false): ProcessNode[] {
  const source = includeArchived ? data.nodes : activeNodes(data.nodes);
  return source.filter((n) => n.kind === 'process').sort((a, b) => a.order - b.order);
}

/**
 * Kimlik listesinden kayıtları çözer.
 *
 * Arşivlenmiş kayıtlar varsayılan olarak süzülür: arşivleme, kaydı silmeden
 * listelerden düşürme yoludur. Geçmişi göstermesi gereken yerler (kütüphane
 * sayfalarının arşiv sekmesi, audit trail) `includeArchived` ile alır.
 */
export function risksOf(data: Dataset, ids: string[], includeArchived = false): Risk[] {
  return ids
    .map((id) => data.risks.find((r) => r.id === id))
    .filter((r): r is Risk => Boolean(r) && (includeArchived || !r!.archived));
}

export function controlsOf(data: Dataset, ids: string[], includeArchived = false): Control[] {
  return ids
    .map((id) => data.controls.find((c) => c.id === id))
    .filter((c): c is Control => Boolean(c) && (includeArchived || !c!.archived));
}

export function actionsOf(data: Dataset, ids: string[], includeArchived = false): ActionItem[] {
  return ids
    .map((id) => data.actions.find((a) => a.id === id))
    .filter((a): a is ActionItem => Boolean(a) && (includeArchived || !a!.archived));
}

export function documentsOf(data: Dataset, ids: string[], includeArchived = false): GrcDocument[] {
  return ids
    .map((id) => data.documents.find((d) => d.id === id))
    .filter((d): d is GrcDocument => Boolean(d) && (includeArchived || !d!.archived));
}

export function krisOf(data: Dataset, ids: string[]): Kri[] {
  return ids.map((id) => data.kris.find((k) => k.id === id)).filter((k): k is Kri => Boolean(k));
}

/** Bir riskin ait olduğu ana süreç. */
export function mainProcessOfNode(data: Dataset, nodeId: string): ProcessNode | undefined {
  return pathTo(data.nodes, nodeId).find((n) => n.kind === 'process');
}

export function mainProcessOfRisk(data: Dataset, risk: Risk): ProcessNode | undefined {
  const first = risk.processNodeIds[0];
  return first ? mainProcessOfNode(data, first) : undefined;
}

export interface PortfolioSummary {
  processCount: number;
  activityCount: number;
  riskCount: number;
  criticalRiskCount: number;
  highRiskCount: number;
  outsideAppetiteCount: number;
  controlCount: number;
  keyControlCount: number;
  ineffectiveControlCount: number;
  untestedControlCount: number;
  actionCount: number;
  openActionCount: number;
  overdueActionCount: number;
  reviewOverdueCount: number;
  reviewDueSoonCount: number;
  documentCount: number;
  expiredDocumentCount: number;
  averageResidual: number;
  averageInherent: number;
}

export function portfolio(data: Dataset): PortfolioSummary {
  const risks = data.risks.filter((r) => !r.archived);
  const controls = data.controls.filter((c) => !c.archived);
  const actions = data.actions.filter((a) => !a.archived);
  const open = actions.filter((a) => a.status === 'open' || a.status === 'in_progress');
  const visible = activeNodes(data.nodes);
  const processes = visible.filter((n) => n.kind !== 'organization' && n.kind !== 'step');
  return {
    processCount: visible.filter((n) => n.kind === 'process').length,
    activityCount: visible.filter((n) => n.kind === 'activity').length,
    riskCount: risks.length,
    criticalRiskCount: risks.filter((r) => riskLevel(r.residual) === 'critical').length,
    highRiskCount: risks.filter((r) => riskLevel(r.residual) === 'high').length,
    outsideAppetiteCount: risks.filter(
      (r) => score(r.residual) > { averse: 4, minimal: 6, cautious: 9, open: 14 }[r.appetite],
    ).length,
    controlCount: controls.length,
    keyControlCount: controls.filter((c) => c.keyControl).length,
    ineffectiveControlCount: controls.filter(
      (c) => c.effectiveness === 'ineffective' || c.effectiveness === 'partially_effective',
    ).length,
    untestedControlCount: controls.filter((c) => c.effectiveness === 'not_tested' || !c.lastTestedAt).length,
    actionCount: actions.length,
    openActionCount: open.length,
    overdueActionCount: open.filter((a) => isOverdue(a.dueDate)).length,
    reviewOverdueCount: processes.filter((n) => isReviewOverdue(n)).length,
    reviewDueSoonCount: processes.filter((n) => {
      const days = (new Date(n.nextReviewAt).getTime() - new Date('2026-09-04').getTime()) / 86_400_000;
      return days >= 0 && days <= 45;
    }).length,
    documentCount: data.documents.filter((d) => !d.archived).length,
    expiredDocumentCount: data.documents.filter((d) => !d.archived && d.status === 'expired').length,
    averageResidual: risks.length ? risks.reduce((s, r) => s + score(r.residual), 0) / risks.length : 0,
    averageInherent: risks.length ? risks.reduce((s, r) => s + score(r.inherent), 0) / risks.length : 0,
  };
}

export interface Distribution {
  key: string;
  label: string;
  total: number;
  byLevel: Record<RiskLevel, number>;
}

export function distributionBy(
  data: Dataset,
  keyOf: (risk: Risk) => { key: string; label: string } | null,
): Distribution[] {
  const map = new Map<string, Distribution>();
  for (const risk of data.risks) {
    if (risk.archived) continue;
    const k = keyOf(risk);
    if (!k) continue;
    const entry = map.get(k.key) ?? {
      key: k.key, label: k.label, total: 0,
      byLevel: { low: 0, medium: 0, high: 0, critical: 0 },
    };
    entry.total += 1;
    entry.byLevel[riskLevel(risk.residual)] += 1;
    map.set(k.key, entry);
  }
  return [...map.values()].sort(
    (a, b) =>
      b.byLevel.critical - a.byLevel.critical ||
      b.byLevel.high - a.byLevel.high ||
      b.total - a.total,
  );
}

export function sortRisksBySeverity(risks: Risk[]): Risk[] {
  return [...risks].sort(
    (a, b) =>
      levelOrder[riskLevel(b.residual)] - levelOrder[riskLevel(a.residual)] ||
      score(b.residual) - score(a.residual) ||
      score(b.inherent) - score(a.inherent),
  );
}

/** Isı haritası hücreleri: 5×5 matris. */
export function heatMatrix(risks: Risk[], use: 'residual' | 'inherent' = 'residual') {
  const cells: { likelihood: number; impact: number; risks: Risk[]; level: RiskLevel }[] = [];
  for (let impact = 5; impact >= 1; impact -= 1) {
    for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
      cells.push({
        likelihood,
        impact,
        level: levelOf(likelihood * impact),
        risks: risks.filter((r) => {
          const a = use === 'residual' ? r.residual : r.inherent;
          return Math.round(a.likelihood) === likelihood && Math.round(a.impact) === impact;
        }),
      });
    }
  }
  return cells;
}

/**
 * Aylık risk trendi.
 *
 * Gerçek bir GRC sisteminde bu seri, risk değerlendirmelerinin tarihsel
 * kayıtlarından okunur. Demo veri kümesinde tarihsel değerlendirme kaydı
 * bulunmadığı için, her riskin bugünkü artık skoru kendi trend yönüne göre
 * geriye doğru projekte edilir; seri bugünkü gerçek sayılarla biter.
 */
export function riskTrend(data: Dataset, months = 12) {
  const RATE = 0.22; // ay başına skor kayması
  const points: { period: string; critical: number; high: number; average: number }[] = [];
  const end = new Date('2026-09-01');

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setMonth(d.getMonth() - i);
    const period = d.toISOString().slice(0, 7);

    const scores = data.risks
      .filter((r) => !r.archived && r.identifiedAt.slice(0, 7) <= period)
      .map((r) => {
        const drift = r.trend === 'up' ? -RATE * i : r.trend === 'down' ? RATE * i : 0;
        return Math.max(1, Math.min(25, score(r.residual) + drift));
      });

    points.push({
      period,
      critical: scores.filter((s) => levelOf(s) === 'critical').length,
      high: scores.filter((s) => levelOf(s) === 'high').length,
      average: scores.length ? scores.reduce((sum, v) => sum + v, 0) / scores.length : 0,
    });
  }
  return points;
}
