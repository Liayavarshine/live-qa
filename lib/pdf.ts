import { jsPDF } from "jspdf";
import { Question } from "./types";

/**
 * Generates and downloads a clean, professional PDF summary document
 * containing all questions, vote counts, AI answers, and threaded discussion replies.
 */
export function exportToPDF(questions: Question[]): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to ensure enough vertical space or trigger page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
    }
  };

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(23, 23, 23);
  doc.text("Live Q&A Event Summary Report", margin, y);
  y += 8;

  // Metadata Subtitle
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${dateStr}`, margin, y);
  y += 7;

  // KPI Statistics Bar
  const totalQuestions = questions.length;
  const totalVotes = questions.reduce((acc, q) => acc + (q.votes || 0), 0);
  const totalReplies = questions.reduce(
    (acc, q) => acc + (q.replies?.length || 0),
    0
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const statsText = `Total Questions: ${totalQuestions}    |    Total Upvotes: ${totalVotes}    |    Total Follow-up Replies: ${totalReplies}`;
  doc.text(statsText, margin + 4, y + 9);
  y += 20;

  // ── Top Most-Voted Questions Highlights ────────────────────────────────────
  const topQuestions = [...questions]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 3);

  if (topQuestions.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Top Most-Voted Questions", margin, y);
    y += 6;

    topQuestions.forEach((q, idx) => {
      const qText = `${idx + 1}. [${q.votes || 0} votes] ${q.question}`;
      const lines = doc.splitTextToSize(qText, contentWidth - 4);
      checkPageBreak(lines.length * 5 + 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(37, 99, 235);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.8 + 2;
    });

    y += 4;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── Full Question List & Discussion Threads ───────────────────────────────
  checkPageBreak(15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("Questions & Discussion Transcripts", margin, y);
  y += 8;

  if (questions.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("No questions recorded for this session.", margin, y);
    y += 10;
  } else {
    questions.forEach((q, index) => {
      // Question Title & Votes
      const titlePrefix = `Q${index + 1} (${q.votes || 0} votes): `;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);

      const fullQText = `${titlePrefix}${q.question}`;
      const qLines = doc.splitTextToSize(fullQText, contentWidth);
      checkPageBreak(qLines.length * 5 + 10);

      doc.text(qLines, margin, y);
      y += qLines.length * 5 + 2;

      // AI Answer
      if (q.answer) {
        const answerLines = doc.splitTextToSize(
          `AI Answer: ${q.answer}`,
          contentWidth - 8
        );
        const boxHeight = answerLines.length * 4.5 + 4;
        checkPageBreak(boxHeight + 4);

        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(margin + 2, y, contentWidth - 4, boxHeight, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(22, 101, 52);
        doc.text(answerLines, margin + 5, y + 4.5);
        y += boxHeight + 3;
      }

      // Threaded Discussion Replies
      const replies = q.replies || [];
      if (replies.length > 0) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Replies (${replies.length}):`, margin + 4, y);
        y += 4;

        replies.forEach((r) => {
          const roleTag = r.isSpeaker ? "[Speaker]" : "[Attendee]";
          const replyHeader = `• ${roleTag} ${r.author}: `;
          const fullReply = `${replyHeader}${r.content}`;
          const rLines = doc.splitTextToSize(fullReply, contentWidth - 10);
          checkPageBreak(rLines.length * 4 + 2);

          doc.setFont("helvetica", r.isSpeaker ? "bold" : "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(r.isSpeaker ? 107 : 51, r.isSpeaker ? 33 : 65, r.isSpeaker ? 168 : 85);
          doc.text(rLines, margin + 6, y);
          y += rLines.length * 4 + 1.5;
        });
        y += 2;
      }

      // Separator between questions
      checkPageBreak(6);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    });
  }

  // ── Footer with Page Numbers on all pages ──────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    const footerText = `Live Q&A Summary  •  Page ${i} of ${totalPages}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  // Save the PDF
  const filenameDate = new Date().toISOString().split("T")[0];
  doc.save(`live-qa-summary-${filenameDate}.pdf`);
}
