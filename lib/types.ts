export interface QuestionReply {
  id: string | number;
  questionId: number;
  author: string;
  isSpeaker: boolean;
  content: string;
  createdAt: string;
}

export interface Question {
  id: number;
  question: string;
  votes: number;
  created_at: string;
  answer?: string | null;
  replies?: QuestionReply[];
}

export interface FloatingEmojiItem {
  id: string;
  emoji: string;
  x: number; // percentage horizontally (0 - 100)
  size: number; // px
  duration: number; // seconds
  drift: number; // horizontal drift px
}
