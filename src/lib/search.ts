import type { Dataset } from '@/types/grc';
import {
  actionStatusLabels, controlNatureLabels, documentTypeLabels, nodeKindLabels,
  riskCategoryLabels,
} from './labels';
import { userName } from '@/data/org';
import { riskLevel, score } from './riskMath';

export type ResultKind = 'process' | 'risk' | 'control' | 'action' | 'document' | 'kri' | 'user';

export interface SearchResult {
  kind: ResultKind;
  id: string;
  code: string;
  title: string;
  subtitle: string;
  context: string;
  /** Eşleşmenin geçtiği metin parçası. */
  snippet?: string;
  score: number;
  href: string;
}

interface IndexEntry extends Omit<SearchResult, 'score' | 'snippet'> {
  haystack: string;
  /** Ağırlıklı alan: başlık eşleşmeleri daha değerli. */
  title: string;
  body: string;
}

/** Türkçe karakterleri normalize ederek küçük harfe indirger. */
export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchIndex(data: Dataset): IndexEntry[] {
  const entries: IndexEntry[] = [];
  const nodeName = (id: string) => data.nodes.find((n) => n.id === id)?.name ?? '';

  for (const n of data.nodes) {
    if (n.kind === 'organization') continue;
    const body = [
      n.description, n.purpose ?? '', n.systems.join(' '), n.inputs.join(' '), n.outputs.join(' '),
      n.criticalPoints.map((c) => `${c.label} ${c.note}`).join(' '),
      n.examples.map((e) => `${e.title} ${e.scenario} ${e.risk} ${e.control} ${e.criticalNote}`).join(' '),
      userName(n.ownerId),
    ].join(' ');
    entries.push({
      kind: 'process', id: n.id, code: n.code, title: n.name,
      subtitle: `${nodeKindLabels[n.kind]} · ${userName(n.ownerId)}`,
      context: n.parentId ? nodeName(n.parentId) : '',
      href: `#/akis/${n.id}`,
      haystack: normalize(`${n.code} ${n.name} ${body}`),
      body,
    });
  }

  for (const r of data.risks) {
    if (r.archived) continue;
    const body = [r.description, r.cause, r.consequence, userName(r.ownerId), riskCategoryLabels[r.category]].join(' ');
    entries.push({
      kind: 'risk', id: r.id, code: r.code, title: r.name,
      subtitle: `${riskCategoryLabels[r.category]} · Artık skor ${score(r.residual).toFixed(0)} (${riskLevel(r.residual)})`,
      context: r.processNodeIds.map(nodeName).filter(Boolean).join(', '),
      href: `#/riskler/${r.id}`,
      haystack: normalize(`${r.code} ${r.name} ${body}`),
      body,
    });
  }

  for (const c of data.controls) {
    if (c.archived) continue;
    const body = [c.description, c.method, c.evidence, userName(c.ownerId), controlNatureLabels[c.nature]].join(' ');
    entries.push({
      kind: 'control', id: c.id, code: c.code, title: c.name,
      subtitle: `${controlNatureLabels[c.nature]} kontrol · ${userName(c.ownerId)}`,
      context: c.processNodeIds.map(nodeName).filter(Boolean).slice(0, 2).join(', '),
      href: `#/kontroller/${c.id}`,
      haystack: normalize(`${c.code} ${c.name} ${body}`),
      body,
    });
  }

  for (const a of data.actions) {
    if (a.archived) continue;
    const body = [a.description, a.evidence, a.managerComment, userName(a.ownerId)].join(' ');
    entries.push({
      kind: 'action', id: a.id, code: a.code, title: a.title,
      subtitle: `${actionStatusLabels[a.status]} · %${a.progress} · ${userName(a.ownerId)}`,
      context: a.processNodeId ? nodeName(a.processNodeId) : '',
      href: `#/aksiyonlar/${a.id}`,
      haystack: normalize(`${a.code} ${a.title} ${body}`),
      body,
    });
  }

  for (const d of data.documents) {
    if (d.archived) continue;
    const body = [d.summary, d.sections.map((s) => `${s.heading} ${s.body.join(' ')}`).join(' ')].join(' ');
    entries.push({
      kind: 'document', id: d.id, code: d.code, title: d.name,
      subtitle: `${documentTypeLabels[d.type]} · v${d.version}`,
      context: d.processNodeIds.map(nodeName).filter(Boolean).slice(0, 2).join(', '),
      href: `#/dokumanlar/${d.id}`,
      haystack: normalize(`${d.code} ${d.name} ${body}`),
      body,
    });
  }

  for (const k of data.kris) {
    entries.push({
      kind: 'kri', id: k.id, code: k.code, title: k.name,
      subtitle: `KRI · ${k.unit}`,
      context: data.risks.find((r) => r.id === k.riskId)?.name ?? '',
      href: `#/kri`,
      haystack: normalize(`${k.code} ${k.name} ${k.definition}`),
      body: k.definition,
    });
  }

  for (const u of data.users) {
    entries.push({
      kind: 'user', id: u.id, code: u.initials, title: u.name,
      subtitle: `${u.title} · ${u.department}`,
      context: u.email,
      href: `#/kullanicilar`,
      haystack: normalize(`${u.name} ${u.title} ${u.department} ${u.email}`),
      body: `${u.title} ${u.department}`,
    });
  }

  return entries;
}

function snippetFor(body: string, term: string): string | undefined {
  const hay = normalize(body);
  const idx = hay.indexOf(term);
  if (idx < 0) return undefined;
  const start = Math.max(0, idx - 60);
  const end = Math.min(body.length, idx + term.length + 90);
  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}

export function search(index: IndexEntry[], query: string, limit = 60): SearchResult[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const terms = q.split(' ').filter(Boolean);

  const results: SearchResult[] = [];
  for (const entry of index) {
    let total = 0;
    const normalizedTitle = normalize(entry.title);
    const normalizedCode = normalize(entry.code);
    for (const term of terms) {
      if (!entry.haystack.includes(term)) { total = 0; break; }
      let s = 1;
      if (normalizedCode.includes(term)) s += 6;
      if (normalizedTitle.includes(term)) s += 4;
      if (normalizedTitle.startsWith(term)) s += 3;
      total += s;
    }
    if (total > 0) {
      results.push({
        ...entry,
        score: total,
        snippet: snippetFor(entry.body, terms[0]),
      });
    }
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'tr')).slice(0, limit);
}

export const resultKindLabels: Record<ResultKind, string> = {
  process: 'Süreç',
  risk: 'Risk',
  control: 'Kontrol',
  action: 'Aksiyon',
  document: 'Doküman',
  kri: 'KRI',
  user: 'Kişi',
};
