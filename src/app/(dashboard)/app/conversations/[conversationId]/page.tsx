'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, User, Bot, Phone, Mail, MessageCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  text: string
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM'
  createdAt: string
}

interface Lead {
  id: string
  name?: string
  email?: string
  phone?: string
  intent?: string
  qualificationScore: number
  createdAt: string
}

interface Conversation {
  id: string
  createdAt: string
  updatedAt: string
  messages: Message[]
  lead?: Lead
  widget: {
    name: string
  }
}

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConversation()
  }, [conversationId])

  async function fetchConversation() {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation)
      } else {
        setError('Conversation not found')
      }
    } catch {
      setError('Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Conversation Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/app/conversations"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Conversations
          </Link>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/app/conversations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Conversations
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Conversation Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Started on {formatDate(conversation.createdAt)} • {conversation.widget.name}
            </p>
          </div>
          
          {conversation.lead && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(conversation.lead.qualificationScore)}`}>
              {conversation.lead.qualificationScore}% qualified
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Conversation
              </h2>
            </div>
            
            <div className="p-4 space-y-4 max-h-[32rem] overflow-y-auto">
              {conversation.messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.senderType === 'VISITOR' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-sm px-4 py-2 rounded-lg ${
                    message.senderType === 'VISITOR' 
                      ? 'bg-primary-600 text-white' 
                      : message.senderType === 'SYSTEM'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    <div className="flex items-center mb-1">
                      {message.senderType === 'VISITOR' ? (
                        <User className="w-3 h-3 mr-1" />
                      ) : (
                        <Bot className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.senderType === 'VISITOR' ? 'Visitor' : message.senderType === 'SYSTEM' ? 'AI Assistant' : 'Agent'}
                      </span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Information */}
        <div className="space-y-6">
          {conversation.lead ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lead Information</h3>
                <Link
                  href={`/app/leads/${conversation.lead.id}`}
                  className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                >
                  View Lead Details →
                </Link>
              </div>
              
              <div className="space-y-4">
                {conversation.lead.name && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{conversation.lead.name}</p>
                    </div>
                  </div>
                )}
                
                {conversation.lead.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{conversation.lead.email}</p>
                    </div>
                  </div>
                )}
                
                {conversation.lead.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{conversation.lead.phone}</p>
                    </div>
                  </div>
                )}
                
                {conversation.lead.intent && (
                  <div>
                    <p className="text-sm text-gray-500">Intent</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {conversation.lead.intent}
                    </span>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Qualification Score</p>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{ width: `${conversation.lead.qualificationScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {conversation.lead.qualificationScore}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(conversation.lead.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Lead Generated</h3>
              <p className="text-sm text-yellow-700">
                This conversation hasn't generated enough qualification data yet.
              </p>
            </div>
          )}
          
          {/* Conversation Metadata */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Messages</p>
                <p className="font-medium">{conversation.messages.length}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Widget</p>
                <p className="font-medium">{conversation.widget.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">{formatDate(conversation.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Activity</p>
                <p className="font-medium">{formatDate(conversation.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}