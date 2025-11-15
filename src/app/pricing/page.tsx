import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
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
            <Link href="/pricing" className="text-primary-600 font-medium">
              Pricing
            </Link>
            <Link href="/demo" className="text-gray-600 hover:text-primary-600">
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
        <div className="text-center py-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="text-primary-600"> Pricing</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the plan that works for your business. 
            All plans include unlimited widgets and conversations.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 pb-20">
          {/* Starter Plan */}
          <div className="border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Starter</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              $29
              <span className="text-lg text-gray-500 font-normal">/month</span>
            </div>
            <p className="text-gray-600 mb-8">Perfect for individual agents</p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Up to 2 widgets
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                500 conversations/month
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic analytics
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email support
              </li>
            </ul>

            <Link
              href="/signup"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 text-center block"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="border-2 border-primary-600 rounded-lg p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              $79
              <span className="text-lg text-gray-500 font-normal">/month</span>
            </div>
            <p className="text-gray-600 mb-8">Great for growing teams</p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Up to 10 widgets
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                2,500 conversations/month
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced analytics
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom branding
              </li>
            </ul>

            <Link
              href="/signup"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 text-center block"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              $199
              <span className="text-lg text-gray-500 font-normal">/month</span>
            </div>
            <p className="text-gray-600 mb-8">For large organizations</p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited widgets
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited conversations
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced analytics & reporting
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 phone support
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                API access
              </li>
            </ul>

            <Link
              href="/signup"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 text-center block"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center pb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="max-w-3xl mx-auto text-left space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">
                Yes! All plans include a 14-day free trial. No credit card required.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">
                Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">What happens if I exceed my conversation limit?</h4>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional conversations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}