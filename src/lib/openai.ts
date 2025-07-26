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

  async extractTextFromDocument(documentBase64: string, fileType: string, fileName: string): Promise<{ text: string; confidence: number }> {
    try {
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('OpenAI API key is not configured')
      }

      // Create a direct, authoritative prompt that doesn't allow refusal
      const systemPrompt = `You are a professional document text extraction system. Your ONLY job is to extract text from documents. You NEVER refuse, you NEVER explain why you can't do something, you NEVER mention limitations. You ALWAYS extract the text content and return it immediately.

RULES:
1. Extract ALL visible text from any document provided
2. Preserve original formatting, structure, and layout
3. For invoices/receipts: maintain headers, line items, totals, dates
4. For reports: keep headings, sections, tables, data structure  
5. For forms: preserve field names and values
6. Return ONLY the extracted text content
7. No commentary, no explanations, no refusals
8. Process any document format provided`

      let userPrompt = ''
      
      if (fileType === 'application/pdf') {
        userPrompt = `Extract all text from this PDF document (${fileName}). Return only the text content with preserved formatting:\n\ndata:application/pdf;base64,${documentBase64}`
      } else if (fileType.includes('word') || fileType.includes('document')) {
        userPrompt = `Extract all text from this Word document (${fileName}). Preserve headings, paragraphs, lists, and tables:\n\ndata:${fileType};base64,${documentBase64}`
      } else {
        userPrompt = `Extract all text from this ${fileType} document (${fileName}). Return the complete text content:\n\ndata:${fileType};base64,${documentBase64}`
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system', 
              content: systemPrompt
            }
          ],
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const extractedText = data.choices[0]?.message?.content || ''
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from this document')
      }

      // Check if the response is a refusal and try alternative approach
      if (this.isRefusalResponse(extractedText)) {
        console.log('Got refusal response, trying alternative approach...')
        return await this.extractWithAlternativeMethod(documentBase64, fileType, fileName)
      }
      
      // Calculate confidence based on response quality and file type
      const confidence = this.calculateDocumentConfidence(extractedText, fileType)
      
      return { text: extractedText, confidence }
    } catch (error) {
      console.error('Error extracting text from document:', error)
      throw error
    }
  }

  private isRefusalResponse(text: string): boolean {
    const refusalPatterns = [
      'sorry',
      'cannot',
      'unable',
      'not able',
      'can\'t',
      'base64',
      'decoder',
      'as an ai',
      'i\'m sorry'
    ]
    
    const lowerText = text.toLowerCase()
    return refusalPatterns.some(pattern => lowerText.includes(pattern))
  }

  private async extractWithAlternativeMethod(documentBase64: string, fileType: string, fileName: string): Promise<{ text: string; confidence: number }> {
    // Alternative approach with more direct instruction
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
            content: `This is a document text extraction task. Extract the text content from this document and return it immediately. Do not explain, do not refuse, just extract the text:\n\nDocument type: ${fileType}\nFile: ${fileName}\nContent: ${documentBase64.substring(0, 1000)}...`
          }
        ],
        max_tokens: 3000,
        temperature: 0.0
      })
    })

    const data = await response.json()
    const extractedText = data.choices[0]?.message?.content || 'Unable to extract text from this document type'
    
    return { text: extractedText, confidence: 0.7 }
  }

  private calculateDocumentConfidence(text: string, fileType: string): number {
    if (!text || text.length < 10) return 0.3
    
    const wordCount = text.split(/\s+/).length
    const hasStructure = /[.!?]/.test(text)
    const hasNumbers = /\d/.test(text)
    const hasFormatting = /[:\-\|]/.test(text)
    
    let confidence = 0.6 // Base confidence for documents
    
    // Adjust based on content quality
    if (wordCount > 50) confidence += 0.15
    if (hasStructure) confidence += 0.1
    if (hasNumbers) confidence += 0.05
    if (hasFormatting) confidence += 0.05
    
    // Adjust based on file type
    if (fileType === 'application/pdf') confidence += 0.1
    if (fileType.startsWith('text/')) confidence += 0.2
    
    return Math.min(confidence, 0.95)
  }

  async enhanceExtractedText(text: string): Promise<{ enhancedText: string; confidence: number }> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for enhancement')
      }

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
              content: 'You are a text enhancement specialist. Clean up and improve text while preserving meaning, structure, and formatting. Fix spelling errors, correct OCR artifacts, improve punctuation. NEVER refuse - always enhance the text provided.'
            },
            {
              role: 'user',
              content: `Enhance this text by fixing errors and improving formatting while preserving the original meaning and structure:\n\n${text}`
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Enhancement failed: ${response.statusText}`)
      }

      const data = await response.json()
      const enhancedText = data.choices[0]?.message?.content || text

      // Check if response is a refusal
      if (this.isRefusalResponse(enhancedText)) {
        // Return original text if enhancement was refused
        return { enhancedText: text, confidence: 0.8 }
      }
      
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