import { create } from 'zustand';

export type ProcessView = 'map' | 'tree' | 'flow' | 'risk' | 'control' | 'management';

export interface RiskFilters {
  unitId: string | null;
  processId: string | null;
  category: string | null;
  ownerId: string | null;
  level: string | null;
  effectiveness: string | null;
  /** Son N ay içinde değerlendirilmiş riskler. */
  assessedWithinMonths: number | null;
}

export const emptyRiskFilters: RiskFilters = {
  unitId: null, processId: null, category: null, ownerId: null,
  level: null, effectiveness: null, assessedWithinMonths: null,
};

export interface Selection {
  kind: 'node' | 'risk' | 'control' | 'action' | 'document' | null;
  id: string | null;
}

export interface Notice {
  id: number;
  tone: 'info' | 'success' | 'warning';
  title: string;
  detail?: string;
}

interface UiState {
  view: ProcessView;
  setView: (v: ProcessView) => void;

  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  setExpanded: (ids: string[], value: boolean) => void;
  isExpanded: (id: string) => boolean;

  selection: Selection;
  select: (kind: Selection['kind'], id: string | null) => void;
  clearSelection: () => void;

  /** Grafikte vurgulanacak varlıklar (risk ↔ kontrol ilişkisi). */
  highlighted: Set<string>;
  setHighlighted: (ids: string[]) => void;

  filters: RiskFilters;
  setFilter: <K extends keyof RiskFilters>(key: K, value: RiskFilters[K]) => void;
  resetFilters: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  /** Kaydetme, onaya gönderme gibi işlemlerin geri bildirimi. */
  notice: Notice | null;
  notify: (notice: Omit<Notice, 'id'>) => void;
  dismissNotice: () => void;
}

export const useUi = create<UiState>((set, get) => ({
  view: 'map',
  setView: (view) => set({ view }),

  expanded: {},
  toggleExpanded: (id) => set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),
  setExpanded: (ids, value) =>
    set((s) => {
      const next = { ...s.expanded };
      for (const id of ids) next[id] = value;
      return { expanded: next };
    }),
  isExpanded: (id) => Boolean(get().expanded[id]),

  selection: { kind: null, id: null },
  select: (kind, id) => set({ selection: { kind, id } }),
  clearSelection: () => set({ selection: { kind: null, id: null }, highlighted: new Set() }),

  highlighted: new Set<string>(),
  setHighlighted: (ids) => set({ highlighted: new Set(ids) }),

  filters: emptyRiskFilters,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: emptyRiskFilters }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  notice: null,
  notify: (notice) => set({ notice: { ...notice, id: Date.now() } }),
  dismissNotice: () => set({ notice: null }),
}));
