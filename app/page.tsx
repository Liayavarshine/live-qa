"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Question } from "@/lib/types";
import { fetchQuestionsAndReplies } from "@/lib/replies";

import QuestionForm from "@/components/QuestionForm";
import QuestionCard from "@/components/QuestionCard";
import Pollcard from "@/components/Pollcard";
import LiveReactions from "@/components/LiveReactions";
import ExportBar from "@/components/ExportBar";

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    try {
      const data = await fetchQuestionsAndReplies();
      setQuestions(data);
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time changes on both `questions` and `replies` tables
  useEffect(() => {
    // Perform initial fetch asynchronously to avoid cascading synchronous render
    queueMicrotask(() => {
      loadQuestions();
    });

    const channel = supabase
      .channel("live-qa-db-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        () => {
          loadQuestions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "replies" },
        () => {
          loadQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadQuestions]);

  // ── Search helpers ───────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setActiveSearch(value);
  };

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setSearchInput("");
    setActiveSearch("");
    inputRef.current?.focus();
  };

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filteredQuestions = questions.filter((q) => {
    if (!activeSearch.trim()) return true;
    const query = activeSearch.toLowerCase();
    const inQuestion = q.question.toLowerCase().includes(query);
    const inAnswer = (q.answer || "").toLowerCase().includes(query);
    const inReplies = (q.replies || []).some(
      (r) =>
        r.content.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query)
    );
    return inQuestion || inAnswer || inReplies;
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* ── Top Header & Admin Export PDF Button ────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
              Live Q&A
            </h1>
            <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Interactive Audience Session</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400">
                {questions.length} {questions.length === 1 ? "question" : "questions"}
              </span>
            </p>
          </div>

          {/* Single-Click PDF Export Button */}
          <ExportBar questions={questions} />
        </div>

        {/* Existing Interactive Poll Card */}
        <Pollcard />

        <div className="my-6" />

        {/* Question Submission Form */}
        <QuestionForm />

        {/* ── Search Bar ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 mt-6 mb-6">
          <input
            ref={inputRef}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search questions, AI answers, or reply comments..."
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm cursor-pointer active:scale-95"
          >
            Search
          </button>

          {searchInput && (
            <button
              onClick={handleClear}
              className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm border border-gray-300 cursor-pointer active:scale-95"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Question List with Threaded Replies ─────────────────────────── */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm animate-pulse">Loading live questions...</p>
            </div>
          ) : filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onRefresh={loadQuestions}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-base text-gray-600 font-medium">
                {activeSearch
                  ? `No questions match "${activeSearch}"`
                  : "No questions yet. Be the first to ask!"}
              </p>
              {activeSearch && (
                <button
                  onClick={handleClear}
                  className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                >
                  Clear search filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Live Floating Emoji Reactions ─────────────────────────────────── */}
      <LiveReactions />
    </main>
  );
}
