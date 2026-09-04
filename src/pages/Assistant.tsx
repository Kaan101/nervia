import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { analyseProcesses, answerQuestion, type Finding, type NlAnswer } from '@/lib/ai';
import { mainProcesses } from '@/lib/selectors';
import { Badge, EmptyState, Metric, SectionHeading, Segmented, Tabs } from '@/components/common/Primitives';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { IconArrowRight, IconSparkles, IconWarning } from '@/components/common/Icons';

const samples = [
  'Ödemelerdeki kritik riskleri göster.',
  'Son 6 ayda güncellenmeyen süreçler hangileri?',
  'Hangi kontroller manuel yapılıyor?',
  'Hukuk birimindeki yüksek riskleri göster.',
  'Gecikmiş aksiyonları listele.',
  'Etkin olmayan kontroller hangileri?',
  'Hasar Yönetimi sürecindeki riskleri göster.',
];

const findingTypeLabels: Record<Finding['type'], string> = {
  control_gap: 'Kontrol boşluğu',
  ineffective_control: 'Kontrol etkinliği',
  sod: 'Görevler ayrılığı',
  duplicate_control: 'Gereksiz tekrar',
  missing_procedure: 'Eksik prosedür',
  stale_process: 'Güncelliğini yitirmiş süreç',
  stale_document: 'Güncelliğini yitirmiş doküman',
  high_risk_step: 'Yüksek riskli adım',
  outside_appetite: 'Risk iştahı aşımı',
  overdue_action: 'Gecikmiş aksiyon',
  untested_control: 'Test edilmemiş kontrol',
  kri_breach: 'KRI eşik aşımı',
};

