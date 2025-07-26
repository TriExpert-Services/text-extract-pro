/*
  # Setup Text Extraction Application Database

  1. New Tables
    - `extractions` - Stores all text extraction records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `file_name` (text) - Original filename
      - `file_url` (text) - URL to stored file
      - `file_type` (text) - MIME type
      - `file_size` (bigint) - File size in bytes
      - `extracted_text` (text) - Extracted text content
      - `confidence_score` (real) - AI confidence score (0-1)
      - `processing_time` (integer) - Processing time in milliseconds
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_analytics` - Stores user usage analytics
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `total_extractions` (integer) - Total number of extractions
      - `total_files_processed` (integer) - Total files processed
      - `total_text_extracted` (bigint) - Total characters extracted
      - `average_confidence` (real) - Average confidence score
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Storage bucket for document files with proper access policies

  3. Performance
    - Indexes on frequently queried columns
    - Automatic timestamp updates with triggers
    - Optimized queries for analytics dashboard

  4. Storage
    - Documents bucket for file storage
    - Proper folder structure by user_id
    - Public access for authenticated users only
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
  confidence_score real NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
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
  average_confidence real NOT NULL DEFAULT 0.0 CHECK (average_confidence >= 0.0 AND average_confidence <= 1.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for extractions table
CREATE POLICY "Users can view their own extractions"
  ON extractions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions"
  ON extractions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extractions"
  ON extractions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extractions"
  ON extractions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_analytics table
CREATE POLICY "Users can view their own analytics"
  ON user_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON user_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON user_analytics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics"
  ON user_analytics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload their documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_extractions_user_id ON extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_extractions_created_at ON extractions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extractions_user_created ON extractions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extractions_file_type ON extractions(file_type);
CREATE INDEX IF NOT EXISTS idx_extractions_confidence ON extractions(confidence_score);
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
DROP TRIGGER IF EXISTS update_extractions_updated_at ON extractions;
CREATE TRIGGER update_extractions_updated_at
  BEFORE UPDATE ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_analytics_updated_at ON user_analytics;
CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update user analytics
CREATE OR REPLACE FUNCTION update_user_analytics_on_extraction()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user analytics
  INSERT INTO user_analytics (
    user_id,
    total_extractions,
    total_files_processed,
    total_text_extracted,
    average_confidence
  )
  VALUES (
    NEW.user_id,
    1,
    1,
    length(NEW.extracted_text),
    NEW.confidence_score
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_extractions = user_analytics.total_extractions + 1,
    total_files_processed = user_analytics.total_files_processed + 1,
    total_text_extracted = user_analytics.total_text_extracted + length(NEW.extracted_text),
    average_confidence = (
      (user_analytics.average_confidence * user_analytics.total_extractions + NEW.confidence_score) / 
      (user_analytics.total_extractions + 1)
    ),
    updated_at = now();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update user analytics when extraction is inserted
DROP TRIGGER IF EXISTS update_analytics_on_extraction ON extractions;
CREATE TRIGGER update_analytics_on_extraction
  AFTER INSERT ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics_on_extraction();

-- Create function to handle extraction deletion analytics
CREATE OR REPLACE FUNCTION update_user_analytics_on_extraction_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user analytics when extraction is deleted
  UPDATE user_analytics SET
    total_extractions = GREATEST(0, total_extractions - 1),
    total_files_processed = GREATEST(0, total_files_processed - 1),
    total_text_extracted = GREATEST(0, total_text_extracted - length(OLD.extracted_text)),
    updated_at = now()
  WHERE user_id = OLD.user_id;
  
  -- Recalculate average confidence
  UPDATE user_analytics SET
    average_confidence = COALESCE(
      (SELECT AVG(confidence_score) FROM extractions WHERE user_id = OLD.user_id),
      0.0
    )
  WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- Create trigger to update analytics when extraction is deleted
DROP TRIGGER IF EXISTS update_analytics_on_extraction_delete ON extractions;
CREATE TRIGGER update_analytics_on_extraction_delete
  AFTER DELETE ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics_on_extraction_delete();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON extractions TO authenticated;
GRANT ALL ON user_analytics TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;