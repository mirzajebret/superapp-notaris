// src/app/actions.js
'use server'

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

// Tentukan lokasi folder data (pastikan folder 'data' ada di root project)
const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DRAFTS_DIR = path.join(PUBLIC_DIR, 'uploads', 'drafts');
const DRAFTS_FILENAME = 'drafts.json';
const ALLOWED_DRAFT_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_DRAFT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

async function ensureDraftsDirectory() {
  await fs.mkdir(DRAFTS_DIR, { recursive: true });
}

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
  const filePath = await ensureFile('deeds.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    return [];
  }
}

export async function createDeed(data) {
  const filePath = await ensureFile('deeds.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const deeds = JSON.parse(fileContent);

  const newDeed = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...data
  };

  deeds.push(newDeed);
  await fs.writeFile(filePath, JSON.stringify(deeds, null, 2));
  return { success: true, data: newDeed };
}

export async function updateDeed(id, data) {
  const filePath = await ensureFile('deeds.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let deeds = JSON.parse(fileContent);

  const index = deeds.findIndex(d => d.id === id);
  if (index !== -1) {
    deeds[index] = { ...deeds[index], ...data };
    await fs.writeFile(filePath, JSON.stringify(deeds, null, 2));
    return { success: true, data: deeds[index] };
  }
  return { success: false };
}

export async function deleteDeed(id) {
  const filePath = await ensureFile('deeds.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let deeds = JSON.parse(fileContent);

  deeds = deeds.filter(d => d.id !== id);
  await fs.writeFile(filePath, JSON.stringify(deeds, null, 2));
  return { success: true };
}

// --- FUNCTION UNTUK DRAFT AKTA ---

function sanitizeFilename(name = '') {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

function buildDraftRecord({ title, category, filename, storedFilename }) {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString(),
    title: title?.toString().trim() || 'Draft Tanpa Judul',
    category: category === 'PPAT' ? 'PPAT' : 'Notaris',
    filename: filename,
    fileUrl: `/uploads/drafts/${storedFilename}`,
    uploadDate: now,
  };
}

export async function getDrafts(category) {
  const filePath = await ensureFile(DRAFTS_FILENAME);
  const drafts = await readJson(filePath);

  const filtered = category
    ? drafts.filter((draft) => draft.category === category)
    : drafts;

  return filtered.sort(
    (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );
}

export async function uploadDraft(formData) {
  const title = formData.get('title');
  const category = formData.get('category');
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    throw new Error('File wajib diunggah.');
  }

  const originalName = file.name || 'draft.docx';
  const ext = path.extname(originalName).toLowerCase();

  if (!ALLOWED_DRAFT_EXTENSIONS.includes(ext) && !ALLOWED_DRAFT_MIME_TYPES.includes(file.type)) {
    throw new Error('Format file tidak didukung. Gunakan PDF, DOC, atau DOCX.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await ensureDraftsDirectory();

  const storedFilename = `${Date.now()}-${sanitizeFilename(originalName)}`;
  const diskPath = path.join(DRAFTS_DIR, storedFilename);

  await fs.writeFile(diskPath, buffer);

  const filePath = await ensureFile(DRAFTS_FILENAME);
  const drafts = await readJson(filePath);
  const newDraft = buildDraftRecord({
    title,
    category,
    filename: originalName,
    storedFilename,
  });

  drafts.unshift(newDraft);
  await writeJson(filePath, drafts);
  revalidatePath('/modules/bank-draft');

  return { success: true, data: newDraft };
}

export async function deleteDraft(id) {
  if (!id) {
    throw new Error('ID draft wajib diisi.');
  }

  const filePath = await ensureFile(DRAFTS_FILENAME);
  const drafts = await readJson(filePath);
  const target = drafts.find((draft) => draft.id === id);

  if (!target) {
    throw new Error('Draft tidak ditemukan.');
  }

  const remaining = drafts.filter((draft) => draft.id !== id);
  await writeJson(filePath, remaining);

  if (target.fileUrl) {
    const diskPath = path.join(PUBLIC_DIR, target.fileUrl.replace(/^\//, ''));
    try {
      await fs.unlink(diskPath);
    } catch (error) {
      console.warn(`Gagal menghapus file draft ${diskPath}:`, error);
    }
  }

  revalidatePath('/modules/bank-draft');
  return { success: true, deletedId: id };
}

// --- TAMBAHAN UNTUK FITUR PENGGARIS AKTA ---
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function processGarisAkta(formData) {
  const file = formData.get('file');
  const type = formData.get('type'); // 'salinan' atau 'minuta'

  if (!file) return { success: false, message: "File tidak ditemukan" };

  // 1. Simpan File Input Sementara
  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  // Sanitasi nama file agar aman di command line
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
  const inputFileName = `input_${timestamp}_${cleanName}.pdf`;

  // Path lengkap (Gunakan process.cwd() agar path absolut)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const inputPath = path.join(uploadDir, inputFileName);

  // Pastikan folder ada
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(inputPath, buffer);
  } catch (err) {
    console.error("Error saving file:", err);
    return { success: false, message: "Gagal menyimpan file upload" };
  }

  // 2. Tentukan Path Script & Output
  const scriptPath = path.join(process.cwd(), 'scripts', 'ToolGarisAktaNot.py');
  // Output path ditentukan oleh logic Python script Anda (suffix _SALINAN atau _MINUTA)
  // Kita perlu path output eksplisit agar Node.js tahu di mana mencarinya
  const outputFileName = `output_${timestamp}_${cleanName}.pdf`;
  const outputPath = path.join(uploadDir, outputFileName);

  // 3. Jalankan Python Script
  // Command: python script.py input output --type salinan
  const command = `python "${scriptPath}" "${inputPath}" "${outputPath}" --type ${type}`;

  try {
    console.log("Executing Python:", command);
    const { stdout, stderr } = await execPromise(command);

    console.log("Python Output:", stdout);
    if (stderr) console.error("Python Error:", stderr);

    // 4. Return URL File Hasil
    // Karena disimpan di public/uploads, bisa diakses via browser
    return {
      success: true,
      fileUrl: `/uploads/${outputFileName}`,
      fileName: outputFileName
    };

  } catch (error) {
    console.error("Execution Failed:", error);
    return { success: false, message: "Gagal memproses garis akta. Pastikan Python terinstall." };
  }
}