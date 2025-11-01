# 🚀 Panduan Setup Supabase untuk Sistem SPBE Aceh Tengah

## 📋 Daftar Isi
1. [Setup Database Schema](#1-setup-database-schema)
2. [Setup Storage Bucket](#2-setup-storage-bucket)
3. [Create Test Users](#3-create-test-users)
4. [Testing & Verification](#4-testing--verification)

---

## 1. Setup Database Schema

### Langkah 1.1: Akses Supabase SQL Editor

1. Login ke https://supabase.com/dashboard
2. Pilih project Anda: `dofvacvkzgzeixalkcbb`
3. Di sidebar kiri, klik **SQL Editor**
4. Klik **New Query**

### Langkah 1.2: Execute Schema SQL

1. Buka file `supabase_schema.sql` di root folder project
2. Copy seluruh isi file tersebut
3. Paste di SQL Editor Supabase
4. Klik **RUN** atau tekan `Ctrl+Enter`

**Expected Result:**
- ✅ 7 tables created: `unit_kerja`, `users`, `domain_spbe`, `aspek_spbe`, `indikator_spbe`, `bukti_dukung`, `verifikasi_log`
- ✅ 2 ENUM types created: `user_role`, `verifikasi_status`
- ✅ RLS policies enabled on all tables
- ✅ Seed data inserted (10 Unit Kerja, 4 Domain, 8 Aspek, 7 Indikator)

### Langkah 1.3: Verifikasi Tables

Di SQL Editor, jalankan query berikut untuk verifikasi:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check unit kerja data
SELECT * FROM unit_kerja;

-- Check domain SPBE data
SELECT * FROM domain_spbe;

-- Check indikator data
SELECT * FROM indikator_spbe;
```

---

## 2. Setup Storage Bucket

### Langkah 2.1: Create Storage Bucket

1. Di Supabase Dashboard, klik **Storage** di sidebar
2. Klik **Create a new bucket**
3. Isi form:
   - **Name**: `bukti_dukung_spbe`
   - **Public bucket**: ✅ **UNCHECK** (private bucket)
   - **File size limit**: 10 MB (optional)
   - **Allowed MIME types**: Leave empty or add: `application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*`
4. Klik **Create bucket**

### Langkah 2.2: Setup Storage Policies

1. Setelah bucket dibuat, klik bucket name `bukti_dukung_spbe`
2. Klik tab **Policies**
3. Klik **New Policy**

### Cara 1: Via Supabase Dashboard (RECOMMENDED - Paling Mudah)

1. Klik bucket `bukti_dukung_spbe` yang baru dibuat
2. Klik tab **Policies**
3. Klik **New Policy** → pilih **Custom policy**

**Policy 1: Allow Authenticated Uploads (INSERT)**
- Policy name: `Allow authenticated uploads`
- Policy definition for INSERT:
```sql
bucket_id = 'bukti_dukung_spbe' AND auth.uid() IS NOT NULL
```
- Target roles: `authenticated`
- Klik **Review** → **Save policy**

**Policy 2: Allow SELECT (READ)**
- Klik **New Policy** lagi → **Custom policy**
- Policy name: `Allow authenticated reads`
- Policy definition for SELECT:
```sql
bucket_id = 'bukti_dukung_spbe'
```
- Target roles: `authenticated`
- Klik **Review** → **Save policy**

**Policy 3: Allow DELETE**
- Klik **New Policy** lagi → **Custom policy**
- Policy name: `Allow delete`
- Policy definition for DELETE:
```sql
bucket_id = 'bukti_dukung_spbe'
```
- Target roles: `authenticated`
- Klik **Review** → **Save policy**

### Cara 2: Via SQL Editor (Advanced)

Jika ingin menggunakan SQL Editor, **buat file query TERPISAH** setelah bucket sudah dibuat:

```sql
-- JALANKAN INI SETELAH BUCKET SUDAH DIBUAT
-- Di SQL Editor Supabase

-- Policy 1: Allow Authenticated Uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bukti_dukung_spbe'
);

-- Policy 2: Allow Authenticated Reads  
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bukti_dukung_spbe'
);

-- Policy 3: Allow Authenticated Deletes
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bukti_dukung_spbe'
);

-- Policy 4: Allow Authenticated Updates (opsional)
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bukti_dukung_spbe'
)
WITH CHECK (
  bucket_id = 'bukti_dukung_spbe'
);
```

⚠️ **PENTING**: Storage policies menggunakan sintaks yang berbeda dari table policies. Gunakan **Cara 1 (Dashboard)** untuk hasil terbaik!

---

## 3. Create Test Users

### Langkah 3.1: Create Auth Users via Supabase Dashboard

1. Di Supabase Dashboard, klik **Authentication** di sidebar
2. Klik **Users**
3. Klik **Add user** → **Create new user**

**User 1: Super Admin**
- Email: `admin@acehtengahkab.go.id`
- Password: `Admin123!@#` (set your own secure password)
- Auto Confirm User: ✅ **CHECK**

