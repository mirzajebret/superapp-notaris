import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Shareholder {
    id: string;
    namaLengkap: string;
    status: 'WNI' | 'WNA' | '';
    nik: string;
    npwp: string;
    posisiJabatan: string;
    noHP: string;
    emailAktif: string;
    persentaseSaham: number;
}

interface Section4Data {
    shareholders?: Shareholder[];
}

interface Props {
    data?: Section4Data;
    onChange: (data: Section4Data) => void;
}

export default function Section4_PemegangSaham({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section4Data>({
        shareholders: data.shareholders || [
            { id: '1', namaLengkap: '', status: '', nik: '', npwp: '', posisiJabatan: '', noHP: '', emailAktif: '', persentaseSaham: 0 },
            { id: '2', namaLengkap: '', status: '', nik: '', npwp: '', posisiJabatan: '', noHP: '', emailAktif: '', persentaseSaham: 0 }
        ]
    });

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleAddShareholder = () => {
        const newShareholder: Shareholder = {
            id: Date.now().toString(),
            namaLengkap: '',
            status: '',
            nik: '',
            npwp: '',
            posisiJabatan: '',
            noHP: '',
            emailAktif: '',
            persentaseSaham: 0
        };
        setFormData(prev => ({
            ...prev,
            shareholders: [...(prev.shareholders || []), newShareholder]
        }));
    };

    const handleRemoveShareholder = (id: string) => {
        if ((formData.shareholders?.length || 0) > 2) {
            setFormData(prev => ({
                ...prev,
                shareholders: prev.shareholders?.filter(item => item.id !== id)
            }));
        }
    };

    const handleShareholderChange = (id: string, field: keyof Shareholder, value: any) => {
        setFormData(prev => ({
            ...prev,
            shareholders: prev.shareholders?.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    // Calculate total percentage
    const totalPercentage = (formData.shareholders || []).reduce((sum, sh) => sum + (sh.persentaseSaham || 0), 0);

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <span className="font-medium">Catatan:</span> Minimal 2 orang (Kecuali PT Perorangan). Total saham harus 100% dari Modal Disetor.
            </p>

            {/* Shareholders List */}
            <div className="space-y-4">
                {formData.shareholders?.map((shareholder, index) => (
                    <div key={shareholder.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-700">Person / Badan Hukum {index + 1}</h4>
                            {(formData.shareholders?.length || 0) > 2 && (
                                <button
                                    onClick={() => handleRemoveShareholder(shareholder.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                    title="Hapus"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    placeholder="Nama lengkap pemegang saham"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    value={shareholder.namaLengkap}
                                    onChange={(e) => handleShareholderChange(shareholder.id, 'namaLengkap', e.target.value)}
                                />
                            </div>

                            {/* Status & No HP */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Status</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`status-${shareholder.id}`}
                                                value="WNI"
                                                checked={shareholder.status === 'WNI'}
                                                onChange={(e) => handleShareholderChange(shareholder.id, 'status', e.target.value as 'WNI' | 'WNA')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm">WNI</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`status-${shareholder.id}`}
                                                value="WNA"
                                                checked={shareholder.status === 'WNA'}
                                                onChange={(e) => handleShareholderChange(shareholder.id, 'status', e.target.value as 'WNI' | 'WNA')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm">WNA</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">No. HP</label>
                                    <input
                                        type="tel"
                                        placeholder="08XXXXXXXXXX"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={shareholder.noHP}
                                        onChange={(e) => handleShareholderChange(shareholder.id, 'noHP', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* NIK & NPWP */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">NIK</label>
                                    <input
                                        type="text"
                                        placeholder="16 digit NIK"
                                        maxLength={16}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={shareholder.nik}
                                        onChange={(e) => handleShareholderChange(shareholder.id, 'nik', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">NPWP</label>
                                    <input
                                        type="text"
                                        placeholder="15 digit NPWP"
                                        maxLength={15}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={shareholder.npwp}
                                        onChange={(e) => handleShareholderChange(shareholder.id, 'npwp', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Posisi/Jabatan & Email */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Posisi/Jabatan</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Direktur Utama, Komisaris"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={shareholder.posisiJabatan}
                                        onChange={(e) => handleShareholderChange(shareholder.id, 'posisiJabatan', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Email Aktif</label>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={shareholder.emailAktif}
                                        onChange={(e) => handleShareholderChange(shareholder.id, 'emailAktif', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Persentase Saham */}
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Persentase Saham</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        className="w-full border border-gray-300 rounded-lg p-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={shareholder.persentaseSaham || ''}
                                        onChange={(e) => handleShareholderChange(shareholder.id, 'persentaseSaham', Number(e.target.value))}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button
                onClick={handleAddShareholder}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition"
            >
                <Plus size={16} />
                Tambah Pemegang Saham/Pendiri
            </button>

            {/* Total Percentage */}
            <div className={`p-4 rounded-lg border ${totalPercentage === 100 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Total Persentase Saham:</span>
                    <span className={`text-lg font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalPercentage}%
                    </span>
                </div>
                {totalPercentage !== 100 && (
                    <p className="text-xs text-red-600 mt-1">Total harus 100%!</p>
                )}
            </div>
        </div>
    );
}
