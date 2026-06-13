"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuestionCard({ question }: any) {
  // Track whether the current user has already voted on this question.
  // We use localStorage so the restriction persists across page reloads
  // without requiring authentication.
  const [hasVoted, setHasVoted] = useState(false);

  // On mount, check localStorage for a vote record keyed by question id.
  useEffect(() => {
    const voted = localStorage.getItem(`voted_${question.id}`);
    if (voted === "true") {
      setHasVoted(true);
    }
  }, [question.id]);

  const handleVote = async () => {
    // Guard: do nothing if the user has already voted.
    if (hasVoted) return;

    // Optimistically mark as voted in localStorage before the async call
    // so rapid double-clicks cannot sneak through.
    localStorage.setItem(`voted_${question.id}`, "true");
    setHasVoted(true);

    // Persist the incremented vote count to Supabase.
    const { data, error } = await supabase
      .from("questions")
      .update({
        votes: (question.votes || 0) + 1,
      })
      .eq("id", question.id)
      .select();

    if (error) {
      // Roll back the optimistic UI update if Supabase rejects the write.
      console.error("Vote error:", error);
      localStorage.removeItem(`voted_${question.id}`);
      setHasVoted(false);
    }

    console.log("data:", data);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-xl mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Upvote button — disabled and visually muted once the user has voted */}
        <button
          onClick={handleVote}
          disabled={hasVoted}
          title={hasVoted ? "Already voted" : "Upvote this question"}
          className={`flex flex-col items-center min-w-[48px] px-2 py-1 rounded-lg border transition-all
            ${
              hasVoted
                ? // Already-voted state: grey, disabled appearance
                  "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : // Normal state: blue, interactive
                  "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-400 cursor-pointer"
            }`}
        >
          <span className="text-lg leading-none">▲</span>
          <span className="text-sm font-bold leading-none mt-0.5">
            {question.votes || 0}
          </span>
          {/* Show "Already voted" label beneath the count when applicable */}
          {hasVoted && (
            <span className="text-[10px] leading-tight mt-1 text-gray-400">
              Voted
            </span>
          )}
        </button>

        {/* Question text and AI answer */}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{question.question}</p>

          <div className="mt-2">
            {question.answer ? (
              <p className="text-green-700 bg-green-50 p-2 rounded-lg text-sm">
                🤖 {question.answer}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                ⏳ Waiting for AI answer...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
