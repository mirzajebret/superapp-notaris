'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getJobs, saveJob, deleteJob, type Job, type JobCategory, type JobStatus } from './actions'
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
        processItems: []
    })

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
                job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.notes.toLowerCase().includes(searchTerm.toLowerCase())
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

        const jobToSave: Job = {
            id: editingJob ? editingJob.id : generateUUID(),
            category: formData.category as JobCategory,
            clientName: formData.clientName || '',
            jobName: formData.jobName || '',
            date: formData.date || format(new Date(), 'yyyy-MM-dd'),
            status: formData.status as JobStatus,
            totalCost: Number(formData.totalCost),
            paidAmount: Number(formData.paidAmount),
            notes: formData.notes || '',
            createdAt: editingJob?.createdAt || new Date().toISOString(),
            costItems: formData.costItems || [],
            processItems: formData.processItems || []
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
            processItems: []
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

        setFormData({ ...job, costItems: initialItems, processItems: job.processItems || [] })
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingJob(null)
    }

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
            <div className="px-5 py-4 border-b border-gray-200 bg-white shrink-0">
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

                    <div className="flex gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari klien, pekerjaan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-48"
                            />
                            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Baru
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
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-full flex flex-col">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-10 text-center">No</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Klien & Pekerjaan</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Status & Tanggal</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Keuangan</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Biaya Proses</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-1/4">Keterangan</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">Memuat data...</td></tr>
                            ) : filteredJobs.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-xs">Belum ada data untuk kategori ini.</td></tr>
                            ) : (
                                filteredJobs.map((job, idx) => {
                                    const sisa = job.totalCost - job.paidAmount
                                    return (
                                        <tr key={job.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono align-top border-r border-dashed border-gray-100">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 align-top border-r border-dashed border-gray-100">
                                                <div className="font-bold text-sm text-gray-900">{job.clientName}</div>
                                                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                    {job.jobName}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top border-r border-dashed border-gray-100">
                                                <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wide mb-1.5 ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </span>
                                                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {format(new Date(job.date), 'd MMM yyyy', { locale: localeId })}
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

                                                    <div className="flex justify-between text-[11px] gap-4">
                                                        <span className="text-gray-500">Bayar:</span>
                                                        <span className="font-medium text-green-600">{formatRupiah(job.paidAmount)}</span>
                                                    </div>
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
                                                    {(job.processItems || []).length > 0 ? (
                                                        <>
                                                            {job.processItems?.map((item, i) => (
                                                                <div key={i} className="flex justify-between text-[10px] text-gray-500">
                                                                    <span>{item.name}</span>
                                                                    <span className="text-gray-700">{formatRupiah(item.amount)}</span>
                                                                </div>
                                                            ))}
                                                            <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between text-[10px] font-bold text-gray-900">
                                                                <span>Total</span>
                                                                <span>
                                                                    {formatRupiah((job.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                                                                </span>
                                                            </div>
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">
                                {editingJob ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">

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
                                        <label className="text-xs font-bold text-red-900">Estimasi Biaya Proses</label>
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
                                                onClick={() => {
                                                    const newItems = (formData.processItems || []).filter((_, i) => i !== idx)
                                                    setFormData({ ...formData, processItems: newItems })
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex justify-between items-center pt-2 border-t border-red-200 mt-2">
                                        <span className="text-xs font-bold text-red-800">Total Biaya Proses:</span>
                                        <span className="text-sm font-bold text-red-900">
                                            {formatRupiah((formData.processItems || []).reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Sudah Bayar</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.paidAmount}
                                        onChange={e => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
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

                            <div className="pt-2 flex gap-3">
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
        </div>
    )
}