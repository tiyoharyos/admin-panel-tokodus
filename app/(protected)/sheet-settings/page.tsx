// app/(protected)/sheet-settings/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

export default function SheetSettingsPage() {
  const router = useRouter()
  const [sheetSettings, setSheetSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  
  // State untuk Substance Builder (6 components: gramasi + jenis untuk 3 layer)
  const [substanceBuilder, setSubstanceBuilder] = useState({
    layer1_gramasi: '125',
    layer1_jenis: 'M',
    layer2_gramasi: '125',
    layer2_jenis: 'M',
    layer3_gramasi: '125',
    layer3_jenis: 'M'
  })
  
  // State untuk modal Add - DIPERBARUI dengan flute selection
  const [addFormData, setAddFormData] = useState({
    substance: '',
    bFlute: 0,
    cFlute: 0,
    cbFlute: 0,
    eFlute: 0,
    selectedBFlute: '', // ID flute yang dipilih untuk B
    selectedCFlute: '', // ID flute yang dipilih untuk C
    selectedCBFlute: '', // ID flute yang dipilih untuk CB
    selectedEFlute: '', // ID flute yang dipilih untuk E
    bFluteName: 'B-FLUTE',
    cFluteName: 'C-FLUTE',
    cbFluteName: 'CB-FLUTE',
    eFluteName: 'E-FLUTE',
    ukuran: '',
    hargaPerlembar: 0,
    status: 'active'
  })

  // State untuk auto-generate ukuran dari Excel formula
  const [excelData, setExcelData] = useState({
    type: 'Mailer Earlock',
    A3: 10, // Panjang produk (cm)
    B3: 5,  // Lebar produk (cm)
    C3: 3   // Tinggi produk (cm)
  })

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Stats untuk dashboard
  const [stats, setStats] = useState({
    totalSettings: 0,
    activeSettings: 0,
    eFluteCount: 0,
    bFluteCount: 0,
    cFluteCount: 0,
    cbFluteCount: 0
  })

  // ===== STATE UNTUK FLUTES MANAGEMENT =====
  const [flutes, setFlutes] = useState([])
  const [fluteLoading, setFluteLoading] = useState(false)

  // Hardcode flutes data jika API belum lengkap
  const defaultFlutes = [
    { id: 'b-flute', flute_code: 'B', flute_name: 'B-FLUTE', flute_type: 'single', flute_order: 1 },
    { id: 'c-flute', flute_code: 'C', flute_name: 'C-FLUTE', flute_type: 'single', flute_order: 2 },
    { id: 'cb-flute', flute_code: 'CB', flute_name: 'CB-FLUTE', flute_type: 'double', flute_order: 3 },
    { id: 'e-flute', flute_code: 'E', flute_name: 'E-FLUTE', flute_type: 'micro', flute_order: 4 }
  ]

  // ===== FUNGSI PERHITUNGAN EXCEL =====
  const calculatePanjang = (type, A3, B3, C3) => {
    const panjangMm = {
      "Mailer Earlock": ((C3 * 4 * 10) + (A3 * 10) + (0.5 * 10) + (0.5 * 4 * 10) + 20),
      "Mailer Frontlock Type 1": ((C3 * 2 * 10) + (A3 * 10) + (0.5 * 10) + 20),
      "Mailer Frontlock Type 2": ((C3 * 2 * 10) + (A3 * 10) + (0.5 * 10) + 20),
      "Sepatu Type 1": ((C3 * 2 * 10) + (A3 * 10) + (0.5 * 10) + 20),
      "Sepatu Type 2": ((C3 * 2 * 10) + (A3 * 10) + (0.5 * 10) + 20),
      "Sepatu Type 3": ((C3 * 2 * 10) + (A3 * 10) + (3 * 2 * 10) + (0.5 * 2 * 10) + 20),
      "Sepatu Type 4": ((C3 * 2 * 10) + (A3 * 10) + (0.5 * 10) + 20),
      "Sepatu Tutup Lepas Type 1": ((C3 * 2 * 10) + (A3 * 10) + (0.5 * 10) + 20),
      "Sepatu Tutup Lepas Type 2": ((C3 * 2 * 10) + (A3 * 10) + (3 * 2 * 10) + (0.5 * 2 * 10) + 20),
      "Top Bottom": ((B3 * 2 * 10) + (C3 * 10) + (3.5 * 2 * 10) + 20)
    }
    
    return panjangMm[type] || 0
  }

  const calculateLebar = (type, A3, B3, C3) => {
    const lebarMm = {
      "Mailer Earlock": ((C3 * 3 * 10) + (B3 * 2 * 10) + (0.5 * 10) + (2 * 10)),
      "Mailer Frontlock Type 1": ((C3 * 3 * 10) + (B3 * 2 * 10) + (1 * 10) + ((C3 * 0.6) * 10) + (0.5 * 10) + (2 * 10)),
      "Mailer Frontlock Type 2": ((C3 * 3 * 10) + (B3 * 2 * 10) + (1 * 10) + ((C3 * 0.6) * 10) + (0.5 * 10) + (2 * 10)),
      "Sepatu Type 1": ((C3 * 2 * 10) + (B3 * 2 * 10) + ((C3 * 0.4) * 2 * 10) + (1 * 10) + (0.5 * 10) + (2 * 10)),
      "Sepatu Type 2": ((C3 * 3 * 10) + (B3 * 2 * 10) + (5.5 * 10) + (0.5 * 10) + (2 * 10)),
      "Sepatu Type 3": ((C3 * 2 * 10) + (B3 * 2 * 10) + ((C3 * 0.4) * 2 * 10) + (1 * 10) + (0.5 * 10) + (2 * 10)),
      "Sepatu Type 4": ((C3 * 2 * 10) + (B3 * 2 * 10) + ((C3 * 0.4) * 10) + (0.5 * 10) + (2 * 10)),
      "Sepatu Tutup Lepas Type 1": ((C3 * 2 * 10) + (B3 * 2 * 10) + ((C3 * 0.4) * 2 * 10) + (2 * 10) + (1 * 10) + (2 * 10)),
      "Sepatu Tutup Lepas Type 2": ((C3 * 2 * 10) + (B3 * 2 * 10) + ((C3 * 0.4) * 2 * 10) + (2 * 10) + (1 * 10) + (2 * 10)),
      "Top Bottom": (((A3 + B3) * 2 * 10) + (3 * 10) + (2 * 10))
    }
    
    return lebarMm[type] || 0
  }

  const generateUkuranFromExcel = () => {
    const { type, A3, B3, C3 } = excelData
    const panjang = Math.round(calculatePanjang(type, A3, B3, C3))
    const lebar = Math.round(calculateLebar(type, A3, B3, C3))
    
    return `${panjang}x${lebar}`
  }

  const handleGenerateUkuran = () => {
    const ukuran = generateUkuranFromExcel()
    setAddFormData(prev => ({
      ...prev,
      ukuran: ukuran
    }))
    
    SweetAlert.success('Berhasil!', `Ukuran berhasil digenerate: ${ukuran} mm`)
  }

  // ===== SUBSTANCE BUILDER FUNCTIONS =====
  const buildSubstance = (builder) => {
    return `${builder.layer1_gramasi}${builder.layer1_jenis}/${builder.layer2_gramasi}${builder.layer2_jenis}/${builder.layer3_gramasi}${builder.layer3_jenis}`
  }

  const parseSubstance = (substance) => {
    const parts = substance.split('/')
    
    if (parts.length !== 3) {
      return {
        layer1_gramasi: '125',
        layer1_jenis: 'M',
        layer2_gramasi: '125',
        layer2_jenis: 'M',
        layer3_gramasi: '125',
        layer3_jenis: 'M'
      }
    }
    
    const parseLayer = (layer) => {
      const match = layer.match(/^(\d{2,3})([MKW])$/)
      if (match) {
        return { gramasi: match[1], jenis: match[2] }
      }
      return { gramasi: '125', jenis: 'M' }
    }
    
    const layer1 = parseLayer(parts[0])
    const layer2 = parseLayer(parts[1])
    const layer3 = parseLayer(parts[2])
    
    return {
      layer1_gramasi: layer1.gramasi,
      layer1_jenis: layer1.jenis,
      layer2_gramasi: layer2.gramasi,
      layer2_jenis: layer2.jenis,
      layer3_gramasi: layer3.gramasi,
      layer3_jenis: layer3.jenis
    }
  }

  // Update substance when builder changes
  useEffect(() => {
    const newSubstance = buildSubstance(substanceBuilder)
    setAddFormData(prev => ({ ...prev, substance: newSubstance }))
  }, [substanceBuilder])

  // ===== FETCH DATA SHEET SUBSTANCES =====
  const fetchSheetSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Sheet/sheetSubstances', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📡 API Response:', response.data)
      
      if (response.data) {
        if (response.data.status === 200 && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const processedSettings = response.data.data.map(item => ({
            id: item.id_ss?.toString() || '',
            substance: item.substance || '',
            bFlute: parseFloat(item.b_flute) || 0,
            cFlute: parseFloat(item.c_flute) || 0,
            cbFlute: parseFloat(item.cb_flute) || 0,
            eFlute: parseFloat(item.e_flute) || 0,
            ukuran: item.ukuran || '',
            hargaPerlembar: parseFloat(item.harga_perlembar) || 0,
            status: item.status === '1' || item.status === 1 ? 'active' : 'inactive',
            status_raw: item.status?.toString(),
            ukuranPanjang: item.ukuran ? parseInt(item.ukuran.split('x')[0]) || 0 : 0,
            ukuranLebar: item.ukuran ? parseInt(item.ukuran.split('x')[1]) || 0 : 0,
            category: item.category || 'Sheet K200',
            createdAt: item.created_at || new Date().toISOString().split('T')[0],
            updatedAt: item.updated_at || new Date().toISOString().split('T')[0],
            layer1_gramasi: item.layer_1 || '',
            layer1_jenis: item.layer_1_type || '',
            layer2_gramasi: item.layer_2 || '',
            layer2_jenis: item.layer_2_type || '',
            layer3_gramasi: item.layer_3 || '',
            layer3_jenis: item.layer_3_type || '',
            bFluteName: item.b_flute_name || 'B-FLUTE',
            cFluteName: item.c_flute_name || 'C-FLUTE',
            cbFluteName: item.cb_flute_name || 'CB-FLUTE',
            eFluteName: item.e_flute_name || 'E-FLUTE'
          }))
          
          setSheetSettings(processedSettings)
          
          // Hitung stats
          const totalSettings = processedSettings.length
          const activeSettings = processedSettings.filter(s => s.status === 'active').length
          const eFluteCount = processedSettings.filter(s => s.eFlute > 0).length
          const bFluteCount = processedSettings.filter(s => s.bFlute > 0).length
          const cFluteCount = processedSettings.filter(s => s.cFlute > 0).length
          const cbFluteCount = processedSettings.filter(s => s.cbFlute > 0).length
          
          setStats({
            totalSettings,
            activeSettings,
            eFluteCount,
            bFluteCount,
            cFluteCount,
            cbFluteCount
          })
        } else if (response.data.status === 404 || (Array.isArray(response.data.data) && response.data.data.length === 0)) {
          console.log('ℹ️ Database masih kosong')
          setSheetSettings([])
          setStats({
            totalSettings: 0,
            activeSettings: 0,
            eFluteCount: 0,
            bFluteCount: 0,
            cFluteCount: 0,
            cbFluteCount: 0
          })
        } else {
          console.warn('⚠️ Response format:', response.data)
          setError('Format response tidak sesuai')
        }
      } else {
        setError('Response kosong dari server')
      }
      
    } catch (err) {
      console.error('❌ Error fetching sheet settings:', err)
      
      if (err.response?.status === 404) {
        console.log('ℹ️ 404 - Database kosong')
        setSheetSettings([])
        setStats({
          totalSettings: 0,
          activeSettings: 0,
          eFluteCount: 0,
          bFluteCount: 0,
          cFluteCount: 0,
          cbFluteCount: 0
        })
      } else {
        setError(err.response?.data?.message || err.message || 'Tidak bisa connect ke server')
      }
    } finally {
      setLoading(false)
    }
  }

  // ===== FETCH DATA FLUTES =====
  const fetchFlutes = async () => {
    try {
      setFluteLoading(true)
      
      // Coba ambil dari API dulu
      const response = await axios.get('/Admin/Flutes/Flutes', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📡 Flutes API Response:', response.data)
      
      if (response.data && response.data.status === 200 && Array.isArray(response.data.data)) {
        const processedFlutes = response.data.data.map(item => ({
          id: item.id_flute?.toString() || '',
          flute_code: item.flute_code || '',
          flute_name: item.flute_name || '',
          flute_description: item.flute_description || '',
          flute_type: item.flute_type || 'single',
          flute_order: parseInt(item.flute_order) || 1,
          status: item.status === '1' || item.status === 1 ? 'active' : 'inactive',
          created_at: item.created_at || new Date().toISOString().split('T')[0],
          updated_at: item.updated_at || new Date().toISOString().split('T')[0]
        }))
        
        // Sort by flute_order
        processedFlutes.sort((a, b) => a.flute_order - b.flute_order)
        setFlutes(processedFlutes)
      } else {
        // Jika API belum ada atau kosong, gunakan default flutes
        console.log('ℹ️ Gunakan default flutes data')
        setFlutes(defaultFlutes)
      }
      
    } catch (err) {
      console.error('❌ Error fetching flutes:', err)
      // Jika error, gunakan default flutes
      setFlutes(defaultFlutes)
    } finally {
      setFluteLoading(false)
    }
  }

  useEffect(() => {
    fetchSheetSettings()
    fetchFlutes()
  }, [])

  // ===== FUNGSI UNTUK FLUTES =====
  const getFlutesByType = (type) => {
    return flutes.filter(flute => {
      if (type === 'single') return ['B', 'C'].includes(flute.flute_code)
      if (type === 'double') return flute.flute_code === 'CB'
      if (type === 'micro') return flute.flute_code === 'E'
      return false
    })
  }

  // ===== RESET STATE FUNCTIONS =====
  const resetEditState = () => {
    setEditingItem(null)
  }

  const resetAddState = () => {
    setSubstanceBuilder({
      layer1_gramasi: '125',
      layer1_jenis: 'M',
      layer2_gramasi: '125',
      layer2_jenis: 'M',
      layer3_gramasi: '125',
      layer3_jenis: 'M'
    })
    setAddFormData({
      substance: '125M/125M/125M',
      bFlute: 0,
      cFlute: 0,
      cbFlute: 0,
      eFlute: 0,
      selectedBFlute: flutes.find(f => f.flute_code === 'B')?.id || '',
      selectedCFlute: flutes.find(f => f.flute_code === 'C')?.id || '',
      selectedCBFlute: flutes.find(f => f.flute_code === 'CB')?.id || '',
      selectedEFlute: flutes.find(f => f.flute_code === 'E')?.id || '',
      bFluteName: 'B-FLUTE',
      cFluteName: 'C-FLUTE',
      cbFluteName: 'CB-FLUTE',
      eFluteName: 'E-FLUTE',
      ukuran: '',
      hargaPerlembar: 0,
      status: 'active'
    })
    setExcelData({
      type: 'Mailer Earlock',
      A3: 10,
      B3: 5,
      C3: 3
    })
  }

  // ===== HANDLERS SHEET SUBSTANCES =====
  const handleAddClick = () => {
    // Set default selected flutes
    const defaultBFlute = flutes.find(f => f.flute_code === 'B')
    const defaultCFlute = flutes.find(f => f.flute_code === 'C')
    const defaultCBFlute = flutes.find(f => f.flute_code === 'CB')
    const defaultEFlute = flutes.find(f => f.flute_code === 'E')
    
    setAddFormData({
      substance: '125M/125M/125M',
      bFlute: 0,
      cFlute: 0,
      cbFlute: 0,
      eFlute: 0,
      selectedBFlute: defaultBFlute?.id || '',
      selectedCFlute: defaultCFlute?.id || '',
      selectedCBFlute: defaultCBFlute?.id || '',
      selectedEFlute: defaultEFlute?.id || '',
      bFluteName: defaultBFlute?.flute_name || 'B-FLUTE',
      cFluteName: defaultCFlute?.flute_name || 'C-FLUTE',
      cbFluteName: defaultCBFlute?.flute_name || 'CB-FLUTE',
      eFluteName: defaultEFlute?.flute_name || 'E-FLUTE',
      ukuran: '',
      hargaPerlembar: 0,
      status: 'active'
    })
    setShowAddModal(true)
  }

  const validateGramasi = (value, layerName) => {
    const gramasiRegex = /^\d{2,3}$/
    
    if (!gramasiRegex.test(value)) {
      SweetAlert.error('Validasi Error', `Gramasi ${layerName} harus 2-3 digit angka (contoh: 125, 150)`)
      return false
    }
    
    const numValue = parseInt(value)
    if (numValue < 10 || numValue > 999) {
      SweetAlert.error('Validasi Error', `Gramasi ${layerName} harus antara 10-999 gsm`)
      return false
    }
    
    return true
  }

  const handleAddSave = async () => {
    // Validasi gramasi
    if (!validateGramasi(substanceBuilder.layer1_gramasi, 'Layer 1')) return
    if (!validateGramasi(substanceBuilder.layer2_gramasi, 'Layer 2')) return
    if (!validateGramasi(substanceBuilder.layer3_gramasi, 'Layer 3')) return
    
    // Validasi lainnya
    if (!addFormData.ukuran.trim()) {
      SweetAlert.error('Validasi Error', 'Ukuran tidak boleh kosong')
      return
    }
    
    const ukuranRegex = /^\d{2,4}x\d{2,4}$/
    if (!ukuranRegex.test(addFormData.ukuran)) {
      SweetAlert.error('Validasi Error', 'Format ukuran tidak valid. Gunakan format: 650x1050 (panjang x lebar dalam mm)')
      return
    }
    
    // Validasi pilihan flute
    if (!addFormData.selectedBFlute) {
      SweetAlert.error('Validasi Error', 'Silakan pilih B-FLUTE')
      return
    }
    if (!addFormData.selectedCFlute) {
      SweetAlert.error('Validasi Error', 'Silakan pilih C-FLUTE')
      return
    }
    if (!addFormData.selectedCBFlute) {
      SweetAlert.error('Validasi Error', 'Silakan pilih CB-FLUTE')
      return
    }
    if (!addFormData.selectedEFlute) {
      SweetAlert.error('Validasi Error', 'Silakan pilih E-FLUTE')
      return
    }
    
    // Validasi harga
    if (!addFormData.eFlute || parseFloat(addFormData.eFlute) <= 0) {
      SweetAlert.error('Validasi Error', 'Harga E-FLUTE harus diisi dan lebih dari 0')
      return
    }
    
    try {
      setIsPosting(true)
      
      // Cari data flute berdasarkan ID yang dipilih
      const bFluteData = flutes.find(f => f.id === addFormData.selectedBFlute)
      const cFluteData = flutes.find(f => f.id === addFormData.selectedCFlute)
      const cbFluteData = flutes.find(f => f.id === addFormData.selectedCBFlute)
      const eFluteData = flutes.find(f => f.id === addFormData.selectedEFlute)
      
      // Format data sesuai dengan backend PHP
      const postData = new URLSearchParams({
        layer_1: substanceBuilder.layer1_gramasi,
        layer_1_type: substanceBuilder.layer1_jenis,
        layer_2: substanceBuilder.layer2_gramasi,
        layer_2_type: substanceBuilder.layer2_jenis,
        layer_3: substanceBuilder.layer3_gramasi,
        layer_3_type: substanceBuilder.layer3_jenis,
        b_flute: addFormData.bFlute || 0,
        c_flute: addFormData.cFlute || 0,
        cb_flute: addFormData.cbFlute || 0,
        e_flute: addFormData.eFlute || 0,
        b_flute_id: addFormData.selectedBFlute || '',
        c_flute_id: addFormData.selectedCFlute || '',
        cb_flute_id: addFormData.selectedCBFlute || '',
        e_flute_id: addFormData.selectedEFlute || '',
        b_flute_name: bFluteData?.flute_name || 'B-FLUTE',
        c_flute_name: cFluteData?.flute_name || 'C-FLUTE',
        cb_flute_name: cbFluteData?.flute_name || 'CB-FLUTE',
        e_flute_name: eFluteData?.flute_name || 'E-FLUTE',
        ukuran: addFormData.ukuran.trim(),
        harga_perlembar: addFormData.hargaPerlembar || 0,
        status: addFormData.status === 'active' ? '1' : '0',
        category: 'Sheet K200'
      }).toString()
      
      console.log('📤 Sending POST data:', postData)
      
      const response = await axios.post('/Admin/Sheet/sheetSubstancesAdd', postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📥 POST Response:', response.data)
      
      if (response.data) {
        if (response.data.status === 200 || response.data.status === 201) {
          SweetAlert.success('Berhasil!', 'Sheet setting berhasil ditambahkan!')
          setShowAddModal(false)
          resetAddState()
          await fetchSheetSettings()
        } else {
          const errorMessage = response.data.message || response.data.error || 'Gagal menambahkan data'
          SweetAlert.error('Gagal!', errorMessage)
        }
      } else {
        SweetAlert.error('Error', 'Tidak ada response dari server')
      }
      
    } catch (err) {
      console.error('❌ Error:', err)
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan data'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditClick = async (item) => {
    try {
      const response = await axios.get(`/Admin/Sheet/sheetSubstancesByid/${item.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200 && response.data.data) {
        const data = response.data.data
        
        const substance = data.substance || `${data.layer_1 || '125'}${data.layer_1_type || 'M'}/${data.layer_2 || '125'}${data.layer_2_type || 'M'}/${data.layer_3 || '125'}${data.layer_3_type || 'M'}`
        
        setEditingItem({
          id: data.id_ss?.toString() || item.id,
          substance: substance,
          bFlute: parseFloat(data.b_flute) || item.bFlute,
          cFlute: parseFloat(data.c_flute) || item.cFlute,
          cbFlute: parseFloat(data.cb_flute) || item.cbFlute,
          eFlute: parseFloat(data.e_flute) || item.eFlute,
          ukuran: data.ukuran || item.ukuran,
          hargaPerlembar: parseFloat(data.harga_perlembar) || item.hargaPerlembar,
          status: data.status === '1' || data.status === 1 ? 'active' : 'inactive',
          status_raw: data.status?.toString(),
          layer1_gramasi: data.layer_1 || '',
          layer1_jenis: data.layer_1_type || '',
          layer2_gramasi: data.layer_2 || '',
          layer2_jenis: data.layer_2_type || '',
          layer3_gramasi: data.layer_3 || '',
          layer3_jenis: data.layer_3_type || '',
          bFluteName: data.b_flute_name || 'B-FLUTE',
          cFluteName: data.c_flute_name || 'C-FLUTE',
          cbFluteName: data.cb_flute_name || 'CB-FLUTE',
          eFluteName: data.e_flute_name || 'E-FLUTE'
        })
      } else {
        setEditingItem({
          ...item,
          status_raw: item.status === 'active' ? '1' : '0'
        })
      }
      
      setShowEditModal(true)
      
    } catch (err) {
      console.error('❌ Error loading data for edit:', err)
      setEditingItem({
        ...item,
        status_raw: item.status === 'active' ? '1' : '0'
      })
      setShowEditModal(true)
    }
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    
    // Validasi untuk edit
    if (!editingItem.substance?.trim()) {
      SweetAlert.error('Validasi Error', 'Substance tidak boleh kosong')
      return
    }
    
    if (!editingItem.ukuran?.trim()) {
      SweetAlert.error('Validasi Error', 'Ukuran tidak boleh kosong')
      return
    }
    
    if (!editingItem.eFlute || editingItem.eFlute <= 0) {
      SweetAlert.error('Validasi Error', 'Harga E-FLUTE harus diisi dan lebih dari 0')
      return
    }
    
    // Parse substance string menjadi layer components
    const parts = editingItem.substance.split('/')
    if (parts.length !== 3) {
      SweetAlert.error('Validasi Error', 'Format substance tidak valid. Harus ada 3 layer')
      setIsPosting(false)
      return
    }
    
    const parseLayer = (layer) => {
      const match = layer.match(/^(\d{2,3})([MKW])$/)
      if (match) {
        return { gramasi: match[1], jenis: match[2] }
      }
      return { gramasi: '125', jenis: 'M' }
    }
    
    const layer1 = parts[0] ? parseLayer(parts[0]) : { gramasi: '125', jenis: 'M' }
    const layer2 = parts[1] ? parseLayer(parts[1]) : { gramasi: '125', jenis: 'M' }
    const layer3 = parts[2] ? parseLayer(parts[2]) : { gramasi: '125', jenis: 'M' }
    
    // Validasi gramasi
    const gramasiRegex = /^\d{2,3}$/
    if (!gramasiRegex.test(layer1.gramasi) || !gramasiRegex.test(layer2.gramasi) || !gramasiRegex.test(layer3.gramasi)) {
      SweetAlert.error('Validasi Error', 'Gramasi harus 2-3 digit angka')
      return
    }
    
    try {
      setIsPosting(true)
      
      // Format data untuk PUT
      const updateData = new URLSearchParams({
        layer_1: layer1.gramasi,
        layer_1_type: layer1.jenis,
        layer_2: layer2.gramasi,
        layer_2_type: layer2.jenis,
        layer_3: layer3.gramasi,
        layer_3_type: layer3.jenis,
        b_flute: editingItem.bFlute || 0,
        c_flute: editingItem.cFlute || 0,
        cb_flute: editingItem.cbFlute || 0,
        e_flute: editingItem.eFlute || 0,
        ukuran: editingItem.ukuran.trim(),
        harga_perlembar: editingItem.hargaPerlembar || 0,
        status: editingItem.status === 'active' ? '1' : '0'
      }).toString()
      
      console.log('📤 Sending PUT data:', updateData)
      
      const response = await axios.put(`/Admin/Sheet/sheetSubstancesEdit/${editingItem.id}`, updateData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📥 PUT Response:', response.data)
      
      if (response.data && response.data.status === 200) {
        SweetAlert.success('Berhasil!', 'Sheet setting berhasil diperbarui!')
        setShowEditModal(false)
        resetEditState()
        await fetchSheetSettings()
      } else {
        let errorMsg = 'Gagal mengupdate data'
        
        if (response.data) {
          if (typeof response.data === 'string') {
            errorMsg = response.data
          } else if (response.data.message) {
            errorMsg = response.data.message
          } else if (response.data.error) {
            errorMsg = response.data.error
          }
        }
        
        SweetAlert.error('Gagal!', errorMsg)
      }
      
    } catch (err) {
      console.error('❌ Error updating:', err)
      
      let errorMessage = 'Terjadi kesalahan saat mengupdate data'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      SweetAlert.error('Error!', errorMessage)
      
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id, substance) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/Admin/Sheet/sheetSubstancesDel/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          SweetAlert.success('Dihapus!', `Sheet setting "${substance}" berhasil dihapus!`)
          await fetchSheetSettings()
        } else {
          let errorMsg = 'Gagal menghapus sheet setting'
          
          if (response.data) {
            if (typeof response.data === 'string') {
              errorMsg = response.data
            } else if (response.data.message) {
              errorMsg = response.data.message
            }
          }
          
          SweetAlert.error('Gagal!', errorMsg)
        }
      } catch (err) {
        console.error('❌ Error:', err)
        
        let errorMsg = 'Terjadi kesalahan saat menghapus data'
        
        if (err.response?.data) {
          if (typeof err.response.data === 'string') {
            errorMsg = err.response.data
          } else if (err.response.data.message) {
            errorMsg = err.response.data.message
          }
        } else if (err.message) {
          errorMsg = err.message
        }
        
        SweetAlert.error('Error!', errorMsg)
      }
    }
  }

  const toggleStatus = async (item) => {
    const result = await SweetAlert.confirmAction(
      'Ubah Status?',
      `Apakah Anda yakin ingin ${item.status === 'active' ? 'menonaktifkan' : 'mengaktifkan'} sheet setting ini?`
    )
    
    if (result.isConfirmed) {
      try {
        const newStatus = item.status === 'active' ? 'inactive' : 'active'
        const statusValue = newStatus === 'active' ? '1' : '0'
        
        // Parse substance untuk mendapatkan layer components
        const parts = item.substance.split('/')
        const parseLayer = (layer) => {
          const match = layer.match(/^(\d{2,3})([MKW])$/)
          if (match) {
            return { gramasi: match[1], jenis: match[2] }
          }
          return { gramasi: '125', jenis: 'M' }
        }
        
        const layer1 = parts[0] ? parseLayer(parts[0]) : { gramasi: '125', jenis: 'M' }
        const layer2 = parts[1] ? parseLayer(parts[1]) : { gramasi: '125', jenis: 'M' }
        const layer3 = parts[2] ? parseLayer(parts[2]) : { gramasi: '125', jenis: 'M' }
        
        // Format data sesuai backend
        const updateData = new URLSearchParams({
          layer_1: layer1.gramasi,
          layer_1_type: layer1.jenis,
          layer_2: layer2.gramasi,
          layer_2_type: layer2.jenis,
          layer_3: layer3.gramasi,
          layer_3_type: layer3.jenis,
          b_flute: item.bFlute || 0,
          c_flute: item.cFlute || 0,
          cb_flute: item.cbFlute || 0,
          e_flute: item.eFlute || 0,
          ukuran: item.ukuran || '',
          harga_perlembar: item.hargaPerlembar || 0,
          status: statusValue
        }).toString()
        
        console.log('📤 Sending status update:', updateData)
        
        const response = await axios.put(`/Admin/Sheet/sheetSubstancesEdit/${item.id}`, updateData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          SweetAlert.success('Berhasil!', `Sheet setting status diubah menjadi ${newStatus}!`)
          await fetchSheetSettings()
        } else {
          let errorMsg = 'Gagal mengubah status'
          
          if (response.data) {
            if (typeof response.data === 'string') {
              errorMsg = response.data
            } else if (response.data.message) {
              errorMsg = response.data.message
            }
          }
          
          SweetAlert.error('Gagal!', errorMsg)
        }
        
      } catch (err) {
        console.error('❌ Error:', err)
        
        let errorMsg = 'Terjadi kesalahan saat mengubah status'
        
        if (err.response?.data) {
          if (typeof err.response.data === 'string') {
            errorMsg = err.response.data
          } else if (err.response.data.message) {
            errorMsg = err.response.data.message
          }
        } else if (err.message) {
          errorMsg = err.message
        }
        
        SweetAlert.error('Error!', errorMsg)
      }
    }
  }

  // ===== MODAL CLOSE HANDLERS =====
  const handleCloseAddModal = () => {
    if (!isPosting) {
      setShowAddModal(false)
      resetAddState()
    }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) {
      setShowEditModal(false)
      resetEditState()
    }
  }

  // ===== FILTERING =====
  const filteredSettings = sheetSettings.filter(setting => {
    const matchesSearch = 
      setting.substance.toLowerCase().includes(search.toLowerCase()) ||
      setting.id.toLowerCase().includes(search.toLowerCase()) ||
      setting.ukuran.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || setting.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // ===== FORMAT CURRENCY =====
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat sheet settings...</p>
        </div>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Sheet Settings
            </h1>
            <p className="text-gray-600 mt-1">Konfigurasi harga dan spesifikasi bahan sheet</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <CustomIcon icon="mdi:alert-circle" className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Button
                onClick={() => {
                  fetchSheetSettings()
                  fetchFlutes()
                }}
                variant="danger"
                className="mt-4"
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ===== MAIN UI =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CustomIcon icon="mdi:file-document" className="w-8 h-8 text-blue-600" />
            Sheet Settings
          </h1>
          <p className="text-gray-600 mt-1">Konfigurasi harga dan spesifikasi bahan sheet</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleAddClick}
            variant="primary"
            icon="mdi:plus"
            className="w-full md:w-auto"
          >
            Tambah Substance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:package-variant" className="text-blue-600" />
              Total Settings
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.totalSettings.toLocaleString()}</p>
              <span className="text-sm text-blue-600 font-medium flex items-center">
                <CustomIcon icon="mdi:check-circle" className="w-4 h-4 mr-1" />
                {stats.activeSettings} active
              </span>
            </div>
            <p className="text-xs text-gray-500">settings tersedia</p>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:currency-usd" className="text-green-600" />
              E-FLUTE
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.eFluteCount}</p>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <CustomIcon icon="mdi:trending-up" className="w-4 h-4 mr-1" />
                {sheetSettings.length > 0 ? formatCurrency(sheetSettings.reduce((sum, s) => sum + s.eFlute, 0) / sheetSettings.length) : 'Rp 0'}
              </span>
            </div>
            <p className="text-xs text-gray-500">rata-rata harga</p>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:chart-bar" className="text-purple-600" />
              Ukuran
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {Array.from(new Set(sheetSettings.map(s => s.ukuran))).length}
              </p>
              <span className="text-sm text-purple-600 font-medium flex items-center">
                <CustomIcon icon="mdi:ruler-square" className="w-4 h-4 mr-1" />
                variasi
              </span>
            </div>
            <p className="text-xs text-gray-500">ukuran berbeda</p>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:format-list-bulleted-type" className="text-orange-600" />
              Substances
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {Array.from(new Set(sheetSettings.map(s => s.substance))).length}
              </p>
              <span className="text-sm text-orange-600 font-medium flex items-center">
                <CustomIcon icon="mdi:layers" className="w-4 h-4 mr-1" />
                types
              </span>
            </div>
            <p className="text-xs text-gray-500">jenis bahan</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <CustomIcon 
                icon="mdi:magnify" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by substance, ID, or ukuran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              All Sheet Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredSettings.length} dari {sheetSettings.length} settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="mdi:filter-variant"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              More Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="mdi:refresh"
              onClick={fetchSheetSettings}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  Substance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  Ukuran (mm)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  B-FLUTE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  C-FLUTE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  CB-FLUTE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  E-FLUTE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  Price/Sheet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">#{setting.id}</div>
                    <div className="text-xs text-gray-500">{setting.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{setting.substance}</span>
                      <div className="flex gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {setting.layer1_gramasi}{setting.layer1_jenis}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {setting.layer2_gramasi}{setting.layer2_jenis}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {setting.layer3_gramasi}{setting.layer3_jenis}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">{setting.ukuran}</span>
                      <span className="text-xs text-gray-500">
                        ({setting.ukuranPanjang}×{setting.ukuranLebar})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(setting.bFlute)}
                      <div className="text-xs text-gray-500">
                        {setting.bFluteName || 'B-FLUTE'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(setting.cFlute)}
                      <div className="text-xs text-gray-500">
                        {setting.cFluteName || 'C-FLUTE'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(setting.cbFlute)}
                      <div className="text-xs text-gray-500">
                        {setting.cbFluteName || 'CB-FLUTE'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(setting.eFlute)}
                      <div className="text-xs text-gray-500">
                        {setting.eFluteName || 'E-FLUTE'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-purple-600">
                      {formatCurrency(setting.hargaPerlembar)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        setting.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {setting.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => toggleStatus(setting)}
                        className="text-gray-400 hover:text-gray-600"
                        title={setting.status === 'active' ? 'Set inactive' : 'Set active'}
                      >
                        <CustomIcon icon="mdi:swap-vertical" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(setting)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200"
                      >
                        <CustomIcon icon="mdi:pencil" className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(setting.id, setting.substance)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
                      >
                        <CustomIcon icon="mdi:delete" className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSettings.length === 0 && (
          <div className="text-center py-12">
            <CustomIcon icon="mdi:file-document-remove" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Tidak ada sheet settings yang ditemukan</p>
            <p className="text-sm text-gray-400">
              Coba ubah filter atau tambahkan setting baru
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {Math.min(10, filteredSettings.length)} of {filteredSettings.length} settings
          </div>
          <button
            onClick={() => SweetAlert.info('Export', 'Exporting sheet settings data...')}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <CustomIcon icon="mdi:export" className="w-4 h-4 mr-1" />
            Export Data
          </button>
        </div>
      </Card>

      {/* ===== MODAL TAMBAH SHEET SETTING ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Tambah Sheet Setting Baru"
        size="2xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCloseAddModal}
              disabled={isPosting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              onClick={handleAddSave}
              disabled={isPosting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isPosting ? (
                <>
                  <CustomIcon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Setting'
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Substance Builder Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <CustomIcon icon="mdi:layers-triple" className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Konfigurasi Substance (3 Layer)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Layer 1 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Layer 1</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gramasi (gsm)</label>
                    <input
                      type="number"
                      value={substanceBuilder.layer1_gramasi}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value) && value.length <= 3) {
                          setSubstanceBuilder(prev => ({
                            ...prev,
                            layer1_gramasi: value
                          }))
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      placeholder="125"
                      min="10"
                      max="999"
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 10-999 gsm</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Kertas</label>
                    <select
                      value={substanceBuilder.layer1_jenis}
                      onChange={(e) => setSubstanceBuilder(prev => ({
                        ...prev,
                        layer1_jenis: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
                    >
                      <option value="M">M (Medium - Coklat)</option>
                      <option value="K">K (Kraft - Coklat Tua)</option>
                      <option value="W">W (White - Putih)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Layer 2 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Layer 2</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gramasi (gsm)</label>
                    <input
                      type="number"
                      value={substanceBuilder.layer2_gramasi}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value) && value.length <= 3) {
                          setSubstanceBuilder(prev => ({
                            ...prev,
                            layer2_gramasi: value
                          }))
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      placeholder="125"
                      min="10"
                      max="999"
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 10-999 gsm</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Kertas</label>
                    <select
                      value={substanceBuilder.layer2_jenis}
                      onChange={(e) => setSubstanceBuilder(prev => ({
                        ...prev,
                        layer2_jenis: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
                    >
                      <option value="M">M (Medium - Coklat)</option>
                      <option value="K">K (Kraft - Coklat Tua)</option>
                      <option value="W">W (White - Putih)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Layer 3 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Layer 3</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gramasi (gsm)</label>
                    <input
                      type="number"
                      value={substanceBuilder.layer3_gramasi}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value) && value.length <= 3) {
                          setSubstanceBuilder(prev => ({
                            ...prev,
                            layer3_gramasi: value
                          }))
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      placeholder="125"
                      min="10"
                      max="999"
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 10-999 gsm</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Kertas</label>
                    <select
                      value={substanceBuilder.layer3_jenis}
                      onChange={(e) => setSubstanceBuilder(prev => ({
                        ...prev,
                        layer3_jenis: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
                    >
                      <option value="M">M (Medium - Coklat)</option>
                      <option value="K">K (Kraft - Coklat Tua)</option>
                      <option value="W">W (White - Putih)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Preview Substance:</p>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Format: [Gramasi][Jenis]
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg font-bold text-blue-600">
                  {substanceBuilder.layer1_gramasi}
                  <span className="text-blue-800">{substanceBuilder.layer1_jenis}</span>
                </span>
                <CustomIcon icon="mdi:slash-forward" className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold text-blue-600">
                  {substanceBuilder.layer2_gramasi}
                  <span className="text-blue-800">{substanceBuilder.layer2_jenis}</span>
                </span>
                <CustomIcon icon="mdi:slash-forward" className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold text-blue-600">
                  {substanceBuilder.layer3_gramasi}
                  <span className="text-blue-800">{substanceBuilder.layer3_jenis}</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Hasil: {buildSubstance(substanceBuilder)}
              </p>
            </div>
          </div>

          {/* Excel Formula Generator Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CustomIcon icon="mdi:calculator" className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Auto Generate Ukuran (Excel Formula)</h3>
              </div>
              <button
                onClick={handleGenerateUkuran}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 flex items-center"
              >
                <CustomIcon icon="mdi:refresh" className="w-4 h-4 mr-1" />
                Generate Ukuran
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Box *
                </label>
                <select
                  value={excelData.type}
                  onChange={(e) => setExcelData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
                >
                  <option value="Mailer Earlock">Mailer Earlock</option>
                  <option value="Mailer Frontlock Type 1">Mailer Frontlock Type 1</option>
                  <option value="Mailer Frontlock Type 2">Mailer Frontlock Type 2</option>
                  <option value="Sepatu Type 1">Sepatu Type 1</option>
                  <option value="Sepatu Type 2">Sepatu Type 2</option>
                  <option value="Sepatu Type 3">Sepatu Type 3</option>
                  <option value="Sepatu Type 4">Sepatu Type 4</option>
                  <option value="Sepatu Tutup Lepas Type 1">Sepatu Tutup Lepas Type 1</option>
                  <option value="Sepatu Tutup Lepas Type 2">Sepatu Tutup Lepas Type 2</option>
                  <option value="Top Bottom">Top Bottom</option>
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">A3 (Panjang)</label>
                  <input
                    type="number"
                    value={excelData.A3}
                    onChange={(e) => setExcelData(prev => ({ ...prev, A3: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                    placeholder="10"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">cm</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">B3 (Lebar)</label>
                  <input
                    type="number"
                    value={excelData.B3}
                    onChange={(e) => setExcelData(prev => ({ ...prev, B3: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                    placeholder="5"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">cm</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">C3 (Tinggi)</label>
                  <input
                    type="number"
                    value={excelData.C3}
                    onChange={(e) => setExcelData(prev => ({ ...prev, C3: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                    placeholder="3"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">cm</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CustomIcon icon="mdi:information" className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-gray-700">Formula Excel:</p>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded font-mono">
                <div className="mb-1">
                  <span className="text-green-700">Panjang: </span>
                  <span>{calculatePanjang(excelData.type, excelData.A3, excelData.B3, excelData.C3).toFixed(2)} mm</span>
                </div>
                <div>
                  <span className="text-green-700">Lebar: </span>
                  <span>{calculateLebar(excelData.type, excelData.A3, excelData.B3, excelData.C3).toFixed(2)} mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ukuran & Harga Section */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CustomIcon icon="mdi:ruler-square" className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Dimensi & Harga</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ukuran Sheet (mm) *
                  <span className="text-xs font-normal text-gray-500 ml-2">Format: panjang x lebar</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addFormData.ukuran}
                    onChange={(e) => setAddFormData(prev => ({
                      ...prev,
                      ukuran: e.target.value.replace(/\s/g, '')
                    }))}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700"
                    placeholder="650x1050"
                  />
                  <CustomIcon 
                    icon="mdi:ruler" 
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAddFormData(prev => ({ ...prev, ukuran: '650x1050' }))}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    650×1050
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFormData(prev => ({ ...prev, ukuran: '780x1080' }))}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    780×1080
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFormData(prev => ({ ...prev, ukuran: '1100x1100' }))}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    1100×1100
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga per Lembar (Rp) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={addFormData.hargaPerlembar}
                    onChange={(e) => setAddFormData(prev => ({
                      ...prev,
                      hargaPerlembar: e.target.value
                    }))}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700"
                    placeholder="25000"
                    min="0"
                  />
                  <CustomIcon 
                    icon="mdi:cash" 
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {addFormData.hargaPerlembar ? formatCurrency(addFormData.hargaPerlembar) : 'Rp 0'}
                </p>
              </div>
            </div>
          </div>

          {/* Harga FLUTE Section dengan SELECT OPTIONS */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CustomIcon icon="mdi:currency-usd" className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Pilih Flute & Harga per Meter Persegi (M²)</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* B-FLUTE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  B-FLUTE *
                  <span className="text-xs font-normal text-gray-500 ml-2">(Single Wall)</span>
                </label>
                {fluteLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={addFormData.selectedBFlute}
                      onChange={(e) => {
                        const selectedFlute = flutes.find(f => f.id === e.target.value)
                        setAddFormData(prev => ({
                          ...prev,
                          selectedBFlute: e.target.value,
                          bFluteName: selectedFlute?.flute_name || 'B-FLUTE'
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
                    >
                      <option value="">Pilih B-FLUTE</option>
                      {flutes
                        .filter(flute => ['B'].includes(flute.flute_code))
                        .map(flute => (
                          <option key={flute.id} value={flute.id}>
                            {flute.flute_code} - {flute.flute_name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      value={addFormData.bFlute}
                      onChange={(e) => setAddFormData(prev => ({
                        ...prev,
                        bFlute: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                      placeholder="Harga per m²"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* C-FLUTE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  C-FLUTE *
                  <span className="text-xs font-normal text-gray-500 ml-2">(Single Wall)</span>
                </label>
                {fluteLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={addFormData.selectedCFlute}
                      onChange={(e) => {
                        const selectedFlute = flutes.find(f => f.id === e.target.value)
                        setAddFormData(prev => ({
                          ...prev,
                          selectedCFlute: e.target.value,
                          cFluteName: selectedFlute?.flute_name || 'C-FLUTE'
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
                    >
                      <option value="">Pilih C-FLUTE</option>
                      {flutes
                        .filter(flute => ['C'].includes(flute.flute_code))
                        .map(flute => (
                          <option key={flute.id} value={flute.id}>
                            {flute.flute_code} - {flute.flute_name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      value={addFormData.cFlute}
                      onChange={(e) => setAddFormData(prev => ({
                        ...prev,
                        cFlute: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                      placeholder="Harga per m²"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* CB-FLUTE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CB-FLUTE *
                  <span className="text-xs font-normal text-gray-500 ml-2">(Double Wall)</span>
                </label>
                {fluteLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={addFormData.selectedCBFlute}
                      onChange={(e) => {
                        const selectedFlute = flutes.find(f => f.id === e.target.value)
                        setAddFormData(prev => ({
                          ...prev,
                          selectedCBFlute: e.target.value,
                          cbFluteName: selectedFlute?.flute_name || 'CB-FLUTE'
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
                    >
                      <option value="">Pilih CB-FLUTE</option>
                      {flutes
                        .filter(flute => ['CB'].includes(flute.flute_code))
                        .map(flute => (
                          <option key={flute.id} value={flute.id}>
                            {flute.flute_code} - {flute.flute_name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      value={addFormData.cbFlute}
                      onChange={(e) => setAddFormData(prev => ({
                        ...prev,
                        cbFlute: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                      placeholder="Harga per m²"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* E-FLUTE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-FLUTE *
                  <span className="text-xs font-normal text-gray-500 ml-2">(Micro Flute)</span>
                </label>
                {fluteLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={addFormData.selectedEFlute}
                      onChange={(e) => {
                        const selectedFlute = flutes.find(f => f.id === e.target.value)
                        setAddFormData(prev => ({
                          ...prev,
                          selectedEFlute: e.target.value,
                          eFluteName: selectedFlute?.flute_name || 'E-FLUTE'
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
                    >
                      <option value="">Pilih E-FLUTE</option>
                      {flutes
                        .filter(flute => ['E'].includes(flute.flute_code))
                        .map(flute => (
                          <option key={flute.id} value={flute.id}>
                            {flute.flute_code} - {flute.flute_name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      value={addFormData.eFlute}
                      onChange={(e) => setAddFormData(prev => ({
                        ...prev,
                        eFlute: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                      placeholder="Harga per m²"
                      min="1"
                      required
                    />
                  </div>
                )}
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Wajib diisi
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CustomIcon icon="mdi:power" className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Status Setting</h3>
            </div>
            
            <div className="flex gap-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={addFormData.status === 'active'}
                  onChange={(e) => setAddFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                    Active
                  </span>
                  <span className="text-xs text-gray-500 ml-2">(Tersedia untuk produksi)</span>
                </span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={addFormData.status === 'inactive'}
                  onChange={(e) => setAddFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                    Inactive
                  </span>
                  <span className="text-xs text-gray-500 ml-2">(Tidak tersedia)</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* ===== MODAL EDIT SHEET SETTING ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit Sheet Setting"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCloseEditModal}
              disabled={isPosting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              onClick={handleEditSave}
              disabled={isPosting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isPosting ? (
                <>
                  <CustomIcon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:information-outline" className="w-5 h-5" />
                Informasi Sheet Setting
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Setting
                </label>
                <input
                  value={`#${editingItem.id}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Substance *
                  <span className="text-xs font-normal text-gray-500 ml-2">Format: 125M/125M/125M</span>
                </label>
                <input
                  value={editingItem.substance}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    substance: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  placeholder="Contoh: 125M/125M/125M"
                  required
                  disabled={isPosting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ukuran *
                  </label>
                  <input
                    value={editingItem.ukuran}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      ukuran: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder="Contoh: 650x1050"
                    required
                    disabled={isPosting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga per Lembar *
                  </label>
                  <input
                    type="number"
                    value={editingItem.hargaPerlembar}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      hargaPerlembar: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder="0"
                    required
                    disabled={isPosting}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:currency-usd" className="w-5 h-5" />
                Harga per Meter Persegi (M²)
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">B-FLUTE Price</label>
                  <input
                    type="number"
                    value={editingItem.bFlute}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      bFlute: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder="0"
                    disabled={isPosting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">C-FLUTE Price</label>
                  <input
                    type="number"
                    value={editingItem.cFlute}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      cFlute: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder="0"
                    disabled={isPosting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CB-FLUTE Price</label>
                  <input
                    type="number"
                    value={editingItem.cbFlute}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      cbFlute: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder="0"
                    disabled={isPosting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-FLUTE Price *
                  </label>
                  <input
                    type="number"
                    value={editingItem.eFlute}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      eFlute: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder="0"
                    required
                    disabled={isPosting}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:power" className="w-5 h-5" />
                Status Setting
              </h3>
              
              <div className="flex gap-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="editStatus"
                    value="active"
                    checked={editingItem.status === 'active'}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      status: e.target.value
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isPosting}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                      Active
                    </span>
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="editStatus"
                    value="inactive"
                    checked={editingItem.status === 'inactive'}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      status: e.target.value
                    })}
                    className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                    disabled={isPosting}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                      Inactive
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}