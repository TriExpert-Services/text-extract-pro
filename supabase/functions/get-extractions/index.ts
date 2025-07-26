import { createClient } from 'npm:@supabase/supabase-js@2'

interface GetExtractionsRequest {
  user_id: string
  limit?: number
  offset?: number
  search?: string
  file_type?: string
}

interface GetExtractionsResponse {
  success: boolean
  data?: {
    extractions: any[]
    total: number
    page: number
    limit: number
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
    let requestData: GetExtractionsRequest

    if (req.method === 'GET') {
      const url = new URL(req.url)
      requestData = {
        user_id: url.searchParams.get('user_id') || '',
        limit: parseInt(url.searchParams.get('limit') || '10'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        search: url.searchParams.get('search') || undefined,
        file_type: url.searchParams.get('file_type') || undefined,
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

    const { user_id, limit = 10, offset = 0, search, file_type } = requestData

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

    // Build query
    let query = supabase
      .from('extractions')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`file_name.ilike.%${search}%,extracted_text.ilike.%${search}%`)
    }

    if (file_type) {
      query = query.like('file_type', `${file_type}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: extractions, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch extractions' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const response: GetExtractionsResponse = {
      success: true,
      data: {
        extractions: extractions || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit
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
    
    const errorResponse: GetExtractionsResponse = {
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