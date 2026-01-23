'use client';

import { useRef, useState } from 'react';
import A4Container from '@/components/documents/A4Container';
import CoverHeader from '@/components/documents/CoverHeader';
import { saveCoverAkta } from '@/app/actions';

interface CoverAktaForm {
  jenisSalinan: 'grosse' | 'turunan' | 'salinan';
  judulAkta: string;
  nomorAkta: string;
  tanggal: string;
}

export default function CoverAktaModulePage() {
  const documentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [formData, setFormData] = useState<CoverAktaForm>({
    jenisSalinan: 'salinan',
    judulAkta: '',
    nomorAkta: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (field: keyof CoverAktaForm, value: string | 'grosse' | 'turunan' | 'salinan') => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCoverAkta(formData);
      alert('Data cover akta tersimpan.');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data cover akta.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    document.title = `COVER AKTA ${formData.judulAkta}  ${formData.tanggal}`;
    window.print();
  };

  const getFormattedDate = (): string => {
    if (!formData.tanggal) return '';
    try {
      const date = new Date(formData.tanggal);
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

  const renderJenisSalinan = () => {
    const options = ['grosse', 'turunan', 'salinan'] as const;
    return (
      <div className="flex justify-center gap-2 text-[12pt] font-bold font-serif">
        {options.map((option, index) => (
          <span key={option}>
            {formData.jenisSalinan === option ? (
              <span className="font-bold">{option.toUpperCase()}</span>
            ) : (
              <span className="line-through text-gray-400">{option.toUpperCase()}</span>
            )}
            {index < options.length - 1 && <span className="mx-1">/</span>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex gap-8 font-sans text-gray-800 print:p-0 print:bg-white">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          html, body { height: 100vh; overflow: hidden; margin: 0; padding: 0; background: white; }
          #print-target, #print-target * { visibility: visible; }
          #print-target {
            position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm;
            padding: 0; margin: 0; transform: none !important; box-shadow: none !important; background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* KOLOM KIRI: FORM INPUT */}
      <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm h-fit border border-gray-200 overflow-y-auto max-h-screen no-print space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Edit Data Cover Akta</h2>
        </div>

        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Jenis Salinan</label>
          <div className="space-y-2">
            {(['grosse', 'turunan', 'salinan'] as const).map((jenis) => (
              <label key={jenis} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="jenisSalinan"
                  value={jenis}
                  checked={formData.jenisSalinan === jenis}
                  onChange={(e) => handleInputChange('jenisSalinan', e.target.value as 'grosse' | 'turunan' | 'salinan')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm capitalize">{jenis}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Judul Akta</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Masukkan judul akta"
            value={formData.judulAkta}
            onChange={(e) => handleInputChange('judulAkta', e.target.value)}
            rows={4}
          />
        </section>

        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Nomor Akta</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Masukkan nomor akta"
            value={formData.nomorAkta}
            onChange={(e) => handleInputChange('nomorAkta', e.target.value)}
          />
        </section>

        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Tanggal</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            value={formData.tanggal}
            onChange={(e) => handleInputChange('tanggal', e.target.value)}
          />
          {formData.tanggal && (
            <p className="text-sm text-gray-600 italic">{getFormattedDate()}</p>
          )}
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-black transition disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan ke Database'}
        </button>
      </div>

      {/* KOLOM KANAN: PREVIEW & TOMBOL */}
      <div className="flex-1 flex flex-col items-center h-screen print:h-auto print:block">
        <div className="w-[210mm] mb-4 flex justify-between items-center no-print">
          <div className="text-sm text-gray-500 italic">Preview Dokumen A4</div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* AREA KERTAS (PREVIEW) */}
        <div className="flex-1 w-full overflow-auto flex justify-center print:overflow-visible print:block print:w-full">
          {/* Tambahkan 'font-serif' di wrapper utama agar Times New Roman tembus ke semua anak elemen */}
          <A4Container ref={documentRef} className="print-wrapper flex flex-col justify-between font-serif text-black" id="print-target">

            {/* 1. HEADER SK NOTARIS */}
            <div className="mt-4">
              <CoverHeader />
            </div>

            {/* 2. KONTEN UTAMA (CENTERED) */}
            {/* Gunakan mb-auto agar konten terdorong ke tengah vertikal relatif terhadap footer */}
            <div className="flex-1 flex flex-col justify-center -mt-20">

              {/* TEKS GROSSE/TURUNAN/SALINAN */}
              <div className="text-center font-serif text-[12pt] mb-10 tracking-wide text-black">
                {/* LOGIC: Jika dipilih = Bold, Jika tidak = Coret (line-through) */}

                {/* 1. Grosse */}
                <span className={formData.jenisSalinan === 'grosse' ? 'font-bold no-underline' : 'line-through font-bold decoration-2 decoration-black'}>
                  Grosse
                </span>

                <span className="mx-1">/</span>

                {/* 2. Turunan */}
                <span className={formData.jenisSalinan === 'turunan' ? 'font-bold no-underline' : 'line-through font-bold decoration-2 decoration-black'}>
                  Turunan
                </span>

                <span className="mx-1">/</span>

                {/* 3. Salinan */}
                <span className={formData.jenisSalinan === 'salinan' ? 'font-bold no-underline' : 'line-through font-bold decoration-2 decoration-black'}>
                  Salinan
                </span>
              </div>

              {/* INFORMASI AKTA - Menggunakan Grid Layout Manual untuk Presisi */}
              <div className="w-[80%] mx-auto px-4 text-[12pt] leading-relaxed font-serif text-black">

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
                      {formData.judulAkta || ''}
                    </div>
                  </div>
                </div>

                {/* BAGIAN NOMOR */}
                <div className="flex items-start mb-4">
                  <div className="w-[100px] pt-1 font-bold">NOMOR</div>
                  <div className="w-[20px] text-center pt-1">:</div>
                  <div className="flex-1">
                    <div className="border-b-[2px] border-black font-bold h-[1.5em]">
                      {/* Format: - 2 - */}
                      {formData.nomorAkta ? `-${formData.nomorAkta}.-` : ''}
                    </div>
                  </div>
                </div>

                {/* BAGIAN TANGGAL */}
                <div className="flex items-start">
                  <div className="w-[100px]  font-bold">TANGGAL</div>
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

          </A4Container>
        </div>
      </div>
    </div>
  );
}

