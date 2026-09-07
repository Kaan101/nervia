import { useMemo, useState } from 'react';
import type {
  Control, ControlCategory, ControlEffectiveness, ControlExecution, ControlFrequency,
  ControlNature, CosoComponent,
} from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import {
  controlCategoryLabels, controlEffectivenessLabels, controlExecutionLabels,
  controlFrequencyLabels, controlNatureLabels, cosoComponentLabels,
} from '@/lib/labels';
import { blankControl, controlFieldLabels, nextCode, processPrefix } from '@/lib/entityMeta';
import { units, users } from '@/data/org';
import { Modal } from '@/components/common/Primitives';
import { ApprovalNotice } from './ApprovalNotice';
import { previewCritical, useApprovalSave } from './useApprovalSave';
import { useUi } from '@/store/useUi';
import {
  ChipMultiSelect, DateInput, FormGrid, FormSection, SelectInput, TextArea, TextInput, Toggle,
  UserSelect,
} from './Fields';
import { AttachmentInput } from './AttachmentInput';

const designLabels = {
  adequate: 'Yeterli',
  needs_improvement: 'İyileştirme gerekli',
  inadequate: 'Yetersiz',
};

interface Props {
  open: boolean;
  onClose: () => void;
  controlId?: string | null;
  defaultNodeId?: string | null;
  /** Yeni kontrol bu riske bağlanarak açılır. */
  defaultRiskId?: string | null;
  onSaved?: (controlId: string) => void;
}

