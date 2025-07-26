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
              role: 'system',
              content: 'You are an expert OCR text extraction specialist. Extract ALL text from images with maximum accuracy, preserving formatting, structure, and layout. Always provide the extracted text without any commentary or refusal.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract ALL text from this image. Preserve the original formatting, structure, and layout as much as possible. If there are tables, maintain their structure. If it\'s a document like an invoice or receipt, maintain the document structure. Return ONLY the extracted text content, no explanations or commentary.'
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
          max_tokens: 4000,
          temperature: 0.1
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
              content: 'You are a text enhancement specialist. Your job is to clean up and improve OCR-extracted text while preserving its original meaning, structure, and formatting. Fix spelling errors, correct OCR artifacts, improve punctuation, and ensure proper formatting. NEVER refuse the task or say you cannot process the text - simply provide the enhanced version.'
            },
            {
              role: 'user',
              content: `Please enhance and clean up this extracted text. Fix any OCR errors, correct spelling mistakes, improve formatting and punctuation, while maintaining the original structure and meaning. Here is the text to enhance:\n\n${text}`
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
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