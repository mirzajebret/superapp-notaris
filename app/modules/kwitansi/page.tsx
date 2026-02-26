'use client'

import { useState, useRef, useEffect } from 'react';
import KopKwitansi from '@/components/KopKwitansi';
import A4Wrapper from '@/components/A4Wrapper';

// --- TIPE DATA ---
interface KwitansiData {
    receivedFrom: string;
    amount: number;
    purpose: string;
    paymentMethod: 'Cash' | 'Transfer';
    date: string; // ISO Date string YYYY-MM-DD
    city: string;
    recipientName: string; // Yang menerima (Signer)
    payerName: string; // Yang menyetor
}

export default function KwitansiPage() {
    const [loading, setLoading] = useState<boolean>(false);
    const kwitansiRef = useRef<HTMLDivElement>(null);

    // Initial State
    const [formData, setFormData] = useState<KwitansiData>({
        receivedFrom: '',
        amount: 0,
        purpose: '',
        paymentMethod: 'Transfer',
        date: new Date().toISOString().split('T')[0],
        city: 'Garut',
        recipientName: 'Havis Akbar, S.H., M.Kn.', // Default signer
        payerName: ''
    });

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
        const final = result.trim();
        return (final.charAt(0).toUpperCase() + final.slice(1));
    };

    // --- HANDLERS ---
    const handleInputChange = (field: keyof KwitansiData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePrint = () => {
        document.title = `KWITANSI ${formData.receivedFrom} ${formData.date}`;
        window.print();
    };

    const getDisplayDate = (): string => {
        if (!formData.date) return '';
        const date = new Date(formData.date);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex gap-8 font-sans text-gray-800 print:p-0 print:bg-white">
            {/* --- CSS PRINT STYLE --- */}
            <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body * { visibility: hidden; }
          html, body { height: auto; overflow: hidden; margin: 0; padding: 0; background: white; }
          #kwitansi-print-wrapper, #kwitansi-print-wrapper * { visibility: visible; }
          #kwitansi-print-wrapper {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 8mm 12mm !important;
            transform: none !important; box-shadow: 1 !important; background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>

            {/* FORM INPUT */}
            <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm h-fit border border-gray-200 overflow-y-auto max-h-screen no-print">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Buat Kwitansi Baru</h2>

                <div className="space-y-4">
                    {/* Tanggal & Lokasi */}
                    <div className="grid grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal</label>
                            <input type="date" className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Kota</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
                        </div>
                    </div>

                    {/* Pembayar */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Telah Diterima Dari</label>
                        <textarea rows={2} className="w-full border border-gray-300 rounded p-2 text-sm"
                            placeholder="Nama Pembayar / Perusahaan"
                            value={formData.receivedFrom} onChange={(e) => handleInputChange('receivedFrom', e.target.value)} />
                    </div>

                    {/* Nominal */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Uang Sejumlah (Rp)</label>
                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm font-mono font-bold"
                            value={formData.amount === 0 ? '' : formData.amount}
                            onChange={(e) => handleInputChange('amount', Number(e.target.value))} />
                        <div className="mt-1 text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                            Terbilang: {formData.amount > 0 ? terbilang(formData.amount) : '-'}
                        </div>
                    </div>

                    {/* Kegunaan */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Untuk Pembayaran</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded p-2 text-sm"
                            placeholder="Deskripsi pembayaran..."
                            value={formData.purpose} onChange={(e) => handleInputChange('purpose', e.target.value)} />
                    </div>

                    {/* Metode Bayar */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Metode Pembayaran</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="paymentMethod" value="Cash"
                                    checked={formData.paymentMethod === 'Cash'}
                                    onChange={() => handleInputChange('paymentMethod', 'Cash')} />
                                <span className="text-sm">Cash / Tunai</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="paymentMethod" value="Transfer"
                                    checked={formData.paymentMethod === 'Transfer'}
                                    onChange={() => handleInputChange('paymentMethod', 'Transfer')} />
                                <span className="text-sm">Transfer</span>
                            </label>
                        </div>
                    </div>

                    {/* Penanda Tangan */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Penerima (TTD Kiri)</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={formData.recipientName} onChange={(e) => handleInputChange('recipientName', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Penyetor (TTD Kanan)</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm"
                                placeholder="(Opsional)"
                                value={formData.payerName} onChange={(e) => handleInputChange('payerName', e.target.value)} />
                        </div>
                    </div>

                    <button onClick={handlePrint} className="w-full mt-4 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        Cetak / Save PDF
                    </button>
                </div>
            </div>

            {/* PREVIEW */}
            <div className="flex-1 flex flex-col items-center h-screen print:h-auto print:block bg-gray-50 print:bg-white p-12">
                <div className="w-full max-w-[800px] p-8  print:shadow-none print:p-0">
                    <A4Wrapper ref={kwitansiRef} id="kwitansi-print-wrapper" height="99mm" className="!p-[12mm]">

                        {/* KOP - Pastikan KopKwitansi memiliki border double di bawahnya sesuai inv.jpg */}
                        <KopKwitansi />

                        {/* Garis Ganda Pemisah Kop (Jika belum ada di dalam komponen KopKwitansi) */}

                        <h2 className="text-center font-bold text-[14pt] mb-4 mt-2 tracking-widest">KWITANSI PEMBAYARAN</h2>

                        <div className="space-y-2 text-[10pt] font-serif">
                            {/* Row 1: Telah Diterima Dari */}
                            <div className="flex items-end">
                                <div className="w-56 font-bold whitespace-nowrap">TELAH DITERIMA DARI</div>
                                <div className="px-2">:</div>
                                <div className="flex-1 border-b border-dotted border-black min-h-[1.5em] px-2 italic">
                                    {formData.receivedFrom}
                                </div>
                            </div>

                            {/* Row 2: Uang Sejumlah */}
                            <div className="flex items-end">
                                <div className="w-56 font-bold whitespace-nowrap">UANG SEJUMLAH</div>
                                <div className="px-2">:</div>
                                <div className="flex-1 border-b border-dotted border-black min-h-[1.5em] px-2 italic capitalize">
                                    {formData.amount > 0 ? terbilang(formData.amount) + " Rupiah" : ''}
                                </div>
                            </div>

                            {/* Row 3: Untuk Pembayaran */}
                            <div className="flex items-start">
                                <div className="w-56 font-bold whitespace-nowrap pt-1">UNTUK PEMBAYARAN</div>
                                <div className="px-2 pt-1">:</div>
                                <div className="flex-1">
                                    <div
                                        className="min-h-[1em] leading-[2em] break-words whitespace-pre-wrap px-2"
                                        style={{
                                            backgroundImage: 'linear-gradient(to bottom, transparent 97%, black 97%)',
                                            backgroundSize: '100% 2em',
                                            backgroundPosition: '0 1.7em'
                                        }}
                                    >
                                        {formData.purpose || ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Area */}
                        <div className="mt-6 flex justify-between items-start">

                            {/* Bagian Kiri: Nominal & Checkbox */}
                            <div className="w-1/2">
                                {/* Box Nominal (Sesuai inv.jpg: border hitam, bg abu-abu di bagian angka) */}
                                <div className="flex items-center border-t border-b border-black w-fit mb-3">
                                    <div className="px-2 py-1 font-bold text-[14pt]">Rp.</div>
                                    <div className="bg-[#e5e7eb] px-4  font-bold text-[18pt] min-w-[250px] italic">
                                        {formData.amount ? formData.amount.toLocaleString('id-ID') : '0'}
                                    </div>
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-0.5 ml-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 border border-black flex items-center justify-center">
                                            {formData.paymentMethod === 'Cash' && <span className="text-[9px]">✓</span>}
                                        </div>
                                        <span className="text-[10pt]">Cash</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 border border-black flex items-center justify-center">
                                            {formData.paymentMethod === 'Transfer' && <span className="text-[9px]">✓</span>}
                                        </div>
                                        <span className="text-[10pt]">Transfer</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bagian Kanan: Tanggal & Tanda Tangan */}
                            <div className="w-[90%] text-right">
                                <div className="mb-8">
                                    {formData.city}, <span className="inline-block text-center">
                                        {getDisplayDate()}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-16">
                                    <div className="text-center flex-1">
                                        <div className="h-12"></div>
                                        <div className="border-t border-black pt-1 text-[10pt] font-bold">
                                            {formData.recipientName}
                                        </div>
                                    </div>
                                    <div className="text-center flex-1">
                                        <div className="h-12"></div>
                                        <div className="border-t border-black pt-1 text-[10pt] font-bold">
                                            {formData.payerName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </A4Wrapper>
                </div>
            </div>
        </div>
    );
}
