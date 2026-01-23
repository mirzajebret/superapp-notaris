'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus,
  Search,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  User
} from 'lucide-react';
import { getJobs, saveJob, deleteJob, saveTimelineItem, deleteTimelineItem } from '@/app/actions';

// --- TYPES ---
interface HistoryItem {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'Done' | 'On Progress' | 'Pending' | 'Issue';
}

interface Job {
  id: string;
  clientName: string;
  serviceName: string;
  status: string;
  priority: 'High' | 'Medium' | 'Normal';
  startDate: string;
  targetDate: string;
  pic: string;
  history: HistoryItem[];
}

// --- COMPONENTS ---

export default function TimelinePekerjaanPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Edit States
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null); // For adding history
  const [editingHistory, setEditingHistory] = useState<Partial<HistoryItem> | null>(null);

  // --- DATA LOADING ---
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data || []);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- HANDLERS: JOB ---
  const handleCreateJob = () => {
    setEditingJob({
      clientName: '', serviceName: '', status: 'Baru', priority: 'Normal',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '', pic: '', history: []
    });
    setIsJobModalOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob({ ...job });
    setIsJobModalOpen(true);
  };

  const handleSaveJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    await saveJob(editingJob);
    setIsJobModalOpen(false);
    loadData();
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm('Hapus seluruh data pekerjaan ini?')) {
      await deleteJob(id);
      loadData();
    }
  };

  // --- HANDLERS: HISTORY ---
  const handleAddHistory = (jobId: string) => {
    setSelectedJobId(jobId);
    setEditingHistory({
      date: new Date().toISOString(), // Simpan format ISO lengkap untuk jam
      title: '',
      description: '',
      status: 'On Progress'
    });
    setIsHistoryModalOpen(true);
  };

  const handleEditHistory = (jobId: string, item: HistoryItem) => {
    setSelectedJobId(jobId);
    setEditingHistory({ ...item });
    setIsHistoryModalOpen(true);
  };

  const handleSaveHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !editingHistory) return;

    await saveTimelineItem(selectedJobId, editingHistory);
    setIsHistoryModalOpen(false);
    loadData();
  };

  const handleDeleteHistory = async (jobId: string, historyId: string) => {
    if (confirm('Hapus progress ini?')) {
      await deleteTimelineItem(jobId, historyId);
      loadData();
    }
  }

  // --- RENDER HELPERS ---
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'Done': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Issue': return <AlertCircle size={16} className="text-red-500" />;
      case 'Pending': return <Clock size={16} className="text-amber-500" />;
      default: return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />;
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-gray-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tracking Pekerjaan</h1>
          <p className="text-gray-500 text-sm mt-1">Monitoring progres pekerjaan yang sedang berjalan.</p>
        </div>
        <button
          onClick={handleCreateJob}
          className="bg-black text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-gray-200"
        >
          <Plus size={18} /> Pekerjaan Baru
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Cari nama klien atau jenis layanan..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* JOBS GRID */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">

              {/* CARD HEADER */}
              <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-900">{job.clientName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium text-sm flex items-center gap-1.5">
                    <Briefcase size={14} className="text-gray-400" /> {job.serviceName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditJob(job)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition hover:text-blue-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-gray-400 hover:bg-red-50 rounded-lg transition hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* INFO ROW */}
              <div className="px-5 py-3 grid grid-cols-2 gap-4 bg-white text-xs border-b border-gray-50">
                <div className="flex items-center gap-2 text-gray-500">
                  <User size={14} /> PIC: <span className="font-semibold text-gray-700">{job.pic}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 justify-end">
                  <Calendar size={14} /> Target: <span className="font-semibold text-red-600">{new Date(job.targetDate).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              {/* TIMELINE AREA */}
              <div className="p-5 flex-1 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Timeline Progress</span>
                  <button
                    onClick={() => handleAddHistory(job.id)}
                    className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center gap-1"
                  >
                    <Plus size={12} /> Update Progress
                  </button>
                </div>

                <div className="relative pl-2 ml-2 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                  {job.history.length === 0 && (
                    <div className="text-xs text-gray-400 italic pl-6">Belum ada progress tercatat.</div>
                  )}
                  {job.history
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort Newest First
                    .map((item) => (
                      <div key={item.id} className="relative pl-6 group">
                        {/* Timeline Dot */}
                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${item.status === 'Done' ? 'bg-emerald-500' :
                          item.status === 'Issue' ? 'bg-red-500' :
                            item.status === 'Pending' ? 'bg-gray-300' : 'bg-blue-500'
                          }`}>
                        </div>

                        {/* Content */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-blue-200 transition group-hover:shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-gray-400">
                              {new Date(item.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => handleEditHistory(job.id, item)} className="p-1 hover:text-blue-600"><Edit2 size={10} /></button>
                              <button onClick={() => handleDeleteHistory(job.id, item.id)} className="p-1 hover:text-red-600"><Trash2 size={10} /></button>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-gray-800 mb-0.5">{item.title}</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                          <div className="mt-2 flex items-center gap-1.5">
                            {getStatusIcon(item.status)}
                            <span className="text-[10px] font-medium text-gray-500">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- MODAL EDIT/ADD JOB --- */}
      {isJobModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Kelola Data Pekerjaan</h3>
              <button onClick={() => setIsJobModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black" /></button>
            </div>
            <form onSubmit={handleSaveJobSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nama Klien</label>
                <input required className="w-full border rounded-lg p-2 text-sm" value={editingJob.clientName} onChange={e => setEditingJob({ ...editingJob, clientName: e.target.value })} placeholder="Contoh: PT. MAJU MUNDUR" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Layanan</label>
                <input required className="w-full border rounded-lg p-2 text-sm" value={editingJob.serviceName} onChange={e => setEditingJob({ ...editingJob, serviceName: e.target.value })} placeholder="Contoh: Pendirian PT" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">PIC</label>
                  <input required className="w-full border rounded-lg p-2 text-sm" value={editingJob.pic} onChange={e => setEditingJob({ ...editingJob, pic: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Prioritas</label>
                  <select className="w-full border rounded-lg p-2 text-sm" value={editingJob.priority} onChange={e => setEditingJob({ ...editingJob, priority: e.target.value as any })}>
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tgl Mulai</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm" value={editingJob.startDate} onChange={e => setEditingJob({ ...editingJob, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Target Selesai</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm" value={editingJob.targetDate} onChange={e => setEditingJob({ ...editingJob, targetDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status Umum</label>
                <input className="w-full border rounded-lg p-2 text-sm" value={editingJob.status} onChange={e => setEditingJob({ ...editingJob, status: e.target.value })} placeholder="Contoh: Proses di Kemenkumham" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">Simpan Pekerjaan</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT/ADD HISTORY --- */}
      {isHistoryModalOpen && editingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Update Progress Timeline</h3>
              <button onClick={() => setIsHistoryModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black" /></button>
            </div>
            <form onSubmit={handleSaveHistorySubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Waktu</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded-lg p-2 text-sm"
                  value={editingHistory.date ? new Date(new Date(editingHistory.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => setEditingHistory({ ...editingHistory, date: new Date(e.target.value).toISOString() })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Judul Aktivitas</label>
                <input required className="w-full border rounded-lg p-2 text-sm" value={editingHistory.title} onChange={e => setEditingHistory({ ...editingHistory, title: e.target.value })} placeholder="Contoh: Upload Berkas" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Deskripsi Detail</label>
                <textarea className="w-full border rounded-lg p-2 text-sm" rows={3} value={editingHistory.description} onChange={e => setEditingHistory({ ...editingHistory, description: e.target.value })} placeholder="Keterangan tambahan..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status Tahapan</label>
                <div className="grid grid-cols-2 gap-2">
                  {['On Progress', 'Done', 'Pending', 'Issue'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditingHistory({ ...editingHistory, status: s as any })}
                      className={`text-xs py-2 rounded-lg border font-medium transition ${editingHistory.status === s ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">Simpan Progress</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}