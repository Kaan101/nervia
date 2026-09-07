import { useMemo, useState } from 'react';
import type {
  CriticalPoint, NodeKind, ProcessClass, ProcessNode, ProcessStatus, WorkedExample,
} from '@/types/grc';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import {
  criticalPointLabels, nodeKindLabels, processClassLabels, processStatusLabels,
} from '@/lib/labels';
import { blankNode, childKindOf, nodeFieldLabels, suggestNodeCode } from '@/lib/entityMeta';
import { units, users } from '@/data/org';
import { Modal } from '@/components/common/Primitives';
import { ApprovalNotice } from './ApprovalNotice';
import { previewCritical, useApprovalSave } from './useApprovalSave';
import { useUi } from '@/store/useUi';
import {
  DateInput, FormGrid, FormSection, ListInput, MaturityInput, MultiUserSelect, RepeaterRow,
  SelectInput, TextArea, TextInput, UserSelect,
} from './Fields';
import { AttachmentInput } from './AttachmentInput';
import { IconPlus } from '@/components/common/Icons';

const criticalKinds: Record<CriticalPoint['kind'], string> = criticalPointLabels as Record<
  CriticalPoint['kind'],
  string
>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Düzenlenecek düğüm. */
  nodeId?: string | null;
  /** Yeni düğüm bu üst düğümün altına eklenir. */
  parentId?: string | null;
  onSaved?: (nodeId: string) => void;
}

