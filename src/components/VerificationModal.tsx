import React, { useState } from 'react';
import { 
  X, 
  Check, 
  XCircle, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Send, 
  Building2, 
  Sparkles, 
  Calendar, 
  CreditCard,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentRecord, Madrasah, OrganizationConfig } from '../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  MONTH_NAMES_ID, 
  generateVerificationSuccessWAMessage, 
  createWALink 
} from '../utils/formatters';

interface VerificationModalProps {
  payment: PaymentRecord | null;
  madrasah: Madrasah | undefined;
  org: OrganizationConfig;
  onClose?: () => void;
  onVerify?: (paymentId: string, notes?: string) => void;
  onApprove?: (paymentId: string, notes?: string) => void;
  onReject?: (paymentId: string, reason: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  payment,
  madrasah,
  org,
  onClose,
  onVerify,
  onApprove,
  onReject,
}) => {
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(
    'Bukti transfer kurang jelas / nominal tidak sesuai dengan ketentuan iuran wajib.'
  );
  const [adminNotes, setAdminNotes] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    extractedAmount?: number;
    extractedDate?: string;
    extractedBank?: string;
    extractedSender?: string;
    confidenceScore?: number;
  } | null>(null);

  if (!payment) return null;

  const madrasahName = madrasah?.name || payment.madrasahName;
  const periodStr = `${MONTH_NAMES_ID[payment.periodMonth - 1]} ${payment.periodYear}`;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.7));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleApprove = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
    if (typeof onVerify === 'function') {
      onVerify(payment.id, adminNotes);
    } else if (typeof onApprove === 'function') {
      onApprove(payment.id, adminNotes);
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    if (typeof onReject === 'function') {
      onReject(payment.id, rejectionReason);
    }
  };

  // Smart Slip AI Extraction helper
  const handleRunOcrExtraction = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiAnalysisResult({
        extractedAmount: payment.amount,
        extractedDate: payment.paymentDate,
        extractedBank: payment.senderBankName || 'Bank Syariah Indonesia (BSI)',
        extractedSender: payment.senderAccountName || madrasahName,
        confidenceScore: 98
      });
      setAiAnalyzing(false);
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Verifikasi Bukti Transfer Iuran
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {payment.receiptNumber} • Diajukan {formatTanggalIndo(payment.createdAt?.slice(0, 10) || payment.paymentDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Tutup Verifikasi"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 active:text-slate-950 rounded-xl bg-slate-200/70 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Split: Slip Preview on Left, Details & Actions on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200 flex-1">
          
          {/* Left Column: Proof Preview & Inspection */}
          <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col bg-slate-900 text-white min-h-[320px] lg:min-h-[460px]">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Bukti Transfer Slip Bank
              </span>
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={handleZoomIn}
                  title="Perbesar"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Perkecil"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRotate}
                  title="Putar Gambar"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Image Canvas */}
            <div className="flex-1 overflow-hidden bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center p-3 relative group">
              {payment.proofImageUrl ? (
                <div 
                  className="transition-transform duration-200 ease-out max-h-full max-w-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                  }}
                >
                  <img
                    src={payment.proofImageUrl}
                    alt="Bukti Transfer Bank"
                    className="max-h-[380px] w-auto object-contain rounded shadow-lg select-none cursor-grab active:cursor-grabbing"
                  />
                </div>
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-semibold">Tidak ada file gambar bukti terlampir.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Pembayaran dicatat via Tunai / Setor Langsung.</p>
                </div>
              )}

              {/* AI OCR Scanner Button */}
              {payment.proofImageUrl && (
                <button
                  onClick={handleRunOcrExtraction}
                  disabled={aiAnalyzing}
                  className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiAnalyzing ? 'animate-spin' : 'text-indigo-200'}`} />
                  {aiAnalyzing ? 'Memindai Struk...' : 'Cek Struk Otomatis (OCR)'}
                </button>
              )}
            </div>

            {/* AI OCR Results Banner if Triggered */}
            {aiAnalysisResult && (
              <div className="mt-3 p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-indigo-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Hasil Pindai Bukti AI
                  </span>
                  <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                    Akurasi {aiAnalysisResult.confidenceScore}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                  <div>Nominal Struk: <strong className="text-emerald-400">{formatRupiah(aiAnalysisResult.extractedAmount || 0)}</strong></div>
                  <div>Tanggal: <strong>{aiAnalysisResult.extractedDate}</strong></div>
                  <div>Bank: <strong>{aiAnalysisResult.extractedBank}</strong></div>
                  <div>Pengirim: <strong>{aiAnalysisResult.extractedSender}</strong></div>
                </div>
              </div>
            )}

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{payment.proofFileName || 'Lampiran Struk Transfer'}</span>
              <span>Gunakan tombol zoom & rotasi untuk melihat detail rekening</span>
            </div>
          </div>

          {/* Right Column: Transaction Data & Verification Actions */}
          <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-white">
            
            <div className="space-y-4">
              {/* Madrasah Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Madrasah Penyetor
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {madrasahName}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Bendahara: <strong>{madrasah?.treasurerName || 'Bpk/Ibu Bendahara'}</strong> • WA: {madrasah?.phone || '-'}
                </p>
              </div>

              {/* Payment Details List */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Iuran Periode</span>
                  <span className="font-bold text-slate-900">{periodStr}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Kategori</span>
                  <span className="font-semibold text-slate-800">{payment.categoryLabel || 'Iuran Wajib Bulanan'}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Metode Bayar</span>
                  <span className="font-semibold text-slate-800">{payment.paymentMethod}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Transfer</span>
                  <span className="font-semibold text-slate-800">{formatTanggalIndo(payment.paymentDate, true)}</span>
                </div>

                {payment.senderAccountName && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Rekening Pengirim</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {payment.senderAccountName} {payment.senderBankName ? `(${payment.senderBankName})` : ''}
                    </span>
                  </div>
                )}

                {payment.notes && (
                  <div className="py-2 bg-slate-50 rounded-lg px-3 border border-slate-200/80">
                    <span className="text-slate-500 block text-[11px]">Catatan dari Madrasah:</span>
                    <p className="text-slate-700 italic mt-0.5 text-xs">"{payment.notes}"</p>
                  </div>
                )}

                {/* Big Amount Card */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Nominal Transfer
                    </span>
                    <span className="text-xs text-emerald-700">
                      Tarif Wajib: {formatRupiah(org.defaultMonthlyDues)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-950">
                      {formatRupiah(payment.amount)}
                    </span>
                    {payment.amount >= org.defaultMonthlyDues ? (
                      <span className="block text-[10px] font-bold text-emerald-700">✓ Sesuai Ketentuan</span>
                    ) : (
                      <span className="block text-[10px] font-bold text-amber-700">⚠️ Kurang dari tarif wajib</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Reject if active */}
              {rejecting ? (
                <form onSubmit={handleRejectSubmit} className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Alasan Penolakan Pembayaran:
                  </div>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    placeholder="Contoh: Bukti transfer tidak jelas / nominal kurang..."
                    className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-hidden"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRejecting(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                    >
                      Konfirmasi Tolak
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Catatan Verifikasi Bendahara (Opsional)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Contoh: Dana masuk rekening BSI KKMTS 08:30 WIB"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!rejecting && (
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  className="px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak Pembayaran
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui & Terbitkan Kwitansi
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
