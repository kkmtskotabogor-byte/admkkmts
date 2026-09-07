import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  UserCheck, 
  ExternalLink,
  X,
  School,
  KeyRound,
  Copy,
  Users
} from 'lucide-react';
import { Madrasah, PaymentRecord, OrganizationConfig } from '../types';
import { formatRupiah, createWALink, getMadrasahMonthlyDues } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getMadrasahAccessCode } from '../utils/authUtils';

interface MadrasahDirectoryViewProps {
  madrasahs: Madrasah[];
  payments: PaymentRecord[];
  org: OrganizationConfig;
  selectedYear: number;
  onAddMadrasah: (newMadrasah: Madrasah) => void;
  onUpdateMadrasah: (updatedMadrasah: Madrasah) => void;
  onDeleteMadrasah: (madrasahId: string) => void;
  onOpenPaymentForMadrasah: (madrasahId: string) => void;
  onNavigateToAccessCodes?: () => void;
}

export const MadrasahDirectoryView: React.FC<MadrasahDirectoryViewProps> = ({
  madrasahs,
  payments,
  org,
  selectedYear,
  onAddMadrasah,
  onUpdateMadrasah,
  onDeleteMadrasah,
  onOpenPaymentForMadrasah,
  onNavigateToAccessCodes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Negeri' | 'Swasta'>('all');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMadrasah, setEditingMadrasah] = useState<Madrasah | null>(null);
  const [madrasahToDelete, setMadrasahToDelete] = useState<Madrasah | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nsm, setNsm] = useState('');
  const [npsn, setNpsn] = useState('');
  const [status, setStatus] = useState<'Negeri' | 'Swasta'>('Swasta');
  const [studentCount, setStudentCount] = useState<number>(100);
  const [headmasterName, setHeadmasterName] = useState('');
  const [treasurerName, setTreasurerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('');

  // Subdistricts in data
  const subdistricts = Array.from(new Set(madrasahs.map(m => m.subdistrict).filter(Boolean))).sort();

  const openAddModal = () => {
    setEditingMadrasah(null);
    setName('');
    setNsm('');
    setNpsn('');
    setStatus('Swasta');
    setStudentCount(100);
    setHeadmasterName('');
    setTreasurerName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setSubdistrict('');
    setShowModal(true);
  };

  const openEditModal = (m: Madrasah) => {
    setEditingMadrasah(m);
    setName(m.name);
    setNsm(m.nsm);
    setNpsn(m.npsn);
    setStatus(m.status);
    setStudentCount(m.studentCount || 100);
    setHeadmasterName(m.headmasterName);
    setTreasurerName(m.treasurerName);
    setPhone(m.phone);
    setEmail(m.email || '');
    setAddress(m.address);
    setSubdistrict(m.subdistrict);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !headmasterName.trim()) return;

    if (editingMadrasah) {
      const updated: Madrasah = {
        ...editingMadrasah,
        name: name.trim(),
        nsm: nsm.trim() || editingMadrasah.nsm,
        npsn: npsn.trim() || editingMadrasah.npsn,
        status,
        studentCount: Math.max(1, Number(studentCount) || 1),
        headmasterName: headmasterName.trim(),
        treasurerName: treasurerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        subdistrict: subdistrict.trim() || 'Kota Bogor',
      };
      onUpdateMadrasah(updated);
    } else {
      const newM: Madrasah = {
        id: `mts-${Date.now()}`,
        name: name.trim(),
        nsm: nsm.trim() || '12123271' + Math.floor(1000 + Math.random() * 9000),
        npsn: npsn.trim() || '2027' + Math.floor(1000 + Math.random() * 9000),
        status,
        studentCount: Math.max(1, Number(studentCount) || 1),
        headmasterName: headmasterName.trim(),
        treasurerName: treasurerName.trim() || 'Bendahara Madrasah',
        phone: phone.trim() || '081289123456',
        email: email.trim() || undefined,
        address: address.trim() || 'Jl. Raya Kota Bogor',
        subdistrict: subdistrict.trim() || 'Tanah Sareal',
        isActive: true,
      };
      onAddMadrasah(newM);
    }

    setShowModal(false);
  };

  // Filtered List
  const filteredMadrasahs = madrasahs.filter((m) => {
    if (filterType !== 'all' && m.status !== filterType) return false;
    if (selectedSubdistrict !== 'all' && m.subdistrict !== selectedSubdistrict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.nsm.includes(q) &&
        !(m.npsn && m.npsn.includes(q)) &&
        !m.headmasterName.toLowerCase().includes(q) &&
        !m.treasurerName.toLowerCase().includes(q) &&
        !m.subdistrict.toLowerCase().includes(q) &&
        !m.address.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Direktori Madrasah Tsanawiyah Anggota KKMTS ({madrasahs.length} MTs)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Data kontak Kepala Madrasah, Bendahara, status iuran, alamat per kecamatan di Kota Bogor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToAccessCodes && (
            <button
              type="button"
              onClick={onNavigateToAccessCodes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-800 text-xs sm:text-sm font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Atur Kode Akses</span>
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Madrasah</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama MTs, NPSN, NSM, kecamatan, alamat..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({madrasahs.length})
            </button>
            <button
              onClick={() => setFilterType('Swasta')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterType === 'Swasta'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              MTs Swasta ({madrasahs.filter(m => m.status === 'Swasta').length})
            </button>
            <button
              onClick={() => setFilterType('Negeri')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterType === 'Negeri'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              MTs Negeri ({madrasahs.filter(m => m.status === 'Negeri').length})
            </button>
          </div>
        </div>

        {/* Subdistrict Filter Chips */}
        {subdistricts.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Kecamatan:</span>
            <button
              type="button"
              onClick={() => setSelectedSubdistrict('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSubdistrict === 'all'
                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Wilayah
            </button>
            {subdistricts.map(sub => {
              const countInSub = madrasahs.filter(m => m.subdistrict === sub).length;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubdistrict(sub)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    selectedSubdistrict === sub
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {sub} ({countInSub})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Madrasah Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMadrasahs.map((m) => {
          const paidPayments = payments.filter(
            p => p.madrasahId === m.id && p.periodYear === selectedYear && p.status === 'verified'
          );
          const paidMonthsCount = paidPayments.length;
          const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);
          const isLunas = paidMonthsCount === 12;

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Top Badge & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                    m.status === 'Negeri' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}>
                    {m.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(m)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Data"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMadrasahToDelete(m);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 active:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Madrasah"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* School Name & ID */}
                <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">
                  {m.name}
                </h3>
                <div className="flex items-center justify-between flex-wrap gap-1 mt-0.5 text-xs text-slate-500 font-mono">
                  <span>NPSN: <strong className="text-slate-700">{m.npsn || '-'}</strong> | NSM: {m.nsm}</span>
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded-md font-bold text-[10px]">
                    <KeyRound className="w-2.5 h-2.5" />
                    Kode: {getMadrasahAccessCode(m)}
                  </span>
                </div>

                {/* Student Count & Dues Obligation Badge */}
                <div className="mt-2.5 flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{m.studentCount || 0} Siswa</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-800">
                      {formatRupiah(getMadrasahMonthlyDues(m, org))}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium ml-1">/bulan</span>
                  </div>
                </div>

                {/* Contact info list */}
                <div className="mt-2.5 space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Kepala Madrasah:</span>
                    <strong className="text-slate-900">{m.headmasterName}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Bendahara Iuran:</span>
                    <strong className="text-slate-900">{m.treasurerName}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{m.address} (Kec. {m.subdistrict})</span>
                  </div>
                </div>
              </div>

              {/* Dues Progress Bar for Selected Year */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 font-medium">Iuran {selectedYear}:</span>
                  <span className="font-bold text-slate-900">
                    {paidMonthsCount}/12 Bulan ({formatRupiah(totalPaid)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLunas ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.round((paidMonthsCount / 12) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => onOpenPaymentForMadrasah(m.id)}
                  className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Setor Iuran</span>
                </button>

                {m.phone && (
                  <button
                    onClick={() => {
                      const url = createWALink(m.phone, `Assalamu'alaikum Wr. Wb. Yth. ${m.treasurerName} / Kepala ${m.name}...`);
                      window.open(url, '_blank');
                    }}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shrink-0"
                    title={`Hubungi via WhatsApp (${m.phone})`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Madrasah Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col my-auto max-h-[92vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <School className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {editingMadrasah ? 'Edit Data Madrasah' : 'Tambah Madrasah Anggota'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowModal(false);
                }} 
                aria-label="Tutup Form Madrasah"
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 active:text-slate-950 rounded-xl bg-slate-200/70 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-3 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Madrasah Tsanawiyah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: MTs Al-Ihsan Kota Bogor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-hidden"
                  >
                    <option value="Swasta">Swasta</option>
                    <option value="Negeri">Negeri</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jml Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={studentCount}
                    onChange={(e) => setStudentCount(Math.max(1, Number(e.target.value) || 1))}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-950 focus:outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NSM</label>
                  <input
                    type="text"
                    value={nsm}
                    onChange={(e) => setNsm(e.target.value)}
                    placeholder="12123271..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    value={npsn}
                    onChange={(e) => setNpsn(e.target.value)}
                    placeholder="2027..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Live dues preview info box */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Kewajiban Iuran: <strong>{studentCount} siswa</strong> × Rp {(org.duesPerStudent || 3000).toLocaleString('id-ID')}
                </span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {formatRupiah(studentCount * (org.duesPerStudent || 3000))} / bulan
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Kepala Madrasah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    placeholder="Contoh: Drs. H. Mansyur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Bendahara
                  </label>
                  <input
                    type="text"
                    value={treasurerName}
                    onChange={(e) => setTreasurerName(e.target.value)}
                    placeholder="Contoh: Siti Maryam, S.Pd"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081289123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    placeholder="Contoh: Tanah Sareal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Madrasah
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Sholeh Iskandar KM 4, Kota Bogor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Madrasah (Opsional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontak@mts.sch.id"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Simpan Data Madrasah
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Madrasah */}
      {madrasahToDelete && (
        <ConfirmDeleteModal
          isOpen={!!madrasahToDelete}
          title="Hapus Data Madrasah Anggota?"
          itemName={madrasahToDelete.name}
          message={`Apakah Anda yakin ingin menghapus "${madrasahToDelete.name}" (NSM: ${madrasahToDelete.nsm}) dari daftar direktori madrasah?`}
          confirmText="Ya, Hapus Madrasah"
          cancelText="Batal"
          onConfirm={() => {
            if (madrasahToDelete) {
              onDeleteMadrasah(madrasahToDelete.id);
              setMadrasahToDelete(null);
            }
          }}
          onClose={() => setMadrasahToDelete(null)}
        />
      )}

    </div>
  );
};
