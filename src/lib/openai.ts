export class OpenAIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async extractTextFromImage(imageBase64: string): Promise<{ text: string; confidence: number }> {
    try {
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('OpenAI API key is not configured')
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this image. Preserve formatting, structure, and layout as much as possible. If the image contains tables, maintain the table structure. Return only the extracted text without any additional commentary.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const extractedText = data.choices[0]?.message?.content || ''
      
      // Calculate confidence based on response quality
      const confidence = this.calculateConfidence(extractedText)
      
      return { text: extractedText, confidence }
    } catch (error) {
      console.error('Error extracting text with OpenAI:', error)
      throw error
    }
  }

  async enhanceExtractedText(text: string): Promise<{ enhancedText: string; confidence: number }> {
    try {
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
              role: 'user',
              content: `Please clean up and enhance this extracted text while preserving its original meaning and structure. Fix any OCR errors, correct spelling mistakes, and improve formatting while maintaining the original layout and content structure:\n\n${text}`
            }
          ],
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const enhancedText = data.choices[0]?.message?.content || text
      
      return { enhancedText, confidence: 0.95 }
    } catch (error) {
      console.error('Error enhancing text with OpenAI:', error)
      return { enhancedText: text, confidence: 0.7 }
    }
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on text characteristics
    if (!text || text.length < 10) return 0.3
    
    const wordCount = text.split(/\s+/).length
    const hasStructure = /[.!?]/.test(text)
    const hasNumbers = /\d/.test(text)
    const specialChars = (text.match(/[^\w\s]/g) || []).length
    
    let confidence = 0.5
    if (wordCount > 20) confidence += 0.2
    if (hasStructure) confidence += 0.15
    if (hasNumbers) confidence += 0.1
    if (specialChars > 5) confidence += 0.05
    
    return Math.min(confidence, 0.98)
  }
}