'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ResumeForm from '@/components/ResumeForm'
import ResumePreview from '@/components/ResumePreview'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewResumePage() {
  const router = useRouter()
  const [generatedResume, setGeneratedResume] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleResumeGenerated = (resume) => {
    setGeneratedResume(resume)
  }

  const handleSaveResume = async () => {
    if (!generatedResume) return

    setIsSaving(true)
    setSaveError('')

    try {
      // Extract title from resume (use first job title or name)
      const lines = generatedResume.split('\n')
      const firstLine = lines[0]?.replace(/\*\*/g, '').trim() || 'Untitled Resume'

      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: firstLine,
          content: generatedResume,
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save resume')
      }

      const data = await response.json()

      // Redirect to the saved resume
      router.push(`/dashboard/resumes/${data.resume.id}`)
    } catch (err) {
      console.error('Save error:', err)
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/resumes"
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Resume</h1>
            <p className="text-gray-600 mt-1">Upload your existing resume to generate an optimized version</p>
          </div>
        </div>

        {generatedResume && (
          <button
            onClick={handleSaveResume}
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Resume</span>
              </>
            )}
          </button>
        )}
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{saveError}</p>
        </div>
      )}

      {/* Resume Form */}
      {!generatedResume && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ResumeForm onResumeGenerated={handleResumeGenerated} />
        </div>
      )}

      {/* Resume Preview */}
      {generatedResume && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ResumePreview resume={generatedResume} />
        </div>
      )}
    </div>
  )
}
