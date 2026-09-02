import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Crown, 
  Wallet, 
  School, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Madrasah, OrganizationConfig, AuthSession } from '../types';
import { ADMIN_CREDENTIALS, getMadrasahAccessCode, verifyAccessCode } from '../utils/authUtils';

interface LoginPortalModalProps {
  isOpen: boolean;
  madrasahs: Madrasah[];
  org: OrganizationConfig;
  currentSession: AuthSession | null;
  onLoginSuccess: (session: AuthSession) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export const LoginPortalModal: React.FC<LoginPortalModalProps> = ({
  isOpen,
  madrasahs,
  org,
  currentSession,
  onLoginSuccess,
  onClose,
  allowClose = true,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');
  const [inputCode, setInputCode] = useState('');
  const [selectedMadrasahId, setSelectedMadrasahId] = useState<string>(madrasahs[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCodeHelper, setShowCodeHelper] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = verifyAccessCode(inputCode, madrasahs, org.chairmanName, org.treasurerName);
    if (result.success && result.session) {
      onLoginSuccess(result.session);
    } else {
      setErrorMessage(result.message || 'Kode akses tidak cocok!');
    }
  };

  const handleQuickLogin = (role: 'ketua' | 'bendahara') => {
    setErrorMessage(null);
    if (role === 'ketua') {
      onLoginSuccess({
        role: 'ketua',
        userName: org.chairmanName || ADMIN_CREDENTIALS.ketua.defaultName,
        userTitle: 'Ketua KKMTS (Full Akses Seluruh Menu)',
        accessCode: ADMIN_CREDENTIALS.ketua.code,
      });
    } else {
      onLoginSuccess({
        role: 'bendahara',
        userName: org.treasurerName || ADMIN_CREDENTIALS.bendahara.defaultName,
        userTitle: 'Bendahara KKMTS (Penerimaan Iuran & Kas Keluar)',
        accessCode: ADMIN_CREDENTIALS.bendahara.code,
      });
    }
  };

  const handleMemberQuickLogin = () => {
    const target = madrasahs.find(m => m.id === selectedMadrasahId) || madrasahs[0];
    if (target) {
      onLoginSuccess({
        role: 'anggota',
        userName: target.name,
        userTitle: `Madrasah Anggota (${target.status} - Kec. ${target.subdistrict})`,
        madrasahId: target.id,
        madrasahName: target.name,
        accessCode: getMadrasahAccessCode(target),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <KeyRound className="w-3 h-3" />
                  Portal Akses Berbasis Role
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                  Masuk ke Sistem {org.shortName || 'KKMTS'}
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Pilih peran atau masukkan kode akses resmi Anda
                </p>
              </div>
            </div>

            {allowClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-emerald-300 hover:text-white rounded-xl bg-emerald-950/50 hover:bg-emerald-900 transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('quick'); setErrorMessage(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pilihan Role Cepat
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setErrorMessage(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Input Kode Akses
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Akses Ditolak</p>
                <p className="text-[11px] text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {activeTab === 'quick' ? (
            <div className="space-y-3.5">
              
              {/* Role 1: KETUA */}
              <div 
                onClick={() => handleQuickLogin('ketua')}
                className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/40 transition-all cursor-pointer shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-900">
                        1. KETUA KKMTS
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                        Semua Menu
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {org.chairmanName}
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium mt-1">
                      ✓ Akses penuh: Dashboard, Semua Iuran, Kas Keluar, Laporan BKU, WA Gateway, Direktori & Pengaturan
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors shrink-0 ml-2" />
              </div>

              {/* Role 2: BENDAHARA */}
              <div 
                onClick={() => handleQuickLogin('bendahara')}
                className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-900">
                        2. BENDAHARA KKMTS
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        Penerimaan & Pengeluaran
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {org.treasurerName}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      ✓ Akses: Terima/Verifikasi Setoran Iuran & Pencatatan Kas Keluar (BKK)
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0 ml-2" />
              </div>

              {/* Role 3: ANGGOTA */}
              <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 space-y-3 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shrink-0">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        3. ANGGOTA (Madrasah Tsanawiyah)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                        Cek Tagihan & Bayar
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                      ✓ Akses khusus: Melihat kewajiban yang harus dibayar, riwayat yang sudah lunas & upload slip transfer
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-indigo-100">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Pilih Madrasah Anda:
                  </label>
                  <select
                    value={selectedMadrasahId}
                    onChange={(e) => setSelectedMadrasahId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {madrasahs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.status} - Kode: {getMadrasahAccessCode(m)})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleMemberQuickLogin}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Masuk sebagai Anggota Madrasah Ini</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Kode Akses Unik / PIN:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Contoh: KETUA-KKMTS, BENDAHARA-KKMTS, atau MTS01-0001"
                    className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-slate-300 focus:border-emerald-600 bg-white text-slate-900 font-mono font-bold text-sm tracking-wide uppercase focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  />
                  <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Setiap peran & setiap madrasah memiliki kode akses unik masing-masing.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verifikasi Kode & Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Code Helper Accordion */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCodeHelper(!showCodeHelper)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center justify-between w-full p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    Daftar Kode Akses Bawaan Demo
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCodeHelper ? 'rotate-180' : ''}`} />
                </button>

                {showCodeHelper && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="font-semibold text-slate-800">Ketua KKMTS:</span>
                      <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold font-mono">KETUA-KKMTS</code>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="font-semibold text-slate-800">Bendahara KKMTS:</span>
                      <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold font-mono">BENDAHARA-KKMTS</code>
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-slate-800 mb-1">Kode Unik Per Madrasah Anggota:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                        {madrasahs.map((m) => (
                          <div key={m.id} className="flex justify-between items-center bg-white p-1 rounded border border-slate-200">
                            <span className="truncate pr-2 font-sans">{m.name}:</span>
                            <span className="font-bold text-indigo-700 shrink-0">{getMadrasahAccessCode(m)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
