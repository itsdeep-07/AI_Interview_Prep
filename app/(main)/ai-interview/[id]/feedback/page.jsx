"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getAIInterviewSession } from "@/actions/aiInterview";
import { Button } from "@/components/ui/button";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  ArrowRight,
  RotateCcw,
  Loader2,
  TrendingUp,
  Brain,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AIInterviewFeedbackPage({ params }) {
  const unwrappedParams = use(params);
  const interviewId = unwrappedParams.id;
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await getAIInterviewSession(interviewId);
        if (!data) {
          toast.error("Interview session not found");
          router.push("/ai-interview/setup");
          return;
        }
        setSession(data);
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load interview scorecard");
        setLoading(false);
      }
    }

    loadSession();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <Loader2 className="animate-spin text-amber-400 mb-4" size={36} />
        <p className="text-stone-400 text-sm font-light">Loading Evaluation Scorecard...</p>
      </div>
    );
  }

  const scorecard = session?.scorecard || {};
  const questions = Array.isArray(session?.questions) ? session.questions : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-28">
      {/* Header Badge */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-4">
          <Award size={14} />
          <span>AI Performance Evaluation Report</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-white tracking-tight">
          Interview <span className="text-amber-400">Scorecard</span>
        </h1>
        <p className="text-stone-400 text-sm mt-2 font-light">
          {session.role} @ {session.targetCompany}
        </p>
      </div>

      {/* Main Score & Metrics Hero Card */}
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-xl shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 text-center sm:text-left">
          <div>
            <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">
              Overall Score
            </span>
            <div className="flex items-baseline gap-2 justify-center sm:justify-start mt-1">
              <span className="text-5xl font-serif font-bold text-amber-400">
                {scorecard.overallScore ?? "8.0"}
              </span>
              <span className="text-stone-500 text-lg">/ 10</span>
            </div>
            <div className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium">
              Readiness: {scorecard.faangReadiness ?? "Strong Candidate"}
            </div>
          </div>

          {/* Sub-Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 w-full sm:w-auto">
            <div className="bg-stone-900/60 border border-white/5 rounded-xl p-4 text-center">
              <Brain size={18} className="text-amber-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {scorecard.technicalScore ?? "8.0"}
              </div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
                Technical
              </div>
            </div>

            <div className="bg-stone-900/60 border border-white/5 rounded-xl p-4 text-center">
              <MessageCircle size={18} className="text-amber-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {scorecard.communicationScore ?? "8.5"}
              </div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
                Communication
              </div>
            </div>

            <div className="bg-stone-900/60 border border-white/5 rounded-xl p-4 text-center">
              <TrendingUp size={18} className="text-amber-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {scorecard.problemSolvingScore ?? "8.0"}
              </div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
                Problem Solving
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} />
            AI Executive Summary
          </h2>
          <p className="text-stone-300 text-sm leading-relaxed font-light bg-stone-900/40 p-4 rounded-xl border border-white/5">
            {scorecard.summary || "You demonstrated solid technical and communication skills during the session."}
          </p>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5 space-y-3">
            <h3 className="text-emerald-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <CheckCircle2 size={16} />
              Key Strengths
            </h3>
            <ul className="space-y-2">
              {(scorecard.strengths || ["Clear communication", "Good technical approach"]).map(
                (item, idx) => (
                  <li key={idx} className="text-xs text-emerald-200/90 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5 space-y-3">
            <h3 className="text-amber-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <AlertCircle size={16} />
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {(scorecard.improvements || ["Explore system edge cases", "State assumptions early"]).map(
                (item, idx) => (
                  <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Key Action Recommendation */}
        {scorecard.keyRecommendation && (
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                Actionable Recommendation
              </div>
              <p className="text-xs text-stone-300 font-light mt-1">
                {scorecard.keyRecommendation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Question-by-Question Breakdown */}
      <div className="space-y-6 mb-12">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <Bot size={20} className="text-amber-400" />
          Question Breakdown & Feedback
        </h2>

        <div className="space-y-4">
          {questions
            .filter((q) => q.answer)
            .map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-[#0f0f11] border border-white/10 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400 font-bold">
                    Question {idx + 1}
                  </span>
                  {q.rating && (
                    <span className="bg-amber-400/10 px-2 py-0.5 rounded text-amber-300 font-bold text-[11px]">
                      Score: {q.rating}/10
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-white">{q.question}</p>
                <div className="bg-stone-900/60 p-3 rounded-lg text-xs text-stone-300 font-light italic">
                  "{q.answer}"
                </div>

                {q.feedback && (
                  <p className="text-xs text-amber-300/90 flex items-start gap-2 pt-1">
                    <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{q.feedback}</span>
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="gold" size="lg" asChild className="w-full sm:w-auto font-semibold">
          <Link href="/ai-interview/setup" className="flex items-center gap-2">
            <RotateCcw size={16} />
            <span>Practice Another Interview</span>
          </Link>
        </Button>

        <Button variant="outline" size="lg" asChild className="w-full sm:w-auto text-stone-300">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span>Back to Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
