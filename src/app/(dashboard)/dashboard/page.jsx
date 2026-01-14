// app/(dashboard)/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  TrendingUp,
  Download,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [recentResumes, setRecentResumes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      const [statsRes, resumesRes] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/resumes')
      ])

      if (!statsRes.ok || !resumesRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const statsData = await statsRes.json()
      const resumesData = await resumesRes.json()

      setStats(statsData.stats)
      setRecentResumes(resumesData.resumes.slice(0, 3))
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
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

  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const isLimitReached = stats.generationsLimit !== -1 &&
    stats.monthlyGenerations >= stats.generationsLimit

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
        <p className="text-blue-100 mb-6">
          Ready to create your next professional resume?
        </p>
        <Link
          href="/dashboard/resumes/new"
          className={`
            inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-xl 
            font-semibold hover:shadow-xl transition-shadow
            ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={(e) => {
            if (isLimitReached) {
              e.preventDefault()
              alert('Monthly generation limit reached. Upgrade to Pro for unlimited generations!')
            }
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Create New Resume</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        {isLimitReached && (
          <div className="mt-4 bg-white/20 rounded-lg p-4">
            <p className="text-sm">
              You've reached your monthly limit.
              <Link href="/dashboard/billing" className="underline font-semibold ml-1">
                Upgrade to Pro
              </Link> for unlimited resume generations!
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Resumes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            {stats.resumesThisWeek > 0 && (
              <span className="text-green-600 text-sm font-medium">
                +{stats.resumesThisWeek} this week
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalResumes}</h3>
          <p className="text-gray-600 text-sm">Total Resumes</p>
        </div>

        {/* Monthly Generations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            {stats.tier === 'FREE' && stats.generationsLimit > 0 && (
              <span className="text-orange-600 text-sm font-medium">
                {Math.max(0, stats.generationsLimit - stats.monthlyGenerations)} left
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {stats.monthlyGenerations}
            {stats.generationsLimit !== -1 && (
              <span className="text-gray-400 text-lg">/{stats.generationsLimit}</span>
            )}
          </h3>
          <p className="text-gray-600 text-sm">
            {stats.generationsLimit === -1 ? 'Unlimited' : 'Monthly Generations'}
          </p>
        </div>

        {/* Saved Resumes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            {stats.tier === 'FREE' && stats.savedLimit > 0 && (
              <span className="text-orange-600 text-sm font-medium">
                {Math.max(0, stats.savedLimit - stats.savedResumes)} left
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {stats.savedResumes}
            {stats.savedLimit !== -1 && (
              <span className="text-gray-400 text-lg">/{stats.savedLimit}</span>
            )}
          </h3>
          <p className="text-gray-600 text-sm">Saved Resumes</p>
        </div>

        {/* Current Plan */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.tier}</h3>
          <p className="text-gray-600 text-sm mb-3">Current Plan</p>
          {stats.tier === 'FREE' && (
            <Link
              href="/dashboard/billing"
              className="text-purple-600 hover:text-purple-700 text-sm font-semibold inline-flex items-center space-x-1"
            >
              <span>Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Recent Resumes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Resumes</h3>
            <p className="text-gray-600 text-sm mt-1">Your latest resume projects</p>
          </div>
          <Link
            href="/dashboard/resumes"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm inline-flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentResumes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No resumes yet</h4>
            <p className="text-gray-600 mb-6">Create your first professional resume to get started</p>
            <Link
              href="/dashboard/resumes/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Resume</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentResumes.map((resume) => (
              <div key={resume.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {resume.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(resume.updatedAt)}</span>
                      </span>
                      {resume.metadata?.company && (
                        <span>• {resume.metadata.company}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
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
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Download"
                      onClick={() => window.location.href = `/dashboard/resumes/${resume.id}`}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {getResumePreview(resume.content)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Pro Tip</h4>
            <p className="text-gray-700 mb-4">
              Tailor your resume for each job application by including specific keywords from the job description.
              Our AI can help optimize your resume for specific roles!
            </p>
            <Link
              href="/dashboard/resumes/new"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm inline-flex items-center space-x-1"
            >
              <span>Try it now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}