'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  intent: string | null
  qualificationScore: number | null
  notes: string | null
}

interface LeadDetailFormProps {
  lead: Lead
}

export default function LeadDetailForm({ lead }: LeadDetailFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    intent: lead.intent || '',
    qualificationScore: lead.qualificationScore || 0,
    notes: lead.notes || ''
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsEditing(false)
        router.refresh() // Refresh the page to show updated data
      } else {
        alert('Failed to save changes')
      }
    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Save error:', error)
      }
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      intent: lead.intent || '',
      qualificationScore: lead.qualificationScore || 0,
      notes: lead.notes || ''
    })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Contact Details</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{lead.name || 'Not provided'}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{lead.email || 'Not provided'}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{lead.phone || 'Not provided'}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Intent</dt>
            <dd className="mt-1">
              {lead.intent ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lead.intent === 'buying' ? 'bg-blue-100 text-blue-800' :
                  lead.intent === 'selling' ? 'bg-green-100 text-green-800' :
                  lead.intent === 'renting' ? 'bg-yellow-100 text-yellow-800' :
                  lead.intent === 'investing' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.intent}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Not specified</span>
              )}
            </dd>
          </div>
          
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Qualification Score</dt>
            <dd className="mt-1 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                (lead.qualificationScore || 0) >= 75 ? 'bg-green-100 text-green-800' :
                (lead.qualificationScore || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {Math.round(lead.qualificationScore || 0)}%
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                <div
                  className={`h-2 rounded-full ${
                    (lead.qualificationScore || 0) >= 75 ? 'bg-green-500' :
                    (lead.qualificationScore || 0) >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, lead.qualificationScore || 0))}%` }}
                />
              </div>
            </dd>
          </div>
        </div>

        {lead.notes && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{lead.notes}</dd>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Edit Contact Details</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Intent</label>
          <select
            value={formData.intent}
            onChange={(e) => setFormData(prev => ({ ...prev, intent: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Not specified</option>
            <option value="buying">Buying</option>
            <option value="selling">Selling</option>
            <option value="renting">Renting</option>
            <option value="investing">Investing</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Qualification Score ({formData.qualificationScore}%)
          </label>
          <div className="mt-1 flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.qualificationScore}
              onChange={(e) => setFormData(prev => ({ ...prev, qualificationScore: parseInt(e.target.value) }))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={formData.qualificationScore}
              onChange={(e) => setFormData(prev => ({ ...prev, qualificationScore: parseInt(e.target.value) || 0 }))}
              className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </div>
          <div className="mt-2 flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                formData.qualificationScore >= 75 ? 'bg-green-500' :
                formData.qualificationScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, formData.qualificationScore))}%` }}
            />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Add any notes about this lead..."
          />
        </div>
      </div>
    </div>
  )
}