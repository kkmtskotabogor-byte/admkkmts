import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  FileText, 
  ChevronRight,
  Sparkles,
  Users,
  Eye,
  Plus,
  Printer,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Madrasah, PaymentRecord, ExpenseRecord, OrganizationConfig, ActiveTab } from '../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatAcademicYear, 
  formatAcademicYearFull,
  isPaymentInAcademicYear, 
  isExpenseInAcademicYear,
  createWALink, 
  generateVerificationSuccessWAMessage 
} from '../utils/formatters';

interface DashboardViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenNewPayment: () => void;
  onSelectPaymentForVerification: (payment: PaymentRecord) => void;
  onSelectPaymentForReceipt: (payment: PaymentRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  madrasahs,
  payments,
  expenses,
  org,
  selectedYear,
  setActiveTab,
  onNavigateTab,
  onOpenNewPayment,
  onSelectPaymentForVerification,
  onSelectPaymentForReceipt,
}) => {
  const navigate = setActiveTab || onNavigateTab || (() => {});
  const [chartTimeframe, setChartTimeframe] = useState<'all' | 'sem1' | 'sem2'>('all');

  // Today's calendar month & year
  const now = new Date();
  const currentCalMonth = now.getMonth() + 1; // 1-12
  const currentCalYear = now.getFullYear();
  const currentMonthName = MONTH_NAMES_ID[currentCalMonth - 1];

  // Financial calculations for selected Academic Year (Juli - Juni)
  const academicPayments = payments.filter(p => isPaymentInAcademicYear(p, selectedYear));
  const verifiedAcademicPayments = academicPayments.filter(p => p.status === 'verified');
  const pendingPayments = academicPayments.filter(p => p.status === 'pending');

  const academicExpenses = expenses.filter(e => isExpenseInAcademicYear(e, selectedYear));

  const totalIncome = verifiedAcademicPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpense = academicExpenses.reduce((acc, e) => acc + e.amount, 0);
  const currentCashBalance = totalIncome - totalExpense;

  // Monthly collection rate for the active calendar month
  const currentMonthPaidMadrasahIds = new Set(
    academicPayments
      .filter(p => p.periodMonth === currentCalMonth && p.periodYear === currentCalYear && p.status === 'verified')
      .map(p => p.madrasahId)
  );

  const activeMadrasahCount = madrasahs.filter(m => m.isActive).length;
  const currentMonthPaidCount = currentMonthPaidMadrasahIds.size;
  const currentMonthCompliance = activeMadrasahCount > 0 
    ? Math.round((currentMonthPaidCount / activeMadrasahCount) * 100) 
    : 0;

  // Current month income
  const currentMonthIncome = verifiedAcademicPayments
    .filter(p => p.periodMonth === currentCalMonth && p.periodYear === currentCalYear)
    .reduce((sum, p) => sum + p.amount, 0);

  // Monthly income vs expense breakdown for the 12 Academic Months (Juli -> Juni)
  const monthlyStats = ACADEMIC_MONTHS.map((am) => {
    const calendarYear = am.getYear(selectedYear);
    const inc = verifiedAcademicPayments
      .filter(p => p.periodMonth === am.monthIndex && p.periodYear === calendarYear)
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Expenses in this academic month
    const exp = academicExpenses
      .filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return (d.getMonth() + 1 === am.monthIndex) && (d.getFullYear() === calendarYear);
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      order: am.order,
      monthIndex: am.monthIndex,
      monthName: am.shortName,
      fullName: am.name,
      calendarYear,
      income: inc,
      expense: exp,
      net: inc - exp
    };
  });

  const maxMonthlyVal = Math.max(
    ...monthlyStats.map(s => Math.max(s.income, s.expense)),
    1000000
  );

  // Recent transactions in this academic year
  const recentTransactions = [
    ...verifiedAcademicPayments.map(p => ({
      id: p.id,
      type: 'income' as const,
      title: `Iuran ${p.madrasahName}`,
      date: p.paymentDate,
      subtitle: `${MONTH_NAMES_ID[p.periodMonth - 1]} ${p.periodYear} • ${p.paymentMethod.split(' ')[0]}`,
      amount: p.amount,
      badge: 'Terverifikasi',
      rawPayment: p,
    })),
    ...academicExpenses.map(e => ({
      id: e.id,
      type: 'expense' as const,
      title: e.title,
      date: e.date,
      subtitle: `${e.category} • Nota ${e.voucherNumber}`,
      amount: e.amount,
      badge: 'Lunas Kas',
      rawPayment: null,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const academicLabel = formatAcademicYear(selectedYear); // e.g. TA 2026/2027

  return (
    <div className="space-y-6">
      
      {/* Pending Alert Banner if needed */}
      {pendingPayments.length > 0 && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  {pendingPayments.length} Bukti Transfer Perlu Diverifikasi ({academicLabel})
                </h3>
                <span className="bg-white text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Menunggu
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Madrasah telah mengunggah slip transfer untuk {formatAcademicYearFull(selectedYear)}.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('payments')}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-amber-950 font-bold text-xs rounded-xl shadow-xs hover:bg-amber-50 active:scale-98 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Buka Antrean Verifikasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        
        {/* Bento Tile 1: Total Saldo Kas (4 cols) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Saldo Kas {academicLabel}
              </p>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatRupiah(currentCashBalance)}
            </h3>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center text-emerald-800 text-xs font-bold">
              <span className="mr-1">↑ Real-time</span>
              <span className="text-slate-600 font-normal">kas berjalan</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Juli {selectedYear} - Juni {selectedYear + 1}
            </span>
          </div>
        </div>

        {/* Bento Tile 2: Iuran Masuk Bulan Ini (4 cols) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Iuran Masuk ({currentMonthName} {currentCalYear})
              </p>
              <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200/60">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatRupiah(currentMonthIncome)}
            </h3>
          </div>

          <div className="mt-4 space-y-2">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentMonthCompliance}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              <strong>{currentMonthPaidCount}</strong> dari {activeMadrasahCount} Madrasah sudah membayar ({currentMonthCompliance}%)
            </p>
          </div>
        </div>

        {/* Bento Tile 3: Dark Quick Action Bento (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aksi Cepat
              </p>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Pintasan
              </span>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={onOpenNewPayment}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Setoran Iuran Baru</span>
              </button>

              <button 
                onClick={() => navigate('expenses')}
                className="w-full py-2.5 px-4 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>Catat Pengeluaran BKU</span>
              </button>

              <button 
                onClick={() => navigate('reports')}
                className="w-full py-2 px-4 bg-slate-800/60 border border-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Cetak Laporan BKU ({academicLabel})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Tile 4: Arus Kas Terkini & Visualisasi 12 Bulan Akademik (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Arus Kas 12 Bulan ({academicLabel})
                </h4>
                <p className="text-xs text-slate-500">
                  Pemasukan vs Pengeluaran periode Juli {selectedYear} s.d. Juni {selectedYear + 1}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span> Iuran Masuk
                </span>
                <span className="flex items-center gap-1.5 font-bold text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Kas Keluar
                </span>
              </div>
            </div>

            {/* Bar Chart Bars */}
            <div className="pt-3 pb-2">
              <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-44 items-end">
                {monthlyStats.map((stat, idx) => {
                  const incomePercent = Math.min(Math.round((stat.income / maxMonthlyVal) * 100), 100);
                  const expensePercent = Math.min(Math.round((stat.expense / maxMonthlyVal) * 100), 100);

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[10px] rounded-xl py-1.5 px-2.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                        <div className="font-extrabold text-slate-200">{stat.fullName} {stat.calendarYear}</div>
                        <div className="font-bold text-emerald-400">Masuk: {formatRupiah(stat.income)}</div>
                        <div className="text-rose-300">Keluar: {formatRupiah(stat.expense)}</div>
                      </div>

                      {/* Bars pair */}
                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                        <div 
                          className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all"
                          style={{ height: `${Math.max(incomePercent, 4)}%` }}
                          title={`Iuran ${stat.fullName}: ${formatRupiah(stat.income)}`}
                        />
                        <div 
                          className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t-md transition-all"
                          style={{ height: `${Math.max(expensePercent, 4)}%` }}
                          title={`Pengeluaran ${stat.fullName}: ${formatRupiah(stat.expense)}`}
                        />
                      </div>

                      {/* Month Label */}
                      <span className="text-[10px] text-slate-600 font-bold mt-2">
                        {stat.monthName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick links footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => navigate('reports')}
              className="text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Buku Kas Umum (BKU) Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('matrix')}
              className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Matriks Setoran 12 Bulan (Juli - Juni)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento Tile 5: Butuh Verifikasi Bento Card (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Butuh Verifikasi
                </h4>
                <p className="text-xs text-slate-500">
                  Slip transfer {academicLabel}
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {pendingPayments.length} pending
              </span>
            </div>

            {/* List of Pending Items */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {pendingPayments.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-800">Semua Bukti Telah Diverifikasi!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada antrean pembayaran yang tertunda.</p>
                </div>
              ) : (
                pendingPayments.slice(0, 3).map((p) => (
                  <div 
                    key={p.id}
                    className="p-3.5 bg-orange-50/70 hover:bg-orange-50 border border-orange-200/70 rounded-2xl transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {p.madrasahName}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Bulan {MONTH_NAMES_ID[p.periodMonth - 1]} {p.periodYear} • {formatRupiah(p.amount)}
                        </p>
                      </div>
                      <span className="text-[10px] bg-orange-200 text-orange-900 px-2 py-0.5 rounded-md font-extrabold uppercase shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onSelectPaymentForVerification(p)}
                        className="flex-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-xl font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        Terima / Validasi
                      </button>
                      <button
                        onClick={() => onSelectPaymentForVerification(p)}
                        className="flex-1 text-[11px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
                      >
                        Cek Bukti
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('payments')}
              className="w-full text-center text-xs text-emerald-800 hover:text-emerald-900 font-bold cursor-pointer"
            >
              Lihat Seluruh Antrean ({pendingPayments.length}) →
            </button>
          </div>
        </div>

        {/* Bento Tile 6: WhatsApp Status Pill Tile */}
        <div className="col-span-12 lg:col-span-4 bg-emerald-700 text-white rounded-3xl p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-emerald-200">
                WhatsApp Gateway
              </p>
              <p className="text-sm font-bold">
                Auto-Notify Active
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black">{verifiedAcademicPayments.length}</span>
            <p className="text-[10px] text-emerald-200">Kwitansi Terbit</p>
          </div>
        </div>

        {/* Bento Tile 7: Recent Transactions List (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                Riwayat Transaksi {academicLabel}
              </h4>
              <p className="text-xs text-slate-500">
                Mutasi masuk dan keluar kas periode Juli {selectedYear} s.d. Juni {selectedYear + 1}
              </p>
            </div>
            <button
              onClick={() => navigate('payments')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-150 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {tx.type === 'income' ? 'MTs' : 'BKK'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {tx.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatTanggalIndo(tx.date)} • {tx.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <p className={`text-sm font-black ${
                      tx.type === 'income' ? 'text-emerald-800' : 'text-rose-800'
                    }`}>
                      {tx.type === 'income' ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tx.badge}
                    </span>
                  </div>

                  {tx.rawPayment && (
                    <button
                      onClick={() => onSelectPaymentForReceipt(tx.rawPayment!)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                      title="Lihat Kwitansi"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Tile 8: Status Madrasah Anggota (col-span-12 lg:col-span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-base">
                Anggota Madrasah ({madrasahs.length})
              </h4>
              <button
                onClick={() => navigate('madrasah')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
              >
                Kelola
              </button>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {madrasahs.map((m) => {
                const isPaid = currentMonthPaidMadrasahIds.has(m.id);
                return (
                  <div 
                    key={m.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {m.status} • {m.headmasterName}
                      </p>
                    </div>

                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                      isPaid 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isPaid ? 'Lunas Bulan Ini' : 'Belum Bayar'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('whatsapp')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kirim Tagihan Pengingat via WA</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
