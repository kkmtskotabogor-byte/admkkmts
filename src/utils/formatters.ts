import { PaymentRecord, ExpenseRecord, Madrasah, OrganizationConfig } from '../types';

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const SHORT_MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export interface AcademicMonth {
  order: number; // 1 to 12 in the academic year
  monthIndex: number; // 1 to 12 in the standard calendar year (7 for Juli, 1 for Jan, etc.)
  name: string; // 'Juli', 'Agustus', ..., 'Juni'
  shortName: string; // 'Jul', 'Agu', ..., 'Jun'
  getYear: (academicStartYear: number) => number;
}

/**
 * 12 Academic Months in sequence from Juli to Juni
 */
export const ACADEMIC_MONTHS: AcademicMonth[] = [
  { order: 1, monthIndex: 7, name: 'Juli', shortName: 'Jul', getYear: (y) => y },
  { order: 2, monthIndex: 8, name: 'Agustus', shortName: 'Agu', getYear: (y) => y },
  { order: 3, monthIndex: 9, name: 'September', shortName: 'Sep', getYear: (y) => y },
  { order: 4, monthIndex: 10, name: 'Oktober', shortName: 'Okt', getYear: (y) => y },
  { order: 5, monthIndex: 11, name: 'November', shortName: 'Nov', getYear: (y) => y },
  { order: 6, monthIndex: 12, name: 'Desember', shortName: 'Des', getYear: (y) => y },
  { order: 7, monthIndex: 1, name: 'Januari', shortName: 'Jan', getYear: (y) => y + 1 },
  { order: 8, monthIndex: 2, name: 'Februari', shortName: 'Feb', getYear: (y) => y + 1 },
  { order: 9, monthIndex: 3, name: 'Maret', shortName: 'Mar', getYear: (y) => y + 1 },
  { order: 10, monthIndex: 4, name: 'April', shortName: 'Apr', getYear: (y) => y + 1 },
  { order: 11, monthIndex: 5, name: 'Mei', shortName: 'Mei', getYear: (y) => y + 1 },
  { order: 12, monthIndex: 6, name: 'Juni', shortName: 'Jun', getYear: (y) => y + 1 },
];

/**
 * Available academic start years for selector
 */
export const ACADEMIC_YEAR_OPTIONS = [
  { startYear: 2024, label: 'TA 2024/2025', fullLabel: 'Tahun Ajaran 2024/2025 (Juli 2024 - Juni 2025)' },
  { startYear: 2025, label: 'TA 2025/2026', fullLabel: 'Tahun Ajaran 2025/2026 (Juli 2025 - Juni 2026)' },
  { startYear: 2026, label: 'TA 2026/2027', fullLabel: 'Tahun Ajaran 2026/2027 (Juli 2026 - Juni 2027)' },
  { startYear: 2027, label: 'TA 2027/2028', fullLabel: 'Tahun Ajaran 2027/2028 (Juli 2027 - Juni 2028)' },
];

/**
 * Format academic year label: e.g. 2026 -> "TA 2026/2027"
 */
export function formatAcademicYear(startYear: number): string {
  return `TA ${startYear}/${startYear + 1}`;
}

/**
 * Format academic year full label: e.g. 2026 -> "Tahun Ajaran 2026/2027 (Juli 2026 - Juni 2027)"
 */
export function formatAcademicYearFull(startYear: number): string {
  return `Tahun Ajaran ${startYear}/${startYear + 1} (Juli ${startYear} - Juni ${startYear + 1})`;
}

/**
 * Calculate academic year start year from a given month and year
 * e.g. Juli 2026 -> 2026
 * e.g. Januari 2027 -> 2026
 */
export function getPaymentAcademicYear(periodMonth: number, periodYear: number): number {
  return periodMonth >= 7 ? periodYear : periodYear - 1;
}

/**
 * Check if a payment record belongs to the selected academic year
 */
export function isPaymentInAcademicYear(payment: { periodMonth: number; periodYear: number }, academicStartYear: number): boolean {
  return getPaymentAcademicYear(payment.periodMonth, payment.periodYear) === academicStartYear;
}

/**
 * Check if an expense record belongs to the selected academic year
 */
export function isExpenseInAcademicYear(expense: { expenseDate?: string; date?: string }, academicStartYear: number): boolean {
  const dateStr = expense.date || expense.expenseDate;
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    const expAcademicYear = month >= 7 ? year : year - 1;
    return expAcademicYear === academicStartYear;
  } catch {
    return false;
  }
}

