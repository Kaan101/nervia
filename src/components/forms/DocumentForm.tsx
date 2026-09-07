import { useMemo, useState } from 'react';
import type { DocumentSection, DocumentType, GrcDocument } from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import { documentTypeLabels } from '@/lib/labels';
import { blankDocument, documentFieldLabels, nextCode } from '@/lib/entityMeta';
import { isOverdue } from '@/lib/riskMath';
import { units, users } from '@/data/org';
import { Modal } from '@/components/common/Primitives';
import { ApprovalNotice } from './ApprovalNotice';
import { previewCritical, useApprovalSave } from './useApprovalSave';
import { useUi } from '@/store/useUi';
import {
  DateInput, FormGrid, FormSection, RepeaterRow, SelectInput, TextArea, TextInput, UserSelect,
} from './Fields';
import { AttachmentInput } from './AttachmentInput';
import { IconPlus } from '@/components/common/Icons';

const typePrefix: Record<DocumentType, string> = {
  procedure: 'PRS',
  instruction: 'TLM',
  policy: 'PLT',
  form: 'FRM',
  checklist: 'CHK',
  regulation: 'MEV',
  training: 'EGT',
};

interface Props {
  open: boolean;
  onClose: () => void;
  documentId?: string | null;
  defaultNodeId?: string | null;
  onSaved?: (documentId: string) => void;
}

