"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { FloatingEmojiItem } from "@/lib/types";

const EMOJIS = [
  { emoji: "👏", label: "Clap" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "💡", label: "Idea" },
];

export default function LiveReactions() {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiItem[]>([]);
  const [reactionTimestamps, setReactionTimestamps] = useState<number[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Spawn a floating emoji on screen
  const spawnEmoji = useCallback((emoji: string, originXPercent?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const randomOffset = (Math.random() - 0.5) * 12;
    const x =
      typeof originXPercent === "number"
        ? Math.max(10, Math.min(90, originXPercent + randomOffset))
        : 80 + (Math.random() - 0.5) * 15;
    const drift = (Math.random() - 0.5) * 120;
    const size = 32 + Math.floor(Math.random() * 16);
    const duration = 2.4 + Math.random() * 0.8;

    const newItem: FloatingEmojiItem = {
      id,
      emoji,
      x,
      size,
      duration,
      drift,
    };

    setFloatingEmojis((prev) => [...prev.slice(-30), newItem]);

    // Record timestamp for energy meter
    setReactionTimestamps((prev) => [
      ...prev.filter((t) => Date.now() - t < 10000),
      Date.now(),
    ]);

    // Cleanup after animation completes
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, duration * 1000 + 100);
  }, []);

  // Subscribe to real-time broadcast channel
  useEffect(() => {
    const channel = supabase.channel("live-qa-reactions", {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        if (payload?.emoji) {
          spawnEmoji(payload.emoji, payload.x);
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Periodic cleanup of older energy timestamps
    const interval = setInterval(() => {
      setReactionTimestamps((prev) => prev.filter((t) => Date.now() - t < 10000));
    }, 2000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [spawnEmoji]);

  // Handle clicking an emoji
  const handleEmojiClick = (emoji: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((rect.left + rect.width / 2) / window.innerWidth) * 100;

    spawnEmoji(emoji, xPercent);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "reaction",
        payload: { emoji, x: xPercent },
      });
    }
  };

  const recentCount = reactionTimestamps.length;
  let energyLabel = "🌱 Calm";
  let energyColor = "bg-gray-100 text-gray-600";
  if (recentCount >= 18) {
    energyLabel = "🔥 Hyped!";
    energyColor = "bg-red-100 text-red-700 animate-pulse font-bold";
  } else if (recentCount >= 8) {
    energyLabel = "⚡ Active";
    energyColor = "bg-amber-100 text-amber-700 font-semibold";
  } else if (recentCount >= 3) {
    energyLabel = "✨ Lively";
    energyColor = "bg-blue-100 text-blue-700";
  }

  return (
    <>
      {/* ── Floating Emojis Overlay ────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        aria-hidden="true"
      >
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-16 animate-float-up select-none pointer-events-none"
            style={
              {
                left: `${item.x}%`,
                fontSize: `${item.size}px`,
                animationDuration: `${item.duration}s`,
                "--drift": `${item.drift}px`,
              } as React.CSSProperties
            }
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* ── Fixed Bottom Reaction Bar ──────────────────────────────────── */}
      <aside
        aria-label="Audience Live Reactions"
        className="fixed bottom-5 right-4 sm:right-8 z-40 flex flex-col items-end gap-1.5"
      >
        <div
          className={`text-xs px-2.5 py-1 rounded-full shadow-sm border border-black/5 flex items-center gap-1.5 transition-all duration-300 backdrop-blur-md ${energyColor}`}
          title="Live audience energy calculated from reactions in the last 10 seconds"
        >
          <span>Audience Energy:</span>
          <span>{energyLabel}</span>
          {recentCount > 0 && (
            <span className="text-[11px] opacity-75 font-mono">
              ({recentCount})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all">
          {EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={(e) => handleEmojiClick(emoji, e)}
              title={`Send ${label}`}
              className="w-11 h-11 flex items-center justify-center text-2xl rounded-xl hover:bg-gray-100/90 active:scale-125 hover:scale-110 transition-all duration-150 cursor-pointer"
              aria-label={`Send ${label} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
