import type { Unit, User } from '@/types/grc';

/** Demo organizasyonu: orta ölçekli bir sigorta şirketi. Tüm kişiler kurgusaldır. */

export const units: Unit[] = [
  { id: 'U-EXE', code: 'EXE', name: 'Üst Yönetim', parentId: null, managerId: 'usr-01', defenceLine: 0 },
  { id: 'U-HSR', code: 'HSR', name: 'Hasar Yönetimi', parentId: 'U-EXE', managerId: 'usr-02', defenceLine: 1 },
  { id: 'U-FIN', code: 'FIN', name: 'Mali İşler', parentId: 'U-EXE', managerId: 'usr-06', defenceLine: 1 },
  { id: 'U-LEG', code: 'LEG', name: 'Hukuk', parentId: 'U-EXE', managerId: 'usr-09', defenceLine: 1 },
  { id: 'U-BIT', code: 'BIT', name: 'Bilgi Teknolojileri', parentId: 'U-EXE', managerId: 'usr-11', defenceLine: 1 },
  { id: 'U-IKY', code: 'IKY', name: 'İnsan Kaynakları', parentId: 'U-EXE', managerId: 'usr-14', defenceLine: 1 },
  { id: 'U-SAT', code: 'SAT', name: 'Satın Alma', parentId: 'U-EXE', managerId: 'usr-16', defenceLine: 1 },
  { id: 'U-IDR', code: 'IDR', name: 'İdari İşler', parentId: 'U-EXE', managerId: 'usr-18', defenceLine: 1 },
  { id: 'U-RAP', code: 'RAP', name: 'Raporlama', parentId: 'U-FIN', managerId: 'usr-19', defenceLine: 1 },
  { id: 'U-RSK', code: 'RSK', name: 'Risk Yönetimi', parentId: 'U-EXE', managerId: 'usr-20', defenceLine: 2 },
  { id: 'U-ICK', code: 'ICK', name: 'İç Kontrol', parentId: 'U-EXE', managerId: 'usr-22', defenceLine: 2 },
  { id: 'U-DEN', code: 'DEN', name: 'İç Denetim', parentId: 'U-EXE', managerId: 'usr-24', defenceLine: 3 },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}

type Seed = Omit<User, 'initials' | 'email'> & { email?: string };

const seeds: Seed[] = [
  { id: 'usr-01', name: 'Elif Karaca', unitId: 'U-EXE', department: 'Üst Yönetim', title: 'Genel Müdür', roles: ['executive'], managerId: null, authLevel: 4, location: 'İstanbul / Genel Müdürlük' },
  { id: 'usr-02', name: 'Mert Aydın', unitId: 'U-HSR', department: 'Hasar Yönetimi', title: 'Hasar Direktörü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 3 },
  { id: 'usr-03', name: 'Selin Tunç', unitId: 'U-HSR', department: 'Hasar Yönetimi', title: 'Hasar Operasyon Müdürü', roles: ['process_owner'], managerId: 'usr-02', authLevel: 3 },
  { id: 'usr-04', name: 'Barış Öztürk', unitId: 'U-HSR', department: 'Hasar Yönetimi', title: 'Hasar Uzmanı', roles: ['employee'], managerId: 'usr-03', authLevel: 1 },
  { id: 'usr-05', name: 'Deniz Yalçın', unitId: 'U-HSR', department: 'Hasar Yönetimi', title: 'Eksper Koordinatörü', roles: ['employee', 'process_owner'], managerId: 'usr-03', authLevel: 2 },
  { id: 'usr-06', name: 'Ayşe Demirel', unitId: 'U-FIN', department: 'Mali İşler', title: 'Mali İşler Direktörü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 3 },
  { id: 'usr-07', name: 'Kaan Bilgin', unitId: 'U-FIN', department: 'Mali İşler', title: 'Muhasebe Müdürü', roles: ['process_owner'], managerId: 'usr-06', authLevel: 2 },
  { id: 'usr-08', name: 'Zeynep Aksoy', unitId: 'U-FIN', department: 'Mali İşler', title: 'Hazine ve Ödemeler Yöneticisi', roles: ['process_owner'], managerId: 'usr-06', authLevel: 3 },
  { id: 'usr-09', name: 'Cem Erdoğan', unitId: 'U-LEG', department: 'Hukuk', title: 'Hukuk Müşaviri', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 3 },
  { id: 'usr-10', name: 'Nazlı Şahin', unitId: 'U-LEG', department: 'Hukuk', title: 'Uyum ve Mevzuat Uzmanı', roles: ['employee'], managerId: 'usr-09', authLevel: 2 },
  { id: 'usr-11', name: 'Onur Kılıç', unitId: 'U-BIT', department: 'Bilgi Teknolojileri', title: 'BT Direktörü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 3 },
  { id: 'usr-12', name: 'İpek Arslan', unitId: 'U-BIT', department: 'Bilgi Teknolojileri', title: 'Bilgi Güvenliği Yöneticisi', roles: ['process_owner'], managerId: 'usr-11', authLevel: 3 },
  { id: 'usr-13', name: 'Emre Doğan', unitId: 'U-BIT', department: 'Bilgi Teknolojileri', title: 'Uygulama Geliştirme Yöneticisi', roles: ['process_owner'], managerId: 'usr-11', authLevel: 2 },
  { id: 'usr-14', name: 'Gizem Polat', unitId: 'U-IKY', department: 'İnsan Kaynakları', title: 'İK Direktörü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 3 },
  { id: 'usr-15', name: 'Tolga Şen', unitId: 'U-IKY', department: 'İnsan Kaynakları', title: 'İşe Alım ve Bordro Yöneticisi', roles: ['process_owner'], managerId: 'usr-14', authLevel: 2 },
  { id: 'usr-16', name: 'Burcu Yıldız', unitId: 'U-SAT', department: 'Satın Alma', title: 'Satın Alma Müdürü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 3 },
  { id: 'usr-17', name: 'Serkan Uysal', unitId: 'U-SAT', department: 'Satın Alma', title: 'Tedarikçi İlişkileri Uzmanı', roles: ['employee'], managerId: 'usr-16', authLevel: 1 },
  { id: 'usr-18', name: 'Melis Koç', unitId: 'U-IDR', department: 'İdari İşler', title: 'İdari İşler Müdürü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-01', authLevel: 2 },
  { id: 'usr-19', name: 'Arda Çetin', unitId: 'U-RAP', department: 'Raporlama', title: 'Raporlama Müdürü', roles: ['unit_manager', 'process_owner'], managerId: 'usr-06', authLevel: 3 },
  { id: 'usr-20', name: 'Pelin Yavuz', unitId: 'U-RSK', department: 'Risk Yönetimi', title: 'Risk Yönetimi Direktörü', roles: ['unit_manager', 'risk_management'], managerId: 'usr-01', authLevel: 4 },
  { id: 'usr-21', name: 'Hakan Sarı', unitId: 'U-RSK', department: 'Risk Yönetimi', title: 'Kurumsal Risk Uzmanı', roles: ['risk_management'], managerId: 'usr-20', authLevel: 3 },
  { id: 'usr-22', name: 'Sinem Aktaş', unitId: 'U-ICK', department: 'İç Kontrol', title: 'İç Kontrol Direktörü', roles: ['unit_manager', 'internal_control'], managerId: 'usr-01', authLevel: 4 },
  { id: 'usr-23', name: 'Ozan Türker', unitId: 'U-ICK', department: 'İç Kontrol', title: 'İç Kontrol Uzmanı', roles: ['internal_control'], managerId: 'usr-22', authLevel: 3 },
  { id: 'usr-24', name: 'Ceren Balcı', unitId: 'U-DEN', department: 'İç Denetim', title: 'İç Denetim Yöneticisi', roles: ['internal_audit'], managerId: 'usr-01', authLevel: 4 },
  { id: 'usr-25', name: 'Volkan Ateş', unitId: 'U-BIT', department: 'Bilgi Teknolojileri', title: 'Sistem Yöneticisi', roles: ['system_admin'], managerId: 'usr-11', authLevel: 5 },
];

export const users: User[] = seeds.map((s) => ({
  ...s,
  initials: initials(s.name),
  email:
    s.email ??
    `${s.name
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, '.')}@nervia.example`,
}));

export const userById = new Map(users.map((u) => [u.id, u]));
export const unitById = new Map(units.map((u) => [u.id, u]));

export function userName(id: string | null | undefined): string {
  if (!id) return '—';
  return userById.get(id)?.name ?? id;
}

export function unitName(id: string | null | undefined): string {
  if (!id) return '—';
  return unitById.get(id)?.name ?? id;
}
