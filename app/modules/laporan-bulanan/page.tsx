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
import A4LandscapeContainer from '@/components/documents/A4LandscapeContainer';
import KopSurat from '@/components/documents/KopSurat';
import KopLapbulPPAT from '@/components/documents/KopLapbulPPAT';
import {
  AlertCircle,
  Download,
  Edit3,
  FileBarChart,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

const YEAR_RANGE = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, idx) => currentYear - 3 + idx);
})();

const NOTARIS_CATEGORIES: NotarisCategory[] = [
  'Akta',
  'Legalisasi',
  'Waarmerking',
  'Wasiat',
];

const DEFAULT_PPAT_DETAIL: DeedPPATDetails = {
  nop: '',
  njop: '',
  luasTanah: '',
  luasBangunan: '',
  lokasiObjek: '',
  nilaiTransaksi: '',
  ssp: '',
  ssb: '',
};

type PpatRecipientKey = 'bpnKab' | 'bpnKanwil' | 'dispenda' | 'kppPratama';

const PPAT_RECIPIENTS: Record<
  PpatRecipientKey,
  { label: string; description: string }
> = {
  bpnKab: { label: 'BPN Kabupaten', description: 'Kantor Pertanahan Kab. Garut' },
  bpnKanwil: { label: 'BPN Kanwil', description: 'Kantor Wilayah BPN Jawa Barat' },
  dispenda: { label: 'Dispenda', description: 'Dinas Pendapatan Daerah' },
  kppPratama: { label: 'KPP Pratama', description: 'KPP Pratama Garut' },
};

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
}

const createEmptyFormState = (
  month: number,
  year: number,
): LapbulFormState => ({
  jenis: 'Notaris',
  nomorAkta: '',
  tanggalAkta: new Date(year, month - 1, 1).toISOString().split('T')[0],
  judulAkta: '',
  kategori: 'Akta',
  pihak: [
    { name: '', role: 'Pihak I' },
    { name: '', role: 'Pihak II' },
  ],
  detailPPAT: { ...DEFAULT_PPAT_DETAIL },
  bulanPelaporan: month,
  tahunPelaporan: year,
});

const NOTARIS_MODELS = [
  { code: 'N-1', title: 'Akta Notariil', categories: ['Akta'] as NotarisCategory[] },
  { code: 'N-2', title: 'Legalisasi', categories: ['Legalisasi'] as NotarisCategory[] },
  { code: 'N-3', title: 'Waarmerking', categories: ['Waarmerking'] as NotarisCategory[] },
  { code: 'N-4', title: 'Wasiat / Hibah', categories: ['Wasiat'] as NotarisCategory[] },
  {
    code: 'N-5',
    title: 'Rekapitulasi Umum',
    categories: NOTARIS_CATEGORIES,
  },
];

