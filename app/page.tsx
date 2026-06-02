"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import QuestionForm from "@/components/QuestionForm";
import QuestionCard from "@/components/QuestionCard";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .order("votes", {
        ascending: false,
      });

    setQuestions(data || []);
  };

  useEffect(() => {
    loadQuestions();

    const channel = supabase
      .channel("questions-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
        },
        () => {
          loadQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredQuestions = questions.filter(
    (q) =>
      q.question
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-10 px-4">

        <h1 className="text-5xl font-bold mb-2">
          Live Q&A
        </h1>

        <p className="text-gray-500 mb-8">
          Interactive ✓
        </p>

        <QuestionForm />

        <input
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-5 mb-6"
          placeholder="Search questions..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
            />
          ))}
        </div>

      </div>
    </main>
  );
}