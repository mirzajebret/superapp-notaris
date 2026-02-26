import { useState, useEffect } from 'react';

interface Section6Data {
    pemilikManfaat1?: string;
    pemilikManfaat2?: string;
}

interface Props {
    data?: Section6Data;
    onChange: (data: Section6Data) => void;
}

export default function Section6_PemilikManfaat({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section6Data>(data);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleChange = (field: keyof Section6Data, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="font-medium">Pemilik Manfaat (Beneficial Owner):</span> Individu yang memiliki kontrol akhir atau menerima manfaat dari badan usaha.
            </p>

            {/* Pemilik Manfaat 1 */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1. Nama Pemilik Manfaat 1 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="Nama lengkap pemilik manfaat 1"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    value={formData.pemilikManfaat1 || ''}
                    onChange={(e) => handleChange('pemilikManfaat1', e.target.value)}
                />
            </div>

            {/* Pemilik Manfaat 2 */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    2. Nama Pemilik Manfaat 2 <span className="text-gray-400">(Opsional)</span>
                </label>
                <input
                    type="text"
                    placeholder="Nama lengkap pemilik manfaat 2"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    value={formData.pemilikManfaat2 || ''}
                    onChange={(e) => handleChange('pemilikManfaat2', e.target.value)}
                />
            </div>
        </div>
    );
}
