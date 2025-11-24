'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteDraft, getDrafts, uploadDraft } from '@/app/actions';
import { 
  FileText, 
  File as FileIcon, 
  Download, 
  Trash2, 
  UploadCloud, 
  Search, 
  Filter,
  X
} from 'lucide-react';

type DraftCategory = 'Notaris' | 'PPAT';
type DraftRecord = {
  id: string;
  title: string;
  category: DraftCategory;
  filename: string;
  fileUrl: string;
  uploadDate: string;
};

const CATEGORY_OPTIONS: { value: 'ALL' | DraftCategory; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'Notaris', label: 'Notaris' },
  { value: 'PPAT', label: 'PPAT' },
];

export default function BankDraftModulePage() {
  // --- STATE ---
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | DraftCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form State
  const [formState, setFormState] = useState<{
    title: string;
    category: DraftCategory;
    file: File | null;
  }>({
    title: '',
    category: 'Notaris',
    file: null,
  });

  // --- UTILS ---
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 4000);
  }, []);

  // --- DATA FETCHING ---
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch semua dulu, nanti difilter client-side untuk search
      const data = await getDrafts(); 
      setDrafts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // --- HANDLERS ---
  const handleInputChange = (field: 'title' | 'category' | 'file', value: string | File | null) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.file || !formState.title) {
      showFeedback('error', 'Lengkapi judul dan file.');
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('title', formState.title);
      payload.append('category', formState.category);
      payload.append('file', formState.file);

      await uploadDraft(payload);
      showFeedback('success', 'Draft berhasil disimpan.');
      setFormState({ title: '', category: formState.category, file: null }); // Reset form
      await fetchDrafts();
    } catch (error) {
      showFeedback('error', 'Upload gagal. Cek format file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus draft ini permanen?')) return;
    setDeletingId(id);
    try {
      await deleteDraft(id);
      showFeedback('success', 'File dihapus.');
      await fetchDrafts();
    } catch (error) {
      showFeedback('error', 'Gagal menghapus.');
    } finally {
      setDeletingId(null);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredDrafts = useMemo(() => {
    return drafts.filter(d => {
      const matchCat = selectedCategory === 'ALL' || d.category === selectedCategory;
      const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.filename.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [drafts, selectedCategory, searchQuery]);

  // --- RENDER HELPERS ---
  const getFileIcon = (filename: string) => {
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    return isPdf ? 
      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText size={20} /></div> : 
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileIcon size={20} /></div>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-gray-800">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bank Draft Akta</h1>
            <p className="text-sm text-gray-500 mt-1">Pustaka template master untuk Notaris & PPAT.</p>
          </div>
          
          {/* Feedback Toast */}
          {feedback && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-fade-in-down shadow-sm ${
              feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {feedback.message}
            </div>
          )}
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: UPLOAD FORM (Sticky) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                <UploadCloud className="text-gray-900" size={20}/>
                <h2 className="font-bold text-gray-900">Upload Baru</h2>
              </div>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Judul Draft</label>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Misal: Akta Pendirian CV"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kategori</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    {['Notaris', 'PPAT'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleInputChange('category', cat as DraftCategory)}
                        className={`py-1.5 text-sm font-medium rounded-md transition ${
                          formState.category === cat 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">File Master</label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    formState.file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                  }`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {formState.file ? (
                        <>
                          <FileText className="text-emerald-600 mb-2" size={24}/>
                          <p className="text-xs text-emerald-700 font-semibold px-4 text-center truncate w-full">{formState.file.name}</p>
                          <p className="text-[10px] text-emerald-500">Klik untuk ganti file</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="text-gray-400 mb-2" size={24}/>
                          <p className="text-xs text-gray-500 font-medium">Klik / Drop file di sini</p>
                          <p className="text-[10px] text-gray-400">PDF, DOC, DOCX (Max 10MB)</p>
                        </>
                      )}
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleInputChange('file', e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2"
                >
                  {uploading ? 'Mengunggah...' : 'Simpan ke Database'}
                </button>
              </form>
            </div>
          </aside>

          {/* RIGHT COLUMN: LIST & FILTER */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-2 rounded-xl shadow-sm border border-gray-200">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedCategory(opt.value)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition ${
                      selectedCategory === opt.value 
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Cari judul akta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 focus:ring-0 rounded-lg transition"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Grid Content */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-black rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Memuat data...</p>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="inline-flex p-3 bg-gray-50 rounded-full mb-3">
                    <Filter className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-900 font-medium">Tidak ada draft ditemukan</p>
                <p className="text-sm text-gray-500">Coba ganti kategori atau kata kunci pencarian.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredDrafts.map((draft) => (
                  <div key={draft.id} className="group bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-start gap-3 mb-4">
                      {getFileIcon(draft.filename)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                draft.category === 'Notaris' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                                {draft.category}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {new Date(draft.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 truncate" title={draft.title}>{draft.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{draft.filename}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <a 
                        href={draft.fileUrl} 
                        download 
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-bold hover:bg-gray-900 hover:text-white transition group/btn"
                      >
                        <Download size={14} className="group-hover/btn:-translate-y-0.5 transition-transform"/> Download
                      </a>
                      <button 
                        onClick={() => handleDelete(draft.id)}
                        disabled={deletingId === draft.id}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                        title="Hapus Draft"
                      >
                        {deletingId === draft.id ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}