'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function ResumesPage() {
  const [resumes, setResumes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/resumes')

      if (!res.ok) {
        throw new Error('Failed to fetch resumes')
      }

      const data = await res.json()
      setResumes(data.resumes)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      setDeleteId(id)
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete resume')
      }

      setResumes(resumes.filter(resume => resume.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete resume')
    } finally {
      setDeleteId(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getResumePreview = (content) => {
    if (!content) return 'No preview available'
    const text = content.replace(/[#*_\[\]]/g, '').substring(0, 150)
    return text + (content.length > 150 ? '...' : '')
  }

  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.metadata?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.metadata?.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchResumes}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
          <p className="text-gray-600 mt-1">Manage all your professional resumes</p>
        </div>
        <Link
          href="/dashboard/resumes/new"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Create Resume</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search resumes by title, company, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Resumes List */}
      {filteredResumes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No resumes found' : 'No resumes yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Create your first professional resume to get started'}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/resumes/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Resume</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredResumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {resume.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Updated {formatDate(resume.updatedAt)}</span>
                    </span>
                    {resume.metadata?.company && (
                      <span>• {resume.metadata.company}</span>
                    )}
                    {resume.metadata?.jobTitle && (
                      <span>• {resume.metadata.jobTitle}</span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">
                    {getResumePreview(resume.content)}
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/dashboard/resumes/${resume.id}`}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="View"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/dashboard/resumes/${resume.id}/edit`}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deleteId === resume.id}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Delete"
                  >
                    {deleteId === resume.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredResumes.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {filteredResumes.length} of {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
