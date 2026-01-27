'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getLegalEntities, saveLegalEntity, deleteLegalEntity, uploadLegalFile, LegalEntity, LegalItem } from './actions';
import {
    Building2, Calendar, FileText, Plus, Search, Trash2,
    UploadCloud, X, FileCheck, Paperclip,
    StickyNote, Loader2, FileType,
    Users, Briefcase, Landmark, FolderOpen, Archive,
    ScrollText, RefreshCw
} from 'lucide-react';

// --- TYPE & CONFIG ---
type Category = 'CLIENT' | 'NOTARIS' | 'INSTANSI' | 'OTHER';
type DocMode = 'LEGALITAS' | 'PPAT';

const CATEGORIES: { id: Category; label: string; icon: any; color: string; desc: string }[] = [
    {
        id: 'CLIENT',
        label: 'TAB 1',
        icon: FolderOpen,
        color: 'text-blue-600 border-blue-600 bg-blue-50',
        desc: ' '
    },
    {
        id: 'NOTARIS',
        label: 'TAB 2',
        icon: FolderOpen,
        color: 'text-emerald-600 border-emerald-600 bg-emerald-50',
        desc: ' '
    },
    {
        id: 'INSTANSI',
        label: 'TAB 3',
        icon: FolderOpen,
        color: 'text-purple-600 border-purple-600 bg-purple-50',
        desc: ' '
    },
    {
        id: 'OTHER',
        label: 'TAB 4',
        icon: FolderOpen,
        color: 'text-orange-600 border-orange-600 bg-orange-50',
        desc: ' '
    },
];

// --- KOMPONEN KOLOM DOKUMEN ---
interface DocColumnProps {
    title: string;
    items: LegalItem[];
    onUpdate: (newItems: LegalItem[]) => void;
    entityId: string;
    colorTheme: 'blue' | 'teal' | 'purple' | 'orange';
}

