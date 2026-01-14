import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'
import Resume from '@/lib/db/models/Resume'

// GET /api/admin/analytics/activity - Get recent activity log
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
        const limit = parseInt(searchParams.get('limit') || '50')

        await connectDB()

        // Get recent user signups
        const recentSignups = await User.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('name email createdAt role')
            .lean()

        // Get recent resume creations
        const recentResumes = await Resume.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('userId', 'name email')
            .select('title createdAt userId')
            .lean()

        // Get recent logins
        const recentLogins = await User.find({ lastLogin: { $exists: true } })
            .sort({ lastLogin: -1 })
            .limit(limit)
            .select('name email lastLogin')
            .lean()

        // Combine and sort all activities
        const activities = [
            ...recentSignups.map(user => ({
                type: 'USER_SIGNUP',
                timestamp: user.createdAt,
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                description: `${user.name} signed up`
            })),
            ...recentResumes.map(resume => ({
                type: 'RESUME_CREATED',
                timestamp: resume.createdAt,
                user: {
                    name: resume.userId?.name,
                    email: resume.userId?.email
                },
                resume: {
                    title: resume.title,
                    id: resume._id.toString()
                },
                description: `${resume.userId?.name} created "${resume.title}"`
            })),
            ...recentLogins.map(user => ({
                type: 'USER_LOGIN',
                timestamp: user.lastLogin,
                user: {
                    name: user.name,
                    email: user.email
                },
                description: `${user.name} logged in`
            }))
        ]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit)

        return NextResponse.json({
            activities,
            total: activities.length
        })
    } catch (error) {
        console.error('Error fetching activity:', error)
        return NextResponse.json(
            { error: 'Failed to fetch activity' },
            { status: 500 }
        )
    }
}
