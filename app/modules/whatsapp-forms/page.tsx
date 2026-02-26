'use client';

import { useState, useEffect } from 'react';
import {
    getWaForms,
    saveWaForm,
    deleteWaForm,
    getWaFolders,
    saveWaFolder,
    deleteWaFolder
} from '@/app/actions';
import {
    Folder,
    Plus,
    Trash2,
    Edit3,
    MessageCircle,
    Search,
    MoreVertical,
    FolderOpen,
    Copy,
    Send
} from 'lucide-react';

interface WaFolder {
    id: string;
    name: string;
    isSystem?: boolean;
}

interface WaForm {
    id: string;
    title: string;
    message: string;
    phone?: string;
    folderId: string;
    lastUpdated: string;
}

export default function WhatsappFormsPage() {
    const [folders, setFolders] = useState<WaFolder[]>([]);
    const [forms, setForms] = useState<WaForm[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('all'); // 'all', 'uncategorized', or custom ID
    const [loading, setLoading] = useState(true);

    // States untuk Modal/Form
    const [isEditingFolder, setIsEditingFolder] = useState<WaFolder | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolderModal, setShowFolderModal] = useState(false);

    const [isEditingForm, setIsEditingForm] = useState<WaForm | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formFolderId, setFormFolderId] = useState('uncategorized');
    const [showFormModal, setShowFormModal] = useState(false);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const [foldersData, formsData] = await Promise.all([
                getWaFolders(),
                getWaForms()
            ]);
            setFolders(foldersData);
            setForms(formsData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- FOLDER HANDLERS ---
    const handleSaveFolder = async () => {
        if (!newFolderName.trim()) return;

        const payload = isEditingFolder
            ? { id: isEditingFolder.id, name: newFolderName }
            : { name: newFolderName };

        await saveWaFolder(payload);
        await loadData();
        setShowFolderModal(false);
        setNewFolderName('');
        setIsEditingFolder(null);
    };

    const handleDeleteFolder = async (id: string) => {
        if (confirm("Hapus folder ini? Form di dalamnya akan dipindah ke 'Tanpa Kategori'.")) {
            await deleteWaFolder(id);
            if (selectedFolderId === id) setSelectedFolderId('all');
            loadData();
        }
    };

    const openFolderModal = (folder?: WaFolder) => {
        if (folder) {
            setIsEditingFolder(folder);
            setNewFolderName(folder.name);
        } else {
            setIsEditingFolder(null);
            setNewFolderName('');
        }
        setShowFolderModal(true);
    };

    // --- FORM HANDLERS ---
    const handleSaveForm = async () => {
        if (!formTitle.trim()) return alert("Judul wajib diisi");

        const payload = {
            id: isEditingForm?.id,
            title: formTitle,
            message: formMessage,
            folderId: formFolderId
        };

        await saveWaForm(payload);
        await loadData();
        setShowFormModal(false);
        resetFormInput();
    };

    const handleDeleteForm = async (id: string) => {
        if (confirm("Hapus form ini?")) {
            await deleteWaForm(id);
            loadData();
        }
    };

    const openFormModal = (form?: WaForm) => {
        if (form) {
            setIsEditingForm(form);
            setFormTitle(form.title);
            setFormMessage(form.message);
            setFormFolderId(form.folderId || 'uncategorized');
        } else {
            resetFormInput();
            // Auto select folder jika sedang membuka folder tertentu (kecuali 'all')
            if (selectedFolderId !== 'all') setFormFolderId(selectedFolderId);
        }
        setShowFormModal(true);
    };

    const resetFormInput = () => {
        setIsEditingForm(null);
        setFormTitle('');
        setFormMessage('');
        setFormFolderId('uncategorized');
    };

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-secure contexts or older browsers
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "absolute";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                    throw new Error("Gagal menyalin via fallback");
                } finally {
                    textArea.remove();
                }
            }
            alert('Pesan berhasil disalin!');
        } catch (err) {
            console.error('Copy failed', err);
            alert('Gagal menyalin pesan. Silakan coba manual.');
        }
    };

    // --- FILTERING ---
    const filteredForms = forms.filter(f => {
        if (selectedFolderId === 'all') return true;
        return f.folderId === selectedFolderId || (!f.folderId && selectedFolderId === 'uncategorized');
    });

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">

            {/* --- SIDEBAR FOLDERS --- */}
            <div className="w-64 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <MessageCircle className="text-green-600" /> WhatsApp Form
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <button
                        onClick={() => setSelectedFolderId('all')}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition ${selectedFolderId === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                        <FolderOpen size={16} /> Semua Form
                    </button>

                    {folders.map(folder => (
                        <div key={folder.id} className="group flex items-center justify-between pr-2 rounded-md hover:bg-gray-100 transition">
                            <button
                                onClick={() => setSelectedFolderId(folder.id)}
                                className={`flex-1 text-left px-3 py-2 flex items-center gap-2 text-sm font-medium ${selectedFolderId === folder.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}
                            >
                                <Folder size={16} className={selectedFolderId === folder.id ? 'fill-blue-200' : ''} />
                                <span className="truncate">{folder.name}</span>
                            </button>

                            {!folder.isSystem && (
                                <div className="hidden group-hover:flex gap-1">
                                    <button onClick={() => openFolderModal(folder)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 size={12} /></button>
                                    <button onClick={() => handleDeleteFolder(folder.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t">
                    <button
                        onClick={() => openFolderModal()}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 p-2 rounded-md text-sm text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition"
                    >
                        <Plus size={16} /> Folder Baru
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header Content */}
                <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {selectedFolderId === 'all' ? 'Semua Form' : folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
                        </h1>
                        <p className="text-sm text-gray-500">{filteredForms.length} template tersedia</p>
                    </div>
                    <button
                        onClick={() => openFormModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
                    >
                        <Plus size={18} /> Buat Form Baru
                    </button>
                </div>

                {/* Forms Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Memuat data...</div>
                    ) : filteredForms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <FolderOpen size={48} className="mb-2 opacity-20" />
                            <p>Belum ada form di folder ini</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredForms.map(form => (
                                <div key={form.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                                <MessageCircle size={20} />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => openFormModal(form)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"><Edit3 size={14} /></button>
                                                <button onClick={() => handleDeleteForm(form.id)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{form.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 p-2 rounded border border-gray-100 mb-3 font-mono">
                                            {form.message}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t mt-2">
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                            {folders.find(f => f.id === form.folderId)?.name || 'Tanpa Kategori'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(form.message)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                title="Copy message"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const url = `https://wa.me/?text=${encodeURIComponent(form.message)}`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                                title="Send via WhatsApp"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL FOLDER --- */}
            {
                showFolderModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                            <h3 className="font-bold text-lg mb-4">{isEditingFolder ? 'Edit Folder' : 'Folder Baru'}</h3>
                            <input
                                className="w-full border p-2 rounded-lg mb-4 text-sm"
                                placeholder="Nama Folder..."
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Batal</button>
                                <button onClick={handleSaveFolder} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Simpan</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- MODAL FORM --- */}
            {
                showFormModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
                            <h3 className="font-bold text-lg mb-4">{isEditingForm ? 'Edit Form' : 'Buat Form Baru'}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">JUDUL FORM</label>
                                    <input
                                        className="w-full border p-2 rounded-lg text-sm"
                                        placeholder="Contoh: Follow Up Klien..."
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">KATEGORI FOLDER</label>
                                    <select
                                        className="w-full border p-2 rounded-lg text-sm bg-white"
                                        value={formFolderId}
                                        onChange={e => setFormFolderId(e.target.value)}
                                    >
                                        {folders.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">PESAN WHATSAPP</label>
                                    <textarea
                                        className="w-full border p-2 rounded-lg text-sm h-32 font-mono"
                                        placeholder="Halo, ini adalah pesan otomatis..."
                                        value={formMessage}
                                        onChange={e => setFormMessage(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">*Tips: Gunakan %0a untuk baris baru jika diperlukan secara manual.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setShowFormModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Batal</button>
                                <button onClick={handleSaveForm} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Simpan Form</button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}