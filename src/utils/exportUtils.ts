import { PaymentRecord, ExpenseRecord, Madrasah, OrganizationConfig } from '../types';
import { 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatRupiah, 
  formatTanggalIndo, 
  formatAcademicYear, 
  isPaymentInAcademicYear, 
  isExpenseInAcademicYear 
} from './formatters';

/**
 * Trigger CSV download in the browser with UTF-8 BOM so Excel opens it without character corruption
 */
function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Payments List to CSV/Excel
 */
export function exportPaymentsToCSV(payments: PaymentRecord[], org: OrganizationConfig, academicYear?: number) {
  const filtered = academicYear 
    ? payments.filter(p => isPaymentInAcademicYear(p, academicYear))
    : payments;

  const headers = [
    'No Kwitansi',
    'Nama Madrasah',
    'Kategori Iuran',
    'Bulan',
    'Tahun Kalender',
    'Nominal (Rp)',
    'Tanggal Bayar',
    'Metode Pembayaran',
    'Pengirim / Bank',
    'Status',
    'Diverifikasi Oleh',
    'Tanggal Verifikasi',
    'Catatan'
  ];

  const rows = filtered.map(p => [
    `"${p.receiptNumber}"`,
    `"${p.madrasahName}"`,
    `"${p.categoryLabel || p.duesCategory}"`,
    `"${MONTH_NAMES_ID[p.periodMonth - 1]}"`,
    p.periodYear,
    p.amount,
    `"${p.paymentDate}"`,
    `"${p.paymentMethod}"`,
    `"${p.senderAccountName ? `${p.senderAccountName} (${p.senderBankName || '-'})` : '-'}"`,
    `"${p.status === 'verified' ? 'LUNAS / VERIFIED' : p.status === 'pending' ? 'MENUNGGU VERIFIKASI' : 'DITOLAK'}"`,
    `"${p.verifiedBy || '-'}"`,
    `"${p.verifiedAt ? formatTanggalIndo(p.verifiedAt) : '-'}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`
  ]);

  const yearSuffix = academicYear ? `_TA_${academicYear}_${academicYear + 1}` : '';
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `Laporan_Iuran_KKMTS${yearSuffix}_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export General Ledger / Buku Kas Umum (BKU) to CSV/Excel
 */
export function exportBKUToCSV(
  payments: PaymentRecord[],
  expenses: ExpenseRecord[],
  org: OrganizationConfig,
  academicYear?: number
) {
  // Combine all verified payments (Debit) and expenses (Kredit)
  type LedgerItem = {
    date: string;
    code: string;
    description: string;
    category: string;
    debit: number;
    credit: number;
  };

  const filteredPayments = academicYear 
    ? payments.filter(p => isPaymentInAcademicYear(p, academicYear) && p.status === 'verified')
    : payments.filter(p => p.status === 'verified');

  const filteredExpenses = academicYear 
    ? expenses.filter(e => isExpenseInAcademicYear(e, academicYear))
    : expenses;

  const items: LedgerItem[] = [
    ...filteredPayments.map(p => ({
      date: p.paymentDate,
      code: p.receiptNumber,
      description: `Penerimaan Iuran KKMTS: ${p.madrasahName} (Bulan ${MONTH_NAMES_ID[p.periodMonth - 1]} ${p.periodYear})`,
      category: 'Pemasukan Iuran',
      debit: p.amount,
      credit: 0
    })),
    ...filteredExpenses.map(e => ({
      date: e.date,
      code: e.voucherNumber,
      description: `${e.title}${e.feeItemName ? ` [Pos: ${e.feeItemName}]` : ''} - Penerima: ${e.recipient}`,
      category: e.category,
      debit: 0,
      credit: e.amount
    }))
  ];

  // Sort by date ascending
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const headers = ['Tanggal', 'No Bukti/Kwitansi', 'Kategori', 'Uraian Transaksi', 'Pemasukan / Debit (Rp)', 'Pengeluaran / Kredit (Rp)', 'Saldo Kas (Rp)'];
  
  const rows = items.map(item => {
    runningBalance += (item.debit - item.credit);
    return [
      `"${item.date}"`,
      `"${item.code}"`,
      `"${item.category}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      item.debit,
      item.credit,
      runningBalance
    ];
  });

  const yearSuffix = academicYear ? `_TA_${academicYear}_${academicYear + 1}` : '';
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `Buku_Kas_Umum_BKU_KKMTS${yearSuffix}_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export 12-Month Academic Matrix to CSV (Juli - Juni)
 */
export function exportMatrixToCSV(
  madrasahs: Madrasah[],
  payments: PaymentRecord[],
  academicYear: number
) {
  const monthHeaders = ACADEMIC_MONTHS.map(m => `${m.shortName} ${m.getYear(academicYear)}`);

  const headers = [
    'No',
    'NSM',
    'Nama Madrasah',
    'Status',
    ...monthHeaders,
    'Total Bulan Lunas',
    'Total Terbayar (Rp)',
    'Sisa Tunggakan (Rp)'
  ];

  const rows = madrasahs.map((m, idx) => {
    const monthlyStatus = ACADEMIC_MONTHS.map((am) => {
      const calendarYear = am.getYear(academicYear);
      const verified = payments.find(p => p.madrasahId === m.id && p.periodMonth === am.monthIndex && p.periodYear === calendarYear && p.status === 'verified');
      const pending = payments.find(p => p.madrasahId === m.id && p.periodMonth === am.monthIndex && p.periodYear === calendarYear && p.status === 'pending');
      
      if (verified) return 'LUNAS';
      if (pending) return 'PENDING';
      return 'BELUM';
    });

    const verifiedCount = monthlyStatus.filter(s => s === 'LUNAS').length;
    const totalPaid = payments
      .filter(p => p.madrasahId === m.id && isPaymentInAcademicYear(p, academicYear) && p.status === 'verified')
      .reduce((sum, p) => sum + p.amount, 0);
    const unpaidCount = 12 - verifiedCount;
    const remainingDues = unpaidCount * 150000;

    return [
      idx + 1,
      `"${m.nsm}"`,
      `"${m.name}"`,
      `"${m.status}"`,
      ...monthlyStatus.map(s => `"${s}"`),
      verifiedCount,
      totalPaid,
      remainingDues
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `Matriks_Iuran_KKMTS_TA_${academicYear}_${academicYear + 1}.csv`);
}
