import { useState, useEffect } from 'react';

interface Section2Data {
    modalDasar?: number;
    modalDisetor?: number;
    hargaPerLembar?: number;
}

interface Props {
    data?: Section2Data;
    onChange: (data: Section2Data) => void;
}

export default function Section2_StrukturModal({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section2Data>(data);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleChange = (field: keyof Section2Data, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID').format(value);
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="font-medium">Catatan:</span> Sesuai ketentuan masing-masing badan usaha/hukum.
            </p>

            {/* Harga per Lembar Saham */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1. Harga per Lembar Saham <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.hargaPerLembar || ''}
                        onChange={(e) => handleChange('hargaPerLembar', Number(e.target.value))}
                    />
                </div>
                {formData.hargaPerLembar && formData.hargaPerLembar > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(formData.hargaPerLembar)} Rupiah per lembar
                    </p>
                )}
            </div>

            {/* Modal Dasar */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    2. Modal Dasar / Kekayaan Awal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.modalDasar || ''}
                        onChange={(e) => handleChange('modalDasar', Number(e.target.value))}
                    />
                </div>
                {formData.modalDasar && formData.modalDasar > 0 && (
                    <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">
                            {formatCurrency(formData.modalDasar)} Rupiah
                        </p>
                        {formData.hargaPerLembar && formData.hargaPerLembar > 0 && (
                            <p className="text-xs text-blue-600">
                                ({formatCurrency(Math.floor(formData.modalDasar / formData.hargaPerLembar))} lembar saham)
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Disetor */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    3. Modal Disetor / Ditempatkan <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    (Minimal 25% dari Modal Dasar. Khusus PT PMA &gt; Rp 10 Miliar)
                </p>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-blue-500"
                        value={formData.modalDisetor || ''}
                        onChange={(e) => handleChange('modalDisetor', Number(e.target.value))}
                    />
                </div>
                {formData.modalDisetor && formData.modalDisetor > 0 && (
                    <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">
                            {formatCurrency(formData.modalDisetor)} Rupiah
                        </p>
                        {formData.hargaPerLembar && formData.hargaPerLembar > 0 && (
                            <p className="text-xs text-blue-600">
                                ({formatCurrency(Math.floor(formData.modalDisetor / formData.hargaPerLembar))} lembar saham)
                            </p>
                        )}
                        {formData.modalDasar && (
                            <p className="text-xs text-blue-600">
                                {((formData.modalDisetor / formData.modalDasar) * 100).toFixed(2)}% dari Modal Dasar
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
