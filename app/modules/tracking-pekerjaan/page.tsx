'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getTrackingJobs,
  saveTrackingJob,
  deleteTrackingJob,
  addProgressUpdate,
  deleteProgressUpdate,
  type TrackingJob,
  type ProgressItem,
} from './actions';

// --- HELPERS ---
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getMonthName = (date: Date) => {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
};

export default function TrackingPekerjaanPage() {
  const [jobs, setJobs] = useState<TrackingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Modal States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Edit States
  const [editingJob, setEditingJob] = useState<Partial<TrackingJob> | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<Partial<ProgressItem> | null>(null);
  const [isAddingProgress, setIsAddingProgress] = useState(false); // Track if we're adding/editing progress vs creating job
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null); // null = new progress, string = editing existing

  // --- DATA LOADING ---
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTrackingJobs();
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to load jobs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- MONTH NAVIGATION ---
  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // --- CALENDAR COMPUTATIONS ---
  const { daysInMonth, firstDayOfWeek, monthDisplay } = useMemo(() => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const display = getMonthName(new Date(currentYear, currentMonth, 1));
    return { daysInMonth: days, firstDayOfWeek: firstDay, monthDisplay: display };
  }, [currentMonth, currentYear]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [daysInMonth]);

  // --- FILTERING ---
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.clientName.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by current month/year
      const startDate = new Date(j.startDate);
      const endDate = j.actualFinishDate
        ? new Date(j.actualFinishDate)
        : j.estimatedFinishDate
          ? new Date(j.estimatedFinishDate)
          : new Date();

      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

      const inMonth =
        (startDate <= monthEnd && endDate >= monthStart) ||
        (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear);

      return matchesSearch && inMonth;
    });
  }, [jobs, searchQuery, currentMonth, currentYear]);

  // --- PROGRESS BAR CALCULATIONS ---
  const getProgressBarStyles = (job: TrackingJob) => {
    const CELL_WIDTH = 40; // px per day
    const startDate = new Date(job.startDate);
    const today = new Date();

    const monthStart = new Date(currentYear, currentMonth, 1);

    // Calculate left position
    let leftPos = 0;
    if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
      leftPos = (startDate.getDate() - 1) * CELL_WIDTH;
    }

    // Calculate bar width and color based on status
    let mainBarWidth = 0;
    let mainBarColor = '';
    let estimatedBarWidth = 0;

    if (job.status === 'Done' && job.actualFinishDate) {
      const finishDate = new Date(job.actualFinishDate);
      const daysDiff = Math.ceil(
        (finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      mainBarWidth = (daysDiff + 1) * CELL_WIDTH;
      mainBarColor = 'bg-emerald-500'; // Green
    } else if (job.status === 'On Progress') {
      const daysDiff = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      mainBarWidth = Math.max(0, daysDiff) * CELL_WIDTH;
      mainBarColor = 'bg-blue-500'; // Blue

      // Show estimated bar if exists
      if (job.estimatedFinishDate) {
        const estimatedDate = new Date(job.estimatedFinishDate);
        const estimatedDiff = Math.ceil(
          (estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        estimatedBarWidth = Math.max(0, estimatedDiff) * CELL_WIDTH;
      }
    } else if (job.status === 'Issue') {
      const daysDiff = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      mainBarWidth = Math.max(0, daysDiff + 1) * CELL_WIDTH;
      mainBarColor = 'bg-red-500'; // Red

      // Show estimated bar if exists
      if (job.estimatedFinishDate) {
        const estimatedDate = new Date(job.estimatedFinishDate);
        const estimatedDiff = Math.ceil(
          (estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        estimatedBarWidth = Math.max(0, estimatedDiff) * CELL_WIDTH;
      }
    }

    return {
      leftPos,
      mainBarWidth,
      mainBarColor,
      estimatedBarWidth,
    };
  };

  // Progress item bar styles (progress items displayed as bars)
  const getProgressItemBarStyles = (progressItem: ProgressItem) => {
    const CELL_WIDTH = 40;

    // Parse date as local time to avoid UTC timezone offset issues
    const rawDate = progressItem.date;
    const startDate = new Date(rawDate);
    // Normalize to local midnight
    const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Calculate left position using local date
    let leftPos = 0;
    if (startLocal.getMonth() === currentMonth && startLocal.getFullYear() === currentYear) {
      leftPos = (startLocal.getDate() - 1) * CELL_WIDTH;
    }

    // Calculate bar width and color based on status
    let barWidth = 0;
    let barColor = '';
    let estimatedBarWidth = 0;

    if (progressItem.status === 'Done') {
      if (progressItem.actualFinishDate) {
        const finishDate = new Date(progressItem.actualFinishDate);
        const finishLocal = new Date(finishDate.getFullYear(), finishDate.getMonth(), finishDate.getDate());
        const daysDiff = Math.round(
          (finishLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)
        );
        barWidth = (daysDiff + 1) * CELL_WIDTH;
      } else {
        // Fallback: show at least 1 day bar so it's visible
        barWidth = CELL_WIDTH;
      }
      barColor = 'bg-emerald-500';
    } else if (progressItem.status === 'On Progress') {
      const daysDiff = Math.round(
        (todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)
      );
      barWidth = Math.max(1, daysDiff) * CELL_WIDTH;
      barColor = 'bg-blue-500';

      if (progressItem.estimatedFinishDate) {
        const estimatedDate = new Date(progressItem.estimatedFinishDate);
        const estimatedLocal = new Date(estimatedDate.getFullYear(), estimatedDate.getMonth(), estimatedDate.getDate());
        const estimatedDiff = Math.round(
          (estimatedLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24)
        );
        estimatedBarWidth = Math.max(0, estimatedDiff) * CELL_WIDTH;
      }
    } else if (progressItem.status === 'Issue') {
      const daysDiff = Math.round(
        (todayLocal.getTime() - startLocal.getTime()) / (1000 * 60 * 60 * 24)
      );
      barWidth = Math.max(1, daysDiff + 1) * CELL_WIDTH;
      barColor = 'bg-red-500';

      if (progressItem.estimatedFinishDate) {
        const estimatedDate = new Date(progressItem.estimatedFinishDate);
        const estimatedLocal = new Date(estimatedDate.getFullYear(), estimatedDate.getMonth(), estimatedDate.getDate());
        const estimatedDiff = Math.round(
          (estimatedLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24)
        );
        estimatedBarWidth = Math.max(0, estimatedDiff) * CELL_WIDTH;
      }
    }

    return {
      leftPos,
      barWidth,
      barColor,
      estimatedBarWidth,
    };
  };

  // --- HANDLERS ---
  const handleCreateJob = () => {
    setIsAddingProgress(false);
    setSelectedJobId(null);
    setEditingJob({
      title: '',
      description: '',
      status: 'On Progress',
      startDate: new Date().toISOString().split('T')[0],
      pic: '',
      clientName: '',
      progressHistory: [],
    });
    setIsJobModalOpen(true);
  };

  const handleEditJob = (job: TrackingJob) => {
    setIsAddingProgress(false);
    setSelectedJobId(null);
    setEditingJob({ ...job });
    setIsJobModalOpen(true);
  };

  const handleSaveJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    // Save as job (progress is handled via its own modal)
    await saveTrackingJob(editingJob);
    setIsJobModalOpen(false);
    setSelectedJobId(null);
    loadData();
  };


  const handleDeleteJob = async (id: string) => {
    if (confirm('Hapus seluruh data pekerjaan ini?')) {
      await deleteTrackingJob(id);
      loadData();
    }
  };

  const handleAddProgress = (jobId: string) => {
    setIsAddingProgress(true);
    setSelectedJobId(jobId);
    setEditingProgressId(null); // new progress

    // Find the job to pre-fill client name and PIC
    const job = jobs.find(j => j.id === jobId);

    setEditingProgress({
      title: '',
      description: '',
      status: 'On Progress',
      date: new Date().toISOString(),
      pic: job?.pic || '',
      clientName: job?.clientName || '',
    });
    setIsProgressModalOpen(true);
  };

  const handleEditProgress = (jobId: string, progressItem: ProgressItem) => {
    setIsAddingProgress(true);
    setSelectedJobId(jobId);
    setEditingProgressId(progressItem.id);
    setEditingProgress({ ...progressItem });
    setIsProgressModalOpen(true);
  };

  const handleSaveProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !editingProgress) return;
    // Pass id if editing existing progress (so addProgressUpdate does update not insert)
    const progressData = editingProgressId
      ? { ...editingProgress, id: editingProgressId }
      : editingProgress;
    await addProgressUpdate(selectedJobId, progressData);
    setIsProgressModalOpen(false);
    setIsAddingProgress(false);
    setEditingProgressId(null);
    loadData();
  };

  const CELL_WIDTH = 40;
  const timelineWidth = daysInMonth * CELL_WIDTH;

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

        {/* Month Slider */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-bold uppercase tracking-wider min-w-[180px] text-center">
            {monthDisplay}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className="grid grid-cols-[1.5fr_130px_80px] w-full text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Nama Pekerjaan</span>
              <span>Progress Terakhir</span>
              <span>PIC</span>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {filteredJobs.map((job) => {
              // Calculate row height based on number of bars (1 for main job + progress items)
              const totalBars = 1 + (job.progressHistory?.length || 0);
              const rowHeight = Math.max(70, totalBars * 40 + 20);

              return (
                <div
                  key={job.id}
                  className="border-b border-gray-100 px-4 hover:bg-blue-50/30 transition-colors flex items-center group relative"
                  style={{ height: `${rowHeight}px` }}
                >
                  <div className="grid grid-cols-[1.5fr_130px_80px] w-full items-center gap-2">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-sm text-gray-900 truncate" title={job.title}>
                        {job.title}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate" title={job.clientName}>
                        {job.clientName}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-600 truncate" title={job.lastProgress || 'No progress yet'}>
                      {job.lastProgress || '-'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                      <User size={12} className="text-gray-400 shrink-0" /> {job.pic.split(' ')[0]}
                    </div>
                  </div>

                  {/* Quick Actions overlay on hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm shadow-sm border rounded-md flex">
                    <button onClick={() => handleEditJob(job)} className="p-1.5 hover:text-blue-600">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredJobs.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No tasks found</div>
            )}
          </div>
        </div>

        {/* --- RIGHT SIDE: CALENDAR TIMELINE --- */}
        <div className="flex-1 overflow-auto bg-white relative">
          <div style={{ width: timelineWidth }} className="min-w-full">
            {/* Timeline Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              {/* Day Row */}
              <div className="h-[80px] flex bg-gray-50/50">
                {calendarDays.map((day) => {
                  const date = new Date(currentYear, currentMonth, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={day}
                      style={{ width: CELL_WIDTH }}
                      className={`flex items-center justify-center text-[11px] border-r border-gray-100 ${isToday
                        ? 'bg-blue-100 text-blue-600 border border-blue-700 font-bold'
                        : isWeekend
                          ? 'bg-red-100/50 text-red-400'
                          : 'text-gray-600'
                        }`}
                    >
                      <div className="flex flex-col items-center leading-none gap-0.5">
                        <span>{day}</span>
                        <span className="text-[10px] opacity-80">
                          {date.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body */}
            <div className="relative">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {calendarDays.map((day) => {
                  const date = new Date(currentYear, currentMonth, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={day}
                      style={{ width: CELL_WIDTH }}
                      className={`border-r border-gray-100 h-full ${isToday ? 'bg-blue-50/30' : isWeekend ? 'bg-gray-50/20' : ''
                        }`}
                    ></div>
                  );
                })}
              </div>

              {/* Job Rows with Progress Bars */}
              {filteredJobs.map((job) => {
                const barStyles = getProgressBarStyles(job);

                // Calculate row height based on number of bars (1 for main job + progress items)
                const totalBars = 1 + (job.progressHistory?.length || 0);
                const rowHeight = Math.max(70, totalBars * 40 + 20);

                return (
                  <div
                    key={job.id}
                    className="border-b border-gray-100 relative group hover:bg-blue-50/10 transition-all"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {/* Main Job Progress Bar */}
                    <div
                      className={`absolute h-[28px] ${barStyles.mainBarColor}  shadow-sm z-10 flex items-center px-3 text-white text-xs font-medium`}
                      style={{
                        left: `${barStyles.leftPos}px`,
                        width: `${barStyles.mainBarWidth}px`,
                        top: '10px',
                      }}
                    >
                      <span className="truncate">{job.title}</span>
                    </div>

                    {/* Estimated Bar (Gray) for main job */}
                    {barStyles.estimatedBarWidth > 0 && (
                      <div
                        className="absolute h-[28px] bg-gray-300 shadow-sm z-5"
                        style={{
                          left: `${barStyles.leftPos + barStyles.mainBarWidth}px`,
                          width: `${barStyles.estimatedBarWidth}px`,
                          top: '10px',
                        }}
                      ></div>
                    )}

                    {/* Progress Item Bars */}
                    {job.progressHistory?.map((progressItem, index) => {
                      const progressBarStyles = getProgressItemBarStyles(progressItem);
                      return (
                        <div key={progressItem.id}>
                          {/* Progress item main bar — clickable to edit */}
                          <div
                            className={`absolute h-[28px] ${progressBarStyles.barColor} shadow-sm z-10 flex items-center px-3 text-white text-xs font-medium cursor-pointer hover:brightness-110 hover:shadow-lg transition`}
                            style={{
                              left: `${progressBarStyles.leftPos}px`,
                              width: `${progressBarStyles.barWidth}px`,
                              top: `${10 + (index + 1) * 40}px`,
                              minWidth: '40px',
                            }}
                            title={`${progressItem.title} - ${progressItem.status}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProgress(job.id, progressItem);
                            }}
                          >
                            <span className="truncate">{progressItem.title}</span>
                          </div>

                          {/* Estimated bar for progress item */}
                          {progressBarStyles.estimatedBarWidth > 0 && (
                            <div
                              className="absolute h-[28px] bg-gray-300/70 shadow-sm z-5"
                              style={{
                                left: `${progressBarStyles.leftPos + progressBarStyles.barWidth}px`,
                                width: `${progressBarStyles.estimatedBarWidth}px`,
                                top: `${10 + (index + 1) * 40}px`,
                              }}
                            ></div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Progress Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddProgress(job.id);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-lg transition-all z-40 flex items-center gap-1"
                      title="Add Progress"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                );
              })}

              {filteredJobs.length === 0 && <div className="h-[200px]"></div>}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL EDIT/ADD JOB --- */}
      {isJobModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">
                {isAddingProgress ? 'Update Progress' : 'Kelola Data Pekerjaan'}
              </h3>
              <button onClick={() => setIsJobModalOpen(false)}>
                <X size={20} className="text-gray-400 hover:text-black" />
              </button>
            </div>
            <form onSubmit={handleSaveJobSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Judul Pekerjaan *</label>
                <input
                  required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  placeholder="Contoh: Pendirian PT"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Deskripsi (Opsional)</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  rows={3}
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  placeholder="Detail pekerjaan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nama Klien *</label>
                  <input
                    required
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingJob.clientName}
                    onChange={(e) => setEditingJob({ ...editingJob, clientName: e.target.value })}
                    placeholder="PT. MAJU MUNDUR"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">PIC *</label>
                  <input
                    required
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingJob.pic}
                    onChange={(e) => setEditingJob({ ...editingJob, pic: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Waktu Entry *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  value={
                    editingJob.startDate
                      ? new Date(new Date(editingJob.startDate).getTime() - new Date().getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditingJob({
                      ...editingJob,
                      startDate: new Date(e.target.value).toISOString().split('T')[0],
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status Tahapan *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['On Progress', 'Done', 'Issue'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setEditingJob({
                          ...editingJob,
                          status: s as any,
                          actualFinishDate: s === 'Done' ? editingJob.actualFinishDate : undefined,
                          estimatedFinishDate: s !== 'Done' ? editingJob.estimatedFinishDate : undefined,
                        })
                      }
                      className={`text-xs py-2 rounded-lg border font-medium transition ${editingJob.status === s
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Fields */}
              {(editingJob.status === 'On Progress' || editingJob.status === 'Issue') && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Tanggal Estimasi Selesai (Opsional)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingJob.estimatedFinishDate || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, estimatedFinishDate: e.target.value })}
                  />
                </div>
              )}

              {editingJob.status === 'Done' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingJob.actualFinishDate || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, actualFinishDate: e.target.value })}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition shadow-lg"
              >
                Simpan Pekerjaan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ADD / EDIT PROGRESS --- */}
      {isProgressModalOpen && editingProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">
                {editingProgressId ? 'Edit Progress' : 'Tambah Progress'}
              </h3>
              <button onClick={() => { setIsProgressModalOpen(false); setIsAddingProgress(false); setEditingProgressId(null); }}>
                <X size={20} className="text-gray-400 hover:text-black" />
              </button>
            </div>
            <form onSubmit={handleSaveProgressSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Judul Progress *</label>
                <input
                  required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  value={editingProgress.title || ''}
                  onChange={(e) => setEditingProgress({ ...editingProgress, title: e.target.value })}
                  placeholder="Contoh: Upload Berkas"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Deskripsi (Opsional)</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  rows={3}
                  value={editingProgress.description || ''}
                  onChange={(e) => setEditingProgress({ ...editingProgress, description: e.target.value })}
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nama Klien</label>
                  <input
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingProgress.clientName || ''}
                    onChange={(e) => setEditingProgress({ ...editingProgress, clientName: e.target.value })}
                    placeholder="PT. MAJU MUNDUR"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">PIC</label>
                  <input
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingProgress.pic || ''}
                    onChange={(e) => setEditingProgress({ ...editingProgress, pic: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Waktu Entry *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                  value={
                    editingProgress.date
                      ? new Date(
                        new Date(editingProgress.date).getTime() - new Date().getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditingProgress({ ...editingProgress, date: new Date(e.target.value).toISOString() })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status Tahapan *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['On Progress', 'Done', 'Issue'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditingProgress({
                        ...editingProgress,
                        status: s as any,
                        actualFinishDate: s === 'Done' ? editingProgress.actualFinishDate : undefined,
                        estimatedFinishDate: s !== 'Done' ? editingProgress.estimatedFinishDate : undefined,
                      })}
                      className={`text-xs py-2 rounded-lg border font-medium transition ${editingProgress.status === s
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {(editingProgress.status === 'On Progress' || editingProgress.status === 'Issue') && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tanggal Estimasi Selesai (Opsional)</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingProgress.estimatedFinishDate || ''}
                    onChange={(e) => setEditingProgress({ ...editingProgress, estimatedFinishDate: e.target.value })}
                  />
                </div>
              )}

              {editingProgress.status === 'Done' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    value={editingProgress.actualFinishDate || ''}
                    onChange={(e) => setEditingProgress({ ...editingProgress, actualFinishDate: e.target.value })}
                  />
                </div>
              )}

              <div className="flex gap-2">
                {editingProgressId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Hapus progress ini?')) {
                        if (selectedJobId && editingProgressId) {
                          await deleteProgressUpdate(selectedJobId, editingProgressId);
                          setIsProgressModalOpen(false);
                          setIsAddingProgress(false);
                          setEditingProgressId(null);
                          loadData();
                        }
                      }
                    }}
                    className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition"
                  >
                    Hapus Progress
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                >
                  {editingProgressId ? 'Update Progress' : 'Simpan Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}