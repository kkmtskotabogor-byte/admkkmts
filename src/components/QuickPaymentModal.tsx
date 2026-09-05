import React, { useState, useEffect } from 'react';
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
  Users
} from 'lucide-react';
import { Madrasah, PaymentRecord, OrganizationConfig, DuesCategory, PaymentMethod, FeeItem } from '../types';
import { MONTH_NAMES_ID, formatRupiah, generateReceiptNumber, getMadrasahMonthlyDues } from '../utils/formatters';

interface QuickPaymentModalProps {
  isOpen?: boolean;
  madrasahs: Madrasah[];
  org: OrganizationConfig;
  feeItems?: FeeItem[];
  defaultFeeItemId?: string;
  defaultMadrasahId?: string;
  defaultMonth?: number;
  defaultYear?: number;
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
  userRole = 'admin',
  onClose,
  onSubmitPayment,
}) => {
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  const [madrasahId, setMadrasahId] = useState(defaultMadrasahId || madrasahs[0]?.id || '');
  const [periodMonth, setPeriodMonth] = useState(defaultMonth || new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(defaultYear || org.fiscalYear || 2026);
  const [selectedFeeItemId, setSelectedFeeItemId] = useState<string>(defaultFeeItemId || (feeItems[0]?.id || 'fee-bulanan-2026'));
  const [duesCategory, setDuesCategory] = useState<DuesCategory>('wajib_bulanan');
  const [amount, setAmount] = useState<number>(org.defaultMonthlyDues || 150000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer BSI (Bank Syariah Indonesia)');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderBankName, setSenderBankName] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImagePreview, setProofImagePreview] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [autoVerifyByAdmin, setAutoVerifyByAdmin] = useState<boolean>(userRole === 'admin');

  useEffect(() => {
    if (defaultMadrasahId) setMadrasahId(defaultMadrasahId);
    if (defaultMonth) setPeriodMonth(defaultMonth);
    if (defaultYear) setPeriodYear(defaultYear);
    if (defaultFeeItemId) {
      setSelectedFeeItemId(defaultFeeItemId);
      const found = feeItems.find(f => f.id === defaultFeeItemId);
      if (found) {
        setDuesCategory(found.category as DuesCategory);
        if (found.amount > 0) setAmount(found.amount);
      }
    }
  }, [defaultMadrasahId, defaultMonth, defaultYear, defaultFeeItemId, feeItems]);

  const selectedMadrasah = madrasahs.find(m => m.id === madrasahId);
  const activeFeeItem = feeItems.find(f => f.id === selectedFeeItemId);
  const monthlyUnitDues = selectedMadrasah ? getMadrasahMonthlyDues(selectedMadrasah, org) : (org.defaultMonthlyDues || 150000);

  const handleSelectMadrasah = (mId: string) => {
    setMadrasahId(mId);
    const m = madrasahs.find(item => item.id === mId);
    if (m && (!activeFeeItem || activeFeeItem.category === 'wajib_bulanan' || duesCategory === 'wajib_bulanan')) {
      setAmount(getMadrasahMonthlyDues(m, org));
    }
  };

  const handleSelectFeeItem = (id: string) => {
    setSelectedFeeItemId(id);
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
    if (!senderAccountName && selectedMadrasah) setSenderAccountName(selectedMadrasah.treasurerName);
  };

  const handleCopyAccount = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedBank(accNo);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!madrasahId || amount <= 0) return;

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
    handleClose();
  };

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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] relative"
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
                Pencatatan kas masuk & verifikasi bukti transfer
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
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 active:text-slate-950 rounded-xl bg-slate-200/70 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bank Account Info Header Widget */}
        <div className="bg-emerald-950 text-white p-4 border-b border-emerald-900 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Rekening Resmi Kas KKMTS {org.regency}
            </span>
            <span className="text-[10px] text-emerald-400">Salin No. Rekening</span>
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
                  className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-md transition-colors"
                  title="Salin Nomor Rekening"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {copiedBank && (
            <p className="text-center text-[10px] text-emerald-300 mt-1 font-semibold">
              ✓ Nomor rekening {copiedBank} berhasil disalin!
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
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
            <select
              value={madrasahId}
              onChange={(e) => handleSelectMadrasah(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {madrasahs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.studentCount || 0} Siswa - {formatRupiah(getMadrasahMonthlyDues(m, org))}/bln)
                </option>
              ))}
            </select>
          </div>

          {/* Period Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bulan Iuran <span className="text-rose-500">*</span>
              </label>
              <select
                value={periodMonth}
                onChange={(e) => setPeriodMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {MONTH_NAMES_ID.map((name, i) => (
                  <option key={i} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Anggaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={periodYear}
                onChange={(e) => setPeriodYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>
          </div>

          {/* Pos Iuran & Category Picker */}
          {feeItems && feeItems.length > 0 ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Pos Iuran Organisasi <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedFeeItemId}
                onChange={(e) => handleSelectFeeItem(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {feeItems.filter(f => f.isActive).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.isMandatory ? 'Wajib / Tagihan' : 'Sukarela'} - {f.amount > 0 ? formatRupiah(f.amount) : 'Bebas'})
                  </option>
                ))}
              </select>
              {activeFeeItem && (
                <div className="mt-1.5 flex items-center gap-2">
                  {activeFeeItem.isMandatory ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      ✓ Pos Wajib (Tagihan Madrasah)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                      ℹ Pos Sukarela / Partisipatif
                    </span>
                  )}
                  {activeFeeItem.description && (
                    <span className="text-[11px] text-slate-500 truncate">
                      {activeFeeItem.description}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis / Kategori Iuran
              </label>
              <select
                value={duesCategory}
                onChange={(e) => setDuesCategory(e.target.value as DuesCategory)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="wajib_bulanan">Iuran Wajib Bulanan KKMTS</option>
                <option value="kegiatan_ksm_aksioma">Iuran Kegiatan AKSIOMA & KSM</option>
                <option value="rapat_koordinasi">Iuran Rapat Koordinasi / Raker</option>
                <option value="pengembangan_organisasi">Pengembangan Organisasi</option>
                <option value="iuran_sukarela">Iuran Sukarela / Donasi</option>
              </select>
            </div>
          )}

          {/* Nominal Iuran (Rp) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nominal Iuran (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-semibold text-xs">Rp</span>
              <input
                type="number"
                step="any"
                min="0"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="Bebas isi nominal..."
                required
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick Preset Amount Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 mr-1">Pilihan Cepat:</span>
            {[
              { label: '1 Bulan', val: monthlyUnitDues },
              { label: '3 Bulan', val: monthlyUnitDues * 3 },
              { label: '6 Bulan', val: monthlyUnitDues * 6 },
              { label: '1 Tahun (12 Bln)', val: monthlyUnitDues * 12 },
            ].map(({ label, val }) => (
              <button
                key={label}
                type="button"
                onClick={() => setAmount(val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  amount === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {label} ({formatRupiah(val)})
              </button>
            ))}
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Transfer BSI (Bank Syariah Indonesia)">Transfer BSI (Bank Syariah Indonesia)</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank BJB">Transfer Bank BJB</option>
                <option value="QRIS KKMTS">QRIS KKMTS</option>
                <option value="Tunai (Bendahara)">Tunai / Setor Langsung</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Transfer / Pembayaran
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

          {/* Sender Bank / Account Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pemilik Rekening Pengirim
              </label>
              <input
                type="text"
                value={senderAccountName}
                onChange={(e) => setSenderAccountName(e.target.value)}
                placeholder="Contoh: Bendahara MTs Al-Ihsan"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Pengirim (Opsional)
              </label>
              <input
                type="text"
                value={senderBankName}
                onChange={(e) => setSenderBankName(e.target.value)}
                placeholder="Contoh: BSI / BRI / BCA"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Upload Transfer Proof File / Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700">
                Unggah Bukti Transfer / Struk Bank <span className="text-slate-400 font-normal">(Disarankan)</span>
              </label>
              <button
                type="button"
                onClick={handleSampleReceipt}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
              >
                + Pakai Contoh Struk Demo
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-center relative">
              {proofImagePreview ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <img
                    src={proofImagePreview}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {proofFileName || 'bukti_transfer.jpg'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ✓ File gambar siap diverifikasi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProofImagePreview('');
                      setProofFileName('');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    Pilih foto / tangkapan layar struk pembayaran (JPG, PNG, PDF)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Maksimal 5MB. Pastikan nominal dan tanggal terlihat jelas.
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
                  Otomatis menerbitkan nomor kwitansi resmi dan masuk ke saldo BKU KKMTS
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoVerifyByAdmin}
                onChange={(e) => setAutoVerifyByAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {userRole === 'admin' ? 'Simpan Data Pembayaran' : 'Kirim Konfirmasi Setoran'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
