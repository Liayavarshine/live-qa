"use client";

import { supabase } from "@/lib/supabase";

export default function QuestionCard({
  question,
}: {
  question: any;
}) {
  const voteQuestion = async () => {
    await supabase
      .from("questions")
      .update({
        votes: question.votes + 1,
      })
      .eq("id", question.id);
  };

  return (
    <div className="border rounded-2xl p-5 flex gap-4 items-center bg-white shadow-sm">
      <button
        onClick={voteQuestion}
        className="border px-4 py-2 rounded-xl"
      >
        ▲ {question.votes}
      </button>

      <h3 className="font-medium text-lg">
        {question.question}
      </h3>
    </div>
  );
}