const currency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatDateLong = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function LapbulModulePage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    today.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [activeTab, setActiveTab] = useState<'data' | 'notaris' | 'ppat'>(
    'data',
  );

  const [deeds, setDeeds] = useState<DeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<LapbulFormState>(() =>
    createEmptyFormState(today.getMonth() + 1, today.getFullYear()),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [pdfTarget, setPdfTarget] = useState<string | null>(null);
  const [ppatDestinations, setPpatDestinations] = useState<
    Record<PpatRecipientKey, boolean>
  >({
    bpnKab: true,
    bpnKanwil: false,
    dispenda: false,
    kppPratama: false,
  });

  const ppatLetterRef = useRef<HTMLDivElement>(null);
  const ppatLampiranRef = useRef<HTMLDivElement>(null);
  const notarisLetterRef = useRef<HTMLDivElement>(null);
  const notarisModelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let subscribed = true;
    const loadDeeds = async () => {
      try {
        const response = await getDeeds();
        if (subscribed) setDeeds(response);
      } catch (error) {
        console.error('Gagal memuat data akta', error);
      } finally {
        if (subscribed) setLoading(false);
      }
    };
    loadDeeds();
    return () => {
      subscribed = false;
    };
  }, []);

  useEffect(() => {
    if (editingId) return;
    setFormState((prev) => ({
      ...prev,
      bulanPelaporan: selectedMonth,
      tahunPelaporan: selectedYear,
    }));
  }, [selectedMonth, selectedYear, editingId]);

  const filteredDeeds = useMemo(
    () =>
      deeds.filter(
        (deed) =>
          deed.bulanPelaporan === selectedMonth &&
          deed.tahunPelaporan === selectedYear,
      ),
    [deeds, selectedMonth, selectedYear],
  );

  const ppatRecords = filteredDeeds.filter((deed) => deed.jenis === 'PPAT');
  const notarisRecords = filteredDeeds.filter(
    (deed) => deed.jenis === 'Notaris',
  );

  const summary = useMemo(() => {
    const totalTransaksi = ppatRecords.reduce((sum, deed) => {
      const raw = deed.detailPPAT?.nilaiTransaksi ?? '0';
      const numeric = Number(raw.toString().replace(/[^\d]/g, '')) || 0;
      return sum + numeric;
    }, 0);
    const totalSSP = ppatRecords.reduce((sum, deed) => {
      const raw = deed.detailPPAT?.ssp ?? '0';
      const numeric = Number(raw.toString().replace(/[^\d]/g, '')) || 0;
      return sum + numeric;
    }, 0);
    const totalSSB = ppatRecords.reduce((sum, deed) => {
      const raw = deed.detailPPAT?.ssb ?? '0';
      const numeric = Number(raw.toString().replace(/[^\d]/g, '')) || 0;
      return sum + numeric;
    }, 0);
    return {
      totalNotaris: notarisRecords.length,
      totalPPAT: ppatRecords.length,
      totalTransaksi,
      totalSSP,
      totalSSB,
    };
  }, [notarisRecords.length, ppatRecords]);

  const notarisByCategory = useMemo(() => {
    return NOTARIS_CATEGORIES.reduce<Record<NotarisCategory, DeedRecord[]>>(
      (acc, category) => {
        acc[category] = notarisRecords.filter(
          (record) => record.kategori === category,
        );
        return acc;
      },
      {
        Akta: [],
        Legalisasi: [],
        Waarmerking: [],
        Wasiat: [],
      },
    );
  }, [notarisRecords]);

  const handleFormField = <T extends keyof LapbulFormState>(
    field: T,
    value: LapbulFormState[T],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handlePartyChange = (index: number, field: keyof DeedParty, value: string) => {
    setFormState((prev) => {
      const next = [...prev.pihak];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, pihak: next };
    });
  };

  const addPartyRow = () => {
    setFormState((prev) => ({
      ...prev,
      pihak: [...prev.pihak, { name: '', role: `Pihak ${prev.pihak.length + 1}` }],
    }));
  };

  const removePartyRow = (index: number) => {
    setFormState((prev) => {
      if (prev.pihak.length === 1) return prev;
      return { ...prev, pihak: prev.pihak.filter((_, idx) => idx !== index) };
    });
  };

  const handlePPATDetailChange = (
    field: keyof DeedPPATDetails,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      detailPPAT: { ...prev.detailPPAT, [field]: value },
    }));
  };

  const resetForm = () => {
    setFormState(createEmptyFormState(selectedMonth, selectedYear));
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formState.nomorAkta.trim() || !formState.judulAkta.trim()) {
      alert('Nomor akta dan judul akta wajib diisi.');
      return;
    }
    setSavingForm(true);
    const payload = {
      jenis: formState.jenis,
      nomorAkta: formState.nomorAkta,
      tanggalAkta: formState.tanggalAkta,
      judulAkta: formState.judulAkta,
      kategori: formState.jenis === 'Notaris' ? formState.kategori : null,
      pihak: formState.pihak.filter((party) => party.name.trim()),
      detailPPAT:
        formState.jenis === 'PPAT' ? { ...formState.detailPPAT } : null,
      bulanPelaporan: formState.bulanPelaporan,
      tahunPelaporan: formState.tahunPelaporan,
    };
    try {
      if (editingId) {
        const response = await updateDeed(editingId, payload);
        setDeeds((prev) =>
          prev.map((deed) =>
            deed.id === editingId ? (response.data as DeedRecord) : deed,
          ),
        );
        alert('Data akta berhasil diperbarui.');
      } else {
        const response = await createDeed(payload);
        setDeeds((prev) => [...prev, response.data as DeedRecord]);
        alert('Data akta baru tersimpan.');
      }
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data akta.');
    } finally {
      setSavingForm(false);
    }
  };

  const handleEdit = (record: DeedRecord) => {
    setEditingId(record.id);
    setFormState({
      jenis: record.jenis,
      nomorAkta: record.nomorAkta,
      tanggalAkta: record.tanggalAkta,
      judulAkta: record.judulAkta,
      kategori: record.kategori ?? 'Akta',
      pihak: record.pihak.length
        ? record.pihak
        : [{ name: '', role: 'Pihak I' }],
      detailPPAT: record.detailPPAT
        ? { ...record.detailPPAT }
        : { ...DEFAULT_PPAT_DETAIL },
      bulanPelaporan: record.bulanPelaporan,
      tahunPelaporan: record.tahunPelaporan,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmation = confirm('Yakin ingin menghapus data akta ini?');
    if (!confirmation) return;
    setMutatingId(id);
    try {
      await deleteDeed(id);
      setDeeds((prev) => prev.filter((record) => record.id !== id));
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus data akta.');
    } finally {
      setMutatingId(null);
    }
  };

  const toggleDestination = (key: PpatRecipientKey) => {
    setPpatDestinations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const downloadPDF = useCallback(
    async (
      element: HTMLDivElement | null,
      filename: string,
      orientation: 'portrait' | 'landscape' = 'portrait',
    ) => {
      if (!element) {
        alert('Area dokumen belum siap.');
        return;
      }
      setPdfTarget(filename);
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const opt = {
          margin: 0,
          filename: `${filename}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            width: element.scrollWidth,
            windowWidth: element.scrollWidth,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation,
          },
        } as const;
        await html2pdf().set(opt).from(element).save();
      } catch (error) {
        console.error('PDF generation error', error);
        alert('Gagal membuat PDF.');
      } finally {
        setPdfTarget(null);
      }
    },
    [],
  );

  const monthLabel = MONTHS[selectedMonth - 1];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-800">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-semibold">
            Pusat Laporan Bulanan
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lapbul Notaris & PPAT
              </h1>
              <p className="text-gray-500">
                Kelola data akta dan cetak laporan resmi sesuai kewajiban bulanan.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {MONTHS.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {YEAR_RANGE.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Akta Notaris</p>
              <p className="text-3xl font-bold text-gray-900">
                {summary.totalNotaris}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Akta PPAT</p>
              <p className="text-3xl font-bold text-gray-900">
                {summary.totalPPAT}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Nilai Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {currency(summary.totalTransaksi)}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Total SSP + SSB</p>
              <p className="text-xl font-bold text-gray-900">
                {currency(summary.totalSSP + summary.totalSSB)}
              </p>
            </div>
          </div>
        </header>

        <nav className="bg-white rounded-2xl border border-gray-200 p-1 flex overflow-auto">
          {[
            { key: 'data', label: 'Data Akta' },
            { key: 'notaris', label: 'Generate Laporan Notaris' },
            { key: 'ppat', label: 'Generate Laporan PPAT' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'data' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {editingId ? 'Edit Data Akta' : 'Tambah Data Akta'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Input lengkap agar laporan otomatis tersusun.
                    </p>
                  </div>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-xs font-semibold text-blue-600 flex items-center gap-1"
                    >
                      <RefreshCw size={14} /> Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Jenis
                    </label>
                    <select
                      value={formState.jenis}
                      onChange={(e) =>
                        handleFormField('jenis', e.target.value as DeedType)
                      }
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="Notaris">Notaris</option>
                      <option value="PPAT">PPAT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Nomor Akta
                    </label>
                    <input
                      type="text"
                      value={formState.nomorAkta}
                      onChange={(e) => handleFormField('nomorAkta', e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="123 / HK / II / 2025"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Tanggal Akta
                    </label>
                    <input
                      type="date"
                      value={formState.tanggalAkta}
                      onChange={(e) => handleFormField('tanggalAkta', e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Bulan Pelaporan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formState.bulanPelaporan}
                        onChange={(e) =>
                          handleFormField('bulanPelaporan', Number(e.target.value))
                        }
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {MONTHS.map((label, index) => (
                          <option key={label} value={index + 1}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formState.tahunPelaporan}
                        onChange={(e) =>
                          handleFormField('tahunPelaporan', Number(e.target.value))
                        }
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {YEAR_RANGE.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Judul / Sifat Akta
                  </label>
                  <textarea
                    value={formState.judulAkta}
                    onChange={(e) => handleFormField('judulAkta', e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Akta jual beli, pendirian, hibah, dsb."
                  />
                </div>

                {formState.jenis === 'Notaris' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Kategori
                    </label>
                    <select
                      value={formState.kategori}
                      onChange={(e) =>
                        handleFormField(
                          'kategori',
                          e.target.value as NotarisCategory,
                        )
                      }
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {NOTARIS_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Pihak Terlibat
                    </label>
                    <button
                      onClick={addPartyRow}
                      className="text-xs font-semibold text-blue-600 flex items-center gap-1"
                    >
                      <Plus size={14} /> Tambah
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formState.pihak.map((party, index) => (
                      <div
                        key={`${party.role}-${index}`}
                        className="grid grid-cols-2 gap-2"
                      >
                        <input
                          value={party.name}
                          onChange={(e) =>
                            handlePartyChange(index, 'name', e.target.value)
                          }
                          placeholder={`Nama ${party.role}`}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            value={party.role}
                            onChange={(e) =>
                              handlePartyChange(index, 'role', e.target.value)
                            }
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
                          />
                          {formState.pihak.length > 1 && (
                            <button
                              onClick={() => removePartyRow(index)}
                              className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formState.jenis === 'PPAT' && (
                  <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                    <div className="flex items-center gap-2 text-blue-700 font-semibold">
                      <FileText size={16} />
                      Detail PPAT
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {(
                        [
                          ['nop', 'NOP'],
                          ['njop', 'NJOP'],
                          ['luasTanah', 'Luas Tanah (m²)'],
                          ['luasBangunan', 'Luas Bangunan (m²)'],
                          ['lokasiObjek', 'Lokasi Objek'],
                          ['nilaiTransaksi', 'Nilai Transaksi (Rp)'],
                          ['ssp', 'SSP (Rp)'],
                          ['ssb', 'SSB (Rp)'],
                        ] as [keyof DeedPPATDetails, string][]
                      ).map(([field, label]) => (
                        <label key={field} className="space-y-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            {label}
                          </span>
                          <input
                            value={formState.detailPPAT[field]}
                            onChange={(e) =>
                              handlePPATDetailChange(field, e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={savingForm}
                    className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FileBarChart size={16} />
                    {savingForm
                      ? 'Menyimpan...'
                      : editingId
                      ? 'Update Data'
                      : 'Simpan Data'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Daftar Akta Bulan Ini</h3>
                    <p className="text-sm text-gray-500">
                      {loading ? 'Memuat data...' : `${filteredDeeds.length} data ditemukan`}
                    </p>
                  </div>
                </div>
                {filteredDeeds.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl text-sm text-gray-500">
                    <AlertCircle size={16} />
                    Belum ada data akta pada periode ini. Tambahkan melalui form di kiri.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-xs uppercase text-gray-500 border-b">
                          <th className="py-2 pr-4">Jenis</th>
                          <th className="py-2 pr-4">No. Akta</th>
                          <th className="py-2 pr-4">Tanggal</th>
                          <th className="py-2 pr-4">Judul / Pihak</th>
                          <th className="py-2 pr-4">Detail</th>
                          <th className="py-2">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeeds
                          .sort(
                            (a, b) =>
                              new Date(b.tanggalAkta).getTime() -
                              new Date(a.tanggalAkta).getTime(),
                          )
                          .map((record) => (
                            <tr key={record.id} className="border-b last:border-0">
                              <td className="py-3 pr-4 font-semibold">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    record.jenis === 'PPAT'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}
                                >
                                  {record.jenis}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-semibold">{record.nomorAkta}</p>
                                <p className="text-xs text-gray-500">
                                  {record.kategori ?? '-'}
                                </p>
                              </td>
                              <td className="py-3 pr-4 text-sm text-gray-600">
                                {formatDateLong(record.tanggalAkta)}
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-semibold">{record.judulAkta}</p>
                                <p className="text-xs text-gray-500">
                                  {record.pihak.map((p) => p.name).join(', ') || '-'}
                                </p>
                              </td>
                              <td className="py-3 pr-4 text-xs text-gray-600">
                                {record.jenis === 'PPAT' && record.detailPPAT ? (
                                  <div className="space-y-1">
                                    <p>
                                      NOP: <span className="font-semibold">{record.detailPPAT.nop}</span>
                                    </p>
                                    <p>
                                      Nilai: <span className="font-semibold">{record.detailPPAT.nilaiTransaksi}</span>
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(record)}
                                    className="px-3 py-1.5 border border-blue-100 text-blue-600 text-xs rounded-lg flex items-center gap-1"
                                  >
                                    <Edit3 size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(record.id)}
                                    disabled={mutatingId === record.id}
                                    className="px-3 py-1.5 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Trash2 size={14} />
                                    {mutatingId === record.id ? '...' : 'Hapus'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'ppat' && (
          <section className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Surat Pengantar PPAT — {monthLabel} {selectedYear}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pilih tujuan distribusi sebelum mencetak PDF.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      downloadPDF(ppatLetterRef.current, `Lapbul-PPAT-${selectedYear}-${selectedMonth}`, 'portrait')
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Download size={16} />
                    {pdfTarget?.includes('PPAT') ? 'Memproses...' : 'Download Surat'}
                  </button>
                  <button
                    onClick={() =>
                      downloadPDF(
                        ppatLampiranRef.current,
                        `Lampiran-PPAT-${selectedYear}-${selectedMonth}`,
                        'landscape',
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Lampiran Detail
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  Object.keys(PPAT_RECIPIENTS) as PpatRecipientKey[]
                ).map((key) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-blue-200"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-blue-600"
                      checked={ppatDestinations[key]}
                      onChange={() => toggleDestination(key)}
                    />
                    <div>
                      <p className="font-semibold text-sm">
                        {PPAT_RECIPIENTS[key].label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {PPAT_RECIPIENTS[key].description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8 items-center">
              <A4Container
                ref={ppatLetterRef}
                className="print-wrapper bg-white rounded-xl shadow"
              >
                <KopLapbulPPAT />
                <div className="text-[11pt] leading-relaxed">
                  <p className="mb-3">
                    Nomor : ____/PPAT/{selectedMonth.toString().padStart(2, '0')}/
                    {selectedYear}
                  </p>
                  <p className="mb-4">
                    Hal : Penyampaian Laporan Bulanan PPAT Periode{' '}
                    {monthLabel.toUpperCase()} {selectedYear}
                  </p>
                  <p className="mb-4">
                    Kepada Yth:
                    <br />
                    {Object.entries(ppatDestinations)
                      .filter(([, value]) => value)
                      .map(([key]) => PPAT_RECIPIENTS[key as PpatRecipientKey].description)
                      .join(', ') || '........................................'}
                  </p>
                  <p className="mb-4">
                    Dengan hormat, bersama ini kami sampaikan laporan bulanan PPAT
                    untuk periode {monthLabel} {selectedYear} sejumlah{' '}
                    <strong>{ppatRecords.length} akta</strong> dengan nilai transaksi{' '}
                    <strong>{currency(summary.totalTransaksi)}</strong>. Data detail kami
                    lampirkan pada tabel landscape.
                  </p>
                  <p className="mb-4">
                    Semua kewajiban perpajakan atas transaksi tersebut telah kami
                    selesaikan dengan rincian SSP sebesar{' '}
                    <strong>{currency(summary.totalSSP)}</strong> dan SSB sebesar{' '}
                    <strong>{currency(summary.totalSSB)}</strong>.
                  </p>
                  <p className="mb-4">
                    Demikian surat pengantar ini kami buat dengan sebenarnya. Atas
                    perhatian dan kerjasamanya kami ucapkan terima kasih.
                  </p>
                  <div className="mt-8 text-right">
                    <p>Garut, {formatDateLong(new Date().toISOString())}</p>
                    <p className="mt-8 font-semibold uppercase">
                      Havis Akbar, S.H., M.Kn.
                    </p>
                    <p className="text-sm text-gray-500">PPAT Kabupaten Garut</p>
                  </div>
                </div>
              </A4Container>

              <A4LandscapeContainer
                ref={ppatLampiranRef}
                className="bg-white rounded-xl shadow"
              >
                <h3 className="text-center font-semibold text-lg uppercase mb-4">
                  Lampiran Detail Akta PPAT — {monthLabel} {selectedYear}
                </h3>
                <table className="w-full text-[9pt] border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      {[
                        'No',
                        'Nomor Akta',
                        'Tanggal',
                        'Pihak',
                        'NOP',
                        'Lokasi',
                        'Luas (T/B)',
                        'Nilai Transaksi',
                        'SSP',
                        'SSB',
                      ].map((title) => (
                        <th
                          key={title}
                          className="border border-gray-300 px-2 py-1 text-[8pt]"
                        >
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ppatRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center py-6 text-gray-500 text-sm"
                        >
                          NIHIL
                        </td>
                      </tr>
                    ) : (
                      ppatRecords.map((record, index) => (
                        <tr key={record.id}>
                          <td className="border px-2 py-1 text-center">{index + 1}</td>
                          <td className="border px-2 py-1">{record.nomorAkta}</td>
                          <td className="border px-2 py-1">
                            {formatDateLong(record.tanggalAkta)}
                          </td>
                          <td className="border px-2 py-1">
                            {record.pihak.map((p) => p.name).join(', ')}
                          </td>
                          <td className="border px-2 py-1">
                            {record.detailPPAT?.nop || '-'}
                          </td>
                          <td className="border px-2 py-1">
                            {record.detailPPAT?.lokasiObjek || '-'}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {record.detailPPAT
                              ? `${record.detailPPAT.luasTanah || 0} / ${
                                  record.detailPPAT.luasBangunan || 0
                                }`
                              : '-'}
                          </td>
                          <td className="border px-2 py-1">
                            {record.detailPPAT?.nilaiTransaksi || '-'}
                          </td>
                          <td className="border px-2 py-1">
                            {record.detailPPAT?.ssp || '-'}
                          </td>
                          <td className="border px-2 py-1">
                            {record.detailPPAT?.ssb || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </A4LandscapeContainer>
            </div>
          </section>
        )}

        {activeTab === 'notaris' && (
          <section className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Surat Pengantar Notaris ke MPD
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pastikan setiap kategori terisi atau otomatis ditandai NIHIL.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      downloadPDF(
                        notarisLetterRef.current,
                        `Lapbul-Notaris-${selectedYear}-${selectedMonth}`,
                        'portrait',
                      )
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Surat
                  </button>
                  <button
                    onClick={() =>
                      downloadPDF(
                        notarisModelsRef.current,
                        `Model-N1-N5-${selectedYear}-${selectedMonth}`,
                        'landscape',
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Cetak Model N-1 s/d N-5
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8 items-center">
              <A4Container
                ref={notarisLetterRef}
                className="print-wrapper bg-white rounded-xl shadow"
              >
                <KopSurat />
                <div className="text-[11pt] leading-relaxed">
                  <p className="mb-3">
                    Nomor : ____/Not/{selectedMonth.toString().padStart(2, '0')}/
                    {selectedYear}
                  </p>
                  <p className="mb-4">
                    Hal : Penyampaian Laporan Bulanan Notaris Periode{' '}
                    {monthLabel.toUpperCase()} {selectedYear}
                  </p>
                  <p className="mb-4">
                    Kepada Yth.
                    <br />
                    Majelis Pengawas Daerah (MPD) Notaris Kabupaten Garut
                  </p>
                  <p className="mb-4">
                    Bersama surat ini kami sampaikan laporan Model N-1 s.d. N-5 sesuai
                    peraturan perundang-undangan. Pada periode tersebut terdapat{' '}
                    <strong>{notarisRecords.length} akta</strong> dengan komposisi:
                  </p>
                  <ul className="list-disc pl-6 mb-4">
                    {NOTARIS_CATEGORIES.map((category) => (
                      <li key={category}>
                        {category}: {notarisByCategory[category].length || 'NIHIL'}
                      </li>
                    ))}
                  </ul>
                  <p className="mb-4">
                    Kami menyatakan seluruh minuta akta telah disimpan dan diregister
                    sesuai ketentuan. Mohon berkenan menerbitkan tanda terima laporan
                    bulan berjalan.
                  </p>
                  <div className="mt-12 text-right">
                    <p>Garut, {formatDateLong(new Date().toISOString())}</p>
                    <p className="mt-8 font-semibold uppercase">
                      Havis Akbar, S.H., M.Kn.
                    </p>
                    <p className="text-sm text-gray-500">Notaris</p>
                  </div>
                </div>
              </A4Container>

              <A4LandscapeContainer
                ref={notarisModelsRef}
                className="bg-white rounded-xl shadow"
              >
                <h3 className="text-center font-semibold text-lg uppercase mb-4">
                  Model N-1 s/d N-5 — {monthLabel} {selectedYear}
                </h3>

                <div className="space-y-6 text-[9pt]">
                  {NOTARIS_MODELS.map((model) => {
                    const rows =
                      model.code === 'N-5'
                        ? notarisRecords
                        : notarisRecords.filter((record) =>
                            model.categories.includes(
                              (record.kategori ?? 'Akta') as NotarisCategory,
                            ),
                          );
                    return (
                      <div key={model.code} className="border border-gray-300 rounded-lg">
                        <div className="bg-gray-100 px-3 py-2 flex items-center justify-between">
                          <p className="font-semibold">
                            {model.code} — {model.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rows.length} entri
                          </p>
                        </div>
                        <table className="w-full text-left border-t border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border px-2 py-1 text-[8pt]">No</th>
                              <th className="border px-2 py-1 text-[8pt]">Nomor Akta</th>
                              <th className="border px-2 py-1 text-[8pt]">Tanggal</th>
                              <th className="border px-2 py-1 text-[8pt]">Judul / Sifat</th>
                              <th className="border px-2 py-1 text-[8pt]">Pihak</th>
                              <th className="border px-2 py-1 text-[8pt]">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="text-center py-4 text-gray-500 text-sm"
                                >
                                  NIHIL
                                </td>
                              </tr>
                            ) : (
                              rows.map((record, index) => (
                                <tr key={record.id}>
                                  <td className="border px-2 py-1 text-center">
                                    {index + 1}
                                  </td>
                                  <td className="border px-2 py-1">{record.nomorAkta}</td>
                                  <td className="border px-2 py-1">
                                    {formatDateLong(record.tanggalAkta)}
                                  </td>
                                  <td className="border px-2 py-1">{record.judulAkta}</td>
                                  <td className="border px-2 py-1">
                                    {record.pihak.map((p) => p.name).join(', ')}
                                  </td>
                                  <td className="border px-2 py-1 text-xs">
                                    {record.kategori || '-'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </A4LandscapeContainer>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

