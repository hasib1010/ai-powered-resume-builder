// app/api/subscriptions/checkout/route.js 

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createCheckoutSession, createCustomer } from '@/lib/stripe/stripe-utils'
import { STRIPE_PLANS } from '@/lib/stripe/config'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planType } = await request.json()

    // Validate plan type
    if (!STRIPE_PLANS[planType] || planType === 'FREE') {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    const plan = STRIPE_PLANS[planType]
    const userId = session.user.id
    const userEmail = session.user.email

    // Connect to database
    await connectDB()

    // Get user from database
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let stripeCustomerId = user.stripeCustomerId
    
    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await createCustomer({
        email: userEmail,
        name: user.name || session.user.name,
        userId: userId,
      })
      
      stripeCustomerId = customer.id
      
      // Update user with Stripe customer ID
      user.stripeCustomerId = stripeCustomerId
      await user.save()
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: plan.priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customerEmail: userEmail,
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}