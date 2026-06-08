"use client";

import { useState } from "react";

export default function QuestionCard({ question }: any) {
  const [votes, setVotes] = useState(0);

  return (
    <div className="p-4 border rounded-xl mb-3 bg-white">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setVotes(votes + 1)}
          className="font-semibold text-blue-600 hover:text-blue-800"
        >
          ▲ {votes}
        </button>

        <p className="font-semibold text-gray-900">
          {question.question}
        </p>
      </div>

      {/*
      ANSWER SECTION (HIDDEN)

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
      */}
    </div>
  );
}