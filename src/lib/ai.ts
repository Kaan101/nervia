import type {
  Control, ControlNature, Dataset, ProcessNode, Risk, RiskCategory,
} from '@/types/grc';
import { activeNodes, descendants, mainProcessOfNode, pathTo, sortRisksBySeverity } from './selectors';
import { isOverdue, isReviewOverdue, monthsSince, riskLevel, score } from './riskMath';
import { normalize } from './search';
import { riskCategoryLabels } from './labels';
import { userName } from '@/data/org';

/**
 * Kural tabanlı analiz motoru.
 *
 * Platformun "yapay zekâ destekli" katmanı; bir dil modeli çağırmadan,
 * GRC bilgi tabanı ve veri grafiği üzerinden çalışan deterministik önerilerdir.
 * Bir LLM entegrasyonu eklendiğinde bu modül, model çıktısını doğrulayan
 * kural katmanı olarak kullanılabilir.
 */

/* ------------------------------------------------------------------ */
/* 1) Risk önerme                                                      */
/* ------------------------------------------------------------------ */

export interface Suggestion {
  id: string;
  title: string;
  rationale: string;
  category?: RiskCategory;
  nature?: ControlNature;
  confidence: 'high' | 'medium' | 'low';
  /** Öneriyi tetikleyen anahtar kelimeler. */
  triggers: string[];
}

interface Pattern {
  id: string;
  keywords: string[];
  risk: { title: string; rationale: string; category: RiskCategory };
  controls: { title: string; rationale: string; nature: ControlNature }[];
}

