'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import { getCDDList, saveCDD, deleteCDD } from '@/app/actions';

// --- Tipe Data ---
interface CDDData {
    id: string;
    createdAt: string;
    // A. Informasi Dasar
    namaLengkap: string;
    // namaAlias dihapus
    jenisIdentitas: 'KTP' | 'Paspor' | 'SIM' | '';
    noIdentitas: string;
    npwp: string;
    tempatLahir: string;
    tanggalLahir: string;
    kewarganegaraan: string;
    alamatTinggal: string;
    alamatDomisili: string;
    alamatNegaraAsal: string;
    telp: string; // Nomor Telepon/WhatsApp (Gabungan)
    jenisKelamin: 'Laki-Laki' | 'Perempuan' | '';
    statusPernikahan: 'Belum Menikah' | 'Menikah' | 'Lainnya' | '';
    statusPernikahanLainnya: string;
    // B. Pekerjaan
    sumberPendapatan: string[];
    sumberPendapatanLainnya: string;
    bidangUsaha: string;
    // Detail pekerjaan (kantor dll) dihapus
    rangePendapatan: '<=12' | '>12-120' | '>120-1.2M' | '>1.2M' | '';
    tujuanTransaksi: string;

    // Meta
    tempatTandaTangan: string;
    tanggalTandaTangan: string;
}

const emptyForm: CDDData = {
    id: '',
    createdAt: '',
    namaLengkap: '',
    jenisIdentitas: 'KTP',
    noIdentitas: '',
    npwp: '',
    tempatLahir: '',
    tanggalLahir: '',
    kewarganegaraan: 'Indonesia',
    alamatTinggal: '',
    alamatDomisili: '',
    alamatNegaraAsal: '',
    telp: '',
    jenisKelamin: 'Laki-Laki',
    statusPernikahan: 'Belum Menikah',
    statusPernikahanLainnya: '',
    sumberPendapatan: [],
    sumberPendapatanLainnya: '',
    bidangUsaha: '',
    rangePendapatan: '',
    tujuanTransaksi: '',
    tempatTandaTangan: 'Garut',
    tanggalTandaTangan: new Date().toISOString().split('T')[0],
};

// --- Helper Components (DIPINDAHKAN KE LUAR) ---

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-slate-800 uppercase bg-slate-100 p-2 rounded mt-6 mb-3 border-l-4 border-blue-500">
        {children}
    </h3>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
    </div>
);

const CheckboxGroup = ({ options, selected, setSelected }: any) => {
    const toggle = (opt: string) => {
        if (selected.includes(opt)) setSelected(selected.filter((s: string) => s !== opt));
        else setSelected([...selected, opt]);
    };
    return (
        <div className="space-y-2 mt-2">
            {options.map((opt: string) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => toggle(opt)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    {opt}
                </label>
            ))}
        </div>
    );
};

