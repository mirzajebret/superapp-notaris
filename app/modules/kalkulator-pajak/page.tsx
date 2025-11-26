"use client";

import React, { useState, useEffect } from "react";
import { Calculator, Copy, RefreshCw, Info, Save, Trash2, History } from "lucide-react";

// --- Types & Constants ---

type TransactionType = "Jual Beli" | "Hibah" | "Waris";

const TRANSACTION_TYPES: TransactionType[] = ["Jual Beli", "Hibah", "Waris"];

// NPOPTKP Rules (Garut)
const NPOPTKP_RULES: Record<TransactionType, number> = {
    "Jual Beli": 80_000_000,
    "Hibah": 80_000_000,
    "Waris": 300_000_000,
};

interface SavedCalculation {
    id: string;
    date: string;
    hargaTransaksi: number;
    njop: number;
    jenisPerolehan: TransactionType;
    totalBiaya: number;
}

// --- Helper Functions ---

const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const parseRupiah = (value: string): number => {
    return parseInt(value.replace(/[^0-9]/g, "") || "0", 10);
};

// --- Components ---

export default function KalkulatorPajakPage() {
    // State
    const [hargaTransaksi, setHargaTransaksi] = useState<number>(0);
    const [njop, setNjop] = useState<number>(0);
    const [jenisPerolehan, setJenisPerolehan] = useState<TransactionType>("Jual Beli");

    // Calculated Values
    const [npop, setNpop] = useState<number>(0);
    const [bphtb, setBphtb] = useState<number>(0);
    const [pph, setPph] = useState<number>(0);
    const [pnbp, setPnbp] = useState<number>(0);
    const [totalBiaya, setTotalBiaya] = useState<number>(0);

    // Saved Calculations State
    const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("tax_calculator_history");
        if (saved) {
            try {
                setSavedCalculations(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved calculations", e);
            }
        }
    }, []);

    // Save to localStorage whenever list changes
    useEffect(() => {
        localStorage.setItem("tax_calculator_history", JSON.stringify(savedCalculations));
    }, [savedCalculations]);

    // Effect: Calculate on change
    useEffect(() => {
        // 1. NPOP
        const calculatedNpop = Math.max(hargaTransaksi, njop);
        setNpop(calculatedNpop);

        // 2. BPHTB
        const npoptkp = NPOPTKP_RULES[jenisPerolehan];
        let calculatedBphtb = (calculatedNpop - npoptkp) * 0.05;
        if (calculatedBphtb < 0) calculatedBphtb = 0;
        setBphtb(calculatedBphtb);

        // 3. PPh (Only for Jual Beli)
        let calculatedPph = 0;
        if (jenisPerolehan === "Jual Beli") {
            calculatedPph = calculatedNpop * 0.025;
        }
        setPph(calculatedPph);

        // 4. PNBP (Estimasi: 1 per mil + 50rb)
        // Asumsi: Dasar PNBP menggunakan NPOP (Nilai Tanah/Zona Nilai Tanah biasanya, tapi NPOP pendekatan terdekat)
        const calculatedPnbp = (calculatedNpop / 1000) + 50_000;
        setPnbp(calculatedPnbp);

        // 5. Total
        setTotalBiaya(calculatedBphtb + calculatedPph + calculatedPnbp);
    }, [hargaTransaksi, njop, jenisPerolehan]);

    // Handlers
    const handleInputChange = (
        setter: React.Dispatch<React.SetStateAction<number>>,
        value: string
    ) => {
        setter(parseRupiah(value));
    };

    const handleCopy = () => {
        const text = `
*Estimasi Biaya Transaksi (${jenisPerolehan})*
--------------------------------
Harga Transaksi: ${formatRupiah(hargaTransaksi)}
NJOP: ${formatRupiah(njop)}
NPOP (Dasar Pengenaan): ${formatRupiah(npop)}

*Rincian Biaya:*
1. BPHTB (Pembeli): ${formatRupiah(bphtb)}
2. PPh (Penjual): ${formatRupiah(pph)}
3. PNBP (Balik Nama): ${formatRupiah(pnbp)}

*TOTAL ESTIMASI: ${formatRupiah(totalBiaya)}*
    `.trim();

        navigator.clipboard.writeText(text);
        alert("Hasil perhitungan berhasil disalin!");
    };

    const handleReset = () => {
        setHargaTransaksi(0);
        setNjop(0);
        setJenisPerolehan("Jual Beli");
    };

    const handleSave = () => {
        const newCalculation: SavedCalculation = {
            id: Date.now().toString(),
            date: new Date().toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
            }),
            hargaTransaksi,
            njop,
            jenisPerolehan,
            totalBiaya,
        };

        setSavedCalculations((prev) => [newCalculation, ...prev]);
        alert("Perhitungan berhasil disimpan!");
    };

    const handleLoad = (calc: SavedCalculation) => {
        setHargaTransaksi(calc.hargaTransaksi);
        setNjop(calc.njop);
        setJenisPerolehan(calc.jenisPerolehan);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (id: string) => {
        if (confirm("Hapus riwayat ini?")) {
            setSavedCalculations((prev) => prev.filter((item) => item.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-lg shadow-md">
                        <Calculator size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Kalkulator Pajak & Biaya
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Estimasi biaya transaksi properti (Kab. Garut)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Parameter Transaksi
                                </h2>
                                <button
                                    onClick={handleReset}
                                    className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                                >
                                    <RefreshCw size={14} /> Reset
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Jenis Perolehan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Jenis Perolehan
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {TRANSACTION_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setJenisPerolehan(type)}
                                                className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${jenisPerolehan === type
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 flex items-start gap-1.5">
                                        <Info size={14} className="mt-0.5 flex-shrink-0" />
                                        {jenisPerolehan === "Waris"
                                            ? "NJOP Waris di Garut: Rp 300.000.000"
                                            : "NJOP Jual Beli/Hibah: Rp 80.000.000"}
                                    </p>
                                </div>

                                {/* Harga Transaksi */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Harga Transaksi / Nilai Pasar
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                            Rp
                                        </span>
                                        <input
                                            type="text"
                                            value={hargaTransaksi ? formatRupiah(hargaTransaksi).replace("Rp", "").trim() : ""}
                                            onChange={(e) => handleInputChange(setHargaTransaksi, e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-lg font-medium text-slate-900 placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                {/* NJOP */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nilai Jual Objek Pajak (NJOP)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                            Rp
                                        </span>
                                        <input
                                            type="text"
                                            value={njop ? formatRupiah(njop).replace("Rp", "").trim() : ""}
                                            onChange={(e) => handleInputChange(setNjop, e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-lg font-medium text-slate-900 placeholder:text-gray-300"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        *Dasar pengenaan pajak diambil dari nilai tertinggi antara Harga Transaksi dan NJOP.
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* History Section */}
                        {savedCalculations.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <History size={20} className="text-slate-900" />
                                    <h2 className="text-lg font-semibold text-slate-800">
                                        Riwayat Tersimpan
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {savedCalculations.map((calc) => (
                                        <div
                                            key={calc.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                                        >
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => handleLoad(calc)}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                                        {calc.jenisPerolehan}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {calc.date}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-medium text-slate-900">
                                                    Total: {formatRupiah(calc.totalBiaya)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Harga: {formatRupiah(calc.hargaTransaksi)} | NJOP: {formatRupiah(calc.njop)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(calc.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-4">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="bg-slate-900 p-6 text-white">
                                    <h3 className="text-sm font-medium opacity-90 mb-1">
                                        Total Estimasi Biaya
                                    </h3>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {formatRupiah(totalBiaya)}
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Breakdown */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-600">BPHTB (Pembeli)</span>
                                            <span className={`font-semibold ${bphtb === 0 ? "text-gray-400" : "text-slate-800"}`}>
                                                {formatRupiah(bphtb)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-600">PPh (Penjual)</span>
                                            <span className={`font-semibold ${pph === 0 ? "text-gray-400" : "text-slate-800"}`}>
                                                {formatRupiah(pph)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-600">PNBP (Balik Nama)</span>
                                            <span className="font-semibold text-slate-800">
                                                {formatRupiah(pnbp)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* NPOP Info */}
                                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mt-4">
                                        <div className="flex justify-between mb-1">
                                            <span>NPOP (Dasar):</span>
                                            <span className="font-medium text-gray-700">{formatRupiah(npop)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>NJOP:</span>
                                            <span className="font-medium text-gray-700">{formatRupiah(NPOPTKP_RULES[jenisPerolehan])}</span>
                                        </div>
                                    </div>

                                    {/* Copy Button */}
                                    <button
                                        onClick={handleCopy}
                                        className="w-full mt-2 flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 font-semibold py-3 px-4 rounded-lg transition-all active:scale-95"
                                    >
                                        <Copy size={18} />
                                        Salin Hasil Perhitungan
                                    </button>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSave}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-md hover:shadow-lg"
                                    >
                                        <Save size={18} />
                                        Simpan Perhitungan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
