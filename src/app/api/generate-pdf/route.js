// Save as: /api/generate-pdf/route.js

import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request) {
  let browser = null
  
  try {
    const { resume } = await request.json()

    if (!resume || typeof resume !== 'string' || !resume.trim()) {
      return NextResponse.json(
        { error: 'Resume content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    console.log('Generating PDF for resume length:', resume.length)

    // Convert markdown-style formatting to HTML with professional structure
    const resumeData = parseResumeContent(resume)
    
    // Create structured HTML
    let htmlContent = ''

    // 1. NAME - Centered, Bold, Large
    if (resumeData.name) {
      htmlContent += `<div class="name-header">${resumeData.name}</div>`
    }

    // 2. CONTACT INFO - Centered
    if (resumeData.contact) {
      htmlContent += `<div class="contact-info">${resumeData.contact}</div>`
    }

    // 3. PROFESSIONAL SUMMARY
    if (resumeData.summary) {
      htmlContent += `<div class="section-header">PROFESSIONAL SUMMARY</div>`
      htmlContent += `<div class="summary-content">${resumeData.summary}</div>`
    }

    // 4. PROFESSIONAL EXPERIENCE
    if (resumeData.experience && resumeData.experience.length > 0) {
      htmlContent += `<div class="section-header">PROFESSIONAL EXPERIENCE</div>`
      
      resumeData.experience.forEach((job, index) => {
        // Job title and dates (justified)
        htmlContent += `<div class="job-header">
          <span class="job-title">${job.title}</span>
          <span class="job-dates">${job.dates}</span>
        </div>`
        
        // Company name (italic)
        htmlContent += `<div class="company-name">${job.company}</div>`
        
        // Bullet points
        if (job.bullets && job.bullets.length > 0) {
          htmlContent += '<ul class="job-bullets">'
          job.bullets.forEach(bullet => {
            htmlContent += `<li>${bullet}</li>`
          })
          htmlContent += '</ul>'
        }
      })
    }

    // 5. EDUCATION
    if (resumeData.education && resumeData.education.length > 0) {
      htmlContent += `<div class="section-header">EDUCATION</div>`
      resumeData.education.forEach(edu => {
        htmlContent += `<div class="education-school">${edu.school}</div>`
        htmlContent += `<div class="education-degree">${edu.degree}</div>`
      })
    }

    // 6. CERTIFICATIONS
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      htmlContent += `<div class="section-header">CERTIFICATIONS</div>`
      htmlContent += '<ul class="certifications-list">'
      resumeData.certifications.forEach(cert => {
        htmlContent += `<li>${cert}</li>`
      })
      htmlContent += '</ul>'
    }

    // 7. TECHNICAL SKILLS
    if (resumeData.skills) {
      htmlContent += `<div class="section-header">TECHNICAL SKILLS</div>`
      htmlContent += `<div class="skills-content">${resumeData.skills}</div>`
    }

    // Create professional HTML structure
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Resume</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              line-height: 1.4;
              margin: 0.75in;
              font-size: 11pt;
              color: #000;
              max-width: 8.5in;
              background: white;
            }
            
            .name-header {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
              margin-bottom: 5px;
            }
            
            .contact-info {
              text-align: center;
              margin-bottom: 20px;
              font-size: 11pt;
            }
            
            .section-header {
              font-size: 12pt;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            
            .summary-content {
              margin-bottom: 20px;
              text-align: justify;
            }
            
            .job-header {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              margin-bottom: 5px;
            }
            
            .job-title {
              font-weight: bold;
              font-size: 11pt;
            }
            
            .job-dates {
              font-weight: bold;
              font-size: 11pt;
            }
            
            .company-name {
              font-style: italic;
              margin-bottom: 10px;
              font-size: 11pt;
            }
            
            .job-bullets {
              margin: 5px 0 15px 0;
              padding-left: 20px;
            }
            
            .job-bullets li {
              margin-bottom: 4px;
              list-style-type: disc;
            }
            
            .education-school {
              font-style: italic;
              margin-bottom: 5px;
            }
            
            .education-degree {
              margin-bottom: 15px;
            }
            
            .certifications-list {
              margin: 5px 0 15px 0;
              padding-left: 20px;
            }
            
            .certifications-list li {
              margin-bottom: 4px;
              list-style-type: disc;
            }
            
            .skills-content {
              margin-bottom: 15px;
              text-align: justify;
            }
            
            @page {
              margin: 0.75in;
              size: letter;
            }
            
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="resume-content">${htmlContent}</div>
        </body>
      </html>
    `

    console.log('Launching browser...')
    
    // Launch browser with minimal configuration
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run'
      ]
    })
    
    console.log('Creating new page...')
    const page = await browser.newPage()
    
    console.log('Setting page content...')
    await page.setContent(html)
    
    console.log('Generating PDF...')
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      }
    })

    console.log('PDF generated successfully, size:', pdfBuffer.length)

    // Close browser
    await browser.close()
    browser = null

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    
    // Cleanup browser if it exists
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        // Ignore close errors
        console.log('Browser close error (ignored):', closeError.message)
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Helper function to parse resume content into structured data (same as DOC version)
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
      else if (line.match(/^[●•-]/)) {
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
      if (line.match(/^[●•-]/)) {
        data.certifications.push(line.substring(1).trim())
      }
    } else if (currentSection === 'skills') {
      if (!line.match(/^\*\*/) && !line.match(/^[●•-]/)) {
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