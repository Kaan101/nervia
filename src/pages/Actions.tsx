import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { useAuth } from '@/store/useAuth';
import { daysBetween, formatDate, isOverdue } from '@/lib/riskMath';
import { actionPriorityLabels, actionSourceLabels, actionStatusLabels } from '@/lib/labels';
import { userName } from '@/data/org';
import { Badge, EmptyState, Metric, Meter, Segmented, Tabs } from '@/components/common/Primitives';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import type { ActionStatus } from '@/types/grc';

type Filter = 'all' | 'open' | 'overdue' | 'mine' | 'completed';

export function ActionsPage() {
  const data = useData((s) => s.data);
  const { select } = useUi();
  const currentUser = useAuth((s) => s.currentUser);
  const { actionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>(params.get('filtre') === 'gecikmis' ? 'overdue' : 'open');
  const [group, setGroup] = useState<'status' | 'owner' | 'priority'>('status');

  useEffect(() => { if (actionId) select('action', actionId); }, [actionId, select]);

  const rows = useMemo(() => {
    let list = data.actions;
    if (filter === 'open') list = list.filter((a) => a.status === 'open' || a.status === 'in_progress');
    if (filter === 'overdue') list = list.filter((a) => (a.status === 'open' || a.status === 'in_progress') && isOverdue(a.dueDate));
    if (filter === 'mine') list = list.filter((a) => a.ownerId === currentUser?.id);
    if (filter === 'completed') list = list.filter((a) => a.status === 'completed');
    return [...list].sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority] || a.dueDate.localeCompare(b.dueDate);
    });
  }, [data, filter, currentUser]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const a of rows) {
      const key = group === 'status' ? actionStatusLabels[a.status]
        : group === 'owner' ? userName(a.ownerId)
          : actionPriorityLabels[a.priority];
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return [...map.entries()];
  }, [rows, group]);

  const open = data.actions.filter((a) => a.status === 'open' || a.status === 'in_progress');
  const overdue = open.filter((a) => isOverdue(a.dueDate));

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Aksiyon Yönetimi</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Risk ve kontrol iyileştirme aksiyonları</h1>
          <p className="lede">
            Risk değerlendirmesi, kontrol testi veya denetim bulgusu sonucunda açılan tüm aksiyonlar,
            sorumlusu ve hedef tarihiyle birlikte tek yerden izlenir.
          </p>
        </div>
        <Segmented
          ariaLabel="Gruplama"
          value={group}
          onChange={setGroup}
          options={[
            { id: 'status', label: 'Duruma göre' },
            { id: 'owner', label: 'Sorumluya göre' },
            { id: 'priority', label: 'Önceliğe göre' },
          ]}
        />
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Toplam aksiyon" value={data.actions.length} /></div>
        <div className="card card-pad"><Metric compact label="Açık" value={open.length} /></div>
        <div className="card card-pad"><Metric compact label="Gecikmiş" value={overdue.length} tone={overdue.length ? 'alert' : 'default'} /></div>
        <div className="card card-pad">
          <Metric compact label="Ortalama tamamlanma"
            value={`%${Math.round(open.reduce((s, a) => s + a.progress, 0) / Math.max(1, open.length))}`} />
        </div>
      </div>

      <Tabs<Filter>
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'open', label: 'Açık aksiyonlar', count: open.length },
          { id: 'overdue', label: 'Gecikmiş', count: overdue.length },
          { id: 'mine', label: 'Bana atananlar', count: data.actions.filter((a) => a.ownerId === currentUser?.id).length },
          { id: 'completed', label: 'Tamamlanan', count: data.actions.filter((a) => a.status === 'completed').length },
          { id: 'all', label: 'Tümü', count: data.actions.length },
        ]}
      />

      <div className="stack gap-5" style={{ marginTop: 'var(--s5)' }}>
        {grouped.map(([key, list]) => (
          <div className="card" key={key}>
            <div className="card-head">
              <h4>{key}</h4>
              <span className="dim num" style={{ fontSize: 'var(--text-xs)' }}>{list.length} aksiyon</span>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Kod</th><th>Aksiyon</th><th>Süreç</th><th>Sorumlu</th>
                    <th>Hedef tarih</th><th>Öncelik</th><th>Kaynak</th><th style={{ minWidth: 140 }}>İlerleme</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => {
                    const late = (a.status === 'open' || a.status === 'in_progress') && isOverdue(a.dueDate);
                    const node = a.processNodeId ? data.nodes.find((n) => n.id === a.processNodeId) : null;
                    return (
                      <tr key={a.id} className="clickable" onClick={() => navigate(`/aksiyonlar/${a.id}`)}>
                        <td className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{a.code}</td>
                        <td style={{ maxWidth: 380 }}>
                          <div className="stack" style={{ gap: 2 }}>
                            <span style={{ fontWeight: 500 }}>{a.title}</span>
                            <span className="dim clamp-2" style={{ fontSize: 'var(--text-2xs)' }}>{a.description}</span>
                          </div>
                        </td>
                        <td className="dim">{node?.name ?? '—'}</td>
                        <td className="dim">{userName(a.ownerId)}</td>
                        <td className={late ? 'status-red' : 'dim'}>
                          {formatDate(a.dueDate)}
                          {late ? <div style={{ fontSize: 'var(--text-2xs)' }}>{Math.abs(daysBetween(a.dueDate))} gün gecikme</div> : null}
                        </td>
                        <td>
                          <Badge level={a.priority === 'critical' ? 'critical' : a.priority === 'high' ? 'high' : a.priority === 'medium' ? 'medium' : 'low'}>
                            {actionPriorityLabels[a.priority]}
                          </Badge>
                        </td>
                        <td className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{actionSourceLabels[a.source]}</td>
                        <td>
                          <div className="stack gap-1">
                            <Meter value={a.progress} />
                            <span className="dim num" style={{ fontSize: 'var(--text-2xs)' }}>
                              %{a.progress} · {actionStatusLabels[a.status as ActionStatus]}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!rows.length ? <EmptyState title="Bu filtreye uyan aksiyon yok" /> : null}
      </div>

      <SelectionDrawer />
    </div>
  );
}
