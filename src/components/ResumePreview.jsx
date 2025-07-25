'use client'

import { useState } from 'react'

const ResumePreview = ({ resume, isGenerating, onSaveResume }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadType, setDownloadType] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveMetadata, setSaveMetadata] = useState({
    name: '',
    jobTitle: '',
    company: ''
  })

  // Extract name from resume (first line)
  const extractNameFromResume = (resumeContent) => {
    const lines = resumeContent.split('\n')
    const firstLine = lines[0]?.trim()
    return firstLine?.replace(/\*\*/g, '') || ''
  }

  // Extract job title from resume (first job in professional experience)
  const extractJobTitleFromResume = (resumeContent) => {
    const lines = resumeContent.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.includes('PROFESSIONAL EXPERIENCE')) {
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim()
          if (nextLine && nextLine.startsWith('**') && nextLine.includes('**')) {
            const jobTitle = nextLine.replace(/\*\*/g, '').split(/\d{4}/)[0].trim()
            return jobTitle || ''
          }
        }
      }
    }
    return ''
  }

  // Handle save button click
  const handleSaveResume = () => {
    if (!resume) return
    
    const extractedName = extractNameFromResume(resume)
    const extractedJobTitle = extractJobTitleFromResume(resume)
    
    setSaveMetadata({
      name: extractedName,
      jobTitle: extractedJobTitle,
      company: ''
    })
    setShowSaveModal(true)
  }

  // Confirm save with metadata
  const confirmSave = () => {
    if (!resume || !onSaveResume) return
    
    onSaveResume(resume, saveMetadata)
    setShowSaveModal(false)
    setSaveMetadata({ name: '', jobTitle: '', company: '' })
    
    // Show success message
    alert('Resume saved successfully!')
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!resume) return

    setIsDownloading(true)
    setDownloadType('PDF')
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setIsDownloading(false)
      setDownloadType('')
    }
  }

  // Download DOC
  const handleDownloadDOC = async () => {
    if (!resume) return

    setIsDownloading(true)
    setDownloadType('DOC')
    
    try {
      const response = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate DOC')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading DOC:', error)
      alert('Failed to download DOC. Please try again.')
    } finally {
      setIsDownloading(false)
      setDownloadType('')
    }
  }

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!resume) return
    
    try {
      await navigator.clipboard.writeText(resume)
      alert('Resume copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard')
    }
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Generating your resume...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!resume) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Your generated resume will appear here</p>
            <p className="text-sm mt-2">Fill out the form to get started</p>
          </div>
        </div>
      </div>
    )
  }

  // Main component
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Generated Resume</h2>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Save Button */}
          {onSaveResume && (
            <button
              onClick={handleSaveResume}
              className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
              title="Save resume to localStorage"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Save
            </button>
          )}
          
          {/* Copy Button */}
          <button
            onClick={handleCopyToClipboard}
            className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          
          {/* Download DOC Button */}
          <button
            onClick={handleDownloadDOC}
            disabled={isDownloading}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Download as Word Document"
          >
            {isDownloading && downloadType === 'DOC' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download DOC
              </>
            )}
          </button>
          
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Download as PDF"
          >
            {isDownloading && downloadType === 'PDF' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Resume Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
          <p className="text-sm text-gray-600 font-medium">Resume Preview</p>
          <span className="text-xs text-gray-500">
            {resume.split('\n').length} lines | {resume.length} characters
          </span>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto bg-white">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">
            {resume}
          </pre>
        </div>
      </div>
      
      {/* Generate Another Resume Link */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          ← Generate Another Resume
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Save Resume</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={saveMetadata.name}
                  onChange={(e) => setSaveMetadata(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Resume name or person's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={saveMetadata.jobTitle}
                  onChange={(e) => setSaveMetadata(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Target job title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={saveMetadata.company}
                  onChange={(e) => setSaveMetadata(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Target company"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Save Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumePreview