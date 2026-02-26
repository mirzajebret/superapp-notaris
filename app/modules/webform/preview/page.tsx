'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getWebFormById } from '@/app/actions';
import { ArrowLeft, Printer } from 'lucide-react';

function WebFormPreviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const formId = searchParams.get('id');

    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (formId) {
            loadForm(formId);
        }
    }, [formId]);

    const loadForm = async (id: string) => {
        setLoading(true);
        try {
            const form = await getWebFormById(id);
            setFormData(form);
        } catch (error) {
            console.error('Failed to load form', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        document.title = `Formulir ${formData?.entityName || 'Pendirian Badan'} - ${new Date().toLocaleDateString('id-ID')}`;
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Memuat formulir...</div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Formulir tidak ditemukan</div>
            </div>
        );
    }

    const { section1, section2, section3, section4, section5, section6, section7 } = formData.formData || {};

    return (
        <div className="min-h-screen bg-gray-50">
            <style jsx global>{`
        @media print {
          @page { 
            margin: 0mm; 
            size: A4 portrait;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          #print-content {
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>

            {/* Header - No Print */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10 no-print">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/modules/webform')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Preview Formulir</h1>
                                <p className="text-sm text-gray-500">{formData.entityName || 'Formulir Pendirian Badan'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Printer size={18} />
                            Print / PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Print Content */}
            <div className="max-w-5xl mx-auto ">
                <div id="print-content" className="bg-white p-8 rounded-lg shadow-lg">

                    {/* Header */}
                    <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
                        <h1 className="text-2xl font-bold uppercase mb-2">FORMULIR PENDAFTARAN PENDIRIAN BADAN</h1>
                        <p className="text-sm text-gray-600">PT / PT PMA / PT Perorangan / CV / Yayasan / Koperasi / Perkumpulan</p>
                    </div>

                    {/* Section I: Jenis Badan & Identitas Utama */}
                    <div className="mb-5">
                        <div className="bg-gray-800 text-white px-4 py-2 font-bold text-sm mb-3">
                            I. JENIS BADAN & IDENTITAS UTAMA
                        </div>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1 font-semibold w-1/3">1. Jenis Badan:</td>
                                    <td className="py-1">{section1?.jenisBadan || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">2. Opsi Nama 1:</td>
                                    <td className="py-1">{section1?.namaOpsi1 || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">3. Opsi Nama 2:</td>
                                    <td className="py-1">{section1?.namaOpsi2 || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">4. Opsi Nama 3:</td>
                                    <td className="py-1">{section1?.namaOpsi3 || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">5. Nomor Telepon Badan:</td>
                                    <td className="py-1">{section1?.nomorTelepon || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">6. Email Badan:</td>
                                    <td className="py-1">{section1?.email || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold align-top">7. Alamat Lengkap:</td>
                                    <td className="py-1">
                                        {section1?.alamatJalan}, RT/RW {section1?.rtRw}, {section1?.desaKelurahan}, Kec. {section1?.kecamatan}, {section1?.kotaKabupaten}, {section1?.provinsi} {section1?.kodePos}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section II: Struktur Modal */}
                    <div className="mb-5">
                        <div className="bg-gray-800 text-white px-4 py-2 font-bold text-sm mb-3">
                            II. STRUKTUR MODAL / KEKAYAAN AWAL
                        </div>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1 font-semibold w-1/2">1. Harga per Lembar Saham:</td>
                                    <td className="py-1">Rp {(section2?.hargaPerLembar || 0).toLocaleString('id-ID')},-</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">2. Modal Dasar / Kekayaan Awal:</td>
                                    <td className="py-1">
                                        Rp {(section2?.modalDasar || 0).toLocaleString('id-ID')},-
                                        {section2?.hargaPerLembar && section2.hargaPerLembar > 0 && (
                                            <span className="text-blue-600 ml-2">({Math.floor((section2.modalDasar || 0) / section2.hargaPerLembar).toLocaleString('id-ID')} lembar)</span>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">3. Modal Disetor / Ditempatkan:</td>
                                    <td className="py-1">
                                        Rp {(section2?.modalDisetor || 0).toLocaleString('id-ID')},-
                                        {section2?.hargaPerLembar && section2.hargaPerLembar > 0 && (
                                            <span className="text-blue-600 ml-2">({Math.floor((section2.modalDisetor || 0) / section2.hargaPerLembar).toLocaleString('id-ID')} lembar)</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section III: Bidang Usaha */}
                    <div className="mb-5">
                        <div className="bg-gray-800 text-white px-4 py-2 font-bold text-sm mb-3">
                            III. BIDANG USAHA & TUJUAN (KBLI)
                        </div>
                        <div className="text-sm">
                            {section3?.kbliList && section3.kbliList.length > 0 ? (
                                <table className="w-full">
                                    <tbody>
                                        {section3.kbliList.map((kbli: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="py-1 w-16">KBLI:</td>
                                                <td className="py-1 w-24 font-mono">{kbli.code}</td>
                                                <td className="py-1">{kbli.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-gray-500 py-1">-</div>
                            )}
                            {section3?.tujuan && section3.tujuan.length > 0 && (
                                <div className="mt-2">
                                    <span className="font-semibold">Tujuan: </span>
                                    {section3.tujuan.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section IV: Pemegang Saham - MERGED WITH PENGURUS */}
                    <div className="mb-5">
                        <div className="bg-gray-800 text-white px-4 py-2 font-bold text-sm mb-3">
                            IV. DATA PEMEGANG SAHAM / PENDIRI / PENGURUS
                        </div>
                        <div className="text-sm space-y-3">
                            {section4?.shareholders && section4.shareholders.length > 0 ? (
                                section4.shareholders.map((sh: any, idx: number) => {
                                    const hargaPerLembar = section2?.hargaPerLembar || 0;
                                    const modalDisetor = section2?.modalDisetor || 0;
                                    const jumlahLembar = hargaPerLembar > 0 && modalDisetor > 0
                                        ? Math.floor((modalDisetor * (sh.persentaseSaham || 0)) / 100 / hargaPerLembar)
                                        : 0;
                                    const nilaiSaham = jumlahLembar * hargaPerLembar;

                                    return (
                                        <div key={idx} className="border border-gray-300 p-3 rounded">
                                            <div className="font-semibold mb-2">Person/Badan Hukum {idx + 1}</div>
                                            <table className="w-full">
                                                <tbody>
                                                    <tr>
                                                        <td className="py-0.5 w-1/3">Nama:</td>
                                                        <td className="py-0.5">{sh.namaLengkap || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">Status:</td>
                                                        <td className="py-0.5">{sh.status || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">NIK:</td>
                                                        <td className="py-0.5">{sh.nik || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">NPWP:</td>
                                                        <td className="py-0.5">{sh.npwp || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">Posisi/Jabatan:</td>
                                                        <td className="py-0.5">{sh.posisiJabatan || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">No. HP:</td>
                                                        <td className="py-0.5">{sh.noHP || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">Email Aktif:</td>
                                                        <td className="py-0.5">{sh.emailAktif || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-0.5">Persentase Saham:</td>
                                                        <td className="py-0.5">
                                                            {sh.persentaseSaham || 0}%
                                                            {jumlahLembar > 0 && (
                                                                <span className="text-blue-600 ml-2">
                                                                    Sejumlah {jumlahLembar.toLocaleString('id-ID')} lembar saham (Rp {nilaiSaham.toLocaleString('id-ID')},-)
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-gray-500">-</div>
                            )}
                        </div>
                    </div>

                    {/* Section V: Pemilik Manfaat */}
                    <div className="mb-5">
                        <div className="bg-gray-800 text-white px-4 py-2 font-bold text-sm mb-3">
                            V. PEMILIK MANFAAT (BENEFICIAL OWNER)
                        </div>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1 font-semibold w-1/3">1. Pemilik Manfaat 1:</td>
                                    <td className="py-1">{section6?.pemilikManfaat1 || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold">2. Pemilik Manfaat 2:</td>
                                    <td className="py-1">{section6?.pemilikManfaat2 || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section VI: Checklist */}
                    <div className="mb-5">
                        <div className="bg-gray-800 text-white px-4 py-2 font-bold text-sm mb-3">
                            VI. CHECKLIST DOKUMEN LAMPIRAN
                        </div>
                        <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border border-gray-800 flex items-center justify-center text-xs">
                                    {section7?.scanKTP && '✓'}
                                </span>
                                <span>Scan KTP/Passport (Seluruh Pengurus & Pemegang Saham)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border border-gray-800 flex items-center justify-center text-xs">
                                    {section7?.scanNPWP && '✓'}
                                </span>
                                <span>Scan NPWP Pribadi (Seluruh Pengurus & Pemegang Saham)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border border-gray-800 flex items-center justify-center text-xs">
                                    {section7?.fotoSelfie && '✓'}
                                </span>
                                <span>Foto Selfie dengan KTP (Khusus PT Perorangan)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border border-gray-800 flex items-center justify-center text-xs">
                                    {section7?.beritaAcara && '✓'}
                                </span>
                                <span>Berita Acara Rapat / Daftar Anggota (Khusus Koperasi/Perkumpulan)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border border-gray-800 flex items-center justify-center text-xs">
                                    {section7?.dokumenPendukung && '✓'}
                                </span>
                                <span>Dokumen Pendukung Lainnya</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-3 border-t border-gray-300 text-xs text-gray-500 text-center">
                        Dicetak pada: {new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function WebFormPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <WebFormPreviewContent />
        </Suspense>
    );
}
