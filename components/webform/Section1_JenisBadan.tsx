import { useState, useEffect } from 'react';

interface Section1Data {
    jenisBadan?: string;
    namaOpsi1?: string;
    namaOpsi2?: string;
    namaOpsi3?: string;
    nomorTelepon?: string;
    email?: string;
    alamatJalan?: string;
    rtRw?: string;
    desaKelurahan?: string;
    kecamatan?: string;
    kotaKabupaten?: string;
    provinsi?: string;
    kodePos?: string;
}

interface Props {
    data?: Section1Data;
    onChange: (data: Section1Data) => void;
}

export default function Section1_JenisBadan({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section1Data>(data);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleChange = (field: keyof Section1Data, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const jenisBadanOptions = [
        'PT',
        'PT PMA',
        'PT Perorangan',
        'CV',
        'Yayasan',
        'Koperasi',
        'Perkumpulan'
    ];

    return (
        <div className="space-y-6">
            {/* Jenis Badan */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1. Jenis Badan <span className="text-red-500">*</span>
                </label>
                <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.jenisBadan || ''}
                    onChange={(e) => handleChange('jenisBadan', e.target.value)}
                >
                    <option value="">Pilih Jenis Badan</option>
                    {jenisBadanOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            {/* Opsi Nama */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    2. Opsi Nama (minimal 3 kata/suku kata) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Mohon pilih jenis badan dan berikan alternatif nama (minimal 3 kata)</p>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Opsi Nama 1"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.namaOpsi1 || ''}
                        onChange={(e) => handleChange('namaOpsi1', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Opsi Nama 2"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.namaOpsi2 || ''}
                        onChange={(e) => handleChange('namaOpsi2', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Opsi Nama 3"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.namaOpsi3 || ''}
                        onChange={(e) => handleChange('namaOpsi3', e.target.value)}
                    />
                </div>
            </div>

            {/* Nomor Telepon/WA */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    5. Nomor Telepon/WA Badan <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    placeholder="08XXXXXXXXXX"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    value={formData.nomorTelepon || ''}
                    onChange={(e) => handleChange('nomorTelepon', e.target.value)}
                />
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    6. Email Badan <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                />
            </div>

            {/* Alamat Lengkap Kantor */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    7. Alamat Lengkap Kantor <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Jalan/Blok</label>
                        <input
                            type="text"
                            placeholder="Jl. Contoh No. 123"
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={formData.alamatJalan || ''}
                            onChange={(e) => handleChange('alamatJalan', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">RT/RW</label>
                            <input
                                type="text"
                                placeholder="001/002"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={formData.rtRw || ''}
                                onChange={(e) => handleChange('rtRw', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Desa/Kelurahan</label>
                            <input
                                type="text"
                                placeholder="Desa/Kelurahan"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={formData.desaKelurahan || ''}
                                onChange={(e) => handleChange('desaKelurahan', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Kecamatan</label>
                            <input
                                type="text"
                                placeholder="Kecamatan"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={formData.kecamatan || ''}
                                onChange={(e) => handleChange('kecamatan', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Kota/Kabupaten</label>
                            <input
                                type="text"
                                placeholder="Kota/Kabupaten"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={formData.kotaKabupaten || ''}
                                onChange={(e) => handleChange('kotaKabupaten', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Provinsi</label>
                            <input
                                type="text"
                                placeholder="Provinsi"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={formData.provinsi || ''}
                                onChange={(e) => handleChange('provinsi', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Kode Pos</label>
                            <input
                                type="text"
                                placeholder="12345"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={formData.kodePos || ''}
                                onChange={(e) => handleChange('kodePos', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
