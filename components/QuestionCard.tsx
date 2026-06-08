"use client";

import { supabase } from "@/lib/supabase";

export default function QuestionCard({ question }: any) {
 const handleVote = async () => {
  const { data, error } = await supabase
    .from("questions")
    .update({
      votes: (question.votes || 0) + 1,
    })
    .eq("id", question.id)
    .select();

  console.log("data:", data);
  console.log("error:", error);
};

  return (
    <div className="p-4 border rounded-xl mb-3 bg-white">
      <div className="flex items-center gap-3">
        <button
          onClick={handleVote}
          className="font-semibold text-blue-600 hover:text-blue-800"
        >
          ▲ {question.votes || 0}
        </button>

        <p className="font-semibold text-gray-900">
          {question.question}
        </p>
      </div>

      {/*
      ANSWER SECTION (HIDDEN)
      */}
      <div className="mt-2">
        {question.answer ? (
          <p className="text-green-700 bg-green-50 p-2 rounded-lg">
            🤖 {question.answer}
          </p>
        ) : (
          <p className="text-gray-400 text-sm">
            ⏳ Waiting for AI answer...
          </p>
        )}
      </div>

    </div>
  );
}