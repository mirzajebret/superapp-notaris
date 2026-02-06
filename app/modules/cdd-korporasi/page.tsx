'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import { getCDDKorporasiList, saveCDDKorporasi, deleteCDDKorporasi } from '@/app/actions';

// --- Interface Data Sesuai PDF ---
interface CDDKorporasiData {
    id: string;
    createdAt: string;
    // A. Informasi Dasar Korporasi
    namaKorporasi: string;
    bentukKorporasi: string;
    noSK: string;
    tglSK: string;
    noIjinUsaha: string;
    tglIjinUsaha: string;
    npwp: string;
    alamatAkta: string;
    alamatUsaha: string;
    telp: string;
    fax: string;
    bidangUsaha: string;
    noAktaTerakhir: string;
    // B. Informasi Kekayaan
    sumberDana: string;
    pendapatanTahunan: string;
    tujuanTransaksi: string;
    // C. Beneficial Owner (BO)
    hasBO: boolean;
    namaBO: string;
    aliasBO: string;
    noIdentitasBO: string;
    jenisIdentitasBO: 'KTP' | 'Paspor' | 'SIM' | '';
    tempatLahirBO: string;
    tglLahirBO: string;
    kewarganegaraanBO: string;
    alamatBO: string;
    alamatAsalBO: string;
    npwpBO: string;
    hubunganBO: string;
    // D. Informasi Kuasa Korporasi (Yang Menghadap)
    jabatanKuasa: 'Direktur Utama' | 'Komisaris Utama' | 'Direktur' | 'Komisaris' | 'Pemegang Saham' | 'Lainnya' | '';
    jabatanLainnya: string;
    noSuratKuasa: string;
    tglSuratKuasa: string;
    penandatanganKuasa: string; // Nama penandatangan surat kuasa
    jabatanPenandatangan: string;
    // Biodata Pengguna Jasa (Yang datang ke Notaris)
    namaPenggunaJasa: string;
    aliasPenggunaJasa: string;
    noIdentitasPenggunaJasa: string;
    jenisIdentitasPenggunaJasa: 'KTP' | 'Paspor' | 'SIM' | '';
    tempatLahirPengguna: string;
    tglLahirPengguna: string;
    kewarganegaraanPengguna: string;
    alamatPengguna: string;
    // Meta
    kotaTandaTangan: string;
    tglTandaTangan: string;
}

const emptyForm: CDDKorporasiData = {
    id: '',
    createdAt: '',
    namaKorporasi: '',
    bentukKorporasi: 'Perseroan Terbatas (PT)',
    noSK: '',
    tglSK: '',
    noIjinUsaha: '',
    tglIjinUsaha: '',
    npwp: '',
    alamatAkta: '',
    alamatUsaha: '',
    telp: '',
    fax: '',
    bidangUsaha: '',
    noAktaTerakhir: '',
    sumberDana: '',
    pendapatanTahunan: '',
    tujuanTransaksi: '',
    hasBO: false,
    namaBO: '',
    aliasBO: '',
    noIdentitasBO: '',
    jenisIdentitasBO: 'KTP',
    tempatLahirBO: '',
    tglLahirBO: '',
    kewarganegaraanBO: 'Indonesia',
    alamatBO: '',
    alamatAsalBO: '',
    npwpBO: '',
    hubunganBO: '',
    jabatanKuasa: '',
    jabatanLainnya: '',
    noSuratKuasa: '',
    tglSuratKuasa: '',
    penandatanganKuasa: '',
    jabatanPenandatangan: '',
    namaPenggunaJasa: '',
    aliasPenggunaJasa: '',
    noIdentitasPenggunaJasa: '',
    jenisIdentitasPenggunaJasa: 'KTP',
    tempatLahirPengguna: '',
    tglLahirPengguna: '',
    kewarganegaraanPengguna: 'Indonesia',
    alamatPengguna: '',
    kotaTandaTangan: 'Garut',
    tglTandaTangan: new Date().toISOString().split('T')[0],
};

// --- Helper Components (Outside to prevent re-render focus loss) ---
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-slate-800 uppercase bg-blue-50 p-2 rounded mt-6 mb-3 border-l-4 border-blue-600 tracking-wide">
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

