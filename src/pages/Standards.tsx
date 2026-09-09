import { useMemo } from 'react';
import { useData } from '@/store/useData';
import { cosoComponentLabels } from '@/lib/labels';
import { Badge, Metric, SectionHeading } from '@/components/common/Primitives';
import { Legend, StackedBarList, levelMark } from '@/components/charts/Charts';
import { riskLevel } from '@/lib/riskMath';
import type { CosoComponent } from '@/types/grc';

interface StandardCard {
  code: string;
  name: string;
  scope: string;
  mapping: { area: string; where: string }[];
}

const standards: StandardCard[] = [
  {
    code: 'COSO',
    name: 'COSO Internal Control — Integrated Framework',
    scope: 'İç kontrol sisteminin beş bileşeni ve on yedi ilkesi.',
    mapping: [
      { area: 'Kontrol Ortamı', where: 'Rol ve yetki modeli, görevler ayrılığı kuralları, yetki matrisi' },
      { area: 'Risk Değerlendirme', where: 'Doğal/artık risk skorlaması, risk iştahı bantları, periyodik değerlendirme' },
      { area: 'Kontrol Faaliyetleri', where: 'Kontrol kütüphanesi; önleyici / tespit edici / düzeltici sınıflandırma' },
      { area: 'Bilgi ve İletişim', where: 'Prosedür ve doküman yönetimi, eğitim dokümanları, örnek senaryolar' },
      { area: 'İzleme', where: 'Kontrol etkinlik testleri, KRI göstergeleri, aksiyon takibi, audit trail' },
    ],
  },
  {
    code: 'ISO 31000',
    name: 'ISO 31000 Risk Management',
    scope: 'Risk yönetimi ilkeleri, çerçevesi ve süreci.',
    mapping: [
      { area: 'Risk tanımlama', where: 'Risk kütüphanesi; neden–olay–sonuç yapısı' },
      { area: 'Risk analizi', where: 'Olasılık × etki matrisi ve 5×5 ısı haritası' },
      { area: 'Risk değerlendirme', where: 'Risk iştahı eşikleri ve iştah aşımı işaretlemesi' },
      { area: 'Risk işleme', where: 'Azalt / kabul et / devret / kaçın stratejileri ve aksiyon planları' },
      { area: 'İzleme ve gözden geçirme', where: 'Altı aylık değerlendirme döngüsü, KRI izleme' },
    ],
  },
  {
    code: 'ISO 9001',
    name: 'ISO 9001 Süreç Yaklaşımı',
    scope: 'Süreçlerin girdi–çıktı ilişkisiyle tanımlanması ve sürekli iyileştirme.',
    mapping: [
      { area: 'Süreç tanımı', where: 'Ana süreç → alt süreç → faaliyet → iş adımı hiyerarşisi' },
      { area: 'Girdi / çıktı', where: 'Her adımda girdi, çıktı, kullanılan sistem ve çıktı alıcısı alanları' },
      { area: 'Süreç sahipliği', where: 'Süreç sahibi, sorumlu birim ve görevli kişiler' },
      { area: 'Dokümante bilgi', where: 'Prosedür, talimat, form ve kontrol listesi versiyonlaması' },
      { area: 'İyileştirme', where: 'Değişiklik yönetimi ve olgunluk seviyesi takibi' },
    ],
  },
  {
    code: 'ISO 27001',
    name: 'ISO 27001 Bilgi Güvenliği',
    scope: 'Bilgi güvenliği yönetim sistemi ve Ek A kontrolleri.',
    mapping: [
      { area: 'Erişim kontrolü', where: 'Kullanıcı erişim yönetimi süreci, periyodik yetki gözden geçirme' },
      { area: 'Değişiklik yönetimi', where: 'BT değişiklik ve sürüm yönetimi süreci' },
      { area: 'Veri gizliliği', where: 'KVKK kritik noktaları, veri maskeleme kontrolleri' },
      { area: 'Yedekleme', where: 'Yedekleme ve geri dönüş testi kontrolleri' },
    ],
  },
  {
    code: 'ISO 22301',
    name: 'ISO 22301 İş Sürekliliği',
    scope: 'İş sürekliliği yönetim sistemi.',
    mapping: [
      { area: 'Süreklilik riskleri', where: 'İş sürekliliği risk kategorisi ve kritik nokta işaretleri' },
      { area: 'Kritik tedarikçi', where: 'Tedarikçi risk değerlendirmesi ve çıkış planı' },
      { area: 'Kurtarma testleri', where: 'Yedek geri dönüş testi kontrolü' },
    ],
  },
  {
    code: 'Three Lines',
    name: 'Three Lines Model',
    scope: 'Risk yönetiminde rol ve sorumluluk ayrımı.',
    mapping: [
      { area: '1. hat', where: 'Süreç sahipleri ve iş birimleri — süreçleri ve kontrolleri yürütür' },
      { area: '2. hat', where: 'Risk Yönetimi ve İç Kontrol — çerçeveyi kurar, izler, değerlendirir' },
      { area: '3. hat', where: 'İç Denetim — bağımsız güvence sağlar, audit trail üzerinden doğrular' },
    ],
  },
];