export default function CDDPage() {
    const [mode, setMode] = useState<'list' | 'editor'>('list');
    const [dataList, setDataList] = useState<CDDData[]>([]);
    const [formData, setFormData] = useState<CDDData>(emptyForm);
    const [isLoading, setIsLoading] = useState(false);

    // State untuk skala tampilan
    const [scale, setScale] = useState(1);
    const [isAutoFit, setIsAutoFit] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    // --- Auto Fit Logic ---
    useLayoutEffect(() => {
        if (isAutoFit && contentRef.current && mode === 'editor') {
            const contentHeight = contentRef.current.scrollHeight;
            // Target height diturunkan ke 1000px (dari 1050px) agar lebih sensitif 
            // dan mengecilkan dokumen lebih awal sebelum menyentuh batas halaman printer
            const targetHeight = 1000;

            if (contentHeight > targetHeight) {
                const newScale = targetHeight / contentHeight;
                // Limit minimum scale agar tidak terlalu kecil (misal 55%)
                setScale(Math.max(newScale, 0.55));
            } else {
                setScale(1);
            }
        }
    }, [formData, isAutoFit, mode]);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getCDDList();
        setDataList((data as any[]) || []);
        setIsLoading(false);
    };

    const handleCreateNew = () => {
        setFormData({
            ...emptyForm,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        });
        setMode('editor');
        setScale(1);
        setIsAutoFit(false);
    };

    const handleEdit = (item: CDDData) => {
        setFormData({
            ...emptyForm,
            ...item,
            telp: item.telp || (item as any).telpHp || ''
        });
        setMode('editor');
        setScale(1);
        setIsAutoFit(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus data ini?')) {
            await deleteCDD(id);
            loadData();
        }
    };

    const handleSave = async () => {
        if (!formData.namaLengkap) return alert('Nama Lengkap wajib diisi');
        setIsLoading(true);
        await saveCDD(formData);
        await loadData();
        setIsLoading(false);
        alert('Data berhasil disimpan');
    };

    // --- VIEW: LIST MODE ---
    if (mode === 'list') {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Formulir CDD Perorangan</h1>
                            <p className="text-slate-500 text-sm mt-1">Kelola data Customer Due Diligence</p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <span>+ Buat Baru</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 font-semibold">Tanggal</th>
                                    <th className="p-4 font-semibold">Nama Lengkap</th>
                                    <th className="p-4 font-semibold">Identitas</th>
                                    <th className="p-4 font-semibold">Tujuan</th>
                                    <th className="p-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dataList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400">
                                            Belum ada data. Silakan buat baru.
                                        </td>
                                    </tr>
                                ) : (
                                    dataList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 text-slate-500">
                                                {new Date(item.createdAt).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="p-4 font-medium text-slate-800">{item.namaLengkap}</td>
                                            <td className="p-4 text-slate-600">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold mr-2">{item.jenisIdentitas}</span>
                                                {item.noIdentitas}
                                            </td>
                                            <td className="p-4 text-slate-600 truncate max-w-xs">{item.tujuanTransaksi}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                                    >
                                                        Buka
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-500 hover:text-red-700 font-medium px-3 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: EDITOR (SPLIT VIEW) ---
    return (
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">

            {/* --- Print Style Injection --- */}
            <style jsx global>{`
        @media print {
            @page {
                size: A4;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                background: white;
            }
            .no-print {
                display: none !important;
            }
            
            /* Hapus shadow dan border saat print */
            * {
                box-shadow: none !important;
                -webkit-box-shadow: none !important;
                text-shadow: none !important;
            }

            #print-root {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                transform-origin: top center;
                transform: scale(${scale});
                left: ${scale < 1 ? `calc(50% - ${(210 * scale) / 2}mm)` : '0'};
            }
            
            #print-root > div {
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
            }
            
            /* Hindari page break di dalam tabel dan section */
            table, tr, td, .break-inside-avoid {
                page-break-inside: avoid;
            }
        }
      `}</style>

            {/* --- LEFT SIDEBAR (FORM INPUT) --- */}
            <div className="w-[450px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-10 print:hidden">

                {/* Header Sidebar */}
                <div className="p-4 border-b border-slate-100 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            onClick={() => setMode('list')}
                            className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 font-medium"
                        >
                            ← Kembali
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                Print
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                {isLoading ? '...' : 'Simpan'}
                            </button>
                        </div>
                    </div>

                    {/* Zoom & Auto Fit Control */}
                    <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="autofit"
                                checked={isAutoFit}
                                onChange={(e) => {
                                    setIsAutoFit(e.target.checked);
                                    if (!e.target.checked) setScale(1);
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="autofit" className="font-medium cursor-pointer select-none">Muat 1 Halaman (Auto Fit)</label>
                        </div>

                        <div className={`flex items-center gap-3 transition-opacity ${isAutoFit ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <span>Zoom Manual:</span>
                            <input
                                type="range"
                                min="0.5"
                                max="1.2"
                                step="0.05"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="flex-1 cursor-pointer"
                            />
                            <span className="w-8 text-right">{Math.round(scale * 100)}%</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
                    <SectionTitle>A. Informasi Dasar</SectionTitle>
                    <InputField label="Nama Lengkap" value={formData.namaLengkap} onChange={(v: string) => setFormData({ ...formData, namaLengkap: v })} />

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Identitas</label>
                        <div className="flex gap-2 bg-white p-1 rounded border border-slate-200">
                            {['KTP', 'Paspor', 'SIM'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormData({ ...formData, jenisIdentitas: type as any })}
                                    className={`flex-1 py-1.5 text-xs rounded font-medium transition-all ${formData.jenisIdentitas === type ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <InputField label="No. Identitas" value={formData.noIdentitas} onChange={(v: string) => setFormData({ ...formData, noIdentitas: v })} />
                    <InputField label="NPWP" value={formData.npwp} onChange={(v: string) => setFormData({ ...formData, npwp: v })} />

                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Tempat Lahir" value={formData.tempatLahir} onChange={(v: string) => setFormData({ ...formData, tempatLahir: v })} />
                        <InputField label="Tanggal Lahir" type="date" value={formData.tanggalLahir} onChange={(v: string) => setFormData({ ...formData, tanggalLahir: v })} />
                    </div>

                    <InputField label="Kewarganegaraan" value={formData.kewarganegaraan} onChange={(v: string) => setFormData({ ...formData, kewarganegaraan: v })} />
                    <InputField label="Alamat Tinggal (KTP)" value={formData.alamatTinggal} onChange={(v: string) => setFormData({ ...formData, alamatTinggal: v })} />
                    <InputField label="Alamat Domisili" value={formData.alamatDomisili} onChange={(v: string) => setFormData({ ...formData, alamatDomisili: v })} placeholder="Kosongkan jika sama" />
                    <InputField label="Alamat Negara Asal (WNA)" value={formData.alamatNegaraAsal} onChange={(v: string) => setFormData({ ...formData, alamatNegaraAsal: v })} />
                    <InputField label="Nomor Telepon / WhatsApp" value={formData.telp} onChange={(v: string) => setFormData({ ...formData, telp: v })} />

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                        <div className="flex gap-4">
                            {['Laki-Laki', 'Perempuan'].map(jk => (
                                <label key={jk} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" name="jk" checked={formData.jenisKelamin === jk} onChange={() => setFormData({ ...formData, jenisKelamin: jk as any })} className="text-blue-600" />
                                    {jk}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status Pernikahan</label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm mb-2"
                            value={formData.statusPernikahan}
                            onChange={(e) => setFormData({ ...formData, statusPernikahan: e.target.value as any })}
                        >
                            <option value="Belum Menikah">Belum Menikah</option>
                            <option value="Menikah">Menikah</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                        {formData.statusPernikahan === 'Lainnya' && (
                            <InputField placeholder="Sebutkan..." value={formData.statusPernikahanLainnya} onChange={(v: string) => setFormData({ ...formData, statusPernikahanLainnya: v })} />
                        )}
                    </div>

                    <SectionTitle>B. Pekerjaan & Pendapatan</SectionTitle>
                    <div className="bg-white p-3 rounded border border-slate-200 mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Sumber Pendapatan</label>
                        <CheckboxGroup
                            options={['Pekerjaan (Gaji, Bonus, Pensiun, Saham)', 'Kepemilikan Usaha']}
                            selected={formData.sumberPendapatan}
                            setSelected={(val: string[]) => setFormData({ ...formData, sumberPendapatan: val })}
                        />
                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <input
                                type="text"
                                placeholder="Lainnya (Jelaskan)"
                                className="w-full text-sm p-1 border-b border-slate-300 focus:border-blue-500 focus:outline-none"
                                value={formData.sumberPendapatanLainnya}
                                onChange={(e) => setFormData({ ...formData, sumberPendapatanLainnya: e.target.value })}
                            />
                        </div>
                    </div>

                    <InputField label="Bidang Usaha" value={formData.bidangUsaha} onChange={(v: string) => setFormData({ ...formData, bidangUsaha: v })} />

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Pendapatan / Tahun</label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm"
                            value={formData.rangePendapatan}
                            onChange={(e) => setFormData({ ...formData, rangePendapatan: e.target.value as any })}
                        >
                            <option value="">- Pilih Range -</option>
                            <option value="<=12">≤ 12 Juta</option>
                            <option value=">12-120">{'>'} 12 Juta - 120 Juta</option>
                            <option value=">120-1.2M">{'>'} 120 Juta - 1.2 M</option>
                            <option value=">1.2M">{'>'} 1.2 M</option>
                        </select>
                    </div>

                    <InputField label="Tujuan Transaksi" value={formData.tujuanTransaksi} onChange={(v: string) => setFormData({ ...formData, tujuanTransaksi: v })} />



                    <SectionTitle>Tanda Tangan</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Kota" value={formData.tempatTandaTangan} onChange={(v: string) => setFormData({ ...formData, tempatTandaTangan: v })} />
                        <InputField label="Tanggal" type="date" value={formData.tanggalTandaTangan} onChange={(v: string) => setFormData({ ...formData, tanggalTandaTangan: v })} />
                    </div>
                    <div className="h-10"></div>
                </div>
            </div>

            {/* --- RIGHT SIDE (PREVIEW & PRINT AREA) --- */}
            <div className="flex-1 bg-slate-200/50 overflow-y-auto p-8 flex justify-center items-start print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full print:h-auto print:absolute print:inset-0 print:block">
                <div
                    id="print-root"
                    className="print:block"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        marginBottom: `${(scale - 1) * 297}mm`
                    }}
                >
                    <A4Container>
                        <div ref={contentRef} className="text-black font-sans leading-tight text-[11pt]">
                            <div className="mb-3">
                                <KopSurat />
                            </div>

                            <div className="text-center font-bold mb-3 uppercase">
                                <h1 className="text-lg">FORMULIR CUSTOMER DUE DILIGENCE PERORANGAN</h1>
                                <p className="text-[9pt] font-normal normal-case">(PP No. 43 Tahun 2015 dan Permenkumham No. 9 Tahun 2017)</p>
                            </div>

                            {/* A. INFORMASI DASAR (SPASI DIKURANGI) */}
                            <h2 className="font-bold mb-1">A. Informasi Dasar Pengguna Jasa</h2>
                            <table className="w-full text-[10pt] mb-3">
                                <tbody>
                                    <tr>
                                        <td className="w-6 py-[2px] align-top">1.</td>
                                        <td className="w-48 py-[2px] align-top">Nama Lengkap</td>
                                        <td className="w-4 py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px] font-medium">{formData.namaLengkap}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">2.</td>
                                        <td className="py-[2px] align-top">No. Identitas</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="py-[2px]">
                                            <div className="flex gap-6">
                                                {['KTP', 'Paspor', 'SIM'].map(type => (
                                                    <span key={type} className="flex items-center gap-1">
                                                        <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                            {formData.jenisIdentitas === type && <span className="text-[10px] leading-none">✓</span>}
                                                        </div> {type}
                                                    </span>
                                                ))}
                                                <span className="ml-2 border-b border-black border-dotted px-2 flex-1">{formData.noIdentitas}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">3.</td>
                                        <td className="py-[2px] align-top">Nomor Wajib Pajak (NPWP)</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.npwp || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">4.</td>
                                        <td className="py-[2px] align-top">Tempat dan tanggal lahir</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">
                                            {formData.tempatLahir}{formData.tempatLahir && formData.tanggalLahir ? ', ' : ''}
                                            {formData.tanggalLahir ? new Date(formData.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">5.</td>
                                        <td className="py-[2px] align-top">Kewarganegaraan</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.kewarganegaraan}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">6.</td>
                                        <td className="py-[2px] align-top">Alamat tempat tinggal</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.alamatTinggal}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">7.</td>
                                        <td className="py-[2px] align-top">Alamat domisili</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.alamatDomisili || 'Sda'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">8.</td>
                                        <td className="py-[2px] align-top">Alamat di negara asal (jika WNA)</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.alamatNegaraAsal || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">9.</td>
                                        <td className="py-[2px] align-top">Nomor Telepon/WhatsApp</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.telp || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">10.</td>
                                        <td className="py-[2px] align-top">Jenis kelamin</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="py-[2px]">
                                            <div className="flex gap-6">
                                                {['Laki-Laki', 'Perempuan'].map(jk => (
                                                    <span key={jk} className="flex items-center gap-1">
                                                        <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                            {formData.jenisKelamin === jk && <span className="text-[10px] leading-none">✓</span>}
                                                        </div> {jk}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">11.</td>
                                        <td className="py-[2px] align-top">Status pernikahan</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="py-[2px]">
                                            <div className="flex gap-4 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                        {formData.statusPernikahan === 'Belum Menikah' && <span className="text-[10px] leading-none">✓</span>}
                                                    </div> Belum Menikah
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                        {formData.statusPernikahan === 'Menikah' && <span className="text-[10px] leading-none">✓</span>}
                                                    </div> Menikah
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                        {formData.statusPernikahan === 'Lainnya' && <span className="text-[10px] leading-none">✓</span>}
                                                    </div> Lainnya:
                                                    <span className="border-b border-black border-dotted px-1 min-w-[50px]">{formData.statusPernikahanLainnya}</span>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* B. INFORMASI PEKERJAAN (SPASI DIKURANGI) */}
                            <h2 className="font-bold mb-1">B. Informasi Pekerjaan dan Sumber Pendapatan</h2>
                            <table className="w-full text-[10pt] mb-3">
                                <tbody>
                                    <tr>
                                        <td className="w-6 py-[2px] align-top">1.</td>
                                        <td className="w-48 py-[2px] align-top">Sumber Pendapatan/Kekayaan</td>
                                        <td className="w-4 py-[2px] align-top">:</td>
                                        <td className="py-[2px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1">
                                                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                        {formData.sumberPendapatan.includes('Pekerjaan (Gaji, Bonus, Pensiun, Saham)') && <span className="text-[10px] leading-none">✓</span>}
                                                    </div> Pekerjaan (Gaji, Bonus, Pensiun, Saham)
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                        {formData.sumberPendapatan.includes('Kepemilikan Usaha') && <span className="text-[10px] leading-none">✓</span>}
                                                    </div> Kepemilikan Usaha
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                        {formData.sumberPendapatanLainnya && <span className="text-[10px] leading-none">✓</span>}
                                                    </div> Lainnya (jelaskan): <span className="border-b border-black border-dotted px-1 w-full">{formData.sumberPendapatanLainnya}</span>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">2.</td>
                                        <td className="py-[2px] align-top">Bidang Usaha</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.bidangUsaha || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">3.</td>
                                        <td className="py-[2px] align-top">Pendapatan Rata-Rata/Thn</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="py-[2px]">
                                            <div className="flex gap-4 flex-wrap text-[9pt]">
                                                {['<=12', '>12-120', '>120-1.2M', '>1.2M'].map(range => {
                                                    let label = '';
                                                    if (range === '<=12') label = '≤12 juta';
                                                    else if (range === '>12-120') label = '>12 juta-120 juta';
                                                    else if (range === '>120-1.2M') label = '>120 juta-1.2 M';
                                                    else label = '>1.2 M';

                                                    return (
                                                        <span key={range} className="flex items-center gap-1">
                                                            <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
                                                                {formData.rangePendapatan === range && <span className="text-[10px] leading-none">✓</span>}
                                                            </div> {label}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-[2px] align-top">4.</td>
                                        <td className="py-[2px] align-top">Tujuan Transaksi</td>
                                        <td className="py-[2px] align-top">:</td>
                                        <td className="border-b border-black border-dotted py-[2px]">{formData.tujuanTransaksi}</td>
                                    </tr>
                                </tbody>
                            </table>



                            {/* D. PERNYATAAN */}
                            <div className="mb-4">
                                <h2 className="font-bold mb-1">D. Pernyataan</h2>
                                <p className="text-justify text-[10pt] leading-snug">
                                    Saya menyatakan bahwa informasi yang saya berikan dalam formulir ini adalah benar dan akurat.
                                    Saya bertanggung jawab sepenuhnya atas segala akibat hukum yang timbul apabila dikemudian hari diketahui
                                    bahwa informasi/dokumen yang saya berikan tidak benar/palsu. Saya bersedia memberikan informasi/dokumen tambahan
                                    apabila diperlukan oleh Notaris/PPAT.
                                </p>
                            </div>

                            {/* TANDA TANGAN (BREAK INSIDE AVOID) */}
                            <div className="flex justify-end pr-10 break-inside-avoid pt-10">
                                <div className="text-center w-64">
                                    <p className="mb-1">{formData.tempatTandaTangan}, {new Date(formData.tanggalTandaTangan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p className="mb-20">Pengguna Jasa,</p>
                                    <p className="font-bold border-t border-black inline-block min-w-[200px] uppercase">{formData.namaLengkap}</p>
                                </div>
                            </div>
                        </div>
                    </A4Container>
                </div>
            </div>
        </div>
    );
}