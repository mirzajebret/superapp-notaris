'use server'

import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'daftar-pekerjaan.json')

export type JobCategory = 'Kenotariatan' | 'PPAT' | 'Lainnya'
export type JobStatus = 'Baru' | 'Proses' | 'Selesai' | 'Batal' | 'Tertunda'

export type PaymentTermin = {
    terminNumber: number
    date: string
    amount: number
    notes?: string
    attachmentUrl?: string
}

export type Job = {
    id: string
    category: JobCategory
    clientName: string
    jobName: string
    date: string // YYYY-MM-DD
    status: JobStatus
    totalCost: number
    paidAmount: number
    notes: string
    createdAt?: string
    costItems?: { name: string; amount: number }[]
    processItems?: { name: string; amount: number; attachmentUrl?: string }[]
    paymentTermins?: PaymentTermin[] // Optional: for installment payments
    totalBudgetBiayaProses?: number // Budget allocation for process costs
}

async function ensureFile() {
    try {
        await fs.access(DATA_FILE)
    } catch {
        await fs.writeFile(DATA_FILE, '[]', 'utf-8')
    }
}

export async function getJobs(): Promise<Job[]> {
    await ensureFile()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    try {
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

export async function saveJob(job: Job): Promise<boolean> {
    await ensureFile()
    const jobs = await getJobs()

    const index = jobs.findIndex(j => j.id === job.id)
    if (index >= 0) {
        jobs[index] = job
    } else {
        // Add new job to the beginning of the list
        jobs.unshift(job)
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2), 'utf-8')
    return true
}

export async function deleteJob(id: string): Promise<boolean> {
    await ensureFile()
    let jobs = await getJobs()
    jobs = jobs.filter(j => j.id !== id)
    await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2), 'utf-8')
    return true
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'jobs')

export async function uploadJobAttachment(formData: FormData) {
    const file = formData.get('file') as File

    if (!file) return { success: false }

    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true })

        const timestamp = Date.now()
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${safeName}`
        const filePath = path.join(UPLOAD_DIR, fileName)

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        await fs.writeFile(filePath, buffer)

        return {
            success: true,
            fileUrl: `/uploads/jobs/${fileName}`
        }
    } catch (error) {
        console.error("Upload failed:", error)
        return { success: false }
    }
}