import { useMemo } from 'react';
import type { FlowEdge, FlowNode, FlowNodeKind, FlowStage } from '@/types/flow';

/**
 * İş akışı şeması çizici.
 *
 * Kutular veri içindeki col/row ızgarasına yerleşir; oklar kutu kenarları
 * arasında dik açılı yollarla çizilir. Otomatik yerleşim denendi ve
 * bırakıldı: karar dallarını dokümandaki okunuş sırasından farklı diziyor,
 * şema kaynağıyla karşılaştırılamaz hâle geliyordu.
 */

const COL_W = 232;
const ROW_H = 132;
const BOX_W = 176;
const BOX_H = 56;
const PAD = 28;

interface Placed {
  node: FlowNode;
  /** Kutu merkezi. */
  cx: number;
  cy: number;
  w: number;
  h: number;
}

function sizeOf(kind: FlowNodeKind): { w: number; h: number } {
  if (kind === 'decision') return { w: BOX_W - 8, h: BOX_H + 22 };
  if (kind === 'actor') return { w: 132, h: 48 };
  return { w: BOX_W, h: BOX_H };
}

/** Kutu kenarında, verilen yöne bakan çıkış noktası. */
function port(p: Placed, side: 'l' | 'r' | 't' | 'b'): [number, number] {
  const hw = p.w / 2;
  const hh = p.h / 2;
  if (side === 'l') return [p.cx - hw, p.cy];
  if (side === 'r') return [p.cx + hw, p.cy];
  if (side === 't') return [p.cx, p.cy - hh];
  return [p.cx, p.cy + hh];
}

/** İki kutu arasında dik açılı yol üretir. */
function route(a: Placed, b: Placed): { d: string; end: [number, number]; dir: 'l' | 'r' | 't' | 'b' } {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;

  // Aynı hizadaysa düz çiz.
  if (Math.abs(dy) < 2 && Math.abs(dx) > 2) {
    const from = port(a, dx > 0 ? 'r' : 'l');
    const to = port(b, dx > 0 ? 'l' : 'r');
    return { d: `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`, end: to, dir: dx > 0 ? 'l' : 'r' };
  }
  if (Math.abs(dx) < 2 && Math.abs(dy) > 2) {
    const from = port(a, dy > 0 ? 'b' : 't');
    const to = port(b, dy > 0 ? 't' : 'b');
    return { d: `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`, end: to, dir: dy > 0 ? 't' : 'b' };
  }

  // Baskın eksene göre Z kırılımı.
  if (Math.abs(dx) >= Math.abs(dy)) {
    const from = port(a, dx > 0 ? 'r' : 'l');
    const to = port(b, dx > 0 ? 'l' : 'r');
    const mx = (from[0] + to[0]) / 2;
    return {
      d: `M ${from[0]} ${from[1]} L ${mx} ${from[1]} L ${mx} ${to[1]} L ${to[0]} ${to[1]}`,
      end: to,
      dir: dx > 0 ? 'l' : 'r',
    };
  }
  const from = port(a, dy > 0 ? 'b' : 't');
  const to = port(b, dy > 0 ? 't' : 'b');
  const my = (from[1] + to[1]) / 2;
  return {
    d: `M ${from[0]} ${from[1]} L ${from[0]} ${my} L ${to[0]} ${my} L ${to[0]} ${to[1]}`,
    end: to,
    dir: dy > 0 ? 't' : 'b',
  };
}

/**
 * Etiketin yol üzerindeki yeri.
 *
 * Etiket, yolun ORTA parçasına konur. Çıkış noktasına konduğunda aynı karar
 * kutusundan çıkan iki dalın etiketi (E ve H) tam olarak üst üste biniyordu;
 * orta parça her dal için farklı olduğu için bu çakışmayı çözüyor.
 */
function labelPoint(a: Placed, b: Placed): [number, number] {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;

  if (Math.abs(dy) < 2 && Math.abs(dx) > 2) {
    const from = port(a, dx > 0 ? 'r' : 'l');
    return [from[0] + (dx > 0 ? 24 : -24), from[1] - 7];
  }
  if (Math.abs(dx) < 2 && Math.abs(dy) > 2) {
    const from = port(a, dy > 0 ? 'b' : 't');
    return [from[0] + 8, from[1] + (dy > 0 ? 20 : -12)];
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    // Yatay-önce Z: dikey parçanın ortası.
    const from = port(a, dx > 0 ? 'r' : 'l');
    const to = port(b, dx > 0 ? 'l' : 'r');
    return [(from[0] + to[0]) / 2 + 7, (from[1] + to[1]) / 2];
  }
  // Dikey-önce Z: yatay parçanın ortası.
  const from = port(a, dy > 0 ? 'b' : 't');
  const to = port(b, dy > 0 ? 't' : 'b');
  return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 6];
}

