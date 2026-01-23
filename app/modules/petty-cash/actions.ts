"use server";

import fs from 'fs/promises';
import path from 'path';

const TRANSACTIONS_PATH = path.join(process.cwd(), 'data', 'petty-cash-transactions.json');
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'petty-cash-settings.json');

// Helper untuk memastikan file dan folder data ada
async function ensureFile(filePath, defaultData) {
    try {
        await fs.access(filePath);
    } catch {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
}

// --- Transactions Actions ---
export async function getPettyCashTransactions() {
    await ensureFile(TRANSACTIONS_PATH, []);
    const data = await fs.readFile(TRANSACTIONS_PATH, 'utf8');
    return JSON.parse(data);
}

export async function savePettyCashTransactions(transactions) {
    await fs.writeFile(TRANSACTIONS_PATH, JSON.stringify(transactions, null, 2));
    return { success: true };
}

// --- Settings Actions ---
export async function getPettyCashSettings() {
    const defaultSettings = {
        initialBalance: 0,
        maxLimitPerItem: 1000000,
        lowBalanceThreshold: 500000,
        categories: ['Refill Kas', 'ATK', 'Materai', 'Transport', 'Konsumsi', 'Fotokopi', 'Operasional', 'Lain-lain'],
        adminName: 'Admin Notaris'
    };
    await ensureFile(SETTINGS_PATH, defaultSettings);
    const data = await fs.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(data);
}

export async function savePettyCashSettings(settings) {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return { success: true };
}

// --- Upload Actions ---
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'petty-cash');

async function ensureDir(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

export async function uploadPettyCashProof(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) return { success: false };

    try {
        await ensureDir(UPLOAD_DIR);

        const timestamp = Date.now();
        // Sanitasi nama file
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${safeName}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(filePath, buffer);

        return {
            success: true,
            fileUrl: `/uploads/petty-cash/${fileName}`
        };
    } catch (error) {
        console.error("Upload failed:", error);
        return { success: false };
    }
}