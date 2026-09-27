"use client";

import { useState } from "react";

export default function Pollcard() {
  const [votes, setVotes] = useState([0, 0, 0, 0]);
  const [voted, setVoted] = useState(false);

  const options = [
    "Java",
    "Python",
    "C++",
    "JavaScript",
  ];

  const handleVote = (index: number) => {
    if (voted) return;

    const updatedVotes = [...votes];
    updatedVotes[index]++;

    setVotes(updatedVotes);
    setVoted(true);
  };

  const totalVotes = votes.reduce((a, b) => a + b, 0);

  return (
    <div className="border rounded-xl p-5 bg-white">
      <h2 className="font-bold text-lg mb-4">
        Which programming language do you prefer?
      </h2>

      {options.map((option, index) => {
        const percentage =
          totalVotes === 0
            ? 0
            : Math.round((votes[index] / totalVotes) * 100);

        return (
          <button
            key={index}
            onClick={() => handleVote(index)}
            disabled={voted}
            className="w-full text-left border rounded-lg p-3 mb-3 hover:bg-gray-50"
          >
            <div className="flex justify-between">
              <span>{option}</span>
              <span>{percentage}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded mt-2">
              <div
                className="bg-blue-600 h-2 rounded"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </button>
        );
      })}

      <p className="text-sm text-gray-500 mt-2">
        Total Votes: {totalVotes}
      </p>
    </div>
  );
}