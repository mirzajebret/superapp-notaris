'use client'

import { useState, useEffect, useRef } from 'react';
import { saveInvoice } from '@/app/actions';
import Image from 'next/image';
import KopSurat from '@/components/KopSurat';
import A4Wrapper from '@/components/A4Wrapper';

// --- DEFINISI TIPE DATA ---
interface Recipient {
  name: string;
  position: string;
  company: string;
  address: string;
}

interface InvoiceItem {
  deskripsi: string;
  biaya: number;
  keterangan: string;
}

interface PaymentScheme {
  description: string;
  amount: number;
}

interface BankInfo {
  name: string;
  accountNo: string;
  accountName: string;
}

interface InvoiceData {
  recipient: Recipient;
  items: InvoiceItem[];
  paymentSchemes: PaymentScheme[];
  bank: BankInfo;
  invoiceDate: string;
  showStamp: boolean;
}

// --- KOMPONEN UTAMA ---
export default function NewInvoicePage() {
  const [loading, setLoading] = useState<boolean>(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // State Awal
  const [formData, setFormData] = useState<InvoiceData>({
    recipient: {
      name: '',
      position: '',
      company: '',
      address: ''
    },
    items: [{ deskripsi: '', biaya: 0, keterangan: '' }],
    paymentSchemes: [{ description: 'Pembayaran pertama sebesar 70% setelah penawaran disetujui', amount: 0 }],
    bank: {
      name: 'Bank BCA',
      accountNo: '2781977341',
      accountName: 'Havis Akbar, S.H., M.Kn'
    },
    invoiceDate: new Date().toISOString().split('T')[0],
    showStamp: true
  });

  // --- HELPER: CALCULATE TOTAL ---
  const calculateTotalBiaya = (): number => {
    return formData.items.reduce((sum, item) => sum + (item.biaya || 0), 0);
  };

  const totalBiaya = calculateTotalBiaya();

  // --- EFFECT: AUTO UPDATE DP 70% ---
  useEffect(() => {
    if (formData.paymentSchemes.length === 1 && formData.paymentSchemes[0].description.includes('70%')) {
      const total = calculateTotalBiaya();
      setFormData(prev => ({
        ...prev,
        paymentSchemes: [{ ...prev.paymentSchemes[0], amount: Math.round(total * 0.7) }]
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items]);

  // --- HANDLERS ---
  const handleInputChange = (section: keyof InvoiceData | 'recipient' | 'bank', field: string, value: any) => {
    if (section === 'recipient' || section === 'bank') {
      setFormData(prev => ({
        ...prev,
        [section]: { ...(prev[section] as any), [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    if (field === 'biaya') {
      newItems[index].biaya = Number(value);
    } else if (field === 'deskripsi' || field === 'keterangan') {
      (newItems[index] as any)[field] = value;
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handlePaymentSchemeChange = (index: number, field: keyof PaymentScheme, value: string | number) => {
    const newSchemes = [...formData.paymentSchemes];
    if (field === 'amount') {
      newSchemes[index].amount = Number(value);
    } else {
      (newSchemes[index] as any)[field] = value;
    }
    setFormData(prev => ({ ...prev, paymentSchemes: newSchemes }));
  };

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { deskripsi: '', biaya: 0, keterangan: '' }] }));
  const removeItem = (index: number) => {
    if (formData.items.length > 1) setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const addPaymentScheme = () => setFormData(prev => ({ ...prev, paymentSchemes: [...prev.paymentSchemes, { description: '', amount: 0 }] }));
  const removePaymentScheme = (index: number) => setFormData(prev => ({ ...prev, paymentSchemes: prev.paymentSchemes.filter((_, i) => i !== index) }));

  // --- ACTIONS ---
  const handleSubmit = async () => {
    setLoading(true);
    const invoiceNumber = `INV/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`;
    try {
      await saveInvoice({
        ...formData,
        total: totalBiaya,
        nomorInvoice: invoiceNumber,
        tanggalInvoice: formData.invoiceDate,
      });
      alert('Data Tersimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan invoice.');
    }
    setLoading(false);
  };

  // --- FITUR PRINT (NATIVE) ---
  const handlePrint = () => {
    document.title = `INVOICE ${formData.recipient.name} ${formData.invoiceDate}`;
    window.print();
  };

  const getDisplayDate = (): string => {
    if (!formData.invoiceDate) return '';
    const date = new Date(formData.invoiceDate);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex gap-8 font-sans text-gray-800 print:p-0 print:bg-white">

      {/* --- CSS FIX UNTUK PRINT --- */}
      <style jsx global>{`
        @media print {
          /* 1. Reset Browser Default */
          @page {
            margin: 0; /* Hilangkan margin browser agar Header/Footer url hilang */
            size: auto;
          }
          
          body * {
            visibility: hidden; /* Sembunyikan semua elemen web */
          }
          
          html, body {
            height: auto;
            overflow: hidden;
            margin: 0;
            padding: 0;
            background: white;
          }

          /* 2. Tampilkan Hanya Wrapper Invoice */
          #invoice-print-wrapper, #invoice-print-wrapper * {
            visibility: visible;
          }

          /* 3. Atur Layout Kertas A4 */
          #invoice-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            
            /* --- FIX MARGIN DISINI --- */
            /* Berikan padding 2cm (20mm) agar teks tidak mepet pinggir */
            padding: 20mm !important; 
            
            transform: none !important;
            box-shadow: none !important;
            background: white;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* --- KOLOM KIRI: FORM INPUT (No Print) --- */}
      <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm h-fit border border-gray-200 overflow-y-auto max-h-screen no-print">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Edit Data Invoice</h2>
        </div>

        <div className="space-y-6">
          {/* Form Content - Pengaturan Dokumen */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
            <h3 className="text-xs font-bold uppercase text-blue-600 tracking-wider">Pengaturan Dokumen</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Tanggal Invoice</label>
              <input type="date" className="w-full border border-gray-300 rounded p-1 text-sm" value={formData.invoiceDate} onChange={(e) => handleInputChange('invoiceDate', 'invoiceDate', e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tampilkan Cap/Stempel</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.showStamp} onChange={(e) => setFormData(prev => ({ ...prev, showStamp: e.target.checked }))} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Input Penerima */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-b pb-1">Penerima</h3>
            <div className="space-y-3">
              <input type="text" className="w-full border border-gray-300 rounded p-1 text-sm" placeholder="Nama Lengkap" value={formData.recipient.name} onChange={(e) => handleInputChange('recipient', 'name', e.target.value)} />
              <input type="text" className="w-full border border-gray-300 rounded p-1 text-sm" placeholder="Perusahaan (Opsional)" value={formData.recipient.company} onChange={(e) => handleInputChange('recipient', 'company', e.target.value)} />
              <textarea className="w-full border border-gray-300 rounded p-1 text-sm" placeholder="Alamat Lengkap" value={formData.recipient.address} onChange={(e) => handleInputChange('recipient', 'address', e.target.value)} rows={2}></textarea>
            </div>
          </div>

          {/* Rincian Pekerjaan */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-b pb-1">Rincian Pekerjaan</h3>
            <div className="space-y-4">
              {formData.items.map((item, idx) => (
                <div key={idx} className="relative bg-gray-50 p-3 rounded-lg border border-gray-200 group">
                  <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition p-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg></button>
                  <div className="space-y-2 pr-6">
                    <textarea placeholder="Deskripsi" className="w-full border border-gray-300 rounded p-1.5 text-sm font-medium" value={item.deskripsi} onChange={(e) => handleItemChange(idx, 'deskripsi', e.target.value)} rows={3} />
                    <input type="text" placeholder="Keterangan" className="w-full border border-gray-300 rounded p-1.5 text-xs" value={item.keterangan} onChange={(e) => handleItemChange(idx, 'keterangan', e.target.value)} />
                    <input type="number" placeholder="Biaya" className="w-full border border-gray-300 rounded p-1.5 text-sm text-right" value={item.biaya === 0 ? '' : item.biaya} onChange={(e) => handleItemChange(idx, 'biaya', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="w-full py-2 border border-dashed border-gray-400 text-gray-600 text-sm rounded hover:bg-gray-50 transition">+ Tambah Item</button>
            </div>
          </div>

          {/* Skema Pembayaran */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-b pb-1">Skema Pembayaran</h3>
            <div className="space-y-3">
              {formData.paymentSchemes.map((scheme, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <input type="text" className="w-full border border-gray-300 rounded p-1.5 text-xs" value={scheme.description} onChange={(e) => handlePaymentSchemeChange(idx, 'description', e.target.value)} />
                    <input type="number" className="w-full border border-gray-300 rounded p-1.5 text-xs text-right" value={scheme.amount === 0 ? '' : scheme.amount} onChange={(e) => handlePaymentSchemeChange(idx, 'amount', e.target.value)} />
                  </div>
                  <button onClick={() => removePaymentScheme(idx)} className="mt-2 text-gray-400 hover:text-red-600 transition"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg></button>
                </div>
              ))}
              <button onClick={addPaymentScheme} className="text-xs text-blue-600 hover:underline font-semibold">+ Tambah Termin</button>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-black  font-semibold text-white py-3 rounded-lg hover:bg-black transition font-medium">{loading ? 'Menyimpan...' : 'Simpan ke Database'}</button>
        </div>
      </div>

      {/* --- KOLOM KANAN: PREVIEW & TOMBOL --- */}
      <div className="flex-1 flex flex-col items-center h-screen print:h-auto print:block">

        {/* TOOLBAR TOMBOL (No Print) */}
        <div className="w-[210mm] mb-4 flex justify-between items-center no-print">
          <div className="text-sm text-gray-500 italic">Preview Dokumen A4</div>
          <div className="flex gap-3">
            {/* Tombol Cetak Langsung */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print
            </button>
          </div>
        </div>

        {/* AREA KERTAS (PREVIEW) - DIBUNGKUS DIV ID KHUSUS UNTUK PRINT */}
        <div className="flex-1 w-full overflow-auto flex justify-center print:overflow-visible print:block print:w-full print:h-auto">
          <A4Wrapper ref={invoiceRef}>

            {/* KOP SURAT */}
            <KopSurat />

            <h3 className="font-bold text-[12pt] underline decoration-1 underline-offset-4 uppercase text-center mb-5">INVOICE</h3>

            {/* KONTEN SURAT */}
            <div className="text-[11pt] mb-2">
              <p>Kepada Yth,</p>
              <p className="font-bold">{formData.recipient.name || '...'}</p>
              {formData.recipient.company && <p className="font-bold">{formData.recipient.company}</p>}
              {formData.recipient.address && <p className="w-2/4">{formData.recipient.address}</p>}
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
                {formData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1 text-center align-top">{idx + 1}</td>
                    <td className="border border-black p-1 align-top whitespace-pre-line">{item.deskripsi}</td>
                    <td className="border border-black p-1 text-right align-middle font-medium">Rp {item.biaya ? item.biaya.toLocaleString('id-ID') : '0'},-</td>

                    {idx === 0 && (
                      <td className="border border-black p-1 align-top text-[9pt] italic text-gray-600" rowSpan={formData.items.length}>
                        {formData.items.map((it, i) => (it.keterangan ? (
                          <div key={i} className="mb-2 whitespace-pre-line text-justify">
                            {formData.items.length > 1 && <span className="mr-1">-</span>}{it.keterangan}
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
                {formData.paymentSchemes.map((scheme, idx) => (
                  <tr key={idx}>
                    {idx === 0 && (
                      <td className="border border-black p-1 w-28 font-bold text-center align-middle" style={{ backgroundColor: '#f3f4f6' }} rowSpan={formData.paymentSchemes.length}>Skema Pembayaran</td>
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
                  <tr><td className="pr-4">Nama Bank</td><td>: {formData.bank.name}</td></tr>
                  <tr><td className="pr-4">No. Rekening</td><td>: {formData.bank.accountNo}</td></tr>
                  <tr><td className="pr-4">Atas Nama</td><td>: {formData.bank.accountName}</td></tr>
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
                  {formData.showStamp ? (
                    <Image src="/images/cap-ttd3.png" width={160} height={160} alt="Cap TTD" className="object-contain z-10" priority />
                  ) : (
                    <span className="text-gray-300 text-xs border border-dashed p-1">[Tanpa Cap]</span>
                  )}
                </div>
                <p className="font-bold underline z-20 relative">{formData.bank.accountName.split(',')[0]}, S.H., M.Kn., M.M</p>
                <p>Notaris & PPAT Kab. Garut</p>
              </div>
            </div>

          </A4Wrapper>
        </div>
      </div>
    </div>
  );
}

// --- HELPER FUNCTION (TERBILANG) ---
function terbilang(angka: number): string {
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
}

