import React, { useState, useRef } from 'react';
import { 
  Settings, 
  X, 
  Save, 
  Building2, 
  CreditCard, 
  DollarSign, 
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Users,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Database,
  Download
} from 'lucide-react';
import { OrganizationConfig, BankAccount } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { resizeImageToDataUrl } from '../utils/logoPresets';
import { StorageService } from '../services/storageService';

interface SettingsModalProps {
  config: OrganizationConfig;
  isOpen: boolean;
  onClose?: () => void;
  onSave: (updatedConfig: OrganizationConfig) => void;
  onResetData: () => void;
  onNavigateToOrgProfile?: () => void;
  onNavigateToBackup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onResetData,
  onNavigateToOrgProfile,
  onNavigateToBackup,
}) => {
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  const [orgName, setOrgName] = useState(config.orgName);
  const [shortName, setShortName] = useState(config.shortName);
  const [regency, setRegency] = useState(config.regency);
  const [province, setProvince] = useState(config.province);
  const [address, setAddress] = useState(config.address);
  const [postalCode, setPostalCode] = useState(config.postalCode);
  const [contactEmail, setContactEmail] = useState(config.contactEmail);
  const [contactPhone, setContactPhone] = useState(config.contactPhone);
  const [chairmanName, setChairmanName] = useState(config.chairmanName);
  const [chairmanNip, setChairmanNip] = useState(config.chairmanNip || '');
  const [treasurerName, setTreasurerName] = useState(config.treasurerName);
  const [treasurerNip, setTreasurerNip] = useState(config.treasurerNip || '');
  const [logoUrl, setLogoUrl] = useState<string>(config.logoUrl || '');
  const [defaultMonthlyDues, setDefaultMonthlyDues] = useState(config.defaultMonthlyDues);
  const [duesPerStudent, setDuesPerStudent] = useState<number>(config.duesPerStudent || 3000);
  const [duesCalculationType, setDuesCalculationType] = useState<'per_student' | 'fixed_flat'>((config.duesCalculationType as any) || 'per_student');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(config.bankAccounts);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleModalLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await resizeImageToDataUrl(file, 400, 400, 0.9);
        setLogoUrl(dataUrl);
      } catch (err) {
        alert('Gagal memproses gambar logo.');
      }
    }
  };

  const handleAddBank = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        bankName: 'Bank Syariah Indonesia (BSI)',
        accountNumber: '7123456789',
        accountHolder: 'KKMTS KOTA BOGOR',
      }
    ]);
  };

  const handleRemoveBank = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const handleUpdateBank = (index: number, field: keyof BankAccount, value: string) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: OrganizationConfig = {
      ...config,
      orgName: orgName.trim(),
      shortName: shortName.trim(),
      regency: regency.trim(),
      province: province.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      chairmanName: chairmanName.trim(),
      chairmanNip: chairmanNip.trim() || undefined,
      treasurerName: treasurerName.trim(),
      treasurerNip: treasurerNip.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      defaultMonthlyDues,
      duesPerStudent,
      duesCalculationType,
      bankAccounts,
    };
    onSave(updated);
    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-2 bg-slate-200 text-slate-800 rounded-xl shrink-0">
              <Settings className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">Pengaturan Organisasi KKMTS</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Kop kwitansi, data pengurus, tarif iuran, dan rekening penerima</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Tutup Pengaturan"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 active:text-slate-950 rounded-xl bg-slate-200/70 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Section: Identitas Organisasi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
                <Building2 className="w-4 h-4 text-emerald-700" /> Identitas Organisasi & Logo
              </h4>
              {onNavigateToOrgProfile && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToOrgProfile();
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Menu Lengkap Logo KKMTS</span>
                </button>
              )}
            </div>

            {/* Quick Logo Upload in Modal */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white border border-emerald-300 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-7 h-7 text-emerald-700" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Logo Resmi Lembaga</span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    onChange={handleModalLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar</span>
                  </button>
                  {onNavigateToOrgProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onNavigateToOrgProfile();
                      }}
                      className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Pilih Preset Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Organisasi Lengkap</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Singkatan</label>
                <input
                  type="text"
                  required
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input
                  type="text"
                  required
                  value={regency}
                  onChange={(e) => setRegency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Sekretariat</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP Resmi</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Pengurus Otorisator & Kwitansi */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1 text-xs uppercase tracking-wider text-slate-500">
              Penandatangan Kwitansi & Laporan Resmi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Ketua KKMTS</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Ketua"
                  value={chairmanName}
                  onChange={(e) => setChairmanName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-hidden"
                />
                <input
                  type="text"
                  placeholder="NIP (Kosongkan jika non-PNS)"
                  value={chairmanNip}
                  onChange={(e) => setChairmanNip(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Bendahara KKMTS</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Bendahara"
                  value={treasurerName}
                  onChange={(e) => setTreasurerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-hidden"
                />
                <input
                  type="text"
                  placeholder="NIP (Kosongkan jika non-PNS)"
                  value={treasurerNip}
                  onChange={(e) => setTreasurerNip(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Tarif Iuran & Rekening */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1 text-xs uppercase tracking-wider text-slate-500">
              <DollarSign className="w-4 h-4 text-emerald-700" /> Tarif Iuran & Rekening Bank
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                <label className="block font-bold text-emerald-950 text-xs flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  Tarif Iuran per Siswa (Rp / Siswa)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={duesPerStudent === 0 ? '' : duesPerStudent}
                    onChange={(e) => setDuesPerStudent(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="3000"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-emerald-300 bg-white font-black text-emerald-800 text-sm focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-emerald-800">
                  Tagihan tiap MTs = (Jumlah Siswa × Rp {duesPerStudent.toLocaleString('id-ID')}) / bulan
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-800 text-xs">
                  Model Perhitungan Iuran
                </label>
                <select
                  value={duesCalculationType}
                  onChange={(e) => setDuesCalculationType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 text-xs focus:outline-hidden"
                >
                  <option value="per_student">Proporsional per Siswa (Rp 3.000 / Siswa)</option>
                  <option value="fixed">Flat Rate Tetap per Madrasah</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  {duesCalculationType === 'per_student' ? 'Tiap MTs beda iuran sesuai jumlah murid' : 'Semua MTs nominal iuran sama rata'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">Daftar Rekening Bank Tujuan:</label>
                <button
                  type="button"
                  onClick={handleAddBank}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Rekening
                </button>
              </div>

              {bankAccounts.map((b, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nama Bank (cth: BSI)"
                    value={b.bankName}
                    onChange={(e) => handleUpdateBank(i, 'bankName', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="No. Rekening"
                    value={b.accountNumber}
                    onChange={(e) => handleUpdateBank(i, 'accountNumber', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Atas Nama"
                      value={b.accountHolder}
                      onChange={(e) => handleUpdateBank(i, 'accountHolder', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs flex-1"
                    />
                    {bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBank(i)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database & Backup Management Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Cadangan & Pemulihan Data (Backup & Restore)</h4>
                  <p className="text-[11px] text-slate-500">Unduh atau pulihkan seluruh database iuran & kas KKMTS</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  StorageService.downloadBackupFile();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Backup (.json)</span>
              </button>

              {onNavigateToBackup && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToBackup();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Buka Menu Backup & Restore Lengkap</span>
                </button>
              )}
            </div>
          </div>

          {/* Reset Demo Data Button & Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowResetConfirm(true);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 active:text-rose-800 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Data Awal Demo
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ConfirmDeleteModal
          isOpen={showResetConfirm}
          title="Reset ke Data Bawaan Sistem?"
          message="Apakah Anda yakin ingin mengatur ulang seluruh data transaksi iuran, catatan kas keluar, dan direktori madrasah ke data contoh awal? Semua data yang baru Anda tambahkan akan direset."
          confirmText="Ya, Reset Semua Data"
          cancelText="Batal"
          onConfirm={() => {
            onResetData();
            setShowResetConfirm(false);
            handleClose();
          }}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};
