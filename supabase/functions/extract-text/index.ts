import { createClient } from 'npm:@supabase/supabase-js@2'

interface ExtractTextRequest {
  file_data: string // base64 encoded file
  file_name: string
  file_type: string
  openai_api_key?: string
  user_id?: string
  enhance_text?: boolean
}

interface ExtractTextResponse {
  success: boolean
  data?: {
    extracted_text: string
    confidence_score: number
    processing_time: number
    file_name: string
    extraction_id?: string
  }
  error?: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
}

class OpenAIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async extractTextFromImage(imageBase64: string): Promise<{ text: string; confidence: number }> {
    try {
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

  async enhanceText(text: string): Promise<{ enhancedText: string; confidence: number }> {
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
      console.error('Error enhancing text:', error)
      return { enhancedText: text, confidence: 0.7 }
    }
  }

  private calculateConfidence(text: string): number {
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const requestBody: ExtractTextRequest = await req.json()
    const { file_data, file_name, file_type, openai_api_key, user_id, enhance_text = false } = requestBody

    // Validate required fields
    if (!file_data || !file_name || !file_type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: file_data, file_name, file_type' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const startTime = Date.now()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let extractedText = ''
    let confidence = 0.5
    let extraction_id: string | undefined

    // Extract text based on file type
    if (file_type.startsWith('image/')) {
      if (!openai_api_key) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API key required for image text extraction' 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const openaiService = new OpenAIService(openai_api_key)
      const result = await openaiService.extractTextFromImage(file_data)
      extractedText = result.text
      confidence = result.confidence

      // Enhance text if requested
      if (enhance_text && extractedText) {
        const enhanced = await openaiService.enhanceText(extractedText)
        extractedText = enhanced.enhancedText
        confidence = Math.max(confidence, enhanced.confidence)
      }
    } else {
      // For non-image files, you could add other parsers here
      // For now, return an informative message
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Document parsing not yet implemented. Currently only supports image files.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const processingTime = Date.now() - startTime

    // Save to database if user_id is provided
    if (user_id) {
      try {
        // Create a temporary file URL (in production, you'd upload to storage)
        const file_url = `temp://extracted_${Date.now()}`

        const { data: insertData, error: insertError } = await supabase
          .from('extractions')
          .insert({
            user_id,
            file_name,
            file_url,
            file_type,
            file_size: Math.round(file_data.length * 0.75), // Approximate size from base64
            extracted_text: extractedText,
            confidence_score: confidence,
            processing_time: processingTime
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Database insert error:', insertError)
        } else {
          extraction_id = insertData?.id
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Don't fail the request if database save fails
      }
    }

    const response: ExtractTextResponse = {
      success: true,
      data: {
        extracted_text: extractedText,
        confidence_score: confidence,
        processing_time: processingTime,
        file_name,
        extraction_id
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    const errorResponse: ExtractTextResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})