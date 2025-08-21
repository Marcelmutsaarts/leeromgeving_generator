'use client'

import React, { useState } from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import { EducationLevel } from '@/types/learningEnvironment'
import StepLayout from './StepLayout'
import FileUpload from '@/components/FileUpload'

const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'PO', label: 'PO' },
  { value: 'VMBO', label: 'VMBO' },
  { value: 'HAVO', label: 'HAVO' },
  { value: 'VWO', label: 'VWO' },
  { value: 'MBO', label: 'MBO' },
  { value: 'HBO', label: 'HBO' },
  { value: 'UNI', label: 'UNI' }
]

export default function Step1_ContentInput() {
  const { state, updateContent, nextStep } = useLearningEnvironment()
  const [isDidactiekModalOpen, setIsDidactiekModalOpen] = useState(false)
  const [tempDidactiek, setTempDidactiek] = useState(state.content.didactiek)

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload-docx', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed (${response.status})`)
      }
      
      const data = await response.json()
      
      // Add file content to the main text field instead of separate array
      const currentContent = state.content.vakinhoud
      const separator = currentContent.trim() ? '\n\n--- Geüpload document ---\n\n' : ''
      const newContent = currentContent + separator + (data.content || '')
      
      updateContent({
        vakinhoud: newContent,
        uploadedFiles: [...state.content.uploadedFiles, file],
        uploadedFileContents: [...state.content.uploadedFileContents, data.content || '']
      })
    } catch (error) {
      console.error('File upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het uploaden'
      alert(`Upload mislukt:\n\n${errorMessage}\n\nControleer of het bestand niet beschadigd is en probeer opnieuw.`)
    }
  }

  const openDidactiekModal = () => {
    setTempDidactiek(state.content.didactiek)
    setIsDidactiekModalOpen(true)
  }

  const saveDidactiek = () => {
    updateContent({ didactiek: tempDidactiek })
    setIsDidactiekModalOpen(false)
  }

  const cancelDidactiek = () => {
    setTempDidactiek(state.content.didactiek)
    setIsDidactiekModalOpen(false)
  }

  const canProceed = () => {
    const hasContent = state.content.vakinhoud.trim().length > 0 || 
                      state.content.uploadedFileContents.length > 0
    const hasDidactiek = state.content.didactiek.trim().length > 0
    return hasContent && hasDidactiek
  }

  return (
    <>
      <StepLayout
        title="Inhoud & Instellingen"
        subtitle="Upload een document of typ de leerstof"
        onNext={nextStep}
        canGoNext={canProceed()}
        canGoBack={false}
        nextLabel="Volgende"
      >
        <div className="space-y-6">
          {/* Main Content Input */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Vakinhoudelijke kennis</h3>
              
              {/* Simple Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".docx,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      await handleFileUpload(file)
                      e.target.value = '' // Reset input
                    }
                  }}
                  className="hidden"
                  id="simple-file-input"
                />
                <label
                  htmlFor="simple-file-input"
                  className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Word/PDF
                </label>
              </div>
            </div>
            
            <textarea
              value={state.content.vakinhoud}
              onChange={(e) => updateContent({ vakinhoud: e.target.value })}
              placeholder="Typ hier de vakinhoudelijke kennis of upload een document..."
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
            <p className="text-sm text-gray-500 mt-2">
              Je kunt hier typen of een Word document uploaden. De inhoud wordt hier samengevoegd.
            </p>
          </div>

          {/* Didactics - Compact with Modal */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Hoe moet de AI-tutor zich gedragen?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Je kunt de standaardtekst gebruiken of naar eigen inzicht aanpassen.
            </p>
            
            <div 
              onClick={openDidactiekModal}
              className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm text-gray-700">
                {state.content.didactiek.substring(0, 120)}...
              </p>
              <p className="text-xs text-purple-600 mt-2 font-medium">
                👆 Klik om volledig te bekijken en bewerken
              </p>
            </div>
          </div>

          {/* Level Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Onderwijsniveau</h3>
            <div className="flex flex-wrap gap-2">
              {EDUCATION_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => updateContent({ niveau: level.value })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    state.content.niveau === level.value
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {!canProceed() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">
                {!state.content.vakinhoud.trim() && state.content.uploadedFileContents.length === 0 && 
                  'Upload een document of typ inhoud. '}
                {!state.content.didactiek.trim() && 
                  'Vul de AI-tutor instructies in.'}
              </p>
            </div>
          )}
        </div>
      </StepLayout>

      {/* Didactiek Modal */}
      {isDidactiekModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                AI-Tutor Instructies Bewerken
              </h3>
              <button
                onClick={cancelDidactiek}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <p className="text-gray-600 mb-4">
                Bepaal hoe de AI-tutor zich moet gedragen tegenover studenten. 
                Je kunt de standaardtekst gebruiken of volledig aanpassen naar eigen inzicht.
              </p>
              
              <textarea
                value={tempDidactiek}
                onChange={(e) => setTempDidactiek(e.target.value)}
                className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm leading-relaxed"
                placeholder="Beschrijf hoe de AI-tutor zich moet gedragen..."
              />
              
              <div className="text-xs text-gray-500 mt-2">
                {tempDidactiek.length} karakters
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={cancelDidactiek}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={saveDidactiek}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}