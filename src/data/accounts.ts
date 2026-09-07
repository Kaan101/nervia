import type { Account } from '@/types/rbac';
import { users } from './org';

/**
 * Demo hesapları.
 *
 * Parolaların düz metni hiçbir yerde saklanmaz; her hesap kendi salt'ıyla
 * özetlenmiştir. Gösterim ortamı olduğu için hepsinin parolası aynıdır ve
 * giriş ekranında açıkça yazılıdır — gerçek bir kurulumda ilk girişte
 * değiştirme zorunluluğu (mustChangePassword) kullanılır.
 */
export const DEMO_PASSWORD = 'Nervia2026!';

type Seed = { userId: string; roleIds: string[]; salt: string; hash: string };

const seeds: Seed[] = [
  { userId: 'usr-01', roleIds: ['executive'], salt: '50621855d8b6207385342097c8fafda6', hash: '2827606c01999561e4a6b7fa223e93bcd1b3c868bc776a151d79f4d9df669041' },
  { userId: 'usr-02', roleIds: ['unit_manager', 'process_owner'], salt: '2bdfb145547a06d396ff4e63c7611549', hash: '880aff9a7e8967f36631822917528989e1a70c4cf40e9bd8ba787507956017aa' },
  { userId: 'usr-03', roleIds: ['process_owner'], salt: 'a5be82ff370a0f56abdc0a5590b0c0c4', hash: '251c89342238f1e76f75f34c2aa6c9dcb067d67bd8fa9c1a7d8f4a4e10f695e9' },
  { userId: 'usr-04', roleIds: ['employee'], salt: '6e4705387fd42552728c513a3bb0b319', hash: '8a5eba42b8ce8b7d1d60909ae3e75b093e4bad6093751141add387021f703612' },
  { userId: 'usr-05', roleIds: ['employee', 'process_owner'], salt: '6183c38525b452bdca9d4670a14d8fff', hash: 'be48d8c29f8dc7cc0ae859439de5068bb72d79e304951e15b215dffd1ca91b80' },
  { userId: 'usr-06', roleIds: ['unit_manager', 'process_owner'], salt: 'b7b13fa3cd64f97fed6c6465a8f6312c', hash: '0180ebd9c04f856e731e1d7cc70280c139201249c455ae683c4df557db46bda9' },
  { userId: 'usr-07', roleIds: ['process_owner'], salt: '468596f1e5e70a7ecd17adec97a776b2', hash: '230ca24c2f26d8bf93e914e70d43fb07fe11c000ee31e953c7bd56f800c8d98d' },
  { userId: 'usr-08', roleIds: ['process_owner'], salt: 'ae0323b84aeb03b8664516f37944a667', hash: '483eb60bc0bb9f0e736786e2a38ebcff6caa67f0b6f1d0ff242eb01e8c967c64' },
  { userId: 'usr-09', roleIds: ['unit_manager', 'process_owner'], salt: '607d30a66f58df9996e2c8bdc8de2467', hash: 'ff7ec5a889319c25cd203708679bdd1ecf9af81c091103685fc3c92ef6cd47b7' },
  { userId: 'usr-10', roleIds: ['employee'], salt: '844a3366f23c41afa71955a1aaffa832', hash: 'e5ee7d8e5ac186fe7f8062817ddad3cf44cea9a173626228abe292ea4b6db88c' },
  { userId: 'usr-11', roleIds: ['unit_manager', 'process_owner'], salt: '7d4417a16f7e32ca3bb503c4edadaaba', hash: '6472131346dc272a9dcae3864c219a9241ec0e1ffef8c7cfd380359e4206be6a' },
  { userId: 'usr-12', roleIds: ['process_owner'], salt: '7777d8ccc49684b020004fb4425508ba', hash: 'e9aff9beb95ca177fdd94223825bdd2b712b1d56cbe32f56afac18aa90fd35a9' },
  { userId: 'usr-13', roleIds: ['process_owner'], salt: 'cd49a56b0a9b63769486ce4774cfd774', hash: '73bbe7eb11881037242b7fb754e6c3b2fe6cd43be98d2d9a4aa2cf21b7c85f8a' },
  { userId: 'usr-14', roleIds: ['unit_manager', 'process_owner'], salt: '5110c705a76e95d36dd673cf7fabf47f', hash: '0f31b63c7bf08effcbae5968c3d0f16a7af7b1847810445942ccf1e9323b9718' },
  { userId: 'usr-15', roleIds: ['process_owner'], salt: '50952543a56a90bec31cf309a0f80d73', hash: '063b204bae10b41be8fbd9e9d068e9104bca1873c641a048b7f5f7dbd570efd2' },
  { userId: 'usr-16', roleIds: ['unit_manager', 'process_owner'], salt: 'b32c19810b8932dc160567ce899b6e25', hash: '837a7729b5197cbe5bf021f303357ae1d29b143e2bc424a0a9349255c17a2bc0' },
  { userId: 'usr-17', roleIds: ['employee'], salt: '4bb3cf4ca9195f04ddad77b44edd9d0b', hash: '178c0809e6f71aba2340fe5e0af20330d42cd4f02c024bb52500f50faeb05357' },
  { userId: 'usr-18', roleIds: ['unit_manager', 'process_owner'], salt: '15a8928901cc879b0f01a9a5a85373c2', hash: '0b7889692192c61b0ac408c9ac32fd003ce569b205d8006f51612969470771e0' },
  { userId: 'usr-19', roleIds: ['unit_manager', 'process_owner'], salt: 'bab192c08881b98134e7fb5a5e037b54', hash: '5c377ebf9459c10cd0fcd5fcdb608d64bea82b4f20dd8d8206ca59f9dca426a6' },
  { userId: 'usr-20', roleIds: ['unit_manager', 'risk_management'], salt: 'df56203dc62427ab6d3fb06523776676', hash: 'cc4329724aad6c1c206f2e42ad4c49c1721eaf1c301e7cce224916ab03fb9e93' },
  { userId: 'usr-21', roleIds: ['risk_management'], salt: 'e530ea59b8e61d49143f0323de34e7d8', hash: 'fc583b6d7ab9fae08e762ba63c9b5151306634dab82da13ad20c2d69c1f67c37' },
  { userId: 'usr-22', roleIds: ['unit_manager', 'internal_control'], salt: 'f7f2520f37df70c30de5f25cf9a31391', hash: '2614223495cde2ff97956fb60d3a992c9c001b0abcd3118f1565810eed5af5db' },
  { userId: 'usr-23', roleIds: ['internal_control'], salt: 'a78f28a8018cade2a9cad1e92ce60504', hash: '06686910b35e065c548ee98e34304de0a960fac9a48b5392568a73b7b8f3b466' },
  { userId: 'usr-24', roleIds: ['internal_audit'], salt: '70fe791450915e621f1a60aef3225384', hash: 'bbb1779db8f219154a126d997d3d7fac968aba492fd0f43fb34a16138f779388' },
  { userId: 'usr-25', roleIds: ['system_admin'], salt: 'f7df84d63dfd742972d8f6607c48163a', hash: '655a345802ef2a9819e4c19739c4dff37c1e94e1c5ff420dd7dbeeb620099c7e' },
];

export const accounts: Account[] = seeds.map((s) => {
  const user = users.find((u) => u.id === s.userId);
  return {
    userId: s.userId,
    email: user?.email ?? `${s.userId}@nervia.example`,
    passwordHash: s.hash,
    passwordSalt: s.salt,
    active: true,
    roleIds: s.roleIds,
    overrides: [],
    extraUnitIds: [],
    mustChangePassword: false,
    lastLoginAt: null,
    failedAttempts: 0,
    lockedUntil: null,
  };
});

export const accountByUserId = new Map(accounts.map((a) => [a.userId, a]));

/** Girişte e-posta ile hesap bulmak için. Büyük/küçük harf duyarsız. */
export function accountByEmail(list: Account[], email: string): Account | undefined {
  const needle = email.trim().toLocaleLowerCase('tr-TR');
  return list.find((a) => a.email.toLocaleLowerCase('tr-TR') === needle);
}
