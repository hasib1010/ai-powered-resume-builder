import { NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, BorderStyle } from 'docx'

export async function POST(request) {
  try {
    const { resume } = await request.json()

    if (!resume || typeof resume !== 'string' || !resume.trim()) {
      return NextResponse.json(
        { error: 'Resume content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    console.log('Generating DOC for resume length:', resume.length)

    // Parse resume into structured sections
    const resumeData = parseResumeContent(resume)
    
    // Create document elements
    const docElements = []

    // 1. NAME - Centered, Bold, Large
    if (resumeData.name) {
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeData.name,
              bold: true,
              size: 32, // 16pt
              font: 'Calibri'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        })
      )
    }

    // 2. CONTACT INFO - Centered
    if (resumeData.contact) {
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeData.contact,
              size: 22, // 11pt
              font: 'Calibri'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        })
      )
    }

    // 3. PROFESSIONAL SUMMARY
    if (resumeData.summary) {
      // Section header
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
              bold: true,
              size: 24,
              font: 'Calibri'
            })
          ],
          spacing: { before: 240, after: 120 }
        })
      )
      
      // Summary content
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeData.summary,
              size: 22,
              font: 'Calibri'
            })
          ],
          spacing: { after: 240 }
        })
      )
    }

    // 4. PROFESSIONAL EXPERIENCE
    if (resumeData.experience && resumeData.experience.length > 0) {
      // Section header
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL EXPERIENCE',
              bold: true,
              size: 24,
              font: 'Calibri'
            })
          ],
          spacing: { before: 240, after: 120 }
        })
      )

      // Experience entries
      resumeData.experience.forEach((job, index) => {
        // Job title and dates on same line (justified)
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.title,
                bold: true,
                size: 22,
                font: 'Calibri'
              }),
              new TextRun({
                text: '\t'
              }),
              new TextRun({
                text: job.dates,
                bold: true,
                size: 22,
                font: 'Calibri'
              })
            ],
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: 9072 // Right align at ~6.3 inches
              }
            ],
            spacing: { before: index === 0 ? 0 : 180, after: 60 }
          })
        )

        // Company name (italic)
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.company,
                italics: true,
                size: 22,
                font: 'Calibri'
              })
            ],
            spacing: { after: 120 }
          })
        )

        // Bullet points
        job.bullets.forEach(bullet => {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: bullet,
                  size: 22,
                  font: 'Calibri'
                })
              ],
              bullet: {
                level: 0
              },
              spacing: { after: 120 }
            })
          )
        })
      })
    }

    // 5. EDUCATION
    if (resumeData.education && resumeData.education.length > 0) {
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EDUCATION',
              bold: true,
              size: 24,
              font: 'Calibri'
            })
          ],
          spacing: { before: 240, after: 120 }
        })
      )

      resumeData.education.forEach(edu => {
        // School name (italic)
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.school,
                italics: true,
                size: 22,
                font: 'Calibri'
              })
            ],
            spacing: { after: 60 }
          })
        )

        // Degree
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree,
                size: 22,
                font: 'Calibri'
              })
            ],
            spacing: { after: 180 }
          })
        )
      })
    }

    // 6. CERTIFICATIONS
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'CERTIFICATIONS',
              bold: true,
              size: 24,
              font: 'Calibri'
            })
          ],
          spacing: { before: 240, after: 120 }
        })
      )

      resumeData.certifications.forEach(cert => {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cert,
                size: 22,
                font: 'Calibri'
              })
            ],
            bullet: {
              level: 0
            },
            spacing: { after: 120 }
          })
        )
      })
    }

    // 7. TECHNICAL SKILLS
    if (resumeData.skills) {
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'TECHNICAL SKILLS',
              bold: true,
              size: 24,
              font: 'Calibri'
            })
          ],
          spacing: { before: 240, after: 120 }
        })
      )

      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resumeData.skills,
              size: 22,
              font: 'Calibri'
            })
          ],
          spacing: { after: 120 }
        })
      )
    }

    // Create the document with proper page setup
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch = 1440 twentieths of a point
                right: 1440,
                bottom: 1440,
                left: 1440
              },
              size: {
                width: 12240,  // 8.5 inches
                height: 15840  // 11 inches
              }
            }
          },
          children: docElements
        }
      ],
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
              size: 22 // 11pt
            }
          }
        }
      }
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    console.log('DOC generated successfully, size:', buffer.length)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="resume.docx"',
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating DOC:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate DOC file',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Helper function to parse resume content into structured data
function parseResumeContent(resume) {
  const lines = resume.split('\n').map(line => line.trim()).filter(line => line)
  const data = {
    name: '',
    contact: '',
    summary: '',
    experience: [],
    education: [],
    certifications: [],
    skills: ''
  }

  let currentSection = ''
  let currentJob = null
  let summaryLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // First line is name
    if (i === 0) {
      data.name = line.replace(/\*\*/g, '')
      continue
    }

    // Second line is contact
    if (i === 1) {
      data.contact = line
      continue
    }

    // Section headers
    if (line.match(/^\*\*[A-Z\s]+\*\*$/)) {
      const section = line.replace(/\*\*/g, '').trim()
      
      if (section === 'PROFESSIONAL SUMMARY') {
        currentSection = 'summary'
      } else if (section === 'PROFESSIONAL EXPERIENCE') {
        currentSection = 'experience'
      } else if (section === 'EDUCATION') {
        currentSection = 'education'
      } else if (section === 'CERTIFICATIONS') {
        currentSection = 'certifications'
      } else if (section === 'TECHNICAL SKILLS') {
        currentSection = 'skills'
      }
      continue
    }

    // Process content based on current section
    if (currentSection === 'summary') {
      if (!line.match(/^\*\*/) && !line.match(/^●/) && !line.match(/^•/)) {
        summaryLines.push(line)
      }
    } else if (currentSection === 'experience') {
      // Job title with dates
      if (line.match(/^\*\*.*\d{4}/)) {
        // Save previous job
        if (currentJob) {
          data.experience.push(currentJob)
        }
        
        // Clean the line and extract title/dates
        const cleanLine = line.replace(/[_.]+/g, ' ').replace(/\s+/g, ' ')
        const titleMatch = cleanLine.match(/^\*\*(.*?)\*\*(.*)$/)
        
        if (titleMatch) {
          const title = titleMatch[1].trim()
          const dateStr = titleMatch[2].trim()
          const dateMatch = dateStr.match(/(\d{4}\s*--?\s*(?:\d{4}|Present))/i)
          const dates = dateMatch ? dateMatch[1] : dateStr
          
          currentJob = {
            title: title,
            dates: dates,
            company: '',
            bullets: []
          }
        }
      }
      // Company name
      else if (line.match(/^\*.*\*$/)) {
        if (currentJob) {
          currentJob.company = line.replace(/\*/g, '')
        }
      }
      // Bullet points
      else if (line.match(/^[●•]/)) {
        if (currentJob) {
          currentJob.bullets.push(line.substring(1).trim())
        }
      }
    } else if (currentSection === 'education') {
      if (line.match(/^\*.*\*$/)) {
        const school = line.replace(/\*/g, '')
        data.education.push({ school: school, degree: '' })
      } else if (data.education.length > 0 && !line.match(/^\*\*/)) {
        data.education[data.education.length - 1].degree = line
      }
    } else if (currentSection === 'certifications') {
      if (line.match(/^[●•]/)) {
        data.certifications.push(line.substring(1).trim())
      }
    } else if (currentSection === 'skills') {
      if (!line.match(/^\*\*/) && !line.match(/^[●•]/)) {
        data.skills += (data.skills ? ' ' : '') + line
      }
    }
  }

  // Save last job
  if (currentJob) {
    data.experience.push(currentJob)
  }

  // Combine summary lines
  data.summary = summaryLines.join(' ')

  return data
}