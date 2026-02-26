'use server';

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'data', 'data-tracking.json');

export interface ProgressItem {
    id: string;
    date: string; // ISO timestamp (serves as startDate for display)
    title: string;
    description?: string;
    status: 'On Progress' | 'Done' | 'Issue';
    estimatedFinishDate?: string; // YYYY-MM-DD
    actualFinishDate?: string; // YYYY-MM-DD
    clientName?: string;
    pic?: string;
}

export interface TrackingJob {
    id: string;
    title: string;
    description?: string;
    status: 'On Progress' | 'Done' | 'Issue';
    startDate: string; // YYYY-MM-DD
    estimatedFinishDate?: string; // YYYY-MM-DD
    actualFinishDate?: string; // YYYY-MM-DD
    pic: string;
    clientName: string;
    progressHistory: ProgressItem[];
    lastProgress?: string;
    createdAt: string;
    updatedAt: string;
}

// Helper to read data
async function readData(): Promise<TrackingJob[]> {
    try {
        const content = await readFile(DATA_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading tracking data:', error);
        return [];
    }
}

// Helper to write data
async function writeData(data: TrackingJob[]): Promise<void> {
    try {
        await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing tracking data:', error);
        throw error;
    }
}

// Get all tracking jobs
export async function getTrackingJobs(): Promise<TrackingJob[]> {
    return await readData();
}

// Save or update a tracking job
export async function saveTrackingJob(jobData: Partial<TrackingJob>): Promise<void> {
    const data = await readData();
    const now = new Date().toISOString();

    if (jobData.id) {
        // Update existing job
        const index = data.findIndex(j => j.id === jobData.id);
        if (index !== -1) {
            data[index] = {
                ...data[index],
                ...jobData,
                updatedAt: now,
            } as TrackingJob;
        }
    } else {
        // Create new job
        const newJob: TrackingJob = {
            id: `TRACK-${Date.now()}`,
            title: jobData.title || '',
            description: jobData.description || '',
            status: jobData.status || 'On Progress',
            startDate: jobData.startDate || new Date().toISOString().split('T')[0],
            estimatedFinishDate: jobData.estimatedFinishDate,
            actualFinishDate: jobData.actualFinishDate,
            pic: jobData.pic || '',
            clientName: jobData.clientName || '',
            progressHistory: jobData.progressHistory || [],
            lastProgress: jobData.lastProgress,
            createdAt: now,
            updatedAt: now,
        };
        data.push(newJob);
    }

    await writeData(data);
}

// Delete a tracking job
export async function deleteTrackingJob(id: string): Promise<void> {
    const data = await readData();
    const filtered = data.filter(j => j.id !== id);
    await writeData(filtered);
}

// Add a progress update to a job
export async function addProgressUpdate(
    jobId: string,
    progress: Partial<ProgressItem>
): Promise<void> {
    const data = await readData();
    const job = data.find(j => j.id === jobId);

    if (!job) {
        throw new Error('Job not found');
    }

    const newProgress: ProgressItem = {
        id: progress.id || `p-${Date.now()}`,
        date: progress.date || new Date().toISOString(),
        title: progress.title || '',
        description: progress.description || '',
        status: progress.status || 'On Progress',
        estimatedFinishDate: progress.estimatedFinishDate,
        actualFinishDate: progress.actualFinishDate,
        clientName: progress.clientName,
        pic: progress.pic,
    };

    if (progress.id) {
        // Update existing progress
        const index = job.progressHistory.findIndex(p => p.id === progress.id);
        if (index !== -1) {
            job.progressHistory[index] = newProgress;
        }
    } else {
        // Add new progress
        job.progressHistory.push(newProgress);
    }

    // Update lastProgress to the most recent progress title
    if (job.progressHistory.length > 0) {
        const sorted = [...job.progressHistory].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        job.lastProgress = sorted[0].title;
    }

    job.updatedAt = new Date().toISOString();

    await writeData(data);
}

// Delete a progress update
export async function deleteProgressUpdate(
    jobId: string,
    progressId: string
): Promise<void> {
    const data = await readData();
    const job = data.find(j => j.id === jobId);

    if (!job) {
        throw new Error('Job not found');
    }

    job.progressHistory = job.progressHistory.filter(p => p.id !== progressId);

    // Update lastProgress
    if (job.progressHistory.length > 0) {
        const sorted = [...job.progressHistory].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        job.lastProgress = sorted[0].title;
    } else {
        job.lastProgress = undefined;
    }

    job.updatedAt = new Date().toISOString();

    await writeData(data);
}
