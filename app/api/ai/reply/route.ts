import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageContent, senderName } = body;

    if (!messageContent || !senderName) {
      return NextResponse.json(
        { success: false, error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API-Schlüssel nicht konfiguriert' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein professioneller Kundenservice-Mitarbeiter, der höfliche und hilfreiche Antworten auf Kundenanfragen schreibt. Antworte auf Deutsch und sei freundlich, professionell und lösungsorientiert.',
        },
        {
          role: 'user',
          content: `Schreibe eine professionelle Antwort auf folgende Kundenanfrage von ${senderName}:\n\n${messageContent}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Error generating AI reply:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Generieren der Antwort' },
      { status: 500 }
    );
  }
}
