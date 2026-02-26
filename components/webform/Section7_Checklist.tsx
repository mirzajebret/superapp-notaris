import { useState, useEffect } from 'react';
import { FileCheck } from 'lucide-react';

interface Section7Data {
    scanKTP?: boolean;
    scanNPWP?: boolean;
    fotoSelfie?: boolean;
    beritaAcara?: boolean;
    dokumenPendukung?: boolean;
}

interface Props {
    data?: Section7Data;
    onChange: (data: Section7Data) => void;
}

export default function Section7_Checklist({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section7Data>(data);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleChange = (field: keyof Section7Data, checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    };

    const checklistItems = [
        {
            field: 'scanKTP' as keyof Section7Data,
            label: 'Scan KTP/Passport (Seluruh Pengurus & Pemegang Saham)',
            required: true
        },
        {
            field: 'scanNPWP' as keyof Section7Data,
            label: 'Scan NPWP Pribadi (Seluruh Pengurus & Pemegang Saham)',
            required: true
        },
        {
            field: 'fotoSelfie' as keyof Section7Data,
            label: 'Foto Selfie dengan KTP (Khusus PT Perorangan)',
            required: false
        },
        {
            field: 'beritaAcara' as keyof Section7Data,
            label: 'Berita Acara Rapat / Daftar Anggota (Khusus Koperasi/Perkumpulan)',
            required: false
        },
        {
            field: 'dokumenPendukung' as keyof Section7Data,
            label: 'Dokumen Pendukung Lainnya',
            required: false
        }
    ];

    const completedCount = checklistItems.filter(item => formData[item.field]).length;

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                    <FileCheck className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-medium text-gray-800">Checklist Dokumen Lampiran</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Pastikan untuk melengkapi dokumen-dokumen berikut sesuai dengan jenis badan yang dipilih.
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progres Kelengkapan</span>
                    <span className="text-sm font-bold text-blue-600">{completedCount} dari {checklistItems.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
                {checklistItems.map((item, index) => (
                    <label
                        key={item.field}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${formData[item.field]
                                ? 'bg-green-50 border-green-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                            checked={formData[item.field] || false}
                            onChange={(e) => handleChange(item.field, e.target.checked)}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{item.label}</span>
                                {item.required && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Wajib</span>
                                )}
                            </div>
                        </div>
                        {formData[item.field] && (
                            <FileCheck className="text-green-600 flex-shrink-0" size={20} />
                        )}
                    </label>
                ))}
            </div>

            {/* Summary */}
            <div className={`p-4 rounded-lg border ${completedCount === checklistItems.length
                    ? 'bg-green-50 border-green-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                <p className="text-sm font-medium text-gray-800">
                    {completedCount === checklistItems.length
                        ? '✓ Semua dokumen telah ditandai sebagai siap'
                        : `⚠ Masih ada ${checklistItems.length - completedCount} dokumen yang belum ditandai`
                    }
                </p>
            </div>
        </div>
    );
}
