export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type DuesCategory = 'wajib_bulanan' | 'kegiatan_ksm_aksioma' | 'rapat_koordinasi' | 'pengembangan_organisasi' | 'iuran_sukarela';

export type FeeObligationType = 'wajib' | 'tidak_wajib';

export type FeeFrequency = 'bulanan' | 'sekali' | 'per_semester' | 'tahunan' | 'sukarela';

export interface FeeItem {
  id: string;
  name: string; // e.g. "Iuran Wajib Bulanan KKMTS", "Iuran Kegiatan KSM & AKSIOMA 2026/2027"
  code: string; // e.g. "IUR-BLN", "IUR-KSM", "INFAQ-SOSIAL"
  category: DuesCategory | string;
  categoryLabel?: string;
  description?: string;
  amount: number; // in Rupiah (0 or any amount for sukarela)
  isMandatory: boolean; // true = WAJIB (menjadi tagihan/kewajiban), false = TIDAK WAJIB / SUKARELA (opsional)
  frequency: FeeFrequency;
  academicYear: number; // e.g. 2026 for TA 2026/2027
  appliesTo: 'all' | 'negeri_only' | 'swasta_only' | string[]; // 'all' or specific madrasah IDs
  isActive: boolean;
  dueDate?: string; // e.g. "Tgl 10 setiap bulan" or "31 Oktober 2026"
  createdAt: string;
  updatedAt?: string;
}

export type PaymentMethod = 
  | 'Transfer BSI (Bank Syariah Indonesia)'
  | 'Transfer Bank Mandiri'
  | 'Transfer Bank BRI'
  | 'Transfer Bank BCA'
  | 'Transfer Bank BJB'
  | 'QRIS KKMTS'
  | 'Tunai (Bendahara)';

export interface Madrasah {
  id: string;
  nsm: string; // Nomor Statistik Madrasah
  npsn: string;
  name: string;
  status: 'Negeri' | 'Swasta';
  studentCount: number; // Jumlah Siswa (dasar perhitungan iuran Rp 3.000 / siswa)
  headmasterName: string;
  treasurerName: string;
  phone: string; // WhatsApp active
  email?: string;
  address: string;
  subdistrict: string; // Kecamatan
  isActive: boolean;
  avatarUrl?: string;
  customAccessCode?: string; // Custom PIN / Kode Akses Madrasah
}

export interface PaymentNotificationLog {
  id: string;
  sentAt: string;
  targetPhone: string;
  targetName: string;
  type: 'verification_success' | 'reminder_dues' | 'financial_broadcast';
  messagePreview: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // e.g. KWT/KKMTS/2025/08/001
  madrasahId: string;
  madrasahName: string;
  duesCategory: DuesCategory;
  categoryLabel?: string;
  feeItemId?: string;
  isMandatory?: boolean;
  amount: number;
  periodMonth: number; // 1 - 12
  periodYear: number; // e.g. 2025
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  proofImageUrl?: string;
  proofFileName?: string;
  senderBankName?: string;
  senderAccountName?: string;
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  waNotified: boolean;
  waNotificationLogs?: PaymentNotificationLog[];
}

export type ExpenseCategory = 
  | 'Rapat Koordinasi & Konsumsi'
  | 'Transport & Akomodasi Pengurus'
  | 'ATK, Cetak & Penggandaan'
  | 'Kegiatan KSM & AKSIOMA'
  | 'Honorarium Narasumber & Workshop'
  | 'Operasional Sekretariat & Web'
  | 'Sosial, Takziyah & Santunan'
  | 'Lain-lain';

export interface ExpenseRecord {
  id: string;
  voucherNumber: string; // e.g. BKK/KKMTS/2025/08/015
  title: string;
  category: ExpenseCategory;
  feeItemId?: string; // ID Pos Iuran sumber dana yang dikeluarkan
  feeItemName?: string; // Nama Pos Iuran sumber dana
  amount: number;
  date: string; // YYYY-MM-DD
  recipient: string;
  approvedBy: string;
  receiptProofUrl?: string;
  receiptProofFileName?: string;
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isPrimary: boolean;
  qrisUrl?: string;
}

export interface OrganizationConfig {
  orgName: string;
  shortName: string;
  level: string; // Kelompok Kerja Madrasah Tsanawiyah
  regency: string; // Kota / Kabupaten
  province: string;
  address: string;
  postalCode: string;
  contactEmail: string;
  contactPhone: string;
  duesPerStudent: number; // Tarif iuran per siswa: Rp 3.000 / siswa / bulan
  defaultMonthlyDues: number; // Fallback / flat rate default: e.g. Rp 150.000 / bulan
  duesCalculationType?: 'per_student' | 'fixed_flat';
  chairmanName: string; // Nama Ketua KKMTS
  chairmanNip?: string;
  treasurerName: string; // Nama Bendahara KKMTS
  treasurerNip?: string;
  secretaryName: string; // Nama Sekretaris
  bankAccounts: BankAccount[];
  fiscalYear: number;
  waGatewaySenderNumber?: string;
  enableAutoWaReminder?: boolean;
  ketuaAccessCode?: string;
  bendaharaAccessCode?: string;
  logoUrl?: string;
  website?: string;
}

export type AppRole = 'ketua' | 'bendahara' | 'anggota';

export interface AuthSession {
  role: AppRole;
  userName: string;
  userTitle: string;
  madrasahId?: string; // only if role === 'anggota'
  madrasahName?: string;
  accessCode: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'payments'
  | 'fees'
  | 'matrix'
  | 'expenses'
  | 'reports'
  | 'whatsapp'
  | 'madrasah'
  | 'access_codes'
  | 'organization'
  | 'backup'
  | 'portal';

