'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FolderInput, 
  Users, 
  BookOpen, 
  BarChart3,
  Settings
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Invoice & Billing', icon: FileText, href: '/modules/invoice' },
  { name: 'Serah Terima Dokumen', icon: FolderInput, href: '/modules/serah-terima'},
  { name: 'Absensi Akad', icon: Users, href: '/modules/daftar-hadir'},
  { name: 'Cover Akta', icon: BookOpen, href: '/modules/cover-akta' },
  { name: 'Laporan Bulanan', icon: BarChart3, href: '/modules/laporan-bulanan'},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10 no-print">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
           <span className="font-bold text-xl tracking-tight text-gray-800">KantorApp</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-11">Notaris & PPAT Suite</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Menu Utama</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          if (item.disabled) {
             return (
                <div key={item.name} className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed opacity-60">
                   <Icon size={18} />
                   <span className="text-sm font-medium">{item.name}</span>
                   <span className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">SOON</span>
                </div>
             )
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg w-full transition">
            <Settings size={18} className="text-gray-400" />
            <span className="text-sm font-medium">Pengaturan</span>
        </button>
      </div>
    </aside>
  );
}

