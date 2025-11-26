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
} from 'lucide-react';

// --- CONSTANTS ---
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

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
  pihak: [{ name: '', role: 'Pihak Pengalih / Penghadap' }],
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
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[month - 1] || "";
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

  // --- HANDLERS ---
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
    setFormState({
      jenis: rec.jenis,
      nomorAkta: rec.nomorAkta,
      tanggalAkta: rec.tanggalAkta,
      judulAkta: rec.judulAkta,
      kategori: rec.kategori || 'Akta',
      pihak: rec.pihak,
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

  const downloadPDF = async (element: HTMLElement | null, filename: string, orientation: 'portrait' | 'landscape') => {
    if (!element) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: orientation === 'landscape' ? 1123 : 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation }
    };
    html2pdf().set(opt).from(element).save();
  };

  // --- LOGIC REKAP PPAT ---
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
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
          <p className="text-sm text-gray-500">Periode: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border p-2 rounded-lg">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border p-2 rounded-lg">
            {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
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
              <div><label className="block text-xs font-bold text-gray-500 mb-1">NOMOR AKTA</label><input className="w-full border p-2 rounded" value={formState.nomorAkta} onChange={e => setFormState({ ...formState, nomorAkta: e.target.value })} placeholder="01/2025" /></div>

              {formState.jenis === 'Notaris' && (
                <div><label className="block text-xs font-bold text-gray-500 mb-1">NO URUT BULANAN</label><input className="w-full border p-2 rounded" value={formState.nomorBulanan} onChange={e => setFormState({ ...formState, nomorBulanan: e.target.value })} placeholder="1" /></div>
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
                <label className="block text-xs font-bold text-gray-500 mb-2">PIHAK TERLIBAT</label>
                {formState.pihak.map((p, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input className="flex-1 border p-2 rounded" placeholder="Nama" value={p.name} onChange={e => { const newPihak = [...formState.pihak]; newPihak[idx].name = e.target.value; setFormState({ ...formState, pihak: newPihak }); }} />
                    {idx === 0 ? <button onClick={() => setFormState({ ...formState, pihak: [...formState.pihak, { name: '', role: '' }] })} className="px-2 bg-gray-200 rounded">+</button> : <button onClick={() => { const newPihak = formState.pihak.filter((_, i) => i !== idx); setFormState({ ...formState, pihak: newPihak }); }} className="px-2 bg-red-100 text-red-600 rounded">x</button>}
                  </div>
                ))}
              </div>

              {formState.jenis === 'PPAT' && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-blue-700 uppercase">Detail PPAT</p>
                  <input className="w-full border p-2 rounded text-xs" placeholder="Pihak Penerima" value={formState.detailPPAT.pihakPenerima} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, pihakPenerima: e.target.value } })} />
                  <input className="w-full border p-2 rounded text-xs" placeholder="Jenis & No Hak (HM 123)" value={formState.detailPPAT.jenisHak} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, jenisHak: e.target.value } })} />
                  <textarea className="w-full border p-2 rounded text-xs" placeholder="Lokasi Tanah" value={formState.detailPPAT.lokasiObjek} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, lokasiObjek: e.target.value } })} />
                  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded text-xs" placeholder="Luas Tanah" value={formState.detailPPAT.luasTanah} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, luasTanah: e.target.value } })} /><input className="border p-2 rounded text-xs" placeholder="Luas Bangunan" value={formState.detailPPAT.luasBangunan} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, luasBangunan: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded text-xs" placeholder="Harga Transaksi" value={formState.detailPPAT.nilaiTransaksi} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, nilaiTransaksi: e.target.value } })} /><input className="border p-2 rounded text-xs" placeholder="NJOP" value={formState.detailPPAT.njop} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, njop: e.target.value } })} /></div>
                  <input className="w-full border p-2 rounded text-xs" placeholder="NOP" value={formState.detailPPAT.nop} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, nop: e.target.value } })} />
                  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded text-xs" placeholder="SSP (Rp)" value={formState.detailPPAT.ssp} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, ssp: e.target.value } })} /><input className="border p-2 rounded text-xs" placeholder="SSB (Rp)" value={formState.detailPPAT.ssb} onChange={e => setFormState({ ...formState, detailPPAT: { ...formState.detailPPAT, ssb: e.target.value } })} /></div>
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
                      <td className="p-3">{i + 1}</td>
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
              <button onClick={() => downloadPDF(ppatLetterRef.current, `Surat_Pengantar_PPAT`, 'portrait')} className="w-full bg-gray-800 text-white py-2 px-4 rounded mb-3 flex items-center justify-center gap-2 text-sm"><Download size={16} /> 1. Surat Pengantar</button>
              <button onClick={() => downloadPDF(ppatLampiranRef.current, `Lampiran_PPAT`, 'landscape')} className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded flex items-center justify-center gap-2 text-sm"><Printer size={16} /> 2. Lampiran Tabel</button>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-8 overflow-auto h-[calc(100vh-150px)] pr-2">
            {/* SURAT PENGANTAR (4 HALAMAN) */}
            <div ref={ppatLetterRef}>
              {[
                { to: 'Kepala Kantor\nBadan Pertanahan Nasional\n Kabupaten Garut', address: 'Jl. Suherman, Desa Jati,\nTarogong Kaler, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor Wilayah\nBadan Pertanahan Nasional \nProvinsi Jawa Barat', address: 'Jl. Soekarno Hatta No. 586\nSekejati, Kec. BuahBatu,\nKota Bandung 40286' },
                { to: 'Kepala Kantor\nBadan Pendapatan Daerah Kabupaten Garut', address: 'Jl. Otista No. 278, Sukagalih,\nKec. Tarogong Kidul, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor\nPelayanan Pajak Pratama Garut', address: 'Jl. Pembangunan No.224,\nSukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' }
              ].map((r, idx) => (
                <div key={idx} className={idx > 0 ? "break-before-page" : ""}>
                  <A4Container className="print-wrapper font-serif text-black">
                    <KopLapbulPPAT />

                    <table className="text-[11pt] font-serif mb-6 w-full border-collapse">
                      <tbody>
                        {/* BARIS 1: Nomor & Tanggal */}
                        <tr>
                          {/* Kolom 1: Label Kiri (15%) */}
                          <td className="w-[15%] align-top py-0.5">Nomor</td>
                          {/* Kolom 2: Isi Kiri (40%) */}
                          <td className="w-[40%] align-top py-0.5">: 01/PPAT/HA/{getRomanMonth(selectedMonth)}/{selectedYear}</td>
                          {/* Kolom 3: Kanan (45%) - Ada padding kiri agar tidak mepet */}
                          <td className="w-[45%] align-top py-0.5 pl-8">Garut, {formatDateIndo(new Date().toISOString())}</td>
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

                    <div className="text-[12pt] text-justify leading-relaxed">
                      <p className="mb-4">Dengan hormat,<br />Bersama dengan ini kami menyampaikan Laporan Bulanan Pembuatan Akta PPAT untuk Bulan <strong>{MONTHS[selectedMonth - 2].toUpperCase()} {selectedYear}</strong>, sesuai daftar terlampir dengan perincian sebagai berikut:</p>
                      <div className="p-2 mb-4">
                        <table className="w-full">
                          <tbody>
                            {Object.entries(ppatSummary.types).map(([k, v]) => <tr key={k}><td className="font-bold w-1/4">{k}</td><td>: {v} Akta</td></tr>)}
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
                  <div className="h-8 bg-gray-200 no-print"></div>
                </div>
              ))}
            </div>

            {/* LAMPIRAN LANDSCAPE */}
            <div ref={ppatLampiranRef}>
              {[
                { to: 'Kepala Kantor\nBadan Pertanahan Nasional Kabupaten Garut', address: 'Jl. Suherman, Desa Jati, Tarogong Kaler, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor Wilayah\nBadan Pertanahan Nasional Provinsi Jawa Barat', address: 'Jl. Soekarno Hatta No. 586 Sekejati, Kec. BuahBatu, Kota Bandung 40286' },
                { to: 'Kepala Kantor\nBadan Pendapatan Daerah Kabupaten Garut', address: 'Jl. Otista No. 278, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' },
                { to: 'Kepala Kantor\nPelayanan Pajak Pratama Garut', address: 'Jl. Pembangunan No.224, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' }
              ].map((r, idx) => (
                <div key={idx} className={idx > 0 ? "break-before-page" : ""}>
                  <div className="bg-white p-8 print-wrapper" style={{ width: '297mm', minHeight: '210mm' }}>

                    {/* --- HEADER MENGGUNAKAN FLEXBOX (Bukan Table Tunggal) --- */}
                    <div className="flex justify-between items-start mb-5 font-serif text-[10pt] font-bold">

                      {/* SISI KIRI: Tabel Identitas PPAT */}
                      <div className="w-[60%]">
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr>
                              <td className="align-top w-[30%] pb-1">Nama PPAT</td>
                              <td className="align-top w-[70%] pb-1">: HAVIS AKBAR, S.H., M.Kn</td>
                            </tr>
                            <tr>
                              <td className="align-top pb-1">Daerah Kerja</td>
                              <td className="align-top pb-1">: Seluruh Kecamatan Kabupaten Garut</td>
                            </tr>
                            <tr>
                              <td className="align-top pb-1">Alamat</td>
                              <td className="align-top font-thin pb-1 whitespace-pre-line leading-tight">: Jalan Jendral Sudirman - Ruko Mandala Residence No. 31, Kel. Sukamentri, Kec. Garut Kota, Kab. Garut, Jawa Barat 44116</td>
                            </tr>
                            <tr>
                              <td className="align-top pb-1">NPWP/KTP</td>
                              <td className="align-top font-thin pb-1">: 55.743.562.5-013.000 / 3217062010780024</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* SISI KANAN: Alamat Tujuan */}
                      <div className="w-[50%] pl-10">
                        <p className="mb-1">KEPADA YTH.</p>
                        <div className="whitespace-pre-line leading-tight">
                          {r.to}
                        </div>
                        <div className="whitespace-pre-line leading-tight">
                          {r.address}
                        </div>
                      </div>

                    </div>
                    {/* --- END HEADER --- */}

                    <div className="text-center font-bold mb-4 text-[11pt]">
                      <p>LAPORAN BULANAN PEMBUATAN AKTA OLEH PPAT</p>
                      <p>BULAN {MONTHS[selectedMonth - 2].toUpperCase()} TAHUN {selectedYear}</p>
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
                          <tr>
                            <td
                              colSpan={18}
                              className="text-center py-6 text-gray-500 text-sm"
                            >
                              NIHIL
                            </td>
                          </tr>
                        ) : (
                          ppatRecords.map((record, index) => {
                            const mengalihkan = record.pihak
                              .filter(p => /penjual|pemberi|ahli waris|pemilik/i.test(p.role))
                              .map(p => p.name)
                              .join(', ');
                            const menerima = record.pihak
                              .filter(p => /pembeli|penerima/i.test(p.role))
                              .map(p => p.name)
                              .join(', ');

                            const displayMengalihkan = mengalihkan || (!menerima ? record.pihak.map(p => p.name).join(', ') : '-');
                            const displayMenerima = menerima || (!mengalihkan ? record.pihak.map(p => p.name).join(', ') : '-');

                            return (
                              <tr key={record.id} className="align-top">
                                <td className="border border-gray-300 px-1 py-1 text-center">{index + 1}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.nomorAkta}</td>
                                <td className="border border-gray-300 px-1 py-1 text-center">
                                  {formatDateIndo(record.tanggalAkta)}
                                </td>
                                <td className="border border-gray-300 px-1 py-1">{record.judulAkta}</td>
                                <td className="border border-gray-300 px-1 py-1">{displayMengalihkan}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.pihakPenerima}</td>
                                <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.jenisHak || '-'}</td>
                                <td className="border border-gray-300 px-1 py-1">
                                  {record.detailPPAT?.lokasiObjek || '-'}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-center">
                                  {record.detailPPAT?.luasTanah || 0}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-center">
                                  {record.detailPPAT?.luasBangunan || 0}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-right">
                                  {currency(record.detailPPAT?.nilaiTransaksi || '-')}
                                </td>
                                <td className="border border-gray-300 px-1 py-1">
                                  {record.detailPPAT?.nop || '-'}<br />
                                  {selectedYear}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-right">
                                  {record.detailPPAT?.njop || '-'}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                                <td className="border border-gray-300 px-1 py-1 text-right">
                                  {currency(record.detailPPAT?.ssp || '-')}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                                <td className="border border-gray-300 px-1 py-1 text-right">
                                  {currency(record.detailPPAT?.ssb || '-')}
                                </td>
                                <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    <div className="mt-8 flex justify-end text-[10pt] font-serif text-center">
                      <div><p>Garut, {formatDateIndo(new Date().toISOString())}</p><div className="h-16"></div><p className="font-bold underline">HAVIS AKBAR, S.H., M.Kn.</p></div>
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
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <h3 className="font-bold mb-4 text-gray-700">Cetak Laporan</h3>
              <button onClick={() => downloadPDF(notarisLetterRef.current, `Pengantar_MPD`, 'portrait')} className="w-full bg-gray-800 text-white py-2 px-4 rounded mb-3 flex items-center justify-center gap-2 text-sm"><Download size={16} /> 1. Surat Pengantar</button>
              <button onClick={() => downloadPDF(notarisModelsRef.current, `Model_N1_N5`, 'portrait')} className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded flex items-center justify-center gap-2 text-sm"><Printer size={16} /> 2. Model N-1 s/d N-5</button>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-8 overflow-auto h-[calc(100vh-150px)] pr-2">
            {/* SURAT PENGANTAR */}
            <div ref={notarisLetterRef}>
              <A4Container className="print-wrapper font-serif text-black">
                <KopSurat />
                <div className="text-[11pt] leading-relaxed mt-6">
                  <table className="w-full mb-6"><tbody><tr><td className="w-24">Nomor</td><td>: 01/NOT/HA/X/{selectedYear}</td></tr><tr><td>Lampiran</td><td>: 5 (lima) Berkas</td></tr><tr><td>Perihal</td><td>: Laporan Bulanan {MONTHS[selectedMonth - 1]} {selectedYear}</td></tr></tbody></table>
                  <div className="mb-6"><p>Garut, {formatDateLong(new Date().toISOString())}</p><p className="mt-4">Kepada Yth,</p><p className="font-bold">Ketua Majelis Pengawas Daerah</p><p className="font-bold">Notaris Kabupaten Garut</p><p>Kampus STH Garut, Jl. Hasan Arief No. 2</p><p>di - Garut</p></div>
                  <p className="mb-4 text-justify">Dengan Hormat,<br />Bersama ini, saya Havis Akbar, S.H., M.Kn. selaku Notaris di Kabupaten Garut, menyampaikan kepada Majelis Pengawas Daerah Kabupaten Garut untuk dicatat dalam Register dan disimpan, yaitu masing-masing 1 (satu) Salinan :</p>
                  <ol className="list-decimal pl-5 space-y-2 mb-6">
                    <li><strong>Daftar Akta,</strong> Laporan Bulan {MONTHS[selectedMonth - 1]}: {notarisRecords.filter(r => r.kategori === 'Akta').length} Akta.</li>
                    <li><strong>Legalisasi,</strong> Laporan Bulan {MONTHS[selectedMonth - 1]}: {notarisRecords.filter(r => r.kategori === 'Legalisasi').length} Akta.</li>
                    <li><strong>Waarmerking,</strong> Laporan Bulan {MONTHS[selectedMonth - 1]}: {notarisRecords.filter(r => r.kategori === 'Waarmerking').length} Akta.</li>
                    <li><strong>Protes,</strong> Laporan Bulan {MONTHS[selectedMonth - 1]}: Nihil.</li>
                    <li><strong>Wasiat,</strong> Laporan Bulan {MONTHS[selectedMonth - 1]}: Nihil.</li>
                  </ol>
                  <div className="mt-12"><p>Notaris Kabupaten Garut</p><div className="h-20"></div><p className="font-bold underline">Havis Akbar, S.H., M.Kn.</p></div>
                </div>
              </A4Container>
            </div>

            {/* MODEL N1 - N5 */}
            <div ref={notarisModelsRef}>
              {[
                { code: 'N-1', title: 'SALINAN DAFTAR NOTARIIL', filter: 'Akta', cols: ['No Urut', 'No Bulanan', 'Tanggal', 'Sifat Akta', 'Nama Penghadap'] },
                { code: 'N-2', title: 'DAFTAR LEGALISASI', filter: 'Legalisasi', cols: ['No Urut', 'Tanggal', 'Sifat Surat', 'Nama Penandatangan'] },
                { code: 'N-3', title: 'DAFTAR WAARMERKING', filter: 'Waarmerking', cols: ['No Urut', 'Tanggal', 'Sifat Surat', 'Nama Penandatangan'] },
                { code: 'N-4', title: 'DAFTAR PROTES', filter: 'Protes', cols: ['No', 'Tgl', 'Pihak', 'Ket'] },
                { code: 'N-5', title: 'DAFTAR WASIAT', filter: 'Wasiat', cols: ['No', 'Tgl', 'Pemberi Wasiat', 'Ket'] }
              ].map((m, idx) => (
                <div key={m.code} className={idx > 0 ? "break-before-page" : ""}>
                  <A4Container className="print-wrapper font-serif text-black">
                    <div className="text-center font-bold mb-6"><h3 className="uppercase text-[12pt]">{m.title}</h3><p className="text-[11pt] font-normal">Bulan {MONTHS[selectedMonth - 1]} {selectedYear}</p></div>
                    <table className="w-full border-collapse border border-black text-[10pt]">
                      <thead><tr className="bg-gray-100 text-center font-bold">{m.cols.map(c => <th key={c} className="border border-black p-2">{c}</th>)}</tr></thead>
                      <tbody>
                        {(() => {
                          const data = notarisRecords.filter(r => r.kategori === m.filter);
                          if (data.length === 0) return <tr><td colSpan={m.cols.length} className="border border-black p-4 text-center font-bold text-lg">NIHIL</td></tr>;
                          return data.map((d, i) => (
                            <tr key={i} className="align-top">
                              <td className="border border-black p-2 text-center">{i + 1}</td>
                              {m.code === 'N-1' && <><td className="border border-black p-2 text-center">{d.nomorBulanan}</td><td className="border border-black p-2">{formatDateIndo(d.tanggalAkta)}</td><td className="border border-black p-2">{d.judulAkta}</td><td className="border border-black p-2">{d.pihak.map(p => p.name).join(', ')}</td></>}
                              {(m.code === 'N-2' || m.code === 'N-3') && <><td className="border border-black p-2">{formatDateIndo(d.tanggalAkta)}</td><td className="border border-black p-2">{d.judulAkta}</td><td className="border border-black p-2">{d.pihak.map(p => p.name).join(', ')}</td></>}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                    <div className="mt-8 text-[11pt]"><p>Salinan sesuai aslinya,</p><p>Garut, {formatDateLong(new Date().toISOString())}</p><div className="h-16"></div><p className="font-bold underline">(HAVIS AKBAR, S.H., M.Kn.)</p></div>
                  </A4Container>
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