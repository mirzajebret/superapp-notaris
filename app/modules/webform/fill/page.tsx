'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getWebFormById, saveWebForm } from '@/app/actions';
import { ArrowLeft, Save, Send, CheckCircle2 } from 'lucide-react';

// Section Components
import Section1_JenisBadan from '@/components/webform/Section1_JenisBadan';
import Section2_StrukturModal from '@/components/webform/Section2_StrukturModal';
import Section3_BidangUsaha from '@/components/webform/Section3_BidangUsaha';
import Section4_PemegangSaham from '@/components/webform/Section4_PemegangSaham';
import Section5_SusunanPengurus from '@/components/webform/Section5_SusunanPengurus';
import Section6_PemilikManfaat from '@/components/webform/Section6_PemilikManfaat';
import Section7_Checklist from '@/components/webform/Section7_Checklist';

// Interfaces
interface FormData {
    section1?: any;
    section2?: any;
    section3?: any;
    section4?: any;
    section5?: any;
    section6?: any;
    section7?: any;
}

function WebFormFillContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const template = searchParams.get('template');
    const formId = searchParams.get('id');

    const [activeSection, setActiveSection] = useState(1);
    const [formData, setFormData] = useState<FormData>({});
    const [saving, setSaving] = useState(false);
    const [existingFormId, setExistingFormId] = useState<string | null>(null);

    const sections = [
        { id: 1, title: 'Jenis Badan & Identitas Utama', completed: false },
        { id: 2, title: 'Struktur Modal / Kekayaan Awal', completed: false },
        { id: 3, title: 'Bidang Usaha & Tujuan (KBLI)', completed: false },
        { id: 4, title: 'Data Pemegang Saham / Pendiri / Pembina', completed: false },
        { id: 5, title: 'Susunan Pengurus & Pengawas', completed: false },
        { id: 6, title: 'Pemilik Manfaat', completed: false },
        { id: 7, title: 'Checklist Dokumen Lampiran', completed: false },
    ];

    // Load existing form if editing
    useEffect(() => {
        if (formId) {
            loadExistingForm(formId);
        }
    }, [formId]);

    const loadExistingForm = async (id: string) => {
        const form = await getWebFormById(id);
        if (form) {
            setFormData(form.formData || {});
            setExistingFormId(form.id);
        }
    };

    const handleSectionDataChange = (sectionNum: number, data: any) => {
        setFormData(prev => ({
            ...prev,
            [`section${sectionNum}`]: data
        }));
    };

    const handleSave = async (isDraft: boolean = true) => {
        setSaving(true);
        try {
            const payload = {
                id: existingFormId || undefined,
                formType: template || 'AIO',
                clientName: formData.section1?.email || '',
                entityName: formData.section1?.namaOpsi1 || '',
                status: isDraft ? 'draft' : 'submitted',
                formData: formData
            };

            await saveWebForm(payload);
            alert(isDraft ? 'Draft berhasil disimpan!' : 'Formulir berhasil disubmit!');

            if (!isDraft) {
                router.push('/modules/webform');
            }
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Gagal menyimpan formulir');
        } finally {
            setSaving(false);
        }
    };

    const renderSection = () => {
        switch (activeSection) {
            case 1:
                return <Section1_JenisBadan data={formData.section1} onChange={(data) => handleSectionDataChange(1, data)} />;
            case 2:
                return <Section2_StrukturModal data={formData.section2} onChange={(data) => handleSectionDataChange(2, data)} />;
            case 3:
                return <Section3_BidangUsaha data={formData.section3} onChange={(data) => handleSectionDataChange(3, data)} />;
            case 4:
                return <Section4_PemegangSaham data={formData.section4} onChange={(data) => handleSectionDataChange(4, data)} />;
            case 5:
                return <Section5_SusunanPengurus data={formData.section5} onChange={(data) => handleSectionDataChange(5, data)} />;
            case 6:
                return <Section6_PemilikManfaat data={formData.section6} onChange={(data) => handleSectionDataChange(6, data)} />;
            case 7:
                return <Section7_Checklist data={formData.section7} onChange={(data) => handleSectionDataChange(7, data)} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/modules/webform')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">FORMULIR PENDAFTARAN PENDIRIAN BADAN</h1>
                                <p className="text-sm text-gray-500">PT / PT PMA / PT Perorangan / CV / Yayasan / Koperasi / Perkumpulan</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Save size={18} />
                                {saving ? 'Menyimpan...' : 'Simpan Draft'}
                            </button>
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Send size={18} />
                                Submit
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            {sections.map((section, idx) => (
                                <div key={section.id} className="flex-1 flex items-center">
                                    <button
                                        onClick={() => setActiveSection(section.id)}
                                        className={`flex-1 h-1.5 rounded-full transition ${activeSection === section.id
                                                ? 'bg-blue-600'
                                                : activeSection > section.id
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-200'
                                            }`}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500">Bagian {activeSection} dari {sections.length}</span>
                            <span className="text-xs text-gray-500">{sections[activeSection - 1]?.title}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-6">

                    {/* Sidebar - Section Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
                            <h3 className="font-bold text-sm text-gray-700 mb-3">Navigasi Bagian</h3>
                            <div className="space-y-1">
                                {sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${activeSection === section.id
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${activeSection === section.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {section.completed ? <CheckCircle2 size={14} /> : section.id}
                                        </span>
                                        <span className="line-clamp-2">{section.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm">
                                        {activeSection}
                                    </span>
                                    {sections[activeSection - 1]?.title}
                                </h2>
                            </div>

                            {renderSection()}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8 pt-6 border-t">
                                <button
                                    onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
                                    disabled={activeSection === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Sebelumnya
                                </button>
                                <button
                                    onClick={() => setActiveSection(Math.min(sections.length, activeSection + 1))}
                                    disabled={activeSection === sections.length}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function WebFormFillPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <WebFormFillContent />
        </Suspense>
    );
}
