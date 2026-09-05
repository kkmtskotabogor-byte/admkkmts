import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  TrendingDown, 
  FileText, 
  Trash2, 
  Search, 
  Download, 
  Calendar, 
  CreditCard, 
  Receipt,
  UserCheck,
  X,
  Building2,
  Upload,
  Layers,
  Tag,
  AlertCircle,
  Coins,
  Wallet,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, OrganizationConfig, FeeItem, PaymentRecord } from '../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatAcademicYear, 
  formatAcademicYearFull,
  isExpenseInAcademicYear, 
  isPaymentInAcademicYear,
  generateVoucherNumber 
} from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  feeItems?: FeeItem[];
  payments?: PaymentRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rapat Koordinasi & Konsumsi',
  'Transport & Akomodasi Pengurus',
  'ATK, Cetak & Penggandaan',
  'Kegiatan KSM & AKSIOMA',
  'Honorarium Narasumber & Workshop',
  'Operasional Sekretariat & Web',
  'Sosial, Takziyah & Santunan',
  'Lain-lain',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  feeItems = [],
  payments = [],
  org,
  selectedYear,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeeItemIdFilter, setSelectedFeeItemIdFilter] = useState<string>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all'); // "month-year" or "all"
  const [breakdownTab, setBreakdownTab] = useState<'pos' | 'category'>('pos');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  const allFeeItems = feeItems;

  // Form State
  const [title, setTitle] = useState('');
  const [formFeeItemId, setFormFeeItemId] = useState<string>(() => {
    return allFeeItems.length > 0 ? allFeeItems[0].id : 'general';
  });
  const [category, setCategory] = useState<ExpenseCategory>('Rapat Koordinasi & Konsumsi');
  const [amount, setAmount] = useState<number>(350000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recipient, setRecipient] = useState('');
  const [approvedBy, setApprovedBy] = useState(`${org.chairmanName} (Ketua)`);
  const [notes, setNotes] = useState('');
  const [receiptProofUrl, setReceiptProofUrl] = useState('');
  const [receiptProofFileName, setReceiptProofFileName] = useState('');

  // Calculate stats for a specific fee item
  const getFeeItemStats = (item: FeeItem) => {
    const totalIncome = payments
      .filter(p => 
        p.status === 'verified' && 
        isPaymentInAcademicYear(p, selectedYear) && 
        (p.feeItemId === item.id || (!p.feeItemId && p.duesCategory === item.category))
      )
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpense = expenses
      .filter(e => 
        isExpenseInAcademicYear(e, selectedYear) && 
        (e.feeItemId === item.id || (!e.feeItemId && e.feeItemName === item.name))
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance };
  };

  // Filtered expenses for selected Academic Year (Juli -> Juni)
  const filteredExpenses = expenses.filter((e) => {
    if (!isExpenseInAcademicYear(e, selectedYear)) return false;
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    
    if (selectedFeeItemIdFilter !== 'all') {
      if (selectedFeeItemIdFilter === 'general') {
        if (e.feeItemId) return false;
      } else if (e.feeItemId !== selectedFeeItemIdFilter) {
        return false;
      }
    }

    if (selectedMonthKey !== 'all') {
      const [mStr, yStr] = selectedMonthKey.split('-');
      const d = new Date(e.date);
      if (d.getMonth() + 1 !== Number(mStr) || d.getFullYear() !== Number(yStr)) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const feeName = (e.feeItemName || '').toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) && 
        !e.recipient.toLowerCase().includes(q) && 
        !e.voucherNumber.toLowerCase().includes(q) &&
        !feeName.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown in selected Academic Year
  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter(e => e.category === cat && isExpenseInAcademicYear(e, selectedYear))
      .reduce((sum, e) => sum + e.amount, 0);
    return { category: cat, total };
  }).filter(c => c.total > 0);

  // Fee post breakdown in selected Academic Year
  const feePostBreakdown = allFeeItems.map((item) => {
    const stats = getFeeItemStats(item);
    return {
      item,
      totalExpense: stats.totalExpense,
      totalIncome: stats.totalIncome,
      balance: stats.balance,
    };
  });

  const generalExpenseTotal = expenses
    .filter(e => isExpenseInAcademicYear(e, selectedYear) && !e.feeItemId)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAddModal = () => {
    setFormFeeItemId(allFeeItems.length > 0 ? allFeeItems[0].id : 'general');
    setTitle('');
    setCategory('Rapat Koordinasi & Konsumsi');
    setAmount(350000);
    setDate(new Date().toISOString().slice(0, 10));
    setRecipient('');
    setApprovedBy(`${org.chairmanName} (Ketua)`);
    setNotes('');
    setReceiptProofUrl('');
    setReceiptProofFileName('');
    setShowAddModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleReceipt = () => {
    setReceiptProofUrl('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800');
    setReceiptProofFileName('nota_kuitansi_pengeluaran.jpg');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const d = new Date(date);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const seq = Math.floor(10 + Math.random() * 90);
    const voucherNumber = generateVoucherNumber(seq, m, y);

    const selectedFeeItem = allFeeItems.find(f => f.id === formFeeItemId);
    const feeItemName = selectedFeeItem 
      ? selectedFeeItem.name 
      : (formFeeItemId === 'general' ? 'Kas Umum KKMTS' : undefined);

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      voucherNumber,
      title: title.trim(),
      category,
      feeItemId: formFeeItemId !== 'general' ? formFeeItemId : undefined,
      feeItemName,
      amount: Number(amount) || 0,
      date,
      recipient: recipient.trim() || 'Pihak Ketiga / Pengurus',
      approvedBy: approvedBy.trim() || org.chairmanName,
      receiptProofUrl: receiptProofUrl || undefined,
      receiptProofFileName: receiptProofFileName || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);
    setShowAddModal(false);
    // Reset
    setTitle('');
    setRecipient('');
    setNotes('');
    setReceiptProofUrl('');
    setReceiptProofFileName('');
  };

  const academicLabel = formatAcademicYear(selectedYear); // e.g. TA 2026/2027

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Buku Kas Keluar & Pengeluaran Operasional ({academicLabel})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan nota, voucher pengeluaran, dan belanja organisasi periode Juli {selectedYear} s.d. Juni {selectedYear + 1}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Catat Pengeluaran Baru
        </button>
      </div>

      {/* Top Breakdown Tabs & Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBreakdownTab('pos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                breakdownTab === 'pos'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Berdasarkan Pos Sumber Dana ({allFeeItems.length} Pos)</span>
            </button>
            <button
              onClick={() => setBreakdownTab('category')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                breakdownTab === 'category'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Berdasarkan Kategori Belanja</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Total Pengeluaran TA: <strong className="text-rose-700">{formatRupiah(expenses.filter(e => isExpenseInAcademicYear(e, selectedYear)).reduce((s, e) => s + e.amount, 0))}</strong>
          </span>
        </div>

        {breakdownTab === 'pos' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {feePostBreakdown.map((itemStat) => (
              <div 
                key={itemStat.item.id} 
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
                  itemStat.totalExpense > 0 ? 'border-rose-200/80 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {itemStat.item.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      itemStat.item.isMandatory ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {itemStat.item.isMandatory ? 'Wajib' : 'Sukarela'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1" title={itemStat.item.name}>
                    {itemStat.item.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Pengeluaran Pos:</div>
                    <div className="text-base font-extrabold text-rose-700">
                      {formatRupiah(itemStat.totalExpense)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Sisa Kas Pos:</div>
                    <div className={`text-xs font-bold ${itemStat.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatRupiah(itemStat.balance)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* General Expense Card if any */}
            {generalExpenseTotal > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    KAS-UMUM
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">Kas Umum Operasional</h4>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-slate-500 font-medium">Pengeluaran Kas Umum:</div>
                  <div className="text-base font-extrabold text-rose-700">{formatRupiah(generalExpenseTotal)}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryBreakdown.slice(0, 4).map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  {c.category}
                </span>
                <div className="text-xl font-extrabold text-rose-700 mt-2">
                  {formatRupiah(c.total)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari uraian belanja, pos, penerima, voucher BKK..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedFeeItemIdFilter}
            onChange={(e) => setSelectedFeeItemIdFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Pos Sumber Dana</option>
            {allFeeItems.map((f) => (
              <option key={f.id} value={f.id}>
                Pos: [{f.code}] {f.name}
              </option>
            ))}
            <option value="general">Kas Umum / Non-Pos Khusus</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Kategori Belanja</option>
            {EXPENSE_CATEGORIES.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Bulan</option>
            {ACADEMIC_MONTHS.map((am) => {
              const calYear = am.getYear(selectedYear);
              const val = `${am.monthIndex}-${calYear}`;
              return (
                <option key={val} value={val}>
                  {am.shortName} {calYear}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Voucher</th>
                <th className="py-3 px-4">Uraian / Keperluan</th>
                <th className="py-3 px-4">Pos Sumber Dana</th>
                <th className="py-3 px-4">Kategori Belanja</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Penerima & Approval</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Nota Fisik</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data pengeluaran yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter pos/kategori/bulan.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Voucher Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {expense.voucherNumber}
                    </td>

                    {/* Title & Notes */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-bold text-slate-950">{expense.title}</div>
                      {expense.notes && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{expense.notes}</div>
                      )}
                    </td>

                    {/* Pos Sumber Dana */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {expense.feeItemId ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 w-fit">
                            <Layers className="w-3 h-3 text-emerald-600" />
                            <span>{expense.feeItemName || allFeeItems.find(f => f.id === expense.feeItemId)?.name || 'Pos Iuran'}</span>
                          </span>
                          {allFeeItems.find(f => f.id === expense.feeItemId)?.code && (
                            <span className="text-[10px] font-mono text-slate-400 mt-0.5 ml-1">
                              Kode: {allFeeItems.find(f => f.id === expense.feeItemId)?.code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{expense.feeItemName || 'Kas Umum / Operasional'}</span>
                        </span>
                      )}
                    </td>

                    {/* Category Badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {expense.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {formatTanggalIndo(expense.date)}
                    </td>

                    {/* Recipient & Approved */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{expense.recipient}</div>
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                        <UserCheck className="w-3 h-3" />
                        Acc: {expense.approvedBy}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-700 whitespace-nowrap">
                      {formatRupiah(expense.amount)}
                    </td>

                    {/* Receipt Proof */}
                    <td className="py-3.5 px-4 text-center">
                      {expense.receiptProofUrl ? (
                        <button
                          onClick={() => setPreviewReceiptUrl(expense.receiptProofUrl || null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold transition-colors border border-rose-200 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Nota</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa Nota</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus data pengeluaran ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>Menampilkan {filteredExpenses.length} transaksi pengeluaran.</span>
          <div className="font-bold text-slate-900 text-sm">
            Total Kas Keluar Terfilter: <span className="text-rose-700 font-extrabold">{formatRupiah(totalExpenseAmount)}</span>
          </div>
        </div>

      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Catat Pengeluaran Baru (Kas Keluar)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Terbitkan nomor voucher BKK dan tentukan pos sumber dana yang dikeluarkan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian / Keperluan Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Konsumsi Rapat Koordinasi Kepala MTs Se-Kota Bogor"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Pilihan Sumber Dana Pos Iuran */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Sumber Dana dari Pos Mana yang Dikeluarkan? *</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Sesuai Pos Iuran & Anggaran
                  </span>
                </div>

                <select
                  value={formFeeItemId}
                  onChange={(e) => setFormFeeItemId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                >
                  {allFeeItems.map((item) => {
                    const stats = getFeeItemStats(item);
                    return (
                      <option key={item.id} value={item.id}>
                        [{item.code}] {item.name} — Sisa Saldo: {formatRupiah(stats.balance)}
                      </option>
                    );
                  })}
                  <option value="general">
                    [KAS-UMUM] Kas Umum Operasional / Non-Pos Khusus
                  </option>
                </select>

                {/* Realtime Saldo Pos Info Card */}
                {formFeeItemId !== 'general' && (() => {
                  const selectedItem = allFeeItems.find(f => f.id === formFeeItemId);
                  if (!selectedItem) return null;
                  const stats = getFeeItemStats(selectedItem);
                  const isDeficit = amount > stats.balance;

                  return (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                            {selectedItem.code}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{selectedItem.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedItem.isMandatory 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {selectedItem.isMandatory ? 'Kewajiban Wajib' : 'Iuran Sukarela'}
                        </span>
                      </div>

                      {selectedItem.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          {selectedItem.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-emerald-800 font-medium">Dana Terkumpul</div>
                          <div className="font-bold text-emerald-700 text-xs mt-0.5">{formatRupiah(stats.totalIncome)}</div>
                        </div>
                        <div className="bg-rose-50/60 border border-rose-100 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-rose-800 font-medium">Sudah Terpakai</div>
                          <div className="font-bold text-rose-700 text-xs mt-0.5">{formatRupiah(stats.totalExpense)}</div>
                        </div>
                        <div className="bg-slate-100/70 border border-slate-200 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-slate-600 font-medium">Sisa Saldo Pos</div>
                          <div className={`font-extrabold text-xs mt-0.5 ${stats.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                            {formatRupiah(stats.balance)}
                          </div>
                        </div>
                      </div>

                      {isDeficit && (
                        <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Peringatan Defisit:</span> Nominal yang dikeluarkan ({formatRupiah(amount)}) melebihi sisa kas yang tersedia di pos ini ({formatRupiah(stats.balance)}).
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {formFeeItemId === 'general' && (
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/70 text-[11px] text-blue-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Pengeluaran ini akan dibebankan ke <strong>Kas Umum Organisasi KKMTS</strong> (tanpa ikatan pos iuran khusus).</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Belanja *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((cat, i) => (
                      <option key={i} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Pengeluaran (Rp) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Nominal bebas"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pengeluaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penerima Dana / Vendor
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Contoh: RM Saung Kuring / Toko ATK Sinar"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Disetujui Oleh (Approval)
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="Nama Pengurus yang menyetujui"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Upload Nota */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto / Scan Nota & Kuitansi Fisik (Opsional)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Foto Nota</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleSampleReceipt}
                    className="text-xs text-rose-700 hover:text-rose-800 font-semibold underline cursor-pointer"
                  >
                    Gunakan Contoh Gambar Nota
                  </button>
                </div>

                {receiptProofFileName && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                    ✓ File terlampir: {receiptProofFileName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan jika diperlukan..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Simpan Transaksi Kas Keluar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Preview Nota Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Bukti Nota / Kuitansi Fisik</h4>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex items-center justify-center bg-slate-50 rounded-xl mt-3 overflow-hidden">
              <img
                src={previewReceiptUrl}
                alt="Nota Pengeluaran"
                className="max-h-[60vh] object-contain rounded-lg shadow-xs"
              />
            </div>
            <div className="pt-3 text-center">
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <ConfirmDeleteModal
          isOpen={!!expenseToDelete}
          title="Hapus Transaksi Kas Keluar?"
          itemName={`${expenseToDelete.voucherNumber} - ${expenseToDelete.title}`}
          message={`Anda akan menghapus pengeluaran voucher "${expenseToDelete.voucherNumber}" (${expenseToDelete.title}) sebesar ${formatRupiah(expenseToDelete.amount)}. Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={() => {
            onDeleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }}
          onClose={() => setExpenseToDelete(null)}
        />
      )}

    </div>
  );
};

