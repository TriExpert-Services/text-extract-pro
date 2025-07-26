import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { Search, Filter, Download, Eye, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Extraction {
  id: string
  file_name: string
  file_type: string
  file_size: number
  extracted_text: string
  confidence_score: number
  processing_time: number
  created_at: string
}

export function HistoryPage() {
  const { user } = useAuth()
  const { isDarkMode } = useApp()
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (user) {
      fetchExtractions()
    }
  }, [user])

  const fetchExtractions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('extractions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExtractions(data || [])
    } catch (error) {
      console.error('Error fetching extractions:', error)
      toast.error('Failed to load extraction history')
    } finally {
      setLoading(false)
    }
  }

  const deleteExtraction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('extractions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setExtractions(prev => prev.filter(extraction => extraction.id !== id))
      toast.success('Extraction deleted successfully')
    } catch (error) {
      console.error('Error deleting extraction:', error)
      toast.error('Failed to delete extraction')
    }
  }

  const downloadText = (extraction: Extraction) => {
    const element = document.createElement('a')
    const file = new Blob([extraction.extracted_text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${extraction.file_name}_extracted.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Text downloaded!')
  }

  const filteredExtractions = extractions.filter(extraction => {
    const matchesSearch = extraction.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         extraction.extracted_text.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         extraction.file_type.startsWith(filterType)
    
    return matchesSearch && matchesFilter
  })

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-300 rounded flex-1"></div>
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-300 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Extraction History
        </h1>
        <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          View and manage all your previous text extractions
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search extractions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <div className="relative">
          <Filter className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="application">Documents</option>
            <option value="text">Text Files</option>
          </select>
        </div>
      </div>

      {/* Extractions List */}
      {filteredExtractions.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Search className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">No extractions found</h3>
          <p>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start extracting text from documents to see your history here'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExtractions.map((extraction) => (
            <div
              key={extraction.id}
              className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {extraction.file_name}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBgColor(extraction.confidence_score)}`}>
                      <span className={getConfidenceColor(extraction.confidence_score)}>
                        {Math.round(extraction.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {format(new Date(extraction.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {formatFileSize(extraction.file_size)}
                    </span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {extraction.processing_time}ms
                    </span>
                  </div>
                  
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                    {extraction.extracted_text.substring(0, 200)}...
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedExtraction(extraction)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/30'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => downloadText(extraction)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-green-900/20 text-green-300 hover:bg-green-900/30'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    title="Download text"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteExtraction(extraction.id)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-red-900/20 text-red-300 hover:bg-red-900/30'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                    title="Delete extraction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extraction Detail Modal */}
      {selectedExtraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedExtraction.file_name}
                </h2>
                <button
                  onClick={() => setSelectedExtraction(null)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Confidence
                    </p>
                    <p className={`text-lg font-semibold ${getConfidenceColor(selectedExtraction.confidence_score)}`}>
                      {Math.round(selectedExtraction.confidence_score * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      File Size
                    </p>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatFileSize(selectedExtraction.file_size)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Processing Time
                    </p>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedExtraction.processing_time}ms
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Created
                    </p>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(selectedExtraction.created_at), 'MMM dd')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Extracted Text
                </h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-auto`}>
                  <pre className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap font-mono`}>
                    {selectedExtraction.extracted_text}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}