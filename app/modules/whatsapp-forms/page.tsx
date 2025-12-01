'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    Search,
    Plus,
    Copy,
    Edit2,
    Trash2,
    X,
    Check,
    Smartphone,
    FileText
} from 'lucide-react';
import { getWaForms, saveWaForm, deleteWaForm } from '@/app/actions';

// --- TYPES ---
interface WaForm {
    id: string;
    title: string;
    category: string;
    content: string;
    lastUpdated: string;
}

export default function WhatsappFormsPage() {
    const [forms, setForms] = useState<WaForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<Partial<WaForm>>({
        title: '',
        category: '',
        content: ''
    });

    // --- DATA LOADING ---
    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getWaForms();
            setForms(data || []);
        } catch (error) {
            console.error("Failed to load forms", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- HANDLERS ---
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000); // Reset icon after 2s
    };

    const handleCreate = () => {
        setEditingForm({ title: '', category: '', content: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (form: WaForm) => {
        setEditingForm({ ...form });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus template formulir ini?')) {
            await deleteWaForm(id);
            loadData();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveWaForm(editingForm);
        setIsModalOpen(false);
        loadData();
    };

    // --- FILTER ---
    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-gray-800">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Smartphone className="text-green-600" /> WhatsApp Forms
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Kumpulan template formulir siap copy-paste untuk klien.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-200"
                >
                    <Plus size={18} /> Buat Template Baru
                </button>
            </div>

            {/* SEARCH */}
            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari formulir..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* GRID CONTENT */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Memuat template...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredForms.map((form) => (
                        <div key={form.id} className="group bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 flex flex-col h-full">

                            {/* Card Header */}
                            <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1" title={form.title}>{form.title}</h3>
                                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                        {form.category || 'Umum'}
                                    </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(form)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(form.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Content Preview */}
                            <div className="p-5 flex-1 relative">
                                <div className="bg-gray-50 rounded-lg p-3 h-40 overflow-hidden relative border border-gray-100">
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                                        {form.content}
                                    </p>
                                    {/* Fade out effect at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-50 to-transparent"></div>
                                </div>
                            </div>

                            {/* Card Footer / Action */}
                            <div className="p-4 pt-0">
                                <button
                                    onClick={() => handleCopy(form.content || '', form.id)}
                                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${copiedId === form.id
                                        ? 'bg-black text-white'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 hover:border-green-300'
                                        }`}
                                >
                                    {copiedId === form.id ? (
                                        <>
                                            <Check size={18} /> Tersalin!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={18} />
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <MessageSquare size={20} /> {editingForm.id ? 'Edit Template' : 'Template Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase tracking-wide">Judul Formulir</label>
                                    <input
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        value={editingForm.title}
                                        onChange={e => setEditingForm({ ...editingForm, title: e.target.value })}
                                        placeholder="Contoh: Form Pendirian PT"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase tracking-wide">Kategori</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        value={editingForm.category}
                                        onChange={e => setEditingForm({ ...editingForm, category: e.target.value })}
                                        placeholder="Contoh: Legalitas / Pertanahan"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Isi Pesan WhatsApp</label>
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Gunakan *Tebal* dan _Miring_ sesuai format WA</span>
                                </div>
                                <textarea
                                    required
                                    className="w-full h-64 border border-gray-300 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none leading-relaxed resize-none"
                                    value={editingForm.content}
                                    onChange={e => setEditingForm({ ...editingForm, content: e.target.value })}
                                    placeholder="Ketik isi formulir di sini..."
                                />
                            </div>
                        </form>

                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-200 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 transition shadow-lg shadow-green-200"
                            >
                                Simpan Template
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}