'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function DemoPage() {
  useEffect(() => {
    // Load widget script dynamically on client side
    const script = document.createElement('script')
    script.src = '/widget.js'
    script.setAttribute('data-widget-id', 'cmhzel1mf000becfz1ax6lshv')
    document.head.appendChild(script)
    
    return () => {
      // Cleanup
      document.head.removeChild(script)
    }
  }, [])
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-900">The Agent's Agent</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/features" className="text-gray-600 hover:text-primary-600">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-primary-600">
              Pricing
            </Link>
            <Link href="/demo" className="text-primary-600 font-medium">
              Demo
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-primary-600">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See the Widget in Action
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            This is a live demo of how the AI chat widget would appear on your real estate website.
            Try starting a conversation to see how it captures and qualifies leads.
          </p>
        </div>

        {/* Demo Website Mockup */}
        <div className="max-w-4xl mx-auto pb-20">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Mock Browser Header */}
            <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600">
                https://your-realty-website.com
              </div>
            </div>

            {/* Mock Website Content */}
            <div className="p-8 bg-white relative">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Premium Properties in Downtown
                </h3>
                <p className="text-gray-600 mb-6">
                  Discover luxury condos and apartments in the heart of the city
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
                  View All Properties
                </button>
              </div>

              {/* Property Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600">Property Image</span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold mb-2">Luxury Condo - $850,000</h4>
                    <p className="text-gray-600 text-sm">2 bed, 2 bath • Downtown</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600">Property Image</span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold mb-2">Modern Apartment - $650,000</h4>
                    <p className="text-gray-600 text-sm">1 bed, 1 bath • Midtown</p>
                  </div>
                </div>
              </div>

              {/* Widget Placeholder */}
              <div className="fixed bottom-6 right-6">
                <div className="bg-primary-600 text-white p-4 rounded-lg shadow-lg cursor-pointer hover:bg-primary-700 transition-colors">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">Chat with AI Agent</span>
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    Ask about properties, pricing, or schedule a viewing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Instructions */}
          <div className="mt-8 bg-white rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">How it Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Visitor Clicks</h4>
                <p className="text-sm text-gray-600">
                  A website visitor clicks on your chat widget
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">AI Engages</h4>
                <p className="text-sm text-gray-600">
                  AI starts a conversation and asks qualifying questions
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Lead Captured</h4>
                <p className="text-sm text-gray-600">
                  Qualified lead appears in your dashboard with conversation history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Add This to Your Website?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Get started in minutes with our simple setup process.
          </p>
          <Link
            href="/signup"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700"
          >
            Create Your Widget
          </Link>
        </div>
      </div>

      {/* Widget container - script loaded dynamically */}
      <div id="realestate-ai-widget"></div>
    </div>
  )
}