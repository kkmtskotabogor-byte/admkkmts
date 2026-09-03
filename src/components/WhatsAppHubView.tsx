import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Copy, 
  Smartphone, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Settings, 
  RefreshCw,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { Madrasah, PaymentRecord, ExpenseRecord, OrganizationConfig } from '../types';
import { 
  MONTH_NAMES_ID, 
  ACADEMIC_MONTHS, 
  formatAcademicYear, 
  formatRupiah, 
  formatTanggalIndo, 
  generateVerificationSuccessWAMessage, 
  generateDuesReminderWAMessage, 
  generateFinancialBroadcastWAMessage, 
  createWALink,
  sanitizePhoneForWA,
  isPaymentInAcademicYear,
  isExpenseInAcademicYear,
  getMadrasahMonthlyDues
} from '../utils/formatters';

interface WhatsAppHubViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  onUpdateConfig: (config: OrganizationConfig) => void;
}

export const WhatsAppHubView: React.FC<WhatsAppHubViewProps> = ({
  madrasahs,
  payments,
  expenses,
  org,
  selectedYear,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reminder' | 'receipts' | 'broadcast' | 'templates'>('reminder');
  const [selectedMadrasahId, setSelectedMadrasahId] = useState<string>(madrasahs[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [copiedText, setCopiedText] = useState(false);
  const [customPhone, setCustomPhone] = useState('');

  // Selected school for reminder
  const selectedMadrasah = madrasahs.find(m => m.id === selectedMadrasahId) || madrasahs[0];

  // Calculate unpaid months for selected school
  const verifiedPaymentsForMadrasah = payments.filter(
    p => p.madrasahId === selectedMadrasah?.id && isPaymentInAcademicYear(p, selectedYear) && p.status === 'verified'
  );
  const paidMonthKeys = new Set(verifiedPaymentsForMadrasah.map(p => `${p.periodMonth}-${p.periodYear}`));

  const unpaidMonths = ACADEMIC_MONTHS
    .map(mObj => ({ month: mObj.monthIndex, year: mObj.getYear(selectedYear) }))
    .filter(item => !paidMonthKeys.has(`${item.month}-${item.year}`));

  // List of all schools with arrears
  const schoolsWithArrears = madrasahs.map((m) => {
    const paidMonths = new Set(
      payments
        .filter(p => p.madrasahId === m.id && isPaymentInAcademicYear(p, selectedYear) && p.status === 'verified')
        .map(p => `${p.periodMonth}-${p.periodYear}`)
    );
    const unpaids = ACADEMIC_MONTHS
      .map(mObj => ({ month: mObj.monthIndex, year: mObj.getYear(selectedYear) }))
      .filter(item => !paidMonths.has(`${item.month}-${item.year}`));
    
    return {
      madrasah: m,
      unpaids,
      unpaidAmount: unpaids.length * getMadrasahMonthlyDues(m, org),
    };
  }).filter(item => item.unpaids.length > 0);

  // Financial broadcast calculation
  const verifiedYearPayments = payments.filter(p => isPaymentInAcademicYear(p, selectedYear) && p.status === 'verified');
  const totalIncome = verifiedYearPayments.reduce((s, p) => s + p.amount, 0);
  const currentYearExpenses = expenses.filter(e => isExpenseInAcademicYear(e, selectedYear));
  const totalExpense = currentYearExpenses.reduce((s, e) => s + e.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  const targetCalYear = selectedMonth >= 7 ? selectedYear : selectedYear + 1;
  const paidMadrasahThisMonthCount = new Set(
    payments
      .filter(p => p.periodMonth === selectedMonth && p.periodYear === targetCalYear && p.status === 'verified')
      .map(p => p.madrasahId)
  ).size;

  // Selected recent verified payment for receipt preview
  const recentVerifiedPayment = payments.find(p => p.status === 'verified') || payments[0];

  // Generated Messages
  const reminderMessage = selectedMadrasah
    ? generateDuesReminderWAMessage(selectedMadrasah, unpaidMonths, org)
    : '';

  const receiptMessage = recentVerifiedPayment
    ? generateVerificationSuccessWAMessage(
        recentVerifiedPayment,
        madrasahs.find(m => m.id === recentVerifiedPayment.madrasahId),
        org
      )
    : '';

  const broadcastMessage = generateFinancialBroadcastWAMessage(
    selectedMonth,
    targetCalYear,
    totalIncome,
    totalExpense,
    currentBalance,
    madrasahs.length,
    paidMadrasahThisMonthCount,
    org
  );

  const activeMessage = 
    activeSubTab === 'reminder' ? reminderMessage :
    activeSubTab === 'receipts' ? receiptMessage :
    activeSubTab === 'broadcast' ? broadcastMessage :
    '';

  const currentTargetPhone = 
    activeSubTab === 'reminder' ? selectedMadrasah?.phone :
    activeSubTab === 'receipts' ? madrasahs.find(m => m.id === recentVerifiedPayment?.madrasahId)?.phone :
    customPhone || org.contactPhone;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSendWA = (targetPhone?: string, customMsg?: string) => {
    const phone = targetPhone || currentTargetPhone || '';
    const msg = customMsg || activeMessage;
    if (!phone) {
      alert('Nomor WhatsApp tujuan belum tersedia.');
      return;
    }
    const url = createWALink(phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Send className="w-5 h-5" />
            </span>
            Pusat Notifikasi WhatsApp KKMTS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Generator notifikasi kwitansi otomatis, pengingat tagihan iuran, dan siaran laporan kas transparan
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            WhatsApp Gateway Aktif
          </span>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex space-x-2 border-b border-slate-200 pb-1 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('reminder')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'reminder'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pengingat Iuran (Dues Reminder)
          {schoolsWithArrears.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {schoolsWithArrears.length} MTs
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'receipts'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Kwitansi Lunas Terverifikasi
        </button>

        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'broadcast'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Siaran Laporan Kas ke Grup WA
        </button>
      </div>

      {/* Main Content: Split Simulator on Right, Controls & List on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Config & Targets */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SubTab 1: Reminder Controls */}
          {activeSubTab === 'reminder' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Daftar Madrasah Belum Lunas ({schoolsWithArrears.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kirim pesan WhatsApp personal dengan 1 klik ke masing-masing bendahara
                  </p>
                </div>
              </div>

              {/* List of schools with arrears */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {schoolsWithArrears.map((item) => {
                  const isSelected = item.madrasah.id === selectedMadrasahId;
                  const targetMsg = generateDuesReminderWAMessage(item.madrasah, item.unpaids, org);

                  return (
                    <div
                      key={item.madrasah.id}
                      onClick={() => setSelectedMadrasahId(item.madrasah.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {item.madrasah.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                            {item.unpaids.length} Bulan Tunggakan
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bendahara: <strong>{item.madrasah.treasurerName}</strong> • Telp: {item.madrasah.phone}
                        </p>
                        <p className="text-xs font-bold text-rose-700 mt-0.5">
                          Tagihan: {formatRupiah(item.unpaidAmount)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWA(item.madrasah.phone, targetMsg);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SubTab 2: Receipts Controls */}
          {activeSubTab === 'receipts' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Pilih Kwitansi untuk Dikirimkan
                </h3>
                <p className="text-xs text-slate-500">
                  Kwitansi resmi bertanda tangan digital dan tercatat dalam buku kas
                </p>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {payments.filter(p => p.status === 'verified').map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.madrasahName}</p>
                      <p className="text-slate-500">
                        {p.receiptNumber} • Bulan {MONTH_NAMES_ID[p.periodMonth - 1]} {p.periodYear}
                      </p>
                      <p className="font-bold text-emerald-700 mt-0.5">{formatRupiah(p.amount)}</p>
                    </div>

                    <button
                      onClick={() => {
                        const m = madrasahs.find(m => m.id === p.madrasahId);
                        const msg = generateVerificationSuccessWAMessage(p, m, org);
                        handleSendWA(m?.phone, msg);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Kirim Bukti
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 3: Broadcast Controls */}
          {activeSubTab === 'broadcast' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs sm:text-sm">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Siaran Laporan Keuangan ke Grup WhatsApp KKMTS
                </h3>
                <p className="text-xs text-slate-500">
                  Menjaga transparansi kas organisasi kepada seluruh Kepala Madrasah & Pengawas
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-semibold text-slate-700">
                  Pilih Periode Bulan Laporan:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {ACADEMIC_MONTHS.map((mObj) => (
                    <option key={mObj.order} value={mObj.monthIndex}>
                      Laporan Bulan {mObj.name} {mObj.getYear(selectedYear)}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Iuran</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(totalIncome)}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Keluar</span>
                    <span className="font-bold text-rose-700">{formatRupiah(totalExpense)}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Saldo Kas</span>
                    <span className="font-bold text-slate-900">{formatRupiah(currentBalance)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kirim ke Nomor Tujuan / Kontak Admin Grup (Opsional):
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="Contoh: 081289123456 (Nomor HP Anda / Pengurus)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Quick WA Formatting Tips Card */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Keunggulan Notifikasi WhatsApp Otomatis:
            </h4>
            <p className="text-[11px] text-emerald-800">
              • Pesan terformat rapi dengan huruf tebal (*teks*), emoji status resmi, nomor kwitansi, dan rekening bank.
            </p>
            <p className="text-[11px] text-emerald-800">
              • Menghubungkan langsung ke aplikasi WhatsApp Web di komputer atau aplikasi WhatsApp di HP tanpa perlu menyimpan nomor kontak terlebih dahulu.
            </p>
          </div>

        </div>

        {/* Right Column: WhatsApp Phone Live Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          {/* Phone Frame */}
          <div className="w-full max-w-[340px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col">
            
            {/* Phone Top Notch */}
            <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 mr-2"></div>
              <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
            </div>

            {/* WA Screen Header */}
            <div className="bg-emerald-800 text-white px-3 py-2 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                  K
                </div>
                <div>
                  <p className="font-bold text-xs leading-tight">KKMTS {org.regency}</p>
                  <p className="text-[9px] text-emerald-200">Online • Gateway</p>
                </div>
              </div>
              <Smartphone className="w-4 h-4 text-emerald-300" />
            </div>

            {/* WA Chat Wallpaper & Bubble Body */}
            <div className="bg-[#E5DDD5] p-3 rounded-b-2xl min-h-[380px] max-h-[440px] overflow-y-auto flex flex-col justify-end space-y-2">
              
              <div className="bg-white rounded-lg p-3 shadow-xs border border-slate-200 text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap font-sans relative">
                {activeMessage}
                <div className="text-right text-[9px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
              </div>

            </div>

            {/* Action Bar below Phone */}
            <div className="pt-3 pb-1 px-1 flex items-center justify-between gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedText ? 'Tersalin!' : 'Salin Pesan'}
              </button>
              <button
                onClick={() => handleSendWA()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim via WA
              </button>
            </div>

          </div>

          <p className="text-[11px] text-slate-500 mt-2 text-center">
            Target: <strong>{currentTargetPhone || 'Semua Anggota'}</strong>
          </p>

        </div>

      </div>

    </div>
  );
};
