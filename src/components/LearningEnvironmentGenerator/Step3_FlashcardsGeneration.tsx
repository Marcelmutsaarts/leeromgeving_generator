'use client'

import React, { useState } from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import { Flashcard } from '@/types/learningEnvironment'
import StepLayout from './StepLayout'

export default function Step3_FlashcardsGeneration() {
  const { state, updateGeneratedContent, acceptModule, nextStep } = useLearningEnvironment()
  const [wantsFlashcards, setWantsFlashcards] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  const generateFlashcards = async (retryCount = 0) => {
    const maxRetries = 3
    setIsGenerating(true)
    
    try {
      const content = state.content.vakinhoud || state.content.uploadedFileContents.join('\n\n')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch('/api/generate-flashcards', {
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
          return generateFlashcards(retryCount + 1)
        }
        
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return generateFlashcards(retryCount + 1)
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.flashcards && data.flashcards.length > 0) {
        const generatedFlashcards = data.flashcards.map((card: any, index: number) => ({
          id: `card-${Date.now()}-${index}`,
          front: card.front || '',
          back: card.back || ''
        }))
        
        setFlashcards(generatedFlashcards)
        updateGeneratedContent({ flashcards: generatedFlashcards })
      } else {
        throw new Error('De AI kon geen geldige flashcards genereren. Probeer het opnieuw.')
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          return generateFlashcards(retryCount + 1)
        }
        alert('De flashcard generatie duurt te lang. Controleer je internetverbinding en probeer het opnieuw.')
      } else if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return generateFlashcards(retryCount + 1)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
        alert(`Flashcard generatie mislukt na ${maxRetries + 1} pogingen.\n\nFout: ${errorMessage}\n\nSuggesties:\n• Controleer je internetverbinding\n• Probeer je tekst korter te maken\n• Wacht een minuut en probeer opnieuw`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWantFlashcards = (wants: boolean) => {
    setWantsFlashcards(wants)
    if (wants) {
      generateFlashcards()
    } else {
      nextStep()
    }
  }

  const handleCardEdit = (cardId: string, field: 'front' | 'back', value: string) => {
    setFlashcards(prev => prev.map(card => 
      card.id === cardId ? { ...card, [field]: value } : card
    ))
  }

  const handleDeleteCard = (cardId: string) => {
    setFlashcards(prev => prev.filter(card => card.id !== cardId))
  }

  const handleAddCard = () => {
    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      front: '',
      back: ''
    }
    setFlashcards(prev => [...prev, newCard])
    setEditingCard(newCard.id)
  }

  const toggleFlip = (cardId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const handleAccept = () => {
    updateGeneratedContent({ flashcards })
    acceptModule('flashcards')
    nextStep()
  }

  return (
    <StepLayout
      title="Flashcards maken?"
      subtitle="Kaartjes om belangrijke begrippen te oefenen"
      canGoNext={wantsFlashcards === false || (wantsFlashcards === true && flashcards.length > 0)}
      nextLabel={wantsFlashcards ? "Accepteren" : "Overslaan"}
      onNext={wantsFlashcards ? handleAccept : () => nextStep()}
    >
      <div className="space-y-6">
        {/* Choice Section */}
        {wantsFlashcards === null && (
          <div className="text-center space-y-8">
            <p className="text-gray-600">
              Flashcards helpen om belangrijke begrippen te onthouden door ze te herhalen.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleWantFlashcards(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Nee, overslaan
              </button>
              <button
                onClick={() => handleWantFlashcards(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Ja, maak flashcards
              </button>
            </div>
          </div>
        )}

        {/* Generation Loading */}
        {wantsFlashcards === true && isGenerating && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600">Flashcards maken...</p>
          </div>
        )}

        {/* Generated Flashcards */}
        {wantsFlashcards === true && !isGenerating && flashcards.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600">
                {flashcards.length} flashcards gemaakt. Klik om te bewerken of om te draaien.
              </p>
            </div>

            {/* Flashcards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card, index) => (
                <div
                  key={card.id}
                  className="relative group"
                >
                  {/* Card Container */}
                  <div 
                    className={`h-48 cursor-pointer transform transition-transform duration-200 hover:scale-105 ${
                      flippedCards.has(card.id) ? 'rotate-y-180' : ''
                    }`}
                    onClick={() => !editingCard && toggleFlip(card.id)}
                  >
                    {/* Front Side */}
                    <div className={`absolute inset-0 bg-purple-600 text-white p-4 rounded-lg shadow-lg flex flex-col justify-center items-center text-center ${
                      flippedCards.has(card.id) ? 'hidden' : 'block'
                    }`}>
                      <div className="text-xs text-purple-200 mb-2">Kaart {index + 1}</div>
                      {editingCard === card.id ? (
                        <textarea
                          value={card.front}
                          onChange={(e) => handleCardEdit(card.id, 'front', e.target.value)}
                          onBlur={() => setEditingCard(null)}
                          autoFocus
                          className="w-full h-24 p-2 bg-white text-gray-800 rounded text-sm resize-none"
                          placeholder="Voorkant van de kaart..."
                        />
                      ) : (
                        <p className="text-sm font-medium" onClick={(e) => {
                          e.stopPropagation()
                          setEditingCard(card.id)
                        }}>
                          {card.front || 'Klik om te bewerken'}
                        </p>
                      )}
                      <div className="text-xs text-purple-200 mt-2">Klik om om te draaien</div>
                    </div>

                    {/* Back Side */}
                    <div className={`absolute inset-0 bg-indigo-600 text-white p-4 rounded-lg shadow-lg flex flex-col justify-center items-center text-center ${
                      flippedCards.has(card.id) ? 'block' : 'hidden'
                    }`}>
                      <div className="text-xs text-indigo-200 mb-2">Antwoord</div>
                      {editingCard === card.id ? (
                        <textarea
                          value={card.back}
                          onChange={(e) => handleCardEdit(card.id, 'back', e.target.value)}
                          onBlur={() => setEditingCard(null)}
                          autoFocus
                          className="w-full h-24 p-2 bg-white text-gray-800 rounded text-sm resize-none"
                          placeholder="Achterkant van de kaart..."
                        />
                      ) : (
                        <p className="text-sm" onClick={(e) => {
                          e.stopPropagation()
                          setEditingCard(card.id)
                        }}>
                          {card.back || 'Klik om te bewerken'}
                        </p>
                      )}
                      <div className="text-xs text-indigo-200 mt-2">Klik om terug te draaien</div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add Card Button */}
              <div
                onClick={handleAddCard}
                className="h-48 border-2 border-dashed border-purple-300 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-purple-600 font-medium">Kaart Toevoegen</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => setWantsFlashcards(null)}
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