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
  FileText
} from 'lucide-react';
import { Madrasah, PaymentRecord, OrganizationConfig } from '../types';
import { 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatRupiah, 
  formatAcademicYear, 
  formatAcademicYearFull,
  isPaymentInAcademicYear,
  generateDuesReminderWAMessage, 
  createWALink 
} from '../utils/formatters';
import { exportMatrixToCSV } from '../utils/exportUtils';

interface PaymentMatrixViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  onOpenNewPaymentForMonth: (madrasahId: string, month: number) => void;
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid_only' | 'fully_paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Matrix calculation based on 12 Academic Months (Juli -> Juni)
  const matrixData = madrasahs.map((m) => {
    const monthlyStatuses = ACADEMIC_MONTHS.map((am) => {
      const calendarYear = am.getYear(selectedYear);
      const verified = payments.find(
        p => p.madrasahId === m.id && p.periodMonth === am.monthIndex && p.periodYear === calendarYear && p.status === 'verified'
      );
      const pending = payments.find(
        p => p.madrasahId === m.id && p.periodMonth === am.monthIndex && p.periodYear === calendarYear && p.status === 'pending'
      );

      return {
        monthNum: am.monthIndex,
        shortName: am.shortName,
        fullName: am.name,
        calendarYear,
        status: verified ? 'verified' : pending ? 'pending' : 'unpaid',
        paymentRecord: verified || pending || null,
      };
    });

    const verifiedMonths = monthlyStatuses.filter(s => s.status === 'verified').length;
    const unpaidMonths = monthlyStatuses
      .filter(s => s.status === 'unpaid')
      .map(s => ({ month: s.monthNum, year: s.calendarYear }));

    const totalPaid = payments
      .filter(p => p.madrasahId === m.id && isPaymentInAcademicYear(p, selectedYear) && p.status === 'verified')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalArrears = unpaidMonths.length * org.defaultMonthlyDues;

    return {
      madrasah: m,
      monthlyStatuses,
      verifiedMonths,
      unpaidMonths,
      totalPaid,
      totalArrears,
      isFullyPaid: verifiedMonths === 12,
      hasArrears: unpaidMonths.length > 0,
    };
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
    exportMatrixToCSV(madrasahs, payments, selectedYear);
  };

  const handleSendReminderWA = (row: typeof matrixData[0]) => {
    if (!row.madrasah.phone) {
      alert('Nomor WhatsApp madrasah belum diisi.');
      return;
    }
    if (row.unpaidMonths.length === 0) {
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
            Monitoring rekapitulasi kepatuhan iuran Juli {selectedYear} s.d. Juni {selectedYear + 1} ({formatAcademicYearFull(selectedYear)})
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
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-600">Keterangan:</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas (Verifikasi)
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            • Belum Bayar (Klik utk Bayar)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari madrasah..."
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-hidden"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Status ({madrasahs.length})</option>
            <option value="unpaid_only">Ada Tunggakan</option>
            <option value="fully_paid">Lunas Penuh (12 Bln)</option>
          </select>
        </div>

      </div>

      {/* 12-Month Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center border-r border-slate-800 w-10">No</th>
                <th className="py-3 px-3 min-w-[200px] border-r border-slate-800">Nama Madrasah</th>
                {ACADEMIC_MONTHS.map((am, i) => (
                  <th key={i} className="py-3 px-1.5 text-center border-r border-slate-800 min-w-[46px]" title={`${am.name} ${am.getYear(selectedYear)}`}>
                    <div>{am.shortName}</div>
                    <div className="text-[9px] text-slate-400 font-normal">'{String(am.getYear(selectedYear)).slice(-2)}</div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center border-r border-slate-800 min-w-[70px]">Lunas</th>
                <th className="py-3 px-3 text-right border-r border-slate-800 min-w-[95px]">Total Masuk</th>
                <th className="py-3 px-3 text-right border-r border-slate-800 min-w-[95px]">Tunggakan</th>
                <th className="py-3 px-3 text-center min-w-[80px]">Pengingat</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRows.map((row, idx) => (
                <tr key={row.madrasah.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Number */}
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                    {idx + 1}
                  </td>

                  {/* School Name */}
                  <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                    <div className="truncate max-w-[220px]" title={row.madrasah.name}>
                      {row.madrasah.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {row.madrasah.status} • {row.madrasah.subdistrict}
                    </div>
                  </td>

                  {/* 12 Academic Months Cells (Juli -> Juni) */}
                  {row.monthlyStatuses.map((cell) => {
                    const isVerified = cell.status === 'verified';
                    const isPending = cell.status === 'pending';

                    return (
                      <td
                        key={cell.monthNum}
                        className="py-1 px-1 text-center border-r border-slate-100"
                      >
                        {isVerified && (
                          <button
                            onClick={() => cell.paymentRecord && onSelectPaymentForReceipt(cell.paymentRecord)}
                            title={`Lunas (${cell.fullName} ${cell.calendarYear}). Klik utk kwitansi.`}
                            className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center mx-auto transition-transform hover:scale-110 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {isPending && (
                          <button
                            onClick={() => cell.paymentRecord && onSelectPaymentForVerification(cell.paymentRecord)}
                            title={`Menunggu Verifikasi (${cell.fullName} ${cell.calendarYear}). Klik utk periksa struk.`}
                            className="w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center mx-auto animate-pulse transition-transform hover:scale-110 cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}

                        {!isVerified && !isPending && (
                          <button
                            onClick={() => onOpenNewPaymentForMonth(row.madrasah.id, cell.monthNum)}
                            title={`Belum Bayar (${cell.fullName} ${cell.calendarYear}). Klik untuk catat iuran.`}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-400 font-medium flex items-center justify-center mx-auto transition-colors border border-transparent hover:border-emerald-300 cursor-pointer"
                          >
                            <span className="text-[10px] font-bold">+</span>
                          </button>
                        )}
                      </td>
                    );
                  })}

                  {/* Verified Count */}
                  <td className="py-2.5 px-3 text-center font-bold border-r border-slate-100">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      row.verifiedMonths === 12
                        ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.verifiedMonths}/12
                    </span>
                  </td>

                  {/* Total Paid */}
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-800 border-r border-slate-100 whitespace-nowrap">
                    {formatRupiah(row.totalPaid)}
                  </td>

                  {/* Total Arrears */}
                  <td className="py-2.5 px-3 text-right font-bold text-rose-700 border-r border-slate-100 whitespace-nowrap">
                    {row.totalArrears > 0 ? formatRupiah(row.totalArrears) : <span className="text-emerald-700 font-bold">Lunas</span>}
                  </td>

                  {/* WhatsApp Reminder Button */}
                  <td className="py-2.5 px-3 text-center">
                    {row.unpaidMonths.length > 0 ? (
                      <button
                        onClick={() => handleSendReminderWA(row)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg transition-all border border-emerald-200 inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title={`Kirim Pengingat WA ke ${row.madrasah.treasurerName || 'Bendahara'} (${row.unpaidMonths.length} bulan belum lunas)`}
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
          <span>* Format Tahun Ajaran: Juli {selectedYear} s.d. Juni {selectedYear + 1}. Klik tombol + untuk mencatat setoran iuran.</span>
          <div className="font-semibold text-slate-800">
            Tarif Iuran Wajib: <strong>{formatRupiah(org.defaultMonthlyDues)} / bulan / madrasah</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
