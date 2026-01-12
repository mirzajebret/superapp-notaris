import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import {
    FileText,
    FolderInput,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    ArrowRight,
    Clock,
    Users,
    BookOpen,
    Calculator,
    MessageCircle,
    CalendarClock,
    Sparkles
} from 'lucide-react';

// --- TYPES ---
type Invoice = {
    id: string;
    date: string;
    total: number;
    status: string;
};

type Deed = {
    id: string;
    tanggalAkta: string;
    judulAkta: string;
    jenis: 'Notaris' | 'PPAT';
};

type Draft = {
    id: string;
    title: string;
    uploadDate: string;
    status?: string;
};

// --- HELPER FUNCTIONS ---
async function getData() {
    const dataDir = path.join(process.cwd(), 'data');

    const readJson = async (filename: string) => {
        try {
            const filePath = path.join(dataDir, filename);
            const fileContents = await fs.readFile(filePath, 'utf8');
            return JSON.parse(fileContents);
        } catch (error) {
            return [];
        }
    };

    const [invoices, deeds, drafts] = await Promise.all([
        readJson('invoices.json'),
        readJson('deeds.json'),
        readJson('drafts.json'),
    ]);

    return { invoices, deeds, drafts };
}

function getMonthlyStats(data: any[], dateField: string, valueField?: string) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentCount = 0;
    let lastCount = 0;
    let currentValue = 0;
    let lastValue = 0;

    data.forEach((item) => {
        const itemDate = new Date(item[dateField]);
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();

        // Parse value if exists (handle "Rp 1.000.000" or raw numbers)
        let val = 0;
        if (valueField && item[valueField]) {
            if (typeof item[valueField] === 'string') {
                val = parseInt(item[valueField].replace(/[^0-9]/g, '')) || 0;
            } else {
                val = item[valueField];
            }
        }

        if (itemMonth === currentMonth && itemYear === currentYear) {
            currentCount++;
            currentValue += val;
        } else if (itemMonth === lastMonth && itemYear === lastMonthYear) {
            lastCount++;
            lastValue += val;
        }
    });

    return { currentCount, lastCount, currentValue, lastValue };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const calculateGrowth = (current: number, last: number) => {
    if (last === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - last) / last) * 100);
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
};

// --- COMPONENT ---
export default async function Dashboard() {
    const { invoices, deeds, drafts } = await getData();

    // 1. Calculate Invoice Stats (Pendapatan)
    const invoiceStats = getMonthlyStats(invoices, 'date', 'total');
    const revenueGrowth = calculateGrowth(invoiceStats.currentValue, invoiceStats.lastValue);

    // 2. Calculate Deed Stats (Akta)
    const deedStats = getMonthlyStats(deeds, 'tanggalAkta');
    const deedGrowth = calculateGrowth(deedStats.currentCount, deedStats.lastCount);

    // 3. Drafts (Active work)
    const recentDrafts = (drafts as Draft[])
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
            <div className="p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-blue-600" size={24} />
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getGreeting()}!</h1>
                        </div>
                        <p className="text-slate-600 text-sm">Lihat ringkasan kinerja kantor dan kelola pekerjaan kantor dengan mudah</p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 text-white text-sm">
                        <Calendar size={16} />
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* --- STATS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* CARD 1: PENDAPATAN */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-500/30">
                                <DollarSign size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                                {revenueGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Total Pendapatan</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(invoiceStats.currentValue)}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Dari {invoiceStats.currentCount} invoice bulan ini
                            </p>
                        </div>
                    </div>

                    {/* CARD 2: TOTAL AKTA */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-purple-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-purple-500/30">
                                <FileText size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${deedGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                                {deedGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {deedGrowth > 0 ? '+' : ''}{deedGrowth}%
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Akta Dibuat</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-1">{deedStats.currentCount}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                Vs {deedStats.lastCount} akta bulan lalu
                            </p>
                        </div>
                    </div>

                    {/* CARD 3: DRAFT AKTIF */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-orange-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl text-white shadow-lg shadow-orange-500/30">
                                <Activity size={24} />
                            </div>
                            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
                                Realtime
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Draft Dikerjakan</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-1">{drafts.length}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                Total draft belum selesai
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- SECONDARY ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-transparent">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Pekerjaan Terakhir</h3>
                                <p className="text-xs text-slate-500 mt-1">Draft yang baru saja diupdate</p>
                            </div>
                            <Link href="/modules/bank-draft" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                Lihat Semua <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentDrafts.length > 0 ? (
                                recentDrafts.map((draft, i) => (
                                    <div key={i} className="p-4 hover:bg-slate-50 transition-all duration-200 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-200">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{draft.title || 'Draft Tanpa Judul'}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Diupdate: {new Date(draft.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium ring-1 ring-slate-200">
                                            Draft
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FolderInput className="text-slate-400" size={28} />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Belum ada pekerjaan terbaru</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-16 -mb-16" />

                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">Aksi Cepat</h3>
                            <p className="text-slate-400 text-xs mb-6">Akses cepat ke tools favorit</p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <Link href="/modules/invoice" className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105">
                                    <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                        <DollarSign size={20} className="text-blue-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Invoice</span>
                                </Link>
                                <Link href="/modules/laporan-bulanan" className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105">
                                    <div className="bg-purple-500/20 p-2 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                                        <FileText size={20} className="text-purple-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Laporan</span>
                                </Link>
                                <Link href="/modules/cover-akta" className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105">
                                    <div className="bg-orange-500/20 p-2 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                                        <BookOpen size={20} className="text-orange-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Cover</span>
                                </Link>
                                <Link href="/modules/kalkulator-pajak" className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105">
                                    <div className="bg-green-500/20 p-2 rounded-lg group-hover:bg-green-500/30 transition-colors">
                                        <Calculator size={20} className="text-green-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Kalkulator</span>
                                </Link>
                                <Link href="/modules/chat-kantor" className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105">
                                    <div className="bg-pink-500/20 p-2 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                                        <MessageCircle size={20} className="text-pink-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Chat</span>
                                </Link>
                                <Link href="/modules/timeline-pekerjaan" className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105">
                                    <div className="bg-cyan-500/20 p-2 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                                        <CalendarClock size={20} className="text-cyan-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Timeline</span>
                                </Link>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <Link href="/modules/akun-client" className="block bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm p-3 rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 group">
                                    <Users size={18} className="text-blue-300 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-semibold">Kelola Akun Client</span>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 text-center relative z-10">
                            SuperApp Notaris v1.0
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}