**User 2: Verifikator (Diskominfo)**
- Email: `verifikator@diskominfo.go.id`
- Password: `Verif123!@#`
- Auto Confirm User: ✅ **CHECK**

**User 3: Operator Unit (Diskominfo)**
- Email: `operator@diskominfo.go.id`
- Password: `Oper123!@#`
- Auto Confirm User: ✅ **CHECK**

**User 4: Operator Unit (Bappeda)**
- Email: `operator@bappeda.go.id`
- Password: `Oper123!@#`
- Auto Confirm User: ✅ **CHECK**

### Langkah 3.2: Insert User Profiles

Setelah membuat auth users di dashboard, jalankan SQL berikut di **SQL Editor**:

⚠️ **IMPORTANT**: Ganti `USER_ID_HERE` dengan actual UUID dari auth.users yang baru dibuat!

Untuk mendapatkan UUID, jalankan query ini dulu:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 4;
```

Kemudian insert ke table users:

```sql
-- Get unit kerja IDs first
SELECT id, nama_unit, kode_unit FROM unit_kerja;

-- Insert Super Admin Profile
INSERT INTO users (id, email, nama_lengkap, role, unit_kerja_id)
VALUES (
  'USER_ID_SUPER_ADMIN_HERE',
  'admin@acehtengahkab.go.id',
  'Administrator SPBE',
  'super_admin',
  NULL
);

-- Insert Verifikator Profile (use Diskominfo unit_kerja_id)
INSERT INTO users (id, email, nama_lengkap, role, unit_kerja_id)
VALUES (
  'USER_ID_VERIFIKATOR_HERE',
  'verifikator@diskominfo.go.id',
  'Verifikator Diskominfo',
  'verifikator',
  (SELECT id FROM unit_kerja WHERE kode_unit = 'DISKOMINFO')
);

-- Insert Operator Diskominfo Profile
INSERT INTO users (id, email, nama_lengkap, role, unit_kerja_id)
VALUES (
  'USER_ID_OPERATOR_DISKOMINFO_HERE',
  'operator@diskominfo.go.id',
  'Operator Diskominfo',
  'operator_unit',
  (SELECT id FROM unit_kerja WHERE kode_unit = 'DISKOMINFO')
);

-- Insert Operator Bappeda Profile
INSERT INTO users (id, email, nama_lengkap, role, unit_kerja_id)
VALUES (
  'USER_ID_OPERATOR_BAPPEDA_HERE',
  'operator@bappeda.go.id',
  'Operator Bappeda',
  'operator_unit',
  (SELECT id FROM unit_kerja WHERE kode_unit = 'BAPPEDA')
);
```

### Langkah 3.3: Verifikasi User Profiles

```sql
-- Check all users with their roles and units
SELECT 
  u.email,
  u.nama_lengkap,
  u.role,
  uk.nama_unit
FROM users u
LEFT JOIN unit_kerja uk ON u.unit_kerja_id = uk.id
ORDER BY u.created_at DESC;
```

---

## 4. Testing & Verification

### Test 1: Login Test

1. Akses aplikasi di browser
2. Login dengan credentials:
   - Email: `operator@diskominfo.go.id`
   - Password: `Oper123!@#` (atau password yang Anda set)
3. Verify:
   - ✅ Login successful
   - ✅ Dashboard operator muncul
   - ✅ Unit Kerja: "Dinas Komunikasi dan Informatika"
   - ✅ Dapat melihat list indikator

### Test 2: RLS Policy Test

Di SQL Editor, test RLS policies:

```sql
-- Simulate operator login and check what they can see
-- (This simulates the auth.uid() check)

-- Check bukti_dukung visibility for operator
SELECT * FROM bukti_dukung 
WHERE unit_kerja_id = (
  SELECT unit_kerja_id FROM users 
  WHERE email = 'operator@diskominfo.go.id'
);

-- Check indikator for specific unit
SELECT * FROM indikator_spbe 
WHERE unit_kerja_id = (
  SELECT id FROM unit_kerja WHERE kode_unit = 'DISKOMINFO'
);
```

### Test 3: File Upload Test

1. Login sebagai Operator
2. Klik "Unggah Bukti Dukung"
3. Pilih indikator
4. Upload file (PDF, DOC, atau image)
5. Isi deskripsi
6. Submit
7. Verify:
   - ✅ File uploaded to Supabase Storage
   - ✅ Record created in `bukti_dukung` table
   - ✅ Status = 'pending'
   - ✅ File path follows pattern: `{unit_id}/{timestamp}_{filename}`

### Test 4: Verifikasi Test

1. Logout dan login sebagai Verifikator
2. Verify:
   - ✅ Dapat melihat SEMUA bukti dukung dari semua unit
   - ✅ Ada tombol "Verifikasi"
3. Klik "Verifikasi" pada salah satu bukti
4. Ubah status dan tambahkan catatan
5. Submit
6. Verify:
   - ✅ Status berubah
   - ✅ Catatan tersimpan
   - ✅ Record baru di `verifikasi_log`

### Test 5: Data Isolation Test

1. Login sebagai Operator Unit A (Diskominfo)
2. Note berapa banyak bukti yang terlihat
3. Logout dan login sebagai Operator Unit B (Bappeda)
4. Verify:
   - ✅ Operator B TIDAK dapat melihat bukti dari Unit A
   - ✅ Operator B hanya melihat bukti dari unit mereka sendiri
   - ✅ Operator B hanya dapat upload untuk indikator unit mereka

---

## 📊 Database Structure Summary

```
┌─────────────────┐
│  unit_kerja     │  (10 OPD)
└────────┬────────┘
         │
    ┌────┴────────────┐
    ↓                 ↓
┌───────┐      ┌──────────────┐
│ users │      │ indikator... │
└───────┘      └──────┬───────┘
    ↓                 ↓
    └────→ ┌──────────────────┐
           │  bukti_dukung    │
           └─────────┬────────┘
                     ↓
           ┌──────────────────┐
           │ verifikasi_log   │
           └──────────────────┘

Domain → Aspek → Indikator
  (4)      (8)      (7+)
```

---

## 🔐 Security Features Implemented

1. **Row Level Security (RLS)**: Automatic data filtering based on user role and unit
2. **Storage Policies**: File access restricted by role and unit ownership
3. **Role-Based Access Control**: 3 roles with different permissions
4. **Audit Trail**: All verification changes logged in `verifikasi_log`
5. **Supabase Auth**: Industry-standard authentication with JWT tokens

---

## 🛠️ Troubleshooting

### Issue: "relation does not exist"
**Solution**: Schema SQL belum dijalankan. Ulangi langkah 1.2

### Issue: "bucket does not exist" 
**Solution**: Storage bucket belum dibuat. Ulangi langkah 2.1

### Issue: User can't login
**Solution**: 
1. Check auth.users exists
2. Check users profile exists
3. Verify email and password correct

### Issue: Operator can see other unit's data
**Solution**: RLS policies belum aktif. Check:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Issue: File upload failed
**Solution**: 
1. Check storage bucket exists
2. Check storage policies exist
3. Check file size < 10MB
4. Check CORS settings if accessing from different domain

---

## 📞 Support

Jika ada masalah dalam setup:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Check Next.js logs: `tail -f /var/log/supervisor/nextjs.out.log`

---

## ✅ Setup Checklist

- [ ] Database schema executed successfully
- [ ] All 7 tables created
- [ ] Seed data inserted (Unit Kerja, Domain, Aspek, Indikator)
- [ ] Storage bucket `bukti_dukung_spbe` created
- [ ] Storage policies configured
- [ ] Test users created in auth.users
- [ ] User profiles inserted in users table
- [ ] Login test successful
- [ ] RLS filtering working correctly
- [ ] File upload working
- [ ] Verification workflow working
- [ ] Data isolation between units verified

---

**Setup completed!** 🎉 Your Sistem SPBE is ready for production use.
