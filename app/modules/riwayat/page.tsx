'use client';

import { useState, useEffect, useRef } from 'react';
import { getGlobalHistory } from '@/app/actions';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import KopLapbulPPAT from '@/components/documents/KopLapbulPPAT'; // Asumsi untuk cover/lapbul
import CoverHeader from '@/components/documents/CoverHeader'; // Asumsi untuk cover akta
import Image from 'next/image';

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
    const [scale, setScale] = useState(1.00);

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

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
            {/* LEFT SIDEBAR: LIST DOKUMEN */}
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full z-10 print:hidden">
                <div className="p-4 border-b border-slate-100 shadow-sm bg-white">
                    <h2 className="font-bold text-lg text-slate-800 mb-1">🗄️ Arsip Dokumen</h2>
                    <p className="text-xs text-slate-500 mb-4">Total {filteredData.length} dokumen tersimpan</p>

                    <input
                        type="text"
                        placeholder="Cari nama klien / dokumen..."
                        className="w-full p-2 text-sm border rounded mb-3 bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-blue-300"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'invoice', 'serah-terima', 'cdd-perorangan', 'cdd-korporasi', 'cover-akta', 'daftar-hadir'].map(type => (
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
                                            doc.type.includes('cdd') ? 'bg-purple-100 text-purple-700' :
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

            {/* RIGHT SIDE: PREVIEW */}
            <div className="flex-1 bg-slate-200/50 relative flex flex-col h-full overflow-hidden">
                {/* Toolbar */}
                <div className="h-14 bg-white border-b border-slate-200 flex justify-between items-center px-6 shadow-sm z-20 print:hidden">
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
                <div className="flex-1 overflow-auto p-8 flex justify-center items-start print:p-0 print:m-0 print:fixed print:inset-0 print:bg-white print:z-50 print:overflow-visible">
                    {selectedDoc ? (
                        <div
                            id="print-root"
                            className="print:w-full"
                            style={{
                                transform: `scale(${scale})`,
                                transformOrigin: 'top center',
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