export function StandardsPage() {
  const data = useData((s) => s.data);
  const activeRisks = useData((s) => s.activeRisks);
  const activeControls = useData((s) => s.activeControls);

  const cosoRows = useMemo(() => {
    const map = new Map<CosoComponent, number>();
    for (const c of activeControls) map.set(c.cosoComponent, (map.get(c.cosoComponent) ?? 0) + 1);
    return [...map.entries()].map(([key, count]) => ({
      key, label: cosoComponentLabels[key], total: count,
      byLevel: { low: count, medium: 0, high: 0, critical: 0 } as never,
    }));
  }, [data]);

  const lineCounts = useMemo(() => {
    const byLine = new Map<number, number>();
    for (const node of data.nodes) {
      const unit = data.units.find((u) => u.id === node.unitId);
      if (!unit) continue;
      byLine.set(unit.defenceLine, (byLine.get(unit.defenceLine) ?? 0) + 1);
    }
    return byLine;
  }, [data]);

  const risksByStandard = useMemo(
    () => activeRisks.filter((r) => r.standards?.length).length,
    [data],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Standart Uyumu</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Arka planda güçlü, arayüzde sade</h1>
          <p className="lede">
            Veri modeli COSO, ISO 31000, ISO 9001, ISO 27001, ISO 22301 ve Three Lines Model yaklaşımlarını
            taşır; ancak kullanıcı arayüzü bu terminolojiyi dayatmaz. Bu sayfa, hangi standart gereksiniminin
            platformda nerede karşılandığını gösterir.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Desteklenen çerçeve" value={standards.length} /></div>
        <div className="card card-pad"><Metric compact label="Sınıflandırılmış kontrol" value={activeControls.length} sub="COSO bileşenine göre" /></div>
        <div className="card card-pad"><Metric compact label="Standarda referanslı risk" value={risksByStandard} /></div>
        <div className="card card-pad">
          <Metric compact label="Savunma hattı dağılımı"
            value={`${lineCounts.get(1) ?? 0}/${lineCounts.get(2) ?? 0}/${lineCounts.get(3) ?? 0}`}
            sub="1. / 2. / 3. hat süreç sayısı" />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--s6)' }}>
        <div className="card-head">
          <h4>Kontrollerin COSO bileşenlerine dağılımı</h4>
          <Legend items={[{ color: levelMark.low, label: 'Kontrol sayısı' }]} />
        </div>
        <div className="card-body"><StackedBarList rows={cosoRows} /></div>
      </div>

      <SectionHeading title="Çerçeve eşleştirmeleri" />
      <div className="grid auto-lg" style={{ marginTop: 'var(--s4)' }}>
        {standards.map((s) => (
          <div className="card" key={s.code}>
            <div className="card-head">
              <div className="stack" style={{ gap: 4 }}>
                <span className="row gap-2">
                  <Badge tone="solid" className="mono">{s.code}</Badge>
                </span>
                <h4>{s.name}</h4>
                <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{s.scope}</span>
              </div>
            </div>
            <div className="card-body">
              <dl className="dl">
                {s.mapping.map((m) => (
                  <span key={m.area} style={{ display: 'contents' }}>
                    <dt>{m.area}</dt>
                    <dd>{m.where}</dd>
                  </span>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <SectionHeading title="Üç savunma hattı" />
        <div className="grid cols-3">
          {[
            { line: 1, title: '1. Hat — İş Birimleri', desc: 'Süreç sahipleri süreçleri yürütür, kontrolleri uygular ve riskleri birinci elden yönetir.' },
            { line: 2, title: '2. Hat — Risk Yönetimi & İç Kontrol', desc: 'Çerçeveyi kurar, risk iştahını belirler, kontrol etkinliğini test eder ve izler.' },
            { line: 3, title: '3. Hat — İç Denetim', desc: 'Bağımsız güvence sağlar; audit trail ve kontrol kanıtları üzerinden doğrulama yapar.' },
          ].map((l) => (
            <div className="card card-pad stack gap-3" key={l.line}>
              <span className="eyebrow">Hat {l.line}</span>
              <h4 style={{ fontSize: 'var(--text-sm)' }}>{l.title}</h4>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{l.desc}</p>
              <div className="hairline" style={{ margin: 0 }} />
              <div className="row gap-2 wrap">
                {data.units.filter((u) => u.defenceLine === l.line).map((u) => (
                  <span className="tag" key={u.id}>{u.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <SectionHeading title="Risk seviyelendirme ölçeği" />
        <div className="card card-pad">
          <div className="grid cols-4">
            {[
              { level: 'low', label: 'Düşük', range: '1 – 4', action: 'İzlenir; ek aksiyon gerekmez.' },
              { level: 'medium', label: 'Orta', range: '5 – 9', action: 'Mevcut kontrollerle yönetilir; periyodik gözden geçirilir.' },
              { level: 'high', label: 'Yüksek', range: '10 – 14', action: 'Aksiyon planı gerekir; üst yönetime raporlanır.' },
              { level: 'critical', label: 'Kritik', range: '15 – 25', action: 'Derhal aksiyon; Denetim Komitesi’ne raporlanır.' },
            ].map((r) => (
              <div className={`stack gap-2 lvl-${r.level}`} key={r.level}
                style={{ padding: 'var(--s4)', border: '1px solid var(--lvl-line)', background: 'var(--lvl-bg)', borderRadius: 'var(--radius)' }}>
                <span className="row gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--lvl-mark)' }} />
                  <strong style={{ color: 'var(--lvl)' }}>{r.label}</strong>
                </span>
                <span className="mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--lvl)' }}>{r.range}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-700)' }}>{r.action}</span>
              </div>
            ))}
          </div>
          <p className="dim" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--s4)' }}>
            Risk skoru = olasılık (1–5) × etki (1–5). Seviye renkleri sıralı bir durum paletidir ve her zaman
            metin etiketiyle birlikte gösterilir; hiçbir yerde tek başına renk anlam taşımaz.
          </p>
          <p className="dim" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--s2)' }}>
            {`Örnek: ${activeRisks.length} riskin ${activeRisks.filter((r) => riskLevel(r.residual) === 'critical').length} tanesi kritik bantta.`}
          </p>
        </div>
      </div>
    </div>
  );
}