export function DocumentFormModal({ open, onClose, documentId, defaultNodeId, onSaved }: Props) {
  const data = useData((s) => s.data);
  const createDocument = useData((s) => s.createDocument);
  const saveWithApproval = useApprovalSave('document');
  const notify = useUi((x) => x.notify);
  const currentUser = useAuth((s) => s.currentUser);

  const existing = documentId ? data.documents.find((d) => d.id === documentId) : undefined;

  const initial = useMemo<GrcDocument>(() => {
    if (existing) return existing;
    const code = nextCode(`${typePrefix.procedure}-GEN`, data.documents.map((d) => d.code));
    return blankDocument(currentUser!, code, defaultNodeId ?? null);
  }, [existing, data.documents, defaultNodeId, currentUser]);

  const [draft, setDraft] = useState<GrcDocument>(initial);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [seenKey, setSeenKey] = useState('');

  const key = `${documentId ?? 'new'}-${open}`;
  if (open && key !== seenKey) {
    setSeenKey(key);
    setDraft(initial);
    setReason('');
    setTouched(false);
  }

  if (!open || !currentUser) return null;

  const critical = previewCritical('document', existing, draft, documentFieldLabels);

  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'Doküman adı zorunludur.';
  if (!draft.code.trim()) errors.code = 'Kod zorunludur.';
  else if (data.documents.some((d) => d.code === draft.code && d.id !== draft.id)) {
    errors.code = 'Bu kod başka bir dokümanda kullanılıyor.';
  }
  if (!draft.summary.trim()) errors.summary = 'Özet zorunludur; listelerde bu metin görünür.';
  if (!draft.version.trim()) errors.version = 'Versiyon zorunludur.';
  if (new Date(draft.nextReviewAt) <= new Date(draft.publishedAt)) {
    errors.nextReviewAt = 'Gözden geçirme tarihi yayın tarihinden sonra olmalıdır.';
  }
  if (existing && !reason.trim()) errors.reason = 'Değişiklik gerekçesi audit trail için zorunludur.';
  const hasErrors = Object.keys(errors).length > 0;

  const save = () => {
    setTouched(true);
    if (hasErrors) return;
    const record = existing ? draft : { ...draft, id: `doc-${draft.code}` };
    if (existing) {
      saveWithApproval(existing.id, record as unknown as Record<string, unknown>, reason.trim(), currentUser.id);
    } else {
      createDocument(record, currentUser.id);
      notify({ tone: 'success', title: 'Doküman oluşturuldu', detail: `${record.code} v${record.version}` });
    }
    onSaved?.(record.id);
    onClose();
  };

  const err = (k: string) => (touched ? errors[k] : undefined);
  const willExpire = isOverdue(draft.nextReviewAt);

  const setSection = (i: number, patch: Partial<DocumentSection>) =>
    setDraft({
      ...draft,
      sections: draft.sections.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)),
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `Dokümanı düzenle · ${existing.code}` : 'Yeni doküman'}
      footer={
        <div className="row between gap-3">
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            {existing
              ? (critical.length
                ? 'Kritik alan değiştiği için doküman doğrudan güncellenmez; onay zinciri başlatılır.'
                : 'Değişiklikler eski/yeni değer ve gerekçeyle audit trail’e yazılır.')
              : 'Süreç ilişkisi doküman oluşturulduktan sonra da düzenlenebilir.'}
          </span>
          <span className="row gap-2">
            <button className="btn btn-sm" onClick={onClose}>Vazgeç</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={touched && hasErrors}>
              {existing
                ? (critical.length ? 'Onaya gönder' : 'Değişiklikleri kaydet')
                : 'Dokümanı oluştur'}
            </button>
          </span>
        </div>
      }
    >
      <ApprovalNotice critical={critical} />

      <FormSection title="Künye">
        <FormGrid>
          <TextInput
            label="Doküman adı" required value={draft.name} error={err('name')}
            placeholder="Örn. Hasar Ödeme Prosedürü"
            onChange={(name) => setDraft({ ...draft, name })}
          />
          <TextInput
            label="Kod" required mono value={draft.code} error={err('code')}
            onChange={(code) => setDraft({ ...draft, code })}
          />
          <SelectInput<DocumentType>
            label="Doküman türü" value={draft.type} options={documentTypeLabels}
            onChange={(type) => setDraft({
              ...draft,
              type,
              // Kod öneki türle birlikte güncellenir (yalnızca yeni kayıtta).
              code: existing
                ? draft.code
                : nextCode(`${typePrefix[type]}-GEN`, data.documents.map((d) => d.code)),
            })}
          />
          <TextInput
            label="Versiyon" required mono value={draft.version} error={err('version')}
            onChange={(version) => setDraft({ ...draft, version })}
          />
        </FormGrid>
        <TextArea
          label="Özet" required value={draft.summary} error={err('summary')} rows={2}
          placeholder="Doküman neyi düzenliyor?"
          onChange={(summary) => setDraft({ ...draft, summary })}
        />
      </FormSection>

      <FormSection title="Sahiplik ve takvim">
        <FormGrid>
          <UserSelect
            label="Doküman sahibi" value={draft.ownerId} users={users}
            onChange={(ownerId) => setDraft({ ...draft, ownerId })}
          />
          <SelectInput
            label="Sorumlu birim" value={draft.unitId}
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            onChange={(unitId) => setDraft({ ...draft, unitId })}
          />
          <DateInput
            label="Yayın tarihi" value={draft.publishedAt}
            onChange={(publishedAt) => setDraft({ ...draft, publishedAt })}
          />
          <DateInput
            label="Sonraki gözden geçirme" value={draft.nextReviewAt} error={err('nextReviewAt')}
            hint={willExpire ? '⚠ Bu tarih geçmişte — doküman “gözden geçirme gecikmiş” görünecek.' : undefined}
            onChange={(nextReviewAt) => setDraft({ ...draft, nextReviewAt })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="İçerik">
        <p className="dim" style={{ fontSize: 'var(--text-xs)' }}>
          Bölümler, dokümanın süreç panelinden açılan görüntüleyicisinde sırayla gösterilir.
          Boş bırakılırsa kayıt yalnızca künye olarak takip edilir.
        </p>
        {draft.sections.map((sec, i) => (
          <RepeaterRow
            key={i}
            title={`Bölüm ${i + 1}`}
            onRemove={() => setDraft({ ...draft, sections: draft.sections.filter((_, idx) => idx !== i) })}
          >
            <TextInput
              label="Başlık" value={sec.heading}
              placeholder="Örn. 1. Amaç ve Kapsam"
              onChange={(heading) => setSection(i, { heading })}
            />
            <TextArea
              label="Metin" value={sec.body.join('\n')} rows={4}
              hint="Her satır ayrı bir paragraf olarak gösterilir."
              onChange={(v) => setSection(i, { body: v.split('\n').filter((line) => line.trim() !== '') })}
            />
          </RepeaterRow>
        ))}
        <button
          className="btn"
          onClick={() => setDraft({ ...draft, sections: [...draft.sections, { heading: '', body: [] }] })}
        >
          <IconPlus size={14} /> Bölüm ekle
        </button>
      </FormSection>

      <FormSection title="Ekler">
        <AttachmentInput
          value={draft.attachments ?? []}
          hint="Dokümanın kaynak dosyası. Metin burada özetlenir; asıl dosya SharePoint kütüphanesinde, ağ paylaşımında ya da sunucu dizininde kalır."
          onChange={(attachments) => setDraft({ ...draft, attachments })}
        />
      </FormSection>

      {existing ? (
        <FormSection title="Değişiklik gerekçesi">
          <TextArea
            label="Neden değiştiriliyor?" required value={reason} error={err('reason')} rows={2}
            placeholder="Örn. IBAN doğrulama adımı prosedüre eklendi; versiyon 5.3’e yükseltildi."
            onChange={setReason}
          />
        </FormSection>
      ) : null}
    </Modal>
  );
}
