'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Printer, Paperclip, X, Image as ImageIcon, Loader2, Trash2, FileText } from 'lucide-react'
import { getJobs, saveJob, deleteJob, uploadJobAttachment, type Job, type JobCategory, type JobStatus, type PaymentTermin } from './actions'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// Helper UUID
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Component for inline editing of notes
function NotesCell({ job, onSave }: { job: Job; onSave: (id: string, notes: string) => void }) {
    const [value, setValue] = useState(job.notes || '')

    useEffect(() => {
        setValue(job.notes || '')
    }, [job.notes])

    const handleBlur = () => {
        if (value !== (job.notes || '')) {
            onSave(job.id, value)
        }
    }

    return (
        <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="Keterangan..."
            className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 rounded px-2 py-1 text-xs leading-relaxed resize-y min-h-[80px] transition-all outline-none placeholder:italic placeholder:text-gray-300"
            onClick={(e) => e.stopPropagation()}
        />
    )
}

// Component for attachment modal
function AttachmentModal({
    isOpen,
    onClose,
    currentUrl,
    onUpload,
    onRemove,
    title,
    uploading
}: {
    isOpen: boolean
    onClose: () => void
    currentUrl?: string
    onUpload: (file: File) => Promise<void>
    onRemove: () => void
    title: string
    uploading: boolean
}) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Paperclip size={16} className="text-blue-600" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    {uploading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <p className="text-xs font-medium">Mengupload gambar...</p>
                        </div>
                    ) : currentUrl ? (
                        <div className="space-y-4">
                            {currentUrl.toLowerCase().endsWith('.pdf') ? (
                                <div className="aspect-video bg-red-50 rounded-lg border border-red-100 flex flex-col items-center justify-center gap-3">
                                    <FileText className="w-16 h-16 text-red-500" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-red-700">Dokumen PDF</p>
                                        <a
                                            href={currentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 block"
                                        >
                                            Klik untuk membuka
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                    <img
                                        src={currentUrl}
                                        alt="Attachment"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <a
                                            href={currentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white/90 text-gray-800 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-white"
                                        >
                                            Buka Gambar
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={onRemove}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Hapus
                                </button>
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) onUpload(file)
                                        }}
                                    />
                                    <div className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 cursor-pointer">
                                        <ImageIcon size={14} /> Ganti
                                    </div>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                                        <ImageIcon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="mb-1 text-xs text-gray-700 font-medium">Klik untuk upload file</p>
                                    <p className="text-[10px] text-gray-500">Gambar atau PDF (Max. 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) onUpload(file)
                                    }}
                                />
                            </label>
                            <div className="text-[10px] text-gray-400 text-center px-4">
                                Belum ada bukti transaksi yang dilampirkan.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function DaftarPekerjaanPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<JobCategory>('PPAT')
    const [searchTerm, setSearchTerm] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState<Job | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<Job>>({
        category: 'PPAT',
        clientName: '',
        jobName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Baru',
        totalCost: 0,
        paidAmount: 0,
        notes: '',
        costItems: [],
        processItems: [],
        paymentTermins: [],
        totalBudgetBiayaProses: 0
    })

    // Attachment Modal State
    const [attachmentModalState, setAttachmentModalState] = useState<{
        isOpen: boolean
        type: 'termin' | 'process' | null
        index: number
        currentUrl?: string
        title: string
        jobId?: string
    }>({ isOpen: false, type: null, index: -1, title: '' })

    const [isUploading, setIsUploading] = useState(false)

    const handleOpenAttachment = (type: 'termin' | 'process', index: number, currentUrl?: string, title?: string, jobId?: string) => {
        setAttachmentModalState({
            isOpen: true,
            type,
            index,
            currentUrl,
            title: title || 'Lampiran',
            jobId
        })
    }

    const handleUploadAttachment = async (file: File) => {
        setIsUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)

        const result = await uploadJobAttachment(formDataUpload)

        if (result.success && result.fileUrl) {
            // Handle Inline Editing (Save immediately to Job)
            if (attachmentModalState.jobId) {
                const updatedJobs = jobs.map(job => {
                    if (job.id === attachmentModalState.jobId) {
                        const updatedJob = { ...job }

                        if (attachmentModalState.type === 'termin') {
                            if (updatedJob.paymentTermins && updatedJob.paymentTermins[attachmentModalState.index]) {
                                const newTermins = [...updatedJob.paymentTermins]
                                newTermins[attachmentModalState.index] = {
                                    ...newTermins[attachmentModalState.index],
                                    attachmentUrl: result.fileUrl
                                }
                                updatedJob.paymentTermins = newTermins
                            }
                        } else if (attachmentModalState.type === 'process') {
                            if (updatedJob.processItems && updatedJob.processItems[attachmentModalState.index]) {
                                const newItems = [...updatedJob.processItems]
                                newItems[attachmentModalState.index] = {
                                    ...newItems[attachmentModalState.index],
                                    attachmentUrl: result.fileUrl
                                }
                                updatedJob.processItems = newItems
                            }
                        }

                        // Fire and forget save (optimistic)
                        saveJob(updatedJob)
                        return updatedJob
                    }
                    return job
                })
                setJobs(updatedJobs)
            }
            // Handle Form Editing (Update FormData only)
            else {
                if (attachmentModalState.type === 'termin') {
                    const newTermins = [...(formData.paymentTermins || [])]
                    if (newTermins[attachmentModalState.index]) {
                        newTermins[attachmentModalState.index] = {
                            ...newTermins[attachmentModalState.index],
                            attachmentUrl: result.fileUrl
                        }
                        setFormData(prev => ({ ...prev, paymentTermins: newTermins }))
                    }
                } else if (attachmentModalState.type === 'process') {
                    const newProcessItems = [...(formData.processItems || [])]
                    if (newProcessItems[attachmentModalState.index]) {
                        newProcessItems[attachmentModalState.index] = {
                            ...newProcessItems[attachmentModalState.index],
                            attachmentUrl: result.fileUrl
                        }
                        setFormData(prev => ({ ...prev, processItems: newProcessItems }))
                    }
                }
            }

            // Update modal state to show new file
            setAttachmentModalState(prev => ({ ...prev, currentUrl: result.fileUrl }))
        }
        setIsUploading(false)
    }

    const handleRemoveAttachment = () => {
        if (attachmentModalState.jobId) {
            const updatedJobs = jobs.map(job => {
                if (job.id === attachmentModalState.jobId) {
                    const updatedJob = { ...job }

                    if (attachmentModalState.type === 'termin') {
                        if (updatedJob.paymentTermins && updatedJob.paymentTermins[attachmentModalState.index]) {
                            const newTermins = [...updatedJob.paymentTermins]
                            const { attachmentUrl, ...rest } = newTermins[attachmentModalState.index]
                            newTermins[attachmentModalState.index] = rest
                            updatedJob.paymentTermins = newTermins
                        }
                    } else if (attachmentModalState.type === 'process') {
                        if (updatedJob.processItems && updatedJob.processItems[attachmentModalState.index]) {
                            const newItems = [...updatedJob.processItems]
                            const { attachmentUrl, ...rest } = newItems[attachmentModalState.index]
                            newItems[attachmentModalState.index] = rest
                            updatedJob.processItems = newItems
                        }
                    }

                    saveJob(updatedJob)
                    return updatedJob
                }
                return job
            })
            setJobs(updatedJobs)
        } else {
            // Update form data state
            if (attachmentModalState.type === 'termin') {
                const newTermins = [...(formData.paymentTermins || [])]
                if (newTermins[attachmentModalState.index]) {
                    const { attachmentUrl, ...rest } = newTermins[attachmentModalState.index]
                    newTermins[attachmentModalState.index] = rest
                    setFormData(prev => ({ ...prev, paymentTermins: newTermins }))
                }
            } else if (attachmentModalState.type === 'process') {
                const newProcessItems = [...(formData.processItems || [])]
                if (newProcessItems[attachmentModalState.index]) {
                    const { attachmentUrl, ...rest } = newProcessItems[attachmentModalState.index]
                    newProcessItems[attachmentModalState.index] = rest
                    setFormData(prev => ({ ...prev, processItems: newProcessItems }))
                }
            }
        }
        setAttachmentModalState(prev => ({ ...prev, currentUrl: undefined }))
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const data = await getJobs()
        setJobs(data)
        setLoading(false)
    }

    // --- LOGIC ---

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchCategory = job.category === activeCategory
            const matchSearch =
                (job.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.jobName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
            return matchCategory && matchSearch
        })
    }, [jobs, activeCategory, searchTerm])

    const handleUpdateNotes = async (id: string, newNotes: string) => {
        // Optimistic update
        setJobs(prev => prev.map(j => j.id === id ? { ...j, notes: newNotes } : j))

        const job = jobs.find(j => j.id === id)
        if (job) {
            await saveJob({ ...job, notes: newNotes })
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        // Calculate paidAmount from termins if they exist, otherwise use direct input
        const calculatedPaidAmount = (formData.paymentTermins && formData.paymentTermins.length > 0)
            ? formData.paymentTermins.reduce((sum, termin) => sum + termin.amount, 0)
            : Number(formData.paidAmount)

        const jobToSave: Job = {
            id: editingJob ? editingJob.id : generateUUID(),
            category: formData.category as JobCategory,
            clientName: formData.clientName || '',
            jobName: formData.jobName || '',
            date: formData.date || format(new Date(), 'yyyy-MM-dd'),
            status: formData.status as JobStatus,
            totalCost: Number(formData.totalCost),
            paidAmount: calculatedPaidAmount,
            notes: formData.notes || '',
            createdAt: editingJob?.createdAt || new Date().toISOString(),
            costItems: formData.costItems || [],
            processItems: formData.processItems || [],
            paymentTermins: formData.paymentTermins || [],
            totalBudgetBiayaProses: Number(formData.totalBudgetBiayaProses) || 0
        }

        await saveJob(jobToSave)
        await loadData()
        closeModal()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus pekerjaan ini?')) {
            await deleteJob(id)
            await loadData()
        }
    }

    const openAddModal = () => {
        setEditingJob(null)
        setFormData({
            category: activeCategory,
            clientName: '',
            jobName: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            status: 'Baru',
            totalCost: 0,
            paidAmount: 0,
            notes: '',
            costItems: [],
            processItems: [],
            paymentTermins: [],
            totalBudgetBiayaProses: 0
        })
        setIsModalOpen(true)
    }

    const openEditModal = (job: Job) => {
        setEditingJob(job)
        // Auto-migrate: if no items but has cost, create initial item
        let initialItems = job.costItems || []
        if (initialItems.length === 0 && job.totalCost > 0) {
            initialItems = [{ name: 'Biaya Estimasi Awal', amount: job.totalCost }]
        }

        // Auto-migrate: if no termins but has paidAmount, create single termin
        let initialTermins = job.paymentTermins || []
        if (initialTermins.length === 0 && job.paidAmount > 0) {
            initialTermins = [{
                terminNumber: 1,
                date: job.date,
                amount: job.paidAmount,
                notes: ''
            }]
        }

        setFormData({
            ...job,
            costItems: initialItems,
            processItems: job.processItems || [],
            paymentTermins: initialTermins,
            totalBudgetBiayaProses: job.totalBudgetBiayaProses || 0
        })
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingJob(null)
    }

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isModalOpen])

    // --- FORMATTER ---
    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
    }

    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case 'Selesai': return 'bg-green-100 text-green-700 border-green-200'
            case 'Proses': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'Baru': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'Tertunda': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'Batal': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    // --- PRINT HANDLER ---
    const handlePrint = () => {
        const style = document.createElement('style')
        style.innerHTML = `
            @media print {
                /* Hide everything except print area */
                body * {
                    visibility: hidden;
                }
                
                #print-report-area, #print-report-area * {
                    visibility: visible;
                }
                
                #print-report-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                
                @page {
                    size: portrait;
                    margin: 1cm;
                }
                
                /* Clean print styles */
                .print-clean {
                    box-shadow: none !important;
                    border: none !important;
                }
            }
        `

        document.head.appendChild(style)
        setTimeout(() => {
            window.print()
            document.head.removeChild(style)
        }, 100)
    }

    // --- SUMMARY STATS ---
    const stats = useMemo(() => {
        const total = filteredJobs.reduce((acc, curr) => acc + (curr.totalCost || 0), 0)
        const paid = filteredJobs.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0)
        const receivable = total - paid
        return { total, paid, receivable }
    }, [filteredJobs])


    return (
        <div className="flex flex-col h-screen bg-white font-sans text-gray-800 overflow-hidden">

            {/* --- HEADER COMPACT --- */}
            <div className="print:hidden px-5 py-4 border-b border-gray-200 bg-white shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>

                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Monitoring Pekerjaan
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">Rekapitulasi status dan keuangan pekerjaan klien</p>
                    </div>

                    {/* Toggle Category */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['Kenotariatan', 'PPAT', 'Lainnya'] as JobCategory[]).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeCategory === cat
                                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handlePrint}
                            className="print:hidden bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                        >
                            <Printer size={16} /> <span className="hidden sm:inline">Cetak Laporan</span>
                        </button>
                        <button
                            onClick={openAddModal}
                            className="bg-blue-600 hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-lg shadow-gray-200"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">Pekerjaan Baru</span>
                        </button>
                    </div>
                </div>

                {/* Financial Summary Strip */}
                <div className="mt-4 flex gap-6 text-xs border-t border-gray-100 pt-3">
                    <div>
                        <span className="text-gray-500 block uppercase tracking-wider text-[10px] mb-0.5">Total Estimasi</span>
                        <span className="font-bold text-gray-800 text-sm">{formatRupiah(stats.total)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block uppercase tracking-wider text-[10px] mb-0.5">Sudah Diterima</span>
                        <span className="font-bold text-green-600 text-sm">{formatRupiah(stats.paid)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block uppercase tracking-wider text-[10px] mb-0.5">Piutang (Receivable)</span>
                        <span className={`font-bold text-sm ${stats.receivable > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {formatRupiah(stats.receivable)}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="print:hidden flex-1 overflow-auto bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-full flex flex-col">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-10 text-center">No</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Klien & Pekerjaan</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Keuangan</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Biaya Proses</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-1/4">Keterangan</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">Memuat data...</td></tr>
                            ) : filteredJobs.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-xs">Belum ada data untuk kategori ini.</td></tr>
                            ) : (
                                filteredJobs.map((job, idx) => {
                                    const sisa = job.totalCost - job.paidAmount
                                    return (
                                        <tr key={job.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono align-top border-r border-dashed border-gray-100">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 align-top border-r border-dashed border-gray-100">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="font-bold text-sm text-gray-900">{job.clientName}</div>
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                    {job.jobName}
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                                                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {format(new Date(job.date), 'd MMM yyyy', { locale: localeId })}
                                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wide ${getStatusColor(job.status)}`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top border-r border-dashed border-gray-100">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[11px] gap-4 group/cost cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const el = document.getElementById(`cost-details-${job.id}`)
                                                            if (el) el.classList.toggle('hidden')
                                                        }}
                                                    >
                                                        <span className="text-gray-500 border-b border-dashed border-gray-300 hover:border-gray-500 transition-colors">Biaya:</span>
                                                        <span className="font-medium text-gray-900 group-hover/cost:text-blue-600 transition-colors">{formatRupiah(job.totalCost)}</span>
                                                    </div>

                                                    {/* Cost Details Breakdown */}
                                                    <div id={`cost-details-${job.id}`} className="hidden pl-2 border-l-2 border-gray-100 my-1 space-y-1">
                                                        {(job.costItems || []).length > 0 ? (
                                                            job.costItems?.map((item, i) => (
                                                                <div key={i} className="flex justify-between text-[10px] text-gray-500">
                                                                    <span>{item.name}</span>
                                                                    <span className="text-gray-700">{formatRupiah(item.amount)}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-[10px] text-gray-400 italic">Tidak ada rincian</div>
                                                        )}
                                                        <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between text-[10px] font-semibold text-gray-900">
                                                            <span>Total</span>
                                                            <span>{formatRupiah(job.totalCost)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between text-[11px] gap-4 group/payment cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const el = document.getElementById(`payment-details-${job.id}`)
                                                            if (el) el.classList.toggle('hidden')
                                                        }}
                                                    >
                                                        <span className="text-gray-500 border-b border-dashed border-green-300 hover:border-green-500 transition-colors">Bayar:</span>
                                                        <span className="font-medium text-green-600 group-hover/payment:text-green-700 transition-colors">{formatRupiah(job.paidAmount)}</span>
                                                    </div>

                                                    {/* Payment Termin Breakdown */}
                                                    {(job.paymentTermins && job.paymentTermins.length > 0) && (
                                                        <div id={`payment-details-${job.id}`} className="hidden pl-2 border-l-2 border-green-100 my-1 space-y-1">
                                                            {job.paymentTermins.map((termin, i) => (
                                                                <div key={i} className="flex justify-between text-[10px] text-gray-600">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="font-medium">Termin {termin.terminNumber}</span>
                                                                        <span className="text-gray-400">({format(new Date(termin.date), 'd MMM', { locale: localeId })})</span>
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleOpenAttachment('termin', i, termin.attachmentUrl, `Bukti Bayar Termin ${termin.terminNumber}`, job.id)
                                                                            }}
                                                                            className={`p-1 rounded transition-colors ${termin.attachmentUrl ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                                                            title={termin.attachmentUrl ? "Lihat Bukti" : "Upload Bukti"}
                                                                        >
                                                                            <Paperclip className="w-3 h-3" />
                                                                        </button>
                                                                        <span className="text-green-700 font-medium">{formatRupiah(termin.amount)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="border-t border-green-100 pt-1 mt-1 flex justify-between text-[10px] font-semibold text-green-700">
                                                                <span>Total Bayar:</span>
                                                                <span>{formatRupiah((job.paymentTermins || []).reduce((sum, t) => sum + t.amount, 0))}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {sisa > 0 && (
                                                        <div className="flex justify-between text-[11px] gap-4 border-t border-gray-100 pt-1 mt-0.5">
                                                            <span className="text-gray-500 font-bold">Sisa:</span>
                                                            <span className="font-bold text-orange-600">{formatRupiah(sisa)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top border-r border-dashed border-gray-100">
                                                <div className="flex flex-col gap-1">
                                                    {/* Total Biaya Proses (Budget) */}
                                                    {(job.totalBudgetBiayaProses && job.totalBudgetBiayaProses > 0) ? (
                                                        <>
                                                            <div className="flex justify-between text-[11px] gap-4 mb-1">
                                                                <span className="text-gray-700 font-bold">Total Biaya Proses:</span>
                                                                <span className="font-bold text-blue-700">{formatRupiah(job.totalBudgetBiayaProses)}</span>
                                                            </div>

                                                            {/* Process Items Breakdown */}
                                                            {(job.processItems || []).length > 0 && (
                                                                <div className="pl-2 border-l-2 border-gray-100 space-y-1 mb-1">
                                                                    <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Alokasi Biaya:</div>
                                                                    {job.processItems?.map((item, i) => (
                                                                        <div key={i} className="flex justify-between text-[10px] text-gray-500 items-center">
                                                                            <span>{item.name}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        handleOpenAttachment('process', i, item.attachmentUrl, `Bukti Bayar ${item.name || 'Biaya'}`, job.id)
                                                                                    }}
                                                                                    className={`p-1 rounded transition-colors ${item.attachmentUrl ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                                                                    title={item.attachmentUrl ? "Lihat Bukti" : "Upload Bukti"}
                                                                                >
                                                                                    <Paperclip className="w-3 h-3" />
                                                                                </button>
                                                                                <span className="text-gray-700">{formatRupiah(item.amount)}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Total Pengeluaran */}
                                                            <div className="flex justify-between text-[11px] gap-4 border-t border-gray-200 pt-1">
                                                                <span className="text-gray-600 font-medium">Total Pengeluaran:</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {formatRupiah((job.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                                                                </span>
                                                            </div>

                                                            {/* Sisa Margin */}
                                                            {(() => {
                                                                const totalPengeluaran = (job.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                                                const sisaMargin = (job.totalBudgetBiayaProses || 0) - totalPengeluaran
                                                                return (
                                                                    <div className="flex justify-between text-[11px] gap-4 border-t border-gray-200 pt-1">
                                                                        <span className="text-gray-700 font-bold">Sisa Margin:</span>
                                                                        <span className={`font-bold ${sisaMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                            {formatRupiah(sisaMargin)}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            })()}
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-xs text-gray-600 align-top leading-relaxed border-r border-dashed border-gray-100">
                                                <NotesCell job={job} onSave={handleUpdateNotes} />
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(job)}
                                                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(job.id)}
                                                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-gray-800">
                                {editingJob ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">

                                {/* Kategori Readonly (sesuai tab aktif saat ini agar user tidak bingung) */}
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                                        <div className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
                                            {formData.category}
                                        </div>
                                    </div>
                                    <div className="w-2/3">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Proses</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Nama Klien</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: Pa Iip Priatna"
                                            value={formData.clientName}
                                            onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pekerjaan</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: Pengukuran & Warkah Desa"
                                            value={formData.jobName}
                                            onChange={e => setFormData({ ...formData, jobName: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-3 space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-gray-700">Rincian Biaya</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newItems = [...(formData.costItems || []), { name: '', amount: 0 }]
                                                    setFormData({ ...formData, costItems: newItems })
                                                }}
                                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-semibold"
                                            >
                                                + Tambah Item
                                            </button>
                                        </div>

                                        {(formData.costItems || []).map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Nama Biaya (ex: Pajak)"
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const newItems = [...(formData.costItems || [])]
                                                        newItems[idx].name = e.target.value
                                                        setFormData({ ...formData, costItems: newItems })
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={item.amount}
                                                    onChange={(e) => {
                                                        const newItems = [...(formData.costItems || [])]
                                                        newItems[idx].amount = Number(e.target.value)
                                                        const newTotal = newItems.reduce((sum, curr) => sum + (curr.amount || 0), 0)
                                                        setFormData({ ...formData, costItems: newItems, totalCost: newTotal })
                                                    }}
                                                    className="w-24 border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newItems = (formData.costItems || []).filter((_, i) => i !== idx)
                                                        const newTotal = newItems.reduce((sum, curr) => sum + (curr.amount || 0), 0)
                                                        setFormData({ ...formData, costItems: newItems, totalCost: newTotal })
                                                    }}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                            <span className="text-xs font-bold text-gray-600">Total Biaya:</span>
                                            <span className="text-sm font-bold text-gray-900">{formatRupiah(formData.totalCost || 0)}</span>
                                        </div>
                                    </div>

                                    <div className="col-span-3 space-y-3 border border-gray-200 rounded-lg p-3 bg-red-50/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-red-900">Biaya Proses (Internal Expenses & Margin)</label>
                                        </div>

                                        {/* Total Budget Biaya Proses */}
                                        <div className="mb-3 pb-3 border-b border-red-200">
                                            <label className="block text-xs font-bold text-red-800 mb-1">Total Biaya Proses (Budget)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={formData.totalBudgetBiayaProses || ''}
                                                onChange={e => setFormData({ ...formData, totalBudgetBiayaProses: Number(e.target.value) })}
                                                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                            />
                                            <p className="text-[10px] text-red-600 mt-1 italic">Budget awal untuk operasional pekerjaan ini</p>
                                        </div>

                                        {/* Alokasi Biaya Items */}
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-red-800">Alokasi Biaya (Pengeluaran)</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newItems = [...(formData.processItems || []), { name: '', amount: 0 }]
                                                    setFormData({ ...formData, processItems: newItems })
                                                }}
                                                className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-semibold"
                                            >
                                                + Tambah Item
                                            </button>
                                        </div>

                                        {(formData.processItems || []).map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Nama Biaya (ex: PNBP)"
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const newItems = [...(formData.processItems || [])]
                                                        newItems[idx].name = e.target.value
                                                        setFormData({ ...formData, processItems: newItems })
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={item.amount}
                                                    onChange={(e) => {
                                                        const newItems = [...(formData.processItems || [])]
                                                        newItems[idx].amount = Number(e.target.value)
                                                        setFormData({ ...formData, processItems: newItems })
                                                    }}
                                                    className="w-24 border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none text-right"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAttachment('process', idx, item.attachmentUrl, `Bukti ${item.name || 'Biaya'}`)}
                                                    className={`p-1.5 rounded transition-colors ${item.attachmentUrl ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                    title={item.attachmentUrl ? "Lihat Bukti" : "Upload Bukti"}
                                                >
                                                    <Paperclip className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newItems = (formData.processItems || []).filter((_, i) => i !== idx)
                                                        setFormData({ ...formData, processItems: newItems })
                                                    }}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <div className="space-y-1 pt-2 border-t border-red-200 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-red-700">Total Pengeluaran:</span>
                                                <span className="text-sm font-medium text-red-900">
                                                    {formatRupiah((formData.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                                                </span>
                                            </div>
                                            {(formData.totalBudgetBiayaProses && formData.totalBudgetBiayaProses > 0) && (
                                                <div className="flex justify-between items-center pt-1 border-t border-red-200">
                                                    <span className="text-xs font-bold text-red-800">Sisa Margin:</span>
                                                    <span className={`text-sm font-bold ${(() => {
                                                        const totalPengeluaran = (formData.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                                        const sisaMargin = (formData.totalBudgetBiayaProses || 0) - totalPengeluaran
                                                        return sisaMargin >= 0 ? 'text-green-600' : 'text-red-600'
                                                    })()}`}>
                                                        {formatRupiah(
                                                            (formData.totalBudgetBiayaProses || 0) -
                                                            (formData.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Termin Section */}
                                    <div className="col-span-3 space-y-3 border border-gray-200 rounded-lg p-3 bg-green-50/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-green-900">Pembayaran (Termin)</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newTermins = [...(formData.paymentTermins || [])]
                                                    const nextNumber = newTermins.length + 1
                                                    newTermins.push({
                                                        terminNumber: nextNumber,
                                                        date: format(new Date(), 'yyyy-MM-dd'),
                                                        amount: 0,
                                                        notes: ''
                                                    })
                                                    setFormData({ ...formData, paymentTermins: newTermins })
                                                }}
                                                className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-semibold"
                                            >
                                                + Tambah Termin
                                            </button>
                                        </div>

                                        {(formData.paymentTermins || []).length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-xs text-gray-500 italic">Belum ada pembayaran termin.</p>
                                                <p className="text-[10px] text-gray-400 mt-1">Klik "Tambah Termin" untuk menambahkan cicilan pembayaran</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {(formData.paymentTermins || []).map((termin, idx) => (
                                                    <div key={idx} className="bg-white p-2 rounded border border-green-200">
                                                        <div className="flex gap-2 items-start">
                                                            <div className="flex-shrink-0">
                                                                <label className="block text-[10px] font-bold text-green-800 mb-1">Termin</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={termin.terminNumber}
                                                                    onChange={(e) => {
                                                                        const newTermins = [...(formData.paymentTermins || [])]
                                                                        newTermins[idx].terminNumber = Number(e.target.value)
                                                                        setFormData({ ...formData, paymentTermins: newTermins })
                                                                    }}
                                                                    className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-green-500 outline-none text-center"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-green-800 mb-1">Tanggal Bayar</label>
                                                                <input
                                                                    type="date"
                                                                    value={termin.date}
                                                                    onChange={(e) => {
                                                                        const newTermins = [...(formData.paymentTermins || [])]
                                                                        newTermins[idx].date = e.target.value
                                                                        setFormData({ ...formData, paymentTermins: newTermins })
                                                                    }}
                                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-green-500 outline-none"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-green-800 mb-1">Jumlah</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    value={termin.amount}
                                                                    onChange={(e) => {
                                                                        const newTermins = [...(formData.paymentTermins || [])]
                                                                        newTermins[idx].amount = Number(e.target.value)
                                                                        setFormData({ ...formData, paymentTermins: newTermins })
                                                                    }}
                                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-green-500 outline-none text-right"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1 mt-5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenAttachment('termin', idx, termin.attachmentUrl, `Bukti Termin ${termin.terminNumber}`)}
                                                                    className={`p-1.5 rounded transition-colors ${termin.attachmentUrl ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                                    title={termin.attachmentUrl ? "Lihat Bukti" : "Upload Bukti"}
                                                                >
                                                                    <Paperclip className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newTermins = (formData.paymentTermins || []).filter((_, i) => i !== idx)
                                                                        setFormData({ ...formData, paymentTermins: newTermins })
                                                                    }}
                                                                    className="text-gray-400 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-2 border-t border-green-200 mt-2">
                                            <span className="text-xs font-bold text-green-800">Total Pembayaran:</span>
                                            <span className="text-sm font-bold text-green-700">
                                                {formatRupiah((formData.paymentTermins || []).reduce((sum, t) => sum + t.amount, 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-3"></div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as JobStatus })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="Baru">Baru</option>
                                            <option value="Proses">Proses</option>
                                            <option value="Selesai">Selesai</option>
                                            <option value="Tertunda">Tertunda</option>
                                            <option value="Batal">Batal</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Progres</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Catatan tambahan mengenai status pekerjaan..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>

                            </div>

                            {/* Fixed Footer with Buttons */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- PRINT TEMPLATE --- */}
            {/* --- PRINT TEMPLATE --- */}
            <div id="print-report-area" className="hidden print:block p-8 font-serif text-gray-900 bg-white">
                {/* Header Section */}
                <div className="flex justify-between items-end border-b-4 border-double border-gray-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider leading-none mb-2">Laporan Pembukuan</h1>
                        <p className="text-sm italic text-gray-600 font-medium">Monitoring Pekerjaan & Keuangan Klien</p>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold uppercase tracking-wide text-gray-900">Kantor Notaris & PPAT</div>
                        <div className="text-xl font-bold text-gray-900 mb-1">Havis Akbar, S.H., M.Kn.</div>
                        <div className="text-xs text-gray-500 mt-2 flex flex-col gap-0.5">
                            <span>Periode: {new Date().getFullYear()}</span>
                            <span>Kategori Laporan: <span className="font-bold text-black uppercase">{activeCategory}</span></span>
                        </div>
                    </div>
                </div>

                {/* Financial Summary Dashboard */}
                <div className="flex border-y-2 border-gray-800 mb-8 divide-x-2 divide-gray-800 bg-gray-50/50">
                    <div className="flex-1 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Total Nilai Transaksi</p>
                        <p className="text-xl font-bold font-mono">{formatRupiah(stats.total)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Total Penerimaan (Masuk)</p>
                        <p className="text-xl font-bold font-mono text-green-800">{formatRupiah(stats.paid)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Sisa Piutang (Receivable)</p>
                        <p className="text-xl font-bold font-mono text-orange-700">{formatRupiah(stats.receivable)}</p>
                    </div>
                    <div className="flex-1 p-4 text-center bg-gray-100">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Estimasi Margin</p>
                        <p className="text-xl font-bold font-mono text-blue-800">
                            {formatRupiah(filteredJobs.reduce((acc, job) => {
                                const totalPengeluaran = (job.processItems || []).reduce((sum, item) => sum + (item.amount || 0), 0)
                                return acc + ((job.totalBudgetBiayaProses || 0) - totalPengeluaran)
                            }, 0))}
                        </p>
                    </div>
                </div>

                {/* Main Data Table */}
                <table className="w-full text-[11px] border-collapse mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-800 bg-gray-50">
                            <th className="py-3 px-2 text-left font-bold uppercase tracking-wider w-8">No</th>
                            <th className="py-3 px-2 text-left font-bold uppercase tracking-wider w-1/4">Uraian Pekerjaan</th>
                            <th className="py-3 px-2 text-right font-bold uppercase tracking-wider">Status Keuangan</th>
                            <th className="py-3 px-2 text-right font-bold uppercase tracking-wider">Analisa Biaya</th>
                            <th className="py-3 px-2 text-left font-bold uppercase tracking-wider w-1/6">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredJobs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-400 italic text-sm">
                                    Tidak ada data pekerjaan untuk ditampilkan.
                                </td>
                            </tr>
                        ) : (
                            filteredJobs.map((job, idx) => {
                                const sisa = job.totalCost - job.paidAmount
                                const totalPengeluaran = (job.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                const sisaMargin = (job.totalBudgetBiayaProses || 0) - totalPengeluaran

                                return (
                                    <tr key={job.id} className="group break-inside-avoid">
                                        <td className="py-4 px-2 align-top text-gray-500 font-mono">{idx + 1}</td>

                                        {/* Column: Uraian Pekerjaan */}
                                        <td className="py-4 px-2 align-top">
                                            <div className="mb-1">
                                                <span className="font-bold text-sm text-black block">{job.clientName}</span>
                                                <span className="text-gray-600 italic block mt-0.5 leading-snug">{job.jobName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 text-[10px]">
                                                <span className="px-2 py-0.5 rounded border border-gray-300 bg-gray-50 font-medium uppercase tracking-wide">
                                                    {job.status}
                                                </span>
                                                <span className="text-gray-500">
                                                    {format(new Date(job.date), 'd MMMM yyyy', { locale: localeId })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Column: Status Keuangan (Bill & Payments) */}
                                        <td className="py-4 px-2 align-top text-right">
                                            <div className="flex flex-col gap-2 h-full">
                                                <div className="pb-2 border-b border-gray-100 border-dashed">
                                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-0.5">Nilai Tagihan</div>
                                                    <div className="font-mono font-bold text-sm">{formatRupiah(job.totalCost)}</div>
                                                    {/* Condensed Cost Items */}
                                                    {job.costItems && job.costItems.length > 0 && (
                                                        <div className="mt-1 text-[9px] text-gray-500 leading-tight opacity-80">
                                                            {job.costItems.map(i => i.name).join(', ')}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Riwayat Bayar</div>
                                                    {job.paymentTermins && job.paymentTermins.length > 0 ? (
                                                        <ul className="space-y-0.5">
                                                            {job.paymentTermins.map((t, i) => (
                                                                <li key={i} className="text-[10px] flex justify-between gap-4 font-mono">
                                                                    <span className="text-gray-600">T{t.terminNumber} ({format(new Date(t.date), 'dd/MM')})</span>
                                                                    <span>{formatRupiah(t.amount)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic">- Belum ada pembayaran -</span>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-gray-300">
                                                    {sisa > 0 ? (
                                                        <div className="flex justify-between items-center bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                                            <span className="font-bold text-orange-800 text-[10px] uppercase">Sisa Piutang</span>
                                                            <span className="font-bold font-mono text-orange-800">{formatRupiah(sisa)}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-green-50 px-2 py-1 rounded border border-green-100 text-center">
                                                            <span className="font-bold text-green-800 text-[10px] uppercase tracking-widest">LUNAS</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Column: Analisa Biaya (Budget & Expenses) */}
                                        <td className="py-4 px-2 align-top text-right bg-gray-50/30">
                                            {job.totalBudgetBiayaProses ? (
                                                <div className="flex flex-col gap-2 h-full">
                                                    <div className="flex justify-between items-baseline gap-4">
                                                        <span className="text-[10px] uppercase text-gray-500 font-bold">Budget</span>
                                                        <span className="font-mono font-medium">{formatRupiah(job.totalBudgetBiayaProses)}</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-baseline gap-4 mb-1">
                                                            <span className="text-[10px] uppercase text-gray-500 font-bold">Realisasi</span>
                                                            <span className="font-mono font-medium text-red-700">({formatRupiah(totalPengeluaran)})</span>
                                                        </div>
                                                        {/* Condensed Process Items */}
                                                        {job.processItems && job.processItems.length > 0 && (
                                                            <div className="text-[9px] text-gray-500 font-mono space-y-0.5 border-l-2 border-gray-200 pl-2 ml-auto w-fit">
                                                                {job.processItems.map((item, i) => (
                                                                    <div key={i} className="flex justify-end gap-2">
                                                                        <span className="truncate max-w-[80px]">{item.name}</span>
                                                                        <span>{formatRupiah(item.amount)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-2 border-t border-gray-300">
                                                        <div className={`flex justify-between items-center px-2 py-1 rounded border ${sisaMargin >= 0 ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                                            <span className="font-bold text-[10px] uppercase">Margin</span>
                                                            <span className="font-bold font-mono">{formatRupiah(sisaMargin)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-400 italic py-2">- Tidak ada budget -</div>
                                            )}
                                        </td>

                                        {/* Column: Catatan */}
                                        <td className="py-4 px-2 align-top text-xs text-gray-600 italic">
                                            {job.notes ? (
                                                <p className="whitespace-pre-wrap leading-relaxed border-l-2 border-gray-200 pl-2">
                                                    {job.notes}
                                                </p>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>

                {/* Footer Signature */}
                <div className="mt-16 break-inside-avoid">
                    <div className="flex justify-between items-end text-sm font-serif">
                        <div className="text-gray-500 text-xs">
                            <p>Dokumen ini dicetak otomatis pada: <span className="text-black font-medium">{format(new Date(), 'EEEE, d MMMM yyyy, HH:mm', { locale: localeId })}</span></p>
                            <p className="mt-1">Halaman ini memuat {filteredJobs.length} data pekerjaan.</p>
                        </div>
                        <div className="text-center w-64">
                            <p className="mb-16">Mengetahui,</p>
                            <p className="font-bold border-b border-black pb-1 mb-1 text-lg">Havis Akbar, S.H., M.Kn.</p>
                            <p className="text-xs uppercase tracking-widest text-gray-500">Notaris & PPAT</p>
                        </div>
                    </div>
                </div>
            </div>


            <AttachmentModal
                isOpen={attachmentModalState.isOpen}
                onClose={() => setAttachmentModalState(prev => ({ ...prev, isOpen: false }))}
                currentUrl={attachmentModalState.currentUrl}
                onUpload={handleUploadAttachment}
                onRemove={handleRemoveAttachment}
                title={attachmentModalState.title}
                uploading={isUploading}
            />
        </div >
    )
}