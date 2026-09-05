import { useUi } from '@/store/useUi';
import { useData, type ApprovableKind } from '@/store/useData';
import { diffEntity, splitByApproval } from '@/lib/entityMeta';
import type { FieldChange } from '@/types/grc';

/**
 * Formların ortak kaydetme yolu.
 *
 * Kritik alanlar değiştiyse kayıt doğrudan güncellenmez; değişiklik talebi
 * açılır. Form, hangi alanların onaya götüreceğini kaydetmeden önce
 * `previewCritical` ile öğrenip kullanıcıyı uyarır.
 */
export function useApprovalSave(kind: ApprovableKind) {
  const saveWithApproval = useData((s) => s.saveWithApproval);
  const notify = useUi((s) => s.notify);

  const save = (id: string, patch: Record<string, unknown>, reason: string, actorId: string) => {
    const outcome = saveWithApproval({ kind, id, patch, reason, actorId });

    if (outcome.result === 'requested') {
      notify({
        tone: 'warning',
        title: `Değişiklik onaya gönderildi · ${outcome.requestCode}`,
        detail: `${outcome.criticalLabels?.join(', ')} alanları kritik olduğu için kayıt henüz değişmedi. Onay tamamlanınca yeni versiyon yayımlanacak.`,
      });
    } else if (outcome.result === 'saved') {
      notify({ tone: 'success', title: 'Değişiklikler kaydedildi.' });
    } else {
      notify({ tone: 'info', title: 'Değişiklik yok.' });
    }
    return outcome;
  };

  return save;
}

/** Taslaktaki değişikliklerin hangileri onay gerektiriyor? */
export function previewCritical<T extends object>(
  kind: ApprovableKind,
  before: T | undefined,
  draft: T,
  labels: Record<string, string>,
): FieldChange[] {
  if (!before) return [];
  // Taslak kayıtlar onay gerektirmez; mağazadaki kuralla aynı hizada kalır.
  if ('status' in before && (before as { status: string }).status === 'draft') return [];
  const changes = diffEntity(before, draft as Partial<T>, labels);
  return splitByApproval(kind, changes).critical;
}
