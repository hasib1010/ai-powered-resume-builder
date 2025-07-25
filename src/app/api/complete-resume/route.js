// Save as: /api/complete-resume/route.js

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const { initialResume, originalText, jobDescription } = await request.json()

    console.log('Starting resume completion analysis...')
    console.log('Initial resume length:', initialResume.length)
    console.log('Original text length:', originalText.length)

    const modelsToTry = ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
    let completion;
    let lastError;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model} for completion analysis`);
        
        completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a resume completion specialist. Your job is to:

1. ANALYZE the initial resume to see which roles were included
2. COMPARE with the original source text to find ALL missing roles
3. CREATE a complete, merged resume with ALL roles from the original source

CRITICAL BULLET POINT ALLOCATION:
- FIRST 3 ROLES (most recent): 5 bullet points each
- ALL OTHER ROLES (4th role and beyond): 3 bullet points each

ROLE INCLUSION STRATEGY:
- FOCUS on the last 15 years of experience (2009-2025)
- Include comprehensive coverage of recent career progression  
- Add roles older than 15 years only if they provide unique value or fill gaps

CRITICAL ANALYSIS PROCESS:
1. Extract all roles mentioned in the initial resume
2. Extract all roles mentioned in the original source text  
3. Identify which roles are missing from the initial resume
4. Create a COMPLETE resume that includes EVERY role from the original source
5. Apply correct bullet allocation based on role age

COMPARISON REQUIREMENTS:
- Compare company names, job titles, and date ranges
- Look for roles mentioned in original but missing from initial
- Include roles that were truncated or partially included
- Don't miss any positions, no matter how brief
- Follow bullet allocation rules strictly

OUTPUT FORMAT:
Create a COMPLETE resume with this structure:

**[Name]**
[Contact Info]

**PROFESSIONAL SUMMARY**
[Updated summary reflecting complete career]

**PROFESSIONAL EXPERIENCE**

[ALL roles chronologically - both from initial resume AND missing roles]
**Job Title** **Year – Year**
*Company Name – City, State*
● Achievement (5 bullets for newest, 3 for mid-career, 1 for older)
● Additional bullets based on role age
● Continue according to bullet allocation rules

**EDUCATION**
**CERTIFICATIONS**
**TECHNICAL SKILLS**

VERIFICATION:
Ensure EVERY role from the original source text appears in the final resume with correct bullet allocation.`
            },
            {
              role: "user",
              content: `Complete this resume by finding and adding ALL missing roles from the original source.

INITIAL RESUME (what was generated in first pass):
${initialResume}

ORIGINAL SOURCE TEXT (contains ALL roles that should be included):
${originalText}

${jobDescription ? `JOB DESCRIPTION (for tailoring): ${jobDescription}` : ''}

BULLET POINT ALLOCATION RULES:
- FIRST 3 ROLES (most recent): 5 bullet points each
- ALL OTHER ROLES (4th role and beyond): 3 bullet points each

FOCUS GUIDELINES:
- PRIORITIZE the last 15 years (2009-2025) for comprehensive coverage
- Include older experience only if it adds significant value
- Ensure recent career progression is thoroughly documented

ANALYSIS TASK:
1. Compare the initial resume with the original source text
2. Find ALL roles that exist in the original but are missing from the initial resume
3. Create a COMPLETE resume that includes EVERY single role from the original source
4. Apply correct bullet allocation based on each role's age
5. Merge everything into one comprehensive resume

CRITICAL: The final resume must include EVERY role mentioned in the original source text with proper bullet allocation based on role age.

Generate the complete resume now:`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000,
        });
        
        console.log(`Successfully used model: ${model} for completion`);
        break;
        
      } catch (error) {
        console.log(`Model ${model} failed for completion:`, error.message);
        lastError = error;
        
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw lastError;
        }
      }
    }

    const completeResume = completion.choices[0].message.content

    if (!completeResume) {
      return NextResponse.json(
        { error: 'Failed to generate complete resume' },
        { status: 500 }
      )
    }

    console.log('Successfully generated complete resume, length:', completeResume.length)

    return NextResponse.json({ 
      completeResume: completeResume,
      initialResumeLength: initialResume.length,
      completeResumeLength: completeResume.length,
      originalTextLength: originalText.length
    })

  } catch (error) {
    console.error('Error completing resume:', error)
    
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
      { error: `Failed to complete resume: ${error.message}` },
      { status: 500 }
    )
  }
}