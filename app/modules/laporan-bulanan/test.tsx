<div ref={ppatLampiranRef} id="print-lampiran-area">
    {[
        { to: 'Kepala Kantor\nBadan Pertanahan Nasional Kabupaten Garut', address: 'Jl. Suherman, Desa Jati, Tarogong Kaler, Kabupaten Garut 44151' },
        { to: 'Kepala Kantor Wilayah\nBadan Pertanahan Nasional Provinsi Jawa Barat', address: 'Jl. Soekarno Hatta No. 586 Sekejati, Kec. BuahBatu, Kota Bandung 40286' },
        { to: 'Kepala Kantor\nBadan Pendapatan Daerah Kabupaten Garut', address: 'Jl. Otista No. 278, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' },
        { to: 'Kepala Kantor\nPelayanan Pajak Pratama Garut', address: 'Jl. Pembangunan No.224, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut 44151' }
    ].map((r, idx) => (
        <div key={idx} className={idx > 0 ? "break-before-page" : ""}>
            <div className="bg-white p-8 print-wrapper print-clean" style={{ width: '297mm', minHeight: '210mm' }}>

                <div className="flex justify-between items-start mb-5 font-serif text-[10pt] font-bold">
                    <div className="w-[60%]">
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr><td className="align-top w-[30%] pb-1">Nama PPAT</td><td className="align-top w-[70%] pb-1">: HAVIS AKBAR, S.H., M.Kn</td></tr>
                                <tr><td className="align-top pb-1">Daerah Kerja</td><td className="align-top pb-1">: Seluruh Kecamatan Kabupaten Garut</td></tr>
                                <tr><td className="align-top pb-1">Alamat</td><td className="align-top font-thin pb-1">: Jalan Jendral Sudirman - Ruko Mandala Residence No. 31, Kel. Sukamentri, Kec. Garut Kota, Kab. Garut, Jawa Barat 44116</td></tr>
                                <tr><td className="align-top pb-1">NPWP/KTP</td><td className="align-top font-thin pb-1">: 55.743.562.5-013.000 / 3217062010780024</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-[50%] pl-10">
                        <p className="mb-1">KEPADA YTH.</p>
                        <div className="whitespace-pre-line leading-tight">
                            {r.to}
                        </div>
                        <div className="whitespace-pre-line leading-tight">
                            {r.address}
                        </div>
                    </div>
                </div>

                <div className="text-center font-bold mb-4 text-[11pt]">
                    <p>LAPORAN BULANAN PEMBUATAN AKTA OLEH PPAT</p>
                    <p>BULAN {MONTHS[selectedMonth - 1].toUpperCase()} TAHUN {selectedYear}</p>
                </div>

                <table className="w-full text-[6pt] border border-gray-300 border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-center font-semibold">
                            <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-8">NO.<br />URUT</th>
                            <th colSpan={2} className="border border-gray-300 px-1 py-1">AKTA</th>
                            <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-24">BENTUK<br />PERBUATAN<br />HUKUM</th>
                            <th colSpan={2} className="border border-gray-300 px-1 py-1">NAMA, ALAMAT DAN NPWP</th>
                            <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-24">JENIS<br />DAN<br />NOMOR HAK</th>
                            <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-32">NOP.<br />LETAK<br />TANAH DAN<br />BANGUNAN</th>
                            <th colSpan={2} className="border border-gray-300 px-1 py-1">LUAS (m2)</th>
                            <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-24">HARGA<br />TRANSAKSI<br />PEROLEHAN<br />PENGALIHAN HAK</th>
                            <th colSpan={2} className="border border-gray-300 px-1 py-1">SPPT PBB</th>
                            <th colSpan={2} className="border border-gray-300 px-1 py-1">SSP</th>
                            <th colSpan={2} className="border border-gray-300 px-1 py-1">SSB</th>
                            <th rowSpan={2} className="border border-gray-300 px-1 py-1 w-10">KET</th>
                        </tr>
                        <tr className="bg-gray-100 text-center font-semibold">
                            <th className="border border-gray-300 px-1 py-1 w-16">NOMOR</th>
                            <th className="border border-gray-300 px-1 py-1 w-16">TANGGAL</th>
                            <th className="border border-gray-300 px-1 py-1 w-32">PIHAK YANG<br />MENGALIHKAN</th>
                            <th className="border border-gray-300 px-1 py-1 w-32">PIHAK YANG<br />MENERIMA</th>
                            <th className="border border-gray-300 px-1 py-1 w-12">TNH</th>
                            <th className="border border-gray-300 px-1 py-1 w-12">BGN</th>
                            <th className="border border-gray-300 px-1 py-1 w-20">NOP<br />TAHUN</th>
                            <th className="border border-gray-300 px-1 py-1 w-20">NJOP</th>
                            <th className="border border-gray-300 px-1 py-1 w-16">TANGGAL</th>
                            <th className="border border-gray-300 px-1 py-1 w-20">(Rp.)</th>
                            <th className="border border-gray-300 px-1 py-1 w-16">TANGGAL</th>
                            <th className="border border-gray-300 px-1 py-1 w-20">(Rp.)</th>
                        </tr>
                        <tr className="bg-gray-50 text-[7pt] text-center text-gray-500">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <th key={i} className="border border-gray-300 px-1 py-0.5">{i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ppatRecords.length === 0 ? (
                            <tr><td colSpan={18} className="text-center py-6 text-gray-500 text-sm">NIHIL</td></tr>
                        ) : (
                            ppatRecords.map((record, index) => {
                                const mengalihkan = record.pihak.filter(p => /penjual|pemberi|ahli waris|pemilik/i.test(p.role)).map(p => p.name).join(', ');
                                const menerima = record.pihak.filter(p => /pembeli|penerima/i.test(p.role)).map(p => p.name).join(', ');
                                const displayMengalihkan = mengalihkan || (!menerima ? record.pihak.map(p => p.name).join(', ') : '-');

                                return (
                                    <tr key={record.id} className="align-top">
                                        <td className="border border-gray-300 px-1 py-1 text-center">{index + 1}</td>
                                        <td className="border border-gray-300 px-1 py-1">{record.nomorAkta}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">{formatDateIndo(record.tanggalAkta)}</td>
                                        <td className="border border-gray-300 px-1 py-1">{record.judulAkta}</td>
                                        <td className="border border-gray-300 px-1 py-1">{displayMengalihkan}</td>
                                        <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.pihakPenerima}</td>
                                        <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.jenisHak || '-'}</td>
                                        <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.lokasiObjek || '-'}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">{record.detailPPAT?.luasTanah || 0}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">{record.detailPPAT?.luasBangunan || 0}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-right">{currency(record.detailPPAT?.nilaiTransaksi || '-')}</td>
                                        <td className="border border-gray-300 px-1 py-1">{record.detailPPAT?.nop || '-'}<br />{selectedYear}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-right">{record.detailPPAT?.njop || '-'}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                                        <td className="border border-gray-300 px-1 py-1 text-right">{currency(record.detailPPAT?.ssp || '-')}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                                        <td className="border border-gray-300 px-1 py-1 text-right">{currency(record.detailPPAT?.ssb || '-')}</td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                <div className="mt-8 flex justify-end text-[10pt] font-serif text-center">
                    <div><p>Garut, {formatDateIndo(new Date().toISOString())}</p><div className="h-16"></div><p className="font-bold underline">HAVIS AKBAR, S.H., M.Kn.</p></div>
                </div>
            </div>
            {/* Spacer no-print */}
            <div className="h-8 bg-gray-200 no-print"></div>
        </div>
    ))}
</div>