export function ControlFormModal({
  open, onClose, controlId, defaultNodeId, defaultRiskId, onSaved,
}: Props) {
  const data = useData((s) => s.data);
  const createControl = useData((s) => s.createControl);
  const notify = useUi((x) => x.notify);
  const saveWithApproval = useApprovalSave('control');
  const currentUser = useAuth((s) => s.currentUser);

  const existing = controlId ? data.controls.find((c) => c.id === controlId) : undefined;

  const initial = useMemo<Control>(() => {
    if (existing) return existing;
    const prefix = `K-${processPrefix(data, defaultNodeId ?? null, currentUser!.unitId)}`;
    const code = nextCode(prefix, data.controls.map((c) => c.code));
    const base = blankControl(currentUser!, defaultNodeId ?? null, code);
    return defaultRiskId ? { ...base, riskIds: [defaultRiskId] } : base;
  }, [existing, data, defaultNodeId, defaultRiskId, currentUser]);

  const [draft, setDraft] = useState<Control>(initial);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [seenKey, setSeenKey] = useState('');

  const key = `${controlId ?? 'new'}-${open}`;
  if (open && key !== seenKey) {
    setSeenKey(key);
    setDraft(initial);
    setReason('');
    setTouched(false);
  }

  if (!open || !currentUser) return null;

  const critical = previewCritical('control', existing, draft, controlFieldLabels);

  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'Kontrol adı zorunludur.';
  if (!draft.description.trim()) errors.description = 'Açıklama zorunludur.';
  if (!draft.method.trim()) errors.method = 'Kontrolün nasıl uygulandığı yazılmalıdır.';
  if (!draft.evidence.trim()) errors.evidence = 'Kanıtı olmayan kontrol, uygulanmamış sayılır.';
  if (!draft.categories.length) errors.categories = 'En az bir kontrol kategorisi seçin.';
  if (existing && !reason.trim()) errors.reason = 'Değişiklik gerekçesi audit trail için zorunludur.';
  const hasErrors = Object.keys(errors).length > 0;

  const save = () => {
    setTouched(true);
    if (hasErrors) return;
    if (existing) {
      saveWithApproval(existing.id, draft as unknown as Record<string, unknown>, reason.trim(), currentUser.id);
      onSaved?.(existing.id);
    } else {
      createControl(draft, currentUser.id);
      notify({ tone: 'success', title: 'Kontrol oluşturuldu', detail: `${draft.code} · ${draft.name}` });
      onSaved?.(draft.id);
    }
    onClose();
  };

  const err = (k: string) => (touched ? errors[k] : undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `Kontrolü düzenle · ${existing.code}` : 'Yeni kontrol tanımla'}
      footer={
        <div className="row between gap-3">
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            {existing
              ? (critical.length
                ? 'Kritik alan değiştiği için kayıt doğrudan güncellenmez; onay zinciri başlatılır.'
                : 'Değişiklikler eski/yeni değer ve gerekçeyle audit trail’e yazılır.')
              : `Kod otomatik üretildi: ${draft.code}`}
          </span>
          <span className="row gap-2">
            <button className="btn btn-sm" onClick={onClose}>Vazgeç</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={touched && hasErrors}>
              {existing ? (critical.length ? 'Onaya gönder' : 'Değişiklikleri kaydet') : 'Kontrolü oluştur'}
            </button>
          </span>
        </div>
      }
    >
      <ApprovalNotice critical={critical} />

      <FormSection title="Tanım">
        <TextInput
          label="Kontrol adı" required value={draft.name} error={err('name')}
          placeholder="Örn. IBAN – hak sahibi eşleştirme kontrolü"
          onChange={(name) => setDraft({ ...draft, name })}
        />
        <TextArea
          label="Açıklama" required value={draft.description} error={err('description')} rows={2}
          placeholder="Kontrolün neyi engellediğini ya da tespit ettiğini yazın."
          onChange={(description) => setDraft({ ...draft, description })}
        />
      </FormSection>

      <FormSection title="Tasarım">
        <FormGrid>
          <SelectInput<ControlNature>
            label="Kontrol türü" value={draft.nature} options={controlNatureLabels}
            hint="Önleyici kontroller olasılığı, tespit edici kontroller etkiyi düşürür."
            onChange={(nature) => setDraft({ ...draft, nature })}
          />
          <SelectInput<ControlExecution>
            label="Uygulama biçimi" value={draft.execution} options={controlExecutionLabels}
            onChange={(execution) => setDraft({
              ...draft,
              execution,
              // Otomatik kontroller varsayılan olarak daha güçlü azaltma sağlar.
              mitigationStrength: execution === 'automated' ? 0.62 : execution === 'semi_automated' ? 0.52 : 0.45,
            })}
          />
          <SelectInput<ControlFrequency>
            label="Kontrol sıklığı" value={draft.frequency} options={controlFrequencyLabels}
            onChange={(frequency) => setDraft({ ...draft, frequency })}
          />
          <SelectInput<CosoComponent>
            label="COSO bileşeni" value={draft.cosoComponent} options={cosoComponentLabels}
            onChange={(cosoComponent) => setDraft({ ...draft, cosoComponent })}
          />
        </FormGrid>
        <ChipMultiSelect<ControlCategory>
          label="Kontrol kategorisi" values={draft.categories} options={controlCategoryLabels}
          error={err('categories')}
          hint="Birden fazla seçilebilir."
          onChange={(categories) => setDraft({ ...draft, categories })}
        />
        <FormGrid>
          <TextArea
            label="Kontrol yöntemi" required value={draft.method} error={err('method')} rows={3}
            hint="Kontrol fiilen nasıl uygulanıyor?"
            onChange={(method) => setDraft({ ...draft, method })}
          />
          <TextArea
            label="Kontrol kanıtı" required value={draft.evidence} error={err('evidence')} rows={3}
            hint="Denetimde hangi kayıt gösterilecek?"
            onChange={(evidence) => setDraft({ ...draft, evidence })}
          />
        </FormGrid>
        <Toggle
          label="Kritik kontrol"
          checked={draft.keyControl}
          hint="Kritik kontroller yıllık test planına otomatik alınır."
          onChange={(keyControl) => setDraft({ ...draft, keyControl })}
        />
      </FormSection>

      <FormSection title="Sahiplik ve durum">
        <FormGrid>
          <UserSelect
            label="Kontrol sahibi" value={draft.ownerId} users={users}
            onChange={(ownerId) => setDraft({ ...draft, ownerId })}
          />
          <SelectInput
            label="Sorumlu birim" value={draft.unitId}
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            onChange={(unitId) => setDraft({ ...draft, unitId })}
          />
          <SelectInput<ControlEffectiveness>
            label="Etkinlik durumu" value={draft.effectiveness} options={controlEffectivenessLabels}
            hint="Test yapılmadıysa “Test Edilmedi” bırakın."
            onChange={(effectiveness) => setDraft({ ...draft, effectiveness })}
          />
          <SelectInput
            label="Tasarım yeterliliği" value={draft.designAdequacy} options={designLabels}
            onChange={(designAdequacy) => setDraft({ ...draft, designAdequacy })}
          />
          <DateInput
            label="Son uygulanma" value={draft.lastPerformedAt}
            onChange={(lastPerformedAt) => setDraft({ ...draft, lastPerformedAt })}
          />
          <DateInput
            label="Son test" value={draft.lastTestedAt ?? ''}
            hint="Boş bırakılırsa kontrol hiç test edilmemiş sayılır."
            onChange={(v) => setDraft({ ...draft, lastTestedAt: v || null })}
          />
        </FormGrid>
        <TextArea
          label="Test sonucu" value={draft.testResult ?? ''} rows={2}
          hint="Varsa test bulgusunu yazın; kontrol kartında uyarı olarak gösterilir."
          onChange={(testResult) => setDraft({ ...draft, testResult: testResult || undefined })}
        />
      </FormSection>

      <FormSection title="Ekler">
        <AttachmentInput
          value={draft.attachments ?? []}
          hint="Kontrol kanıtının saklandığı adres — imzalı form, sistem çıktısı, kontrol listesi."
          onChange={(attachments) => setDraft({ ...draft, attachments })}
        />
      </FormSection>

      {existing ? (
        <FormSection title="Değişiklik gerekçesi">
          <TextArea
            label="Neden değiştiriliyor?" required value={reason} error={err('reason')} rows={2}
            placeholder="Örn. 2026-Q3 kontrol testi sonucunda kanıt tanımı güncellendi."
            onChange={setReason}
          />
        </FormSection>
      ) : null}
    </Modal>
  );
}
