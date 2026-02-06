'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDeed,
  deleteDeed,
  getDeeds,
  updateDeed,
} from '@/app/actions';
import {
  DeedPPATDetails,
  DeedParty,
  DeedRecord,
  DeedType,
  NotarisCategory,
} from '@/types/lapbul';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import KopLapbulPPAT from '@/components/documents/KopLapbulPPAT';
import {
  Download,
  Edit3,
  FileText,
  Printer,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

// --- CONSTANTS ---
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

// --- HELPER TERBILANG ---
const terbilang = (angka: number): string => {
  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
  const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
  const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
  const scales = ['', 'ribu', 'juta', 'miliar', 'triliun'];

  if (angka === 0) return 'nol';

  function convertHundreds(num: number): string {
    if (num === 0) return '';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    if (num < 200) return 'seratus' + (num % 100 !== 0 ? ' ' + convertHundreds(num % 100) : '');
    return units[Math.floor(num / 100)] + ' ratus' + (num % 100 !== 0 ? ' ' + convertHundreds(num % 100) : '');
  }

  let result = '';
  let i = 0;
  let num = angka;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      let chunkText = convertHundreds(chunk);
      if (i === 1 && chunk === 1) {
        chunkText = 'seribu';
      } else if (i > 0) {
        chunkText += ' ' + scales[i];
      }
      result = chunkText + (result ? ' ' + result : '');
    }
    num = Math.floor(num / 1000);
    i++;
  }
  return result.trim();
};

// --- HELPER FORMAT JUMLAH AKTA ---
const formatDeedCount = (count: number) => {
  if (count === 0) return "0 (nihil)";
  return `${count} (${terbilang(count)})`;
};

const YEAR_RANGE = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

const DEFAULT_PPAT_DETAIL: DeedPPATDetails = {
  nop: '', njop: '', luasTanah: '', luasBangunan: '', lokasiObjek: '',
  nilaiTransaksi: '', ssp: '', tglSsp: '', ssb: '', tglSsb: '', jenisHak: '', pihakPenerima: '',
};

const PPAT_CATEGORIES = [
  'Akta Jual Beli',
  'Akta APHT',
  'Akta APHB',
  'Akta Hibah',
];

interface LapbulFormState {
  jenis: DeedType;
  nomorAkta: string;
  tanggalAkta: string;
  judulAkta: string;
  kategori: NotarisCategory;
  pihak: DeedParty[];
  detailPPAT: DeedPPATDetails;
  bulanPelaporan: number;
  tahunPelaporan: number;
  nomorBulanan?: string;
}

const createEmptyFormState = (month: number, year: number): LapbulFormState => ({
  jenis: 'Notaris',
  nomorAkta: '',
  tanggalAkta: new Date(year, month - 1, 1).toISOString().split('T')[0],
  judulAkta: '',
  kategori: 'Akta',
  pihak: [{
    name: '',
    role: 'Pihak Pengalih / Penghadap',
    actingCapacity: 'self', // Default bertindak untuk diri sendiri
    representedParties: []
  }],
  detailPPAT: { ...DEFAULT_PPAT_DETAIL },
  bulanPelaporan: month,
  tahunPelaporan: year,
  nomorBulanan: '',
});

// Helper Formatter
const currency = (val: string | number | undefined) => {
  if (!val) return '-';
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, '')) || 0 : val;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const formatDateIndo = (isoDate: string) => {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateLong = (isoDate: string) => {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};
const getRomanMonth = (month: number) => {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "I"];
  return romans[month] || "";
};

