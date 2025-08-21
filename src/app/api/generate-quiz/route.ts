import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API configuratie ontbreekt' }, 
        { status: 500 }
      )
    }

    const body = await request.json()
    const { content, niveau } = body

    if (!content || !niveau) {
      return NextResponse.json(
        { error: 'Content en niveau zijn vereist' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Je bent een expert in het maken van educatieve toetsvragen. Genereer precies 8 multiple choice vragen voor het ${niveau} niveau op basis van de volgende vakinhoud.

VAKINHOUDELIJKE KENNIS:
${content}

INSTRUCTIES:
1. Maak precies 8 multiple choice vragen
2. Elke vraag heeft exact 3 antwoordalternatieven (A, B, C)
3. Pas de moeilijkheidsgraad aan op het ${niveau} niveau
4. Zorg voor variatie in vraagtypen (begrip, toepassing, analyse)
5. Maak vragen die de kernconcepten testen
6. Één antwoord per vraag is correct
7. Maak de foute antwoorden plausibel maar duidelijk fout
8. Gebruik duidelijke, eenvoudige taal geschikt voor ${niveau}

GEWENST OUTPUT FORMAAT (JSON):
{
  "quiz": [
    {
      "question": "De vraag tekst hier",
      "options": [
        "Antwoordoptie A",
        "Antwoordoptie B", 
        "Antwoordoptie C"
      ],
      "correctAnswer": 0
    }
  ]
}

BELANGRIJK: correctAnswer is de index (0, 1, of 2) van het juiste antwoord in de options array.

Genereer nu de 8 toetsvragen:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])
        if (parsedData.quiz && Array.isArray(parsedData.quiz)) {
          // Validate the quiz structure
          const validQuiz = parsedData.quiz.slice(0, 8).filter((q: any) => 
            q.question && 
            Array.isArray(q.options) && 
            q.options.length === 3 &&
            typeof q.correctAnswer === 'number' &&
            q.correctAnswer >= 0 && 
            q.correctAnswer <= 2
          )
          
          return NextResponse.json({ 
            success: true,
            quiz: validQuiz
          })
        }
      }
      
      // Fallback: try to parse manually if JSON parsing fails
      const lines = text.split('\n').filter(line => line.trim())
      const questions = []
      let currentQuestion: any = {}
      
      for (const line of lines) {
        if (line.match(/^\d+\./)) {
          if (currentQuestion.question) {
            questions.push(currentQuestion)
            currentQuestion = {}
          }
          currentQuestion.question = line.replace(/^\d+\.\s*/, '').trim()
          currentQuestion.options = []
        } else if (line.match(/^[ABC]\)/)) {
          if (currentQuestion.options) {
            currentQuestion.options.push(line.replace(/^[ABC]\)\s*/, '').trim())
          }
        } else if (line.toLowerCase().includes('correct') || line.toLowerCase().includes('antwoord')) {
          const match = line.match(/[ABC]/)
          if (match) {
            currentQuestion.correctAnswer = match[0] === 'A' ? 0 : match[0] === 'B' ? 1 : 2
          }
        }
      }
      
      if (currentQuestion.question && currentQuestion.options && currentQuestion.options.length === 3) {
        questions.push(currentQuestion)
      }

      return NextResponse.json({ 
        success: true,
        quiz: questions.slice(0, 8)
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'AI response kon niet worden verwerkt', debug: text },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Fout bij het genereren van quiz:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van de oefentoets' },
      { status: 500 }
    )
  }
}