import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

let model: GenerativeModel | null = null

function getModel(): GenerativeModel {
  if (!model) {
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    model = genai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
    })
  }
  return model
}

export interface ReviewResult {
  feedback:   string
  tokensUsed: number
}

export async function reviewCodeDiff(
  diff: string,
  prTitle: string,
  prAuthor = 'unknown'
): Promise<ReviewResult> {
  const truncatedDiff = diff.length > 20000
    ? diff.slice(0, 20000) + '\n\n[... diff truncated ...]'
    : diff

  const prompt = `You are a senior software engineer performing a thorough pull request review.

**PR Title:** ${prTitle}
**Author:** ${prAuthor}

**Code Diff:**
\`\`\`diff
${truncatedDiff}
\`\`\`

Provide a structured review with these exact sections:

## 🐛 Bugs & Logic Errors
Actual bugs that will break at runtime with line numbers. If none: *No bugs found ✅*

## 🔒 Security Issues
SQL injection, XSS, exposed secrets, insecure auth. If none: *No security issues found ✅*

## ⚡ Performance
Unnecessary loops, N+1 queries, memory leaks. If none: *No performance issues found ✅*

## 🎨 Code Quality
Naming, duplication, missing error handling, readability.

## ✅ Summary
2-3 sentences. Overall assessment. What was done well, what needs work.

Rules: cite line numbers, do not invent issues, format for GitHub Markdown.`

  const result   = await getModel().generateContent(prompt)
  const response = result.response

  return {
    feedback:   response.text(),
    tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
  }
}