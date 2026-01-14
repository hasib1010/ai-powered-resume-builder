import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Resume from '@/lib/db/models/Resume'

// GET a specific resume
export async function GET(request, { params }) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const resume = await Resume.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: false,
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      resume: {
        id: resume._id.toString(),
        title: resume.title,
        content: resume.content,
        metadata: resume.metadata,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching resume:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    )
  }
}

// PUT update a resume
export async function PUT(request, { params }) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, content, metadata } = await request.json()

    await connectDB()

    const resume = await Resume.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: false,
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Update fields if provided
    if (title) resume.title = title.trim()
    if (content) resume.content = content
    if (metadata) resume.metadata = { ...resume.metadata, ...metadata }

    resume.version += 1
    resume.updatedAt = new Date()

    await resume.save()

    return NextResponse.json({
      message: 'Resume updated successfully',
      resume: {
        id: resume._id.toString(),
        title: resume.title,
        content: resume.content,
        metadata: resume.metadata,
        version: resume.version,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating resume:', error)
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    )
  }
}

// DELETE a resume (soft delete)
export async function DELETE(request, { params }) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const resume = await Resume.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: false,
    })

    if (!resume) {
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