/** Uzun etiketleri kutuya sığacak satırlara böler. */
function wrap(text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > max && line) { lines.push(line); line = w; } else { line = next; }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function FlowDiagram({
  stage, selectedId, onSelect, zoom = 1,
}: {
  stage: FlowStage;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Şema ölçeği. viewBox sabit kalır, yalnızca çizim alanı büyür/küçülür. */
  zoom?: number;
}) {
  const { placed, byId, width, height } = useMemo(() => {
    const minCol = Math.min(...stage.nodes.map((n) => n.col));
    const minRow = Math.min(...stage.nodes.map((n) => n.row));
    const map = new Map<string, Placed>();
    const list = stage.nodes.map((node) => {
      const { w, h } = sizeOf(node.kind);
      const p: Placed = {
        node,
        cx: PAD + (node.col - minCol) * COL_W + BOX_W / 2,
        cy: PAD + (node.row - minRow) * ROW_H + BOX_H / 2,
        w,
        h,
      };
      map.set(node.id, p);
      return p;
    });
    const maxCol = Math.max(...stage.nodes.map((n) => n.col));
    const maxRow = Math.max(...stage.nodes.map((n) => n.row));
    return {
      placed: list,
      byId: map,
      width: PAD * 2 + (maxCol - minCol) * COL_W + BOX_W,
      height: PAD * 2 + (maxRow - minRow) * ROW_H + BOX_H + 26,
    };
  }, [stage]);

  const edges = stage.edges
    .map((e) => ({ e, a: byId.get(e.from), b: byId.get(e.to) }))
    .filter((x): x is { e: FlowEdge; a: Placed; b: Placed } => Boolean(x.a && x.b));

  return (
    <div className="flow-scroll">
      <svg
        className="flow-svg"
        width={Math.round(width * zoom)}
        height={Math.round(height * zoom)}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${stage.name} iş akışı şeması`}
      >
        <defs>
          <marker id="fa" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" className="flow-arrowhead" />
          </marker>
          <marker id="fa-back" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" className="flow-arrowhead is-back" />
          </marker>
        </defs>

        {edges.map(({ e, a, b }) => {
          const r = route(a, b);
          const [lx, ly] = labelPoint(a, b);
          return (
            <g key={`${e.from}-${e.to}-${e.label ?? ''}`}>
              <path
                d={r.d}
                className={`flow-edge${e.back ? ' is-back' : ''}`}
                markerEnd={e.back ? 'url(#fa-back)' : 'url(#fa)'}
              />
              {e.label ? (
                <text x={lx} y={ly} className="flow-edge-label">{e.label}</text>
              ) : null}
            </g>
          );
        })}

        {placed.map((p) => {
          const { node } = p;
          const sel = node.id === selectedId;
          const lines = wrap(node.label, node.kind === 'decision' ? 18 : 22);
          const cls = `flow-node kind-${node.kind}${sel ? ' is-selected' : ''}`;
          const hw = p.w / 2;
          const hh = p.h / 2;
          return (
            <g
              key={node.id}
              className={cls}
              transform={`translate(${p.cx} ${p.cy})`}
              onClick={() => onSelect(node.id)}
              role="button"
              tabIndex={0}
              aria-label={node.label}
              onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') onSelect(node.id); }}
            >
              {node.kind === 'decision' ? (
                <polygon points={`0,${-hh} ${hw},0 0,${hh} ${-hw},0`} className="flow-shape" />
              ) : node.kind === 'end' || node.kind === 'start' ? (
                <rect x={-hw} y={-hh} width={p.w} height={p.h} rx={hh} className="flow-shape" />
              ) : (
                <rect x={-hw} y={-hh} width={p.w} height={p.h} rx={node.kind === 'actor' ? 22 : 6} className="flow-shape" />
              )}
              {lines.map((ln, i) => (
                <text
                  key={i}
                  x={0}
                  y={(i - (lines.length - 1) / 2) * 13 + 4}
                  className="flow-label"
                >
                  {ln}
                </text>
              ))}
              {node.note || node.source ? <circle cx={hw - 9} cy={-hh + 9} r={3} className="flow-dot" /> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
