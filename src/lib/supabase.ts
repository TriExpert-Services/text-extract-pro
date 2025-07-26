import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      extractions: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          extracted_text: string
          confidence_score: number
          processing_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          extracted_text: string
          confidence_score: number
          processing_time: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          extracted_text?: string
          confidence_score?: number
          processing_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          total_extractions: number
          total_files_processed: number
          total_text_extracted: number
          average_confidence: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_extractions?: number
          total_files_processed?: number
          total_text_extracted?: number
          average_confidence?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_extractions?: number
          total_files_processed?: number
          total_text_extracted?: number
          average_confidence?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}