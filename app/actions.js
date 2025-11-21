// src/app/actions.js
'use server'

import fs from 'fs/promises';
import path from 'path';

// Tentukan lokasi folder data (pastikan folder 'data' ada di root project)
const DATA_DIR = path.join(process.cwd(), 'data');

// Helper untuk memastikan file ada
async function ensureFile(filename, defaultData = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    await fs.access(filePath);
  } catch {
    // Jika error (file tidak ada), buat folder dan file baru
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    } catch (err) {
        console.error("Gagal membuat file:", err);
    }
  }
  return filePath;
}

async function readJson(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// --- FUNCTION UNTUK INVOICE ---

export async function saveInvoice(invoiceData) {
  const filePath = await ensureFile('invoices.json');
  
  // Baca data lama
  const invoices = await readJson(filePath);
  
  // Tambah data baru (Generate ID simple pakai timestamp)
  const newInvoice = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...invoiceData
  };
  
  invoices.push(newInvoice);
  
  // Simpan balik ke file
  await writeJson(filePath, invoices);
  
  return { success: true, data: newInvoice };
}

export async function getInvoices() {
  const filePath = await ensureFile('invoices.json');
  return readJson(filePath);
}

// --- FUNCTION UNTUK KLIEN ---

export async function getClients() {
    const filePath = await ensureFile('clients.json');
    return readJson(filePath);
}

// --- FUNCTION UNTUK SERAH TERIMA ---

export async function saveSerahTerima(record) {
  const filePath = await ensureFile('serah-terima.json');
  const records = await readJson(filePath);

  const newRecord = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...record,
  };

  records.push(newRecord);
  await writeJson(filePath, records);

  return { success: true, data: newRecord };
}

export async function getSerahTerimaRecords() {
  const filePath = await ensureFile('serah-terima.json');
  return readJson(filePath);
}

// --- FUNCTION UNTUK DAFTAR HADIR AKAD ---

export async function saveDaftarHadir(record) {
  const filePath = await ensureFile('daftar-hadir.json');
  const records = await readJson(filePath);

  const newRecord = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...record,
  };

  records.push(newRecord);
  await writeJson(filePath, records);

  return { success: true, data: newRecord };
}

export async function getDaftarHadirRecords() {
  const filePath = await ensureFile('daftar-hadir.json');
  return readJson(filePath);
}

// --- FUNCTION UNTUK COVER AKTA ---

export async function saveCoverAkta(record) {
  const filePath = await ensureFile('cover-akta.json');
  const records = await readJson(filePath);

  const newRecord = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...record,
  };

  records.push(newRecord);
  await writeJson(filePath, records);

  return { success: true, data: newRecord };
}

export async function getCoverAktaRecords() {
  const filePath = await ensureFile('cover-akta.json');
  return readJson(filePath);
}

// --- FUNCTION UNTUK LAPORAN BULANAN (DATA AKTA) ---

const DEEDS_FILENAME = 'deeds.json';

function normalizeParties(parties = []) {
  if (!Array.isArray(parties)) return [];
  return parties
    .map((party) => ({
      name: party?.name ?? '',
      role: party?.role ?? '',
    }))
    .filter((party) => party.name.trim() !== '');
}

function derivePeriod(tanggalAkta, fallback = new Date()) {
  const parsed = tanggalAkta ? new Date(tanggalAkta) : fallback;
  if (Number.isNaN(parsed.getTime())) {
    return {
      month: fallback.getMonth() + 1,
      year: fallback.getFullYear(),
    };
  }
  return {
    month: parsed.getMonth() + 1,
    year: parsed.getFullYear(),
  };
}

function normalizeDeedPayload(payload = {}) {
  const now = new Date();
  const {
    bulanPelaporan,
    tahunPelaporan,
    tanggalAkta,
    jenis = 'Notaris',
    kategori = 'Akta',
    detailPPAT = null,
  } = payload;

  const period = derivePeriod(tanggalAkta, now);
  return {
    jenis,
    nomorAkta: payload.nomorAkta ?? '',
    tanggalAkta: tanggalAkta ?? now.toISOString().slice(0, 10),
    judulAkta: payload.judulAkta ?? payload.sifatAkta ?? '',
    pihak: normalizeParties(payload.pihak),
    detailPPAT:
      jenis === 'PPAT' && detailPPAT
        ? {
            nop: detailPPAT.nop ?? '',
            njop: detailPPAT.njop ?? '',
            luasTanah: detailPPAT.luasTanah ?? '',
            luasBangunan: detailPPAT.luasBangunan ?? '',
            lokasiObjek: detailPPAT.lokasiObjek ?? '',
            nilaiTransaksi: detailPPAT.nilaiTransaksi ?? '',
            ssb: detailPPAT.ssb ?? '',
            ssp: detailPPAT.ssp ?? '',
          }
        : null,
    kategori: jenis === 'Notaris' ? kategori : null,
    bulanPelaporan: bulanPelaporan ?? period.month,
    tahunPelaporan: tahunPelaporan ?? period.year,
  };
}

export async function getDeeds() {
  const filePath = await ensureFile(DEEDS_FILENAME);
  return readJson(filePath);
}

export async function createDeed(record) {
  const filePath = await ensureFile(DEEDS_FILENAME);
  const deeds = await readJson(filePath);
  const normalized = normalizeDeedPayload(record);

  const newRecord = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...normalized,
  };

  deeds.push(newRecord);
  await writeJson(filePath, deeds);
  return { success: true, data: newRecord };
}

export async function updateDeed(id, updates) {
  if (!id) {
    throw new Error('ID deed wajib diisi untuk update.');
  }
  const filePath = await ensureFile(DEEDS_FILENAME);
  const deeds = await readJson(filePath);
  const index = deeds.findIndex((deed) => deed.id === id);

  if (index === -1) {
    throw new Error('Data akta tidak ditemukan.');
  }

  const merged = {
    ...deeds[index],
    ...normalizeDeedPayload({ ...deeds[index], ...updates }),
    updatedAt: new Date().toISOString(),
  };

  deeds[index] = merged;
  await writeJson(filePath, deeds);
  return { success: true, data: merged };
}

export async function deleteDeed(id) {
  if (!id) {
    throw new Error('ID deed wajib diisi untuk delete.');
  }
  const filePath = await ensureFile(DEEDS_FILENAME);
  const deeds = await readJson(filePath);
  const filtered = deeds.filter((deed) => deed.id !== id);
  await writeJson(filePath, filtered);
  return { success: true, deletedId: id };
}