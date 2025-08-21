'use client'

import React, { useState } from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import { TheorySection } from '@/types/learningEnvironment'
import StepLayout from './StepLayout'

export default function Step4_TheoryOverview() {
  const { state, updateGeneratedContent, acceptModule, nextStep } = useLearningEnvironment()
  const [wantsTheory, setWantsTheory] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [theory, setTheory] = useState<any>(null)
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set())

  const generateTheoryOverview = async (retryCount = 0) => {
    const maxRetries = 3
    setIsGenerating(true)
    
    try {
      const content = state.content.vakinhoud || state.content.uploadedFileContents.join('\n\n')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch('/api/generate-theory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          niveau: state.content.niveau
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return generateTheoryOverview(retryCount + 1)
        }
        
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return generateTheoryOverview(retryCount + 1)
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.theory) {
        setTheory(data.theory)
        
        // Convert to TheorySection format
        const theorySections: TheorySection[] = []
        
        if (data.theory.orientation) {
          theorySections.push({
            id: 'orientation',
            title: 'Oriëntatie',
            content: data.theory.orientation,
            type: 'orientation'
          })
        }
        
        if (data.theory.concepts && Array.isArray(data.theory.concepts)) {
          data.theory.concepts.forEach((concept: any, index: number) => {
            theorySections.push({
              id: `concept-${index}`,
              title: concept.title || `Concept ${index + 1}`,
              content: `${concept.definition || ''}\n\nMetafoor: ${concept.metaphor || ''}`,
              type: 'concepts'
            })
          })
        }
        
        if (data.theory.connections) {
          theorySections.push({
            id: 'connections',
            title: 'Samenhang',
            content: data.theory.connections,
            type: 'connections'
          })
        }
        
        if (data.theory.application) {
          theorySections.push({
            id: 'application',
            title: 'Toepassing',
            content: `${data.theory.application.example || ''}\n\nStappen:\n${(data.theory.application.steps || []).map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}`,
            type: 'application'
          })
        }
        
        if (data.theory.essence && Array.isArray(data.theory.essence)) {
          theorySections.push({
            id: 'essence',
            title: 'Essentie - Onthoud vooral dit...',
            content: data.theory.essence.map((point: string, i: number) => `• ${point}`).join('\n'),
            type: 'essence'
          })
        }
        
        if (theorySections.length === 0) {
          throw new Error('De AI kon geen geldige theorie-inhoud genereren. Probeer het opnieuw.')
        }
        
        updateGeneratedContent({ theoryOverview: theorySections })
      } else {
        throw new Error('De AI kon geen geldig theorie-overzicht genereren. Probeer het opnieuw.')
      }
    } catch (error) {
      console.error('Error generating theory overview:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          return generateTheoryOverview(retryCount + 1)
        }
        alert('De theorie generatie duurt te lang. Controleer je internetverbinding en probeer het opnieuw.')
      } else if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return generateTheoryOverview(retryCount + 1)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
        alert(`Theorie generatie mislukt na ${maxRetries + 1} pogingen.\n\nFout: ${errorMessage}\n\nSuggesties:\n• Controleer je internetverbinding\n• Probeer je tekst korter te maken\n• Wacht een minuut en probeer opnieuw`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWantTheory = (wants: boolean) => {
    setWantsTheory(wants)
    if (wants) {
      generateTheoryOverview()
    } else {
      nextStep()
    }
  }

  const handleSectionEdit = (sectionId: string, content: string) => {
    updateGeneratedContent({
      theoryOverview: state.generatedContent.theoryOverview.map(section =>
        section.id === sectionId ? { ...section, content } : section
      )
    })
  }

  const toggleEdit = (sectionId: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const handleAccept = () => {
    acceptModule('theory')
    nextStep()
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'orientation':
        return '🎯'
      case 'concepts':
        return '💡'
      case 'connections':
        return '🔗'
      case 'application':
        return '⚡'
      case 'essence':
        return '⭐'
      default:
        return '📝'
    }
  }

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'orientation':
        return 'border-blue-200 bg-blue-50'
      case 'concepts':
        return 'border-green-200 bg-green-50'
      case 'connections':
        return 'border-purple-200 bg-purple-50'
      case 'application':
        return 'border-orange-200 bg-orange-50'
      case 'essence':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <StepLayout
      title="Theorie-overzicht maken?"
      subtitle="Een gestructureerde samenvatting van de belangrijkste concepten"
      canGoNext={wantsTheory === false || (wantsTheory === true && state.generatedContent.theoryOverview.length > 0)}
      nextLabel={wantsTheory ? "Accepteren" : "Overslaan"}
      onNext={wantsTheory ? handleAccept : () => nextStep()}
    >
      <div className="space-y-6">
        {/* Choice Section */}
        {wantsTheory === null && (
          <div className="text-center space-y-8">
            <p className="text-gray-600">
              Een overzichtelijke samenvatting met kernconcepten en voorbeelden.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleWantTheory(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Nee, overslaan
              </button>
              <button
                onClick={() => handleWantTheory(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Ja, maak overzicht
              </button>
            </div>
          </div>
        )}

        {/* Generation Loading */}
        {wantsTheory === true && isGenerating && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600">Theorie-overzicht maken...</p>
          </div>
        )}

        {/* Generated Theory Overview */}
        {wantsTheory === true && !isGenerating && state.generatedContent.theoryOverview.length > 0 && (
          <div className="space-y-6">

            {/* Theory Sections */}
            <div className="space-y-4">
              {state.generatedContent.theoryOverview.map((section) => (
                <div
                  key={section.id}
                  className={`border-2 rounded-lg p-6 ${getSectionColor(section.type)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getSectionIcon(section.type)}</span>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {section.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleEdit(section.id)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      {editingSections.has(section.id) ? '💾 Opslaan' : '✏️ Bewerken'}
                    </button>
                  </div>
                  
                  {editingSections.has(section.id) ? (
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionEdit(section.id, e.target.value)}
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Bewerk de inhoud van deze sectie..."
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {section.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => setWantsTheory(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Terug
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Accepteren
              </button>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  )
}