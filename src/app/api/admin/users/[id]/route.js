import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'

// GET /api/admin/users/[id] - Get single user with full details
export async function GET(request, { params }) {
    try {
        const { id } = await params
        const session = await auth()

        // Check if user is admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await connectDB()

        const user = await User.findById(id).select('-password').lean()

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            user: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                subscriptionTier: user.subscriptionTier,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin,
                image: user.image,
            }
        })
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        )
    }
}

export async function PATCH(request, { params }) {
    try {
        // Await params in Next.js 15
        const { id } = await params

        const session = await auth()

        // Check if user is admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { role, isActive, subscriptionTier } = body

        // Validate role if provided
        if (role && !['USER', 'ADMIN'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be USER or ADMIN.' },
                { status: 400 }
            )
        }

        // Validate subscription tier if provided
        if (subscriptionTier && !['FREE', 'PRO', 'BUSINESS'].includes(subscriptionTier)) {
            return NextResponse.json(
                { error: 'Invalid subscription tier.' },
                { status: 400 }
            )
        }

        await connectDB()

        // Find user
        const user = await User.findById(id)

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Prevent admin from demoting themselves
        if (user._id.toString() === session.user.id && role === 'USER') {
            return NextResponse.json(
                { error: 'You cannot demote yourself' },
                { status: 400 }
            )
        }

        // Prevent admin from disabling themselves
        if (user._id.toString() === session.user.id && isActive === false) {
            return NextResponse.json(
                { error: 'You cannot disable yourself' },
                { status: 400 }
            )
        }

        // Update fields
        if (role) user.role = role
        if (typeof isActive === 'boolean') user.isActive = isActive
        if (subscriptionTier) user.subscriptionTier = subscriptionTier

        await user.save()

        return NextResponse.json({
            message: 'User updated successfully',
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                subscriptionTier: user.subscriptionTier,
            },
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

export async function DELETE(request, { params }) {
    try {
        // Await params in Next.js 15
        const { id } = await params

        const session = await auth()

        // Check if user is admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await connectDB()

        // Find user
        const user = await User.findById(id)

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === session.user.id) {
            return NextResponse.json(
                { error: 'You cannot delete yourself' },
                { status: 400 }
            )
        }

        // Delete user (hard delete)
        await User.findByIdAndDelete(id)

        return NextResponse.json({
            message: 'User deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        )
    }
}
