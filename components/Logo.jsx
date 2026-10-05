import React from "react";

export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Badge */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 via-stone-900 to-amber-500/10 border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)] group hover:border-amber-400/50 transition-all duration-300">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-amber-400 transform group-hover:scale-105 transition-transform duration-300"
        >
          {/* Graduation Cap / Mortarboard Accent */}
          <path
            d="M12 3L2 8L12 13L22 8L12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 9.5V16C5 17.5 8 19 12 19C16 19 19 17.5 19 16V9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Tassel */}
          <path
            d="M20 9V14"
            stroke="#f59e0b"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* AI Sparkle */}
          <circle cx="12" cy="11.5" r="1.5" fill="#fbbf24" className="animate-pulse" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="font-serif text-xl tracking-tight leading-none text-white font-medium">
          Prep<span className="text-amber-400 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Buddy</span>
        </span>
        <span className="text-[10px] tracking-widest uppercase font-mono text-stone-500 mt-0.5">
          AI Interview Marketplace
        </span>
      </div>
    </div>
  );
}
