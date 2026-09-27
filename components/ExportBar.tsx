"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { exportToPDF } from "@/lib/pdf";

interface ExportBarProps {
  questions: Question[];
}

export default function ExportBar({ questions }: ExportBarProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = () => {
    if (questions.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportToPDF(questions);
    } catch (err) {
      console.error("Export PDF failed:", err);
    } finally {
      setTimeout(() => setExporting(false), 600);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={questions.length === 0 || exporting}
      title="Download comprehensive PDF summary document of all questions, answers, and threaded replies"
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs hover:border-gray-400 disabled:opacity-50 transition-all cursor-pointer select-none active:scale-95"
    >
      <span className="text-sm">📄</span>
      <span>{exporting ? "Generating PDF..." : "Export as PDF"}</span>
    </button>
  );
}
