'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getEmployees, saveEmployee, updateAttendance, type Employee } from './actions'
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

    // State untuk filter periode (Bulan Gaji)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newEmpName, setNewEmpName] = useState('')
    const [newEmpPayDate, setNewEmpPayDate] = useState(18)
    const [newEmpAllowance, setNewEmpAllowance] = useState(50000)

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
            attendanceOverrides: {}
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

        // End Date = Tanggal Gajian di Bulan Terpilih
        const endDate = new Date(selectedYear, selectedMonth, paydayDate)

        // Start Date = (Tanggal Gajian + 1) di Bulan Sebelumnya
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

    const handleStatusChange = async (date: Date, newStatus: string) => {
        if (!selectedEmployeeId) return
        const dateStr = format(date, 'yyyy-MM-dd')

        setEmployees(prev => prev.map(emp => {
            if (emp.id === selectedEmployeeId) {
                const updatedOverrides = { ...emp.attendanceOverrides }
                if (newStatus === 'Hadir') {
                    delete updatedOverrides[dateStr]
                } else {
                    updatedOverrides[dateStr] = newStatus
                }
                return { ...emp, attendanceOverrides: updatedOverrides }
            }
            return emp
        }))

        await updateAttendance(selectedEmployeeId, dateStr, newStatus)
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



    // --- LOGIKA GROUPING MINGGUAN (Senin - Jumat) ---
    const weeklyData = useMemo(() => {
        if (dateRange.length === 0) return []

        const weeks: (Date | null)[][] = []
        const startDate = dateRange[0]
        const endDate = dateRange[dateRange.length - 1]

        // Start from the Monday of the first week
        let currentDay = startOfWeek(startDate, { weekStartsOn: 1 }) // 1 = Senin

        // Until we pass the end date
        // We ensure we cover the full week of the end date too to complete the grid
        const lastDay = endOfWeek(endDate, { weekStartsOn: 1 })

        let currentWeek: (Date | null)[] = []

        while (currentDay <= lastDay) {
            const dayOfWeek = getDay(currentDay) // 0 = Sun, 1 = Mon ... 6 = Sat

            // We only care about Mon (1) to Fri (5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Check if this day is actually in our dateRange (part of the pay period)
                // Since dateRange is continuous, we can check boundaries or inclusion
                const isInRange = dateRange.some(d => isSameDay(d, currentDay))

                if (isInRange) {
                    currentWeek.push(currentDay)
                } else {
                    currentWeek.push(null) // Placeholder for days outside period but inside the week grid
                }
            }

            // If it's Friday (5), push the week and reset
            if (dayOfWeek === 5) {
                weeks.push(currentWeek)
                currentWeek = []
                // Skip Sat/Sun to get to next Monday
                currentDay = addDays(currentDay, 3)
            } else {
                currentDay = addDays(currentDay, 1)
            }
        }

        return weeks
    }, [dateRange])

    const columnTotals = useMemo(() => {
        const totals = [0, 0, 0, 0, 0] // Mon, Tue, Wed, Thu, Fri

        dateRange.forEach(date => {
            const day = getDay(date)
            const status = getStatus(date, selectedEmployee!)

            // Mon=1 -> index 0 ... Fri=5 -> index 4
            if (day >= 1 && day <= 5) {
                if (status === 'Hadir') {
                    totals[day - 1]++
                }
            }
        })

        return totals
    }, [dateRange, selectedEmployee, employees]) // depend on employees for status changes

    // Color Helpers
    const getCellColor = (date: Date | null) => {
        if (!date) return 'bg-gray-200' // Outside range
        const status = getStatus(date, selectedEmployee!)
        if (status === 'Hadir') return 'bg-white'
        if (status === 'Sakit') return 'bg-red-500 text-white'
        if (status === 'Izin') return 'bg-yellow-400'
        if (status === 'Libur') return 'bg-red-500 text-white' // As per image red for holidays?
        return 'bg-white'
    }

    return (
        <div className="p-4 max-w-full mx-auto font-sans text-gray-800 h-screen flex flex-col overflow-hidden bg-white">

            {/* Header Toolbar */}
            <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Laporan Karyawan</h1>
                        <p className="text-gray-500 text-xs">Pilih karyawan untuk melihat laporan</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                    >
                        <span>+ Karyawan</span>
                    </button>
                    {selectedEmployee && (
                        <div className="flex items-center gap-2 ml-4 border-l border-gray-200 pl-4">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-white border border-gray-300 text-gray-900 text-xs rounded px-2 py-1 outline-none focus:border-blue-500 shadow-sm"
                            >
                                {months.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-white border border-gray-300 text-gray-900 text-xs rounded px-2 py-1 outline-none focus:border-blue-500 shadow-sm"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                {/* Sidebar List Karyawan */}
                <div className="w-56 shrink-0 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 text-xs uppercase">Daftar Karyawan</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-xs">Memuat...</div>
                        ) : employees.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-xs">Kosong</div>
                        ) : (
                            employees.map(emp => (
                                <button
                                    key={emp.id}
                                    onClick={() => setSelectedEmployeeId(emp.id)}
                                    className={`w-full text-left px-3 py-2 text-xs rounded mb-0.5 transition-all flex justify-between items-center ${selectedEmployeeId === emp.id
                                        ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="truncate">{emp.name}</span>
                                    <span className="text-[9px] text-gray-400 bg-white px-1 rounded border border-gray-100">
                                        Tgl {emp.paydayDate}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area - Compact Table */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6 rounded-lg border border-gray-200 flex justify-center items-start">
                    {selectedEmployee && dateRange.length > 0 ? (
                        <div className="bg-white shadow-lg w-[800px] shrink-0">
                            {/* Header Biru */}
                            <div className="bg-[#2e5686] text-white text-center py-2.5 border-x border-t border-black">
                                <h1 className="text-xl font-bold uppercase tracking-wide">Notaris & PPAT Havis Akbar</h1>
                            </div>

                            {/* Subheader Abu */}
                            <div className="bg-[#666666] text-white text-center py-1.5 border-x border-black">
                                <h2 className="text-sm font-semibold uppercase tracking-wide">
                                    LAPORAN UANG MAKAN ({format(dateRange[0], 'd MMMM yyyy', { locale: localeId })} s/d {format(dateRange[dateRange.length - 1], 'd MMMM yyyy', { locale: localeId })})
                                </h2>
                            </div>

                            {/* Table Grid */}
                            <table className="w-full border-collapse border border-black">
                                <thead>
                                    <tr className="bg-[#666666] text-white">
                                        <th rowSpan={2} className="border border-black px-4 py-2 w-40 font-bold text-lg align-middle">Nama</th>
                                        <th colSpan={5} className="border border-black px-4 py-1.5 font-bold align-middle">Hari/Tanggal</th>
                                    </tr>
                                    <tr className="bg-white text-black h-10">
                                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                                            <th key={day} className="border border-black px-2 py-2 font-bold text-xl">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {weeklyData.map((week, wIdx) => (
                                        <tr key={wIdx}>
                                            {/* Nama Cell - Merged Vertically */}
                                            {wIdx === 0 && (
                                                <td
                                                    rowSpan={weeklyData.length}
                                                    className="border border-black bg-[#666666] text-white text-center font-bold text-2xl align-middle px-4"
                                                >
                                                    {selectedEmployee.name}
                                                </td>
                                            )}

                                            {/* Date Cells */}
                                            {week.map((date, dIdx) => (
                                                <td
                                                    key={dIdx}
                                                    className={`border border-black h-12 w-[120px] text-center text-2xl font-medium cursor-pointer relative hover:bg-opacity-80 transition-colors ${getCellColor(date)}`}
                                                    onClick={() => {
                                                        if (date) {
                                                            const status = getStatus(date, selectedEmployee)
                                                            const order = ['Hadir', 'Libur', 'Sakit', 'Izin']
                                                            const next = order[(order.indexOf(status) + 1) % order.length]
                                                            handleStatusChange(date, next)
                                                        }
                                                    }}
                                                >
                                                    {date ? format(date, 'd') : ''}

                                                    {/* Status Indicator (if not Hadir) */}
                                                    {date && getStatus(date, selectedEmployee) !== 'Hadir' && (
                                                        <div className="absolute top-1 right-1 text-[10px] bg-white/90 text-black px-1 rounded shadow-sm">
                                                            {getStatus(date, selectedEmployee)}
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-[#666666] text-white h-12">
                                        <td className="border border-black px-4 py-2 text-center font-bold text-xl uppercase italic">
                                            total =
                                        </td>
                                        {columnTotals.map((total, idx) => (
                                            <td key={idx} className="border border-black px-2 py-2 text-center text-black bg-white font-bold text-xl">
                                                x{total}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="bg-[#666666] text-white h-12">
                                        <td colSpan={6} className="border border-black px-4 py-2 text-center font-bold text-xl">
                                            {formatRupiah(selectedEmployee.mealAllowance)} x {calculation.workDays} hari = {formatRupiah(calculation.totalAllowance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p>Pilih karyawan untuk menampilkan laporan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah Karyawan */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Karyawan Baru</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={newEmpName}
                                    onChange={e => setNewEmpName(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 text-sm"
                                    placeholder="Nama karyawan"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tgl Gajian</label>
                                    <input
                                        type="number"
                                        min="1" max="28"
                                        required
                                        value={newEmpPayDate}
                                        onChange={e => setNewEmpPayDate(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Uang Makan</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        required
                                        value={newEmpAllowance}
                                        onChange={e => setNewEmpAllowance(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex gap-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">Batal</button>
                                <button type="submit" className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}