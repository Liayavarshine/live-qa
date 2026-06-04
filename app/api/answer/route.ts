import { ai } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
    });

    return Response.json({
      answer: response.text,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}