import { ai } from "@/lib/gemini";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json({ answer: "Invalid question provided." }, { status: 400 });
    }

    // 1. Try Gemini 2.5 Flash first
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are an expert speaker and AI assistant in a live audience Q&A session.
Please provide a clear, concise, and helpful 2-3 line answer to this attendee question:
"${question}"`,
        });

        const answer = response.text?.trim();
        if (answer) {
          return Response.json({ answer });
        }
      } catch (geminiErr) {
        console.warn("Gemini generation failed, falling back to Groq:", geminiErr);
      }
    }

    // 2. Fallback to Groq with active available model
    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "system",
              content: "Answer briefly in 2-3 lines for a live Q&A session.",
            },
            {
              role: "user",
              content: question,
            },
          ],
        });

        const answer = completion.choices[0]?.message?.content?.trim() || "No response";
        return Response.json({ answer });
      } catch (groqErr) {
        console.error("Groq fallback error:", groqErr);
      }
    }

    return Response.json(
      { answer: "AI answer currently unavailable." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Answer API Error:", error);
    return Response.json(
      { answer: "AI is busy. Please try again later." },
      { status: 500 }
    );
  }
}