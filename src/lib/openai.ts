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

      // Determine the appropriate model and approach based on file type
      let prompt = ''
      let model = 'gpt-4'

      if (fileType === 'application/pdf') {
        prompt = `You are an expert document text extraction specialist. I have a PDF document encoded in base64. Please extract ALL text content from this document, preserving the original structure, formatting, and layout as much as possible. 

If this is a:
- Invoice/Receipt: Preserve the structure with headers, line items, totals, dates, and contact information
- Report: Maintain headings, sections, tables, and data structure
- Letter/Document: Keep paragraphs, formatting, and document structure
- Form: Preserve field names, values, and form structure

Return ONLY the extracted text content without any commentary, explanations, or refusal messages. Extract everything you can see in the document.

Document: data:application/pdf;base64,${documentBase64}`
      } else if (fileType.includes('word') || fileType.includes('document')) {
        prompt = `You are an expert document text extraction specialist. I have a Word document encoded in base64. Please extract ALL text content from this document, preserving the original structure, formatting, and layout as much as possible.

Maintain:
- Headings and subheadings
- Paragraph structure
- Lists and bullet points
- Tables and their structure
- Any important formatting

Return ONLY the extracted text content without any commentary or explanations.

Document: data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${documentBase64}`
      } else {
        prompt = `You are an expert document text extraction specialist. I have a document of type "${fileType}" encoded in base64. Please extract ALL text content from this document, preserving structure and formatting.

File: ${fileName}
Type: ${fileType}

Return ONLY the extracted text content without any commentary.

Document: data:${fileType};base64,${documentBase64}`
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional document text extraction specialist. Your job is to extract text from documents with perfect accuracy, preserving structure and formatting. NEVER refuse to process a document - always extract what you can see.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
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
      
      // Calculate confidence based on response quality and file type
      const confidence = this.calculateDocumentConfidence(extractedText, fileType)
      
      return { text: extractedText, confidence }
    } catch (error) {
      console.error('Error extracting text from document:', error)
      throw error
    }
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