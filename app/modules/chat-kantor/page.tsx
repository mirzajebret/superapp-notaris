'use client';

import React, { useEffect, useRef, useState, DragEvent } from 'react';
import { getChatData, sendMessage, saveStickyNote, ChatMessage, ChatAttachment } from './actions';
import {
    Send, Monitor, Paperclip, X, FileText,
    Image as ImageIcon, Download, Save, StickyNote,
    Search, MessageSquarePlus, Clock, UploadCloud,
    FolderOpen, LayoutGrid, List as ListIcon, Filter,
    MessageCircleMoreIcon
} from 'lucide-react';

// Template Pesan Cepat
const QUICK_REPLIES = [
    "Siap laksanakan 👍",
    "Klien sudah datang",
    "Mohon tanda tangan",
    "Tolong print dokumen",
    "File sudah diupload",
    "Sedang istirahat ☕",
    "Terima kasih",
    "Ok"
];

// Tipe data untuk Repository File (Derived from messages)
interface RepoFile extends ChatAttachment {
    senderName: string;
    timestamp: string;
    messageId: string;
}

export default function ChatKantorPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [myIp, setMyIp] = useState<string>('');
    const [inputText, setInputText] = useState('');

    // State Tabs
    const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');

    // State Docs Repository
    const [docFilter, setDocFilter] = useState<'all' | 'image' | 'document'>('all');

    // State Multiple Files
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // State Lainnya
    const [noteContent, setNoteContent] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [showNoteMobile, setShowNoteMobile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!searchTerm && activeTab === 'chat') scrollToBottom();
    }, [messages.length, searchTerm, activeTab]);

    // --- DRAG AND DROP HANDLERS ---
    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === dropZoneRef.current) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
            e.dataTransfer.clearData();
            setActiveTab('chat'); // Switch ke chat jika drop file saat di tab docs
        }
    };
    // -----------------------------

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async (e?: React.FormEvent, quickMessage?: string) => {
        if (e) e.preventDefault();

        const textToSend = quickMessage || inputText;

        if (!textToSend.trim() && selectedFiles.length === 0) return;

        if (!quickMessage) {
            setInputText('');
            setSelectedFiles([]);
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('message', textToSend);

        if (!quickMessage) {
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
        }

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

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // --- LOGIC FILTER PESAN & FILE ---
    const filteredMessages = messages.filter(msg =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.attachments?.some(a => a.fileName.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (msg.attachment?.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Mengumpulkan semua file dari pesan untuk Tab Docs
    const allRepoFiles: RepoFile[] = messages.flatMap(msg => {
        const atts = [...(msg.attachments || []), ...(msg.attachment ? [msg.attachment] : [])];
        return atts.map(att => ({
            ...att,
            senderName: msg.senderName,
            timestamp: msg.timestamp,
            messageId: msg.id
        }));
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Terbaru diatas

    const filteredRepoFiles = allRepoFiles.filter(file => {
        const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.senderName.toLowerCase().includes(searchTerm.toLowerCase());
        const isImage = file.fileType.startsWith('image/');

        if (docFilter === 'image') return matchesSearch && isImage;
        if (docFilter === 'document') return matchesSearch && !isImage;
        return matchesSearch;
    });

    // Komponen Attachment Item (Chat Bubble)
    const AttachmentItem = ({ att }: { att: ChatAttachment }) => {
        if (att.fileType.startsWith('image/')) {
            return (
                <div className="relative group overflow-hidden rounded bg-gray-100 border border-gray-200 aspect-square">
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                    </a>
                </div>
            );
        }
        return (
            <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 transition rounded border border-gray-200 min-w-0">
                <div className="bg-white p-1.5 rounded shadow-sm text-red-500 shrink-0"><FileText size={18} /></div>
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="truncate font-medium text-xs text-gray-700">{att.fileName}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{att.fileType.split('/')[1] || 'FILE'} • {formatFileSize(att.fileSize)}</p>
                </div>
                <Download size={14} className="text-gray-400 shrink-0" />
            </a>
        );
    };

    return (
        <div
            className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 font-sans overflow-hidden relative"
            onDragEnter={handleDragEnter}
        >
            {/* Overlay Drag & Drop */}
            {isDragging && (
                <div
                    ref={dropZoneRef}
                    className="absolute inset-0 z-50 bg-blue-500/80 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all animate-in fade-in"
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <UploadCloud size={80} className="mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold">Lepaskan File Disini</h2>
                    <p className="text-lg opacity-90">Untuk mengirim ke chat kantor</p>
                </div>
            )}

            {/* Header */}
            <div className="bg-white px-4 pt-3 pb-0 shadow-sm border-b flex flex-col gap-3 z-10 sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-full text-white">
                            <MessageCircleMoreIcon size={20} />
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
                        <div className={`flex items-center bg-gray-100 rounded-full px-3 py-1 transition-all ${isSearchOpen ? 'w-48 sm:w-64' : 'w-10 h-10 justify-center bg-transparent hover:bg-gray-100'}`}>
                            <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchTerm(''); }} className="text-gray-500">
                                {isSearchOpen ? <X size={16} /> : <Search size={20} />}
                            </button>
                            {isSearchOpen && (
                                <input
                                    type="text"
                                    placeholder="Cari pesan/file..."
                                    className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            )}
                        </div>
                        <button onClick={() => setShowNoteMobile(!showNoteMobile)} className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded">
                            <StickyNote size={20} className={showNoteMobile ? "text-blue-600" : ""} />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-6 mt-1">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquarePlus size={16} /> Percakapan
                        </div>
                        {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'docs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <FolderOpen size={16} /> Arsip Dokumen
                        </div>
                        {activeTab === 'docs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Konten Utama (Switchable) */}
                <div className={`flex-1 flex flex-col relative ${showNoteMobile ? 'hidden sm:flex' : 'flex'}`}>

                    {/* --- VIEW 1: CHAT --- */}
                    {activeTab === 'chat' && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]">
                                {filteredMessages.length === 0 && searchTerm && (
                                    <div className="text-center text-gray-500 mt-10 text-sm bg-white/50 p-2 rounded w-fit mx-auto">
                                        Tidak ditemukan pesan.
                                    </div>
                                )}

                                {filteredMessages.map((msg, index) => {
                                    const isMe = msg.ip === myIp;
                                    const isSequence = index > 0 && filteredMessages[index - 1].ip === msg.ip;

                                    const allAttachments = [
                                        ...(msg.attachments || []),
                                        ...(msg.attachment ? [msg.attachment] : [])
                                    ];

                                    const hasImages = allAttachments.some(a => a.fileType.startsWith('image/'));
                                    const hasDocs = allAttachments.some(a => !a.fileType.startsWith('image/'));

                                    return (
                                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[85%] sm:max-w-[65%] relative px-3 py-2 rounded-lg shadow-sm text-sm 
                            ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                                                    } ${isSequence ? 'mt-1' : 'mt-3'}`}
                                            >
                                                {!isMe && !isSequence && (
                                                    <div className="text-[10px] font-bold text-orange-600 mb-1">
                                                        {msg.senderName}
                                                    </div>
                                                )}

                                                {allAttachments.length > 0 && (
                                                    <div className="flex flex-col gap-1 mb-1">
                                                        {hasImages && (
                                                            <div className={`grid gap-1 ${allAttachments.filter(a => a.fileType.startsWith('image/')).length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                                {allAttachments.filter(a => a.fileType.startsWith('image/')).map((att, i) => (
                                                                    <AttachmentItem key={i} att={att} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {hasDocs && (
                                                            <div className="flex flex-col gap-1">
                                                                {allAttachments.filter(a => !a.fileType.startsWith('image/')).map((att, i) => (
                                                                    <AttachmentItem key={i} att={att} />
                                                                ))}
                                                            </div>
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
                                {selectedFiles.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto p-2 mb-2 bg-blue-50 rounded-lg border border-blue-100 no-scrollbar">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="relative flex-shrink-0 w-32 bg-white rounded border border-blue-200 p-2 flex flex-col items-center group">
                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <div className="text-blue-600 mb-1">
                                                    {file.type.startsWith('image/') ? <ImageIcon size={24} /> : <FileText size={24} />}
                                                </div>
                                                <span className="text-[10px] text-center w-full truncate font-medium text-gray-700">{file.name}</span>
                                                <span className="text-[9px] text-gray-400">{formatFileSize(file.size)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={(e) => handleSend(e)} className="flex gap-2 max-w-4xl mx-auto items-end">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        multiple
                                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-gray-500 hover:bg-gray-100 p-3 mb-1 rounded-full transition-colors"
                                        title="Lampirkan File"
                                    >
                                        <Paperclip size={22} />
                                    </button>

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
                                        placeholder={selectedFiles.length > 0 ? "Ketik pesan untuk file ini..." : "Ketik pesan atau seret file kesini..."}
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

                                    <button
                                        type="submit"
                                        disabled={loading || (!inputText.trim() && selectedFiles.length === 0)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 mb-1 rounded-full transition-colors disabled:opacity-50 shadow-md"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                    {/* --- VIEW 2: DOCUMENT REPOSITORY --- */}
                    {activeTab === 'docs' && (
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                            <div className="max-w-6xl mx-auto">
                                {/* Repository Header & Filters */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <FolderOpen className="text-blue-600" /> Repository Dokumen
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {filteredRepoFiles.length} file tersimpan di history chat
                                        </p>
                                    </div>
                                    <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                                        <button
                                            onClick={() => setDocFilter('all')}
                                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${docFilter === 'all' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Semua
                                        </button>
                                        <button
                                            onClick={() => setDocFilter('document')}
                                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${docFilter === 'document' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Dokumen
                                        </button>
                                        <button
                                            onClick={() => setDocFilter('image')}
                                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${docFilter === 'image' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Gambar
                                        </button>
                                    </div>
                                </div>

                                {/* Repository Content */}
                                {filteredRepoFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <FolderOpen size={48} className="mb-3 opacity-20" />
                                        <p>Tidak ada dokumen yang ditemukan</p>
                                        {searchTerm && <p className="text-xs mt-1">Coba kata kunci lain</p>}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredRepoFiles.map((file, idx) => (
                                            <div key={idx} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow group flex flex-col overflow-hidden h-full">
                                                {/* Preview */}
                                                <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                                    {file.fileType.startsWith('image/') ? (
                                                        <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center text-gray-400">
                                                            {file.fileName.endsWith('.pdf') ? (
                                                                <FileText size={48} className="text-red-400" />
                                                            ) : file.fileName.includes('xls') ? (
                                                                <FileText size={48} className="text-green-500" />
                                                            ) : file.fileName.includes('doc') ? (
                                                                <FileText size={48} className="text-blue-500" />
                                                            ) : (
                                                                <FileText size={48} />
                                                            )}
                                                            <span className="text-xs uppercase mt-2 font-bold opacity-50">{file.fileType.split('/')[1]}</span>
                                                        </div>
                                                    )}
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <a
                                                            href={file.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition"
                                                            title="Buka / Download"
                                                        >
                                                            <Download size={20} />
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="p-3 flex flex-col flex-1">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug" title={file.fileName}>
                                                            {file.fileName}
                                                        </h3>
                                                    </div>
                                                    <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-1">
                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} /> {formatDate(file.timestamp)}
                                                            </span>
                                                            <span>{formatFileSize(file.fileSize)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400">
                                                            Oleh: <span className="text-orange-600 font-medium">{file.senderName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                            onBlur={handleSaveNote}
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