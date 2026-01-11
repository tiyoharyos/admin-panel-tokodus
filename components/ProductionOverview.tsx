'use client'

import { ProductionJob } from '@/lib/mockData'

interface ProductionOverviewProps {
  jobs: ProductionJob[]
}

export default function ProductionOverview({ jobs }: ProductionOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'queued': return 'bg-yellow-500'
      case 'paused': return 'bg-orange-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Running'
      case 'queued': return 'Queued'
      case 'paused': return 'Paused'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No production jobs found</p>
        </div>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-medium text-gray-900">Job #{job.id}</h4>
                <p className="text-sm text-gray-500">Order: {job.orderId}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)} text-white`}>
                {getStatusText(job.status)}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <div>
                  <div className="text-gray-500">Operator</div>
                  <div className="font-medium">{job.operator}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <div className="text-gray-500">Quantity</div>
                  <div className="font-medium">{job.quantity.toLocaleString()} pcs</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                <div>
                  <div className="text-gray-500">Machine</div>
                  <div className="font-medium">{job.machineId}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                <div>
                  <div className="text-gray-500">Start Date</div>
                  <div className="font-medium">{formatDate(job.startTime)}</div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}