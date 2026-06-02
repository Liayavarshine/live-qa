"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuestionForm() {
  const [question, setQuestion] = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return;

    const { error } = await supabase
      .from("questions")
      .insert({
        question,
      });

    if (!error) {
      setQuestion("");
    }
  };

  return (
    <div className="flex gap-3">
      <input
        className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        Ask
      </button>
    </div>
  );
}