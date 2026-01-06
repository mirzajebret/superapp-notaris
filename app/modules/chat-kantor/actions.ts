'use server'

import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'chat-history.json');
const NOTES_FILE_PATH = path.join(process.cwd(), 'data', 'sticky-notes.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'chat');

export interface ChatAttachment {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
}

export interface ChatMessage {
    id: string;
    ip: string;
    message: string;
    timestamp: string;
    senderName: string;
    type: 'text' | 'buzz'; // Tambah tipe pesan
    attachment?: ChatAttachment | null;
}

async function getIPAddress() {
    const headersList = await headers();
    const xForwardedFor = headersList.get('x-forwarded-for');
    if (xForwardedFor) return xForwardedFor.split(',')[0];
    return '127.0.0.1';
}

// --- FUNGSI STICKY NOTES ---
export async function getStickyNote() {
    try {
        try { await fs.access(NOTES_FILE_PATH); } catch {
            await fs.writeFile(NOTES_FILE_PATH, JSON.stringify({ content: "Catatan Kantor...", lastUpdated: new Date().toISOString() }), 'utf-8');
        }
        const fileContent = await fs.readFile(NOTES_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return { content: "", lastUpdated: "" };
    }
}

export async function saveStickyNote(content: string) {
    try {
        const data = { content, lastUpdated: new Date().toISOString() };
        await fs.writeFile(NOTES_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
// ---------------------------

export async function getChatData() {
    try {
        try { await fs.access(DATA_FILE_PATH); } catch { await fs.writeFile(DATA_FILE_PATH, '[]', 'utf-8'); }

        const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const messages: ChatMessage[] = JSON.parse(fileContent);
        const userIp = await getIPAddress();

        // Ambil juga sticky note saat polling chat agar efisien
        const noteData = await getStickyNote();

        return { success: true, messages, userIp, noteData };
    } catch (error) {
        return { success: false, messages: [], userIp: '', noteData: null };
    }
}

export async function sendMessage(formData: FormData) {
    const messageText = formData.get('message') as string;
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'text' | 'buzz' || 'text'; // Ambil tipe

    if ((!messageText || messageText.trim() === '') && !file && type !== 'buzz') return { success: false };

    const ip = await getIPAddress();
    const ipSegments = ip.split('.');
    const shortName = ipSegments.length > 1 ? `User .${ipSegments[ipSegments.length - 1]}` : 'User Local';

    let attachmentData: ChatAttachment | null = null;

    if (file && file.size > 0) {
        try {
            try { await fs.access(UPLOAD_DIR); } catch { await fs.mkdir(UPLOAD_DIR, { recursive: true }); }

            const timestamp = Date.now();
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFileName = `${timestamp}-${safeFileName}`;
            const filePath = path.join(UPLOAD_DIR, uniqueFileName);

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await fs.writeFile(filePath, buffer);

            attachmentData = {
                fileName: file.name,
                fileType: file.type,
                fileUrl: `/uploads/chat/${uniqueFileName}`,
                fileSize: file.size
            };
        } catch (err) {
            console.error("Gagal upload file:", err);
        }
    }

    const newMessage: ChatMessage = {
        id: Date.now().toString(),
        ip: ip,
        message: type === 'buzz' ? 'DING DONG! 🔔' : (messageText || ''),
        timestamp: new Date().toISOString(),
        senderName: shortName,
        type: type,
        attachment: attachmentData
    };

    try {
        const { messages } = await getChatData();
        messages.push(newMessage);
        const limitedMessages = messages.slice(-500);
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(limitedMessages, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}