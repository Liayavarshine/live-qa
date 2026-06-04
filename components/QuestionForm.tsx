"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    setLoading(true);

    try {
      // 1. Call AI API
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      // 2. Save to Supabase
      const { error } = await supabase.from("questions").insert({
        question,
        answer: data.answer,
      });

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      // 3. Clear input
      setQuestion("");
    } catch (err) {
      console.error("Request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* INPUT */}
      <input
        className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>
    </div>
  );
}