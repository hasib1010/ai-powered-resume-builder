import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'
import Resume from '@/lib/db/models/Resume'

// GET /api/admin/analytics/overview - Get comprehensive analytics
export async function GET(request) {
    try {
        const session = await auth()

        // Check if user is admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '30')

        await connectDB()

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // User growth data (daily signups)
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])

        // Resume generation trends (daily)
        const resumeTrends = await Resume.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])

        // Top users by resume count
        const topUsers = await Resume.aggregate([
            {
                $match: { isDeleted: false }
            },
            {
                $group: {
                    _id: '$userId',
                    resumeCount: { $sum: 1 }
                }
            },
            {
                $sort: { resumeCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    name: '$user.name',
                    email: '$user.email',
                    resumeCount: 1
                }
            }
        ])

        // Subscription distribution over time
        const subscriptionTrends = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        tier: '$subscriptionTier'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ])

        return NextResponse.json({
            userGrowth: userGrowth.map(item => ({
                date: item._id,
                count: item.count
            })),
            resumeTrends: resumeTrends.map(item => ({
                date: item._id,
                count: item.count
            })),
            topUsers,
            subscriptionTrends: subscriptionTrends.map(item => ({
                date: item._id.date,
                tier: item._id.tier,
                count: item.count
            })),
            period: {
                days,
                startDate,
                endDate: new Date()
            }
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
