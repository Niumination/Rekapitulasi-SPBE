'use client'

import { useState, useEffect } from 'react'
import { supabase, authHelpers } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle, LogOut, Home, FileCheck, Users, Building2, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile()
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadProfile()
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*, unit_kerja:unit_kerja_id(*)')
          .eq('id', user.id)
          .single()
        
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await authHelpers.signOut()
    setSession(null)
    setProfile(null)
    toast({
      title: "Berhasil Logout",
      description: "Anda telah keluar dari sistem."
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return <LoginPage onLogin={loadProfile} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-indigo-600">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistem SPBE</h1>
                <p className="text-sm text-gray-600">Pemerintah Kabupaten Aceh Tengah</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile.nama_lengkap}</p>
                <p className="text-xs text-gray-600">
                  {profile.role === 'super_admin' && 'Super Admin'}
                  {profile.role === 'verifikator' && 'Verifikator (Diskominfo)'}
                  {profile.role === 'operator_unit' && `Operator - ${profile.unit_kerja?.nama_unit || ''}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {profile.role === 'operator_unit' && <OperatorDashboard profile={profile} />}
        {profile.role === 'verifikator' && <VerifikatorDashboard profile={profile} />}
        {profile.role === 'super_admin' && <AdminDashboard profile={profile} />}
      </main>
    </div>
  )
}

// =====================================================
// LOGIN PAGE
// =====================================================

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await authHelpers.signIn(email, password)
      if (error) throw error

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di Sistem SPBE Aceh Tengah."
      })
      
      onLogin()
    } catch (error) {
      toast({
        title: "Login Gagal",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <FileCheck className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistem SPBE</CardTitle>
          <CardDescription>
            Pemerintah Kabupaten Aceh Tengah<br />
            Sistem Pengumpulan Bukti Dukung SPBE
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@acehtengahkab.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
        <div className="px-6 pb-6">
          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>Demo Credentials:</p>
            <p className="font-mono">operator@test.com / password123</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// =====================================================
// OPERATOR DASHBOARD
// =====================================================

function OperatorDashboard({ profile }) {
  const [stats, setStats] = useState(null)
  const [buktiList, setBuktiList] = useState([])
  const [indikatorList, setIndikatorList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session.access_token

      // Load stats
      const statsRes = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Load bukti dukung
      const buktiRes = await fetch('/api/bukti-dukung', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const buktiData = await buktiRes.json()
      setBuktiList(buktiData.data || [])

      // Load indikator for this unit
      const indikatorRes = await fetch(`/api/indikator-spbe?unit_kerja_id=${profile.unit_kerja_id}`)
      const indikatorData = await indikatorRes.json()
      setIndikatorList(indikatorData.data || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBukti = async (id) => {
    if (!confirm('Yakin ingin menghapus bukti dukung ini?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/bukti-dukung/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (!res.ok) throw new Error('Gagal menghapus')

      toast({
        title: "Berhasil",
        description: "Bukti dukung berhasil dihapus."
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Bukti"
          value={stats?.total || 0}
          icon={<FileText className="h-5 w-5" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={stats?.pending || 0}
          icon={<Clock className="h-5 w-5" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Diterima"
          value={stats?.diterima || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="bg-green-500"
        />
        <StatCard
          title="Ditolak"
          value={stats?.ditolak || 0}
          icon={<XCircle className="h-5 w-5" />}
          color="bg-red-500"
        />
      </div>

      {/* Upload Button */}
      <div className="flex justify-end">
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Upload className="h-5 w-5 mr-2" />
              Unggah Bukti Dukung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <UploadBuktiForm 
              profile={profile}
              indikatorList={indikatorList}
              onSuccess={() => {
                setUploadDialogOpen(false)
                loadData()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Bukti Dukung Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Bukti Dukung</CardTitle>
          <CardDescription>
            Unit Kerja: {profile.unit_kerja?.nama_unit}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {buktiList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada bukti dukung yang diunggah</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Nama File</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buktiList.map((bukti) => (
                    <TableRow key={bukti.id}>
                      <TableCell className="font-medium">
                        <div className="text-sm">
                          <div>{bukti.indikator?.kode_indikator}</div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {bukti.indikator?.nama_indikator}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{bukti.nama_file}</TableCell>
                      <TableCell className="max-w-xs truncate">{bukti.deskripsi}</TableCell>
                      <TableCell>
                        <StatusBadge status={bukti.status_verifikasi} />
                      </TableCell>
                      <TableCell>
                        {new Date(bukti.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">Detail</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <BuktiDetailView bukti={bukti} />
                            </DialogContent>
                          </Dialog>
                          {bukti.status_verifikasi === 'pending' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteBukti(bukti.id)}
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================================
// VERIFIKATOR DASHBOARD
// =====================================================

function VerifikatorDashboard({ profile }) {
  const [stats, setStats] = useState(null)
  const [buktiList, setBuktiList] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session.access_token

      // Load stats
      const statsRes = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Load bukti dukung with filter
      const url = filterStatus === 'all' 
        ? '/api/bukti-dukung'
        : `/api/bukti-dukung?status=${filterStatus}`
      
      const buktiRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const buktiData = await buktiRes.json()
      setBuktiList(buktiData.data || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Bukti"
          value={stats?.total || 0}
          icon={<FileText className="h-5 w-5" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={<Clock className="h-5 w-5" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Diterima"
          value={stats?.diterima || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="bg-green-500"
        />
        <StatCard
          title="Ditolak"
          value={stats?.ditolak || 0}
          icon={<XCircle className="h-5 w-5" />}
          color="bg-red-500"
        />
        <StatCard
          title="Total Unit Kerja"
          value={stats?.total_units || 0}
          icon={<Building2 className="h-5 w-5" />}
          color="bg-purple-500"
        />
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verifikasi Bukti Dukung</CardTitle>
              <CardDescription>Tinjau dan verifikasi bukti dukung dari seluruh OPD</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="diterima">Diterima</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="perlu_revisi">Perlu Revisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {buktiList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada bukti dukung</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Nama File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buktiList.map((bukti) => (
                    <TableRow key={bukti.id}>
                      <TableCell className="font-medium">
                        {bukti.unit_kerja?.nama_unit}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{bukti.indikator?.kode_indikator}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {bukti.indikator?.nama_indikator}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{bukti.nama_file}</TableCell>
                      <TableCell>
                        <StatusBadge status={bukti.status_verifikasi} />
                      </TableCell>
                      <TableCell>
                        {new Date(bukti.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">Verifikasi</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <VerifikasiForm bukti={bukti} onSuccess={loadData} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================

function AdminDashboard({ profile }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Super Admin Dashboard</CardTitle>
          <CardDescription>Kelola sistem SPBE</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="verifikator">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="verifikator">Mode Verifikator</TabsTrigger>
              <TabsTrigger value="management">Manajemen Sistem</TabsTrigger>
            </TabsList>
            <TabsContent value="verifikator">
              <VerifikatorDashboard profile={profile} />
            </TabsContent>
            <TabsContent value="management">
              <div className="space-y-4 py-4">
                <div className="text-center text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Manajemen pengguna, unit kerja, dan struktur SPBE</p>
                  <p className="text-sm mt-2">Fitur ini dapat dikembangkan lebih lanjut</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================================
// UPLOAD BUKTI FORM
// =====================================================

function UploadBuktiForm({ profile, indikatorList, onSuccess }) {
  const [indikatorId, setIndikatorId] = useState('')
  const [file, setFile] = useState(null)
  const [deskripsi, setDeskripsi] = useState('')
  const [tahunData, setTahunData] = useState(new Date().getFullYear())
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !indikatorId) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan.",
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session.access_token

      // Upload file first
      const formData = new FormData()
      formData.append('file', file)
      formData.append('unit_kerja_id', profile.unit_kerja_id)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!uploadRes.ok) throw new Error('Gagal mengunggah file')

      const uploadData = await uploadRes.json()

      // Create bukti dukung record
      const buktiRes = await fetch('/api/bukti-dukung', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          indikator_id: indikatorId,
          nama_file: uploadData.file_name,
          file_path: uploadData.file_path,
          file_size: uploadData.file_size,
          file_type: uploadData.file_type,
          deskripsi,
          tahun_data: tahunData
        })
      })

      if (!buktiRes.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: "Berhasil",
        description: "Bukti dukung berhasil diunggah."
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Unggah Bukti Dukung</DialogTitle>
        <DialogDescription>
          Unggah dokumen bukti dukung untuk indikator SPBE
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Indikator SPBE *</Label>
          <Select value={indikatorId} onValueChange={setIndikatorId} required>
            <SelectTrigger>
              <SelectValue placeholder="Pilih indikator" />
            </SelectTrigger>
            <SelectContent>
              {indikatorList.map((ind) => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.kode_indikator} - {ind.nama_indikator?.substring(0, 60)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>File Bukti Dukung *</Label>
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            required
          />
          <p className="text-xs text-gray-500">
            Format: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Maks 10MB)
          </p>
        </div>
        <div className="space-y-2">
          <Label>Tahun Data</Label>
          <Input
            type="number"
            value={tahunData}
            onChange={(e) => setTahunData(e.target.value)}
            min="2020"
            max="2030"
          />
        </div>
        <div className="space-y-2">
          <Label>Deskripsi</Label>
          <Textarea
            placeholder="Jelaskan mengenai bukti dukung ini..."
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Mengunggah...' : 'Unggah'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// =====================================================
// VERIFIKASI FORM
// =====================================================

function VerifikasiForm({ bukti, onSuccess }) {
  const [status, setStatus] = useState(bukti.status_verifikasi)
  const [catatan, setCatatan] = useState(bukti.catatan_verifikasi || '')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!catatan.trim()) {
      toast({
        title: "Error",
        description: "Catatan verifikasi wajib diisi.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/verifikasi/${bukti.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          status_verifikasi: status,
          catatan_verifikasi: catatan
        })
      })

      if (!res.ok) throw new Error('Gagal menyimpan verifikasi')

      toast({
        title: "Berhasil",
        description: "Verifikasi berhasil disimpan."
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Verifikasi Bukti Dukung</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <BuktiDetailView bukti={bukti} />
        
        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <Label>Status Verifikasi *</Label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="diterima">Diterima</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="perlu_revisi">Perlu Revisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Catatan Verifikasi *</Label>
            <Textarea
              placeholder="Berikan catatan mengenai hasil verifikasi..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// =====================================================
// BUKTI DETAIL VIEW
// =====================================================

function BuktiDetailView({ bukti }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">Detail Bukti Dukung</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Unit Kerja:</span>
            <span className="col-span-2 font-medium">{bukti.unit_kerja?.nama_unit}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Indikator:</span>
            <span className="col-span-2 font-medium">{bukti.indikator?.kode_indikator}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Nama Indikator:</span>
            <span className="col-span-2">{bukti.indikator?.nama_indikator}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Nama File:</span>
            <span className="col-span-2 font-medium">{bukti.nama_file}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Ukuran File:</span>
            <span className="col-span-2">{(bukti.file_size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Tahun Data:</span>
            <span className="col-span-2">{bukti.tahun_data}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Deskripsi:</span>
            <span className="col-span-2">{bukti.deskripsi || '-'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Status:</span>
            <span className="col-span-2">
              <StatusBadge status={bukti.status_verifikasi} />
            </span>
          </div>
          {bukti.catatan_verifikasi && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-600">Catatan Verifikasi:</span>
              <span className="col-span-2">{bukti.catatan_verifikasi}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Diunggah oleh:</span>
            <span className="col-span-2">{bukti.uploader?.nama_lengkap}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-600">Tanggal Upload:</span>
            <span className="col-span-2">
              {new Date(bukti.created_at).toLocaleString('id-ID')}
            </span>
          </div>
          {bukti.verified_by && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-600">Diverifikasi oleh:</span>
                <span className="col-span-2">{bukti.verifikator?.nama_lengkap}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-600">Tanggal Verifikasi:</span>
                <span className="col-span-2">
                  {new Date(bukti.verified_at).toLocaleString('id-ID')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

function StatCard({ title, value, icon, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }) {
  const variants = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    diterima: { label: 'Diterima', className: 'bg-green-100 text-green-800' },
    ditolak: { label: 'Ditolak', className: 'bg-red-100 text-red-800' },
    perlu_revisi: { label: 'Perlu Revisi', className: 'bg-orange-100 text-orange-800' },
  }

  const variant = variants[status] || variants.pending

  return (
    <Badge className={variant.className} variant="secondary">
      {variant.label}
    </Badge>
  )
}
