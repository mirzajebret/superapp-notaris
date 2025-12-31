'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getChatData, sendMessage, ChatMessage } from './actions';
import { Send, MessageCircleMoreIcon, Paperclip, X, FileText, Image as ImageIcon, Download } from 'lucide-react';
import Image from 'next/image';

export default function ChatKantorPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [myIp, setMyIp] = useState<string>('');
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // State file
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref untuk input file hidden

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        const result = await getChatData();
        if (result.success) {
            setMessages(result.messages);
            setMyIp(result.userIp);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    // Handle pilih file
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() && !selectedFile) return;

        const currentText = inputText;
        const currentFile = selectedFile;

        // Reset UI segera
        setInputText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLoading(true);

        const formData = new FormData();
        formData.append('message', currentText);
        if (currentFile) {
            formData.append('file', currentFile);
        }

        await sendMessage(formData);
        await fetchMessages();
        setLoading(false);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    // Helper untuk render ukuran file
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 font-sans">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full text-white">
                        <MessageCircleMoreIcon size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg">Chat Kantor</h1>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online ({myIp})
                        </p>
                    </div>
                </div>
            </div>

            {/* Area Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]">
                {messages.map((msg, index) => {
                    const isMe = msg.ip === myIp;
                    const isSequence = index > 0 && messages[index - 1].ip === msg.ip;

                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] sm:max-w-[60%] relative px-2 py-2 rounded-lg shadow-sm text-sm ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                                    } ${isSequence ? 'mt-1' : 'mt-3'}`}
                            >
                                {!isMe && !isSequence && (
                                    <div className="text-[10px] font-bold text-orange-600 mb-1 px-2">
                                        {msg.senderName}
                                    </div>
                                )}

                                {/* Tampilan Attachment */}
                                {msg.attachment && (
                                    <div className="mb-2 rounded overflow-hidden bg-black/5">
                                        {msg.attachment.fileType.startsWith('image/') ? (
                                            // Tampilan Gambar
                                            <div className="relative w-full h-auto">
                                                <a href={msg.attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={msg.attachment.fileUrl}
                                                        alt="attachment"
                                                        className="w-full h-auto max-h-64 object-cover rounded"
                                                    />
                                                </a>
                                            </div>
                                        ) : (
                                            // Tampilan File Dokumen
                                            <a
                                                href={msg.attachment.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition rounded border border-gray-200"
                                            >
                                                <div className="bg-red-100 p-2 rounded text-red-500">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate font-medium text-gray-700">{msg.attachment.fileName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {msg.attachment.fileType.split('/')[1].toUpperCase()} • {formatFileSize(msg.attachment.fileSize)}
                                                    </p>
                                                </div>
                                                <Download size={16} className="text-gray-400" />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Teks Pesan */}
                                {msg.message && <p className="whitespace-pre-wrap leading-relaxed px-2 pt-1">{msg.message}</p>}

                                <div className={`text-[10px] mt-1 text-right px-2 ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {formatTime(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-2 sm:p-3 border-t">
                {/* Preview File Terpilih */}
                {selectedFile && (
                    <div className="flex items-center justify-between bg-gray-100 p-2 mb-2 rounded-lg border border-gray-200 mx-auto max-w-4xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-blue-100 p-2 rounded text-blue-600">
                                {selectedFile.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                                <span className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 p-1">
                            <X size={20} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto items-end">
                    {/* Tombol Upload (Paperclip) */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        // Accept umum: gambar, pdf, word, excel
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-500 hover:text-gray-700 p-3 mb-1 transition-colors"
                        title="Lampirkan File"
                    >
                        <Paperclip size={22} />
                    </button>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 resize-none overflow-hidden min-h-[44px] max-h-32"
                        rows={1}
                        style={{ minHeight: '44px' }}
                        disabled={loading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading || (!inputText.trim() && !selectedFile)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 mb-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}