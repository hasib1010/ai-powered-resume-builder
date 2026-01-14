import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Resume from '@/lib/db/models/Resume'

export async function GET(request, { params }) {
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

        // Fetch all resumes for the user
        const resumes = await Resume.find({
            userId: id,
            isDeleted: false,
        })
            .sort({ createdAt: -1 })
            .select('title content createdAt updatedAt metadata')
            .lean()

        return NextResponse.json({
            resumes: resumes.map(resume => ({
                _id: resume._id.toString(),
                title: resume.title,
                createdAt: resume.createdAt,
                updatedAt: resume.updatedAt,
                metadata: resume.metadata,
            })),
        })
    } catch (error) {
        console.error('Error fetching user resumes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user resumes' },
            { status: 500 }
        )
    }
}
