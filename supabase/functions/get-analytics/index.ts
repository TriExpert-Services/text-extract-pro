import { createClient } from 'npm:@supabase/supabase-js@2'

interface GetAnalyticsRequest {
  user_id: string
  date_range?: {
    start: string
    end: string
  }
}

interface GetAnalyticsResponse {
  success: boolean
  data?: {
    user_analytics: any
    daily_extractions: any[]
    file_type_distribution: any[]
    confidence_distribution: any[]
  }
  error?: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
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
    // Handle both GET and POST requests
    let requestData: GetAnalyticsRequest

    if (req.method === 'GET') {
      const url = new URL(req.url)
      requestData = {
        user_id: url.searchParams.get('user_id') || '',
        date_range: url.searchParams.get('start') && url.searchParams.get('end') ? {
          start: url.searchParams.get('start')!,
          end: url.searchParams.get('end')!
        } : undefined
      }
    } else if (req.method === 'POST') {
      requestData = await req.json()
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { user_id, date_range } = requestData

    // Validate required fields
    if (!user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: user_id' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user analytics
    const { data: userAnalytics } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // Get extractions for detailed analytics
    let extractionsQuery = supabase
      .from('extractions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    // Apply date range filter if provided
    if (date_range) {
      extractionsQuery = extractionsQuery
        .gte('created_at', date_range.start)
        .lte('created_at', date_range.end)
    }

    const { data: extractions } = await extractionsQuery

    if (!extractions) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch extractions data' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate daily extractions for the last 7 days
    const dailyExtractions = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayExtractions = extractions.filter(
        extraction => {
          const extractionDate = new Date(extraction.created_at)
          return extractionDate >= date && extractionDate < nextDate
        }
      ).length
      
      dailyExtractions.push({
        date: date.toISOString().split('T')[0],
        extractions: dayExtractions
      })
    }

    // Calculate file type distribution
    const fileTypes: { [key: string]: number } = {}
    extractions.forEach(extraction => {
      const type = extraction.file_type.split('/')[0]
      fileTypes[type] = (fileTypes[type] || 0) + 1
    })

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    const fileTypeDistribution = Object.entries(fileTypes).map(([type, count], index) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: colors[index % colors.length]
    }))

    // Calculate confidence distribution
    const confidenceRanges = {
      'High (80-100%)': 0,
      'Medium (60-79%)': 0,
      'Low (0-59%)': 0
    }

    extractions.forEach(extraction => {
      const confidence = extraction.confidence_score * 100
      if (confidence >= 80) confidenceRanges['High (80-100%)']++
      else if (confidence >= 60) confidenceRanges['Medium (60-79%)']++
      else confidenceRanges['Low (0-59%)']++
    })

    const confidenceDistribution = Object.entries(confidenceRanges).map(([range, count]) => ({
      range,
      count
    }))

    const response: GetAnalyticsResponse = {
      success: true,
      data: {
        user_analytics: userAnalytics || {
          total_extractions: 0,
          total_files_processed: 0,
          total_text_extracted: 0,
          average_confidence: 0
        },
        daily_extractions: dailyExtractions,
        file_type_distribution: fileTypeDistribution,
        confidence_distribution: confidenceDistribution
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
    
    const errorResponse: GetAnalyticsResponse = {
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