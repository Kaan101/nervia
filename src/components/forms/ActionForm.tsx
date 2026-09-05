import { useMemo, useState } from 'react';
import type { ActionItem, ActionPriority, ActionSource, ActionStatus } from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import { actionPriorityLabels, actionSourceLabels, actionStatusLabels } from '@/lib/labels';
import { blankAction, nextCode } from '@/lib/entityMeta';
import { isOverdue } from '@/lib/riskMath';
import { users } from '@/data/org';
import { Modal } from '@/components/common/Primitives';
import {
  DateInput, FormGrid, FormSection, PercentInput, SelectInput, TextArea, TextInput, UserSelect,
} from './Fields';

interface Props {
  open: boolean;
  onClose: () => void;
  actionId?: string | null;
  /** Yeni aksiyonun bağlanacağı kayıtlar. */
  defaults?: { riskId?: string | null; controlId?: string | null; processNodeId?: string | null };
  onSaved?: (actionId: string) => void;
}

export function ActionFormModal({ open, onClose, actionId, defaults, onSaved }: Props) {
  const data = useData((s) => s.data);
  const createAction = useData((s) => s.createAction);
  const updateAction = useData((s) => s.updateAction);
  const currentUser = useAuth((s) => s.currentUser);

  const existing = actionId ? data.actions.find((a) => a.id === actionId) : undefined;

  const initial = useMemo<ActionItem>(() => {
    if (existing) return existing;
    const code = nextCode('AKS', data.actions.map((a) => a.code), 3);
    return blankAction(currentUser!, code, defaults ?? {});
  }, [existing, data.actions, defaults, currentUser]);

  const [draft, setDraft] = useState<ActionItem>(initial);
  const [touched, setTouched] = useState(false);
  const [seenKey, setSeenKey] = useState('');

  const key = `${actionId ?? 'new'}-${open}`;
  if (open && key !== seenKey) {
    setSeenKey(key);
    setDraft(initial);
    setTouched(false);
  }

  if (!open || !currentUser) return null;

  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = 'Aksiyon başlığı zorunludur.';
  if (!draft.description.trim()) errors.description = 'Ne yapılacağı açıkça yazılmalıdır.';
  if (!draft.dueDate) errors.dueDate = 'Hedef tarih zorunludur.';
  if (draft.status === 'completed' && draft.progress !== 100) {
    errors.progress = 'Tamamlanan aksiyonun ilerlemesi %100 olmalıdır.';
  }
  if (draft.status === 'completed' && !draft.evidence.trim()) {
    errors.evidence = 'Tamamlanan aksiyon için kanıt girilmelidir.';
  }
  const hasErrors = Object.keys(errors).length > 0;

  const risks = data.risks.filter((r) => !r.archived);
  const controls = data.controls.filter((c) => !c.archived);
  const nodes = data.nodes.filter((n) => n.kind === 'activity' || n.kind === 'subprocess' || n.kind === 'process');

  const save = () => {
    setTouched(true);
    if (hasErrors) return;
    if (existing) {
      updateAction(existing.id, draft, currentUser.id);
      onSaved?.(existing.id);
    } else {
      createAction(draft, currentUser.id);
      onSaved?.(draft.id);
    }
    onClose();
  };

  const err = (k: string) => (touched ? errors[k] : undefined);
  const late = draft.dueDate && draft.status !== 'completed' && isOverdue(draft.dueDate);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `Aksiyonu düzenle · ${existing.code}` : 'Yeni aksiyon aç'}
      footer={
        <div className="row between gap-3">
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            {existing ? 'Değişiklikler audit trail’e yazılır.' : `Kod otomatik üretildi: ${draft.code}`}
          </span>
          <span className="row gap-2">
            <button className="btn btn-sm" onClick={onClose}>Vazgeç</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={touched && hasErrors}>
              {existing ? 'Değişiklikleri kaydet' : 'Aksiyonu aç'}
            </button>
          </span>
        </div>
      }
    >
      <FormSection title="Tanım">
        <TextInput
          label="Aksiyon başlığı" required value={draft.title} error={err('title')}
          placeholder="Örn. IBAN değişikliği geri arama kaydının zorunlu alan yapılması"
          onChange={(title) => setDraft({ ...draft, title })}
        />
        <TextArea
          label="Ne yapılacak?" required value={draft.description} error={err('description')} rows={3}
          onChange={(description) => setDraft({ ...draft, description })}
        />
      </FormSection>

      <FormSection title="Sorumluluk ve takvim">
        <FormGrid>
          <UserSelect
            label="Sorumlu" value={draft.ownerId} users={users}
            onChange={(ownerId) => setDraft({ ...draft, ownerId })}
          />
          <DateInput
            label="Hedef tarih" required value={draft.dueDate} error={err('dueDate')}
            hint={late ? '⚠ Bu tarih geçmişte — aksiyon gecikmiş görünecek.' : undefined}
            onChange={(dueDate) => setDraft({ ...draft, dueDate })}
          />
          <SelectInput<ActionPriority>
            label="Öncelik" value={draft.priority} options={actionPriorityLabels}
            onChange={(priority) => setDraft({ ...draft, priority })}
          />
          <SelectInput<ActionSource>
            label="Kaynak" value={draft.source} options={actionSourceLabels}
            hint="Aksiyon hangi çalışmadan doğdu?"
            onChange={(source) => setDraft({ ...draft, source })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Durum">
        <FormGrid>
          <SelectInput<ActionStatus>
            label="Durum" value={draft.status} options={actionStatusLabels}
            onChange={(status) => setDraft({
              ...draft,
              status,
              progress: status === 'completed' ? 100 : draft.progress,
            })}
          />
          <PercentInput
            label="Tamamlanma" value={draft.progress}
            onChange={(progress) => setDraft({ ...draft, progress })}
          />
        </FormGrid>
        {err('progress') ? <div className="callout lvl-high"><span>{errors.progress}</span></div> : null}
        <TextArea
          label="Kanıt" value={draft.evidence} rows={2} error={err('evidence')}
          hint="Tamamlanan aksiyonlarda zorunlu: hangi belge, rapor veya ekran kaydı ile doğrulanabilir?"
          onChange={(evidence) => setDraft({ ...draft, evidence })}
        />
        <TextArea
          label="Yönetici yorumu" value={draft.managerComment} rows={2}
          onChange={(managerComment) => setDraft({ ...draft, managerComment })}
        />
      </FormSection>

      <FormSection title="İlişkiler">
        <FormGrid>
          <SelectInput
            label="İlgili risk" value={draft.riskId ?? ''}
            options={[{ value: '', label: '— seçilmedi —' }, ...risks.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` }))]}
            onChange={(riskId) => setDraft({ ...draft, riskId: riskId || null })}
          />
          <SelectInput
            label="İlgili kontrol" value={draft.controlId ?? ''}
            options={[{ value: '', label: '— seçilmedi —' }, ...controls.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }))]}
            onChange={(controlId) => setDraft({ ...draft, controlId: controlId || null })}
          />
        </FormGrid>
        <SelectInput
          label="İlgili süreç adımı" value={draft.processNodeId ?? ''}
          options={[{ value: '', label: '— seçilmedi —' }, ...nodes.map((n) => ({ value: n.id, label: `${n.code} · ${n.name}` }))]}
          onChange={(processNodeId) => setDraft({ ...draft, processNodeId: processNodeId || null })}
        />
      </FormSection>
    </Modal>
  );
}
