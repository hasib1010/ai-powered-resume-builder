// app/api/webhooks/stripe/route.js (MongoDB Version)

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/stripe-utils'
import { STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe/config'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'
import Subscription from '@/lib/db/models/Subscription'
import Payment from '@/lib/db/models/Payment'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Handle the event
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
        await handleCheckoutCompleted(event.data.object)
        break

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event.data.object)
        break

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object)
        break

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object)
        break

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_SUCCEEDED:
        await handlePaymentSucceeded(event.data.object)
        break

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_FAILED:
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session) {
  console.log('Checkout completed:', session.id)
  
  const { customer, subscription, customer_email } = session

  // Find user by Stripe customer ID or email
  const user = await User.findOne({
    $or: [
      { stripeCustomerId: customer },
      { email: customer_email }
    ]
  })

  if (user) {
    // Update user with Stripe customer ID if not set
    if (!user.stripeCustomerId) {
      user.stripeCustomerId = customer
      await user.save()
    }

    console.log(`User ${user._id} subscribed - Customer: ${customer}, Subscription: ${subscription}`)
  } else {
    console.error('No user found for checkout session')
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id)
  
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status
  const priceId = subscription.items.data[0]?.price.id
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  const currentPeriodStart = new Date(subscription.current_period_start * 1000)

  // Find user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId })
  
  if (user) {
    // Determine subscription tier based on price ID
    let tier = 'FREE'
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
      tier = 'PRO'
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID) {
      tier = 'BUSINESS'
    }

    // Update user subscription tier
    user.subscriptionTier = tier
    await user.save()

    // Create subscription record
    await Subscription.create({
      userId: user._id,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: status,
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    })

    console.log(`Subscription ${subscriptionId} created for user ${user._id}`)
  } else {
    console.error(`No user found for customer ${customerId}`)
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id)
  
  const subscriptionId = subscription.id
  const status = subscription.status
  const priceId = subscription.items.data[0]?.price.id
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  const currentPeriodStart = new Date(subscription.current_period_start * 1000)
  const cancelAtPeriodEnd = subscription.cancel_at_period_end

  // Update subscription record
  const subscriptionDoc = await Subscription.findOne({ stripeSubscriptionId: subscriptionId })
  
  if (subscriptionDoc) {
    subscriptionDoc.status = status
    subscriptionDoc.stripePriceId = priceId
    subscriptionDoc.currentPeriodStart = currentPeriodStart
    subscriptionDoc.currentPeriodEnd = currentPeriodEnd
    subscriptionDoc.cancelAtPeriodEnd = cancelAtPeriodEnd
    await subscriptionDoc.save()

    // Update user tier if price changed
    const user = await User.findById(subscriptionDoc.userId)
    if (user) {
      let tier = 'FREE'
      if (status === 'active' || status === 'trialing') {
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          tier = 'PRO'
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID) {
          tier = 'BUSINESS'
        }
      }
      
      user.subscriptionTier = tier
      await user.save()
    }

    console.log(`Subscription ${subscriptionId} updated - Status: ${status}`)
  } else {
    console.error(`Subscription not found: ${subscriptionId}`)
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  const subscriptionId = subscription.id

  // Update subscription status
  const subscriptionDoc = await Subscription.findOne({ stripeSubscriptionId: subscriptionId })
  
  if (subscriptionDoc) {
    subscriptionDoc.status = 'canceled'
    await subscriptionDoc.save()

    // Update user to FREE tier
    const user = await User.findById(subscriptionDoc.userId)
    if (user) {
      user.subscriptionTier = 'FREE'
      await user.save()
    }

    console.log(`Subscription ${subscriptionId} canceled`)
  } else {
    console.error(`Subscription not found: ${subscriptionId}`)
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id)
  
  const subscriptionId = invoice.subscription
  const amountPaid = invoice.amount_paid
  const customerId = invoice.customer

  // Find user
  const user = await User.findOne({ stripeCustomerId: customerId })

  // Create payment record
  await Payment.create({
    userId: user?._id,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    amount: amountPaid,
    currency: invoice.currency || 'usd',
    status: 'succeeded',
    description: invoice.description,
  })

  console.log(`Payment succeeded for subscription ${subscriptionId}: $${amountPaid / 100}`)
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id)
  
  const subscriptionId = invoice.subscription
  const customerId = invoice.customer

  // Find user
  const user = await User.findOne({ stripeCustomerId: customerId })

  // Create payment record
  await Payment.create({
    userId: user?._id,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    amount: invoice.amount_due,
    currency: invoice.currency || 'usd',
    status: 'failed',
    description: invoice.description || 'Payment failed',
  })

  console.error(`Payment failed for subscription ${subscriptionId}`)
  
  // TODO: Send email notification to user
  // TODO: Implement retry logic or grace period
}