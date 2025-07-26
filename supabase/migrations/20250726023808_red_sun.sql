/*
  # Create extractions and user analytics tables

  1. New Tables
    - `extractions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `file_size` (bigint)
      - `extracted_text` (text)
      - `confidence_score` (real)
      - `processing_time` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `total_extractions` (integer)
      - `total_files_processed` (integer)
      - `total_text_extracted` (bigint)
      - `average_confidence` (real)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data

  3. Storage
    - Create documents bucket for file storage
    - Set up policies for authenticated users
*/

-- Create extractions table
CREATE TABLE IF NOT EXISTS extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  extracted_text text NOT NULL DEFAULT '',
  confidence_score real NOT NULL DEFAULT 0.0,
  processing_time integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_extractions integer NOT NULL DEFAULT 0,
  total_files_processed integer NOT NULL DEFAULT 0,
  total_text_extracted bigint NOT NULL DEFAULT 0,
  average_confidence real NOT NULL DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for extractions
CREATE POLICY "Users can manage their own extractions"
  ON extractions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_analytics
CREATE POLICY "Users can manage their own analytics"
  ON user_analytics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_extractions_user_id ON extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_extractions_created_at ON extractions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_extractions_updated_at
  BEFORE UPDATE ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();