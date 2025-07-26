import React, { useState } from 'react'
import { FileUpload } from '../components/Extract/FileUpload'
import { ExtractionResult } from '../components/Extract/ExtractionResult'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { ocrService } from '../lib/ocr'
import { OpenAIService } from '../lib/openai'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

interface ExtractionResultType {
  fileName: string
  extractedText: string
  confidence: number
  processingTime: number
}

export function ExtractPage() {
  const { user } = useAuth()
  const { openaiApiKey, isDarkMode } = useApp()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ExtractionResultType[]>([])

  const processFile = async (file: File): Promise<ExtractionResultType> => {
    const startTime = Date.now()
    
    try {
      // Step 1: Extract text using OCR
      let extractedText = ''
      let confidence = 0.5
      let processingTime = 0
      
      try {
        const ocrResult = await ocrService.extractTextFromDocument(file)
        extractedText = ocrResult.text
        confidence = ocrResult.confidence
        processingTime = ocrResult.processingTime
        
        toast.success(`OCR completed for ${file.name}`)
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError)
        throw new Error(`OCR extraction failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`)
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from this document')
      }

      // Step 2: Save raw OCR result to database
      if (user) {
        await this.saveExtractionToDatabase(file, extractedText, confidence, processingTime)
      }

      return {
        fileName: file.name,
        extractedText,
        confidence,
        processingTime
      }
    } catch (error) {
      console.error('Processing error:', error)
      throw error
    }
  }

  const saveExtractionToDatabase = async (
    file: File, 
    extractedText: string, 
    confidence: number, 
    processingTime: number
  ) => {
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName)

        // Save extraction record
        const { error: insertError } = await supabase
          .from('extractions')
          .insert({
            user_id: user!.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            extracted_text: extractedText,
            confidence_score: confidence,
            processing_time: processingTime
          })

        if (insertError) {
          console.error('Insert error:', insertError)
        }

        // Update user analytics
        await updateUserAnalytics(user!.id, extractedText.length, confidence)
      }
    } catch (error) {
      console.error('Database save error:', error)
    }
  }

  const updateUserAnalytics = async (userId: string, textLength: number, confidence: number) => {
    try {
      const { data: existingAnalytics } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingAnalytics) {
        const newTotalExtractions = existingAnalytics.total_extractions + 1
        const newTotalFiles = existingAnalytics.total_files_processed + 1
        const newTotalText = existingAnalytics.total_text_extracted + textLength
        const newAvgConfidence = (existingAnalytics.average_confidence * existingAnalytics.total_extractions + confidence) / newTotalExtractions

        await supabase
          .from('user_analytics')
          .update({
            total_extractions: newTotalExtractions,
            total_files_processed: newTotalFiles,
            total_text_extracted: newTotalText,
            average_confidence: newAvgConfidence,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
      } else {
        await supabase
          .from('user_analytics')
          .insert({
            user_id: userId,
            total_extractions: 1,
            total_files_processed: 1,
            total_text_extracted: textLength,
            average_confidence: confidence
          })
      }
    } catch (error) {
      console.error('Analytics update error:', error)
    }
  }

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) {
      toast.error('No files selected')
      return
    }

    // Check file size limit (10MB per file)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    setLoading(true)
    const newResults: ExtractionResultType[] = []

    try {
      for (const file of files) {
        try {
          const result = await processFile(file)
          newResults.push(result)
          toast.success(`Successfully extracted text from ${file.name}`)
        } catch (error) {
          toast.error(`Failed to process ${file.name}`)
        }
      }
      
      setResults(prev => [...newResults, ...prev])
    } finally {
      setLoading(false)
    }
  }

  const handleEnhanceText = async (text: string): Promise<string> => {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text to enhance')
    }

    const openaiService = new OpenAIService(openaiApiKey)
    try {
      // Enhanced with context about being OCR-extracted text
      const result = await openaiService.enhanceExtractedText(
        text.trim(), 
        'This text was extracted using OCR and may contain recognition errors'
      )
      if (!result.enhancedText || result.enhancedText === text) {
        throw new Error('No enhancement received')
      }
      return result.enhancedText
    } catch (error) {
      console.error('Enhancement error:', error)
      throw new Error('Failed to enhance text. Please try again.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Extract Text
        </h1>
        <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Upload documents and images to extract text using OCR technology
        </p>
      </div>

      {!openaiApiKey && (
        <div className={`mb-6 rounded-lg p-4 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Optional: AI Enhancement Available
              </h3>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Configure your OpenAI API key in settings to enable AI-powered text enhancement and correction.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <FileUpload onFileSelect={handleFileSelect} loading={loading} />

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Extraction Results
            </h2>
            {results.map((result, index) => (
              <ExtractionResult
                key={index}
                result={result}
                onEnhance={handleEnhanceText}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}