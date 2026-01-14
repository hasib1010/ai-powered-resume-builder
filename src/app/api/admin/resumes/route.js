import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Resume from '@/lib/db/models/Resume'

// GET /api/admin/resumes - List all resumes with pagination and filters
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
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Filters
        const search = searchParams.get('search') || ''
        const userId = searchParams.get('userId') || ''

        // Sorting
        const sortBy = searchParams.get('sortBy') || 'createdAt'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        await connectDB()

        // Build query
        const query = { isDeleted: false }

        // Search filter
        if (search) {
            query.title = { $regex: search, $options: 'i' }
        }

        // User filter
        if (userId) {
            query.userId = userId
        }

        // Get total count for pagination
        const totalResumes = await Resume.countDocuments(query)

        // Get resumes with pagination and sorting
        const resumes = await Resume.find(query)
            .populate('userId', 'name email')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        return NextResponse.json({
            resumes: resumes.map(resume => ({
                _id: resume._id.toString(),
                title: resume.title,
                userId: resume.userId?._id?.toString(),
                userName: resume.userId?.name,
                userEmail: resume.userId?.email,
                createdAt: resume.createdAt,
                updatedAt: resume.updatedAt,
                version: resume.version,
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalResumes / limit),
                totalResumes,
                limit,
                hasNextPage: page < Math.ceil(totalResumes / limit),
                hasPrevPage: page > 1,
            }
        })
    } catch (error) {
        console.error('Error fetching resumes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch resumes' },
            { status: 500 }
        )
    }
}
