# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
Create `.env.local` with:
```env
GEMINI_API_KEY=your_api_key_here
```

## Architecture Overview

This is an **Interactive Learning Environment Generator** - a Next.js application that guides users through a 6-step wizard to create personalized AI-powered learning experiences.

### Core Architecture Pattern
- **Multi-step wizard interface** with persistent state management via React Context
- **Step-by-step progression**: Content Input → Chatbot Test → Flashcards → Theory → Quiz → Final Environment  
- **Opt-in module selection**: Users can skip any generation step (flashcards, theory, quiz)
- **State persistence**: Uses localStorage to preserve progress across sessions

### Key State Management
The entire application flows through `LearningEnvironmentContext` which manages:
- **Content input**: User's educational content (manual text or uploaded files)
- **Didactic settings**: How the AI tutor should behave pedagogically
- **Generated modules**: AI-generated flashcards, theory overview, quiz questions
- **Step navigation**: Current step, accepted modules, completion state

### Multi-Step Flow Architecture
1. **Step1_ContentInput**: File upload (PDF/DOCX) OR manual text input + didactic settings + education level
2. **Step2_ChatbotTest**: Live chat interface to test AI tutor behavior before accepting
3. **Step3_FlashcardsGeneration**: Optional - Generate 15 flashcards with flip animations
4. **Step4_TheoryOverview**: Optional - Generate structured theory with 5 sections (orientation, concepts, connections, application, essence)  
5. **Step5_QuizGeneration**: Optional - Generate 8 multiple choice questions
6. **Step6_FinalEnvironment**: Integrated learning environment showing only accepted modules

### AI Content Generation Pipeline
Each generation step follows the pattern:
```typescript
User opts-in → API call to Gemini 2.5 Flash → Parse structured response → Allow editing → Accept/Skip
```

API endpoints use **strong, educational prompts** tailored to the user's education level and content.

### Component Architecture
- **StepLayout**: Shared wrapper providing navigation, progress indication, and consistent styling
- **Step Components**: Self-contained components handling their specific generation logic
- **Modal Pattern**: Used for editing complex content (e.g., didactic instructions popup)
- **Context Provider**: Wraps entire application to provide state access

### File Processing
- **Upload handling**: Via `/api/upload-docx` using mammoth (DOCX) and pdf-parse (PDF)
- **Content extraction**: Text content stored in state alongside file objects
- **Multi-format support**: PDF, DOCX with automatic text extraction

### Generated Content Types
- **Flashcards**: `{id, front, back}` with flip animations and inline editing
- **Theory Sections**: `{id, title, content, type}` where type is one of 5 educational section types
- **Quiz Questions**: `{id, question, options[], correctAnswer}` with 3 options per question
- **Chatbot Config**: `{prompt, welcomeMessage, isAccepted}` with live testing capability

### API Integration
All content generation uses **Gemini 2.5 Flash** via `/api/generate-*` endpoints:
- Strong prompts include user's education level and content
- Structured JSON responses with fallback parsing
- Error handling with user-friendly messages
- Content validation and sanitization

### UI/UX Philosophy  
- **Minimalist design** - removed visual clutter, simplified interfaces
- **Step-by-step guidance** - clear progression with visual indicators
- **Optional features** - users can skip any generation step
- **Direct integration** - final environment starts with first accepted module (no overview page)
- **Modal editing** - complex content opens in full-screen popups for better UX

### State Persistence Strategy
- **LocalStorage integration** for session recovery
- **File content caching** (files themselves cleared for serialization)
- **Reset functionality** to start over completely
- **Navigation state** preserved across page reloads