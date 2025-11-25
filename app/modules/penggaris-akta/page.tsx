'use client';

import { useState } from 'react';
import { processGarisAkta } from '@/app/actions';
import { UploadCloud, FileText, ArrowRight, Download, Loader2 } from 'lucide-react';

export default function PenggarisAktaPage() {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState<'salinan' | 'minuta'>('salinan');
    const [loading, setLoading] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!file) return alert("Pilih file PDF dulu!");

        setLoading(true);
        setResultUrl(null); // Reset hasil sebelumnya

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const res = await processGarisAkta(formData);
            if (res.success) {
                setResultUrl(res.fileUrl);
            } else {
                alert("Gagal: " + res.message);
            }
        } catch (e) {
            console.error(e);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto">

                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Penggaris Akta Otomatis</h1>
                    <p className="text-gray-500">Upload PDF Akta, sistem akan otomatis menambahkan garis merah/hitam di margin kiri.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* KIRI: INPUT AREA */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                        <h3 className="font-bold mb-4 text-lg">1. Upload & Setting</h3>

                        {/* File Dropzone */}
                        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition mb-4 ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className={`mb-2 ${file ? 'text-blue-600' : 'text-gray-400'}`} size={32} />
                                <p className="text-sm text-gray-500 font-medium text-center px-4">
                                    {file ? file.name : "Klik untuk upload PDF Akta"}
                                </p>
                            </div>
                            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </label>

                        {/* Tipe Selector */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Garis</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setType('salinan')}
                                    className={`py-3 rounded-lg border font-bold text-sm transition ${type === 'salinan' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span className="block text-lg mb-1">🔴</span>
                                    SALINAN (Merah)
                                </button>
                                <button
                                    onClick={() => setType('minuta')}
                                    className={`py-3 rounded-lg border font-bold text-sm transition ${type === 'minuta' ? 'bg-gray-100 border-black text-black ring-1 ring-black' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span className="block text-lg mb-1">⚫</span>
                                    MINUTA (Hitam)
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleProcess}
                            disabled={loading || !file}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <><Loader2 className="animate-spin" size={20} /> Memproses...</> : 'Buat Garis Akta'}
                        </button>
                    </div>

                    {/* KANAN: RESULT AREA */}
                    <div className="flex flex-col gap-4">
                        <div className={`flex-1 bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center p-8 min-h-[400px] ${resultUrl ? 'bg-white border-solid border-green-500' : ''}`}>

                            {loading && (
                                <div className="text-center">
                                    <Loader2 className="animate-spin w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Sedang membaca PDF & menggambar garis...</p>
                                    <p className="text-xs text-gray-400 mt-2">Python script running in background</p>
                                </div>
                            )}

                            {!loading && !resultUrl && (
                                <div className="text-center text-gray-400">
                                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>Hasil PDF akan muncul di sini</p>
                                </div>
                            )}

                            {!loading && resultUrl && (
                                <div className="text-center w-full h-full flex flex-col">
                                    <div className="flex-1 w-full bg-gray-100 rounded mb-4 overflow-hidden border">
                                        <iframe src={resultUrl} className="w-full h-full" title="Preview PDF"></iframe>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <h3 className="text-green-800 font-bold text-lg mb-1">Selesai!</h3>
                                        <p className="text-green-600 text-sm mb-4">File berhasil digaris.</p>

                                        <a
                                            href={resultUrl}
                                            download
                                            className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                        >
                                            <Download size={20} /> Download Hasil PDF
                                        </a>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}