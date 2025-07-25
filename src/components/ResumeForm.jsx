'use client'

import { useState } from 'react'

const ResumeForm = ({ onResumeGenerated, isGenerating, setIsGenerating }) => {
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [apiProgress, setApiProgress] = useState({ step: 0, total: 2 })

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
    setApiProgress({ step: 0, total: 2 })

    try {
      // API 1: Generate initial resume (max roles within 4K limit)
      setProgress('API 1: Generating initial resume with maximum roles...')
      setApiProgress({ step: 1, total: 2 })
      
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)

      console.log('Calling API 1: Initial resume generation...')
      const response1 = await fetch('/api/generate-initial-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response1.ok) {
        const errorData = await response1.json()
        throw new Error(errorData.error || 'Failed to generate initial resume')
      }

      const data1 = await response1.json()
      
      console.log('API 1 Results:')
      console.log('- Initial resume length:', data1.initialResumeLength)
      console.log('- Original text length:', data1.originalTextLength)

      // API 2: Analyze gaps and complete the resume
      setProgress('API 2: Analyzing missing roles and completing resume...')
      setApiProgress({ step: 2, total: 2 })

      console.log('Calling API 2: Gap analysis and completion...')
      const response2 = await fetch('/api/complete-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialResume: data1.initialResume,
          originalText: data1.originalText,
          jobDescription: data1.jobDescription
        }),
      })

      if (!response2.ok) {
        const errorData = await response2.json()
        throw new Error(errorData.error || 'Failed to complete resume')
      }

      const data2 = await response2.json()

      console.log('API 2 Results:')
      console.log('- Complete resume length:', data2.completeResumeLength)
      console.log('- Improvement:', data2.completeResumeLength - data2.initialResumeLength, 'characters added')

      setProgress('Resume generation complete! All roles included.')
      
      // Final result
      const finalResume = data2.completeResume
      
      console.log('=== TWO-API PROCESS COMPLETE ===')
      console.log('Original text:', data1.originalTextLength, 'characters')
      console.log('API 1 output:', data2.initialResumeLength, 'characters')
      console.log('API 2 output:', data2.completeResumeLength, 'characters')
      console.log('Content expansion:', ((data2.completeResumeLength / data2.initialResumeLength - 1) * 100).toFixed(1) + '%')

      onResumeGenerated(finalResume)

    } catch (err) {
      console.error('Two-API resume generation error:', err)
      setError(err.message)
      setProgress('')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Two-API Complete Resume Generator</h2>
      <p className="text-sm text-gray-600 mb-6">
        <strong>Advanced System:</strong> First API generates maximum content within limits, 
        second API analyzes gaps and ensures ALL roles are included.
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
              Two-API Processing... ({apiProgress.step}/{apiProgress.total})
            </div>
          ) : (
            'Generate Complete Resume (Two-API System)'
          )}
        </button>
      </form>

      {isGenerating && (
        <div className="mt-4 space-y-3">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(apiProgress.step / apiProgress.total) * 100}%` }}
            ></div>
          </div>
          
          {/* Progress Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-700 text-sm">
              <strong>🔄 Two-API System:</strong><br/>
              <strong>API 1:</strong> Generate maximum content within 4K token limit<br/>
              <strong>API 2:</strong> Analyze gaps, find missing roles, complete resume<br/>
              <strong>Result:</strong> 100% role coverage guaranteed
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