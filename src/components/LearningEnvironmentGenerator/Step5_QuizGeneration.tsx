'use client'

import React, { useState } from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import { QuizQuestion } from '@/types/learningEnvironment'
import StepLayout from './StepLayout'

export default function Step5_QuizGeneration() {
  const { state, updateGeneratedContent, acceptModule, nextStep } = useLearningEnvironment()
  const [wantsQuiz, setWantsQuiz] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)

  const generateQuiz = async (retryCount = 0) => {
    const maxRetries = 3
    setIsGenerating(true)
    
    try {
      const content = state.content.vakinhoud || state.content.uploadedFileContents.join('\n\n')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch('/api/generate-quiz', {
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
          // Rate limiting - retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return generateQuiz(retryCount + 1)
        }
        
        if (response.status >= 500 && retryCount < maxRetries) {
          // Server error - retry
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return generateQuiz(retryCount + 1)
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.quiz && data.quiz.length > 0) {
        const generatedQuiz = data.quiz.map((question: any, index: number) => ({
          id: `question-${Date.now()}-${index}`,
          question: question.question || '',
          options: question.options || ['', '', ''],
          correctAnswer: question.correctAnswer || 0
        }))
        
        setQuiz(generatedQuiz)
        updateGeneratedContent({ quiz: generatedQuiz })
      } else {
        throw new Error('De AI kon geen geldige vragen genereren. Probeer het opnieuw.')
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          return generateQuiz(retryCount + 1)
        }
        alert('De quiz generatie duurt te lang. Controleer je internetverbinding en probeer het opnieuw.')
      } else if (retryCount < maxRetries) {
        // Final retry for other errors
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return generateQuiz(retryCount + 1)
      } else {
        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
        alert(`Quiz generatie mislukt na ${maxRetries + 1} pogingen.\n\nFout: ${errorMessage}\n\nSuggesties:\n• Controleer je internetverbinding\n• Probeer je tekst korter te maken\n• Wacht een minuut en probeer opnieuw`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWantQuiz = (wants: boolean) => {
    setWantsQuiz(wants)
    if (wants) {
      generateQuiz()
    } else {
      nextStep()
    }
  }

  const handleQuestionEdit = (questionId: string, field: 'question' | 'options' | 'correctAnswer', value: any) => {
    setQuiz(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ))
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuiz(prev => prev.filter(q => q.id !== questionId))
  }

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}`,
      question: '',
      options: ['', '', ''],
      correctAnswer: 0
    }
    setQuiz(prev => [...prev, newQuestion])
    setEditingQuestion(newQuestion.id)
  }

  const handleAccept = () => {
    updateGeneratedContent({ quiz })
    acceptModule('quiz')
    nextStep()
  }

  return (
    <StepLayout
      title="Oefentoets maken?"
      subtitle="8 Multiple choice vragen om kennis te testen"
      canGoNext={wantsQuiz === false || (wantsQuiz === true && quiz.length > 0)}
      nextLabel={wantsQuiz ? "Accepteren" : "Overslaan"}
      onNext={wantsQuiz ? handleAccept : () => nextStep()}
    >
      <div className="space-y-6">
        {/* Choice Section */}
        {wantsQuiz === null && (
          <div className="text-center space-y-8">
            <p className="text-gray-600">
              Een korte toets om te controleren of de belangrijkste concepten begrepen zijn.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleWantQuiz(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Nee, overslaan
              </button>
              <button
                onClick={() => handleWantQuiz(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Ja, maak toets
              </button>
            </div>
          </div>
        )}

        {/* Generation Loading */}
        {wantsQuiz === true && isGenerating && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600">Oefentoets maken...</p>
          </div>
        )}

        {/* Generated Quiz */}
        {wantsQuiz === true && !isGenerating && quiz.length > 0 && (
          <div className="space-y-6">

            {/* Quiz Questions */}
            <div className="space-y-6">
              {quiz.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Vraag {index + 1}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingQuestion(
                          editingQuestion === question.id ? null : question.id
                        )}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm hover:bg-blue-200"
                      >
                        {editingQuestion === question.id ? '💾 Opslaan' : '✏️ Bewerken'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md text-sm hover:bg-red-200"
                      >
                        🗑️ Verwijderen
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    {editingQuestion === question.id ? (
                      <textarea
                        value={question.question}
                        onChange={(e) => handleQuestionEdit(question.id, 'question', e.target.value)}
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Vraag tekst..."
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">
                        {question.question || 'Geen vraag ingevuld'}
                      </p>
                    )}
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-3">
                        <div className="flex items-center">
                          {editingQuestion === question.id ? (
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => handleQuestionEdit(question.id, 'correctAnswer', optionIndex)}
                              className="w-4 h-4 text-green-600"
                            />
                          ) : (
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              question.correctAnswer === optionIndex 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {question.correctAnswer === optionIndex && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx="4" cy="4" r="3" />
                                </svg>
                              )}
                            </div>
                          )}
                          <span className="ml-2 font-medium text-gray-600">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                        </div>
                        {editingQuestion === question.id ? (
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options]
                              newOptions[optionIndex] = e.target.value
                              handleQuestionEdit(question.id, 'options', newOptions)
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={`Antwoordoptie ${String.fromCharCode(65 + optionIndex)}`}
                          />
                        ) : (
                          <span className={`flex-1 p-2 rounded ${
                            question.correctAnswer === optionIndex 
                              ? 'bg-green-50 text-green-800 font-medium' 
                              : 'text-gray-700'
                          }`}>
                            {option || `Geen optie ${String.fromCharCode(65 + optionIndex)}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {!editingQuestion && (
                    <div className="mt-3 text-sm text-green-600">
                      ✅ Juiste antwoord: {String.fromCharCode(65 + question.correctAnswer)}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Question Button */}
              <div
                onClick={handleAddQuestion}
                className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-purple-600 font-medium">Vraag Toevoegen</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => setWantsQuiz(null)}
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