const CheckboxDisplay = ({ label, checked }: { label: string, checked: boolean }) => (
    <span className="flex items-center gap-1 mr-3 mb-1">
        <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center`}>
            {checked && <span className="text-[10px] leading-none font-bold">✓</span>}
        </div> {label}
    </span>
);

export default function CDDKorporasiPage() {
    const [mode, setMode] = useState<'list' | 'editor'>('list');
    const [dataList, setDataList] = useState<CDDKorporasiData[]>([]);
    const [formData, setFormData] = useState<CDDKorporasiData>(emptyForm);
    const [isLoading, setIsLoading] = useState(false);

    // Print Logic States
    const [scale, setScale] = useState(1);
    const [isAutoFit, setIsAutoFit] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadData(); }, []);

    // Auto Fit Logic
    useLayoutEffect(() => {
        if (isAutoFit && contentRef.current && mode === 'editor') {
            const contentHeight = contentRef.current.scrollHeight;
            const targetHeight = 1000; // Safe printable height
            if (contentHeight > targetHeight) {
                const newScale = targetHeight / contentHeight;
                setScale(Math.max(newScale, 0.55));
            } else {
                setScale(1);
            }
        }
    }, [formData, isAutoFit, mode]);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getCDDKorporasiList();
        setDataList((data as any[]) || []);
        setIsLoading(false);
    };

    const handleCreateNew = () => {
        setFormData({ ...emptyForm, id: Date.now().toString(), createdAt: new Date().toISOString() });
        setMode('editor');
        setScale(1);
        setIsAutoFit(false);
    };

    const handleEdit = (item: CDDKorporasiData) => {
        setFormData(item);
        setMode('editor');
        setScale(1);
        setIsAutoFit(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus data ini?')) {
            await deleteCDDKorporasi(id);
            loadData();
        }
    };

    const handleSave = async () => {
        if (!formData.namaKorporasi) return alert('Nama Korporasi wajib diisi');
        setIsLoading(true);
        await saveCDDKorporasi(formData);
        await loadData();
        setIsLoading(false);
        alert('Data tersimpan');
    };

    if (mode === 'list') {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">CDD Korporasi</h1>
                            <p className="text-slate-500 text-sm mt-1">Database Customer Due Diligence Badan Usaha</p>
                        </div>
                        <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2">
                            <span>+ Entri Baru</span>
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 font-semibold">Tanggal</th>
                                    <th className="p-4 font-semibold">Nama Korporasi</th>
                                    <th className="p-4 font-semibold">NPWP</th>
                                    <th className="p-4 font-semibold">Pengguna Jasa</th>
                                    <th className="p-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dataList.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400">Belum ada data.</td></tr>
                                ) : (
                                    dataList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.namaKorporasi}</td>
                                            <td className="p-4 text-slate-600">{item.npwp || '-'}</td>
                                            <td className="p-4 text-slate-600">{item.namaPenggunaJasa}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => handleEdit(item)} className="text-blue-600 font-medium hover:underline">Buka</button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-500 font-medium hover:underline">Hapus</button>
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

    return (
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; background: white; }
                    .no-print { display: none !important; }
                    * { box-shadow: none !important; text-shadow: none !important; }
                    #print-root { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; transform-origin: top center; transform: scale(${scale}); left: ${scale < 1 ? `calc(50% - ${(210 * scale) / 2}mm)` : '0'}; }
                    #print-root > div { margin: 0 !important; box-shadow: none !important; border: none !important; }
                    table, tr, td, .break-inside-avoid { page-break-inside: avoid; }
                }
            `}</style>

            {/* LEFT SIDEBAR (INPUT) */}
            <div className="w-[480px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-10 print:hidden">
                <div className="p-4 border-b border-slate-100 bg-white shadow-sm flex justify-between items-center">
                    <button onClick={() => setMode('list')} className="text-slate-500 hover:text-slate-800 text-sm font-medium">← Kembali</button>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-sm font-medium">Print</button>
                        <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium">{isLoading ? '...' : 'Simpan'}</button>
                    </div>
                </div>

                <div className="p-2 bg-slate-50 border-b border-slate-200 text-xs flex items-center justify-between px-4">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input type="checkbox" checked={isAutoFit} onChange={(e) => { setIsAutoFit(e.target.checked); if (!e.target.checked) setScale(1); }} className="rounded text-blue-600" /> Auto Fit 1 Halaman
                    </label>
                    {!isAutoFit && (
                        <div className="flex items-center gap-2">
                            <span>Zoom:</span>
                            <input type="range" min="0.5" max="1.1" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-24" />
                            <span>{Math.round(scale * 100)}%</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                    <SectionTitle>A. Informasi Korporasi</SectionTitle>
                    <InputField label="1. Nama Korporasi" value={formData.namaKorporasi} onChange={(v: string) => setFormData({ ...formData, namaKorporasi: v })} />

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">2. Bentuk Korporasi</label>
                        <select className="w-full p-2 border rounded text-sm" value={formData.bentukKorporasi} onChange={(e) => setFormData({ ...formData, bentukKorporasi: e.target.value })}>
                            <option value="Perseroan Terbatas (PT)">Perseroan Terbatas (PT)</option>
                            <option value="CV (Persekutuan Komanditer)">CV</option>
                            <option value="Koperasi">Koperasi</option>
                            <option value="Yayasan">Yayasan</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <InputField label="3. No. SK Pengesahan" value={formData.noSK} onChange={(v: string) => setFormData({ ...formData, noSK: v })} />
                        <InputField label="Tanggal SK" type="date" value={formData.tglSK} onChange={(v: string) => setFormData({ ...formData, tglSK: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <InputField label="4. No. Ijin Usaha" value={formData.noIjinUsaha} onChange={(v: string) => setFormData({ ...formData, noIjinUsaha: v })} />
                        <InputField label="Tanggal Ijin" type="date" value={formData.tglIjinUsaha} onChange={(v: string) => setFormData({ ...formData, tglIjinUsaha: v })} />
                    </div>

                    <InputField label="5. NPWP Korporasi" value={formData.npwp} onChange={(v: string) => setFormData({ ...formData, npwp: v })} />
                    <InputField label="6. Alamat Sesuai Akta" value={formData.alamatAkta} onChange={(v: string) => setFormData({ ...formData, alamatAkta: v })} />
                    <InputField label="7. Alamat Lokasi Usaha" value={formData.alamatUsaha} onChange={(v: string) => setFormData({ ...formData, alamatUsaha: v })} placeholder="Kosongkan jika sama dengan akta" />

                    <div className="grid grid-cols-2 gap-2">
                        <InputField label="8. No. Telepon" value={formData.telp} onChange={(v: string) => setFormData({ ...formData, telp: v })} />
                        <InputField label="9. Fax (Opsional)" value={formData.fax} onChange={(v: string) => setFormData({ ...formData, fax: v })} />
                    </div>

                    <InputField label="10. Bidang Usaha" value={formData.bidangUsaha} onChange={(v: string) => setFormData({ ...formData, bidangUsaha: v })} />
                    <InputField label="11. No. Akta Pendirian / Terakhir" value={formData.noAktaTerakhir} onChange={(v: string) => setFormData({ ...formData, noAktaTerakhir: v })} />

                    <SectionTitle>B. Informasi Kekayaan</SectionTitle>
                    <InputField label="1. Sumber Dana" value={formData.sumberDana} onChange={(v: string) => setFormData({ ...formData, sumberDana: v })} placeholder="Contoh: Hasil Usaha, Investasi" />
                    <InputField label="3. Pendapatan Rata-Rata / Tahun" value={formData.pendapatanTahunan} onChange={(v: string) => setFormData({ ...formData, pendapatanTahunan: v })} />
                    <InputField label="4. Tujuan Transaksi" value={formData.tujuanTransaksi} onChange={(v: string) => setFormData({ ...formData, tujuanTransaksi: v })} />

                    <SectionTitle>C. Pemilik Manfaat (BO)</SectionTitle>
                    <label className="flex items-center gap-2 mb-3 bg-white p-3 rounded border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={formData.hasBO} onChange={(e) => setFormData({ ...formData, hasBO: e.target.checked })} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Ada Beneficial Owner?</span>
                    </label>
                    {formData.hasBO && (
                        <div className="space-y-3 p-3 bg-slate-50 rounded border">
                            <InputField label="1. Nama Lengkap BO" value={formData.namaBO} onChange={(v: string) => setFormData({ ...formData, namaBO: v })} />
                            <InputField label="2. Nama Alias" value={formData.aliasBO} onChange={(v: string) => setFormData({ ...formData, aliasBO: v })} />
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">3. Jenis ID</label>
                                    <select className="w-full p-2 border rounded text-xs" value={formData.jenisIdentitasBO} onChange={(e) => setFormData({ ...formData, jenisIdentitasBO: e.target.value as any })}>
                                        <option value="KTP">KTP</option>
                                        <option value="Paspor">Paspor</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <InputField label="No. Identitas" value={formData.noIdentitasBO} onChange={(v: string) => setFormData({ ...formData, noIdentitasBO: v })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <InputField label="4. Tempat Lahir" value={formData.tempatLahirBO} onChange={(v: string) => setFormData({ ...formData, tempatLahirBO: v })} />
                                <InputField label="Tanggal Lahir" type="date" value={formData.tglLahirBO} onChange={(v: string) => setFormData({ ...formData, tglLahirBO: v })} />
                            </div>
                            <InputField label="5. Kewarganegaraan" value={formData.kewarganegaraanBO} onChange={(v: string) => setFormData({ ...formData, kewarganegaraanBO: v })} />
                            <InputField label="6. Alamat Tempat Tinggal" value={formData.alamatBO} onChange={(v: string) => setFormData({ ...formData, alamatBO: v })} />
                            <InputField label="8. NPWP BO" value={formData.npwpBO} onChange={(v: string) => setFormData({ ...formData, npwpBO: v })} />
                            <InputField label="9. Hubungan dengan Korporasi" value={formData.hubunganBO} onChange={(v: string) => setFormData({ ...formData, hubunganBO: v })} />
                        </div>
                    )}

                    <SectionTitle>D. Informasi Kuasa (Pengguna Jasa)</SectionTitle>
                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">1. Hubungan Hukum (Jabatan)</label>
                        <select className="w-full p-2 border rounded text-sm mb-2" value={formData.jabatanKuasa} onChange={(e) => setFormData({ ...formData, jabatanKuasa: e.target.value as any })}>
                            <option value="">- Pilih Jabatan -</option>
                            <option value="Direktur Utama">Direktur Utama</option>
                            <option value="Komisaris Utama">Komisaris Utama</option>
                            <option value="Direktur">Direktur</option>
                            <option value="Komisaris">Komisaris</option>
                            <option value="Pemegang Saham">Pemegang Saham</option>
                            <option value="Lainnya">Lainnya (Kuasa)</option>
                        </select>
                        {formData.jabatanKuasa === 'Lainnya' && (
                            <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-xs text-yellow-700 font-medium">Detail Surat Kuasa:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputField label="2. No. Surat Kuasa" value={formData.noSuratKuasa} onChange={(v: string) => setFormData({ ...formData, noSuratKuasa: v })} />
                                    <InputField label="Tanggal" type="date" value={formData.tglSuratKuasa} onChange={(v: string) => setFormData({ ...formData, tglSuratKuasa: v })} />
                                </div>
                                <InputField label="3. Pemberi Kuasa (Nama)" value={formData.penandatanganKuasa} onChange={(v: string) => setFormData({ ...formData, penandatanganKuasa: v })} />
                                <InputField label="Jabatan Pemberi Kuasa" value={formData.jabatanPenandatangan} onChange={(v: string) => setFormData({ ...formData, jabatanPenandatangan: v })} />
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50 border rounded space-y-3">
                        <label className="block text-xs font-bold text-slate-700 border-b pb-1">Biodata Pengguna Jasa (Yang Menghadap)</label>
                        <InputField label="4. Nama Lengkap" value={formData.namaPenggunaJasa} onChange={(v: string) => setFormData({ ...formData, namaPenggunaJasa: v })} />
                        <InputField label="5. Nama Alias" value={formData.aliasPenggunaJasa} onChange={(v: string) => setFormData({ ...formData, aliasPenggunaJasa: v })} />
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis ID</label>
                                <select className="w-full p-2 border rounded text-xs" value={formData.jenisIdentitasPenggunaJasa} onChange={(e) => setFormData({ ...formData, jenisIdentitasPenggunaJasa: e.target.value as any })}>
                                    <option value="KTP">KTP</option>
                                    <option value="Paspor">Paspor</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <InputField label="6. No. Identitas" value={formData.noIdentitasPenggunaJasa} onChange={(v: string) => setFormData({ ...formData, noIdentitasPenggunaJasa: v })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="7. Tempat Lahir" value={formData.tempatLahirPengguna} onChange={(v: string) => setFormData({ ...formData, tempatLahirPengguna: v })} />
                            <InputField label="Tanggal Lahir" type="date" value={formData.tglLahirPengguna} onChange={(v: string) => setFormData({ ...formData, tglLahirPengguna: v })} />
                        </div>
                        <InputField label="8. Kewarganegaraan" value={formData.kewarganegaraanPengguna} onChange={(v: string) => setFormData({ ...formData, kewarganegaraanPengguna: v })} />
                        <InputField label="9. Alamat Tempat Tinggal" value={formData.alamatPengguna} onChange={(v: string) => setFormData({ ...formData, alamatPengguna: v })} />
                    </div>

                    <SectionTitle>Tanda Tangan</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Kota" value={formData.kotaTandaTangan} onChange={(v: string) => setFormData({ ...formData, kotaTandaTangan: v })} />
                        <InputField label="Tanggal" type="date" value={formData.tglTandaTangan} onChange={(v: string) => setFormData({ ...formData, tglTandaTangan: v })} />
                    </div>
                    <div className="h-10"></div>
                </div>
            </div>

            {/* RIGHT SIDE (PREVIEW) */}
            <div className="flex-1 bg-slate-200/50 overflow-y-auto p-8 flex justify-center items-start print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full print:h-auto print:absolute print:inset-0 print:block">
                <div id="print-root" className="print:block" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', marginBottom: `${(scale - 1) * 297}mm` }}>
                    <A4Container>
                        <div ref={contentRef} className="text-black font-sans leading-tight text-[10pt]">
                            <div className="mb-3"><KopSurat /></div>

                            <div className="text-center font-bold mb-3 uppercase border-b-2 border-black pb-1">
                                <h1 className="text-lg">FORMULIR CUSTOMER DUE DILIGENCE KORPORASI</h1>
                                <p className="text-[9pt] font-normal normal-case">(PP No. 43 Tahun 2015 dan Permenkumham No. 9 Tahun 2017)</p>
                            </div>

                            {/* Section A */}
                            <h2 className="font-bold mb-1">A. Informasi Dasar Pengguna Jasa</h2>
                            <table className="w-full text-[10pt] mb-3">
                                <tbody>
                                    <tr><td className="w-6 align-top">1.</td><td className="w-48 align-top">Nama Korporasi</td><td className="w-3 align-top">:</td><td className="border-b border-black border-dotted font-bold">{formData.namaKorporasi}</td></tr>
                                    <tr><td className="align-top">2.</td><td className="align-top">Bentuk Korporasi</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.bentukKorporasi}</td></tr>
                                    <tr><td className="align-top">3.</td><td className="align-top">No. SK Pengesahan</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.noSK} {formData.tglSK ? `, Tgl: ${new Date(formData.tglSK).toLocaleDateString('id-ID')}` : ''}</td></tr>
                                    <tr><td className="align-top">4.</td><td className="align-top">No. Ijin Usaha</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.noIjinUsaha} {formData.tglIjinUsaha ? `, Tgl: ${new Date(formData.tglIjinUsaha).toLocaleDateString('id-ID')}` : ''}</td></tr>
                                    <tr><td className="align-top">5.</td><td className="align-top">NPWP</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.npwp}</td></tr>
                                    <tr><td className="align-top">6.</td><td className="align-top">Alamat Sesuai Akta</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.alamatAkta}</td></tr>
                                    <tr><td className="align-top">7.</td><td className="align-top">Alamat Lokasi Usaha</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.alamatUsaha || 'Sda'}</td></tr>
                                    <tr><td className="align-top">8.</td><td className="align-top">Nomor Telepon</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.telp}</td></tr>
                                    <tr><td className="align-top">9.</td><td className="align-top">Nomor Faksimili</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.fax || '-'}</td></tr>
                                    <tr><td className="align-top">10.</td><td className="align-top">Bidang Usaha</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.bidangUsaha}</td></tr>
                                    <tr><td className="align-top">11.</td><td className="align-top">No. Akta Pendirian/Terakhir</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.noAktaTerakhir}</td></tr>
                                </tbody>
                            </table>

                            {/* Section B */}
                            <h2 className="font-bold mb-1">B. Informasi Kekayaan Korporasi</h2>
                            <table className="w-full text-[10pt] mb-3">
                                <tbody>
                                    <tr><td className="w-6 align-top">1.</td><td className="w-48 align-top">Sumber Dana</td><td className="w-3 align-top">:</td><td className="border-b border-black border-dotted">{formData.sumberDana}</td></tr>
                                    <tr><td className="align-top">2.</td><td className="align-top">Bidang Usaha</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.bidangUsaha}</td></tr>
                                    <tr><td className="align-top">3.</td><td className="align-top">Pendapatan Rata-rata/Thn</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.pendapatanTahunan}</td></tr>
                                    <tr><td className="align-top">4.</td><td className="align-top">Tujuan Transaksi</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.tujuanTransaksi}</td></tr>
                                </tbody>
                            </table>

                            {/* Section C */}
                            <h2 className="font-bold mb-1">C. Informasi Pemilik Manfaat (Beneficial Owner) *)</h2>
                            <p className="text-[8pt] italic mb-1 mt-[-2px]">*) Jika ada (diatur lebih lanjut dalam Perpres No. 13 Tahun 2018)</p>
                            {!formData.hasBO ? (
                                <div className="border border-black p-2 text-center text-gray-400 font-bold mb-3 text-sm">NIHIL</div>
                            ) : (
                                <table className="w-full text-[10pt] mb-3">
                                    <tbody>
                                        <tr><td className="w-6 align-top">1.</td><td className="w-48 align-top">Nama Lengkap</td><td className="w-3 align-top">:</td><td className="border-b border-black border-dotted">{formData.namaBO}</td></tr>
                                        <tr><td className="align-top">2.</td><td className="align-top">Nama Alias</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.aliasBO || '-'}</td></tr>
                                        <tr>
                                            <td className="align-top">3.</td><td className="align-top">No. Identitas</td><td className="align-top">:</td>
                                            <td className="flex gap-4 text-[9pt]">
                                                <CheckboxDisplay label="KTP" checked={formData.jenisIdentitasBO === 'KTP'} />
                                                <CheckboxDisplay label="Paspor" checked={formData.jenisIdentitasBO === 'Paspor'} />
                                                <span className="border-b border-black border-dotted flex-1">{formData.noIdentitasBO}</span>
                                            </td>
                                        </tr>
                                        <tr><td className="align-top">4.</td><td className="align-top">Tempat, Tgl Lahir</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.tempatLahirBO}, {formData.tglLahirBO ? new Date(formData.tglLahirBO).toLocaleDateString('id-ID') : ''}</td></tr>
                                        <tr><td className="align-top">5.</td><td className="align-top">Kewarganegaraan</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.kewarganegaraanBO}</td></tr>
                                        <tr><td className="align-top">6.</td><td className="align-top">Alamat Tempat Tinggal</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.alamatBO}</td></tr>
                                        <tr><td className="align-top">7.</td><td className="align-top">Alamat Asal (WNA)</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.alamatAsalBO || '-'}</td></tr>
                                        <tr><td className="align-top">8.</td><td className="align-top">NPWP</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.npwpBO}</td></tr>
                                        <tr><td className="align-top">9.</td><td className="align-top">Hubungan Hukum</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.hubunganBO}</td></tr>
                                    </tbody>
                                </table>
                            )}

                            {/* Section D */}
                            <div className="break-inside-avoid">
                                <h2 className="font-bold mb-1">D. Informasi Kuasa Korporasi</h2>
                                <table className="w-full text-[10pt] mb-2">
                                    <tbody>
                                        <tr>
                                            <td className="w-6 align-top">1.</td>
                                            <td className="w-48 align-top">Hubungan Hukum</td>
                                            <td className="w-3 align-top">:</td>
                                            <td>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9pt]">
                                                    <CheckboxDisplay label="Direktur Utama" checked={formData.jabatanKuasa === 'Direktur Utama'} />
                                                    <CheckboxDisplay label="Komisaris Utama" checked={formData.jabatanKuasa === 'Komisaris Utama'} />
                                                    <CheckboxDisplay label="Direktur" checked={formData.jabatanKuasa === 'Direktur'} />
                                                    <CheckboxDisplay label="Komisaris" checked={formData.jabatanKuasa === 'Komisaris'} />
                                                    <CheckboxDisplay label="Pemegang Saham" checked={formData.jabatanKuasa === 'Pemegang Saham'} />
                                                    <CheckboxDisplay label="Lainnya" checked={formData.jabatanKuasa === 'Lainnya'} />
                                                </div>
                                            </td>
                                        </tr>
                                        {formData.jabatanKuasa === 'Lainnya' && (
                                            <>
                                                <tr><td className="align-top">2.</td><td className="align-top">No. Surat Kuasa</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.noSuratKuasa}, Tgl: {formData.tglSuratKuasa ? new Date(formData.tglSuratKuasa).toLocaleDateString('id-ID') : '-'}</td></tr>
                                                <tr><td className="align-top">3.</td><td className="align-top">Pemberi Kuasa</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.penandatanganKuasa} ({formData.jabatanPenandatangan})</td></tr>
                                            </>
                                        )}
                                        <tr><td className="align-top">{formData.jabatanKuasa === 'Lainnya' ? '4.' : '2.'}</td><td className="align-top">Nama Lengkap</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.namaPenggunaJasa}</td></tr>
                                        <tr><td className="align-top">{formData.jabatanKuasa === 'Lainnya' ? '5.' : '3.'}</td><td className="align-top">Nama Alias</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.aliasPenggunaJasa || '-'}</td></tr>
                                        <tr>
                                            <td className="align-top">{formData.jabatanKuasa === 'Lainnya' ? '6.' : '4.'}</td><td className="align-top">No. Identitas</td><td className="align-top">:</td>
                                            <td className="flex gap-4 text-[9pt]">
                                                <CheckboxDisplay label="KTP" checked={formData.jenisIdentitasPenggunaJasa === 'KTP'} />
                                                <CheckboxDisplay label="Paspor" checked={formData.jenisIdentitasPenggunaJasa === 'Paspor'} />
                                                <span className="border-b border-black border-dotted flex-1">{formData.noIdentitasPenggunaJasa}</span>
                                            </td>
                                        </tr>
                                        <tr><td className="align-top">{formData.jabatanKuasa === 'Lainnya' ? '7.' : '5.'}</td><td className="align-top">Tempat, Tgl Lahir</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.tempatLahirPengguna}, {formData.tglLahirPengguna ? new Date(formData.tglLahirPengguna).toLocaleDateString('id-ID') : ''}</td></tr>
                                        <tr><td className="align-top">{formData.jabatanKuasa === 'Lainnya' ? '8.' : '6.'}</td><td className="align-top">Kewarganegaraan</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.kewarganegaraanPengguna}</td></tr>
                                        <tr><td className="align-top">{formData.jabatanKuasa === 'Lainnya' ? '9.' : '7.'}</td><td className="align-top">Alamat</td><td className="align-top">:</td><td className="border-b border-black border-dotted">{formData.alamatPengguna}</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Section E - Pernyataan & TTD */}
                            <div className="break-inside-avoid mt-2">
                                <h2 className="font-bold mb-1">E. Pernyataan</h2>
                                <p className="text-justify text-[10pt] mb-4">
                                    Bahwa seluruh data tersebut di atas adalah benar dan lengkap. Saya bertanggung jawab sepenuhnya atas segala akibat hukum yang timbul dikemudian hari.
                                </p>
                                <div className="flex justify-end pr-10">
                                    <div className="text-center w-64">
                                        <p className="mb-1">{formData.kotaTandaTangan}, {new Date(formData.tglTandaTangan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <p className="mb-20">Pengguna Jasa,</p>
                                        <p className="font-bold border-b border-black inline-block min-w-[200px] uppercase">{formData.namaPenggunaJasa}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </A4Container>
                </div>
            </div>
        </div>
    );
}