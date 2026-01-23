'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Scale,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react';

// Grouped menu items for better organization
const menuGroups = [
  {
    category: 'Utama',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { name: 'Chat Kantor', icon: MessageCircleMoreIcon, href: '/modules/chat-kantor' },
      { name: 'Tracking Pekerjaan', icon: CalendarSync, href: '/modules/tracking-pekerjaan' },
      { name: 'Daftar Pekerjaan', icon: FileText, href: '/modules/daftar-pekerjaan' },
    ]
  },
  {
    category: 'Dokumen',
    items: [
      { name: 'Invoice', icon: FileText, href: '/modules/invoice' },
      { name: 'Serah Terima Dokumen', icon: FolderInput, href: '/modules/serah-terima' },
      { name: 'Daftar Hadir', icon: Users, href: '/modules/daftar-hadir' },
      { name: 'Cover Akta', icon: BookOpen, href: '/modules/cover-akta' },
      { name: 'Laporan Bulanan', icon: CalendarSync, href: '/modules/laporan-bulanan' },
      { name: 'Riwayat Dokumen', icon: FileStack, href: '/modules/riwayat' },
      { name: 'Manajemen Dokumen', icon: BookOpen, href: '/modules/dokumen-legalitas-badan' },
    ]
  },
  {
    category: 'Tools',
    items: [
      { name: 'Laporan Karyawan', icon: FileText, href: '/modules/laporan-karyawan' },
      { name: 'Draft Akta', icon: FileStack, href: '/modules/bank-draft' },
      { name: 'Penggaris Akta', icon: DraftingCompass, href: '/modules/penggaris-akta' },
      { name: 'Kalkulator Pajak', icon: Calculator, href: '/modules/kalkulator-pajak' },
      { name: 'WhatsApp Forms', icon: FileStack, href: '/modules/whatsapp-forms' },
    ]
  },
  {
    category: 'Client',
    items: [
      { name: 'CDD Perorangan', icon: FileText, href: '/modules/cdd-perorangan' },
      { name: 'CDD Korporasi', icon: FileText, href: '/modules/cdd-korporasi' },
      { name: 'Akun Client', icon: Users, href: '/modules/akun-client' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all items for search
  const allItems = menuGroups.flatMap(group => group.items);

  // Filter items based on search
  const filteredGroups = searchQuery
    ? [{
      category: 'Hasil Pencarian',
      items: allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }]
    : menuGroups;

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 h-screen fixed left-0 top-0 flex flex-col z-10 no-print transition-all duration-300 ease-in-out shadow-2xl`}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center justify-between gap-3">
          {!isCollapsed && (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Scale size={22} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white">Notaris & PPAT</span>
                <span className="text-xs text-slate-400">Suite Tools</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {filteredGroups.map((group, groupIndex) => (
          <div key={group.category} className={groupIndex > 0 ? 'mt-6' : ''}>
            {!isCollapsed && group.items.length > 0 && (
              <div className="px-3 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {group.category}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}
                    <Icon
                      size={20}
                      className={`${isCollapsed ? 'mx-auto' : ''} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                        } transition-colors`}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {filteredGroups.every(group => group.items.length === 0) && !isCollapsed && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">Tidak ada hasil</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 bg-slate-800/50">
        <div className={`p-3 ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? (
            <div className="w-8 h-8 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              AE
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg">
                AE
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Assidiqi Emirza</p>
                <p className="text-xs text-slate-400 truncate">assidiqiemirza@gmail.com</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(71 85 105 / 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(71 85 105 / 0.7);
        }
      `}</style>
    </aside>
  );
}

