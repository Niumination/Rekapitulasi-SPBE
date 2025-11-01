-- =====================================================
-- SISTEM SPBE ACEH TENGAH - DATABASE SCHEMA
-- PostgreSQL Schema untuk Supabase
-- =====================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create ENUM types
CREATE TYPE user_role AS ENUM ('super_admin', 'verifikator', 'operator_unit');
CREATE TYPE verifikasi_status AS ENUM ('pending', 'diterima', 'ditolak', 'perlu_revisi');

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- Table: unit_kerja (OPD/SKPD)
CREATE TABLE unit_kerja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_unit VARCHAR(255) NOT NULL UNIQUE,
    kode_unit VARCHAR(50) UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users (Extended dari Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'operator_unit',
    unit_kerja_id UUID REFERENCES unit_kerja(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: domain_spbe
CREATE TABLE domain_spbe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_domain VARCHAR(10) NOT NULL UNIQUE,
    nama_domain VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    urutan INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: aspek_spbe
CREATE TABLE aspek_spbe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domain_spbe(id) ON DELETE CASCADE,
    kode_aspek VARCHAR(10) NOT NULL UNIQUE,
    nama_aspek VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    urutan INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: indikator_spbe
CREATE TABLE indikator_spbe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aspek_id UUID NOT NULL REFERENCES aspek_spbe(id) ON DELETE CASCADE,
    kode_indikator VARCHAR(20) NOT NULL UNIQUE,
    nama_indikator TEXT NOT NULL,
    deskripsi TEXT,
    unit_kerja_id UUID REFERENCES unit_kerja(id) ON DELETE SET NULL,
    bobot_nilai DECIMAL(5,2),
    urutan INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bukti_dukung
CREATE TABLE bukti_dukung (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indikator_id UUID NOT NULL REFERENCES indikator_spbe(id) ON DELETE CASCADE,
    unit_kerja_id UUID NOT NULL REFERENCES unit_kerja(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    nama_file VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    
    deskripsi TEXT,
    tahun_data INTEGER,
    
    status_verifikasi verifikasi_status DEFAULT 'pending',
    catatan_verifikasi TEXT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: verifikasi_log (Audit trail)
CREATE TABLE verifikasi_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bukti_dukung_id UUID NOT NULL REFERENCES bukti_dukung(id) ON DELETE CASCADE,
    verifikator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status_lama verifikasi_status,
    status_baru verifikasi_status NOT NULL,
    catatan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_unit_kerja ON users(unit_kerja_id);
CREATE INDEX idx_indikator_aspek ON indikator_spbe(aspek_id);
CREATE INDEX idx_indikator_unit_kerja ON indikator_spbe(unit_kerja_id);
CREATE INDEX idx_bukti_dukung_indikator ON bukti_dukung(indikator_id);
CREATE INDEX idx_bukti_dukung_unit_kerja ON bukti_dukung(unit_kerja_id);
CREATE INDEX idx_bukti_dukung_status ON bukti_dukung(status_verifikasi);
CREATE INDEX idx_verifikasi_log_bukti ON verifikasi_log(bukti_dukung_id);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_spbe ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspek_spbe ENABLE ROW LEVEL SECURITY;
ALTER TABLE indikator_spbe ENABLE ROW LEVEL SECURITY;
ALTER TABLE bukti_dukung ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifikasi_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for USERS table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for UNIT_KERJA table
CREATE POLICY "Anyone authenticated can view unit_kerja" ON unit_kerja
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin can manage unit_kerja" ON unit_kerja
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for DOMAIN_SPBE table
CREATE POLICY "Anyone authenticated can view domain_spbe" ON domain_spbe
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin can manage domain_spbe" ON domain_spbe
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for ASPEK_SPBE table
CREATE POLICY "Anyone authenticated can view aspek_spbe" ON aspek_spbe
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin can manage aspek_spbe" ON aspek_spbe
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for INDIKATOR_SPBE table
CREATE POLICY "Anyone authenticated can view indikator_spbe" ON indikator_spbe
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin can manage indikator_spbe" ON indikator_spbe
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for BUKTI_DUKUNG table (CRITICAL - Data Isolation)
CREATE POLICY "Operator can view bukti from their unit" ON bukti_dukung
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'operator_unit'
            AND users.unit_kerja_id = bukti_dukung.unit_kerja_id
        )
    );

CREATE POLICY "Verifikator can view all bukti" ON bukti_dukung
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('verifikator', 'super_admin')
        )
    );

