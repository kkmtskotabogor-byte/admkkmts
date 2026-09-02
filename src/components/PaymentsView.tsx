import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Send, 
  Building2, 
  Eye, 
  Trash2,
  Calendar,
  CreditCard,
  Check,
  ExternalLink
} from 'lucide-react';
import { PaymentRecord, Madrasah, OrganizationConfig, PaymentStatus } from '../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatAcademicYear, 
  formatAcademicYearFull,
  isPaymentInAcademicYear, 
  createWALink, 
  generateVerificationSuccessWAMessage 
} from '../utils/formatters';
import { exportPaymentsToCSV } from '../utils/exportUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PaymentsViewProps {
  payments: PaymentRecord[];
  madrasahs: Madrasah[];
  org: OrganizationConfig;
  selectedYear: number;
  onOpenNewPayment: () => void;
  onSelectPaymentForVerification: (payment: PaymentRecord) => void;
  onSelectPaymentForReceipt: (payment: PaymentRecord) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  madrasahs,
  org,
  selectedYear,
  onOpenNewPayment,
  onSelectPaymentForVerification,
  onSelectPaymentForReceipt,
  onDeletePayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all'); // format: "month-year" or "all"
  const [selectedMadrasahId, setSelectedMadrasahId] = useState<string>('all');
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);

  // Filtered Payments within current Academic Year (Juli -> Juni)
  const filteredPayments = payments.filter((p) => {
    // Academic Year filter
    if (!isPaymentInAcademicYear(p, selectedYear)) return false;

    // Status filter
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;

    // Month filter
    if (selectedMonthKey !== 'all') {
      const [mStr, yStr] = selectedMonthKey.split('-');
      if (p.periodMonth !== Number(mStr) || p.periodYear !== Number(yStr)) {
        return false;
      }
    }

    // Madrasah filter
    if (selectedMadrasahId !== 'all' && p.madrasahId !== selectedMadrasahId) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.madrasahName.toLowerCase().includes(q);
      const matchReceipt = p.receiptNumber.toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      const matchMethod = p.paymentMethod.toLowerCase().includes(q);
      if (!matchName && !matchReceipt && !matchNotes && !matchMethod) return false;
    }

    return true;
  });

  const academicPayments = payments.filter(p => isPaymentInAcademicYear(p, selectedYear));
  const pendingCount = academicPayments.filter(p => p.status === 'pending').length;
  const verifiedCount = academicPayments.filter(p => p.status === 'verified').length;
  const rejectedCount = academicPayments.filter(p => p.status === 'rejected').length;

  const totalFilteredAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportCSV = () => {
    exportPaymentsToCSV(filteredPayments, org, selectedYear);
  };

  const handleSendSingleWA = (p: PaymentRecord) => {
    const madrasah = madrasahs.find(m => m.id === p.madrasahId);
    if (!madrasah?.phone) {
      alert('Nomor WhatsApp madrasah ini belum terdaftar di data anggota.');
      return;
    }
    const msg = generateVerificationSuccessWAMessage(p, madrasah, org);
    const url = createWALink(madrasah.phone, msg);
    window.open(url, '_blank');
  };

  const academicLabel = formatAcademicYear(selectedYear); // e.g. TA 2026/2027

  return (
    <div className="space-y-6">
      
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Pencatatan & Verifikasi Iuran KKMTS ({academicLabel})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar setoran iuran periode Juli {selectedYear} s.d. Juni {selectedYear + 1} ({formatAcademicYearFull(selectedYear)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor Excel / CSV
          </button>

          <button
            onClick={onOpenNewPayment}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Pembayaran Baru
          </button>
        </div>
      </div>

      {/* Status Segmented Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Iuran ({academicPayments.length})
        </button>

        <button
          onClick={() => setSelectedStatus('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedStatus === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Menunggu Verifikasi ({pendingCount})
        </button>

        <button
          onClick={() => setSelectedStatus('verified')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedStatus === 'verified'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Terverifikasi / Lunas ({verifiedCount})
        </button>

        <button
          onClick={() => setSelectedStatus('rejected')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedStatus === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Ditolak ({rejectedCount})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama madrasah, nomor kwitansi, atau metode..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Academic Month Selector */}
        <div className="sm:col-span-3">
          <select
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua 12 Bulan (Juli - Juni)</option>
            {ACADEMIC_MONTHS.map((am) => {
              const calYear = am.getYear(selectedYear);
              const val = `${am.monthIndex}-${calYear}`;
              return (
                <option key={val} value={val}>
                  {am.name} {calYear} ({am.order <= 6 ? 'Semester Ganjil' : 'Semester Genap'})
                </option>
              );
            })}
          </select>
        </div>

        {/* Madrasah Selector */}
        <div className="sm:col-span-4">
          <select
            value={selectedMadrasahId}
            onChange={(e) => setSelectedMadrasahId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Madrasah ({madrasahs.length})</option>
            {madrasahs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Kwitansi</th>
                <th className="py-3 px-4">Madrasah</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Metode & Tanggal</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Bukti Transfer</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data pembayaran yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter bulan/status.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const madrasah = madrasahs.find(m => m.id === payment.madrasahId);
                  const isVerified = payment.status === 'verified';
                  const isPending = payment.status === 'pending';
                  const isRejected = payment.status === 'rejected';

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Kwitansi Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {payment.receiptNumber}
                      </td>

                      {/* Madrasah Name */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-950">{payment.madrasahName}</div>
                        <div className="text-[11px] text-slate-500">
                          {payment.categoryLabel || 'Iuran Bulanan'}
                        </div>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {MONTH_NAMES_ID[payment.periodMonth - 1]} {payment.periodYear}
                        </span>
                      </td>

                      {/* Payment Method & Date */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{payment.paymentMethod}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatTanggalIndo(payment.paymentDate)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-950 whitespace-nowrap">
                        {formatRupiah(payment.amount)}
                      </td>

                      {/* Proof Thumbnail */}
                      <td className="py-3.5 px-4 text-center">
                        {payment.proofImageUrl ? (
                          <button
                            onClick={() => onSelectPaymentForVerification(payment)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors border border-slate-200"
                            title="Klik untuk melihat struk bukti transfer"
                          >
                            <img
                              src={payment.proofImageUrl}
                              alt="Slip"
                              className="w-4 h-4 object-cover rounded"
                            />
                            <span>Lihat Slip</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tanpa Slip (Tunai)</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            LUNAS
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            MENUNGGU VERIFIKASI
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200" title={payment.rejectionReason}>
                            <XCircle className="w-3.5 h-3.5" />
                            DITOLAK
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* If pending -> Verify button */}
                          {isPending && (
                            <button
                              onClick={() => onSelectPaymentForVerification(payment)}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                              title="Verifikasi Bukti Transfer Ini"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Verifikasi
                            </button>
                          )}

                          {/* If verified -> Digital Receipt button */}
                          {isVerified && (
                            <button
                              onClick={() => onSelectPaymentForReceipt(payment)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-colors"
                              title="Buka Kwitansi Resmi KKMTS"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Kwitansi
                            </button>
                          )}

                          {/* Quick WhatsApp Send */}
                          {isVerified && (
                            <button
                              onClick={() => handleSendSingleWA(payment)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              title="Kirim Notifikasi Kwitansi via WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPaymentToDelete(payment);
                            }}
                            className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Data Iuran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary in Table */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>Menampilkan <strong>{filteredPayments.length}</strong> dari <strong>{payments.length}</strong> total iuran</span>
          <div className="font-bold text-slate-900">
            Total Iuran Terpilih: <span className="text-emerald-700 text-sm font-extrabold">{formatRupiah(totalFilteredAmount)}</span>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Deleting Payment */}
      {paymentToDelete && (
        <ConfirmDeleteModal
          isOpen={!!paymentToDelete}
          title="Hapus Catatan Iuran?"
          itemName={`${paymentToDelete.receiptNumber} - ${paymentToDelete.madrasahName}`}
          message={`Apakah Anda yakin ingin menghapus data iuran bulan ${MONTH_NAMES_ID[paymentToDelete.periodMonth - 1]} ${paymentToDelete.periodYear} sebesar ${formatRupiah(paymentToDelete.amount)}?`}
          confirmText="Ya, Hapus Iuran"
          cancelText="Batal"
          onConfirm={() => {
            if (paymentToDelete) {
              onDeletePayment(paymentToDelete.id);
              setPaymentToDelete(null);
            }
          }}
          onClose={() => setPaymentToDelete(null)}
        />
      )}

    </div>
  );
};
