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
  Check,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

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
  const [zoom, setZoom] = useState(100)

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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/resumes"
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{resume.title}</h1>
            <p className="text-gray-600 mt-1">
              Last updated: {new Date(resume.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* PDF Preview Container */}
      <div className="bg-[#525659] rounded-lg p-4 md:p-8 min-h-[600px]">
        {/* Toolbar */}
        <div className="flex items-center justify-center mb-4 gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center bg-gray-700 px-3 py-1 rounded">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Page Container */}
        <div className="flex justify-center overflow-auto pb-4">
          <div
            className="bg-white shadow-2xl origin-top"
            style={{
              width: '612px', // 8.5 inches at 72 DPI
              minHeight: '792px', // 11 inches at 72 DPI
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Resume Content with PDF-like styling */}
            <div
              className="p-12"
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              <style jsx>{`
                .resume-content h1 {
                  font-size: 22px;
                  font-weight: bold;
                  text-align: center;
                  margin-bottom: 4px;
                  color: #000;
                }
                .resume-content h1 + p {
                  text-align: center;
                  font-size: 11px;
                  color: #333;
                  margin-bottom: 16px;
                }
                .resume-content h2 {
                  font-size: 12px;
                  font-weight: bold;
                  text-transform: uppercase;
                  border-bottom: 1.5px solid #000;
                  margin-top: 16px;
                  margin-bottom: 8px;
                  padding-bottom: 2px;
                  color: #000;
                  letter-spacing: 0.3px;
                }
                .resume-content h3 {
                  font-size: 11px;
                  font-weight: bold;
                  margin-top: 10px;
                  margin-bottom: 0px;
                  color: #000;
                  display: inline;
                }
                .resume-content h4 {
                  font-size: 11px;
                  font-style: italic;
                  margin-top: 0px;
                  margin-bottom: 4px;
                  color: #000;
                }
                .resume-content p {
                  font-size: 11px;
                  line-height: 1.5;
                  margin-bottom: 6px;
                  color: #000;
                  text-align: justify;
                }
                .resume-content ul {
                  margin-left: 16px;
                  margin-bottom: 6px;
                  padding-left: 0;
                }
                .resume-content li {
                  font-size: 11px;
                  line-height: 1.5;
                  margin-bottom: 2px;
                  color: #000;
                  list-style-type: disc;
                }
                .resume-content a {
                  color: #0066cc;
                  text-decoration: none;
                }
                .resume-content a:hover {
                  text-decoration: underline;
                }
                .resume-content strong {
                  font-weight: bold;
                }
                .resume-content em {
                  font-style: italic;
                }
                .resume-content hr {
                  border: none;
                  border-top: 1px solid #ccc;
                  margin: 12px 0;
                }
              `}</style>

              <div className="resume-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h1: ({ children }) => (
                      <h1 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '4px',
                        color: '#000',
                      }}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        borderBottom: '1.5px solid #000',
                        marginTop: '16px',
                        marginBottom: '8px',
                        paddingBottom: '2px',
                        color: '#000',
                        letterSpacing: '0.3px',
                      }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => {
                      // Check if children contains date pattern (for job title + date)
                      const text = String(children)
                      const datePattern = /(.+?)\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[–-]\s*(?:Present|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}))/i
                      const match = text.match(datePattern)

                      if (match) {
                        return (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginTop: '10px',
                            marginBottom: '0px',
                          }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: '#000',
                            }}>
                              {match[1].trim()}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: '#000',
                            }}>
                              {match[2].trim()}
                            </span>
                          </div>
                        )
                      }

                      return (
                        <h3 style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginTop: '10px',
                          marginBottom: '0px',
                          color: '#000',
                        }}>
                          {children}
                        </h3>
                      )
                    },
                    h4: ({ children }) => (
                      <h4 style={{
                        fontSize: '11px',
                        fontStyle: 'italic',
                        marginTop: '0px',
                        marginBottom: '4px',
                        color: '#000',
                        fontWeight: 'normal',
                      }}>
                        {children}
                      </h4>
                    ),
                    p: ({ children, node }) => {
                      // Check if this is the contact info line (right after name)
                      const text = String(children)
                      const isContactInfo = text.includes('@') || text.includes('linkedin') || text.includes('|')

                      if (isContactInfo) {
                        return (
                          <p style={{
                            fontSize: '10px',
                            textAlign: 'center',
                            color: '#333',
                            marginBottom: '12px',
                            lineHeight: '1.6',
                          }}>
                            {children}
                          </p>
                        )
                      }

                      return (
                        <p style={{
                          fontSize: '11px',
                          lineHeight: '1.5',
                          marginBottom: '6px',
                          color: '#000',
                          textAlign: 'justify',
                        }}>
                          {children}
                        </p>
                      )
                    },
                    ul: ({ children }) => (
                      <ul style={{
                        marginLeft: '16px',
                        marginBottom: '6px',
                        paddingLeft: '0',
                        listStyleType: 'disc',
                      }}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{
                        marginLeft: '16px',
                        marginBottom: '6px',
                        paddingLeft: '0',
                        listStyleType: 'decimal',
                      }}>
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li style={{
                        fontSize: '11px',
                        lineHeight: '1.5',
                        marginBottom: '2px',
                        color: '#000',
                      }}>
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: 'bold', color: '#000' }}>
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em style={{ fontStyle: 'italic' }}>
                        {children}
                      </em>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#0066cc',
                          textDecoration: 'none',
                        }}
                      >
                        {children}
                      </a>
                    ),
                    hr: () => (
                      <hr style={{
                        border: 'none',
                        borderTop: '1px solid #ccc',
                        margin: '12px 0',
                      }} />
                    ),
                    blockquote: ({ children }) => (
                      <blockquote style={{
                        borderLeft: '3px solid #ccc',
                        paddingLeft: '10px',
                        margin: '10px 0',
                        fontStyle: 'italic',
                        color: '#555',
                      }}>
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {resume.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}