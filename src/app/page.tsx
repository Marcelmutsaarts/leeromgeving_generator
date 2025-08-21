'use client'

import { LearningEnvironmentProvider } from '@/contexts/LearningEnvironmentContext'
import LearningEnvironmentGenerator from '@/components/LearningEnvironmentGenerator/LearningEnvironmentGenerator'

export default function Home() {
  return (
    <LearningEnvironmentProvider>
      <LearningEnvironmentGenerator />
    </LearningEnvironmentProvider>
  )
}