import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Image, AlertCircle } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  loading: boolean
}

export function FileUpload({ onFileSelect, loading }: FileUploadProps) {
  const { isDarkMode } = useApp()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileSelect(acceptedFiles)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: loading
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : loading
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
            : isDarkMode
            ? 'border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-750'
            : 'border-gray-300 hover:border-blue-500 bg-white hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            )}
          </div>
          
          <div>
            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading
                ? 'Processing files...'
                : isDragActive
                ? 'Drop files here...'
                : 'Drag & drop files here, or click to select'
              }
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Supports PDF, DOC, DOCX, TXT, and images (PNG, JPG, GIF, BMP, TIFF) with real text extraction
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Maximum file size: 10MB
            </p>
          </div>

          <div className="flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <FileText className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Documents</span>
            </div>
            <div className="flex items-center space-x-2">
              <Image className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Images</span>
            </div>
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                File Upload Errors
              </h3>
              <div className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                <ul className="list-disc list-inside space-y-1">
                  {fileRejections.map(({ file, errors }) => (
                    <li key={file.name}>
                      {file.name}: {errors.map(e => e.message).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}