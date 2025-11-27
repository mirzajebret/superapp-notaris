<table className="w-full border-collapse border border-black text-[10pt]">
    <thead>
        {m.code === 'N-1' ? (
            <>
                <tr className="bg-white text-center font-bold">
                    <th rowSpan={2} className="border border-black p-1 w-[5%] align-middle">Nomor Urut</th>
                    <th colSpan={2} className="border border-black p-1 w-[20%] align-middle">Akta</th>
                    <th rowSpan={2} className="border border-black p-1 w-[35%] align-middle">Sifat Akta</th>
                    <th rowSpan={2} className="border border-black p-1 w-[40%] align-middle">Nama Penghadap dan Atau yang diwakili/Kuasa</th>
                </tr>
                <tr className="bg-white text-center">
                    <th className="border border-black p-1 font-normal">Nomor Bulanan</th>
                    <th className="border border-black p-1 font-normal">Tanggal</th>
                </tr>
            </>
        ) : (
            <tr className="bg-white text-center font-bold">
                {m.cols.map((c, i) => <th key={i} className="border border-black p-2">{c}</th>)}
            </tr>
        )}
    </thead>
    <tbody>
        {(() => {
            const data = notarisRecords.filter(r => r.kategori === m.filter);
            if (data.length === 0) return <tr><td colSpan={m.code === 'N-1' ? 5 : m.cols.length} className="border border-black p-4 text-center font-bold text-lg">NIHIL</td></tr>;

            return data.map((d, i) => (
                <tr key={i} className="align-top">
                    <td className="border border-black p-2 text-center">{i + 1}</td>

                    {m.code === 'N-1' && (
                        <>
                            <td className="border border-black p-2 text-center align-top">{d.nomorBulanan || '-'}</td>
                            <td className="border border-black p-2 text-center align-top">{formatDateIndo(d.tanggalAkta)}</td>
                            <td className="border border-black p-2 text-center align-top">{d.judulAkta}</td>
                            <td className="border border-black p-2 text-left align-top">
                                {d.pihak.map((p, pIdx) => (
                                    <div key={pIdx} className="mb-3">
                                        {/* Nama Pihak Utama */}
                                        <div className="flex items-start font-medium">
                                            <span className="mr-1">{pIdx + 1}.</span>
                                            <span>{p.name}</span>
                                        </div>

                                        {/* Kapasitas Bertindak & Yang Diwakili */}
                                        <div className="ml-4 text-sm text-gray-800">
                                            {(p.actingCapacity === 'self' || p.actingCapacity === 'both') && (
                                                <div>- untuk dirinya sendiri</div>
                                            )}
                                            {(p.actingCapacity === 'representative' || p.actingCapacity === 'both') && (
                                                <div>- untuk & atas nama :</div>
                                            )}
                                            {/* Daftar Kuasa (a, b, c) - Grid jika banyak */}
                                            {p.representedParties && p.representedParties.length > 0 && (
                                                <div className={`ml-2 mt-1 ${p.representedParties.length > 1 ? 'grid grid-cols-2 gap-x-4' : ''}`}>
                                                    {p.representedParties.map((repName, rIdx) => (
                                                        <div key={rIdx} className="flex items-start">
                                                            <span className="mr-1 w-4">{String.fromCharCode(97 + rIdx)}.</span>
                                                            <span>{repName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </td>
                        </>
                    )}

                    {(m.code === 'N-2' || m.code === 'N-3' || m.code === 'N-4' || m.code === 'N-5') && (
                        <>
                            <td className="border border-black p-2">{formatDateIndo(d.tanggalAkta)}</td>
                            <td className="border border-black p-2">{d.judulAkta}</td>
                            <td className="border border-black p-2">
                                {d.pihak.map((p, idx) => (
                                    <div key={idx} className="flex items-start">
                                        <span className="mr-1 shrink-0">{idx + 1}.</span>
                                        <span>{p.name}</span>
                                    </div>
                                ))}
                            </td>
                        </>
                    )}
                </tr>
            ));
        })()}
    </tbody>
</table>