// Save this as: /api/generate-resume/route.js (replace your current file)

import { NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function extractTextFromFile(file, fileType) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    if (fileType === 'application/pdf') {
      const pdfData = await pdf(buffer, {
        useWorker: false,
        normalizeWhitespace: false,
        disableCombineTextItems: false
      })
      return pdfData.text
    } else if (
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } else {
      throw new Error('Unsupported file type')
    }
  } catch (error) {
    console.error('Error extracting text from file:', error)
    
    if (fileType === 'application/pdf') {
      console.log('Trying alternative PDF parsing...')
      try {
        const pdfData = await pdf(buffer)
        return pdfData.text
      } catch (fallbackError) {
        console.error('Fallback PDF parsing also failed:', fallbackError)
        throw new Error(`Failed to extract text from PDF file. Please ensure the PDF contains selectable text and is not image-based.`)
      }
    }
    
    throw new Error(`Failed to extract text from file: ${error.message}`)
  }
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const jobDescription = formData.get('jobDescription')
    const resumeFile = formData.get('resume')

    if (!resumeFile || !resumeFile.name) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      )
    }

    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    console.log('Processing file:', resumeFile.name, 'Type:', resumeFile.type, 'Size:', resumeFile.size)

    const resumeText = await extractTextFromFile(resumeFile, resumeFile.type)

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the resume file. Please ensure the file is not corrupted and contains text.' },
        { status: 400 }
      )
    }

    console.log('Extracted text length:', resumeText.length)

    const hasJobDescription = jobDescription && typeof jobDescription === 'string' && jobDescription.trim()
    const jobDescriptionText = hasJobDescription ? jobDescription.trim() : ''

    const modelsToTry = [
      { name: 'gpt-4', maxTokens: 4096 },
      { name: 'gpt-4-turbo-preview', maxTokens: 4096 },
      { name: 'gpt-3.5-turbo', maxTokens: 4096 }
    ];
    let completion;
    let lastError;

    for (const modelConfig of modelsToTry) {
      try {
        console.log(`Trying model: ${modelConfig.name} with max_tokens: ${modelConfig.maxTokens}`);
        completion = await openai.chat.completions.create({
          model: modelConfig.name,
          messages: [
            {
              role: "system",
              content: `You are a professional resume writer. Create a complete, comprehensive resume that includes EVERY SINGLE role from the person's career history.

CRITICAL REQUIREMENTS:
1. Read the ENTIRE resume text carefully - it contains the person's complete work history
2. Extract ALL jobs/positions mentioned anywhere in the text  
3. Include EVERY role chronologically from most recent to oldest
4. Do NOT skip any positions - include entire career history
5. Use EXACT company names, job titles, and dates from the text
6. Extract REAL achievements from the source text only

RESUME TEXT ANALYSIS:
The provided text contains a person's complete career history. Look for:
- Job titles and position names
- Company names (look for patterns like "Company Name, Location" or company headers)
- Date ranges (years of employment)
- Job descriptions and achievements
- Multiple positions at the same company
- Career progression over time

FORMATTING STRUCTURE:
**[Name]**
[City, State] | [Phone] | [Email] | [LinkedIn]

**PROFESSIONAL SUMMARY**
[3-4 sentences highlighting total experience and key strengths]

**PROFESSIONAL EXPERIENCE**

For EVERY role found in the text:
**Job Title** **Year – Year**
*Company Name – City, State*
● Real achievement extracted from the source text
● Additional accomplishments from the source
● Quantified results and metrics from original text

BULLET ALLOCATION:
- Most recent 3-4 roles: 4-5 bullets each
- Mid-career roles (2010-2015): 3-4 bullets each
- Earlier roles (2005-2010): 2-3 bullets each
- Early career roles (pre-2005): 1-2 bullets each

**EDUCATION**
*School Name – City, State*
Degree, Year

**CERTIFICATIONS**
• Real certifications from source text

**TECHNICAL SKILLS**
Skills mentioned in the source text

DEBUGGING: If you're having trouble finding roles, look for:
- Names of organizations/employers
- Job position titles
- Years or date ranges
- Geographic locations
- Career progression indicators

${hasJobDescription ? `CUSTOMIZATION: Tailor content for this role: ${jobDescriptionText}` : 'GOAL: Create comprehensive resume with complete career history.'}`
            },
            {
              role: "user",
              content: `Create a COMPLETE resume that includes EVERY SINGLE role from this person's career history.

ANALYSIS STEPS:
1. READ the entire text below carefully
2. IDENTIFY every job title, company name, and date range mentioned
3. EXTRACT all employment history spanning the person's entire career
4. CREATE a comprehensive resume with ALL positions included

SOURCE TEXT (contains complete career history):
${resumeText}

CRITICAL INSTRUCTIONS:
- This text contains the person's ENTIRE work history
- Include ALL roles mentioned - do not skip any positions
- Look for multiple jobs at the same company over different time periods
- Extract real achievements and accomplishments from this source text
- Use exact company names and job titles as they appear in the source
- If you see 20+ years of experience mentioned, find roles spanning that entire period

QUALITY CHECK: Count the total years of experience and make sure your resume includes roles covering that full timespan.`
            }
          ],
          temperature: 0.2, // Lower temperature for better accuracy
          max_tokens: modelConfig.maxTokens,
        });

        console.log(`Successfully used model: ${modelConfig.name}`);
        break;

      } catch (error) {
        console.log(`Model ${modelConfig.name} failed:`, error.message);
        lastError = error;

        if (modelConfig === modelsToTry[modelsToTry.length - 1]) {
          throw lastError;
        }
      }
    }

    const generatedResume = completion.choices[0].message.content

    if (!generatedResume) {
      return NextResponse.json(
        { error: 'Failed to generate resume content' },
        { status: 500 }
      )
    }

    console.log('Successfully generated complete resume, length:', generatedResume.length)

    return NextResponse.json({ 
      resume: generatedResume,
      originalTextLength: resumeText.length,
      generatedLength: generatedResume.length
    })

  } catch (error) {
    console.error('Error generating resume:', error)

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please add billing details or upgrade your plan at platform.openai.com.' },
        { status: 402 }
      )
    }

    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.' },
        { status: 401 }
      )
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    if (error.message?.includes('max_tokens')) {
      return NextResponse.json(
        { error: 'Token limit issue. Please try with a shorter resume or contact support.' },
        { status: 400 }
      )
    }

    // Handle file processing errors
    if (error.message?.includes('extract text')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: `Failed to generate resume: ${error.message || 'Unknown error occurred'}` },
      { status: 500 }
    )
  }
}