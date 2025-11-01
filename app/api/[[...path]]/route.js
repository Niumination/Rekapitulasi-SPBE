import { supabase, authHelpers, storageHelpers } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Helper to get user from session
async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) return null

  // Get user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('*, unit_kerja:unit_kerja_id(*)')
    .eq('id', user.id)
    .single()

  return profile
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// =====================================================
// AUTH ENDPOINTS
// =====================================================

// POST /api/auth/login
async function handleLogin(request) {
  try {
    const { email, password } = await request.json()
    
    const { data, error } = await authHelpers.signIn(email, password)
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*, unit_kerja:unit_kerja_id(*)')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json(
      { 
        user: data.user,
        session: data.session,
        profile 
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/auth/register
async function handleRegister(request) {
  try {
    const { email, password, nama_lengkap, role, unit_kerja_id } = await request.json()
    
    // Sign up with Supabase Auth
    const { data, error } = await authHelpers.signUp(email, password, {
      nama_lengkap,
      role,
      unit_kerja_id
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        nama_lengkap,
        role: role || 'operator_unit',
        unit_kerja_id: unit_kerja_id || null
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { user: data.user, profile },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET /api/auth/profile
async function handleGetProfile(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    return NextResponse.json({ profile: user }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/auth/logout
async function handleLogout(request) {
  try {
    const { error } = await authHelpers.signOut()
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// UNIT KERJA ENDPOINTS
// =====================================================

// GET /api/unit-kerja - Get all unit kerja
async function handleGetUnitKerja(request) {
  try {
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('*')
      .order('nama_unit')

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// DOMAIN & ASPEK SPBE ENDPOINTS
// =====================================================

// GET /api/domain-spbe
async function handleGetDomain(request) {
  try {
    const { data, error } = await supabase
      .from('domain_spbe')
      .select('*')
      .order('urutan')

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET /api/aspek-spbe
async function handleGetAspek(request) {
  try {
    const { data, error } = await supabase
      .from('aspek_spbe')
      .select('*, domain:domain_id(*)')
      .order('urutan')

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// INDIKATOR SPBE ENDPOINTS
// =====================================================

// GET /api/indikator-spbe
async function handleGetIndikator(request) {
  try {
    const url = new URL(request.url)
    const unit_kerja_id = url.searchParams.get('unit_kerja_id')

    let query = supabase
      .from('indikator_spbe')
      .select(`
        *,
        aspek:aspek_id(
          *,
          domain:domain_id(*)
        ),
        unit_kerja:unit_kerja_id(*)
      `)
      .order('urutan')

    if (unit_kerja_id) {
      query = query.eq('unit_kerja_id', unit_kerja_id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// BUKTI DUKUNG ENDPOINTS
// =====================================================

// GET /api/bukti-dukung - Get all bukti (filtered by RLS)
async function handleGetBuktiDukung(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Create a client with the user's token for RLS to work
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const unit_kerja_id = url.searchParams.get('unit_kerja_id')
    const indikator_id = url.searchParams.get('indikator_id')

    let query = userSupabase
      .from('bukti_dukung')
      .select(`
        *,
        indikator:indikator_id(
          *,
          aspek:aspek_id(
            *,
            domain:domain_id(*)
          )
        ),
        unit_kerja:unit_kerja_id(*),
        uploader:uploaded_by(
          nama_lengkap,
          email
        ),
        verifikator:verified_by(
          nama_lengkap,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status_verifikasi', status)
    if (unit_kerja_id) query = query.eq('unit_kerja_id', unit_kerja_id)
    if (indikator_id) query = query.eq('indikator_id', indikator_id)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

import { createClient } from '@supabase/supabase-js'

// POST /api/bukti-dukung - Create new bukti dukung
async function handleCreateBuktiDukung(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { indikator_id, nama_file, file_path, file_size, file_type, deskripsi, tahun_data } = body

    const { data, error } = await supabase
      .from('bukti_dukung')
      .insert({
        indikator_id,
        unit_kerja_id: user.unit_kerja_id,
        uploaded_by: user.id,
        nama_file,
        file_path,
        file_size,
        file_type,
        deskripsi,
        tahun_data,
        status_verifikasi: 'pending'
      })
      .select(`
        *,
        indikator:indikator_id(*),
        unit_kerja:unit_kerja_id(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PUT /api/bukti-dukung/:id - Update bukti dukung
async function handleUpdateBuktiDukung(request, id) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { deskripsi, tahun_data, nama_file, file_path, file_size, file_type } = body

    const updateData = {}
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (tahun_data !== undefined) updateData.tahun_data = tahun_data
    if (nama_file !== undefined) updateData.nama_file = nama_file
    if (file_path !== undefined) updateData.file_path = file_path
    if (file_size !== undefined) updateData.file_size = file_size
    if (file_type !== undefined) updateData.file_type = file_type

    const { data, error } = await supabase
      .from('bukti_dukung')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE /api/bukti-dukung/:id
async function handleDeleteBuktiDukung(request, id) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get bukti dukung to delete file from storage
    const { data: bukti } = await supabase
      .from('bukti_dukung')
      .select('file_path')
      .eq('id', id)
      .single()

    // Delete from database
    const { error } = await supabase
      .from('bukti_dukung')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Delete file from storage if exists
    if (bukti?.file_path) {
      await storageHelpers.deleteFile('bukti_dukung_spbe', bukti.file_path)
    }

    return NextResponse.json(
      { message: 'Bukti dukung deleted successfully' },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// VERIFIKASI ENDPOINTS
// =====================================================

// PUT /api/verifikasi/:id - Verify bukti dukung
async function handleVerifikasi(request, id) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user is verifikator or super_admin
    if (!['verifikator', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only verifikator can verify' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { status_verifikasi, catatan_verifikasi } = body

    if (!['pending', 'diterima', 'ditolak', 'perlu_revisi'].includes(status_verifikasi)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { data, error } = await supabase
      .from('bukti_dukung')
      .update({
        status_verifikasi,
        catatan_verifikasi,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        indikator:indikator_id(*),
        unit_kerja:unit_kerja_id(*),
        verifikator:verified_by(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET /api/verifikasi-log/:bukti_id
async function handleGetVerifikasiLog(request, bukti_id) {
  try {
    const { data, error } = await supabase
      .from('verifikasi_log')
      .select(`
        *,
        verifikator:verifikator_id(
          nama_lengkap,
          email
        )
      `)
      .eq('bukti_dukung_id', bukti_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// FILE UPLOAD ENDPOINT
// =====================================================

// POST /api/upload
async function handleUpload(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const unit_kerja_id = formData.get('unit_kerja_id')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Create file path: unit_kerja_id/timestamp_filename
    const timestamp = Date.now()
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${unit_kerja_id}/${timestamp}_${fileName}`

    const { data, error } = await storageHelpers.uploadFile(
      'bukti_dukung_spbe',
      filePath,
      file
    )

    if (error) throw error

    return NextResponse.json(
      {
        file_path: filePath,
        file_name: fileName,
        file_size: file.size,
        file_type: file.type
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// DASHBOARD STATS ENDPOINT
// =====================================================

// GET /api/dashboard/stats
async function handleDashboardStats(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    let stats = {}

    if (user.role === 'operator_unit') {
      // Stats for operator's unit only
      const { count: total } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('unit_kerja_id', user.unit_kerja_id)

      const { count: pending } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('unit_kerja_id', user.unit_kerja_id)
        .eq('status_verifikasi', 'pending')

      const { count: diterima } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('unit_kerja_id', user.unit_kerja_id)
        .eq('status_verifikasi', 'diterima')

      const { count: ditolak } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('unit_kerja_id', user.unit_kerja_id)
        .eq('status_verifikasi', 'ditolak')

      stats = { total, pending, diterima, ditolak }
    } else {
      // Stats for all units (verifikator/admin)
      const { count: total } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })

      const { count: pending } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('status_verifikasi', 'pending')

      const { count: diterima } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('status_verifikasi', 'diterima')

      const { count: ditolak } = await supabase
        .from('bukti_dukung')
        .select('*', { count: 'exact', head: true })
        .eq('status_verifikasi', 'ditolak')

      const { count: total_units } = await supabase
        .from('unit_kerja')
        .select('*', { count: 'exact', head: true })

      stats = { total, pending, diterima, ditolak, total_units }
    }

    return NextResponse.json({ stats }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// =====================================================
// MAIN ROUTER
// =====================================================

export async function GET(request, { params }) {
  const path = params.path ? params.path.join('/') : ''

  // Auth routes
  if (path === 'auth/profile') return handleGetProfile(request)
  
  // Unit Kerja routes
  if (path === 'unit-kerja') return handleGetUnitKerja(request)
  
  // Domain & Aspek routes
  if (path === 'domain-spbe') return handleGetDomain(request)
  if (path === 'aspek-spbe') return handleGetAspek(request)
  
  // Indikator routes
  if (path === 'indikator-spbe') return handleGetIndikator(request)
  
  // Bukti Dukung routes
  if (path === 'bukti-dukung') return handleGetBuktiDukung(request)
  
  // Verifikasi Log routes
  if (path.startsWith('verifikasi-log/')) {
    const bukti_id = path.split('/')[1]
    return handleGetVerifikasiLog(request, bukti_id)
  }
  
  // Dashboard routes
  if (path === 'dashboard/stats') return handleDashboardStats(request)

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: corsHeaders }
  )
}

export async function POST(request, { params }) {
  const path = params.path ? params.path.join('/') : ''

  // Auth routes
  if (path === 'auth/login') return handleLogin(request)
  if (path === 'auth/register') return handleRegister(request)
  if (path === 'auth/logout') return handleLogout(request)
  
  // Bukti Dukung routes
  if (path === 'bukti-dukung') return handleCreateBuktiDukung(request)
  
  // Upload route
  if (path === 'upload') return handleUpload(request)

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: corsHeaders }
  )
}

export async function PUT(request, { params }) {
  const path = params.path ? params.path.join('/') : ''

  // Bukti Dukung routes
  if (path.startsWith('bukti-dukung/')) {
    const id = path.split('/')[1]
    return handleUpdateBuktiDukung(request, id)
  }
  
  // Verifikasi routes
  if (path.startsWith('verifikasi/')) {
    const id = path.split('/')[1]
    return handleVerifikasi(request, id)
  }

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: corsHeaders }
  )
}

export async function DELETE(request, { params }) {
  const path = params.path ? params.path.join('/') : ''

  // Bukti Dukung routes
  if (path.startsWith('bukti-dukung/')) {
    const id = path.split('/')[1]
    return handleDeleteBuktiDukung(request, id)
  }

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: corsHeaders }
  )
}