export function NodeFormModal({ open, onClose, nodeId, parentId, onSaved }: Props) {
  const data = useData((s) => s.data);
  const createNode = useData((s) => s.createNode);
  const saveWithApproval = useApprovalSave('process');
  const notify = useUi((x) => x.notify);
  const currentUser = useAuth((s) => s.currentUser);

  const existing = nodeId ? data.nodes.find((n) => n.id === nodeId) : undefined;
  const parent = parentId ? data.nodes.find((n) => n.id === parentId) : undefined;
  const childKind: NodeKind | null = parent ? childKindOf(parent.kind) : null;

  const initial = useMemo<ProcessNode | null>(() => {
    if (existing) return existing;
    if (!parent || !childKind || !currentUser) return null;
    const order = data.nodes.filter((n) => n.parentId === parent.id).length;
    return blankNode(currentUser, parent, childKind, suggestNodeCode(data, parent, childKind), order);
  }, [existing, parent, childKind, data, currentUser]);

  const [draft, setDraft] = useState<ProcessNode | null>(initial);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [seenKey, setSeenKey] = useState('');

  const key = `${nodeId ?? parentId ?? 'new'}-${open}`;
  if (open && key !== seenKey) {
    setSeenKey(key);
    setDraft(initial);
    setReason('');
    setTouched(false);
  }

  if (!open || !currentUser || !draft) return null;

  const critical = previewCritical('process', existing, draft, nodeFieldLabels);

  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'Ad zorunludur.';
  if (!draft.description.trim()) errors.description = 'Açıklama zorunludur.';
  if (!draft.code.trim()) errors.code = 'Kod zorunludur.';
  else if (data.nodes.some((n) => n.code === draft.code && n.id !== draft.id)) {
    errors.code = 'Bu kod başka bir süreçte kullanılıyor.';
  }
  if (existing && !reason.trim()) errors.reason = 'Değişiklik gerekçesi audit trail için zorunludur.';
  const hasErrors = Object.keys(errors).length > 0;

  const save = () => {
    setTouched(true);
    if (hasErrors) return;
    // Kod, kimliğin parçası olduğu için yalnızca yeni kayıtta belirlenir.
    const record = existing ? draft : { ...draft, id: `nd-${draft.code}` };
    if (existing) {
      saveWithApproval(existing.id, record as unknown as Record<string, unknown>, reason.trim(), currentUser.id);
    } else {
      createNode(record, currentUser.id);
      notify({ tone: 'success', title: `${kindLabel} oluşturuldu`, detail: `${record.code} · ${record.name}` });
    }
    onSaved?.(record.id);
    onClose();
  };

  const err = (k: string) => (touched ? errors[k] : undefined);
  const kindLabel = nodeKindLabels[draft.kind];

  const setCritical = (i: number, patch: Partial<CriticalPoint>) =>
    setDraft({
      ...draft,
      criticalPoints: draft.criticalPoints.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    });

  const setExample = (i: number, patch: Partial<WorkedExample>) =>
    setDraft({
      ...draft,
      examples: draft.examples.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? `${kindLabel} düzenle · ${existing.code}` : `${parent?.name} altına ${kindLabel.toLocaleLowerCase('tr-TR')} ekle`}
      footer={
        <div className="row between gap-3">
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            {existing
              ? (critical.length
                ? 'Kritik alan değiştiği için kayıt doğrudan güncellenmez; onay zinciri başlatılır.'
                : 'Değişiklikler eski/yeni değer ve gerekçeyle audit trail’e yazılır.')
              : `Yeni ${kindLabel.toLocaleLowerCase('tr-TR')} taslak olarak açılır.`}
          </span>
          <span className="row gap-2">
            <button className="btn btn-sm" onClick={onClose}>Vazgeç</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={touched && hasErrors}>
              {existing
                ? (critical.length ? 'Onaya gönder' : 'Değişiklikleri kaydet')
                : `${kindLabel} oluştur`}
            </button>
          </span>
        </div>
      }
    >
      <ApprovalNotice critical={critical} />

      <FormSection title="Tanım">
        <FormGrid>
          <TextInput
            label="Ad" required value={draft.name} error={err('name')}
            placeholder={draft.kind === 'activity' ? 'Örn. Ödeme Onayı' : 'Örn. Tazminat ve Ödeme'}
            onChange={(name) => setDraft({ ...draft, name })}
          />
          <TextInput
            label="Kod" required mono value={draft.code} error={err('code')}
            hint={existing ? 'Kod değişikliği kayıt kimliğini etkilemez.' : 'Otomatik önerildi; değiştirebilirsiniz.'}
            onChange={(code) => setDraft({ ...draft, code })}
          />
        </FormGrid>
        <TextArea
          label="Açıklama" required value={draft.description} error={err('description')} rows={2}
          placeholder="Bu adımda ne yapılıyor?"
          onChange={(description) => setDraft({ ...draft, description })}
        />
        <TextArea
          label="Amaç" value={draft.purpose ?? ''} rows={2}
          hint="Bu adım hangi güvenceyi sağlıyor? Risk ve kontrol tasarımı buradan beslenir."
          onChange={(purpose) => setDraft({ ...draft, purpose })}
        />
      </FormSection>

      <FormSection title="Sahiplik">
        <FormGrid>
          <UserSelect
            label="Süreç sahibi" value={draft.ownerId} users={users}
            onChange={(ownerId) => setDraft({ ...draft, ownerId })}
          />
          <SelectInput
            label="Sorumlu birim" value={draft.unitId}
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            onChange={(unitId) => setDraft({ ...draft, unitId })}
          />
        </FormGrid>
        <MultiUserSelect
          label="Görevli kişiler" values={draft.participantIds} users={users}
          onChange={(participantIds) => setDraft({ ...draft, participantIds })}
        />
      </FormSection>

      <FormSection title="Girdi, çıktı ve sistemler">
        <FormGrid>
          <ListInput
            label="Kullanılan sistem" values={draft.systems}
            placeholder="Örn. HasarNet"
            onChange={(systems) => setDraft({ ...draft, systems })}
          />
          <ListInput
            label="Girdi" values={draft.inputs}
            placeholder="Örn. Onaylı ödeme talimatı"
            onChange={(inputs) => setDraft({ ...draft, inputs })}
          />
          <ListInput
            label="Çıktı" values={draft.outputs}
            placeholder="Örn. Dekont"
            onChange={(outputs) => setDraft({ ...draft, outputs })}
          />
          <TextInput
            label="Çıktı alıcısı" value={draft.customer ?? ''}
            hint="Bu adımın çıktısını kim kullanıyor?"
            onChange={(customer) => setDraft({ ...draft, customer: customer || undefined })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Sınıflandırma ve olgunluk">
        <FormGrid>
          <SelectInput<ProcessClass>
            label="Süreç sınıfı" value={draft.processClass} options={processClassLabels}
            onChange={(processClass) => setDraft({ ...draft, processClass })}
          />
          <SelectInput<ProcessStatus>
            label="Durum" value={draft.status} options={processStatusLabels}
            hint="Arşivlenen süreçler haritadan ve sayımlardan düşer."
            onChange={(status) => setDraft({ ...draft, status })}
          />
          <TextInput
            label="Versiyon" mono value={draft.version}
            onChange={(version) => setDraft({ ...draft, version })}
          />
          <TextInput
            label="Hedef süre (iş günü)" value={draft.slaDays ? String(draft.slaDays) : ''}
            onChange={(v) => setDraft({ ...draft, slaDays: v ? Number(v) || undefined : undefined })}
          />
        </FormGrid>
        <MaturityInput
          label="Olgunluk seviyesi" value={draft.maturity}
          hint="COSO olgunluk ölçeği: tanımlılık, tekrarlanabilirlik ve izlenebilirlik düzeyi."
          onChange={(maturity) => setDraft({ ...draft, maturity })}
        />
        <ListInput
          label="Standartlar" values={draft.standards}
          placeholder="Örn. ISO 27001"
          onChange={(standards) => setDraft({ ...draft, standards })}
        />
      </FormSection>

      <FormSection title="Gözden geçirme">
        <FormGrid>
          <DateInput
            label="Son gözden geçirme" value={draft.lastReviewedAt}
            onChange={(lastReviewedAt) => setDraft({ ...draft, lastReviewedAt })}
          />
          <SelectInput
            label="Periyot" value={String(draft.reviewFrequencyMonths)}
            options={[
              { value: '3', label: '3 ay' }, { value: '6', label: '6 ay' },
              { value: '12', label: '12 ay' }, { value: '24', label: '24 ay' },
            ]}
            hint="Sonraki tarih bu periyoda göre yeniden hesaplanır."
            onChange={(v) => setDraft({ ...draft, reviewFrequencyMonths: Number(v) })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Kritik noktalar">
        <p className="dim" style={{ fontSize: 'var(--text-xs)' }}>
          Bu adımda dikkat edilmesi gereken noktalar; detay panelinde uyarı olarak gösterilir.
        </p>
        {draft.criticalPoints.map((cp, i) => (
          <RepeaterRow
            key={cp.id}
            title={`Kritik nokta ${i + 1}`}
            onRemove={() => setDraft({ ...draft, criticalPoints: draft.criticalPoints.filter((_, idx) => idx !== i) })}
          >
            <FormGrid>
              <SelectInput<CriticalPoint['kind']>
                label="Tür" value={cp.kind} options={criticalKinds}
                onChange={(kind) => setCritical(i, { kind, label: criticalKinds[kind] })}
              />
              <TextInput
                label="Başlık" value={cp.label}
                onChange={(label) => setCritical(i, { label })}
              />
            </FormGrid>
            <TextArea
              label="Açıklama" value={cp.note} rows={2}
              placeholder="Neye dikkat edilmeli?"
              onChange={(note) => setCritical(i, { note })}
            />
          </RepeaterRow>
        ))}
        <button
          className="btn"
          onClick={() => setDraft({
            ...draft,
            criticalPoints: [
              ...draft.criticalPoints,
              {
                id: `${draft.code}-cp-${draft.criticalPoints.length + 1}-${Date.now().toString(36)}`,
                kind: 'control',
                label: criticalKinds.control,
                note: '',
              },
            ],
          })}
        >
          <IconPlus size={14} /> Kritik nokta ekle
        </button>
      </FormSection>

      <FormSection title="Örnek senaryolar">
        <p className="dim" style={{ fontSize: 'var(--text-xs)' }}>
          Çalışanın riski ve kontrolü somut bir olay üzerinden anlamasını sağlar; eğitim amaçlı kullanılır.
        </p>
        {draft.examples.map((ex, i) => (
          <RepeaterRow
            key={ex.id}
            title={`Örnek ${i + 1}`}
            onRemove={() => setDraft({ ...draft, examples: draft.examples.filter((_, idx) => idx !== i) })}
          >
            <TextInput
              label="Başlık" value={ex.title}
              placeholder="Örn. Yanlış IBAN girilmesi"
              onChange={(title) => setExample(i, { title })}
            />
            <TextArea label="Ne oluyor?" value={ex.scenario} rows={2} onChange={(scenario) => setExample(i, { scenario })} />
            <FormGrid>
              <TextArea label="Risk" value={ex.risk} rows={2} onChange={(risk) => setExample(i, { risk })} />
              <TextArea label="Kontrol" value={ex.control} rows={2} onChange={(control) => setExample(i, { control })} />
              <TextInput label="Kontrol türü" value={ex.controlType} onChange={(controlType) => setExample(i, { controlType })} />
              <TextInput label="Kanıt" value={ex.evidence} onChange={(evidence) => setExample(i, { evidence })} />
            </FormGrid>
            <TextArea
              label="Kritik nokta" value={ex.criticalNote} rows={2}
              onChange={(criticalNote) => setExample(i, { criticalNote })}
            />
          </RepeaterRow>
        ))}
        <button
          className="btn"
          onClick={() => setDraft({
            ...draft,
            examples: [
              ...draft.examples,
              {
                id: `${draft.code}-ex-${draft.examples.length + 1}-${Date.now().toString(36)}`,
                title: '', scenario: '', risk: '', control: '',
                controlType: '', evidence: '', criticalNote: '',
              },
            ],
          })}
        >
          <IconPlus size={14} /> Örnek senaryo ekle
        </button>
      </FormSection>

      <FormSection title="Ekler">
        <AttachmentInput
          value={draft.attachments ?? []}
          hint="Bu adıma ait akış şeması, form örneği ya da talimat dosyasının adresi."
          onChange={(attachments) => setDraft({ ...draft, attachments })}
        />
      </FormSection>

      {existing ? (
        <FormSection title="Değişiklik gerekçesi">
          <TextArea
            label="Neden değiştiriliyor?" required value={reason} error={err('reason')} rows={2}
            placeholder="Örn. 2026 süreç gözden geçirmesinde adım açıklaması güncellendi."
            onChange={setReason}
          />
        </FormSection>
      ) : null}
    </Modal>
  );
}
