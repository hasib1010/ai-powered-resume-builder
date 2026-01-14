import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'

// GET /api/admin/users - List all users with pagination, search, and filters
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

        // Pagination
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // Filters
        const search = searchParams.get('search') || ''
        const role = searchParams.get('role') || 'ALL'
        const status = searchParams.get('status') || 'ALL'
        const subscriptionTier = searchParams.get('tier') || 'ALL'

        // Sorting
        const sortBy = searchParams.get('sortBy') || 'createdAt'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        await connectDB()

        // Build query
        const query = {}

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }

        // Role filter
        if (role !== 'ALL') {
            query.role = role
        }

        // Status filter
        if (status !== 'ALL') {
            query.isActive = status === 'ACTIVE'
        }

        // Subscription tier filter
        if (subscriptionTier !== 'ALL') {
            query.subscriptionTier = subscriptionTier
        }

        // Get total count for pagination
        const totalUsers = await User.countDocuments(query)

        // Get users with pagination and sorting
        const users = await User.find(query)
            .select('-password')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        return NextResponse.json({
            users: users.map(user => ({
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                subscriptionTier: user.subscriptionTier,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin,
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                limit,
                hasNextPage: page < Math.ceil(totalUsers / limit),
                hasPrevPage: page > 1,
            }
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

// POST /api/admin/users - Create new user
export async function POST(request) {
    try {
        const session = await auth()

        // Check if user is admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        const { name, email, role, subscriptionTier } = await request.json()

        // Validation
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        await connectDB()

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Create new user
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            role: role || 'USER',
            subscriptionTier: subscriptionTier || 'FREE',
            isActive: true,
        })

        await newUser.save()

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                subscriptionTier: newUser.subscriptionTier,
                isActive: newUser.isActive,
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
