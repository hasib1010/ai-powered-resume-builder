'use client'

import { useState } from 'react'

const ResumeForm = ({ onResumeGenerated }) => {
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    const acceptedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (file && acceptedTypes.includes(file.type)) {
      setResumeFile(file)
      setError('')
    } else {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx)')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!resumeFile) {
      setError('Please upload your current resume')
      return
    }

    setIsGenerating(true)
    setError('')
    setProgress('')

    try {
      setProgress('Analyzing your resume and extracting all roles...')

      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)

      console.log('Generating comprehensive resume...')
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate resume')
      }

      const data = await response.json()

      console.log('Resume generation complete!')
      console.log('- Original text length:', data.originalTextLength, 'characters')
      console.log('- Generated resume length:', data.generatedLength, 'characters')

      setProgress('Resume generation complete! All roles included.')

      onResumeGenerated(data.resume)

    } catch (err) {
      console.error('Resume generation error:', err)
      setError(err.message)
      setProgress('')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">AI Resume Generator</h2>
      <p className="text-sm text-gray-600 mb-6">
        <strong>Comprehensive Analysis:</strong> Our AI extracts EVERY role from your resume,
        maintains exact company names and dates, and creates a complete professional resume.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description (Optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here to tailor your resume (optional)..."
            className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isGenerating}
          />
          <p className="mt-1 text-xs text-gray-500">
            Add a job description to customize your resume for a specific role, or leave blank for a general optimization.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Resume (PDF or Word Document)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isGenerating}
            required
          />
          {resumeFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || !resumeFile}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Resume...
            </div>
          ) : (
            'Generate Complete Resume'
          )}
        </button>
      </form>

      {isGenerating && (
        <div className="mt-4 space-y-3">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
          </div>

          {/* Progress Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-700 text-sm">
              <strong>🔄 Comprehensive Analysis:</strong><br/>
              ✓ Extracting ALL roles from your resume<br/>
              ✓ Using EXACT company names and dates<br/>
              ✓ Extracting REAL achievements from source text<br/>
              ✓ Ensuring complete career history coverage
            </p>
          </div>

          {progress && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-700 text-sm font-medium">
                📄 {progress}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResumeForm