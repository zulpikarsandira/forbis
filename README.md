# Koperasi Forbis Cimanggung - Web Management App

Aplikasi web manajemen koperasi UMKM untuk mengelola inventory, penjualan, dan pembagian laba otomatis. Dibuat dengan Next.js 14, Tailwind CSS, dan Supabase.

## 🚀 Cara Menjalankan Aplikasi

1.  **Install Dependencies** (Jika belum)
    ```bash
    npm install
    ```

2.  **Setup Environment Variables**
    Pastikan file `.env.local` sudah ada dan berisi URL & Key Supabase Anda:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

3.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```

4.  **Buka di Browser**
    Akses [http://localhost:3000](http://localhost:3000)

## 📖 Panduan Penggunaan

### 1. Login
- Masuk menggunakan akun admin yang terdaftar di Authentication Supabase.
- Jika belum punya akun, buat user baru di dashboard Supabase atau gunakan fitur Sign Up (jika diaktifkan).

### 2. Dashboard
- Halaman utama menampilkan ringkasan performa:
  - Total penjualan hari in
  - Total laba bulan ini
  - Peringatan stok menipis
  - Grafik trend penjualan 7 hari terakhir

### 3. Data Barang (Inventory)
- **Tambah Barang**: Klik tombol "Tambah Barang", isi kode (unik), nama, harga modal, harga jual, dan stok awal.
- **Edit/Hapus**: Gunakan tombol aksi di tabel untuk mengubah atau menghapus barang.
- **Stok**: Stok akan berkurang otomatis saat terjadi penjualan. Badge warna akan muncul jika stok menipis (Merah < 3, Kuning < 10).

### 4. Entry Penjualan
- **Input Transaksi**:
  - Pilih tanggal.
  - Cari barang (ketik nama/kode di kotak pencarian).
  - Masukkan jumlah (sistem akan mencegah jika melebihi stok).
  - Harga dan total dihitung otomatis.
- **Riwayat**: Tabel di bawah form menampilkan transaksi hari ini. Anda bisa menghapus transaksi (stok akan dikembalikan otomatis).

### 5. Pembagian Laba (Profit Validation)
- **Hitung Laba**: Masukkan rentang tanggal (Start Date - End Date) lalu klik "Hitung Laba".
- **Generate & Lock**: Jika total laba sudah benar, klik tombol ini untuk membagi laba ke 10 kategori otomatis (Zakat, Cashback, Pengurus, dll).
- **Laporan**: Setelah digenerate, grafik donat dan tabel detail akan muncul. Data ini tersimpan (locked) dan tidak bisa dihitung ulang kecuali di-reset.
- **Export Excel**: Unduh laporan pembagian laba dalam format Excel.

## 🛠️ Teknologi
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Chart.js
- **Export**: xlsx (SheetJS)
