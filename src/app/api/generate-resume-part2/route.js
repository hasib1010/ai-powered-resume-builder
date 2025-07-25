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

    const { resumeText, jobDescription, part1Content } = await request.json()

    const hasJobDescription = jobDescription && typeof jobDescription === 'string' && jobDescription.trim()

    const modelsToTry = ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
    let completion;
    let lastError;

    for (const model of modelsToTry) {
      try {
        // First, analyze all roles in the resume
        const roleAnalysisCompletion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a career analyst. Extract EVERY SINGLE job/role/position mentioned in a resume. You must ONLY extract roles that actually exist in the resume text - DO NOT invent or hallucinate any positions.

CRITICAL RULES:
1. ONLY extract jobs that are explicitly mentioned in the resume text
2. Use EXACT company names as written in the resume
3. Use EXACT job titles as written in the resume
4. Use EXACT date ranges as written in the resume
5. If a role is not clearly stated, DO NOT include it
6. DO NOT create plausible-sounding roles - only real ones from the text

OUTPUT FORMAT:
For each role found, output exactly this format:
ROLE: [EXACT Job Title from resume] | [EXACT Company from resume] | [EXACT Years from resume] | [Location if available]

SEARCH METHOD:
1. Look for clear job title headers
2. Look for company names in italics or bold
3. Look for date ranges associated with positions
4. Look for role descriptions under company headers
5. Include multiple positions at the same company if listed

QUALITY CHECK: Every role you output must be verifiable by pointing to specific text in the resume.`
            },
            {
              role: "user",
              content: `Analyze this resume and extract EVERY SINGLE role/position that is ACTUALLY mentioned in the text. Do NOT invent any roles - only extract what is explicitly stated:

${resumeText}

Remember: ONLY extract roles that are explicitly mentioned in this resume text. Use exact company names, job titles, and dates as written. Do not hallucinate or create plausible roles.`
            }
          ],
          temperature: 0.1, // Very low temperature for accuracy
          max_tokens: 2048,
        });

        const roleAnalysis = roleAnalysisCompletion.choices[0].message.content;
        console.log('Role analysis completed:', roleAnalysis);

        // Now generate Part 2 using the role analysis
        completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `Create PART 2 of the resume (ALL Remaining Roles + Closing Sections) following EXACT formatting. 

CRITICAL REQUIREMENT - STRICT ADHERENCE TO ORIGINAL RESUME:
1. You have been provided with role analysis of the ACTUAL roles in the original resume
2. You must ONLY include roles that exist in the role analysis
3. You must use EXACT company names, job titles, and dates from the original resume
4. DO NOT invent, modify, or hallucinate any roles, companies, or achievements
5. Extract achievements directly from the original resume text - do not create new ones

PART 1 EXCLUSION RULE:
- Part 1 typically includes the 3-4 most recent/senior roles
- Include ALL other roles from the role analysis that weren't in Part 1

FORMATTING FOR EACH ROLE (use EXACT info from original resume):
**[EXACT Job Title from original]** **[EXACT Years from original]**
*[EXACT Company Name from original] -- [Location from original]*
● [ACTUAL achievement/responsibility from original resume]
● [Additional ACTUAL bullets from original resume]

MANDATORY SECTIONS AT END:
**EDUCATION**
*[EXACT School Name from original] -- [Location]*
[EXACT Degree and Year from original]

**CERTIFICATIONS**
• [EXACT certification details from original resume]

**TECHNICAL SKILLS**
[EXACT skills list from original resume]

VERIFICATION REQUIREMENT:
Every single detail you include must be verifiable in the original resume text. Do not invent anything.`
            },
            {
              role: "user",
              content: `${hasJobDescription ? `Job Description:\n${jobDescription}\n\n` : ''}

ROLE ANALYSIS (ONLY roles actually found in original resume):
${roleAnalysis}

Original Resume Content (SOURCE OF TRUTH):
${resumeText}

${part1Content ? `Part 1 Content (roles already included - DO NOT REPEAT THESE):\n${part1Content}\n\n` : ''}

CRITICAL INSTRUCTIONS:
1. Review the role analysis - these are the ONLY roles that exist in this person's resume
2. Identify which roles from the analysis were likely included in Part 1
3. Include ALL remaining roles from the role analysis in Part 2
4. Use ONLY the original resume text to extract achievements
5. Use EXACT company names, job titles, dates as they appear in the original
6. DO NOT create or modify any content - extract exactly what is written

VERIFICATION CHECK:
Before including any role, company, or achievement, verify it exists in the original resume text above.

CREATE PART 2 WITH ALL REMAINING ROLES FROM THE ORIGINAL RESUME ONLY:`
            }
          ],
          temperature: 0.3, // Lower temperature for accuracy
          max_tokens: 4096,
        });
        
        break;
        
      } catch (error) {
        lastError = error;
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw lastError;
        }
      }
    }

    const generatedPart2 = completion.choices[0].message.content

    return NextResponse.json({ 
      resumePart2: generatedPart2
    })

  } catch (error) {
    console.error('Error generating resume part 2:', error)
    return NextResponse.json(
      { error: `Failed to generate resume part 2: ${error.message}` },
      { status: 500 }
    )
  }
}