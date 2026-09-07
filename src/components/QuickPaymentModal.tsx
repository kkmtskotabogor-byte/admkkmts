import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Upload, 
  CreditCard, 
  Building2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  QrCode, 
  Copy,
  Info,
  DollarSign,
  Users,
  Search,
  AlertCircle,
  CalendarCheck,
  RotateCcw
} from 'lucide-react';
import { Madrasah, PaymentRecord, OrganizationConfig, DuesCategory, PaymentMethod, FeeItem } from '../types';
import { 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatAcademicYear, 
  formatRupiah, 
  generateReceiptNumber, 
  getMadrasahMonthlyDues,
  terbilang,
  getPaymentAcademicYear
} from '../utils/formatters';

interface QuickPaymentModalProps {
  isOpen?: boolean;
  madrasahs: Madrasah[];
  org: OrganizationConfig;
  feeItems?: FeeItem[];
  defaultFeeItemId?: string;
  defaultMadrasahId?: string;
  defaultMonth?: number;
  defaultYear?: number;
  defaultAmount?: number;
  selectedYear?: number;
  userRole?: 'admin' | 'public_madrasah';
  onClose?: () => void;
  onSubmitPayment: (newPayment: PaymentRecord) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen = true,
  madrasahs,
  org,
  feeItems = [],
  defaultFeeItemId,
  defaultMadrasahId,
  defaultMonth,
  defaultYear,
  defaultAmount,
  selectedYear,
  userRole = 'admin',
  onClose,
  onSubmitPayment,
}) => {
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Base Academic Year: fallback sequence: selectedYear -> defaultYear -> org.fiscalYear -> 2026
  const initialAcademicYear = selectedYear || (defaultYear && defaultMonth && defaultMonth < 7 ? defaultYear - 1 : defaultYear) || org.fiscalYear || 2026;
  const [academicYear, setAcademicYear] = useState<number>(initialAcademicYear);

  // Search Madrasah query for easier filtering among 51 MTs
  const [madrasahSearch, setMadrasahSearch] = useState('');

  // Selected Madrasah ID
  const [madrasahId, setMadrasahId] = useState(() => {
    if (defaultMadrasahId) return defaultMadrasahId;
    return madrasahs[0]?.id || '';
  });

  // Calculate default month & year
  const initialMonth = defaultMonth || new Date().getMonth() + 1;
  const initialCalendarYear = defaultYear || (initialMonth >= 7 ? initialAcademicYear : initialAcademicYear + 1);

  const [periodMonth, setPeriodMonth] = useState<number>(initialMonth);
  const [periodYear, setPeriodYear] = useState<number>(initialCalendarYear);
  const [isManualPeriod, setIsManualPeriod] = useState<boolean>(false);

  // Fee Items & Category
  const [selectedFeeItemId, setSelectedFeeItemId] = useState<string>(
    defaultFeeItemId || (feeItems[0]?.id || 'fee-bulanan-2026')
  );
  const [duesCategory, setDuesCategory] = useState<DuesCategory>('wajib_bulanan');

  // Amount State
  const [amount, setAmount] = useState<number>(() => {
    const initialMadrasah = madrasahs.find(m => m.id === (defaultMadrasahId || madrasahs[0]?.id));
    if (initialMadrasah) {
      return getMadrasahMonthlyDues(initialMadrasah, org);
    }
    return org.defaultMonthlyDues || 150000;
  });

  // Transaction details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer BSI (Bank Syariah Indonesia)');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderBankName, setSenderBankName] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImagePreview, setProofImagePreview] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [autoVerifyByAdmin, setAutoVerifyByAdmin] = useState<boolean>(userRole === 'admin');

  // Form error & loading
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync props updates
  useEffect(() => {
    if (defaultAmount !== undefined && defaultAmount > 0) {
      setAmount(defaultAmount);
    }
    if (defaultMadrasahId) {
      setMadrasahId(defaultMadrasahId);
      const m = madrasahs.find(item => item.id === defaultMadrasahId);
      if (m && (!defaultFeeItemId || duesCategory === 'wajib_bulanan') && (defaultAmount === undefined)) {
        setAmount(getMadrasahMonthlyDues(m, org));
      }
    }
    if (selectedYear) {
      setAcademicYear(selectedYear);
    }
    if (defaultMonth) {
      setPeriodMonth(defaultMonth);
      if (defaultYear) {
        setPeriodYear(defaultYear);
      } else {
        const calY = defaultMonth >= 7 ? (selectedYear || academicYear) : (selectedYear || academicYear) + 1;
        setPeriodYear(calY);
      }
    } else if (defaultYear) {
      setPeriodYear(defaultYear);
    }
    if (defaultFeeItemId) {
      setSelectedFeeItemId(defaultFeeItemId);
      const found = feeItems.find(f => f.id === defaultFeeItemId);
      if (found) {
        setDuesCategory(found.category as DuesCategory);
        if (found.amount > 0 && defaultAmount === undefined) setAmount(found.amount);
      }
    }
  }, [defaultMadrasahId, defaultMonth, defaultYear, defaultAmount, selectedYear, defaultFeeItemId, feeItems]);

  const selectedMadrasah = madrasahs.find(m => m.id === madrasahId);
  const activeFeeItem = feeItems.find(f => f.id === selectedFeeItemId);
  const monthlyUnitDues = selectedMadrasah ? getMadrasahMonthlyDues(selectedMadrasah, org) : (org.defaultMonthlyDues || 150000);

  // Filtered Madrasahs for Search
  const filteredMadrasahs = useMemo(() => {
    if (!madrasahSearch.trim()) return madrasahs;
    const q = madrasahSearch.toLowerCase().trim();
    return madrasahs.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.npsn.toLowerCase().includes(q) ||
      m.subdistrict.toLowerCase().includes(q) ||
      (m.treasurerName && m.treasurerName.toLowerCase().includes(q))
    );
  }, [madrasahs, madrasahSearch]);

  const handleSelectMadrasah = (mId: string) => {
    setMadrasahId(mId);
    setFormError(null);
    const m = madrasahs.find(item => item.id === mId);
    if (m && (!activeFeeItem || activeFeeItem.category === 'wajib_bulanan' || duesCategory === 'wajib_bulanan')) {
      setAmount(getMadrasahMonthlyDues(m, org));
    }
  };

  const handleSelectFeeItem = (id: string) => {
    setSelectedFeeItemId(id);
    setFormError(null);
    const found = feeItems.find(f => f.id === id);
    if (found) {
      setDuesCategory(found.category as DuesCategory);
      if (found.category === 'wajib_bulanan') {
        if (selectedMadrasah) {
          setAmount(getMadrasahMonthlyDues(selectedMadrasah, org));
        } else {
          setAmount(found.amount || 150000);
        }
      } else if (found.amount > 0) {
        setAmount(found.amount);
      }
    }
  };

  // Synchronized Academic Month Change
  const handleAcademicMonthSelect = (mNum: number) => {
    setPeriodMonth(mNum);
    // In Academic Year: July-Dec = academicYear, Jan-June = academicYear + 1
    const calYear = mNum >= 7 ? academicYear : academicYear + 1;
    setPeriodYear(calYear);
    setFormError(null);
  };

  // Safe Amount formatting & input change
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/[^0-9]/g, '');
    const numericVal = rawDigits === '' ? 0 : parseInt(rawDigits, 10);
    setAmount(numericVal);
    if (formError) setFormError(null);
  };

  const handleSetPresetMultiplier = (multiplier: number) => {
    if (monthlyUnitDues > 0) {
      setAmount(monthlyUnitDues * multiplier);
      if (formError) setFormError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleReceipt = () => {
    setProofImagePreview('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800');
    setProofFileName('struk_transfer_bsi_kkmts.jpg');
    if (!senderBankName) setSenderBankName('BSI');
    if (!senderAccountName && selectedMadrasah) setSenderAccountName(selectedMadrasah.treasurerName || 'Bendahara');
  };

  const handleCopyAccount = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedBank(accNo);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks with helpful error messages
    if (!madrasahId) {
      setFormError('Silakan pilih Madrasah Tsanawiyah yang melakukan pembayaran.');
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      setFormError('Nominal pembayaran wajib diisi dengan angka lebih dari Rp 0.');
      return;
    }
    if (!paymentDate) {
      setFormError('Tanggal transaksi pembayaran wajib dipilih.');
      return;
    }

    setIsSubmitting(true);

    const receiptSeq = Math.floor(100 + Math.random() * 900);
    const receiptNumber = generateReceiptNumber(receiptSeq, periodMonth, periodYear);

    const isVerified = userRole === 'admin' && autoVerifyByAdmin;

    const categoryLabel = activeFeeItem?.name || (
      duesCategory === 'wajib_bulanan' 
        ? 'Iuran Rutin Bulanan KKMTS'
        : duesCategory === 'kegiatan_ksm_aksioma'
        ? 'Iuran Kegiatan KSM & AKSIOMA'
        : duesCategory === 'rapat_koordinasi'
        ? 'Iuran Rapat Koordinasi'
        : 'Iuran Organisasi KKMTS'
    );

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      madrasahId,
      madrasahName: selectedMadrasah?.name || 'MTs Anggota KKMTS',
      feeItemId: activeFeeItem ? activeFeeItem.id : undefined,
      duesCategory: (activeFeeItem?.category as DuesCategory) || duesCategory,
      categoryLabel,
      amount,
      periodMonth,
      periodYear,
      paymentDate,
      paymentMethod,
      senderBankName: senderBankName || undefined,
      senderAccountName: senderAccountName || undefined,
      proofImageUrl: proofImagePreview || undefined,
      proofFileName: proofFileName || undefined,
      notes: notes || undefined,
      status: isVerified ? 'verified' : 'pending',
      createdAt: new Date().toISOString(),
      verifiedAt: isVerified ? new Date().toISOString() : undefined,
      verifiedBy: isVerified ? org.treasurerName : undefined,
      waNotified: false,
    };

    onSubmitPayment(newPayment);
    setIsSubmitting(false);
    handleClose();
  };

  const calculatedAcademicYear = getPaymentAcademicYear(periodMonth, periodYear);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold shrink-0">
              <CreditCard className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {userRole === 'admin' ? 'Catat Pembayaran Iuran KKMTS' : 'Form Konfirmasi Setor Iuran'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {userRole === 'admin' 
                  ? 'Pencatatan kas masuk & penerbitan kwitansi resmi' 
                  : 'Konfirmasi setoran iuran madrasah anggota ke kas organisasi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Tutup Form"
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 active:text-slate-950 rounded-xl bg-slate-200/70 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bank Account Info Header Widget */}
        <div className="bg-emerald-950 text-white p-3.5 sm:p-4 border-b border-emerald-900 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Rekening Resmi Kas KKMTS {org.regency}
            </span>
            <span className="text-[10px] text-emerald-400">Klik ikon salin</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {org.bankAccounts.map((b, i) => (
              <div key={i} className="p-2 bg-emerald-900/70 rounded-lg border border-emerald-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-100">{b.bankName}</p>
                  <p className="font-mono text-emerald-300 tracking-wider font-semibold">{b.accountNumber}</p>
                  <p className="text-[10px] text-emerald-400">a.n. {b.accountHolder}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(b.accountNumber)}
                  className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-md transition-colors cursor-pointer"
                  title="Salin Nomor Rekening"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {copiedBank && (
            <p className="text-center text-[10px] text-emerald-300 mt-1 font-semibold">
              ✓ Nomor rekening {copiedBank} berhasil disalin ke clipboard!
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Error Message Box */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Input Belum Lengkap:</strong>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Madrasah Choice */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Pilih Madrasah Tsanawiyah <span className="text-rose-500">*</span>
              </label>
              {selectedMadrasah && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-600" />
                  {selectedMadrasah.studentCount || 0} Siswa ({formatRupiah(monthlyUnitDues)}/bln)
                </span>
              )}
            </div>

            {userRole === 'admin' ? (
              <div className="space-y-1.5">
                {/* Search box for 51 madrasahs */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={madrasahSearch}
                    onChange={(e) => setMadrasahSearch(e.target.value)}
                    placeholder="Ketik untuk mencari dari 51 MTs (nama, NPSN, kecamatan)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  {madrasahSearch && (
                    <button
                      type="button"
                      onClick={() => setMadrasahSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={madrasahId}
                  onChange={(e) => handleSelectMadrasah(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {filteredMadrasahs.length === 0 ? (
                    <option value="" disabled>Tidak ada MTs yang cocok dengan pencarian "{madrasahSearch}"</option>
                  ) : (
                    filteredMadrasahs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} • {m.subdistrict} ({m.studentCount || 0} Siswa - {formatRupiah(getMadrasahMonthlyDues(m, org))}/bln)
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{selectedMadrasah?.name || 'MTs Anggota'}</p>
                  <p className="text-[11px] text-slate-500">NPSN: {selectedMadrasah?.npsn} • Kec. {selectedMadrasah?.subdistrict}</p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Akun Anda
                </span>
              </div>
            )}
          </div>

          {/* Pos Iuran & Category Picker */}
          {feeItems && feeItems.length > 0 ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pos / Jenis Iuran <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedFeeItemId}
                onChange={(e) => handleSelectFeeItem(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {feeItems.filter(f => f.isActive).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.category === 'wajib_bulanan' 
                      ? `(Tarif Siswa: ${formatRupiah(monthlyUnitDues)}/bln)` 
                      : f.amount > 0 ? `(${formatRupiah(f.amount)})` : '(Bebas / Sukarela)'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Iuran <span className="text-rose-500">*</span>
              </label>
              <select
                value={duesCategory}
                onChange={(e) => setDuesCategory(e.target.value as DuesCategory)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="wajib_bulanan">Iuran Rutin Bulanan KKMTS ({formatRupiah(monthlyUnitDues)}/bln)</option>
                <option value="kegiatan_ksm_aksioma">Iuran Kegiatan KSM & AKSIOMA</option>
                <option value="rapat_koordinasi">Iuran Rapat Koordinasi</option>
                <option value="lainnya">Iuran Lainnya / Insidental</option>
              </select>
            </div>
          )}

          {/* Period Selection: Synchronized Academic Month Selector */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                Periode Iuran ({formatAcademicYear(academicYear)})
              </label>
              <button
                type="button"
                onClick={() => setIsManualPeriod(!isManualPeriod)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
              >
                {isManualPeriod ? 'Gunakan Pilihan TA' : 'Mode Manual (Bulan & Tahun)'}
              </button>
            </div>

            {!isManualPeriod ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Tahun Ajaran Aktif
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => {
                        const newY = Number(e.target.value);
                        setAcademicYear(newY);
                        // Update periodYear accordingly
                        const calY = periodMonth >= 7 ? newY : newY + 1;
                        setPeriodYear(calY);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={2024}>Tahun Ajaran 2024/2025</option>
                      <option value={2025}>Tahun Ajaran 2025/2026</option>
                      <option value={2026}>Tahun Ajaran 2026/2027 (Aktif)</option>
                      <option value={2027}>Tahun Ajaran 2027/2028</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Pilih Bulan dalam Tahun Ajaran <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={periodMonth}
                      onChange={(e) => handleAcademicMonthSelect(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    >
                      <optgroup label={`Semester Ganjil (${academicYear})`}>
                        <option value={7}>Juli {academicYear} (Bulan 1)</option>
                        <option value={8}>Agustus {academicYear} (Bulan 2)</option>
                        <option value={9}>September {academicYear} (Bulan 3)</option>
                        <option value={10}>Oktober {academicYear} (Bulan 4)</option>
                        <option value={11}>November {academicYear} (Bulan 5)</option>
                        <option value={12}>Desember {academicYear} (Bulan 6)</option>
                      </optgroup>
                      <optgroup label={`Semester Genap (${academicYear + 1})`}>
                        <option value={1}>Januari {academicYear + 1} (Bulan 7)</option>
                        <option value={2}>Februari {academicYear + 1} (Bulan 8)</option>
                        <option value={3}>Maret {academicYear + 1} (Bulan 9)</option>
                        <option value={4}>April {academicYear + 1} (Bulan 10)</option>
                        <option value={5}>Mei {academicYear + 1} (Bulan 11)</option>
                        <option value={6}>Juni {academicYear + 1} (Bulan 12)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Feedback badge to assure the user */}
                <div className="p-2 bg-emerald-50/90 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                  <span className="font-medium">
                    Tercatat: <strong>{MONTH_NAMES_ID[periodMonth - 1]} {periodYear}</strong>
                  </span>
                  <span className="font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">
                    {formatAcademicYear(calculatedAcademicYear)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Bulan Kalender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {MONTH_NAMES_ID.map((name, i) => (
                      <option key={i} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    Tahun Kalender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Nominal Iuran (Rp) with Smart Input & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Nominal Iuran (Rp) <span className="text-rose-500">*</span>
              </label>
              {amount > 0 && (
                <span className="text-[11px] text-slate-500 italic">
                  {terbilang(amount)}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-bold text-xs">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                onChange={handleAmountInputChange}
                placeholder="0"
                required
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Quick Multiplier Presets for Monthly Dues */}
            {monthlyUnitDues > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Pilihan Cepat:</span>
                <button
                  type="button"
                  onClick={() => handleSetPresetMultiplier(1)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  1 Bln ({formatRupiah(monthlyUnitDues)})
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetMultiplier(2)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  2 Bln ({formatRupiah(monthlyUnitDues * 2)})
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetMultiplier(3)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  3 Bln ({formatRupiah(monthlyUnitDues * 3)})
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetMultiplier(6)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  6 Bln ({formatRupiah(monthlyUnitDues * 6)})
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetMultiplier(12)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  1 Tahun ({formatRupiah(monthlyUnitDues * 12)})
                </button>
              </div>
            )}

            {/* Otomatisasi Matriks Indikator: Ceklis vs Kuning */}
            {duesCategory === 'wajib_bulanan' && amount > 0 && monthlyUnitDues > 0 && (
              <div className="mt-2 p-2.5 rounded-xl border bg-emerald-50/40 border-emerald-200/80 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Otomatisasi Matriks 12 Bulan:
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Tarif {formatRupiah(monthlyUnitDues)} / bulan
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {Math.floor(amount / monthlyUnitDues) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      {Math.floor(amount / monthlyUnitDues)} Bulan Ceklis Lunas (Hijau)
                    </span>
                  )}

                  {amount % monthlyUnitDues > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-200 text-amber-950 font-extrabold text-[11px] border border-amber-400">
                      <AlertCircle className="w-3 h-3 text-amber-800" />
                      Bulan ke-{Math.floor(amount / monthlyUnitDues) + 1} Belum Lunas (Kuning: Terbayar {formatRupiah(amount % monthlyUnitDues)} / Kurang {formatRupiah(monthlyUnitDues - (amount % monthlyUnitDues))})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metode Pembayaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Transfer BSI (Bank Syariah Indonesia)">Transfer BSI (Bank Syariah Indonesia)</option>
                <option value="Transfer Bank Lain">Transfer Bank Lain</option>
                <option value="Tunai ke Bendahara">Tunai Langsung ke Bendahara</option>
                <option value="QRIS KKMTS">QRIS KKMTS</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Sender Bank & Account Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Bank Pengirim (Opsional)
              </label>
              <input
                type="text"
                value={senderBankName}
                onChange={(e) => setSenderBankName(e.target.value)}
                placeholder="Contoh: BSI / Mandiri / BRI / BCA"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Rekening Pengirim (Opsional)
              </label>
              <input
                type="text"
                value={senderAccountName}
                onChange={(e) => setSenderAccountName(e.target.value)}
                placeholder="Contoh: Bendahara MTs..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Proof of Transfer Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Bukti Transfer / Slip Setor (Opsional)
              </label>
              <button
                type="button"
                onClick={handleSampleReceipt}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                + Gunakan Contoh Struk Demo
              </button>
            </div>

            <div className="mt-1 flex justify-center px-4 pt-3 pb-3 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              {proofImagePreview ? (
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={proofImagePreview}
                    alt="Pratinjau Bukti"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{proofFileName || 'bukti_transfer.jpg'}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">✓ Bukti siap dilampirkan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProofImagePreview('');
                      setProofFileName('');
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                    title="Hapus Bukti"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center text-center space-y-1 py-1">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">
                    Klik untuk unggah foto slip atau tangkapan layar m-banking
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, JPEG, atau PDF (maks. 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Iuran semester ganjil / titipan transfer bendahara"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Admin Auto-Verify Toggle */}
          {userRole === 'admin' && (
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 block">
                  Langsung Verifikasi (Status LUNAS)
                </span>
                <span className="text-[11px] text-slate-500">
                  Otomatis menerbitkan nomor kwitansi resmi dan masuk ke saldo buku kas KKMTS
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoVerifyByAdmin}
                onChange={(e) => setAutoVerifyByAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* Public Madrasah Notice */}
          {userRole === 'public_madrasah' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Konfirmasi Dikirim ke Bendahara</p>
                <p className="text-[11px] text-emerald-700">
                  Setelah disimpan, bendahara KKMTS akan memeriksa bukti setoran dan memvalidasi pelunasan untuk menerbitkan kwitansi resmi Anda.
                </p>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting 
                ? 'Menyimpan...' 
                : userRole === 'admin' 
                ? 'Simpan Data Pembayaran' 
                : 'Kirim Konfirmasi Setoran'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
