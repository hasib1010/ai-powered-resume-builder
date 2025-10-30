// app/(dashboard)/dashboard/billing/page.jsx
'use client'

import { useState } from 'react'
import { CheckCircle, Sparkles, CreditCard, Calendar, AlertCircle } from 'lucide-react'

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('PRO')

  // Mock subscription data - replace with real data from API
  const currentSubscription = {
    tier: 'FREE',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  }

  const plans = {
    FREE: {
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        '2 resume generations per month',
        'Basic templates',
        'PDF export',
        'Save up to 5 resumes',
        'Community support',
      ],
      limitations: [
        'Limited generations',
        'Basic templates only',
        'No DOCX export',
      ]
    },
    PRO: {
      name: 'Pro',
      price: 9.99,
      interval: 'month',
      popular: true,
      features: [
        'Unlimited resume generations',
        'All premium templates',
        'PDF & DOCX export',
        'Unlimited saved resumes',
        'Priority support',
        'No branding',
        'Resume optimization tips',
      ]
    },
    BUSINESS: {
      name: 'Business',
      price: 29.99,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Team collaboration (up to 10 members)',
        'Bulk resume generation',
        'API access',
        'White-label options',
        'Dedicated support',
        'Custom templates',
        'Advanced analytics',
      ]
    }
  }

  const handleSubscribe = async (planType) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Current Plan</h2>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {currentSubscription.tier}
              </span>
              {currentSubscription.status === 'active' && (
                <span className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </span>
              )}
            </div>
          </div>
          
          {currentSubscription.tier !== 'FREE' && (
            <button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>Manage Subscription</span>
            </button>
          )}
        </div>

        {currentSubscription.tier !== 'FREE' && currentSubscription.currentPeriodEnd && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {currentSubscription.cancelAtPeriodEnd
                  ? `Subscription ends on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Next billing date: ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                }
              </span>
            </div>
            {currentSubscription.cancelAtPeriodEnd && (
              <div className="mt-2 flex items-start space-x-2 text-orange-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <p>
                  Your subscription will not renew. You'll continue to have access until the end of your billing period.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrent = currentSubscription.tier === key
            const isPopular = plan.popular

            return (
              <div
                key={key}
                className={`
                  relative bg-white rounded-xl border-2 p-6 transition-all
                  ${isPopular 
                    ? 'border-blue-500 shadow-xl transform scale-105' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                  }
                  ${isCurrent ? 'ring-2 ring-green-500' : ''}
                `}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 ml-2">/{plan.interval}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <ul className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-xs">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : key === 'FREE' ? (
                  currentSubscription.tier !== 'FREE' && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold disabled:opacity-50"
                    >
                      Downgrade to Free
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={isLoading}
                    className={`
                      w-full py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2
                      ${isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>
                          {currentSubscription.tier === 'FREE' 
                            ? 'Start 14-Day Free Trial' 
                            : 'Upgrade Now'
                          }
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Billing Information</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>• All plans include a 14-day free trial - no credit card required to start</p>
          <p>• Cancel anytime - no questions asked</p>
          <p>• Secure payments processed by Stripe</p>
          <p>• Annual plans available with 20% discount (contact support)</p>
          <p>• Questions? Email us at support@resumeai.com</p>
        </div>
      </div>
    </div>
  )
}