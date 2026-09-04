import type {
  Assessment, Control, ControlEffectiveness, Kri, ProcessNode, Risk, RiskLevel,
} from '@/types/grc';

/** Risk skoru = olasılık × etki (1–25). */
export function score(a: Assessment): number {
  return a.likelihood * a.impact;
}

/** ISO 31000 uyumlu 4 bantlı seviyelendirme. */
export function levelOf(value: number): RiskLevel {
  if (value <= 4) return 'low';
  if (value <= 9) return 'medium';
  if (value <= 14) return 'high';
  return 'critical';
}

export function riskLevel(a: Assessment): RiskLevel {
  return levelOf(score(a));
}

export const levelOrder: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

/** Risk iştahı bandına karşılık gelen üst skor eşiği. */
export const appetiteThreshold = { averse: 4, minimal: 6, cautious: 9, open: 14 } as const;

/** Artık risk, iştah bandını aşıyor mu? */
export function isOutsideAppetite(risk: Risk): boolean {
  return score(risk.residual) > appetiteThreshold[risk.appetite];
}

const effectivenessWeight: Record<ControlEffectiveness, number> = {
  effective: 1,
  partially_effective: 0.55,
  ineffective: 0.1,
  not_tested: 0.35,
};

/**
 * Kontrollerin toplam azaltma gücü (0–1).
 * Kontroller bağımsız kabul edilir; artan fayda azalarak birleştirilir.
 */
export function combinedMitigation(controls: Control[]): number {
  const remaining = controls.reduce((acc, c) => {
    const strength = c.mitigationStrength * effectivenessWeight[c.effectiveness];
    return acc * (1 - Math.min(0.9, Math.max(0, strength)));
  }, 1);
  return 1 - remaining;
}

/** Doğal riskten, kontrol setine göre hesaplanan artık risk. */
export function derivedResidual(risk: Risk, controls: Control[]): Assessment {
  const m = combinedMitigation(controls);
  // Önleyici kontroller olasılığı, tespit edici/düzeltici kontroller etkiyi düşürür.
  const preventiveShare = controls.length
    ? controls.filter((c) => c.nature === 'preventive').length / controls.length
    : 0;
  const likelihoodDrop = m * (0.45 + 0.45 * preventiveShare);
  const impactDrop = m * (0.45 + 0.45 * (1 - preventiveShare));
  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v * 10) / 10));
  return {
    likelihood: clamp(risk.inherent.likelihood * (1 - likelihoodDrop)),
    impact: clamp(risk.inherent.impact * (1 - impactDrop)),
  };
}

/** Kontrollerin riski ne kadar azalttığı, yüzde olarak. */
export function mitigationPercent(risk: Risk, controls: Control[]): number {
  const inherent = score(risk.inherent);
  const residual = score(risk.residual);
  if (inherent === 0) return 0;
  void controls;
  return Math.max(0, Math.round(((inherent - residual) / inherent) * 100));
}

export type KriStatus = 'green' | 'amber' | 'red' | 'unknown';

export function kriValue(kri: Kri): number | null {
  const last = kri.readings[kri.readings.length - 1];
  return last ? last.value : null;
}

export function kriStatus(kri: Kri, value = kriValue(kri)): KriStatus {
  if (value === null) return 'unknown';
  if (kri.direction === 'lower_better') {
    if (value <= kri.greenMax) return 'green';
    if (value <= kri.amberMax) return 'amber';
    return 'red';
  }
  if (value >= kri.greenMax) return 'green';
  if (value >= kri.amberMax) return 'amber';
  return 'red';
}

/* ------------------------------------------------------------------ */
/* Tarih yardımcıları                                                  */
/* ------------------------------------------------------------------ */

export const TODAY = new Date('2026-09-04T00:00:00Z');

export function daysBetween(from: string | Date, to: string | Date = TODAY): number {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function isOverdue(dateIso: string): boolean {
  return new Date(dateIso).getTime() < TODAY.getTime();
}

export function monthsSince(dateIso: string): number {
  return Math.max(0, Math.round(daysBetween(dateIso) / 30.4));
}

/** Gözden geçirmesi gecikmiş süreç mi? */
export function isReviewOverdue(node: ProcessNode): boolean {
  return isOverdue(node.nextReviewAt);
}

/** Gözden geçirmesi 45 gün içinde gelen süreç mi? */
export function isReviewDueSoon(node: ProcessNode): boolean {
  const d = daysBetween(TODAY, node.nextReviewAt);
  return d >= 0 && d <= 45;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function relativeTime(iso: string): string {
  const days = daysBetween(iso);
  if (days === 0) return 'bugün';
  if (days === 1) return 'dün';
  if (days < 30) return `${days} gün önce`;
  const months = Math.round(days / 30.4);
  if (months < 12) return `${months} ay önce`;
  return `${Math.round(months / 12)} yıl önce`;
}
