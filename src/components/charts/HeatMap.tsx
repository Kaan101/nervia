import { Fragment, useState } from 'react';
import type { Risk } from '@/types/grc';
import { heatMatrix } from '@/lib/selectors';
import { impactLabels, likelihoodLabels, riskLevelLabels } from '@/lib/labels';
import { levelOf } from '@/lib/riskMath';
import { LevelLegend } from './Charts';

/**
 * 5×5 risk ısı haritası.
 * X ekseni olasılık, Y ekseni etki. Her hücrede skor yazılı olduğu için
 * seviye bilgisi renk dışında da okunabilir.
 */
export function HeatMap({
  risks, onSelect, selectedId, basis = 'residual', highlightIds,
}: {
  risks: Risk[];
  onSelect?: (risk: Risk) => void;
  selectedId?: string | null;
  basis?: 'residual' | 'inherent';
  highlightIds?: Set<string>;
}) {
  const [hovered, setHovered] = useState<Risk | null>(null);
  const cells = heatMatrix(risks, basis);

  return (
    <div className="stack gap-4">
      <div className="heat">
        <div className="heat-y">Etki</div>
        <div className="heat-matrix">
          {cells.map((cell, i) => {
            const isRowStart = i % 5 === 0;
            return (
              <Fragment key={`${cell.likelihood}-${cell.impact}`}>
                {isRowStart ? (
                  <div className="heat-axis-label" title={impactLabels[cell.impact]}>
                    {cell.impact}
                  </div>
                ) : null}
                <div
                  className={`heat-cell lvl-${cell.level}`}
                  title={`Olasılık ${likelihoodLabels[cell.likelihood]} × Etki ${impactLabels[cell.impact]} — ${riskLevelLabels[cell.level]} (${cell.likelihood * cell.impact})`}
                >
                  {cell.risks.map((risk) => {
                    const faded = highlightIds ? !highlightIds.has(risk.id) : false;
                    return (
                      <button
                        key={risk.id}
                        className={`heat-dot lvl-${levelOf(cell.likelihood * cell.impact)} ${selectedId === risk.id || hovered?.id === risk.id ? 'active' : ''} ${faded ? 'faded' : ''}`}
                        onMouseEnter={() => setHovered(risk)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(risk)}
                        onBlur={() => setHovered(null)}
                        onClick={() => onSelect?.(risk)}
                        aria-label={`${risk.code} ${risk.name}`}
                      >
                        {risk.code.split('-').pop()}
                      </button>
                    );
                  })}
                  <span className="cell-score">{cell.likelihood * cell.impact}</span>
                </div>
              </Fragment>
            );
          })}
          <div />
          {[1, 2, 3, 4, 5].map((n) => (
            <div className="heat-axis-label" key={`lx-${n}`} title={likelihoodLabels[n]}>{n}</div>
          ))}
        </div>
        <div />
        <div className="heat-x">Olasılık</div>
      </div>

      <div className="row between gap-4 wrap">
        <LevelLegend />
        <div className="muted" style={{ fontSize: 'var(--text-xs)', minHeight: 18 }}>
          {hovered ? (
            <span><strong style={{ color: 'var(--ink-800)' }}>{hovered.code}</strong> · {hovered.name}</span>
          ) : (
            <span>Bir riske tıklayarak ilgili süreç ve kontrollere gidebilirsiniz.</span>
          )}
        </div>
      </div>
    </div>
  );
}
