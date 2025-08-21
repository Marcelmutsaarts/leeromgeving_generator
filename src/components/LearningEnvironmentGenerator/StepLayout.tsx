'use client'

import React from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import Image from 'next/image'

interface StepLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showProgress?: boolean
  showNavigation?: boolean
  onNext?: () => void
  onBack?: () => void
  canGoNext?: boolean
  canGoBack?: boolean
  nextLabel?: string
  backLabel?: string
}

const STEP_TITLES = [
  'Inhoud Invoeren',
  'Chatbot Testen', 
  'Flashcards Genereren',
  'Theorie Overzicht',
  'Oefentoets Maken',
  'Leeromgeving Klaar'
]

export default function StepLayout({
  children,
  title,
  subtitle,
  showProgress = true,
  showNavigation = true,
  onNext,
  onBack,
  canGoNext = true,
  canGoBack = true,
  nextLabel = 'Volgende',
  backLabel = 'Terug'
}: StepLayoutProps) {
  const { state, nextStep, prevStep } = useLearningEnvironment()

  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      nextStep()
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      prevStep()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">
            Interactieve Leeromgeving Generator
          </h1>
        </div>

        {/* Progress Indicator */}
        {showProgress && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">
                  Stap {state.currentStep} van 6
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(state.currentStep / 6) * 100}%` }}
                />
              </div>
              
              <div className="grid grid-cols-6 gap-2 text-xs text-gray-600">
                {STEP_TITLES.map((stepTitle, index) => (
                  <div 
                    key={index}
                    className={`text-center p-2 rounded ${
                      index + 1 === state.currentStep 
                        ? 'bg-purple-100 text-purple-700 font-medium' 
                        : index + 1 < state.currentStep
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {index + 1 < state.currentStep && (
                      <div className="inline-flex items-center justify-center w-4 h-4 bg-green-500 text-white rounded-full text-xs mb-1">
                        ✓
                      </div>
                    )}
                    {index + 1 === state.currentStep && (
                      <div className="inline-flex items-center justify-center w-4 h-4 bg-purple-500 text-white rounded-full text-xs mb-1">
                        {index + 1}
                      </div>
                    )}
                    {index + 1 > state.currentStep && (
                      <div className="inline-flex items-center justify-center w-4 h-4 bg-gray-300 text-gray-600 rounded-full text-xs mb-1">
                        {index + 1}
                      </div>
                    )}
                    <div className="leading-tight">{stepTitle}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-purple-800 mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-lg text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>

          {/* Navigation */}
          {showNavigation && (
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={!canGoBack || state.currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  canGoBack && state.currentStep > 1
                    ? 'bg-gray-500 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                ← {backLabel}
              </button>

              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Opnieuw Beginnen
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    canGoNext
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {nextLabel} →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 text-purple-600">
            <span>💜</span>
            <span>Leeromgeving Generator</span>
            <span>💜</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Powered by AI voor Docenten • Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  )
}