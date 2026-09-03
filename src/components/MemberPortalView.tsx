import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload, 
  Copy, 
  CreditCard, 
  ShieldCheck, 
  School, 
  Lock, 
  ArrowRight, 
  Info,
  Tag,
  HelpCircle,
  AlertCircle,
  Users,
  Calculator
} from 'lucide-react';
import { Madrasah, PaymentRecord, OrganizationConfig, AuthSession, FeeItem } from '../types';
import { 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatAcademicYear, 
  formatRupiah, 
  isPaymentInAcademicYear,
  getMadrasahMonthlyDues,
  getMadrasahDuesFormula
} from '../utils/formatters';
import { getMadrasahAccessCode } from '../utils/authUtils';

interface MemberPortalViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  feeItems?: FeeItem[];
  org: OrganizationConfig;
  session: AuthSession | null;
  selectedYear: number;
  onOpenNewPaymentForMonth: (madrasahId: string, month: number, feeItemId?: string) => void;
  onSelectPaymentForReceipt: (payment: PaymentRecord) => void;
  onOpenLoginModal?: () => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  madrasahs,
  payments,
  feeItems = [],
  org,
  session,
  selectedYear,
  onOpenNewPaymentForMonth,
  onSelectPaymentForReceipt,
  onOpenLoginModal,
}) => {
  const isAnggotaRole = session?.role === 'anggota';

  // If logged in as anggota, lock to their madrasah; otherwise allow dropdown select for Ketua
  const [selectedMadrasahId, setSelectedMadrasahId] = useState<string>(() => {
    if (isAnggotaRole && session?.madrasahId) {
      return session.madrasahId;
    }
    return madrasahs[0]?.id || '';
  });

  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  useEffect(() => {
    if (isAnggotaRole && session?.madrasahId) {
      setSelectedMadrasahId(session.madrasahId);
    }
  }, [isAnggotaRole, session?.madrasahId]);

  const selectedMadrasah = madrasahs.find(m => m.id === selectedMadrasahId) || madrasahs[0];

  const madrasahPayments = payments.filter(
    p => p.madrasahId === selectedMadrasah?.id && isPaymentInAcademicYear(p, selectedYear)
  );

  const verifiedPayments = madrasahPayments.filter(p => p.status === 'verified');
  const pendingPayments = madrasahPayments.filter(p => p.status === 'pending');

  // Bulanan stats
  const verifiedMonthlyPayments = verifiedPayments.filter(
    p => !p.feeItemId || p.duesCategory === 'wajib_bulanan' || p.categoryLabel === 'Iuran Rutin Bulanan KKMTS'
  );
  const paidMonthsCount = verifiedMonthlyPayments.length;
  const unpaidMonthsCount = Math.max(0, 12 - paidMonthsCount);
  const totalPaidMonthlyAmount = verifiedMonthlyPayments.reduce((s, p) => s + p.amount, 0);
  const monthlyDuesRate = selectedMadrasah ? getMadrasahMonthlyDues(selectedMadrasah, org) : (org.duesPerStudent || 3000);
  const totalMonthlyArrears = unpaidMonthsCount * monthlyDuesRate;

  // Other special fee items (exclude wajib_bulanan)
  const otherFeeItems = feeItems.filter(f => f.category !== 'wajib_bulanan' && f.isActive);
  
  // Mandatory other fees arrears
  const mandatoryOtherFees = otherFeeItems.filter(f => f.isMandatory);
  const otherFeesBreakdown = otherFeeItems.map(f => {
    const feePays = verifiedPayments.filter(p => p.feeItemId === f.id || p.duesCategory === f.category);
    const totalPaid = feePays.reduce((s, p) => s + p.amount, 0);
    const isPaid = f.amount > 0 ? totalPaid >= f.amount : totalPaid > 0;
    const remaining = f.isMandatory && f.amount > 0 ? Math.max(0, f.amount - totalPaid) : 0;
    return {
      fee: f,
      totalPaid,
      isPaid,
      remaining,
      payments: feePays
    };
  });

  const totalOtherMandatoryArrears = otherFeesBreakdown
    .filter(b => b.fee.isMandatory)
    .reduce((s, b) => s + b.remaining, 0);

  const grandTotalArrears = totalMonthlyArrears + totalOtherMandatoryArrears;
  const grandTotalPaid = verifiedPayments.reduce((s, p) => s + p.amount, 0);

  const handleCopyAccount = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedBank(accNo);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Portal Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Portal Transparansi Iuran Anggota KKMTS ({formatAcademicYear(selectedYear)})
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {isAnggotaRole 
              ? `Status Iuran: ${selectedMadrasah?.name || 'Madrasah Anggota'}`
              : 'Pantauan Kewajiban & Riwayat Setoran Madrasah'
            }
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Halaman khusus anggota madrasah untuk melihat kewajiban iuran yang harus disetor (iuran wajib bulanan & pos kegiatan wajib), pos sukarela, serta riwayat setoran yang telah lunas.
          </p>
        </div>
      </div>

      {/* Madrasah Selector Bar (Only Ketua can switch freely; Anggota is strictly locked to their own school) */}
      {!isAnggotaRole ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Pilih Madrasah Tsanawiyah yang Ditinjau:
            </label>
            <span className="text-xs text-slate-500">Mode Ketua: Bebas Tinjau Semua Madrasah</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-8">
              <select
                value={selectedMadrasahId}
                onChange={(e) => setSelectedMadrasahId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 text-slate-900 font-extrabold text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                {madrasahs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.status} - Kode: {getMadrasahAccessCode(m)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4 text-xs text-slate-500 text-right">
              <span>Tahun Ajaran Aktif: <strong>{formatAcademicYear(selectedYear)}</strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{selectedMadrasah?.name}</p>
              <p className="text-indigo-700">Kode Akses Anggota: <strong className="font-mono">{getMadrasahAccessCode(selectedMadrasah)}</strong> (NSM: {selectedMadrasah?.nsm})</p>
            </div>
          </div>

          {onOpenLoginModal && (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-3.5 py-1.5 bg-white text-indigo-700 font-bold border border-indigo-300 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Ganti Madrasah / Role Lain
            </button>
          )}
        </div>
      )}

      {/* Madrasah Profile & KPI Summary */}
      {selectedMadrasah && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left: School Identity Card */}
          <div className="md:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {selectedMadrasah.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  NSM: {selectedMadrasah.nsm}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedMadrasah.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMadrasah.address}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Jumlah Siswa:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedMadrasah.studentCount || 0} Siswa
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tarif Iuran Bulanan:</span>
                  <span className="font-black text-emerald-700">
                    {formatRupiah(monthlyDuesRate)}/bln
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kepala Madrasah:</span>
                  <strong className="text-slate-800">{selectedMadrasah.headmasterName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bendahara Iuran:</span>
                  <strong className="text-slate-800">{selectedMadrasah.treasurerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. WA Bendahara:</span>
                  <strong className="text-emerald-700">{selectedMadrasah.phone}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenNewPaymentForMonth(selectedMadrasah.id, 7)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Unggah Bukti Transfer Baru
            </button>
          </div>

          {/* Right: Payment Progress Stats */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Kewajiban yang sudah dibayar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sudah Disetor ({formatAcademicYear(selectedYear)})
              </span>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-emerald-800">
                  {formatRupiah(grandTotalPaid)}
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {paidMonthsCount} dari 12 Bulan Rutin Lunas
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.round((paidMonthsCount / 12) * 100)}%` }}
                />
              </div>
            </div>

            {/* Kewajiban yang harus dibayar (Tagihan) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <Clock className="w-4 h-4 text-rose-600" />
                Sisa Tagihan Wajib
              </span>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-rose-700">
                  {formatRupiah(grandTotalArrears)}
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {grandTotalArrears === 0 ? 'Semua kewajiban telah lunas' : `${unpaidMonthsCount} bln rutin + pos wajib belum lunas`}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Tarif: {formatRupiah(monthlyDuesRate)} / bulan ({selectedMadrasah.studentCount || 0} siswa × Rp {(org.duesPerStudent || 3000).toLocaleString('id-ID')})
              </p>
            </div>

            {/* Rekening Info Card */}
            <div className="sm:col-span-2 bg-emerald-950 text-white rounded-2xl p-4 border border-emerald-900 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Rekening Resmi Kas KKMTS {org.regency}
                </span>
                <span className="text-[10px] text-emerald-400">Klik ikon salin</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {org.bankAccounts.map((b, i) => (
                  <div key={i} className="p-2.5 bg-emerald-900/60 rounded-xl border border-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">{b.bankName}</p>
                      <p className="font-mono text-emerald-300 font-bold text-sm tracking-wider">{b.accountNumber}</p>
                      <p className="text-[10px] text-emerald-400">a.n. {b.accountHolder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(b.accountNumber)}
                      className="p-1.5 bg-emerald-800 hover:bg-emerald-700 rounded-lg text-emerald-200 cursor-pointer"
                      title="Salin No. Rekening"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {copiedBank && (
                <p className="text-center text-[11px] text-emerald-300 font-bold">
                  ✓ Nomor rekening berhasil disalin ke clipboard!
                </p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Section A: 12 Academic Months Status Grid for this Madrasah */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              A. Iuran Wajib Rutin 12 Bulan ({formatAcademicYear(selectedYear)}) - {selectedMadrasah?.name}
            </h3>
            <p className="text-xs text-slate-500">
              Kewajiban bulanan tahun ajaran (Juli {selectedYear} - Juni {selectedYear + 1}). Unduh kwitansi bagi bulan yang telah diverifikasi lunas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {ACADEMIC_MONTHS.map((mObj) => {
            const mNum = mObj.monthIndex;
            const calYear = mObj.getYear(selectedYear);
            const verified = madrasahPayments.find(p => p.periodMonth === mNum && p.periodYear === calYear && p.status === 'verified');
            const pending = madrasahPayments.find(p => p.periodMonth === mNum && p.periodYear === calYear && p.status === 'pending');

            return (
              <div
                key={mObj.order}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                  verified
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                    : pending
                    ? 'bg-amber-50/70 border-amber-300 animate-pulse'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{mObj.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{calYear}</span>
                </div>

                <div>
                  {verified && (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> LUNAS ({formatRupiah(verified.amount)})
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {verified.receiptNumber}
                      </p>
                    </div>
                  )}

                  {pending && (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Menunggu Verifikasi
                      </span>
                      <p className="text-[10px] text-slate-500">Slip sedang ditinjau bendahara</p>
                    </div>
                  )}

                  {!verified && !pending && (
                    <div className="space-y-1">
                      <span className="inline-block text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        Kewajiban Belum Dibayar
                      </span>
                      <p className="text-[10px] text-slate-500">Tagihan: {formatRupiah(monthlyDuesRate)}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  {verified ? (
                    <button
                      type="button"
                      onClick={() => onSelectPaymentForReceipt(verified)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Unduh Kwitansi
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenNewPaymentForMonth(selectedMadrasah.id, mNum)}
                      className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      Bayar / Upload Slip
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Section B: Pos Iuran Kegiatan & Donasi Khusus (Wajib vs Sukarela) */}
      {otherFeesBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-700" />
                B. Pos Iuran Kegiatan & Program Khusus ({formatAcademicYear(selectedYear)})
              </h3>
              <p className="text-xs text-slate-500">
                Daftar iuran kegiatan khusus: <strong>Wajib (Menjadi Tagihan)</strong> atau <strong>Tidak Wajib / Sukarela (Opsional)</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {otherFeesBreakdown.map(({ fee, totalPaid, isPaid, remaining, payments: feePays }) => {
              const latestReceipt = feePays[0];

              return (
                <div
                  key={fee.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    fee.isMandatory
                      ? isPaid
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/40 border-rose-200'
                      : totalPaid > 0
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {fee.isMandatory ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                            Wajib (Tagihan)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-full">
                            Tidak Wajib (Sukarela)
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {fee.code}
                        </span>
                      </div>

                      {fee.dueDate && (
                        <span className="text-[10px] text-slate-500">
                          Tempo: {fee.dueDate}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm">{fee.name}</h4>
                    {fee.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">{fee.description}</p>
                    )}
                  </div>

                  <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kewajiban / Tarif:</span>
                      <strong className="text-slate-900">{fee.amount > 0 ? formatRupiah(fee.amount) : 'Nominal Bebas / Sukarela'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sudah Disetor:</span>
                      <strong className="text-emerald-700">{formatRupiah(totalPaid)}</strong>
                    </div>
                    {fee.isMandatory && remaining > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-100">
                        <span>Sisa Tagihan:</span>
                        <span>{formatRupiah(remaining)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    {latestReceipt && (
                      <button
                        type="button"
                        onClick={() => onSelectPaymentForReceipt(latestReceipt)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Kwitansi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenNewPaymentForMonth(selectedMadrasah.id, 7, fee.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isPaid && fee.isMandatory
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isPaid && fee.isMandatory ? 'Setor Lagi' : 'Setor Iuran Ini'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
