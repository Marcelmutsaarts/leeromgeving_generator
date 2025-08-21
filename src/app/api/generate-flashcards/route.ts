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

    const prompt = `Je bent een expert in het maken van educatieve flashcards. Genereer precies 15 flashcards voor het ${niveau} niveau op basis van de volgende vakinhoud.

VAKINHOUDELIJKE KENNIS:
${content}

INSTRUCTIES:
1. Maak precies 15 flashcards
2. Elke flashcard moet een korte vraag/term zijn op de voorkant en een heldere uitleg op de achterkant
3. Pas de moeilijkheidsgraad aan op het ${niveau} niveau
4. Zorg voor variatie in vraagtypen (definitie, toepassing, voorbeeld, etc.)
5. Gebruik duidelijke, eenvoudige taal
6. Voorkom overlapping tussen kaartjes

GEWENST OUTPUT FORMAAT (JSON):
{
  "flashcards": [
    {
      "front": "Korte vraag of term",
      "back": "Heldere uitleg of antwoord"
    }
  ]
}

Genereer nu de flashcards:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])
        if (parsedData.flashcards && Array.isArray(parsedData.flashcards)) {
          return NextResponse.json({ 
            success: true,
            flashcards: parsedData.flashcards.slice(0, 15) // Ensure max 15 cards
          })
        }
      }
      
      // Fallback: parse manually if JSON parsing fails
      const lines = text.split('\n').filter(line => line.trim())
      const flashcards = []
      let currentCard: any = {}
      
      for (const line of lines) {
        if (line.includes('front:') || line.includes('Front:')) {
          if (currentCard.front) {
            flashcards.push(currentCard)
            currentCard = {}
          }
          currentCard.front = line.replace(/.*front:?\s*/i, '').replace(/"/g, '').trim()
        } else if (line.includes('back:') || line.includes('Back:')) {
          currentCard.back = line.replace(/.*back:?\s*/i, '').replace(/"/g, '').trim()
        }
      }
      
      if (currentCard.front && currentCard.back) {
        flashcards.push(currentCard)
      }

      return NextResponse.json({ 
        success: true,
        flashcards: flashcards.slice(0, 15)
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'AI response kon niet worden verwerkt', debug: text },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Fout bij het genereren van flashcards:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van flashcards' },
      { status: 500 }
    )
  }
}