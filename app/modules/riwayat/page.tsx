'use client';

import { useState, useEffect, useRef } from 'react';
import { getGlobalHistory } from '@/app/actions';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import KopLapbulPPAT from '@/components/documents/KopLapbulPPAT'; // Asumsi untuk cover/lapbul
import CoverHeader from '@/components/documents/CoverHeader'; // Asumsi untuk cover akta
import Image from 'next/image';
import {
    Search,
    FileText,
    Filter,
    Printer,
    ZoomIn,
    ZoomOut,
    ChevronRight,
    Loader2,
    Inbox,
    Calendar,
    Hash,
    MoreHorizontal
} from 'lucide-react';

// Helper untuk format mata uang (Invoice)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Helper untuk tanda tangan (Serah Terima)
const getSignatureImage = (val: string) => {
    if (val === 'mirza') return '/images/ttd-mirza.png';
    if (val === 'nepi') return '/images/ttd-nepi.png';
    return null;
};

export default function RiwayatPage() {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [filterType, setFilterType] = useState('all');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(0.8); // Default scale adjusted for better view

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

    // --- RENDERERS (COPY DARI MODULE ASLI) ---

    const renderDocumentContent = (doc: any) => {
        const { data } = doc;
        // Safety check jika data kosong
        if (!data) return <div className="text-center p-10">Data dokumen rusak/kosong</div>;

        switch (doc.type) {
            case 'cdd-perorangan':
                return renderCDDPerorangan(data);
            case 'cdd-korporasi':
                return renderCDDKorporasi(data);
            case 'serah-terima':
                return renderSerahTerima(data);
            case 'invoice':
                return renderInvoice(data);
            case 'cover-akta':
                return renderCoverAkta(data);
            case 'daftar-hadir':
                return renderDaftarHadir(data);
            default:
                return renderGeneric(doc);
        }
    };

    // 1. RENDERER SERAH TERIMA (Exact copy from original module)
    const renderSerahTerima = (formData: any) => {
        const renderNoteValue = (item: any) => {
            if (item.noteType === 'Custom') {
                return item.note || '-';
            }
            return item.noteType;
        };

        const getFormattedDate = () => {
            if (!formData.handoverDate) return '';
            return new Date(formData.handoverDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        };

        return (
            <div className="text-black font-sans">
                <KopSurat />

                <h3 className="font-bold text-[14pt] underline decoration-1 underline-offset-4 uppercase text-center mb-4">
                    Bukti Tanda Serah Terima
                </h3>

                <div className="flex justify-center gap-6 text-[11pt] font-semibold tracking-wide mb-4">
                    {([
                        { key: 'dokumen', label: 'Dokumen' },
                        { key: 'surat', label: 'Surat' },
                        { key: 'barang', label: 'Barang' },
                    ] as const).map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2 uppercase">
                            <span className="inline-flex items-center justify-center w-4 h-4 border border-black text-[9pt]">
                                {formData.documentTypes?.[key] ? '✓' : ''}
                            </span>
                            {label}
                        </div>
                    ))}
                </div>

                <p className="text-[11pt] mb-4">
                    Telah diserahkan/diterima berkas berupa surat/dokumen, sebagai berikut :
                </p>

                <table className="w-full border-collapse border border-black text-[10pt] mb-4">
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th className="border border-black p-2 w-12">No.</th>
                            <th className="border border-black p-2">Deskripsi</th>
                            <th className="border border-black p-2 w-40">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.items?.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="border border-black p-2 text-center align-top">{index + 1}</td>
                                <td className="border border-black p-2 align-top whitespace-pre-line">{item.description || '-'}</td>
                                <td className="border border-black p-2 align-top text-center">{renderNoteValue(item)}</td>
                            </tr>
                        ))}
                        {(!formData.items || formData.items.length === 0) && (
                            <tr>
                                <td className="border border-black p-2 text-center" colSpan={3}>
                                    Belum ada item ditambahkan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <p className="text-[11pt] text-justify mb-6">
                    Demikian bukti tanda serah terima ini dibuat untuk dipergunakan sebagaimana mestinya.
                </p>

                <div className="text-right text-[11pt] font-medium mb-10">
                    {formData.location && (
                        <p>
                            {formData.location}, {getFormattedDate()}
                        </p>
                    )}
                </div>

                <div className="flex justify-between text-[11pt]">

                    {/* KOLOM PENERIMA */}
                    <div className="w-1/2 text-center flex flex-col items-center">
                        <p className="font-medium mb-2">Yang Menerima</p>

                        <div className="h-24 flex items-center justify-center w-full relative">
                            {/* RENDER IMAGE DINAMIS */}
                            {getSignatureImage(formData.receiver?.signature) ? (
                                <Image
                                    src={getSignatureImage(formData.receiver.signature)!}
                                    width={230}
                                    height={180}
                                    alt="TTD Penerima"
                                    className="object-contain"
                                />
                            ) : (
                                <div className="w-full h-full"></div>
                            )}
                        </div>

                        <p className="font-bold underline decoration-1 underline-offset-4 mt-1">{formData.receiver?.name}</p>
                        <p className="text-[10pt]">{formData.receiver?.position}</p>
                    </div>

                    {/* KOLOM PENYERAH */}
                    <div className="w-1/2 text-center flex flex-col items-center">
                        <p className="font-medium mb-2">Yang Menyerahkan</p>

                        <div className="h-24 flex items-center justify-center w-full relative">
                            {/* RENDER IMAGE DINAMIS */}
                            {getSignatureImage(formData.deliverer?.signature) ? (
                                <Image
                                    src={getSignatureImage(formData.deliverer.signature)!}
                                    width={230}
                                    height={180}
                                    alt="TTD Penyerah"
                                    className="object-contain"
                                />
                            ) : (
                                <div className="w-full h-full"></div>
                            )}
                        </div>

                        <p className="font-bold underline decoration-1 underline-offset-4 mt-1">{formData.deliverer?.name}</p>
                        <p className="text-[10pt]">{formData.deliverer?.position}</p>
                    </div>
                </div>
            </div>
        );
    };

    // 2. RENDERER INVOICE (Exact copy from original module)
    const renderInvoice = (data: any) => {
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
            const final = result.trim();
            return final.charAt(0).toUpperCase() + final.slice(1);
        };

        const totalBiaya = data.items?.reduce((sum: number, item: any) => sum + (item.biaya || 0), 0) || 0;

        const getDisplayDate = (): string => {
            if (!data.invoiceDate) return '';
            const date = new Date(data.invoiceDate);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        return (
            <div className="text-black font-sans">
                {/* KOP SURAT */}
                <KopSurat />

                <h3 className="font-bold text-[12pt] underline decoration-1 underline-offset-4 uppercase text-center mb-5">INVOICE</h3>

                {/* KONTEN SURAT */}
                <div className="text-[11pt] mb-2">
                    <p>Kepada Yth,</p>
                    <p className="font-bold">{data.recipient?.name || '...'}</p>
                    {data.recipient?.company && <p className="font-bold">{data.recipient.company}</p>}
                    {data.recipient?.address && <p className="w-2/4">{data.recipient.address}</p>}
                    <p className="mt-2">Dengan hormat,</p>
                    <p className="mt-2 text-justify">Dengan ini kami sampaikan biaya penggunaan Jasa Notaris & PPAT Havis Akbar, S.H., M.Kn, dengan rincian pekerjaan sebagai berikut :</p>
                </div>

                {/* TABEL RINCIAN - Gunakan Hex color #f3f4f6 pengganti bg-gray-200 agar aman */}
                <table className="w-full border-collapse border border-black text-[10pt] mb-2">
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }} className="text-center print:bg-gray-200">
                            <th className="border border-black p-1 w-10">No.</th>
                            <th className="border border-black p-1">Deskripsi Pekerjaan</th>
                            <th className="border border-black p-1 w-32">Biaya</th>
                            <th className="border border-black p-1 w-36">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items?.map((item: any, idx: number) => (
                            <tr key={idx}>
                                <td className="border border-black p-1 text-center align-top">{idx + 1}</td>
                                <td className="border border-black p-1 align-top whitespace-pre-line">{item.deskripsi}</td>
                                <td className="border border-black p-1 text-right align-middle font-medium">Rp {item.biaya ? item.biaya.toLocaleString('id-ID') : '0'},-</td>

                                {idx === 0 && (
                                    <td className="border border-black p-1 align-top text-[9pt] italic text-gray-600" rowSpan={data.items.length}>
                                        {data.items.map((it: any, i: number) => (it.keterangan ? (
                                            <div key={i} className="mb-2 whitespace-pre-line text-justify">
                                                {data.items.length > 1 && <span className="mr-1">-</span>}{it.keterangan}
                                            </div>
                                        ) : null
                                        ))}
                                    </td>
                                )}
                            </tr>
                        ))}

                        <tr style={{ backgroundColor: '#f3f4f6' }} className="font-bold">
                            <td colSpan={2} className="border border-black p-1 text-right">Total Biaya</td>
                            <td className="border border-black p-1 text-right">Rp {totalBiaya.toLocaleString('id-ID')},-</td>
                            <td className="border border-black p-1" style={{ backgroundColor: '#f3f4f6' }}></td>
                        </tr>

                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <td colSpan={4} className="border border-black p-1 text-[10pt] font-bold italic text-center">
                                Terbilang : {terbilang(totalBiaya)} Rupiah.
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* TABEL SKEMA PEMBAYARAN */}
                <table className="w-full border-collapse border border-black text-[10pt] mb-2">
                    <tbody>
                        {data.paymentSchemes?.map((scheme: any, idx: number) => (
                            <tr key={idx}>
                                {idx === 0 && (
                                    <td className="border border-black p-1 w-28 font-bold text-center align-middle" style={{ backgroundColor: '#f3f4f6' }} rowSpan={data.paymentSchemes.length}>Skema Pembayaran</td>
                                )}
                                <td className="border border-black p-1 align-middle">{scheme.description}</td>
                                <td className="border border-black p-1 text-right w-36 font-bold align-middle">Rp {scheme.amount.toLocaleString('id-ID')},-</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* INFO TRANSFER */}
                <div className="text-[11pt] mb-3">
                    <p>Pembayaran dapat ditransfer ke rekening berikut ini :</p>
                    <table className="border-none font-bold">
                        <tbody>
                            <tr><td className="pr-4">Nama Bank</td><td>: {data.bank?.name}</td></tr>
                            <tr><td className="pr-4">No. Rekening</td><td>: {data.bank?.accountNo}</td></tr>
                            <tr><td className="pr-4">Atas Nama</td><td>: {data.bank?.accountName}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* TANDA TANGAN */}
                <div className="flex justify-end text-[11pt]">
                    <div className="text-center w-64">
                        <p>Garut, {getDisplayDate()}</p>
                        <p>Hormat Saya,</p>
                        <div className="h-24 flex items-center justify-center relative">
                            {/* Logic Tampilkan Cap */}
                            {data.showStamp ? (
                                <Image src="/images/cap-ttd3.png" width={160} height={160} alt="Cap TTD" className="object-contain z-10" priority />
                            ) : (
                                <span className="text-gray-300 text-xs border border-dashed p-1">[Tanpa Cap]</span>
                            )}
                        </div>
                        <p className="font-bold underline z-20 relative">{data.bank?.accountName?.split(',')[0]}, S.H., M.Kn., M.M</p>
                        <p>Notaris & PPAT Kab. Garut</p>
                    </div>
                </div>

            </div>
        );
    };

    // 3. RENDERER CDD PERORANGAN
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
                    <tr><td className="w-6 py-1 align-top">1.</td><td className="w-48 py-1 align-top">Nama Lengkap</td><td className="w-4 py-1 align-top">:</td><td className="border-b border-black border-dotted py-1 font-medium">{formData.namaLengkap}</td></tr>
                    <tr><td className="py-1 align-top">2.</td><td className="py-1 align-top">No. Identitas</td><td className="py-1 align-top">:</td><td className="py-1">{formData.jenisIdentitas} - {formData.noIdentitas}</td></tr>
                    <tr><td className="py-1 align-top">3.</td><td className="py-1 align-top">NPWP</td><td className="py-1 align-top">:</td><td className="py-1">{formData.npwp || '-'}</td></tr>
                    <tr><td className="py-1 align-top">4.</td><td className="py-1 align-top">Tempat, Tgl Lahir</td><td className="py-1 align-top">:</td><td className="py-1">{formData.tempatLahir}, {formData.tanggalLahir}</td></tr>
                    <tr><td className="py-1 align-top">5.</td><td className="py-1 align-top">Alamat</td><td className="py-1 align-top">:</td><td className="py-1">{formData.alamatTinggal}</td></tr>
                    <tr><td className="py-1 align-top">6.</td><td className="py-1 align-top">Telepon</td><td className="py-1 align-top">:</td><td className="py-1">{formData.telp || formData.telpHp}</td></tr>
                    <tr><td className="py-1 align-top">7.</td><td className="py-1 align-top">Pekerjaan</td><td className="py-1 align-top">:</td><td className="py-1">{formData.bidangUsaha}</td></tr>
                    <tr><td className="py-1 align-top">8.</td><td className="py-1 align-top">Sumber Dana</td><td className="py-1 align-top">:</td><td className="py-1">{formData.sumberPendapatan?.join(', ')} {formData.sumberPendapatanLainnya}</td></tr>
                    <tr><td className="py-1 align-top">9.</td><td className="py-1 align-top">Tujuan Transaksi</td><td className="py-1 align-top">:</td><td className="border-b border-black border-dotted py-1">{formData.tujuanTransaksi}</td></tr>
                </tbody>
            </table>

            <h2 className="font-bold mb-2">B. Pernyataan</h2>
            <p className="text-justify text-[10pt] mb-8">
                Saya menyatakan bahwa informasi yang saya berikan dalam formulir ini adalah benar dan akurat.
            </p>

            <div className="flex justify-end pr-10">
                <div className="text-center w-64">
                    <p className="mb-1">{formData.tempatTandaTangan}, {formData.tanggalTandaTangan ? new Date(formData.tanggalTandaTangan).toLocaleDateString('id-ID') : ''}</p>
                    <p className="mb-20">Pengguna Jasa,</p>
                    <p className="font-bold border-b border-black inline-block min-w-[200px] uppercase">{formData.namaLengkap}</p>
                </div>
            </div>
        </div>
    );

    // 4. RENDERER CDD KORPORASI
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
                    <p className="mb-1">{formData.kotaTandaTangan}, {formData.tglTandaTangan ? new Date(formData.tglTandaTangan).toLocaleDateString('id-ID') : ''}</p>
                    <p className="mb-20">Pengguna Jasa,</p>
                    <p className="font-bold border-b border-black inline-block min-w-[200px] uppercase">{formData.namaPenggunaJasa}</p>
                </div>
            </div>
        </div>
    );

    // 5. RENDERER COVER AKTA (DIPERBAIKI LAYOUTNYA)
    const renderCoverAkta = (data: any) => {
        const getFormattedDate = (): string => {
            if (!data.tanggal) return '';
            try {
                const date = new Date(data.tanggal);
                if (isNaN(date.getTime())) return '';
                const months = [
                    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
                ];
                const day = date.getDate().toString().padStart(2, '0');
                const month = months[date.getMonth()];
                const year = date.getFullYear();
                return `${day} ${month} ${year}`;
            } catch {
                return '';
            }
        };

        return (
            // Menggunakan padding yang lebih besar dan justify-between untuk distribusi vertikal penuh
            <div className="flex flex-col justify-between font-serif text-black h-full px-10 py-12">
                {/* 1. HEADER SK NOTARIS & JENIS SALINAN */}
                <div>
                    <div className="mt-4">
                        <CoverHeader />
                    </div>
                    <div className="text-center font-serif text-[12pt] mt-10 mb-4 tracking-wide text-black">
                        {/* LOGIC: Jika dipilih = Bold, Jika tidak = Coret (line-through) */}
                        <span className={data.jenisSalinan === 'grosse' ? 'font-bold no-underline' : 'line-through font-bold decoration-2 decoration-black'}>
                            Grosse
                        </span>
                        <span className="mx-1">/</span>
                        <span className={data.jenisSalinan === 'turunan' ? 'font-bold no-underline' : 'line-through font-bold decoration-2 decoration-black'}>
                            Turunan
                        </span>
                        <span className="mx-1">/</span>
                        <span className={data.jenisSalinan === 'salinan' ? 'font-bold no-underline' : 'line-through font-bold decoration-2 decoration-black'}>
                            Salinan
                        </span>
                    </div>
                </div>

                {/* 2. KONTEN UTAMA (CENTERED) - Menggunakan flex-1 dan justify-center untuk penempatan otomatis di tengah */}
                <div className="flex-1 flex flex-col justify-center py-8">
                    {/* INFORMASI AKTA - Menggunakan Grid Layout Manual untuk Presisi */}
                    <div className="w-[90%] mx-auto px-4 text-[12pt] leading-relaxed font-serif text-black">

                        {/* BAGIAN AKTA */}
                        <div className="flex items-start mb-6">
                            <div className="w-[100px] pt-2 font-bold shrink-0">AKTA</div>
                            <div className="w-[20px] text-center pt-2 shrink-0">:</div>
                            <div className="flex-1 flex flex-col gap-1">
                                <div
                                    className="uppercase font-bold min-h-[1em] leading-[2em] break-words whitespace-pre-wrap"
                                    style={{
                                        backgroundImage: 'linear-gradient(to bottom, transparent 97%, black 97%)',
                                        backgroundSize: '100% 2em',
                                        backgroundPosition: '0 1.7em'
                                    }}
                                >
                                    {data.judulAkta || ''}
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN NOMOR */}
                        <div className="flex items-start mb-4">
                            <div className="w-[100px] pt-1 font-medium">NOMOR</div>
                            <div className="w-[20px] text-center pt-1">:</div>
                            <div className="flex-1">
                                <div className="border-b-[2px] border-black font-bold h-[1.5em]">
                                    {data.nomorAkta ? `-${data.nomorAkta}.-` : ''}
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN TANGGAL */}
                        <div className="flex items-start">
                            <div className="w-[100px]  font-medium">TANGGAL</div>
                            <div className="w-[20px] text-center pt-1">:</div>
                            <div className="flex-1">
                                <div className="border-b-[2px] border-black  uppercase h-[1.5em]">
                                    {getFormattedDate().toUpperCase()}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. FOOTER (Alamat Kantor - Bold & Small) */}
                <div className="text-[10pt] text-center font-bold leading-snug pb-8">
                    <p>Jl. Jenderal Sudirman, 31 B, Sukamentri, Kecamatan. Garut Kota, Kabupaten Garut-44116</p>
                    <p>Call/WhatsApp : 081373337888 Email : hakbar.notpat@gmail.com</p>
                </div>

            </div>
        );
    };

    // 6. RENDERER DAFTAR HADIR (Exact copy from original module)
    const renderDaftarHadir = (data: any) => {
        const getFormattedDate = (): string => {
            if (!data.tanggal) return '';
            const date = new Date(data.tanggal);
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const dayName = days[date.getDay()];
            const formattedDate = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            return `${dayName}, ${formattedDate}`;
        };

        return (
            <div className="text-black font-sans">
                {/* 1. KOP SURAT */}
                <KopSurat />

                {/* 2. TEKS LEGAL */}
                <div className="text-[12pt] text-justify leading-[1.5] font-serif text-black">
                    <p className="mb-1">
                        Demikian berdasarkan dan untuk memenuhi ketentuan Pasal 16 ayat (1) huruf c, Undang-undang Nomor
                        2 Tahun 2014 tentang perubahan atas Undang-undang Nomor 30 Tahun 2014 tentang Jabatan Notaris.
                    </p>
                    <p className="mb-3">
                        Telah dilekatkan <span className="font-bold underline">Daftar Hadir dan Dokumen</span> serta <span className="font-bold underline">Sidik Jari</span>,
                        pada lembaran tersendiri yang disediakan untuk keperluan tersebut dan merupakan satu kesatuan yang tidak terpisahkan dari minuta akta ini.
                    </p>
                </div>

                {/* 3. INFORMASI AKTA */}
                <div className="mb-3 text-[12pt] font-bold font-serif text-black w-full">
                    <div className="flex">
                        <div className="w-[140px]">Hari, Tanggal</div>
                        <div className="w-[20px] text-center">:</div>
                        <div className="flex-1">{getFormattedDate()}</div>
                    </div>
                    <div className="flex">
                        <div className="w-[140px]">Judul</div>
                        <div className="w-[20px] text-center">:</div>
                        <div className="flex-1 uppercase">{data.judul || '...'}</div>
                    </div>
                    <div className="flex">
                        <div className="w-[140px]">Nomor Akta</div>
                        <div className="w-[20px] text-center">:</div>
                        <div className="flex-1">{data.nomorAkta || '...'}</div>
                    </div>
                </div>

                {/* 4. TABEL PESERTA */}
                <table className="w-full border-collapse border border-black text-[11pt] font-serif mb-4">
                    {/* thead akan otomatis berulang di halaman baru berkat CSS */}
                    <thead>
                        <tr className="font-bold text-center bg-gray-50 print:bg-white">
                            <th className="border border-black p-2 w-10 align-middle">No.</th>
                            <th className="border border-black p-2 w-[170px] align-middle">Nama</th>
                            <th className="border border-black p-2 w-[140px] align-middle">Tanda Tangan</th>
                            <th className="border border-black w-32 align-middle">Sidik Jari<br /><span className="text-[8pt]">(IBU JARI KANAN)</span></th>
                            <th className="border border-black p-2 w-[160px] align-middle">Alamat & Telp.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.participants && data.participants.length > 0 ? (
                            data.participants.map((participant: any, index: number) => (
                                // Class h-32 tetap ada untuk tinggi visual, CSS 'page-break-inside: avoid' menjaga agar tidak terpotong
                                <tr key={index} className="h-[110px]">
                                    <td className="border border-black p-2 text-center align-middle font-bold">{index + 1}</td>
                                    <td className="border border-black p-4 align-middle font-bold">
                                        {participant.nama}
                                    </td>
                                    <td className="border border-black p-2"></td>
                                    <td className="border border-black p-2"></td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                            ))
                        ) : (
                            <tr className="h-32">
                                <td className="border border-black p-2 text-center align-middle">1</td>
                                <td className="border border-black p-2 align-middle font-bold uppercase">
                                    (Belum ada peserta)
                                </td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                            </tr>
                        )}
                    </tbody>
                </table>

            </div>
        );
    };

    // GENERIC FALLBACK
    const renderGeneric = (doc: any) => (
        <div className="p-8">
            <KopSurat />
            <div className="mt-8 border-2 border-slate-300 border-dashed p-8 rounded-lg text-center bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-400 mb-2 uppercase">{doc.typeLabel}</h2>
                <p className="text-slate-500 mb-6">Preview standar belum tersedia.</p>
                <pre className="text-left text-xs bg-white p-4 border overflow-auto">{JSON.stringify(doc.data, null, 2)}</pre>
            </div>
        </div>
    );

    // Filter Buttons Configuration
    const FILTER_OPTIONS = [
        { id: 'all', label: 'Semua', icon: Inbox },
        { id: 'invoice', label: 'Invoice', icon: FileText },
        { id: 'serah-terima', label: 'Serah Terima', icon: FileText },
        { id: 'cdd-perorangan', label: 'CDD Perorangan', icon: Calendar },
        { id: 'cdd-korporasi', label: 'CDD Korporasi', icon: Calendar },
        { id: 'cover-akta', label: 'Cover Akta', icon: Hash },
        { id: 'daftar-hadir', label: 'Daftar Hadir', icon: FileText },
    ];

    return (
        <div className="flex h-screen bg-[#f8fbff] overflow-hidden font-sans">
            {/* SIDEBAR */}
            <div className="w-[420px] flex-shrink-0 bg-white border-r border-[#eef2f6] flex flex-col h-full z-10 print:hidden shadow-lg shadow-gray-100/50">
                {/* Header Side */}
                <div className="p-6 border-b border-[#f1f5f9] bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <FolderOpenIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-slate-900 leading-none tracking-tight">Digital Archive</h2>
                            <p className="text-[11px] text-slate-500 font-medium">Riwayat & Dokumen Tersimpan</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="px-5 pt-4 pb-2 bg-white">
                    <div className="relative mb-4 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari nama klien, dokumen, atau ID..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                        {FILTER_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setFilterType(opt.id)}
                                className={`
                                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border
                                    ${filterType === opt.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }
                                `}
                            >
                                {filterType === opt.id && <opt.icon className="w-3 h-3" />}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Document List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 bg-[#f8fbff]/50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-2">
                        {isLoading ? 'Memuat...' : `Menampilkan ${filteredData.length} Dokumen`}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-10 h-64 text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <span className="text-sm font-medium">Mengambil data arsip...</span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 mt-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl mx-2 bg-white/50">
                            <div className="p-4 bg-slate-50 rounded-full mb-3">
                                <Inbox className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">Tidak ada dokumen ditemukan</p>
                            <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau reset filter</p>
                        </div>
                    ) : (
                        filteredData.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={`
                                    group relative p-4 rounded-xl cursor-pointer border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                                    ${selectedDoc?.id === doc.id
                                        ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20 z-10'
                                        : 'bg-white border-transparent hover:border-blue-200 shadow-sm'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`
                                        text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5
                                        ${doc.type === 'invoice' ? 'bg-emerald-50 text-emerald-600' :
                                            doc.type === 'serah-terima' ? 'bg-amber-50 text-amber-600' :
                                                doc.type.includes('cdd') ? 'bg-violet-50 text-violet-600' :
                                                    'bg-slate-100 text-slate-600'
                                        }
                                    `}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${doc.type === 'invoice' ? 'bg-emerald-500' :
                                            doc.type === 'serah-terima' ? 'bg-amber-500' :
                                                doc.type.includes('cdd') ? 'bg-violet-500' :
                                                    'bg-slate-500'
                                            }`} />
                                        {doc.typeLabel}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(doc.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                    </span>
                                </div>

                                <h3 className={`font-bold text-[13px] leading-snug mb-2 ${selectedDoc?.id === doc.id ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>
                                    {doc.title}
                                </h3>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                    <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                        <Hash className="w-3 h-3" />
                                        {doc.originalId.slice(0, 8).toUpperCase()}...
                                    </p>
                                    <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedDoc?.id === doc.id ? 'translate-x-1 text-blue-500' : ''}`} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MAIN PREVIEW AREA */}
            <div className="flex-1 bg-slate-100/50 relative flex flex-col h-full overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.4]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}></div>

                {/* Toolbar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 print:hidden flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-full ring-1 ring-black/5">
                    <button
                        onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full text-slate-600 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>

                    <div className="px-3 min-w-[60px] text-center font-bold text-sm text-slate-700 select-none">
                        {Math.round(scale * 100)}%
                    </div>

                    <button
                        onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full text-slate-600 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>

                    <div className="w-px h-6 bg-slate-300 mx-1"></div>

                    <button
                        onClick={() => window.print()}
                        className="px-5 h-10 bg-slate-900 hover:bg-black text-white rounded-full text-sm font-semibold shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Cetak / PDF</span>
                    </button>
                </div>

                {/* Document Canvas */}
                <div className="flex-1 overflow-auto p-12 flex justify-center items-start print:p-0 print:m-0 print:fixed print:inset-0 print:bg-white print:z-50 print:overflow-visible z-10 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    {selectedDoc ? (
                        <div
                            id="print-root"
                            className="print:w-full transition-transform duration-200 ease-out origin-top"
                            style={{
                                transform: `scale(${scale})`,
                                marginBottom: `${(scale - 1) * 297}mm`
                            }}
                        >
                            {/* Print CSS Injection */}
                            <style jsx global>{`
                                @media print {
                                    @page { size: A4; margin: 0; }
                                    body { margin: 0; -webkit-print-color-adjust: exact; background: white; }
                                    .print\\:hidden { display: none !important; }
                                    * { box-shadow: none !important; text-shadow: none !important; }
                                    #print-root { transform: scale(1) !important; margin: 0 !important; position: absolute; top: 0; left: 0; width: 100%; }
                                }
                            `}</style>

                            <div>
                                <A4Container>
                                    {renderDocumentContent(selectedDoc)}
                                </A4Container>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600 mb-1">Preview Dokumen</h3>
                            <p className="text-slate-400 max-w-xs text-center leading-relaxed">Pilih salah satu dokumen dari daftar di sebelah kiri untuk melihat preview detail.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Icon helper components
function FolderOpenIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
        </svg>
    )
}