export function AssistantPage() {
  const data = useData((s) => s.data);
  const select = useUi((s) => s.select);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'ask' | 'analyse'>('ask');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<NlAnswer | null>(null);
  const [scope, setScope] = useState<string>('');

  const findings = useMemo(() => analyseProcesses(data, scope || undefined), [data, scope]);
  const byType = useMemo(() => {
    const map = new Map<Finding['type'], Finding[]>();
    for (const f of findings) map.set(f.type, [...(map.get(f.type) ?? []), f]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [findings]);

  const ask = (q: string) => {
    setQuestion(q);
    setAnswer(answerQuestion(data, q));
  };

  const openResult = (kind: string, id: string) => {
    if (kind === 'process') select('node', id);
    else if (kind === 'risk') select('risk', id);
    else if (kind === 'control') select('control', id);
    else if (kind === 'action') select('action', id);
    else if (kind === 'document') navigate(`/dokumanlar/${id}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow row gap-2"><IconSparkles size={13} /> Analiz Asistanı</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Doğal dilde sor, kontrol boşluklarını gör</h1>
          <p className="lede">
            Asistan; GRC bilgi tabanı ve organizasyonun veri grafiği üzerinde çalışan kural tabanlı bir
            analiz katmanıdır. Sonuçlar deterministiktir ve her tespit, dayandığı kayda geri bağlanır.
          </p>
        </div>
      </div>

      <Tabs<'ask' | 'analyse'>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'ask', label: 'Doğal dil sorgusu' },
          { id: 'analyse', label: 'Süreç analizi', count: findings.length },
        ]}
      />

      {tab === 'ask' ? (
        <div className="stack gap-5" style={{ marginTop: 'var(--s5)' }}>
          <div className="card card-pad">
            <form
              className="row gap-2"
              onSubmit={(e) => { e.preventDefault(); if (question.trim()) ask(question); }}
            >
              <span className="input row gap-2 grow" style={{ display: 'flex', alignItems: 'center', height: 40 }}>
                <IconSparkles size={16} className="dim" />
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Örn. Ödemelerdeki kritik riskleri göster."
                  style={{ border: 0, outline: 'none', background: 'none', width: '100%', fontSize: 'var(--text-md)' }}
                />
              </span>
              <button className="btn btn-lg btn-primary" type="submit">Sor</button>
            </form>

            <div className="row gap-2 wrap" style={{ marginTop: 'var(--s4)' }}>
              {samples.map((s) => (
                <button key={s} className="tag" onClick={() => ask(s)} style={{ cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          </div>

          {answer ? (
            <div className="card">
              <div className="card-head">
                <div className="stack" style={{ gap: 3 }}>
                  <span className="eyebrow">Sorgunun yorumu</span>
                  <h4>{answer.interpretation}</h4>
                  <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{answer.summary}</span>
                </div>
              </div>
              <div className="card-body stack gap-2">
                {answer.results.length ? answer.results.map((r) => (
                  <button className="rel-control" key={`${r.kind}-${r.id}`} onClick={() => openResult(r.kind, r.id)}>
                    <Badge tone="plain">{
                      { risk: 'Risk', control: 'Kontrol', process: 'Süreç', action: 'Aksiyon', document: 'Doküman' }[r.kind]
                    }</Badge>
                    <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                      <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{r.title}</span>
                      <span className="dim truncate" style={{ fontSize: 'var(--text-2xs)' }}>{r.meta}</span>
                    </span>
                    <IconArrowRight size={14} className="dim" />
                  </button>
                )) : <EmptyState title="Bu kriterlere uyan kayıt bulunamadı" />}
              </div>
              <div className="card-foot row gap-2 wrap">
                <span className="eyebrow" style={{ alignSelf: 'center' }}>Devam soruları</span>
                {answer.followUps.map((f) => (
                  <button key={f} className="btn btn-sm" onClick={() => ask(f)}>{f}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="card card-pad">
              <EmptyState
                icon={<IconSparkles size={30} />}
                title="Bir soru sorun"
                hint="Asistan; süreç, risk, kontrol, aksiyon ve doküman kayıtlarını birlikte değerlendirir. Yukarıdaki örneklerden birine tıklayarak başlayabilirsiniz."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="stack gap-5" style={{ marginTop: 'var(--s5)' }}>
          <div className="row between gap-3 wrap">
            <Segmented
              ariaLabel="Analiz kapsamı"
              value={scope}
              onChange={setScope}
              options={[{ id: '', label: 'Tüm organizasyon' }, ...mainProcesses(data).slice(0, 5).map((p) => ({ id: p.id, label: p.name }))]}
            />
            <div className="row gap-2">
              <Badge level="critical">{findings.filter((f) => f.severity === 'critical').length} kritik</Badge>
              <Badge level="high">{findings.filter((f) => f.severity === 'high').length} yüksek</Badge>
              <Badge level="medium">{findings.filter((f) => f.severity === 'medium').length} orta</Badge>
              <Badge tone="plain">{findings.filter((f) => f.severity === 'info').length} bilgi</Badge>
            </div>
          </div>

          <div className="grid cols-4">
            <div className="card card-pad"><Metric compact label="Kontrol boşluğu" value={findings.filter((f) => f.type === 'control_gap').length} tone="alert" /></div>
            <div className="card card-pad"><Metric compact label="Görevler ayrılığı" value={findings.filter((f) => f.type === 'sod').length} tone="warn" /></div>
            <div className="card card-pad"><Metric compact label="Eksik prosedür" value={findings.filter((f) => f.type === 'missing_procedure').length} /></div>
            <div className="card card-pad"><Metric compact label="Güncelliğini yitiren" value={findings.filter((f) => f.type === 'stale_process' || f.type === 'stale_document').length} /></div>
          </div>

          {byType.map(([type, list]) => (
            <div key={type}>
              <SectionHeading title={findingTypeLabels[type]} count={list.length} />
              <div className="stack gap-2">
                {list.slice(0, 12).map((f) => (
                  <button
                    key={f.id}
                    className={`callout lvl-${f.severity === 'critical' ? 'critical' : f.severity === 'high' ? 'high' : f.severity === 'medium' ? 'medium' : 'low'}`}
                    style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
                    onClick={() => {
                      if (f.entityType === 'process') select('node', f.entityId);
                      else if (f.entityType === 'risk') select('risk', f.entityId);
                      else if (f.entityType === 'control') select('control', f.entityId);
                      else if (f.entityType === 'action') select('action', f.entityId);
                      else if (f.entityType === 'document') navigate(`/dokumanlar/${f.entityId}`);
                      else navigate('/kri');
                    }}
                  >
                    <IconWarning size={16} style={{ flex: '0 0 auto', marginTop: 2 }} />
                    <span className="stack" style={{ gap: 3, minWidth: 0 }}>
                      <span className="callout-title">
                        {f.title}{f.processName ? ` · ${f.processName}` : ''}
                      </span>
                      <span>{f.detail}</span>
                      <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>→ {f.recommendation}</span>
                    </span>
                  </button>
                ))}
                {list.length > 12 ? (
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>+{list.length - 12} tespit daha</span>
                ) : null}
              </div>
            </div>
          ))}

          {!findings.length ? <EmptyState title="Bu kapsamda tespit bulunmuyor" /> : null}
        </div>
      )}

      <SelectionDrawer />
    </div>
  );
}
