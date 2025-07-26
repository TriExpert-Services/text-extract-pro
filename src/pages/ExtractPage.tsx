import React, { useState } from 'react'
import { FileUpload } from '../components/Extract/FileUpload'
import { ExtractionResult } from '../components/Extract/ExtractionResult'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
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
      // Convert file to base64 for OpenAI
      const base64 = await fileToBase64(file)
      
      // Initialize OpenAI service
      const openaiService = new OpenAIService(openaiApiKey)
      
      // Extract text based on file type
      let extractedText = ''
      let confidence = 0.5
      
      if (file.type.startsWith('image/')) {
        const result = await openaiService.extractTextFromImage(base64)
        extractedText = result.text
        confidence = result.confidence
      } else {
        // For other file types, you would implement specific parsers
        // For now, we'll simulate text extraction
        extractedText = `Text extracted from ${file.name} (simulated)`
        confidence = 0.8
      }

      const processingTime = Date.now() - startTime

      // Save to Supabase
      if (user) {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
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
              user_id: user.id,
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
          await updateUserAnalytics(user.id, extractedText.length, confidence)
        }
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64.split(',')[1]) // Remove data:image/jpeg;base64, prefix
      }
      reader.onerror = error => reject(error)
    })
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
    if (!openaiApiKey) {
      toast.error('Please configure your OpenAI API key in settings')
      return
    }

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

    const openaiService = new OpenAIService(openaiApiKey)
    const result = await openaiService.enhanceExtractedText(text)
    return result.enhancedText
  }

  if (!openaiApiKey) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                OpenAI API Key Required
              </h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                Please configure your OpenAI API key in the settings to start extracting text from documents and images.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Extract Text
        </h1>
        <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Upload documents and images to extract text using advanced AI technology
        </p>
      </div>

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