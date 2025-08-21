export type EducationLevel = 'PO' | 'VMBO' | 'HAVO' | 'VWO' | 'MBO' | 'HBO' | 'UNI'

export interface ContentInput {
  vakinhoud: string
  uploadedFiles: File[]
  uploadedFileContents: string[]
  didactiek: string
  niveau: EducationLevel
}

export interface ChatbotConfig {
  prompt: string
  welcomeMessage: string
  isAccepted: boolean
}

export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface TheorySection {
  id: string
  title: string
  content: string
  type: 'orientation' | 'concepts' | 'connections' | 'application' | 'essence'
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export interface GeneratedContent {
  chatbot: ChatbotConfig | null
  flashcards: Flashcard[]
  theoryOverview: TheorySection[]
  quiz: QuizQuestion[]
}

export interface LearningEnvironmentState {
  currentStep: number
  content: ContentInput
  generatedContent: GeneratedContent
  acceptedModules: ('chatbot' | 'flashcards' | 'theory' | 'quiz')[]
  isComplete: boolean
}

export interface StepProps {
  onNext: () => void
  onBack: () => void
  canGoNext: boolean
  canGoBack: boolean
}

export interface GenerationRequest {
  content: ContentInput
  type: 'flashcards' | 'theory' | 'quiz'
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}