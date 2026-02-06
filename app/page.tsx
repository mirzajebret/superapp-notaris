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
    Sparkles,
    Briefcase,
    Wallet,
    UserCheck,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    XCircle,
    Receipt,
    Building2,
} from 'lucide-react';

// --- TYPES ---
type Invoice = {
    id: string;
    createdAt?: string;
    date?: string;
    total: number;
    status?: string;
    recipient?: {
        name?: string;
        company?: string;
    };
    clientName?: string;
    nomorInvoice?: string;
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

type Job = {
    id: string;
    clientName: string;
    serviceName: string;
    status: string;
    priority?: string;
    totalCost?: number;
    paidAmount?: number;
    createdAt: string;
};

type PettyCashTransaction = {
    id: string;
    type: 'Debit' | 'Credit';
    date: string;
    category: string;
    nominal: number;
    description: string;
};

type Employee = {
    id: string;
    name: string;
    entryTimes?: Record<string, string>;
    attendanceOverrides?: Record<string, string>;
};

type ClientAccount = {
    id: string;
    name: string;
    status: string;
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

    const [invoices, deeds, drafts, jobs, pettyCash, employees, clients] = await Promise.all([
        readJson('invoices.json'),
        readJson('deeds.json'),
        readJson('drafts.json'),
        readJson('daftar-pekerjaan.json'),
        readJson('petty-cash-transactions.json'),
        readJson('laporan-karyawan.json'),
        readJson('client-accounts.json'),
    ]);

    return { invoices, deeds, drafts, jobs, pettyCash, employees, clients };
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

// Calculate job statistics
function getJobStats(jobs: Job[]) {
    const byStatus = {
        Baru: jobs.filter((j) => j.status === 'Baru').length,
        Proses: jobs.filter((j) => j.status === 'Proses').length,
        Selesai: jobs.filter((j) => j.status === 'Selesai').length,
        Terkendala: jobs.filter((j) => j.status === 'Terkendala').length,
    };

    const urgent = jobs.filter((j) => j.priority === 'High' || j.priority === 'Urgent').length;

    // Calculate total revenue from jobs
    const totalValue = jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);
    const totalPaid = jobs.reduce((sum, j) => sum + (j.paidAmount || 0), 0);
    const outstanding = totalValue - totalPaid;

    return {
        total: jobs.length,
        byStatus,
        urgent,
        totalValue,
        totalPaid,
        outstanding,
    };
}

// Calculate petty cash statistics
function getPettyCashStats(transactions: PettyCashTransaction[]) {
    const debits = transactions.filter((t) => t.type === 'Debit').reduce((sum, t) => sum + t.nominal, 0);
    const credits = transactions.filter((t) => t.type === 'Credit').reduce((sum, t) => sum + t.nominal, 0);

    const balance = debits - credits;

    // This month's expenses
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthCredits = transactions
        .filter((t) => {
            const tDate = new Date(t.date);
            return t.type === 'Credit' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.nominal, 0);

    return { balance, thisMonthExpense: thisMonthCredits, totalDebits: debits };
}

// Get expense by category
function getExpensesByCategory(transactions: PettyCashTransaction[]) {
    const expenses = transactions.filter((t) => t.type === 'Credit');
    const byCategory: Record<string, number> = {};

    expenses.forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.nominal;
    });

    return Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 categories
}

// Get employee attendance today
function getTodayAttendance(employees: Employee[]) {
    const today = new Date().toISOString().split('T')[0];
    return employees.filter((emp) => emp.entryTimes && emp.entryTimes[today]).length;
}

