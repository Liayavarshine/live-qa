"use client";

import { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";

import QuestionForm from "@/components/QuestionForm";
import QuestionCard from "@/components/QuestionCard";
import Pollcard from "@/components/Pollcard";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);

  // searchInput  — the live value bound to the <input> element
  // activeSearch — the value actually used to filter the list
  // Keeping them separate lets us commit a search only on button click
  // while still supporting real-time filtering as the user types.
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .order("votes", { ascending: false });

    setQuestions(data || []);
  };

  // Subscribe to real-time changes so the list stays in sync across clients.
  useEffect(() => {
    loadQuestions();

    const channel = supabase
      .channel("questions-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        () => {
          loadQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Search helpers ───────────────────────────────────────────────────────────

  // Real-time: update activeSearch on every keystroke so the list filters live.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setActiveSearch(value); // live filtering as the user types
  };

  // Explicit Search button click — commits the current input value.
  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  // Allow pressing Enter inside the search box to trigger a search.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // Clear both the input and the active filter, then re-focus the input.
  const handleClear = () => {
    setSearchInput("");
    setActiveSearch("");
    inputRef.current?.focus();
  };

  // ── Filtering ────────────────────────────────────────────────────────────────

  // Case-insensitive substring match against the committed activeSearch value.
  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(activeSearch.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-10 px-4">

        <h1 className="text-5xl font-bold mb-2">Live Q&A</h1>

        <p className="text-gray-500 mb-8">Interactive ✓</p>

        <Pollcard />

        <br />

        <QuestionForm />

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 mt-5 mb-6">
          {/* Search input */}
          <input
            ref={inputRef}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Search questions..."
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          {/* Search button — commits the current search term */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Search
          </button>

          {/* Clear button — only shown when there is an active search term */}
          {searchInput && (
            <button
              onClick={handleClear}
              className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium border border-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Question list ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            // Empty-state message shown when the search yields no results.
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">
                {activeSearch
                  ? `No questions found for "${activeSearch}"`
                  : "No questions yet. Be the first to ask!"}
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
