'use client';

import { useState, useEffect, useRef } from 'react';
import { getGlobalHistory } from '@/app/actions';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import Image from 'next/image';

export default function RiwayatPage() {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [filterType, setFilterType] = useState('all');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(0.65); // Default zoom fit screen

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        let res = historyData;
        if (filterType !== 'all') {
            res = res.filter(item => item.type === filterType);
        }
        if (search) {
            res = res.filter(item =>
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.typeLabel.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFilteredData(res);
    }, [historyData, filterType, search]);

    const loadHistory = async () => {
        setIsLoading(true);
        const data = await getGlobalHistory();
        setHistoryData(data);
        setFilteredData(data);
        if (data.length > 0) setSelectedDoc(data[0]);
        setIsLoading(false);
    };

    // --- RENDERERS ---
    // Fungsi ini memilih tampilan berdasarkan tipe dokumen
    const renderDocumentContent = (doc: any) => {
        const { data } = doc;

        switch (doc.type) {
            case 'cdd-perorangan':
                return renderCDDPerorangan(data);
            case 'cdd-korporasi':
                return renderCDDKorporasi(data);
            case 'serah-terima':
                return renderSerahTerima(data);
            default:
                return renderGeneric(doc);
        }
    };

    // 1. RENDERER CDD PERORANGAN (Copy dari modul CDD)
    const renderCDDPerorangan = (formData: any) => (
        <div className="text-black font-sans leading-tight text-[11pt]">
            <div className="mb-4"><KopSurat /></div>
            <div className="text-center font-bold mb-4 uppercase border-b-2 border-black pb-1">
                <h1 className="text-lg">FORMULIR CUSTOMER DUE DILIGENCE PERORANGAN</h1>
                <p className="text-[9pt] font-normal normal-case">(PP No. 43 Tahun 2015 dan Permenkumham No. 9 Tahun 2017)</p>
            </div>
            <h2 className="font-bold mb-2">A. Informasi Dasar Pengguna Jasa</h2>
            <table className="w-full text-[10pt] mb-4">
                <tbody>
                    <tr><td className="w-6 align-top">1.</td><td className="w-48 align-top">Nama Lengkap</td><td className="w-4 align-top">:</td><td className="border-b border-black border-dotted font-medium">{formData.namaLengkap}</td></tr>
                    <tr><td className="align-top">2.</td><td className="align-top">No. Identitas</td><td className="align-top">:</td><td>{formData.jenisIdentitas} - {formData.noIdentitas}</td></tr>
                    <tr><td className="align-top">3.</td><td className="align-top">NPWP</td><td className="align-top">:</td><td>{formData.npwp || '-'}</td></tr>
                    <tr><td className="align-top">4.</td><td className="align-top">Tempat, Tgl Lahir</td><td className="align-top">:</td><td>{formData.tempatLahir}, {formData.tanggalLahir}</td></tr>
                    <tr><td className="align-top">5.</td><td className="align-top">Alamat</td><td className="align-top">:</td><td>{formData.alamatTinggal}</td></tr>
                    <tr><td className="align-top">6.</td><td className="align-top">Telepon</td><td className="align-top">:</td><td>{formData.telp || formData.telpHp}</td></tr>
                    <tr><td className="align-top">7.</td><td className="align-top">Pekerjaan</td><td className="align-top">:</td><td>{formData.bidangUsaha}</td></tr>
                    <tr><td className="align-top">8.</td><td className="align-top">Sumber Dana</td><td className="align-top">:</td><td>{formData.sumberPendapatan?.join(', ')} {formData.sumberPendapatanLainnya}</td></tr>
                    <tr><td className="align-top">9.</td><td className="align-top">Tujuan Transaksi</td><td className="align-top">:</td><td>{formData.tujuanTransaksi}</td></tr>
                </tbody>
            </table>

            <h2 className="font-bold mb-2">B. Pernyataan</h2>
            <p className="text-justify text-[10pt] mb-8">
                Saya menyatakan bahwa informasi yang saya berikan dalam formulir ini adalah benar dan akurat.
            </p>

            <div className="flex justify-end pr-10">
                <div className="text-center w-64">
                    <p className="mb-1">{formData.tempatTandaTangan}, {new Date(formData.tanggalTandaTangan).toLocaleDateString('id-ID')}</p>
                    <p className="mb-20">Pengguna Jasa,</p>
                    <p className="font-bold border-b border-black inline-block min-w-[200px] uppercase">{formData.namaLengkap}</p>
                </div>
            </div>
        </div>
    );

    // 2. RENDERER CDD KORPORASI
    const renderCDDKorporasi = (formData: any) => (
        <div className="text-black font-sans leading-tight text-[10pt]">
            <div className="mb-3"><KopSurat /></div>
            <div className="text-center font-bold mb-3 uppercase border-b-2 border-black pb-1">
                <h1 className="text-lg">FORMULIR CUSTOMER DUE DILIGENCE KORPORASI</h1>
            </div>
            <table className="w-full text-[10pt] mb-3">
                <tbody>
                    <tr><td className="w-6 align-top">1.</td><td className="w-48 align-top">Nama Korporasi</td><td className="w-3 align-top">:</td><td className="border-b border-black border-dotted font-bold">{formData.namaKorporasi}</td></tr>
                    <tr><td className="align-top">2.</td><td className="align-top">Bentuk</td><td className="align-top">:</td><td>{formData.bentukKorporasi}</td></tr>
                    <tr><td className="align-top">3.</td><td className="align-top">NPWP</td><td className="align-top">:</td><td>{formData.npwp}</td></tr>
                    <tr><td className="align-top">4.</td><td className="align-top">Alamat</td><td className="align-top">:</td><td>{formData.alamatAkta}</td></tr>
                    <tr><td className="align-top">5.</td><td className="align-top">Pengurus / Kuasa</td><td className="align-top">:</td><td>{formData.namaPenggunaJasa} ({formData.jabatanKuasa})</td></tr>
                </tbody>
            </table>
            <div className="flex justify-end pr-10 mt-8">
                <div className="text-center w-64">
                    <p className="mb-1">{formData.kotaTandaTangan}, {new Date(formData.tglTandaTangan).toLocaleDateString('id-ID')}</p>
                    <p className="mb-20">Pengguna Jasa,</p>
                    <p className="font-bold border-b border-black inline-block min-w-[200px] uppercase">{formData.namaPenggunaJasa}</p>
                </div>
            </div>
        </div>
    );

    // 3. RENDERER SERAH TERIMA (Copy dari modul Serah Terima)
    const renderSerahTerima = (formData: any) => (
        <div className="font-sans text-black">
            <KopSurat />
            <div className="text-center mt-6 mb-8">
                <h1 className="text-xl font-bold underline decoration-2 underline-offset-4">TANDA TERIMA DOKUMEN</h1>
            </div>
            <div className="mb-6">
                <p>Telah diterima dari <strong>Notaris/PPAT</strong> dokumen-dokumen sebagai berikut:</p>
            </div>
            <div className="border border-black min-h-[400px] p-1 mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b border-black">
                            <th className="border-r border-black w-12 py-2 text-center">No</th>
                            <th className="border-r border-black py-2 px-3 text-left">Deskripsi / Judul Dokumen</th>
                            <th className="py-2 px-3 text-left w-40">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.items?.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-black/50">
                                <td className="border-r border-black py-2 text-center align-top">{i + 1}</td>
                                <td className="border-r border-black py-2 px-3 align-top">{item.description}</td>
                                <td className="py-2 px-3 align-top italic text-sm">{item.noteType} {item.note ? `(${item.note})` : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-start mt-12 px-8">
                <div className="text-center w-56">
                    <p className="mb-2">Yang Menerima,</p>
                    <div className="h-24"></div>
                    <p className="font-bold border-b border-black">{formData.receiver?.name || '...................'}</p>
                </div>
                <div className="text-center w-56">
                    <p className="mb-2">{formData.location || 'Garut'}, {new Date(formData.handoverDate).toLocaleDateString('id-ID')}</p>
                    <p className="mb-2">Yang Menyerahkan,</p>
                    <div className="h-24"></div>
                    <p className="font-bold border-b border-black">{formData.deliverer?.name || 'Staff Notaris'}</p>
                </div>
            </div>
        </div>
    );

    // 4. GENERIC RENDERER (Untuk Invoice, Daftar Hadir, dll yang belum dilayout spesifik)
    const renderGeneric = (doc: any) => (
        <div className="p-8">
            <KopSurat />
            <div className="mt-8 border-2 border-slate-300 border-dashed p-8 rounded-lg text-center bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-400 mb-2 uppercase">{doc.typeLabel}</h2>
                <p className="text-slate-500 mb-6">Preview grafis spesifik belum dikonfigurasi untuk tipe ini.<br />Data mentah tersedia di bawah.</p>

                <div className="text-left bg-white p-4 border rounded shadow-sm overflow-auto max-h-[500px] text-xs font-mono">
                    <pre>{JSON.stringify(doc.data, null, 2)}</pre>
                </div>
            </div>
            <div className="mt-4 text-center text-xs text-slate-400">
                *Untuk tampilan sempurna Invoice/Cover Akta, silakan salin layout JSX dari modul masing-masing ke file riwayat/page.tsx
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
            {/* --- LEFT SIDEBAR: LIST DOKUMEN --- */}
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full z-10">
                <div className="p-4 border-b border-slate-100 shadow-sm bg-white">
                    <h2 className="font-bold text-lg text-slate-800 mb-1">🗄️ Arsip Dokumen</h2>
                    <p className="text-xs text-slate-500 mb-4">Total {filteredData.length} dokumen tersimpan</p>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Cari nama klien / dokumen..."
                        className="w-full p-2 text-sm border rounded mb-3 bg-slate-50 focus:bg-white transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'invoice', 'serah-terima', 'cdd-perorangan', 'cdd-korporasi', 'cover-akta'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {type === 'all' ? 'Semua' : type.replace('-', ' ').toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Memuat data...</div>
                    ) : filteredData.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Tidak ada dokumen ditemukan.</div>
                    ) : (
                        filteredData.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={`p-3 rounded-lg cursor-pointer border transition-all hover:shadow-md ${selectedDoc?.id === doc.id
                                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                                        : 'bg-white border-slate-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${doc.type === 'invoice' ? 'bg-green-100 text-green-700' :
                                            doc.type === 'serah-terima' ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-200 text-slate-600'
                                        }`}>
                                        {doc.typeLabel}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{new Date(doc.date).toLocaleDateString('id-ID')}</span>
                                </div>
                                <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug">{doc.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 truncate">ID: {doc.originalId.slice(0, 8)}...</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- RIGHT SIDE: PREVIEW --- */}
            <div className="flex-1 bg-slate-200/50 relative flex flex-col h-full overflow-hidden">
                {/* Toolbar */}
                <div className="h-14 bg-white border-b border-slate-200 flex justify-between items-center px-6 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-600">Preview Mode</span>
                        <div className="flex items-center gap-2 bg-slate-100 rounded px-2 py-1">
                            <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded">-</button>
                            <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded">+</button>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        🖨️ Cetak Dokumen
                    </button>
                </div>

                {/* Document Canvas */}
                <div className="flex-1 overflow-auto p-8 flex justify-center items-start print:p-0 print:m-0 print:fixed print:inset-0 print:bg-white print:z-50">
                    {selectedDoc ? (
                        <div
                            className="print:w-full"
                            style={{
                                transform: `scale(${scale})`,
                                transformOrigin: 'top center',
                                marginBottom: `${(scale - 1) * 297}mm` // Adjust margin to prevent cut-off
                            }}
                        >
                            {/* Style Injection untuk Print */}
                            <style jsx global>{`
                            @media print {
                                @page { size: A4; margin: 0; }
                                body { margin: 0; -webkit-print-color-adjust: exact; }
                                .print\\:hidden { display: none !important; }
                                * { box-shadow: none !important; }
                            }
                        `}</style>

                            <A4Container>
                                {renderDocumentContent(selectedDoc)}
                            </A4Container>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <span className="text-4xl mb-2">📄</span>
                            <p>Pilih dokumen dari daftar untuk melihat preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}