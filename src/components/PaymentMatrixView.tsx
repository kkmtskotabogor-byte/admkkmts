import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Download, 
  Printer, 
  Filter, 
  Building2, 
  Plus,
  FileText,
  Users
} from 'lucide-react';
import { Madrasah, PaymentRecord, OrganizationConfig } from '../types';
import { 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatRupiah, 
  formatAcademicYear, 
  formatAcademicYearFull,
  generateDuesReminderWAMessage, 
  createWALink,
  getMadrasahMonthlyDues
} from '../utils/formatters';
import { calculateMadrasahDuesAllocation } from '../utils/duesAllocation';
import { exportMatrixToCSV } from '../utils/exportUtils';

interface PaymentMatrixViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  onOpenNewPaymentForMonth: (madrasahId: string, month: number, feeItemId?: string, year?: number, defaultAmount?: number) => void;
  onSelectPaymentForVerification: (payment: PaymentRecord) => void;
  onSelectPaymentForReceipt: (payment: PaymentRecord) => void;
}

export const PaymentMatrixView: React.FC<PaymentMatrixViewProps> = ({
  madrasahs,
  payments,
  org,
  selectedYear,
  onOpenNewPaymentForMonth,
  onSelectPaymentForVerification,
  onSelectPaymentForReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid_only' | 'fully_paid'>('all');

  // Matrix calculation based on sequential multi-month dues allocation engine
  // Rule:
  // - Setor 1 bulan: otomatis ceklis hijau
  // - Setor melebihi 2 bulan: 2 bulan ceklis hijau, bulan ke-3 warna kuning (belum lunas)
  // - dan seterusnya
  const matrixData = madrasahs.map((m) => {
    return calculateMadrasahDuesAllocation(m, payments, org, selectedYear);
  });

  // Filtered rows
  const filteredRows = matrixData.filter((row) => {
    if (filterStatus === 'unpaid_only' && !row.hasArrears) return false;
    if (filterStatus === 'fully_paid' && !row.isFullyPaid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!row.madrasah.name.toLowerCase().includes(q) && !row.madrasah.subdistrict.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleExportCSV = () => {
    exportMatrixToCSV(madrasahs, payments, selectedYear, org);
  };

  const handleSendReminderWA = (row: typeof matrixData[0]) => {
    if (!row.madrasah.phone) {
      alert('Nomor WhatsApp madrasah belum diisi.');
      return;
    }
    if (row.totalArrears === 0) {
      alert('Madrasah ini sudah lunas untuk semua bulan!');
      return;
    }
    const msg = generateDuesReminderWAMessage(row.madrasah, row.unpaidMonths, org);
    const url = createWALink(row.madrasah.phone, msg);
    window.open(url, '_blank');
  };

  const academicLabel = formatAcademicYear(selectedYear); // e.g. TA 2026/2027

  return (
    <div className="space-y-6">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Matriks Pembayaran Iuran 12 Bulan ({academicLabel})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoring rekapitulasi kepatuhan iuran berbasis jumlah siswa (Rp 3.000/siswa/bulan) untuk periode Juli {selectedYear} s.d. Juni {selectedYear + 1} ({formatAcademicYearFull(selectedYear)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor Matriks Excel
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* Legend & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-semibold text-slate-600">Keterangan:</span>
          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Lunas (Ceklis Hijau)
          </span>
          <span className="inline-flex items-center gap-1 text-amber-950 font-bold bg-amber-200 px-2 py-0.5 rounded border border-amber-400 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-800" /> Belum Lunas (Warna Kuning)
          </span>
          <span className="inline-flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Verifikasi
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            + Belum Bayar
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama MTs..."
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('unpaid_only')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'unpaid_only' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Ada Tunggakan
            </button>
            <button
              onClick={() => setFilterStatus('fully_paid')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'fully_paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Lunas 12 Bln
            </button>
          </div>
        </div>

      </div>

      {/* 12-Month Academic Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 w-48 border-r border-slate-200">
                  Madrasah Tsanawiyah
                </th>
                <th className="py-3 px-2 text-center border-r border-slate-200 w-24">
                  Siswa & Tarif
                </th>
                {ACADEMIC_MONTHS.map((am) => (
                  <th key={am.order} className="py-3 px-2 text-center border-r border-slate-200 min-w-[54px]">
                    <div>{am.shortName}</div>
                    <div className="text-[9px] text-slate-400 font-normal">
                      {am.getYear(selectedYear).toString().slice(2)}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-2 text-center border-r border-slate-200 w-16">
                  Lunas
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 min-w-[90px]">
                  Total Disetor
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 min-w-[90px]">
                  Tunggakan
                </th>
                <th className="py-3 px-3 text-center w-16">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.madrasah.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Madrasah Name Column */}
                  <td className="py-2.5 px-4 font-semibold text-slate-900 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200 shadow-xs">
                    <div className="truncate max-w-[190px]" title={row.madrasah.name}>
                      {row.madrasah.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">
                      {row.madrasah.status} • Kec. {row.madrasah.subdistrict}
                    </div>
                  </td>

                  {/* Student count & monthly dues */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-100">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      <Users className="w-3 h-3 text-emerald-600" />
                      {row.madrasah.studentCount || 0}
                    </span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">
                      {formatRupiah(row.monthlyDues)}
                    </span>
                  </td>

                  {/* 12 Month Cells */}
                  {row.cells.map((cell) => {
                    const isVerified = cell.status === 'verified';
                    const isPartial = cell.status === 'partial';
                    const isPending = cell.status === 'pending';

                    return (
                      <td
                        key={cell.monthNum}
                        className="py-1 px-1 text-center border-r border-slate-100"
                      >
                        {/* 1. Lunas Penuh (Ceklis Hijau) */}
                        {isVerified && (
                          <button
                            type="button"
                            onClick={() => cell.paymentRecord && onSelectPaymentForReceipt(cell.paymentRecord)}
                            title={`Lunas (${cell.fullName} ${cell.calendarYear} - ${formatRupiah(cell.paidAmount || row.monthlyDues)}). Klik untuk melihat kwitansi.`}
                            className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center mx-auto transition-transform hover:scale-110 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* 2. Belum Lunas / Sebagian (Warna Kuning) */}
                        {isPartial && (
                          <button
                            type="button"
                            onClick={() => onOpenNewPaymentForMonth(row.madrasah.id, cell.monthNum, undefined, cell.calendarYear, cell.remainingDeficit)}
                            title={`Belum Lunas (${cell.fullName} ${cell.calendarYear}): Terbayar ${formatRupiah(cell.paidAmount)} / Tagihan ${formatRupiah(row.monthlyDues)} (Kurang ${formatRupiah(cell.remainingDeficit)}). Klik untuk melunasi sisa tagihan.`}
                            className="w-8 h-8 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 font-bold flex flex-col items-center justify-center mx-auto transition-transform hover:scale-110 shadow-xs cursor-pointer group"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-800" />
                            <span className="text-[7.5px] font-black leading-none text-amber-900 mt-0.5">
                              {Math.round((cell.paidAmount / row.monthlyDues) * 100)}%
                            </span>
                          </button>
                        )}

                        {/* 3. Menunggu Verifikasi (Oranye) */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => cell.paymentRecord && onSelectPaymentForVerification(cell.paymentRecord)}
                            title={`Menunggu Verifikasi (${cell.fullName} ${cell.calendarYear} - ${formatRupiah(cell.pendingAmount)}). Klik utk periksa struk.`}
                            className="w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center mx-auto animate-pulse transition-transform hover:scale-110 cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}

                        {/* 4. Belum Bayar (+) */}
                        {!isVerified && !isPartial && !isPending && (
                          <button
                            type="button"
                            onClick={() => onOpenNewPaymentForMonth(row.madrasah.id, cell.monthNum, undefined, cell.calendarYear, row.monthlyDues)}
                            title={`Belum Bayar (${cell.fullName} ${cell.calendarYear} - Tagihan: ${formatRupiah(row.monthlyDues)}). Klik untuk catat iuran.`}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-400 font-medium flex items-center justify-center mx-auto transition-colors border border-transparent hover:border-emerald-300 cursor-pointer"
                          >
                            <span className="text-[10px] font-bold">+</span>
                          </button>
                        )}
                      </td>
                    );
                  })}

                  {/* Lunas Status Count */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-100">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        row.verifiedMonthsCount === 12
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {row.verifiedMonthsCount}/12
                      </span>
                      {row.partialMonthsCount > 0 && (
                        <span className="text-[8px] font-black text-amber-950 bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded-sm leading-none whitespace-nowrap">
                          +{row.partialMonthsCount} bln kuning
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total Paid */}
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-800 border-r border-slate-100 whitespace-nowrap">
                    {formatRupiah(row.totalVerifiedPaid)}
                    {row.totalPendingPaid > 0 && (
                      <div className="text-[9px] text-amber-600 font-semibold">
                        +{formatRupiah(row.totalPendingPaid)} pnd
                      </div>
                    )}
                  </td>

                  {/* Total Arrears */}
                  <td className="py-2.5 px-3 text-right font-bold text-rose-700 border-r border-slate-100 whitespace-nowrap">
                    {row.totalArrears > 0 ? (
                      formatRupiah(row.totalArrears)
                    ) : (
                      <span className="text-emerald-700 font-bold">Lunas 100%</span>
                    )}
                  </td>

                  {/* WhatsApp Reminder Button */}
                  <td className="py-2.5 px-3 text-center">
                    {row.hasArrears ? (
                      <button
                        type="button"
                        onClick={() => handleSendReminderWA(row)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg transition-all border border-emerald-200 inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title={`Kirim Pengingat WA ke ${row.madrasah.treasurerName || 'Bendahara'} (Ada ${row.unpaidOrPartialMonths.length} bulan belum lunas)`}
                      >
                        <Send className="w-3 h-3" />
                        <span>WA</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-bold">✓ Bersih</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>
            * <strong>Aturan Otomatis Matriks:</strong> Setor 1 bulan otomatis ceklis hijau. Setor melebihi 2 bulan: 2 bulan ceklis hijau dan bulan ke-3 warna kuning (belum lunas), dan seterusnya.
          </span>
          <div className="font-semibold text-slate-800">
            Perhitungan Iuran Anggota: <strong>Rp {(org.duesPerStudent || 3000).toLocaleString('id-ID')} / siswa / bulan</strong> ({formatRupiah(org.defaultMonthlyDues || 150000)}/bln dasar)
          </div>
        </div>

      </div>

    </div>
  );
};
