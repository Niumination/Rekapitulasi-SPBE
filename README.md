# 🏛️ Sistem SPBE Aceh Tengah

**Sistem Pengumpulan dan Pengelolaan Bukti Dukung SPBE** untuk Pemerintah Kabupaten Aceh Tengah.

Platform terpusat berbasis web untuk seluruh Organisasi Perangkat Daerah (OPD) dalam mengunggah, mengelola, dan memverifikasi dokumen bukti dukung terkait Indikator, Aspek, dan Domain SPBE sesuai PermenPANRB 59/2020.

---

## ✨ Fitur Utama

### 🔐 Role-Based Access Control (3 Role)
- **Super Admin**: Manajemen sistem, pengguna, dan struktur SPBE
- **Verifikator (Diskominfo)**: Verifikasi bukti dukung dari seluruh OPD
- **Operator Unit Kerja**: Upload dan kelola bukti dukung untuk unit masing-masing

### 📊 Dashboard Berbasis Role
- Statistik real-time (total bukti, pending, diterima, ditolak)
- Filter dan pencarian bukti dukung
- Visualisasi status verifikasi

### 📁 Manajemen Bukti Dukung
- Upload multi-format: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Metadata lengkap: deskripsi, tahun data, indikator terkait
- Version control dan audit trail
- Download file untuk review

### ✅ Workflow Verifikasi
- Status: Pending, Diterima, Ditolak, Perlu Revisi
- Catatan verifikasi wajib untuk setiap perubahan status
- Log history lengkap semua verifikasi

### 🔒 Keamanan Data
- **Row Level Security (RLS)**: Isolasi data otomatis per unit kerja
- **Storage Policies**: Akses file terkontrol berdasarkan role
- **Supabase Auth**: Authentication dengan JWT tokens
- **Audit Trail**: Semua perubahan tercatat di `verifikasi_log`

### 📱 Mobile-Friendly
- Responsive design dengan Tailwind CSS
- Optimized untuk desktop, tablet, dan smartphone
- Interface dalam Bahasa Indonesia

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (React 18) |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Deployment** | Vercel (ready) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier available)
- Yarn package manager

### Installation

1. **Clone & Install**
```bash
cd /app
yarn install
```

2. **Environment Setup**

File `.env.local` sudah dikonfigurasi dengan Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dofvacvkzgzeixalkcbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

⚠️ **Update Terbaru (Login Fix)**:
- Fixed login redirect issue - aplikasi sekarang akan redirect ke dashboard dengan benar setelah login
- Perbaikan di `handleLogin` function untuk menunggu auth state change dengan benar

3. **Setup Database & Storage**

📖 **PENTING**: Ikuti panduan lengkap di **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)**

Ringkasan langkah:
- Jalankan SQL schema di Supabase SQL Editor
- Buat storage bucket `bukti_dukung_spbe`
- Setup storage policies
- Create test users
- Insert user profiles

4. **Run Development Server**
```bash
yarn dev
# atau
sudo supervisorctl restart nextjs
```

Akses aplikasi: http://localhost:3000

---

## 📁 Project Structure

```
/app
├── app/
│   ├── api/[[...path]]/
│   │   └── route.js          # Backend API (all endpoints)
│   ├── page.js               # Main UI (Login, Dashboards, Forms)
│   ├── layout.js             # Root layout
│   └── globals.css           # Global styles
├── lib/
│   └── supabase.js           # Supabase client & helpers
├── components/
│   └── ui/                   # shadcn/ui components
├── supabase_schema.sql       # Complete database schema
├── SETUP_SUPABASE.md         # Setup guide (IMPORTANT!)
├── .env                      # Environment variables
└── README.md                 # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout

### Master Data
- `GET /api/unit-kerja` - Get all unit kerja (OPD)
- `GET /api/domain-spbe` - Get all domain SPBE
- `GET /api/aspek-spbe` - Get all aspek SPBE
- `GET /api/indikator-spbe?unit_kerja_id={id}` - Get indikator (optional filter)

### Bukti Dukung
- `GET /api/bukti-dukung?status={status}` - Get bukti (filtered by RLS)
- `POST /api/bukti-dukung` - Create new bukti
- `PUT /api/bukti-dukung/{id}` - Update bukti
- `DELETE /api/bukti-dukung/{id}` - Delete bukti (pending only)

### Verifikasi
- `PUT /api/verifikasi/{id}` - Verify/reject bukti (verifikator only)
- `GET /api/verifikasi-log/{bukti_id}` - Get verification history

### File Upload
- `POST /api/upload` - Upload file to Supabase Storage

### Dashboard
- `GET /api/dashboard/stats` - Get statistics for current user

---

## 🗄️ Database Schema

### Core Tables

**unit_kerja** (10 OPD)
- Dinas Komunikasi dan Informatika (Koordinator SPBE)
- Bappeda, Setda, Disdikbud, Dinkes, dll.

**users**
- Extended dari `auth.users`
- Fields: role, unit_kerja_id, nama_lengkap

**domain_spbe** (4 Domain)
1. Kebijakan SPBE
2. Tata Kelola SPBE
3. Manajemen SPBE
4. Layanan SPBE

**aspek_spbe** (8 Aspek)
- Linked to domains

**indikator_spbe** (7+ Indikator)
- Linked to aspek dan unit_kerja
- Contoh: IND-1.1, IND-3.1, IND-8.1

**bukti_dukung**
- File uploads dengan metadata
- Status verifikasi: pending, diterima, ditolak, perlu_revisi

**verifikasi_log**
- Audit trail untuk semua perubahan status

### Security Features

✅ **Row Level Security (RLS)** pada semua tabel
- Operator hanya lihat data unit mereka
- Verifikator lihat semua data
- Super admin akses penuh

✅ **Storage Policies**
- File access terbatas per unit
- Upload/download controlled by role

---

## 👤 Default Test Users

Setelah setup Supabase selesai, buat test users dengan credentials:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | admin@acehtengahkab.go.id | Admin123!@# | Full system access |
| Verifikator | verifikator@diskominfo.go.id | Verif123!@# | View & verify all |
| Operator | operator@diskominfo.go.id | Oper123!@# | Diskominfo unit only |
| Operator | operator@bappeda.go.id | Oper123!@# | Bappeda unit only |

⚠️ **Ganti password default sebelum production!**

---

## 🧪 Testing

### Manual Testing Checklist

**Operator Unit:**
- [ ] Login dengan operator credentials
- [ ] Dashboard menampilkan stats unit
- [ ] Upload bukti dukung untuk indikator unit
- [ ] File tersimpan di Supabase Storage
- [ ] Hanya lihat bukti dari unit sendiri
- [ ] Edit/hapus bukti dengan status pending
- [ ] Tidak bisa hapus bukti yang sudah diverifikasi

**Verifikator:**
- [ ] Login dengan verifikator credentials
- [ ] Dashboard menampilkan semua bukti dari semua unit
- [ ] Filter by status (pending, diterima, ditolak)
- [ ] Verifikasi bukti dengan catatan
- [ ] Status berubah dan tercatat di log
- [ ] Lihat history verifikasi

**Data Isolation:**
- [ ] Operator Unit A tidak bisa lihat data Unit B
- [ ] Verifikator bisa lihat data semua unit
- [ ] File storage terisolasi per unit

---

## 📖 Documentation

- **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** - Complete setup guide
- **[supabase_schema.sql](./supabase_schema.sql)** - Database schema with RLS

---

## 🎨 UI/UX Features

- **Modern & Professional**: Clean design dengan color scheme pemerintahan
- **Intuitive Navigation**: Role-based menus dan dashboards
- **Real-time Stats**: Live dashboard dengan statistik
- **Mobile Responsive**: Optimized untuk semua devices
- **Indonesian Language**: Full bahasa Indonesia interface
- **Loading States**: Smooth loading indicators
- **Toast Notifications**: User feedback untuk setiap action
- **Dialog Modals**: Clean forms untuk upload dan verifikasi

---

## 🔐 Security Best Practices

1. **RLS Policies**: Automatic data filtering di database level
2. **JWT Authentication**: Secure token-based auth via Supabase
3. **Storage Security**: File access controlled per unit
4. **Audit Logs**: Complete history di verifikasi_log
5. **Input Validation**: Both client & server side
6. **HTTPS Only**: Enforce HTTPS in production
7. **Password Policy**: Strong passwords recommended

---

## 🚢 Deployment

### Deploy ke Vercel (Recommended)

1. Push ke GitHub repository
2. Connect repository di Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Custom Domain Setup
- Update Supabase Auth Redirect URLs
- Configure DNS untuk subdomain `acehtengahkab.go.id`

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase URL dan anon key di `.env`
- Check RLS policies active: `SELECT * FROM pg_policies`

### File Upload Failed
- Check storage bucket `bukti_dukung_spbe` exists
- Verify storage policies configured
- Check file size < 10MB

### RLS Not Working
- Ensure user profile exists in `users` table
- Check `auth.uid()` matches user.id

### Server Not Starting
```bash
tail -f /var/log/supervisor/nextjs.out.log
sudo supervisorctl restart nextjs
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- Monitor storage usage di Supabase Dashboard
- Review audit logs untuk compliance
- Backup database regularly
- Update user list per OPD changes

### Scaling Considerations
- Supabase free tier: 500MB database, 1GB storage
- Upgrade to Pro untuk production dengan traffic tinggi
- Enable CDN untuk faster file downloads

---

## 📝 License

Proprietary - Pemerintah Kabupaten Aceh Tengah

---

## 🙏 Credits

- **Framework**: Next.js by Vercel
- **Backend**: Supabase
- **UI Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React
- **SPBE Framework**: PermenPANRB 59/2020

---

**Sistem SPBE Aceh Tengah** - Membangun Pemerintahan Digital yang Lebih Baik 🇮🇩
