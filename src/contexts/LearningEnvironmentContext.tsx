'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { LearningEnvironmentState, ContentInput, GeneratedContent, EducationLevel } from '@/types/learningEnvironment'

const DEFAULT_DIDACTIEK = "Je bent een deskundige tutor die complexe concepten helder en stapsgewijs uitlegt. Je past je uitleg aan op het niveau van de lerende en gebruikt concrete voorbeelden en analogieën om abstracte concepten toegankelijk te maken. Je structureert je uitleg logisch: eerst de hoofdlijnen, dan de details. Je controleert regelmatig of de lerende het begrijpt door korte samenvattingen te geven en te vragen of alles duidelijk is. Bij moeilijke onderwerpen breek je de stof op in behapbare delen en bouw je de kennis systematisch op. Pedagogisch gezien creëer je een veilige leeromgeving waarin fouten maken een natuurlijk onderdeel van het leerproces is. Je benadert elke lerende met geduld, respect en oprechte interesse in hun ontwikkeling. Door positieve bekrachtiging en het benadrukken van groei bouw je het zelfvertrouwen op en stimuleer je een groeimindset waarbij uitdagingen gezien worden als kansen om te leren. Je erkent verschillende leerstijlen en achtergronden, moedigt zelfreflectie en metacognitie aan, en verbindt de leerstof met de persoonlijke doelen en interesses van de lerende om intrinsieke motivatie te bevorderen."

const initialState: LearningEnvironmentState = {
  currentStep: 1,
  content: {
    vakinhoud: '',
    uploadedFiles: [],
    uploadedFileContents: [],
    didactiek: DEFAULT_DIDACTIEK,
    niveau: 'HBO'
  },
  generatedContent: {
    chatbot: null,
    flashcards: [],
    theoryOverview: [],
    quiz: []
  },
  acceptedModules: [],
  isComplete: false
}

interface LearningEnvironmentContextType {
  state: LearningEnvironmentState
  updateContent: (content: Partial<ContentInput>) => void
  updateGeneratedContent: (content: Partial<GeneratedContent>) => void
  acceptModule: (module: 'chatbot' | 'flashcards' | 'theory' | 'quiz') => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  resetState: () => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => boolean
}

const LearningEnvironmentContext = createContext<LearningEnvironmentContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'learning-environment-state'

export function LearningEnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningEnvironmentState>(initialState)

  // Load from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToLocalStorage()
  }, [state])

  const updateContent = (newContent: Partial<ContentInput>) => {
    setState(prev => ({
      ...prev,
      content: { ...prev.content, ...newContent }
    }))
  }

  const updateGeneratedContent = (newContent: Partial<GeneratedContent>) => {
    setState(prev => ({
      ...prev,
      generatedContent: { ...prev.generatedContent, ...newContent }
    }))
  }

  const acceptModule = (module: 'chatbot' | 'flashcards' | 'theory' | 'quiz') => {
    setState(prev => ({
      ...prev,
      acceptedModules: prev.acceptedModules.includes(module) 
        ? prev.acceptedModules 
        : [...prev.acceptedModules, module]
    }))
  }

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 6)
    }))
  }

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }))
  }

  const goToStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, Math.min(step, 6))
    }))
  }

  const resetState = () => {
    setState(initialState)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  const saveToLocalStorage = () => {
    try {
      // Don't save File objects to localStorage (they're not serializable)
      const stateToSave = {
        ...state,
        content: {
          ...state.content,
          uploadedFiles: [] // Clear files, keep file contents
        }
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  const loadFromLocalStorage = (): boolean => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsedState = JSON.parse(saved)
        setState(parsedState)
        return true
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
    return false
  }

  const value: LearningEnvironmentContextType = {
    state,
    updateContent,
    updateGeneratedContent,
    acceptModule,
    nextStep,
    prevStep,
    goToStep,
    resetState,
    saveToLocalStorage,
    loadFromLocalStorage
  }

  return (
    <LearningEnvironmentContext.Provider value={value}>
      {children}
    </LearningEnvironmentContext.Provider>
  )
}

export function useLearningEnvironment() {
  const context = useContext(LearningEnvironmentContext)
  if (context === undefined) {
    throw new Error('useLearningEnvironment must be used within a LearningEnvironmentProvider')
  }
  return context
}