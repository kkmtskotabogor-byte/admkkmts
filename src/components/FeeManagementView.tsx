import React, { useState } from 'react';
import { 
  Plus, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  DollarSign, 
  Calendar, 
  Building2, 
  Edit3, 
  Trash2, 
  Power, 
  Info, 
  ShieldCheck, 
  Send, 
  Layers, 
  FileText, 
  Clock, 
  HelpCircle,
  TrendingUp,
  X,
  Copy,
  Receipt,
  Check
} from 'lucide-react';
import { 
  FeeItem, 
  Madrasah, 
  PaymentRecord, 
  OrganizationConfig, 
  FeeFrequency, 
  DuesCategory 
} from '../types';
import { 
  formatRupiah, 
  formatAcademicYear, 
  formatAcademicYearFull,
  isPaymentInAcademicYear,
  createWALink 
} from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface FeeManagementViewProps {
  feeItems: FeeItem[];
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  onUpdateFeeItems: (items: FeeItem[]) => void;
  onUpdateOrgConfig: (cfg: OrganizationConfig) => void;
  onOpenNewPaymentForMadrasah?: (madrasahId: string, feeItemId?: string) => void;
}

export const FeeManagementView: React.FC<FeeManagementViewProps> = ({
  feeItems,
  madrasahs,
  payments,
  org,
  selectedYear,
  onUpdateFeeItems,
  onUpdateOrgConfig,
  onOpenNewPaymentForMadrasah,
}) => {
  // States for Monthly Dues quick config
  const [monthlyDuesInput, setMonthlyDuesInput] = useState<number>(org.defaultMonthlyDues);
  const [isSavedMonthlySuccess, setIsSavedMonthlySuccess] = useState(false);

  // States for Filter & Search
  const [filterType, setFilterType] = useState<'all' | 'wajib' | 'tidak_wajib' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // States for Modal Add / Edit FeeItem
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FeeItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<DuesCategory>('wajib_bulanan');
  const [formCategoryLabel, setFormCategoryLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(150000);
  const [formIsMandatory, setFormIsMandatory] = useState<boolean>(true); // true = Wajib (Tagihan)
  const [formFrequency, setFormFrequency] = useState<FeeFrequency>('tahunan');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAppliesTo, setFormAppliesTo] = useState<'all' | 'negeri_only' | 'swasta_only'>('all');

  // Academic payments for this year
  const currentYearPayments = payments.filter(p => isPaymentInAcademicYear(p, selectedYear) && p.status === 'verified');

  // Filtered Fee Items
  const filteredFeeItems = feeItems.filter(item => {
    if (filterType === 'wajib' && !item.isMandatory) return false;
    if (filterType === 'tidak_wajib' && item.isMandatory) return false;
    if (filterType === 'active' && !item.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc) return false;
    }
    return true;
  });

  // Calculate stats
  const activeItems = feeItems.filter(f => f.isActive);
  const mandatoryItems = activeItems.filter(f => f.isMandatory);
  const optionalItems = activeItems.filter(f => !f.isMandatory);

  // Quick Monthly Dues Handler
  const handleSaveMonthlyDues = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedOrg = {
      ...org,
      defaultMonthlyDues: monthlyDuesInput
    };
    onUpdateOrgConfig(updatedOrg);

    // Also sync the "Iuran Wajib Bulanan KKMTS" feeItem if it exists
    const monthlyFeeIndex = feeItems.findIndex(f => f.category === 'wajib_bulanan' || f.code === 'IUR-BLN');
    if (monthlyFeeIndex !== -1) {
      const updatedList = [...feeItems];
      updatedList[monthlyFeeIndex] = {
        ...updatedList[monthlyFeeIndex],
        amount: monthlyDuesInput,
        updatedAt: new Date().toISOString()
      };
      onUpdateFeeItems(updatedList);
    }

    setIsSavedMonthlySuccess(true);
    setTimeout(() => setIsSavedMonthlySuccess(false), 3000);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode(`IUR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('kegiatan_ksm_aksioma');
    setFormCategoryLabel('Kegiatan Khusus KKMTS');
    setFormDescription('');
    setFormAmount(250000);
    setFormIsMandatory(true); // Default to Wajib
    setFormFrequency('sekali');
    setFormDueDate('');
    setFormAppliesTo('all');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: FeeItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.code);
    setFormCategory(item.category as DuesCategory);
    setFormCategoryLabel(item.categoryLabel || '');
    setFormDescription(item.description || '');
    setFormAmount(item.amount);
    setFormIsMandatory(item.isMandatory);
    setFormFrequency(item.frequency);
    setFormDueDate(item.dueDate || '');
    setFormAppliesTo(item.appliesTo === 'negeri_only' ? 'negeri_only' : item.appliesTo === 'swasta_only' ? 'swasta_only' : 'all');
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive
  const handleToggleActive = (item: FeeItem) => {
    const updated = feeItems.map(f => f.id === item.id ? { ...f, isActive: !f.isActive } : f);
    onUpdateFeeItems(updated);
  };

  // Submit Add / Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama pos iuran wajib diisi.');
      return;
    }

    if (editingItem) {
      // Edit existing
      const updated = feeItems.map(f => {
        if (f.id === editingItem.id) {
          return {
            ...f,
            name: formName.trim(),
            code: formCode.trim() || f.code,
            category: formCategory,
            categoryLabel: formCategoryLabel.trim() || undefined,
            description: formDescription.trim(),
            amount: Number(formAmount) || 0,
            isMandatory: formIsMandatory,
            frequency: formFrequency,
            dueDate: formDueDate.trim() || undefined,
            appliesTo: formAppliesTo,
            updatedAt: new Date().toISOString()
          };
        }
        return f;
      });
      onUpdateFeeItems(updated);
    } else {
      // Create new
      const newItem: FeeItem = {
        id: `fee-custom-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim() || `IUR-${Date.now()}`,
        category: formCategory,
        categoryLabel: formCategoryLabel.trim() || undefined,
        description: formDescription.trim(),
        amount: Number(formAmount) || 0,
        isMandatory: formIsMandatory,
        frequency: formFrequency,
        academicYear: selectedYear,
        appliesTo: formAppliesTo,
        isActive: true,
        dueDate: formDueDate.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onUpdateFeeItems([...feeItems, newItem]);
    }

    setIsModalOpen(false);
  };

  // Delete Item
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const updated = feeItems.filter(f => f.id !== itemToDelete.id);
    onUpdateFeeItems(updated);
    setItemToDelete(null);
  };

  // Simulation of Arrears & Obligations per Madrasah
  const madrasahObligations = madrasahs.map((m) => {
    // 1. Bulanan Wajib (12 bulan * org.defaultMonthlyDues)
    const monthlyTotalObligation = 12 * org.defaultMonthlyDues;
    const verifiedMonthlyPayments = currentYearPayments.filter(
      p => p.madrasahId === m.id && (p.duesCategory === 'wajib_bulanan' || p.categoryLabel === 'Iuran Rutin Bulanan')
    );
    const verifiedMonthlyPaid = verifiedMonthlyPayments.reduce((s, p) => s + p.amount, 0);
    const monthlyArrears = Math.max(0, monthlyTotalObligation - verifiedMonthlyPaid);

    // 2. Pos Iuran Wajib Tambahan yang aktif
    const activeMandatorySpecialFees = activeItems.filter(f => f.isMandatory && f.category !== 'wajib_bulanan');
    const specialFeesBreakdown = activeMandatorySpecialFees.map((fee) => {
      // Check if applies to this madrasah
      if (fee.appliesTo === 'negeri_only' && m.status !== 'Negeri') return null;
      if (fee.appliesTo === 'swasta_only' && m.status !== 'Swasta') return null;

      // Paid records for this fee item
      const feePayments = currentYearPayments.filter(
        p => p.madrasahId === m.id && (p.feeItemId === fee.id || p.duesCategory === fee.category)
      );
      const feePaid = feePayments.reduce((s, p) => s + p.amount, 0);
      const isPaid = feePaid >= fee.amount;
      const feeRemaining = Math.max(0, fee.amount - feePaid);

      return {
        fee,
        obligation: fee.amount,
        paid: feePaid,
        remaining: feeRemaining,
        isPaid,
      };
    }).filter(Boolean);

    const specialObligationTotal = specialFeesBreakdown.reduce((s, item) => s + (item?.obligation || 0), 0);
    const specialPaidTotal = specialFeesBreakdown.reduce((s, item) => s + (item?.paid || 0), 0);
    const specialArrearsTotal = specialFeesBreakdown.reduce((s, item) => s + (item?.remaining || 0), 0);

    // Total Overall Tagihan Wajib
    const totalObligation = monthlyTotalObligation + specialObligationTotal;
    const totalPaid = verifiedMonthlyPaid + specialPaidTotal;
    const totalArrears = monthlyArrears + specialArrearsTotal;

    return {
      madrasah: m,
      monthlyTotalObligation,
      verifiedMonthlyPaid,
      monthlyArrears,
      specialFeesBreakdown,
      specialObligationTotal,
      specialPaidTotal,
      specialArrearsTotal,
      totalObligation,
      totalPaid,
      totalArrears,
      isAllCleared: totalArrears === 0,
    };
  });

  const grandTotalObligation = madrasahObligations.reduce((s, o) => s + o.totalObligation, 0);
  const grandTotalPaid = madrasahObligations.reduce((s, o) => s + o.totalPaid, 0);
  const grandTotalArrears = madrasahObligations.reduce((s, o) => s + o.totalArrears, 0);

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Kelola Tarif & Pos Iuran KKMTS ({formatAcademicYear(selectedYear)})
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pengaturan Besaran Iuran & Tagihan Organisasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Atur nominal kewajiban iuran bulanan rutin, serta tambahkan pos iuran baru (<strong>Wajib</strong> sebagai tagihan madrasah atau <strong>Tidak Wajib / Sukarela</strong> tanpa membebani tunggakan).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Pos Iuran Baru
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Quick Configuration for Monthly Dues (Iuran Wajib Bulanan) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                1. Besaran Iuran Wajib Bulanan Rutin
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tarif iuran wajib per bulan yang ditagihkan kepada setiap madrasah anggota (12 bulan tahun ajaran).
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full self-start sm:self-auto">
            Kewajiban Pokok 12 Bulan
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Form Input */}
          <form onSubmit={handleSaveMonthlyDues} className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nominal Iuran Bulanan per Madrasah (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={monthlyDuesInput === 0 ? '' : monthlyDuesInput}
                  onChange={(e) => setMonthlyDuesInput(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Contoh: 150000"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-300 font-black text-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Bebas diubah kapan saja. Nominal ini otomatis menjadi acuan tagihan di matriks 12 bulan dan kwitansi.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Simpan Tarif Bulanan
              </button>
              {isSavedMonthlySuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Tarif bulanan berhasil disimpan & disinkronkan!
                </span>
              )}
            </div>
          </form>

          {/* Quick Stats Summary */}
          <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Proyeksi Kas Iuran Bulanan ({formatAcademicYear(selectedYear)})
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Total Madrasah</span>
                <span className="text-base font-black text-slate-800">{madrasahs.length} MTs</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Per MTs / Tahun</span>
                <span className="text-base font-black text-emerald-700">{formatRupiah(org.defaultMonthlyDues * 12)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block">Target Total 1 Thn</span>
                <span className="text-base font-black text-slate-900">{formatRupiah(org.defaultMonthlyDues * 12 * madrasahs.length)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Custom Fee Items (Wajib vs Tidak Wajib) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                <Tag className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2. Daftar Pos Iuran & Program Khusus
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan pos iuran baru untuk kegiatan, raker, infaq, atau donasi sosial. Tentukan sifatnya: <strong>Wajib (Tagihan)</strong> atau <strong>Tidak Wajib (Sukarela)</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Buat Pos Iuran Baru
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({feeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('wajib')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === 'wajib'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              Wajib / Tagihan ({feeItems.filter(f => f.isMandatory).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('tidak_wajib')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === 'tidak_wajib'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              Tidak Wajib / Sukarela ({feeItems.filter(f => !f.isMandatory).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterType === 'active'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hanya Aktif ({feeItems.filter(f => f.isActive).length})
            </button>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Cari nama pos iuran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* List of Fee Items Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeeItems.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Tag className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Tidak ada pos iuran yang sesuai kriteria filter.</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                + Tambah Pos Iuran Baru Sekarang
              </button>
            </div>
          ) : (
            filteredFeeItems.map((item) => {
              // Calculate collected money for this fee item
              const paidRecords = currentYearPayments.filter(
                p => p.feeItemId === item.id || (item.category === 'wajib_bulanan' && p.duesCategory === 'wajib_bulanan')
              );
              const totalCollected = paidRecords.reduce((s, p) => s + p.amount, 0);
              const paidSchoolCount = new Set(paidRecords.map(p => p.madrasahId)).size;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                    item.isActive 
                      ? item.isMandatory 
                        ? 'bg-white border-emerald-200/90 shadow-xs ring-1 ring-emerald-500/10' 
                        : 'bg-white border-blue-200/90 shadow-xs ring-1 ring-blue-500/10'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  {/* Top Header Card */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Wajib vs Sukarela Badge */}
                        {item.isMandatory ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            WAJIB (TAGIHAN)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-blue-700" />
                            TIDAK WAJIB (SUKARELA)
                          </span>
                        )}

                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.code}
                        </span>
                      </div>

                      {/* Status Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Nonaktifkan Pos Iuran' : 'Aktifkan Pos Iuran'}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          item.isActive 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nominal & Frequency */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nominal / Tarif:</span>
                      <span className="font-black text-sm text-slate-900">
                        {item.amount > 0 ? formatRupiah(item.amount) : 'Nominal Bebas'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Frekuensi:</span>
                      <span className="font-bold capitalize bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {item.frequency === 'bulanan' ? 'Bulanan (12x)' : item.frequency === 'sekali' ? 'Sekali Bayar' : item.frequency === 'tahunan' ? 'Per Tahun Ajaran' : 'Sukarela'}
                      </span>
                    </div>

                    {item.dueDate && (
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Jatuh Tempo:</span>
                        <span className="font-medium text-slate-700">{item.dueDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Realization Stats */}
                  <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Terkumpul:</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(totalCollected)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Madrasah Bayar:</span>
                      <span className="font-bold text-slate-800">{paidSchoolCount} / {madrasahs.length} MTs</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {item.category !== 'wajib_bulanan' && (
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Pos Iuran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 3: Rekapitulasi Tagihan per Madrasah (Simulation & Arrears) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-700" />
              3. Matriks Rekapitulasi Tagihan Madrasah ({formatAcademicYear(selectedYear)})
            </h3>
            <p className="text-xs text-slate-500">
              Perhitungan total kewajiban tagihan resmi per madrasah (Iuran Bulanan Wajib + Seluruh Pos Iuran Wajib yang aktif).
            </p>
          </div>

          <div className="text-right self-start sm:self-auto">
            <span className="text-[11px] text-slate-500 block">Total Estimasi Tagihan Organisasi:</span>
            <span className="text-sm font-black text-emerald-800">{formatRupiah(grandTotalObligation)}</span>
          </div>
        </div>

        {/* Arrears Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Madrasah</th>
                <th className="py-3 px-3 text-right">Iuran Bulanan (12 bln)</th>
                <th className="py-3 px-3 text-right">Pos Iuran Wajib Lain</th>
                <th className="py-3 px-3 text-right">Total Kewajiban</th>
                <th className="py-3 px-3 text-right">Sudah Disetor</th>
                <th className="py-3 px-3 text-right">Sisa Tunggakan</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {madrasahObligations.map((row) => (
                <tr key={row.madrasah.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>
                      <span>{row.madrasah.name}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">NSM: {row.madrasah.nsm} • {row.madrasah.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">
                    <div>
                      <span>{formatRupiah(row.monthlyTotalObligation)}</span>
                      <span className="block text-[10px] text-emerald-600">Disetor: {formatRupiah(row.verifiedMonthlyPaid)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">
                    <div>
                      <span>{formatRupiah(row.specialObligationTotal)}</span>
                      <span className="block text-[10px] text-emerald-600">Disetor: {formatRupiah(row.specialPaidTotal)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {formatRupiah(row.totalObligation)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">
                    {formatRupiah(row.totalPaid)}
                  </td>
                  <td className="py-3 px-3 text-right font-black">
                    {row.totalArrears > 0 ? (
                      <span className="text-rose-600">{formatRupiah(row.totalArrears)}</span>
                    ) : (
                      <span className="text-emerald-700">Rp 0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.isAllCleared ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Lunas Semua
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Belum Lunas
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-200">
              <tr>
                <td className="py-3 px-4">TOTAL KESELURUHAN</td>
                <td className="py-3 px-3 text-right">
                  {formatRupiah(madrasahs.length * org.defaultMonthlyDues * 12)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatRupiah(madrasahObligations.reduce((s, o) => s + o.specialObligationTotal, 0))}
                </td>
                <td className="py-3 px-3 text-right text-emerald-900">
                  {formatRupiah(grandTotalObligation)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-700">
                  {formatRupiah(grandTotalPaid)}
                </td>
                <td className="py-3 px-3 text-right text-rose-700">
                  {formatRupiah(grandTotalArrears)}
                </td>
                <td className="py-3 px-4 text-center text-[10px] text-slate-500">
                  {madrasahObligations.filter(o => o.isAllCleared).length} / {madrasahs.length} MTs Lunas
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit FeeItem */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Tag className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingItem ? 'Edit Pos Iuran' : 'Tambah Pos Iuran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tentukan nama, nominal, dan sifat kewajiban pos iuran.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              
              {/* Sifat Iuran Selection (Wajib vs Tidak Wajib) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sifat Kewajiban Iuran <span className="text-rose-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: WAJIB */}
                  <label 
                    onClick={() => setFormIsMandatory(true)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      formIsMandatory 
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        IURAN WAJIB
                      </span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formIsMandatory ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {formIsMandatory && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      <strong>Menjadi Tagihan:</strong> Otomatis masuk ke daftar kewajiban & tunggakan madrasah anggota.
                    </p>
                  </label>

                  {/* Option 2: TIDAK WAJIB / SUKARELA */}
                  <label 
                    onClick={() => setFormIsMandatory(false)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      !formIsMandatory 
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-blue-950 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-blue-700" />
                        TIDAK WAJIB
                      </span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        !formIsMandatory ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {!formIsMandatory && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      <strong>Sukarela / Donasi:</strong> Opsional. Tidak akan dihitung sebagai tunggakan bila tidak disetor.
                    </p>
                  </label>
                </div>
              </div>

              {/* Nama Pos Iuran */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pos Iuran / Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Iuran Kegiatan KSM & AKSIOMA 2026/2027"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Grid: Kode & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos (Unik)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: IUR-KSM-2026"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Dues</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DuesCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="kegiatan_ksm_aksioma">Kegiatan KSM & AKSIOMA</option>
                    <option value="rapat_koordinasi">Rapat Koordinasi & Pembinaan</option>
                    <option value="pengembangan_organisasi">Pengembangan Organisasi & CBT</option>
                    <option value="iuran_sukarela">Infaq & Donasi Sosial</option>
                    <option value="wajib_bulanan">Iuran Rutin Bulanan</option>
                  </select>
                </div>
              </div>

              {/* Grid: Nominal & Frekuensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Besaran Nominal / Tarif (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formAmount === 0 ? '' : formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder={formIsMandatory ? 'Contoh: 500000' : '0 (Nominal Bebas)'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  {!formIsMandatory && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Isi 0 jika nominal bebas sukarela</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frekuensi Penarikan</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as FeeFrequency)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="sekali">Sekali Bayar (Insidental)</option>
                    <option value="tahunan">Per Tahun Ajaran</option>
                    <option value="per_semester">Per Semester (6 Bulan)</option>
                    <option value="bulanan">Bulanan</option>
                    <option value="sukarela">Sukarela / Fleksibel</option>
                  </select>
                </div>
              </div>

              {/* Grid: Target & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Berlaku Untuk</label>
                  <select
                    value={formAppliesTo}
                    onChange={(e) => setFormAppliesTo(e.target.value as 'all' | 'negeri_only' | 'swasta_only')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">Semua Madrasah Anggota ({madrasahs.length} MTs)</option>
                    <option value="swasta_only">Khusus MTs Swasta Saja</option>
                    <option value="negeri_only">Khusus MTs Negeri Saja</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jatuh Tempo / Batas Waktu</label>
                  <input
                    type="text"
                    placeholder="Contoh: 31 Oktober 2026"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi & Peruntukan Pos Iuran</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan alokasi dana dan peruntukan pos iuran..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Pos Iuran'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={!!itemToDelete}
          title="Hapus Pos Iuran?"
          message={`Apakah Anda yakin ingin menghapus pos iuran "${itemToDelete.name}"? Data riwayat transaksi yang sudah tercatat tidak akan terhapus.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

    </div>
  );
};
