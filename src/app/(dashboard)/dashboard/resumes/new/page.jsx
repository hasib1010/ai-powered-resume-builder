'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ResumeForm from '@/components/ResumeForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewResumePage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/resumes"
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Resume</h1>
          <p className="text-gray-600 mt-1">Upload your existing resume or start from scratch</p>
        </div>
      </div>

      {/* Resume Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ResumeForm />
      </div>
    </div>
  )
}
