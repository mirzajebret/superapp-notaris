'use client';

import { useState, useEffect } from 'react';
import { getWebForms, saveWebForm, deleteWebForm } from '@/app/actions';
import {
    FileText,
    Plus,
    Trash2,
    Edit3,
    Search,
    FolderOpen,
    Save,
    Building2,
    FileCheck,
    Eye
} from 'lucide-react';

// Interfaces
interface WebForm {
    id: string;
    formType: string;
    createdAt: string;
    updatedAt: string;
    clientName: string;
    entityName: string;
    status: 'draft' | 'submitted';
    formData: any;
}

interface FormTemplate {
    id: string;
    name: string;
    description: string;
    icon: any;
}

export default function WebFormPage() {
    const [forms, setForms] = useState<WebForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTemplateSelection, setShowTemplateSelection] = useState(false);
    const [selectedForm, setSelectedForm] = useState<WebForm | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form templates available
    const templates: FormTemplate[] = [
        {
            id: 'AIO',
            name: 'Formulir Pendirian Badan AIO',
            description: 'PT / PT PMA / PT Perorangan / CV / Yayasan / Koperasi / Perkumpulan',
            icon: Building2
        }
    ];

    // Load data
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getWebForms();
            setForms(data);
        } catch (error) {
            console.error('Failed to load forms', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteForm = async (id: string) => {
        if (confirm('Hapus formulir ini?')) {
            await deleteWebForm(id);
            loadData();
        }
    };

    const handleCreateNew = (templateId: string) => {
        // Navigate to form filling page
        window.location.href = `/modules/webform/fill?template=${templateId}`;
    };

    const handleEditForm = (form: WebForm) => {
        // Navigate to form editing page
        window.location.href = `/modules/webform/fill?id=${form.id}`;
    };

    const handleViewForm = (form: WebForm) => {
        // Navigate to form preview page
        window.location.href = `/modules/webform/preview?id=${form.id}`;
    };

    // Filter forms
    const filteredForms = forms.filter(f => {
        const query = searchQuery.toLowerCase();
        return (
            f.clientName?.toLowerCase().includes(query) ||
            f.entityName?.toLowerCase().includes(query) ||
            f.formType?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">

            {/* Sidebar - Form Templates */}
            <div className="w-64 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <FileText className="text-blue-600" /> Webform
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Formulir Pendirian Badan</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Template Formulir</div>
                    {templates.map(template => {
                        const Icon = template.icon;
                        return (
                            <button
                                key={template.id}
                                onClick={() => handleCreateNew(template.id)}
                                className="w-full text-left px-3 py-3 rounded-lg border border-gray-200 mb-2 hover:bg-blue-50 hover:border-blue-300 transition group"
                            >
                                <div className="flex items-start gap-2">
                                    <Icon size={18} className="text-blue-600 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600">{template.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="p-3 border-t">
                    <div className="text-xs text-gray-500 text-center">
                        <FileCheck size={14} className="inline mr-1" />
                        {forms.length} formulir tersimpan
                    </div>
                </div>
            </div>

            {/* Main Content - Saved Forms */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Formulir Tersimpan</h1>
                        <p className="text-sm text-gray-500">{filteredForms.length} formulir</p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari formulir..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Forms List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Memuat data...</div>
                    ) : filteredForms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <FolderOpen size={48} className="mb-2 opacity-20" />
                            <p className="text-lg font-medium">Belum ada formulir</p>
                            <p className="text-sm mt-1">Pilih template di sidebar untuk membuat formulir baru</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredForms.map(form => (
                                <div key={form.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex items-center justify-between group">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800">{form.entityName || 'Tanpa Nama Badan'}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-gray-500">Klien: {form.clientName || '-'}</span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(form.updatedAt || form.createdAt).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${form.status === 'draft'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {form.status === 'draft' ? 'Draft' : 'Submitted'}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {form.formType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition ml-4">
                                        <button
                                            onClick={() => handleViewForm(form)}
                                            className="p-2 hover:bg-green-50 rounded text-green-600 transition"
                                            title="Preview / Print"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEditForm(form)}
                                            className="p-2 hover:bg-blue-50 rounded text-blue-600 transition"
                                            title="Edit"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteForm(form.id)}
                                            className="p-2 hover:bg-red-50 rounded text-red-600 transition"
                                            title="Hapus"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
