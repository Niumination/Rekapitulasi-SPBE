# ⚡ Quick Start Guide - Sistem SPBE Aceh Tengah

## 🎯 Anda Di Sini

Aplikasi sudah **SIAP DIJALANKAN** dengan konfigurasi berikut:

✅ Next.js app running on port 3000  
✅ Supabase client configured  
✅ Frontend UI completed  
✅ Backend API endpoints ready  
✅ Authentication system ready  

## ⚠️ LANGKAH WAJIB SEBELUM MENGGUNAKAN

### Step 1: Setup Database Schema (5 menit)

1. Buka https://supabase.com/dashboard
2. Login dan pilih project: `dofvacvkzgzeixalkcbb`
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Buka file `supabase_schema.sql` di folder project ini
6. **Copy SELURUH ISI file** tersebut
7. **Paste di SQL Editor**
8. Klik tombol **RUN** (atau tekan Ctrl+Enter)

✅ Selesai! Database sudah siap dengan:
- 7 tables (unit_kerja, users, domain_spbe, aspek_spbe, indikator_spbe, bukti_dukung, verifikasi_log)
- RLS policies aktif
- Seed data (10 Unit Kerja, 4 Domain SPBE, 8 Aspek, 7 Indikator)

### Step 2: Setup Storage Bucket (3 menit)

1. Di Supabase Dashboard, klik **Storage**
2. Klik **Create a new bucket**
3. Bucket name: `bukti_dukung_spbe`
4. **UNCHECK** "Public bucket" (harus private!)
5. Klik **Create bucket**

6. Klik nama bucket yang baru dibuat
7. Klik tab **Policies**
8. Copy-paste 3 policies dari file `SETUP_SUPABASE.md` bagian 2.2

✅ Storage siap untuk upload file!

### Step 3: Create Test User (2 menit)

1. Di Supabase Dashboard, klik **Authentication** → **Users**
2. Klik **Add user** → **Create new user**
3. Isi:
   - Email: `operator@test.com`
   - Password: `password123`
   - ✅ Auto Confirm User
4. Klik **Create user**

5. Copy UUID user yang baru dibuat (contoh: `a1b2c3d4-...`)

6. Kembali ke **SQL Editor**, jalankan:

```sql
-- Get Diskominfo unit ID first
SELECT id, nama_unit FROM unit_kerja WHERE kode_unit = 'DISKOMINFO';

-- Insert user profile (ganti USER_UUID_HERE dengan UUID dari step 5)
INSERT INTO users (id, email, nama_lengkap, role, unit_kerja_id)
VALUES (
  'USER_UUID_HERE',
  'operator@test.com',
  'Operator Test',
  'operator_unit',
  (SELECT id FROM unit_kerja WHERE kode_unit = 'DISKOMINFO')
);
```

✅ Test user siap digunakan!

## 🚀 Mulai Menggunakan Aplikasi

1. Buka browser: http://localhost:3000
2. Login dengan:
   - Email: `operator@test.com`
   - Password: `password123`

3. Dashboard akan muncul!

## 📋 Apa yang Bisa Dilakukan?

### Sebagai Operator Unit:
- ✅ Lihat dashboard dengan statistik unit Anda
- ✅ Lihat daftar indikator SPBE untuk unit Anda
- ✅ Upload bukti dukung (PDF, DOC, XLS, gambar)
- ✅ Lihat status verifikasi (pending, diterima, ditolak)
- ✅ Edit/hapus bukti yang belum diverifikasi
- ✅ Lihat catatan dari verifikator

### Untuk Test Verifikator:
Buat user lain dengan role `verifikator` (ikuti Step 3 tapi ganti role)

### Untuk Test Super Admin:
Buat user lain dengan role `super_admin` (tanpa unit_kerja_id)

## 📚 Dokumentasi Lengkap

Untuk setup detail dan troubleshooting:
- **SETUP_SUPABASE.md** - Panduan lengkap setup database & storage
- **README.md** - Dokumentasi aplikasi lengkap

## 🐛 Troubleshooting Cepat

**Error: "Could not find table"**
→ Jalankan `supabase_schema.sql` di SQL Editor

**Error: "bucket does not exist"**
→ Buat storage bucket `bukti_dukung_spbe`

**Login gagal**
→ Pastikan user sudah ada di auth.users DAN di table users

**Dashboard kosong**
→ Normal jika belum ada data. Upload bukti dukung pertama Anda!

## 💡 Tips

- Upload beberapa bukti dukung untuk melihat dashboard terisi
- Coba filter by status di dashboard verifikator
- Perhatikan bagaimana RLS bekerja: operator hanya lihat data unit mereka
- Check audit trail di verifikasi_log setelah verifikasi

---

🎉 **Selamat! Sistem SPBE Aceh Tengah Siap Digunakan!**

Need help? Check **SETUP_SUPABASE.md** for detailed guide.
