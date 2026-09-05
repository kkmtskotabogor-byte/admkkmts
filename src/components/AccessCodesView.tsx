import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
  Crown, 
  Wallet, 
  School, 
  Search, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Printer, 
  ExternalLink, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Lock, 
  AlertCircle,
  Download,
  Info,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Madrasah, OrganizationConfig, AuthSession } from '../types';
import { 
  ADMIN_CREDENTIALS, 
  getMadrasahAccessCode, 
  getDefaultMadrasahAccessCode, 
  getKetuaAccessCode, 
  getBendaharaAccessCode, 
  generateRandomAccessCode 
} from '../utils/authUtils';
import { createWALink, generateAccessCodeWAMessage } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AccessCodesViewProps {
  madrasahs: Madrasah[];
  org: OrganizationConfig;
  onUpdateMadrasah: (updated: Madrasah) => void;
  onUpdateMultipleMadrasahs: (updatedList: Madrasah[]) => void;
  onUpdateOrgConfig: (updated: OrganizationConfig) => void;
  onSwitchSession?: (session: AuthSession) => void;
}

export const AccessCodesView: React.FC<AccessCodesViewProps> = ({
  madrasahs,
  org,
  onUpdateMadrasah,
  onUpdateMultipleMadrasahs,
  onUpdateOrgConfig,
  onSwitchSession,
}) => {
  // Pimpinan state
  const [ketuaCode, setKetuaCode] = useState<string>(() => getKetuaAccessCode(org));
  const [bendaharaCode, setBendaharaCode] = useState<string>(() => getBendaharaAccessCode(org));
  const [showKetuaCode, setShowKetuaCode] = useState<boolean>(false);
  const [showBendaharaCode, setShowBendaharaCode] = useState<boolean>(false);
  const [isPimpinanSaved, setIsPimpinanSaved] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'default' | 'negeri' | 'swasta'>('all');

  // Inline editing state for madrasahs
  const [editingCodes, setEditingCodes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    madrasahs.forEach(m => {
      initial[m.id] = getMadrasahAccessCode(m);
    });
    return initial;
  });

  // Modal states
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showConfirmMassGenerate, setShowConfirmMassGenerate] = useState<boolean>(false);
  const [showConfirmMassReset, setShowConfirmMassReset] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3000);
  };

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeKey(key);
    triggerToast(`Kode akses untuk ${label} berhasil disalin: ${text}`);
    setTimeout(() => {
      setCopiedCodeKey(null);
    }, 2000);
  };

  // Save Pimpinan Access Codes
  const handleSavePimpinan = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKetua = ketuaCode.trim().toUpperCase() || ADMIN_CREDENTIALS.ketua.code;
    const cleanBendahara = bendaharaCode.trim().toUpperCase() || ADMIN_CREDENTIALS.bendahara.code;

    if (cleanKetua === cleanBendahara) {
      alert('Kode Ketua dan Bendahara tidak boleh sama!');
      return;
    }

    onUpdateOrgConfig({
      ...org,
      ketuaAccessCode: cleanKetua,
      bendaharaAccessCode: cleanBendahara,
    });

    setKetuaCode(cleanKetua);
    setBendaharaCode(cleanBendahara);
    setIsPimpinanSaved(true);
    triggerToast('Kode akses pimpinan (Ketua & Bendahara) berhasil diperbarui!');
    setTimeout(() => setIsPimpinanSaved(false), 2500);
  };

  // Reset Pimpinan to Defaults
  const handleResetKetuaToDefault = () => {
    setKetuaCode(ADMIN_CREDENTIALS.ketua.code);
    onUpdateOrgConfig({
      ...org,
      ketuaAccessCode: ADMIN_CREDENTIALS.ketua.code,
    });
    triggerToast('Kode akses Ketua direset ke bawaan: ' + ADMIN_CREDENTIALS.ketua.code);
  };

  const handleResetBendaharaToDefault = () => {
    setBendaharaCode(ADMIN_CREDENTIALS.bendahara.code);
    onUpdateOrgConfig({
      ...org,
      bendaharaAccessCode: ADMIN_CREDENTIALS.bendahara.code,
    });
    triggerToast('Kode akses Bendahara direset ke bawaan: ' + ADMIN_CREDENTIALS.bendahara.code);
  };

  // Generate random pimpinan
  const handleGenerateKetua = () => {
    const newCode = `KT-${Math.floor(1000 + Math.random() * 9000)}`;
    setKetuaCode(newCode);
  };

  const handleGenerateBendahara = () => {
    const newCode = `BD-${Math.floor(1000 + Math.random() * 9000)}`;
    setBendaharaCode(newCode);
  };

  // Madrasah Code Updates
  const handleMadrasahCodeChange = (id: string, value: string) => {
    setEditingCodes(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveSingleMadrasahCode = (madrasah: Madrasah) => {
    const newCode = (editingCodes[madrasah.id] || '').trim().toUpperCase();
    const defaultCode = getDefaultMadrasahAccessCode(madrasah);

    // If newCode equals default code or empty, remove customAccessCode
    const customAccessCode = newCode && newCode !== defaultCode ? newCode : undefined;

    const updated: Madrasah = {
      ...madrasah,
      customAccessCode,
    };

    onUpdateMadrasah(updated);
    setEditingCodes(prev => ({
      ...prev,
      [madrasah.id]: customAccessCode || defaultCode,
    }));
    triggerToast(`Kode akses untuk ${madrasah.name} tersimpan: ${customAccessCode || defaultCode}`);
  };

  const handleGenerateSingleMadrasah = (madrasah: Madrasah) => {
    const randomCode = generateRandomAccessCode(`MTS${madrasah.id.replace('mts-', '')}`);
    handleMadrasahCodeChange(madrasah.id, randomCode);
    const updated: Madrasah = {
      ...madrasah,
      customAccessCode: randomCode,
    };
    onUpdateMadrasah(updated);
    triggerToast(`Kode akses baru digenerate untuk ${madrasah.name}: ${randomCode}`);
  };

  const handleResetSingleMadrasah = (madrasah: Madrasah) => {
    const defaultCode = getDefaultMadrasahAccessCode(madrasah);
    handleMadrasahCodeChange(madrasah.id, defaultCode);
    const updated: Madrasah = {
      ...madrasah,
      customAccessCode: undefined,
    };
    onUpdateMadrasah(updated);
    triggerToast(`Kode akses ${madrasah.name} dikembalikan ke format standar: ${defaultCode}`);
  };

  // Mass Operations
  const handleConfirmMassGenerate = () => {
    const updatedList = madrasahs.map((m, idx) => {
      const padNum = String(idx + 1).padStart(2, '0');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const newCode = `MTS${padNum}-${randomPart}`;
      return {
        ...m,
        customAccessCode: newCode,
      };
    });

    onUpdateMultipleMadrasahs(updatedList);
    
    // update local state
    const newEditing: Record<string, string> = {};
    updatedList.forEach(m => {
      newEditing[m.id] = m.customAccessCode || getDefaultMadrasahAccessCode(m);
    });
    setEditingCodes(newEditing);

    setShowConfirmMassGenerate(false);
    triggerToast('Berhasil meng-generate kode acak baru untuk seluruh Madrasah anggota!');
  };

  const handleConfirmMassReset = () => {
    const updatedList = madrasahs.map(m => ({
      ...m,
      customAccessCode: undefined,
    }));

    onUpdateMultipleMadrasahs(updatedList);

    const newEditing: Record<string, string> = {};
    updatedList.forEach(m => {
      newEditing[m.id] = getDefaultMadrasahAccessCode(m);
    });
    setEditingCodes(newEditing);

    setShowConfirmMassReset(false);
    triggerToast('Seluruh kode akses Madrasah telah direset ke format standar bawaan.');
  };

  // Test Login as Madrasah
  const handleTestLogin = (m: Madrasah) => {
    if (onSwitchSession) {
      const code = getMadrasahAccessCode(m);
      onSwitchSession({
        role: 'anggota',
        userName: m.name,
        userTitle: `Madrasah Anggota (${m.status} - Kec. ${m.subdistrict})`,
        madrasahId: m.id,
        madrasahName: m.name,
        accessCode: code,
      });
      triggerToast(`Beralih ke Portal Mandiri ${m.name}`);
    }
  };

  // Filtered Madrasahs
  const filteredMadrasahs = useMemo(() => {
    return madrasahs.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nsm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.npsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subdistrict.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (editingCodes[m.id] || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'custom') return !!m.customAccessCode;
      if (filterType === 'default') return !m.customAccessCode;
      if (filterType === 'negeri') return m.status === 'Negeri';
      if (filterType === 'swasta') return m.status === 'Swasta';
      return true;
    });
  }, [madrasahs, searchQuery, filterType, editingCodes]);

  const customCount = madrasahs.filter(m => !!m.customAccessCode).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-emerald-100 border border-emerald-700 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Banner / Summary Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pusat Manajemen Kredensial & Autentikasi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pengaturan & Distribusi Kode Akses
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/85 leading-relaxed">
              Atur kode PIN/password login untuk <strong>Ketua</strong>, <strong>Bendahara</strong>, dan <strong>{madrasahs.length} Madrasah Tsanawiyah</strong> anggota {org.shortName || 'KKMTS'}. Bagikan kredensial melalui WhatsApp atau cetak lembar distribusi resmi untuk koordinasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Cetak Lembar Distribusi</span>
            </button>
          </div>
        </div>

        {/* Mini stats counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/60 text-xs">
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 text-[11px] block font-medium">Total Akun Terdaftar</span>
            <span className="text-lg font-black text-white">{madrasahs.length + 2} Akun</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 text-[11px] block font-medium">Akun Pimpinan</span>
            <span className="text-lg font-black text-amber-300">2 (Ketua & Bendahara)</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 text-[11px] block font-medium">Madrasah Anggota</span>
            <span className="text-lg font-black text-white">{madrasahs.length} MTs</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 text-[11px] block font-medium">Kode Kustom Aktif</span>
            <span className="text-lg font-black text-teal-300">{customCount} MTs</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: PIMPINAN KKMTS ACCESS CODES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Kode Akses Manajemen Pimpinan
            </h3>
            <p className="text-xs text-slate-500">
              Kode khusus yang digunakan Ketua dan Bendahara untuk mengakses fitur finansial utama.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePimpinan} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* KETUA CARD */}
          <div className="bg-white p-5 rounded-2xl border-2 border-amber-200 shadow-xs space-y-3.5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-slate-900">Ketua KKMTS</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                      Full Akses
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{org.chairmanName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(ketuaCode, 'ketua', 'Ketua KKMTS')}
                title="Salin Kode Akses"
                className="p-1.5 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-amber-50 cursor-pointer"
              >
                {copiedCodeKey === 'ketua' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kode Akses / PIN Ketua:
              </label>
              <div className="relative flex items-center">
                <input
                  type={showKetuaCode ? 'text' : 'password'}
                  required
                  value={ketuaCode}
                  onChange={(e) => setKetuaCode(e.target.value.toUpperCase())}
                  placeholder="KETUA-KKMTS"
                  className="w-full pl-3.5 pr-20 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-wider text-slate-900 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKetuaCode(!showKetuaCode)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showKetuaCode ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showKetuaCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateKetua}
                    className="p-1 text-amber-600 hover:text-amber-800 cursor-pointer"
                    title="Generate Acak"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetKetuaToDefault}
                className="text-slate-500 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset bawaan ({ADMIN_CREDENTIALS.ketua.code})
              </button>
              <span className="text-slate-400">Hak Akses: Seluruh Menu</span>
            </div>
          </div>

          {/* BENDAHARA CARD */}
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3.5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-slate-900">Bendahara KKMTS</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      Iuran & BKK
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{org.treasurerName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(bendaharaCode, 'bendahara', 'Bendahara KKMTS')}
                title="Salin Kode Akses"
                className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer"
              >
                {copiedCodeKey === 'bendahara' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kode Akses / PIN Bendahara:
              </label>
              <div className="relative flex items-center">
                <input
                  type={showBendaharaCode ? 'text' : 'password'}
                  required
                  value={bendaharaCode}
                  onChange={(e) => setBendaharaCode(e.target.value.toUpperCase())}
                  placeholder="BENDAHARA-KKMTS"
                  className="w-full pl-3.5 pr-20 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-wider text-slate-900 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowBendaharaCode(!showBendaharaCode)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showBendaharaCode ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showBendaharaCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBendahara}
                    className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                    title="Generate Acak"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetBendaharaToDefault}
                className="text-slate-500 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset bawaan ({ADMIN_CREDENTIALS.bendahara.code})
              </button>
              <span className="text-slate-400">Hak Akses: Penerimaan & Kas Keluar</span>
            </div>
          </div>

          {/* Action Row for Pimpinan Form */}
          <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isPimpinanSaved ? 'Tersimpan!' : 'Simpan Perubahan Kode Pimpinan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: MADRASAH MEMBER ACCESS CODES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        
        {/* Header toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600" />
              2. Kode Akses Madrasah Anggota ({filteredMadrasahs.length} MTs)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap MTs menggunakan kode unik ini untuk masuk ke Portal Mandiri, melihat tagihan & kwitansi.
            </p>
          </div>

          {/* Mass Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmMassGenerate(true)}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Acak Semua Kode MTs</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmMassReset(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua ke Standar</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama madrasah, NSM, kecamatan, atau kode..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Filter:
            </span>
            {(['all', 'custom', 'default', 'negeri', 'swasta'] as const).map(type => {
              const labels = {
                all: 'Semua',
                custom: `Kustom (${customCount})`,
                default: 'Standar',
                negeri: 'Negeri',
                swasta: 'Swasta',
              };
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    filterType === type
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Madrasah & Kontak</th>
                <th className="py-3 px-4 min-w-[120px]">NSM / NPSN</th>
                <th className="py-3 px-4 min-w-[200px]">Kode Akses Aktif</th>
                <th className="py-3 px-4 min-w-[100px] text-center">Tipe Kode</th>
                <th className="py-3 px-4 text-center min-w-[180px]">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMadrasahs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ditemukan madrasah yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredMadrasahs.map((m, idx) => {
                  const currentCode = editingCodes[m.id] || getMadrasahAccessCode(m);
                  const isCustom = !!m.customAccessCode;
                  const isModifiedLocally = currentCode !== getMadrasahAccessCode(m);
                  const waMessage = generateAccessCodeWAMessage(
                    m.headmasterName || m.treasurerName || 'Kepala Madrasah',
                    m.name,
                    currentCode,
                    org
                  );
                  const waLink = createWALink(m.phone, waMessage);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{m.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            m.status === 'Negeri' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>Kamad: {m.headmasterName}</span> • <span className="text-slate-600 font-medium">WA: {m.phone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Kec. {m.subdistrict} • {m.studentCount || 0} Siswa
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <div>NSM: <strong className="text-slate-800">{m.nsm}</strong></div>
                        <div className="text-slate-400">NPSN: {m.npsn}</div>
                      </td>

                      {/* Code input field */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentCode}
                            onChange={(e) => handleMadrasahCodeChange(m.id, e.target.value.toUpperCase())}
                            onBlur={() => {
                              if (isModifiedLocally) {
                                handleSaveSingleMadrasahCode(m);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs tracking-wider uppercase transition-all w-36 ${
                              isCustom
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 focus:border-emerald-500'
                                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
                            }`}
                          />
                          
                          {/* Save indicator / button */}
                          {isModifiedLocally && (
                            <button
                              type="button"
                              onClick={() => handleSaveSingleMadrasahCode(m)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs text-[10px] font-bold cursor-pointer"
                              title="Simpan Kode"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick copy button */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentCode, m.id, m.name)}
                            title="Salin Kode Akses"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            {copiedCodeKey === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isCustom ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            Kustom
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Standar
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Generate Random Button */}
                          <button
                            type="button"
                            onClick={() => handleGenerateSingleMadrasah(m)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer"
                            title="Generate Kode Acak Baru"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Reset to standard button */}
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleResetSingleMadrasah(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Reset ke Kode Standar"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* WhatsApp Direct Send Button */}
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Kirim Kode Akses via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Kirim WA</span>
                          </a>

                          {/* Test Login as this Member */}
                          {onSwitchSession && (
                            <button
                              type="button"
                              onClick={() => handleTestLogin(m)}
                              className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                              title="Uji coba masuk sebagai madrasah ini"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Tes Login</span>
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer notes */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              Tip: Madrasah juga dapat login menggunakan nomor <strong>NSM</strong> atau <strong>NPSN</strong> resmi jika lupa kode akses.
            </span>
          </div>
          <span className="font-semibold text-slate-700">
            Total {filteredMadrasahs.length} dari {madrasahs.length} Madrasah
          </span>
        </div>

      </div>

      {/* CONFIRMATION MODAL: MASS GENERATE */}
      <ConfirmDeleteModal
        isOpen={showConfirmMassGenerate}
        title="Generate Kode Acak untuk Semua MTs?"
        message="Tindakan ini akan membuatkan kode akses acak baru (format MTSXX-XXXX) untuk seluruh madrasah anggota. Kode sebelumnya akan diganti."
        confirmText="Ya, Generate Semua"
        cancelText="Batal"
        isDestructive={false}
        onConfirm={handleConfirmMassGenerate}
        onClose={() => setShowConfirmMassGenerate(false)}
      />

      {/* CONFIRMATION MODAL: MASS RESET */}
      <ConfirmDeleteModal
        isOpen={showConfirmMassReset}
        title="Reset Semua Kode ke Format Standar?"
        message="Seluruh madrasah akan dikembalikan menggunakan kode akses standar bawaan (berdasarkan ID dan 4 digit akhir NSM)."
        confirmText="Ya, Reset Semua"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleConfirmMassReset}
        onClose={() => setShowConfirmMassReset(false)}
      />

      {/* MODAL PRINT / LEMBAR DISTRIBUSI KODE AKSES */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Lembar Distribusi Kode Akses Resmi ({org.shortName || 'KKMTS'})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:p-0">
              
              {/* Kop Surat */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center gap-4 text-center">
                {org.logoUrl ? (
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0">
                    <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : null}
                <div className="flex-1 space-y-1">
                  <h2 className="font-black text-base sm:text-lg tracking-wide uppercase text-slate-950">
                    {org.orgName.toUpperCase()}
                  </h2>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-700 uppercase">
                    {org.level.toUpperCase()} {org.regency.toUpperCase()} - {org.province.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {org.address} | Telp: {org.contactPhone} | Email: {org.contactEmail}
                  </p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm uppercase underline decoration-1 underline-offset-4">
                  DAFTAR DISTRIBUSI KODE AKSES PORTAL MANDIRI MADRASAH
                </h4>
                <p className="text-xs text-slate-600">
                  Tahun Anggaran / Periode: {org.fiscalYear || 2026}
                </p>
              </div>

              {/* Instructions Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800">PETUNJUK PENGGUNAAN:</p>
                <ol className="list-decimal list-inside text-slate-600 space-y-0.5 text-[11px]">
                  <li>Buka Sistem Iuran & Keuangan Terpadu KKMTS pada web browser.</li>
                  <li>Pilih menu <strong>Ganti Role / Masuk Portal</strong> lalu masukkan <strong>Kode Akses</strong> madrasah Anda.</li>
                  <li>Kode akses bersifat rahasia madrasah. Simpan dengan aman untuk verifikasi pembayaran dan cetak kuitansi.</li>
                </ol>
              </div>

              {/* Table of Credentials */}
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-center w-8">No</th>
                    <th className="py-2 px-3 border-r border-slate-300">Nama Madrasah</th>
                    <th className="py-2 px-3 border-r border-slate-300">NSM / NPSN</th>
                    <th className="py-2 px-3 border-r border-slate-300">Kepala Madrasah</th>
                    <th className="py-2 px-3 border-r border-slate-300 text-center">Kode Akses / PIN</th>
                    <th className="py-2 px-3 text-center w-28">Paraf Terima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {madrasahs.map((m, i) => (
                    <tr key={m.id} className="text-[11px]">
                      <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3 font-extrabold text-slate-900 border-r border-slate-200">
                        {m.name}
                      </td>
                      <td className="py-2 px-3 font-mono border-r border-slate-200">
                        {m.nsm}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        {m.headmasterName}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black text-emerald-800 border-r border-slate-200">
                        {getMadrasahAccessCode(m)}
                      </td>
                      <td className="py-2 px-3 border-slate-200 text-center text-slate-400">
                        .....................
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs gap-8">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Ketua KKMTS {org.regency}</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">[Tanda Tangan & Stempel]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 underline">{org.chairmanName}</p>
                  {org.chairmanNip && <p className="text-[10px] text-slate-500">NIP. {org.chairmanNip}</p>}
                </div>

                <div>
                  <p className="text-slate-500">{org.regency}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold text-slate-900">Bendahara KKMTS</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">[Tanda Tangan]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 underline">{org.treasurerName}</p>
                  {org.treasurerNip && <p className="text-[10px] text-slate-500">NIP. {org.treasurerNip}</p>}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
