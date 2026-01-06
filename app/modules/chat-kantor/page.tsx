'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getChatData, sendMessage, saveStickyNote, ChatMessage } from './actions';
import {
    Send, Monitor, Paperclip, X, FileText,
    Image as ImageIcon, Download, Save, StickyNote,
    Search, MessageSquarePlus, Clock
} from 'lucide-react';

// Daftar Template Pesan Cepat untuk Kantor Notaris
const QUICK_REPLIES = [
    "Siap laksanakan 👍",
    "Klien sudah datang",
    "Mohon tanda tangan Pak/Bu",
    "Tolong print dokumen",
    "File sudah diupload",
    "Sedang istirahat ☕",
    "Rapat dimulai",
    "Terima kasih"
];

export default function ChatKantorPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [myIp, setMyIp] = useState<string>('');
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // State Sticky Note
    const [noteContent, setNoteContent] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [showNoteMobile, setShowNoteMobile] = useState(false);

    // State Search & Features
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        const result = await getChatData();
        if (result.success) {
            setMessages(result.messages);
            setMyIp(result.userIp);

            const activeElement = document.activeElement;
            const isTypingNote = activeElement?.tagName === 'TEXTAREA' && activeElement?.id === 'sticky-note-area';

            if (!isTypingNote && result.noteData && result.noteData.content !== noteContent) {
                setNoteContent(result.noteData.content);
            }
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, []);

    // Scroll otomatis hanya jika tidak sedang mencari pesan lama
    useEffect(() => {
        if (!searchTerm) {
            scrollToBottom();
        }
    }, [messages.length, searchTerm]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Fungsi Kirim Pesan (Bisa teks manual atau dari Quick Reply)
    const handleSend = async (e?: React.FormEvent, quickMessage?: string) => {
        if (e) e.preventDefault();

        const textToSend = quickMessage || inputText;

        if (!textToSend.trim() && !selectedFile) return;

        if (!quickMessage) {
            setInputText('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('message', textToSend);
        formData.append('type', 'text');
        if (selectedFile && !quickMessage) formData.append('file', selectedFile);

        await sendMessage(formData);
        await fetchMessages();
        setLoading(false);
        scrollToBottom();
    };

    const handleSaveNote = async () => {
        setIsSavingNote(true);
        await saveStickyNote(noteContent);
        setIsSavingNote(false);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Filter pesan berdasarkan pencarian
    const filteredMessages = messages.filter(msg =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.attachment && msg.attachment.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white p-3 shadow-sm border-b flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full text-white">
                        <Monitor size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg hidden sm:block">Chat Kantor</h1>
                        <h1 className="font-bold text-gray-800 text-base sm:hidden">Chat LAN</h1>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {myIp}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Toggle */}
                    <div className={`flex items-center bg-gray-100 rounded-full px-3 py-1 transition-all ${isSearchOpen ? 'w-48 sm:w-64' : 'w-10 h-10 justify-center bg-transparent hover:bg-gray-100'}`}>
                        <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchTerm(''); }} className="text-gray-500">
                            {isSearchOpen ? <X size={16} /> : <Search size={20} />}
                        </button>
                        {isSearchOpen && (
                            <input
                                type="text"
                                placeholder="Cari pesan..."
                                className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        )}
                    </div>

                    <button
                        onClick={() => setShowNoteMobile(!showNoteMobile)}
                        className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        <StickyNote size={20} className={showNoteMobile ? "text-blue-600" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Area Chat (Kiri) */}
                <div className={`flex-1 flex flex-col relative ${showNoteMobile ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]">
                        {filteredMessages.length === 0 && searchTerm && (
                            <div className="text-center text-gray-500 mt-10 text-sm bg-white/50 p-2 rounded w-fit mx-auto">
                                Tidak ditemukan pesan dengan kata kunci "{searchTerm}"
                            </div>
                        )}

                        {filteredMessages.map((msg, index) => {
                            const isMe = msg.ip === myIp;
                            const isSequence = index > 0 && filteredMessages[index - 1].ip === msg.ip;
                            const isBuzz = msg.type === 'buzz'; // Backward compatibility jika ada sisa pesan buzz

                            return (
                                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] sm:max-w-[60%] relative px-3 py-2 rounded-lg shadow-sm text-sm 
                    ${isBuzz
                                                ? 'bg-red-100 border-red-200 text-red-600 italic'
                                                : isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                                            } ${isSequence ? 'mt-1' : 'mt-3'}`}
                                    >
                                        {!isMe && !isSequence && !isBuzz && (
                                            <div className="text-[10px] font-bold text-orange-600 mb-1">
                                                {msg.senderName}
                                            </div>
                                        )}

                                        {msg.attachment && (
                                            <div className="mb-2 rounded overflow-hidden bg-black/5 mt-1 border border-gray-100">
                                                {msg.attachment.fileType.startsWith('image/') ? (
                                                    <div className="relative w-full h-auto">
                                                        <a href={msg.attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <img src={msg.attachment.fileUrl} alt="attachment" className="w-full h-auto max-h-64 object-cover rounded" />
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <a href={msg.attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition rounded">
                                                        <div className="bg-white p-2 rounded shadow-sm text-red-500"><FileText size={20} /></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="truncate font-medium text-gray-700">{msg.attachment.fileName}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase">{msg.attachment.fileType.split('/')[1] || 'FILE'} • {formatFileSize(msg.attachment.fileSize)}</p>
                                                        </div>
                                                        <Download size={16} className="text-gray-400" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}

                                        <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-green-800/60' : 'text-gray-400'}`}>
                                            {formatTime(msg.timestamp)}
                                            {isMe && <span className="text-xs">✓</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies Bar */}
                    {showQuickReplies && !searchTerm && (
                        <div className="bg-gray-100 border-t border-gray-200 px-2 py-2 flex gap-2 overflow-x-auto no-scrollbar items-center">
                            <div className="text-xs font-bold text-gray-400 px-1 whitespace-nowrap flex items-center gap-1">
                                <MessageSquarePlus size={14} /> Quick:
                            </div>
                            {QUICK_REPLIES.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(undefined, reply)}
                                    className="whitespace-nowrap bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-xs px-3 py-1.5 rounded-full transition-colors shadow-sm"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="bg-white p-2 sm:p-3 border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                        {selectedFile && (
                            <div className="flex items-center justify-between bg-blue-50 p-2 mb-2 rounded-lg border border-blue-100 mx-auto max-w-4xl">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-blue-200 p-2 rounded text-blue-700">
                                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-sm font-medium truncate max-w-[200px] text-blue-900">{selectedFile.name}</span>
                                        <span className="text-xs text-blue-600">{formatFileSize(selectedFile.size)}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedFile(null)} className="text-blue-400 hover:text-red-500 p-1"><X size={20} /></button>
                            </div>
                        )}

                        <form onSubmit={(e) => handleSend(e)} className="flex gap-2 max-w-4xl mx-auto items-end">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:bg-gray-100 p-3 mb-1 rounded-full transition-colors" title="Lampirkan File"><Paperclip size={22} /></button>

                            {/* Tombol Toggle Quick Replies */}
                            <button
                                type="button"
                                onClick={() => setShowQuickReplies(!showQuickReplies)}
                                className={`p-3 mb-1 rounded-full transition-colors ${showQuickReplies ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
                                title="Template Pesan"
                            >
                                <MessageSquarePlus size={22} />
                            </button>

                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ketik pesan..."
                                className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 resize-none overflow-hidden min-h-[44px] max-h-32 shadow-inner"
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

                            <button type="submit" disabled={loading || (!inputText.trim() && !selectedFile)} className="bg-blue-600 hover:bg-blue-700 text-white p-3 mb-1 rounded-full transition-colors disabled:opacity-50 shadow-md">
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Papan Catatan (Kanan - Sidebar) */}
                <div className={`w-full sm:w-80 bg-[#fffde7] border-l border-yellow-200 flex flex-col shadow-xl z-20 absolute sm:relative h-full transition-transform transform ${showNoteMobile ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}`}>
                    <div className="bg-[#fff9c4] p-3 border-b border-yellow-200 flex justify-between items-center">
                        <h2 className="font-bold text-yellow-800 flex items-center gap-2">
                            <StickyNote size={18} /> Info Kantor
                        </h2>
                        <div className="flex items-center gap-2">
                            {isSavingNote && <span className="text-xs text-yellow-600 flex items-center gap-1"><Clock size={10} className="animate-spin" /> Saving</span>}
                            <button onClick={handleSaveNote} className="text-yellow-700 hover:bg-yellow-200 p-1.5 rounded transition-colors" title="Simpan Catatan">
                                <Save size={18} />
                            </button>
                            <button onClick={() => setShowNoteMobile(false)} className="sm:hidden text-yellow-700 p-1">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-0 relative group">
                        <textarea
                            id="sticky-note-area"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            onBlur={handleSaveNote} // Auto-save saat pindah fokus
                            className="w-full h-full bg-[#fffde7] p-4 text-sm text-gray-700 focus:outline-none resize-none font-mono leading-relaxed"
                            placeholder="Tulis info penting disini (Password Wifi, Jadwal Meeting, dll)..."
                        />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-yellow-600/50 pointer-events-none">
                            Auto-save enabled
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}