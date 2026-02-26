import { useState, useEffect } from 'react';

interface ManagementPerson {
    name: string;
    noHP: string;
    email: string;
}

interface Section5Data {
    direkturUtama?: ManagementPerson;
    direktur?: ManagementPerson;
    bendahara?: ManagementPerson;
    komisarisUtama?: ManagementPerson;
    komisaris?: ManagementPerson;
}

interface Props {
    data?: Section5Data;
    onChange: (data: Section5Data) => void;
}

export default function Section5_SusunanPengurus({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section5Data>(data);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleChange = (section: keyof Section5Data, field: keyof ManagementPerson, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [field]: value
            }
        }));
    };

    const renderPersonFields = (
        title: string,
        field: keyof Section5Data,
        required: boolean = false
    ) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">
                {title} {required && <span className="text-red-500">*</span>}
            </h4>
            <div className="space-y-2">
                <input
                    type="text"
                    placeholder="Nama Lengkap"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={formData[field]?.name || ''}
                    onChange={(e) => handleChange(field, 'name', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="tel"
                        placeholder="No. HP"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData[field]?.noHP || ''}
                        onChange={(e) => handleChange(field, 'noHP', e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData[field]?.email || ''}
                        onChange={(e) => handleChange(field, 'email', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="font-medium">Catatan:</span> Isi sesuai kategori jabatan pada badan yang dipilih.
            </p>

            {/* A. DIREKSI / PENGURUS */}
            <div>
                <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b">A. DIREKSI / PENGURUS</h3>
                <div className="space-y-3">
                    {renderPersonFields('1. Direktur Utama / Ketua', 'direkturUtama', true)}
                    {renderPersonFields('2. Direktur / Sekretaris', 'direktur')}
                    {renderPersonFields('3. Bendahara (Jika ada)', 'bendahara')}
                </div>
            </div>

            {/* B. DEWAN KOMISARIS / PENGAWAS / PEMBINA */}
            <div>
                <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b">B. DEWAN KOMISARIS / PENGAWAS / PEMBINA</h3>
                <div className="space-y-3">
                    {renderPersonFields('1. Komisaris Utama / Ketua Pembina', 'komisarisUtama')}
                    {renderPersonFields('2. Komisaris / Anggota', 'komisaris')}
                </div>
            </div>
        </div>
    );
}
