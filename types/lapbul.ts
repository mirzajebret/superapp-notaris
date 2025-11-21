export type DeedType = 'Notaris' | 'PPAT';

export type NotarisCategory = 'Akta' | 'Legalisasi' | 'Waarmerking' | 'Wasiat';

export interface DeedParty {
  name: string;
  role: string;
}

export interface DeedPPATDetails {
  nop: string;
  njop: string;
  luasTanah: string;
  luasBangunan: string;
  lokasiObjek: string;
  nilaiTransaksi: string;
  ssp: string;
  ssb: string;
}

export interface DeedRecord {
  id: string;
  jenis: DeedType;
  nomorAkta: string;
  tanggalAkta: string; // format YYYY-MM-DD
  judulAkta: string;
  pihak: DeedParty[];
  detailPPAT: DeedPPATDetails | null;
  kategori: NotarisCategory | null;
  bulanPelaporan: number;
  tahunPelaporan: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeedPayload
  extends Partial<Omit<DeedRecord, 'id' | 'createdAt' | 'updatedAt'>> {
  pihak?: DeedParty[];
  detailPPAT?: DeedPPATDetails | null;
}

