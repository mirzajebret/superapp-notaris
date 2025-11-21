import Image from 'next/image';

export default function CoverHeader() {
  return (
    <div className="flex flex-col items-center justify-center text-center font-serif text-black">
      {/* Logo Garuda */}
      <div className="mb-4">
        <Image 
          src="/images/garuda-cover.png" 
          width={110} 
          height={110} 
          alt="Garuda" 
          className="object-contain" 
          priority
        />
      </div>

      {/* Teks Header - Perhatikan ukuran font dan ketebalan */}
      <h1 className="text-[23pt] font-bold uppercase tracking-wide leading-none mb-1">
        NOTARIS
      </h1>
      
      <h2 className="text-[23pt] font-extrabold  leading-none mb-4">
        HAVIS AKBAR, S.H., M.Kn
      </h2>

      {/* SK Menteri - Font lebih kecil */}
      <div className="text-[12pt] leading-tight w-[90%] mx-auto">
        <p>SURAT KEPUTUSAN MENTERI HUKUM DAN HAK ASASI MANUSIA R.I</p>
        <p>NOMOR: AHU-02036.AH.02.01.TAHUN 2023, TANGGAL 06 OKTOBER 2023</p>
      </div>
    </div>
  );
}