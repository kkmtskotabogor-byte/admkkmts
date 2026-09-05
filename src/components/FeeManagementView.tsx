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
  Check,
  Users,
  Calculator
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
  createWALink,
  getMadrasahMonthlyDues,
  getMadrasahAnnualDues,
  getMadrasahDuesFormula
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
  // States for Per-Student Dues quick config
  const [duesPerStudentInput, setDuesPerStudentInput] = useState<number>(org.duesPerStudent || 3000);
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
  const totalStudents = madrasahs.reduce((sum, m) => sum + (m.studentCount || 0), 0);
  const monthlyOrgDuesTarget = madrasahs.reduce((sum, m) => sum + getMadrasahMonthlyDues(m, org), 0);
  const annualOrgDuesTarget = monthlyOrgDuesTarget * 12;

  // Quick Per-Student Dues Handler
  const handleSavePerStudentDues = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedOrg = {
      ...org,
      duesPerStudent: duesPerStudentInput,
      duesCalculationType: 'per_student' as const,
    };
    onUpdateOrgConfig(updatedOrg);

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
    // 1. Bulanan Wajib (12 bulan * getMadrasahMonthlyDues)
    const monthlyUnitDues = getMadrasahMonthlyDues(m, org);
    const monthlyTotalObligation = 12 * monthlyUnitDues;
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
      monthlyUnitDues,
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
              Perhitungan Iuran Anggota: Rp 3.000 / Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Iuran bulanan setiap MTs dihitung secara adil dan proporsional berdasarkan jumlah siswa: <strong>Jumlah Siswa × Rp 3.000/bulan</strong>, sehingga besaran iuran tiap MTs berbeda-beda.
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

      {/* Section 1: Quick Configuration for Per-Student Monthly Dues */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Calculator className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                1. Tarif Iuran Anggota Berbasis Jumlah Siswa
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rumus perhitungan: <strong>Tarif per Siswa × Jumlah Siswa per MTs = Kewajiban Bulanan MTs</strong> (12 bulan tahun ajaran).
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full self-start sm:self-auto flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Rp {org.duesPerStudent?.toLocaleString('id-ID') || '3.000'} / Siswa / Bulan
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Form Input */}
          <form onSubmit={handleSavePerStudentDues} className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tarif Iuran per Siswa (Rp / Siswa / Bulan)
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
                  value={duesPerStudentInput === 0 ? '' : duesPerStudentInput}
                  onChange={(e) => setDuesPerStudentInput(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Contoh: 3000"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-300 font-black text-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Standar perhitungan: 1 siswa = Rp 3.000. Setiap MTs akan membayar nominal berbeda sesuai data siswa riil.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Simpan Tarif per Siswa
              </button>
              {isSavedMonthlySuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Tarif Rp {duesPerStudentInput.toLocaleString('id-ID')}/siswa berhasil disimpan!
                </span>
              )}
            </div>
          </form>

          {/* Quick Stats Summary */}
          <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Proyeksi Kas Iuran Seluruh MTs ({formatAcademicYear(selectedYear)})
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Total Siswa Terdaftar</span>
                <span className="text-base font-black text-slate-800">{totalStudents.toLocaleString('id-ID')} Siswa</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Target Bulanan (12 MTs)</span>
                <span className="text-base font-black text-emerald-700">{formatRupiah(monthlyOrgDuesTarget)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block">Target 1 TA (12 Bulan)</span>
                <span className="text-base font-black text-slate-900">{formatRupiah(annualOrgDuesTarget)}</span>
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
                        {item.category === 'wajib_bulanan'
                          ? `Rp ${(org.duesPerStudent || 3000).toLocaleString('id-ID')} / siswa`
                          : item.amount > 0 ? formatRupiah(item.amount) : 'Nominal Bebas'}
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
              Perhitungan total kewajiban tagihan resmi per madrasah: <strong>(Jumlah Siswa × Rp 3.000 × 12 bulan) + Seluruh Pos Iuran Wajib yang aktif</strong>.
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
                <th className="py-3 px-3 text-center">Jml Siswa & Tarif</th>
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
                  <td className="py-3 px-3 text-center font-medium text-slate-700">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Users className="w-3 h-3 text-emerald-600" />
                      {row.madrasah.studentCount || 0} siswa
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {formatRupiah(row.monthlyUnitDues)}/bln
                    </span>
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
                <td className="py-3 px-3 text-center font-bold text-slate-800">
                  {totalStudents.toLocaleString('id-ID')} Siswa
                </td>
                <td className="py-3 px-3 text-right">
                  {formatRupiah(annualOrgDuesTarget)}
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
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              
              {/* Sifat Iuran: Wajib vs Tidak Wajib (Sukarela) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Sifat Tagihan Iuran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsMandatory(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      formIsMandatory
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className={`w-4 h-4 ${formIsMandatory ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">WAJIB (TAGIHAN)</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      Menjadi kewajiban madrasah & dihitung dalam akumulasi tunggakan bila belum dibayar.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIsMandatory(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !formIsMandatory
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-2 ring-blue-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className={`w-4 h-4 ${!formIsMandatory ? 'text-blue-700' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">TIDAK WAJIB (SUKARELA)</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      Sifatnya partisipatif / donasi / infaq. Tidak membebani tunggakan madrasah jika tidak disetor.
                    </p>
                  </button>
                </div>
              </div>

              {/* Nama Pos Iuran */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pos Iuran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Iuran Rakerda KKMTS 2026 / Infaq Peduli Madrasah"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Kode Pos Iuran & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Iuran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: IUR-AKSIOMA-26"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Dues
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DuesCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="kegiatan_ksm_aksioma">Kegiatan KSM & AKSIOMA</option>
                    <option value="rapat_koordinasi">Rapat Koordinasi / Raker</option>
                    <option value="pengembangan_organisasi">Pengembangan Organisasi</option>
                    <option value="iuran_sukarela">Infaq / Sukarela / Sosial</option>
                    <option value="wajib_bulanan">Iuran Rutin</option>
                  </select>
                </div>
              </div>

              {/* Nominal & Frekuensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nominal Tarif (Rp) {formIsMandatory && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formAmount === 0 ? '' : formAmount}
                      onChange={(e) => setFormAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0 = Bebas / Sukarela"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Isi 0 jika nominal bebas/sukarela.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Frekuensi Penagihan
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as FeeFrequency)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="sekali">Sekali Bayar (Event / Kegiatan)</option>
                    <option value="tahunan">1x Per Tahun Ajaran</option>
                    <option value="bulanan">Bulanan (12 Bulan)</option>
                    <option value="sukarela">Kapan Saja (Sukarela)</option>
                  </select>
                </div>
              </div>

              {/* Berlaku Untuk & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Berlaku Untuk
                  </label>
                  <select
                    value={formAppliesTo}
                    onChange={(e) => setFormAppliesTo(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">Semua Madrasah (Negeri & Swasta)</option>
                    <option value="negeri_only">Hanya MTs Negeri</option>
                    <option value="swasta_only">Hanya MTs Swasta</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batas Jatuh Tempo (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Deskripsi Pos Iuran (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan peruntukan dana iuran atau dasar keputusan rapat..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingItem ? 'Simpan Perubahan' : 'Buat Pos Iuran'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Hapus Pos Iuran?"
          message={`Apakah Anda yakin ingin menghapus pos iuran "${itemToDelete.name}" (${itemToDelete.code})? Data iuran yang sudah disetor sebelumnya tetap tersimpan di riwayat transaksi.`}
          confirmLabel="Ya, Hapus Pos Iuran"
          onConfirm={handleConfirmDelete}
          onClose={() => setItemToDelete(null)}
          onCancel={() => setItemToDelete(null)}
        />
      )}

    </div>
  );
};
