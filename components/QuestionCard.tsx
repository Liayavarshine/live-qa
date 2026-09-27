"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Question } from "@/lib/types";
import { submitReply } from "@/lib/replies";

interface QuestionCardProps {
  question: Question;
  onRefresh?: () => void;
}

export default function QuestionCard({ question, onRefresh }: QuestionCardProps) {
  // Track whether the current user has already voted on this question
  const [hasVoted, setHasVoted] = useState(false);

  // Threading / Replies state
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  const replies = question.replies || [];
  const replyCount = replies.length;

  // On mount, check localStorage for a vote record keyed by question id
  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window !== "undefined") {
        const voted = localStorage.getItem(`voted_${question.id}`);
        if (voted === "true") {
          setHasVoted(true);
        }
      }
    });
  }, [question.id]);

  const handleVote = async () => {
    if (hasVoted) return;

    localStorage.setItem(`voted_${question.id}`, "true");
    setHasVoted(true);

    const { error } = await supabase
      .from("questions")
      .update({
        votes: (question.votes || 0) + 1,
      })
      .eq("id", question.id);

    if (error) {
      console.error("Vote error:", error);
      localStorage.removeItem(`voted_${question.id}`);
      setHasVoted(false);
    }
  };

  const handleAddReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    setReplyError("");

    try {
      await submitReply({
        questionId: question.id,
        content: replyText.trim(),
        isSpeaker,
        author: authorName.trim() || (isSpeaker ? "Speaker" : "Attendee"),
      });

      setReplyText("");
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error("Failed to post reply:", err);
      const message =
        err instanceof Error ? err.message : "Failed to submit comment. Please try again.";
      setReplyError(message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl mb-3 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden">
      {/* ── Main Question Row ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {/* Upvote button */}
        <button
          onClick={handleVote}
          disabled={hasVoted}
          title={hasVoted ? "Already voted" : "Upvote this question"}
          className={`flex flex-col items-center min-w-[50px] px-2.5 py-2 rounded-xl border transition-all select-none
            ${
              hasVoted
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-50/80 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-400 cursor-pointer active:scale-95"
            }`}
        >
          <span className="text-base leading-none">▲</span>
          <span className="text-sm font-bold leading-none mt-1">
            {question.votes || 0}
          </span>
          {hasVoted && (
            <span className="text-[9px] font-medium leading-tight mt-1 text-gray-400">
              Voted
            </span>
          )}
        </button>

        {/* Question content & AI Answer */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-base leading-snug">
            {question.question}
          </p>

          {/* AI answer if available */}
          <div className="mt-2.5">
            {question.answer ? (
              <div className="text-emerald-900 bg-emerald-50/90 border border-emerald-100 p-3 rounded-xl text-sm leading-relaxed flex items-start gap-2">
                <span className="text-base leading-none select-none">🤖</span>
                <div className="flex-1">
                  <span className="font-semibold text-emerald-800 text-xs block mb-0.5">
                    AI Summary Answer
                  </span>
                  <p className="text-emerald-950">{question.answer}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-xs flex items-center gap-1.5 mt-1">
                <span>⏳</span> Waiting for AI answer...
              </p>
            )}
          </div>

          {/* Bottom Toolbar: Thread Toggle & Metadata */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span className="text-gray-400">
              Asked {formatTimestamp(question.created_at)}
            </span>

            {/* Replies / Thread Button */}
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 transition-all cursor-pointer"
            >
              <span>💬</span>
              <span>
                {replyCount > 0
                  ? `${replyCount} ${replyCount === 1 ? "Reply" : "Replies"}`
                  : "Reply / Follow-up"}
              </span>
              <span className="text-gray-400 text-[10px]">
                {showReplies ? "▲" : "▼"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Threaded Replies Section ─────────────────────────────────── */}
      {showReplies && (
        <div className="bg-slate-50/70 border-t border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Discussion Thread & Follow-ups ({replyCount})
            </h4>
            <span className="text-[11px] text-gray-400">
              Avoid duplicate questions by commenting here
            </span>
          </div>

          {/* Replies list */}
          {replyCount > 0 ? (
            <div className="space-y-2.5 mb-4">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    reply.isSpeaker
                      ? "bg-purple-50/70 border-purple-200 shadow-xs"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-xs">
                        {reply.author}
                      </span>
                      {reply.isSpeaker ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          🎙️ Speaker
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-gray-500 bg-gray-100">
                          Attendee
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {formatTimestamp(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic mb-4">
              No follow-ups yet. Be the first to comment or clarify!
            </p>
          )}

          {/* Reply Input Form */}
          <form onSubmit={handleAddReply} className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder={isSpeaker ? "Speaker Name" : "Your Name (Optional)"}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
              />

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 font-medium select-none bg-white px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={isSpeaker}
                  onChange={(e) => setIsSpeaker(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>🎙️ Post as Speaker / Host</span>
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a follow-up comment or speaker answer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddReply();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <button
                type="submit"
                disabled={!replyText.trim() || isSubmittingReply}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmittingReply ? "Posting..." : "Reply"}
              </button>
            </div>

            {replyError && (
              <p className="text-xs text-red-600 font-medium">{replyError}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