CREATE POLICY "Operator can insert bukti for their unit" ON bukti_dukung
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'operator_unit'
            AND users.unit_kerja_id = bukti_dukung.unit_kerja_id
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Operator can update their unit's bukti" ON bukti_dukung
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'operator_unit'
            AND users.unit_kerja_id = bukti_dukung.unit_kerja_id
        )
    );

CREATE POLICY "Verifikator can update bukti status" ON bukti_dukung
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('verifikator', 'super_admin')
        )
    );

CREATE POLICY "Operator can delete their unit's bukti" ON bukti_dukung
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'operator_unit'
            AND users.unit_kerja_id = bukti_dukung.unit_kerja_id
        )
        AND status_verifikasi = 'pending'
    );

-- RLS Policies for VERIFIKASI_LOG table
CREATE POLICY "Anyone can view verifikasi_log" ON verifikasi_log
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Verifikator can insert verifikasi_log" ON verifikasi_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('verifikator', 'super_admin')
        )
        AND verifikator_id = auth.uid()
    );

-- =====================================================
-- 6. SEED DATA
-- =====================================================

-- Insert Unit Kerja (OPD)
INSERT INTO unit_kerja (nama_unit, kode_unit, deskripsi) VALUES
('Dinas Komunikasi dan Informatika', 'DISKOMINFO', 'Koordinator SPBE Kabupaten Aceh Tengah'),
('Badan Perencanaan Pembangunan Daerah', 'BAPPEDA', 'Perencanaan dan Pengembangan'),
('Sekretariat Daerah', 'SETDA', 'Sekretariat Daerah'),
('Dinas Pendidikan dan Kebudayaan', 'DISDIKBUD', 'Pendidikan dan Kebudayaan'),
('Dinas Kesehatan', 'DINKES', 'Kesehatan Masyarakat'),
('Dinas Pekerjaan Umum dan Penataan Ruang', 'DPUPR', 'Infrastruktur dan Penataan Ruang'),
('Badan Keuangan Daerah', 'BKD', 'Pengelolaan Keuangan Daerah'),
('Badan Kepegawaian Daerah', 'BKPSDM', 'Kepegawaian dan Pengembangan SDM'),
('Dinas Sosial', 'DINSOS', 'Kesejahteraan Sosial'),
('Dinas Kependudukan dan Pencatatan Sipil', 'DISDUKCAPIL', 'Administrasi Kependudukan');

-- Insert Domain SPBE (PermenPANRB 59/2020)
INSERT INTO domain_spbe (kode_domain, nama_domain, deskripsi, urutan) VALUES
('D1', 'Kebijakan SPBE', 'Domain kebijakan internal terkait SPBE', 1),
('D2', 'Tata Kelola SPBE', 'Domain tata kelola dan manajemen SPBE', 2),
('D3', 'Manajemen SPBE', 'Domain manajemen penyelenggaraan SPBE', 3),
('D4', 'Layanan SPBE', 'Domain layanan administrasi dan publik berbasis elektronik', 4);

-- Insert Aspek SPBE
INSERT INTO aspek_spbe (domain_id, kode_aspek, nama_aspek, deskripsi, urutan)
SELECT 
    d.id,
    aspek.kode,
    aspek.nama,
    aspek.deskripsi,
    aspek.urutan
FROM domain_spbe d
CROSS JOIN (VALUES
    -- Domain Kebijakan SPBE
    ('A1', 'Kebijakan Internal Arsitektur SPBE', 'Kebijakan terkait arsitektur SPBE', 1),
    ('A2', 'Kebijakan Internal Peta Rencana SPBE', 'Kebijakan perencanaan SPBE', 2),
    -- Domain Tata Kelola SPBE
    ('A3', 'Kelembagaan', 'Struktur organisasi pengelola SPBE', 3),
    ('A4', 'Strategi dan Perencanaan', 'Strategi dan perencanaan implementasi SPBE', 4),
    ('A5', 'Teknologi Informasi dan Komunikasi', 'Pengelolaan infrastruktur TIK', 5),
    -- Domain Manajemen SPBE
    ('A6', 'Penerapan Manajemen', 'Penerapan manajemen dalam SPBE', 6),
    -- Domain Layanan SPBE
    ('A7', 'Layanan Administrasi Pemerintahan Berbasis Elektronik', 'Layanan internal pemerintahan', 7),
    ('A8', 'Layanan Publik Berbasis Elektronik', 'Layanan untuk masyarakat', 8)
) AS aspek(kode, nama, deskripsi, urutan)
WHERE 
    (d.kode_domain = 'D1' AND aspek.kode IN ('A1', 'A2'))
    OR (d.kode_domain = 'D2' AND aspek.kode IN ('A3', 'A4', 'A5'))
    OR (d.kode_domain = 'D3' AND aspek.kode IN ('A6'))
    OR (d.kode_domain = 'D4' AND aspek.kode IN ('A7', 'A8'));

