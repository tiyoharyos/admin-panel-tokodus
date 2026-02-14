'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'
import { Icon } from '@iconify/react'

export default function InnerboxCalculatorPage() {
  // State untuk data input
  const [productDimensions, setProductDimensions] = useState({
    panjang: 22,  // cm (A)
    lebar: 15,    // cm (B)
    tinggi: 10    // cm (C)
  })

  const [selectedBoxModel, setSelectedBoxModel] = useState('Mailer Earlock')
  const [calculatedDimensions, setCalculatedDimensions] = useState({
    panjang: 0,
    lebar: 0,
    tinggi: 0,
    materialLength: 0,
    materialWidth: 0
  })

  const [formulaComponents, setFormulaComponents] = useState([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationHistory, setCalculationHistory] = useState([])

  // Data model box yang tersedia
  const boxModels = [
    { value: 'Mailer Earlock', label: 'Mailer Earlock' },
    { value: 'Mailer Frontlock Type 1', label: 'Mailer Frontlock Type 1' },
    { value: 'Mailer Frontlock Type 2', label: 'Mailer Frontlock Type 2' },
    { value: 'Sepatu Type 1', label: 'Sepatu Type 1' },
    { value: 'Sepatu Type 2', label: 'Sepatu Type 2' },
    { value: 'Sepatu Type 3', label: 'Sepatu Type 3' },
    { value: 'Sepatu Type 4', label: 'Sepatu Type 4' },
    { value: 'Sepatu Tutup Lepas Type 1', label: 'Sepatu Tutup Lepas Type 1' },
    { value: 'Sepatu Tutup Lepas Type 2', label: 'Sepatu Tutup Lepas Type 2' },
    { value: 'Top Bottom', label: 'Top Bottom' }
  ]

  // Fungsi untuk mengkonversi cm ke mm
  const cmToMm = (cm) => cm * 10

  // Fungsi untuk menghitung panjang berdasarkan model box
  const calculatePanjang = (A_cm, B_cm, C_cm, model) => {
    const A = cmToMm(A_cm)
    const B = cmToMm(B_cm)
    const C = cmToMm(C_cm)

    let panjang_mm = 0

    switch (model) {
      case 'Mailer Earlock':
        // ((C*4*10) + (A*10) + (0.5*10) + (0.5*4*10) + 20)
        panjang_mm = (C * 4) + A + (0.5 * 10) + (0.5 * 4 * 10) + 20
        break

      case 'Mailer Frontlock Type 1':
      case 'Mailer Frontlock Type 2':
      case 'Sepatu Type 1':
      case 'Sepatu Type 2':
      case 'Sepatu Type 4':
      case 'Sepatu Tutup Lepas Type 1':
        // ((C*2*10) + (A*10) + (0.5*10) + 20)
        panjang_mm = (C * 2) + A + (0.5 * 10) + 20
        break

      case 'Sepatu Type 3':
      case 'Sepatu Tutup Lepas Type 2':
        // ((C*2*10) + (A*10) + (3*2*10) + (0.5*2*10) + 20)
        panjang_mm = (C * 2) + A + (3 * 2 * 10) + (0.5 * 2 * 10) + 20
        break

      case 'Top Bottom':
        // ((B*2*10) + (C*10) + (3.5*2*10) + 20)
        panjang_mm = (B * 2) + C + (3.5 * 2 * 10) + 20
        break

      default:
        panjang_mm = 0
    }

    return panjang_mm / 10 // convert back to cm
  }

  // Fungsi untuk menghitung lebar berdasarkan model box
  const calculateLebar = (A_cm, B_cm, C_cm, model) => {
    const A = cmToMm(A_cm)
    const B = cmToMm(B_cm)
    const C = cmToMm(C_cm)

    let lebar_mm = 0

    switch (model) {
      case 'Mailer Earlock':
        // ((C*3*10) + (B*2*10) + (0.5*10) + (2*10))
        lebar_mm = (C * 3) + (B * 2) + (0.5 * 10) + (2 * 10)
        break

      case 'Mailer Frontlock Type 1':
      case 'Mailer Frontlock Type 2':
        // ((C*3*10) + (B*2*10) + (1*10) + ((C*0.6)*10) + (0.5*10) + (2*10))
        lebar_mm = (C * 3) + (B * 2) + (1 * 10) + (C * 0.6) + (0.5 * 10) + (2 * 10)
        break

      case 'Sepatu Type 1':
      case 'Sepatu Type 3':
        // ((C*2*10) + (B*2*10) + ((C*0.4)*2*10) + (1*10) + (0.5*10) + (2*10))
        lebar_mm = (C * 2) + (B * 2) + (C * 0.4 * 2) + (1 * 10) + (0.5 * 10) + (2 * 10)
        break

      case 'Sepatu Type 2':
        // ((C*3*10) + (B*2*10) + (5.5*10) + (0.5*10) + (2*10))
        lebar_mm = (C * 3) + (B * 2) + (5.5 * 10) + (0.5 * 10) + (2 * 10)
        break

      case 'Sepatu Type 4':
        // ((C*2*10) + (B*2*10) + ((C*0.4)*10) + (0.5*10) + (2*10))
        lebar_mm = (C * 2) + (B * 2) + (C * 0.4) + (0.5 * 10) + (2 * 10)
        break

      case 'Sepatu Tutup Lepas Type 1':
      case 'Sepatu Tutup Lepas Type 2':
        // ((C*2*10) + (B*2*10) + ((C*0.4)*2*10) + (2*10) + (1*10) + (2*10))
        lebar_mm = (C * 2) + (B * 2) + (C * 0.4 * 2) + (2 * 10) + (1 * 10) + (2 * 10)
        break

      case 'Top Bottom':
        // (((A+B)*2*10) + (3*10) + (2*10))
        lebar_mm = ((A + B) * 2) + (3 * 10) + (2 * 10)
        break

      default:
        lebar_mm = 0
    }

    return lebar_mm / 10 // convert back to cm
  }

  // Fungsi untuk mendapatkan detail formula dalam format yang bisa ditampilkan
  const getFormulaDetails = (A_cm, B_cm, C_cm, model) => {
    const A = cmToMm(A_cm)
    const B = cmToMm(B_cm)
    const C = cmToMm(C_cm)

    let panjangFormula = ''
    let lebarFormula = ''

    switch (model) {
      case 'Mailer Earlock':
        panjangFormula = `(C×4) + A + (0.5×10) + (0.5×4×10) + 20 = (${C}×4) + ${A} + 5 + 20 + 20`
        lebarFormula = `(C×3) + (B×2) + (0.5×10) + (2×10) = (${C}×3) + (${B}×2) + 5 + 20`
        break

      case 'Mailer Frontlock Type 1':
      case 'Mailer Frontlock Type 2':
        panjangFormula = `(C×2) + A + (0.5×10) + 20 = (${C}×2) + ${A} + 5 + 20`
        lebarFormula = `(C×3) + (B×2) + 10 + (C×0.6) + 5 + 20 = (${C}×3) + (${B}×2) + 10 + ${(C * 0.6).toFixed(1)} + 5 + 20`
        break

      case 'Sepatu Type 1':
        panjangFormula = `(C×2) + A + (0.5×10) + 20 = (${C}×2) + ${A} + 5 + 20`
        lebarFormula = `(C×2) + (B×2) + (C×0.4×2) + 10 + 5 + 20 = (${C}×2) + (${B}×2) + ${(C * 0.4 * 2).toFixed(1)} + 10 + 5 + 20`
        break

      case 'Sepatu Type 2':
        panjangFormula = `(C×2) + A + (0.5×10) + 20 = (${C}×2) + ${A} + 5 + 20`
        lebarFormula = `(C×3) + (B×2) + 55 + 5 + 20 = (${C}×3) + (${B}×2) + 55 + 5 + 20`
        break

      case 'Sepatu Type 3':
        panjangFormula = `(C×2) + A + (3×2×10) + (0.5×2×10) + 20 = (${C}×2) + ${A} + 60 + 10 + 20`
        lebarFormula = `(C×2) + (B×2) + (C×0.4×2) + 10 + 5 + 20 = (${C}×2) + (${B}×2) + ${(C * 0.4 * 2).toFixed(1)} + 10 + 5 + 20`
        break

      case 'Sepatu Type 4':
        panjangFormula = `(C×2) + A + (0.5×10) + 20 = (${C}×2) + ${A} + 5 + 20`
        lebarFormula = `(C×2) + (B×2) + (C×0.4) + 5 + 20 = (${C}×2) + (${B}×2) + ${(C * 0.4).toFixed(1)} + 5 + 20`
        break

      case 'Sepatu Tutup Lepas Type 1':
        panjangFormula = `(C×2) + A + (0.5×10) + 20 = (${C}×2) + ${A} + 5 + 20`
        lebarFormula = `(C×2) + (B×2) + (C×0.4×2) + 20 + 10 + 20 = (${C}×2) + (${B}×2) + ${(C * 0.4 * 2).toFixed(1)} + 20 + 10 + 20`
        break

      case 'Sepatu Tutup Lepas Type 2':
        panjangFormula = `(C×2) + A + (3×2×10) + (0.5×2×10) + 20 = (${C}×2) + ${A} + 60 + 10 + 20`
        lebarFormula = `(C×2) + (B×2) + (C×0.4×2) + 20 + 10 + 20 = (${C}×2) + (${B}×2) + ${(C * 0.4 * 2).toFixed(1)} + 20 + 10 + 20`
        break

      case 'Top Bottom':
        panjangFormula = `(B×2) + C + (3.5×2×10) + 20 = (${B}×2) + ${C} + 70 + 20`
        lebarFormula = `((A+B)×2) + 30 + 20 = ((${A}+${B})×2) + 30 + 20`
        break

      default:
        panjangFormula = 'Formula tidak tersedia'
        lebarFormula = 'Formula tidak tersedia'
    }

    return { panjangFormula, lebarFormula }
  }

  // Fungsi untuk menghitung dimensi innerbox
  const calculateInnerboxDimensions = () => {
    setIsCalculating(true)

    try {
      const P_cm = parseFloat(productDimensions.panjang) || 0
      const L_cm = parseFloat(productDimensions.lebar) || 0
      const T_cm = parseFloat(productDimensions.tinggi) || 0

      if (P_cm <= 0 || L_cm <= 0 || T_cm <= 0) {
        SweetAlert.error(
          'Input Tidak Valid',
          'Semua dimensi harus lebih besar dari 0'
        )
        setIsCalculating(false)
        return
      }

      // Hitung panjang dan lebar menggunakan formula yang sesuai
      const panjang_cm = calculatePanjang(P_cm, L_cm, T_cm, selectedBoxModel)
      const lebar_cm = calculateLebar(P_cm, L_cm, T_cm, selectedBoxModel)
      const tinggi_cm = T_cm + 0.5 // Tambah 0.5cm untuk tinggi innerbox

      // Hitung ukuran bahan (material)
      const materialLength = panjang_cm + (2 * lebar_cm) + 3 // Overlap 3cm
      const materialWidth = (2 * lebar_cm) + (2 * tinggi_cm) + 2 // Overlap 2cm

      const result = {
        panjang: parseFloat(panjang_cm.toFixed(2)),
        lebar: parseFloat(lebar_cm.toFixed(2)),
        tinggi: parseFloat(tinggi_cm.toFixed(2)),
        materialLength: parseFloat(materialLength.toFixed(2)),
        materialWidth: parseFloat(materialWidth.toFixed(2))
      }

      setCalculatedDimensions(result)

      // Tambahkan ke history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        productDimensions: { ...productDimensions },
        boxModel: selectedBoxModel,
        result: { ...result }
      }

      setCalculationHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Simpan 10 item terakhir

      // Tampilkan SweetAlert sukses
      SweetAlert.success(
        'Perhitungan Selesai!',
        `Ukuran innerbox berhasil dihitung untuk model ${selectedBoxModel}`
      )

      // Update formula components untuk ditampilkan
      updateFormulaComponentsDisplay(P_cm, L_cm, T_cm)

    } catch (error) {
      console.error('Error dalam perhitungan:', error)
      SweetAlert.error(
        'Kesalahan Perhitungan',
        'Terjadi kesalahan saat menghitung ukuran innerbox. Periksa input Anda.'
      )
    } finally {
      setIsCalculating(false)
    }
  }

  // Fungsi untuk menampilkan komponen formula
  const updateFormulaComponentsDisplay = (P_cm, L_cm, T_cm) => {
    const formulas = getFormulaDetails(P_cm, L_cm, T_cm, selectedBoxModel)
    
    const components = [
      {
        id: 'panjang-formula',
        target: 'Panjang',
        calculation: formulas.panjangFormula,
        value: calculatedDimensions.panjang,
        unit: 'cm'
      },
      {
        id: 'lebar-formula',
        target: 'Lebar',
        calculation: formulas.lebarFormula,
        value: calculatedDimensions.lebar,
        unit: 'cm'
      }
    ]

    setFormulaComponents(components)
  }

  // Fungsi untuk mereset form
  const handleReset = () => {
    SweetAlert.confirmAction(
      'Reset Form',
      'Apakah Anda yakin ingin mereset semua input?'
    ).then((result) => {
      if (result.isConfirmed) {
        setProductDimensions({
          panjang: 22,
          lebar: 15,
          tinggi: 10
        })
        setCalculatedDimensions({
          panjang: 0,
          lebar: 0,
          tinggi: 0,
          materialLength: 0,
          materialWidth: 0
        })
        setFormulaComponents([])
        
        SweetAlert.success('Berhasil!', 'Form telah direset ke nilai default.')
      }
    })
  }

  // Fungsi untuk export data ke CSV
  const handleExportData = () => {
    const data = {
      timestamp: new Date().toLocaleString(),
      productDimensions,
      boxModel: selectedBoxModel,
      calculatedDimensions,
      calculationHistory: calculationHistory.length
    }
    
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `innerbox-calc-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    SweetAlert.success(
      'Data Diexport!',
      'Data perhitungan berhasil diexport ke file JSON.'
    )
  }

  // Fungsi untuk menghapus history
  const handleClearHistory = () => {
    SweetAlert.confirmAction(
      'Hapus History',
      'Apakah Anda yakin ingin menghapus semua riwayat perhitungan?'
    ).then((result) => {
      if (result.isConfirmed) {
        setCalculationHistory([])
        SweetAlert.success('Berhasil!', 'Riwayat perhitungan telah dihapus.')
      }
    })
  }

  // Effect untuk menghitung otomatis saat data berubah
  useEffect(() => {
    if (productDimensions.panjang > 0 && productDimensions.lebar > 0 && productDimensions.tinggi > 0) {
      // Auto-calculate bisa diaktifkan di sini jika diperlukan
    }
  }, [productDimensions, selectedBoxModel])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Icon icon="mdi:calculator" className="text-blue-600" />
            HITUNG UKURAN BAHAN INNERBOX TOKODUS
          </h1>
          <p className="text-gray-600 mt-1">
            Kalkulator untuk menghitung ukuran bahan innerbox berdasarkan model box
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportData}
          >
            <Icon icon="mdi:export" className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="primary"
            onClick={calculateInnerboxDimensions}
            loading={isCalculating}
          >
            <Icon icon="mdi:calculator" className="w-4 h-4 mr-2" />
            {isCalculating ? 'Menghitung...' : 'Hitung Sekarang'}
          </Button>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Dimensi Produk */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
              <Icon icon="mdi:cube-scan" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Dimensi Produk (cm)
              </h3>
              <p className="text-sm text-gray-600">
                Masukkan dimensi produk dalam centimeter
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Panjang (cm) *"
              type="number"
              step="0.1"
              value={productDimensions.panjang}
              onChange={(e) => setProductDimensions({
                ...productDimensions,
                panjang: parseFloat(e.target.value) || 0
              })}
              placeholder="22"
              required
              icon="mdi:arrow-right"
              helperText="A (P)"
            />

            <Input
              label="Lebar (cm) *"
              type="number"
              step="0.1"
              value={productDimensions.lebar}
              onChange={(e) => setProductDimensions({
                ...productDimensions,
                lebar: parseFloat(e.target.value) || 0
              })}
              placeholder="15"
              required
              icon="mdi:arrow-left-right"
              helperText="B (L)"
            />

            <Input
              label="Tinggi (cm) *"
              type="number"
              step="0.1"
              value={productDimensions.tinggi}
              onChange={(e) => setProductDimensions({
                ...productDimensions,
                tinggi: parseFloat(e.target.value) || 0
              })}
              placeholder="10"
              required
              icon="mdi:arrow-up-down"
              helperText="C (T)"
            />
          </div>

          <div className="mt-6">
            <Select
              label="Pilih Model Box"
              value={selectedBoxModel}
              onChange={(e) => setSelectedBoxModel(e.target.value)}
              options={boxModels}
              icon="mdi:package-variant"
              helperText="Pilih model box yang sesuai"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={calculateInnerboxDimensions}
                loading={isCalculating}
                className="flex-1"
              >
                <Icon icon="mdi:calculator" className="w-4 h-4 mr-2" />
                Hitung
              </Button>
            </div>
          </div>
        </Card>

        {/* Hasil Perhitungan */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
              <Icon icon="mdi:ruler-square" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Hasil Perhitungan
              </h3>
              <p className="text-sm text-gray-600">
                Ukuran innerbox dan bahan yang dibutuhkan
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Dimensi Innerbox */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:cube-outline" className="w-4 h-4" />
                Dimensi Innerbox (cm)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">Panjang</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {calculatedDimensions.panjang > 0 ? calculatedDimensions.panjang : '-'}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">cm</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-xs text-green-600 mb-1">Lebar</div>
                  <div className="text-2xl font-bold text-green-700">
                    {calculatedDimensions.lebar > 0 ? calculatedDimensions.lebar : '-'}
                  </div>
                  <div className="text-xs text-green-500 mt-1">cm</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-xs text-purple-600 mb-1">Tinggi</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {calculatedDimensions.tinggi > 0 ? calculatedDimensions.tinggi : '-'}
                  </div>
                  <div className="text-xs text-purple-500 mt-1">cm</div>
                </div>
              </div>
            </div>

            {/* Ukuran Bahan */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:texture" className="w-4 h-4" />
                Ukuran Bahan yang Dibutuhkan (cm)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-xs text-orange-600 mb-1">Panjang Bahan</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {calculatedDimensions.materialLength > 0 ? calculatedDimensions.materialLength : '-'}
                  </div>
                  <div className="text-xs text-orange-500 mt-1">cm</div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-xs text-red-600 mb-1">Lebar Bahan</div>
                  <div className="text-2xl font-bold text-red-700">
                    {calculatedDimensions.materialWidth > 0 ? calculatedDimensions.materialWidth : '-'}
                  </div>
                  <div className="text-xs text-red-500 mt-1">cm</div>
                </div>
              </div>
            </div>

            {/* Total Luas Bahan */}
            {calculatedDimensions.materialLength > 0 && calculatedDimensions.materialWidth > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Total Luas Bahan</div>
                    <div className="text-xs text-gray-500">Panjang × Lebar</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {parseFloat((calculatedDimensions.materialLength * calculatedDimensions.materialWidth).toFixed(2))} cm²
                    </div>
                    <div className="text-xs text-gray-500">
                      ≈ {(calculatedDimensions.materialLength * calculatedDimensions.materialWidth / 10000).toFixed(4)} m²
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Formula */}
      {formulaComponents.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg">
              <Icon icon="mdi:function-variant" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Perhitungan Formula
              </h3>
              <p className="text-sm text-gray-600">
                Breakdown perhitungan untuk model {selectedBoxModel}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table
              headers={['Target', 'Formula Perhitungan', 'Hasil', 'Satuan']}
              striped
              hoverable
            >
              {formulaComponents.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {comp.target}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 font-mono">
                      {comp.calculation}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-bold text-gray-900">
                      {comp.value}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {comp.unit}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Keterangan:</strong>
                  <br />• A = Panjang produk (cm), dalam formula dikonversi ke mm (A×10)
                  <br />• B = Lebar produk (cm), dalam formula dikonversi ke mm (B×10)
                  <br />• C = Tinggi produk (cm), dalam formula dikonversi ke mm (C×10)
                  <br />• Semua perhitungan dalam mm, hasil akhir dikonversi ke cm
                  <br />• Formula disesuaikan dengan tipe box yang dipilih
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* History Perhitungan */}
      {calculationHistory.length > 0 && (
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg">
                <Icon icon="mdi:history" className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Riwayat Perhitungan
                </h3>
                <p className="text-sm text-gray-600">
                  {calculationHistory.length} perhitungan terakhir
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
            >
              <Icon icon="mdi:trash-can-outline" className="w-4 h-4 mr-2" />
              Hapus History
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table
              headers={['Waktu', 'Model Box', 'Dimensi Produk', 'Hasil Panjang', 'Hasil Lebar', 'Bahan']}
              striped
            >
              {calculationHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-sm text-gray-600">{item.timestamp}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.boxModel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">
                      {item.productDimensions.panjang}×{item.productDimensions.lebar}×{item.productDimensions.tinggi}cm
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {item.result.panjang} cm
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {item.result.lebar} cm
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {item.result.materialLength}×{item.result.materialWidth}cm
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </Card>
      )}

      {/* Informasi Tambahan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Cara Penggunaan
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Masukkan dimensi produk dalam centimeter (cm)</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Pilih model box yang sesuai dengan kebutuhan</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Klik tombol "Hitung" untuk melihat hasil perhitungan</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Hasil perhitungan otomatis tersimpan dalam riwayat</span>
            </li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="mdi:lightbulb-on" className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Tips & Catatan
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Pastikan dimensi produk sudah diukur dengan akurat</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Tersedia 10 model box dengan formula perhitungan yang berbeda</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Ukuran bahan sudah termasuk allowance untuk overlap</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Hasil perhitungan bisa diexport untuk keperluan dokumentasi</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}