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

    const prompt = `Je bent een expert in het maken van educatieve theorie-overzichten. Creëer een gestructureerd theorie-overzicht voor het ${niveau} niveau op basis van de volgende vakinhoud.

VAKINHOUDELIJKE KENNIS:
${content}

INSTRUCTIES:
Maak een theorie-overzicht met EXACT de volgende structuur:

1. ORIËNTATIE (maximaal 3 zinnen)
   - Wat ga je leren en waarom is dit relevant?

2. KERNCONCEPTEN (3-5 hoofdpunten)
   - Elk concept in eigen blok
   - Definitie in begrijpelijke taal voor ${niveau} niveau
   - Concrete metafoor/analogie per concept

3. SAMENHANG
   - Hoe verhouden concepten zich tot elkaar?

4. TOEPASSING
   - Één concreet, herkenbaar voorbeeld
   - Stapsgewijze uitwerking

5. ESSENTIE
   - Kernboodschap in 2-3 punten
   - "Onthoud vooral dit..."

GEWENST OUTPUT FORMAAT (JSON):
{
  "theory": {
    "orientation": "Tekst voor oriëntatie sectie",
    "concepts": [
      {
        "title": "Concept naam",
        "definition": "Definitie in begrijpelijke taal",
        "metaphor": "Concrete metafoor of analogie"
      }
    ],
    "connections": "Uitleg van samenhang tussen concepten",
    "application": {
      "example": "Concreet voorbeeld",
      "steps": ["Stap 1", "Stap 2", "Stap 3"]
    },
    "essence": [
      "Kernpunt 1",
      "Kernpunt 2", 
      "Kernpunt 3"
    ]
  }
}

Genereer nu het theorie-overzicht:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])
        if (parsedData.theory) {
          return NextResponse.json({ 
            success: true,
            theory: parsedData.theory
          })
        }
      }
      
      // Fallback: return raw text if JSON parsing fails
      return NextResponse.json({ 
        success: true,
        theory: {
          raw: text,
          orientation: "Zie de gegenereerde inhoud hieronder",
          concepts: [],
          connections: "",
          application: { example: "", steps: [] },
          essence: []
        }
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'AI response kon niet worden verwerkt', debug: text },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Fout bij het genereren van theorie:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van het theorie-overzicht' },
      { status: 500 }
    )
  }
}