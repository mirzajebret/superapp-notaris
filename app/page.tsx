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
    Clock
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
    // Assuming drafts don't have a strict "month" but are "active" if recent
    const recentDrafts = (drafts as Draft[])
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5);

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">

            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Selamat datang kembali, lihat ringkasan kinerja kantor bulan ini.</p>
                </div>
                <div className="text-sm bg-blue-600 border px-4 py-2 rounded-full font-bold shadow-sm text-white flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* --- STATS ROW (REAL DATA) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* CARD 1: PENDAPATAN (INVOICE) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={80} className="text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600 ring-1 ring-blue-100">
                            <DollarSign size={24} />
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${revenueGrowth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {revenueGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Pendapatan (Bulan Ini)</h3>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoiceStats.currentValue)}</p>
                        <p className="text-xs text-gray-400 mt-2">Dari {invoiceStats.currentCount} invoice terbit</p>
                    </div>
                </div>

                {/* CARD 2: TOTAL AKTA (DEEDS) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={80} className="text-purple-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="bg-purple-50 p-3 rounded-xl text-purple-600 ring-1 ring-purple-100">
                            <FileText size={24} />
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${deedGrowth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {deedGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {deedGrowth > 0 ? '+' : ''}{deedGrowth}%
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Akta Dibuat (Bulan Ini)</h3>
                        <p className="text-3xl font-bold text-gray-900">{deedStats.currentCount}</p>
                        <p className="text-xs text-gray-400 mt-2">Vs {deedStats.lastCount} akta bulan lalu</p>
                    </div>
                </div>

                {/* CARD 3: DRAFT AKTIF */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FolderInput size={80} className="text-orange-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="bg-orange-50 p-3 rounded-xl text-orange-600 ring-1 ring-orange-100">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            Realtime
                        </span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Draft Sedang Dikerjakan</h3>
                        <p className="text-3xl font-bold text-gray-900">{drafts.length}</p>
                        <p className="text-xs text-gray-400 mt-2">Total draft belum selesai</p>
                    </div>
                </div>
            </div>

            {/* --- SECONDARY ROW: Recent Activity & Quick Links --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Drafts List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Pekerjaan Terakhir</h3>
                        <Link href="/modules/bank-draft" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            Lihat Semua <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentDrafts.length > 0 ? (
                            recentDrafts.map((draft, i) => (
                                <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{draft.title || 'Draft Tanpa Judul'}</p>
                                            <p className="text-xs text-gray-500">Diupdate: {new Date(draft.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                                        Draft
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">Belum ada pekerjaan terbaru.</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Aksi Cepat</h3>
                        <p className="text-blue-100 text-sm mb-6">Pintas menu yang sering digunakan untuk mempercepat pekerjaan.</p>

                        <div className="space-y-3">
                            <Link href="/modules/laporan-bulanan" className="block bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-xl transition flex items-center gap-3 border border-white/10">
                                <FileText size={18} className="text-blue-200" />
                                <span className="text-sm font-medium">Buat Laporan Bulanan</span>
                            </Link>
                            <Link href="/modules/invoice" className="block bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-xl transition flex items-center gap-3 border border-white/10">
                                <DollarSign size={18} className="text-blue-200" />
                                <span className="text-sm font-medium">Buat Invoice Baru</span>
                            </Link>
                            <Link href="/modules/penggaris-akta" className="block bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-xl transition flex items-center gap-3 border border-white/10">
                                <Activity size={18} className="text-blue-200" />
                                <span className="text-sm font-medium">Penggaris Akta</span>
                            </Link>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10 text-xs text-blue-200 text-center">
                        SuperApp Notaris v1.0
                    </div>
                </div>

            </div>
        </div>
    );
}