/** GRC bilgi tabanı: süreç metnindeki desenlerden risk ve kontrol türetir. */
const patterns: Pattern[] = [
  {
    id: 'payment',
    keywords: ['ödeme', 'iban', 'havale', 'eft', 'tazminat', 'banka', 'transfer'],
    risk: {
      title: 'Yanlış hak sahibine veya yanlış hesaba ödeme yapılması',
      rationale: 'Süreçte ödeme/IBAN adımı var. Ödeme adımları en yüksek finansal kayıp potansiyeli taşıyan noktalardır.',
      category: 'financial',
    },
    controls: [
      { title: 'IBAN – hak sahibi eşleştirme doğrulaması', rationale: 'Ödeme öncesi kimlik/hesap eşleşmesi hatalı ve hileli ödemeleri kaynağında engeller.', nature: 'preventive' },
      { title: 'Hesap bilgisi değişikliğinde geri arama ve çift onay', rationale: 'Sosyal mühendislik kaynaklı hesap değişikliklerine karşı en etkili kontroldür.', nature: 'preventive' },
      { title: 'Mükerrer ödeme taraması', rationale: 'Aynı tutarın tekrar ödenmesini iletim öncesi tespit eder.', nature: 'preventive' },
    ],
  },
  {
    id: 'approval',
    keywords: ['onay', 'yetki', 'limit', 'imza', 'serbest bırak'],
    risk: {
      title: 'Yetki limitleri dışında işlem onaylanması',
      rationale: 'Onay adımı içeren süreçlerde limit aşımı ve kademe atlama tipik kontrol zafiyetidir.',
      category: 'financial',
    },
    controls: [
      { title: 'Yetki matrisi bazlı kademeli onay akışı', rationale: 'Onay kademesinin sistemce belirlenmesi kademe atlamayı imkânsız kılar.', nature: 'preventive' },
      { title: 'Kümülatif tutar üzerinden yetki kontrolü', rationale: 'İşlemin bölünerek limit aşımını engeller.', nature: 'detective' },
    ],
  },
  {
    id: 'sod',
    keywords: ['hesapla', 'onayla', 'kayıt', 'giriş', 'güncelle', 'değiştir'],
    risk: {
      title: 'Görevler ayrılığı ilkesinin ihlal edilmesi',
      rationale: 'Aynı kişinin hem işlemi oluşturup hem onaylayabildiği adımlar suistimale açıktır.',
      category: 'operational',
    },
    controls: [
      { title: 'Rol çakışma matrisi ile sistemsel görevler ayrılığı', rationale: 'Çakışan rollerin aynı kullanıcıda toplanmasını engeller.', nature: 'preventive' },
    ],
  },
  {
    id: 'data',
    keywords: ['veri', 'kişisel', 'kvkk', 'müşteri bilgisi', 'sağlık', 'kimlik', 'gizlilik'],
    risk: {
      title: 'Kişisel verilere yetkisiz erişim veya sızıntı',
      rationale: 'Süreçte kişisel veri işleniyor; KVKK ve ISO 27001 kapsamında erişim kontrolü gerekir.',
      category: 'privacy',
    },
    controls: [
      { title: 'Rol bazlı erişim ve veri maskeleme', rationale: 'Verinin yalnızca ihtiyaç duyanlarca görülmesini sağlar.', nature: 'preventive' },
      { title: 'Dışa aktarım loglama ve periyodik gözden geçirme', rationale: 'Toplu veri çekimlerini tespit eder.', nature: 'detective' },
    ],
  },
  {
    id: 'manual_entry',
    keywords: ['manuel', 'elle', 'giriş', 'form', 'kayıt oluştur'],
    risk: {
      title: 'Manuel veri girişinden kaynaklanan hata',
      rationale: 'Manuel giriş adımları veri kalitesi risklerinin en yaygın kaynağıdır.',
      category: 'operational',
    },
    controls: [
      { title: 'Zorunlu alan ve format doğrulaması', rationale: 'Hatalı verinin sisteme girmesini kaynağında engeller.', nature: 'preventive' },
      { title: 'Kaynak sistemle günlük mutabakat', rationale: 'Girilmemiş veya hatalı kayıtları ertesi gün ortaya çıkarır.', nature: 'detective' },
    ],
  },
  {
    id: 'thirdparty',
    keywords: ['tedarikçi', 'eksper', 'servis', 'dış', 'sözleşme', 'outsourc'],
    risk: {
      title: 'Üçüncü taraf performansının ve bağımsızlığının yönetilememesi',
      rationale: 'Dışarıdan alınan hizmetlerde bağımlılık, çıkar çatışması ve süreklilik riski oluşur.',
      category: 'supplier',
    },
    controls: [
      { title: 'Çıkar çatışması beyanı ve rotasyonlu görevlendirme', rationale: 'Tarafsızlığı korur ve bağımlılığı azaltır.', nature: 'preventive' },
      { title: 'Periyodik tedarikçi performans ve risk değerlendirmesi', rationale: 'Süreklilik ve kalite sapmalarını erken görür.', nature: 'detective' },
    ],
  },
  {
    id: 'regulatory',
    keywords: ['mevzuat', 'seddk', 'bildirim', 'yasal süre', 'rapor', 'düzenleyici'],
    risk: {
      title: 'Yasal süre veya raporlama yükümlülüğünün kaçırılması',
      rationale: 'Düzenleyici yükümlülük içeren adımlarda gecikme doğrudan idari yaptırım doğurur.',
      category: 'compliance',
    },
    controls: [
      { title: 'Yükümlülük takvimi ve otomatik hatırlatma/eskalasyon', rationale: 'Süre kaçırmayı sistematik biçimde engeller.', nature: 'preventive' },
      { title: 'Gönderim öncesi kaynak veri mutabakatı', rationale: 'Rapor içeriğinin doğruluğunu güvence altına alır.', nature: 'detective' },
    ],
  },
  {
    id: 'document',
    keywords: ['evrak', 'belge', 'fatura', 'doküman', 'arşiv', 'rapor teslim'],
    risk: {
      title: 'Eksik veya gerçeğe aykırı belgeye dayalı karar verilmesi',
      rationale: 'Belge toplanan adımlarda tamlık ve gerçeklik doğrulaması yoksa karar dayanağı zayıflar.',
      category: 'financial',
    },
    controls: [
      { title: 'Zorunlu evrak kontrol listesi', rationale: 'Eksik belgeyle ilerlemeyi engeller.', nature: 'preventive' },
      { title: 'Kaynağından belge doğrulama (e-fatura, kamu servisi)', rationale: 'Tahrif edilmiş belgeleri tespit eder.', nature: 'detective' },
    ],
  },
  {
    id: 'it_change',
    keywords: ['sistem', 'entegrasyon', 'geliştirme', 'sürüm', 'parametre', 'canlı'],
    risk: {
      title: 'Kontrolsüz sistem değişikliğinin süreci bozması',
      rationale: 'Sisteme bağımlı adımlarda test edilmemiş değişiklikler otomatik kontrolleri sessizce devre dışı bırakabilir.',
      category: 'it',
    },
    controls: [
      { title: 'Değişiklik onayı ve geri dönüş planı zorunluluğu', rationale: 'Üretime yalnızca test edilmiş değişikliğin geçmesini sağlar.', nature: 'preventive' },
      { title: 'Entegrasyon hata kuyruğunun günlük izlenmesi', rationale: 'Sessiz veri kayıplarını ortaya çıkarır.', nature: 'detective' },
    ],
  },
];

