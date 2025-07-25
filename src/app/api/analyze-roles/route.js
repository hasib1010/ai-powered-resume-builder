// This should be saved as /api/analyze-roles/route.js

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

    const { resumeText } = await request.json()

    const modelsToTry = ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
    let completion;
    let lastError;

    for (const model of modelsToTry) {
      try {
        completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a career analyst. Your job is to extract EVERY SINGLE job/role/position mentioned in a resume. Be extremely thorough and methodical.

EXTRACTION RULES:
1. Find every job title with a company name
2. Look for multiple positions at the same company
3. Include internships, part-time work, consulting
4. Find roles mentioned in paragraphs or descriptions
5. Include temporary, seasonal, or contract positions
6. Look for career progression within companies
7. Don't miss early career or entry-level positions

OUTPUT FORMAT:
For each role found, output exactly this format:
ROLE: [Job Title] | [Company] | [Years] | [Location if available]

SEARCH AREAS:
- Headers and section titles
- Job descriptions and bullet points
- Company progression narratives
- Achievement descriptions that mention previous roles
- Education section (for internships)
- Any chronological listings

BE EXHAUSTIVE - err on the side of including too much rather than missing roles.`
            },
            {
              role: "user",
              content: `Analyze this resume and extract EVERY SINGLE role/position mentioned. Be extremely thorough:

${resumeText}

Instructions:
1. Read through the ENTIRE resume text carefully
2. Extract every job title, company, and date range you find
3. Look for multiple positions at the same company over time
4. Include ALL employment history, no matter how brief
5. Find roles mentioned anywhere in the text
6. Output each role in the specified format

Start your analysis now and list EVERY role found:`
            }
          ],
          temperature: 0.3,
          max_tokens: 2048,
        });
        
        break;
        
      } catch (error) {
        lastError = error;
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw lastError;
        }
      }
    }

    const roleAnalysis = completion.choices[0].message.content

    return NextResponse.json({ 
      roleAnalysis: roleAnalysis
    })

  } catch (error) {
    console.error('Error analyzing roles:', error)
    return NextResponse.json(
      { error: `Failed to analyze roles: ${error.message}` },
      { status: 500 }
    )
  }
}