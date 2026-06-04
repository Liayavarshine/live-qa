"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);

    try {
      // Get AI answer
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await res.json();

      // Save question + AI answer to Supabase
      const { error } = await supabase
        .from("questions")
        .insert({
          question,
          answer: data.answer,
        });

      if (error) {
        console.error(error);
        return;
      }

      setQuestion("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>
    </div>
  );
}