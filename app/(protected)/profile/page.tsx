// app/(protected)/profile/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPersonalModal, setShowPersonalModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    country: '',
    cityState: '',
    postalCode: '',
    taxId: '',
    position: '',
    department: ''
  })

  const [tempData, setTempData] = useState({})

  // ===== SWEETALERT CONFIG =====
  const showSuccessAlert = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#10B981',
      confirmButtonText: 'OK',
      timer: 3000,
      timerProgressBar: true,
    })
  }

  const showErrorAlert = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'OK',
    })
  }

  // ===== FETCH PROFILE DATA =====
  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Get current user from localStorage
      const userData = localStorage.getItem('user')
      let userProfile = {
        firstName: 'Musharof',
        lastName: 'Chowdhury',
        email: 'admin@tokodus.com',
        phone: '+09 363 398 46',
        bio: 'Team Manager',
        country: 'United States',
        cityState: 'Phoenix, Arizona, United States',
        postalCode: 'ERT 2489',
        taxId: 'AS4568384',
        position: 'Team Manager',
        department: 'Management'
      }

      if (userData) {
        const user = JSON.parse(userData)
        userProfile = {
          ...userProfile,
          ...user
        }
      }

      setProfileData(userProfile)
      
    } catch (err) {
      console.error('❌ Error fetching profile:', err)
      showErrorAlert('Error!', 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // ===== HANDLERS =====
  const handleOpenPersonalModal = () => {
    setTempData({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone,
      bio: profileData.bio,
      position: profileData.position
    })
    setShowPersonalModal(true)
  }

  const handleOpenAddressModal = () => {
    setTempData({
      country: profileData.country,
      cityState: profileData.cityState,
      postalCode: profileData.postalCode,
      taxId: profileData.taxId
    })
    setShowAddressModal(true)
  }

  const handleTempDataChange = (field, value) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSavePersonal = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!tempData.firstName?.trim()) {
        showErrorAlert('Validation Error', 'First name is required')
        return
      }

      if (!tempData.email?.trim()) {
        showErrorAlert('Validation Error', 'Email is required')
        return
      }

      // Update profile data
      const updatedProfile = {
        ...profileData,
        ...tempData,
        username: `${tempData.firstName} ${tempData.lastName}`.trim()
      }
      
      setProfileData(updatedProfile)
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedProfile))

      // Show success message
      showSuccessAlert('Success!', 'Personal information updated successfully!')
      
      setShowPersonalModal(false)
      
    } catch (err) {
      console.error('❌ Error saving profile:', err)
      showErrorAlert('Error!', 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    try {
      setSaving(true)

      // Update profile data
      const updatedProfile = {
        ...profileData,
        ...tempData
      }
      
      setProfileData(updatedProfile)
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedProfile))

      // Show success message
      showSuccessAlert('Success!', 'Address information updated successfully!')
      
      setShowAddressModal(false)
      
    } catch (err) {
      console.error('❌ Error saving address:', err)
      showErrorAlert('Error!', 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setSaving(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showSuccessAlert('Success!', 'Password changed successfully!')
      setShowPasswordModal(false)
      
    } catch (err) {
      showErrorAlert('Error!', 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // ===== MODAL FOOTERS =====
  const personalModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setShowPersonalModal(false)}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSavePersonal}
        loading={saving}
        disabled={saving}
        icon="mdi:content-save"
      >
        Save Changes
      </Button>
    </div>
  )

  const addressModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setShowAddressModal(false)}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSaveAddress}
        loading={saving}
        disabled={saving}
        icon="mdi:content-save"
      >
        Save Address
      </Button>
    </div>
  )

  const passwordModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setShowPasswordModal(false)}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleChangePassword}
        loading={saving}
        disabled={saving}
      >
        Change Password
      </Button>
    </div>
  )

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Icon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== RENDER INFO FIELD =====
  const renderInfoField = (label, value, icon = null) => (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {icon && <Icon icon={icon} className="w-4 h-4" />}
        {label}
      </p>
      <p className="text-gray-900 font-medium">
        {value || `No ${label.toLowerCase()}`}
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Profile Card */}
        <Card className="mb-8 bg-white shadow-md border border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Icon 
                  icon="mdi:account" 
                  className="w-12 h-12 text-white" 
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200">
                <Icon icon="mdi:camera" className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <p className="text-gray-600 mb-2 flex items-center gap-2">
                <Icon icon="mdi:briefcase" className="w-4 h-4" />
                {profileData.position} | {profileData.country}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Icon icon="mdi:map-marker" className="w-4 h-4" />
                {profileData.cityState}
              </p>
              
              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Icon icon="mdi:email" className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon icon="mdi:phone" className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">{profileData.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <Card className="border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                  <Icon icon="mdi:account-details" className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenPersonalModal}
                icon="mdi:pencil"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInfoField("First Name", profileData.firstName)}
                {renderInfoField("Last Name", profileData.lastName)}
              </div>

              {renderInfoField("Email address", profileData.email, "mdi:email")}
              {renderInfoField("Phone", profileData.phone, "mdi:phone")}
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Bio</p>
                <p className="text-gray-900 font-medium">
                  {profileData.bio || "No bio provided"}
                </p>
              </div>
            </div>
          </Card>

          {/* Address Card */}
          <Card className="border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
                  <Icon icon="mdi:map-marker" className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Address</h2>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenAddressModal}
                icon="mdi:pencil"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              {renderInfoField("Country", profileData.country, "mdi:earth")}
              {renderInfoField("City/State", profileData.cityState, "mdi:city")}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInfoField("Postal Code", profileData.postalCode, "mdi:post")}
                {renderInfoField("TAX ID", profileData.taxId, "mdi:card-account-details")}
              </div>
            </div>
          </Card>
        </div>


        {/* ===== MODAL EDIT PERSONAL INFORMATION ===== */}
        <Modal
          isOpen={showPersonalModal}
          onClose={() => !saving && setShowPersonalModal(false)}
          title="Edit Personal Information"
          size="lg"
          footer={personalModalFooter}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={tempData.firstName || ''}
                onChange={(e) => handleTempDataChange('firstName', e.target.value)}
                placeholder="Enter first name"
                required
              />
              
              <Input
                label="Last Name"
                value={tempData.lastName || ''}
                onChange={(e) => handleTempDataChange('lastName', e.target.value)}
                placeholder="Enter last name"
              />
            </div>

            <Input
              label="Email address *"
              type="email"
              value={tempData.email || ''}
              onChange={(e) => handleTempDataChange('email', e.target.value)}
              placeholder="Enter email address"
              required
              icon="mdi:email"
            />

            <Input
              label="Phone"
              type="tel"
              value={tempData.phone || ''}
              onChange={(e) => handleTempDataChange('phone', e.target.value)}
              placeholder="Enter phone number"
              icon="mdi:phone"
            />

            <Input
              label="Position"
              value={tempData.position || ''}
              onChange={(e) => handleTempDataChange('position', e.target.value)}
              placeholder="Enter your position"
              icon="mdi:briefcase"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={tempData.bio || ''}
                onChange={(e) => handleTempDataChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Brief description about yourself and your role
              </p>
            </div>
          </div>
        </Modal>

        {/* ===== MODAL EDIT ADDRESS ===== */}
        <Modal
          isOpen={showAddressModal}
          onClose={() => !saving && setShowAddressModal(false)}
          title="Edit Address Information"
          size="md"
          footer={addressModalFooter}
        >
          <div className="space-y-4">
            <Select
              label="Country *"
              value={tempData.country || ''}
              onChange={(e) => handleTempDataChange('country', e.target.value)}
              options={[
                { value: 'United States', label: 'United States' },
                { value: 'Indonesia', label: 'Indonesia' },
                { value: 'Singapore', label: 'Singapore' },
                { value: 'Malaysia', label: 'Malaysia' },
                { value: 'Australia', label: 'Australia' },
                { value: 'United Kingdom', label: 'United Kingdom' },
                { value: 'Japan', label: 'Japan' },
                { value: 'South Korea', label: 'South Korea' }
              ]}
              required
              icon="mdi:earth"
            />

            <Input
              label="City/State *"
              value={tempData.cityState || ''}
              onChange={(e) => handleTempDataChange('cityState', e.target.value)}
              placeholder="Enter city and state"
              required
              icon="mdi:city"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                value={tempData.postalCode || ''}
                onChange={(e) => handleTempDataChange('postalCode', e.target.value)}
                placeholder="Enter postal code"
                icon="mdi:post"
              />

              <Input
                label="TAX ID"
                value={tempData.taxId || ''}
                onChange={(e) => handleTempDataChange('taxId', e.target.value)}
                placeholder="Enter TAX ID"
                icon="mdi:card-account-details"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
              <p className="text-sm text-blue-700">
                <Icon icon="mdi:information" className="w-4 h-4 inline mr-1" />
                Address information is used for billing and shipping purposes.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}