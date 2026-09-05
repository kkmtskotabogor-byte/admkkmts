import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Link as LinkIcon, 
  Eye, 
  CreditCard, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Users, 
  FileText, 
  Crown, 
  Wallet, 
  ShieldCheck, 
  QrCode, 
  Info,
  CheckCircle2,
  ExternalLink,
  Save,
  Printer
} from 'lucide-react';
import { OrganizationConfig, BankAccount } from '../types';
import { DEFAULT_PRESET_LOGOS, LogoPreset, resizeImageToDataUrl } from '../utils/logoPresets';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { INITIAL_ORGANIZATION_CONFIG } from '../data/initialData';

interface OrganizationProfileViewProps {
  org: OrganizationConfig;
  onUpdateOrgConfig: (updated: OrganizationConfig) => void;
}

export const OrganizationProfileView: React.FC<OrganizationProfileViewProps> = ({
  org,
  onUpdateOrgConfig,
}) => {
  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'logo' | 'identity' | 'officials' | 'banking'>('logo');

  // Form states
  const [orgName, setOrgName] = useState(org.orgName);
  const [shortName, setShortName] = useState(org.shortName);
  const [level, setLevel] = useState(org.level || 'Kelompok Kerja Madrasah Tsanawiyah');
  const [regency, setRegency] = useState(org.regency);
  const [province, setProvince] = useState(org.province);
  const [address, setAddress] = useState(org.address);
  const [postalCode, setPostalCode] = useState(org.postalCode);
  const [contactEmail, setContactEmail] = useState(org.contactEmail);
  const [contactPhone, setContactPhone] = useState(org.contactPhone);
  const [website, setWebsite] = useState(org.website || '');
  const [fiscalYear, setFiscalYear] = useState<number>(org.fiscalYear || 2026);

  // Logo states
  const [logoUrl, setLogoUrl] = useState<string>(org.logoUrl || '');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Officials states
  const [chairmanName, setChairmanName] = useState(org.chairmanName);
  const [chairmanNip, setChairmanNip] = useState(org.chairmanNip || '');
  const [treasurerName, setTreasurerName] = useState(org.treasurerName);
  const [treasurerNip, setTreasurerNip] = useState(org.treasurerNip || '');
  const [secretaryName, setSecretaryName] = useState(org.secretaryName || '');

  // Banking states
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(org.bankAccounts || []);

  // UI state
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3200);
  };

  // Handle image file selection
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Format berkas tidak didukung! Harap unggah berkas gambar (PNG, JPG, SVG, atau WebP).');
      return;
    }

    // Limit to 4MB before compression
    if (file.size > 4 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar. Maksimal ukuran logo adalah 4 MB.');
      return;
    }

    try {
      setIsUploading(true);
      const dataUrl = await resizeImageToDataUrl(file, 450, 450, 0.9);
      setLogoUrl(dataUrl);
      triggerToast('Logo berhasil dimuat! Klik "Simpan Perubahan" untuk menerapkan.');
    } catch (err) {
      console.error(err);
      alert('Gagal memproses gambar logo. Silakan coba kembali.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Apply Preset Logo
  const handleApplyPreset = (preset: LogoPreset) => {
    setLogoUrl(preset.svgDataUri);
    triggerToast(`Logo preset "${preset.name}" dipilih!`);
  };

  // Remove / Reset Logo
  const handleRemoveLogo = () => {
    setLogoUrl('');
    triggerToast('Logo dikosongkan (kembali ke ikon lambang bawaan).');
  };

  // Bank handlers
  const handleAddBank = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        bankName: 'Bank Syariah Indonesia (BSI)',
        accountNumber: '',
        accountHolder: shortName || 'KKMTS',
        branch: 'KC Bogor',
        isPrimary: bankAccounts.length === 0,
      }
    ]);
  };

  const handleUpdateBank = (index: number, field: keyof BankAccount, value: any) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
  };

  const handleSetPrimaryBank = (index: number) => {
    const updated = bankAccounts.map((b, i) => ({
      ...b,
      isPrimary: i === index,
    }));
    setBankAccounts(updated);
  };

  const handleRemoveBank = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  // Submit all changes
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updatedConfig: OrganizationConfig = {
      ...org,
      orgName: orgName.trim(),
      shortName: shortName.trim(),
      level: level.trim(),
      regency: regency.trim(),
      province: province.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      website: website.trim() || undefined,
      fiscalYear: Number(fiscalYear) || 2026,
      logoUrl: logoUrl.trim() || undefined,
      chairmanName: chairmanName.trim(),
      chairmanNip: chairmanNip.trim() || undefined,
      treasurerName: treasurerName.trim(),
      treasurerNip: treasurerNip.trim() || undefined,
      secretaryName: secretaryName.trim(),
      bankAccounts,
    };

    onUpdateOrgConfig(updatedConfig);
    triggerToast('Identitas dan Logo KKMTS berhasil disimpan dan diterapkan ke seluruh sistem!');
  };

  // Reset to Defaults
  const handleResetToDefault = () => {
    onUpdateOrgConfig(INITIAL_ORGANIZATION_CONFIG);
    setOrgName(INITIAL_ORGANIZATION_CONFIG.orgName);
    setShortName(INITIAL_ORGANIZATION_CONFIG.shortName);
    setLevel(INITIAL_ORGANIZATION_CONFIG.level);
    setRegency(INITIAL_ORGANIZATION_CONFIG.regency);
    setProvince(INITIAL_ORGANIZATION_CONFIG.province);
    setAddress(INITIAL_ORGANIZATION_CONFIG.address);
    setPostalCode(INITIAL_ORGANIZATION_CONFIG.postalCode);
    setContactEmail(INITIAL_ORGANIZATION_CONFIG.contactEmail);
    setContactPhone(INITIAL_ORGANIZATION_CONFIG.contactPhone);
    setWebsite(INITIAL_ORGANIZATION_CONFIG.website || '');
    setFiscalYear(INITIAL_ORGANIZATION_CONFIG.fiscalYear);
    setLogoUrl('');
    setChairmanName(INITIAL_ORGANIZATION_CONFIG.chairmanName);
    setChairmanNip(INITIAL_ORGANIZATION_CONFIG.chairmanNip || '');
    setTreasurerName(INITIAL_ORGANIZATION_CONFIG.treasurerName);
    setTreasurerNip(INITIAL_ORGANIZATION_CONFIG.treasurerNip || '');
    setSecretaryName(INITIAL_ORGANIZATION_CONFIG.secretaryName);
    setBankAccounts(INITIAL_ORGANIZATION_CONFIG.bankAccounts);
    setShowResetConfirm(false);
    triggerToast('Seluruh identitas KKMTS dikembalikan ke setelan awal pabrik.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-emerald-100 border border-emerald-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            
            {/* Display Active Logo in Header */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-xs border-2 border-emerald-400/40 p-1 flex items-center justify-center shrink-0 shadow-md">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo Organisasi" 
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Building2 className="w-9 h-9 text-emerald-300" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <Building2 className="w-3 h-3" />
                <span>Profil Lembaga & Branding Resmi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {shortName || 'KKMTS'} — {regency || 'Kota Bogor'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl">
                Konfigurasi nama resmi, logo kop surat, struktur pimpinan, kontak sekretariat, dan rekening bank penerimaan.
              </p>
            </div>
          </div>

          {/* Quick save button in banner */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-emerald-800/60 mt-6">
          <button
            type="button"
            onClick={() => setActiveSubTab('logo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'logo'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>1. Logo & Visual Lembaga</span>
            {logoUrl && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('identity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'identity'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Identitas Lembaga & Kontak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('officials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'officials'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Pengurus & Penandatangan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('banking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'banking'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>4. Rekening Kas & QRIS</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LOGO & VISUAL LEMBAGA */}
      {/* ========================================================= */}
      {activeSubTab === 'logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Upload & Preset Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Box 1: Unggah Berkas Gambar / Drag & Drop */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Unggah Logo Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Mendukung berkas PNG transparan, JPG, SVG, atau WebP (disarankan resolusi minimal 200x200 pixel).
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ImageIcon className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-emerald-700 hover:underline">Klik untuk memilih gambar</span> atau seret & lepas ke sini
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, SVG, WebP hingga 4 MB
                  </p>
                </div>
              </div>

              {/* Input URL Alternatif */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Atau masukkan tautan URL Logo online:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://domain.sch.id/logo-kkmts.png"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputUrl.trim()) {
                        setLogoUrl(inputUrl.trim());
                        triggerToast('Logo dari tautan web berhasil dipasang!');
                      }
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Pasang
                  </button>
                </div>
              </div>

              {/* Reset / Remove Logo */}
              {logoUrl && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Logo Kustom (Gunakan Bawaan)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Box 2: Preset Pilihan Cepat Logo */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Preset Logo Resmi Pilihan
                </h3>
                <p className="text-xs text-slate-500">
                  Belum memiliki file logo? Pilih salah satu emblem vektor beresolusi tinggi di bawah ini:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {DEFAULT_PRESET_LOGOS.map((preset) => {
                  const isSelected = logoUrl === preset.svgDataUri;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-2xs border border-slate-100 flex items-center justify-center">
                        <img 
                          src={preset.svgDataUri} 
                          alt={preset.name} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">
                          {preset.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {preset.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Aktif Digunakan' : 'Pilih Logo Ini'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Live Previews on Documents & Navbar */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Box 3: Live Kop Surat Preview */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    Pratinjau Kop Surat Resmi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tampilan logo pada Kop Kwitansi, BKU Kas, dan Lembar Distribusi.
                  </p>
                </div>
              </div>

              {/* Replica of Official Letterhead */}
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-300 shadow-sm text-slate-900 space-y-3">
                <div className="border-b-2 border-slate-900 pb-3 flex items-center gap-3">
                  
                  {/* Logo Container */}
                  <div className="w-14 h-14 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 border border-slate-800 overflow-hidden shadow-2xs">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <Building2 className="w-8 h-8" />
                    )}
                  </div>

                  <div className="flex-1 text-center pr-2">
                    <p className="text-[9px] uppercase tracking-widest font-semibold text-slate-600">
                      KEMENTERIAN AGAMA REPUBLIK INDONESIA
                    </p>
                    <h4 className="text-xs font-black uppercase text-slate-950 tracking-tight leading-snug">
                      {orgName || 'KKMTS'} ({shortName || 'KKMTS KOTA BOGOR'})
                    </h4>
                    <p className="text-[9px] text-slate-600 leading-tight mt-0.5">
                      {address || 'Jl. Pemuda No. 34, Kota Bogor'} | Telp: {contactPhone || '081289123456'}
                    </p>
                  </div>
                </div>

                <div className="text-center py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    BUKTI PEMBAYARAN IURAN SAH
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1 italic">
                    [Contoh dokumen cetak resmi organisasi KKMTS]
                  </p>
                </div>
              </div>

              {/* Box 4: Sidebar Branding Preview */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Pratinjau Sudut Header Menu:
                </span>
                <div className="p-3.5 bg-emerald-950 text-white rounded-2xl flex items-center gap-3 border border-emerald-900 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-emerald-950 font-black shadow-md overflow-hidden p-0.5">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain rounded-lg bg-white"
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-emerald-950" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                      {shortName || 'KKMTS'} <span className="text-emerald-400">Pay</span>
                    </h5>
                    <p className="text-[10px] text-emerald-300/80 font-medium">
                      Sistem Keuangan Terpadu
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: IDENTITAS LEMBAGA & KONTAK */}
      {/* ========================================================= */}
      {activeSubTab === 'identity' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Informasi & Identitas Lembaga
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini tercantum dalam seluruh lembaran surat, kwitansi penerimaan, dan format ekspor laporan.
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            
            {/* Nama Lengkap */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700">Nama Organisasi Lengkap:</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Kelompok Kerja Madrasah Tsanawiyah (KKMTS)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Nama Singkat */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Singkatan / Akronim Resmi:</label>
              <input
                type="text"
                required
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="KKMTS KOTA BOGOR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-emerald-900 focus:outline-hidden uppercase"
              />
            </div>

            {/* Tingkat / Jenjang */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Jenjang Lembaga:</label>
              <input
                type="text"
                required
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Kelompok Kerja Madrasah Tsanawiyah"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Kota / Kabupaten */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Kota / Kabupaten:</label>
              <input
                type="text"
                required
                value={regency}
                onChange={(e) => setRegency(e.target.value)}
                placeholder="Kota Bogor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Provinsi */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Provinsi:</label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Jawa Barat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Alamat Kantor Sekretariat */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700">Alamat Kantor Sekretariat:</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Pemuda No. 34, Kec. Tanah Sareal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Kode Pos */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Kode Pos:</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="16161"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Email Kontak */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Resmi Organisasi:
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="kkmtskotabogor@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Telepon / WhatsApp */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telepon / WhatsApp Resmi:
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="081289123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

            {/* Website / Portal */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Website / Link Informasi (Opsional):
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://kkmts-kotabogor.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-hidden"
              />
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas Lembaga</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PENGURUS & PENANDATANGAN */}
      {/* ========================================================= */}
      {activeSubTab === 'officials' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Susunan Pengurus & Penandatangan Dokumen
              </h3>
              <p className="text-xs text-slate-500">
                Nama pimpinan ini otomatis tertera pada tanda tangan Kwitansi Pembayaran, Buku Kas Umum, dan Laporan Pertanggungjawaban.
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengurus</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            
            {/* 1. Ketua */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Ketua KKMTS</h4>
                  <span className="text-[10px] text-amber-800 font-bold">Penanggung Jawab Utama</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={chairmanName}
                  onChange={(e) => setChairmanName(e.target.value)}
                  placeholder="Drs. H. Ahmad Fauzi, M.Pd.I"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">NIP / NPK (Bila ada):</label>
                <input
                  type="text"
                  value={chairmanNip}
                  onChange={(e) => setChairmanNip(e.target.value)}
                  placeholder="197105121998031002"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-700 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 2. Sekretaris */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border-2 border-indigo-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Sekretaris KKMTS</h4>
                  <span className="text-[10px] text-indigo-800 font-bold">Administrasi & Surat</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  placeholder="M. Ridwan Hakim, S.Pd.I"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Keterangan Jabatan:</label>
                <input
                  type="text"
                  readOnly
                  value="Sekretaris Pengurus KKMTS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs"
                />
              </div>
            </div>

            {/* 3. Bendahara */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border-2 border-emerald-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Bendahara KKMTS</h4>
                  <span className="text-[10px] text-emerald-800 font-bold">Keuangan & Kwitansi</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={treasurerName}
                  onChange={(e) => setTreasurerName(e.target.value)}
                  placeholder="Hj. Siti Rohmah, S.Ag., M.M."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">NIP / NPK (Bila ada):</label>
                <input
                  type="text"
                  value={treasurerNip}
                  onChange={(e) => setTreasurerNip(e.target.value)}
                  placeholder="197508212003122001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-700 focus:outline-hidden"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Pengurus</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 4: REKENING KAS & QRIS */}
      {/* ========================================================= */}
      {activeSubTab === 'banking' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Rekening Bank Kas & QRIS Pembayaran
              </h3>
              <p className="text-xs text-slate-500">
                Informasi rekening ini ditampilkan pada Portal Mandiri Madrasah saat madrasah akan menyetor iuran.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddBank}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Tambah Rekening Bank</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Rekening</span>
              </button>
            </div>
          </div>

          {/* List of Bank Accounts */}
          <div className="space-y-4">
            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Belum ada rekening bank yang didaftarkan. Klik "Tambah Rekening Bank" di atas.
              </div>
            ) : (
              bankAccounts.map((bank, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                    bank.isPrimary
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 ${bank.isPrimary ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className="font-extrabold text-xs text-slate-900">
                        Rekening #{index + 1}
                      </span>
                      {bank.isPrimary ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Rekening Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryBank(index)}
                          className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Jadikan Utama
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBank(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Nama Bank:</label>
                      <input
                        type="text"
                        required
                        value={bank.bankName}
                        onChange={(e) => handleUpdateBank(index, 'bankName', e.target.value)}
                        placeholder="Bank Syariah Indonesia (BSI)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Nomor Rekening:</label>
                      <input
                        type="text"
                        required
                        value={bank.accountNumber}
                        onChange={(e) => handleUpdateBank(index, 'accountNumber', e.target.value)}
                        placeholder="7192830192"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-emerald-800 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Atas Nama (A.N):</label>
                      <input
                        type="text"
                        required
                        value={bank.accountHolder}
                        onChange={(e) => handleUpdateBank(index, 'accountHolder', e.target.value)}
                        placeholder="KKMTS KOTA BOGOR"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Kantor Cabang:</label>
                      <input
                        type="text"
                        value={bank.branch || ''}
                        onChange={(e) => handleUpdateBank(index, 'branch', e.target.value)}
                        placeholder="KC Bogor Pajajaran"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
                      />
                    </div>

                    {/* QRIS Link */}
                    <div className="sm:col-span-2 lg:col-span-4 space-y-1 pt-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-slate-500" />
                        URL Tautan QRIS Pembayaran (Bila ada):
                      </label>
                      <input
                        type="url"
                        value={bank.qrisUrl || ''}
                        onChange={(e) => handleUpdateBank(index, 'qrisUrl', e.target.value)}
                        placeholder="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 focus:outline-hidden font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Rekening Bank</span>
            </button>
          </div>
        </form>
      )}

      {/* Bottom Danger Zone / Reset to Default */}
      <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800">Kembalikan ke Setelan Awal</h4>
            <p className="text-slate-500 text-[11px]">
              Mengembalikan nama organisasi, pengurus, dan rekening ke data bawaan sistem KKMTS Kota Bogor.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:text-rose-700 hover:border-rose-300 font-bold transition-colors shrink-0 cursor-pointer"
        >
          Reset ke Bawaan
        </button>
      </div>

      {/* CONFIRM RESET MODAL */}
      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        title="Reset Identitas ke Setelan Awal?"
        message="Nama organisasi, kontak, logo, dan rekening bank akan dikembalikan ke pengaturan awal pabrik."
        confirmText="Ya, Reset Identitas"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleResetToDefault}
        onClose={() => setShowResetConfirm(false)}
      />

    </div>
  );
};