// Get recent activities
function getRecentActivities(
    invoices: Invoice[],
    jobs: Job[],
    pettyCash: PettyCashTransaction[],
    limit = 8
) {
    const activities: any[] = [];

    // Add invoice activities
    invoices.slice(0, 5).forEach((inv) => {
        activities.push({
            type: 'invoice',
            date: inv.createdAt || inv.date || '',
            title: `Invoice ${inv.nomorInvoice || inv.id}`,
            subtitle: inv.recipient?.company || inv.clientName || 'Client',
            amount: inv.total,
        });
    });

    // Add job updates
    jobs.slice(0, 5).forEach((job) => {
        activities.push({
            type: 'job',
            date: job.createdAt,
            title: job.serviceName,
            subtitle: job.clientName,
            status: job.status,
        });
    });

    // Add major expenses (> 100k)
    pettyCash
        .filter((t) => t.type === 'Credit' && t.nominal > 100000)
        .slice(0, 5)
        .forEach((t) => {
            activities.push({
                type: 'expense',
                date: t.date,
                title: t.description,
                category: t.category,
                amount: t.nominal,
            });
        });

    return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
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
    const { invoices, deeds, drafts, jobs, pettyCash, employees, clients } = await getData();

    // 1. Calculate Invoice Stats (Pendapatan)
    const invoiceStats = getMonthlyStats(invoices, 'createdAt', 'total');
    const revenueGrowth = calculateGrowth(invoiceStats.currentValue, invoiceStats.lastValue);

    // 2. Calculate Deed Stats (Akta)
    const deedStats = getMonthlyStats(deeds, 'tanggalAkta');
    const deedGrowth = calculateGrowth(deedStats.currentCount, deedStats.lastCount);

    // 3. Job Statistics
    const jobStats = getJobStats(jobs);

    // 4. Petty Cash Statistics
    const pettyCashStats = getPettyCashStats(pettyCash);

    // 5. Employee Statistics
    const todayAttendance = getTodayAttendance(employees);
    const activeClients = clients.filter((c: ClientAccount) => c.status === 'Active').length;

    // 6. Expense Categories
    const topExpenses = getExpensesByCategory(pettyCash);

    // 7. Recent Activities
    const recentActivities = getRecentActivities(invoices, jobs, pettyCash);

    // 8. Deed breakdown by type
    const notarisDeeds = deeds.filter((d: Deed) => d.jenis === 'Notaris').length;
    const ppatDeeds = deeds.filter((d: Deed) => d.jenis === 'PPAT').length;

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
                        <p className="text-slate-600 text-sm">
                            Dashboard Kantor - Ringkasan lengkap operasional dan keuangan
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 text-white text-sm">
                        <Calendar size={16} />
                        {new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </div>
                </div>

                {/* --- TOP STATS ROW (4 Columns) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* CARD 1: TOTAL REVENUE */}
                    <Link
                        href="/modules/invoice"
                        className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-500/30">
                                <DollarSign size={24} />
                            </div>
                            <div
                                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${revenueGrowth >= 0
                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                        : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                    }`}
                            >
                                {revenueGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {revenueGrowth > 0 ? '+' : ''}
                                {revenueGrowth}%
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Total Pendapatan</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-1">
                                {formatCurrency(invoiceStats.currentValue)}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                {invoiceStats.currentCount} invoice bulan ini
                            </p>
                        </div>
                    </Link>

                    {/* CARD 2: ACTIVE JOBS */}
                    <Link
                        href="/modules/daftar-pekerjaan"
                        className="bg-white p-6 rounded-2xl shadow-lg shadow-purple-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-purple-500/30">
                                <Briefcase size={24} />
                            </div>
                            {jobStats.urgent > 0 && (
                                <span className="text-xs font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-full ring-1 ring-red-200">
                                    {jobStats.urgent} Urgent
                                </span>
                            )}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Pekerjaan Aktif</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-2">{jobStats.total}</p>
                            <div className="flex gap-2 text-xs">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                                    {jobStats.byStatus.Baru} Baru
                                </span>
                                <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-medium">
                                    {jobStats.byStatus.Proses} Proses
                                </span>
                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                                    {jobStats.byStatus.Selesai} Selesai
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* CARD 3: PETTY CASH */}
                    <Link
                        href="/modules/petty-cash"
                        className="bg-white p-6 rounded-2xl shadow-lg shadow-orange-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl text-white shadow-lg shadow-orange-500/30">
                                <Wallet size={24} />
                            </div>
                            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
                                Kas Kecil
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Saldo Kas</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-1">
                                {formatCurrency(pettyCashStats.balance)}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                Pengeluaran bulan ini: {formatCurrency(pettyCashStats.thisMonthExpense)}
                            </p>
                        </div>
                    </Link>

                    {/* CARD 4: DEEDS */}
                    <Link
                        href="/modules/laporan-bulanan"
                        className="bg-white p-6 rounded-2xl shadow-lg shadow-green-100/50 border border-slate-200/60 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/5 to-transparent rounded-full -ml-12 -mb-12" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl text-white shadow-lg shadow-green-500/30">
                                <FileText size={24} />
                            </div>
                            <div
                                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${deedGrowth >= 0
                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                        : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                    }`}
                            >
                                {deedGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {deedGrowth > 0 ? '+' : ''}
                                {deedGrowth}%
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-sm font-semibold mb-2">Akta Dibuat</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-2">{deedStats.currentCount}</p>
                            <div className="flex gap-2 text-xs">
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
                                    {notarisDeeds} Notaris
                                </span>
                                <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded font-medium">
                                    {ppatDeeds} PPAT
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* --- SECONDARY ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Quick Stats Grid - 3 Small Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/modules/akun-client"
                            className="bg-white p-4 rounded-xl shadow border border-slate-200/60 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                                    <Building2 size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{activeClients}</p>
                            <p className="text-xs text-slate-500 font-medium">Klien Aktif</p>
                        </Link>

                        <Link
                            href="/modules/laporan-karyawan"
                            className="bg-white p-4 rounded-xl shadow border border-slate-200/60 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-200 transition-colors">
                                    <Users size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
                            <p className="text-xs text-slate-500 font-medium">Karyawan</p>
                        </Link>

                        <div className="bg-white p-4 rounded-xl shadow border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                    <UserCheck size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{todayAttendance}</p>
                            <p className="text-xs text-slate-500 font-medium">Hadir Hari Ini</p>
                        </div>

                        <Link
                            href="/modules/bank-draft"
                            className="bg-white p-4 rounded-xl shadow border border-slate-200/60 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                                    <Activity size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{drafts.length}</p>
                            <p className="text-xs text-slate-500 font-medium">Draft Aktif</p>
                        </Link>
                    </div>

                    {/* Top Expenses */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent">
                            <div className="flex items-center gap-2">
                                <Receipt size={20} className="text-orange-600" />
                                <h3 className="font-bold text-slate-900 text-lg">Kategori Pengeluaran</h3>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Top 5 pengeluaran bulan ini</p>
                        </div>
                        <div className="p-6 space-y-3">
                            {topExpenses.length > 0 ? (
                                topExpenses.map(([category, amount], i) => {
                                    const total = topExpenses.reduce((sum, [, amt]) => sum + amt, 0);
                                    const percentage = Math.round((amount / total) * 100);
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-slate-700">{category}</span>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{percentage}% dari total</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-400 text-sm py-8">Belum ada data pengeluaran</p>
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
                                <Link
                                    href="/modules/invoice"
                                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105"
                                >
                                    <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                        <DollarSign size={20} className="text-blue-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Invoice</span>
                                </Link>
                                <Link
                                    href="/modules/laporan-bulanan"
                                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105"
                                >
                                    <div className="bg-purple-500/20 p-2 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                                        <FileText size={20} className="text-purple-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Laporan</span>
                                </Link>
                                <Link
                                    href="/modules/cover-akta"
                                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105"
                                >
                                    <div className="bg-orange-500/20 p-2 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                                        <BookOpen size={20} className="text-orange-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Cover</span>
                                </Link>
                                <Link
                                    href="/modules/kalkulator-pajak"
                                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group flex flex-col items-center justify-center text-center gap-2 hover:scale-105"
                                >
                                    <div className="bg-green-500/20 p-2 rounded-lg group-hover:bg-green-500/30 transition-colors">
                                        <Calculator size={20} className="text-green-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-200">Kalkulator</span>
                                </Link>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <Link
                                    href="/modules/akun-client"
                                    className="block bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm p-3 rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 group"
                                >
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

                {/* --- BOTTOM ROW - Recent Activities --- */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-transparent">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Aktivitas Terbaru</h3>
                            <p className="text-xs text-slate-500 mt-1">Update terkini dari berbagai modul</p>
                        </div>
                        <Link
                            href="/modules/riwayat"
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            Lihat Semua <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity, i) => (
                                <div
                                    key={i}
                                    className="p-4 hover:bg-slate-50 transition-all duration-200 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`p-2.5 rounded-xl text-white group-hover:scale-110 transition-all duration-200 ${activity.type === 'invoice'
                                                    ? 'bg-blue-500'
                                                    : activity.type === 'job'
                                                        ? 'bg-purple-500'
                                                        : 'bg-orange-500'
                                                }`}
                                        >
                                            {activity.type === 'invoice' && <Receipt size={20} />}
                                            {activity.type === 'job' && <Briefcase size={20} />}
                                            {activity.type === 'expense' && <Wallet size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {activity.subtitle || activity.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {activity.amount && (
                                            <p className="text-sm font-bold text-slate-900">
                                                {formatCurrency(activity.amount)}
                                            </p>
                                        )}
                                        {activity.status && (
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full font-medium ${activity.status === 'Selesai'
                                                        ? 'bg-green-50 text-green-700'
                                                        : activity.status === 'Proses'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : activity.status === 'Terkendala'
                                                                ? 'bg-red-50 text-red-700'
                                                                : 'bg-blue-50 text-blue-700'
                                                    }`}
                                            >
                                                {activity.status}
                                            </span>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(activity.date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FolderInput className="text-slate-400" size={28} />
                                </div>
                                <p className="text-slate-400 text-sm font-medium">Belum ada aktivitas terbaru</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}