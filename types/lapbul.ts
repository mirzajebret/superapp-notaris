// src/types/lapbul.ts

export type DeedType = 'Notaris' | 'PPAT';
export type NotarisCategory = 'Akta' | 'Legalisasi' | 'Waarmerking' | 'Protes' | 'Wasiat';

export interface DeedParty {
  name: string;
  role: string; // Pihak Pertama, Kedua, dll
  actingCapacity?: 'self' | 'representative' | 'both'
  representedParties?: string[];
}

export interface DeedPPATDetails {
  nop: string;
  njop: string; // Simpan sebagai string "Rp ..." atau number
  luasTanah: string;
  luasBangunan: string;
  lokasiObjek: string;
  nilaiTransaksi: string;
  ssp: string; // Pajak Penjual
  tglSsp: string;
  ssb: string; // Pajak Pembeli
  tglSsb: string;
  jenisHak: string; // HM / HGB
  pihakPenerima: string; // Khusus kolom "Pihak yang Menerima"
}

export interface DeedRecord {
  id: string;
  jenis: DeedType;

  // Common Fields
  nomorAkta: string;
  tanggalAkta: string;
  judulAkta: string; // Sifat Akta / Bentuk Perbuatan Hukum
  pihak: DeedParty[];

  // Notaris Specific
  kategori?: NotarisCategory;
  nomorBulanan?: string; // No Urut di Laporan Bulanan

  // PPAT Specific
  detailPPAT?: DeedPPATDetails;

  // Metadata Laporan (Agar data terikat ke bulan tertentu)
  bulanPelaporan: number;
  tahunPelaporan: number;
  createdAt: string;
}