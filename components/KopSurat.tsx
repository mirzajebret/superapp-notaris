import Image from 'next/image';

export default function KopSurat() {
  return (
    <div className="text-center mb-3 border-b-4 border-double border-black pb-2">
        <div className="flex justify-center mb-2">
            {/* Pastikan path image benar. html2pdf butuh waktu load image. */}
            <Image src="/images/garuda2.png" width={80} height={80} alt="Garuda" className="object-contain" priority />
        </div>
        <h1 className="font-bold text-[13pt] tracking-wide uppercase leading-tight">NOTARIS & PPAT</h1>
        <h2 className="font-bold text-[16pt] uppercase leading-tight">HAVIS AKBAR, S.H., M.Kn., M.M., C.L.A</h2>
        <div className="text-gray-500"> 
            <p className="text-[10pt] mt-1 leading-tight">Komplek Perkantoran Mandala Residence</p>
            <p className="text-[10pt] leading-tight">Jl. Jenderal Sudirman No. 31 B, Sukamentri, Garut Kota – Kabupaten Garut, 44116</p>
            <p className="text-[10pt] leading-tight">✆ 087736688999 – 081373337888, ✉ hakbar.notpat@gmail.com</p>
        </div>
    </div>
  );
}

