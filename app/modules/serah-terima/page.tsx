'use client';

import { useRef, useState } from 'react';
import A4Container from '@/components/documents/A4Container';
import KopSurat from '@/components/documents/KopSurat';
import { saveSerahTerima } from '@/app/actions';

type DocumentTypeKey = 'dokumen' | 'surat' | 'barang';

interface TransferItem {
  description: string;
  note: string;
  noteType: 'Fotokopi' | 'Asli' | 'Custom';
}

interface PartyInfo {
  name: string;
  position: string;
}

interface SerahTerimaForm {
  documentTypes: Record<DocumentTypeKey, boolean>;
  receiver: PartyInfo;
  deliverer: PartyInfo;
  location: string;
  handoverDate: string;
  items: TransferItem[];
}

const DEFAULT_ITEMS: TransferItem[] = [
  { description: 'Akta Pendirian Perusahaan', note: '', noteType: 'Fotokopi' },
  { description: 'Berita Acara RUPS', note: '', noteType: 'Asli' },
];

export default function SerahTerimaModulePage() {
  const documentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [formData, setFormData] = useState<SerahTerimaForm>({
    documentTypes: {
      dokumen: true,
      surat: false,
      barang: false,
    },
    receiver: {
      name: 'Mirza Alby Assidiqie',
      position: 'Staff Administrasi',
    },
    deliverer: {
      name: 'Nepi Meinti',
      position: 'Client',
    },
    location: 'Garut',
    handoverDate: new Date().toISOString().split('T')[0],
    items: DEFAULT_ITEMS,
  });

  const toggleDocumentType = (key: DocumentTypeKey) => {
    setFormData((prev) => ({
      ...prev,
      documentTypes: { ...prev.documentTypes, [key]: !prev.documentTypes[key] },
    }));
  };

  const handlePartyChange = (role: 'receiver' | 'deliverer', field: keyof PartyInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }));
  };

  const handleItemChange = (index: number, field: keyof TransferItem, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value } as TransferItem;
      return { ...prev, items: updated };
    });
  };

  const handleItemTypeChange = (index: number, noteType: TransferItem['noteType']) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        noteType,
        note: noteType === 'Custom' ? updated[index].note : '',
      };
      return { ...prev, items: updated };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', note: '', noteType: 'Fotokopi' }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => {
      if (prev.items.length === 1) return prev;
      return { ...prev, items: prev.items.filter((_, idx) => idx !== index) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSerahTerima(formData);
      alert('Data serah terima tersimpan.');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data serah terima.');
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
        filename: `Serah-Terima-${formData.receiver.name.replace(/[^a-zA-Z0-9]/g, '-') || 'Draft'}.pdf`,
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

  const getFormattedDate = () => {
    if (!formData.handoverDate) return '';
    return new Date(formData.handoverDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderNoteValue = (item: TransferItem) => {
    if (item.noteType === 'Custom') {
      return item.note || '-';
    }
    return item.noteType;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex gap-8 font-sans text-gray-800 print:p-0 print:bg-white">

      <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm h-fit border border-gray-200 overflow-y-auto max-h-screen no-print space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Edit Data Serah Terima</h2>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Jenis Serah Terima</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'dokumen', label: 'Dokumen' },
              { key: 'surat', label: 'Surat' },
              { key: 'barang', label: 'Barang' },
            ] as const).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-400"
              >
                <input
                  type="checkbox"
                  checked={formData.documentTypes[key]}
                  onChange={() => toggleDocumentType(key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Yang Menerima</h3>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Nama lengkap"
            value={formData.receiver.name}
            onChange={(e) => handlePartyChange('receiver', 'name', e.target.value)}
          />
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Jabatan"
            value={formData.receiver.position}
            onChange={(e) => handlePartyChange('receiver', 'position', e.target.value)}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Yang Menyerahkan</h3>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Nama lengkap"
            value={formData.deliverer.name}
            onChange={(e) => handlePartyChange('deliverer', 'name', e.target.value)}
          />
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Jabatan / Status (Staff / Client)"
            value={formData.deliverer.position}
            onChange={(e) => handlePartyChange('deliverer', 'position', e.target.value)}
          />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Lokasi</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase">Tanggal</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={formData.handoverDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, handoverDate: e.target.value }))}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">List Item</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              + Tambah Baris
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="relative border border-gray-200 rounded-xl p-3 space-y-3 bg-gray-50">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Deskripsi item"
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="border border-gray-300 rounded-lg p-2 text-sm"
                  value={item.noteType}
                  onChange={(e) => handleItemTypeChange(index, e.target.value as TransferItem['noteType'])}
                >
                  <option value="Fotokopi">Fotokopi</option>
                  <option value="Asli">Asli</option>
                  <option value="Custom">Custom</option>
                </select>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg p-2 text-sm"
                  placeholder="Keterangan khusus"
                  value={item.note}
                  onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                  disabled={item.noteType !== 'Custom'}
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

      <div className="flex-1 flex flex-col items-center h-screen print:h-auto print:block">
        <div className="w-[210mm] mb-4 flex justify-between items-center no-print">
          <div className="text-sm text-gray-500 italic">Preview Dokumen A4</div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
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

        <div className="flex-1 w-full overflow-auto flex justify-center print:overflow-visible print:block print:w-full">
          <A4Container ref={documentRef} className="print-wrapper" id="print-target">
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
                    {formData.documentTypes[key] ? '✓' : ''}
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
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-2 text-center align-top">{index + 1}</td>
                    <td className="border border-black p-2 align-top whitespace-pre-line">{item.description || '-'}</td>
                    <td className="border border-black p-2 align-top text-center">{renderNoteValue(item)}</td>
                  </tr>
                ))}
                {formData.items.length === 0 && (
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
              <div className="w-1/2 text-center">
                <p className="font-medium mb-16">Yang Menerima</p>
                <p className="font-bold underline decoration-1 underline-offset-4">{formData.receiver.name || '................'}</p>
                <p className="text-[10pt]">{formData.receiver.position || '-'}</p>
              </div>
              <div className="w-1/2 text-center">
                <p className="font-medium mb-16">Yang Menyerahkan</p>
                <p className="font-bold underline decoration-1 underline-offset-4">{formData.deliverer.name || '................'}</p>
                <p className="text-[10pt]">{formData.deliverer.position || '-'}</p>
              </div>
            </div>
          </A4Container>
        </div>
      </div>
    </div>
  );
}

