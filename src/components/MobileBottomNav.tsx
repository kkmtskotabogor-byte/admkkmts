import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Plus, 
  FileText, 
  Menu, 
  Wallet, 
  School, 
  CalendarRange, 
  Receipt,
  MessageSquare,
  KeyRound,
  SlidersHorizontal,
  ChevronUp
} from 'lucide-react';
import { ActiveTab, AppRole, AuthSession, OrganizationConfig } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: AppRole;
  session: AuthSession | null;
  pendingPaymentsCount?: number;
  onOpenNewPayment: () => void;
  onToggleMobileMenu: () => void;
  onOpenLoginModal: () => void;
  isMobileMenuOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  session,
  pendingPaymentsCount = 0,
  onOpenNewPayment,
  onToggleMobileMenu,
  onOpenLoginModal,
  isMobileMenuOpen,
}) => {
  // Navigation layouts tailored to role
  if (currentRole === 'ketua') {
    const isOtherActive = ['matrix', 'expenses', 'whatsapp', 'madrasah', 'access_codes', 'organization', 'fees'].includes(activeTab);

    return (
      <nav 
        aria-label="Navigasi Menu Bawah Mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all print:hidden"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${activeTab === 'dashboard' ? 'bg-emerald-50 scale-110' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Ringkasan</span>
          </button>

          {/* Tab 2: Payments / Setoran */}
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform relative ${activeTab === 'payments' ? 'bg-emerald-50 scale-110' : ''}`}>
              <CreditCard className="w-5 h-5" />
              {pendingPaymentsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {pendingPaymentsCount > 9 ? '9+' : pendingPaymentsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Setoran</span>
          </button>

          {/* Center Action Button: Input Setoran */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={onOpenNewPayment}
              aria-label="Input Pembayaran Baru"
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-2 border-white cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 4: Laporan BKU */}
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${activeTab === 'reports' ? 'bg-emerald-50 scale-110' : ''}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Laporan</span>
          </button>

          {/* Tab 5: Menu Lengkap / Drawer */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              isMobileMenuOpen || isOtherActive
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform relative ${(isMobileMenuOpen || isOtherActive) ? 'bg-emerald-50 scale-110' : ''}`}>
              <Menu className="w-5 h-5" />
              {isOtherActive && !isMobileMenuOpen && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">
              {isMobileMenuOpen ? 'Tutup' : 'Menu'}
            </span>
          </button>

        </div>
      </nav>
    );
  }

  // Role: BENDAHARA
  if (currentRole === 'bendahara') {
    return (
      <nav 
        aria-label="Navigasi Menu Bawah Bendahara"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all print:hidden"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Tab 1: Penerimaan / Setoran */}
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform relative ${activeTab === 'payments' ? 'bg-emerald-50 scale-110' : ''}`}>
              <CreditCard className="w-5 h-5" />
              {pendingPaymentsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {pendingPaymentsCount > 9 ? '9+' : pendingPaymentsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Penerimaan</span>
          </button>

          {/* Tab 2: Kas Keluar */}
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${activeTab === 'expenses' ? 'bg-emerald-50 scale-110' : ''}`}>
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Kas Keluar</span>
          </button>

          {/* Center Action Button: Input Setoran */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={onOpenNewPayment}
              aria-label="Input Pembayaran Baru"
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-2 border-white cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 4: Matriks */}
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${activeTab === 'matrix' ? 'bg-emerald-50 scale-110' : ''}`}>
              <CalendarRange className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Matriks</span>
          </button>

          {/* Tab 5: Menu Lengkap */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              isMobileMenuOpen
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${isMobileMenuOpen ? 'bg-emerald-50 scale-110' : ''}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">
              {isMobileMenuOpen ? 'Tutup' : 'Menu'}
            </span>
          </button>

        </div>
      </nav>
    );
  }

  // Role: ANGGOTA (Madrasah)
  return (
    <nav 
      aria-label="Navigasi Menu Bawah Anggota Madrasah"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all print:hidden"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        
        {/* Tab 1: Portal Iuran Saya */}
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'portal'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${activeTab === 'portal' ? 'bg-emerald-50 scale-110' : ''}`}>
            <School className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Iuran Saya</span>
        </button>

        {/* Center Action Button: Bayar / Setor Iuran */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenNewPayment}
            aria-label="Kirim Bukti Pembayaran Iuran"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-2 border-white cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Ganti Akun / Peran */}
        <button
          type="button"
          onClick={onOpenLoginModal}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Ganti Akun</span>
        </button>

      </div>
    </nav>
  );
};
