import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const { question } = await req.json();

  try {
    // 🔁 retry logic (important)
    let response;

    for (let i = 0; i < 3; i++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: `Answer in short 2-3 lines: ${question}`,
        });
        break;
      } catch (err: any) {
        if (i === 2) throw err;
        await sleep(1000 * (i + 1)); // wait 1s, 2s
      }
    }

    return Response.json({
      answer: response?.text || "No response",
    });

  } catch (error) {
    return Response.json(
      {
        answer: "AI is busy. Please try again in a few seconds.",
      },
      { status: 503 }
    );
  }
}