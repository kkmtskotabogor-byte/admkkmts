import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Send, 
  CheckCircle2, 
  Copy, 
  Share2, 
  QrCode, 
  ShieldCheck, 
  Download,
  Building2
} from 'lucide-react';
import { PaymentRecord, Madrasah, OrganizationConfig } from '../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  terbilang, 
  MONTH_NAMES_ID, 
  generateVerificationSuccessWAMessage,
  createWALink 
} from '../utils/formatters';

interface ReceiptModalProps {
  payment: PaymentRecord | null;
  madrasah: Madrasah | undefined;
  org: OrganizationConfig;
  onClose: () => void;
  onMarkNotified?: (paymentId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  madrasah,
  org,
  onClose,
  onMarkNotified,
}) => {
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!payment) return null;

  const periodStr = `${MONTH_NAMES_ID[payment.periodMonth - 1]} ${payment.periodYear}`;
  const madrasahName = madrasah?.name || payment.madrasahName;
  const targetPhone = madrasah?.phone || '';

  const waMessage = generateVerificationSuccessWAMessage(payment, madrasah, org);
  const waUrl = createWALink(targetPhone, waMessage);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWA = () => {
    if (onMarkNotified) {
      onMarkNotified(payment.id);
    }
    window.open(waUrl, '_blank');
  };

  // QR verification payload URL (or validation string)
  const qrValidationUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `SAH-KKMTS-KWITANSI:${payment.receiptNumber}|MADRASAH:${madrasahName}|NOMINAL:${payment.amount}|STATUS:${payment.status}|VERIFIKATOR:${payment.verifiedBy || org.treasurerName}`
  )}`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:max-w-none print:w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">Kwitansi Pembayaran Resmi</h3>
              <p className="text-xs text-slate-500 truncate">{payment.receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Cetak PDF
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              aria-label="Tutup Kwitansi"
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 active:text-slate-950 rounded-xl bg-slate-200/70 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kwitansi Body (Printable Area) */}
        <div ref={receiptPrintRef} className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white print:p-8">
          
          {/* Header Kop Surat KKMTS */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl shrink-0 print:border print:border-slate-800">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center pr-10">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-600">
                KEMENTERIAN AGAMA REPUBLIK INDONESIA
              </p>
              <h2 className="text-base sm:text-lg font-extrabold uppercase text-slate-950 tracking-tight">
                {org.orgName} ({org.shortName})
              </h2>
              <p className="text-xs text-slate-600">
                {org.address}, Kodepos {org.postalCode} | Telp: {org.contactPhone}
              </p>
            </div>
          </div>

          {/* Title & Receipt Number */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                BUKTI PEMBAYARAN IURAN SAH
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Nomor Registrasi:</span>
              <p className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                {payment.receiptNumber}
              </p>
            </div>
          </div>

          {/* Table Data Transaksi */}
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100">
              <div className="col-span-4 text-slate-500 font-medium">Telah Diterima Dari</div>
              <div className="col-span-8 font-bold text-slate-950 flex flex-col">
                <span>{madrasahName}</span>
                {madrasah?.nsm && (
                  <span className="text-xs text-slate-500 font-normal">
                    NSM: {madrasah.nsm} | NPSN: {madrasah.npsn}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100">
              <div className="col-span-4 text-slate-500 font-medium">Untuk Pembayaran</div>
              <div className="col-span-8 font-semibold text-slate-900">
                {payment.categoryLabel || 'Iuran Rutin Bulanan KKMTS'} - Bulan <span className="font-bold text-emerald-800">{periodStr}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100">
              <div className="col-span-4 text-slate-500 font-medium">Metode & Tanggal</div>
              <div className="col-span-8 text-slate-800">
                {payment.paymentMethod} • <span className="font-medium">{formatTanggalIndo(payment.paymentDate, true)}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 py-2 bg-emerald-50/80 rounded-xl px-3 border border-emerald-200/70 items-center">
              <div className="col-span-4 text-emerald-950 font-bold uppercase text-xs">Jumlah Pembayaran</div>
              <div className="col-span-8 font-extrabold text-emerald-900 text-lg sm:text-xl">
                {formatRupiah(payment.amount)}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 py-1.5">
              <div className="col-span-4 text-slate-500 font-medium italic">Terbilang</div>
              <div className="col-span-8 font-medium italic text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                "{terbilang(payment.amount)}"
              </div>
            </div>
          </div>

          {/* Signatures & Stamp & QR Validation */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-12 gap-4 items-end">
            
            {/* QR Code & Status */}
            <div className="col-span-5 flex items-center gap-3">
              <img 
                src={qrValidationUrl} 
                alt="QR Validasi Kwitansi" 
                className="w-20 h-20 border border-slate-300 rounded p-1 bg-white shrink-0" 
              />
              <div className="text-[10px] text-slate-500 leading-tight space-y-1">
                <div className="flex items-center gap-1 font-bold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TERVERIFIKASI
                </div>
                <p>Dokumen ini diterbitkan sah secara elektronik oleh Pengurus KKMTS {org.regency}.</p>
                <p className="text-[9px] text-slate-400 font-mono">
                  ID: {payment.id}
                </p>
              </div>
            </div>

            {/* Signature Box Bendahara */}
            <div className="col-span-7 text-right text-xs">
              <p className="text-slate-600">
                {org.regency}, {formatTanggalIndo(payment.verifiedAt || payment.paymentDate)}
              </p>
              <p className="font-bold text-slate-800 mt-1">Bendahara KKMTS {org.regency}</p>
              
              {/* Digital Stamp Simulation */}
              <div className="my-2 relative inline-block text-center">
                <div className="px-3 py-1 border-2 border-dashed border-emerald-600 rounded text-[10px] font-bold text-emerald-800 bg-emerald-50/50 transform -rotate-2">
                  LUNAS & TERCATAT BKU
                  <br />
                  <span className="text-[8px] font-mono text-emerald-600">{payment.verifiedAt?.slice(0, 10) || 'VERIFIED'}</span>
                </div>
              </div>

              <p className="font-bold underline text-slate-900">{org.treasurerName}</p>
              {org.treasurerNip && (
                <p className="text-[10px] text-slate-500">NIP. {org.treasurerNip}</p>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp & Sharing Action Footer (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Target WA: <strong>{madrasah?.treasurerName || 'Bendahara'}</strong> ({targetPhone || 'Nomor belum diset'})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMessage}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Tersalin!' : 'Salin Teks WA'}
            </button>

            <button
              onClick={handleOpenWA}
              disabled={!targetPhone}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 rounded-lg shadow-sm shadow-emerald-600/20 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Notifikasi WA
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
