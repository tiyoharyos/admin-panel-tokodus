'use client'

import { useState, useEffect } from 'react'

// Mock data
const mockProductionJobs = [
  {
    id: '1',
    orderId: 'ORD-001',
    designInputId: 'design-001',
    machineId: 'MACH-001',
    status: 'running',
    progress: 75,
    quantity: 1000,
    operator: 'Budi Santoso',
    startTime: '2024-01-14 08:30',
    estimatedEndTime: '2024-01-15 17:00'
  },
  {
    id: '2',
    orderId: 'ORD-002',
    designInputId: 'design-002',
    machineId: 'MACH-002',
    status: 'queued',
    progress: 0,
    quantity: 500,
    operator: 'Siti Rahayu',
    startTime: '2024-01-15 09:00',
    estimatedEndTime: '2024-01-15 13:00'
  }
]

const mockMachineLayouts = [
  {
    id: '1',
    machineId: 'MACH-001',
    machineName: 'Machine 1',
    nalkX: 10,
    nalkY: 5,
    totalNak: 50,
    wasteMm2: 1200,
    efficiency: 92.5
  }
]

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState('running')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    // Filter jobs based on active tab
    const filteredJobs = mockProductionJobs.filter(job => {
      switch (activeTab) {
        case 'running': return job.status === 'running'
        case 'queued': return job.status === 'queued'
        case 'paused': return job.status === 'paused'
        case 'completed': return job.status === 'completed'
        default: return true
      }
    })
    setJobs(filteredJobs)
  }, [activeTab])

  const tabs = [
    { id: 'all', label: 'All Jobs', count: mockProductionJobs.length },
    { id: 'running', label: 'Running', count: mockProductionJobs.filter(j => j.status === 'running').length },
    { id: 'queued', label: 'Queued', count: mockProductionJobs.filter(j => j.status === 'queued').length },
    { id: 'paused', label: 'Paused', count: mockProductionJobs.filter(j => j.status === 'paused').length },
    { id: 'completed', label: 'Completed', count: mockProductionJobs.filter(j => j.status === 'completed').length }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'queued': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage production jobs in real-time
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order/Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine/Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Order: {job.orderId}</div>
                    <div className="text-sm text-gray-500">Design: {job.designInputId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.machineId}</div>
                    <div className="text-sm text-gray-500">{job.operator}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.quantity.toLocaleString()} pcs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{job.progress}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Start: {job.startTime.split(' ')[0]}</div>
                    <div className="text-sm text-gray-500">Est. End: {job.estimatedEndTime.split(' ')[0]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      View
                    </button>
                    {job.status === 'queued' && (
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        Start
                      </button>
                    )}
                    {job.status === 'running' && (
                      <>
                        <button className="text-yellow-600 hover:text-yellow-900 mr-3">
                          Pause
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          Complete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Job Button */}
      <div className="mt-8">
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          + Schedule New Production Job
        </button>
      </div>
    </div>
  )
}