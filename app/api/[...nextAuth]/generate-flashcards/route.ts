// app/api/generate-flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  // Use the OpenAI API key from the environment variable
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // Use 'gpt-3.5-turbo' if you don't have access to 'gpt-4'
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ data });
    } else {
      return NextResponse.json(
        {
          error: data.error.message || "Error fetching data from OpenAI API",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while fetching data." },
      { status: 500 }
    );
  }
}