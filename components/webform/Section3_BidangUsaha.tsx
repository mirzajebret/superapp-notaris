import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface KBLIItem {
    id: string;
    code: string;
    description: string;
}

interface Section3Data {
    kbliList?: KBLIItem[];
    tujuan?: string[];
}

interface Props {
    data?: Section3Data;
    onChange: (data: Section3Data) => void;
}

export default function Section3_BidangUsaha({ data = {}, onChange }: Props) {
    const [formData, setFormData] = useState<Section3Data>({
        kbliList: data.kbliList || [{ id: '1', code: '', description: '' }],
        tujuan: data.tujuan || []
    });

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleAddKBLI = () => {
        const newKBLI = {
            id: Date.now().toString(),
            code: '',
            description: ''
        };
        setFormData(prev => ({
            ...prev,
            kbliList: [...(prev.kbliList || []), newKBLI]
        }));
    };

    const handleRemoveKBLI = (id: string) => {
        if ((formData.kbliList?.length || 0) > 1) {
            setFormData(prev => ({
                ...prev,
                kbliList: prev.kbliList?.filter(item => item.id !== id)
            }));
        }
    };

    const handleKBLIChange = (id: string, field: 'code' | 'description', value: string) => {
        setFormData(prev => ({
            ...prev,
            kbliList: prev.kbliList?.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleTujuanChange = (value: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            tujuan: checked
                ? [...(prev.tujuan || []), value]
                : (prev.tujuan || []).filter(t => t !== value)
        }));
    };

    return (
        <div className="space-y-6">
            {/* KBLI Section */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tuliskan kode KBLI 5 digit atau uraian kegiatan usaha <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                    (Referensi: <a href="https://oss.go.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">oss.go.id</a>)
                </p>

                <div className="space-y-3">
                    {formData.kbliList?.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex-1 grid grid-cols-12 gap-2">
                                <div className="col-span-3">
                                    <input
                                        type="text"
                                        placeholder="KBLI (5 digit)"
                                        maxLength={5}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={item.code}
                                        onChange={(e) => handleKBLIChange(item.id, 'code', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-9">
                                    <input
                                        type="text"
                                        placeholder="Deskripsi kegiatan usaha"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        value={item.description}
                                        onChange={(e) => handleKBLIChange(item.id, 'description', e.target.value)}
                                    />
                                </div>
                            </div>
                            {(formData.kbliList?.length || 0) > 1 && (
                                <button
                                    onClick={() => handleRemoveKBLI(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                    title="Hapus"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleAddKBLI}
                    className="mt-3 flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition"
                >
                    <Plus size={16} />
                    Tambah KBLI
                </button>
            </div>

            {/* Tujuan (untuk Yayasan/Perkumpulan) */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    6. Tujuan (Yayasan/Perkumpulan)
                </label>
                <div className="space-y-2">
                    {['Sosial', 'Kemanusiaan', 'Keagamaan'].map(tujuan => (
                        <label key={tujuan} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                checked={(formData.tujuan || []).includes(tujuan)}
                                onChange={(e) => handleTujuanChange(tujuan, e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">{tujuan}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
