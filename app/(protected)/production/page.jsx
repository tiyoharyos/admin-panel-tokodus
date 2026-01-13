// app/(protected)/production/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'

const mockProductionJobs = [
  {
    id: '1',
    orderId: 'ORD-001',
    designInputId: 'design-001',
    machineId: 'MACH-001',
    machineName: 'Heidelberg Speedmaster',
    status: 'running',
    progress: 75,
    quantity: 1000,
    completed: 750,
    operator: 'Budi Santoso',
    startTime: '2024-01-14 08:30',
    estimatedEndTime: '2024-01-15 17:00',
    priority: 'high',
    material: 'Duplek + Kraft'
  },
  {
    id: '2',
    orderId: 'ORD-002',
    designInputId: 'design-002',
    machineId: 'MACH-002',
    machineName: 'Konica Minolta',
    status: 'queued',
    progress: 0,
    quantity: 500,
    completed: 0,
    operator: 'Siti Rahayu',
    startTime: '2024-01-15 09:00',
    estimatedEndTime: '2024-01-15 13:00',
    priority: 'medium',
    material: 'Corrugated Single'
  },
  {
    id: '3',
    orderId: 'ORD-003',
    designInputId: 'design-003',
    machineId: 'MACH-003',
    machineName: 'Roland VersaUV',
    status: 'paused',
    progress: 40,
    quantity: 2000,
    completed: 800,
    operator: 'Ahmad Fauzi',
    startTime: '2024-01-13 10:00',
    estimatedEndTime: '2024-01-16 15:00',
    priority: 'low',
    material: 'Sheet Kraft'
  },
  {
    id: '4',
    orderId: 'ORD-004',
    designInputId: 'design-004',
    machineId: 'MACH-001',
    machineName: 'Heidelberg Speedmaster',
    status: 'completed',
    progress: 100,
    quantity: 1500,
    completed: 1500,
    operator: 'Budi Santoso',
    startTime: '2024-01-12 09:00',
    estimatedEndTime: '2024-01-13 18:00',
    priority: 'high',
    material: 'White Top Kraft'
  }
]

const mockMachines = [
  { id: 'MACH-001', name: 'Heidelberg Speedmaster', type: 'Offset', status: 'running' },
  { id: 'MACH-002', name: 'Konica Minolta', type: 'Digital', status: 'idle' },
  { id: 'MACH-003', name: 'Roland VersaUV', type: 'UV Flatbed', status: 'maintenance' },
  { id: 'MACH-004', name: 'Epson SureColor', type: 'Inkjet', status: 'idle' }
]

