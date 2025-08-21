import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

// Use dynamic import for pdf-parse-new to avoid build issues
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse-new')
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (error) {
    console.error('PDF parse error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Processing file upload request')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('API: File received:', file?.name, file?.size)
    
    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 })
    }

    // Check file type - support both PDF and DOCX
    const fileName = file.name.toLowerCase()
    const isDocx = fileName.endsWith('.docx')
    const isPdf = fileName.endsWith('.pdf')
    
    if (!isDocx && !isPdf) {
      return NextResponse.json({ error: 'Alleen .pdf en .docx bestanden zijn ondersteund' }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bestand is te groot (max 10MB)' }, { status: 400 })
    }

    console.log('API: Converting file to buffer...')
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('API: Buffer created, size:', buffer.length)

    let textContent = ''
    let fileType = ''

    if (isDocx) {
      console.log('API: Extracting text from DOCX with mammoth...')
      
      try {
        const result = await mammoth.extractRawText({ buffer })
        textContent = result.value || ''
        fileType = 'Word Document (.docx)'
        console.log('DOCX text extracted successfully, length:', textContent.length)
      } catch (error) {
        console.error('Error extracting DOCX:', error)
        throw new Error('Failed to extract text from Word document')
      }
      
    } else if (isPdf) {
      console.log('API: Extracting text from PDF...')
      fileType = 'PDF Document (.pdf)'
      
      try {
        // Use the simpler pdf-parse-new library
        textContent = await extractPdfText(buffer)
        
        // Clean up the extracted text - be careful not to destroy formatting
        textContent = textContent
          .replace(/\r\n/g, '\n') // Normalize line endings
          .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
          .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs (but keep newlines)
          .trim()
        
        console.log('PDF text extracted successfully, length:', textContent.length)
        
        if (!textContent || textContent.length < 10) {
          console.warn('PDF has very little or no text content')
          textContent = '[PDF bevat geen leesbare tekst. Dit kan gebeuren bij gescande documenten of afbeeldingen. Probeer een ander bestand of kopieer de tekst handmatig.]'
        }
          
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError)
        
        // Provide helpful error message
        const errorMsg = pdfError instanceof Error ? pdfError.message : 'Unknown error'
        
        if (errorMsg.includes('encrypted') || errorMsg.includes('password')) {
          textContent = '[PDF is beveiligd met een wachtwoord. Upload een onbeveiligd bestand.]'
        } else if (errorMsg.includes('Invalid PDF')) {
          textContent = '[PDF bestand is beschadigd of ongeldig. Probeer een ander bestand.]'
        } else {
          textContent = '[PDF kon niet worden gelezen. Probeer een ander bestand of kopieer de tekst handmatig.]'
        }
      }
    }
    
    console.log('API: Final text length:', textContent.length)

    const response = {
      success: true,
      filename: file.name,
      size: file.size,
      fileType: fileType,
      content: textContent,
      wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
      characterCount: textContent.length
    }
    
    console.log('API: Sending response')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error processing file:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwerken van het bestand: ' + errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'GET method not allowed. Use POST to upload files.' },
    { status: 405 }
  )
}