function matchPatterns(text: string): Pattern[] {
  const hay = normalize(text);
  return patterns.filter((p) => p.keywords.some((k) => hay.includes(normalize(k))));
}

/** Süreç adımı metninden olası riskleri önerir. */
export function suggestRisks(node: ProcessNode, existing: Risk[]): Suggestion[] {
  const text = [node.name, node.description, node.purpose ?? '', node.inputs.join(' '), node.outputs.join(' '), node.systems.join(' ')].join(' ');
  const existingText = normalize(existing.map((r) => `${r.name} ${r.description}`).join(' '));
  return matchPatterns(text)
    .map((p) => ({
      id: `sr-${node.code}-${p.id}`,
      title: p.risk.title,
      rationale: p.risk.rationale,
      category: p.risk.category,
      confidence: existingText.includes(normalize(p.risk.title).slice(0, 20)) ? ('low' as const) : ('high' as const),
      triggers: p.keywords.filter((k) => normalize(text).includes(normalize(k))),
    }))
    .filter((s) => s.confidence !== 'low');
}

/** Bir risk (veya süreç adımı) için uygulanabilecek kontrolleri önerir. */
export function suggestControls(node: ProcessNode, risks: Risk[], existing: Control[]): Suggestion[] {
  const text = [node.name, node.description, risks.map((r) => `${r.name} ${r.cause}`).join(' ')].join(' ');
  const existingText = normalize(existing.map((c) => `${c.name} ${c.description}`).join(' '));
  const out: Suggestion[] = [];
  for (const p of matchPatterns(text)) {
    for (const c of p.controls) {
      const already = existingText.includes(normalize(c.title).slice(0, 18));
      out.push({
        id: `sc-${node.code}-${p.id}-${normalize(c.title).slice(0, 12)}`,
        title: c.title,
        rationale: c.rationale,
        nature: c.nature,
        confidence: already ? 'low' : 'high',
        triggers: p.keywords.filter((k) => normalize(text).includes(normalize(k))),
      });
    }
  }
  return out.filter((s) => s.confidence !== 'low');
}

/* ------------------------------------------------------------------ */
/* 2) Süreç analizi                                                    */
/* ------------------------------------------------------------------ */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'info';

export interface Finding {
  id: string;
  type:
    | 'control_gap'
    | 'ineffective_control'
    | 'sod'
    | 'duplicate_control'
    | 'missing_procedure'
    | 'stale_process'
    | 'stale_document'
    | 'high_risk_step'
    | 'outside_appetite'
    | 'overdue_action'
    | 'untested_control'
    | 'kri_breach';
  severity: FindingSeverity;
  title: string;
  detail: string;
  recommendation: string;
  entityType: 'process' | 'risk' | 'control' | 'action' | 'document' | 'kri';
  entityId: string;
  entityName: string;
  processName?: string;
}

const appetiteThreshold = { averse: 4, minimal: 6, cautious: 9, open: 14 } as const;

