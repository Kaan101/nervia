import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { buildSearchIndex, resultKindLabels, search, type SearchResult } from '@/lib/search';
import { IconArrowRight, IconSearch } from '@/components/common/Icons';

const quickActions: { label: string; hint: string; to: string }[] = [
  { label: 'Dashboard', hint: 'Kurumsal risk görünümü', to: '/' },
  { label: 'Süreç Haritası', hint: 'Organizasyonun süreç envanteri', to: '/surecler' },
  { label: 'Risk Isı Haritası', hint: 'Olasılık × etki matrisi', to: '/isi-haritasi' },
  { label: 'Kontrol Kütüphanesi', hint: 'Tüm kontroller ve etkinlikleri', to: '/kontroller' },
  { label: 'Gecikmiş Aksiyonlar', hint: 'Hedef tarihi geçen aksiyonlar', to: '/aksiyonlar?filtre=gecikmis' },
  { label: 'Analiz Asistanı', hint: 'Doğal dilde sorgu ve süreç analizi', to: '/asistan' },
];

export function CommandPalette() {
  const data = useData((s) => s.data);
  const { paletteOpen, setPaletteOpen } = useUi();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const index = useMemo(() => buildSearchIndex(data), [data]);
  const results = useMemo(() => search(index, query, 24), [index, query]);

  const items = useMemo(() => {
    if (query.trim().length < 2) {
      return quickActions.map((a) => ({ type: 'action' as const, ...a }));
    }
    return results.map((r) => ({ type: 'result' as const, result: r }));
  }, [query, results]);

  useEffect(() => { setCursor(0); }, [query]);
  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [paletteOpen]);

  if (!paletteOpen) return null;

  const go = (i: number) => {
    const item = items[i];
    if (!item) return;
    setPaletteOpen(false);
    if (item.type === 'action') navigate(item.to);
    else navigate(hrefToRoute(item.result));
  };

  const grouped = groupResults(items);

  return createPortal(
    <>
      <div className="overlay" onClick={() => setPaletteOpen(false)} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Global arama">
        <div className="palette-input">
          <IconSearch size={18} className="dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Örn. “IBAN”, “görevler ayrılığı”, “Hasar Yönetimi”…"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
              if (e.key === 'Enter') { e.preventDefault(); go(cursor); }
              if (e.key === 'Escape') setPaletteOpen(false);
            }}
          />
          <button className="btn btn-sm btn-ghost" onClick={() => { setPaletteOpen(false); navigate(`/arama?q=${encodeURIComponent(query)}`); }}>
            Tüm sonuçlar
          </button>
        </div>

        <div className="palette-results">
          {items.length === 0 ? (
            <div className="empty" style={{ padding: 'var(--s7)' }}>
              <div className="empty-title">Sonuç bulunamadı</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>Farklı bir terim deneyin ya da Analiz Asistanı’na doğal dilde sorun.</div>
            </div>
          ) : null}

          {grouped.map((group) => (
            <div className="palette-group" key={group.label}>
              <div className="group-label">{group.label}</div>
              {group.items.map(({ item, index: i }) => (
                <button
                  key={i}
                  className={`palette-item ${cursor === i ? 'active' : ''}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(i)}
                >
                  <span className="stack grow" style={{ minWidth: 0 }}>
                    <span className="t truncate">
                      {item.type === 'action' ? item.label : item.result.title}
                    </span>
                    <span className="s truncate">
                      {item.type === 'action' ? item.hint : item.result.snippet ?? item.result.subtitle}
                    </span>
                  </span>
                  {item.type === 'result' ? (
                    <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{item.result.code}</span>
                  ) : null}
                  <IconArrowRight size={14} className="dim" />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="palette-foot">
          <span>↑↓ gezin</span><span>↵ aç</span><span>esc kapat</span>
          <span className="spacer" />
          <span>{query.trim().length >= 2 ? `${results.length} sonuç` : 'Hızlı erişim'}</span>
        </div>
      </div>
    </>,
    document.body,
  );
}

type PaletteItem =
  | { type: 'action'; label: string; hint: string; to: string }
  | { type: 'result'; result: SearchResult };

function groupResults(items: PaletteItem[]) {
  const groups = new Map<string, { item: PaletteItem; index: number }[]>();
  items.forEach((item, index) => {
    const label = item.type === 'action' ? 'Hızlı Erişim' : resultKindLabels[item.result.kind];
    groups.set(label, [...(groups.get(label) ?? []), { item, index }]);
  });
  return [...groups.entries()].map(([label, list]) => ({ label, items: list }));
}

export function hrefToRoute(result: SearchResult): string {
  return result.href.replace(/^#/, '');
}
