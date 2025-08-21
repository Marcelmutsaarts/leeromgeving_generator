'use client'

import React from 'react'
import { useLearningEnvironment } from '@/contexts/LearningEnvironmentContext'
import Step1_ContentInput from './Step1_ContentInput'
import Step2_ChatbotTest from './Step2_ChatbotTest'
import Step3_FlashcardsGeneration from './Step3_FlashcardsGeneration'
import Step4_TheoryOverview from './Step4_TheoryOverview'
import Step5_QuizGeneration from './Step5_QuizGeneration'
import Step6_FinalEnvironment from './Step6_FinalEnvironment'

export default function LearningEnvironmentGenerator() {
  const { state } = useLearningEnvironment()

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <Step1_ContentInput />
      case 2:
        return <Step2_ChatbotTest />
      case 3:
        return <Step3_FlashcardsGeneration />
      case 4:
        return <Step4_TheoryOverview />
      case 5:
        return <Step5_QuizGeneration />
      case 6:
        return <Step6_FinalEnvironment />
      default:
        return <Step1_ContentInput />
    }
  }

  return (
    <>
      {renderCurrentStep()}
    </>
  )
}