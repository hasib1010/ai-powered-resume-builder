// Save as: /api/generate-initial-resume/route.js

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

    console.log('Processing file:', resumeFile.name, 'Type:', resumeFile.type, 'Size:', resumeFile.size)

    const resumeText = await extractTextFromFile(resumeFile, resumeFile.type)

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the resume file.' },
        { status: 400 }
      )
    }

    console.log('Extracted text length:', resumeText.length)

    const hasJobDescription = jobDescription && typeof jobDescription === 'string' && jobDescription.trim()
    const jobDescriptionText = hasJobDescription ? jobDescription.trim() : ''

    const modelsToTry = ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
    let completion;
    let lastError;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        
        completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a professional resume writer. Create an INITIAL resume that includes AS MANY roles as possible within the 4K token limit.

CRITICAL INSTRUCTIONS:
1. This is the FIRST PASS - generate as much as you can within token limits
2. Include header, summary, and AS MANY roles as possible
3. Prioritize recent/important roles but include as many as you can fit
4. Use EXACT company names, job titles, and dates from source text
5. Extract REAL achievements from the source text only
6. List ALL roles you find in a special section at the end for verification

BULLET POINT ALLOCATION (VERY IMPORTANT):
- FIRST 3 ROLES (most recent): 5 bullet points each
- ALL OTHER ROLES (4th role and beyond): 3 bullet points each

ROLE INCLUSION STRATEGY:
- PRIORITIZE roles from the last 15 years (2009-2025)
- Include older roles only if space allows and they add significant value
- Focus on relevant, recent career progression

FORMATTING STRUCTURE:
**[Name]**
[City, State] | [Phone] | [Email] | [LinkedIn]

**PROFESSIONAL SUMMARY**
[3-4 sentences highlighting total experience]

**PROFESSIONAL EXPERIENCE**

For each role (follow bullet allocation above):
**Job Title** **Year – Year**
*Company Name – City, State*
● Real achievement from source text
● Additional bullets based on role age (5 for newest, 3 for mid-career, 1 for older)
● Quantified results from original

Continue adding roles until you approach token limit.

**EDUCATION**
*School Name – City, State*
Degree, Year

**CERTIFICATIONS**
• Real certifications from source

**TECHNICAL SKILLS**
Skills from source text

**ROLE VERIFICATION LIST**
(List ALL roles found in source for comparison):
1. [Job Title] | [Company] | [Years] | [Position: 1st/2nd/3rd/4th+]
2. [Job Title] | [Company] | [Years] | [Position: 1st/2nd/3rd/4th+]
... (continue for ALL roles found)

${hasJobDescription ? `CUSTOMIZATION: Tailor content for: ${jobDescriptionText}` : 'GOAL: Include maximum roles within token limit with proper bullet allocation.'}`
            },
            {
              role: "user",
              content: `Create an initial resume including AS MANY roles as possible from this career history. Use the full 4K token allowance to include maximum roles:

${resumeText}

BULLET POINT REQUIREMENTS:
- FIRST 3 ROLES (most recent): 5 bullet points each
- ALL OTHER ROLES (4th role and beyond): 3 bullet points each

FOCUS STRATEGY:
- PRIORITIZE the last 15 years of experience (2009-2025)
- Include comprehensive coverage of recent career progression
- Add older roles only if they provide unique value or fill important gaps

IMPORTANT: 
1. Include as many roles as you can fit within the response limit
2. Use exact company names and job titles from the source
3. Follow the bullet allocation strictly based on role age
4. At the end, list ALL roles you found in the source (even ones you couldn't include)
5. This is pass 1 - a second API will fill in any missing roles

Generate the most comprehensive resume possible within token limits using proper bullet allocation.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000, // Maximum allowed
        });
        
        console.log(`Successfully used model: ${model}`);
        break;
        
      } catch (error) {
        console.log(`Model ${model} failed:`, error.message);
        lastError = error;
        
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw lastError;
        }
      }
    }

    const initialResume = completion.choices[0].message.content

    if (!initialResume) {
      return NextResponse.json(
        { error: 'Failed to generate initial resume content' },
        { status: 500 }
      )
    }

    console.log('Successfully generated initial resume, length:', initialResume.length)

    return NextResponse.json({ 
      initialResume: initialResume,
      originalText: resumeText, // Pass original text for second API
      jobDescription: jobDescriptionText,
      originalTextLength: resumeText.length,
      initialResumeLength: initialResume.length
    })

  } catch (error) {
    console.error('Error generating initial resume:', error)
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 402 }
      )
    }
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: `Failed to generate initial resume: ${error.message}` },
      { status: 500 }
    )
  }
}