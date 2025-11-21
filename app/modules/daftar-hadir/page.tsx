'use client';

import { useRef, useState } from 'react';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import { saveDaftarHadir } from '@/app/actions';

interface Participant {
  nama: string;
}

interface DaftarHadirForm {
  tanggal: string;
  judul: string;
  nomorAkta: string;
  participants: Participant[];
}

export default function DaftarHadirModulePage() {
  const documentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [formData, setFormData] = useState<DaftarHadirForm>({
    tanggal: new Date().toISOString().split('T')[0],
    judul: '',
    nomorAkta: '',
    participants: [{ nama: '' }],
  });

  const handleInputChange = (field: keyof DaftarHadirForm, value: string | Participant[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleParticipantChange = (index: number, field: keyof Participant, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.participants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, participants: updated };
    });
  };

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, { nama: '' }],
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData((prev) => {
      if (prev.participants.length === 1) return prev;
      return {
        ...prev,
        participants: prev.participants.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDaftarHadir(formData);
      alert('Data daftar hadir tersimpan.');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data daftar hadir.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) {
      alert('Area dokumen tidak ditemukan.');
      return;
    }

    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Daftar-Hadir-${formData.nomorAkta.replace(/[^a-zA-Z0-9]/g, '-') || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          width: 750,
          windowWidth: 750,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      } as const;

      await html2pdf().set(opt).from(documentRef.current).save();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Gagal mengunduh PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const getFormattedDate = (): string => {
    if (!formData.tanggal) return '';
    const date = new Date(formData.tanggal);
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
          <h2 className="text-xl font-bold mb-1">Edit Data Daftar Hadir Akad</h2>
        </div>

        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Hari, Tanggal</label>
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

        <section className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Judul</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Masukkan judul akad"
            value={formData.judul}
            onChange={(e) => handleInputChange('judul', e.target.value)}
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

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">List Peserta Akad</h3>
            <button
              type="button"
              onClick={addParticipant}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              + Tambah Baris
            </button>
          </div>

          {formData.participants.map((participant, index) => (
            <div key={index} className="relative border border-gray-200 rounded-xl p-3 space-y-3 bg-gray-50">
              <button
                type="button"
                onClick={() => removeParticipant(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
              <div className="pr-6">
                <label className="text-xs font-medium text-gray-600 block mb-1">Nama Peserta</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  placeholder="Nama lengkap"
                  value={participant.nama}
                  onChange={(e) => handleParticipantChange(index, 'nama', e.target.value)}
                />
              </div>
            </div>
          ))}
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
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {downloading ? 'Mengunduh...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* AREA KERTAS (PREVIEW) */}
        <div className="flex-1 w-full overflow-auto flex justify-center print:overflow-visible print:block print:w-full">
          <A4Container ref={documentRef} className="print-wrapper flex flex-col" id="print-target">
            
            {/* 1. KOP SURAT */}
            <KopSurat />
            
            {/* 2. TEKS LEGAL (PARAGRAF PEMBUKA) */}
            <div className="text-[12pt] text-justify leading-[1.5] font-serif text-black">
              <p className="mb-3">
                Demikian berdasarkan dan untuk memenuhi ketentuan Pasal 16 ayat (1) huruf c, Undang-undang Nomor 
                2 Tahun 2014 tentang perubahan atas Undang-undang Nomor 30 Tahun 2014 tentang Jabatan Notaris.
              </p>
              <p className="mb-3">
                Telah dilekatkan <span className="font-bold underline">Daftar Hadir dan Dokumen</span> serta <span className="font-bold underline">Sidik Jari</span>, 
                pada lembaran tersendiri yang disediakan untuk keperluan tersebut dan merupakan satu kesatuan yang tidak terpisahkan dari minuta akta ini.
              </p>
            </div>

            {/* 3. INFORMASI AKTA (Alignment Titik Dua Presisi) */}
            <div className="mb-3 text-[12pt] font-bold font-serif text-black w-full">
              <div className="flex">
                <div className="w-[140px]">Hari, Tanggal</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1">{getFormattedDate()}</div>
              </div>
              <div className="flex">
                <div className="w-[140px]">Judul</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1 uppercase">{formData.judul || '...'}</div>
              </div>
              <div className="flex">
                <div className="w-[140px]">Nomor Akta</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1">{formData.nomorAkta || '...'}</div>
              </div>
            </div>

            {/* 4. TABEL PESERTA (Fixed Height Rows) */}
            <table className="w-full border-collapse border border-black text-[11pt] font-serif mb-3">
              <thead>
                <tr className="font-bold text-center">
                  <th className="border border-black p-2 w-12 align-middle">No.</th>
                  <th className="border border-black p-2 align-middle">Nama</th>
                  <th className="border border-black p-2 w-40 align-middle">Tanda Tangan</th>
                  <th className="border border-black w-40 align-middle">Sidik Jari<br/><span className="text-[8pt]">(IBU JARI KANAN)</span></th>
                  <th className="border border-black p-2 w-48 align-middle">Alamat & Telp.</th>
                </tr>
              </thead>
              <tbody>
                {formData.participants.length > 0 ? (
                  formData.participants.map((participant, index) => (
                    // Class h-32 memberikan tinggi fix untuk area tanda tangan
                    <tr key={index} className="h-32"> 
                      <td className="border border-black p-2 text-center align-middle font-bold">{index + 1}</td>
                      <td className="border border-black p-4 align-middle font-bold">
                        {/* Menambahkan 'Tuan/Nyonya' jika diperlukan logic-nya, atau render langsung */}
                        {participant.nama}
                      </td>
                      {/* Kolom Kosong untuk TTD & Sidik Jari */}
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  ))
                ) : (
                  // Tampilan Default Kosong (Agar layout tidak gepeng saat belum ada data)
                  <tr className="h-36">
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

            {/* Spacer agar footer turun ke bawah */}
            <div className="flex-grow"></div>

            {/* 5. FOOTER (Alamat Notaris) */}
            <div className="text-[9pt] text-center text-gray-600 pt-2 pb-4">
              <p>Jl. Jendral Sudirman, No.31 B, Sukamentri, Garut Kota</p>
              <p>Kabupaten Garut, Jawa Barat - Indonesia</p>
              <p>e-mail : hakbar.notpat@gmail.com ; Mobile Phone 0877 366 88 999</p>
            </div>

          </A4Container>
        </div>
      </div>
    </div>
  );
}