/** Tüm organizasyon ya da tek bir süreç için kontrol boşluğu ve zafiyet analizi. */
export function analyseProcesses(data: Dataset, scopeNodeId?: string): Finding[] {
  // Arşivlenmiş süreçler analiz dışıdır.
  const visible = activeNodes(data.nodes);
  const scope = scopeNodeId
    ? [visible.find((n) => n.id === scopeNodeId)!, ...descendants(visible, scopeNodeId)].filter(Boolean)
    : visible;
  const scopeIds = new Set(scope.map((n) => n.id));
  const findings: Finding[] = [];
  const nameOf = (id: string) => data.nodes.find((n) => n.id === id)?.name ?? '';
  const processNameOf = (id: string) => mainProcessOfNode(data, id)?.name;

  /* Kontrolsüz veya zayıf kontrollü riskler */
  for (const risk of data.risks) {
    if (risk.archived) continue;
    if (!risk.processNodeIds.some((id) => scopeIds.has(id))) continue;
    const controls = risk.controlIds.map((id) => data.controls.find((c) => c.id === id)!).filter(Boolean);
    const level = riskLevel(risk.residual);

    if (controls.length === 0) {
      findings.push({
        id: `f-gap-${risk.id}`,
        type: 'control_gap',
        severity: level === 'critical' || level === 'high' ? 'critical' : 'high',
        title: 'Kontrolsüz risk',
        detail: `“${risk.name}” riski için tanımlı hiçbir kontrol bulunmuyor. Artık risk skoru ${score(risk.residual).toFixed(0)}.`,
        recommendation: 'Riski azaltacak en az bir önleyici kontrol tasarlanmalı ve süreç adımına bağlanmalıdır.',
        entityType: 'risk', entityId: risk.id, entityName: risk.name,
        processName: processNameOf(risk.processNodeIds[0]),
      });
    } else if (!controls.some((c) => c.nature === 'preventive') && (level === 'critical' || level === 'high')) {
      findings.push({
        id: `f-prev-${risk.id}`,
        type: 'control_gap',
        severity: 'high',
        title: 'Önleyici kontrol eksikliği',
        detail: `“${risk.name}” riski yalnızca tespit edici/düzeltici kontrollerle yönetiliyor.`,
        recommendation: 'Yüksek seviyeli riskler için olasılığı düşüren en az bir önleyici kontrol eklenmelidir.',
        entityType: 'risk', entityId: risk.id, entityName: risk.name,
        processName: processNameOf(risk.processNodeIds[0]),
      });
    }

    if (score(risk.residual) > appetiteThreshold[risk.appetite]) {
      const openActions = risk.actionIds
        .map((id) => data.actions.find((a) => a.id === id)!)
        .filter((a) => a && (a.status === 'open' || a.status === 'in_progress'));
      findings.push({
        id: `f-app-${risk.id}`,
        type: 'outside_appetite',
        severity: level === 'critical' ? 'critical' : 'high',
        title: 'Risk iştahı aşımı',
        detail: `Artık risk skoru ${score(risk.residual).toFixed(0)}, iştah eşiği ${appetiteThreshold[risk.appetite]}. ${
          openActions.length ? `${openActions.length} açık aksiyon var.` : 'Açık aksiyon bulunmuyor.'
        }`,
        recommendation: openActions.length
          ? 'Mevcut aksiyonların takvimi gözden geçirilmeli, gerekiyorsa ek kontrol tasarlanmalıdır.'
          : 'Risk iştahı aşıldığı için aksiyon planı açılması zorunludur.',
        entityType: 'risk', entityId: risk.id, entityName: risk.name,
        processName: processNameOf(risk.processNodeIds[0]),
      });
    }
  }

  /* Etkin olmayan ve test edilmemiş kontroller */
  for (const control of data.controls) {
    if (control.archived) continue;
    if (!control.processNodeIds.some((id) => scopeIds.has(id))) continue;
    if (control.effectiveness === 'ineffective' || control.effectiveness === 'partially_effective') {
      findings.push({
        id: `f-eff-${control.id}`,
        type: 'ineffective_control',
        severity: control.effectiveness === 'ineffective' ? 'critical' : 'high',
        title: control.effectiveness === 'ineffective' ? 'Etkin olmayan kontrol' : 'Kısmen etkin kontrol',
        detail: `${control.name}${control.testResult ? ` — ${control.testResult}` : ''}`,
        recommendation: 'Kontrol tasarımı gözden geçirilmeli ve iyileştirme aksiyonu açılmalıdır.',
        entityType: 'control', entityId: control.id, entityName: control.name,
        processName: processNameOf(control.processNodeIds[0]),
      });
    }
    if (control.keyControl && (!control.lastTestedAt || monthsSince(control.lastTestedAt) > 12)) {
      findings.push({
        id: `f-test-${control.id}`,
        type: 'untested_control',
        severity: 'medium',
        title: 'Test edilmemiş kritik kontrol',
        detail: control.lastTestedAt
          ? `Kritik kontrol ${monthsSince(control.lastTestedAt)} aydır test edilmedi.`
          : 'Kritik kontrol hiç test edilmemiş.',
        recommendation: 'Yıllık kontrol test planına alınmalı ve örneklem testi yapılmalıdır.',
        entityType: 'control', entityId: control.id, entityName: control.name,
        processName: processNameOf(control.processNodeIds[0]),
      });
    }
  }

  /* Görevler ayrılığı: aynı kişinin çakışan rolleri */
  const byNode = new Map<string, Control[]>();
  for (const c of data.controls) {
    if (c.archived) continue;
    for (const nodeId of c.processNodeIds) {
      if (!scopeIds.has(nodeId)) continue;
      byNode.set(nodeId, [...(byNode.get(nodeId) ?? []), c]);
    }
  }
  for (const [nodeId, controls] of byNode) {
    const node = data.nodes.find((n) => n.id === nodeId);
    if (!node || node.kind === 'step') continue;
    const owners = new Set(controls.map((c) => c.ownerId));
    const hasApproval = controls.some((c) => c.categories.includes('approval') || c.categories.includes('authorization'));
    const hasExecution = controls.some((c) => c.categories.includes('data_validation') || c.categories.includes('reconciliation'));
    if (owners.size === 1 && hasApproval && hasExecution && controls.length > 1) {
      const owner = [...owners][0];
      findings.push({
        id: `f-sod-${nodeId}`,
        type: 'sod',
        severity: 'high',
        title: 'Görevler ayrılığı zafiyeti',
        detail: `“${node.name}” adımında hem yürütme hem onay kontrollerinin sahibi aynı kişi: ${userName(owner)}.`,
        recommendation: 'Onay kontrolünün sahipliği, yürütme kontrolünden farklı bir role devredilmelidir.',
        entityType: 'process', entityId: nodeId, entityName: node.name,
        processName: processNameOf(nodeId),
      });
    }
  }

  /* Mükerrer / örtüşen kontroller */
  const controlSignature = new Map<string, Control[]>();
  for (const c of data.controls) {
    if (c.archived) continue;
    if (!c.processNodeIds.some((id) => scopeIds.has(id))) continue;
    const key = `${c.nature}|${[...c.categories].sort().join(',')}|${normalize(c.name).split(' ').slice(0, 2).join(' ')}`;
    controlSignature.set(key, [...(controlSignature.get(key) ?? []), c]);
  }
  for (const [, group] of controlSignature) {
    if (group.length < 2) continue;
    findings.push({
      id: `f-dup-${group[0].id}`,
      type: 'duplicate_control',
      severity: 'info',
      title: 'Örtüşen kontroller',
      detail: `Benzer tasarımda ${group.length} kontrol bulunuyor: ${group.map((c) => c.code).join(', ')}.`,
      recommendation: 'Kontroller tekilleştirilerek gereksiz tekrar ve test yükü azaltılabilir.',
      entityType: 'control', entityId: group[0].id, entityName: group[0].name,
    });
  }

  /* Prosedürü olmayan faaliyetler */
  for (const node of scope) {
    if (node.kind !== 'activity') continue;
    const docs = node.documentIds
      .map((id) => data.documents.find((d) => d.id === id)!)
      .filter(Boolean);
    const hasProcedure = docs.some((d) => d.type === 'procedure' || d.type === 'instruction' || d.type === 'checklist');
    const riskCount = node.riskIds.length;
    if (!hasProcedure && riskCount > 0) {
      findings.push({
        id: `f-doc-${node.id}`,
        type: 'missing_procedure',
        severity: riskCount > 1 ? 'medium' : 'info',
        title: 'Prosedürü bulunmayan faaliyet',
        detail: `“${node.name}” faaliyetinde ${riskCount} risk tanımlı ancak bağlı prosedür/talimat yok.`,
        recommendation: 'Faaliyet için yazılı prosedür hazırlanmalı veya mevcut bir prosedürle ilişkilendirilmelidir.',
        entityType: 'process', entityId: node.id, entityName: node.name,
        processName: processNameOf(node.id),
      });
    }
  }

  /* Gözden geçirmesi gecikmiş süreçler */
  for (const node of scope) {
    if (node.kind === 'step' || node.kind === 'organization') continue;
    if (isReviewOverdue(node)) {
      findings.push({
        id: `f-rev-${node.id}`,
        type: 'stale_process',
        severity: monthsSince(node.lastReviewedAt) >= 18 ? 'high' : 'medium',
        title: 'Gözden geçirme tarihi geçmiş süreç',
        detail: `Bu süreç ${monthsSince(node.lastReviewedAt)} aydır gözden geçirilmedi (hedef: ${node.reviewFrequencyMonths} ay).`,
        recommendation: 'Süreç sahibi tarafından gözden geçirilerek risk ve kontrol yapısı güncellenmelidir.',
        entityType: 'process', entityId: node.id, entityName: node.name,
        processName: processNameOf(node.id),
      });
    }
  }

  /* Süresi geçmiş dokümanlar */
  for (const doc of data.documents) {
    if (doc.archived) continue;
    if (!doc.processNodeIds.some((id) => scopeIds.has(id))) continue;
    if (doc.status === 'expired') {
      findings.push({
        id: `f-docexp-${doc.id}`,
        type: 'stale_document',
        severity: 'medium',
        title: 'Gözden geçirme tarihi geçmiş doküman',
        detail: `${doc.name} (v${doc.version}) için planlanan gözden geçirme tarihi geçti.`,
        recommendation: 'Doküman sahibi tarafından güncellenerek yeni versiyon yayımlanmalıdır.',
        entityType: 'document', entityId: doc.id, entityName: doc.name,
        processName: processNameOf(doc.processNodeIds[0]),
      });
    }
  }

  /* Gecikmiş aksiyonlar */
  for (const action of data.actions) {
    if (action.archived) continue;
    if (action.processNodeId && !scopeIds.has(action.processNodeId)) continue;
    if ((action.status === 'open' || action.status === 'in_progress') && isOverdue(action.dueDate)) {
      findings.push({
        id: `f-act-${action.id}`,
        type: 'overdue_action',
        severity: action.priority === 'critical' ? 'critical' : 'high',
        title: 'Gecikmiş aksiyon',
        detail: `${action.title} — hedef tarih ${action.dueDate}, tamamlanma %${action.progress}. Sorumlu: ${userName(action.ownerId)}.`,
        recommendation: 'Sorumlu ile revize takvim belirlenmeli, gerekirse üst yönetime eskale edilmelidir.',
        entityType: 'action', entityId: action.id, entityName: action.title,
        processName: action.processNodeId ? processNameOf(action.processNodeId) : undefined,
      });
    }
  }

  /* Yüksek riskli iş adımları */
  for (const node of scope) {
    if (node.kind !== 'activity') continue;
    const risks = node.riskIds.map((id) => data.risks.find((r) => r.id === id)!).filter(Boolean);
    const critical = risks.filter((r) => riskLevel(r.residual) === 'critical');
    if (critical.length >= 1) {
      findings.push({
        id: `f-hot-${node.id}`,
        type: 'high_risk_step',
        severity: 'high',
        title: 'Kritik risk taşıyan adım',
        detail: `“${node.name}” adımında ${critical.length} kritik seviyeli artık risk bulunuyor.`,
        recommendation: 'Adımın kontrol tasarımı önceliklendirilerek gözden geçirilmelidir.',
        entityType: 'process', entityId: node.id, entityName: node.name,
        processName: processNameOf(node.id),
      });
    }
  }

  /* KRI eşik aşımları */
  for (const kri of data.kris) {
    const last = kri.readings[kri.readings.length - 1];
    if (!last) continue;
    const breached = kri.direction === 'lower_better' ? last.value > kri.amberMax : last.value < kri.amberMax;
    if (breached) {
      const risk = data.risks.find((r) => r.id === kri.riskId);
      if (risk && !risk.processNodeIds.some((id) => scopeIds.has(id))) continue;
      findings.push({
        id: `f-kri-${kri.id}`,
        type: 'kri_breach',
        severity: 'high',
        title: 'KRI kırmızı bantta',
        detail: `${kri.name}: ${last.value}${kri.unit === '%' ? '%' : ` ${kri.unit}`} (eşik ${kri.amberMax}${kri.unit === '%' ? '%' : ''}).`,
        recommendation: 'İlgili riskin yeniden değerlendirilmesi ve aksiyon planının güncellenmesi gerekir.',
        entityType: 'kri', entityId: kri.id, entityName: kri.name,
        processName: risk ? processNameOf(risk.processNodeIds[0]) : undefined,
      });
    }
  }

  const order: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, info: 3 };
  void nameOf;
  return findings.sort((a, b) => order[a.severity] - order[b.severity] || a.title.localeCompare(b.title, 'tr'));
}

