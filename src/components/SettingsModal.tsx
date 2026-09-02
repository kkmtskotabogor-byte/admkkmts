import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { OrganizationConfig, BankAccount } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface SettingsModalProps {
  config: OrganizationConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedConfig: OrganizationConfig) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onResetData,
}) => {
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
  const [defaultMonthlyDues, setDefaultMonthlyDues] = useState(config.defaultMonthlyDues);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(config.bankAccounts);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

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
      defaultMonthlyDues,
      bankAccounts,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
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
              onClose();
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
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1 text-xs uppercase tracking-wider text-slate-500">
              <Building2 className="w-4 h-4 text-emerald-700" /> Identitas Organisasi
            </h4>
            
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Besaran Iuran Bulanan Default per Madrasah (Rp)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={defaultMonthlyDues === 0 ? '' : defaultMonthlyDues}
                onChange={(e) => setDefaultMonthlyDues(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="Bebas isi nominal..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-emerald-700 focus:outline-hidden"
              />
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

          {/* Reset Demo Data Button */}
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
                onClick={onClose}
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
            onClose();
          }}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};
