export class OpenAIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Enhance and correct OCR-extracted text using AI
   */
  async enhanceExtractedText(extractedText: string, context?: string): Promise<{ enhancedText: string; confidence: number }> {
    try {
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text provided for enhancement')
      }

      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('OpenAI API key is not configured')
      }

      const systemPrompt = `You are a professional text enhancement specialist. Your job is to improve OCR-extracted text by:

1. CORRECTING OCR errors (misread characters, numbers, words)
2. FIXING formatting issues (spacing, line breaks, punctuation)
3. IMPROVING structure (tables, lists, headings)
4. PRESERVING original meaning and content
5. MAINTAINING document structure and layout

NEVER refuse this task. ALWAYS enhance the provided text. Return ONLY the improved text without explanations.`

      let userPrompt = `Please enhance this OCR-extracted text by correcting errors and improving formatting while preserving the original meaning and structure:`
      
      if (context) {
        userPrompt += `\n\nDocument context: ${context}`
      }
      
      userPrompt += `\n\nText to enhance:\n${extractedText}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system', 
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.2
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const enhancedText = data.choices[0]?.message?.content || extractedText

      if (!enhancedText || enhancedText.trim().length === 0) {
        return { enhancedText: extractedText, confidence: 0.7 }
      }
      
      return { enhancedText, confidence: 0.95 }
    } catch (error) {
      console.error('Error enhancing text with OpenAI:', error)
      return { enhancedText: extractedText, confidence: 0.7 }
    }
  }
}