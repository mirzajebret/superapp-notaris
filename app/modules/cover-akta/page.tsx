'use client';

import { useRef, useState } from 'react';
import A4Container from '@/components/documents/A4Container';
import CoverHeader from '@/components/documents/CoverHeader';
import { saveCoverAkta } from '@/app/actions';

// ─── Types ───────────────────────────────────────────────────────────────────

type CoverType = 'notaris' | 'ppat';

interface CoverAktaNotarisForm {
  jenisSalinan: 'grosse' | 'turunan' | 'salinan';
  judulAkta: string;
  nomorAkta: string;
  tanggal: string;
}

interface CoverAktaPPATForm {
  judulAkta: string;
  nomorAkta: string;
  tahun: string;
  tanggal: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateIndonesia(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return '';
  }
}

function formatDateIndonesiaUpper(dateStr: string): string {
  return formatDateIndonesia(dateStr).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Header kop surat PPAT (text-only, no Garuda) */
function PPATCoverHeader() {
  return (
    <div className="text-center font-serif text-black leading-snug">
      <p className="text-[16pt] font-bold uppercase">PEJABAT PEMBUAT AKTA TANAH</p>
      <p className="text-[16pt] font-bold uppercase">(PPAT)</p>
      <p className="text-[16pt] font-bold">HAVIS AKBAR, S.H., M.Kn.</p>
      <p className="text-[8pt] font-normal uppercase tracking-wide mt-0.5">DAERAH KERJA : KABUPATEN GARUT</p>
      <p className="text-[10pt] font-normal">SK. Kepala Badan Pertanahan Nasional Republik Indonesia</p>
      <p className="text-[10pt] font-normal">Nomor : 1485/SK-HR 03.04.PPAT/XII/2023 Tanggal 29 Desember 2023</p>
      <p className="text-[10pt] font-bold mt-0.5">
        Jalan Jenderal Sudirman Nomor 31 B, Kelurahan Sukamentri, Kecamatan Garut Kota,
      </p>
      <p className="text-[8.5pt] font-bold">Kabupaten Garut - 44116 Telp : 087736688999</p>
      {/* Double border line */}
      <div className="mt-2 border-t-4 border-black" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoverAktaModulePage() {
  const documentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [coverType, setCoverType] = useState<CoverType>('notaris');

  // --- Notaris form state ---
  const [notarisForm, setNotarisForm] = useState<CoverAktaNotarisForm>({
    jenisSalinan: 'salinan',
    judulAkta: '',
    nomorAkta: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // --- PPAT form state ---
  const [ppatForm, setPpatForm] = useState<CoverAktaPPATForm>({
    judulAkta: 'AKTA JUAL BELI',
    nomorAkta: '',
    tahun: new Date().getFullYear().toString(),
    tanggal: new Date().toISOString().split('T')[0],
  });

  const handleNotarisChange = (field: keyof CoverAktaNotarisForm, value: string) => {
    setNotarisForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePpatChange = (field: keyof CoverAktaPPATForm, value: string) => {
    setPpatForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCoverAkta(notarisForm);
      alert('Data cover akta tersimpan.');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data cover akta.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (coverType === 'notaris') {
      document.title = `COVER AKTA ${notarisForm.judulAkta} ${notarisForm.tanggal}`;
    } else {
      document.title = `COVER AKTA PPAT ${ppatForm.judulAkta} ${ppatForm.tanggal}`;
    }
    window.print();
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

      {/* ── KOLOM KIRI: FORM INPUT ── */}
      <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm h-fit border border-gray-200 overflow-y-auto max-h-screen no-print space-y-6">

        {/* Toggle: Notaris / PPAT */}
        <div>
          <h2 className="text-xl font-bold mb-3">Edit Data Cover Akta</h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setCoverType('notaris')}
              className={`flex-1 py-2 text-sm font-semibold transition ${coverType === 'notaris'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              Cover Akta Notaris
            </button>
            <button
              type="button"
              onClick={() => setCoverType('ppat')}
              className={`flex-1 py-2 text-sm font-semibold transition ${coverType === 'ppat'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              Cover Akta PPAT
            </button>
          </div>
        </div>

        {/* ── FORM: NOTARIS ── */}
        {coverType === 'notaris' && (
          <>
            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Jenis Salinan</label>
              <div className="space-y-2">
                {(['grosse', 'turunan', 'salinan'] as const).map((jenis) => (
                  <label key={jenis} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="jenisSalinan"
                      value={jenis}
                      checked={notarisForm.jenisSalinan === jenis}
                      onChange={(e) => handleNotarisChange('jenisSalinan', e.target.value)}
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
                value={notarisForm.judulAkta}
                onChange={(e) => handleNotarisChange('judulAkta', e.target.value)}
                rows={4}
              />
            </section>

            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Nomor Akta</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Masukkan nomor akta"
                value={notarisForm.nomorAkta}
                onChange={(e) => handleNotarisChange('nomorAkta', e.target.value)}
              />
            </section>

            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Tanggal</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                value={notarisForm.tanggal}
                onChange={(e) => handleNotarisChange('tanggal', e.target.value)}
              />
              {notarisForm.tanggal && (
                <p className="text-sm text-gray-600 italic">{formatDateIndonesia(notarisForm.tanggal)}</p>
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
          </>
        )}

        {/* ── FORM: PPAT ── */}
        {coverType === 'ppat' && (
          <>
            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Judul Akta</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Contoh: AKTA JUAL BELI"
                value={ppatForm.judulAkta}
                onChange={(e) => handlePpatChange('judulAkta', e.target.value)}
              />
            </section>

            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Nomor Akta</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Contoh: 04"
                value={ppatForm.nomorAkta}
                onChange={(e) => handlePpatChange('nomorAkta', e.target.value)}
              />
            </section>

            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Tahun</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Contoh: 2026"
                value={ppatForm.tahun}
                onChange={(e) => handlePpatChange('tahun', e.target.value)}
              />
            </section>

            <section className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Tanggal</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                value={ppatForm.tanggal}
                onChange={(e) => handlePpatChange('tanggal', e.target.value)}
              />
              {ppatForm.tanggal && (
                <p className="text-sm text-gray-600 italic">{formatDateIndonesia(ppatForm.tanggal)}</p>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── KOLOM KANAN: PREVIEW & TOMBOL ── */}
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

          {/* ── PREVIEW: NOTARIS ── */}
          {coverType === 'notaris' && (
            <A4Container ref={documentRef} className="print-wrapper flex flex-col justify-between font-serif text-black" id="print-target">
              {/* 1. HEADER SK NOTARIS */}
              <div className="mt-4">
                <CoverHeader />
              </div>

              {/* 2. KONTEN UTAMA (CENTERED) */}
              <div className="flex-1 flex flex-col justify-center -mt-20">
                {/* TEKS GROSSE/TURUNAN/SALINAN */}
                <div className="text-center font-serif text-[12pt] mb-10 tracking-wide text-black">
                  <span className={notarisForm.jenisSalinan === 'grosse' ? 'font-bold' : 'line-through font-bold decoration-2 decoration-black'}>
                    Grosse
                  </span>
                  <span className="mx-1">/</span>
                  <span className={notarisForm.jenisSalinan === 'turunan' ? 'font-bold' : 'line-through font-bold decoration-2 decoration-black'}>
                    Turunan
                  </span>
                  <span className="mx-1">/</span>
                  <span className={notarisForm.jenisSalinan === 'salinan' ? 'font-bold' : 'line-through font-bold decoration-2 decoration-black'}>
                    Salinan
                  </span>
                </div>

                {/* INFORMASI AKTA */}
                <div className="w-[80%] mx-auto px-4 text-[12pt] leading-relaxed font-serif text-black">
                  <div className="flex items-start mb-6">
                    <div className="w-[100px] pt-2 font-bold shrink-0">AKTA</div>
                    <div className="w-[20px] text-center pt-2 shrink-0">:</div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div
                        className="uppercase font-bold min-h-[1em] leading-[2em] break-words whitespace-pre-wrap"
                        style={{
                          backgroundImage: 'linear-gradient(to bottom, transparent 97%, black 97%)',
                          backgroundSize: '100% 2em',
                          backgroundPosition: '0 1.7em',
                        }}
                      >
                        {notarisForm.judulAkta || ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start mb-4">
                    <div className="w-[100px] pt-1 font-bold">NOMOR</div>
                    <div className="w-[20px] text-center pt-1">:</div>
                    <div className="flex-1">
                      <div className="border-b-[2px] border-black font-bold h-[1.5em]">
                        {notarisForm.nomorAkta ? `-${notarisForm.nomorAkta}.-` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-[100px] font-bold">TANGGAL</div>
                    <div className="w-[20px] text-center pt-1">:</div>
                    <div className="flex-1">
                      <div className="border-b-[2px] border-black uppercase h-[1.5em]">
                        {formatDateIndonesiaUpper(notarisForm.tanggal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FOOTER */}
              <div className="text-[10pt] text-center font-bold leading-snug pb-8">
                <p>Jl. Jenderal Sudirman, 31 B, Sukamentri, Kecamatan. Garut Kota, Kabupaten Garut-44116</p>
                <p>Call/WhatsApp : 081373337888 Email : hakbar.notpat@gmail.com</p>
              </div>
            </A4Container>
          )}

          {/* ── PREVIEW: PPAT ── */}
          {coverType === 'ppat' && (
            <A4Container ref={documentRef} className="print-wrapper flex flex-col font-serif text-black" id="print-target">

              {/* 1. HEADER PPAT */}
              <div className="mt-6 px-8">
                <PPATCoverHeader />
              </div>

              {/* 2. KONTEN UTAMA - vertically centered in remaining space */}
              <div className="flex-1 flex flex-col items-center justify-center gap-10 mb-[260px]">

                {/* Judul Akta - large bold centered */}
                <div className="text-center mb-10">
                  <p className="text-[22pt] font-bold uppercase">
                    {ppatForm.judulAkta || 'AKTA JUAL BELI'}
                  </p>
                </div>

                {/* Nomor */}
                <div className="text-center">
                  <p className="text-[13pt] font-bold">
                    Nomor : {ppatForm.nomorAkta || '___'} / {ppatForm.tahun || '____'}
                  </p>
                </div>

                {/* Tanggal */}
                <div className="text-center">
                  <p className="text-[13pt] font-bold">
                    Tanggal : {ppatForm.tanggal ? formatDateIndonesia(ppatForm.tanggal) : '___'}
                  </p>
                </div>

              </div>

            </A4Container>
          )}

        </div>
      </div>
    </div>
  );
}