/* ------------------------------------------------------------------ */
/* 3) Doğal dil sorgulama                                              */
/* ------------------------------------------------------------------ */

export interface NlAnswer {
  interpretation: string;
  summary: string;
  results: {
    kind: 'risk' | 'control' | 'process' | 'action' | 'document';
    id: string;
    title: string;
    meta: string;
    href: string;
  }[];
  followUps: string[];
}

const categoryKeywords: { category: RiskCategory; words: string[] }[] = [
  { category: 'financial', words: ['finansal', 'mali', 'para', 'ödeme'] },
  { category: 'operational', words: ['operasyonel', 'süreç hatası'] },
  { category: 'compliance', words: ['mevzuat', 'uyum', 'yasal', 'düzenleyici'] },
  { category: 'legal', words: ['hukuki', 'dava'] },
  { category: 'cyber', words: ['siber', 'saldırı'] },
  { category: 'it', words: ['bilgi teknolojileri', 'bt ', 'sistem'] },
  { category: 'privacy', words: ['kvkk', 'gizlilik', 'kişisel veri'] },
  { category: 'supplier', words: ['tedarikçi', 'dış hizmet'] },
  { category: 'hr', words: ['insan kaynakları', 'personel', 'çalışan'] },
  { category: 'continuity', words: ['süreklilik', 'kesinti'] },
  { category: 'reputational', words: ['itibar'] },
  { category: 'strategic', words: ['stratejik'] },
];

