'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  User,
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

// --- HELPERS ---
const getDaysArray = (start: Date, end: Date) => {
  const arr = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
};

const formatDateID = (date: Date) => { // format DD/MM for display
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
};

const getMonthName = (date: Date) => {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

export default function TimelinePekerjaanPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Layout State
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Modal States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Edit States
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
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

  // --- GANTT COMPUTATIONS ---
  const { timelineStart, timelineEnd, days, months, totalDays } = useMemo(() => {
    if (jobs.length === 0) {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const end = new Date();
      end.setDate(end.getDate() + 21);
      return { timelineStart: start, timelineEnd: end, days: getDaysArray(start, end), months: [], totalDays: 28 };
    }

    const startDates = jobs.map(j => new Date(j.startDate).getTime()).filter(t => !isNaN(t));
    const endDates = jobs.map(j => new Date(j.targetDate).getTime()).filter(t => !isNaN(t));

    // Default range if dates are invalid
    let minDate = startDates.length ? new Date(Math.min(...startDates)) : new Date();
    let maxDate = endDates.length ? new Date(Math.max(...endDates)) : new Date();

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);

    if (maxDate <= minDate) {
      maxDate = new Date(minDate);
      maxDate.setDate(maxDate.getDate() + 30);
    }

    const allDays = getDaysArray(minDate, maxDate);

    // Group days by month for the header
    const monthsGroup: { name: string, days: number }[] = [];
    let currentMonth = '';
    let currentCount = 0;

    allDays.forEach(day => {
      const mName = getMonthName(day);
      if (mName !== currentMonth) {
        if (currentMonth) monthsGroup.push({ name: currentMonth, days: currentCount });
        currentMonth = mName;
        currentCount = 1;
      } else {
        currentCount++;
      }
    });
    if (currentMonth) monthsGroup.push({ name: currentMonth, days: currentCount });

    return {
      timelineStart: minDate,
      timelineEnd: maxDate,
      days: allDays,
      months: monthsGroup,
      totalDays: allDays.length
    };
  }, [jobs]);

  // --- LAYOUT COMPUTATION ---
  const CELL_WIDTH = 40; // px per day

  const filteredJobs = jobs.filter(j =>
    j.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const processedJobs = useMemo(() => {
    return filteredJobs.map(job => {
      // 1. Sort history
      const sortedHistory = [...job.history]
        .map(h => ({
          ...h,
          dateObj: new Date(h.date),
          valid: !isNaN(new Date(h.date).getTime())
        }))
        .filter(h => h.valid)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      // 2. Assign Levels
      const levels: number[] = [];

      const markers = sortedHistory.map(h => {
        const diffTime = h.dateObj.getTime() - timelineStart.getTime();

        if (diffTime < 0) return null;

        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const leftPos = diffDays * CELL_WIDTH;

        // Estimate width
        const estimatedWidth = Math.min(180, Math.max(40, (h.title?.length || 0) * 8 + 30));
        const rightPos = leftPos + estimatedWidth + 10;

        // Find fit level
        let assignedLevel = -1;
        for (let i = 0; i < levels.length; i++) {
          if (levels[i] < leftPos) {
            assignedLevel = i;
            levels[i] = rightPos;
            break;
          }
        }

        if (assignedLevel === -1) {
          assignedLevel = levels.length;
          levels.push(rightPos);
        }

        return {
          ...h,
          leftPos,
          width: estimatedWidth,
          level: assignedLevel,
          rightPos
        };
      }).filter(Boolean) as (HistoryItem & { leftPos: number, width: number, level: number, rightPos: number })[];

      const maxLevel = Math.max(0, ...markers.map(i => i.level), levels.length - 1);
      const ROW_HEIGHT_PER_LEVEL = 32;
      const BASE_ROW_HEIGHT = 60;
      const contentHeight = (maxLevel + 1) * ROW_HEIGHT_PER_LEVEL + 20;
      const rowHeight = Math.max(BASE_ROW_HEIGHT, contentHeight);

      const maxRight = Math.max(0, ...markers.map(i => i.rightPos));

      return {
        ...job,
        rowHeight,
        markers,
        maxRight
      };
    });
  }, [filteredJobs, timelineStart]);

  const timelineWidth = totalDays * CELL_WIDTH;

  const getBarStyles = (start: string, end: string) => {
    const sDate = new Date(start);
    let eDate = new Date(end);

    // Handle invalid end dates or end before start
    if (isNaN(eDate.getTime()) || eDate < sDate) eDate = new Date(sDate);

    const diffTime = Math.abs(sDate.getTime() - timelineStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const durationTime = Math.abs(eDate.getTime() - sDate.getTime());
    const durationDays = Math.ceil(durationTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end day

    return {
      left: `${diffDays * CELL_WIDTH}px`,
      width: `${durationDays * CELL_WIDTH}px`
    };
  };

  // --- HANDLERS ---
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

  const handleAddHistory = (jobId: string) => {
    setSelectedJobId(jobId);
    setEditingHistory({
      date: new Date().toISOString(),
      title: '',
      description: '',
      status: 'On Progress'
    });
    setIsHistoryModalOpen(true);
  };

  const handleSaveHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !editingHistory) return;
    await saveTimelineItem(selectedJobId, editingHistory);
    setIsHistoryModalOpen(false);
    loadData();
  };

  // --- HELPERS FOR UI ---
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getPriorityClasses = (p: string) => {
    switch (p) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">

      {/* --- TOP BAR --- */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Job Tracker</h1>
            <p className="text-xs text-gray-500">Monitoring & Schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleCreateJob}
            className="bg-blue-600 hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-lg shadow-gray-200"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Pekerjaan Baru</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* --- LEFT SIDEBAR: TASK LIST --- */}
        <div className="w-[300px] md:w-[400px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="h-[80px] border-b border-gray-200 bg-gray-50/50 flex items-end pb-2 px-4 shadow-sm z-20">
            <div className="grid grid-cols-[1.5fr_100px_80px] w-full text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Nama Pekerjaan</span>
              <span>Status</span>
              <span>PIC</span>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {processedJobs.map(job => (
              <div key={job.id} style={{ height: `${job.rowHeight}px` }} className="border-b border-gray-100 px-4 hover:bg-blue-50/30 transition-colors flex items-center group relative">
                <div className="grid grid-cols-[1.5fr_100px_80px] w-full items-center gap-2">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-sm text-gray-900 truncate" title={job.serviceName}>{job.serviceName}</div>
                    <div className="text-[10px] text-gray-500 truncate" title={job.clientName}>{job.clientName}</div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getPriorityClasses(job.priority)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                    <User size={12} className="text-gray-400 shrink-0" /> {job.pic.split(' ')[0]}
                  </div>
                </div>

                {/* Quick Actions overlay on hover */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm shadow-sm border rounded-md flex">
                  <button onClick={() => handleEditJob(job)} className="p-1.5 hover:text-blue-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {processedJobs.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No tasks found</div>}
          </div>
        </div>

        {/* --- RIGHT SIDE: CHART --- */}
        <div className="flex-1 overflow-auto bg-white relative">
          <div style={{ width: timelineWidth }} className="min-w-full">

            {/* Timeline Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              {/* Month Row */}
              <div className="h-[40px] flex border-b border-gray-100 bg-gray-50/50">
                {months.map((m, idx) => (
                  <div key={idx} style={{ width: m.days * CELL_WIDTH }} className="flex items-center justify-center text-xs font-bold text-gray-500 border-r border-gray-200/50 uppercase tracking-widest sticky-left">
                    {m.name}
                  </div>
                ))}
              </div>
              {/* Day Row */}
              <div className="h-[40px] flex bg-white">
                {days.map((d, idx) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div key={idx} style={{ width: CELL_WIDTH }} className={`flex items-center justify-center text-[11px] border-r border-gray-100 ${isToday ? 'bg-blue-50 text-blue-600 font-bold' : isWeekend ? 'bg-red-100/50 text-red-400' : 'text-gray-600'}`}>
                      <div className="flex flex-col items-center leading-none gap-0.5">
                        <span>{d.getDate()}</span>
                        <span className="text-[10px] opacity-80">{d.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 1)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Timeline Body */}
            <div className="relative">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {days.map((d, idx) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div key={idx} style={{ width: CELL_WIDTH }} className={`border-r border-gray-100 h-full ${isToday ? 'bg-blue-50/30' : isWeekend ? 'bg-gray-50/20' : ''}`}></div>
                  )
                })}
                {/* Current Time Line */}
                {/* (Ideally we calculate offset for the current time line) */}
              </div>

              {/* Bars Rows */}
              {processedJobs.map(job => {
                return (
                  <div key={job.id} style={{ height: `${job.rowHeight}px` }} className="border-b border-gray-100 relative group hover:bg-blue-50/10 transition-all">

                    {/* Background Row Highlight on Hover */}
                    <div className="absolute inset-0 bg-transparent group-hover:bg-blue-50/5 pointer-events-none " />

                    {/* History Markers (Stacked) */}
                    {job.markers.map((h) => (
                      <div
                        key={h.id}
                        className={`absolute px-3 shadow-sm z-30 cursor-pointer flex items-center justify-between gap-2 border border-white/20 backdrop-blur-sm ${h.status === 'Done' ? 'bg-emerald-500 text-white' :
                          h.status === 'Issue' ? 'bg-red-500 text-white' :
                            h.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                          }`}
                        style={{
                          left: `${h.leftPos}px`,
                          top: `${10 + (h.level * 32)}px`,
                          height: '28px',
                          width: `${h.width}px`
                        }}
                        title={`${new Date(h.date).toLocaleDateString('id-ID')} - ${h.title} (${h.status})${h.description ? `\n${h.description}` : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobId(job.id);
                          setEditingHistory({ ...h });
                          setIsHistoryModalOpen(true);
                        }}
                      >
                        <span className="text-[12px] truncate leading-none">{h.title}</span>
                      </div>
                    ))}

                    {/* Add Progress Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddHistory(job.id); }}
                      className="absolute ml-4 p-2 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-lg transition-all z-40 flex items-center gap-1"
                      style={{
                        left: `${job.maxRight}px`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                      title="Add Progress"
                    >
                      <Plus size={14} />
                    </button>

                  </div>
                );
              })}

              {processedJobs.length === 0 && <div className="h-[200px]"></div>}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL EDIT/ADD JOB --- */}
      {isJobModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Kelola Data Pekerjaan</h3>
              <button onClick={() => setIsJobModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black" /></button>
            </div>
            <form onSubmit={handleSaveJobSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nama Klien</label>
                <input required className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.clientName} onChange={e => setEditingJob({ ...editingJob, clientName: e.target.value })} placeholder="Contoh: PT. MAJU MUNDUR" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Layanan</label>
                <input required className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.serviceName} onChange={e => setEditingJob({ ...editingJob, serviceName: e.target.value })} placeholder="Contoh: Pendirian PT" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">PIC</label>
                  <input required className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.pic} onChange={e => setEditingJob({ ...editingJob, pic: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Prioritas</label>
                  <select className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.priority} onChange={e => setEditingJob({ ...editingJob, priority: e.target.value as any })}>
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tgl Mulai</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.startDate} onChange={e => setEditingJob({ ...editingJob, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Target Selesai</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.targetDate} onChange={e => setEditingJob({ ...editingJob, targetDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status Umum</label>
                <input className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingJob.status} onChange={e => setEditingJob({ ...editingJob, status: e.target.value })} placeholder="Contoh: Proses di Kemenkumham" />
              </div>

              {/* History List preview in Edit (optional) */}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">Simpan Pekerjaan</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT/ADD HISTORY --- */}
      {isHistoryModalOpen && editingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  value={editingHistory.date ? new Date(new Date(editingHistory.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => setEditingHistory({ ...editingHistory, date: new Date(e.target.value).toISOString() })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Judul Aktivitas</label>
                <input required className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" value={editingHistory.title} onChange={e => setEditingHistory({ ...editingHistory, title: e.target.value })} placeholder="Contoh: Upload Berkas" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Deskripsi Detail</label>
                <textarea className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none" rows={3} value={editingHistory.description} onChange={e => setEditingHistory({ ...editingHistory, description: e.target.value })} placeholder="Keterangan tambahan..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status Tahapan</label>
                <div className="grid grid-cols-2 gap-2">
                  {['On Progress', 'Done', 'Pending', 'Issue'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditingHistory({ ...editingHistory, status: s as any })}
                      className={`text-xs py-2 rounded-lg border font-medium transition ${editingHistory.status === s ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {editingHistory.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Hapus histori ini?')) {
                        if (selectedJobId && editingHistory.id) {
                          await deleteTimelineItem(selectedJobId, editingHistory.id);
                          setIsHistoryModalOpen(false);
                          loadData();
                        }
                      }
                    }}
                    className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition"
                  >
                    Hapus
                  </button>
                )}
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">Simpan Progress</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}