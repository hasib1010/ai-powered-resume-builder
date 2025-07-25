'use client'

import { useState, useEffect } from 'react'
import ResumeForm from '@/components/ResumeForm'
import ResumePreview from '@/components/ResumePreview'
import SavedResumes from '@/components/SavedResumes'

export default function Home() {
  const [generatedResume, setGeneratedResume] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedResumes, setSavedResumes] = useState([])
  const [activeTab, setActiveTab] = useState('create') // 'create' or 'saved'

  // Load saved resumes from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedResumes')
    if (saved) {
      try {
        setSavedResumes(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved resumes:', error)
        setSavedResumes([])
      }
    }
  }, [])

  // Save resume to localStorage
  const saveResume = (resume, metadata = {}) => {
    const resumeData = {
      id: Date.now().toString(),
      content: resume,
      metadata: {
        createdAt: new Date().toISOString(),
        name: metadata.name || 'Resume',
        jobTitle: metadata.jobTitle || '',
        company: metadata.company || '',
        ...metadata
      }
    }

    const updatedResumes = [...savedResumes, resumeData]
    setSavedResumes(updatedResumes)
    localStorage.setItem('savedResumes', JSON.stringify(updatedResumes))
    
    return resumeData.id
  }

  // Delete resume from localStorage
  const deleteResume = (resumeId) => {
    const updatedResumes = savedResumes.filter(resume => resume.id !== resumeId)
    setSavedResumes(updatedResumes)
    localStorage.setItem('savedResumes', JSON.stringify(updatedResumes))
  }

  // Load a saved resume for viewing/editing
  const loadResume = (resumeId) => {
    const resume = savedResumes.find(r => r.id === resumeId)
    if (resume) {
      setGeneratedResume(resume.content)
      setActiveTab('create')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Resume Builder
          </h1>
          <p className="text-lg text-gray-600">
            Upload your resume to create a professional, optimized version. Add a job description to tailor it for a specific role.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 font-medium rounded-l-lg transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Create Resume
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-3 font-medium rounded-r-lg transition-colors relative ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Saved Resumes
              {savedResumes.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {savedResumes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <ResumeForm 
                onResumeGenerated={setGeneratedResume}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
              />
            </div>
            
            <div>
              <ResumePreview 
                resume={generatedResume}
                isGenerating={isGenerating}
                onSaveResume={saveResume}
              />
            </div>
          </div>
        ) : (
          <SavedResumes
            savedResumes={savedResumes}
            onDeleteResume={deleteResume}
            onLoadResume={loadResume}
          />
        )}
      </main>
    </div>
  )
}