-- Insert Sample Indikator SPBE (contoh untuk beberapa aspek)
INSERT INTO indikator_spbe (aspek_id, kode_indikator, nama_indikator, deskripsi, unit_kerja_id, bobot_nilai, urutan)
SELECT 
    a.id,
    i.kode,
    i.nama,
    i.deskripsi,
    uk.id,
    i.bobot,
    i.urutan
FROM aspek_spbe a
CROSS JOIN (VALUES
    -- Indikator untuk Kebijakan Internal Arsitektur SPBE
    ('IND-1.1', 'Arsitektur SPBE Instansi Pemerintah', 'Keberadaan dan kualitas dokumen Arsitektur SPBE', 'DISKOMINFO', 5.00, 1),
    ('IND-1.2', 'Peta Rencana SPBE Instansi Pemerintah', 'Keberadaan dan kualitas dokumen Peta Rencana SPBE', 'DISKOMINFO', 5.00, 2),
    -- Indikator untuk Kelembagaan
    ('IND-3.1', 'Tim Koordinasi SPBE', 'Keberadaan dan efektivitas Tim Koordinasi SPBE', 'DISKOMINFO', 3.00, 3),
    ('IND-3.2', 'Koordinasi dan Kerjasama SPBE', 'Pelaksanaan koordinasi antar OPD dalam SPBE', 'BAPPEDA', 3.00, 4),
    -- Indikator untuk Layanan Publik
    ('IND-8.1', 'Layanan Publik Sektor 1', 'Implementasi layanan publik berbasis elektronik sektor 1', 'DISDIKBUD', 4.00, 5),
    ('IND-8.2', 'Layanan Publik Sektor 2', 'Implementasi layanan publik berbasis elektronik sektor 2', 'DINKES', 4.00, 6),
    ('IND-8.3', 'Layanan Administrasi Kependudukan', 'Layanan administrasi kependudukan berbasis elektronik', 'DISDUKCAPIL', 4.00, 7)
) AS i(kode, nama, deskripsi, unit_kode, bobot, urutan)
LEFT JOIN unit_kerja uk ON uk.kode_unit = i.unit_kode
WHERE 
    (a.kode_aspek = 'A1' AND i.kode IN ('IND-1.1', 'IND-1.2'))
    OR (a.kode_aspek = 'A3' AND i.kode IN ('IND-3.1', 'IND-3.2'))
    OR (a.kode_aspek = 'A8' AND i.kode IN ('IND-8.1', 'IND-8.2', 'IND-8.3'));

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_unit_kerja_updated_at BEFORE UPDATE ON unit_kerja
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indikator_updated_at BEFORE UPDATE ON indikator_spbe
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bukti_dukung_updated_at BEFORE UPDATE ON bukti_dukung
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create verifikasi_log entry when status changes
CREATE OR REPLACE FUNCTION log_verifikasi_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status_verifikasi IS DISTINCT FROM NEW.status_verifikasi THEN
        INSERT INTO verifikasi_log (
            bukti_dukung_id,
            verifikator_id,
            status_lama,
            status_baru,
            catatan
        ) VALUES (
            NEW.id,
            NEW.verified_by,
            OLD.status_verifikasi,
            NEW.status_verifikasi,
            COALESCE(NEW.catatan_verifikasi, 'Status diubah tanpa catatan')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_bukti_dukung_verifikasi AFTER UPDATE ON bukti_dukung
    FOR EACH ROW EXECUTE FUNCTION log_verifikasi_change();

-- =====================================================
-- SCHEMA SETUP COMPLETE
-- =====================================================

-- Instructions:
-- 1. Run this entire SQL script in your Supabase SQL Editor
-- 2. Create a Storage bucket named 'bukti_dukung_spbe' (public or private based on needs)
-- 3. Set up storage policies for the bucket
-- 4. Create test users via Supabase Auth Dashboard
-- 5. Insert user records in 'users' table matching auth.users.id

-- Storage Bucket Policy Example (run separately after creating bucket):
/*
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bukti_dukung_spbe');

-- Allow users to view files from their unit
CREATE POLICY "Allow unit access to files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bukti_dukung_spbe' AND
  (
    -- Verifikator and Super Admin can see all
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('verifikator', 'super_admin')
    )
    OR
    -- Operator can see files from their unit (path starts with unit_id)
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'operator_unit'
      AND storage.foldername(name)[1] = users.unit_kerja_id::text
    )
  )
);
*/
