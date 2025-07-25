'use client'

import { useState } from 'react'

const SavedResumes = ({ savedResumes, onDeleteResume, onLoadResume }) => {
  const [confirmDelete, setConfirmDelete] = useState(null)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const extractNameFromResume = (content) => {
    const lines = content.split('\n')
    const firstLine = lines[0]?.trim()
    // Remove any markdown formatting and return clean name
    return firstLine?.replace(/\*\*/g, '') || 'Unnamed Resume'
  }

  const extractJobTitleFromResume = (content) => {
    const lines = content.split('\n')
    // Look for the first job title (usually after PROFESSIONAL EXPERIENCE)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.includes('PROFESSIONAL EXPERIENCE')) {
        // Next non-empty line should be a job title
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim()
          if (nextLine && nextLine.startsWith('**') && nextLine.includes('**')) {
            // Extract job title without the dates
            const jobTitle = nextLine.replace(/\*\*/g, '').split(/\d{4}/)[0].trim()
            return jobTitle || 'Professional'
          }
        }
      }
    }
    return 'Professional'
  }

  const handleDelete = (resumeId) => {
    if (confirmDelete === resumeId) {
      onDeleteResume(resumeId)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(resumeId)
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const downloadResume = async (resume, format) => {
    try {
      const endpoint = format === 'pdf' ? '/api/generate-pdf' : '/api/generate-doc'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume: resume.content }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const name = extractNameFromResume(resume.content).replace(/[^a-zA-Z0-9]/g, '_')
      a.download = `${name}_resume.${format === 'pdf' ? 'pdf' : 'docx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`)
    }
  }

  if (savedResumes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved resumes yet</h3>
          <p className="text-gray-600 mb-4">Create your first resume to see it saved here.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create Resume →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">Saved Resumes</h2>
        <p className="text-gray-600 mt-1">Manage your generated resumes</p>
      </div>

      <div className="divide-y divide-gray-200">
        {savedResumes.map((resume) => {
          const name = extractNameFromResume(resume.content)
          const jobTitle = extractJobTitleFromResume(resume.content)
          
          return (
            <div key={resume.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-600">{jobTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {formatDate(resume.metadata.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onLoadResume(resume.id)}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    title="View/Edit Resume"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => downloadResume(resume, 'doc')}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    title="Download DOC"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => downloadResume(resume, 'pdf')}
                    className="px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    title="Download PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(resume.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      confirmDelete === resume.id
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                    title={confirmDelete === resume.id ? 'Click again to confirm' : 'Delete Resume'}
                  >
                    {confirmDelete === resume.id ? (
                      <span className="text-xs">Confirm?</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Resume Preview */}
              <div className="mt-4 bg-gray-50 rounded-md p-4">
                <p className="text-xs text-gray-600 mb-2">Preview:</p>
                <div className="text-xs text-gray-700 font-mono bg-white p-3 rounded border max-h-32 overflow-y-auto">
                  {resume.content.substring(0, 200)}...
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {savedResumes.length} saved resume{savedResumes.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete all saved resumes? This action cannot be undone.')) {
                savedResumes.forEach(resume => onDeleteResume(resume.id))
              }
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

export default SavedResumes