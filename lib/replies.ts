import { supabase } from "./supabase";
import { Question, QuestionReply } from "./types";

interface RawQuestionRow {
  id: number;
  question: string;
  votes: number;
  created_at: string;
  answer?: string | null;
}

interface RawReplyRow {
  id: number;
  question_id: number;
  content: string;
  author: string;
  is_speaker: boolean;
  created_at: string;
}

/**
 * Loads all primary questions and their threaded replies from the Supabase database.
 * Queries `questions` table and `replies` table, grouping replies by question_id.
 */
export async function fetchQuestionsAndReplies(): Promise<Question[]> {
  // 1. Fetch questions from database
  const { data: questionsData, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .order("votes", { ascending: false });

  if (questionsError) {
    console.error("Error loading questions from database:", questionsError);
    return [];
  }

  const rawQuestions = (questionsData as RawQuestionRow[]) || [];
  const primaryQuestions: Question[] = [];
  const repliesByParentId: Record<number, QuestionReply[]> = {};

  // Separate primary questions from any legacy embedded replies
  for (const row of rawQuestions) {
    if (!row || !row.question) continue;

    if (row.question.startsWith("__REPLY__:")) {
      try {
        const parts = row.question.split(":");
        const parentId = parseInt(parts[1], 10);
        const isSpeaker = parts[2] === "SPEAKER";
        const author = parts[3] || (isSpeaker ? "Speaker" : "Attendee");
        const content = parts.slice(4).join(":");

        const reply: QuestionReply = {
          id: row.id,
          questionId: parentId,
          author,
          isSpeaker,
          content,
          createdAt: row.created_at || new Date().toISOString(),
        };

        if (!repliesByParentId[parentId]) {
          repliesByParentId[parentId] = [];
        }
        repliesByParentId[parentId].push(reply);
      } catch (err) {
        console.error("Error parsing embedded reply row:", err);
      }
    } else {
      primaryQuestions.push({
        id: row.id,
        question: row.question,
        votes: row.votes || 0,
        created_at: row.created_at,
        answer: row.answer,
        replies: [],
      });
    }
  }

  // 2. Fetch replies from dedicated `replies` table in Supabase
  try {
    const { data: repliesData, error: repliesError } = await supabase
      .from("replies")
      .select("*")
      .order("created_at", { ascending: true });

    if (!repliesError && repliesData) {
      const rows = repliesData as RawReplyRow[];
      for (const r of rows) {
        const replyItem: QuestionReply = {
          id: r.id,
          questionId: r.question_id,
          author: r.author || "Attendee",
          isSpeaker: Boolean(r.is_speaker),
          content: r.content,
          createdAt: r.created_at,
        };

        if (!repliesByParentId[r.question_id]) {
          repliesByParentId[r.question_id] = [];
        }
        // Avoid duplicate if already present
        if (!repliesByParentId[r.question_id].some((existing) => existing.id === r.id)) {
          repliesByParentId[r.question_id].push(replyItem);
        }
      }
    }
  } catch (err) {
    // If table doesn't exist yet, it will fall back to embedded replies
    console.warn("Notice: `replies` table lookup:", err);
  }

  // Attach grouped replies to primary questions
  for (const q of primaryQuestions) {
    const list = repliesByParentId[q.id] || [];
    list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    q.replies = list;
  }

  return primaryQuestions;
}

/**
 * Inserts a follow-up reply directly into the `replies` table in the Supabase database.
 * Falls back to storing in `questions` if the `replies` table hasn't been created yet.
 */
export async function submitReply({
  questionId,
  content,
  isSpeaker,
  author,
}: {
  questionId: number;
  content: string;
  isSpeaker: boolean;
  author: string;
}): Promise<{ success: boolean; source: "table" | "fallback" }> {
  const cleanAuthor = author.trim() || (isSpeaker ? "Speaker" : "Attendee");
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error("Reply content cannot be empty.");
  }

  // 1. Primary: Insert directly into the `replies` table in the database
  try {
    const { data, error } = await supabase
      .from("replies")
      .insert({
        question_id: questionId,
        content: cleanContent,
        author: cleanAuthor,
        is_speaker: isSpeaker,
      })
      .select();

    if (!error && data && data.length > 0) {
      return { success: true, source: "table" };
    }

    if (error && error.code !== "PGRST204" && !error.message.includes("does not exist")) {
      console.warn("Direct replies insert error:", error.message);
    }
  } catch (tableErr) {
    console.warn("Replies table insert exception:", tableErr);
  }

  // 2. Seamless fallback: If the `replies` table does not exist in the database yet,
  // save into `questions` table so the user's action never fails
  const encodedQuestion = `__REPLY__:${questionId}:${
    isSpeaker ? "SPEAKER" : "ATTENDEE"
  }:${cleanAuthor}:${cleanContent}`;

  const { error: fallbackError } = await supabase.from("questions").insert({
    question: encodedQuestion,
    answer: `__REPLY_TO__:${questionId}`,
    votes: 0,
  });

  if (fallbackError) {
    console.error("Database fallback error:", fallbackError);
    throw new Error(fallbackError.message);
  }

  return { success: true, source: "fallback" };
}
