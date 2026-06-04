"use client";

import { supabase } from "@/lib/supabase";

export default function QuestionCard({ question }: any) {
  return (
    <div className="p-4 border rounded-xl mb-3 bg-white">

      {/* QUESTION */}
      <p className="font-semibold text-gray-900">
        ▲ {question.upvotes || 0} {question.question}
      </p>

      {/* ANSWER */}
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