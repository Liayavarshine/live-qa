import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    const completion =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",
            content:
              "Answer briefly in 2-3 lines.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      });

    const answer =
      completion.choices[0]?.message?.content ||
      "No response";

    return Response.json({
      answer,
    });

  } catch (error) {
    console.error("Groq Error:", error);

    return Response.json(
      {
        answer:
          "AI is busy. Please try again later.",
      },
      {
        status: 500,
      }
    );
  }
}