import React, { useState } from 'react'
import { Copy, Download, Edit3, Check, RefreshCw } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import toast from 'react-hot-toast'

interface ExtractionResultProps {
  result: {
    fileName: string
    extractedText: string
    confidence: number
    processingTime: number
  }
  onEnhance?: (text: string) => Promise<string>
}

export function ExtractionResult({ result, onEnhance }: ExtractionResultProps) {
  const { isDarkMode } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(result.extractedText)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedText, setEnhancedText] = useState('')

  const copyToClipboard = () => {
    navigator.clipboard.writeText(enhancedText || editedText)
    toast.success('Text copied to clipboard!')
  }

  const downloadText = () => {
    const element = document.createElement('a')
    const file = new Blob([enhancedText || editedText], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${result.fileName}_extracted.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Text downloaded!')
  }

  const handleSave = () => {
    setIsEditing(false)
    toast.success('Changes saved!')
  }

  const handleEnhance = async () => {
    if (!onEnhance) return
    
    setIsEnhancing(true)
    try {
      const enhanced = await onEnhance(editedText)
      setEnhancedText(enhanced)
      toast.success('Text enhanced successfully!')
    } catch (error) {
      toast.error('Failed to enhance text')
    } finally {
      setIsEnhancing(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 dark:bg-green-900/20'
    if (confidence >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  return (
    <div className={`rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {result.fileName}
            </h3>
            <div className="flex items-center space-x-4 mt-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBgColor(result.confidence)}`}>
                <span className={getConfidenceColor(result.confidence)}>
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Processed in {result.processingTime}ms
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEnhance && (
              <button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDarkMode
                    ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RefreshCw className={`h-4 w-4 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
              </button>
            )}
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isDarkMode
                  ? 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditing ? 'View' : 'Edit'}</span>
            </button>

            <button
              onClick={copyToClipboard}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>

            <button
              onClick={downloadText}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isDarkMode
                  ? 'bg-green-900/20 text-green-300 hover:bg-green-900/30'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {enhancedText && (
          <div className={`mb-4 p-4 rounded-lg border ${isDarkMode ? 'bg-purple-900/10 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              Enhanced Text
            </h4>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap font-mono`}>
              {enhancedText}
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className={`w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-600 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditedText(result.extractedText)
                  setIsEditing(false)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                <Check className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-auto max-h-96`}>
            <pre className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap font-mono`}>
              {enhancedText || editedText}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}