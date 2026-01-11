'use client'

import { useState, useEffect } from 'react'
import Modal from './UI/Modal'
import Input from './UI/Input'
import Select from './UI/Select'
import Button from './UI/Button'
import { Material } from '../lib/mockData'

interface MaterialFormProps {
  material?: Material | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function MaterialForm({ material, isOpen, onClose, onSubmit }: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Duplek',
    substance: '',
    fluteType: 'E-FLUTE',
    gramasi: '',
    ukuran: '',
    stock: 0,
    unit: 'sheets',
    price: 0,
    supplier: ''
  })

  useEffect(() => {
    if (material) {
      setFormData(material)
    } else {
      setFormData({
        name: '',
        type: 'Duplek',
        substance: '',
        fluteType: 'E-FLUTE',
        gramasi: '',
        ukuran: '',
        stock: 0,
        unit: 'sheets',
        price: 0,
        supplier: ''
      })
    }
  }, [material])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  const materialTypes = [
    { value: 'Duplek', label: 'Duplek' },
    { value: 'Kraft', label: 'Kraft' },
    { value: 'Sheet', label: 'Sheet' },
    { value: 'Medium', label: 'Medium' }
  ]

  const fluteTypes = [
    { value: 'E-FLUTE', label: 'E-FLUTE' },
    { value: 'B-FLUTE', label: 'B-FLUTE' },
    { value: 'C-FLUTE', label: 'C-FLUTE' },
    { value: 'CB-FLUTE', label: 'CB-FLUTE' }
  ]

  const units = [
    { value: 'sheets', label: 'Sheets' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'meters', label: 'Meters' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? 'Edit Material' : 'Add New Material'}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="mdi:check"
            onClick={handleSubmit}
          >
            {material ? 'Update Material' : 'Add Material'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Material Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter material name"
            required
          />

          <Select
            label="Type *"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            options={materialTypes}
            required
          />

          <Input
            label="Substance *"
            value={formData.substance}
            onChange={(e) => setFormData({...formData, substance: e.target.value})}
            placeholder="e.g., 125K/125M/125K"
            required
          />

          <Select
            label="Flute Type *"
            value={formData.fluteType}
            onChange={(e) => setFormData({...formData, fluteType: e.target.value})}
            options={fluteTypes}
            required
          />

          <Input
            label="Gramasi"
            value={formData.gramasi}
            onChange={(e) => setFormData({...formData, gramasi: e.target.value})}
            placeholder="e.g., 250 GSM"
          />

          <Input
            label="Ukuran *"
            value={formData.ukuran}
            onChange={(e) => setFormData({...formData, ukuran: e.target.value})}
            placeholder="e.g., 900 x 1200"
            required
          />

          <Select
            label="Unit *"
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
            options={units}
            required
          />

          <Input
            label="Supplier *"
            value={formData.supplier}
            onChange={(e) => setFormData({...formData, supplier: e.target.value})}
            placeholder="Enter supplier name"
            required
          />

          <Input
            label="Stock *"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
            required
            min="0"
          />

          <Input
            label="Price (Rp) *"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
            required
            min="0"
          />
        </div>

        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes about this material..."
          />
        </div>
      </form>
    </Modal>
  )
}