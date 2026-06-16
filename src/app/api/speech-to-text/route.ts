import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(req: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Speech to text error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    );
  }
}
