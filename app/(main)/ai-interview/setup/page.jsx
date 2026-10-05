"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { startAIInterviewSession } from "@/actions/aiInterview";
import { Sparkles, Bot, Briefcase, Building, FileText, Code2, Users2, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AIInterviewSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    role: "",
    targetCompany: "",
    jobDescription: "",
    resumeText: "",
    interviewType: "MIXED",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeSelect = (type) => {
    setForm({ ...form, interviewType: type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role.trim()) {
      toast.error("Please enter a target role");
      return;
    }

    setLoading(true);
    try {
      const res = await startAIInterviewSession(form);
      if (res.success) {
        toast.success("AI Interviewer initialized!");
        router.push(`/ai-interview/${res.interviewId}`);
      }
    } catch (err) {
      console.error("AI Interview setup error:", err);
      toast.error(err.message || "Failed to start AI interview");
      setLoading(false);
    }
  };

  const prefillSample = () => {
    setForm({
      role: "Fullstack React Developer",
      targetCompany: "Google",
      jobDescription:
        "Looking for a Fullstack Engineer proficient in React, Next.js, Node.js, TypeScript, and PostgreSQL. Experience with scalable APIs and real-time state management required.",
      resumeText:
        "Fullstack developer with 3 years of experience building modern web apps with React, Next.js, and Node.js. Built scalable REST & GraphQL APIs, integrated PostgreSQL databases, and optimized frontend performance.",
      interviewType: "MIXED",
    });
    toast.info("Sample interview context loaded!");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-28">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-4">
          <Sparkles size={14} className="animate-pulse" />
          <span>AI Practice Studio · 24/7 Voice & Text</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-white">
          Practice Interview with <span className="text-amber-400">AI</span>
        </h1>
        <p className="text-stone-400 text-sm mt-3 max-w-xl mx-auto font-light">
          Tailored 1-on-1 interview practice based on your resume and target role. The AI will ask real-time questions, analyze your answers, and provide voice & text feedback.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[#0f0f11] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Bot className="text-amber-400" size={20} />
            Configure Your AI Interviewer
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={prefillSample}
            className="text-stone-400 hover:text-amber-400 text-xs"
          >
            Pre-fill Sample Data ✨
          </Button>
        </div>

        {/* Role & Company Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Briefcase size={14} className="text-amber-400" />
              Target Role *
            </label>
            <Input
              name="role"
              placeholder="e.g. Senior Frontend Engineer, DevOps Architect"
              value={form.role}
              onChange={handleChange}
              className="bg-stone-900/60 border-white/10 text-white placeholder:text-stone-600 focus:border-amber-400/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Building size={14} className="text-amber-400" />
              Target Company (Optional)
            </label>
            <Input
              name="targetCompany"
              placeholder="e.g. Google, Meta, Early-stage Startup"
              value={form.targetCompany}
              onChange={handleChange}
              className="bg-stone-900/60 border-white/10 text-white placeholder:text-stone-600 focus:border-amber-400/50"
            />
          </div>
        </div>

        {/* Interview Type Selector */}
        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Layers size={14} className="text-amber-400" />
            Interview Focus
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                type: "MIXED",
                title: "Mixed Interview",
                desc: "Balanced technical & behavioral questions",
                icon: Layers,
              },
              {
                type: "TECHNICAL",
                title: "Technical & Coding",
                desc: "System design, algorithm & architecture focus",
                icon: Code2,
              },
              {
                type: "BEHAVIORAL",
                title: "Behavioral & Leadership",
                desc: "STAR method, soft skills & scenario questions",
                icon: Users2,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = form.interviewType === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => handleTypeSelect(item.type)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
                    isSelected
                      ? "bg-amber-400/10 border-amber-400/50 text-white shadow-[0_0_20px_rgba(251,191,36,0.1)]"
                      : "bg-stone-900/40 border-white/5 text-stone-400 hover:border-white/20 hover:text-stone-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={18} className={isSelected ? "text-amber-400" : "text-stone-500"} />
                    <span className="text-sm font-medium text-white">{item.title}</span>
                  </div>
                  <p className="text-xs font-light text-stone-500 leading-normal">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Job Description Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <FileText size={14} className="text-amber-400" />
            Job Description (Optional)
          </label>
          <Textarea
            name="jobDescription"
            placeholder="Paste the target job description or requirements here..."
            rows={3}
            value={form.jobDescription}
            onChange={handleChange}
            className="bg-stone-900/60 border-white/10 text-white placeholder:text-stone-600 focus:border-amber-400/50 text-sm resize-none"
          />
        </div>

        {/* Resume Text Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <FileText size={14} className="text-amber-400" />
            Your Resume / Summary (Optional)
          </label>
          <Textarea
            name="resumeText"
            placeholder="Paste key sections of your resume (experience, projects, skills)..."
            rows={4}
            value={form.resumeText}
            onChange={handleChange}
            className="bg-stone-900/60 border-white/10 text-white placeholder:text-stone-600 focus:border-amber-400/50 text-sm resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-semibold py-6 rounded-xl text-base shadow-[0_0_25px_rgba(251,191,36,0.25)] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Initializing AI Interviewer...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Start AI Interview Session →</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
