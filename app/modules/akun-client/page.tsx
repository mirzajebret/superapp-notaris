'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Pencil, Trash, Copy, Eye, EyeOff } from 'lucide-react';
import { getClientAccounts, saveClientAccount, deleteClientAccount } from '@/app/actions';

interface AccountData {
    id: string;
    name: string; // New field
    platform: string;
    username: string; // Email/Username combined
    password: string;
    status: 'Active' | 'In Review' | 'Blacklist'; // New field
    notes?: string;
    updatedAt: string;
}

const emptyForm: AccountData = {
    id: '',
    name: '',
    platform: '',
    username: '',
    password: '',
    status: 'Active',
    notes: '',
    updatedAt: '',
};

export default function ClientAccountsPage() {
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<AccountData>(emptyForm);
    const [isLoading, setIsLoading] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    // Checkbox selections
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getClientAccounts();

        // Migration/Defaults for existing data
        const mappedData = (data || []).map((item: any) => ({
            ...item,
            name: item.name || '-',
            status: item.status || 'Active'
        }));

        // Sort by newest updated
        const sorted = mappedData.sort((a: AccountData, b: AccountData) =>
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

    // Simplified delete for single item from action menu
    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus akun ini?')) {
            await deleteClientAccount(id);
            loadData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.platform || !formData.username) return alert('Platform dan Username wajib diisi');
        if (!formData.name) return alert('Nama Klien wajib diisi');

        setIsLoading(true);
        const dataToSave = { ...formData, updatedAt: new Date().toISOString() };
        await saveClientAccount(dataToSave);
        await loadData();
        setIsLoading(false);
        setIsModalOpen(false);
    };

    // Toggle logic for checkbox
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAccounts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string) => {
        if (!navigator.clipboard) {
            // Fallback for secure context issues or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                // Optional: alert('Copied!');
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            // Optional: alert('Copied!');
        }, (err) => {
            console.error('Async: Could not copy text: ', err);
        });
    };

    // Filter Logic
    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status Badge Component
    const StatusBadge = ({ status }: { status: AccountData['status'] }) => {
        let styles = 'bg-gray-100 text-gray-600';
        if (status === 'Active') styles = 'bg-green-100 text-green-600';
        if (status === 'In Review') styles = 'bg-orange-100 text-orange-600';
        if (status === 'Blacklist') styles = 'bg-slate-200 text-slate-600'; // Using gray for Blacklist based on image

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 w-fit ${styles}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : status === 'In Review' ? 'bg-orange-500' : 'bg-slate-500'}`}></span>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER / SEARCH BAR */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Users"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-transparent focus:outline-none text-sm placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto p-1">

                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-4 py-2 text-blue rounded-full text-sm font-semibold border border-blue"
                        >Add Account
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* TABLE CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                    <th className="p-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-transparent w-4 h-4 cursor-pointer"
                                            checked={filteredAccounts.length > 0 && selectedIds.size === filteredAccounts.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-4 min-w-[150px]">Name</th>
                                    <th className="p-4 min-w-[200px]">Email</th>
                                    <th className="p-4 min-w-[150px]">Password</th>
                                    <th className="p-4 min-w-[120px]">Platform</th>
                                    <th className="p-4 min-w-[120px]">Created on</th>
                                    <th className="p-4 min-w-[130px]">Status</th>
                                    <th className="p-4 w-10"></th>{/* Actions */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-transparent w-4 h-4 cursor-pointer"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                />
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800">
                                                {item.name}
                                            </td>
                                            <td className="p-4 text-slate-600 font-medium">
                                                <div className="flex items-center gap-2 group/email">
                                                    <span className="truncate max-w-[200px]">{item.username}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(item.username)}
                                                        className="text-slate-400 hover:text-blue-600 opacity-0 group-hover/email:opacity-100 transition-opacity"
                                                        title="Copy Email"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-800 font-mono text-xs">
                                                <div className="flex items-center gap-2 group/pass">
                                                    <span className={`${visiblePasswords[item.id] ? '' : 'tracking-widest'}`}>
                                                        {visiblePasswords[item.id] ? item.password : '********'}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover/pass:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => togglePasswordVisibility(item.id)}
                                                            className="text-slate-400 hover:text-blue-600"
                                                            title={visiblePasswords[item.id] ? "Hide" : "Show"}
                                                        >
                                                            {visiblePasswords[item.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(item.password)}
                                                            className="text-slate-400 hover:text-blue-600"
                                                            title="Copy Password"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-800 text-xs uppercase">
                                                {item.platform}
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(item.updatedAt).toLocaleDateString('en-US', {
                                                    year: '2-digit',
                                                    month: 'numeric',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Placeholder (Visual Only) */}
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                        <span>Showing {filteredAccounts.length} entries</span>
                        <div className="flex gap-1">
                            {/* Simple pagination controls */}
                            <button disabled className="px-2 py-1 rounded border border-slate-200 opacity-50">Prev</button>
                            <button className="px-2 py-1 rounded border border-slate-200 bg-blue-50 text-blue-600 font-bold">1</button>
                            <button disabled className="px-2 py-1 rounded border border-slate-200 opacity-50">Next</button>
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL INPUT */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {formData.id ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email / Username</label>
                                    <input
                                        type="text"
                                        placeholder="example@email.com"
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Platform</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Gmail"
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Blacklist">Blacklist</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                                    <input
                                        type="text"
                                        placeholder="Secret123"
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes (Optional)</label>
                                    <textarea
                                        rows={2}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70"
                                >
                                    {isLoading ? 'Saving...' : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}