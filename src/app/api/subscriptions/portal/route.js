// app/api/subscriptions/portal/route.js (MongoDB Version)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createPortalSession } from '@/lib/stripe/stripe-utils'
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

    // Connect to database
    await connectDB()

    // Get user from database
    const user = await User.findById(session.user.id)
    
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const portalSession = await createPortalSession(
      user.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    )

    return NextResponse.json({ url: portalSession.url })

  } catch (error) {
    console.error('Portal session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}