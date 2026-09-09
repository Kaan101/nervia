import type { FieldChange } from '@/types/grc';
import { IconWarning } from '@/components/common/Icons';

/**
 * Formda, değiştirilen alanların onay zincirine gireceğini bildiren şerit.
 * Kullanıcı kaydete basmadan önce ne olacağını bilir.
 */
export function ApprovalNotice({ critical }: { critical: FieldChange[] }) {
  if (!critical.length) return null;
  return (
    <div className="callout lvl-medium" style={{ marginBottom: 'var(--s4)' }}>
      <IconWarning size={16} style={{ flex: '0 0 auto', marginTop: 2 }} />
      <span className="stack" style={{ gap: 4 }}>
        <span className="callout-title">Bu değişiklik onay gerektiriyor.</span>
        <span>
          Değiştirdiğiniz alanlardan {critical.length} tanesi kritik:
          {' '}<strong>{critical.map((c) => c.label).join(', ')}</strong>.
          Kayıt hemen güncellenmez; değişiklik talebi açılır ve onay zincirinden geçtikten
          sonra yeni versiyon olarak yayımlanır.
        </span>
      </span>
    </div>
  );
}
