import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/db/connection'
import Resume from '@/lib/db/models/Resume'
import Usage from '@/lib/db/models/Usage'
import User from '@/lib/db/models/User'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Get user for subscription tier
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Count total resumes
    const totalResumes = await Resume.countDocuments({
      userId: session.user.id,
      isDeleted: false,
    })

    // Count resumes created this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const resumesThisWeek = await Resume.countDocuments({
      userId: session.user.id,
      isDeleted: false,
      createdAt: { $gte: oneWeekAgo },
    })

    // Get monthly generations count
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const monthlyGenerations = await Usage.countDocuments({
      userId: session.user.id,
      action: 'resume_generation',
      timestamp: { $gte: firstDayOfMonth },
    })

    // Get limits based on subscription tier
    const limits = {
      FREE: {
        monthlyGenerations: 2,
        savedResumes: 5,
      },
      PRO: {
        monthlyGenerations: -1, // unlimited
        savedResumes: -1,
      },
      BUSINESS: {
        monthlyGenerations: -1, // unlimited
        savedResumes: -1,
      },
    }

    const tierLimits = limits[user.subscriptionTier] || limits.FREE

    return NextResponse.json({
      stats: {
        totalResumes,
        resumesThisWeek,
        monthlyGenerations,
        generationsLimit: tierLimits.monthlyGenerations,
        savedResumes: totalResumes,
        savedLimit: tierLimits.savedResumes,
        tier: user.subscriptionTier,
      },
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
