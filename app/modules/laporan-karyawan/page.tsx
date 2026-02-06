'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getEmployees, saveEmployee, updateAttendance, updateEntryTime, type Employee } from './actions'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, getDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function LaporanKaryawanPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Filter Periode
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    // Modal Add Employee
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newEmpName, setNewEmpName] = useState('')
    const [newEmpPayDate, setNewEmpPayDate] = useState(18)
    const [newEmpAllowance, setNewEmpAllowance] = useState(50000)

    // Modal Detail Tanggal (Status & Jam Masuk)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [detailStatus, setDetailStatus] = useState('Hadir')
    const [detailEntryTime, setDetailEntryTime] = useState('')

    // Load Data
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const data = await getEmployees()
        setEmployees(data)
        if (data.length > 0 && !selectedEmployeeId) {
            setSelectedEmployeeId(data[0].id)
        }
        setLoading(false)
    }

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        const newEmployee: Employee = {
            id: generateUUID(),
            name: newEmpName,
            paydayDate: Number(newEmpPayDate),
            mealAllowance: Number(newEmpAllowance),
            createdAt: new Date().toISOString(),
            attendanceOverrides: {},
            entryTimes: {}
        }
        await saveEmployee(newEmployee)
        await loadData()
        setIsAddModalOpen(false)
        setNewEmpName('')
        setNewEmpAllowance(50000)
        setSelectedEmployeeId(newEmployee.id)
    }

    // --- LOGIKA PERHITUNGAN TANGGAL ---

    const selectedEmployee = useMemo(() =>
        employees.find(e => e.id === selectedEmployeeId),
        [employees, selectedEmployeeId])

    const dateRange = useMemo(() => {
        if (!selectedEmployee) return []
        const paydayDate = selectedEmployee.paydayDate
        const endDate = new Date(selectedYear, selectedMonth, paydayDate)
        const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1)
        const startDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), paydayDate + 1)

        const dates = []
        let currentDate = new Date(startDate)
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate))
            currentDate.setDate(currentDate.getDate() + 1)
        }
        return dates
    }, [selectedEmployee, selectedMonth, selectedYear])

    // --- LOGIKA STATUS & KALKULASI ---

    const getStatus = (date: Date, emp: Employee) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        if (emp.attendanceOverrides && emp.attendanceOverrides[dateStr]) {
            return emp.attendanceOverrides[dateStr]
        }
        const day = date.getDay()
        if (day === 0 || day === 6) return 'Libur'
        return 'Hadir'
    }

    const getEntryTime = (date: Date, emp: Employee) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return emp.entryTimes?.[dateStr] || ''
    }

    const calculation = useMemo(() => {
        if (!selectedEmployee) return { totalDays: 0, workDays: 0, totalAllowance: 0 }
        let workDays = 0
        dateRange.forEach(date => {
            const status = getStatus(date, selectedEmployee)
            if (status === 'Hadir') {
                workDays++
            }
        })
        return {
            totalDays: dateRange.length,
            workDays,
            totalAllowance: workDays * selectedEmployee.mealAllowance
        }
    }, [dateRange, selectedEmployee])

    // --- FORMATTER ---
    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

    // --- LOGIKA GROUPING MINGGUAN ---
    const weeklyData = useMemo(() => {
        if (dateRange.length === 0) return []
        const weeks: (Date | null)[][] = []
        const startDate = dateRange[0]
        const endDate = dateRange[dateRange.length - 1]
        let currentDay = startOfWeek(startDate, { weekStartsOn: 1 })
        const lastDay = endOfWeek(endDate, { weekStartsOn: 1 })
        let currentWeek: (Date | null)[] = []

        while (currentDay <= lastDay) {
            const dayOfWeek = getDay(currentDay)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const isInRange = dateRange.some(d => isSameDay(d, currentDay))
                currentWeek.push(isInRange ? currentDay : null)
            }
            if (dayOfWeek === 5) {
                weeks.push(currentWeek)
                currentWeek = []
                currentDay = addDays(currentDay, 3)
            } else {
                currentDay = addDays(currentDay, 1)
            }
        }
        return weeks
    }, [dateRange])

    const columnTotals = useMemo(() => {
        const totals = [0, 0, 0, 0, 0] // Mon-Fri
        dateRange.forEach(date => {
            const day = getDay(date)
            const status = getStatus(date, selectedEmployee!)
            if (day >= 1 && day <= 5 && status === 'Hadir') {
                totals[day - 1]++
            }
        })
        return totals
    }, [dateRange, selectedEmployee])

    // --- HELPERS ---
    const isToday = (date: Date) => {
        return isSameDay(date, new Date())
    }

    const isPastDate = (date: Date | null) => {
        if (!date) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    // --- BUTTON/MODAL HANDLERS ---
    const handleDateClick = (date: Date) => {
        if (!selectedEmployee) return
        setSelectedDate(date)
        setDetailStatus(getStatus(date, selectedEmployee))
        setDetailEntryTime(getEntryTime(date, selectedEmployee))
        setIsDetailModalOpen(true)
    }

    const handleSaveDetail = async () => {
        if (!selectedEmployeeId || !selectedDate) return

        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        // Optimistic Update
        setEmployees(prev => prev.map(emp => {
            if (emp.id === selectedEmployeeId) {
                const updatedOverrides = { ...emp.attendanceOverrides }
                const updatedEntryTimes = { ...emp.entryTimes } || {}

                // Update Status
                if (detailStatus === 'Hadir') delete updatedOverrides[dateStr]
                else updatedOverrides[dateStr] = detailStatus

                // Update Entry Time
                if (!detailEntryTime) delete updatedEntryTimes[dateStr]
                else updatedEntryTimes[dateStr] = detailEntryTime

                return {
                    ...emp,
                    attendanceOverrides: updatedOverrides,
                    entryTimes: updatedEntryTimes
                }
            }
            return emp
        }))

        setIsDetailModalOpen(false)
        await Promise.all([
            updateAttendance(selectedEmployeeId, dateStr, detailStatus),
            updateEntryTime(selectedEmployeeId, dateStr, detailEntryTime)
        ])
    }

    const getCellColor = (date: Date | null) => {
        if (!date) return 'bg-gray-100'
        const status = getStatus(date, selectedEmployee!)

        if (status === 'Sakit') return 'bg-red-50'
        if (status === 'Izin') return 'bg-yellow-50'
        if (status === 'Libur') return 'bg-red-100'

        return 'bg-white'
    }

    const getStatusColor = (date: Date | null) => {
        if (!date) return ''
        const status = getStatus(date, selectedEmployee!)
        if (status === 'Sakit') return 'text-red-600 font-bold'
        if (status === 'Izin') return 'text-yellow-600 font-bold'
        if (status === 'Libur') return 'text-red-500 font-bold'
        return 'text-gray-900'
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
                <div className="p-4 border-b border-gray-100">
                    <h1 className="font-bold text-lg text-gray-800 tracking-tight">Data Karyawan</h1>
                    <p className="text-xs text-gray-400 mt-1">Pilih karyawan untuk melihat laporan</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="text-center py-4 text-xs text-gray-400">Loading...</div>
                    ) : employees.map(emp => (
                        <button
                            key={emp.id}
                            onClick={() => setSelectedEmployeeId(emp.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${selectedEmployeeId === emp.id
                                    ? 'bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-200 shadow-sm'
                                    : 'hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <span>{emp.name}</span>
                            {selectedEmployeeId === emp.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            )}
                        </button>
                    ))}
                </div>
                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>+ Tambah Karyawan</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                {/* Navbar / Filter Toolbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Periode Laporan</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <span className="text-gray-300">/</span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 flex justify-center">
                    {selectedEmployee && dateRange.length > 0 ? (
                        <div className="bg-white shadow-xl rounded-none w-[900px] shrink-0 border border-gray-300">
                            {/* Report Header */}
                            <div className="bg-[#1e3a8a] text-white text-center py-4 border-b border-gray-800">
                                <h1 className="text-2xl font-bold uppercase tracking-widest">Notaris & PPAT Havis Akbar</h1>
                            </div>
                            <div className="bg-gray-100 text-gray-700 text-center py-2 border-b border-gray-300 text-sm font-semibold uppercase tracking-wide">
                                Laporan Uang Makan — {format(dateRange[0], 'd MMMM', { locale: localeId })} s/d {format(dateRange[dateRange.length - 1], 'd MMMM yyyy', { locale: localeId })}
                            </div>

                            {/* Calendar Table */}
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-800 text-white text-sm">
                                        <th className="border border-gray-600 px-4 py-3 w-48 text-left uppercase tracking-wider font-semibold">Nama Karyawan</th>
                                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                                            <th key={day} className="border border-gray-600 px-2 py-3 w-32 font-semibold">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {weeklyData.map((week, wIdx) => (
                                        <tr key={wIdx}>
                                            {/* Employee Name (Merged) */}
                                            {wIdx === 0 && (
                                                <td rowSpan={weeklyData.length} className="border border-gray-300 bg-gray-50 px-6 py-4 font-bold text-xl text-gray-800 align-middle">
                                                    {selectedEmployee.name}
                                                </td>
                                            )}

                                            {/* Days */}
                                            {week.map((date, dIdx) => (
                                                <td
                                                    key={dIdx}
                                                    className={`border border-gray-300 h-24 p-2 relative align-top transition-all 
                                                        ${getCellColor(date)} 
                                                        ${date ? 'cursor-pointer hover:bg-blue-50' : ''}
                                                        ${date && isToday(date) ? '!bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''}
                                                    `}
                                                    onClick={() => date && handleDateClick(date)}
                                                >
                                                    {date && (
                                                        <div className="flex flex-col h-full justify-between">
                                                            <div className="flex justify-between items-start">
                                                                <span className={`text-lg font-bold leading-none ${isToday(date) ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                    {format(date, 'd')}
                                                                </span>
                                                                <span className={`text-[10px] uppercase tracking-tighter ${getStatusColor(date)}`}>
                                                                    {getStatus(date, selectedEmployee) !== 'Hadir' ? getStatus(date, selectedEmployee) : ''}
                                                                </span>
                                                            </div>

                                                            {/* Jam Masuk Display */}
                                                            {getEntryTime(date, selectedEmployee) && (
                                                                <div className="self-center mb-1">
                                                                    <div className="bg-blue-100 text-blue-800 text-xs font-mono font-medium px-2 py-1 rounded inline-block">
                                                                        {getEntryTime(date, selectedEmployee)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-100">
                                        <td className="border border-gray-300 px-4 py-3 font-bold text-right text-gray-500 uppercase text-xs">Total Kehadiran</td>
                                        {columnTotals.map((total, i) => (
                                            <td key={i} className="border border-gray-300 text-center font-bold text-lg text-gray-900 py-3">{total}</td>
                                        ))}
                                    </tr>
                                    <tr className="bg-gray-800 text-white">
                                        <td colSpan={6} className="border border-gray-800 px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-4 text-lg">
                                                <span className="font-light opacity-80">Total Terima:</span>
                                                <span className="font-bold text-2xl tracking-wide">{formatRupiah(calculation.totalAllowance)}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                                                Based on {calculation.workDays} work days @ {formatRupiah(selectedEmployee.mealAllowance)}
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <span className="text-lg font-medium">Pilih karyawan untuk melihat laporan</span>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Detail Tanggal */}
            {isDetailModalOpen && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <div className="text-center mb-6">
                            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Edit Detail</h3>
                            <h2 className="text-2xl font-bold text-gray-900">{format(selectedDate, 'd MMMM yyyy', { locale: localeId })}</h2>
                            {isToday(selectedDate) && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1">HARI INI</span>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Status Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status Kehadiran</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Hadir', 'Sakit', 'Izin', 'Libur'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setDetailStatus(status)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${detailStatus === status
                                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Jam Masuk Section */}
                            <div className={`transition-all duration-300 ${detailStatus !== 'Hadir' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jam Masuk</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        value={detailEntryTime}
                                        onChange={(e) => setDetailEntryTime(e.target.value)}
                                        disabled={isPastDate(selectedDate)}
                                        className={`w-full text-center text-xl font-mono p-3 border rounded-lg outline-none transition-all placeholder-gray-300
                                            ${isPastDate(selectedDate)
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                                : 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                        `}
                                    />
                                    {isPastDate(selectedDate) && (
                                        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 text-center pointer-events-none">

                                        </div>
                                    )}
                                </div>
                                {isPastDate(selectedDate) ? (
                                    <p className="text-xs text-red-500 mt-2 text-center italic font-medium">Tidak dapat mengubah jam (Hari sudah lewat)</p>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-2 text-center">Biarkan kosong jika tidak ingin mencatat jam.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveDetail}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Karyawan */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Karyawan Baru</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={newEmpName}
                                    onChange={e => setNewEmpName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    placeholder="Nama karyawan"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tgl Gajian</label>
                                    <input
                                        type="number"
                                        min="1" max="28"
                                        required
                                        value={newEmpPayDate}
                                        onChange={e => setNewEmpPayDate(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Uang Makan</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        required
                                        value={newEmpAllowance}
                                        onChange={e => setNewEmpAllowance(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Batal</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}