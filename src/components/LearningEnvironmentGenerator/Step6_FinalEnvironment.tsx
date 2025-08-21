'use client'

import React, { useState } from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import { QuizQuestion } from '@/types/learningEnvironment'
import StepLayout from './StepLayout'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Step6_FinalEnvironment() {
  const { state, resetState } = useLearningEnvironment()
  
  // Determine first available module
  const getFirstModule = () => {
    if (state.acceptedModules.includes('chatbot')) return 'chatbot'
    if (state.acceptedModules.includes('theory')) return 'theory'
    if (state.acceptedModules.includes('flashcards')) return 'flashcards'
    if (state.acceptedModules.includes('quiz')) return 'quiz'
    return 'chatbot' // fallback
  }
  
  const [activeModule, setActiveModule] = useState<string>(getFirstModule())
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({})
  const [showQuizResults, setShowQuizResults] = useState(false)

  // Generate the chatbot prompt
  const generateChatbotPrompt = () => {
    if (!state.generatedContent.chatbot) return ''
    return state.generatedContent.chatbot.prompt
  }

  const handleStartChat = async () => {
    setHasStartedChat(true)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${generateChatbotPrompt()}\n\nLeerling heeft zojuist op start gedrukt. Geef nu je welkomstboodschap.`,
          aiModel: 'smart'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start chat')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      
      setChatMessages([assistantMessage])
    } catch (error) {
      console.error('Error starting chat:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const conversationContext = chatMessages
        .map(msg => `${msg.role === 'user' ? 'Leerling' : 'Tutor'}: ${msg.content}`)
        .join('\n\n')
      
      const fullPrompt = `${generateChatbotPrompt()}

GESPREK TOT NU TOE:
${conversationContext}

Leerling: ${userMessage.content}

Reageer nu als de AI-tutor:`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullPrompt,
          aiModel: 'smart'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFlashcard = (cardId: string) => {
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

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const calculateQuizScore = () => {
    const totalQuestions = state.generatedContent.quiz.length
    const correctAnswers = state.generatedContent.quiz.reduce((count, question) => {
      return quizAnswers[question.id] === question.correctAnswer ? count + 1 : count
    }, 0)
    return { correct: correctAnswers, total: totalQuestions }
  }

  const handleSubmitQuiz = () => {
    setShowQuizResults(true)
  }


  const renderChatbot = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-purple-600 text-white p-4">
        <h3 className="font-medium">🤖 AI Tutor - {state.content.niveau} niveau</h3>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {!hasStartedChat ? (
          <div className="text-center py-12">
            <button
              onClick={handleStartChat}
              disabled={isLoading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              🚀 Start Gesprek
            </button>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {hasStartedChat && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Stel je vraag..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderFlashcards = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          📚 Flashcards ({state.generatedContent.flashcards.length} kaarten)
        </h3>
        <p className="text-gray-600">Klik op een kaart om hem om te draaien</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.generatedContent.flashcards.map((card, index) => (
          <div
            key={card.id}
            className="h-48 cursor-pointer transform transition-transform duration-200 hover:scale-105"
            onClick={() => toggleFlashcard(card.id)}
          >
            <div className={`absolute inset-0 bg-purple-600 text-white p-4 rounded-lg shadow-lg flex flex-col justify-center items-center text-center ${
              flippedCards.has(card.id) ? 'hidden' : 'block'
            }`}>
              <div className="text-xs text-purple-200 mb-2">Kaart {index + 1}</div>
              <p className="text-sm font-medium">{card.front}</p>
              <div className="text-xs text-purple-200 mt-2">Klik om om te draaien</div>
            </div>

            <div className={`absolute inset-0 bg-indigo-600 text-white p-4 rounded-lg shadow-lg flex flex-col justify-center items-center text-center ${
              flippedCards.has(card.id) ? 'block' : 'hidden'
            }`}>
              <div className="text-xs text-indigo-200 mb-2">Antwoord</div>
              <p className="text-sm">{card.back}</p>
              <div className="text-xs text-indigo-200 mt-2">Klik om terug te draaien</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTheory = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">📖 Theorie Overzicht</h3>
      {state.generatedContent.theoryOverview.map((section) => (
        <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            {section.type === 'orientation' && '🎯'} 
            {section.type === 'concepts' && '💡'}
            {section.type === 'connections' && '🔗'}
            {section.type === 'application' && '⚡'}
            {section.type === 'essence' && '⭐'}
            {' '}{section.title}
          </h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderQuiz = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          📝 Oefentoets ({state.generatedContent.quiz.length} vragen)
        </h3>
        <p className="text-gray-600">Test je kennis van de belangrijkste concepten</p>
      </div>

      {!showQuizResults ? (
        <>
          {state.generatedContent.quiz.map((question, index) => (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Vraag {index + 1}
              </h4>
              <p className="text-gray-800 mb-4">{question.question}</p>
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={optionIndex}
                      checked={quizAnswers[question.id] === optionIndex}
                      onChange={() => handleQuizAnswer(question.id, optionIndex)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="font-medium text-gray-600">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <div className="text-center">
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(quizAnswers).length < state.generatedContent.quiz.length}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              📊 Bekijk Resultaat
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center mb-6">
            <h4 className="text-2xl font-bold text-gray-800 mb-2">🎯 Quiz Resultaat</h4>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {calculateQuizScore().correct} / {calculateQuizScore().total}
            </div>
            <p className="text-gray-600">
              {Math.round((calculateQuizScore().correct / calculateQuizScore().total) * 100)}% correct
            </p>
          </div>
          
          <div className="space-y-4">
            {state.generatedContent.quiz.map((question, index) => {
              const isCorrect = quizAnswers[question.id] === question.correctAnswer
              return (
                <div key={question.id} className={`p-4 rounded-lg border ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h5 className="font-medium mb-2">Vraag {index + 1}: {question.question}</h5>
                  <p className="text-sm">
                    <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                      Jouw antwoord: {String.fromCharCode(65 + quizAnswers[question.id])} - {question.options[quizAnswers[question.id]]}
                    </span>
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-green-600">
                      Juiste antwoord: {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setQuizAnswers({})
                setShowQuizResults(false)
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              🔄 Opnieuw Proberen
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeModule) {
      case 'chatbot':
        return renderChatbot()
      case 'flashcards':
        return renderFlashcards()
      case 'theory':
        return renderTheory()
      case 'quiz':
        return renderQuiz()
      default:
        return renderChatbot()
    }
  }

  return (
    <StepLayout
      title="Je Leeromgeving"
      subtitle="Alles klaar! Gebruik de verschillende onderdelen om optimaal te leren"
      showProgress={false}
      showNavigation={false}
    >
      {/* Navigation Menu - Simplified */}
      <div className="flex justify-center gap-3 mb-8">
        {state.acceptedModules.includes('chatbot') && (
          <button
            onClick={() => setActiveModule('chatbot')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeModule === 'chatbot'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-800 border'
            }`}
          >
            🤖 AI Tutor
          </button>
        )}
        
        {state.acceptedModules.includes('theory') && (
          <button
            onClick={() => setActiveModule('theory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeModule === 'theory'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-800 border'
            }`}
          >
            📖 Theorie
          </button>
        )}
        
        {state.acceptedModules.includes('flashcards') && (
          <button
            onClick={() => setActiveModule('flashcards')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeModule === 'flashcards'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-800 border'
            }`}
          >
            📚 Flashcards
          </button>
        )}
        
        {state.acceptedModules.includes('quiz') && (
          <button
            onClick={() => setActiveModule('quiz')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeModule === 'quiz'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-800 border'
            }`}
          >
            📝 Oefentoets
          </button>
        )}
      </div>

      {/* Content */}
      {renderContent()}

      {/* Reset Option */}
      <div className="text-center mt-12 pt-8 border-t border-gray-200">
        <button
          onClick={resetState}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          🔄 Nieuwe Leeromgeving Maken
        </button>
      </div>
    </StepLayout>
  )
}