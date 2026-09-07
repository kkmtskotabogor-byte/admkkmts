import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShieldCheck, 
  Filter, 
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PaymentRecord, ExpenseRecord, Madrasah, OrganizationConfig } from '../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS,
  formatAcademicYear,
  formatAcademicYearFull,
  isPaymentInAcademicYear,
  isExpenseInAcademicYear,
  terbilang,
  getMadrasahMonthlyDues 
} from '../utils/formatters';
import { calculateMadrasahDuesAllocation } from '../utils/duesAllocation';
import { exportBKUToCSV } from '../utils/exportUtils';

interface FinancialReportsViewProps {
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  madrasahs: Madrasah[];
  org: OrganizationConfig;
  selectedYear: number;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  payments,
  expenses,
  madrasahs,
  org,
  selectedYear,
}) => {
  const [reportTab, setReportTab] = useState<'bku' | 'arrears' | 'cashflow'>('bku');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Prepare unified BKU Ledger Items
  type BkuRow = {
    date: string;
    code: string;
    category: string;
    description: string;
    debit: number; // Pemasukan
    credit: number; // Pengeluaran
    type: 'income' | 'expense';
  };

  const verifiedPayments = payments.filter(
    p => p.status === 'verified' && isPaymentInAcademicYear(p, selectedYear)
  );

  const yearExpenses = expenses.filter(
    e => isExpenseInAcademicYear(e, selectedYear)
  );

  let bkuRows: BkuRow[] = [
    ...verifiedPayments.map(p => ({
      date: p.paymentDate,
      code: p.receiptNumber,
      category: p.categoryLabel || 'Iuran Bulanan KKMTS',
      description: `Penerimaan Iuran KKMTS - ${p.madrasahName} (${MONTH_NAMES_ID[p.periodMonth - 1]} ${p.periodYear})`,
      debit: p.amount,
      credit: 0,
      type: 'income' as const,
    })),
    ...yearExpenses.map(e => ({
      date: e.date,
      code: e.voucherNumber,
      category: e.category,
      description: `${e.title}${e.feeItemName ? ` [Pos: ${e.feeItemName}]` : ''} (Penerima: ${e.recipient})`,
      debit: 0,
      credit: e.amount,
      type: 'expense' as const,
    }))
  ];

  // Sort chronologically
  bkuRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter by Month if chosen
  if (selectedMonth !== 'all') {
    const m = Number(selectedMonth);
    bkuRows = bkuRows.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() + 1 === m;
    });
  }

  // Calculate Running Balance
  let currentBalance = 0;
  const bkuCalculated = bkuRows.map(row => {
    currentBalance += (row.debit - row.credit);
    return {
      ...row,
      balance: currentBalance,
    };
  });

  const totalDebit = bkuRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = bkuRows.reduce((sum, r) => sum + r.credit, 0);
  const netSurplus = totalDebit - totalCredit;

  // Arrears Data per Madrasah in the selected academic year using sequential allocation
  const arrearsList = madrasahs.map((m, idx) => {
    const dues = calculateMadrasahDuesAllocation(m, payments, org, selectedYear);

    return {
      no: idx + 1,
      madrasah: m,
      studentCount: m.studentCount || 0,
      monthlyDuesRate: dues.monthlyDues,
      paidMonthsCount: dues.verifiedMonthsCount,
      partialMonthsCount: dues.partialMonthsCount,
      unpaidCount: dues.unpaidMonthsCount,
      totalPaid: dues.totalVerifiedPaid,
      unpaidAmount: dues.totalArrears,
      isLunas: dues.isFullyPaid
    };
  });

  const totalArrearsAllMadrasah = arrearsList.reduce((sum, a) => sum + a.unpaidAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportBKUToCSV(payments, expenses, org, selectedYear);
  };

  const selectedMonthObj = selectedMonth !== 'all' 
    ? ACADEMIC_MONTHS.find(m => m.monthIndex === Number(selectedMonth))
    : null;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Laporan Keuangan Transparan & BKU
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Buku Kas Umum (BKU), Laporan Arus Kas, dan Rekapitulasi Tunggakan Iuran {formatAcademicYear(selectedYear)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor Excel BKU
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Laporan Format Resmi
          </button>
        </div>
      </div>

      {/* Tabs & Period Controls (Hidden on Print) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        
        {/* Report Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs w-full sm:w-auto">
          <button
            onClick={() => setReportTab('bku')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              reportTab === 'bku'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buku Kas Umum (BKU)
          </button>
          <button
            onClick={() => setReportTab('arrears')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              reportTab === 'arrears'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekapitulasi Tunggakan
          </button>
        </div>

        {/* Month Selector based on Academic Months */}
        {reportTab === 'bku' && (
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <span className="font-semibold text-slate-600">Filter Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Bulan ({formatAcademicYear(selectedYear)})</option>
              {ACADEMIC_MONTHS.map((m) => {
                const year = m.getYear(selectedYear);
                return (
                  <option key={m.order} value={m.monthIndex}>
                    {m.name} {year}
                  </option>
                );
              })}
            </select>
          </div>
        )}

      </div>

      {/* Printable Report Container */}
      <div ref={printContainerRef} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Formal Header Kop Surat Kemenag / KKMTS */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-3xl shrink-0 print:border print:border-slate-800 overflow-hidden p-0.5">
            {org.logoUrl ? (
              <img 
                src={org.logoUrl} 
                alt="Logo Organisasi" 
                className="w-full h-full object-contain rounded-lg bg-white" 
              />
            ) : (
              <Building2 className="w-9 h-9" />
            )}
          </div>
          <div className="flex-1 text-center pr-12">
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-600">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </p>
            <h1 className="text-base sm:text-lg font-extrabold uppercase text-slate-950 tracking-tight">
              {org.orgName} ({org.shortName})
            </h1>
            <p className="text-xs text-slate-600">
              {org.address}, Kodepos {org.postalCode} | Email: {org.contactEmail} | Telp: {org.contactPhone}
            </p>
          </div>
        </div>

        {/* Report Title & Metadata */}
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 tracking-wide">
            {reportTab === 'bku'
              ? 'BUKU KAS UMUM (BKU) KKMTS'
              : 'LAPORAN REKAPITULASI TUNGGAKAN IURAN MADRASAH'}
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            {formatAcademicYearFull(selectedYear)} {selectedMonthObj ? `• Periode Bulan ${selectedMonthObj.name} ${selectedMonthObj.getYear(selectedYear)}` : '• Periode 1 Tahun Ajaran Penuh'}
          </p>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-slate-500 font-semibold block text-[11px]">Total Penerimaan (Debit)</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700">{formatRupiah(totalDebit)}</span>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-slate-500 font-semibold block text-[11px]">Total Pengeluaran (Kredit)</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-700">{formatRupiah(totalCredit)}</span>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-slate-500 font-semibold block text-[11px]">Saldo Akhir Kas</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-950">{formatRupiah(netSurplus)}</span>
          </div>
        </div>

        {/* Table 1: Buku Kas Umum (BKU) */}
        {reportTab === 'bku' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-8">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">No. Bukti / Kuitansi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 min-w-[220px]">Uraian Transaksi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right whitespace-nowrap">Debit (Masuk)</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right whitespace-nowrap">Kredit (Keluar)</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Saldo (Rp)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800">
                {bkuCalculated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada transaksi pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  bkuCalculated.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-center font-semibold text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap border-r border-slate-200">
                        {formatTanggalIndo(row.date)}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                        {row.code}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-medium">{row.description}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{row.category}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 border-r border-slate-200 whitespace-nowrap">
                        {row.debit > 0 ? formatRupiah(row.debit, false) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700 border-r border-slate-200 whitespace-nowrap">
                        {row.credit > 0 ? formatRupiah(row.credit, false) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-950 whitespace-nowrap">
                        {formatRupiah(row.balance, false)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900 text-xs">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                    Total Jumlah Transaksi
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-900 border-r border-slate-300">
                    {formatRupiah(totalDebit)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-900 border-r border-slate-300">
                    {formatRupiah(totalCredit)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-950">
                    {formatRupiah(netSurplus)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Table 2: Rekapitulasi Tunggakan Madrasah */}
        {reportTab === 'arrears' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-8">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">NSM / NPSN</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 min-w-[160px]">Nama Madrasah</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Jml Siswa</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Tarif / Bln</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Bulan Lunas</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Tunggakan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Terbayar</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Sisa Tunggakan (Rp)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800">
                {arrearsList.map((item) => (
                  <tr key={item.madrasah.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-center font-semibold text-slate-500 border-r border-slate-200">
                      {item.no}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                      {item.madrasah.nsm}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {item.madrasah.name}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                      {item.studentCount}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {formatRupiah(item.monthlyDuesRate)}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-800 border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1">
                        <span>{item.paidMonthsCount} Bln</span>
                        {item.partialMonthsCount > 0 && (
                          <span className="text-[10px] font-extrabold text-amber-950 bg-amber-200 border border-amber-300 px-1 py-0.2 rounded">
                            +{item.partialMonthsCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-rose-700 border-r border-slate-200">
                      {item.unpaidCount} Bln
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800 border-r border-slate-200">
                      {formatRupiah(item.totalPaid)}
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-rose-700 border-r border-slate-200">
                      {item.unpaidAmount > 0 ? formatRupiah(item.unpaidAmount) : 'Rp 0'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.isLunas ? 'LUNAS' : 'ADA TUNGGAKAN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900 text-xs">
                <tr>
                  <td colSpan={7} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                    Total Tunggakan Keseluruhan
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-900 border-r border-slate-300">
                    {formatRupiah(arrearsList.reduce((s, a) => s + a.totalPaid, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-900 border-r border-slate-300">
                    {formatRupiah(totalArrearsAllMadrasah)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Official Signatures Section for Official Document Printing */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">Ketua KKMTS {org.regency}</p>
            <div className="h-16 flex items-end justify-center">
              <p className="font-bold underline text-slate-950">{org.chairmanName}</p>
            </div>
            {org.chairmanNip && (
              <p className="text-[10px] text-slate-500">NIP. {org.chairmanNip}</p>
            )}
          </div>

          <div>
            <p className="text-slate-600">{org.regency}, {formatTanggalIndo(new Date().toISOString())}</p>
            <p className="font-bold text-slate-900 mt-0.5">Bendahara KKMTS {org.regency}</p>
            <div className="h-16 flex items-end justify-center">
              <p className="font-bold underline text-slate-950">{org.treasurerName}</p>
            </div>
            {org.treasurerNip && (
              <p className="text-[10px] text-slate-500">NIP. {org.treasurerNip}</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

