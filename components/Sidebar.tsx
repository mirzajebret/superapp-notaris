'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderInput,
  Users,
  BookOpen,
  CalendarSync,
  Calculator,
  DraftingCompass,
  FileStack,
  MessageCircleMoreIcon,
  Scale
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Chat Kantor', icon: MessageCircleMoreIcon, href: '/modules/chat-kantor' },
  { name: 'Timeline Pekerjaan', icon: CalendarSync, href: '/modules/timeline-pekerjaan' },
  { name: 'Invoice', icon: FileText, href: '/modules/invoice' },
  { name: 'Serah Terima Dokumen', icon: FolderInput, href: '/modules/serah-terima' },
  { name: 'Daftar Hadir', icon: Users, href: '/modules/daftar-hadir' },
  { name: 'Cover Akta', icon: BookOpen, href: '/modules/cover-akta' },
  { name: 'Laporan Bulanan', icon: CalendarSync, href: '/modules/laporan-bulanan' },
  { name: 'Draft Akta', icon: FileStack, href: '/modules/bank-draft' },
  { name: 'Penggaris Akta', icon: DraftingCompass, href: '/modules/penggaris-akta' },
  { name: 'Kalkulator Pajak', icon: Calculator, href: '/modules/kalkulator-pajak' },
  { name: 'WhatsApp Forms', icon: FileStack, href: '/modules/whatsapp-forms' },
  { name: 'CDD Perorangan', icon: FileText, href: '/modules/cdd-perorangan' },
  { name: 'CDD Korporasi', icon: FileText, href: '/modules/cdd-korporasi' },
  { name: 'Akun Client', icon: Users, href: '/modules/akun-client' },
  { name: 'Riwayat Dokumen', icon: FileStack, href: '/modules/riwayat' },

];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-blue-600 border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10 no-print">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold"><Scale size={18} /></div>
          <span className="font-semibold text-lg tracking-tight text-white">Notaris & PPAT Suite</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto bg-white">
        <div className="text-lg font-semibold text-gray-800 text-sans uppercase tracking-wider mb-3 px-3">TOOLS:</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
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

      <div className="border-t border-gray-100">
        <button className="flex items-center gap-3 px-3 py-2 text-gray-600  rounded-lg w-full transition text-white">
          <span className="text-sm font-medium">© assidiqiemirza@gmail.com</span>
        </button>
      </div>
    </aside>
  );
}