/**
 * Format number to Indonesian Rupiah currency format
 * e.g. 150000 -> "Rp 150.000"
 */
export function formatRupiah(amount: number, withPrefix: boolean = true): string {
  if (isNaN(amount)) return withPrefix ? 'Rp 0' : '0';
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount);
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format ISO or YYYY-MM-DD date to standard Indonesian date
 * e.g. "2025-08-15" -> "15 Agustus 2025"
 */
export function formatTanggalIndo(dateStr: string, includeDayName: boolean = false): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[d.getDay()];
    const date = d.getDate();
    const month = MONTH_NAMES_ID[d.getMonth()];
    const year = d.getFullYear();

    if (includeDayName) {
      return `${dayName}, ${date} ${month} ${year}`;
    }
    return `${date} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Terbilang in Indonesian for official receipts
 * e.g. 150000 -> "Seratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(angka: number): string {
  if (angka === 0) return 'Nol Rupiah';
  const bil = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function konversi(n: number): string {
    if (n < 12) return ' ' + bil[n];
    if (n < 20) return konversi(n - 10) + ' Belas';
    if (n < 100) return konversi(Math.floor(n / 10)) + ' Puluh' + konversi(n % 10);
    if (n < 200) return ' Seratus' + konversi(n - 100);
    if (n < 1000) return konversi(Math.floor(n / 100)) + ' Ratus' + konversi(n % 100);
    if (n < 2000) return ' Seribu' + konversi(n - 1000);
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + ' Ribu' + konversi(n % 1000);
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + ' Juta' + konversi(n % 1000000);
    if (n < 1000000000000) return konversi(Math.floor(n / 1000000000)) + ' Milyar' + konversi(n % 1000000000);
    return '';
  }

  return (konversi(angka).trim() + ' Rupiah').replace(/\s+/g, ' ');
}

/**
 * Format phone number to clean international WhatsApp format (628...)
 */
export function sanitizePhoneForWA(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generate formatted WhatsApp notification for Payment Verification (Kwitansi Lunas)
 */
export function generateVerificationSuccessWAMessage(
  payment: PaymentRecord,
  madrasah: Madrasah | undefined,
  org: OrganizationConfig
): string {
  const period = `${MONTH_NAMES_ID[payment.periodMonth - 1]} ${payment.periodYear}`;
  const madrasahName = madrasah?.name || payment.madrasahName;
  const treasurerName = madrasah?.treasurerName || 'Bpk/Ibu Bendahara';
  
  return `*KWITANSI RESMI PEMBAYARAN IURAN KKMTS*
Assalamu'alaikum Wr. Wb.

Yth. *${treasurerName} / Kepala Madrasah*
*${madrasahName}*

Alhamdulillah, pembayaran iuran anggota KKMTS Anda telah *DIVERIFIKASI & DINYATAKAN LUNAS*.

*Rincian Pembayaran:*
📄 *No. Kwitansi:* ${payment.receiptNumber}
🏫 *Madrasah:* ${madrasahName}
📅 *Periode Iuran:* ${period}
💰 *Nominal:* ${formatRupiah(payment.amount)}
💳 *Metode:* ${payment.paymentMethod}
🗓️ *Tanggal Bayar:* ${formatTanggalIndo(payment.paymentDate)}
✅ *Status:* Terverifikasi & Masuk Buku Kas KKMTS

Kwitansi digital ini sah sebagai bukti pembayaran resmi KKMTS ${org.regency}.

Terima kasih atas partisipasi dan komitmennya dalam memajukan organisasi KKMTS.
Semoga berkah untuk kita semua.

Wassalamu'alaikum Wr. Wb.
_Pengurus KKMTS ${org.regency}_
Bendahara: *${org.treasurerName}*`;
}

/**
 * Generate formatted WhatsApp notification for Dues Reminder (Tagihan Belum Lunas)
 */
export function generateDuesReminderWAMessage(
  madrasah: Madrasah,
  unpaidMonths: Array<{ month: number; year: number }>,
  org: OrganizationConfig
): string {
  const defaultFee = org.defaultMonthlyDues;
  const totalAmount = unpaidMonths.length * defaultFee;
  const monthListStr = unpaidMonths
    .map(item => `• ${MONTH_NAMES_ID[item.month - 1]} ${item.year}`)
    .join('\n');

  const bank = org.bankAccounts.find(b => b.isPrimary) || org.bankAccounts[0];

  return `*PENGINGAT IURAN ANGGOTA KKMTS ${org.regency.toUpperCase()}*
