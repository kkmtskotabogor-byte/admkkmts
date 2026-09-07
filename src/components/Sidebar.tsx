import React from 'react';
import { 
  Building2, 
  Wallet, 
  Calendar, 
  Settings, 
  ShieldCheck, 
  School,
  ExternalLink,
  Plus,
  LayoutDashboard,
  FileSpreadsheet,
  MessageSquare,
  Crown,
  LogOut,
  KeyRound,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  Database
} from 'lucide-react';
import { ActiveTab, OrganizationConfig, AuthSession, AppRole } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  org: OrganizationConfig;
  pendingCount: number;
  session: AuthSession | null;
  onOpenNewPayment: () => void;
  onOpenSettings: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  org,
  pendingCount,
  session,
  onOpenNewPayment,
  onOpenSettings,
  onOpenLoginModal,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const currentRole: AppRole = session?.role || 'ketua';

  // Role-based Nav filtering:
  // 1. Ketua: all menus
  // 2. Bendahara: only payments & expenses
  // 3. Anggota: only portal (kewajiban & sudah dibayar)
  const allNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'payments' as ActiveTab,
      label: 'Penerimaan Iuran',
      icon: Wallet,
      badge: pendingCount > 0 ? pendingCount : null,
      roles: ['ketua', 'bendahara'] as AppRole[],
    },
    {
      id: 'fees' as ActiveTab,
      label: 'Atur Tarif & Pos Iuran',
      icon: SlidersHorizontal,
      badge: 'Tarif',
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'matrix' as ActiveTab,
      label: 'Matriks 12 Bulan',
      icon: Calendar,
      badge: null,
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Kas Keluar (BKK)',
      icon: ShieldCheck,
      badge: null,
      roles: ['ketua', 'bendahara'] as AppRole[],
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Laporan Keuangan BKU',
      icon: FileSpreadsheet,
      badge: null,
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'whatsapp' as ActiveTab,
      label: 'WhatsApp Gateway',
      icon: MessageSquare,
      badge: 'WA',
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'madrasah' as ActiveTab,
      label: 'Direktori Madrasah',
      icon: School,
      badge: null,
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'access_codes' as ActiveTab,
      label: 'Atur Kode Akses',
      icon: KeyRound,
      badge: 'PIN',
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'organization' as ActiveTab,
      label: 'Identitas & Logo',
      icon: Building2,
      badge: org.logoUrl ? null : 'Atur',
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'backup' as ActiveTab,
      label: 'Backup & Restore Data',
      icon: Database,
      badge: 'Data',
      roles: ['ketua'] as AppRole[],
    },
    {
      id: 'portal' as ActiveTab,
      label: 'Portal Iuran Madrasah',
      icon: ExternalLink,
      badge: currentRole === 'anggota' ? 'Aktif' : 'Anggota',
      roles: ['ketua', 'anggota'] as AppRole[],
    },
  ];

  const allowedNavItems = allNavItems.filter(item => item.roles.includes(currentRole));

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'ketua':
        return {
          label: 'ROLE: KETUA',
          sub: 'Semua Menu',
          color: 'bg-amber-400 text-amber-950 font-black',
          icon: Crown
        };
      case 'bendahara':
        return {
          label: 'ROLE: BENDAHARA',
          sub: 'Iuran & Kas Keluar',
          color: 'bg-emerald-400 text-emerald-950 font-black',
          icon: Wallet
        };
      case 'anggota':
        return {
          label: 'ROLE: ANGGOTA',
          sub: session?.madrasahName || 'Madrasah',
          color: 'bg-indigo-400 text-indigo-950 font-black',
          icon: School
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-emerald-950 text-emerald-50 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-emerald-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-emerald-950 font-black shadow-md shadow-emerald-500/20 overflow-hidden p-0.5 shrink-0">
                {org.logoUrl ? (
                  <img 
                    src={org.logoUrl} 
                    alt="Logo KKMTS" 
                    className="w-full h-full object-contain rounded-xl bg-white"
                  />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold tracking-tight text-white truncate">
                  {org.shortName || 'KKMTS'}
                </h1>
                <p className="text-[10px] text-emerald-300/80 font-medium truncate">
                  {org.regency || 'Sistem Keuangan'}
                </p>
              </div>
            </div>

            {/* Close button for mobile */}
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-900"
              >
                ✕
              </button>
            )}
          </div>

          {/* Active Role Card Indicator */}
          <div className="mt-4 p-3 rounded-2xl bg-emerald-900/90 border border-emerald-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${roleInfo.color}`}>
                <RoleIcon className="w-3 h-3" />
                {roleInfo.label}
              </span>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-[11px] font-bold text-emerald-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                title="Ganti Role / Login Akun Lain"
              >
                <KeyRound className="w-3 h-3" />
                Ganti
              </button>
            </div>
            <p className="text-xs font-extrabold text-white truncate">
              {session?.userName || org.chairmanName}
            </p>
            <p className="text-[10px] text-emerald-300/80 truncate">
              {session?.userTitle || roleInfo.sub}
            </p>
          </div>
        </div>

        {/* Quick Action Button inside Sidebar (Allowed for Ketua & Bendahara, or Anggota for upload) */}
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => {
              onOpenNewPayment();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{currentRole === 'anggota' ? 'Upload Bukti Transfer' : 'Setor / Catat Iuran'}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
            Menu Akses Role
          </div>

          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800/90 text-white shadow-sm border border-emerald-700/60'
                    : 'text-emerald-200/75 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-emerald-400 text-emerald-950 font-bold' 
                        : 'border border-emerald-700/80 text-emerald-400 bg-emerald-950/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </div>

                {item.badge && (
                  <span 
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badge === 'WA'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.badge === 'Publik' || item.badge === 'Anggota'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-amber-500 text-white animate-pulse shadow-xs'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Settings Footer */}
        <div className="p-4 mt-auto border-t border-emerald-900/80 bg-emerald-950/60">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center space-x-2.5 min-w-0 text-left hover:opacity-80 transition-opacity flex-1"
            >
              <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center font-extrabold text-emerald-200 shrink-0 border border-emerald-700">
                {currentRole === 'ketua' ? 'KT' : currentRole === 'bendahara' ? 'BD' : 'AG'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {session?.userName || 'Pengurus KKMTS'}
                </p>
                <p className="text-[10px] text-emerald-400/80 truncate">
                  Ganti Akun / Logout
                </p>
              </div>
            </button>

            {currentRole === 'ketua' && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Pengaturan KKMTS & Rekening"
                className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-900 rounded-xl transition-colors border border-emerald-800/80 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              title="Keluar / Ganti Role"
              className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-xl transition-colors border border-rose-900/80 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
