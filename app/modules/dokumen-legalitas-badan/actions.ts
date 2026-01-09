'use server'

import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'legalitas-badan.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'legalitas');

// Tipe Data
export interface LegalItem {
    id: string;
    type: 'file' | 'note';
    content: string; // URL file atau isi text catatan
    fileName?: string; // Hanya untuk file
    fileType?: string; // mime type
    createdAt: string;
}

export interface LegalEntity {
    id: string;
    category?: 'CLIENT' | 'NOTARIS' | 'INSTANSI' | 'OTHER'; // Field Kategori User
    docType?: 'LEGALITAS' | 'PPAT'; // Field Baru: Jenis Dokumen (Toggle)
    nama: string;
    nomor: string; // NPWP atau No SK
    tanggal: string; // Tanggal Pendirian
    // Kolom-kolom dokumen (Array of items)
    col2: LegalItem[]; // Kolom 1
    col3: LegalItem[]; // Kolom 2
    col4: LegalItem[]; // Kolom 3
    col5: LegalItem[]; // Kolom 4
    updatedAt: string;
}

// --- HELPERS ---
async function ensureDir(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// --- ACTIONS ---

export async function getLegalEntities() {
    try {
        try { await fs.access(DATA_FILE_PATH); } catch { await fs.writeFile(DATA_FILE_PATH, '[]', 'utf-8'); }
        const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent) as LegalEntity[];
    } catch (error) {
        return [];
    }
}

export async function saveLegalEntity(entity: LegalEntity) {
    try {
        const entities = await getLegalEntities();
        const index = entities.findIndex(e => e.id === entity.id);

        if (index >= 0) {
            entities[index] = { ...entity, updatedAt: new Date().toISOString() };
        } else {
            entities.unshift({ ...entity, updatedAt: new Date().toISOString() });
        }

        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(entities, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error("Error saving entity:", error);
        return { success: false };
    }
}

export async function deleteLegalEntity(id: string) {
    try {
        const entities = await getLegalEntities();
        const newEntities = entities.filter(e => e.id !== id);
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(newEntities, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function uploadLegalFile(formData: FormData) {
    const file = formData.get('file') as File;
    const entityId = formData.get('entityId') as string;

    if (!file || !entityId) return { success: false };

    try {
        const entityDir = path.join(UPLOAD_DIR, entityId);
        await ensureDir(entityDir);

        const timestamp = Date.now();
        // Sanitasi nama file
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${safeName}`;
        const filePath = path.join(entityDir, fileName);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(filePath, buffer);

        return {
            success: true,
            item: {
                id: timestamp.toString() + Math.random().toString().slice(2, 5),
                type: 'file',
                content: `/uploads/legalitas/${entityId}/${fileName}`,
                fileName: file.name,
                fileType: file.type,
                createdAt: new Date().toISOString()
            } as LegalItem
        };
    } catch (error) {
        console.error("Upload failed:", error);
        return { success: false };
    }
}