Assalamu'alaikum Wr. Wb.

Yth. *${madrasah.treasurerName || 'Bendahara'} / ${madrasah.headmasterName || 'Kepala Madrasah'}*
*${madrasah.name}*

Semoga Bpk/Ibu senantiasa dalam lindungan Allah SWT dan sukses menjalankan amanah pendidikan madrasah.

Melalui pesan ini, kami dari pengurus KKMTS menyampaikan rekapitulasi iuran rutin organisasi yang *belum tercatat*:

*Daftar Bulan Belum Lunas:*
${monthListStr}

📊 *Total Tagihan:* ${formatRupiah(totalAmount)} (${unpaidMonths.length} Bulan)

*Penyaluran Pembayaran:*
🏦 *Bank:* ${bank.bankName}
🔢 *No. Rekening:* ${bank.accountNumber}
👤 *Atas Nama:* ${bank.accountHolder}

Setelah transfer, mohon konfirmasi dan upload bukti transfer melalui web KKMTS atau kirimkan struk via WhatsApp ini.

Atas perhatian dan kerja sama yang baik, kami haturkan terima kasih. Jazakumullah Khairan Katsiran.

Wassalamu'alaikum Wr. Wb.
_Bendahara KKMTS ${org.regency}_
*${org.treasurerName}*`;
}

/**
 * Generate formatted WhatsApp message for Monthly Financial Transparency Broadcast
 */
export function generateFinancialBroadcastWAMessage(
  month: number,
  year: number,
  totalIncome: number,
  totalExpense: number,
  currentBalance: number,
  totalMadrasahCount: number,
  paidMadrasahCount: number,
  org: OrganizationConfig
): string {
  const monthName = MONTH_NAMES_ID[month - 1];
  const complianceRate = totalMadrasahCount > 0 ? Math.round((paidMadrasahCount / totalMadrasahCount) * 100) : 0;

  return `*📢 LAPORAN TRANSPARANSI KAS KKMTS ${org.regency.toUpperCase()}*
*Periode: ${monthName} ${year}*

Assalamu'alaikum Wr. Wb.
Kepada Yth. Seluruh Kepala & Bendahara MTs Anggota KKMTS ${org.regency},

Berikut kami sampaikan ringkasan laporan keuangan kas organisasi per ${monthName} ${year}:

*📈 REKAPITULASI KAS:*
🟢 *Total Pemasukan Iuran:* ${formatRupiah(totalIncome)}
🔴 *Total Pengeluaran Operasional:* ${formatRupiah(totalExpense)}
💰 *Saldo Kas Saat Ini:* ${formatRupiah(currentBalance)}

*📊 TINGKAT PARTISIPASI IURAN:*
• Madrasah Lunas: *${paidMadrasahCount} dari ${totalMadrasahCount} MTs (${complianceRate}%)*

Laporan rinci Buku Kas Umum (BKU) dan bukti nota pengeluaran dapat diakses secara transparan melalui portal sistem KKMTS.

Terima kasih atas transparansi dan sinergi seluruh madrasah anggota demi kemajuan bersama.

Wassalamu'alaikum Wr. Wb.
_Pengurus KKMTS ${org.regency}_
Ketua: *${org.chairmanName}*
Bendahara: *${org.treasurerName}*`;
}

/**
 * Create a direct click-to-chat WhatsApp link
 */
export function createWALink(phone: string, text: string): string {
  const cleanPhone = sanitizePhoneForWA(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generate automatic Receipt Number: KWT/KKMTS/YYYY/MM/NNN
 */
export function generateReceiptNumber(sequence: number, month: number, year: number): string {
  const seqStr = String(sequence).padStart(3, '0');
  const monthStr = String(month).padStart(2, '0');
  return `KWT/KKMTS/${year}/${monthStr}/${seqStr}`;
}

/**
 * Generate automatic Voucher Number for Expense: BKK/KKMTS/YYYY/MM/NNN
 */
export function generateVoucherNumber(sequence: number, month: number, year: number): string {
  const seqStr = String(sequence).padStart(3, '0');
  const monthStr = String(month).padStart(2, '0');
  return `BKK/KKMTS/${year}/${monthStr}/${seqStr}`;
}
