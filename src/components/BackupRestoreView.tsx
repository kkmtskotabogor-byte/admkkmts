import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  HardDrive, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Calendar, 
  Building2, 
  Wallet, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Madrasah, PaymentRecord, ExpenseRecord, FeeItem, OrganizationConfig } from '../types';
import { StorageService } from '../services/storageService';
import { formatRupiah } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface BackupRestoreViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  feeItems: FeeItem[];
  org: OrganizationConfig;
  onRestoreSuccess: (newData: {
    madrasahs: Madrasah[];
    payments: PaymentRecord[];
    expenses: ExpenseRecord[];
    feeItems: FeeItem[];
    config?: OrganizationConfig;
  }) => void;
  onClearTransactions: () => void;
  onClearAllData: () => void;
  onResetToDemo: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  madrasahs,
  payments,
  expenses,
  feeItems,
  org,
  onRestoreSuccess,
  onClearTransactions,
  onClearAllData,
  onResetToDemo,
}) => {
  // Notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    stats?: {
      madrasahs: number;
      payments: number;
      expenses: number;
      feeItems: number;
      exportedAt?: string;
    };
  } | null>(null);

  // JSON Preview toggle
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Clear confirmation modals
  const [modalAction, setModalAction] = useState<'clear_transactions' | 'clear_all' | 'reset_demo' | 'confirm_restore' | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Handler: Download Backup File
  const handleDownloadBackup = () => {
    try {
      const filename = StorageService.downloadBackupFile();
      triggerNotification('success', `File cadangan berhasil diunduh: ${filename}`);
    } catch (e) {
      console.error('Backup download error', e);
      triggerNotification('error', 'Gagal membuat file cadangan.');
    }
  };

  // Handler: Copy JSON to Clipboard
  const handleCopyJSON = async () => {
    try {
      const jsonStr = StorageService.exportDatabaseJSON();
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      triggerNotification('success', 'Data cadangan JSON berhasil disalin ke clipboard!');
    } catch (e) {
      console.error('Copy to clipboard failed', e);
      triggerNotification('error', 'Gagal menyalin ke clipboard.');
    }
  };

  // Handler: File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setUploadedFileContent(text);
        const parsed = JSON.parse(text);
        const val = StorageService.validateBackupData(parsed);
        setValidationResult(val);
      } catch (err) {
        setUploadedFileContent(null);
        setValidationResult({
          isValid: false,
          error: 'File rusak atau bukan format JSON yang valid.'
        });
      }
    };
    reader.onerror = () => {
      setValidationResult({
        isValid: false,
        error: 'Gagal membaca file dari perangkat Anda.'
      });
    };
    reader.readAsText(file);
  };

  // Handler: Execute Restore
  const handleExecuteRestore = () => {
    if (!uploadedFileContent) return;
    try {
      const parsed = JSON.parse(uploadedFileContent);
      const success = StorageService.importDatabaseJSON(uploadedFileContent);
      if (success) {
        onRestoreSuccess({
          madrasahs: parsed.madrasahs || [],
          payments: parsed.payments || [],
          expenses: parsed.expenses || [],
          feeItems: parsed.feeItems || feeItems,
          config: parsed.config,
        });
        setModalAction(null);
        setUploadedFileContent(null);
        setUploadedFileName('');
        setValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        triggerNotification('success', 'Database berhasil dipulihkan dari file cadangan!');
      } else {
        triggerNotification('error', 'Gagal memulihkan database. Periksa kelengkapan data dalam file.');
      }
    } catch (err) {
      console.error('Restore failed', err);
      triggerNotification('error', 'Terjadi kesalahan saat membaca isi file backup.');
    }
  };

  // Handler: Clear Transactions
  const handleExecuteClearTransactions = () => {
    onClearTransactions();
    setModalAction(null);
    setDeleteConfirmationText('');
    triggerNotification('success', 'Semua riwayat transaksi iuran dan kas keluar telah berhasil dihapus.');
  };

  // Handler: Clear All Data
  const handleExecuteClearAll = () => {
    onClearAllData();
    setModalAction(null);
    setDeleteConfirmationText('');
    triggerNotification('success', 'Seluruh database (transaksi, madrasah, dan pos) telah dikosongkan.');
  };

  // Handler: Reset to Demo Data
  const handleExecuteResetDemo = () => {
    onResetToDemo();
    setModalAction(null);
    triggerNotification('success', 'Database berhasil diatur ulang ke data contoh awal sistem KKMTS.');
  };

  // Compute live statistics
  const totalVerifiedIncome = payments.filter(p => p.status === 'verified').reduce((acc, p) => acc + p.amount, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const approximateJsonSize = Math.round(StorageService.exportDatabaseJSON().length / 1024);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-bold">{notification.message}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-black/5"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Database Overview Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900">Manajemen Cadangan & Pemulihan Data (Backup & Restore)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Penyimpanan Lokal Browser Aktif
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
                Amankan seluruh pembukuan keuangan KKMTS dengan mencadangkan data ke file eksternal (.json). Anda dapat memulihkannya kapan saja di komputer lain atau membersihkan transaksi untuk tahun ajaran baru.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Cadangkan Sekarang</span>
            </button>
          </div>
        </div>

        {/* Live Database Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Madrasah</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{madrasahs.length} Lembaga</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total terdaftar</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Setoran Iuran</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{payments.length} Transaksi</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(totalVerifiedIncome)}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Kas Keluar (BKK)</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{expenses.length} Catatan</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(totalExpense)}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Pos Iuran</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{feeItems.length} Pos</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Wajib & Sukarela</div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <HardDrive className="w-3.5 h-3.5 text-slate-600" />
              <span>Ukuran Cadangan</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">~{approximateJsonSize} KB</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Format JSON</div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid: Backup (Left) & Restore (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Cadangkan Data (Backup) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">1. Cadangkan Data (Backup)</h4>
                  <p className="text-xs text-slate-500">Unduh seluruh rekaman database ke file JSON di komputer Anda</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Info className="w-4 h-4" />
                <span>Apa saja yang disertakan dalam file cadangan?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-emerald-950/80 pl-1">
                <li>Seluruh profil madrasah, siswa, dan kontak bendahara</li>
                <li>Seluruh riwayat setoran iuran (termasuk status validasi)</li>
                <li>Seluruh buku kas keluar (BKK) dan pos anggaran belanja</li>
                <li>Daftar master tarif dan pos iuran KKMTS</li>
                <li>Pengaturan kop surat, identitas pimpinan, dan rekening bank</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500">
              Disarankan untuk mengunduh cadangan secara berkala (misalnya setiap akhir bulan atau setelah verifikasi setoran massal) agar data Anda aman dari pembersihan riwayat browser.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Salin teks JSON ke clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Toggle Raw JSON Preview */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showJsonPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showJsonPreview ? 'Sembunyikan Cuplikan Data' : 'Lihat Cuplikan Data JSON'}</span>
              </button>

              {showJsonPreview && (
                <div className="mt-2 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl max-h-48 overflow-y-auto">
                  <pre>{StorageService.exportDatabaseJSON()}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Pulihkan Data (Restore) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-800">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">2. Pulihkan Data (Restore)</h4>
                  <p className="text-xs text-slate-500">Unggah file backup (.json) untuk memulihkan seluruh data pembukuan</p>
                </div>
              </div>
            </div>

            {/* Drag and drop / file input box */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/50">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".json,application/json" 
                onChange={handleFileChange}
                className="hidden" 
                id="restore-file-input"
              />
              <label 
                htmlFor="restore-file-input" 
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-indigo-700 hover:underline">
                    Pilih File Backup (.json)
                  </span>
                  <span className="text-slate-500 text-xs sm:text-sm"> atau seret file ke sini</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Mendukung file backup hasil ekspor dari aplikasi KKMTS Keuangan
                </p>
              </label>
            </div>

            {/* Validation Feedback & Preview */}
            {uploadedFileName && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 truncate max-w-[240px]">
                    {uploadedFileName}
                  </span>
                  {validationResult?.isValid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> File Valid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Tidak Valid
                    </span>
                  )}
                </div>

                {validationResult?.isValid && validationResult.stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500">Madrasah</div>
                      <div className="font-extrabold text-xs text-slate-900 mt-0.5">{validationResult.stats.madrasahs}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500">Iuran</div>
                      <div className="font-extrabold text-xs text-slate-900 mt-0.5">{validationResult.stats.payments}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500">Kas Keluar</div>
                      <div className="font-extrabold text-xs text-slate-900 mt-0.5">{validationResult.stats.expenses}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500">Pos Iuran</div>
                      <div className="font-extrabold text-xs text-slate-900 mt-0.5">{validationResult.stats.feeItems}</div>
                    </div>
                  </div>
                )}

                {validationResult?.error && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {validationResult.error}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={!validationResult?.isValid}
              onClick={() => setModalAction('confirm_restore')}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all ${
                validationResult?.isValid 
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Terapkan & Pulihkan Database</span>
            </button>
          </div>
        </div>

      </div>

      {/* Card 3: Hapus Semua Data & Pembersihan Database */}
      <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-800 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900">3. Hapus & Bersihkan Data Database (Zona Bahaya)</h4>
            <p className="text-xs text-slate-500">
              Gunakan opsi ini dengan hati-hati saat pergantian periode tahun ajaran baru atau jika ingin mengosongkan seluruh riwayat pembukuan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Option A: Clear Transactions Only */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <Trash2 className="w-4 h-4 text-amber-700" />
                <span>Hapus Semua Transaksi Saja</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Menghapus seluruh riwayat setoran iuran dan kas keluar (BKK) menjadi 0. <strong>Daftar madrasah dan pos tarif tetap dipertahankan</strong>. Sangat ideal untuk tutup buku tahun ajaran lama dan memulai tahun ajaran baru.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationText('');
                setModalAction('clear_transactions');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Transaksi Iuran & Kas</span>
            </button>
          </div>

          {/* Option B: Clear All Data (Total Reset to Zero) */}
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <span>Kosongkan Seluruh Data (Total)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Menghapus <strong>seluruh data</strong> tanpa tersisa: semua transaksi, seluruh direktori madrasah, dan pos iuran menjadi benar-benar kosong (0).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationText('');
                setModalAction('clear_all');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Seluruh Database</span>
            </button>
          </div>

          {/* Option C: Reset to Demo Data */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Reset ke Data Awal Demo</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Mengembalikan database ke kondisi awal resmi KKMTS Kota Bogor (51 Madrasah Tsanawiyah se-Kota Bogor, riwayat simulasi iuran, dan pos kegiatan).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalAction('reset_demo')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Contoh Demo</span>
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal: Restore Data */}
      {modalAction === 'confirm_restore' && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalAction(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Pemulihan Data</h3>
                <p className="text-xs text-slate-500">File: {uploadedFileName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin memulihkan database dari file cadangan ini? Seluruh data yang ada saat ini di browser akan digantikan dengan data yang ada di dalam file cadangan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Pulihkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Transactions */}
      {modalAction === 'clear_transactions' && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalAction(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Hapus Semua Transaksi?</h3>
                <p className="text-xs text-amber-700 font-semibold">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan menghapus seluruh <strong>{payments.length} transaksi setoran iuran</strong> dan <strong>{expenses.length} catatan kas keluar (BKK)</strong>. Data madrasah dan pos iuran tetap aman.
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold">Ketik kata <strong className="text-rose-700">HAPUS</strong> untuk mengonfirmasi:</p>
              <input
                type="text"
                placeholder="Ketik HAPUS di sini..."
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'HAPUS'}
                onClick={handleExecuteClearTransactions}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
                  deleteConfirmationText.trim().toUpperCase() === 'HAPUS'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Data */}
      {modalAction === 'clear_all' && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalAction(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-rose-900 text-base">Kosongkan Seluruh Database?</h3>
                <p className="text-xs text-rose-600 font-semibold">Semua data transaksi dan madrasah akan dihapus!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengosongkan <strong>seluruh data madrasah, semua transaksi pembayaran iuran, dan semua buku kas keluar</strong>. Pastikan Anda sudah mengunduh file cadangan jika masih membutuhkan data lama.
            </p>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">Ketik kata <strong className="text-rose-700">KOSONGKAN</strong> untuk mengonfirmasi:</p>
              <input
                type="text"
                placeholder="Ketik KOSONGKAN di sini..."
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'KOSONGKAN'}
                onClick={handleExecuteClearAll}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
                  deleteConfirmationText.trim().toUpperCase() === 'KOSONGKAN'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Kosongkan Semua Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset to Demo */}
      {modalAction === 'reset_demo' && (
        <ConfirmDeleteModal
          isOpen={modalAction === 'reset_demo'}
          title="Reset ke Data Bawaan Demo KKMTS?"
          message="Apakah Anda yakin ingin mengatur ulang seluruh database ke data contoh bawaan sistem KKMTS Kota Bogor? Semua perubahan baru yang belum dicadangkan akan ditimpa."
          confirmText="Ya, Reset ke Data Demo"
          cancelText="Batal"
          onConfirm={handleExecuteResetDemo}
          onClose={() => setModalAction(null)}
        />
      )}

    </div>
  );
};