export default function LapbulModulePage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [activeTab, setActiveTab] = useState<'data' | 'notaris' | 'ppat'>('data');

  const [deeds, setDeeds] = useState<DeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<LapbulFormState>(createEmptyFormState(selectedMonth, selectedYear));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fitToPageHeight, setFitToPageHeight] = useState(false);

  // Refs
  const ppatLetterRef = useRef<HTMLDivElement>(null);
  const ppatLampiranRef = useRef<HTMLDivElement>(null);
  const notarisLetterRef = useRef<HTMLDivElement>(null);
  const notarisModelsRef = useRef<HTMLDivElement>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDeeds();
      setDeeds(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // Filter Data Bulanan
  const monthlyDeeds = useMemo(() =>
    deeds.filter(d => d.bulanPelaporan === selectedMonth && d.tahunPelaporan === selectedYear),
    [deeds, selectedMonth, selectedYear]);

  const ppatRecords = monthlyDeeds.filter(d => d.jenis === 'PPAT');
  const notarisRecords = monthlyDeeds.filter(d => d.jenis === 'Notaris');

  // --- HANDLERS NAVIGATION ---
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // --- HANDLERS DATA ---
  const handleSave = async () => {
    if (!formState.nomorAkta) return alert("Nomor Akta wajib diisi");
    const payload = {
      ...formState,
      detailPPAT: formState.jenis === 'PPAT' ? formState.detailPPAT : undefined
    };
    try {
      if (editingId) await updateDeed(editingId, payload);
      else await createDeed(payload);
      alert("Berhasil disimpan");
      loadData();
      setFormState(createEmptyFormState(selectedMonth, selectedYear));
      setEditingId(null);
    } catch (e) { alert("Gagal menyimpan"); }
  };

  const handleEdit = (rec: DeedRecord) => {
    setEditingId(rec.id);
    // Ensure backward compatibility for old records without new fields
    const cleanPihak = rec.pihak.map(p => ({
      ...p,
      actingCapacity: p.actingCapacity || 'self',
      representedParties: p.representedParties || []
    }));

    setFormState({
      jenis: rec.jenis,
      nomorAkta: rec.nomorAkta,
      tanggalAkta: rec.tanggalAkta,
      judulAkta: rec.judulAkta,
      kategori: rec.kategori || 'Akta',
      pihak: cleanPihak,
      detailPPAT: rec.detailPPAT || { ...DEFAULT_PPAT_DETAIL },
      bulanPelaporan: rec.bulanPelaporan,
      tahunPelaporan: rec.tahunPelaporan,
      nomorBulanan: rec.nomorBulanan || '',
    });
    setActiveTab('data');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data ini?")) {
      await deleteDeed(id);
      loadData();
    }
  };

  // ============================================================
  // --- HELPERS FOR FORM ARRAY (BAGIAN INI YANG SEBELUMNYA HILANG) ---
  // ============================================================
  const addRepresentedParty = (partyIndex: number) => {
    const newPihak = [...formState.pihak];
    if (!newPihak[partyIndex].representedParties) newPihak[partyIndex].representedParties = [];
    newPihak[partyIndex].representedParties!.push('');
    setFormState({ ...formState, pihak: newPihak });
  };

  const updateRepresentedParty = (partyIndex: number, repIndex: number, val: string) => {
    const newPihak = [...formState.pihak];
    newPihak[partyIndex].representedParties![repIndex] = val;
    setFormState({ ...formState, pihak: newPihak });
  };

  const removeRepresentedParty = (partyIndex: number, repIndex: number) => {
    const newPihak = [...formState.pihak];
    newPihak[partyIndex].representedParties = newPihak[partyIndex].representedParties!.filter((_, i) => i !== repIndex);
    setFormState({ ...formState, pihak: newPihak });
  };
  // ============================================================

  // --- PRINT HANDLER KHUSUS LAMPIRAN ---
  const handlePrintLampiran = useCallback(() => {
    // 1. Buat Style Khusus Print secara dinamis
    const style = document.createElement('style');
    const fitToHeightStyles = fitToPageHeight ? `
        /* Fit content to page height when toggle is on */
        .lampiran-content {
          transform-origin: top left;
          width: 297mm !important;
          height: 210mm !important;
          max-height: 210mm !important;
          overflow: hidden !important;
        }
        
        .lampiran-content > * {
          transform: scale(var(--print-scale, 1));
          transform-origin: top left;
        }
        
        .fit-to-page {
          display: flex;
          flex-direction: column;
          height: 210mm !important;
          justify-content: flex-start;
          overflow: hidden !important;
        }
        
        .fit-to-page table {
          font-size: 5pt !important;
        }
        
        .fit-to-page .text-\\[6pt\\] {
          font-size: 5pt !important;
        }
        
        .fit-to-page .text-\\[10pt\\] {
          font-size: 8pt !important;
        }
        
        .fit-to-page .text-\\[11pt\\] {
          font-size: 9pt !important;
        }
        
        .fit-to-page .mb-12 {
          margin-bottom: 1.5rem !important;
        }
        
        .fit-to-page .mt-8 {
          margin-top: 1rem !important;
        }
        
        .fit-to-page .h-20 {
          height: 3rem !important;
        }
    ` : '';

    style.innerHTML = `
      @media print {
        /* Sembunyikan semua elemen body */
        body * {
          visibility: hidden;
        }
        
        /* Tampilkan HANYA area lampiran */
        #print-lampiran-area, #print-lampiran-area * , #print-lampiran-notaris, #print-lampiran-notaris * {
          visibility: visible;
        }

        /* Atur posisi container agar mulai dari pojok kiri atas kertas */
        #print-lampiran-area, #print-lampiran-notaris {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        /* Wrapper per halaman agar tidak menumpuk */
        .print-item-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          page-break-after: always;
          display: block;
        }
        
        .print-item-wrapper:last-child {
          page-break-after: auto;
        }

        /* Paksa orientasi Landscape */
        @page {
          size: landscape;
          margin: 0;
        }

        /* Hilangkan background/shadow container saat print agar bersih */
        .print-clean {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          width: 100% !important;
        }
        
        .no-print {
            display: none !important;
        }
        
        ${fitToHeightStyles}
      }
    `;

    document.head.appendChild(style);
    // Timeout sedikit agar style render dulu
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
    }, 100);
  }, [fitToPageHeight]);

  // --- PRINT HANDLER KHUSUS SURAT PENGANTAR (PORTRAIT) ---
  const handlePrintSurat = useCallback(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Sembunyikan semua elemen body */
        body * {
          visibility: hidden;
        }
        
        /* Tampilkan HANYA area surat */
        #print-surat-area, #print-surat-area * , #print-surat-notaris, #print-surat-notaris * {
          visibility: visible;
        }

        /* Atur posisi container agar mulai dari pojok kiri atas kertas */
        #print-surat-area, #print-surat-notaris {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        /* Wrapper per halaman agar tidak menumpuk */
        .print-item-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          page-break-after: always;
          display: block;
        }
        
        .print-item-wrapper:last-child {
          page-break-after: auto;
        }

        /* Paksa orientasi Portrait */
        @page {
          size: portrait;
          margin: 0;
        }

        /* Hilangkan background/shadow container saat print agar bersih */
        .print-clean {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          width: 100% !important;
        }
        
        .no-print {
            display: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
    }, 100);
  }, []);


  // --- REVISI: LOGIC REKAP PPAT ---
  const ppatSummary = useMemo(() => {
    // Inisialisasi counter untuk semua kategori baku agar tetap muncul meski 0
    const types: Record<string, number> = {};
    PPAT_CATEGORIES.forEach(cat => types[cat] = 0);

    let totalSSB = 0;
    let totalSSP = 0;
    let totalAkta = 0;

    ppatRecords.forEach(d => {
      // Normalisasi judul (uppercase) agar match dengan kategori
      const type = d.judulAkta || 'LAINNYA';

      // Jika judul sesuai kategori baku, tambahkan counter. Jika tidak, masuk ke Lainnya (opsional)
      if (types.hasOwnProperty(type)) {
        types[type] += 1;
      } else {
        // Opsional: Handle tipe custom jika ada, atau masukkan ke Lainnya
        types[type] = (types[type] || 0) + 1;
      }

      totalAkta += 1;

      const ssbVal = parseInt(d.detailPPAT?.ssb?.replace(/\D/g, '') || '0');
      const sspVal = parseInt(d.detailPPAT?.ssp?.replace(/\D/g, '') || '0');
      totalSSB += ssbVal;
      totalSSP += sspVal;
    });
    return { types, totalSSB, totalSSP, totalAkta };
  }, [ppatRecords]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans text-gray-800">

      {/* HEADER & FILTER */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan Kantor Notaris & PPAT Havis Akbar</h1>
          <p className="text-sm text-gray-500">Periode: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border px-2 py-1 rounded-lg shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-semibold text-gray-800 min-w-[120px] text-center select-none">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            title="Bulan Selanjutnya"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 border-b no-print overflow-x-auto">
        {[{ id: 'data', label: '1. Input Data Akta' }, { id: 'ppat', label: '2. Laporan PPAT' }, { id: 'notaris', label: '3. Laporan Notaris' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: INPUT DATA ================= */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
          {/* FORM */}
          <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">{editingId ? 'Edit Akta' : 'Input Akta Baru'}</h3>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
              {['Notaris', 'PPAT'].map(type => (
                <button key={type} onClick={() => setFormState(prev => ({ ...prev, jenis: type as DeedType }))} className={`py-2 text-sm font-bold rounded-md ${formState.jenis === type ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{type}</button>
              ))}
            </div>

            <div className="space-y-3 text-sm">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">NOMOR AKTA</label><input className="w-full border p-2 rounded" value={formState.nomorAkta} onChange={e => setFormState({ ...formState, nomorAkta: e.target.value })} placeholder="1 atau 01/2025" /></div>

              {formState.jenis === 'Notaris' && (
                <div><label className="block text-xs font-bold text-gray-500 mb-1">NOMOR REPORTORIUM</label><input className="w-full border p-2 rounded" value={formState.nomorBulanan} onChange={e => setFormState({ ...formState, nomorBulanan: e.target.value })} placeholder="1" /></div>
              )}

              <div><label className="block text-xs font-bold text-gray-500 mb-1">TANGGAL AKTA</label><input type="date" className="w-full border p-2 rounded" value={formState.tanggalAkta} onChange={e => setFormState({ ...formState, tanggalAkta: e.target.value })} /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {formState.jenis === 'Notaris' ? 'JUDUL / SIFAT AKTA' : 'JUDUL / SIFAT AKTA'}
                </label>
                {formState.jenis === 'PPAT' ? (
                  <select
                    className="w-full border p-2 rounded bg-white"
                    value={formState.judulAkta}
                    onChange={e => setFormState({ ...formState, judulAkta: e.target.value })}
                  >
                    <option value="">- Jenis Akta -</option>
                    {PPAT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Lainnya">Lainnya</option>
                  </select>
                ) : (
                  <textarea rows={2} className="w-full border p-2 rounded" value={formState.judulAkta} onChange={e => setFormState({ ...formState, judulAkta: e.target.value })} placeholder="Contoh: Pendirian PT / Kuasa Jual" />
                )}
              </div>

              {formState.jenis === 'Notaris' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">KATEGORI</label>
                  <select className="w-full border p-2 rounded" value={formState.kategori} onChange={e => setFormState({ ...formState, kategori: e.target.value as any })}>
                    {['Akta', 'Legalisasi', 'Waarmerking', 'Protes', 'Wasiat'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500">PIHAK TERLIBAT</label>
                  <button onClick={() => setFormState({ ...formState, pihak: [...formState.pihak, { name: '', role: '', actingCapacity: 'self', representedParties: [] }] })} className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"><Plus size={12} /> Tambah Pihak</button>
                </div>

                <div className="space-y-3">
                  {formState.pihak.map((p, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-gray-50 relative">
                      <button onClick={() => { const newPihak = formState.pihak.filter((_, i) => i !== idx); setFormState({ ...formState, pihak: newPihak }); }} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>

                      <div className="mb-2">
                        <label className="text-[10px] uppercase text-gray-400 font-bold">Nama Penghadap</label>
                        <input className="w-full border p-1.5 rounded bg-white text-sm" placeholder="Tn. Ny. Nn. atau nama huruf besar, alamat" value={p.name} onChange={e => { const newPihak = [...formState.pihak]; newPihak[idx].name = e.target.value; setFormState({ ...formState, pihak: newPihak }); }} />
                      </div>

                      {/* Opsi Bertindak Hanya Muncul untuk Notaris */}
                      {formState.jenis === 'Notaris' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Kapasitas Bertindak</label>
                          <div className="flex gap-2 mb-2">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={`cap-${idx}`} checked={p.actingCapacity === 'self'} onChange={() => { const np = [...formState.pihak]; np[idx].actingCapacity = 'self'; setFormState({ ...formState, pihak: np }) }} /> Sendiri
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer hidden">
                              <input type="radio" name={`cap-${idx}`} checked={p.actingCapacity === 'representative'} onChange={() => { const np = [...formState.pihak]; np[idx].actingCapacity = 'representative'; setFormState({ ...formState, pihak: np }) }} /> Kuasa
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={`cap-${idx}`} checked={p.actingCapacity === 'both'} onChange={() => { const np = [...formState.pihak]; np[idx].actingCapacity = 'both'; setFormState({ ...formState, pihak: np }) }} /> dan untuk atas nama :
                            </label>
                          </div>

                          {(p.actingCapacity === 'representative' || p.actingCapacity === 'both') && (
                            <div className="pl-2 border-l-2 border-blue-200 mt-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-blue-600">Daftar Yang Diwakili:</span>
                                <button onClick={() => addRepresentedParty(idx)} className="text-[10px] bg-white border px-1 rounded hover:bg-gray-100">+ Tambah</button>
                              </div>
                              {p.representedParties?.map((rp, rIdx) => (
                                <div key={rIdx} className="flex gap-1 mb-1">
                                  <span className="text-xs w-4 text-center text-gray-400">{String.fromCharCode(97 + rIdx)}.</span>
                                  <input className="flex-1 border p-1 rounded text-xs" placeholder="Nama yang diwakili" value={rp} onChange={(e) => updateRepresentedParty(idx, rIdx, e.target.value)} />
                                  <button onClick={() => removeRepresentedParty(idx, rIdx)} className="text-red-400 hover:text-red-600"><Minus size={12} /></button>
                                </div>
                              ))}
                              {(!p.representedParties || p.representedParties.length === 0) && <div className="text-[10px] text-gray-400 italic">Belum ada data kuasa.</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {formState.jenis === 'PPAT' && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-2 mt-4">
                  <p className="text-xs font-bold text-blue-700 uppercase">Detail PPAT</p>
                  <input className="w-full border p-2 rounded text-xs" placeholder="Pihak yang Menerima" value={formState.detailPPAT.pihakPenerima} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, pihakPenerima: e.target.value } })} />
                  <input className="w-full border p-2 rounded text-xs" placeholder="SERTIFIKAT HAK MILIK NOMOR 03874/KELURAHAN KOTA KULON" value={formState.detailPPAT.jenisHak} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, jenisHak: e.target.value } })} />
                  <textarea className="w-full border p-2 rounded text-xs" placeholder="Jalan Karacak Nomor 18, Kelurahan Kota Kulon, Kecamatan Garut Kota, Kabupaten Garut" value={formState.detailPPAT.lokasiObjek} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, lokasiObjek: e.target.value } })} />
                  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded text-xs" placeholder="Luas Tanah (m2)" value={formState.detailPPAT.luasTanah} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, luasTanah: e.target.value } })} /><input className="border p-2 rounded text-xs" placeholder="Luas Bangunan (m2)" value={formState.detailPPAT.luasBangunan} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, luasBangunan: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded text-xs" placeholder="Harga Transaksi (Rp)" value={formState.detailPPAT.nilaiTransaksi} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, nilaiTransaksi: e.target.value } })} /><input className="border p-2 rounded text-xs" placeholder="NJOP (Rp)" value={formState.detailPPAT.njop} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, njop: e.target.value } })} /></div>
                  <input className="w-full border p-2 rounded text-xs" placeholder="NOP (32.07.170.005.007-0255.0 2025)" value={formState.detailPPAT.nop} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, nop: e.target.value } })} />
                  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded text-xs" placeholder="SSP (Rp)" value={formState.detailPPAT.ssp} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, ssp: e.target.value } })} /><input className="border p-2 rounded text-xs" placeholder="SSB (Rp)" value={formState.detailPPAT.ssb} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, ssb: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-2"><input type="date" className="border p-2 rounded text-xs" placeholder="Tanggal SSP" value={formState.detailPPAT.tglSsp} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, tglSsp: e.target.value } })} /><input type="date" className="border p-2 rounded text-xs" placeholder="Tanggal SSB" value={formState.detailPPAT.tglSsb} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, tglSsb: e.target.value } })} /></div>
                </div>
              )}

              <div className="pt-4 flex gap-2"><button onClick={handleSave} className="flex-1 bg-black text-white py-2 rounded font-bold">Simpan</button>{editingId && <button onClick={() => { setEditingId(null); setFormState(createEmptyFormState(selectedMonth, selectedYear)); }} className="px-4 border rounded">Batal</button>}</div>
            </div>
          </div>

          {/* TABLE */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-4">Data Akta Bulan Ini</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b"><th className="p-3">No</th><th className="p-3">Jenis</th><th className="p-3">No & Tgl</th><th className="p-3">Judul / Pihak</th><th className="p-3 text-right">Aksi</th></tr></thead>
                <tbody>
                  {monthlyDeeds.map((d, i) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{d.nomorBulanan}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${d.jenis === 'PPAT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{d.jenis}</span></td>
                      <td className="p-3"><div className="font-bold">{d.nomorAkta}</div><div className="text-xs text-gray-500">{formatDateIndo(d.tanggalAkta)}</div></td>
                      <td className="p-3"><div className="font-bold line-clamp-1">{d.judulAkta}</div><div className="text-xs text-gray-500 line-clamp-1">{d.pihak.map(p => p.name).join(', ')}</div></td>
                      <td className="p-3 text-right flex justify-end gap-2"><button onClick={() => handleEdit(d)} className="text-blue-600 p-1"><Edit3 size={16} /></button><button onClick={() => handleDelete(d.id)} className="text-red-600 p-1"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LAPORAN PPAT ================= */}
      {activeTab === 'ppat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4 no-print h-fit sticky top-6">
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <h3 className="font-bold mb-4 text-gray-700">Cetak Laporan</h3>
              <button
                onClick={handlePrintSurat}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded mb-3 flex items-center justify-center gap-2 text-sm"
              >
                <Printer size={16} />
                Print Surat Pengantar
              </button>

              <button
                onClick={handlePrintLampiran}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded flex items-center justify-center gap-2 text-sm"
              >
                <Printer size={16} />
                Print Lampiran
              </button>

              {/* Toggle Fit to Page Height */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={fitToPageHeight}
                      onChange={(e) => setFitToPageHeight(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize2 size={14} className="text-gray-500 group-hover:text-blue-600" />
                    <span className="text-xs text-gray-600 group-hover:text-gray-800">
                      Fit to Paper Height
                    </span>
                  </div>
                </label>
                <p className="text-[10px] text-gray-400 mt-1 pl-[52px]">
                  Aktifkan jika konten melebihi 1 halaman
                </p>
              </div>

            </div>
          </div>
          <div className="lg:col-span-9 space-y-8 overflow-auto h-[calc(100vh-150px)] pr-2">
            {/* SURAT PENGANTAR (4 HALAMAN) */}
            <div ref={ppatLetterRef} id="print-surat-area">
              {[
                { to: 'Kepala Kantor\nBadan Pertanahan Nasional\n Kabupaten Garut', address: 'Jl. Suherman, Desa Jati,\nTarogong Kaler, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor Wilayah\nBadan Pertanahan Nasional \nProvinsi Jawa Barat', address: 'Jl. Soekarno Hatta No. 586\nSekejati, Kec. Buah Batu,\nKota Bandung 40286' },
                { to: 'Kepala Kantor\nBadan Pendapatan Daerah Kabupaten Garut', address: 'Jl. Otista No. 278, Sukagalih,\nKec. Tarogong Kidul, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor\nPelayanan Pajak Pratama Garut', address: 'Jl. Pembangunan No.224,\nSukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' }
              ].map((r, idx) => (
                <div key={idx} className="print-item-wrapper">
                  <A4Container className="print-wrapper print-clean font-serif text-black">
                    <KopLapbulPPAT />

                    <table className="text-[11pt] font-serif mb-6 w-full border-collapse">
                      <tbody>
                        {/* BARIS 1: Nomor & Tanggal */}
                        <tr>
                          {/* Kolom 1: Label Kiri (15%) */}
                          <td className="w-[15%] align-top py-0.5">Nomor</td>
                          {/* Kolom 2: Isi Kiri (40%) */}
                          <td className="w-[40%] align-top py-0.5">: {(idx + 1).toString().padStart(2, '0')}/PPAT/HA/{getRomanMonth(selectedMonth)}/{selectedYear}</td>
                          {/* Kolom 3: Kanan (45%) - Ada padding kiri agar tidak mepet */}
                          <td className="w-[45%] align-top py-0.5 pl-8">Garut, {formatDateLong(new Date(selectedYear, selectedMonth - 0, 5).toISOString())}</td>
                        </tr>

                        {/* BARIS 2: Lampiran & Kepada Yth */}
                        <tr>
                          <td className="align-top py-0.5">Lampiran</td>
                          <td className="align-top py-0.5">: 1 (satu) lembar</td>
                          <td className="align-top py-0.5 pl-8 mt-2 block">Kepada Yth,</td>
                        </tr>

                        {/* BARIS 3: Perihal & Nama Penerima */}
                        <tr>
                          <td className="align-top py-0.5">Perihal</td>
                          <td className="align-top py-0.5 pr-2 leading-tight">
                            <div className="flex">
                              <span className="mr-1">:</span>
                              <span className="w-[60%]">Laporan Bulanan Pembuatan Akta oleh PPAT</span>
                            </div>
                          </td>
                          {/* Nama Penerima (Bold) */}
                          <td className="align-top py-0.5 pl-8 font-bold whitespace-pre-line leading-tight">
                            {r.to}
                          </td>
                        </tr>

                        {/* BARIS 4: Kosong Kiri & 'di' Kanan */}
                        <tr>
                          <td className="align-top"></td>
                          <td className="align-top"></td>
                          <td className="align-top pl-8 py-0.5">di</td>
                        </tr>

                        {/* BARIS 5: Kosong Kiri & Alamat Kanan */}
                        <tr>
                          <td className="align-top"></td>
                          <td className="align-top"></td>
                          {/* Alamat (Indented sedikit / sejajar tergantung selera, disini sejajar 'di') */}
                          <td className="align-top pl-8 py-0.5 whitespace-pre-line leading-tight">
                            {r.address}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="text-[12pt] text-justify">
                      <p className="mb-4">Dengan hormat,<br />Bersama dengan ini kami menyampaikan Laporan Bulanan Pembuatan Akta PPAT untuk Bulan <strong>{MONTHS[selectedMonth - 1].toUpperCase()} {selectedYear}</strong>, sesuai daftar terlampir dengan perincian sebagai berikut:</p>
                      <div className="pl-12 mb-4">
                        <table className="w-full">
                          <tbody>
                            {Object.entries(ppatSummary.types).map(([k, v]) => <tr key={k}><td className="font-bold w-1/3">{k}</td><td>: {formatDeedCount(v)} Akta.</td></tr>)}
                            {Object.keys(ppatSummary.types).length === 0 && <tr><td className="text-center italic">0 (NIHIL)</td></tr>}
                            <tr><td colSpan={2} className="h-4"></td></tr>
                            <tr><td>Jumlah BPHTB (SSB)</td><td>: {currency(ppatSummary.totalSSB)}</td></tr>
                            <tr><td>Surat Setoran Pajak (SSP)</td><td>: {currency(ppatSummary.totalSSP)}</td></tr>
                            <tr><td>Jumlah  </td><td>: {currency(ppatSummary.totalSSP + ppatSummary.totalSSB)}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <p>Demikian laporan ini saya sampaikan, atas perhatiannya saya ucapkan terima kasih.</p>
                    </div>
                    <div className="mt-12"><p className="text-right pr-16">Hormat kami,</p><div className="h-20"></div><p className="font-bold text-right">(HAVIS AKBAR, S.H., M.Kn.)</p></div>
                  </A4Container>
                </div>
              ))}
            </div>

            {/* LAMPIRAN LANDSCAPE */}
            <div ref={ppatLampiranRef} id="print-lampiran-area">
              {[
                { to: 'Kepala Kantor\nBadan Pertanahan Nasional Kabupaten Garut', address: 'Jl. Suherman, Desa Jati, Tarogong Kaler, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor Wilayah\nBadan Pertanahan Nasional Provinsi Jawa Barat', address: 'Jl. Soekarno Hatta No. 586 Sekejati, Kec. BuahBatu, Kota Bandung 40286' },
                { to: 'Kepala Kantor\nBadan Pendapatan Daerah Kabupaten Garut', address: 'Jl. Otista No. 278, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor\nPelayanan Pajak Pratama Garut', address: 'Jl. Pembangunan No.224, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' }
              ].map((r, idx) => (
                <div key={idx} className="print-item-wrapper">
                  <div className={`bg-white p-8 print-wrapper print-clean ${fitToPageHeight ? 'fit-to-page' : ''}`} style={{ width: '297mm', minHeight: '210mm', maxHeight: fitToPageHeight ? '210mm' : undefined }}>

                    <div className="flex justify-between items-start mb-12 font-serif text-[10pt] font-bold">
                      <div className="w-[60%]">
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr><td className="align-top w-[30%] pb-1">Nama PPAT</td><td className="align-top w-[70%] pb-1">: HAVIS AKBAR, S.H., M.Kn</td></tr>
                            <tr><td className="align-top pb-1">Daerah Kerja</td><td className="align-top pb-1">: Seluruh Kecamatan Kabupaten Garut</td></tr>
                            <tr><td className="align-top pb-1">Alamat</td><td className="align-top font-thin pb-1 whitespace-pre-line leading-tight">: Jalan Jendral Sudirman - Ruko Mandala Residence No. 31, Kel. Sukamentri, Kec. Garut Kota, Kab. Garut, Jawa Barat 44116</td></tr>
                            <tr><td className="align-top pb-1">NPWP/KTP</td><td className="align-top font-thin pb-1">: 55.743.562.5-013.000 / 3217062010780024</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="w-[50%] pl-10">
                        <p className="mb-1">Kepada Yth.</p>
                        <div className="whitespace-pre-line leading-tight">
                          {r.to}
                        </div>
                        <div className="whitespace-pre-line leading-tight">
                          {r.address}
                        </div>
                      </div>
                    </div>

                    <div className="text-center font-bold mb-4 text-[11pt]">
                      <p>LAPORAN BULANAN PEMBUATAN AKTA OLEH PPAT</p>
                      <p>BULAN {MONTHS[selectedMonth - 1].toUpperCase()} TAHUN {selectedYear}</p>
                    </div>

                    <table className="w-full text-[6pt] border border-gray-300 border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-center font-semibold">
                          <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-8">NO.<br />URUT</th>
                          <th colSpan={2} className="border border-gray-300 px-1 py-1">AKTA</th>
                          <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-24">BENTUK<br />PERBUATAN<br />HUKUM</th>
                          <th colSpan={2} className="border border-gray-300 px-1 py-1">NAMA, ALAMAT DAN NPWP</th>
                          <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-24">JENIS<br />DAN<br />NOMOR HAK</th>
                          <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-32">NOP.<br />LETAK<br />TANAH DAN<br />BANGUNAN</th>
                          <th colSpan={2} className="border border-gray-300 px-1 py-1">LUAS (m2)</th>
                          <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-24">HARGA<br />TRANSAKSI<br />PEROLEHAN<br />PENGALIHAN HAK</th>
                          <th colSpan={2} className="border border-gray-300 px-1 py-1">SPPT PBB</th>
                          <th colSpan={2} className="border border-gray-300 px-1 py-1">SSP</th>
                          <th colSpan={2} className="border border-gray-300 px-1 py-1">SSB</th>
                          <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-10">KET</th>
                        </tr>
                        <tr className="bg-gray-100 text-center font-semibold">
                          <th className="border border-gray-300 px-1 py-1 w-16">NOMOR</th>
                          <th className="border border-gray-300 px-1 py-1 w-16">TANGGAL</th>
                          <th className="border border-gray-300 px-1 py-1 w-32">PIHAK YANG<br />MENGALIHKAN</th>
                          <th className="border border-gray-300 px-1 py-1 w-32">PIHAK YANG<br />MENERIMA</th>
                          <th className="border border-gray-300 px-1 py-1 w-12">TNH</th>
                          <th className="border border-gray-300 px-1 py-1 w-12">BGN</th>
                          <th className="border border-gray-300 px-1 py-1 w-20">NOP<br />TAHUN</th>
                          <th className="border border-gray-300 px-1 py-1 w-20">NJOP</th>
                          <th className="border border-gray-300 px-1 py-1 w-16">TANGGAL</th>
                          <th className="border border-gray-300 px-1 py-1 w-20">(Rp.)</th>
                          <th className="border border-gray-300 px-1 py-1 w-16">TANGGAL</th>
                          <th className="border border-gray-300 px-1 py-1 w-20">(Rp.)</th>
                        </tr>
                        <tr className="bg-gray-50 text-[7pt] text-center text-gray-500">
                          {Array.from({ length: 18 }).map((_, i) => (
                            <th key={i} className="border border-gray-300 px-1 py-0.5">{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ppatRecords.length === 0 ? (
                          <tr><td colSpan={18} className="text-center py-6 text-gray-500 text-sm">0 (NIHIL)</td></tr>
                        ) : (
                          ppatRecords.map((record, index) => {
                            const mengalihkan = record.pihak.filter(p => /penjual|pemberi|ahli waris|pemilik/i.test(p.role)).map(p => p.name).join(', ');
                            const menerima = record.pihak.filter(p => /pembeli|penerima/i.test(p.role)).map(p => p.name).join(', ');
                            const displayMengalihkan = mengalihkan || (!menerima ? record.pihak.map(p => p.name).join(', ') : '-');

                            return (
                              <tr key={record.id} className="align-top">
                                <td className="border border-gray-300 px-1 py-1 text-center">{index + 1}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.nomorAkta}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{formatDateIndo(record.tanggalAkta)}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.judulAkta}</td>
                                <td className="border border-gray-300 px-1 py-1">{displayMengalihkan}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.pihakPenerima}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.jenisHak || '-'}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.lokasiObjek || '-'}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{record.detailPPAT?.luasTanah || 0}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{record.detailPPAT?.luasBangunan || 0}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{currency(record.detailPPAT?.nilaiTransaksi || '-')}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.nop || '-'}<br />{selectedYear}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{currency(record.detailPPAT?.njop || '-')}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{formatDateIndo(record.detailPPAT?.tglSsp || '-')}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{currency(record.detailPPAT?.ssp || '-')}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{formatDateIndo(record.detailPPAT?.tglSsb || '-')}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">{currency(record.detailPPAT?.ssb || '-')}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    <div className="mt-8 flex justify-end text-[10pt] font-serif text-center">
                      <div><p>Garut, {formatDateLong(new Date(selectedYear, selectedMonth - 0, 5).toISOString())}</p><div className="h-20"></div><p className="font-bold underline">HAVIS AKBAR, S.H., M.Kn.</p></div>
                    </div>
                  </div>
                  {/* Spacer no-print */}
                  <div className="h-8 bg-gray-200 no-print"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: LAPORAN NOTARIS ================= */}
      {activeTab === 'notaris' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4 no-print h-fit sticky top-6">
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 no-print">
              <h3 className="font-bold mb-4 text-gray-700">Cetak Laporan</h3>
              <button onClick={handlePrintSurat} className="w-full bg-gray-800 text-white py-2 px-4 rounded mb-3 flex items-center justify-center gap-2 text-sm"><Printer size={16} /> Print Surat Pengantar</button>
              <button onClick={handlePrintLampiran} className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded flex items-center justify-center gap-2 text-sm"><Printer size={16} /> Print Lampiran</button>

              {/* Toggle Fit to Page Height */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={fitToPageHeight}
                      onChange={(e) => setFitToPageHeight(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize2 size={14} className="text-gray-500 group-hover:text-blue-600" />
                    <span className="text-xs text-gray-600 group-hover:text-gray-800">
                      Fit to Paper Height
                    </span>
                  </div>
                </label>
                <p className="text-[10px] text-gray-400 mt-1 pl-[52px]">
                  Aktifkan jika konten melebihi 1 halaman
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-8 overflow-auto h-[calc(100vh-150px)] pr-2">
            {/* SURAT PENGANTAR */}
            <div ref={notarisLetterRef} id="print-surat-notaris">

              <A4Container className="print-wrapper print-clean font-serif text-black">
                <KopSurat />
                <div className="text-[11pt] leading-[1.3] mt-6">
                  <table className="text-[11pt] font-serif mb-3 w-full border-collapse">
                    <tbody>
                      {/* BARIS 1: Nomor & Tanggal */}
                      <tr>
                        {/* Kolom 1: Label Kiri (15%) */}
                        <td className="w-[15%] align-top py-0.5">Nomor</td>
                        {/* Kolom 2: Isi Kiri (40%) */}
                        <td className="w-[40%] align-top py-0.5">: 02/NOT/HA/{getRomanMonth(selectedMonth)}/{selectedYear}</td>
                        {/* Kolom 3: Kanan (45%) - Ada padding kiri agar tidak mepet */}
                        <td className="w-[45%] align-top py-0.5 pl-8">Garut, {formatDateLong(new Date(selectedYear, selectedMonth - 0, 5).toISOString())}</td>
                      </tr>

                      {/* BARIS 2: Lampiran & Kepada Yth */}
                      <tr>
                        <td className="align-top py-0.5">Lampiran</td>
                        <td className="align-top py-0.5">: 5 (lima) Berkas</td>
                        <td className="align-top py-0.5 pl-8 block">Kepada Yth,</td>
                      </tr>

                      {/* BARIS 3: Perihal & Nama Penerima */}
                      <tr>
                        <td className="align-top py-0.5">Perihal</td>
                        <td className="align-top py-0.5 pr-2 leading-tight">
                          <div className="flex">
                            <span className="mr-1">:</span>
                            <span className="w-[60%]">Laporan Bulanan Notaris  {MONTHS[selectedMonth - 1]} {selectedYear}</span>
                          </div>
                        </td>
                        {/* Nama Penerima (Bold) */}
                        <td className="align-top py-0.5 pl-8 font-bold whitespace-pre-line leading-tight">
                          Ketua Majelis Pengawas Daerah Notaris Kabupaten Garut
                        </td>
                      </tr>

                      {/* BARIS 4: Kosong Kiri & 'di' Kanan */}
                      <tr>
                        <td className="align-top"></td>
                        <td className="align-top"></td>
                        <td className="align-top pl-8 py-0.5">Kampus STH Garut
                          Jalan  Hasan Arief No. 2
                        </td>
                      </tr>

                    </tbody>
                  </table>
                  <p className="mb-4 text-justify">Dengan Hormat,<br />Bersama ini, saya Havis Akbar, S.H., M.Kn. selaku Notaris di Kabupaten Garut, dengan ini menyampaikan kepada Majelis Pengawas Daerah Kabupaten Garut untuk dicatat dalam Register dan disimpan di Majelis Pengawas Daerah Kabupaten Garut, yaitu masing-masing 1 (satu) Salinan :</p>
                  <ol className="list-decimal pl-5 space-y-2 mb-6">
                    <li>Daftar Akta, yang terdiri dari : <br />Laporan Bulan {MONTHS[selectedMonth - 1]} {selectedYear}: {formatDeedCount(notarisRecords.filter(r => r.kategori === 'Akta').length)} Akta.</li>
                    <li>Daftar Surat Dibawah Tangan yang disahkan terdiri dari : <br />Laporan Bulan {MONTHS[selectedMonth - 1]} {selectedYear}: {formatDeedCount(notarisRecords.filter(r => r.kategori === 'Legalisasi').length)} Akta.
                      <br />Daftar Surat Dibawah Tangan yang dibukukan terdiri dari : <br />Laporan Bulan {MONTHS[selectedMonth - 1]} {selectedYear}: {formatDeedCount(notarisRecords.filter(r => r.kategori === 'Waarmerking').length)} Akta.
                    </li>
                    <li>Daftar Protes seperti yang dimaksud dalam Pasal 143 C dan Pasal 218 C Kitab Undang - Undang Hukum Perniagaan, yang terdiri dari : <br />Laporan Bulan {MONTHS[selectedMonth - 1]} {selectedYear}: {formatDeedCount(notarisRecords.filter(r => r.kategori === 'Protes').length)} Akta.</li>
                    <li>Daftar Wasiat, yang terdiri dari : <br />Laporan Bulan {MONTHS[selectedMonth - 1]} {selectedYear}: {formatDeedCount(notarisRecords.filter(r => r.kategori === 'Wasiat').length)} Akta.</li>
                  </ol>
                  <p className="mb-4 text-justify">Untuk memenuhi ketentuan Pasal 61 ayat (1) undang – undang Nomor 30 Tahun 2004 tentang Jabatan Notaris. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                  <div className="mt-12 text-right"><p className="pr-2">Notaris Kabupaten Garut</p><div className="h-20"></div><p className="font-bold">Havis Akbar, S.H., M.Kn.</p></div>
                </div>
              </A4Container>
            </div>

            {/* MODEL N1 - N5 */}
            <div ref={notarisModelsRef} id="print-lampiran-notaris">
              {[
                { code: 'N-1', title: 'SALINAN DAFTAR NOTARIIL', filter: 'Akta', cols: ['No Urut', 'No Bulanan', 'Tanggal', 'Sifat Akta', 'Nama Penghadap'] },
                { code: 'N-2', title: 'SALINAN SURAT DIBAWAH TANGAN YANG DISAHKAN', filter: 'Legalisasi', cols: ['No Urut', 'Tanggal Surat', 'Tanggal Didaftarkan', 'Sifat Surat', 'Nama yang Menandatangani dan atau yang Diwakili/ Kuasa'] },
                { code: 'N-3', title: 'SALINAN WAARMERKING', filter: 'Waarmerking', cols: ['No Urut', 'Tanggal Surat', 'Tanggal Didaftarkan', 'Sifat Surat', 'Nama yang Menandatangani dan atau yang Diwakili/ Kuasa'] },
                { code: 'N-4', title: 'SALINAN PROTES', filter: 'Protes', cols: ['No. Urut', 'Nomor Akta', 'Tanggal', 'Yang Ditagih', 'Yang Menagih', 'Tanggal Wesel/ Cheque', 'Tanggal Jatuh Tempo Wesel/ Cheque'] }
              ].map((m, idx) => (
                <div key={m.code} className="print-item-wrapper">
                  <A4Container className={`print-wrapper print-clean font-serif text-black w-[297mm] min-h-[210mm] ${fitToPageHeight ? 'fit-to-page max-h-[210mm]' : ''}`}>
                    <div className="text-center">
                      <h3 className="uppercase text-[11pt] font-bold">{m.title}</h3>
                      <p className="text-[11pt] font-normal pb-2">Bulan {MONTHS[selectedMonth - 1]} {selectedYear}</p>
                      <p className="text-center text-[10pt] mb-3">Yang dimaksud dalam Pasal 61 ayat 1 dan 2 Undang-Undang Jabatan Notaris Nomor 30 Tahun 2004</p>
                    </div>

                    <table className="w-full border-collapse border border-black text-[10pt]">
                      <thead>
                        {m.code === 'N-1' ? (
                          <>
                            <tr className="bg-white text-center font-bold">
                              <th rowSpan={2} className="border border-black w-[5%] align-middle">Nomor Urut</th>
                              <th colSpan={2} className="border border-black w-[20%] align-middle">Akta</th>
                              <th rowSpan={2} className="border border-black w-[35%] align-middle">Sifat Akta</th>
                              <th rowSpan={2} className="border border-black w-[40%] align-middle">Nama Penghadap dan Atau yang diwakili/Kuasa</th>
                            </tr>
                            <tr className="bg-white text-center">
                              <th className="border border-black font-normal">Nomor Bulanan</th>
                              <th className="border border-black font-normal">Tanggal</th>
                            </tr>
                          </>
                        ) : (
                          <tr className="bg-white text-center font-bold">
                            {m.cols.map((c, i) => <th key={i} className="border border-black p-2">{c}</th>)}
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {(() => {
                          const data = notarisRecords.filter(r => r.kategori === m.filter);
                          if (data.length === 0) return <tr><td colSpan={m.code === 'N-1' ? 5 : m.cols.length} className="border border-black p-4 text-center font-bold text-lg">NIHIL</td></tr>;

                          return data.map((d, i) => {
                            const formattedParties = d.pihak.map((p, idx) => (
                              <div key={idx} className="flex items-start">
                                <span className="mr-1 shrink-0">{idx + 1}.</span>
                                <span>{p.name}</span>
                              </div>
                            ));

                            return (
                              <tr key={i} className="align-top">
                                {/* KOLOM 1: NO URUT (GLOBAL) */}
                                <td className="border border-black text-center align-middle">{d.nomorBulanan || '-'}</td>

                                {/* FIX: UBAH BODY MENJADI 2 KOLOM TERPISAH (BUKAN DIV DI DALAM TD) */}
                                {m.code === 'N-1' && (
                                  <>
                                    {/* KOLOM 2: NOMOR BULANAN */}
                                    <td className="border border-black text-center align-middle">
                                      {d.nomorAkta}
                                    </td>

                                    {/* KOLOM 3: TANGGAL */}
                                    <td className="border border-black text-center align-middle">
                                      {formatDateIndo(d.tanggalAkta)}
                                    </td>

                                    {/* KOLOM 4: SIFAT AKTA */}
                                    <td className="border border-black text-center align-middle">{d.judulAkta}</td>

                                    {/* KOLOM 5: PIHAK */}
                                    <td className="border border-black text-left align-top p-1">
                                      {/* Wrapper Grid: Jika pihak > 1, bagi menjadi 2 kolom */}
                                      <div className={`${d.pihak.length > 1 ? 'columns-2  gap-x-2' : ''}`}>
                                        {d.pihak.map((p, pIdx) => (
                                          <div key={pIdx} className="break-inside-avoid">
                                            {/* Nama Pihak Utama */}
                                            <div className="flex items-start">
                                              <span className="mr-1">{pIdx + 1}.</span>
                                              <span>{p.name}</span>
                                            </div>

                                            {/* Kapasitas Bertindak & Yang Diwakili */}
                                            <div className="ml-1 text-sm text-gray-800">
                                              {(p.actingCapacity === 'self' || p.actingCapacity === 'both') && (
                                                <div></div>
                                              )}
                                              {(p.actingCapacity === 'representative' || p.actingCapacity === 'both') && (
                                                <div>- untuk dirinya sendiri, untuk & atas nama :</div>
                                              )}
                                              {/* Daftar Kuasa (a, b, c) - Nested Grid jika banyak */}
                                              {p.representedParties && p.representedParties.length > 0 && (
                                                <div>
                                                  {p.representedParties.map((repName, rIdx) => (
                                                    <div key={rIdx} className="pl-2 flex items-start">
                                                      <span className="w-3">{String.fromCharCode(97 + rIdx)}.</span>
                                                      <span>{repName}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </>
                                )}

                                {/* LOGIC MODEL LAIN (N2-N5) - TETAP SAMA */}
                                {(m.code === 'N-2' || m.code === 'N-3' || m.code === 'N-4') && (
                                  <>
                                    <td className="border border-black text-center align-middle">{formatDateIndo(d.tanggalAkta)}</td>
                                    <td className="border border-black text-center align-middle">{d.judulAkta}</td>
                                    <td className="border border-black text-center align-middle w-[20%]">
                                      {d.pihak.map((p, idx) => (
                                        <div key={idx} className="flex items-start">
                                          <span className="mr-1 shrink-0">{idx + 1}.</span>
                                          <span>{p.name}</span>
                                        </div>
                                      ))}
                                    </td>
                                  </>
                                )}

                                {/* UPDATE: Logic Khusus N-2 (5 Kolom) */}
                                {m.code === 'N-4' && (
                                  <>
                                    {/* Tanggal Surat (Placeholder karena belum ada input khusus) */}
                                    <td className="border border-black p-2 text-center">-</td>
                                    {/* Tanggal Didaftarkan (Ambil dari Tanggal Akta) */}
                                    <td className="border border-black p-2 text-center">{formatDateIndo(d.tanggalAkta)}</td>
                                    <td className="border border-black p-2">{d.judulAkta}</td>
                                    <td className="border border-black p-2">
                                      {d.pihak.map((p, idx) => (
                                        <div key={idx} className="flex items-start">
                                          <span className="mr-1 shrink-0">{idx + 1}.</span>
                                          <span>{p.name}</span>
                                        </div>
                                      ))}
                                    </td>
                                  </>
                                )}

                                {/* Logic N-3 s/d N-4 */}
                                {(m.code === 'N-3' || m.code === 'N-4') && (
                                  <>
                                    <td className="border border-black p-2">{formatDateIndo(d.tanggalAkta)}</td>
                                    <td className="border border-black p-2">{d.judulAkta}</td>
                                    <td className="border border-black p-2">
                                      {d.pihak.map((p, idx) => (
                                        <div key={idx} className="flex items-start">
                                          <span className="mr-1 shrink-0">{idx + 1}.</span>
                                          <span>{p.name}</span>
                                        </div>
                                      ))}
                                    </td>
                                  </>
                                )}
                              </tr>
                            )
                          });
                        })()}
                      </tbody>
                    </table>
                    <div className="mt-5 text-[11pt] text-right">
                      <p>Salinan ini sesuai dengan aslinya,</p>
                      <p>Garut, {formatDateLong(new Date(selectedYear, selectedMonth - 0, 5).toISOString())}</p>
                      <div className="h-16"></div>
                      <p className="font-bold">(HAVIS AKBAR, S.H., M.Kn.)</p>
                    </div>
                  </A4Container>
                  {/* Spacer no-print */}
                  <div className="h-8 bg-gray-200 no-print"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}