'use client'

import React, { useState } from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import StepLayout from './StepLayout'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Step2_ChatbotTest() {
  const { state, updateGeneratedContent, acceptModule, nextStep } = useLearningEnvironment()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Generate chatbot prompt based on user input
  const generateChatbotPrompt = () => {
    const content = state.content.vakinhoud || state.content.uploadedFileContents.join('\n\n')
    return `${state.content.didactiek}

VAKINHOUDELIJKE KENNIS:
${content}

ONDERWIJSNIVEAU: ${state.content.niveau}

Je hebt toegang tot bovenstaande vakinhoudelijke kennis en moet hiermee leerlingen op ${state.content.niveau}-niveau helpen leren. Gebruik deze kennis als basis voor je uitleg en voorbeelden.

Wanneer een leerling "start" zegt of het gesprek begint, geef dan een korte, hartelijke welkomstboodschap waarin je uitlegt waar je mee kunt helpen op basis van de vakinhoud. Houd dit beknopt (maximaal 3 zinnen).`
  }

  const handleStart = async (retryCount = 0) => {
    const maxRetries = 3
    setHasStarted(true)
    setIsLoading(true)
    
    try {
      const chatbotPrompt = generateChatbotPrompt()
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${chatbotPrompt}\n\nLeerling heeft zojuist op start gedrukt. Geef nu je welkomstboodschap.`,
          aiModel: 'smart'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return handleStart(retryCount + 1)
        }
        
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return handleStart(retryCount + 1)
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      
      setMessages([assistantMessage])
      
      // Update generated content
      updateGeneratedContent({
        chatbot: {
          prompt: chatbotPrompt,
          welcomeMessage: data.response,
          isAccepted: false
        }
      })
    } catch (error) {
      console.error('Error starting chat:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          return handleStart(retryCount + 1)
        }
        alert('De chatbot start duurt te lang. Controleer je internetverbinding en probeer het opnieuw.')
      } else if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return handleStart(retryCount + 1)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
        alert(`Chatbot start mislukt na ${maxRetries + 1} pogingen.\n\nFout: ${errorMessage}\n\nSuggesties:\n• Controleer je internetverbinding\n• Wacht een minuut en probeer opnieuw`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (retryCount = 0) => {
    const maxRetries = 3
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const chatbotPrompt = generateChatbotPrompt()
      
      // Create conversation context
      const conversationContext = messages
        .map(msg => `${msg.role === 'user' ? 'Leerling' : 'Tutor'}: ${msg.content}`)
        .join('\n\n')
      
      const fullPrompt = `${chatbotPrompt}

GESPREK TOT NU TOE:
${conversationContext}

Leerling: ${userMessage.content}

Reageer nu als de AI-tutor:`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullPrompt,
          aiModel: 'smart'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return handleSendMessage(retryCount + 1)
        }
        
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return handleSendMessage(retryCount + 1)
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          return handleSendMessage(retryCount + 1)
        }
        alert('Het bericht versturen duurt te lang. Controleer je internetverbinding en probeer het opnieuw.')
      } else if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return handleSendMessage(retryCount + 1)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
        alert(`Bericht versturen mislukt na ${maxRetries + 1} pogingen.\n\nFout: ${errorMessage}\n\nSuggesties:\n• Controleer je internetverbinding\n• Wacht een minuut en probeer opnieuw`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptChatbot = () => {
    if (state.generatedContent.chatbot) {
      updateGeneratedContent({
        chatbot: {
          ...state.generatedContent.chatbot,
          isAccepted: true
        }
      })
      acceptModule('chatbot')
      nextStep()
    }
  }

  const handleRefine = () => {
    // Go back to step 1 to refine content
    window.location.reload()
  }

  const hasInteracted = messages.length > 1
  const canProceed = hasStarted && !!state.generatedContent.chatbot

  return (
    <StepLayout
      title="Test de AI-tutor"
      subtitle="Probeer de chatbot uit met een paar vragen"
      onNext={handleAcceptChatbot}
      canGoNext={canProceed}
      nextLabel="Accepteren"
      showNavigation={false}
    >
      <div className="space-y-6">

        {/* Chat Interface */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-purple-600 text-white p-3 text-center">
            <h3 className="font-medium">🤖 AI Tutor ({state.content.niveau})</h3>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {!hasStarted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-6">Klik op "Start" om het gesprek met de AI-tutor te beginnen</p>
                <button
                  onClick={() => handleStart()}
                  disabled={isLoading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Laden...' : '🚀 Start Gesprek'}
                </button>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
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

          {/* Chat Input */}
          {hasStarted && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Typ je vraag of bericht..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!currentMessage.trim() || isLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasStarted && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleRefine}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Aanpassen
            </button>
            <button
              onClick={handleAcceptChatbot}
              disabled={!canProceed}
              className={`px-4 py-2 rounded-lg ${
                canProceed
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Accepteren
            </button>
          </div>
        )}
      </div>
    </StepLayout>
  )
}