/** Kullanıcının doğal dilde sorduğu sorunun kural tabanlı yorumu. */
export function answerQuestion(data: Dataset, question: string): NlAnswer {
  const q = normalize(question);
  const has = (...words: string[]) => words.some((w) => q.includes(normalize(w)));

  const unit = data.units.find((u) => q.includes(normalize(u.name)));
  const process = data.nodes.find((n) => n.kind === 'process' && q.includes(normalize(n.name)));
  const person = data.users.find((u) => q.includes(normalize(u.name.split(' ')[0])) && q.includes(normalize(u.name.split(' ')[1] ?? '')));
  const category = categoryKeywords.find((c) => c.words.some((w) => q.includes(normalize(w))))?.category;
  const monthsMatch = q.match(/(\d+)\s*ay/);
  const months = monthsMatch ? Number(monthsMatch[1]) : null;

  const inScope = (nodeIds: string[]) => {
    if (process) {
      const ids = new Set([process.id, ...descendants(data.nodes, process.id).map((n) => n.id)]);
      return nodeIds.some((id) => ids.has(id));
    }
    if (unit) return nodeIds.some((id) => data.nodes.find((n) => n.id === id)?.unitId === unit.id);
    return true;
  };

  const scopeLabel = process ? `${process.name} süreci` : unit ? `${unit.name} birimi` : 'tüm organizasyon';

  /* --- Güncellenmeyen süreçler --- */
  if (has('güncellenme', 'gözden geçir', 'güncel değil', 'eski süreç', 'unutul')) {
    const limit = months ?? 12;
    const stale = data.nodes
      .filter((n) => n.kind !== 'step' && n.kind !== 'organization')
      .filter((n) => monthsSince(n.lastReviewedAt) >= limit)
      .filter((n) => (unit ? n.unitId === unit.id : true))
      .sort((a, b) => monthsSince(b.lastReviewedAt) - monthsSince(a.lastReviewedAt));
    return {
      interpretation: `Son ${limit} ayda gözden geçirilmemiş süreçler — kapsam: ${scopeLabel}.`,
      summary: `${stale.length} süreç ${limit} aydır gözden geçirilmemiş.`,
      results: stale.slice(0, 20).map((n) => ({
        kind: 'process' as const, id: n.id, title: n.name,
        meta: `${monthsSince(n.lastReviewedAt)} ay önce · ${userName(n.ownerId)}`,
        href: `#/akis/${n.id}`,
      })),
      followUps: ['Gözden geçirmesi geciken süreçleri kim güncellemeli?', 'Kritik riskleri göster'],
    };
  }

  /* --- Manuel kontroller --- */
  if (has('manuel') && has('kontrol')) {
    const list = data.controls
      .filter((c) => !c.archived && c.execution === 'manual')
      .filter((c) => inScope(c.processNodeIds));
    return {
      interpretation: `Manuel olarak yürütülen kontroller — kapsam: ${scopeLabel}.`,
      summary: `${list.length} kontrol manuel olarak yürütülüyor; bunların ${list.filter((c) => c.keyControl).length} tanesi kritik kontrol.`,
      results: list.slice(0, 25).map((c) => ({
        kind: 'control' as const, id: c.id, title: c.name,
        meta: `${c.code} · ${userName(c.ownerId)} · ${c.keyControl ? 'kritik kontrol' : 'destekleyici'}`,
        href: `#/kontroller/${c.id}`,
      })),
      followUps: ['Hangi kontroller etkin değil?', 'Otomatikleştirilebilecek kontroller hangileri?'],
    };
  }

  /* --- Etkin olmayan kontroller --- */
  if (has('etkin olmayan', 'etkin değil', 'zayıf kontrol', 'çalışmayan kontrol')) {
    const list = data.controls
      .filter((c) => !c.archived && (c.effectiveness === 'ineffective' || c.effectiveness === 'partially_effective'))
      .filter((c) => inScope(c.processNodeIds));
    return {
      interpretation: `Etkinliği yetersiz kontroller — kapsam: ${scopeLabel}.`,
      summary: `${list.length} kontrolün etkinliği yetersiz; ${list.filter((c) => c.effectiveness === 'ineffective').length} tanesi tamamen etkin değil.`,
      results: list.map((c) => ({
        kind: 'control' as const, id: c.id, title: c.name,
        meta: `${c.code} · ${c.effectiveness === 'ineffective' ? 'Etkin değil' : 'Kısmen etkin'} · ${userName(c.ownerId)}`,
        href: `#/kontroller/${c.id}`,
      })),
      followUps: ['Bu kontroller için açık aksiyon var mı?', 'Kritik riskleri göster'],
    };
  }

  /* --- Aksiyonlar --- */
  if (has('aksiyon', 'aksiyonlar', 'gecikmiş')) {
    const overdueOnly = has('gecikmiş', 'geciken', 'süresi geçen');
    const list = data.actions
      .filter((a) => !a.archived && (a.status === 'open' || a.status === 'in_progress'))
      .filter((a) => (overdueOnly ? isOverdue(a.dueDate) : true))
      .filter((a) => (person ? a.ownerId === person.id : true))
      .filter((a) => (a.processNodeId ? inScope([a.processNodeId]) : true))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return {
      interpretation: `${overdueOnly ? 'Gecikmiş' : 'Açık'} aksiyonlar — kapsam: ${person ? person.name : scopeLabel}.`,
      summary: `${list.length} ${overdueOnly ? 'gecikmiş' : 'açık'} aksiyon bulunuyor.`,
      results: list.slice(0, 25).map((a) => ({
        kind: 'action' as const, id: a.id, title: a.title,
        meta: `${a.code} · hedef ${a.dueDate} · %${a.progress} · ${userName(a.ownerId)}`,
        href: `#/aksiyonlar/${a.id}`,
      })),
      followUps: ['Kritik riskleri göster', 'Etkin olmayan kontroller hangileri?'],
    };
  }

  /* --- Prosedür / doküman --- */
  if (has('prosedür', 'doküman', 'talimat', 'politika')) {
    const expiredOnly = has('güncel olmayan', 'süresi geçen', 'eski');
    const list = data.documents
      .filter((d) => !d.archived && (expiredOnly ? d.status === 'expired' : true))
      .filter((d) => inScope(d.processNodeIds));
    return {
      interpretation: `${expiredOnly ? 'Gözden geçirme tarihi geçmiş' : 'Tanımlı'} dokümanlar — kapsam: ${scopeLabel}.`,
      summary: `${list.length} doküman listeleniyor.`,
      results: list.slice(0, 25).map((d) => ({
        kind: 'document' as const, id: d.id, title: d.name,
        meta: `${d.code} · v${d.version} · gözden geçirme ${d.nextReviewAt}`,
        href: `#/dokumanlar/${d.id}`,
      })),
      followUps: ['Prosedürü olmayan faaliyetler hangileri?'],
    };
  }

  /* --- Varsayılan: risk sorgusu --- */
  const wantsCritical = has('kritik', 'en riskli', 'en yüksek');
  const wantsHigh = has('yüksek');
  let risks = data.risks.filter((r) => !r.archived && inScope(r.processNodeIds));
  if (person) risks = risks.filter((r) => r.ownerId === person.id);
  if (category) risks = risks.filter((r) => r.category === category);
  if (wantsCritical) risks = risks.filter((r) => riskLevel(r.residual) === 'critical');
  else if (wantsHigh) risks = risks.filter((r) => ['high', 'critical'].includes(riskLevel(r.residual)));

  const sorted = sortRisksBySeverity(risks);
  const parts = [
    wantsCritical ? 'kritik seviyeli' : wantsHigh ? 'yüksek ve üzeri seviyeli' : 'tüm',
    category ? riskCategoryLabels[category].toLocaleLowerCase('tr-TR') : 'riskler',
  ];
  return {
    interpretation: `${parts.join(' ')} — kapsam: ${person ? person.name : scopeLabel}.`,
    summary: sorted.length
      ? `${sorted.length} risk bulundu. En yüksek artık skor: ${score(sorted[0].residual).toFixed(0)}.`
      : 'Bu kriterlere uyan risk bulunamadı.',
    results: sorted.slice(0, 25).map((r) => ({
      kind: 'risk' as const, id: r.id, title: r.name,
      meta: `${r.code} · artık skor ${score(r.residual).toFixed(0)} · ${riskCategoryLabels[r.category]} · ${userName(r.ownerId)}`,
      href: `#/riskler/${r.id}`,
    })),
    followUps: [
      'Hangi kontroller manuel yapılıyor?',
      'Gecikmiş aksiyonları göster',
      'Son 12 ayda güncellenmeyen süreçler hangileri?',
    ],
  };
}

/** Yeni oluşturulan bir süreç için hızlı başlangıç önerisi. */
export function processHealth(data: Dataset, nodeId: string) {
  const findings = analyseProcesses(data, nodeId);
  const path = pathTo(data.nodes, nodeId);
  return {
    path,
    findings,
    criticalCount: findings.filter((f) => f.severity === 'critical').length,
    highCount: findings.filter((f) => f.severity === 'high').length,
  };
}
