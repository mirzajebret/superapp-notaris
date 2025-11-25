import Link from 'next/link';
import { FileText, FolderInput, ArrowRight, Clock } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 font-sans">Selamat Datang, Mirza Alby Assidiqie</h1>
                <p className="text-gray-500 mt-1">Test.</p>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><FileText size={24} /></div>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Invoice Bulan Ini</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">24</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><FolderInput size={24} /></div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">0 Baru</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Berkas Masuk</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">8</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><Clock size={24} /></div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Akad Terjadwal</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">3</p>
                </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/modules/invoice" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Buat Invoice Baru</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">Generate invoice tagihan jasa Notaris & PPAT dengan format standar.</p>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                    </div>
                </Link>

                <Link href="/modules/serah-terima" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-green-200 group-hover:scale-110 transition-transform">
                            <FolderInput size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Buat Serah Terima Baru</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">Cetak bukti tanda serah terima surat, dokumen, maupun barang.</p>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                    </div>
                </Link>

                <Link href="/modules/daftar-hadir" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Buat Daftar Hadir Baru</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">Cetak daftar hadir akad.</p>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                    </div>
                </Link>

                <Link href="/modules/cover-akta" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Buat Cover Akta Baru</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">Generator sampul depan akta dengan format standar.</p>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                    </div>
                </Link>

                <Link href="/modules/laporan-bulanan" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Laporan Bulanan</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">cetak laporan bulanan notaris & ppat.</p>
                    </div>
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                </Link>

                <Link href="/modules/bank-draft" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Draft Akta</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">Lihat draft akta yang telah dibuat.</p>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                    </div>
                </Link>

                <Link href="/modules/penggaris-akta" className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">penggaris Akta</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-4">garis akta otomatis.</p>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">Buka Modul <ArrowRight size={16} /></span>
                    </div>
                </Link>
            </div>
        </div>

    );
}
