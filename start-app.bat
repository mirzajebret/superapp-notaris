@echo off
title Notaris SuperApp Server
echo Memulai Aplikasi Notaris...
echo Mohon jangan tutup jendela ini (Boleh di-minimize).
echo.

:: Pindah ke direktori project (Ganti path di bawah sesuai lokasi folder Anda)
cd /d "C:\Users\HP\.cursor\worktrees\kantorapp\1A3Xt"

:: Menjalankan server produksi
npm run dev

pause