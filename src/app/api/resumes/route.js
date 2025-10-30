import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/db/connection'
import Resume from '@/lib/db/models/Resume'

// GET all user's resumes
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

    const resumes = await Resume.find({
      userId: session.user.id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      resumes: resumes.map(resume => ({
        id: resume._id.toString(),
        title: resume.title,
        content: resume.content,
        metadata: resume.metadata,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    )
  }
}

// POST create a new resume
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, content, metadata } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const resume = new Resume({
      userId: session.user.id,
      title: title.trim(),
      content,
      metadata: metadata || {},
    })

    await resume.save()

    return NextResponse.json(
      {
        message: 'Resume saved successfully',
        resume: {
          id: resume._id.toString(),
          title: resume.title,
          content: resume.content,
          metadata: resume.metadata,
          createdAt: resume.createdAt,
          updatedAt: resume.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating resume:', error)
    return NextResponse.json(
      { error: 'Failed to save resume' },
      { status: 500 }
    )
  }
}
