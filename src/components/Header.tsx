import React from 'react';
import { 
  Building2, 
  Calendar, 
  Settings, 
  Plus,
  Menu,
  KeyRound,
  Crown,
  Wallet,
  School,
  LogOut
} from 'lucide-react';
import { OrganizationConfig, ActiveTab, AuthSession, AppRole } from '../types';
import { ACADEMIC_YEAR_OPTIONS, formatAcademicYear, formatAcademicYearFull } from '../utils/formatters';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  org?: OrganizationConfig;
  orgConfig?: OrganizationConfig;
  session: AuthSession | null;
  pendingCount?: number;
  pendingPaymentsCount?: number;
  onOpenNewPayment: () => void;
  onOpenSettings: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  org,
  orgConfig,
  session,
  pendingCount = 0,
  pendingPaymentsCount = 0,
  onOpenNewPayment,
  onOpenSettings,
  onOpenLoginModal,
  onLogout,
  selectedYear,
  setSelectedYear,
  onToggleMobileMenu,
}) => {
  const currentOrg = org || orgConfig || {
    orgName: 'KKMTS',
    regency: 'Kota/Kabupaten',
    level: 'KKMTS'
  };

  const currentRole: AppRole = session?.role || 'ketua';
  const academicYearLabel = formatAcademicYear(selectedYear); // e.g. "TA 2026/2027"

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Ringkasan Operasional',
          subtitle: `Selamat datang ${session?.userName || 'Ketua KKMTS'}, pantauan kas & iuran ${academicYearLabel} (Juli ${selectedYear} - Juni ${selectedYear + 1}).`
        };
      case 'payments':
        return {
          title: 'Pencatatan & Penerimaan Iuran',
          subtitle: `Validasi bukti transfer dan kuitansi ${academicYearLabel} (Juli ${selectedYear} s.d. Juni ${selectedYear + 1}).`
        };
      case 'fees':
        return {
          title: 'Kelola Tarif & Pos Iuran KKMTS',
          subtitle: `Pengaturan besaran iuran wajib bulanan dan pembuatan pos iuran baru (wajib/sukarela) ${academicYearLabel}.`
        };
      case 'matrix':
        return {
          title: `Matriks Setoran 12 Bulan (${academicYearLabel})`,
          subtitle: `Rekapitulasi kepatuhan 12 bulan ajaran: Juli ${selectedYear} s.d. Juni ${selectedYear + 1}.`
        };
      case 'expenses':
        return {
          title: 'Buku Kas Keluar (BKK)',
          subtitle: `Pencatatan nota belanja, honorarium, dan pengeluaran operasional ${academicYearLabel}.`
        };
      case 'reports':
        return {
          title: 'Laporan Keuangan & BKU',
          subtitle: `Buku Kas Umum transparan ${academicYearLabel} (Juli ${selectedYear} - Juni ${selectedYear + 1}).`
        };
      case 'whatsapp':
        return {
          title: 'Pusat Notifikasi WhatsApp',
          subtitle: `Kirim kwitansi lunas, tagihan iuran personal, dan siaran kas ${academicYearLabel}.`
        };
      case 'madrasah':
        return {
          title: 'Direktori Madrasah Anggota',
          subtitle: 'Database kontak Kepala Madrasah, Bendahara, dan nomor WhatsApp.'
        };
      case 'portal':
        return {
          title: currentRole === 'anggota' ? `Portal Iuran ${session?.madrasahName || 'Madrasah'}` : 'Portal Mandiri Madrasah',
          subtitle: currentRole === 'anggota' 
            ? `Cek kewajiban yang harus dibayar dan riwayat lunas ${academicYearLabel} (Juli ${selectedYear} - Juni ${selectedYear + 1}).`
            : `Halaman cek status iuran dan upload bukti mandiri oleh madrasah ${academicYearLabel}.`
        };
      default:
        return {
          title: 'Sistem Keuangan KKMTS',
          subtitle: formatAcademicYearFull(selectedYear)
        };
    }
  };

  const { title, subtitle } = getTabTitle(activeTab);

  const getRoleHeaderBadge = () => {
    switch (currentRole) {
      case 'ketua':
        return {
          text: 'Ketua (Full Akses)',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Crown
        };
      case 'bendahara':
        return {
          text: 'Bendahara (Iuran & BKK)',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: Wallet
        };
      case 'anggota':
        return {
          text: `Anggota: ${session?.madrasahName || 'Madrasah'}`,
          color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: School
        };
    }
  };

  const roleBadge = getRoleHeaderBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          
          {/* Left Title & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {title}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${roleBadge.color}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {roleBadge.text}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Bento Status & Controls */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 shrink-0">
            
            {/* Role switch trigger pill */}
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Ganti Peran / Login Akun Lain"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Ganti Role</span>
            </button>

            {/* Academic Year Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 ml-1.5 mr-1 text-slate-500" />
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden pr-2 cursor-pointer"
                title="Pilih Tahun Ajaran (Juli - Juni)"
              >
                {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                  <option key={opt.startYear} value={opt.startYear}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={onOpenNewPayment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentRole === 'anggota' ? 'Upload Bukti Transfer' : 'Catat Iuran'}</span>
            </button>

            {/* Settings Button (Ketua only) */}
            {currentRole === 'ketua' && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Pengaturan KKMTS & Rekening"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Logout button */}
            <button
              type="button"
              onClick={onLogout}
              title="Keluar"
              className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
