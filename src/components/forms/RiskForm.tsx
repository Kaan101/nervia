import { useMemo, useState } from 'react';
import type { Risk, RiskAppetite, RiskCategory, RiskStatus, RiskTreatment, RiskTrend } from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import {
  riskAppetiteLabels, riskCategoryLabels, riskStatusLabels, riskTreatmentLabels, riskTrendLabels,
} from '@/lib/labels';
import { blankRisk, nextCode, processPrefix, riskFieldLabels } from '@/lib/entityMeta';
import { appetiteThreshold, score } from '@/lib/riskMath';
import { units, users } from '@/data/org';
import { Modal } from '@/components/common/Primitives';
import { ApprovalNotice } from './ApprovalNotice';
import { previewCritical, useApprovalSave } from './useApprovalSave';
import { useUi } from '@/store/useUi';
import {
  AssessmentPicker, FormGrid, FormSection, SelectInput, TextArea, TextInput, UserSelect,
} from './Fields';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Düzenlenecek risk; boşsa yeni kayıt açılır. */
  riskId?: string | null;
  /** Yeni kayıtta önceden bağlanacak süreç adımı. */
  defaultNodeId?: string | null;
  onSaved?: (riskId: string) => void;
}

export function RiskFormModal({ open, onClose, riskId, defaultNodeId, onSaved }: Props) {
  const data = useData((s) => s.data);
  const createRisk = useData((s) => s.createRisk);
  const notify = useUi((x) => x.notify);
  const saveWithApproval = useApprovalSave('risk');
  const currentUser = useAuth((s) => s.currentUser);

  const existing = riskId ? data.risks.find((r) => r.id === riskId) : undefined;

  const initial = useMemo<Risk>(() => {
    if (existing) return existing;
    const prefix = `R-${processPrefix(data, defaultNodeId ?? null, currentUser!.unitId)}`;
    const code = nextCode(prefix, data.risks.map((r) => r.code));
    return blankRisk(currentUser!, defaultNodeId ?? null, code);
  }, [existing, data, defaultNodeId, currentUser]);

  const [draft, setDraft] = useState<Risk>(initial);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Modal her açılışta güncel kayıtla başlar.
  const [seenKey, setSeenKey] = useState<string>('');
  const key = `${riskId ?? 'new'}-${open}`;
  if (open && key !== seenKey) {
    setSeenKey(key);
    setDraft(initial);
    setReason('');
    setTouched(false);
  }

  if (!open || !currentUser) return null;

  const critical = previewCritical('risk', existing, draft, riskFieldLabels);

  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'Risk adı zorunludur.';
  if (!draft.description.trim()) errors.description = 'Açıklama zorunludur.';
  if (!draft.cause.trim()) errors.cause = 'Risk nedeni, kontrol tasarımı için gereklidir.';
  if (!draft.consequence.trim()) errors.consequence = 'Risk sonucu zorunludur.';
  if (existing && !reason.trim()) errors.reason = 'Değişiklik gerekçesi audit trail için zorunludur.';
  if (score(draft.residual) > score(draft.inherent)) {
    errors.residual = 'Artık risk, doğal riskten büyük olamaz — kontroller riski artırmaz.';
  }
  const hasErrors = Object.keys(errors).length > 0;

  const outsideAppetite = score(draft.residual) > appetiteThreshold[draft.appetite];

  const save = () => {
    setTouched(true);
    if (hasErrors) return;
    if (existing) {
      saveWithApproval(existing.id, draft as unknown as Record<string, unknown>, reason.trim(), currentUser.id);
      onSaved?.(existing.id);
    } else {
      createRisk(draft, currentUser.id);
      notify({ tone: 'success', title: 'Risk oluşturuldu', detail: `${draft.code} · ${draft.name}` });
      onSaved?.(draft.id);
    }
    onClose();
  };

  const err = (k: string) => (touched ? errors[k] : undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `Riski düzenle · ${existing.code}` : 'Yeni risk tanımla'}
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
              {existing ? (critical.length ? 'Onaya gönder' : 'Değişiklikleri kaydet') : 'Riski oluştur'}
            </button>
          </span>
        </div>
      }
    >
      <ApprovalNotice critical={critical} />

      <FormSection title="Tanım">
        <TextInput
          label="Risk adı" required value={draft.name} error={err('name')}
          placeholder="Örn. Yanlış IBAN’a ödeme yapılması"
          onChange={(name) => setDraft({ ...draft, name })}
        />
        <TextArea
          label="Açıklama" required value={draft.description} error={err('description')} rows={2}
          placeholder="Riskin ne olduğunu bir cümleyle tarif edin."
          onChange={(description) => setDraft({ ...draft, description })}
        />
        <FormGrid>
          <TextArea
            label="Risk nedeni" required value={draft.cause} error={err('cause')} rows={3}
            hint="Bu risk neden ortaya çıkıyor? Kontrol tasarımı buradan türetilir."
            onChange={(cause) => setDraft({ ...draft, cause })}
          />
          <TextArea
            label="Risk sonucu" required value={draft.consequence} error={err('consequence')} rows={3}
            hint="Gerçekleşirse ne olur? Etki puanı bununla tutarlı olmalı."
            onChange={(consequence) => setDraft({ ...draft, consequence })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Sınıflandırma ve sahiplik">
        <FormGrid>
          <SelectInput<RiskCategory>
            label="Risk türü" value={draft.category} options={riskCategoryLabels}
            onChange={(category) => setDraft({ ...draft, category })}
          />
          <SelectInput
            label="Sorumlu birim" value={draft.unitId}
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            onChange={(unitId) => setDraft({ ...draft, unitId })}
          />
          <UserSelect
            label="Risk sahibi" value={draft.ownerId} users={users}
            onChange={(ownerId) => setDraft({ ...draft, ownerId })}
          />
          <SelectInput<RiskStatus>
            label="Durum" value={draft.status} options={riskStatusLabels}
            onChange={(status) => setDraft({ ...draft, status })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Değerlendirme">
        <FormGrid>
          <AssessmentPicker
            label="Doğal risk" value={draft.inherent}
            hint="Hiçbir kontrol olmasaydı risk ne olurdu?"
            onChange={(inherent) => setDraft({ ...draft, inherent })}
          />
          <AssessmentPicker
            label="Artık risk" value={draft.residual}
            hint="Mevcut kontroller uygulandıktan sonra kalan risk."
            onChange={(residual) => setDraft({ ...draft, residual })}
          />
        </FormGrid>
        {err('residual') ? (
          <div className="callout lvl-critical">
            <span>{errors.residual}</span>
          </div>
        ) : null}
        <FormGrid>
          <AssessmentPicker
            label="Hedef risk" value={draft.target}
            hint="Aksiyonlar tamamlandığında ulaşılması hedeflenen seviye."
            onChange={(target) => setDraft({ ...draft, target })}
          />
          <div className="stack gap-4">
            <SelectInput<RiskAppetite>
              label="Risk iştahı" value={draft.appetite} options={riskAppetiteLabels}
              hint={`Eşik skoru: ${appetiteThreshold[draft.appetite]}`}
              onChange={(appetite) => setDraft({ ...draft, appetite })}
            />
            <SelectInput<RiskTreatment>
              label="Yönetim stratejisi" value={draft.treatment} options={riskTreatmentLabels}
              onChange={(treatment) => setDraft({ ...draft, treatment })}
            />
            <SelectInput<RiskTrend>
              label="Trend" value={draft.trend} options={riskTrendLabels}
              onChange={(trend) => setDraft({ ...draft, trend })}
            />
          </div>
        </FormGrid>
        {outsideAppetite ? (
          <div className="callout lvl-high">
            <span>
              <strong>İştah bandı aşılıyor. </strong>
              Artık risk skoru {score(draft.residual)}, “{riskAppetiteLabels[draft.appetite]}” iştahının
              eşiği {appetiteThreshold[draft.appetite]}. Bu risk için aksiyon planı açılması beklenir.
            </span>
          </div>
        ) : null}
      </FormSection>

      {existing ? (
        <FormSection title="Değişiklik gerekçesi">
          <TextArea
            label="Neden değiştiriliyor?" required value={reason} error={err('reason')} rows={2}
            placeholder="Örn. 2026-Q3 risk değerlendirme çalışması sonucunda revize edildi."
            onChange={setReason}
          />
        </FormSection>
      ) : null}
    </Modal>
  );
}
