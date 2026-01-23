'use server'

import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'laporan-karyawan.json')

export type Employee = {
    id: string
    name: string
    paydayDate: number // Tanggal gajian (misal: 18)
    mealAllowance: number // Nominal per hari
    createdAt: string
    // Key: YYYY-MM-DD, Value: Status (Hadir, Sakit, Izin, Libur)
    attendanceOverrides: Record<string, string>
}

// Helper untuk memastikan file ada
async function ensureFile() {
    try {
        await fs.access(DATA_FILE)
    } catch {
        await fs.writeFile(DATA_FILE, '[]', 'utf-8')
    }
}

export async function getEmployees(): Promise<Employee[]> {
    await ensureFile()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    try {
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

export async function saveEmployee(employee: Employee): Promise<boolean> {
    await ensureFile()
    const employees = await getEmployees()

    const index = employees.findIndex(e => e.id === employee.id)
    if (index >= 0) {
        employees[index] = employee
    } else {
        employees.push(employee)
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(employees, null, 2), 'utf-8')
    return true
}

export async function deleteEmployee(id: string): Promise<boolean> {
    await ensureFile()
    let employees = await getEmployees()
    employees = employees.filter(e => e.id !== id)
    await fs.writeFile(DATA_FILE, JSON.stringify(employees, null, 2), 'utf-8')
    return true
}

// Fungsi khusus untuk update status kehadiran saja (lebih efisien)
export async function updateAttendance(employeeId: string, date: string, status: string): Promise<boolean> {
    const employees = await getEmployees()
    const employee = employees.find(e => e.id === employeeId)

    if (!employee) return false

    if (!employee.attendanceOverrides) {
        employee.attendanceOverrides = {}
    }

    // Jika status "Hadir" (default), hapus override agar file json tidak bengkak
    if (status === 'Hadir') {
        delete employee.attendanceOverrides[date]
    } else {
        employee.attendanceOverrides[date] = status
    }

    await saveEmployee(employee)
    return true
}