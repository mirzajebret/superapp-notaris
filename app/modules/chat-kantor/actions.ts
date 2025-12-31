'use server'

import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'chat-history.json');
// Folder tujuan upload: public/uploads/chat
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
    attachment?: ChatAttachment | null; // Tambahan field attachment
}

async function getIPAddress() {
    const headersList = await headers();
    const xForwardedFor = headersList.get('x-forwarded-for');
    if (xForwardedFor) return xForwardedFor.split(',')[0];
    return '127.0.0.1';
}

export async function getChatData() {
    try {
        try { await fs.access(DATA_FILE_PATH); } catch { await fs.writeFile(DATA_FILE_PATH, '[]', 'utf-8'); }

        const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const messages: ChatMessage[] = JSON.parse(fileContent);
        const userIp = await getIPAddress();

        return { success: true, messages, userIp };
    } catch (error) {
        return { success: false, messages: [], userIp: '' };
    }
}

export async function sendMessage(formData: FormData) {
    const messageText = formData.get('message') as string;
    const file = formData.get('file') as File | null; // Ambil file dari form data

    // Validasi: Harus ada pesan ATAU file
    if ((!messageText || messageText.trim() === '') && !file) return { success: false };

    const ip = await getIPAddress();
    const ipSegments = ip.split('.');
    const shortName = ipSegments.length > 1 ? `User .${ipSegments[ipSegments.length - 1]}` : 'User Local';

    let attachmentData: ChatAttachment | null = null;

    // Proses Upload File jika ada
    if (file && file.size > 0) {
        try {
            // Pastikan folder upload ada
            try { await fs.access(UPLOAD_DIR); } catch { await fs.mkdir(UPLOAD_DIR, { recursive: true }); }

            const timestamp = Date.now();
            // Bersihkan nama file dari karakter aneh
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFileName = `${timestamp}-${safeFileName}`;
            const filePath = path.join(UPLOAD_DIR, uniqueFileName);

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await fs.writeFile(filePath, buffer);

            attachmentData = {
                fileName: file.name,
                fileType: file.type,
                fileUrl: `/uploads/chat/${uniqueFileName}`, // URL yang bisa diakses dari browser
                fileSize: file.size
            };
        } catch (err) {
            console.error("Gagal upload file:", err);
        }
    }

    const newMessage: ChatMessage = {
        id: Date.now().toString(),
        ip: ip,
        message: messageText || '', // Bisa kosong jika hanya kirim file
        timestamp: new Date().toISOString(),
        senderName: shortName,
        attachment: attachmentData
    };

    try {
        const { messages } = await getChatData();
        messages.push(newMessage);
        const limitedMessages = messages.slice(-500);
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(limitedMessages, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false };
    }
}