'use client'

import { Material } from '@/lib/mockData'

interface MaterialStockChartProps {
  materials: Material[]
}

export default function MaterialStockChart({ materials }: MaterialStockChartProps) {
  // Ambil 5 material dengan stock terendah
  const lowStockMaterials = [...materials]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  const maxStock = Math.max(...lowStockMaterials.map(m => m.stock))

  return (
    <div className="space-y-4">
      {lowStockMaterials.map((material) => {
        const percentage = (material.stock / maxStock) * 100
        const isCritical = material.stock < 100
        const isWarning = material.stock < 500 && material.stock >= 100
        
        return (
          <div key={material.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{material.name}</h4>
                <p className="text-sm text-gray-500">{material.type} • {material.substance}</p>
              </div>
              <div className="text-right">
                <div className={`font-medium ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
                  {material.stock} {material.unit}
                </div>
                <div className="text-xs text-gray-500">
                  Rp {material.price.toLocaleString()}/unit
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Minimum: {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NORMAL'}</span>
              <span>Supplier: {material.supplier}</span>
            </div>
          </div>
        )
      })}

      {lowStockMaterials.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No materials found</p>
        </div>
      )}
    </div>
  )
}