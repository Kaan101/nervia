/**
 * İş akışı şeması.
 *
 * Süreç haritası bir HİYERARŞİdir: ana süreç → alt süreç → faaliyet → adım.
 * İş akışı ise bir SIRA ve KARAR ağıdır: hangi adımdan sonra ne gelir, hangi
 * koşulda hangi dala gidilir, akış nerede biter. İkisi aynı şey değildir ve
 * biri diğerinden türetilemez — bu yüzden akış ayrı bir veri olarak tutulur
 * ve `nodeCode` alanıyla süreç ağacına bağlanır.
 *
 * Kaynak: TMTB Süreç ve İş Akışı Dokümanı Ver 10.0 (Aralık 2024),
 * Bölüm 9 – İş Akışları, Madde 42 (Yurt Dışı) ve Madde 43 (Yurt İçi).
 */

/** Şemadaki kutu türü. Şekil ve renk buradan belirlenir. */
export type FlowNodeKind =
  /** Akışın başladığı olay (evrak geldi, telefon çaldı). */
  | 'start'
  /** Sıradan iş adımı. */
  | 'task'
  /** Evet/hayır ya da çok yollu karar noktası (eşkenar dörtgen). */
  | 'decision'
  /** Sistem tarafından otomatik yapılan adım. */
  | 'system'
  /** İnsan aktör: zarar gören, sigortalı, dosya sorumlusu, bilirkişi. */
  | 'actor'
  /** Başka bir akışa devredilen nokta (ödeme süreci, ret süreci). */
  | 'handoff'
  /** Akışın bittiği durum. */
  | 'end';

export interface FlowNode {
  id: string;
  label: string;
  kind: FlowNodeKind;
  /** Kutunun altına yazılan kısa açıklama. */
  note?: string;
  /**
   * Bu adımın karşılık geldiği süreç düğümünün kodu (örn. 'HSR-03').
   * Kurulduğunda adım detayında o düğümün risk ve kontrolleri gösterilir.
   */
  nodeCode?: string;
  /** Dokümandaki dayanak (örn. 'Madde 18/4'). */
  source?: string;
  /** Bu adımda uygulanan kontrollerin kodu. */
  controlCodes?: string[];
  /** Bu adımda taşınan risklerin kodu. */
  riskCodes?: string[];
  /** Yerleşim sütunu (0'dan başlar); soldan sağa akış. */
  col: number;
  /** Yerleşim satırı (0'dan başlar); dallanma aşağı doğru açılır. */
  row: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  /** Ok üzerindeki etiket: 'E', 'H', 'Eksik', 'E-posta' gibi. */
  label?: string;
  /** Geriye dönen ok (döngü); farklı çizilir. */
  back?: boolean;
}

export interface FlowStage {
  id: string;
  /** Aşama adı — dokümandaki başlıkla birebir. */
  name: string;
  /** Bu aşamanın ne yaptığı. */
  summary: string;
  /** Dokümandaki dayanak maddesi. */
  source: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowChart {
  id: string;
  name: string;
  /** Bağlı olduğu ana sürecin kodu ('HSR' / 'HSD'). */
  processCode: string;
  description: string;
  stages: FlowStage[];
}
