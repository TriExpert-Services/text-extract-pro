import Tesseract from 'tesseract.js'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export interface OCRResult {
  text: string
  confidence: number
  processingTime: number
}

export class OCRService {
  private static instance: OCRService
  private tesseractWorker: Tesseract.Worker | null = null

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService()
    }
    return OCRService.instance
  }

  async initializeWorker(): Promise<void> {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await Tesseract.createWorker('eng+spa', 1, {
        logger: m => console.log('OCR Progress:', m)
      })
    }
  }

  async extractTextFromImage(file: File): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      await this.initializeWorker()
      
      if (!this.tesseractWorker) {
        throw new Error('OCR worker not initialized')
      }

      // Convert file to image if needed
      const imageUrl = URL.createObjectURL(file)
      
      // Perform OCR
      const { data } = await this.tesseractWorker.recognize(imageUrl)
      
      // Clean up URL
      URL.revokeObjectURL(imageUrl)
      
      const processingTime = Date.now() - startTime
      
      return {
        text: data.text,
        confidence: data.confidence / 100, // Convert to 0-1 range
        processingTime
      }
    } catch (error) {
      console.error('OCR extraction error:', error)
      throw new Error('Failed to extract text with OCR')
    }
  }

  async extractTextFromPDF(file: File): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      // Convert PDF to images and then OCR each page
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      let totalConfidence = 0
      let pageCount = 0
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 })
        
        // Create canvas to render PDF page
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(resolve as BlobCallback, 'image/png', 1.0)
        })
        
        if (blob) {
          // OCR the rendered page
          await this.initializeWorker()
          const { data } = await this.tesseractWorker!.recognize(blob)
          
          fullText += `\n--- Page ${pageNum} ---\n${data.text}\n`
          totalConfidence += data.confidence
          pageCount++
        }
      }
      
      const processingTime = Date.now() - startTime
      const averageConfidence = pageCount > 0 ? totalConfidence / pageCount / 100 : 0
      
      return {
        text: fullText.trim(),
        confidence: averageConfidence,
        processingTime
      }
    } catch (error) {
      console.error('PDF OCR extraction error:', error)
      throw new Error('Failed to extract text from PDF with OCR')
    }
  }

  async extractTextFromDocument(file: File): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      if (file.type === 'application/pdf') {
        return await this.extractTextFromPDF(file)
      } else if (file.type.startsWith('image/')) {
        return await this.extractTextFromImage(file)
      } else if (file.type.startsWith('text/')) {
        // For plain text files, read directly
        const text = await file.text()
        return {
          text,
          confidence: 0.99, // High confidence for plain text
          processingTime: Date.now() - startTime
        }
      } else {
        throw new Error(`Unsupported file type: ${file.type}`)
      }
    } catch (error) {
      console.error('Document extraction error:', error)
      throw error
    }
  }

  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
    }
  }
}

// Export singleton instance
export const ocrService = OCRService.getInstance()