export default function ProductionPage() {
  const [jobs, setJobs] = useState(mockProductionJobs)
  const [machines, setMachines] = useState(mockMachines)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false)

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.orderId.toLowerCase().includes(search.toLowerCase()) ||
      job.machineName.toLowerCase().includes(search.toLowerCase()) ||
      job.operator.toLowerCase().includes(search.toLowerCase())
    
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'running' ? job.status === 'running' :
      activeTab === 'queued' ? job.status === 'queued' :
      activeTab === 'paused' ? job.status === 'paused' :
      activeTab === 'completed' ? job.status === 'completed' : true
    
    return matchesSearch && matchesTab
  })

  const tabs = [
    { id: 'all', label: 'All Jobs', count: jobs.length },
    { id: 'running', label: 'Running', count: jobs.filter(j => j.status === 'running').length },
    { id: 'queued', label: 'Queued', count: jobs.filter(j => j.status === 'queued').length },
    { id: 'paused', label: 'Paused', count: jobs.filter(j => j.status === 'paused').length },
    { id: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'completed').length }
  ]

  const getStatusVariant = (status) => {
    switch (status) {
      case 'running': return 'success'
      case 'queued': return 'warning'
      case 'paused': return 'info'
      case 'completed': return 'primary'
      default: return 'gray'
    }
  }

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'gray'
    }
  }

  const getMachineStatusVariant = (status) => {
    switch (status) {
      case 'running': return 'success'
      case 'idle': return 'warning'
      case 'maintenance': return 'danger'
      default: return 'gray'
    }
  }

  const handleViewJobDetails = (job) => {
    setSelectedJob(job)
    setIsJobModalOpen(true)
  }

  const handleStartJob = (id) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: 'running' } : job
    ))
  }

  const handlePauseJob = (id) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: 'paused' } : job
    ))
  }

  const handleCompleteJob = (id) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, status: 'completed', progress: 100, completed: job.quantity } : job
    ))
  }

  const handleCancelJob = (id) => {
    if (window.confirm('Are you sure you want to cancel this job?')) {
      setJobs(jobs.filter(job => job.id !== id))
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const calculateTimeRemaining = (startTime, endTime, progress) => {
    if (progress >= 100) return 'Completed'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()
    const totalDuration = end - start
    const elapsed = now - start
    const remaining = totalDuration - elapsed
    
    if (remaining <= 0) return 'Overdue'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    return `${hours} hours remaining`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data produksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:factory" className="w-8 h-8" />
              Production Management
            </h1>
            <p className="opacity-90 mt-1">Monitor and manage production jobs in real-time</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:clock">
                Active: {jobs.filter(j => j.status === 'running').length} Jobs
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Completed: {jobs.filter(j => j.status === 'completed').length}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => setIsNewJobModalOpen(true)}
            variant="success"
            icon="mdi:plus"
            className="w-full md:w-auto"
          >
            Schedule New Job
          </Button>
        </div>
      </Card>

      {/* Machine Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {machines.map((machine) => (
          <Card key={machine.id} hoverable className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{machine.id}</p>
                <p className="text-xs text-gray-500">{machine.name}</p>
              </div>
              <Badge variant={getMachineStatusVariant(machine.status)}>
                {machine.status}
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-600">Type: {machine.type}</p>
              <p className="text-xs text-gray-600 mt-1">
                Jobs: {jobs.filter(j => j.machineId === machine.id && j.status !== 'completed').length}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          
          <div className="w-full md:w-64">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} hoverable className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(job.priority)} size="sm">
                        {job.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-medium text-gray-900">{job.orderId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Machine</p>
                        <p className="font-medium text-gray-900">{job.machineName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Operator</p>
                        <p className="font-medium text-gray-900">{job.operator}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Material</p>
                        <p className="font-medium text-gray-900">{job.material}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress: {job.completed}/{job.quantity} pcs</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            job.status === 'running' ? 'bg-green-500' :
                            job.status === 'paused' ? 'bg-blue-500' :
                            job.status === 'completed' ? 'bg-indigo-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {calculateTimeRemaining(job.startTime, job.estimatedEndTime, job.progress)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewJobDetails(job)}
                        icon="mdi:eye"
                        fullWidth
                      >
                        View
                      </Button>
                      
                      {job.status === 'queued' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStartJob(job.id)}
                          icon="mdi:play"
                          fullWidth
                        >
                          Start
                        </Button>
                      )}
                      
                      {job.status === 'running' && (
                        <>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handlePauseJob(job.id)}
                            icon="mdi:pause"
                            fullWidth
                          >
                            Pause
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCompleteJob(job.id)}
                            icon="mdi:check"
                            fullWidth
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStartJob(job.id)}
                          icon="mdi:play"
                          fullWidth
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelJob(job.id)}
                      icon="mdi:close"
                      className="text-red-600 hover:text-red-700"
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CustomIcon 
              icon="mdi:factory-off" 
              className="w-12 h-12 text-gray-400 mx-auto mb-3" 
            />
            <p className="text-gray-600 font-medium">No production jobs found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Production Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(j => j.status === 'completed').reduce((sum, job) => sum + job.completed, 0).toLocaleString()} pcs
              </p>
            </div>
            <CustomIcon icon="mdi:chart-bar" className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Machine Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((jobs.filter(j => j.status === 'running').length / machines.length) * 100)}%
              </p>
            </div>
            <CustomIcon icon="mdi:chart-pie" className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Completion Time</p>
              <p className="text-2xl font-bold text-gray-900">4.2 hours</p>
            </div>
            <CustomIcon icon="mdi:clock-outline" className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Job Details Modal */}
      <Modal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title="Production Job Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsJobModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => alert('Edit job')}>
              Edit Job
            </Button>
          </div>
        }
      >
        {selectedJob && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job #{selectedJob.id}</h3>
                <p className="text-sm text-gray-500">Order: {selectedJob.orderId}</p>
              </div>
              <Badge variant={getStatusVariant(selectedJob.status)}>
                {selectedJob.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Machine</h4>
                <p className="text-gray-900">{selectedJob.machineName} ({selectedJob.machineId})</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Operator</h4>
                <p className="text-gray-900">{selectedJob.operator}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Design Input</h4>
                <p className="text-gray-900">{selectedJob.designInputId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Material</h4>
                <p className="text-gray-900">{selectedJob.material}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Quantity</h4>
                <p className="text-gray-900">{selectedJob.quantity.toLocaleString()} pcs</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Completed</h4>
                <p className="text-gray-900">{selectedJob.completed.toLocaleString()} pcs</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Start Time</h4>
                <p className="text-gray-900">{formatDate(selectedJob.startTime)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Estimated End</h4>
                <p className="text-gray-900">{formatDate(selectedJob.estimatedEndTime)}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Progress</h4>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    selectedJob.status === 'running' ? 'bg-green-500' :
                    selectedJob.status === 'paused' ? 'bg-blue-500' :
                    selectedJob.status === 'completed' ? 'bg-indigo-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${selectedJob.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{selectedJob.progress}% complete</span>
                <span>{selectedJob.completed}/{selectedJob.quantity} pcs</span>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <CustomIcon icon="mdi:information" />
                Job Information
              </h4>
              <p className="text-sm text-blue-700">
                {selectedJob.status === 'running' ? 'This job is currently in production.' :
                 selectedJob.status === 'queued' ? 'This job is queued and waiting to start.' :
                 selectedJob.status === 'paused' ? 'This job is paused. Resume when ready.' :
                 'This job has been completed successfully.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* New Job Modal */}
      <Modal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        title="Schedule New Production Job"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsNewJobModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => alert('Job scheduled')}>
              Schedule Job
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Order ID *"
              options={[
                { value: 'ORD-001', label: 'ORD-001 - PT Sinar Jaya' },
                { value: 'ORD-002', label: 'ORD-002 - CV Maju Bersama' },
                { value: 'ORD-003', label: 'ORD-003 - UD Berkah' },
                { value: 'ORD-004', label: 'ORD-004 - PT Indah Selalu' },
                { value: 'ORD-005', label: 'ORD-005 - CV Jaya Abadi' }
              ]}
            />
            
            <Select
              label="Design Input *"
              options={[
                { value: 'design-001', label: 'Design Packaging A' },
                { value: 'design-002', label: 'Brand B Packaging' },
                { value: 'design-003', label: 'Product C Box Design' },
                { value: 'design-004', label: 'Premium Packaging D' },
                { value: 'design-005', label: 'Retail Box E' }
              ]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Machine *"
              options={machines.map(machine => ({
                value: machine.id,
                label: `${machine.id} - ${machine.name} (${machine.status})`
              }))}
            />
            
            <Select
              label="Operator *"
              options={[
                { value: 'budi', label: 'Budi Santoso' },
                { value: 'siti', label: 'Siti Rahayu' },
                { value: 'ahmad', label: 'Ahmad Fauzi' },
                { value: 'rina', label: 'Rina Wijaya' }
              ]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantity *"
              type="number"
              placeholder="Enter quantity"
            />
            
            <Select
              label="Priority"
              options={[
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' }
              ]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time *"
              type="datetime-local"
            />
            
            <Input
              label="Estimated End Time"
              type="datetime-local"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes or special instructions..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}