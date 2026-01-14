import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Resume from '@/lib/db/models/Resume'

// GET /api/admin/resumes/[id] - Get single resume with full details
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

        const resume = await Resume.findById(id)
            .populate('userId', 'name email role subscriptionTier')
            .lean()

        if (!resume || resume.isDeleted) {
            return NextResponse.json(
                { error: 'Resume not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            resume: {
                _id: resume._id.toString(),
                title: resume.title,
                content: resume.content,
                metadata: resume.metadata,
                version: resume.version,
                createdAt: resume.createdAt,
                updatedAt: resume.updatedAt,
                user: {
                    _id: resume.userId._id.toString(),
                    name: resume.userId.name,
                    email: resume.userId.email,
                    role: resume.userId.role,
                    subscriptionTier: resume.userId.subscriptionTier,
                }
            }
        })
    } catch (error) {
        console.error('Error fetching resume:', error)
        return NextResponse.json(
            { error: 'Failed to fetch resume' },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/resumes/[id] - Delete any resume
export async function DELETE(request, { params }) {
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

        const resume = await Resume.findById(id)

        if (!resume || resume.isDeleted) {
            return NextResponse.json(
                { error: 'Resume not found' },
                { status: 404 }
            )
        }

        // Soft delete
        await resume.softDelete()

        return NextResponse.json({
            message: 'Resume deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting resume:', error)
        return NextResponse.json(
            { error: 'Failed to delete resume' },
            { status: 500 }
        )
    }
}
