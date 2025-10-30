// lib/stripe/stripe-utils.js

import Stripe from 'stripe'
import { STRIPE_PLANS, TRIAL_PERIOD_DAYS } from './config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  customerEmail,
  trialPeriodDays = TRIAL_PERIOD_DAYS,
}) {
  try {
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialPeriodDays,
        metadata: {
          userId: customerId,
        },
      },
    }

    // Add customer or customer email
    if (customerId) {
      sessionParams.customer = customerId
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

/**
 * Create a Stripe customer
 */
export async function createCustomer({ email, name, userId }) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })
    return customer
  } catch (error) {
    console.error('Error creating customer:', error)
    throw error
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })
    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return subscription
  } catch (error) {
    console.error('Error resuming subscription:', error)
    throw error
  }
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(subscriptionId, newPriceId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    })
    
    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

/**
 * Create customer portal session
 */
export async function createPortalSession(customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return session
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

/**
 * Get user's subscription tier from subscription object
 */
export function getSubscriptionTier(subscription) {
  if (!subscription || subscription.status !== 'active') {
    return 'FREE'
  }

  const priceId = subscription.items.data[0]?.price.id

  if (priceId === STRIPE_PLANS.PRO.priceId) {
    return 'PRO'
  } else if (priceId === STRIPE_PLANS.BUSINESS.priceId) {
    return 'BUSINESS'
  }

  return 'FREE'
}

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(userTier, feature) {
  const plan = STRIPE_PLANS[userTier] || STRIPE_PLANS.FREE
  return plan.features[feature] === true || plan.features[feature] === 'unlimited'
}

/**
 * Check if user can perform an action based on limits
 */
export function canPerformAction(userTier, currentUsage, actionType) {
  const plan = STRIPE_PLANS[userTier] || STRIPE_PLANS.FREE
  
  if (actionType === 'generateResume') {
    const limit = plan.limits.monthlyGenerations
    if (limit === -1) return true // unlimited
    return currentUsage.monthlyGenerations < limit
  }
  
  if (actionType === 'saveResume') {
    const limit = plan.limits.maxSavedResumes
    if (limit === -1) return true // unlimited
    return currentUsage.savedResumes < limit
  }
  
  return false
}

/**
 * Get usage limits for a tier
 */
export function getUsageLimits(userTier) {
  const plan = STRIPE_PLANS[userTier] || STRIPE_PLANS.FREE
  return plan.limits
}

/**
 * Create a promo code
 */
export async function createPromoCode({ percentOff, duration, code }) {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: duration, // 'forever', 'once', 'repeating'
    })
    
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code,
    })
    
    return promoCode
  } catch (error) {
    console.error('Error creating promo code:', error)
    throw error
  }
}

export { stripe }