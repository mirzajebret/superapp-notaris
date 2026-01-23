'use server'

import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'daftar-pekerjaan.json')

export type JobCategory = 'Kenotariatan' | 'PPAT' | 'Lainnya'
export type JobStatus = 'Baru' | 'Proses' | 'Selesai' | 'Batal' | 'Tertunda'

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
    processItems?: { name: string; amount: number }[]
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