const DocColumn = ({ title, items, onUpdate, entityId, colorTheme }: DocColumnProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themeClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', header: 'bg-blue-100 text-blue-700', ring: 'ring-blue-400' },
        teal: { bg: 'bg-teal-50', border: 'border-teal-100', header: 'bg-teal-100 text-teal-700', ring: 'ring-teal-400' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', header: 'bg-purple-100 text-purple-700', ring: 'ring-purple-400' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-100', header: 'bg-orange-100 text-orange-700', ring: 'ring-orange-400' },
    }[colorTheme];

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        const newItems = [...items];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('entityId', entityId);

            const res = await uploadLegalFile(formData);
            if (res.success && res.item) {
                newItems.push(res.item);
            }
        }

        onUpdate(newItems);
        setUploading(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addNote = () => {
        if (!noteInput.trim()) return;
        const newItem: LegalItem = {
            id: Date.now().toString(),
            type: 'note',
            content: noteInput,
            createdAt: new Date().toISOString()
        };
        onUpdate([...items, newItem]);
        setNoteInput('');
        setShowNoteInput(false);
    };

    const removeItem = (id: string) => {
        if (confirm('Hapus item ini?')) {
            onUpdate(items.filter(item => item.id !== id));
        }
    };

    return (
        <div
            className={`flex-1 min-w-[280px] flex flex-col rounded-xl border transition-all duration-200 h-full
        ${themeClasses.bg} ${themeClasses.border}
        ${isDragging ? `ring-2 ${themeClasses.ring} scale-[1.02] shadow-lg` : 'hover:shadow-md'}
      `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
        >
            <div className={`px-4 py-3 border-b ${themeClasses.border} flex justify-between items-center rounded-t-xl ${themeClasses.header} bg-opacity-60 backdrop-blur-sm`}>
                <h4 className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                    {title}
                    <span className="bg-white/80 text-[10px] px-2 py-0.5 rounded-full font-bold text-gray-700 shadow-sm">
                        {items.length}
                    </span>
                </h4>
                <div className="flex gap-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white/50 rounded-md transition-colors" title="Upload File"><Paperclip size={14} /></button>
                    <button onClick={() => setShowNoteInput(!showNoteInput)} className="p-1.5 hover:bg-white/50 rounded-md transition-colors" title="Tambah Catatan"><StickyNote size={14} /></button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={(e) => handleFileUpload(e.target.files)} />
            </div>

            <div className="p-3 flex-1 flex flex-col gap-2 min-h-[250px] overflow-y-auto custom-scrollbar relative">
                {uploading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm rounded-b-xl">
                        <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold text-indigo-600 border border-indigo-100">
                            <Loader2 className="animate-spin" size={14} /> Uploading...
                        </div>
                    </div>
                )}

                {showNoteInput && (
                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 shadow-sm mb-1 animate-in slide-in-from-top-2">
                        <textarea
                            autoFocus
                            className="w-full text-xs bg-transparent border-none focus:ring-0 p-1 mb-1 resize-none placeholder-gray-400 font-medium"
                            rows={2}
                            placeholder="Tulis catatan..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                        />
                        <div className="flex justify-end gap-2 pt-1 border-t border-yellow-100">
                            <button onClick={() => setShowNoteInput(false)} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2">BATAL</button>
                            <button onClick={addNote} className="text-[10px] font-bold bg-yellow-200 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-300">SIMPAN</button>
                        </div>
                    </div>
                )}

                {items.length === 0 && !showNoteInput && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60 pointer-events-none py-10">
                        <UploadCloud size={32} className="mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Drop Files</p>
                    </div>
                )}

                {items.map((item) => (
                    <div key={item.id} className="group relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex gap-3 items-start">
                        <div className="mt-0.5 shrink-0">
                            {item.type === 'file' ? (
                                item.fileName?.toLowerCase().endsWith('.pdf') ? <div className="bg-red-50 p-1.5 rounded text-red-500"><FileType size={16} /></div> :
                                    item.fileName?.toLowerCase().match(/\.(doc|docx)$/) ? <div className="bg-blue-50 p-1.5 rounded text-blue-500"><FileText size={16} /></div> :
                                        <div className="bg-gray-50 p-1.5 rounded text-gray-500"><FileText size={16} /></div>
                            ) : (
                                <div className="bg-yellow-50 p-1.5 rounded text-yellow-500"><StickyNote size={16} /></div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            {item.type === 'file' ? (
                                <a href={item.content} target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-700 hover:text-indigo-600 hover:underline block break-all leading-snug">
                                    {item.fileName}
                                </a>
                            ) : (
                                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-medium bg-yellow-50/50 p-1.5 -ml-1 rounded border border-yellow-100">
                                    {item.content}
                                </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] text-gray-400 font-medium">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                                {item.type === 'file' && <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border uppercase">{item.fileType?.split('/')[1] || 'FILE'}</span>}
                            </div>
                        </div>

                        <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all" title="Hapus">
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function LegalitasBadanPage() {
    const [entities, setEntities] = useState<LegalEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // State Tabs & Toggle
    const [activeCategory, setActiveCategory] = useState<Category>('CLIENT');
    const [activeMode, setActiveMode] = useState<DocMode>('LEGALITAS'); // Toggle State

    const [isAdding, setIsAdding] = useState(false);
    const [newEntity, setNewEntity] = useState({ nama: '', nomor: '', tanggal: '' });

    const loadData = async () => {
        const data = await getLegalEntities();
        setEntities(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddEntity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntity.nama) return;

        const entity: LegalEntity = {
            id: Date.now().toString(),
            category: activeCategory,
            docType: activeMode, // Simpan tipe dokumen sesuai mode aktif
            nama: newEntity.nama,
            nomor: newEntity.nomor,
            tanggal: newEntity.tanggal,
            col2: [],
            col3: [],
            col4: [],
            col5: [],
            updatedAt: new Date().toISOString()
        };

        setEntities(prev => [entity, ...prev]);
        setIsAdding(false);
        setNewEntity({ nama: '', nomor: '', tanggal: '' });

        await saveLegalEntity(entity);
        await loadData();
    };

    const handleUpdateEntity = async (updatedEntity: LegalEntity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
        await saveLegalEntity(updatedEntity);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus data ini beserta seluruh dokumennya?')) {
            setEntities(prev => prev.filter(e => e.id !== id));
            await deleteLegalEntity(id);
        }
    };

    const calculateProgress = (entity: LegalEntity) => {
        let completedCols = 0;
        if (entity.col2.length > 0) completedCols++;
        if (entity.col3.length > 0) completedCols++;
        if (entity.col4.length > 0) completedCols++;
        if (entity.col5.length > 0) completedCols++;
        return (completedCols / 4) * 100;
    };

    // Filter Entities berdasarkan Search, Category, DAN Mode (Toggle)
    const filteredEntities = entities.filter(e => {
        const entityCat = e.category || 'CLIENT';
        const entityDocType = e.docType || 'LEGALITAS'; // Default ke LEGALITAS jika kosong (backward compatibility)

        const matchesCategory = entityCat === activeCategory;
        const matchesMode = entityDocType === activeMode;
        const matchesSearch = e.nama.toLowerCase().includes(search.toLowerCase()) ||
            e.nomor.toLowerCase().includes(search.toLowerCase());

        return matchesCategory && matchesSearch && matchesMode;
    });

    const activeCatData = CATEGORIES.find(c => c.id === activeCategory);

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans pb-20">

            {/* HEADER & TABS AREA */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
                <div className="max-w-[1600px] mx-auto px-6 pt-5 pb-0">
                    {/* Title, Search & Mode Toggle */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 pb-5">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-200">
                                        {activeMode === 'LEGALITAS' ? <Archive size={24} /> : <ScrollText size={24} />}
                                    </div>
                                    {activeMode === 'LEGALITAS' ? 'Dokumen Notaris' : 'Dokumen PPAT'}
                                </h1>
                                <p className="text-gray-500 text-sm mt-1 ml-1">
                                    Sistem manajemen arsip {activeMode === 'LEGALITAS' ? 'Pekerjaan Notaris' : 'Pekerjaan PPAT'}
                                </p>
                            </div>

                            {/* MODE TOGGLE SWITCH */}
                            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner ml-4">
                                <button
                                    onClick={() => setActiveMode('LEGALITAS')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeMode === 'LEGALITAS'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Building2 size={16} /> LEGALITAS
                                </button>
                                <button
                                    onClick={() => setActiveMode('PPAT')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeMode === 'PPAT'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <ScrollText size={16} /> PPAT
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari Data..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-inner"
                                />
                            </div>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">TAMBAH {activeMode}</span>
                            </button>
                        </div>
                    </div>

                    {/* TOGGLE TABS CATEGORIES */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex flex-col items-center justify-center px-6 py-3 min-w-[160px] border-b-4 transition-all duration-300 group
                                ${isActive
                                            ? `${cat.color} bg-opacity-10`
                                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        }
                            `}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <cat.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className={`text-xs font-bold tracking-wider ${isActive ? '' : 'text-gray-600'}`}>{cat.label}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

                {/* INFO BAR KATEGORI AKTIF */}
                <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-left-4">
                    <div className={`p-2 rounded-lg ${activeCatData?.color.split(' ')[0]} bg-white shadow-sm border`}>
                        <activeCatData.icon size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{activeCatData?.label}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeMode === 'PPAT' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                {activeMode}
                            </span>
                            {activeCatData?.desc}
                        </div>
                    </div>
                    <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-bold text-gray-600">
                        {filteredEntities.length} <span className="font-normal text-gray-400 text-xs">BERKAS</span>
                    </div>
                </div>

                {/* MODAL TAMBAH DATA */}
                {isAdding && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="bg-indigo-100 p-1.5 rounded text-indigo-600"><Plus size={18} /></div>
                                    <h3 className="font-bold text-gray-800 text-lg">
                                        {activeMode === 'PPAT' ? 'Buat Data PPAT Baru' : 'Buat Legalitas Baru'}
                                    </h3>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleAddEntity} className="p-6 space-y-5">
                                <div className={`p-4 rounded-xl border flex items-center gap-3 ${activeCatData?.color.replace('border-', 'bg-opacity-10 bg-')}`}>
                                    <activeCatData.icon size={24} />
                                    <div>
                                        <div className="text-xs uppercase font-bold opacity-60">Kategori</div>
                                        <div className="font-bold">{activeCatData?.label}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">
                                        {activeMode === 'PPAT' ? 'Nama Pemilik / Obyek' : 'Nama Entitas / Badan Usaha'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        autoFocus
                                        type="text"
                                        placeholder={activeMode === 'PPAT' ? "Contoh: Sertifikat a.n Budi / Tanah Cibaduyut" : "Contoh: PT. Maju Jaya"}
                                        value={newEntity.nama}
                                        onChange={(e) => setNewEntity({ ...newEntity, nama: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">
                                            {activeMode === 'PPAT' ? 'Nomor SHM / NIB' : 'Nomor Identitas (NPWP)'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nomor Dokumen..."
                                            value={newEntity.nomor}
                                            onChange={(e) => setNewEntity({ ...newEntity, nomor: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Tanggal</label>
                                        <input
                                            type="date"
                                            value={newEntity.tanggal}
                                            onChange={(e) => setNewEntity({ ...newEntity, tanggal: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-600"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-2">
                                    <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">BATAL</button>
                                    <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform active:scale-95">SIMPAN DATA</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DATA LIST */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                        <p className="font-medium animate-pulse">Menyiapkan data...</p>
                    </div>
                ) : filteredEntities.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${activeCatData?.color.replace('text-', 'bg-').replace('border-', '')} bg-opacity-10 text-opacity-100`}>
                            <activeCatData.icon size={40} />
                        </div>
                        <h3 className="text-gray-800 font-bold text-xl mb-2">Belum ada data {activeMode} di sini</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">
                            Silakan tambah data baru pada tab ini.
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                        >
                            + Tambah {activeMode}
                        </button>
                    </div>
                ) : (
                    filteredEntities.map((entity) => {
                        const progress = calculateProgress(entity);

                        return (
                            <div key={entity.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                {/* HEADER CARD */}
                                <div className="p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">

                                    {/* Entity Info */}
                                    <div className="flex-1 min-w-[300px]">
                                        <div className="flex items-start gap-5">
                                            <div className={`p-4 rounded-2xl text-white shadow-lg ${entity.category === 'NOTARIS' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200' :
                                                entity.category === 'INSTANSI' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-200' :
                                                    entity.category === 'OTHER' ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-200' :
                                                        'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                                                }`}>
                                                {entity.category === 'NOTARIS' ? <Briefcase size={28} /> :
                                                    entity.category === 'INSTANSI' ? <Landmark size={28} /> :
                                                        entity.category === 'OTHER' ? <FolderOpen size={28} /> :
                                                            <Users size={28} />}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{entity.nama}</h2>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm">
                                                        <FileCheck size={14} className="text-indigo-500" />
                                                        <span className="font-mono font-medium text-gray-700">{entity.nomor || 'No Number'}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm">
                                                        <Calendar size={14} className="text-indigo-500" />
                                                        <span className="font-medium text-gray-700">{entity.tanggal ? new Date(entity.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeMode === 'PPAT' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                        {activeMode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress & Actions */}
                                    <div className="flex items-center gap-8 w-full xl:w-auto justify-between xl:justify-end">
                                        <div className="flex-1 xl:w-72">
                                            <div className="flex justify-between text-xs mb-2 px-1">
                                                <span className="text-gray-400 font-bold uppercase tracking-wider">Kelengkapan Berkas</span>
                                                <span className={`font-bold ${progress === 100 ? 'text-green-600' : 'text-indigo-600'}`}>{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                        'bg-gradient-to-r from-indigo-400 to-blue-500'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="pl-6 border-l border-gray-200">
                                            <button
                                                onClick={() => handleDelete(entity.id)}
                                                className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                                                title="Hapus Data Permanen"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNS AREA */}
                                <div className="p-6 bg-gray-50/50 overflow-x-auto border-t border-gray-100">
                                    <div className="flex gap-6 min-w-[1200px] xl:min-w-full h-[400px]">

                                        <DocColumn
                                            title={activeMode === 'PPAT' ? "DOKUMEN CLIENT" : "SALINAN/SK"}
                                            colorTheme="blue"
                                            items={entity.col2}
                                            entityId={entity.id}
                                            onUpdate={(items) => handleUpdateEntity({ ...entity, col2: items })}
                                        />

                                        <DocColumn
                                            title={activeMode === 'PPAT' ? "DOKUMEN PPAT" : "DOKUMEN CORETAX"}
                                            colorTheme="teal"
                                            items={entity.col3}
                                            entityId={entity.id}
                                            onUpdate={(items) => handleUpdateEntity({ ...entity, col3: items })}
                                        />

                                        <DocColumn
                                            title={activeMode === 'PPAT' ? "DOKUMEN INSTANSI" : "DOKUMEN OSS"}
                                            colorTheme="purple"
                                            items={entity.col4}
                                            entityId={entity.id}
                                            onUpdate={(items) => handleUpdateEntity({ ...entity, col4: items })}
                                        />

                                        <DocColumn
                                            title={activeMode === 'PPAT' ? "DOKUMEN LAINNYA" : "DOKUMEN LAINNYA"}
                                            colorTheme="orange"
                                            items={entity.col5}
                                            entityId={entity.id}
                                            onUpdate={(items) => handleUpdateEntity({ ...entity, col5: items })}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}