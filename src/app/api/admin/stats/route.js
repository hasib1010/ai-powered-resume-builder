import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'
import Resume from '@/lib/db/models/Resume'

export async function GET(request) {
    try {
        const session = await auth()

        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await connectDB()

        // Get total users
        const totalUsers = await User.countDocuments({ isActive: true })

        // Get total resumes
        const totalResumes = await Resume.countDocuments({ isDeleted: false })

        // Get active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: thirtyDaysAgo },
            isActive: true,
        })

        // Get recent users
        const recentUsers = await User.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role createdAt')
            .lean()

        // Get subscription distribution
        const subscriptionStats = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ])

        // Calculate growth rate (simplified - last 7 days vs previous 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

        const recentSignups = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
        })
        const previousSignups = await User.countDocuments({
            createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        })

        const growthRate = previousSignups > 0
            ? Math.round(((recentSignups - previousSignups) / previousSignups) * 100)
            : 100

        return NextResponse.json({
            totalUsers,
            totalResumes,
            activeUsers,
            recentUsers,
            subscriptionStats,
            growthRate,
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        )
    }
}
