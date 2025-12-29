'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, Pencil, Trash2, Copy, Eye, EyeOff, StickyNote, X } from 'lucide-react';
import { getClientAccounts, saveClientAccount, deleteClientAccount } from '@/app/actions';

interface AccountData {
    id: string;
    platform: string;
    username: string; // Email/Username combined
    password: string;
    notes?: string;
    updatedAt: string;
}

const emptyForm: AccountData = {
    id: '',
    platform: '',
    username: '',
    password: '',
    notes: '',
    updatedAt: '',
};

export default function ClientAccountsPage() {
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<AccountData>(emptyForm);
    const [isLoading, setIsLoading] = useState(false);

    // State untuk toggle visibility password per card (menggunakan ID sebagai key)
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getClientAccounts();
        // Sort by newest updated
        const sorted = (data || []).sort((a: AccountData, b: AccountData) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setAccounts(sorted);
        setIsLoading(false);
    };

    const handleCreateNew = () => {
        setFormData({ ...emptyForm, id: Date.now().toString() });
        setIsModalOpen(true);
    };

    const handleEdit = (item: AccountData) => {
        setFormData(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus akun ini?')) {
            await deleteClientAccount(id);
            loadData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.platform || !formData.username) return alert('Platform dan Username wajib diisi');

        setIsLoading(true);
        const dataToSave = { ...formData, updatedAt: new Date().toISOString() };
        await saveClientAccount(dataToSave);
        await loadData();
        setIsLoading(false);
        setIsModalOpen(false);
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Bisa tambah toast notification disini jika ada library
        alert('Disalin ke clipboard!');
    };

    // Filter Logic
    const filteredAccounts = accounts.filter(acc =>
        acc.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Generate random pastel color based on string
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* HEADER & SEARCH */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Shield className="w-9 h-9 text-blue-600" /> Manajer Akun Klien
                        </h1>
                        <p className="text-slate-500 mt-1">Simpan dan kelola akses akun OSS, AHU, DJP, dll dengan aman.</p>
                    </div>

                    <div className="flex w-full md:w-auto gap-3">
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Cari platform atau username..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-blue-200 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            + Tambah Akun
                        </button>
                    </div>
                </div>

                {/* ACCOUNT GRID */}
                {filteredAccounts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-400 text-lg">Belum ada data akun yang tersimpan.</p>
                        <button onClick={handleCreateNew} className="text-blue-600 font-medium mt-2 hover:underline">Tambah akun pertama</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAccounts.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                                {/* Platform Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm"
                                            style={{ backgroundColor: stringToColor(item.platform) }}
                                        >
                                            {item.platform.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{item.platform}</h3>
                                            <p className="text-xs text-slate-400">Diupdate: {new Date(item.updatedAt).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Edit"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                {/* Credentials Fields */}
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {/* Username */}
                                    <div className="flex justify-between items-center group/field">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID / Email / User</span>
                                            <span className="text-sm font-medium text-slate-700 truncate select-all">{item.username}</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(item.username)}
                                            className="opacity-0 group-hover/field:opacity-100 text-slate-400 hover:text-blue-600 transition-all p-1"
                                            title="Salin Username"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Separator */}
                                    <div className="h-px bg-slate-200 w-full"></div>

                                    {/* Password */}
                                    <div className="flex justify-between items-center group/field">
                                        <div className="flex flex-col overflow-hidden w-full">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium text-slate-700 truncate ${visiblePasswords[item.id] ? '' : 'tracking-widest'}`}>
                                                    {visiblePasswords[item.id] ? item.password : '••••••••'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/field:opacity-100 transition-all">
                                            <button
                                                onClick={() => togglePasswordVisibility(item.id)}
                                                className="text-slate-400 hover:text-blue-600 p-1"
                                                title={visiblePasswords[item.id] ? "Sembunyikan" : "Tampilkan"}
                                            >
                                                {visiblePasswords[item.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(item.password)}
                                                className="text-slate-400 hover:text-blue-600 p-1"
                                                title="Salin Password"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes if any */}
                                {item.notes && (
                                    <div className="mt-4 text-xs text-slate-500 italic bg-yellow-50 p-2 rounded border border-yellow-100 flex items-start gap-2">
                                        <StickyNote className="w-3 h-3 flex-shrink-0 mt-0.5" /> {item.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL INPUT */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">
                                {formData.id ? 'Edit Akun' : 'Tambah Akun Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Platform / Website</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: OSS, DJP Online, AHU"
                                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ID / Username / Email</label>
                                <input
                                    type="text"
                                    placeholder="nama@email.com atau username"
                                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Rahasia123"
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Misal: PIN Transaksi 123456"
                                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70"
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}