'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Copy,
  Check
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ResumeViewPage() {
  const params = useParams()
  const router = useRouter()
  const [resume, setResume] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadType, setDownloadType] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchResume()
    }
  }, [params.id])

  const fetchResume = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/resumes/${params.id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch resume')
      }

      const data = await res.json()
      setResume(data.resume)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load resume')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch(`/api/resumes/${params.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete resume')
      }

      router.push('/dashboard/resumes')
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete resume')
      setIsDeleting(false)
    }
  }

  const handleDownload = async (type) => {
    if (!resume) return

    setIsDownloading(true)
    setDownloadType(type)

    try {
      const endpoint = type === 'pdf' ? '/api/generate-pdf' : '/api/generate-doc'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume: resume.content }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate ${type.toUpperCase()}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resume.title.replace(/\s+/g, '_')}.${type}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download ${type.toUpperCase()}. Please try again.`)
    } finally {
      setIsDownloading(false)
      setDownloadType('')
    }
  }

  const handleCopy = async () => {
    if (!resume) return

    try {
      await navigator.clipboard.writeText(resume.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy error:', err)
      alert('Failed to copy to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/resumes"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to resumes</span>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <p className="text-red-800">{error || 'Resume not found'}</p>
        </div>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-gray-900">{resume.title}</h1>
            <p className="text-gray-600 mt-1">
              Last updated: {new Date(resume.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <div className="relative group">
            <button
              disabled={isDownloading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Downloading {downloadType}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>

            {!isDownloading && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleDownload('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => handleDownload('docx')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  Download DOCX
                </button>
              </div>
            )}
          </div>

          <Link
            href={`/dashboard/resumes/${params.id}/edit`}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Link>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* Resume Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{resume.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
